import { ArrowLeft, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../shared/i18n/useI18n';
import { applyStoredTheme, updateGuestSettings, useGuestSettings } from '../../shared/storage/guestSettings';

export function ThemePage() {
  const settings = useGuestSettings();
  const { t } = useI18n();
  const options = [
    { id: 'dark' as const, title: t('settings.dark'), description: t('settings.darkDescription') },
    { id: 'light' as const, title: t('settings.light'), description: t('settings.lightDescription') },
    { id: 'system' as const, title: t('settings.systemTheme'), description: t('settings.systemThemeDescription') },
  ];

  return (
    <section className="motohub-screen simple-screen">
      <Link className="back-link" to="/profile"><ArrowLeft size={18} aria-hidden="true" />{t('common.backToProfile')}</Link>
      <header className="simple-screen__header">
        <p>{t('common.settings')}</p>
        <h1>{t('settings.themeTitle')}</h1>
        <span>{t('settings.themeSubtitle')}</span>
      </header>
      <div className="region-list">
        {options.map((option) => (
          <button
            className={`region-row ${settings.theme === option.id ? 'region-row--active' : ''}`}
            type="button"
            key={option.id}
            onClick={() => applyStoredTheme(updateGuestSettings({ theme: option.id }))}
          >
            <span><span><strong>{option.title}</strong><small>{option.description}</small></span></span>
            {settings.theme === option.id ? <Check size={19} aria-hidden="true" /> : null}
          </button>
        ))}
      </div>
    </section>
  );
}
