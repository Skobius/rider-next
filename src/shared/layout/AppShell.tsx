import { Bell, ChevronRight, Layers3, Map, MapPin, Search, UserRound } from 'lucide-react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { getRegionLabel } from '../../data/regions';
import { useAuthSession } from '../auth/useAuthSession';
import { useI18n } from '../i18n/useI18n';
import { useFavoriteSync } from '../storage/favoritesStore';
import { useGuestSettings } from '../storage/guestSettings';
import { useToastMessage } from '../ui/toastStore';

const navItems = [
  { to: '/search', labelKey: 'nav.search', icon: Search },
  { to: '/sections', labelKey: 'nav.sections', icon: Layers3 },
  { to: '/map', labelKey: 'nav.map', icon: Map },
  { to: '/profile', labelKey: 'nav.profile', icon: UserRound },
];

function getPageTitle(pathname: string) {
  if (pathname.startsWith('/sections')) return 'Разделы';
  if (pathname.startsWith('/map')) return 'Карта';
  if (pathname.startsWith('/profile')) return 'Профиль';
  if (pathname.startsWith('/notifications')) return 'Уведомления';
  if (pathname.startsWith('/region')) return 'Регион';
  if (pathname.startsWith('/favorites')) return 'Избранное';
  if (pathname.startsWith('/guides')) return 'Полезно знать';
  if (pathname.startsWith('/place')) return 'Место';
  if (pathname.startsWith('/route')) return 'Маршрут';
  if (pathname.startsWith('/event')) return 'Событие';
  if (pathname.startsWith('/skill')) return 'Навык';
  return 'Поиск';
}

export function AppShell() {
  const { t } = useI18n();
  const toast = useToastMessage();
  const settings = useGuestSettings();
  const { user } = useAuthSession();
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);
  const region = getRegionLabel(settings.regionId);
  useFavoriteSync(user?.id);

  return (
    <div className="motohub-app">
      <aside className="motohub-sidebar" aria-label="Навигация MotoHub">
        <Link className="motohub-sidebar__brand" to="/search" aria-label="MotoHub">
          <img src="/assets/brand/motohub-logo-horizontal-transparent.png" alt="MotoHub" />
        </Link>
        <nav className="motohub-sidebar__nav" aria-label={t('nav.label')}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} className="motohub-sidebar__item">
                <Icon size={19} strokeWidth={2.1} aria-hidden="true" />
                <span>{t(item.labelKey)}</span>
              </NavLink>
            );
          })}
        </nav>
        <Link className="motohub-sidebar__profile" to="/profile">
          <span><UserRound size={18} aria-hidden="true" /></span>
          <div>
            <strong>Профиль</strong>
            <small>Настройки и избранное</small>
          </div>
        </Link>
      </aside>

      <div className="motohub-workspace">
        <header className="motohub-desktop-header">
          <div>
            <p>MotoHub</p>
            <h1>{pageTitle}</h1>
          </div>
          <div className="motohub-desktop-header__actions">
            <Link className="desktop-search-link" to="/search">
              <Search size={17} aria-hidden="true" />
              <span>Найти место, маршрут или событие</span>
            </Link>
            <Link className="desktop-region-link" to="/region">
              <MapPin size={16} aria-hidden="true" />
              <span>{region}</span>
              <ChevronRight size={15} aria-hidden="true" />
            </Link>
            <Link className="desktop-icon-link" to="/notifications" aria-label={t('home.notificationsLabel')}>
              <Bell size={18} aria-hidden="true" />
            </Link>
          </div>
        </header>
        <main>
          <Outlet />
        </main>
      </div>
      {toast ? <div className="motohub-toast" role="status">{toast.text}</div> : null}
      <nav className="motohub-nav" aria-label={t('nav.label')}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to} className="motohub-nav__item">
              <Icon size={25} strokeWidth={2.2} aria-hidden="true" />
              <span>{t(item.labelKey)}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
