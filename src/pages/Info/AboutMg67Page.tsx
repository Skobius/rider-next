import { ArrowLeft, ExternalLink, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { socialLinks } from '../../config/socialLinks';
import { useI18n } from '../../shared/i18n/useI18n';

export function AboutMg67Page() {
  const { t } = useI18n();
  const activities = ['activity1', 'activity2', 'activity3', 'activity4', 'activity5', 'activity6'];

  return (
    <section className="motohub-screen simple-screen text-page">
      <Link className="back-link" to="/profile"><ArrowLeft size={18} aria-hidden="true" />{t('common.backToProfile')}</Link>
      <header className="simple-screen__header">
        <p>MG67</p>
        <h1>MG67 Moto Guide</h1>
        <span>{t('aboutMg67.subtitle')}</span>
      </header>
      <section className="article-card">
        <p>{t('aboutMg67.p1')}</p>
        <p>{t('aboutMg67.p2')}</p>
        <p>{t('aboutMg67.p3')}</p>
        <p>{t('aboutMg67.p4')}</p>
      </section>
      <section className="profile-group">
        <h2>{t('aboutMg67.activities')}</h2>
        <div className="chip-list">
          {activities.map((item) => <span key={item}>{t(`aboutMg67.${item}`)}</span>)}
        </div>
      </section>
      <section className="soft-callout">
        <strong>{t('aboutMg67.principle')}</strong>
        <p>{t('aboutMg67.principleText')}</p>
        <div className="inline-actions">
          <a className={!socialLinks.mg67Url ? 'is-disabled' : ''} href={socialLinks.mg67Url || undefined}><ExternalLink size={16} />{t('aboutMg67.openMg67')}</a>
          <Link to="/feedback"><MessageCircle size={16} />{t('aboutMg67.askQuestion')}</Link>
        </div>
      </section>
    </section>
  );
}
