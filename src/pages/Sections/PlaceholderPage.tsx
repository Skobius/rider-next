import { ArrowLeft, ChevronRight, Hammer, Search } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { appSections } from '../../data/sections';
import { sectionTasks } from '../../data/sectionTasks';
import { getTaskPath } from '../../features/sections/sectionLinks';
import { getLocalizedText } from '../../shared/i18n/localizedText';
import { useI18n } from '../../shared/i18n/useI18n';
import { getContentIcon } from '../../shared/ui/contentIcons';

export function PlaceholderPage() {
  const { id } = useParams();
  const { language, t } = useI18n();
  const task = sectionTasks.find((item) => item.id === id);

  if (!task) return <Navigate to="/sections" replace />;

  const section = appSections.find((item) => item.id === task.sectionId);
  const relatedTasks = sectionTasks.filter((item) => item.sectionId === task.sectionId && item.id !== task.id).slice(0, 4);
  const Icon = getContentIcon(task.icon);

  return (
    <section className="motohub-screen simple-screen detail-screen">
      <Link className="back-link" to={section ? `/sections/${section.slug}` : '/sections'}>
        <ArrowLeft size={18} aria-hidden="true" />
        {section ? getLocalizedText(section.title, language) : t('sections.allSections')}
      </Link>

      <section className="placeholder-card">
        <div className="placeholder-card__icon"><Icon size={34} /></div>
        <p>{t('placeholder.kicker')}</p>
        <h1>{getLocalizedText(task.title, language)}</h1>
        <span>{task.description ? getLocalizedText(task.description, language) : t('placeholder.defaultDescription')}</span>
      </section>

      <section className="soft-callout detail-mg67-callout">
        <span><Hammer size={17} /> {t('placeholder.preparingTitle')}</span>
        <p>{t('placeholder.preparingText')}</p>
        <Link className="profile-primary-action" to={`/feedback?task=${task.id}`}>{t('placeholder.feedbackButton')}</Link>
      </section>

      <section className="motohub-section">
        <h2>{t('placeholder.related')}</h2>
        <div className="settings-list">
          {relatedTasks.map((item) => {
            const RelatedIcon = getContentIcon(item.icon);
            return (
              <Link className="favorite-row" to={getTaskPath(item)} key={item.id}>
                <span className="settings-list__icon"><RelatedIcon size={18} /></span>
                <span className="settings-list__copy">
                  <strong>{getLocalizedText(item.title, language)}</strong>
                  <small>{t('placeholder.relatedHint')}</small>
                </span>
                <ChevronRight size={18} />
              </Link>
            );
          })}
        </div>
      </section>

      <Link className="profile-primary-action profile-secondary-action" to="/search">
        <Search size={18} />
        {t('placeholder.searchInstead')}
      </Link>
    </section>
  );
}
