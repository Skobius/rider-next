import { ArrowLeft, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../shared/i18n/useI18n';
import { updateGuestSettings, useGuestSettings } from '../../shared/storage/guestSettings';

export function LanguagePage() {
  const settings = useGuestSettings();
  const { t } = useI18n();
  const options = [
    { id: 'ru' as const, title: t('settings.russian'), description: t('settings.russianDescription') },
    { id: 'en' as const, title: t('settings.english'), description: t('settings.englishDescription') },
  ];

  return (
    <section className="motohub-screen simple-screen">
      <Link className="back-link" to="/profile"><ArrowLeft size={18} aria-hidden="true" />{t('common.backToProfile')}</Link>
      <header className="simple-screen__header">
        <p>{t('common.settings')}</p>
        <h1>{t('settings.languageTitle')}</h1>
        <span>{t('settings.languageSubtitle')}</span>
      </header>
      <div className="region-list">
        {options.map((option) => (
          <button className={`region-row ${settings.language === option.id ? 'region-row--active' : ''}`} type="button" key={option.id} onClick={() => updateGuestSettings({ language: option.id })}>
            <span><span><strong>{option.title}</strong><small>{option.description}</small></span></span>
            {settings.language === option.id ? <Check size={19} aria-hidden="true" /> : null}
          </button>
        ))}
      </div>
    </section>
  );
}
