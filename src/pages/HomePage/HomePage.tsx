import { GraduationCap, MapPinned, MapPin, Mic, Search, ShieldCheck, ShoppingBag, Umbrella, Wrench } from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { appCategories } from '../../data/categories';
import { getPlacePrimaryBranch, type PlaceItem } from '../../data/places';
import type { SearchCategory } from '../../data/searchContent';
import { getRegionLabel } from '../../data/regions';
import { useBackendContent } from '../../shared/content/backendContent';
import { getLocalizedText } from '../../shared/i18n/localizedText';
import { useI18n } from '../../shared/i18n/useI18n';
import { useInstallPrompt } from '../../shared/pwa/useInstallPrompt';
import { useGuestSettings } from '../../shared/storage/guestSettings';
import { ImageWithFallback } from '../../shared/ui/ImageWithFallback';

interface QuickFindItem {
  title: string;
  icon: typeof Wrench;
  query?: string;
  category?: SearchCategory;
  type?: 'place';
}

const physicalHomeCategoryRank: Record<string, number> = {
  'places-tire-services': 0,
  'places-services': 1,
  'moto-shops': 2,
  'places-fuel': 3,
  'places-insurance': 4,
  'places-storage': 5,
};

const quickFindItems: QuickFindItem[] = [
  { title: 'Шиномонтаж', icon: Wrench, query: 'шиномонтаж', category: 'service', type: 'place' },
  { title: 'Мотосервисы', icon: Wrench, query: 'мотосервис', category: 'service', type: 'place' },
  { title: 'Магазины', icon: ShoppingBag, query: 'экипировка', category: 'equipment', type: 'place' },
  { title: 'Страховка', icon: Umbrella, query: 'страховка', category: 'insurance', type: 'place' },
  { title: 'Обучение', icon: GraduationCap, query: 'обучение', category: 'training', type: 'place' },
  { title: 'Все места', icon: MapPinned, type: 'place' },
];

function getPhysicalHomeRank(place: PlaceItem) {
  return physicalHomeCategoryRank[place.categoryId] ?? 20;
}

function getCategoryTitle(place: PlaceItem, language: 'ru' | 'en') {
  const category = appCategories.find((item) => item.id === place.categoryId);
  return category ? getLocalizedText(category.title, language) : 'Место';
}

function getPlaceAddress(place: PlaceItem, language: 'ru' | 'en') {
  const branch = getPlacePrimaryBranch(place);
  return branch?.address ? getLocalizedText(branch.address, language) : 'Смоленск и область';
}

function getPlaceStatus(place: PlaceItem) {
  if (place.verificationStatus === 'verified_mg67' || place.verificationStatus === 'confirmed') return 'Открыто';
  return 'Проверить перед выездом';
}

function getMapPinStyle(place: PlaceItem) {
  const coordinates = place.coordinates;
  if (!coordinates) return { left: '50%', top: '50%' };
  const [lng, lat] = coordinates;
  const left = Math.max(12, Math.min(88, ((lng - 31.86) / 0.48) * 100));
  const top = Math.max(12, Math.min(88, ((54.9 - lat) / 0.34) * 100));
  return { left: `${left}%`, top: `${top}%` };
}

export function HomePage() {
  const navigate = useNavigate();
  const { language } = useI18n();
  const settings = useGuestSettings();
  const installPrompt = useInstallPrompt();
  const backendContent = useBackendContent();
  const [query, setQuery] = useState('');
  const region = getRegionLabel(settings.regionId);

  const publishedPlaces = useMemo(() => backendContent.places
    .filter((place) => place.mapVisibility !== false)
    .sort((a, b) => getPhysicalHomeRank(a) - getPhysicalHomeRank(b)
      || Number(Boolean(b.featured)) - Number(Boolean(a.featured))
      || getLocalizedText(a.name, language).localeCompare(getLocalizedText(b.name, language))),
  [backendContent.places, language]);
  const nearbyPlaces = publishedPlaces.slice(0, 3);
  const mapPlaces = publishedPlaces.filter((place) => place.coordinates).slice(0, 8);

  function openSearch(item: QuickFindItem) {
    const params = new URLSearchParams();
    if (item.query) params.set('q', item.query);
    if (item.category) params.set('category', item.category);
    params.set('type', 'place');
    navigate(`/search?${params.toString()}`);
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    params.set('type', 'place');
    navigate(`/search?${params.toString()}`);
  }

  return (
    <section className="motohub-screen public-ui-v2 public-home-screen">
      <header className="motohub-hero public-home-hero">
        <div className="motohub-topbar public-home-topbar">
          <Link className="motohub-logo" to="/search" aria-label="МотоГде">
            <img className="motohub-logo__image motohub-logo__image--dark" src="/assets/brand/motogde-logo-dark.png" alt="МотоГде" />
            <img className="motohub-logo__image motohub-logo__image--light" src="/assets/brand/motogde-logo-light.png" alt="МотоГде" />
          </Link>
          <Link className="motohub-location" to="/region">
            <MapPin size={15} aria-hidden="true" />
            <span>{region}</span>
          </Link>
        </div>

        <div className="motohub-hero-copy public-home-copy">
          <h1>Что нужно найти?</h1>
        </div>

        <form className="motohub-search public-home-search" onSubmit={submitSearch}>
          <Search size={20} aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Например: шиномонтаж, сервис, масло..." />
          <button type="submit" aria-label="Найти"><Mic size={18} aria-hidden="true" /></button>
        </form>
      </header>

      <main className="home-content public-home-content">
        <section className="quick-find-grid public-quick-grid" aria-label="Быстрый доступ">
          {quickFindItems.map((item) => {
            const Icon = item.icon;
            return (
              <button className="quick-find-card public-quick-card" type="button" key={item.title} onClick={() => openSearch(item)}>
                <Icon size={25} aria-hidden="true" />
                <span>{item.title}</span>
              </button>
            );
          })}
        </section>

        <section className="home-nearby-section">
          <div className="home-section-heading">
            <h2>Рядом сейчас</h2>
            <Link to="/map">Смотреть все</Link>
          </div>
          <div className="home-nearby-grid">
            {nearbyPlaces.map((place) => {
              const title = getLocalizedText(place.name, language);
              return (
                <Link className="home-place-card" to={`/place/${place.id}`} key={place.id}>
                  <span className="home-place-card__media">
                    <ImageWithFallback src={place.coverImage ?? place.image} alt={title} />
                    <b>{getPlaceStatus(place)}</b>
                  </span>
                  <span className="home-place-card__body">
                    <strong>{title}</strong>
                    <small>{getCategoryTitle(place, language)}</small>
                    <span>{getPlaceAddress(place, language)}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="home-map-preview">
          <div className="home-map-preview__canvas" aria-hidden="true">
            {mapPlaces.map((place, index) => <span className="home-map-preview__pin" style={getMapPinStyle(place)} key={place.id}>{index + 1}</span>)}
          </div>
          <div className="home-map-preview__content">
            <span>Карта МотоГде</span>
            <h2>Места на карте Смоленска</h2>
            <p>Сервисы, магазины, шиномонтажи и точки для райдеров в одном экране.</p>
            <Link to="/map">Смотреть на карте</Link>
          </div>
        </section>

        {installPrompt.canShowInstallUi ? (
          <section className="home-install-card public-install-card">
            <img src="/assets/brand/pwa-192x192.png" alt="" aria-hidden="true" />
            <div>
              <strong>Установить МотоГде</strong>
              <span>Открывайте сервис с иконки, как обычное приложение.</span>
            </div>
            <Link to="/install">Установить</Link>
          </section>
        ) : null}

        <section className="home-source-note">
          <ShieldCheck size={17} aria-hidden="true" />
          <span>Если геолокация недоступна, показываем места выбранного региона.</span>
        </section>
      </main>
    </section>
  );
}
