import { ArrowLeft, Ban, RotateCcw, ShieldAlert, UserPlus, UsersRound } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { defaultRegionId } from '../../data/regions';
import { useUserRoles } from '../../shared/auth/useUserRoles';
import { supabase } from '../../shared/supabase/client';

type RoleCode = 'moderator' | 'admin' | 'superadmin';

interface RoleRow {
  id: string;
  user_id: string;
  scope_type: string;
  scope_id: string | null;
  created_at: string;
  roles: { code: string } | null;
}

interface ProfileRow {
  id: string;
  display_name: string | null;
  account_status: string;
  home_region_id: string | null;
  created_at: string;
}

export function AdminUsersPage() {
  const { user, loading, isSuperadmin } = useUserRoles();
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [targetUserId, setTargetUserId] = useState('');
  const [roleCode, setRoleCode] = useState<RoleCode>('moderator');
  const [scopeId, setScopeId] = useState(defaultRegionId);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function loadData() {
    if (!supabase || !user || !isSuperadmin) return;
    const [rolesResult, profilesResult] = await Promise.all([
      supabase.from('user_role_assignments').select('id, user_id, scope_type, scope_id, created_at, roles(code)').is('revoked_at', null).order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, display_name, account_status, home_region_id, created_at').order('created_at', { ascending: false }),
    ]);
    setRoles((rolesResult.data ?? []) as unknown as RoleRow[]);
    setProfiles((profilesResult.data ?? []) as unknown as ProfileRow[]);
  }

  useEffect(() => {
    void loadData();
  }, [user, isSuperadmin]);

  async function assignRole(event: FormEvent) {
    event.preventDefault();
    if (!supabase || !targetUserId.trim()) return;
    setBusy(true);
    setNotice('');
    setError('');
    const scopeType = roleCode === 'superadmin' ? 'global' : 'region';
    const { error: rpcError } = await supabase.rpc('assign_role', {
      target_user_id: targetUserId.trim(),
      role_code: roleCode,
      scope_type: scopeType,
      scope_id: scopeType === 'region' ? scopeId : null,
    });
    setBusy(false);
    if (rpcError) {
      setError('Не удалось назначить роль. Проверьте UUID пользователя и права.');
      return;
    }
    setNotice('Роль назначена.');
    await loadData();
  }

  async function revokeRole(roleId: string) {
    if (!supabase) return;
    setBusy(true);
    setNotice('');
    setError('');
    const { error: rpcError } = await supabase.rpc('revoke_role', { assignment_id: roleId });
    setBusy(false);
    if (rpcError) {
      setError('Не удалось отозвать роль.');
      return;
    }
    setNotice('Роль отозвана.');
    await loadData();
  }

  async function setBlocked(userId: string, blocked: boolean) {
    if (!supabase) return;
    setBusy(true);
    setNotice('');
    setError('');
    const { error: rpcError } = await supabase.functions.invoke('admin-user-access', {
      body: {
        action: blocked ? 'block' : 'unblock',
        targetUserId: userId,
      },
    });
    setBusy(false);
    if (rpcError) {
      setError(blocked ? 'Не удалось заблокировать пользователя.' : 'Не удалось разблокировать пользователя.');
      return;
    }
    setNotice(blocked ? 'Пользователь заблокирован.' : 'Пользователь разблокирован.');
    await loadData();
  }

  if (loading) return <section className="motohub-screen simple-screen"><section className="empty-state"><h2>Проверяем доступ</h2><p>Секунду.</p></section></section>;

  if (!user || !isSuperadmin) {
    return (
      <section className="motohub-screen simple-screen">
        <Link className="back-link" to="/profile"><ArrowLeft size={18} aria-hidden="true" />Назад в профиль</Link>
        <section className="empty-state">
          <div><ShieldAlert size={30} aria-hidden="true" /></div>
          <h2>Нет доступа</h2>
          <p>Управление пользователями доступно только superadmin.</p>
        </section>
      </section>
    );
  }

  return (
    <section className="motohub-screen simple-screen">
      <Link className="back-link" to="/profile"><ArrowLeft size={18} aria-hidden="true" />Назад в профиль</Link>
      <header className="simple-screen__header">
        <p>Админка</p>
        <h1>Пользователи и роли</h1>
        <span>Назначение ролей и блокировка через защищённые RPC. Пароли и токены не отображаются.</span>
      </header>

      <form className="feedback-form" onSubmit={assignRole}>
        <label>
          UUID пользователя
          <input className="auth-input" value={targetUserId} onChange={(event) => setTargetUserId(event.target.value)} placeholder="auth user id" required />
        </label>
        <label>
          Роль
          <select className="auth-input" value={roleCode} onChange={(event) => setRoleCode(event.target.value as RoleCode)}>
            <option value="moderator">moderator</option>
            <option value="admin">admin</option>
            <option value="superadmin">superadmin</option>
          </select>
        </label>
        {roleCode !== 'superadmin' ? (
          <label>
            Регион
            <input className="auth-input" value={scopeId} onChange={(event) => setScopeId(event.target.value)} />
          </label>
        ) : null}
        <button className="profile-primary-action" type="submit" disabled={busy}>
          <UserPlus size={17} aria-hidden="true" />
          Назначить роль
        </button>
        {notice ? <p>{notice}</p> : null}
        {error ? <p className="form-error">{error}</p> : null}
      </form>

      <section className="profile-group">
        <h2>Профили</h2>
        <div className="settings-list">
          {profiles.map((profile) => (
            <article className="settings-row" key={profile.id}>
              <span className="settings-list__icon"><UsersRound size={19} aria-hidden="true" /></span>
              <span className="settings-list__copy">
                <strong>{profile.display_name ?? profile.id}</strong>
                <small>{profile.id}</small>
                <small>{profile.account_status} · {profile.home_region_id ?? 'без региона'}</small>
              </span>
              <span className="admin-action-row">
                <button type="button" disabled={busy || profile.account_status === 'blocked'} onClick={() => setBlocked(profile.id, true)}><Ban size={15} />Блок</button>
                <button type="button" disabled={busy || profile.account_status !== 'blocked'} onClick={() => setBlocked(profile.id, false)}><RotateCcw size={15} />Разблок</button>
              </span>
            </article>
          ))}
        </div>
      </section>

      <section className="profile-group">
        <h2>Активные роли</h2>
        <div className="settings-list">
          {roles.map((item) => (
            <article className="settings-row" key={item.id}>
              <span className="settings-list__icon"><ShieldAlert size={19} aria-hidden="true" /></span>
              <span className="settings-list__copy">
                <strong>{item.roles?.code ?? 'role'}</strong>
                <small>{item.user_id}</small>
                <small>{item.scope_type}{item.scope_id ? ` · ${item.scope_id}` : ''}</small>
              </span>
              <span className="admin-action-row">
                <button type="button" disabled={busy} onClick={() => revokeRole(item.id)}>Отозвать</button>
              </span>
            </article>
          ))}
          {!roles.length ? <p>Активных назначений ролей не найдено.</p> : null}
        </div>
      </section>
    </section>
  );
}
