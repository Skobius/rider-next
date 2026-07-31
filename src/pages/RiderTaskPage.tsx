import { AlertTriangle, ArrowLeft, CheckCircle2, ExternalLink, List, MapPinned, Share2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { guides } from '../data/guides';
import { findRiderTaskBySlug } from '../data/riderTasks';
import { skills } from '../data/skills';
import { useBackendContent } from '../shared/content/backendContent';
import { getLocalizedText } from '../shared/i18n/localizedText';
import { useI18n } from '../shared/i18n/useI18n';
import { useGuestSettings } from '../shared/storage/guestSettings';
import { ImageWithFallback } from '../shared/ui/ImageWithFallback';
import { PlaceCard } from '../shared/ui/PlaceCard';
import { showToast } from '../shared/ui/toastStore';

type TaskViewMode = 'list' | 'map';

function getUrgencyLabel(level: string) {
  if (level === 'high') return 'Срочно';
  if (level === 'medium') return 'В ближайшее время';
  return 'Можно спокойно подготовиться';
}

export function RiderTaskPage() {
  const { slug } = useParams();
  const location = useLocation();
  const { language } = useI18n();
  const settings = useGuestSettings();
  const backendContent = useBackendContent();
  const [viewMode, setViewMode] = useState<TaskViewMode>('list');
  const task = findRiderTaskBySlug(slug);

  const from = typeof location.state === 'object' && location.state && 'from' in location.state
    ? String(location.state.from)
    : '/search';

  const relatedPlaces = useMemo(() => {
    if (!task) return [];
    const byRecommended = task.recommendedPlaceIds ?? [];
    return backendContent.places
      .filter((place) => place.regionId === settings.regionId)
      .filter((place) => byRecommended.includes(place.id) || task.relatedPlaceCategoryIds.includes(place.categoryId))
      .sort((a, b) => {
        const aPriority = byRecommended.indexOf(a.id);
        const bPriority = byRecommended.indexOf(b.id);
        if (aPriority !== -1 || bPriority !== -1) return (aPriority === -1 ? 99 : aPriority) - (bPriority === -1 ? 99 : bPriority);
        return Number(b.verified) - Number(a.verified);
      });
  }, [backendContent.places, settings.regionId, task]);

  if (!task) return <Navigate to="/search" replace />;

  const currentTask = task;
  const title = getLocalizedText(task.title, language);
  const relatedGuides = guides.filter((guide) => task.relatedGuideIds.includes(guide.id));
  const relatedSkills = skills.filter((skill) => task.relatedSkillIds.includes(skill.id));
  const mapPath = `/map?task=${task.slug}`;

  async function shareTask() {
    const url = typeof window === 'undefined' ? `/tasks/${currentTask.slug}` : window.location.href;
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({ title, url });
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      showToast('Ссылка скопирована');
    }
  }

  return (
    <section className="motohub-screen simple-screen detail-screen task-detail-screen">
      <Link className="back-link" to={from}>
        <ArrowLeft size={18} aria-hidden="true" />
        Назад
      </Link>

      <article className="detail-hero-card">
        <ImageWithFallback src={task.coverImage} alt={title} />
        <div className="detail-hero-card__shade" />
        <div className="detail-hero-card__content">
          <span className="detail-kicker"><CheckCircle2 size={15} /> Задача мотоциклиста</span>
          <h1>{title}</h1>
          <p>{getLocalizedText(task.shortDescription, language)}</p>
          <div className="detail-badge-row">
            <span>{getUrgencyLabel(task.urgency.level)}</span>
          </div>
        </div>
      </article>

      <section className="detail-block task-answer-block">
        <span>Короткий ответ</span>
        <p>{getLocalizedText(task.quickAnswer, language)}</p>
      </section>

      <section className="soft-callout task-urgency-callout">
        <span><AlertTriangle size={17} /> Насколько срочно</span>
        <p>{getLocalizedText(task.urgency.text, language)}</p>
      </section>

      <section className="detail-block">
        <span>Что проверить самостоятельно</span>
        <div className="detail-list">
          {task.selfCheck.map((item) => (
            <p key={item.ru}><CheckCircle2 size={16} /> {getLocalizedText(item, language)}</p>
          ))}
        </div>
      </section>

      <section className="detail-block">
        <span>Что подготовить перед обращением</span>
        <div className="detail-list">
          {task.prepareBeforeContact.map((item) => (
            <p key={item.ru}><CheckCircle2 size={16} /> {getLocalizedText(item, language)}</p>
          ))}
        </div>
      </section>

      {task.safetyWarning ? (
        <section className="soft-callout place-warning-callout">
          <span><AlertTriangle size={17} /> Важно</span>
          <p>{getLocalizedText(task.safetyWarning, language)}</p>
        </section>
      ) : null}

      <section className="detail-block">
        <div className="task-section-heading">
          <span>Подходящие места</span>
          <div className="search-filter-row task-view-toggle" aria-label="Вид мест">
            <button className={viewMode === 'list' ? 'is-active' : ''} type="button" onClick={() => setViewMode('list')}><List size={15} /> Список</button>
            <button className={viewMode === 'map' ? 'is-active' : ''} type="button" onClick={() => setViewMode('map')}><MapPinned size={15} /> Карта</button>
          </div>
        </div>

        {viewMode === 'map' ? (
          <div className="empty-state task-map-shortcut">
            <div><MapPinned size={28} aria-hidden="true" /></div>
            <h2>Открыть места на карте</h2>
            <p>Карта покажет места выбранного региона. Фильтр по задаче можно будет расширить на следующем backend-этапе.</p>
            <Link className="profile-primary-action" to={mapPath}>Открыть карту</Link>
          </div>
        ) : relatedPlaces.length ? (
          <div className="search-results-list">
            {relatedPlaces.map((place) => <PlaceCard key={place.id} place={place} from={`/tasks/${task.slug}`} />)}
          </div>
        ) : (
          <div className="empty-state task-map-shortcut">
            <h2>В этом регионе пока нет подходящих мест</h2>
            <p>Сама инструкция работает, а региональные места появятся после наполнения и проверки.</p>
            <Link className="profile-primary-action" to="/feedback">Предложить место</Link>
          </div>
        )}
      </section>

      {relatedGuides.length ? (
        <section className="detail-block">
          <span>Связанные материалы</span>
          <div className="related-category-list">
            {relatedGuides.map((guide) => (
              <Link to={`/guides/${guide.slug}`} key={guide.id}>
                <strong>{getLocalizedText(guide.title, language)}</strong>
                <ExternalLink size={15} aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {relatedSkills.length ? (
        <section className="detail-block">
          <span>Связанные навыки</span>
          <div className="related-category-list">
            {relatedSkills.map((skill) => (
              <Link to={`/skill/${skill.id}`} key={skill.id}>
                <strong>{getLocalizedText(skill.title, language)}</strong>
                <ExternalLink size={15} aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <div className="place-bottom-actions">
        <Link to={task.cta.to}>{getLocalizedText(task.cta.label, language)}</Link>
        <button type="button" onClick={shareTask}><Share2 size={16} /> Поделиться</button>
      </div>
    </section>
  );
}
