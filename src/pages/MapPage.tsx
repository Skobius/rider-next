import {
  AlertTriangle,
  CalendarDays,
  ExternalLink,
  MapPin,
  Route,
  Wrench,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { appCategories } from '../data/categories';
import type { EventItem } from '../data/events';
import { verificationLabels, type PlaceItem } from '../data/places';
import { getRegionContentStatus, getRegionLabel, getRegionMapLocation } from '../data/regions';
import type { RouteItem } from '../data/routes';
import { useBackendContent } from '../shared/content/backendContent';
import { getLocalizedText } from '../shared/i18n/localizedText';
import { useI18n } from '../shared/i18n/useI18n';
import { useGuestSettings } from '../shared/storage/guestSettings';
import { ImageWithFallback } from '../shared/ui/ImageWithFallback';

type YMapInstance = {
  destroy(): void;
  setCenter(center: [number, number], zoom?: number, options?: unknown): void;
  geoObjects: {
    add(child: unknown): void;
    removeAll(): void;
  };
  events: {
    add(eventName: string, handler: () => void): void;
  };
};

type YPlacemark = {
  events: {
    add(eventName: string, handler: (event?: { stopPropagation?: () => void }) => void): void;
    fire(eventName: string): void;
  };
  properties?: {
    set(key: string, value: unknown): void;
  };
};

type YMaps = {
  ready(callback: () => void): void;
  Map: new (node: HTMLElement, state: { center: [number, number]; zoom: number; controls?: string[] }) => YMapInstance;
  Placemark: new (
    coordinates: [number, number],
    properties: { hintContent?: string; balloonContentHeader?: string; balloonContentBody?: string },
    options?: {
      openBalloonOnClick?: boolean;
      openHintOnHover?: boolean;
      preset?: string;
      iconColor?: string;
    },
  ) => YPlacemark;
};

declare global {
  interface Window {
    ymaps?: YMaps;
  }
}

interface MapPoint {
  id: string;
  type: 'place' | 'route' | 'event';
  categoryId: string;
  title: string;
  description: string;
  image?: string;
  coordinates: [number, number];
  url: string;
  mapUrl?: string;
  meta?: string;
  place?: PlaceItem;
}

const mapApiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY as string | undefined;
let yandexMapsPromise: Promise<YMaps> | null = null;

const mapFilterOptions = [
  { id: 'all', title: 'Все', icon: MapPin },
  { id: 'place', title: 'Места', icon: Wrench },
  { id: 'route', title: 'Маршруты', icon: Route },
  { id: 'event', title: 'События', icon: CalendarDays },
] as const;

function loadYandexMaps() {
  if (!mapApiKey) return Promise.reject(new Error('missing-api-key'));
  if (typeof navigator !== 'undefined' && !navigator.onLine) return Promise.reject(new Error('offline'));
  if (window.ymaps) return new Promise<YMaps>((resolve) => window.ymaps!.ready(() => resolve(window.ymaps!)));

  yandexMapsPromise ??= new Promise<YMaps>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(mapApiKey)}&lang=ru_RU`;
    script.async = true;
    script.dataset.motohubYandexMap = 'true';
    script.onload = () => window.ymaps?.ready(() => resolve(window.ymaps!));
    script.onerror = () => reject(new Error('load-error'));
    document.head.appendChild(script);
  });

  return yandexMapsPromise;
}

function getPlacePoints(regionId: string, places: PlaceItem[]): MapPoint[] {
  return places
    .filter((place) => place.regionId === regionId)
    .filter((place) => place.mapVisibility !== false && place.coordinates)
    .map((place) => ({
      id: place.id,
      type: 'place',
      categoryId: place.categoryId,
      title: getLocalizedText(place.name, 'ru'),
      description: getLocalizedText(place.shortDescription, 'ru'),
      image: place.coverImage ?? place.image,
      coordinates: place.coordinates!,
      url: `/place/${place.id}`,
      mapUrl: place.mapUrl,
      meta: getLocalizedText(verificationLabels[place.verificationStatus], 'ru'),
      place,
    }));
}

function getRoutePoints(regionId: string, routes: RouteItem[]): MapPoint[] {
  return routes
    .filter((route) => route.regionId === regionId && route.coordinates)
    .map((route) => ({
      id: route.id,
      type: 'route',
      categoryId: 'route',
      title: getLocalizedText(route.title, 'ru'),
      description: getLocalizedText(route.description, 'ru'),
      image: route.image,
      coordinates: route.coordinates!,
      url: `/route/${route.id}`,
      mapUrl: route.mapUrl,
      meta: route.meta?.duration ? getLocalizedText(route.meta.duration, 'ru') : 'Маршрут',
    }));
}

function getEventPoints(regionId: string, events: EventItem[]): MapPoint[] {
  return events
    .filter((event) => event.regionId === regionId && event.coordinates)
    .map((event) => ({
      id: event.id,
      type: 'event',
      categoryId: 'event',
      title: getLocalizedText(event.title, 'ru'),
      description: getLocalizedText(event.description, 'ru'),
      image: event.image,
      coordinates: event.coordinates!,
      url: `/event/${event.id}`,
      mapUrl: event.mapUrl,
      meta: event.exactDate ? getLocalizedText(event.meta?.date ?? { ru: event.exactDate }, 'ru') : 'Событие',
    }));
}

function getPoints(regionId: string, content: { places: PlaceItem[]; routes: RouteItem[]; events: EventItem[] }) {
  return [...getPlacePoints(regionId, content.places), ...getRoutePoints(regionId, content.routes), ...getEventPoints(regionId, content.events)];
}

function getInitialLocation(regionId: string) {
  const regionLocation = getRegionMapLocation(regionId);
  return { center: regionLocation.center ?? [32.0453, 54.7826], zoom: regionLocation.zoom };
}

function toYandexCoordinates(coordinates: [number, number]): [number, number] {
  return [coordinates[1], coordinates[0]];
}

function getMarkerColor(point: MapPoint) {
  if (point.type === 'event') return '#ffb23f';
  if (point.type === 'route') return '#3f7cff';
  return '#ff6418';
}

function getEmptyCopy(regionId: string, hasRegionPlaces: boolean) {
  const status = getRegionContentStatus(regionId);

  if (status === 'not_started') {
    return {
      title: 'Регион пока не наполнен',
      text: 'На карте ещё нет проверенных мест для этого региона. Информация будет добавляться постепенно.',
    };
  }

  if (status === 'in_progress' && !hasRegionPlaces) {
    return {
      title: 'Карта находится в процессе наполнения',
      text: 'Мы уже собираем и проверяем места для этого региона, но подтверждённых точек пока нет.',
    };
  }

  return {
    title: 'Для этого региона пока нет мест с подтверждённым расположением',
    text: 'Карточки мест уже могут быть в разделе «Места», но на карту попадут только точки с подтверждёнными координатами.',
  };
}

function MapCanvas({ points, regionId, selectedId, onSelect }: { points: MapPoint[]; regionId: string; selectedId?: string; onSelect: (point: MapPoint) => void }) {
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<YMapInstance | null>(null);
  const lastPointsKeyRef = useRef('');
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('Проверьте подключение к интернету и попробуйте ещё раз.');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let alive = true;

    setState('loading');
    loadYandexMaps()
      .then((ymaps3) => {
        if (!alive || !nodeRef.current) return;

        const initialLocation = getInitialLocation(regionId);
        const map = new ymaps3.Map(nodeRef.current, {
          center: toYandexCoordinates(initialLocation.center),
          zoom: initialLocation.zoom,
          controls: ['zoomControl'],
        });
        mapRef.current = map;
        setState('ready');
      })
      .catch((error: Error) => {
        if (!alive) return;
        setErrorMessage(error.message === 'offline'
          ? 'Для загрузки карты требуется подключение к интернету.'
          : 'Яндекс Карт не принял ключ или JavaScript API не подключён для этого ключа. Проверьте настройки ключа в кабинете Яндекса.');
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

    loadYandexMaps().then((ymaps3) => {
      const pointsKey = points.map((point) => point.id).join('|');
      map.geoObjects.removeAll();

      points.forEach((point) => {
        const placemark = new ymaps3.Placemark(
          toYandexCoordinates(point.coordinates),
          {
            hintContent: point.title,
            balloonContentHeader: point.title,
            balloonContentBody: point.description,
          },
          {
            preset: selectedId === point.id ? 'islands#redDotIcon' : 'islands#circleDotIcon',
            iconColor: getMarkerColor(point),
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

  if (state === 'error') {
    return (
      <section className="empty-state map-error-state">
        <div><AlertTriangle size={30} aria-hidden="true" /></div>
        <h2>Не удалось загрузить карту</h2>
        <p>{errorMessage}</p>
        <button
          className="profile-primary-action"
          type="button"
          onClick={() => {
            setRetryKey((value) => value + 1);
            setState('loading');
          }}
        >
          Повторить
        </button>
      </section>
    );
  }

  return (
    <div className="map-canvas-wrap">
      {state === 'loading' ? <div className="map-loading">Загружаем карту...</div> : null}
      <div ref={nodeRef} className="map-canvas" />
    </div>
  );
}

function PointPreview({ point, onClose }: { point: MapPoint; onClose: () => void }) {
  const { language } = useI18n();
  const category = appCategories.find((item) => item.id === point.categoryId);
  const branch = point.place?.branches[0];
  const kindLabel = point.type === 'route' ? 'Маршрут' : point.type === 'event' ? 'Событие' : 'Место';

  return (
    <article className="map-place-preview">
      <button className="map-place-preview__close" type="button" onClick={onClose} aria-label="Закрыть карточку">
        <X size={18} aria-hidden="true" />
      </button>
      <ImageWithFallback src={point.image} alt={point.title} />
      <div>
        <span>{category ? getLocalizedText(category.title, language) : kindLabel}</span>
        <h2>{point.title}</h2>
        <p>{point.description}</p>
        {point.meta ? <small>{point.meta}</small> : null}
        {branch?.address ? <em>{getLocalizedText(branch.address, language)}</em> : null}
        {branch?.schedule ? <em>{getLocalizedText(branch.schedule, language)}</em> : null}
      </div>
      <div className="map-place-preview__actions">
        <Link to={point.url}>Подробнее</Link>
        {point.mapUrl ? <a href={point.mapUrl} target="_blank" rel="noreferrer">Открыть в Яндекс Картах <ExternalLink size={14} /></a> : null}
      </div>
    </article>
  );
}

export function MapPage() {
  const settings = useGuestSettings();
  const backendContent = useBackendContent();
  const [selectedType, setSelectedType] = useState<'all' | MapPoint['type']>('all');
  const [selectedPlaceCategory, setSelectedPlaceCategory] = useState('all');
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);
  const regionPlaces = useMemo(() => backendContent.places.filter((place) => place.regionId === settings.regionId), [backendContent.places, settings.regionId]);
  const allPoints = useMemo(() => getPoints(settings.regionId, backendContent), [backendContent, settings.regionId]);
  const placeCategoryFilters = useMemo(() => (
    appCategories
      .filter((category) => category.sectionId === 'places')
      .map((category) => ({
        id: category.id,
        title: getLocalizedText(category.title, 'ru'),
        count: allPoints.filter((point) => point.type === 'place' && point.categoryId === category.id).length,
      }))
      .filter((category) => category.count > 0)
  ), [allPoints]);
  const visiblePoints = useMemo(() => (
    allPoints.filter((point) => {
      if (selectedType !== 'all' && point.type !== selectedType) return false;
      if (selectedType === 'place' && selectedPlaceCategory !== 'all' && point.categoryId !== selectedPlaceCategory) return false;
      return true;
    })
  ), [allPoints, selectedPlaceCategory, selectedType]);
  const emptyCopy = getEmptyCopy(settings.regionId, regionPlaces.length > 0);

  useEffect(() => {
    if (selectedPoint && !visiblePoints.some((point) => point.id === selectedPoint.id)) {
      setSelectedPoint(null);
    }
  }, [selectedPoint, visiblePoints]);

  useEffect(() => {
    if (selectedType !== 'place') setSelectedPlaceCategory('all');
  }, [selectedType]);

  if (!mapApiKey) {
    return (
      <section className="motohub-screen simple-screen map-screen">
        <header className="simple-screen__header">
          <p>Карта</p>
          <h1>Карта временно недоступна</h1>
          <span>Для загрузки карты не настроен API-ключ Яндекс Карт.</span>
        </header>
      </section>
    );
  }

  if (!visiblePoints.length) {
    return (
      <section className="motohub-screen simple-screen map-screen">
        <header className="simple-screen__header">
          <p>{getRegionLabel(settings.regionId)}</p>
          <h1>Карта</h1>
          <span>Места, маршруты и события МотоГде</span>
        </header>
        <section className="empty-state">
          <div><MapPin size={30} aria-hidden="true" /></div>
          <h2>{emptyCopy.title}</h2>
          <p>{emptyCopy.text}</p>
          <Link className="profile-primary-action" to="/sections/places">Открыть места</Link>
        </section>
      </section>
    );
  }

  return (
    <section className="motohub-screen map-screen">
      <header className="map-header">
        <div>
          <p>{getRegionLabel(settings.regionId)}</p>
          <h1>Карта</h1>
          <span>{visiblePoints.length} точек на карте</span>
        </div>
      </header>

      <div className="map-filter-row" aria-label="Фильтр категорий карты">
        {mapFilterOptions.map((filter) => {
          const count = filter.id === 'all' ? allPoints.length : allPoints.filter((point) => point.type === filter.id).length;
          const Icon = filter.icon;

          return (
            <button
              type="button"
              aria-pressed={selectedType === filter.id}
              disabled={!count}
              className={selectedType === filter.id ? 'is-active' : ''}
              onClick={() => {
                setSelectedType(filter.id);
                setSelectedPoint(null);
              }}
              key={filter.id}
            >
              <Icon size={15} aria-hidden="true" />
              {filter.title}
              <span>{count}</span>
            </button>
          );
        })}
      </div>

      {selectedType === 'place' ? (
        <div className="map-filter-row map-filter-row--sub" aria-label="Фильтр мест на карте">
          <button
            type="button"
            aria-pressed={selectedPlaceCategory === 'all'}
            className={selectedPlaceCategory === 'all' ? 'is-active' : ''}
            onClick={() => {
              setSelectedPlaceCategory('all');
              setSelectedPoint(null);
            }}
          >
            Все места <span>{allPoints.filter((point) => point.type === 'place').length}</span>
          </button>
          {placeCategoryFilters.map((category) => (
            <button
              type="button"
              aria-pressed={selectedPlaceCategory === category.id}
              className={selectedPlaceCategory === category.id ? 'is-active' : ''}
              onClick={() => {
                setSelectedPlaceCategory(category.id);
                setSelectedPoint(null);
              }}
              key={category.id}
            >
              {category.title}
              <span>{category.count}</span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="map-stage">
        <MapCanvas
          points={visiblePoints}
          regionId={settings.regionId}
          selectedId={selectedPoint?.id}
          onSelect={setSelectedPoint}
        />
        {selectedPoint ? <PointPreview point={selectedPoint} onClose={() => setSelectedPoint(null)} /> : null}
      </div>
    </section>
  );
}
