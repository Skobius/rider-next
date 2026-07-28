import { AlertTriangle, ArrowLeft, CheckCircle2, Clock, Lightbulb } from 'lucide-react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { guides } from '../../data/guides';
import { appSections } from '../../data/sections';
import { getLocalizedText } from '../../shared/i18n/localizedText';
import { useI18n } from '../../shared/i18n/useI18n';
import { ImageWithFallback } from '../../shared/ui/ImageWithFallback';

function findGuideBySlug(slug: string | undefined) {
  if (!slug) return undefined;
  return guides.find((guide) => guide.slug === slug);
}

export function GuidePage() {
  const { slug } = useParams();
  const location = useLocation();
  const { language, t } = useI18n();
  const guide = findGuideBySlug(slug);

  if (!guide) return <Navigate to="/sections" replace />;

  const section = appSections.find((item) => item.id === guide.sectionId);
  const from = typeof location.state === 'object' && location.state && 'from' in location.state
    ? String(location.state.from)
    : undefined;
  const sectionPath = from || (section ? `/sections/${section.slug}` : '/sections');
  const title = getLocalizedText(guide.title, language);
  const feedbackLabel = t('sections.guideFeedbackButton');
  const hasFeedbackLabel = feedbackLabel && feedbackLabel !== 'sections.guideFeedbackButton';
  const feedbackParams = new URLSearchParams({
    category: 'idea',
    sourceType: 'guide',
    sourceId: guide.id,
    sourceTitle: title,
    currentUrl: typeof window === 'undefined' ? `/guides/${guide.slug}` : window.location.href,
  });

  if (!hasFeedbackLabel) {
    console.warn('[i18n] Missing GuidePage feedback button label');
  }

  return (
    <section className="motohub-screen simple-screen detail-screen">
      <Link className="back-link" to={sectionPath}>
        <ArrowLeft size={18} aria-hidden="true" />
        {section ? getLocalizedText(section.title, language) : t('sections.allSections')}
      </Link>

      <article className="detail-hero-card">
        <ImageWithFallback src={guide.image} alt={title} />
        <div className="detail-hero-card__shade" />
        <div className="detail-hero-card__content">
          <span className="detail-kicker"><Lightbulb size={15} /> {t('sections.guide')}</span>
          <h1>{title}</h1>
          <p>{getLocalizedText(guide.shortDescription, language)}</p>
          <div className="detail-badge-row">
            <span><Clock size={14} /> {guide.status === 'published' ? t('guides.reviewed') : t('sections.filling')}</span>
          </div>
        </div>
      </article>

      {guide.status === 'published' ? (
        <>
          {guide.lead ? (
            <section className="detail-block">
              <span>{t('guides.main')}</span>
              <p>{getLocalizedText(guide.lead, language)}</p>
            </section>
          ) : null}

          {guide.keyPoints?.length ? (
            <section className="detail-block">
              <span>{t('details.important')}</span>
              <div className="detail-list">
                {guide.keyPoints.map((point) => (
                  <p key={point.ru}><CheckCircle2 size={16} /> {getLocalizedText(point, language)}</p>
                ))}
              </div>
            </section>
          ) : null}

          {guide.sections?.map((sectionItem) => (
            <section className="detail-block" key={sectionItem.title.ru}>
              <span>{getLocalizedText(sectionItem.title, language)}</span>
              {sectionItem.paragraphs?.map((paragraph) => <p key={paragraph.ru}>{getLocalizedText(paragraph, language)}</p>)}
              {sectionItem.bullets?.length ? (
                <div className="detail-list">
                  {sectionItem.bullets.map((bullet) => (
                    <p key={bullet.ru}><CheckCircle2 size={16} /> {getLocalizedText(bullet, language)}</p>
                  ))}
                </div>
              ) : null}
            </section>
          ))}

          {guide.checklist?.length ? (
            <section className="detail-block guide-checklist-block">
              <span>{t('guides.checklist')}</span>
              <div className="detail-list">
                {guide.checklist.map((item) => (
                  <p key={item.ru}><CheckCircle2 size={16} /> {getLocalizedText(item, language)}</p>
                ))}
              </div>
            </section>
          ) : null}

          {guide.disclaimer ? (
            <section className="soft-callout place-warning-callout">
              <span><AlertTriangle size={17} /> {t('details.warnings')}</span>
              <p>{getLocalizedText(guide.disclaimer, language)}</p>
            </section>
          ) : null}

          {guide.ctas?.length ? (
            <section className="detail-block">
              <span>{t('guides.relatedMaterials')}</span>
              <div className="related-category-list">
                {guide.ctas.map((cta) => (
                  <Link to={cta.to} key={cta.to}><strong>{getLocalizedText(cta.label, language)}</strong></Link>
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : (
        <>
          <section className="detail-block">
            <span>{t('sections.shortAnswer')}</span>
            <h2>{t('placeholder.preparingTitle')}</h2>
            <p>{t('placeholder.guidePreparingText')}</p>
          </section>

          <section className="detail-block">
            <span>{t('sections.whatNow')}</span>
            <div className="detail-list">
              <p><CheckCircle2 size={16} /> {t('placeholder.guideStep1')}</p>
              <p><CheckCircle2 size={16} /> {t('placeholder.guideStep2')}</p>
              <p><CheckCircle2 size={16} /> {t('placeholder.guideStep3')}</p>
            </div>
          </section>
        </>
      )}

      <section className="soft-callout detail-mg67-callout">
        <span>MG67</span>
        <strong>{t('placeholder.feedbackTitle')}</strong>
        <p>{t('placeholder.feedbackText')}</p>
        {hasFeedbackLabel ? (
          <Link className="profile-primary-action" to={`/feedback?${feedbackParams.toString()}`}>{feedbackLabel}</Link>
        ) : null}
      </section>
    </section>
  );
}
