import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  LocateFixed,
  MapPin,
  MessageSquare,
  Phone,
  ShieldCheck,
  Tag,
  UserRound,
  XCircle,
} from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';
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
  changes_requested: 'Нужно уточнение',
  approved: 'Одобрено',
  rejected: 'Отклонено',
  cancelled: 'Отменено',
};

const finalStatuses: ReviewStatus[] = ['approved', 'rejected', 'cancelled'];

const visitStatusLabels: Record<VisitReportRow['status'], string> = {
  submitted: 'На проверке',
  accepted: 'Принято',
  rejected: 'Отклонено',
};

const recheckStatusLabels: Record<string, string> = {
  due_soon: 'Скоро перепроверка',
  expired: 'Нужна перепроверка',
  stale: 'Давно не проверялось',
  missing: 'Нет проверки',
};

function text(value: unknown) {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return '';
}

function preview(value: unknown) {
  if (!value) return 'Нет данных';
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString('ru-RU') : 'Нет данных';
}

function getCategoryTitle(categoryId: string, language: 'ru' | 'en') {
  const category = appCategories.find((item) => item.id === categoryId);
  return category ? getLocalizedText(category.title, language) : categoryId || 'Не указана';
}

function getPersonLabel(value?: unknown) {
  if (typeof value !== 'string') return 'Пользователь';
  if (!value || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) return 'Пользователь';
  return value;
}

function getQueueTitle(statusFilter: ReviewStatus | 'all') {
  if (statusFilter === 'all') return 'Все заявки';
  return statusLabels[statusFilter];
}

function getRecheckStatusLabel(status: string) {
  return recheckStatusLabels[status] ?? 'Нужна проверка';
}

function statusClass(status: ReviewStatus | VisitReportRow['status']) {
  if (status === 'approved' || status === 'accepted') return 'moderation-status--approved';
  if (status === 'rejected') return 'moderation-status--rejected';
  if (status === 'changes_requested') return 'moderation-status--changes';
  return 'moderation-status--pending';
}

function infoLine(label: string, value: string, icon: ReactNode, wide = false) {
  return (
    <span className={`moderation-field ${wide ? 'moderation-field--wide' : ''}`}>
      <b>{icon}{label}</b>
      <small>{value || 'Не указано'}</small>
    </span>
  );
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
      setError('Для уточнения или отклонения нужен комментарий заявителю.');
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

  function messageField(id: string, placeholder = 'Комментарий заявителю') {
    return (
      <label className="moderation-comment">
        <span>Комментарий</span>
        <input
          className="auth-input"
          value={messageById[id] ?? ''}
          onChange={(event) => setMessageById((current) => ({ ...current, [id]: event.target.value }))}
          placeholder={placeholder}
        />
      </label>
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
    <section className="motohub-screen simple-screen moderation-screen">
      <Link className="back-link" to="/profile"><ArrowLeft size={18} aria-hidden="true" />Назад в профиль</Link>
      <header className="simple-screen__header">
        <p>Модерация</p>
        <h1>Заявки пользователей</h1>
        <span>Проверяйте новые места, уточнения и служебные заявки без лишнего шума.</span>
      </header>

      <div className="search-filter-row moderation-filter-row">
        <button className={statusFilter === 'all' ? 'is-active' : ''} type="button" onClick={() => setStatusFilter('all')}>Все</button>
        {statuses.map((status) => <button className={statusFilter === status ? 'is-active' : ''} key={status} type="button" onClick={() => setStatusFilter(status)}>{statusLabels[status]}</button>)}
      </div>

      {notice ? <p className="form-success">{notice}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      <section className="profile-group moderation-primary-section">
        <div className="moderation-section-heading">
          <div>
            <h2>{getQueueTitle(statusFilter)}</h2>
            <p>Новые предложения мест и изменения, которые требуют решения модератора.</p>
          </div>
          <span>{submissions.length}</span>
        </div>

        <div className="moderation-list">
          {submissions.map((item) => {
            const data = item.proposed_data ?? {};
            const isPlaceProposal = item.entity_type === 'place' && item.submission_type === 'create_entity';
            const duplicates = duplicatesById[item.id] ?? [];
            const title = isPlaceProposal ? text(data.title) || 'Новое место' : `${item.submission_type} · ${item.entity_type}`;
            const canReview = !finalStatuses.includes(item.status);

            return (
              <article className="moderation-card" key={item.id}>
                <header className="moderation-card__header">
                  <div>
                    <span className="moderation-eyebrow"><ClipboardList size={15} /> Заявка</span>
                    <h3>{title}</h3>
                  </div>
                  <span className={`moderation-status ${statusClass(item.status)}`}>{statusLabels[item.status]}</span>
                </header>

                <div className="moderation-meta-grid">
                  {infoLine('Дата', formatDate(item.created_at), <CalendarDays size={14} />)}
                  {infoLine('Автор', getPersonLabel(), <UserRound size={14} />)}
                  {infoLine('Регион', getRegionLabel(item.region_id), <MapPin size={14} />)}
                  {infoLine('Категория', isPlaceProposal ? getCategoryTitle(text(data.category_id), language) : item.entity_type, <Tag size={14} />)}
                  {isPlaceProposal ? infoLine('Адрес', text(data.address), <MapPin size={14} />, true) : null}
                  {isPlaceProposal ? infoLine('Контакты', [text(data.phone), text(data.website)].filter(Boolean).join(' · '), <Phone size={14} />, true) : null}
                  {isPlaceProposal ? infoLine('Координаты', text(data.lng) && text(data.lat) ? `${text(data.lng)}, ${text(data.lat)}` : '', <LocateFixed size={14} />) : null}
                  {item.reason ? infoLine('Причина', item.reason, <MessageSquare size={14} />, true) : null}
                </div>

                {isPlaceProposal ? (
                  <div className="moderation-copy-grid">
                    <div className="moderation-copy-block">
                      <b><FileText size={14} /> Описание</b>
                      <p>{text(data.description) || 'Описание не указано.'}</p>
                    </div>
                    <div className="moderation-copy-block">
                      <b><MessageSquare size={14} /> Источник и дополнительно</b>
                      <p>{[text(data.source_comment), text(data.extra)].filter(Boolean).join('\n') || 'Дополнительной информации нет.'}</p>
                    </div>
                  </div>
                ) : (
                  <pre className="moderation-json">{preview(item.proposed_data)}</pre>
                )}

                {duplicates.length ? (
                  <div className="soft-callout submission-duplicates moderation-duplicates">
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

                {item.published_entity_id ? <Link className="moderation-inline-link" to={`/place/${item.published_entity_id}`}>Открыть опубликованную карточку</Link> : null}

                {canReview ? (
                  <div className="moderation-actions-panel">
                    <p>Комментарий нужен, если отправляете заявку на уточнение или отклоняете её.</p>
                    {messageField(item.id, 'Что нужно уточнить или почему заявка отклонена')}
                    <div className="moderation-action-row">
                      {isPlaceProposal && item.status === 'submitted' ? (
                        <button className="moderation-action moderation-action--approve" type="button" disabled={busyId === item.id} onClick={() => approvePlaceSubmission(item)}><CheckCircle2 size={16} />Одобрить</button>
                      ) : (
                        <button className="moderation-action moderation-action--approve" type="button" disabled={busyId === item.id} onClick={() => setSubmissionStatus(item, 'approved')}><CheckCircle2 size={16} />Одобрить</button>
                      )}
                      <button className="moderation-action moderation-action--clarify" type="button" disabled={busyId === item.id} onClick={() => setSubmissionStatus(item, 'changes_requested')}><MessageSquare size={16} />Нужно уточнение</button>
                      <button className="moderation-action moderation-action--reject" type="button" disabled={busyId === item.id} onClick={() => setSubmissionStatus(item, 'rejected')}><XCircle size={16} />Отклонить</button>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
          {!submissions.length ? <p className="version-note">Заявок с таким фильтром нет.</p> : null}
        </div>
      </section>

      <section className={`profile-group moderation-secondary-section ${visitReports.length ? '' : 'moderation-empty-section'}`}>
        <div className="moderation-section-heading">
          <div>
            <h2>Сигналы пользователей</h2>
            <p>Сообщения о посещениях и актуальности карточек.</p>
          </div>
          <span>{visitReports.length}</span>
        </div>
        <div className="moderation-list moderation-list--compact">
          {visitReports.length ? visitReports.map((item) => (
            <article className="moderation-card moderation-card--compact" key={item.id}>
              <header className="moderation-card__header">
                <div>
                  <span className="moderation-eyebrow"><CheckCircle2 size={15} /> Сигнал</span>
                  <h3>Сигнал по месту</h3>
                </div>
                <span className={`moderation-status ${statusClass(item.status)}`}>{visitStatusLabels[item.status]}</span>
              </header>
              <div className="moderation-meta-grid">
                {infoLine('Дата', formatDate(item.created_at), <CalendarDays size={14} />)}
                {infoLine('Автор', getPersonLabel(), <UserRound size={14} />)}
                {infoLine('Статус места', item.is_open === true ? 'Было открыто' : item.is_open === false ? 'Было закрыто' : 'Пользователь был здесь', <ShieldCheck size={14} />)}
                {infoLine('Услуги', item.services_confirmed.join(', '), <Tag size={14} />)}
              </div>
              {item.comment ? <div className="moderation-copy-block"><b>Комментарий</b><p>{item.comment}</p></div> : null}
              <div className="moderation-action-row moderation-action-row--small">
                <button className="moderation-action moderation-action--approve" type="button" disabled={busyId === item.id} onClick={() => void setVisitReportStatus(item, 'accepted')}><CheckCircle2 size={16} />Принять</button>
                <button className="moderation-action moderation-action--reject" type="button" disabled={busyId === item.id} onClick={() => void setVisitReportStatus(item, 'rejected')}><XCircle size={16} />Отклонить</button>
              </div>
            </article>
          )) : <p className="moderation-empty-note">Нет заявок.</p>}
        </div>
      </section>

      <section className="profile-group moderation-secondary-section">
        <div className="moderation-section-heading">
          <div>
            <h2>Очередь перепроверки</h2>
            <p>Вторичный список карточек, у которых пора проверить актуальность.</p>
          </div>
          <span>{recheckItems.length}</span>
        </div>
        <div className="moderation-list moderation-list--compact">
          {recheckItems.map((item) => (
            <article className="moderation-card moderation-card--compact" key={item.place_id}>
              <header className="moderation-card__header">
                <div>
                  <span className="moderation-eyebrow"><ShieldCheck size={15} /> Перепроверка</span>
                  <h3>{item.name?.ru ?? item.place_id}</h3>
                </div>
                <span className="moderation-status moderation-status--changes">{getRecheckStatusLabel(item.recheck_status)}</span>
              </header>
              <div className="moderation-meta-grid">
                {infoLine('Регион', getRegionLabel(item.region_id), <MapPin size={14} />)}
                {infoLine('Категория', getCategoryTitle(item.category_id, language), <Tag size={14} />)}
                {infoLine('Последняя проверка', formatDate(item.last_verification_at), <CalendarDays size={14} />)}
                {infoLine('Ближайший срок', formatDate(item.nearest_expires_at), <CalendarDays size={14} />)}
              </div>
              <Link className="moderation-inline-link" to={`/place/${item.place_id}`}>Открыть карточку</Link>
            </article>
          ))}
          {!recheckItems.length ? <p className="version-note">Сейчас нет карточек, которым нужна перепроверка.</p> : null}
        </div>
      </section>

      <section className={`profile-group moderation-secondary-section ${claims.length ? '' : 'moderation-empty-section'}`}>
        <div className="moderation-section-heading">
          <div>
            <h2>Заявки на владение</h2>
            <p>Отдельный поток для владельцев карточек.</p>
          </div>
          <span>{claims.length}</span>
        </div>
        <div className="moderation-list moderation-list--compact">
          {claims.length ? claims.map((item) => {
            const canReview = !finalStatuses.includes(item.status);
            return (
              <article className="moderation-card moderation-card--compact" key={item.id}>
                <header className="moderation-card__header">
                  <div>
                    <span className="moderation-eyebrow"><ShieldCheck size={15} /> Владение</span>
                    <h3>{item.place_id ?? 'Организация'}</h3>
                  </div>
                  <span className={`moderation-status ${statusClass(item.status)}`}>{statusLabels[item.status]}</span>
                </header>
                <div className="moderation-meta-grid">
                  {infoLine('Регион', item.region_id, <MapPin size={14} />)}
                  {infoLine('Дата', formatDate(item.created_at), <CalendarDays size={14} />)}
                </div>
                <pre className="moderation-json">{preview(item.evidence)}</pre>
                {canReview ? (
                  <div className="moderation-actions-panel">
                    {messageField(item.id, 'Комментарий заявителю, если нужен')}
                    <div className="moderation-action-row">
                      <button className="moderation-action moderation-action--clarify" type="button" disabled={busyId === item.id} onClick={() => setClaimStatus(item.id, 'changes_requested')}>Нужно уточнение</button>
                      <button className="moderation-action moderation-action--approve" type="button" disabled={busyId === item.id} onClick={() => setClaimStatus(item.id, 'approved')}><CheckCircle2 size={16} />Одобрить</button>
                      <button className="moderation-action moderation-action--reject" type="button" disabled={busyId === item.id} onClick={() => setClaimStatus(item.id, 'rejected')}><XCircle size={16} />Отклонить</button>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          }) : <p className="moderation-empty-note">Нет заявок.</p>}
        </div>
      </section>
    </section>
  );
}
