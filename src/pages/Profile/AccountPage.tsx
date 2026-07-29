import { ArrowLeft, Save, UserRound } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { defaultRegionId, getRegionLabel, regions } from '../../data/regions';
import { useUserProfile } from '../../shared/auth/useProfile';

function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat('ru-RU').format(new Date(value)) : 'Не зафиксировано';
}

export function AccountPage() {
  const { configured, user, profile, loading, error, updateProfile } = useUserProfile();
  const [displayName, setDisplayName] = useState('');
  const [homeRegionId, setHomeRegionId] = useState(defaultRegionId);
  const [status, setStatus] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDisplayName(profile?.display_name ?? '');
    setHomeRegionId(profile?.home_region_id ?? defaultRegionId);
  }, [profile]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setStatus('');
    setFormError('');
    setSaving(true);

    const result = await updateProfile({
      display_name: displayName.trim() || null,
      home_region_id: homeRegionId,
    });

    setSaving(false);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }

    setStatus('Профиль сохранён.');
  }

  if (!configured || !user) {
    return (
      <section className="motohub-screen simple-screen">
        <Link className="back-link" to="/profile"><ArrowLeft size={18} aria-hidden="true" />Назад в профиль</Link>
        <section className="empty-state">
          <div><UserRound size={30} aria-hidden="true" /></div>
          <h2>Нужен вход</h2>
          <p>Личные данные появятся после входа в аккаунт.</p>
          <Link className="profile-primary-action" to="/auth?next=/profile/account">Войти или зарегистрироваться</Link>
        </section>
      </section>
    );
  }

  return (
    <section className="motohub-screen simple-screen">
      <Link className="back-link" to="/profile"><ArrowLeft size={18} aria-hidden="true" />Назад в профиль</Link>
      <header className="simple-screen__header">
        <p>Профиль</p>
        <h1>Личные данные</h1>
        <span>Имя и регион, которые будут использоваться в МотоХабе.</span>
      </header>

      {loading ? (
        <section className="empty-state">
          <div><UserRound size={30} aria-hidden="true" /></div>
          <h2>Загружаем профиль</h2>
          <p>Секунду.</p>
        </section>
      ) : (
        <form className="feedback-form" onSubmit={submit}>
          <label>
            Имя
            <input className="auth-input" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Как к вам обращаться" />
          </label>
          <label>
            Регион
            <select className="auth-input" value={homeRegionId} onChange={(event) => setHomeRegionId(event.target.value)}>
              {regions.map((region) => (
                <option key={region.id} value={region.id}>{region.shortName ?? region.name}</option>
              ))}
            </select>
          </label>
          <button className="profile-primary-action" type="submit" disabled={saving}>
            <Save size={17} aria-hidden="true" />
            {saving ? 'Сохраняем...' : 'Сохранить'}
          </button>
          {status ? <p>{status}</p> : null}
          {formError || error ? <p className="form-error">{formError || error}</p> : null}
        </form>
      )}

      {profile ? (
        <section className="profile-group">
          <h2>Статус</h2>
          <div className="settings-list">
            <div className="settings-row">
              <span className="settings-list__copy"><strong>Аккаунт</strong><small>{profile.account_status === 'active' ? 'Активен' : profile.account_status}</small></span>
            </div>
            <div className="settings-row">
              <span className="settings-list__copy"><strong>Домашний регион</strong><small>{getRegionLabel(profile.home_region_id ?? defaultRegionId)}</small></span>
            </div>
            <div className="settings-row">
              <span className="settings-list__copy"><strong>Согласие с правилами</strong><small>{formatDate(profile.terms_accepted_at)}</small></span>
            </div>
            <div className="settings-row">
              <span className="settings-list__copy"><strong>Согласие с приватностью</strong><small>{formatDate(profile.privacy_accepted_at)}</small></span>
            </div>
          </div>
        </section>
      ) : null}
    </section>
  );
}
