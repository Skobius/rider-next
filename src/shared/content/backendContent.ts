import { useEffect, useState } from 'react';
import { events as staticEvents, type EventItem } from '../../data/events';
import { places as staticPlaces, verificationLabels, type PlaceItem, type VerificationStatus } from '../../data/places';
import { routes as staticRoutes, type RouteItem } from '../../data/routes';
import type { SearchCategory } from '../../data/searchContent';
import type { LocalizedText } from '../i18n/localizedText';
import { supabase } from '../supabase/client';

export interface BackendContent {
  places: PlaceItem[];
  routes: RouteItem[];
  events: EventItem[];
  source: 'backend' | 'static';
  loading: boolean;
  error: string;
}

const categoryToSearch: Record<string, SearchCategory> = {
  'places-services': 'service',
  'places-tire-services': 'service',
  'moto-shops': 'equipment',
  'places-training-areas': 'training',
  'places-schools-instructors': 'training',
};

const fallbackContent: BackendContent = {
  places: staticPlaces,
  routes: staticRoutes,
  events: staticEvents,
  source: 'static',
  loading: false,
  error: '',
};

function asLocalized(value: unknown, fallback = ''): LocalizedText {
  if (value && typeof value === 'object' && 'ru' in value) return value as LocalizedText;
  return { ru: fallback };
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}

function asCoordinates(value: unknown): [number, number] | undefined {
  if (!Array.isArray(value) || value.length < 2) return undefined;
  const lng = Number(value[0]);
  const lat = Number(value[1]);
  return Number.isFinite(lng) && Number.isFinite(lat) ? [lng, lat] : undefined;
}

function mapStructuredServices(value: unknown): PlaceItem['structuredServices'] {
  if (!Array.isArray(value)) return [];

  return value.map((item) => {
    const row = item as Record<string, unknown>;
    const definition = row.service_definitions as Record<string, unknown> | null;

    return {
      id: String(row.service_definition_id ?? definition?.id ?? ''),
      title: asLocalized(definition?.title, String(row.service_definition_id ?? 'Услуга')),
      availability: String(row.availability ?? 'unknown') as 'available' | 'unknown' | 'unavailable',
      confirmationStatus: String(row.confirmation_status ?? 'unknown') as 'unknown' | 'owner_confirmed' | 'moderator_confirmed' | 'user_reported',
    };
  }).filter((item) => item.id);
}

function mapPlace(row: Record<string, unknown>): PlaceItem {
  const categoryId = String(row.category_id ?? 'places-services');
  const verificationStatus = String(row.verification_status ?? 'pending') as VerificationStatus;
  const name = asLocalized(row.name, String(row.id));
  const shortDescription = asLocalized(row.short_description);
  const coverImage = row.cover_image ? String(row.cover_image) : undefined;
  const image = row.image ? String(row.image) : coverImage;

  return {
    id: String(row.id),
    type: 'place',
    slug: String(row.slug ?? row.id),
    name,
    title: name,
    category: categoryToSearch[categoryId] ?? 'service',
    categoryId,
    regionId: String(row.region_id ?? 'smolensk-oblast'),
    shortDescription,
    description: shortDescription,
    fullDescription: asLocalized(row.full_description, shortDescription.ru),
    coverImage,
    image,
    coordinates: asCoordinates(row.coordinates) ?? null,
    mapVisibility: row.map_visibility !== false,
    mapUrl: row.map_url ? String(row.map_url) : undefined,
    verificationStatus,
    informationCheckedAt: row.information_checked_at ? String(row.information_checked_at) : undefined,
    branches: asArray(row.branches),
    contacts: asArray(row.contacts),
    services: asArray(row.services),
    products: asArray(row.products),
    features: asArray(row.features),
    structuredServices: mapStructuredServices(row.place_service_definitions),
    tags: asArray<string>(row.tags),
    verified: verificationStatus === 'verified_mg67' || verificationStatus === 'confirmed',
    demo: false,
    featured: false,
    status: 'listed',
    badge: verificationLabels[verificationStatus] ?? verificationLabels.pending,
    mg67Comment: row.mg67_comment ? asLocalized(row.mg67_comment) : undefined,
  };
}

function mapRoute(row: Record<string, unknown>): RouteItem {
  const title = asLocalized(row.title, String(row.id));
  const description = asLocalized(row.description);

  return {
    id: String(row.id),
    type: 'route',
    categoryId: String(row.category_id ?? 'routes'),
    category: 'route',
    regionId: String(row.region_id ?? 'smolensk-oblast'),
    title,
    description,
    tags: asArray<string>(row.tags),
    verified: true,
    demo: false,
    featured: false,
    status: 'ready',
    image: row.image ? String(row.image) : undefined,
    coordinates: asCoordinates(row.coordinates),
    routeCoordinates: asArray(row.route_coordinates),
    mapUrl: row.map_url ? String(row.map_url) : undefined,
    meta: row.meta as RouteItem['meta'],
    details: row.details as RouteItem['details'],
  };
}

function mapEvent(row: Record<string, unknown>): EventItem {
  const title = asLocalized(row.title, String(row.id));
  const description = asLocalized(row.description);
  const exactDate = row.exact_date ? String(row.exact_date) : undefined;

  return {
    id: String(row.id),
    type: 'event',
    categoryId: String(row.category_id ?? 'events'),
    category: 'event',
    regionId: String(row.region_id ?? 'smolensk-oblast'),
    title,
    description,
    tags: asArray<string>(row.tags),
    verified: true,
    demo: false,
    featured: false,
    status: exactDate ? 'soon' : 'date-pending',
    year: exactDate ? Number(exactDate.slice(0, 4)) : new Date().getFullYear(),
    month: exactDate ? Number(exactDate.slice(5, 7)) : new Date().getMonth() + 1,
    exactDate,
    image: row.image ? String(row.image) : undefined,
    coordinates: asCoordinates(row.coordinates),
    mapUrl: row.map_url ? String(row.map_url) : undefined,
    meta: row.meta as EventItem['meta'],
    details: row.details as EventItem['details'],
    dateFilters: ['upcoming'],
  };
}

export async function loadBackendContent(): Promise<BackendContent> {
  if (!supabase) return fallbackContent;

  const [placesResult, routesResult, eventsResult] = await Promise.all([
    supabase.from('places').select('*, place_service_definitions(service_definition_id, availability, confirmation_status, service_definitions(id, title))').eq('status', 'published'),
    supabase.from('routes').select('*').eq('status', 'published'),
    supabase.from('events').select('*').eq('status', 'published'),
  ]);

  if (placesResult.error || routesResult.error || eventsResult.error) {
    return { ...fallbackContent, error: 'Backend content unavailable, static fallback is used.' };
  }

  return {
    places: (placesResult.data ?? []).map((row) => mapPlace(row as Record<string, unknown>)),
    routes: (routesResult.data ?? []).map((row) => mapRoute(row as Record<string, unknown>)),
    events: (eventsResult.data ?? []).map((row) => mapEvent(row as Record<string, unknown>)),
    source: 'backend',
    loading: false,
    error: '',
  };
}

export function useBackendContent() {
  const [content, setContent] = useState<BackendContent>({ ...fallbackContent, loading: Boolean(supabase) });

  useEffect(() => {
    let alive = true;
    loadBackendContent()
      .then((nextContent) => {
        if (alive) setContent(nextContent);
      })
      .catch(() => {
        if (alive) setContent({ ...fallbackContent, error: 'Backend content unavailable, static fallback is used.' });
      });

    return () => {
      alive = false;
    };
  }, []);

  return content;
}
