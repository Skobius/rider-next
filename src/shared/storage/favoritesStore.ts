import { useSyncExternalStore } from 'react';

export type FavoriteType = 'place' | 'route' | 'event';

export interface FavoriteItem {
  id: string;
  type: FavoriteType;
  title: string;
  description: string;
  addedAt: string;
}

const storageKey = 'motohub.favorites.v1';
const listeners = new Set<() => void>();
let cachedFavorites: FavoriteItem[] | null = null;

function loadFavorites(): FavoriteItem[] {
  if (typeof localStorage === 'undefined') return [];

  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) ?? '[]') as FavoriteItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readFavorites(): FavoriteItem[] {
  cachedFavorites ??= loadFavorites();
  return cachedFavorites;
}

function writeFavorites(items: FavoriteItem[]) {
  cachedFavorites = items;

  try {
    localStorage.setItem(storageKey, JSON.stringify(items));
  } catch {
    // Favorites are local-only for now, so storage failures should not crash the app.
  }

  listeners.forEach((listener) => listener());
}

export function useFavorites() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    readFavorites,
    () => [],
  );
}

export function toggleFavorite(item: Omit<FavoriteItem, 'addedAt'>) {
  const current = readFavorites();
  const exists = current.some((favorite) => favorite.id === item.id && favorite.type === item.type);
  const next = exists
    ? current.filter((favorite) => favorite.id !== item.id || favorite.type !== item.type)
    : [{ ...item, addedAt: new Date().toISOString() }, ...current];
  writeFavorites(next);
  return !exists;
}

export function migrateGuestFavoritesToAccount() {
  return readFavorites();
}
