import { ArrowLeft, CalendarDays, Heart, MapPin, Navigation, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getSearchItemPath } from '../features/search/searchLinks';
import { useI18n } from '../shared/i18n/useI18n';
import { toggleFavorite, useFavorites, type FavoriteType } from '../shared/storage/favoritesStore';
import { showToast } from '../shared/ui/toastStore';

const tabs: Array<{ id: FavoriteType | 'all'; labelKey: string }> = [
  { id: 'all', labelKey: 'favorites.tabAll' },
  { id: 'place', labelKey: 'favorites.tabPlaces' },
  { id: 'route', labelKey: 'favorites.tabRoutes' },
  { id: 'event', labelKey: 'favorites.tabEvents' },
];

const iconByType = {
  place: MapPin,
  route: Navigation,
  event: CalendarDays,
};

export function FavoritesPage() {
  const favorites = useFavorites();
  const { t } = useI18n();
  const [tab, setTab] = useState<FavoriteType | 'all'>('all');
  const visibleFavorites = tab === 'all' ? favorites : favorites.filter((item) => item.type === tab);

  return (
    <section className="motohub-screen simple-screen">
      <Link className="back-link" to="/profile">
        <ArrowLeft size={18} aria-hidden="true" />
        {t('common.backToProfile')}
      </Link>
      <header className="simple-screen__header">
        <p>{t('favorites.kicker')}</p>
        <h1>{t('favorites.title')}</h1>
        <span>{t('favorites.subtitle')}</span>
      </header>

      <div className="search-filter-row favorites-tabs" aria-label={t('favorites.tabsLabel')}>
        {tabs.map((item) => (
          <button className={tab === item.id ? 'is-active' : ''} type="button" key={item.id} onClick={() => setTab(item.id)}>
            {t(item.labelKey)}
          </button>
        ))}
      </div>

      {favorites.length ? (
        <div className="settings-list">
          {visibleFavorites.map((item) => {
            const Icon = iconByType[item.type];
            return (
            <article className="favorite-row" key={`${item.type}-${item.id}`}>
              <Link className="settings-list__icon" to={getSearchItemPath(item)}>
                <Icon size={19} aria-hidden="true" />
              </Link>
              <Link className="settings-list__copy" to={getSearchItemPath(item)}>
                <strong>{item.title}</strong>
                <small>{item.description}</small>
              </Link>
              <button
                type="button"
                onClick={() => {
                  toggleFavorite(item);
                  showToast(t('favorites.removedToast'));
                }}
                aria-label={t('favorites.removeLabel')}
              >
                <Trash2 size={18} aria-hidden="true" />
              </button>
            </article>
            );
          })}
        </div>
      ) : null}

      {favorites.length && !visibleFavorites.length ? (
        <section className="empty-state">
          <div>
            <Heart size={30} aria-hidden="true" />
          </div>
          <h2>{t('favorites.emptyTitle')}</h2>
          <p>{t('favorites.emptyFilteredText')}</p>
        </section>
      ) : (
        null
      )}

      {!favorites.length ? (
        <section className="empty-state">
          <div>
            <Heart size={30} aria-hidden="true" />
          </div>
          <h2>{t('favorites.emptyTitle')}</h2>
          <p>{t('favorites.emptyText')}</p>
          <span>{t('favorites.guestMode')}</span>
          <Link className="profile-primary-action" to="/search">
            <Search size={18} aria-hidden="true" />
            {t('favorites.findUseful')}
          </Link>
        </section>
      ) : null}
    </section>
  );
}
