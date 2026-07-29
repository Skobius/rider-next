import { useEffect, useSyncExternalStore } from 'react';
import { events } from '../../data/events';
import { places } from '../../data/places';
import { routes } from '../../data/routes';
import { getLocalizedText } from '../i18n/localizedText';
import { supabase } from '../supabase/client';

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
let currentUserId: string | null = null;
let syncInFlight: Promise<void> | null = null;

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

function mergeFavorites(base: FavoriteItem[], incoming: FavoriteItem[]) {
  const seen = new Set<string>();
  return [...base, ...incoming]
    .filter((item) => {
      const key = `${item.type}:${item.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => Date.parse(b.addedAt) - Date.parse(a.addedAt));
}

function resolveFavoriteCopy(type: FavoriteType, id: string) {
  const item = [...places, ...routes, ...events].find((entity) => entity.id === id && entity.type === type);
  if (!item) return { title: id, description: '' };
  const title = 'name' in item ? getLocalizedText(item.name, 'ru') : getLocalizedText(item.title, 'ru');
  return { title, description: getLocalizedText(item.description, 'ru') };
}

async function loadServerFavorites(userId: string) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('favorites')
    .select('entity_type, entity_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((item) => ({
    id: String(item.entity_id),
    type: item.entity_type as FavoriteType,
    ...resolveFavoriteCopy(item.entity_type as FavoriteType, String(item.entity_id)),
    addedAt: item.created_at ?? new Date().toISOString(),
  }));
}

async function upsertServerFavorite(userId: string, item: FavoriteItem) {
  if (!supabase) return;

  await supabase.from('favorites').upsert({
    user_id: userId,
    entity_type: item.type,
    entity_id: item.id,
    created_at: item.addedAt,
  }, { onConflict: 'user_id,entity_type,entity_id' });
}

async function removeServerFavorite(userId: string, item: Pick<FavoriteItem, 'id' | 'type'>) {
  if (!supabase) return;

  await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('entity_type', item.type)
    .eq('entity_id', item.id);
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
  const nextItem = { ...item, addedAt: new Date().toISOString() };
  const next = exists
    ? current.filter((favorite) => favorite.id !== item.id || favorite.type !== item.type)
    : [nextItem, ...current];
  writeFavorites(next);

  if (currentUserId) {
    if (exists) void removeServerFavorite(currentUserId, item);
    else void upsertServerFavorite(currentUserId, nextItem);
  }

  return !exists;
}

export function migrateGuestFavoritesToAccount() {
  return readFavorites();
}

export function useFavoriteSync(userId: string | null | undefined) {
  useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    readFavorites,
    () => [],
  );

  useEffect(() => {
    if (!userId) {
      currentUserId = null;
      return;
    }

    if (userId === currentUserId || syncInFlight) return;

    currentUserId = userId;
    const localFavorites = readFavorites();

    syncInFlight = (async () => {
      try {
        const serverFavorites = await loadServerFavorites(userId);
        await Promise.all(localFavorites.map((item) => upsertServerFavorite(userId, item)));
        writeFavorites(mergeFavorites(localFavorites, serverFavorites));
      } catch {
        writeFavorites(localFavorites);
      } finally {
        syncInFlight = null;
      }
    })();
  }, [userId]);
}
