import { Bell, ChevronRight, Flame, MapPin, Mic, Search, UserRound } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getRegionLabel } from '../../data/regions';
import { getRecommendations, popularQueries } from '../../data/motohubHome';
import { getFeaturedRiderTasks } from '../../data/riderTasks';
import { appSections } from '../../data/sections';
import { searchMotohub } from '../../features/search/searchEngine';
import { getLocalizedText } from '../../shared/i18n/localizedText';
import { useI18n } from '../../shared/i18n/useI18n';
import { toggleFavorite, useFavorites } from '../../shared/storage/favoritesStore';
import { useGuestSettings } from '../../shared/storage/guestSettings';
import { getContentIcon } from '../../shared/ui/contentIcons';
import { showToast } from '../../shared/ui/toastStore';

export function HomePage() {
  const settings = useGuestSettings();
  const favorites = useFavorites();
  const { language, t } = useI18n();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const savedRegion = getRegionLabel(settings.regionId);
  const recommendations = useMemo(() => getRecommendations(settings.regionId), [settings.regionId]);
  const featuredTasks = useMemo(() => getFeaturedRiderTasks(), []);
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
      <header className="motohub-hero">
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
          <p>Опишите задачу или выберите готовый сценарий</p>
        </div>

        <form className="motohub-search" onSubmit={submitSearch}>
          <Search size={22} aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Например: поменять резину, найти сервис, подготовиться к поездке..." />
          <button type="button" aria-label={t('home.voiceSearch')} title={t('home.voiceSearch')} disabled>
            <Mic size={19} aria-hidden="true" />
          </button>
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

      <main className="motohub-content">
        <section className="motohub-section">
          <h2>Частые задачи</h2>
          <div className="quick-scroll" aria-label="Частые задачи мотоциклиста">
            {featuredTasks.map((task) => {
              const Icon = getContentIcon(task.icon);
              const title = getLocalizedText(task.shortTitle, language);
              return (
                <button className="quick-card" key={task.id} type="button" onClick={() => navigate(`/tasks/${task.slug}`)}>
                  <Icon size={27} strokeWidth={2} aria-hidden="true" />
                  <span>{title}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mg67-card">
          <div className="mg67-card__icon">
            <Flame size={17} aria-hidden="true" />
          </div>
          <div className="mg67-card__copy">
            <p>{t('home.mg67Label')}</p>
            <h2>{t('home.mg67Title')}</h2>
            <span>{t('home.mg67Text')}</span>
          </div>
          <Link to="/guides/motorcycle-tire-pressure">
            {t('home.details')}
            <ChevronRight size={18} aria-hidden="true" />
          </Link>
        </section>

        <section className="motohub-section">
          <h2>Разобраться самому</h2>
          <div className="quick-scroll" aria-label={t('home.popularLabel')}>
            {popularQueries.slice(0, 4).map((item) => {
              const Icon = item.icon;
              const title = getLocalizedText(item.title, language);
              return (
                <button className="quick-card quick-card--secondary" key={title} type="button" onClick={() => openSearch({ q: item.query, type: item.type, category: item.category, date: item.date })}>
                  <Icon size={24} strokeWidth={2} aria-hidden="true" />
                  <span>{title}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="motohub-section">
          <div className="section-heading-row">
            <h2>{t('home.usefulNearby')}</h2>
            <Link to="/sections">
              {t('sections.allSections')}
              <ChevronRight size={18} aria-hidden="true" />
            </Link>
          </div>
          <div className="places-grid sections-home-grid">
            {appSections.map((item, index) => {
              const Icon = getContentIcon(item.icon);
              const title = getLocalizedText(item.title, language);
              return (
                <Link className={`place-card section-home-card ${index === 4 ? 'section-home-card--wide' : ''}`} key={item.id} to={`/sections/${item.slug}`}>
                  <span>
                    <Icon size={23} strokeWidth={2} aria-hidden="true" />
                  </span>
                  <strong>{title}</strong>
                  <small>{getLocalizedText(item.description, language)}</small>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="motohub-section">
          <div className="section-heading-row">
            <h2>{t('home.recommendedToday')}</h2>
            <button type="button" onClick={() => openSearch({ featured: true })}>
              {t('common.all')}
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>

          <div className="recommend-scroll" aria-label={t('home.recommendationsLabel')}>
            {recommendations.map((item) => {
              const Icon = item.icon;
              const title = getLocalizedText(item.title, language);
              const isFavorite = item.favoriteType ? favorites.some((favorite) => favorite.id === item.id && favorite.type === item.favoriteType) : false;
              return (
                <article className="recommend-card" key={title} style={{ backgroundImage: `url(${item.image})` }}>
                  <div className="recommend-card__top">
                    <span>{getLocalizedText(item.label, language)}</span>
                    <button
                      className={isFavorite ? 'is-active' : ''}
                      type="button"
                      disabled={!item.favoriteType}
                      aria-label={isFavorite ? t('favorites.removeLabel') : t('home.favoriteAdd')}
                      onClick={() => {
                        if (!item.favoriteType) return;
                        const added = toggleFavorite({ id: item.id, type: item.favoriteType, title, description: getLocalizedText(item.details, language) });
                        showToast(added ? t('favorites.addedToast') : t('favorites.removedToast'));
                      }}
                    >
                      <Icon size={18} aria-hidden="true" />
                    </button>
                  </div>
                  <Link className="recommend-card__copy" to={item.path}>
                    <h3>{title}</h3>
                    <p>{getLocalizedText(item.details, language)}</p>
                    <small>
                      <MapPin size={14} aria-hidden="true" />
                      {getLocalizedText(item.note, language)}
                    </small>
                  </Link>
                </article>
              );
            })}
          </div>
        </section>
      </main>
    </section>
  );
}
