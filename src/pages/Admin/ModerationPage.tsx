import { ArrowLeft, CheckCircle2, ClipboardList, MessageSquare, ShieldCheck, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useUserRoles } from '../../shared/auth/useUserRoles';
import { supabase } from '../../shared/supabase/client';

type ReviewStatus = 'submitted' | 'in_review' | 'changes_requested' | 'approved' | 'rejected' | 'cancelled';

interface SubmissionRow {
  id: string;
  entity_type: string;
  entity_id: string | null;
  submission_type: string;
  region_id: string;
  status: ReviewStatus;
  reason: string | null;
  proposed_data: Record<string, unknown>;
  created_at: string;
}

interface ClaimRow {
  id: string;
  place_id: string | null;
  region_id: string;
  status: ReviewStatus;
  evidence: Record<string, unknown>;
  created_at: string;
}

interface VisitReportRow {
  id: string;
  place_id: string;
  region_id: string;
  user_id: string;
  status: 'submitted' | 'accepted' | 'rejected';
  visited_at: string | null;
  is_open: boolean | null;
  services_confirmed: string[];
  comment: string | null;
  created_at: string;
}

interface RecheckQueueRow {
  place_id: string;
  name: Record<string, string>;
  region_id: string;
  category_id: string;
  last_verification_at: string | null;
  nearest_expires_at: string | null;
  recheck_status: string;
}

const statuses: ReviewStatus[] = ['submitted', 'in_review', 'changes_requested', 'approved', 'rejected', 'cancelled'];

function preview(value: unknown) {
  if (!value) return 'Нет данных';
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
}

export function ModerationPage() {
  const { user, loading, isModerator } = useUserRoles();
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [claims, setClaims] = useState<ClaimRow[]>([]);
  const [visitReports, setVisitReports] = useState<VisitReportRow[]>([]);
  const [recheckItems, setRecheckItems] = useState<RecheckQueueRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'all'>('submitted');
  const [messageById, setMessageById] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  async function loadItems() {
    if (!supabase || !user || !isModerator) return;

    let submissionQuery = supabase
      .from('content_submissions')
      .select('id, entity_type, entity_id, submission_type, region_id, status, reason, proposed_data, created_at')
      .order('created_at', { ascending: false });
    let claimQuery = supabase
      .from('ownership_claims')
      .select('id, place_id, region_id, status, evidence, created_at')
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      submissionQuery = submissionQuery.eq('status', statusFilter);
      claimQuery = claimQuery.eq('status', statusFilter);
    }

    let visitReportQuery = supabase
      .from('visit_reports')
      .select('id, place_id, region_id, user_id, status, visited_at, is_open, services_confirmed, comment, created_at')
      .order('created_at', { ascending: false });

    if (statusFilter === 'submitted' || statusFilter === 'rejected') {
      visitReportQuery = visitReportQuery.eq('status', statusFilter);
    }

    const [{ data: submissionData }, { data: claimData }, { data: visitReportData }, { data: recheckData }] = await Promise.all([
      submissionQuery,
      claimQuery,
      visitReportQuery,
      supabase.from('recheck_queue').select('place_id, name, region_id, category_id, last_verification_at, nearest_expires_at, recheck_status').neq('recheck_status', 'ok').limit(30),
    ]);
    setSubmissions((submissionData ?? []) as unknown as SubmissionRow[]);
    setClaims((claimData ?? []) as unknown as ClaimRow[]);
    setVisitReports((visitReportData ?? []) as unknown as VisitReportRow[]);
    setRecheckItems((recheckData ?? []) as unknown as RecheckQueueRow[]);
  }

  useEffect(() => {
    void loadItems();
  }, [user, isModerator, statusFilter]);

  async function setSubmissionStatus(id: string, nextStatus: ReviewStatus) {
    if (!supabase) return;
    setBusyId(id);
    setNotice('');
    setError('');
    const { error: rpcError } = await supabase.rpc('set_submission_status', {
      submission_id: id,
      next_status: nextStatus,
      public_message: messageById[id]?.trim() || null,
      internal_message: null,
    });
    setBusyId('');
    if (rpcError) {
      setError('Не удалось изменить статус предложения.');
      return;
    }
    setNotice('Статус предложения обновлён.');
    await loadItems();
  }

  async function setClaimStatus(id: string, nextStatus: ReviewStatus) {
    if (!supabase) return;
    setBusyId(id);
    setNotice('');
    setError('');
    const { error: rpcError } = await supabase.rpc('set_ownership_claim_status', {
      claim_id: id,
      next_status: nextStatus,
      public_message: messageById[id]?.trim() || null,
    });
    setBusyId('');
    if (rpcError) {
      setError('Не удалось изменить статус заявки.');
      return;
    }
    setNotice('Статус заявки обновлён.');
    await loadItems();
  }

  async function setVisitReportStatus(item: VisitReportRow, nextStatus: 'accepted' | 'rejected') {
    if (!supabase) return;
    setBusyId(item.id);
    setNotice('');
    setError('');

    const { error: updateError } = await supabase
      .from('visit_reports')
      .update({ status: nextStatus, reviewed_at: new Date().toISOString(), reviewed_by: user?.id ?? null })
      .eq('id', item.id);

    if (!updateError && nextStatus === 'accepted') {
      await supabase.from('verification_events').insert({
        entity_type: 'place',
        entity_id: item.place_id,
        place_id: item.place_id,
        region_id: item.region_id,
        source: 'user_report',
        status: 'confirmed',
        details: {
          visit_report_id: item.id,
          is_open: item.is_open,
          services_confirmed: item.services_confirmed,
        },
        created_by: user?.id ?? null,
      });
    }

    setBusyId('');
    if (updateError) {
      setError('Не удалось обработать пользовательский сигнал.');
      return;
    }
    setNotice(nextStatus === 'accepted' ? 'Сигнал принят, событие проверки создано.' : 'Сигнал отклонён.');
    await loadItems();
  }

  function messageField(id: string) {
    return (
      <input
        className="auth-input"
        value={messageById[id] ?? ''}
        onChange={(event) => setMessageById((current) => ({ ...current, [id]: event.target.value }))}
        placeholder="Комментарий заявителю, если нужен"
      />
    );
  }

  if (loading) return <section className="motohub-screen simple-screen"><section className="empty-state"><h2>Проверяем доступ</h2><p>Секунду.</p></section></section>;

  if (!user || !isModerator) {
    return (
      <section className="motohub-screen simple-screen">
        <Link className="back-link" to="/profile"><ArrowLeft size={18} aria-hidden="true" />Назад в профиль</Link>
        <section className="empty-state">
          <div><ShieldCheck size={30} aria-hidden="true" /></div>
          <h2>Нет доступа</h2>
          <p>Раздел доступен модератору, администратору или superadmin.</p>
        </section>
      </section>
    );
  }

  return (
    <section className="motohub-screen simple-screen">
      <Link className="back-link" to="/profile"><ArrowLeft size={18} aria-hidden="true" />Назад в профиль</Link>
      <header className="simple-screen__header">
        <p>Модерация</p>
        <h1>Очередь заявок</h1>
        <span>Предложения пользователей и заявки на владение карточками.</span>
      </header>

      <div className="search-filter-row">
        <button className={statusFilter === 'all' ? 'is-active' : ''} type="button" onClick={() => setStatusFilter('all')}>Все</button>
        {statuses.map((status) => <button className={statusFilter === status ? 'is-active' : ''} key={status} type="button" onClick={() => setStatusFilter(status)}>{status}</button>)}
      </div>

      {notice ? <p>{notice}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      <section className="profile-group">
        <h2>Сигналы пользователей</h2>
        <div className="settings-list">
          {visitReports.map((item) => (
            <article className="favorite-row admin-review-card" key={item.id}>
              <span className="settings-list__icon"><CheckCircle2 size={19} aria-hidden="true" /></span>
              <span className="settings-list__copy">
                <strong>{item.place_id}</strong>
                <small>{item.region_id} · {item.status} · {new Date(item.created_at).toLocaleDateString('ru-RU')}</small>
                <small>{item.is_open === true ? 'Было открыто' : item.is_open === false ? 'Было закрыто' : 'Пользователь был здесь'}</small>
                {item.services_confirmed.length ? <small>Услуги: {item.services_confirmed.join(', ')}</small> : null}
                {item.comment ? <pre>{item.comment}</pre> : null}
                <span className="admin-action-row">
                  <button type="button" disabled={busyId === item.id} onClick={() => void setVisitReportStatus(item, 'accepted')}><CheckCircle2 size={15} />Принять</button>
                  <button type="button" disabled={busyId === item.id} onClick={() => void setVisitReportStatus(item, 'rejected')}><XCircle size={15} />Отклонить</button>
                </span>
              </span>
            </article>
          ))}
          {!visitReports.length ? <p>Пользовательских сигналов с таким фильтром нет.</p> : null}
        </div>
      </section>

      <section className="profile-group">
        <h2>Очередь перепроверки</h2>
        <div className="settings-list">
          {recheckItems.map((item) => (
            <article className="favorite-row admin-review-card" key={item.place_id}>
              <span className="settings-list__icon"><ShieldCheck size={19} aria-hidden="true" /></span>
              <span className="settings-list__copy">
                <strong>{item.name?.ru ?? item.place_id}</strong>
                <small>{item.region_id} · {item.category_id} · {item.recheck_status}</small>
                <small>Последняя проверка: {item.last_verification_at ? new Date(item.last_verification_at).toLocaleDateString('ru-RU') : 'нет данных'}</small>
                <Link to={`/place/${item.place_id}`}>Открыть карточку</Link>
              </span>
            </article>
          ))}
          {!recheckItems.length ? <p>Сейчас нет карточек, которым нужна перепроверка.</p> : null}
        </div>
      </section>

      <section className="profile-group">
        <h2>Предложения</h2>
        <div className="settings-list">
          {submissions.map((item) => (
            <article className="favorite-row admin-review-card" key={item.id}>
              <span className="settings-list__icon"><ClipboardList size={19} aria-hidden="true" /></span>
              <span className="settings-list__copy">
                <strong>{item.submission_type} · {item.entity_type}</strong>
                <small>{item.region_id} · {item.status} · {new Date(item.created_at).toLocaleDateString('ru-RU')}</small>
                <small>{item.entity_id ?? 'Новая карточка'}</small>
                <pre>{preview(item.proposed_data)}</pre>
                <small>{item.reason}</small>
                {messageField(item.id)}
                <span className="admin-action-row">
                  <button type="button" disabled={busyId === item.id} onClick={() => setSubmissionStatus(item.id, 'in_review')}><MessageSquare size={15} />В работу</button>
                  <button type="button" disabled={busyId === item.id} onClick={() => setSubmissionStatus(item.id, 'changes_requested')}>Уточнить</button>
                  <button type="button" disabled={busyId === item.id} onClick={() => setSubmissionStatus(item.id, 'approved')}><CheckCircle2 size={15} />Одобрить</button>
                  <button type="button" disabled={busyId === item.id} onClick={() => setSubmissionStatus(item.id, 'rejected')}><XCircle size={15} />Отклонить</button>
                </span>
              </span>
            </article>
          ))}
          {!submissions.length ? <p>Предложений с таким фильтром нет.</p> : null}
        </div>
      </section>

      <section className="profile-group">
        <h2>Заявки на владение</h2>
        <div className="settings-list">
          {claims.map((item) => (
            <article className="favorite-row admin-review-card" key={item.id}>
              <span className="settings-list__icon"><ShieldCheck size={19} aria-hidden="true" /></span>
              <span className="settings-list__copy">
                <strong>{item.place_id ?? 'Организация'}</strong>
                <small>{item.region_id} · {item.status} · {new Date(item.created_at).toLocaleDateString('ru-RU')}</small>
                <pre>{preview(item.evidence)}</pre>
                {messageField(item.id)}
                <span className="admin-action-row">
                  <button type="button" disabled={busyId === item.id} onClick={() => setClaimStatus(item.id, 'in_review')}>В работу</button>
                  <button type="button" disabled={busyId === item.id} onClick={() => setClaimStatus(item.id, 'changes_requested')}>Уточнить</button>
                  <button type="button" disabled={busyId === item.id} onClick={() => setClaimStatus(item.id, 'approved')}><CheckCircle2 size={15} />Одобрить</button>
                  <button type="button" disabled={busyId === item.id} onClick={() => setClaimStatus(item.id, 'rejected')}><XCircle size={15} />Отклонить</button>
                </span>
              </span>
            </article>
          ))}
          {!claims.length ? <p>Заявок с таким фильтром нет.</p> : null}
        </div>
      </section>
    </section>
  );
}
