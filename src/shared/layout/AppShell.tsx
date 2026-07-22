import { Heart, Map, Search, UserRound } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useI18n } from '../i18n/useI18n';
import { useToastMessage } from '../ui/toastStore';

const navItems = [
  { to: '/search', labelKey: 'nav.search', icon: Search },
  { to: '/map', labelKey: 'nav.map', icon: Map },
  { to: '/favorites', labelKey: 'nav.favorites', icon: Heart },
  { to: '/profile', labelKey: 'nav.profile', icon: UserRound },
];

export function AppShell() {
  const { t } = useI18n();
  const toast = useToastMessage();

  return (
    <div className="motohub-app">
      <main>
        <Outlet />
      </main>
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
