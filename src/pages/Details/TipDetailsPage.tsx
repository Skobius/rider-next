import { AlertTriangle, ArrowLeft, CheckCircle2, Flame, Lightbulb, Wrench } from 'lucide-react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { findTip } from '../../data/tipsContent';
import { getLocalizedText } from '../../shared/i18n/localizedText';
import { useI18n } from '../../shared/i18n/useI18n';

export function TipDetailsPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { language, t } = useI18n();
  const tip = findTip(id);

  if (!tip) {
    return (
      <section className="motohub-screen simple-screen detail-screen">
        <Link className="back-link" to="/search">
          <ArrowLeft size={18} aria-hidden="true" />
          {t('details.home')}
        </Link>
        <section className="empty-state">
          <div><Lightbulb size={30} aria-hidden="true" /></div>
          <h2>{t('details.notFoundTitle')}</h2>
          <p>{t('details.notFoundText')}</p>
          <Link className="profile-primary-action" to="/search">{t('details.home')}</Link>
        </section>
      </section>
    );
  }

  return (
    <section className="motohub-screen simple-screen detail-screen">
      <button
        className="back-link detail-back-button"
        type="button"
        onClick={() => {
          if (location.key === 'default') navigate('/search');
          else navigate(-1);
        }}
      >
        <ArrowLeft size={18} aria-hidden="true" />
        {t('details.back')}
      </button>

      <article className="detail-hero-card">
        <img src={tip.image} alt="" />
        <div className="detail-hero-card__shade" />
        <div className="detail-hero-card__content">
          <span className="detail-kicker"><Flame size={15} /> {t('home.mg67Label')}</span>
          <h1>{getLocalizedText(tip.title, language)}</h1>
          <p>{getLocalizedText(tip.summary, language)}</p>
        </div>
      </article>

      <section className="detail-block">
        <span>{t('tips.why')}</span>
        <div className="detail-list">
          {tip.whyImportant.map((line) => (
            <p key={line.ru}><CheckCircle2 size={16} /> {getLocalizedText(line, language)}</p>
          ))}
        </div>
      </section>

      <section className="detail-block">
        <span>{t('tips.actions')}</span>
        <div className="detail-list">
          {tip.actions.map((line) => (
            <p key={line.ru}><Wrench size={16} /> {getLocalizedText(line, language)}</p>
          ))}
        </div>
      </section>

      <section className="soft-callout detail-mg67-callout">
        <span><AlertTriangle size={17} /> {t('tips.warning')}</span>
        <p>{getLocalizedText(tip.warning, language)}</p>
      </section>

      <section className="detail-block">
        <span>{t('tips.related')}</span>
        <div className="chip-list">
          {tip.related.map((item) => <span key={item.ru}>{getLocalizedText(item, language)}</span>)}
        </div>
      </section>
    </section>
  );
}
