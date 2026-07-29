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

    const [{ data: submissionData }, { data: claimData }] = await Promise.all([submissionQuery, claimQuery]);
    setSubmissions((submissionData ?? []) as unknown as SubmissionRow[]);
    setClaims((claimData ?? []) as unknown as ClaimRow[]);
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
