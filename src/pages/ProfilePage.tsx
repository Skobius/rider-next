import {
  AppWindow,
  BarChart3,
  ChevronRight,
  ClipboardList,
  Database,
  FileText,
  Heart,
  History,
  Info,
  Languages,
  Mail,
  MapPin,
  Palette,
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
import { useGuestSettings } from '../shared/storage/guestSettings';
import { supabase } from '../shared/supabase/client';

interface ProfileMenuItem {
  titleKey: string;
  descriptionKey: string;
  title?: string;
  description?: string;
  icon: LucideIcon;
  to: string;
  isRegion?: boolean;
  requires?: 'user' | 'moderator' | 'admin' | 'superadmin';
}

interface ProfileMenuGroup {
  title: string;
  requires?: 'user' | 'moderator' | 'admin' | 'superadmin';
  items: ProfileMenuItem[];
}

const groups: ProfileMenuGroup[] = [
  {
    title: 'Мой МотоГде',
    items: [
      { titleKey: 'profile.favoritesTitle', descriptionKey: 'profile.favoritesDescription', icon: Heart, to: '/favorites' },
      { titleKey: 'profile.submissionsTitle', descriptionKey: 'profile.submissionsDescription', icon: FileText, to: '/profile/submissions', requires: 'user' },
      { titleKey: 'profile.regionTitle', descriptionKey: 'profile.regionDescription', icon: MapPin, to: '/region', isRegion: true },
      { titleKey: 'profile.installTitle', descriptionKey: 'profile.installDescription', icon: AppWindow, to: '/install' },
    ],
  },
  {
    title: 'Для владельцев',
    requires: 'user',
    items: [
      { titleKey: 'profile.claimsTitle', descriptionKey: 'profile.claimsDescription', icon: ShieldCheck, to: '/profile/claims' },
      { titleKey: 'profile.organizationsTitle', descriptionKey: 'profile.organizationsDescription', icon: Building2, to: '/profile/organizations' },
    ],
  },
  {
    title: 'Управление',
    requires: 'moderator',
    items: [
      { titleKey: 'profile.moderationTitle', descriptionKey: 'profile.moderationDescription', icon: ClipboardList, to: '/moderation', requires: 'moderator' },
      { titleKey: 'profile.adminContentTitle', descriptionKey: 'profile.adminContentDescription', icon: Database, to: '/admin/content', requires: 'admin' },
      { titleKey: 'profile.adminAnalyticsTitle', descriptionKey: 'profile.adminAnalyticsDescription', title: 'Аналитика', description: 'Качество данных, сигналы и перепроверка', icon: BarChart3, to: '/admin/analytics', requires: 'admin' },
      { titleKey: 'profile.adminUsersTitle', descriptionKey: 'profile.adminUsersDescription', icon: UsersRound, to: '/admin/users', requires: 'superadmin' },
      { titleKey: 'profile.auditTitle', descriptionKey: 'profile.auditDescription', icon: History, to: '/admin/audit', requires: 'superadmin' },
    ],
  },
  {
    title: 'Настройки',
    items: [
      { titleKey: 'profile.accountTitle', descriptionKey: 'profile.accountDescription', icon: UserRound, to: '/profile/account', requires: 'user' },
      { titleKey: 'profile.languageTitle', descriptionKey: 'profile.languageDescription', icon: Languages, to: '/settings/language' },
      { titleKey: 'profile.themeTitle', descriptionKey: 'profile.themeDescription', icon: Palette, to: '/settings/theme' },
    ],
  },
  {
    title: 'Помощь',
    items: [
      { titleKey: 'profile.feedbackTitle', descriptionKey: 'profile.feedbackDescription', icon: Mail, to: '/feedback' },
      { titleKey: 'profile.aboutTitle', descriptionKey: 'profile.aboutDescription', icon: Info, to: '/about' },
    ],
  },
];

export function ProfilePage() {
  const settings = useGuestSettings();
  const installPrompt = useInstallPrompt();
  const { t } = useI18n();
  const { user, configured } = useAuthSession();
  const { profile } = useUserProfile();
  const roles = useUserRoles();
  const region = getRegionLabel(profile?.home_region_id ?? settings.regionId);
  const displayName = user
    ? profile?.display_name || user.user_metadata?.display_name || user.email || settings.displayName || t('profile.guestName')
    : 'Гостевой профиль';
  const installTitle = installPrompt.isInstalled ? 'МотоГде установлено' : 'Установить приложение';
  const installDescription = installPrompt.isInstalled ? 'Приложение уже добавлено на устройство' : t('profile.installDescription');
  const canSee = (required?: string) => {
    if (!required) return true;
    if (required === 'user') return Boolean(user);
    if (required === 'moderator') return roles.isModerator;
    if (required === 'admin') return roles.isAdmin;
    if (required === 'superadmin') return roles.isSuperadmin;
    return true;
  };

  return (
    <section className="motohub-screen simple-screen profile-screen">
      <header className="simple-screen__header">
        <p>МотоГде</p>
        <h1>Профиль</h1>
        <span>{user ? 'Настройки аккаунта и приложения.' : 'Настройки приложения и вход в аккаунт.'}</span>
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
            {configured ? 'Войти или зарегистрироваться' : 'Подключить аккаунт'}
          </Link>
        )}
        <p>{user ? 'Аккаунт подключён.' : 'Можно пользоваться МотоГде без входа. Аккаунт нужен для предложений, избранного и будущей синхронизации.'}</p>
      </section>

      {groups.filter((group) => canSee(group.requires)).map((group) => (
        <section className="profile-group" key={group.title}>
          <h2>{group.title}</h2>
          <div className="settings-list">
            {group.items.filter((item) => canSee(item.requires)).map((item) => {
              const Icon = item.icon;
              const description = item.titleKey === 'profile.installTitle' ? installDescription : item.isRegion ? region : item.description ?? t(item.descriptionKey);
              const title = item.titleKey === 'profile.installTitle' ? installTitle : item.title ?? t(item.titleKey);

              return (
                <Link className="settings-row" key={item.titleKey} to={item.to}>
                  <span className="settings-list__icon">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <span className="settings-list__copy">
                    <strong>{title}</strong>
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

