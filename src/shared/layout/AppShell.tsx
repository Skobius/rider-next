import { BookOpen, Dumbbell, Home, Map, Settings } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/home', label: 'Главная', icon: Home },
  { to: '/journey', label: 'Путь', icon: Map },
  { to: '/knowledge', label: 'Знания', icon: BookOpen },
  { to: '/motorcycle', label: 'Мото', icon: Settings },
  { to: '/training', label: 'Навыки', icon: Dumbbell },
];

export function AppShell() {
  return (
    <div className="app-shell">
      <main className="app-main">
        <Outlet />
      </main>
      <nav className="bottom-nav" aria-label="Основная навигация">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to} className="bottom-nav__item">
              <Icon size={20} aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
