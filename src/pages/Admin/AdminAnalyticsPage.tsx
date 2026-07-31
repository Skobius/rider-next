import { ArrowLeft, BarChart3, RefreshCw, ShieldAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useUserRoles } from '../../shared/auth/useUserRoles';
import { supabase } from '../../shared/supabase/client';

interface MetricCard {
  label: string;
  value: number;
  hint: string;
}

interface RecheckRow {
  place_id: string;
  name: Record<string, string>;
  region_id: string;
  recheck_status: string;
}

interface ContributionRow {
  user_id: string;
  accepted_visit_reports: number;
  pending_visit_reports: number;
  approved_submissions: number;
}

async function countRows(table: string, status?: string) {
  if (!supabase) return 0;
  let query = supabase.from(table).select('id', { count: 'exact', head: true });
  if (status) query = query.eq('status', status);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

export function AdminAnalyticsPage() {
  const { user, loading, isAdmin } = useUserRoles();
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [recheckItems, setRecheckItems] = useState<RecheckRow[]>([]);
  const [contributors, setContributors] = useState<ContributionRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function loadAnalytics() {
    if (!supabase || !user || !isAdmin) return;
    setBusy(true);
    setError('');

    try {
      const [
        places,
        tasks,
        services,
        submittedReports,
        acceptedReports,
        ownerConfirmations,
        recheckData,
        contributionData,
      ] = await Promise.all([
        countRows('places'),
        countRows('rider_tasks'),
        countRows('service_definitions'),
        countRows('visit_reports', 'submitted'),
        countRows('visit_reports', 'accepted'),
        countRows('owner_confirmations'),
        supabase.from('recheck_queue').select('place_id, name, region_id, recheck_status').neq('recheck_status', 'ok').limit(10),
        supabase.from('user_contribution_stats').select('user_id, accepted_visit_reports, pending_visit_reports, approved_submissions').limit(10),
      ]);

      if (recheckData.error) throw recheckData.error;
      if (contributionData.error) throw contributionData.error;

      setMetrics([
        { label: 'Места', value: places, hint: 'опубликованные карточки и локальная база' },
        { label: 'Задачи', value: tasks, hint: 'сценарии, с которых начинается помощь' },
        { label: 'Услуги', value: services, hint: 'структурированные определения услуг' },
        { label: 'Новые сигналы', value: submittedReports, hint: 'ждут модерации' },
        { label: 'Принятые сигналы', value: acceptedReports, hint: 'уже стали проверками' },
        { label: 'Подтверждения владельцев', value: ownerConfirmations, hint: 'не меняют карточку без модерации' },
      ]);
      setRecheckItems((recheckData.data ?? []) as unknown as RecheckRow[]);
      setContributors((contributionData.data ?? []) as unknown as ContributionRow[]);
    } catch {
      setError('Не удалось загрузить аналитику. Проверьте роль и локальное Supabase-окружение.');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void loadAnalytics();
  }, [user, isAdmin]);

  if (loading) return <section className="motohub-screen simple-screen"><section className="empty-state"><h2>Проверяем доступ</h2><p>Секунду.</p></section></section>;

  if (!user || !isAdmin) {
    return (
      <section className="motohub-screen simple-screen">
        <Link className="back-link" to="/profile"><ArrowLeft size={18} aria-hidden="true" />Назад в профиль</Link>
        <section className="empty-state">
          <div><ShieldAlert size={30} aria-hidden="true" /></div>
          <h2>Нет доступа</h2>
          <p>Аналитика доступна admin или superadmin.</p>
        </section>
      </section>
    );
  }

  return (
    <section className="motohub-screen simple-screen">
      <Link className="back-link" to="/profile"><ArrowLeft size={18} aria-hidden="true" />Назад в профиль</Link>
      <header className="simple-screen__header">
        <p>Админка</p>
        <h1>Аналитика качества</h1>
        <span>Сводка по задачам, местам, свежести и пользовательским подтверждениям.</span>
      </header>

      <button className="profile-primary-action" type="button" onClick={() => void loadAnalytics()} disabled={busy}>
        <RefreshCw size={17} aria-hidden="true" />
        {busy ? 'Обновляем...' : 'Обновить'}
      </button>
      {error ? <p className="form-error">{error}</p> : null}

      <section className="profile-summary-grid admin-analytics-grid">
        {metrics.map((metric) => (
          <div key={metric.label}>
            <BarChart3 size={18} aria-hidden="true" />
            <strong>{metric.value}</strong>
            <span>{metric.label}</span>
            <small>{metric.hint}</small>
          </div>
        ))}
      </section>

      <section className="profile-group">
        <h2>Очередь перепроверки</h2>
        <div className="settings-list">
          {recheckItems.map((item) => (
            <Link className="settings-row" to={`/place/${item.place_id}`} key={item.place_id}>
              <span className="settings-list__icon"><RefreshCw size={19} aria-hidden="true" /></span>
              <span className="settings-list__copy">
                <strong>{item.name?.ru ?? item.place_id}</strong>
                <small>{item.region_id} · {item.recheck_status}</small>
              </span>
            </Link>
          ))}
          {!recheckItems.length ? <p>Нет карточек, которым нужна перепроверка.</p> : null}
        </div>
      </section>

      <section className="profile-group">
        <h2>Вклад пользователей</h2>
        <div className="settings-list">
          {contributors.map((item) => (
            <article className="settings-row admin-review-card" key={item.user_id}>
              <span className="settings-list__icon"><BarChart3 size={19} aria-hidden="true" /></span>
              <span className="settings-list__copy">
                <strong>{item.user_id}</strong>
                <small>принято сигналов: {item.accepted_visit_reports} · ждёт: {item.pending_visit_reports} · одобрено предложений: {item.approved_submissions}</small>
              </span>
            </article>
          ))}
          {!contributors.length ? <p>Вкладов пока нет.</p> : null}
        </div>
      </section>
    </section>
  );
}
