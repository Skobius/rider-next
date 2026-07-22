import { Bell, CheckCircle2 } from 'lucide-react';
import { useI18n } from '../shared/i18n/useI18n';

export function NotificationsPage() {
  const { t } = useI18n();

  return (
    <section className="motohub-screen simple-screen">
      <header className="simple-screen__header">
        <p>{t('notifications.kicker')}</p>
        <h1>{t('notifications.title')}</h1>
        <span>{t('notifications.subtitle')}</span>
      </header>

      <section className="empty-state">
        <div>
          <Bell size={34} aria-hidden="true" />
        </div>
        <h2>{t('notifications.emptyTitle')}</h2>
        <p>{t('notifications.emptyText')}</p>
        <span>
          <CheckCircle2 size={17} aria-hidden="true" />
          {t('notifications.quiet')}
        </span>
      </section>
    </section>
  );
}
