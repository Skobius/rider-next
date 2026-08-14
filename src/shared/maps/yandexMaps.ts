import { getRegionMapLocation } from '../../data/regions';

export type YMapInstance = {
  destroy(): void;
  setCenter(center: [number, number], zoom?: number, options?: unknown): void;
  geoObjects: {
    add(child: unknown): void;
    removeAll(): void;
  };
  behaviors?: {
    disable(names: string[]): void;
  };
};

export type YPlacemark = {
  events: {
    add(eventName: string, handler: (event?: { stopPropagation?: () => void }) => void): void;
  };
};

export type YMaps = {
  ready(callback?: () => void): void | Promise<unknown>;
  Map: new (node: HTMLElement, state: { center: [number, number]; zoom: number; controls?: string[] }) => YMapInstance;
  Placemark: new (
    coordinates: [number, number],
    properties: { hintContent?: string },
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

const mapApiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY as string | undefined;
let yandexMapsPromise: Promise<YMaps> | null = null;

function waitForYandexReady(ymaps: YMaps) {
  if (ymaps.Map && ymaps.Placemark) return Promise.resolve(ymaps);

  return new Promise<YMaps>((resolve, reject) => {
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      clearInterval(interval);
      clearTimeout(timeout);
      resolve(ymaps);
    };

    const interval = window.setInterval(() => {
      if (ymaps.Map && ymaps.Placemark) finish();
    }, 100);

    const timeout = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      clearInterval(interval);
      reject(new Error('ready-timeout'));
    }, 12000);

    const readyResult = ymaps.ready(() => finish());
    if (readyResult && 'then' in readyResult && typeof readyResult.then === 'function') {
      readyResult.then(finish, reject);
    }
  });
}

export function loadYandexMaps() {
  if (!mapApiKey) return Promise.reject(new Error('missing-api-key'));
  if (typeof navigator !== 'undefined' && !navigator.onLine) return Promise.reject(new Error('offline'));
  if (window.ymaps) return waitForYandexReady(window.ymaps);

  yandexMapsPromise ??= new Promise<YMaps>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-motohub-yandex-map="true"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        if (window.ymaps) waitForYandexReady(window.ymaps).then(resolve, reject);
        else reject(new Error('load-error'));
      }, { once: true });
      existingScript.addEventListener('error', () => reject(new Error('load-error')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(mapApiKey)}&lang=ru_RU`;
    script.async = true;
    script.dataset.motohubYandexMap = 'true';
    script.onload = () => {
      if (window.ymaps) waitForYandexReady(window.ymaps).then(resolve, reject);
      else reject(new Error('load-error'));
    };
    script.onerror = () => reject(new Error('load-error'));
    document.head.appendChild(script);
  });

  return yandexMapsPromise;
}

export function toYandexCoordinates(coordinates: [number, number]): [number, number] {
  return [coordinates[1], coordinates[0]];
}

export function getInitialLocation(regionId: string) {
  const regionLocation = getRegionMapLocation(regionId);
  return { center: regionLocation.center ?? [32.0453, 54.7826], zoom: regionLocation.zoom };
}
