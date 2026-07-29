import { ArrowLeft, FileText, PlusCircle, Send } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { defaultRegionId } from '../../data/regions';
import { places } from '../../data/places';
import { routes } from '../../data/routes';
import { events } from '../../data/events';
import { getLocalizedText } from '../../shared/i18n/localizedText';
import { useI18n } from '../../shared/i18n/useI18n';
import { useAuthSession } from '../../shared/auth/useAuthSession';
import { supabase } from '../../shared/supabase/client';

interface SubmissionRow {
  id: string;
  entity_type: string;
  submission_type: string;
  status: string;
  created_at: string;
}

export function MySubmissionsPage() {
  const { user, loading, configured } = useAuthSession();
  const { language } = useI18n();
  const [items, setItems] = useState<SubmissionRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [entityType, setEntityType] = useState<'place' | 'route' | 'event'>('place');
  const [submissionType, setSubmissionType] = useState<'create_entity' | 'update_entity' | 'report_error'>('create_entity');
  const [entityId, setEntityId] = useState('');
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');

  const entities = useMemo(() => {
    if (entityType === 'route') return routes.map((item) => ({ id: item.id, title: getLocalizedText(item.title, language) }));
    if (entityType === 'event') return events.map((item) => ({ id: item.id, title: getLocalizedText(item.title, language) }));
    return places.map((item) => ({ id: item.id, title: getLocalizedText(item.name, language) }));
  }, [entityType, language]);

  async function loadItems() {
    if (!supabase || !user) return;
    setBusy(true);
    const { data } = await supabase
      .from('content_submissions')
      .select('id, entity_type, submission_type, status, created_at')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false });
    setItems((data ?? []) as SubmissionRow[]);
    setBusy(false);
  }

  useEffect(() => {
    void loadItems();
  }, [user]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setStatus('');
    setError('');

    if (!supabase || !user) return;
    if (!details.trim()) {
      setError('Опишите, что нужно добавить или исправить.');
      return;
    }

    setSending(true);
    const { data, error: insertError } = await supabase
      .from('content_submissions')
      .insert({
        author_id: user.id,
        region_id: defaultRegionId,
        entity_type: entityType,
        entity_id: submissionType === 'create_entity' ? null : entityId || null,
        submission_type: submissionType,
        reason: details.trim(),
        proposed_data: { title: title.trim(), details: details.trim() },
      })
      .select('id')
      .single();

    if (!insertError && data?.id) {
      const { error: submitError } = await supabase.rpc('submit_submission', { submission_id: data.id });
      if (submitError) setError('Предложение сохранено как черновик, но не отправлено модератору.');
    } else {
      setError('Не удалось отправить предложение.');
    }

    if (!insertError) {
      setStatus('Предложение отправлено на модерацию.');
      setTitle('');
      setDetails('');
      setEntityId('');
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
        <span>Новые места, исправления и сообщения об ошибках.</span>
      </header>

      {!configured || (!user && !loading) ? (
        <section className="empty-state">
          <div><FileText size={30} aria-hidden="true" /></div>
          <h2>Нужен вход</h2>
          <p>Предложения сохраняются в backend и доступны только после входа.</p>
          <Link className="profile-primary-action" to="/auth?next=/profile/submissions">Войти</Link>
        </section>
      ) : null}

      {user && !busy && !items.length ? (
        <section className="empty-state">
          <div><PlusCircle size={30} aria-hidden="true" /></div>
          <h2>Предложений пока нет</h2>
          <p>Когда вы предложите место или исправление, статус появится здесь.</p>
          <Link className="profile-primary-action" to="/feedback">Предложить изменение</Link>
        </section>
      ) : null}

      {user ? (
        <form className="feedback-form" onSubmit={submit}>
          <label>
            Что хотите сделать
            <select className="auth-input" value={submissionType} onChange={(event) => setSubmissionType(event.target.value as typeof submissionType)}>
              <option value="create_entity">Предложить новую карточку</option>
              <option value="update_entity">Исправить существующую карточку</option>
              <option value="report_error">Сообщить об ошибке</option>
            </select>
          </label>
          <label>
            Тип карточки
            <select className="auth-input" value={entityType} onChange={(event) => { setEntityType(event.target.value as typeof entityType); setEntityId(''); }}>
              <option value="place">Место</option>
              <option value="route">Маршрут</option>
              <option value="event">Событие</option>
            </select>
          </label>
          {submissionType !== 'create_entity' ? (
            <label>
              Карточка
              <select className="auth-input" value={entityId} onChange={(event) => setEntityId(event.target.value)} required>
                <option value="">Выберите карточку</option>
                {entities.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
              </select>
            </label>
          ) : null}
          <label>
            Название
            <input className="auth-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Например: новый мотосервис" />
          </label>
          <label>
            Описание
            <textarea value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Коротко напишите, что добавить или исправить" />
          </label>
          <button className="profile-primary-action" type="submit" disabled={sending}>
            <Send size={17} aria-hidden="true" />
            {sending ? 'Отправляем...' : 'Отправить'}
          </button>
          {status ? <p>{status}</p> : null}
          {error ? <p className="form-error">{error}</p> : null}
        </form>
      ) : null}

      {items.length ? (
        <div className="settings-list">
          {items.map((item) => (
            <article className="favorite-row" key={item.id}>
              <span className="settings-list__icon"><FileText size={19} aria-hidden="true" /></span>
              <span className="settings-list__copy">
                <strong>{item.submission_type}</strong>
                <small>{item.entity_type} · {item.status} · {new Date(item.created_at).toLocaleDateString('ru-RU')}</small>
              </span>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
