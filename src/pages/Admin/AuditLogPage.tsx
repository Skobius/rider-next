import { ArrowLeft, History, ShieldAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useUserRoles } from '../../shared/auth/useUserRoles';
import { supabase } from '../../shared/supabase/client';

interface AuditRow {
  id: string;
  actor_user_id: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  region_id: string | null;
  created_at: string;
  after_data: Record<string, unknown> | null;
}

export function AuditLogPage() {
  const { user, loading, isSuperadmin } = useUserRoles();
  const [items, setItems] = useState<AuditRow[]>([]);

  useEffect(() => {
    if (!supabase || !user || !isSuperadmin) return;

    async function loadItems() {
      const { data } = await supabase!
        .from('audit_log')
        .select('id, actor_user_id, action, target_type, target_id, region_id, created_at, after_data')
        .order('created_at', { ascending: false })
        .limit(100);
      setItems((data ?? []) as unknown as AuditRow[]);
    }

    void loadItems();
  }, [user, isSuperadmin]);

  if (loading) return <section className="motohub-screen simple-screen"><section className="empty-state"><h2>Проверяем доступ</h2><p>Секунду.</p></section></section>;

  if (!user || !isSuperadmin) {
    return (
      <section className="motohub-screen simple-screen">
        <Link className="back-link" to="/profile"><ArrowLeft size={18} aria-hidden="true" />Назад в профиль</Link>
        <section className="empty-state">
          <div><ShieldAlert size={30} aria-hidden="true" /></div>
          <h2>Нет доступа</h2>
          <p>Audit log доступен только superadmin.</p>
        </section>
      </section>
    );
  }

  return (
    <section className="motohub-screen simple-screen">
      <Link className="back-link" to="/profile"><ArrowLeft size={18} aria-hidden="true" />Назад в профиль</Link>
      <header className="simple-screen__header">
        <p>Админка</p>
        <h1>Audit log</h1>
        <span>Последние системные действия и изменения контента.</span>
      </header>

      <div className="settings-list">
        {items.map((item) => (
          <article className="settings-row admin-review-card" key={item.id}>
            <span className="settings-list__icon"><History size={19} aria-hidden="true" /></span>
            <span className="settings-list__copy">
              <strong>{item.action}</strong>
              <small>{item.target_type} · {item.target_id ?? 'без id'} · {new Date(item.created_at).toLocaleString('ru-RU')}</small>
              <small>{item.region_id ?? 'global'} · {item.actor_user_id ?? 'system'}</small>
              {item.after_data ? <pre>{JSON.stringify(item.after_data, null, 2)}</pre> : null}
            </span>
          </article>
        ))}
        {!items.length ? <p>Audit log пока пуст.</p> : null}
      </div>
    </section>
  );
}
