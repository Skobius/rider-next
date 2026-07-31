import { events } from '../../data/events';
import { guides } from '../../data/guides';
import { places } from '../../data/places';
import { riderTasks } from '../../data/riderTasks';
import { routes } from '../../data/routes';
import { type SearchCategory, type SearchDateFilter, type SearchItem, type SearchItemType } from '../../data/searchContent';
import { skills } from '../../data/skills';
import { getLocalizedText, type LocalizedText } from '../../shared/i18n/localizedText';
import type { GuestLanguage } from '../../shared/storage/guestSettings';

export type SearchEntityType = SearchItemType | 'guide' | 'skill' | 'task';

export interface SearchEntityBase {
  id: string;
  type: SearchEntityType;
  title: LocalizedText;
  description: LocalizedText;
  tags: string[];
  searchKeywords?: LocalizedText[];
  targetPath: string;
  image?: string;
  category?: SearchCategory;
  sectionId?: string;
}

export type SearchPlaceEntity = SearchItem & { targetPath: string };
export type SearchEntity = SearchPlaceEntity | SearchEntityBase;

export interface SearchParams {
  query?: string;
  regionId: string;
  language: GuestLanguage;
  type?: SearchEntityType | 'all';
  category?: SearchCategory | 'all';
  date?: SearchDateFilter;
  featured?: boolean;
}

export interface SearchContentOverride {
  places?: typeof places;
  routes?: typeof routes;
  events?: typeof events;
}

export interface SearchResult {
  item: SearchEntity;
  score: number;
  matched: string[];
}

const synonyms: Record<string, string[]> = {
  резина: ['шина', 'шины', 'колесо', 'колеса', 'шиномонтаж', 'моторезина', 'tires', 'tyres'],
  шина: ['резина', 'шины', 'шиномонтаж', 'моторезина', 'tires'],
  шиномонтаж: ['резина', 'шины', 'колеса', 'переобуть', 'tire service'],
  масло: ['замена масла', 'то', 'обслуживание', 'расходники', 'oil'],
  экипировка: ['шлем', 'перчатки', 'куртка', 'боты', 'защита', 'gear', 'helmet'],
  шлем: ['экипировка', 'helmet', 'защита'],
  маршрут: ['поездка', 'куда', 'ride', 'route'],
  вечером: ['сегодня', 'событие', 'встреча', 'event', 'tonight'],
  сегодня: ['вечером', 'событие', 'маршрут', 'today'],
  тренировка: ['практика', 'упражнения', 'площадка', 'школа', 'инструктор', 'training', 'practice'],
  страховка: ['осаго', 'документы', 'insurance'],
  сервис: ['ремонт', 'то', 'масло', 'service', 'repair'],
  эндуро: ['эндуро броня', 'экипировка', 'защита', 'enduro'],
  цепь: ['смазка', 'звезды', 'натяжение', 'chain'],
  давление: ['шины', 'резина', 'манометр', 'pressure'],
  запчасти: ['расходники', 'мотомагазин', 'parts'],
};

const guideSearchKeywordsById: Record<string, LocalizedText[]> = {
  'oil-change-when': [
    { ru: 'масло', en: 'oil' },
    { ru: 'замена масла', en: 'oil change' },
    { ru: 'когда менять масло', en: 'when to change oil' },
  ],
  'chain-check': [
    { ru: 'цепь', en: 'chain' },
    { ru: 'смазать цепь', en: 'lubricate chain' },
    { ru: 'уход за цепью', en: 'chain care' },
  ],
  'tires-pressure': [
    { ru: 'резина', en: 'tires' },
    { ru: 'шины', en: 'tyres' },
    { ru: 'давление в шинах', en: 'tire pressure' },
    { ru: 'проверить давление', en: 'check tire pressure' },
  ],
  'helmet-first': [
    { ru: 'экипировка', en: 'gear' },
    { ru: 'шлем', en: 'helmet' },
    { ru: 'первый шлем', en: 'first helmet' },
  ],
  'gloves-first': [
    { ru: 'экипировка', en: 'gear' },
    { ru: 'перчатки', en: 'gloves' },
    { ru: 'первые перчатки', en: 'first gloves' },
  ],
  'gear-first-priority': [
    { ru: 'экипировка', en: 'gear' },
    { ru: 'что купить сначала', en: 'what to buy first' },
    { ru: 'защита', en: 'protection' },
  ],
  'visibility-city': [
    { ru: 'город', en: 'city' },
    { ru: 'заметность', en: 'visibility' },
    { ru: 'отражайки', en: 'reflectors' },
  ],
  'osago-beginner': [
    { ru: 'страховка', en: 'insurance' },
    { ru: 'осаго', en: 'insurance' },
    { ru: 'документы', en: 'documents' },
  ],
  'season-after-winter': [
    { ru: 'резина', en: 'tires' },
    { ru: 'после зимы', en: 'after winter' },
    { ru: 'аккумулятор', en: 'battery' },
  ],
  'city-fear': [
    { ru: 'город', en: 'city' },
    { ru: 'страх города', en: 'city fear' },
    { ru: 'поток', en: 'traffic' },
  ],
  'blind-zones': [
    { ru: 'город', en: 'city' },
    { ru: 'слепые зоны', en: 'blind spots' },
    { ru: 'поток', en: 'traffic' },
  ],
  'first-evening-route': [
    { ru: 'маршрут', en: 'route' },
    { ru: 'вечерний маршрут', en: 'evening route' },
    { ru: 'куда поехать', en: 'where to ride' },
  ],
  'city-ready': [
    { ru: 'город', en: 'city' },
    { ru: 'навыки', en: 'skills' },
    { ru: 'готовность к городу', en: 'ready for city' },
  ],
};

const categoryGroups: Partial<Record<SearchCategory, SearchCategory[]>> = {
  service: ['service', 'storage', 'fuel', 'insurance'],
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
    synonyms[token]?.forEach((synonym) => {
      tokenize(synonym).forEach((synonymToken) => expanded.add(synonymToken));
    });
  });

  return [...expanded].filter(Boolean);
}

function getItemTargetPath(item: SearchItem) {
  if (item.type === 'route') return `/route/${item.id}`;
  if (item.type === 'event') return `/event/${item.id}`;
  return `/place/${item.id}`;
}

function getGuideSearchCategory(categoryId: string, sectionId: string): SearchCategory | undefined {
  if (categoryId.includes('gear')) return 'equipment';
  if (categoryId.includes('season')) return 'service';
  if (categoryId.includes('maintenance')) return 'service';
  if (sectionId === 'routes') return 'route';
  if (sectionId === 'community') return 'event';
  if (sectionId === 'skills') return 'training';
  return undefined;
}

function searchEntities(content?: SearchContentOverride): SearchEntity[] {
  const contentPlaces = content?.places ?? places;
  const contentRoutes = content?.routes ?? routes;
  const contentEvents = content?.events ?? events;
  const placeEntities: SearchEntity[] = [...contentPlaces, ...contentRoutes, ...contentEvents].map((item) => ({ ...item, targetPath: getItemTargetPath(item) }));
  const guideEntities: SearchEntity[] = guides.map((guide) => ({
      id: guide.id,
      type: 'guide',
      title: guide.title,
      description: guide.shortDescription,
      tags: [],
      searchKeywords: guide.searchKeywords ?? guideSearchKeywordsById[guide.id],
      targetPath: `/guides/${guide.slug}`,
      image: guide.image,
      category: getGuideSearchCategory(guide.categoryId, guide.sectionId),
      sectionId: guide.sectionId,
    }));
  const skillEntities: SearchEntity[] = skills.map((skill) => ({
    id: skill.id,
    type: 'skill',
    title: skill.title,
    description: skill.description,
    tags: ['навык', 'тренировка', 'безопасность', 'skill', 'training'],
    searchKeywords: [
      skill.title,
      { ru: 'тренировка', en: 'training' },
      { ru: 'навыки', en: 'skills' },
      { ru: 'безопасность', en: 'safety' },
    ],
    targetPath: `/skill/${skill.id}`,
    image: skill.image,
    category: 'training',
    sectionId: 'skills',
  }));
  const taskEntities: SearchEntity[] = riderTasks.filter((task) => task.status === 'published').map((task) => ({
    id: task.id,
    type: 'task',
    title: task.title,
    description: task.shortDescription,
    tags: task.tags,
    searchKeywords: task.searchAliases,
    targetPath: `/tasks/${task.slug}`,
    image: task.coverImage,
    category: task.relatedPlaceCategoryIds.some((id) => id.includes('training')) ? 'training' : 'service',
    sectionId: 'tasks',
  }));

  return [...taskEntities, ...placeEntities, ...guideEntities, ...skillEntities];
}

function entityText(item: SearchEntity, language: GuestLanguage) {
  const title = getLocalizedText(item.title, language);
  const description = getLocalizedText(item.description, language);
  const services = 'services' in item ? item.services?.map((service) => getLocalizedText(service, language)).join(' ') ?? '' : '';
  const branches = 'branches' in item && Array.isArray(item.branches)
    ? item.branches as { address: LocalizedText }[]
    : [];
  const addresses = branches.map((branch) => getLocalizedText(branch.address, language)).join(' ');
  const keywords = item.searchKeywords?.map((keyword) => getLocalizedText(keyword, language)).join(' ') ?? '';

  return {
    title: normalizeSearchText(title),
    description: normalizeSearchText(description),
    services: normalizeSearchText(services),
    addresses: normalizeSearchText(addresses),
    tags: normalizeSearchText(item.tags.join(' ')),
    keywords: normalizeSearchText(keywords),
  };
}

function hasExactToken(text: string, token: string) {
  return tokenize(text).includes(token);
}

function hasPrefixToken(text: string, token: string) {
  if (token.length < 4) return false;
  return tokenize(text).some((word) => word.length >= 4 && (word.startsWith(token) || token.startsWith(word)));
}

function scoreTokenField(field: string, token: string, exactWeight: number, prefixWeight = 0) {
  if (hasExactToken(field, token)) return exactWeight;
  if (prefixWeight && hasPrefixToken(field, token)) return prefixWeight;
  return 0;
}

function scoreItem(item: SearchEntity, tokens: string[], language: GuestLanguage) {
  if (!tokens.length) return { score: 1, matched: [] };

  const text = entityText(item, language);
  const query = normalizeSearchText(tokens.join(' '));
  let score = 0;
  const matched = new Set<string>();

  if (text.title === query) score += 120;
  else if (query && text.title.startsWith(query)) score += 82;
  else if (query && text.title.includes(query)) score += 56;

  if (query && text.keywords.split(' ').join(' ').includes(query)) {
    score += 46;
    matched.add(query);
  }

  tokens.forEach((token) => {
    const tokenScore =
      scoreTokenField(text.title, token, 30, 18) +
      scoreTokenField(text.keywords, token, 28, 14) +
      scoreTokenField(text.services, token, 20, 10) +
      scoreTokenField(text.addresses, token, 20, 10) +
      scoreTokenField(text.tags, token, 16, 8) +
      scoreTokenField(text.description, token, 6, 0);

    if (tokenScore > 0) {
      score += tokenScore;
      matched.add(token);
    }
  });

  if ('verified' in item && item.verified) score += 3;
  if ('featured' in item && item.featured) score += 2;
  if ('demo' in item && item.demo) score -= 2;
  if (item.type === 'task') score += 8;
  if (item.type === 'guide') score += 2;
  if (item.type === 'skill') score += 2;

  return { score, matched: [...matched] };
}

function matchesCategory(item: SearchEntity, category: SearchCategory | 'all' | undefined) {
  if (!category || category === 'all') return true;
  const group = categoryGroups[category] ?? [category];
  return Boolean(item.category && group.includes(item.category));
}

function matchesType(item: SearchEntity, type: SearchEntityType | 'all' | undefined) {
  if (!type || type === 'all') return true;
  return item.type === type;
}

function matchesRegion(item: SearchEntity, regionId: string) {
  return !('regionId' in item) || item.regionId === regionId;
}

function matchesDate(item: SearchEntity, date: SearchDateFilter | undefined) {
  return !date || ('dateFilters' in item && item.dateFilters?.includes(date));
}

function matchesFeatured(item: SearchEntity, featured: boolean | undefined) {
  return !featured || ('featured' in item && item.featured);
}

export function searchMotohub(params: SearchParams, content?: SearchContentOverride): SearchResult[] {
  const queryTokens = tokenize(params.query ?? '');
  const tokens = expandTokens(queryTokens);

  return searchEntities(content)
    .filter((item) => matchesRegion(item, params.regionId))
    .filter((item) => matchesType(item, params.type))
    .filter((item) => matchesCategory(item, params.category))
    .filter((item) => matchesDate(item, params.date))
    .filter((item) => matchesFeatured(item, params.featured))
    .map((item) => ({ item, ...scoreItem(item, tokens, params.language) }))
    .filter((result) => queryTokens.length === 0 || result.score >= 18)
    .sort((a, b) => b.score - a.score || getLocalizedText(a.item.title, params.language).localeCompare(getLocalizedText(b.item.title, params.language)));
}

export function getSearchEntityLabelKey(type: SearchEntityType) {
  if (type === 'task') return 'search.tasks';
  if (type === 'guide') return 'search.guides';
  if (type === 'skill') return 'search.skills';
  if (type === 'route') return 'search.routes';
  if (type === 'event') return 'search.events';
  return 'search.places';
}
