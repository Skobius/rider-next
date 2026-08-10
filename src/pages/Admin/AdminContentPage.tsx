import { ArrowLeft, CheckCircle2, Database, Edit3, Save } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { appCategories } from '../../data/categories';
import { getRegionLabel, regions } from '../../data/regions';
import { useUserRoles } from '../../shared/auth/useUserRoles';
import { notifyBackendContentUpdated } from '../../shared/content/backendContent';
import { getLocalizedText } from '../../shared/i18n/localizedText';
import { supabase } from '../../shared/supabase/client';

type ContentTable = 'places' | 'routes' | 'events' | 'guides' | 'exercises' | 'categories' | 'regions' | 'rider_tasks' | 'service_definitions' | 'freshness_policies';
type ContentStatus = 'draft' | 'published' | 'archived';
type VerificationStatus = 'verified_mg67' | 'confirmed' | 'community' | 'pending';
type BusinessStatus = 'unknown' | 'open' | 'temporarily_closed' | 'closed';

interface ContentRow {
  id: string;
  table: ContentTable;
  region_id: string;
  status: ContentStatus;
  title: string;
  description: string;
  rawTitle: Record<string, string>;
  rawDescription: Record<string, string>;
  raw: Record<string, unknown>;
  updated_at?: string;
}

interface PlaceEditorState {
  name: string;
  shortDescription: string;
  fullDescription: string;
  categoryId: string;
  regionId: string;
  status: ContentStatus;
  verificationStatus: VerificationStatus;
  businessStatus: BusinessStatus;
  informationCheckedAt: string;
  address: string;
  phone: string;
  website: string;
  schedule: string;
  lng: string;
  lat: string;
  mapUrl: string;
  image: string;
  coverImage: string;
  tags: string;
  mapVisibility: boolean;
}

const contentTypes: Array<{ id: ContentTable; title: string; titleColumn: string; descriptionColumn?: string }> = [
  { id: 'places', title: 'Места', titleColumn: 'name', descriptionColumn: 'short_description' },
  { id: 'routes', title: 'Маршруты', titleColumn: 'title', descriptionColumn: 'description' },
  { id: 'events', title: 'События', titleColumn: 'title', descriptionColumn: 'description' },
  { id: 'guides', title: 'Гайды', titleColumn: 'title', descriptionColumn: 'short_description' },
  { id: 'exercises', title: 'Упражнения', titleColumn: 'title', descriptionColumn: 'description' },
  { id: 'categories', title: 'Категории', titleColumn: 'title', descriptionColumn: 'description' },
  { id: 'regions', title: 'Регионы', titleColumn: 'title' },
  { id: 'rider_tasks', title: 'Задачи', titleColumn: 'title', descriptionColumn: 'short_description' },
  { id: 'service_definitions', title: 'Услуги', titleColumn: 'title', descriptionColumn: 'description' },
  { id: 'freshness_policies', title: 'Свежесть', titleColumn: 'title' },
];

const placeCategories = appCategories.filter((category) => category.sectionId === 'places');

const contentStatusLabels: Record<ContentStatus, string> = {
  draft: 'Черновик',
  published: 'Опубликовано',
  archived: 'Архив',
};

const verificationStatusLabels: Record<VerificationStatus, string> = {
  verified_mg67: 'Проверено MG67',
  confirmed: 'Информация подтверждена',
  community: 'Подтверждено сообществом',
  pending: 'Требует проверки',
};

const businessStatusLabels: Record<BusinessStatus, string> = {
  unknown: 'Не указан',
  open: 'Работает',
  temporarily_closed: 'Временно закрыто',
  closed: 'Закрыто',
};

const emptyPlaceForm: PlaceEditorState = {
  name: '',
  shortDescription: '',
  fullDescription: '',
  categoryId: 'places-services',
  regionId: 'smolensk-oblast',
  status: 'published',
  verificationStatus: 'pending',
  businessStatus: 'unknown',
  informationCheckedAt: '',
  address: '',
  phone: '',
  website: '',
  schedule: '',
  lng: '',
  lat: '',
  mapUrl: '',
  image: '',
  coverImage: '',
  tags: '',
  mapVisibility: true,
};

function localized(value: unknown) {
  if (value && typeof value === 'object' && 'ru' in value) return value as Record<string, string>;
  return { ru: '' };
}

function toRow(table: ContentTable, titleColumn: string, descriptionColumn: string, row: Record<string, unknown>): ContentRow {
  const rawTitle = localized(row[titleColumn]);
  const rawDescription = descriptionColumn ? localized(row[descriptionColumn]) : { ru: '' };

  return {
    id: String(row.id),
    table,
    region_id: String(row.region_id ?? 'smolensk-oblast'),
    status: String(row.status ?? 'draft') as ContentStatus,
    title: rawTitle.ru ?? '',
    description: rawDescription.ru ?? '',
    rawTitle,
    rawDescription,
    raw: row,
    updated_at: row.updated_at ? String(row.updated_at) : undefined,
  };
}

function firstArrayItem(value: unknown): Record<string, unknown> {
  return Array.isArray(value) && value[0] && typeof value[0] === 'object' ? value[0] as Record<string, unknown> : {};
}

function getContactValue(contacts: unknown, type: string) {
  if (!Array.isArray(contacts)) return '';
  const contact = contacts.find((item) => item && typeof item === 'object' && (item as Record<string, unknown>).type === type) as Record<string, unknown> | undefined;
  return String(contact?.url ?? contact?.value ?? '');
}

function placeFormFromRow(row: ContentRow): PlaceEditorState {
  const raw = row.raw;
  const branch = firstArrayItem(raw.branches);
  const coordinates = Array.isArray(raw.coordinates) ? raw.coordinates : [];
  const branchCoordinates = branch.coordinates && typeof branch.coordinates === 'object' ? branch.coordinates as Record<string, unknown> : {};

  return {
    ...emptyPlaceForm,
    name: localized(raw.name).ru ?? row.title,
    shortDescription: localized(raw.short_description).ru ?? row.description,
    fullDescription: localized(raw.full_description).ru ?? '',
    categoryId: String(raw.category_id ?? emptyPlaceForm.categoryId),
    regionId: String(raw.region_id ?? emptyPlaceForm.regionId),
    status: row.status,
    verificationStatus: String(raw.verification_status ?? 'pending') as VerificationStatus,
    businessStatus: String(raw.business_status ?? 'unknown') as BusinessStatus,
    informationCheckedAt: raw.information_checked_at ? String(raw.information_checked_at) : '',
    address: localized(branch.address).ru ?? '',
    phone: String(branch.phone ?? getContactValue(raw.contacts, 'phone')),
    website: getContactValue(raw.contacts, 'website'),
    schedule: localized(branch.schedule).ru ?? '',
    lng: coordinates[0] != null ? String(coordinates[0]) : branchCoordinates.lng != null ? String(branchCoordinates.lng) : '',
    lat: coordinates[1] != null ? String(coordinates[1]) : branchCoordinates.lat != null ? String(branchCoordinates.lat) : '',
    mapUrl: String(raw.map_url ?? branch.mapUrl ?? ''),
    image: String(raw.image ?? ''),
    coverImage: String(raw.cover_image ?? ''),
    tags: Array.isArray(raw.tags) ? raw.tags.join(', ') : '',
    mapVisibility: raw.map_visibility !== false,
  };
}

function splitTags(value: string) {
  return value.split(',').map((tag) => tag.trim()).filter(Boolean);
}

function getCategoryLabel(id: string) {
  const category = appCategories.find((item) => item.id === id);
  return category ? getLocalizedText(category.title, 'ru') : id;
}

function getContentStatusLabel(status: string) {
  return contentStatusLabels[status as ContentStatus] ?? status;
}

function getPlaceFormSnapshot(form: PlaceEditorState) {
  return JSON.stringify(form);
}

function getErrorMessage(error: unknown) {
  if (!error || typeof error !== 'object') return 'Не удалось сохранить изменения. Проверьте подключение и попробуйте ещё раз.';
  const message = 'message' in error ? String((error as { message?: unknown }).message ?? '') : '';
  if (message.includes('permission') || message.includes('role')) return 'Недостаточно прав для сохранения этой карточки.';
  if (message.includes('region')) return 'Нет прав на редактирование этого региона.';
  if (message.includes('invalid') || message.includes('constraint')) return 'Проверьте заполнение полей: часть данных не прошла проверку.';
  return message ? `Не удалось сохранить: ${message}` : 'Не удалось сохранить изменения. Проверьте подключение и попробуйте ещё раз.';
}

function buildContacts(form: PlaceEditorState) {
  const contacts: Array<Record<string, string>> = [];
  if (form.phone.trim()) contacts.push({ type: 'phone', value: form.phone.trim() });
  if (form.website.trim()) {
    const website = form.website.trim();
    contacts.push({ type: 'website', value: website.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, ''), url: website });
  }
  return contacts;
}

function buildBranches(form: PlaceEditorState, selected: ContentRow) {
  const sourceBranch = firstArrayItem(selected.raw.branches);
  const lat = Number(form.lat);
  const lng = Number(form.lng);
  return [{
    ...sourceBranch,
    id: String(sourceBranch.id ?? 'main'),
    address: { ...localized(sourceBranch.address), ru: form.address.trim() },
    phone: form.phone.trim() || undefined,
    schedule: { ...localized(sourceBranch.schedule), ru: form.schedule.trim() },
    coordinates: Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : undefined,
    mapUrl: form.mapUrl.trim() || undefined,
  }];
}

export function AdminContentPage() {
  const { user, loading, isAdmin } = useUserRoles();
  const [table, setTable] = useState<ContentTable>('places');
  const [items, setItems] = useState<ContentRow[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [query, setQuery] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ContentStatus>('published');
  const [placeForm, setPlaceForm] = useState<PlaceEditorState>(emptyPlaceForm);
  const [savedPlaceSnapshot, setSavedPlaceSnapshot] = useState(getPlaceFormSnapshot(emptyPlaceForm));
  const [mobileEditorOpen, setMobileEditorOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const meta = contentTypes.find((item) => item.id === table)!;
  const selected = items.find((item) => item.id === selectedId);
  const hasUnsavedPlaceChanges = table === 'places' && selected?.table === 'places' && getPlaceFormSnapshot(placeForm) !== savedPlaceSnapshot;
  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((item) => `${item.title} ${item.description} ${item.id}`.toLowerCase().includes(normalized));
  }, [items, query]);

  async function loadItems() {
    if (!supabase || !user || !isAdmin) return;
    setBusy(true);
    const { data, error: loadError } = await supabase
      .from(table)
      .select('*')
      .order('updated_at', { ascending: false });
    if (loadError) {
      setError('Не удалось загрузить контент.');
      setItems([]);
    } else {
      setItems((data ?? []).map((row) => toRow(table, meta.titleColumn, meta.descriptionColumn ?? '', row as Record<string, unknown>)));
    }
    setBusy(false);
  }

  useEffect(() => {
    setSelectedId('');
    setMobileEditorOpen(false);
    setNotice('');
    setError('');
    void loadItems();
  }, [table, user, isAdmin]);

  useEffect(() => {
    if (!selected) return;
    setTitle(selected.title);
    setDescription(selected.description);
    setStatus(selected.status);
    if (selected.table === 'places') {
      const nextForm = placeFormFromRow(selected);
      setPlaceForm(nextForm);
      setSavedPlaceSnapshot(getPlaceFormSnapshot(nextForm));
    }
  }, [selected]);

  useEffect(() => {
    if (!hasUnsavedPlaceChanges) return undefined;
    const preventUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', preventUnload);
    return () => window.removeEventListener('beforeunload', preventUnload);
  }, [hasUnsavedPlaceChanges]);

  function updatePlaceField<Key extends keyof PlaceEditorState>(key: Key, value: PlaceEditorState[Key]) {
    setPlaceForm((current) => ({ ...current, [key]: value }));
  }

  async function submitPlace(selectedPlace: ContentRow) {
    const lat = Number(placeForm.lat);
    const lng = Number(placeForm.lng);
    const hasCoordinates = placeForm.lat.trim() || placeForm.lng.trim();
    const patch = {
      name: placeForm.name.trim(),
      short_description: placeForm.shortDescription.trim(),
      full_description: placeForm.fullDescription.trim(),
      category_id: placeForm.categoryId,
      region_id: placeForm.regionId,
      status: placeForm.status,
      verification_status: placeForm.verificationStatus,
      business_status: placeForm.businessStatus,
      information_checked_at: placeForm.informationCheckedAt.trim() || null,
      image: placeForm.image.trim() || null,
      cover_image: placeForm.coverImage.trim() || null,
      coordinates: hasCoordinates && Number.isFinite(lat) && Number.isFinite(lng) ? [lng, lat] : null,
      map_visibility: placeForm.mapVisibility,
      map_url: placeForm.mapUrl.trim() || null,
      branches: buildBranches(placeForm, selectedPlace),
      contacts: buildContacts(placeForm),
      tags: splitTags(placeForm.tags),
    };

    const { error: updateError } = await supabase!.rpc('admin_update_place', {
      p_place_id: selectedPlace.id,
      p_patch: patch,
    });
    return updateError;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!supabase || !selected) return;

    setBusy(true);
    setNotice('');
    setError('');

    const updateError = table === 'places'
      ? await submitPlace(selected)
      : await submitGeneric(selected);

    setBusy(false);
    if (updateError) {
      setError(getErrorMessage(updateError));
      return;
    }

    setNotice(table === 'places' ? 'Изменения сохранены.' : 'Карточка сохранена.');
    if (table === 'places') setSavedPlaceSnapshot(getPlaceFormSnapshot(placeForm));
    notifyBackendContentUpdated();
    await loadItems();
  }

  async function submitGeneric(selectedItem: ContentRow) {
    const nextTitle = { ...selectedItem.rawTitle, ru: title.trim() };
    const nextDescription = { ...selectedItem.rawDescription, ru: description.trim() };
    const updatePayload: Record<string, unknown> = { [meta.titleColumn]: nextTitle, status };
    if (meta.descriptionColumn) updatePayload[meta.descriptionColumn] = nextDescription;

    const { error: updateError } = ['rider_tasks', 'service_definitions', 'freshness_policies'].includes(table)
      ? await supabase!.from(table).update(updatePayload).eq('id', selectedItem.id)
      : await supabase!.rpc('update_content_summary', {
        content_table: table,
        content_id: selectedItem.id,
        next_title: nextTitle,
        next_description: nextDescription,
        next_status: status,
      });
    return updateError;
  }

  function requestTableChange(nextTable: ContentTable) {
    if (nextTable === table) return;
    if (hasUnsavedPlaceChanges && !window.confirm('Есть несохранённые изменения. Перейти к другому типу контента?')) return;
    setTable(nextTable);
  }

  function selectItem(id: string) {
    if (id === selectedId) {
      setMobileEditorOpen(true);
      return;
    }
    if (hasUnsavedPlaceChanges && !window.confirm('Есть несохранённые изменения. Открыть другую карточку?')) return;
    setSelectedId(id);
    setMobileEditorOpen(true);
    setNotice('');
    setError('');
  }

  function closeMobileEditor() {
    if (hasUnsavedPlaceChanges && !window.confirm('Есть несохранённые изменения. Вернуться к списку?')) return;
    setMobileEditorOpen(false);
  }

  if (loading) return <section className="motohub-screen simple-screen"><section className="empty-state"><h2>Проверяем доступ</h2><p>Секунду.</p></section></section>;

  if (!user || !isAdmin) {
    return (
      <section className="motohub-screen simple-screen">
        <Link className="back-link" to="/profile"><ArrowLeft size={18} aria-hidden="true" />Назад в профиль</Link>
        <section className="empty-state">
          <div><Database size={30} aria-hidden="true" /></div>
          <h2>Нет доступа</h2>
          <p>Редактор контента доступен admin или superadmin.</p>
        </section>
      </section>
    );
  }

  return (
    <section className={`motohub-screen simple-screen admin-content-screen ${mobileEditorOpen ? 'is-editing-mobile' : ''}`}>
      <Link className="back-link" to="/profile"><ArrowLeft size={18} aria-hidden="true" />Назад в профиль</Link>
      <header className="simple-screen__header">
        <p>Админка</p>
        <h1>Контент</h1>
        <span>Удобное редактирование опубликованных карточек без изменения backend-логики.</span>
      </header>

      <div className="admin-content-toolbar">
        <label className="admin-content-type-select">
          Тип контента
          <select className="auth-input" value={table} onChange={(event) => requestTableChange(event.target.value as ContentTable)}>
            {contentTypes.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}
          </select>
        </label>
        <div className="search-filter-row admin-content-tabs" aria-label="Тип контента">
          {contentTypes.map((item) => (
            <button className={table === item.id ? 'is-active' : ''} type="button" onClick={() => requestTableChange(item.id)} key={item.id}>{item.title}</button>
          ))}
        </div>
      </div>

      <div className="admin-content-layout">
        <aside className="settings-list admin-content-list">
          <div className="admin-list-header">
            <div>
              <strong>{meta.title}</strong>
              <span>· {filteredItems.length} из {items.length}</span>
            </div>
            {busy ? <span className="admin-status-chip">Загрузка</span> : null}
          </div>
          <input className="auth-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={table === 'places' ? 'Найти место' : 'Поиск по карточкам'} />
          {filteredItems.map((item) => (
            <button className={`settings-row admin-content-row ${selectedId === item.id ? 'is-active' : ''}`} type="button" key={item.id} onClick={() => selectItem(item.id)}>
              <span className="settings-list__icon"><Edit3 size={19} aria-hidden="true" /></span>
              <span className="settings-list__copy">
                <strong>{item.title || item.id}</strong>
                <small>{table === 'places' ? getCategoryLabel(String(item.raw.category_id ?? '')) : getRegionLabel(item.region_id)} · {getContentStatusLabel(item.status)}</small>
                {table === 'places' ? <em>{getRegionLabel(item.region_id)}</em> : null}
              </span>
            </button>
          ))}
          {!filteredItems.length ? <p>Карточек не найдено.</p> : null}
        </aside>

        {selected ? (
          <form className="feedback-form admin-place-form" onSubmit={submit}>
            <div className="admin-editor-header">
              <button className="back-link admin-editor-back" type="button" onClick={closeMobileEditor}><ArrowLeft size={18} aria-hidden="true" />К списку</button>
              <div>
                <p>{table === 'places' ? 'Редактирование места' : `Редактирование: ${meta.title}`}</p>
                <h2>{table === 'places' ? placeForm.name || selected.title : title || selected.title}</h2>
                <span>{hasUnsavedPlaceChanges ? 'Есть несохранённые изменения' : 'Все изменения сохранены'}</span>
              </div>
            </div>

            {table === 'places' ? (
              <>
                <section className="admin-form-section">
                  <div className="admin-form-section__title">
                    <strong>Основное</strong>
                    <span>Название и описание, которые видит пользователь.</span>
                  </div>
                  <div className="admin-form-grid">
                    <label>
                      Название
                      <input className="auth-input" value={placeForm.name} onChange={(event) => updatePlaceField('name', event.target.value)} required />
                    </label>
                    <label>
                      Категория
                      <select className="auth-input" value={placeForm.categoryId} onChange={(event) => updatePlaceField('categoryId', event.target.value)}>
                        {placeCategories.map((category) => <option value={category.id} key={category.id}>{getLocalizedText(category.title, 'ru')}</option>)}
                      </select>
                    </label>
                    <label>
                      Регион
                      <select className="auth-input" value={placeForm.regionId} onChange={(event) => updatePlaceField('regionId', event.target.value)}>
                        {regions.map((region) => <option value={region.id} key={region.id}>{region.shortName ?? region.name}</option>)}
                      </select>
                    </label>
                    <label className="admin-form-field--wide">
                      Короткое описание
                      <textarea value={placeForm.shortDescription} onChange={(event) => updatePlaceField('shortDescription', event.target.value)} required />
                    </label>
                    <label className="admin-form-field--wide">
                      Полное описание
                      <textarea value={placeForm.fullDescription} onChange={(event) => updatePlaceField('fullDescription', event.target.value)} />
                    </label>
                  </div>
                </section>

                <section className="admin-form-section">
                  <div className="admin-form-section__title">
                    <strong>Контакты и адрес</strong>
                    <span>Данные для карточки, поиска и перехода в карты.</span>
                  </div>
                  <div className="admin-form-grid">
                    <label className="admin-form-field--wide">
                      Адрес
                      <input className="auth-input" value={placeForm.address} onChange={(event) => updatePlaceField('address', event.target.value)} />
                    </label>
                    <label>
                      Телефон
                      <input className="auth-input" value={placeForm.phone} onChange={(event) => updatePlaceField('phone', event.target.value)} />
                    </label>
                    <label>
                      Сайт
                      <input className="auth-input" value={placeForm.website} onChange={(event) => updatePlaceField('website', event.target.value)} placeholder="https://example.ru" />
                    </label>
                    <label className="admin-form-field--coordinate">
                      Долгота
                      <input className="auth-input" value={placeForm.lng} onChange={(event) => updatePlaceField('lng', event.target.value)} inputMode="decimal" />
                    </label>
                    <label className="admin-form-field--coordinate">
                      Широта
                      <input className="auth-input" value={placeForm.lat} onChange={(event) => updatePlaceField('lat', event.target.value)} inputMode="decimal" />
                    </label>
                    <label className="admin-form-field--wide">
                      Ссылка на карту
                      <input className="auth-input" value={placeForm.mapUrl} onChange={(event) => updatePlaceField('mapUrl', event.target.value)} />
                    </label>
                  </div>
                </section>

                <section className="admin-form-section">
                  <div className="admin-form-section__title">
                    <strong>Работа и актуальность</strong>
                    <span>Служебные статусы остаются прежними, но показаны по-человечески.</span>
                  </div>
                  <div className="admin-form-grid">
                    <label className="admin-form-field--wide">
                      Часы работы
                      <input className="auth-input" value={placeForm.schedule} onChange={(event) => updatePlaceField('schedule', event.target.value)} />
                    </label>
                    <label>
                      Актуальность
                      <select className="auth-input" value={placeForm.verificationStatus} onChange={(event) => updatePlaceField('verificationStatus', event.target.value as VerificationStatus)}>
                        {Object.entries(verificationStatusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                      </select>
                    </label>
                    <label>
                      Дата проверки
                      <input className="auth-input" value={placeForm.informationCheckedAt} onChange={(event) => updatePlaceField('informationCheckedAt', event.target.value)} placeholder="2026-08-10" />
                    </label>
                    <label>
                      Business status
                      <select className="auth-input" value={placeForm.businessStatus} onChange={(event) => updatePlaceField('businessStatus', event.target.value as BusinessStatus)}>
                        {Object.entries(businessStatusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                      </select>
                    </label>
                  </div>
                </section>

                <section className="admin-form-section">
                  <div className="admin-form-section__title">
                    <strong>Медиа</strong>
                    <span>Пока без загрузки файлов: только существующие URL или пути.</span>
                  </div>
                  <div className="admin-form-grid">
                    <label>
                      Картинка
                      <input className="auth-input" value={placeForm.image} onChange={(event) => updatePlaceField('image', event.target.value)} />
                    </label>
                    <label>
                      Обложка
                      <input className="auth-input" value={placeForm.coverImage} onChange={(event) => updatePlaceField('coverImage', event.target.value)} />
                    </label>
                  </div>
                </section>

                <section className="admin-form-section">
                  <div className="admin-form-section__title">
                    <strong>Публикация</strong>
                    <span>Что показывать пользователям и на карте.</span>
                  </div>
                  <div className="admin-form-grid">
                    <label>
                      Статус публикации
                      <select className="auth-input" value={placeForm.status} onChange={(event) => updatePlaceField('status', event.target.value as ContentStatus)}>
                        {Object.entries(contentStatusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                      </select>
                    </label>
                    <label>
                      Теги через запятую
                      <input className="auth-input" value={placeForm.tags} onChange={(event) => updatePlaceField('tags', event.target.value)} />
                    </label>
                    <label className="auth-consent admin-checkbox">
                      <input type="checkbox" checked={placeForm.mapVisibility} onChange={(event) => updatePlaceField('mapVisibility', event.target.checked)} />
                      Показывать на карте
                    </label>
                  </div>
                </section>
              </>
            ) : (
              <>
                <label>
                  Заголовок
                  <input className="auth-input" value={title} onChange={(event) => setTitle(event.target.value)} required />
                </label>
                {table !== 'regions' ? (
                  <label>
                    Короткое описание
                    <textarea value={description} onChange={(event) => setDescription(event.target.value)} required />
                  </label>
                ) : null}
                <label>
                  Статус
                  <select className="auth-input" value={status} onChange={(event) => setStatus(event.target.value as ContentStatus)}>
                    {Object.entries(contentStatusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                  </select>
                </label>
              </>
            )}

            <div className="admin-save-bar">
              <div className="admin-save-bar__status">
                {notice ? <span className="admin-save-message"><CheckCircle2 size={16} aria-hidden="true" />{notice}</span> : null}
                {error ? <span className="form-error">{error}</span> : null}
              </div>
              <button className="profile-primary-action" type="submit" disabled={busy || !selected}>
                <Save size={17} aria-hidden="true" />
                {busy ? 'Сохраняем...' : 'Сохранить'}
              </button>
            </div>
          </form>
        ) : (
          <section className="soft-callout admin-empty-editor">
            <Edit3 size={22} aria-hidden="true" />
            <div>
              <strong>Выберите карточку.</strong>
              <p>Для мест доступна полная MVP-форма: описание, адрес, контакты, координаты, категория, статус, картинки и теги. Услуги места сохраняются отдельно и этой формой не перезаписываются.</p>
            </div>
          </section>
        )}
      </div>
    </section>
  );
}
