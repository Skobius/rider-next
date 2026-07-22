import { ArrowLeft, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../shared/i18n/useI18n';
import { updateGuestSettings, useGuestSettings } from '../../shared/storage/guestSettings';

export function BehaviorPage() {
  const settings = useGuestSettings();
  const { t } = useI18n();
  const options = [
    { id: 'comfortable' as const, title: t('settings.comfortable'), description: t('settings.comfortableDescription') },
    { id: 'compact' as const, title: t('settings.compact'), description: t('settings.compactDescription') },
  ];

  return (
    <section className="motohub-screen simple-screen">
      <Link className="back-link" to="/profile"><ArrowLeft size={18} aria-hidden="true" />{t('common.backToProfile')}</Link>
      <header className="simple-screen__header">
        <p>{t('common.settings')}</p>
        <h1>{t('settings.behaviorTitle')}</h1>
        <span>{t('settings.behaviorSubtitle')}</span>
      </header>
      <div className="region-list">
        {options.map((option) => (
          <button className={`region-row ${settings.behavior === option.id ? 'region-row--active' : ''}`} type="button" key={option.id} onClick={() => updateGuestSettings({ behavior: option.id })}>
            <span><span><strong>{option.title}</strong><small>{option.description}</small></span></span>
            {settings.behavior === option.id ? <Check size={19} aria-hidden="true" /> : null}
          </button>
        ))}
      </div>
    </section>
  );
}
