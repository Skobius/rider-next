import { ArrowLeft, Send, ShieldCheck } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { defaultRegionId } from '../../data/regions';
import { places } from '../../data/places';
import { getLocalizedText } from '../../shared/i18n/localizedText';
import { useI18n } from '../../shared/i18n/useI18n';
import { useAuthSession } from '../../shared/auth/useAuthSession';
import { supabase } from '../../shared/supabase/client';

interface ClaimRow {
  id: string;
  status: string;
  created_at: string;
  place_id: string | null;
  organization_id: string | null;
}

export function MyClaimsPage() {
  const { user, loading, configured } = useAuthSession();
  const { language } = useI18n();
  const [items, setItems] = useState<ClaimRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [placeId, setPlaceId] = useState('');
  const [contactName, setContactName] = useState('');
  const [contact, setContact] = useState('');
  const [role, setRole] = useState('');
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  async function loadItems() {
    if (!supabase || !user) return;
    setBusy(true);
    const { data } = await supabase
      .from('ownership_claims')
      .select('id, status, created_at, place_id, organization_id')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false });
    setItems((data ?? []) as ClaimRow[]);
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
    if (!placeId || !contact.trim()) {
      setError('Выберите карточку и оставьте контакт для проверки.');
      return;
    }

    setSending(true);
    const { data, error: insertError } = await supabase
      .from('ownership_claims')
      .insert({
        author_id: user.id,
        region_id: defaultRegionId,
        place_id: placeId,
        evidence: {
          contact_name: contactName.trim(),
          contact: contact.trim(),
          role: role.trim(),
          comment: comment.trim(),
        },
      })
      .select('id')
      .single();

    if (!insertError && data?.id) {
      const { error: submitError } = await supabase.rpc('submit_ownership_claim', { claim_id: data.id });
      if (submitError) setError('Заявка сохранена как черновик, но не отправлена модератору.');
    } else {
      setError('Не удалось отправить заявку.');
    }

    if (!insertError) {
      setStatus('Заявка отправлена на проверку.');
      setPlaceId('');
      setContactName('');
      setContact('');
      setRole('');
      setComment('');
      await loadItems();
    }
    setSending(false);
  }

  return (
    <section className="motohub-screen simple-screen">
      <Link className="back-link" to="/profile"><ArrowLeft size={18} aria-hidden="true" />Назад в профиль</Link>
      <header className="simple-screen__header">
        <p>Профиль</p>
        <h1>Мои заявки</h1>
        <span>Заявки на владение организацией или карточкой.</span>
      </header>

      {!configured || (!user && !loading) ? (
        <section className="empty-state">
          <div><ShieldCheck size={30} aria-hidden="true" /></div>
          <h2>Нужен вход</h2>
          <p>Заявки на владение доступны только зарегистрированным пользователям.</p>
          <Link className="profile-primary-action" to="/auth?next=/profile/claims">Войти</Link>
        </section>
      ) : null}

      {user && !busy && !items.length ? (
        <section className="empty-state">
          <div><ShieldCheck size={30} aria-hidden="true" /></div>
          <h2>Заявок пока нет</h2>
          <p>Позже здесь появятся ваши заявки и ответы модератора.</p>
        </section>
      ) : null}

      {user ? (
        <form className="feedback-form" onSubmit={submit}>
          <label>
            Карточка
            <select className="auth-input" value={placeId} onChange={(event) => setPlaceId(event.target.value)} required>
              <option value="">Выберите место</option>
              {places.map((place) => <option key={place.id} value={place.id}>{getLocalizedText(place.name, language)}</option>)}
            </select>
          </label>
          <label>
            Имя
            <input className="auth-input" value={contactName} onChange={(event) => setContactName(event.target.value)} placeholder="Кто отправляет заявку" />
          </label>
          <label>
            Контакт для проверки
            <input className="auth-input" value={contact} onChange={(event) => setContact(event.target.value)} required placeholder="Телефон, email или Telegram" />
          </label>
          <label>
            Роль
            <input className="auth-input" value={role} onChange={(event) => setRole(event.target.value)} placeholder="Владелец, управляющий, сотрудник" />
          </label>
          <label>
            Комментарий
            <textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Как модератору быстрее подтвердить заявку" />
          </label>
          <button className="profile-primary-action" type="submit" disabled={sending}>
            <Send size={17} aria-hidden="true" />
            {sending ? 'Отправляем...' : 'Отправить заявку'}
          </button>
          {status ? <p>{status}</p> : null}
          {error ? <p className="form-error">{error}</p> : null}
        </form>
      ) : null}

      {items.length ? (
        <div className="settings-list">
          {items.map((item) => (
            <article className="favorite-row" key={item.id}>
              <span className="settings-list__icon"><ShieldCheck size={19} aria-hidden="true" /></span>
              <span className="settings-list__copy">
                <strong>{item.place_id ?? item.organization_id}</strong>
                <small>{item.status} · {new Date(item.created_at).toLocaleDateString('ru-RU')}</small>
              </span>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
