import { ArrowLeft, Lightbulb } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../shared/i18n/useI18n';

export function AboutPage() {
  const { t } = useI18n();
  const principles = ['principle1', 'principle2', 'principle3', 'principle4', 'principle5'];

  return (
    <section className="motohub-screen simple-screen text-page">
      <Link className="back-link" to="/profile"><ArrowLeft size={18} aria-hidden="true" />{t('common.backToProfile')}</Link>
      <header className="simple-screen__header">
        <p>{t('about.kicker')}</p>
        <h1>{t('about.title')}</h1>
        <span>{t('about.subtitle')}</span>
      </header>
      <section className="article-card">
        <p>{t('about.p1')}</p>
        <p>{t('about.p2')}</p>
        <p>{t('about.p3')}</p>
      </section>
      <section className="profile-group">
        <h2>{t('about.principles')}</h2>
        <div className="chip-list">
          {principles.map((item) => <span key={item}>{t(`about.${item}`)}</span>)}
        </div>
      </section>
      <section className="soft-callout">
        <Lightbulb size={20} aria-hidden="true" />
        <strong>{t('about.inProgress')}</strong>
        <p>{t('about.inProgressText')}</p>
        <Link to="/feedback">{t('about.suggestIdea')}</Link>
      </section>
    </section>
  );
}
