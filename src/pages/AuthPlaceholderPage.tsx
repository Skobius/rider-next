import { ArrowLeft, LockKeyhole } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '../shared/i18n/useI18n';

export function AuthPlaceholderPage() {
  const { t } = useI18n();

  return (
    <section className="motohub-screen simple-screen">
      <Link className="back-link" to="/profile"><ArrowLeft size={18} aria-hidden="true" />{t('common.backToProfile')}</Link>
      <header className="simple-screen__header">
        <p>{t('auth.kicker')}</p>
        <h1>{t('auth.title')}</h1>
        <span>{t('auth.subtitle')}</span>
      </header>
      <section className="empty-state">
        <div><LockKeyhole size={30} aria-hidden="true" /></div>
        <h2>{t('auth.cardTitle')}</h2>
        <p>{t('auth.cardText')}</p>
        <span>{t('auth.guestMode')}</span>
      </section>
    </section>
  );
}
