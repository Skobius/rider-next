import { searchContent, type SearchCategory, type SearchDateFilter, type SearchItem, type SearchItemType } from '../../data/searchContent';
import { getLocalizedText } from '../../shared/i18n/localizedText';
import type { GuestLanguage } from '../../shared/storage/guestSettings';

export interface SearchParams {
  query?: string;
  regionId: string;
  language: GuestLanguage;
  type?: SearchItemType | 'all';
  category?: SearchCategory | 'all';
  date?: SearchDateFilter;
  featured?: boolean;
}

export interface SearchResult {
  item: SearchItem;
  score: number;
  matched: string[];
}

const synonyms: Record<string, string[]> = {
  резина: ['шина', 'шины', 'колеса', 'колёса', 'давление', 'шиномонтаж', 'переобуть', 'tires', 'tyres'],
  шина: ['резина', 'шиномонтаж', 'давление', 'tires'],
  шиномонтаж: ['резина', 'шины', 'колеса', 'переобуть', 'tire'],
  масло: ['то', 'сервис', 'обслуживание', 'service'],
  экипировка: ['шлем', 'перчатки', 'куртка', 'боты', 'защита', 'магазин', 'gear', 'helmet'],
  шлем: ['экипировка', 'helmet', 'защита'],
  маршрут: ['поездка', 'куда', 'ride', 'route'],
  вечером: ['сегодня', 'событие', 'встреча', 'event', 'tonight'],
  сегодня: ['вечером', 'событие', 'маршрут', 'today'],
  тренировка: ['практика', 'упражнения', 'площадка', 'школа', 'training', 'practice'],
  страховка: ['осаго', 'документы', 'insurance'],
  сервис: ['ремонт', 'то', 'масло', 'service', 'repair'],
};

const categoryGroups: Partial<Record<SearchCategory, SearchCategory[]>> = {
  service: ['service', 'storage', 'fuel'],
  equipment: ['equipment'],
};

export function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .replaceAll('ё', 'е')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(value: string) {
  const normalized = normalizeSearchText(value);
  if (!normalized) return [];
  return normalized.split(' ').filter(Boolean);
}

function expandTokens(tokens: string[]) {
  const expanded = new Set(tokens);

  tokens.forEach((token) => {
    synonyms[token]?.forEach((synonym) => expanded.add(normalizeSearchText(synonym)));
  });

  return [...expanded].filter(Boolean);
}

function itemText(item: SearchItem, language: GuestLanguage) {
  const title = getLocalizedText(item.title, language);
  const description = getLocalizedText(item.description, language);
  const services = item.services?.map((service) => getLocalizedText(service, language)).join(' ') ?? '';
  const meta = item.meta ? Object.values(item.meta).map((value) => getLocalizedText(value, language)).join(' ') : '';

  return {
    title: normalizeSearchText(title),
    description: normalizeSearchText(description),
    services: normalizeSearchText(services),
    tags: normalizeSearchText(item.tags.join(' ')),
    meta: normalizeSearchText(meta),
  };
}

function scoreItem(item: SearchItem, tokens: string[], language: GuestLanguage) {
  if (!tokens.length) return { score: 1, matched: [] };

  const text = itemText(item, language);
  let score = 0;
  const matched = new Set<string>();

  tokens.forEach((token) => {
    if (text.title.includes(token)) {
      score += text.title === token ? 40 : 22;
      matched.add(token);
    }
    if (text.services.includes(token)) {
      score += 14;
      matched.add(token);
    }
    if (text.tags.includes(token)) {
      score += 12;
      matched.add(token);
    }
    if (text.description.includes(token)) {
      score += 7;
      matched.add(token);
    }
    if (text.meta.includes(token)) {
      score += 5;
      matched.add(token);
    }
  });

  if (item.verified) score += 3;
  if (item.featured) score += 2;
  if (item.demo) score -= 1;

  return { score, matched: [...matched] };
}

function matchesCategory(item: SearchItem, category: SearchCategory | 'all' | undefined) {
  if (!category || category === 'all') return true;
  const group = categoryGroups[category] ?? [category];
  return group.includes(item.category);
}

export function searchMotohub(params: SearchParams): SearchResult[] {
  const tokens = expandTokens(tokenize(params.query ?? ''));

  return searchContent
    .filter((item) => item.regionId === params.regionId)
    .filter((item) => !params.type || params.type === 'all' || item.type === params.type)
    .filter((item) => matchesCategory(item, params.category))
    .filter((item) => !params.date || item.dateFilters?.includes(params.date))
    .filter((item) => !params.featured || item.featured)
    .map((item) => ({ item, ...scoreItem(item, tokens, params.language) }))
    .filter((result) => tokens.length === 0 || result.score > 0)
    .sort((a, b) => b.score - a.score || getLocalizedText(a.item.title, params.language).localeCompare(getLocalizedText(b.item.title, params.language)));
}
