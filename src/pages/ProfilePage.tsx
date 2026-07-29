import {
  AppWindow,
  Bell,
  ChevronRight,
  ClipboardList,
  Database,
  FileText,
  Globe2,
  Heart,
  History,
  Info,
  Languages,
  Mail,
  MapPin,
  MonitorSmartphone,
  Palette,
  Settings2,
  ShieldCheck,
  Building2,
  LogOut,
  UserRound,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getRegionLabel } from '../data/regions';
import { useAuthSession } from '../shared/auth/useAuthSession';
import { useUserProfile } from '../shared/auth/useProfile';
import { useUserRoles } from '../shared/auth/useUserRoles';
import { useI18n } from '../shared/i18n/useI18n';
import { useInstallPrompt } from '../shared/pwa/useInstallPrompt';
import { useFavorites } from '../shared/storage/favoritesStore';
import { useGuestSettings } from '../shared/storage/guestSettings';
import { supabase } from '../shared/supabase/client';

interface ProfileMenuItem {
  titleKey: string;
  descriptionKey: string;
  icon: LucideIcon;
  to: string;
  isRegion?: boolean;
  requires?: 'moderator' | 'admin' | 'superadmin';
}

interface ProfileMenuGroup {
  titleKey: string;
  requires?: 'moderator' | 'admin' | 'superadmin';
  items: ProfileMenuItem[];
}

const groups: ProfileMenuGroup[] = [
  {
    titleKey: 'profile.myMotohub',
    items: [
      { titleKey: 'profile.favoritesTitle', descriptionKey: 'profile.favoritesDescription', icon: Heart, to: '/favorites' },
      { titleKey: 'profile.accountTitle', descriptionKey: 'profile.accountDescription', icon: UserRound, to: '/profile/account' },
      { titleKey: 'profile.submissionsTitle', descriptionKey: 'profile.submissionsDescription', icon: FileText, to: '/profile/submissions' },
      { titleKey: 'profile.claimsTitle', descriptionKey: 'profile.claimsDescription', icon: ShieldCheck, to: '/profile/claims' },
      { titleKey: 'profile.organizationsTitle', descriptionKey: 'profile.organizationsDescription', icon: Building2, to: '/profile/organizations' },
      { titleKey: 'profile.regionTitle', descriptionKey: 'profile.regionDescription', icon: MapPin, to: '/region', isRegion: true },
      { titleKey: 'profile.installTitle', descriptionKey: 'profile.installDescription', icon: AppWindow, to: '/install' },
    ],
  },
  {
    titleKey: 'profile.adminTools',
    requires: 'moderator',
    items: [
      { titleKey: 'profile.moderationTitle', descriptionKey: 'profile.moderationDescription', icon: ClipboardList, to: '/moderation', requires: 'moderator' },
      { titleKey: 'profile.adminContentTitle', descriptionKey: 'profile.adminContentDescription', icon: Database, to: '/admin/content', requires: 'admin' },
      { titleKey: 'profile.adminUsersTitle', descriptionKey: 'profile.adminUsersDescription', icon: UsersRound, to: '/admin/users', requires: 'superadmin' },
      { titleKey: 'profile.auditTitle', descriptionKey: 'profile.auditDescription', icon: History, to: '/admin/audit', requires: 'superadmin' },
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
  const { user, configured } = useAuthSession();
  const { profile } = useUserProfile();
  const roles = useUserRoles();
  const region = getRegionLabel(profile?.home_region_id ?? settings.regionId);
  const displayName = profile?.display_name || user?.user_metadata?.display_name || user?.email || settings.displayName || t('profile.guestName');
  const canSee = (required?: string) => {
    if (!required) return true;
    if (required === 'moderator') return roles.isModerator;
    if (required === 'admin') return roles.isAdmin;
    if (required === 'superadmin') return roles.isSuperadmin;
    return true;
  };

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
          <strong>{displayName}</strong>
          <span>{user?.email ? `${region} · ${user.email}` : region}</span>
        </div>
        {user ? (
          <button className="profile-primary-action" type="button" onClick={() => supabase?.auth.signOut()}>
            <LogOut size={17} aria-hidden="true" />
            Выйти
          </button>
        ) : (
          <Link className="profile-primary-action" to="/auth">
            {configured ? t('profile.signIn') : 'Подключить аккаунт'}
          </Link>
        )}
        <p>{user ? 'Аккаунт подключён через Supabase Auth.' : t('profile.signInHint')}</p>
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

      {groups.filter((group) => canSee(group.requires)).map((group) => (
        <section className="profile-group" key={group.titleKey}>
          <h2>{t(group.titleKey)}</h2>
          <div className="settings-list">
            {group.items.filter((item) => canSee(item.requires)).map((item) => {
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
