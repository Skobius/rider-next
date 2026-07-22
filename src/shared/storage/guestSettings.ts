import { useSyncExternalStore } from 'react';
import { defaultRegionId } from '../../data/regions';

export type GuestLanguage = 'ru' | 'en';
export type GuestTheme = 'dark' | 'light' | 'system';

export interface GuestSettings {
  schemaVersion: 1;
  language: GuestLanguage;
  theme: GuestTheme;
  regionId: string;
  city: string;
  displayName: string;
  behavior: 'compact' | 'comfortable';
  notificationPreferences: {
    usefulTips: boolean;
    localEvents: boolean;
    serviceReminders: boolean;
  };
}

const storageKey = 'motohub.settings.v1';

const defaultSettings: GuestSettings = {
  schemaVersion: 1,
  language: 'ru',
  theme: 'dark',
  regionId: defaultRegionId,
  city: '',
  displayName: '',
  behavior: 'comfortable',
  notificationPreferences: {
    usefulTips: true,
    localEvents: true,
    serviceReminders: false,
  },
};

const listeners = new Set<() => void>();
let cachedSettings: GuestSettings | null = null;

function loadSettings(): GuestSettings {
  if (typeof localStorage === 'undefined') return defaultSettings;

  try {
    const raw = localStorage.getItem(storageKey);

    if (!raw) {
      const initial = { ...defaultSettings };
      localStorage.setItem(storageKey, JSON.stringify(initial));
      localStorage.setItem('motohub-region', initial.regionId);
      return initial;
    }

    const parsed = JSON.parse(raw) as Partial<GuestSettings>;
    return {
      ...defaultSettings,
      ...parsed,
      notificationPreferences: {
        ...defaultSettings.notificationPreferences,
        ...parsed.notificationPreferences,
      },
    };
  } catch {
    return defaultSettings;
  }
}

function readSettings(): GuestSettings {
  cachedSettings ??= loadSettings();
  return cachedSettings;
}

function emit() {
  listeners.forEach((listener) => listener());
}

export function getGuestSettings() {
  return readSettings();
}

export function updateGuestSettings(input: Partial<GuestSettings>) {
  const current = readSettings();
  const next: GuestSettings = {
    ...current,
    ...input,
    notificationPreferences: {
      ...current.notificationPreferences,
      ...input.notificationPreferences,
    },
  };

  cachedSettings = next;

  try {
    localStorage.setItem(storageKey, JSON.stringify(next));
    localStorage.setItem('motohub-region', next.regionId);
  } catch {
    // Storage can be blocked in private or strict browser modes.
  }

  if (input.language && typeof document !== 'undefined') {
    document.documentElement.lang = input.language;
  }

  emit();
  return next;
}

export function useGuestSettings() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    readSettings,
    () => defaultSettings,
  );
}

export function applyStoredTheme(settings = readSettings()) {
  if (typeof document === 'undefined') return;

  const systemPrefersLight = typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches;
  const resolved = settings.theme === 'system' ? (systemPrefersLight ? 'light' : 'dark') : settings.theme;
  document.documentElement.dataset.theme = resolved;
}
