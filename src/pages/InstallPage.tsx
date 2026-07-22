import { ArrowLeft, Download, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '../shared/i18n/useI18n';
import { useInstallPrompt } from '../shared/pwa/useInstallPrompt';

export function InstallPage() {
  const { canInstall, install, isInstalled } = useInstallPrompt();
  const { t } = useI18n();

  return (
    <section className="motohub-screen simple-screen">
      <Link className="back-link" to="/profile">
        <ArrowLeft size={18} aria-hidden="true" />
        {t('common.backToProfile')}
      </Link>
      <header className="simple-screen__header">
        <p>{t('installPage.kicker')}</p>
        <h1>{t('installPage.title')}</h1>
        <span>{t('installPage.subtitle')}</span>
      </header>
      <section className="profile-hero-card">
        <div className="profile-avatar">
          <Smartphone size={25} aria-hidden="true" />
        </div>
        <div className="profile-hero-card__copy">
          <strong>{isInstalled ? t('installPage.installed') : canInstall ? t('installPage.canInstall') : t('installPage.browserMenu')}</strong>
          <span>{t('installPage.noStores')}</span>
        </div>
        <button className="profile-primary-action" type="button" disabled={!canInstall} onClick={() => void install()}>
          <Download size={17} aria-hidden="true" />
          {t('common.install')}
        </button>
        <p>{t('installPage.hint')}</p>
      </section>
    </section>
  );
}
