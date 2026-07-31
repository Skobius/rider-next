import { ArrowLeft, Building2, CheckCircle2, Send } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { places } from '../../data/places';
import { defaultRegionId } from '../../data/regions';
import { useAuthSession } from '../../shared/auth/useAuthSession';
import { getLocalizedText } from '../../shared/i18n/localizedText';
import { useI18n } from '../../shared/i18n/useI18n';
import { supabase } from '../../shared/supabase/client';

interface MembershipRow {
  id: string;
  organization_id: string;
  membership_role: string;
  status: string;
  organizations: { name: string; slug: string } | null;
}

export function MyOrganizationsPage() {
  const { user, loading, configured } = useAuthSession();
  const { language } = useI18n();
  const [items, setItems] = useState<MembershipRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [organizationId, setOrganizationId] = useState('');
  const [placeId, setPlaceId] = useState('');
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!supabase || !user) return;
    async function loadItems() {
      setBusy(true);
      const { data } = await supabase!
        .from('organization_memberships')
        .select('id, organization_id, membership_role, status, organizations(name, slug)')
        .eq('user_id', user!.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      setItems((data ?? []) as unknown as MembershipRow[]);
      setBusy(false);
    }
    void loadItems();
  }, [user]);

  useEffect(() => {
    if (!organizationId && items[0]?.organization_id) setOrganizationId(items[0].organization_id);
  }, [items, organizationId]);

  async function submitConfirmation(event: FormEvent) {
    event.preventDefault();
    setNotice('');
    setError('');

    if (!supabase || !user || !organizationId || !placeId) {
      setError('Выберите организацию и карточку.');
      return;
    }

    setSending(true);
    const { error: insertError } = await supabase.from('owner_confirmations').insert({
      organization_id: organizationId,
      place_id: placeId,
      confirmed_by: user.id,
      region_id: defaultRegionId,
      confirmation_data: {
        unchanged: true,
        comment: comment.trim(),
      },
    });
    setSending(false);

    if (insertError) {
      setError('Не удалось отправить подтверждение. Проверьте, что организация действительно принадлежит вашему аккаунту.');
      return;
    }

    setNotice('Подтверждение отправлено на модерацию.');
    setPlaceId('');
    setComment('');
  }

  return (
    <section className="motohub-screen simple-screen">
      <Link className="back-link" to="/profile"><ArrowLeft size={18} aria-hidden="true" />Назад в профиль</Link>
      <header className="simple-screen__header">
        <p>Профиль</p>
        <h1>Мои организации</h1>
        <span>Организации и карточки, где вы владелец или редактор.</span>
      </header>

      {!configured || (!user && !loading) ? (
        <section className="empty-state">
          <div><Building2 size={30} aria-hidden="true" /></div>
          <h2>Нужен вход</h2>
          <p>Организации доступны после входа и подтверждения владения.</p>
          <Link className="profile-primary-action" to="/auth?next=/profile/organizations">Войти</Link>
        </section>
      ) : null}

      {user && !busy && !items.length ? (
        <section className="empty-state">
          <div><Building2 size={30} aria-hidden="true" /></div>
          <h2>Организаций пока нет</h2>
          <p>После одобрения заявки на владение организация появится здесь.</p>
        </section>
      ) : null}

      {items.length ? (
        <div className="settings-list">
          {items.map((item) => (
            <article className="favorite-row" key={item.id}>
              <span className="settings-list__icon"><Building2 size={19} aria-hidden="true" /></span>
              <span className="settings-list__copy">
                <strong>{item.organizations?.name ?? 'Организация'}</strong>
                <small>{item.membership_role} · {item.status}</small>
              </span>
            </article>
          ))}
        </div>
      ) : null}

      {items.length ? (
        <form className="feedback-form" onSubmit={submitConfirmation}>
          <div className="soft-callout">
            <CheckCircle2 size={22} aria-hidden="true" />
            <div>
              <strong>Подтвердить актуальность карточки</strong>
              <p>Если данные не изменились, отправьте короткое подтверждение. Оно не меняет карточку напрямую и попадёт в модерацию.</p>
            </div>
          </div>
          <label>
            Организация
            <select className="auth-input" value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} required>
              <option value="">Выберите организацию</option>
              {items.map((item) => <option key={item.id} value={item.organization_id}>{item.organizations?.name ?? 'Организация'}</option>)}
            </select>
          </label>
          <label>
            Карточка
            <select className="auth-input" value={placeId} onChange={(event) => setPlaceId(event.target.value)} required>
              <option value="">Выберите место</option>
              {places.map((place) => <option key={place.id} value={place.id}>{getLocalizedText(place.name, language)}</option>)}
            </select>
          </label>
          <label>
            Комментарий
            <textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Например: телефон и график актуальны" />
          </label>
          <button className="profile-primary-action" type="submit" disabled={sending}>
            <Send size={17} aria-hidden="true" />
            {sending ? 'Отправляем...' : 'Подтвердить данные'}
          </button>
          {notice ? <p>{notice}</p> : null}
          {error ? <p className="form-error">{error}</p> : null}
        </form>
      ) : null}
    </section>
  );
}
