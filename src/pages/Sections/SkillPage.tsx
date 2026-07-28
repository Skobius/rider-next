import { AlertTriangle, ArrowLeft, CheckCircle2, Clock, ExternalLink, ShieldCheck } from 'lucide-react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { findSkillById } from '../../data/skills';
import { getLocalizedText } from '../../shared/i18n/localizedText';
import { useI18n } from '../../shared/i18n/useI18n';
import { ImageWithFallback } from '../../shared/ui/ImageWithFallback';

export function SkillPage() {
  const { id } = useParams();
  const location = useLocation();
  const { language, t } = useI18n();
  const skill = findSkillById(id);

  if (!skill) return <Navigate to="/sections/skills" replace />;

  const from = typeof location.state === 'object' && location.state && 'from' in location.state
    ? String(location.state.from)
    : '/sections/skills';
  const title = getLocalizedText(skill.title, language);
  const feedbackLabel = t('sections.guideFeedbackButton');
  const feedbackParams = new URLSearchParams({
    category: 'idea',
    sourceType: 'skill',
    sourceId: skill.id,
    sourceTitle: title,
    currentUrl: typeof window === 'undefined' ? `/skill/${skill.id}` : window.location.href,
  });

  return (
    <section className="motohub-screen simple-screen detail-screen">
      <Link className="back-link" to={from}>
        <ArrowLeft size={18} aria-hidden="true" />
        {t('details.back')}
      </Link>

      <article className="detail-hero-card">
        <ImageWithFallback src={skill.image} alt={title} />
        <div className="detail-hero-card__shade" />
        <div className="detail-hero-card__content">
          <span className="detail-kicker"><ShieldCheck size={15} /> {t('sections.skill')}</span>
          <h1>{title}</h1>
          <p>{getLocalizedText(skill.description, language)}</p>
          <div className="detail-badge-row">
            <span><Clock size={14} /> {getLocalizedText(skill.badge, language)}</span>
          </div>
        </div>
      </article>

      <section className="detail-block">
        <span>{t('sections.shortAnswer')}</span>
        <h2>{getLocalizedText(skill.purpose, language)}</h2>
        <p>{getLocalizedText(skill.main, language)}</p>
      </section>

      <section className="detail-block">
        <span>{t('sections.whatNow')}</span>
        <div className="detail-list">
          <p><CheckCircle2 size={16} /> {getLocalizedText(skill.practice, language)}</p>
          <p><CheckCircle2 size={16} /> {getLocalizedText(skill.criterion, language)}</p>
        </div>
      </section>

      <section className="soft-callout place-warning-callout">
        <span><AlertTriangle size={17} /> {t('details.warnings')}</span>
        <p>{getLocalizedText(skill.safety, language)}</p>
      </section>

      <section className="detail-block">
        <span>{t('guides.relatedMaterials')}</span>
        <div className="chip-list">
          {skill.related.map((item) => <span key={item.ru}>{getLocalizedText(item, language)}</span>)}
        </div>
      </section>

      <section className="detail-block">
        <span>Источник</span>
        <p><a href={skill.source} target="_blank" rel="noreferrer">{skill.source} <ExternalLink size={14} /></a></p>
      </section>

      <section className="soft-callout detail-mg67-callout">
        <span>MG67</span>
        <strong>{t('placeholder.feedbackTitle')}</strong>
        <p>{t('placeholder.feedbackText')}</p>
        <Link className="profile-primary-action" to={`/feedback?${feedbackParams.toString()}`}>{feedbackLabel}</Link>
      </section>
    </section>
  );
}
