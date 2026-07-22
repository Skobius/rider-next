import {
  AppWindow,
  Bell,
  ChevronRight,
  FileText,
  Globe2,
  Heart,
  Info,
  Languages,
  Mail,
  MapPin,
  MonitorSmartphone,
  Palette,
  Settings2,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getRegionLabel } from '../data/regions';
import { useI18n } from '../shared/i18n/useI18n';
import { useInstallPrompt } from '../shared/pwa/useInstallPrompt';
import { useFavorites } from '../shared/storage/favoritesStore';
import { useGuestSettings } from '../shared/storage/guestSettings';

const groups = [
  {
    titleKey: 'profile.myMotohub',
    items: [
      { titleKey: 'profile.favoritesTitle', descriptionKey: 'profile.favoritesDescription', icon: Heart, to: '/favorites' },
      { titleKey: 'profile.regionTitle', descriptionKey: 'profile.regionDescription', icon: MapPin, to: '/region', isRegion: true },
      { titleKey: 'profile.installTitle', descriptionKey: 'profile.installDescription', icon: AppWindow, to: '/install' },
    ],
  },
  {
    titleKey: 'common.settings',
    items: [
      { titleKey: 'profile.languageTitle', descriptionKey: 'profile.languageDescription', icon: Languages, to: '/settings/language' },
      { titleKey: 'profile.themeTitle', descriptionKey: 'profile.themeDescription', icon: Palette, to: '/settings/theme' },
      { titleKey: 'profile.notificationsTitle', descriptionKey: 'profile.notificationsDescription', icon: Bell, to: '/settings/notifications' },
      { titleKey: 'profile.behaviorTitle', descriptionKey: 'profile.behaviorDescription', icon: Settings2, to: '/settings/behavior' },
    ],
  },
  {
    titleKey: 'common.help',
    items: [
      { titleKey: 'profile.feedbackTitle', descriptionKey: 'profile.feedbackDescription', icon: Mail, to: '/feedback' },
      { titleKey: 'profile.aboutTitle', descriptionKey: 'profile.aboutDescription', icon: Info, to: '/about' },
      { titleKey: 'profile.aboutMg67Title', descriptionKey: 'profile.aboutMg67Description', icon: ShieldCheck, to: '/about-mg67' },
    ],
  },
  {
    titleKey: 'common.system',
    items: [
      { titleKey: 'profile.privacyTitle', descriptionKey: 'profile.documentDraft', icon: FileText, to: '/privacy' },
      { titleKey: 'profile.termsTitle', descriptionKey: 'profile.documentDraft', icon: FileText, to: '/terms' },
    ],
  },
];

export function ProfilePage() {
  const settings = useGuestSettings();
  const favorites = useFavorites();
  const installPrompt = useInstallPrompt();
  const { t } = useI18n();
  const region = getRegionLabel(settings.regionId);

  return (
    <section className="motohub-screen simple-screen profile-screen">
      <header className="simple-screen__header">
        <p>{t('common.profile')}</p>
        <h1>{t('profile.title')}</h1>
        <span>{t('profile.intro')}</span>
      </header>

      <section className="profile-hero-card">
        <div className="profile-avatar">
          <UserRound size={25} aria-hidden="true" />
        </div>
        <div className="profile-hero-card__copy">
          <strong>{settings.displayName || t('profile.guestName')}</strong>
          <span>{region}</span>
        </div>
        <Link className="profile-primary-action" to="/auth">
          {t('profile.signIn')}
        </Link>
        <p>{t('profile.signInHint')}</p>
      </section>

      <section className="profile-summary-grid" aria-label={t('profile.summaryLabel')}>
        <div>
          <Heart size={18} aria-hidden="true" />
          <strong>{favorites.length}</strong>
          <span>{t('profile.favoriteCount')}</span>
        </div>
        <div>
          <Globe2 size={18} aria-hidden="true" />
          <strong>{settings.language === 'ru' ? 'RU' : 'EN'}</strong>
          <span>{t('profile.language')}</span>
        </div>
        <div>
          <MonitorSmartphone size={18} aria-hidden="true" />
          <strong>{installPrompt.isInstalled ? t('profile.installedYes') : installPrompt.canInstall ? t('profile.installAvailable') : 'PWA'}</strong>
          <span>{t('profile.install')}</span>
        </div>
      </section>

      {groups.map((group) => (
        <section className="profile-group" key={group.titleKey}>
          <h2>{t(group.titleKey)}</h2>
          <div className="settings-list">
            {group.items.map((item) => {
              const Icon = item.icon;
              const description = item.isRegion ? region : t(item.descriptionKey);

              return (
                <Link className="settings-row" key={item.titleKey} to={item.to}>
                  <span className="settings-list__icon">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <span className="settings-list__copy">
                    <strong>{t(item.titleKey)}</strong>
                    <small>{description}</small>
                  </span>
                  <ChevronRight size={18} aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        </section>
      ))}

      <p className="version-note">{t('common.version')}</p>
    </section>
  );
}
