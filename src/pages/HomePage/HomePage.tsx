import {
  Bell,
  BookOpen,
  Download,
  ChevronRight,
  Gauge,
  GraduationCap,
  Map,
  MapPin,
  MapPinned,
  Search,
  ShieldCheck,
  ShoppingBag,
  UserRound,
  UsersRound,
  Wrench,
} from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getRegionLabel } from '../../data/regions';
import { searchMotohub } from '../../features/search/searchEngine';
import { getLocalizedText } from '../../shared/i18n/localizedText';
import { useI18n } from '../../shared/i18n/useI18n';
import { InstallManualSheet } from '../../shared/pwa/InstallManualSheet';
import { useInstallPrompt } from '../../shared/pwa/useInstallPrompt';
import { useGuestSettings } from '../../shared/storage/guestSettings';

const quickFindItems = [
  { title: 'Шиномонтаж', category: 'places-tire-services', query: 'поменять резину', icon: Gauge },
  { title: 'Мотосервисы', category: 'places-services', query: 'мотосервис', icon: Wrench },
  { title: 'Магазины', category: 'moto-shops', query: 'купить экипировку', icon: ShoppingBag },
  { title: 'Страховка', category: 'places-insurance', query: 'страховка', icon: ShieldCheck },
  { title: 'Обучение', category: 'places-schools-instructors', query: 'обучение', icon: GraduationCap },
  { title: 'Все места', type: 'place', query: '', icon: MapPin },
];

const homeSections = [
  {
    title: 'Места',
    description: 'Сервисы, магазины, шиномонтажи и полезные точки рядом.',
    to: '/sections/places',
    icon: MapPin,
    tone: 'orange',
  },
  {
    title: 'Полезно знать',
    description: 'Короткие ответы про обслуживание, экипировку и первый сезон.',
    to: '/sections/guides',
    icon: BookOpen,
    tone: 'amber',
  },
  {
    title: 'Маршруты и места',
    description: 'Идеи поездок, направления и спокойные маршруты.',
    to: '/sections/routes',
    icon: MapPinned,
    tone: 'green',
  },
  {
    title: 'События и сообщество',
    description: 'Встречи, тренировки, выезды и мото-жизнь рядом.',
    to: '/sections/community',
    icon: UsersRound,
    tone: 'blue',
  },
  {
    title: 'Навыки и безопасность',
    description: 'Практика, городская езда и уверенное развитие без лишней теории.',
    to: '/sections/skills',
    icon: ShieldCheck,
    tone: 'red',
    wide: true,
  },
];

export function HomePage() {
  const settings = useGuestSettings();
  const { language, t } = useI18n();
  const navigate = useNavigate();
  const installPrompt = useInstallPrompt();
  const [query, setQuery] = useState('');
  const [showInstallSheet, setShowInstallSheet] = useState(false);
  const savedRegion = getRegionLabel(settings.regionId);
  const suggestions = useMemo(() => {
    if (query.trim().length < 2) return [];
    return searchMotohub({ query, regionId: settings.regionId, language }).slice(0, 4);
  }, [language, query, settings.regionId]);

  function openSearch(params: { q?: string; type?: string; category?: string; date?: string; featured?: boolean }) {
    const next = new URLSearchParams();
    if (params.q) next.set('q', params.q);
    if (params.type && params.type !== 'all') next.set('type', params.type);
    if (params.category) next.set('category', params.category);
    if (params.date) next.set('date', params.date);
    if (params.featured) next.set('featured', 'true');
    navigate(`/search?${next.toString()}`);
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    openSearch({ q: query.trim() });
  }

  return (
    <section className="motohub-screen">
      <header className="motohub-hero home-hero">
        <div className="motohub-topbar">
          <div className="motohub-brand-wrap">
            <Link className="motohub-logo" to="/search" aria-label="МотоГде">
              <img className="motohub-logo__image motohub-logo__image--dark" src="/assets/brand/motogde-logo-dark.png" alt="МотоГде" />
              <img className="motohub-logo__image motohub-logo__image--light" src="/assets/brand/motogde-logo-light.png" alt="МотоГде" />
            </Link>
            <Link className="motohub-location" to="/region">
              <MapPin size={16} aria-hidden="true" />
              <span>{savedRegion}</span>
              <ChevronRight size={15} aria-hidden="true" />
            </Link>
          </div>

          <div className="motohub-actions">
            <Link className="round-action" to="/notifications" aria-label={t('home.notificationsLabel')}>
              <Bell size={20} aria-hidden="true" />
            </Link>
            <Link className="round-action" to="/profile" aria-label={t('home.profileLabel')}>
              <UserRound size={21} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="motohub-hero-copy">
          <h1>Что вам нужно?</h1>
          <p>Найдем проверенное мотоместо в Смоленске.</p>
        </div>

        <form className="motohub-search" onSubmit={submitSearch}>
          <Search size={22} aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Например: поменять резину" />
        </form>
        {suggestions.length ? (
          <div className="home-search-suggestions">
            {suggestions.map(({ item }) => {
              const title = getLocalizedText(item.title, language);
              return (
                <button type="button" key={item.id} onClick={() => openSearch({ q: query })}>
                  <Search size={15} aria-hidden="true" />
                  <span>{title}</span>
                  <small>{getLocalizedText(item.description, language)}</small>
                </button>
              );
            })}
            <button className="home-search-suggestions__all" type="button" onClick={() => openSearch({ q: query })}>
              {t('search.submit')}
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </header>

      <main className="motohub-content home-content">
        <section className="motohub-section home-quick-section">
          <h2>Быстро найти</h2>
          <div className="quick-find-grid" aria-label="Быстрые категории поиска">
            {quickFindItems.map((item) => {
              const Icon = item.icon;
              return (
                <button className="quick-find-card" key={item.title} type="button" onClick={() => openSearch({ q: item.query, type: item.type, category: item.category })}>
                  <Icon size={22} strokeWidth={2.1} aria-hidden="true" />
                  <span>{item.title}</span>
                </button>
              );
            })}
          </div>
        </section>
        {installPrompt.canShowInstallUi ? (
          <button className="home-install-card" type="button" onClick={() => installPrompt.canNativeInstall ? void installPrompt.install() : setShowInstallSheet(true)}>
            <img src="/assets/brand/pwa-192x192.png" alt="" aria-hidden="true" />
            <span>
              <strong>МотоГде всегда под рукой</strong>
              <small>Установите приложение на телефон — быстрый запуск с главного экрана.</small>
            </span>
            <b><Download size={16} aria-hidden="true" />Установить</b>
          </button>
        ) : null}

        <Link className="map-shortcut-card" to="/map">
          <span><Map size={20} aria-hidden="true" /></span>
          <strong>Показать места на карте</strong>
          <ChevronRight size={18} aria-hidden="true" />
        </Link>


        <section className="motohub-section">
          <h2>Всё для мотоциклиста</h2>
          <div className="sections-home-grid">
            {homeSections.map((section) => {
              const Icon = section.icon;
              return (
                <Link className={`section-home-card section-home-card--${section.tone}${section.wide ? ' section-home-card--wide' : ''}`} to={section.to} key={section.title}>
                  <span><Icon size={22} strokeWidth={2.1} aria-hidden="true" /></span>
                  <strong>{section.title}</strong>
                  <small>{section.description}</small>
                  <ChevronRight size={17} aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        </section>
      </main>
      {showInstallSheet ? <InstallManualSheet kind={installPrompt.manualKind} onClose={() => setShowInstallSheet(false)} onCopyLink={installPrompt.copyInstallLink} /> : null}
    </section>
  );
}



