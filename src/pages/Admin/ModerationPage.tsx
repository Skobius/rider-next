import { ArrowLeft, CheckCircle2, ClipboardList, MessageSquare, ShieldCheck, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { appCategories } from '../../data/categories';
import { getRegionLabel } from '../../data/regions';
import { useUserRoles } from '../../shared/auth/useUserRoles';
import { notifyBackendContentUpdated } from '../../shared/content/backendContent';
import { getLocalizedText } from '../../shared/i18n/localizedText';
import { useI18n } from '../../shared/i18n/useI18n';
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
  author_id: string;
  published_entity_id: string | null;
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

interface DuplicateRow {
  place_id: string;
  title: string;
  reason: string;
}

const statuses: ReviewStatus[] = ['submitted', 'in_review', 'changes_requested', 'approved', 'rejected', 'cancelled'];

const statusLabels: Record<ReviewStatus, string> = {
  submitted: 'На проверке',
  in_review: 'В работе',
  changes_requested: 'Нужны уточнения',
  approved: 'Одобрено',
  rejected: 'Отклонено',
  cancelled: 'Отменено',
};

function text(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function preview(value: unknown) {
  if (!value) return 'Нет данных';
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
}

function getCategoryTitle(categoryId: string, language: 'ru' | 'en') {
  const category = appCategories.find((item) => item.id === categoryId);
  return category ? getLocalizedText(category.title, language) : categoryId;
}

export function ModerationPage() {
  const { user, loading, isModerator } = useUserRoles();
  const { language } = useI18n();
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [claims, setClaims] = useState<ClaimRow[]>([]);
  const [visitReports, setVisitReports] = useState<VisitReportRow[]>([]);
  const [recheckItems, setRecheckItems] = useState<RecheckQueueRow[]>([]);
  const [duplicatesById, setDuplicatesById] = useState<Record<string, DuplicateRow[]>>({});
  const [duplicateConfirmedById, setDuplicateConfirmedById] = useState<Record<string, boolean>>({});
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'all'>('submitted');
  const [messageById, setMessageById] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  async function loadItems() {
    if (!supabase || !user || !isModerator) return;

    let submissionQuery = supabase
      .from('content_submissions')
      .select('id, entity_type, entity_id, submission_type, region_id, status, reason, proposed_data, author_id, published_entity_id, created_at')
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
    const nextSubmissions = (submissionData ?? []) as unknown as SubmissionRow[];
    setSubmissions(nextSubmissions);
    setClaims((claimData ?? []) as unknown as ClaimRow[]);
    setVisitReports((visitReportData ?? []) as unknown as VisitReportRow[]);
    setRecheckItems((recheckData ?? []) as unknown as RecheckQueueRow[]);

    const pendingPlaceSubmissions = nextSubmissions.filter((item) => item.entity_type === 'place' && item.submission_type === 'create_entity' && item.status === 'submitted');
    const duplicatePairs = await Promise.all(pendingPlaceSubmissions.map(async (item) => {
      const { data } = await supabase!.rpc('find_place_submission_duplicates', { p_submission_id: item.id });
      return [item.id, (data ?? []) as DuplicateRow[]] as const;
    }));
    setDuplicatesById(Object.fromEntries(duplicatePairs));
  }

  useEffect(() => {
    void loadItems();
  }, [user, isModerator, statusFilter]);

  function requireMessage(id: string) {
    return messageById[id]?.trim() ?? '';
  }

  async function setSubmissionStatus(item: SubmissionRow, nextStatus: ReviewStatus) {
    if (!supabase) return;
    const message = requireMessage(item.id);
    if ((nextStatus === 'changes_requested' || nextStatus === 'rejected') && !message) {
      setError('Для уточнений или отклонения нужен комментарий заявителю.');
      return;
    }

    setBusyId(item.id);
    setNotice('');
    setError('');

    const { error: rpcError } = await supabase.rpc('set_submission_status', {
      submission_id: item.id,
      next_status: nextStatus,
      public_message: message || null,
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

  async function approvePlaceSubmission(item: SubmissionRow) {
    if (!supabase) return;
    setBusyId(item.id);
    setNotice('');
    setError('');

    const { data, error: rpcError } = await supabase.rpc('approve_place_submission', {
      p_submission_id: item.id,
      p_duplicate_confirmed: duplicateConfirmedById[item.id] ?? false,
    });

    setBusyId('');
    if (rpcError) {
      setError(rpcError.message.includes('possible duplicate')
        ? 'Найден возможный дубль. Подтвердите, что всё равно нужно создать новое место.'
        : 'Не удалось одобрить предложение.');
      return;
    }

    notifyBackendContentUpdated();
    setNotice(`Место опубликовано: ${String((data as { slug?: string } | null)?.slug ?? '')}`);
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

  function messageField(id: string, placeholder = 'Комментарий заявителю, если нужен') {
    return (
      <input
        className="auth-input"
        value={messageById[id] ?? ''}
        onChange={(event) => setMessageById((current) => ({ ...current, [id]: event.target.value }))}
        placeholder={placeholder}
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
        <span>Предложения новых мест, пользовательские сигналы и заявки на владение карточками.</span>
      </header>

      <div className="search-filter-row">
        <button className={statusFilter === 'all' ? 'is-active' : ''} type="button" onClick={() => setStatusFilter('all')}>Все</button>
        {statuses.map((status) => <button className={statusFilter === status ? 'is-active' : ''} key={status} type="button" onClick={() => setStatusFilter(status)}>{statusLabels[status]}</button>)}
      </div>

      {notice ? <p>{notice}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      <section className="profile-group">
        <h2>Предложения мест</h2>
        <div className="settings-list">
          {submissions.map((item) => {
            const data = item.proposed_data ?? {};
            const isPlaceProposal = item.entity_type === 'place' && item.submission_type === 'create_entity';
            const duplicates = duplicatesById[item.id] ?? [];
            return (
              <article className="favorite-row admin-review-card" key={item.id}>
                <span className="settings-list__icon"><ClipboardList size={19} aria-hidden="true" /></span>
                <span className="settings-list__copy">
                  <strong>{isPlaceProposal ? text(data.title) || 'Новое место' : `${item.submission_type} · ${item.entity_type}`}</strong>
                  <small>{getRegionLabel(item.region_id)} · {statusLabels[item.status]} · {new Date(item.created_at).toLocaleDateString('ru-RU')}</small>
                  <small>Автор: {item.author_id}</small>
                  {isPlaceProposal ? (
                    <div className="submission-review-grid">
                      <span><b>Категория</b>{getCategoryTitle(text(data.category_id), language)}</span>
                      <span><b>Адрес</b>{text(data.address)}</span>
                      <span><b>Контакты</b>{[text(data.phone), text(data.website)].filter(Boolean).join(' · ') || 'Не указаны'}</span>
                      <span><b>График</b>{text(data.schedule) || 'Не указан'}</span>
                      <span><b>Координаты</b>{text(data.lng) && text(data.lat) ? `${text(data.lng)}, ${text(data.lat)}` : 'Не указаны'}</span>
                      <span><b>Источник</b>{text(data.source_comment)}</span>
                      <span className="submission-review-grid__wide"><b>Описание</b>{text(data.description)}</span>
                      {text(data.extra) ? <span className="submission-review-grid__wide"><b>Дополнительно</b>{text(data.extra)}</span> : null}
                    </div>
                  ) : (
                    <pre>{preview(item.proposed_data)}</pre>
                  )}
                  {duplicates.length ? (
                    <div className="soft-callout submission-duplicates">
                      <strong>Возможные совпадения</strong>
                      {duplicates.map((duplicate) => (
                        <Link to={`/place/${duplicate.place_id}`} key={duplicate.place_id}>
                          {duplicate.title} · {duplicate.reason}
                        </Link>
                      ))}
                      <label className="auth-consent admin-checkbox">
                        <input
                          type="checkbox"
                          checked={duplicateConfirmedById[item.id] ?? false}
                          onChange={(event) => setDuplicateConfirmedById((current) => ({ ...current, [item.id]: event.target.checked }))}
                        />
                        Всё равно создать новое место
                      </label>
                    </div>
                  ) : null}
                  {item.published_entity_id ? <Link to={`/place/${item.published_entity_id}`}>Открыть опубликованную карточку</Link> : null}
                  {messageField(item.id, 'Комментарий обязателен для уточнения или отклонения')}
                  <span className="admin-action-row">
                    <button type="button" disabled={busyId === item.id} onClick={() => setSubmissionStatus(item, 'in_review')}><MessageSquare size={15} />В работу</button>
                    <button type="button" disabled={busyId === item.id} onClick={() => setSubmissionStatus(item, 'changes_requested')}>Уточнить</button>
                    {isPlaceProposal && item.status === 'submitted' ? (
                      <button type="button" disabled={busyId === item.id} onClick={() => approvePlaceSubmission(item)}><CheckCircle2 size={15} />Одобрить</button>
                    ) : (
                      <button type="button" disabled={busyId === item.id} onClick={() => setSubmissionStatus(item, 'approved')}><CheckCircle2 size={15} />Одобрить статус</button>
                    )}
                    <button type="button" disabled={busyId === item.id} onClick={() => setSubmissionStatus(item, 'rejected')}><XCircle size={15} />Отклонить</button>
                  </span>
                </span>
              </article>
            );
          })}
          {!submissions.length ? <p>Предложений с таким фильтром нет.</p> : null}
        </div>
      </section>

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
        <h2>Заявки на владение</h2>
        <div className="settings-list">
          {claims.map((item) => (
            <article className="favorite-row admin-review-card" key={item.id}>
              <span className="settings-list__icon"><ShieldCheck size={19} aria-hidden="true" /></span>
              <span className="settings-list__copy">
                <strong>{item.place_id ?? 'Организация'}</strong>
                <small>{item.region_id} · {statusLabels[item.status]} · {new Date(item.created_at).toLocaleDateString('ru-RU')}</small>
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
