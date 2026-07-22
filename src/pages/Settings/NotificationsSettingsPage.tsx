import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../shared/i18n/useI18n';
import { updateGuestSettings, useGuestSettings } from '../../shared/storage/guestSettings';

export function NotificationsSettingsPage() {
  const settings = useGuestSettings();
  const { t } = useI18n();
  const prefs = settings.notificationPreferences;

  function toggle(key: keyof typeof prefs) {
    updateGuestSettings({ notificationPreferences: { ...prefs, [key]: !prefs[key] } });
  }

  const rows = [
    { key: 'usefulTips' as const, title: t('settings.usefulTips'), description: t('settings.usefulTipsDescription') },
    { key: 'localEvents' as const, title: t('settings.localEvents'), description: t('settings.localEventsDescription') },
    { key: 'serviceReminders' as const, title: t('settings.serviceReminders'), description: t('settings.serviceRemindersDescription') },
  ];

  return (
    <section className="motohub-screen simple-screen">
      <Link className="back-link" to="/profile"><ArrowLeft size={18} aria-hidden="true" />{t('common.backToProfile')}</Link>
      <header className="simple-screen__header">
        <p>{t('common.settings')}</p>
        <h1>{t('settings.notificationTitle')}</h1>
        <span>{t('settings.notificationSubtitle')}</span>
      </header>
      <div className="settings-list">
        {rows.map((row) => (
          <button className="toggle-row" type="button" key={row.key} onClick={() => toggle(row.key)}>
            <span><strong>{row.title}</strong><small>{row.description}</small></span>
            <b>{prefs[row.key] ? t('settings.on') : t('settings.off')}</b>
          </button>
        ))}
      </div>
    </section>
  );
}
