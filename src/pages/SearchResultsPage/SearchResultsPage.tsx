import { ArrowLeft, ExternalLink, Heart, MapPin, Search, SlidersHorizontal, X } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import type { SearchCategory, SearchDateFilter, SearchItemType } from '../../data/searchContent';
import { getSearchEntityLabelKey, searchMotohub, type SearchEntityType } from '../../features/search/searchEngine';
import { places } from '../../data/places';
import { getRegionLabel } from '../../data/regions';
import { getLocalizedText } from '../../shared/i18n/localizedText';
import { useI18n } from '../../shared/i18n/useI18n';
import { toggleFavorite, useFavorites } from '../../shared/storage/favoritesStore';
import { useGuestSettings } from '../../shared/storage/guestSettings';
import { PlaceCard } from '../../shared/ui/PlaceCard';
import { ImageWithFallback } from '../../shared/ui/ImageWithFallback';
import { showToast } from '../../shared/ui/toastStore';

const typeFilters: Array<{ id: SearchEntityType | 'all'; labelKey: string }> = [
  { id: 'all', labelKey: 'search.all' },
  { id: 'place', labelKey: 'search.places' },
  { id: 'route', labelKey: 'search.routes' },
  { id: 'event', labelKey: 'search.events' },
  { id: 'skill', labelKey: 'search.skills' },
];

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
  return value === 'place' || value === 'route' || value === 'event' || value === 'skill' ? value : 'all';
}

function readCategory(value: string | null): SearchCategory | 'all' {
  const categories: SearchCategory[] = ['service', 'equipment', 'route', 'event', 'training', 'insurance', 'fuel', 'storage'];
  return value && categories.includes(value as SearchCategory) ? value as SearchCategory : 'all';
}

function readDate(value: string | null): SearchDateFilter | undefined {
  return value === 'today' || value === 'evening' || value === 'upcoming' ? value : undefined;
}

function getContextTitle(params: { query: string; type: SearchEntityType | 'all'; category: SearchCategory | 'all'; date?: SearchDateFilter; featured: boolean; t: (key: string) => string }) {
  if (params.query) return params.query;
  if (params.featured) return params.t('search.contextFeatured');
  if (params.category === 'service') return params.t('search.contextService');
  if (params.category === 'equipment') return params.t('search.contextEquipment');
  if (params.category === 'training') return params.t('search.contextTraining');
  if (params.type === 'route' && params.date === 'today') return params.t('search.contextRoutesToday');
  if (params.type === 'event' && params.date === 'evening') return params.t('search.contextEventsEvening');
  if (params.type === 'route') return params.t('search.contextRoutes');
  if (params.type === 'event') return params.t('search.contextEvents');
  if (params.type === 'skill') return params.t('search.contextSkills');
  return params.t('home.heroTitle');
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
  const query = params.get('q') ?? '';
  const type = readType(params.get('type'));
  const category = readCategory(params.get('category'));
  const date = readDate(params.get('date'));
  const featured = params.get('featured') === 'true';
  const [value, setValue] = useState(query);

  const results = useMemo(() => searchMotohub({ query, regionId: settings.regionId, language, type, category, date, featured }), [category, date, featured, language, query, settings.regionId, type]);
  const region = getRegionLabel(settings.regionId);
  const title = getContextTitle({ query, type, category, date, featured, t });

  function updateSearch(next: { q?: string; type?: SearchEntityType | 'all'; category?: SearchCategory | 'all' }) {
    const nextParams = new URLSearchParams(params);
    const nextQuery = next.q ?? query;
    const nextType = next.type ?? type;
    const nextCategory = next.category ?? category;

    if (nextQuery.trim()) nextParams.set('q', nextQuery.trim());
    else nextParams.delete('q');

    if (nextType && nextType !== 'all') nextParams.set('type', nextType);
    else nextParams.delete('type');

    if (nextCategory && nextCategory !== 'all') nextParams.set('category', nextCategory);
    else nextParams.delete('category');

    navigate(`/search?${nextParams.toString()}`);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    updateSearch({ q: value });
  }

  function clearSearch() {
    setValue('');
    navigate('/search');
  }

  return (
    <section className="motohub-screen simple-screen search-results-screen">
      <Link className="back-link" to="/search">
        <ArrowLeft size={18} aria-hidden="true" />
        {t('search.back')}
      </Link>

      <header className="simple-screen__header">
        <p>{t('search.title')}</p>
        <h1>{title}</h1>
        <span>{t('search.region')}: {region}</span>
      </header>

      <form className="search-results-form" onSubmit={submit}>
        <Search size={19} aria-hidden="true" />
        <input value={value} onChange={(event) => setValue(event.target.value)} placeholder={t('search.placeholder')} />
        {value ? <button type="button" onClick={() => setValue('')} aria-label={t('search.clear')}><X size={17} /></button> : null}
        <button type="submit">{t('search.submit')}</button>
      </form>

      <div className="search-filter-row" aria-label="filters">
        {typeFilters.map((filter) => (
          <button className={type === filter.id ? 'is-active' : ''} type="button" key={filter.id} onClick={() => updateSearch({ type: filter.id })}>
            {t(filter.labelKey)}
          </button>
        ))}
      </div>

      <div className="search-meta-row">
        <span><SlidersHorizontal size={15} /> {t('search.resultsCount')}: {results.length}</span>
        {category !== 'all' ? <button type="button" onClick={() => updateSearch({ category: 'all' })}>{t(categoryLabels[category])} ×</button> : null}
      </div>

      {results.length ? (
        <div className="search-results-list">
          {results.map(({ item }) => {
            if (item.type === 'place') {
              const place = places.find((placeItem) => placeItem.id === item.id);
              if (place) return <PlaceCard place={place} from={locationState} key={item.id} />;
            }

            const title = getLocalizedText(item.title, language);
            const description = getLocalizedText(item.description, language);
            const favoriteType = canFavorite(item.type) ? item.type : undefined;
            const isFavorite = favoriteType ? favorites.some((favorite) => favorite.id === item.id && favorite.type === favoriteType) : false;

            return (
              <article className="search-result-card" key={item.id}>
                <span className="search-result-card__visual">
                  {item.image ? <ImageWithFallback src={item.image} alt={title} /> : <Search size={24} aria-hidden="true" />}
                </span>
                <div className="search-result-card__main">
                  <span>{item.category ? t(categoryLabels[item.category]) : t(getSearchEntityLabelKey(item.type))}</span>
                  <h2>{title}</h2>
                  <p>{description}</p>
                  {'services' in item && item.services?.length ? (
                    <small>{t('search.services')}: {item.services.map((service) => getLocalizedText(service, language)).join(', ')}</small>
                  ) : null}
                  <div className="search-result-card__badges">
                    {'verified' in item ? <b>{item.verified ? t('search.verified') : t('search.notVerified')}</b> : <b>{t(getSearchEntityLabelKey(item.type))}</b>}
                    {'demo' in item && item.demo ? <b>{t('search.demo')}</b> : null}
                  </div>
                </div>
                {'meta' in item && item.meta ? (
                  <div className="search-result-card__meta">
                    {item.meta.distance ? <span>{getLocalizedText(item.meta.distance, language)}</span> : null}
                    {item.meta.duration ? <span>{getLocalizedText(item.meta.duration, language)}</span> : null}
                    {item.meta.difficulty ? <span>{getLocalizedText(item.meta.difficulty, language)}</span> : null}
                    {item.meta.date ? <span>{getLocalizedText(item.meta.date, language)}</span> : null}
                    {item.meta.place ? <span><MapPin size={13} />{getLocalizedText(item.meta.place, language)}</span> : null}
                  </div>
                ) : null}
                <div className="search-result-card__actions">
                  {favoriteType ? (
                    <button
                      type="button"
                      className={isFavorite ? 'is-active' : ''}
                      onClick={() => {
                        const added = toggleFavorite({ id: item.id, type: favoriteType, title, description });
                        showToast(added ? t('favorites.addedToast') : t('favorites.removedToast'));
                      }}
                      aria-label={isFavorite ? t('favorites.removeLabel') : t('home.favoriteAdd')}
                    >
                      <Heart size={17} />
                    </button>
                  ) : <span />}
                  <Link to={item.targetPath} state={{ from: locationState }}>
                    {t('search.open')}
                    <ExternalLink size={16} />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <section className="empty-state">
          <div><Search size={30} aria-hidden="true" /></div>
          <h2>{settings.regionId === 'smolensk-oblast' ? t('search.emptyTitle') : t('search.regionEmptyTitle')}</h2>
          <p>{t('search.emptyText')}</p>
          <Link className="profile-primary-action" to="/feedback">{settings.regionId === 'smolensk-oblast' ? t('search.suggestPlace') : t('search.regionEmptyAction')}</Link>
        </section>
      )}
    </section>
  );
}
