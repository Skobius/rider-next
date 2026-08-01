import { ArrowLeft, CheckCircle2, FileText, PlusCircle, Send } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { appCategories } from '../../data/categories';
import { defaultRegionId, regions } from '../../data/regions';
import { useAuthSession } from '../../shared/auth/useAuthSession';
import { notifyBackendContentUpdated } from '../../shared/content/backendContent';
import { getLocalizedText } from '../../shared/i18n/localizedText';
import { useI18n } from '../../shared/i18n/useI18n';
import { supabase } from '../../shared/supabase/client';

interface SubmissionRow {
  id: string;
  status: 'draft' | 'submitted' | 'in_review' | 'changes_requested' | 'approved' | 'rejected' | 'cancelled';
  created_at: string;
  published_entity_id: string | null;
  proposed_data: Record<string, unknown>;
}

const placeCategories = appCategories.filter((category) => category.sectionId === 'places');
const availableRegions = regions.filter((region) => region.isAvailable);

const statusLabels: Record<SubmissionRow['status'], string> = {
  draft: 'Черновик',
  submitted: 'На проверке',
  in_review: 'На проверке',
  changes_requested: 'Нужны уточнения',
  approved: 'Одобрено',
  rejected: 'Отклонено',
  cancelled: 'Отменено',
};

const emptyForm = {
  title: '',
  categoryId: 'places-services',
  regionId: defaultRegionId,
  address: '',
  description: '',
  sourceComment: '',
  phone: '',
  website: '',
  lng: '',
  lat: '',
  schedule: '',
  photoUrl: '',
  extra: '',
};

export function MySubmissionsPage() {
  const { user, loading, configured } = useAuthSession();
  const { language } = useI18n();
  const [items, setItems] = useState<SubmissionRow[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  async function loadItems() {
    if (!supabase || !user) return;
    setBusy(true);
    const { data } = await supabase
      .from('content_submissions')
      .select('id, status, created_at, published_entity_id, proposed_data')
      .eq('author_id', user.id)
      .eq('entity_type', 'place')
      .eq('submission_type', 'create_entity')
      .order('created_at', { ascending: false });
    setItems((data ?? []) as unknown as SubmissionRow[]);
    setBusy(false);
  }

  useEffect(() => {
    void loadItems();
  }, [user]);

  function updateField(key: keyof typeof emptyForm, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setStatus('');
    setError('');

    if (!supabase || !user) return;
    if (!form.title.trim() || !form.address.trim() || !form.description.trim() || !form.sourceComment.trim()) {
      setError('Заполните название, адрес, описание и источник информации.');
      return;
    }

    setSending(true);
    const payload = {
      title: form.title.trim(),
      category_id: form.categoryId,
      region_id: form.regionId,
      address: form.address.trim(),
      description: form.description.trim(),
      source_comment: form.sourceComment.trim(),
      phone: form.phone.trim() || null,
      website: form.website.trim() || null,
      lng: form.lng.trim() || null,
      lat: form.lat.trim() || null,
      schedule: form.schedule.trim() || null,
      photo_url: form.photoUrl.trim() || null,
      extra: form.extra.trim() || null,
    };

    const { error: submitError } = await supabase.rpc('submit_place_submission', { p_data: payload });

    if (submitError) {
      setError('Не удалось отправить место. Проверьте поля и попробуйте ещё раз.');
    } else {
      setStatus('Спасибо! Место отправлено на проверку.');
      setForm(emptyForm);
      await loadItems();
    }
    setSending(false);
  }

  return (
    <section className="motohub-screen simple-screen">
      <Link className="back-link" to="/profile"><ArrowLeft size={18} aria-hidden="true" />Назад в профиль</Link>
      <header className="simple-screen__header">
        <p>Профиль</p>
        <h1>Мои предложения</h1>
        <span>Предложите новое мотоместо. После проверки оно появится в каталоге, поиске и на карте.</span>
      </header>

      {!configured || (!user && !loading) ? (
        <section className="empty-state">
          <div><FileText size={30} aria-hidden="true" /></div>
          <h2>Нужен вход</h2>
          <p>Чтобы предложить место и видеть статус проверки, войдите в аккаунт.</p>
          <Link className="profile-primary-action" to="/auth?next=/profile/submissions">Войти</Link>
        </section>
      ) : null}

      {user ? (
        <form className="feedback-form place-submission-form" onSubmit={submit}>
          <label>
            Название
            <input className="auth-input" value={form.title} onChange={(event) => updateField('title', event.target.value)} required placeholder="Например: Мотосервис Тестовый" />
          </label>
          <div className="admin-form-grid">
            <label>
              Категория
              <select className="auth-input" value={form.categoryId} onChange={(event) => updateField('categoryId', event.target.value)} required>
                {placeCategories.map((category) => <option value={category.id} key={category.id}>{getLocalizedText(category.title, language)}</option>)}
              </select>
            </label>
            <label>
              Регион
              <select className="auth-input" value={form.regionId} onChange={(event) => updateField('regionId', event.target.value)} required>
                {availableRegions.map((region) => <option value={region.id} key={region.id}>{region.shortName ?? region.name}</option>)}
              </select>
            </label>
          </div>
          <label>
            Адрес
            <input className="auth-input" value={form.address} onChange={(event) => updateField('address', event.target.value)} required placeholder="Город, улица, дом или понятное описание места" />
          </label>
          <label>
            Почему место полезно мотоциклистам
            <textarea value={form.description} onChange={(event) => updateField('description', event.target.value)} required placeholder="Коротко: что здесь можно сделать, чем место полезно, кому подойдёт" />
          </label>
          <label>
            Источник информации или комментарий
            <textarea value={form.sourceComment} onChange={(event) => updateField('sourceComment', event.target.value)} required placeholder="Например: был здесь лично, нашёл на официальной странице, посоветовали в сообществе" />
          </label>
          <div className="admin-form-grid">
            <label>
              Телефон
              <input className="auth-input" value={form.phone} onChange={(event) => updateField('phone', event.target.value)} placeholder="+7..." />
            </label>
            <label>
              Сайт
              <input className="auth-input" value={form.website} onChange={(event) => updateField('website', event.target.value)} placeholder="https://example.ru" />
            </label>
            <label>
              Долгота
              <input className="auth-input" value={form.lng} onChange={(event) => updateField('lng', event.target.value)} inputMode="decimal" placeholder="31.972202" />
            </label>
            <label>
              Широта
              <input className="auth-input" value={form.lat} onChange={(event) => updateField('lat', event.target.value)} inputMode="decimal" placeholder="54.791412" />
            </label>
            <label>
              График
              <input className="auth-input" value={form.schedule} onChange={(event) => updateField('schedule', event.target.value)} placeholder="Например: ежедневно 10:00-18:00" />
            </label>
            <label>
              Ссылка на фото
              <input className="auth-input" value={form.photoUrl} onChange={(event) => updateField('photoUrl', event.target.value)} placeholder="https://..." />
            </label>
          </div>
          <label>
            Дополнительные сведения
            <textarea value={form.extra} onChange={(event) => updateField('extra', event.target.value)} placeholder="Любые детали, которые помогут модератору проверить место" />
          </label>
          <button className="profile-primary-action" type="submit" disabled={sending}>
            <Send size={17} aria-hidden="true" />
            {sending ? 'Отправляем...' : 'Предложить место'}
          </button>
          {status ? <p className="form-success"><CheckCircle2 size={16} aria-hidden="true" />{status}</p> : null}
          {error ? <p className="form-error">{error}</p> : null}
        </form>
      ) : null}

      {user && !busy && !items.length ? (
        <section className="empty-state">
          <div><PlusCircle size={30} aria-hidden="true" /></div>
          <h2>Предложений пока нет</h2>
          <p>Когда вы отправите место, его статус появится здесь.</p>
        </section>
      ) : null}

      {items.length ? (
        <div className="settings-list">
          {items.map((item) => {
            const title = String(item.proposed_data?.title ?? 'Новое место');
            return (
              <article className="favorite-row" key={item.id}>
                <span className="settings-list__icon"><FileText size={19} aria-hidden="true" /></span>
                <span className="settings-list__copy">
                  <strong>{title}</strong>
                  <small>{statusLabels[item.status]} · {new Date(item.created_at).toLocaleDateString('ru-RU')}</small>
                  {item.published_entity_id ? <Link to={`/place/${item.published_entity_id}`}>Открыть карточку</Link> : null}
                </span>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
