import {
  AlertTriangle,
  ArrowUpRight,
  MapPin,
  Navigation,
  Search,
  X,
} from 'lucide-react';
import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { appCategories } from '../data/categories';
import { verificationLabels, type PlaceItem } from '../data/places';
import { getRegionLabel } from '../data/regions';
import { useBackendContent } from '../shared/content/backendContent';
import { getLocalizedText } from '../shared/i18n/localizedText';
import { useI18n } from '../shared/i18n/useI18n';
import { getInitialLocation, loadYandexMaps, toYandexCoordinates, type YMapInstance } from '../shared/maps/yandexMaps';
import { type GuestLanguage, useGuestSettings } from '../shared/storage/guestSettings';
import { ImageWithFallback } from '../shared/ui/ImageWithFallback';

interface MapPoint {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  image?: string;
  coordinates: [number, number];
  url: string;
  mapUrl?: string;
  status: string;
  address?: string;
  schedule?: string;
  place: PlaceItem;
}

interface MapFilter {
  id: 'all' | 'tire' | 'services' | 'shops' | 'training';
  title: string;
  categoryIds: readonly string[];
}

const mapFilters: readonly MapFilter[] = [
  { id: 'all', title: 'Все', categoryIds: [] },
  { id: 'tire', title: 'Шиномонтаж', categoryIds: ['places-tire-services'] },
  { id: 'services', title: 'Сервисы', categoryIds: ['places-services'] },
  { id: 'shops', title: 'Магазины', categoryIds: ['moto-shops'] },
  { id: 'training', title: 'Обучение', categoryIds: ['places-schools-instructors', 'places-training-areas'] },
];

function getCategoryTitle(categoryId: string, language: GuestLanguage) {
  const category = appCategories.find((item) => item.id === categoryId);
  return category ? getLocalizedText(category.title, language) : 'Место';
}

function getMapPoints(regionId: string, places: PlaceItem[]): MapPoint[] {
  return places
    .filter((place) => place.regionId === regionId)
    .filter((place) => place.mapVisibility !== false && place.coordinates)
    .map((place) => {
      const branch = place.branches[0];

      return {
        id: place.id,
        categoryId: place.categoryId,
        title: getLocalizedText(place.name, 'ru'),
        description: getLocalizedText(place.shortDescription, 'ru'),
        image: place.coverImage ?? place.image,
        coordinates: place.coordinates!,
        url: `/place/${place.id}`,
        mapUrl: branch?.mapUrl ?? place.mapUrl,
        status: getLocalizedText(verificationLabels[place.verificationStatus], 'ru'),
        address: branch?.address ? getLocalizedText(branch.address, 'ru') : undefined,
        schedule: branch?.schedule ? getLocalizedText(branch.schedule, 'ru') : undefined,
        place,
      };
    });
}

function MapCanvas({
  points,
  regionId,
  selectedId,
  onSelect,
}: {
  points: MapPoint[];
  regionId: string;
  selectedId?: string;
  onSelect: (point: MapPoint) => void;
}) {
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<YMapInstance | null>(null);
  const lastPointsKeyRef = useRef('');
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('Карта не загрузилась. Используем выбранный регион и список мест.');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let alive = true;

    setState('loading');
    loadYandexMaps()
      .then((ymaps) => {
        if (!alive || !nodeRef.current) return;

        const initialLocation = getInitialLocation(regionId);
        const map = new ymaps.Map(nodeRef.current, {
          center: toYandexCoordinates(initialLocation.center),
          zoom: initialLocation.zoom,
          controls: ['zoomControl'],
        });

        mapRef.current = map;
        setState('ready');
      })
      .catch((error: Error) => {
        if (!alive) return;

        setErrorMessage(error.message === 'missing-api-key'
          ? 'Для карты не настроен ключ Яндекс.Карт.'
          : 'Карта временно недоступна. Места ниже остаются доступными.');
        setState('error');
      });

    return () => {
      alive = false;
      mapRef.current?.destroy();
      mapRef.current = null;
    };
  }, [regionId, retryKey]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || state !== 'ready') return;

    loadYandexMaps().then((ymaps) => {
      const pointsKey = points.map((point) => point.id).join('|');
      map.geoObjects.removeAll();

      points.forEach((point) => {
        const placemark = new ymaps.Placemark(
          toYandexCoordinates(point.coordinates),
          { hintContent: point.title },
          {
            preset: selectedId === point.id ? 'islands#orangeDotIcon' : 'islands#circleDotIcon',
            iconColor: selectedId === point.id ? '#ff6418' : '#20282b',
            openBalloonOnClick: false,
            openHintOnHover: true,
          },
        );

        placemark.events.add('click', (event?: { stopPropagation?: () => void }) => {
          event?.stopPropagation?.();
          onSelect(point);
        });

        map.geoObjects.add(placemark);
      });

      if (lastPointsKeyRef.current !== pointsKey) {
        lastPointsKeyRef.current = pointsKey;
        const initialLocation = getInitialLocation(regionId);
        map.setCenter(toYandexCoordinates(initialLocation.center), initialLocation.zoom, { duration: 300 });
      }
    });
  }, [onSelect, points, regionId, selectedId, state]);

  return (
    <div className="map-canvas-wrap">
      {state === 'loading' ? <div className="map-loading">Загружаем карту...</div> : null}
      {state === 'error' ? (
        <div className="map-soft-error">
          <AlertTriangle size={18} aria-hidden="true" />
          <span>{errorMessage}</span>
          <button type="button" onClick={() => setRetryKey((value) => value + 1)}>Повторить</button>
        </div>
      ) : null}
      <div ref={nodeRef} className="map-canvas" />
    </div>
  );
}

function PointPreview({ point, onClose }: { point: MapPoint; onClose: () => void }) {
  const { language } = useI18n();
  const categoryTitle = getCategoryTitle(point.categoryId, language);

  return (
    <article className="map-place-preview">
      <button className="map-place-preview__close" type="button" onClick={onClose} aria-label="Закрыть карточку">
        <X size={17} aria-hidden="true" />
      </button>
      <ImageWithFallback src={point.image} alt={point.title} />
      <div className="map-place-preview__copy">
        <span>{categoryTitle}</span>
        <h2>{point.title}</h2>
        <p>{point.address ?? point.description}</p>
        {point.schedule ? <small>{point.schedule}</small> : null}
        <em>{point.status}</em>
      </div>
      <div className="map-place-preview__actions">
        {point.mapUrl ? (
          <a className="map-route-action" href={point.mapUrl} target="_blank" rel="noreferrer">
            <Navigation size={15} aria-hidden="true" />
            Маршрут
          </a>
        ) : null}
        <Link to={point.url}>
          Карточка
          <ArrowUpRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

function MapListItem({ point, active, onSelect }: { point: MapPoint; active: boolean; onSelect: (point: MapPoint) => void }) {
  const { language } = useI18n();

  return (
    <button className={active ? 'map-list-item is-active' : 'map-list-item'} type="button" onClick={() => onSelect(point)}>
      <ImageWithFallback src={point.image} alt={point.title} />
      <span>
        <b>{point.title}</b>
        <small>{getCategoryTitle(point.categoryId, language)}</small>
        <em>{point.address ?? point.description}</em>
      </span>
    </button>
  );
}

export function MapPage() {
  const navigate = useNavigate();
  const settings = useGuestSettings();
  const backendContent = useBackendContent();
  const [query, setQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<(typeof mapFilters)[number]['id']>('all');
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);
  const points = useMemo(() => getMapPoints(settings.regionId, backendContent.places), [backendContent.places, settings.regionId]);
  const visiblePoints = useMemo(() => {
    const filter = mapFilters.find((item) => item.id === selectedFilter);
    const normalizedQuery = query.trim().toLowerCase();

    return points.filter((point) => {
      if (filter && filter.categoryIds.length && !filter.categoryIds.includes(point.categoryId)) return false;
      if (!normalizedQuery) return true;

      return `${point.title} ${point.description} ${point.address ?? ''}`.toLowerCase().includes(normalizedQuery);
    });
  }, [points, query, selectedFilter]);

  const selectPoint = useCallback((point: MapPoint) => {
    setSelectedPoint(point);
  }, []);

  useEffect(() => {
    if (selectedPoint && !visiblePoints.some((point) => point.id === selectedPoint.id)) {
      setSelectedPoint(null);
    }
  }, [selectedPoint, visiblePoints]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    if (value) navigate(`/search?q=${encodeURIComponent(value)}`);
  }

  return (
    <section className="motohub-screen map-screen">
      <header className="map-header">
        <form className="map-search-bar" onSubmit={submitSearch}>
          <Search size={18} aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Найти место на карте" />
        </form>
        <div className="map-region-pill">
          <MapPin size={15} aria-hidden="true" />
          <span>{getRegionLabel(settings.regionId)}</span>
        </div>
      </header>

      <div className="map-filter-row" aria-label="Фильтры карты">
        {mapFilters.map((filter) => {
          const count = filter.categoryIds.length
            ? points.filter((point) => filter.categoryIds.includes(point.categoryId)).length
            : points.length;

          return (
            <button
              type="button"
              aria-pressed={selectedFilter === filter.id}
              disabled={!count}
              className={selectedFilter === filter.id ? 'is-active' : ''}
              onClick={() => {
                setSelectedFilter(filter.id);
                setSelectedPoint(null);
              }}
              key={filter.id}
            >
              {filter.title}
            </button>
          );
        })}
      </div>

      <div className="map-stage">
        <MapCanvas
          points={visiblePoints}
          regionId={settings.regionId}
          selectedId={selectedPoint?.id}
          onSelect={selectPoint}
        />

        {selectedPoint ? <PointPreview point={selectedPoint} onClose={() => setSelectedPoint(null)} /> : null}

        <aside className="map-desktop-panel" aria-label="Места на карте">
          <div>
            <span>{visiblePoints.length} мест</span>
            <strong>{selectedPoint ? selectedPoint.title : 'Выберите точку'}</strong>
          </div>
          <div className="map-desktop-list">
            {visiblePoints.slice(0, 8).map((point) => (
              <MapListItem point={point} active={selectedPoint?.id === point.id} onSelect={selectPoint} key={point.id} />
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
