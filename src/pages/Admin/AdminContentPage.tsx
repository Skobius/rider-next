import { ArrowLeft, Database, Edit3, Save } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useUserRoles } from '../../shared/auth/useUserRoles';
import { supabase } from '../../shared/supabase/client';

type ContentTable = 'places' | 'routes' | 'events' | 'guides' | 'exercises' | 'categories' | 'regions' | 'rider_tasks' | 'service_definitions' | 'freshness_policies';
type ContentStatus = 'draft' | 'published' | 'archived';

interface ContentRow {
  id: string;
  table: ContentTable;
  region_id: string;
  status: ContentStatus;
  title: string;
  description: string;
  rawTitle: Record<string, string>;
  rawDescription: Record<string, string>;
  updated_at?: string;
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
    updated_at: row.updated_at ? String(row.updated_at) : undefined,
  };
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
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const meta = contentTypes.find((item) => item.id === table)!;
  const selected = items.find((item) => item.id === selectedId);
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
    setNotice('');
    setError('');
    void loadItems();
  }, [table, user, isAdmin]);

  useEffect(() => {
    if (!selected) return;
    setTitle(selected.title);
    setDescription(selected.description);
    setStatus(selected.status);
  }, [selected]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!supabase || !selected) return;

    setBusy(true);
    setNotice('');
    setError('');

    const nextTitle = { ...selected.rawTitle, ru: title.trim() };
    const nextDescription = { ...selected.rawDescription, ru: description.trim() };
    const updatePayload: Record<string, unknown> = { [meta.titleColumn]: nextTitle, status };
    if (meta.descriptionColumn) updatePayload[meta.descriptionColumn] = nextDescription;

    const { error: updateError } = ['rider_tasks', 'service_definitions', 'freshness_policies'].includes(table)
      ? await supabase.from(table).update(updatePayload).eq('id', selected.id)
      : await supabase.rpc('update_content_summary', {
        content_table: table,
        content_id: selected.id,
        next_title: nextTitle,
        next_description: nextDescription,
        next_status: status,
      });

    setBusy(false);
    if (updateError) {
      setError('Не удалось сохранить. Проверьте роль и региональные права.');
      return;
    }

    setNotice('Карточка сохранена.');
    await loadItems();
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
    <section className="motohub-screen simple-screen">
      <Link className="back-link" to="/profile"><ArrowLeft size={18} aria-hidden="true" />Назад в профиль</Link>
      <header className="simple-screen__header">
        <p>Админка</p>
        <h1>Контент</h1>
        <span>Базовое редактирование опубликованных backend-карточек.</span>
      </header>

      <div className="search-filter-row">
        {contentTypes.map((item) => (
          <button className={table === item.id ? 'is-active' : ''} type="button" onClick={() => setTable(item.id)} key={item.id}>{item.title}</button>
        ))}
      </div>

      <input className="auth-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск по карточкам" />

      <div className="admin-content-layout">
        <div className="settings-list">
          {filteredItems.map((item) => (
            <button className={`settings-row admin-content-row ${selectedId === item.id ? 'is-active' : ''}`} type="button" key={item.id} onClick={() => setSelectedId(item.id)}>
              <span className="settings-list__icon"><Edit3 size={19} aria-hidden="true" /></span>
              <span className="settings-list__copy">
                <strong>{item.title || item.id}</strong>
                <small>{item.region_id} · {item.status}</small>
              </span>
            </button>
          ))}
          {!filteredItems.length ? <p>Карточек не найдено.</p> : null}
        </div>

        {selected ? (
          <form className="feedback-form" onSubmit={submit}>
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
                <option value="draft">draft</option>
                <option value="published">published</option>
                <option value="archived">archived</option>
              </select>
            </label>
            <button className="profile-primary-action" type="submit" disabled={busy}>
              <Save size={17} aria-hidden="true" />
              {busy ? 'Сохраняем...' : 'Сохранить'}
            </button>
            {notice ? <p>{notice}</p> : null}
            {error ? <p className="form-error">{error}</p> : null}
          </form>
        ) : (
          <section className="soft-callout">
            <Edit3 size={22} aria-hidden="true" />
            <div>
              <strong>Выберите карточку слева.</strong>
              <p>Для MVP редактируются только понятные поля: заголовок, короткое описание и статус. Сложные JSON-поля лучше раскрывать отдельными формами по типам карточек.</p>
            </div>
          </section>
        )}
      </div>
    </section>
  );
}
