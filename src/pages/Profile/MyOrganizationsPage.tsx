import { ArrowLeft, Building2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthSession } from '../../shared/auth/useAuthSession';
import { supabase } from '../../shared/supabase/client';

interface MembershipRow {
  id: string;
  membership_role: string;
  status: string;
  organizations: { name: string; slug: string } | null;
}

export function MyOrganizationsPage() {
  const { user, loading, configured } = useAuthSession();
  const [items, setItems] = useState<MembershipRow[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase || !user) return;
    async function loadItems() {
      setBusy(true);
      const { data } = await supabase!
        .from('organization_memberships')
        .select('id, membership_role, status, organizations(name, slug)')
        .eq('user_id', user!.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      setItems((data ?? []) as unknown as MembershipRow[]);
      setBusy(false);
    }
    void loadItems();
  }, [user]);

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
    </section>
  );
}
