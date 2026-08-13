import { ArrowLeft, Heart, MapPin, Navigation, Search, ShieldCheck, SlidersHorizontal, X } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import type { SearchCategory, SearchDateFilter, SearchItemType } from '../../data/searchContent';
import { getSearchEntityLabelKey, searchMotohub, type SearchEntityType } from '../../features/search/searchEngine';
import { getRegionLabel } from '../../data/regions';
import { useBackendContent } from '../../shared/content/backendContent';
import { getLocalizedText } from '../../shared/i18n/localizedText';
import { useI18n } from '../../shared/i18n/useI18n';
import { toggleFavorite, useFavorites } from '../../shared/storage/favoritesStore';
import { useGuestSettings } from '../../shared/storage/guestSettings';
import { PlaceCard } from '../../shared/ui/PlaceCard';
import { ImageWithFallback } from '../../shared/ui/ImageWithFallback';
import { showToast } from '../../shared/ui/toastStore';

const categoryLabels: Record<SearchCategory, string> = {
  service: 'search.categoryService',
  equipment: 'search.categoryEquipment',
  route: 'search.categoryRoute',
  event: 'search.categoryEvent',
  training: 'search.categoryTraining',
  insurance: 'search.categoryInsurance',
  fuel: 'search.categoryFuel',
  storage: 'search.categoryStorage',
};

function readType(value: string | null): SearchEntityType | 'all' {
  return value === 'place' || value === 'route' || value === 'event' || value === 'skill' || value === 'task' ? value : 'all';
}

function readCategory(value: string | null): SearchCategory | 'all' {
  const categories: SearchCategory[] = ['service', 'equipment', 'route', 'event', 'training', 'insurance', 'fuel', 'storage'];
  return value && categories.includes(value as SearchCategory) ? value as SearchCategory : 'all';
}

function readDate(value: string | null): SearchDateFilter | undefined {
  return value === 'today' || value === 'evening' || value === 'upcoming' ? value : undefined;
}

function getContextTitle(params: { query: string; category: SearchCategory | 'all'; date?: SearchDateFilter; featured: boolean; t: (key: string) => string }) {
  if (params.query) return params.query;
  if (params.featured) return params.t('search.contextFeatured');
  if (params.category === 'service') return params.t('search.contextService');
  if (params.category === 'equipment') return params.t('search.contextEquipment');
  if (params.category === 'training') return params.t('search.contextTraining');
  if (params.date === 'today') return params.t('search.contextRoutesToday');
  if (params.date === 'evening') return params.t('search.contextEventsEvening');
  return 'Места рядом';
}

function canFavorite(type: string): type is SearchItemType {
  return type === 'place' || type === 'route' || type === 'event';
}

export function SearchResultsPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const locationState = `/search?${params.toString()}`;
  const settings = useGuestSettings();
  const favorites = useFavorites();
  const { language, t } = useI18n();
  const backendContent = useBackendContent();
  const query = params.get('q') ?? '';
  const type = readType(params.get('type'));
  const category = readCategory(params.get('category'));
  const date = readDate(params.get('date'));
  const featured = params.get('featured') === 'true';
  const [value, setValue] = useState(query);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [openOnly, setOpenOnly] = useState(false);

  const results = useMemo(() => searchMotohub(
    { query, regionId: settings.regionId, language, type: type === 'all' ? 'all' : type, category, date, featured },
    { places: backendContent.places, routes: backendContent.routes, events: backendContent.events },
  ), [backendContent.events, backendContent.places, backendContent.routes, category, date, featured, language, query, settings.regionId, type]);

  const placeResults = useMemo(() => results
    .filter((result) => result.item.type === 'place')
    .map((result) => backendContent.places.find((place) => place.id === result.item.id))
    .filter(Boolean)
    .filter((place) => !verifiedOnly || place!.verified || place!.verificationStatus === 'confirmed' || place!.verificationStatus === 'verified_mg67')
    .filter((place) => !openOnly || Boolean(place!.branches?.[0]?.schedule)) as typeof backendContent.places,
  [backendContent.places, openOnly, results, verifiedOnly]);

  const secondaryResults = useMemo(() => results.filter((result) => result.item.type !== 'place'), [results]);
  const region = getRegionLabel(settings.regionId);
  const title = getContextTitle({ query, category, date, featured, t });

  function updateSearch(next: { q?: string; category?: SearchCategory | 'all' }) {
    const nextParams = new URLSearchParams(params);
    const nextQuery = next.q ?? query;
    const nextCategory = next.category ?? category;

    if (nextQuery.trim()) nextParams.set('q', nextQuery.trim());
    else nextParams.delete('q');

    nextParams.set('type', 'place');

    if (nextCategory && nextCategory !== 'all') nextParams.set('category', nextCategory);
    else nextParams.delete('category');

    navigate(`/search?${nextParams.toString()}`);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    updateSearch({ q: value });
  }

  return (
    <section className="motohub-screen simple-screen public-ui-v2 public-search-screen search-results-screen">
      <div className="public-search-topbar">
        <Link className="public-icon-button" to="/search" aria-label="Назад">
          <ArrowLeft size={20} aria-hidden="true" />
        </Link>
        <form className="search-results-form public-search-form" onSubmit={submit}>
          <Search size={19} aria-hidden="true" />
          <input value={value} onChange={(event) => setValue(event.target.value)} placeholder="Найти место, услугу или адрес" />
          {value ? <button type="button" onClick={() => setValue('')} aria-label={t('search.clear')}><X size={17} /></button> : null}
        </form>
      </div>

      <div className="public-search-chips" aria-label="Фильтры поиска">
        <button className="is-active" type="button"><Navigation size={15} aria-hidden="true" /> Рядом</button>
        <button className={openOnly ? 'is-active' : ''} type="button" onClick={() => setOpenOnly((current) => !current)}><span className="green-dot" /> Открыто</button>
        <button className={verifiedOnly ? 'is-active' : ''} type="button" onClick={() => setVerifiedOnly((current) => !current)}><ShieldCheck size={15} aria-hidden="true" /> Проверено</button>
        <button type="button" onClick={() => updateSearch({ category: category === 'all' ? 'service' : 'all' })}><SlidersHorizontal size={16} aria-hidden="true" /></button>
      </div>

      <header className="simple-screen__header public-search-heading">
        <p>{region}</p>
        <h1>{title}</h1>
        <span>{placeResults.length ? `${placeResults.length} мест` : 'Сначала показываем места, потом полезные материалы'}</span>
      </header>

      {category !== 'all' ? (
        <div className="search-meta-row public-search-meta">
          <button type="button" onClick={() => updateSearch({ category: 'all' })}>{t(categoryLabels[category])} ×</button>
        </div>
      ) : null}

      {placeResults.length ? (
        <div className="search-results-list public-place-results">
          {placeResults.map((place) => <PlaceCard place={place} from={locationState} key={place.id} />)}
        </div>
      ) : (
        <section className="empty-state public-empty-state">
          <div><Search size={30} aria-hidden="true" /></div>
          <h2>{settings.regionId === 'smolensk-oblast' ? t('search.emptyTitle') : t('search.regionEmptyTitle')}</h2>
          <p>{t('search.emptyText')}</p>
          <Link className="profile-primary-action" to={settings.regionId === 'smolensk-oblast' ? '/profile/submissions' : '/feedback'}>{settings.regionId === 'smolensk-oblast' ? t('search.suggestPlace') : t('search.regionEmptyAction')}</Link>
        </section>
      )}

      {secondaryResults.length ? (
        <section className="search-secondary-section">
          <h2>Полезное по запросу</h2>
          <div className="search-results-list search-results-list--secondary">
            {secondaryResults.slice(0, 4).map(({ item }) => {
              const itemTitle = getLocalizedText(item.title, language);
              const description = getLocalizedText(item.description, language);
              const favoriteType = canFavorite(item.type) ? item.type : undefined;
              const isFavorite = favoriteType ? favorites.some((favorite) => favorite.id === item.id && favorite.type === favoriteType) : false;

              return (
                <article className="search-result-card public-secondary-card" key={item.id}>
                  <span className="search-result-card__visual">
                    {item.image ? <ImageWithFallback src={item.image} alt={itemTitle} /> : <Search size={24} aria-hidden="true" />}
                  </span>
                  <div className="search-result-card__main">
                    <span>{item.category ? t(categoryLabels[item.category]) : t(getSearchEntityLabelKey(item.type))}</span>
                    <h2>{itemTitle}</h2>
                    <p>{description}</p>
                  </div>
                  <div className="search-result-card__actions">
                    {favoriteType ? (
                      <button
                        type="button"
                        className={isFavorite ? 'is-active' : ''}
                        onClick={() => {
                          const added = toggleFavorite({ id: item.id, type: favoriteType, title: itemTitle, description });
                          showToast(added ? t('favorites.addedToast') : t('favorites.removedToast'));
                        }}
                        aria-label={isFavorite ? t('favorites.removeLabel') : t('home.favoriteAdd')}
                      >
                        <Heart size={17} />
                      </button>
                    ) : <span />}
                    <Link to={item.targetPath} state={{ from: locationState }}>Открыть</Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}
    </section>
  );
}
