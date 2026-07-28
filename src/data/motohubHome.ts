import {
  CalendarDays,
  Heart,
  MapPinned,
  Route,
  Shield,
  Store,
  UsersRound,
  Wrench,
} from 'lucide-react';
import type { LocalizedText } from '../shared/i18n/localizedText';
import { events } from './events';
import { guides } from './guides';
import { places } from './places';
import { getRegionContentStatus } from './regions';
import { routes } from './routes';
import type { SearchCategory, SearchDateFilter, SearchItemType } from './searchContent';

export interface HomeActionCard {
  title: LocalizedText;
  description?: LocalizedText;
  query?: string;
  type?: SearchItemType | 'all';
  category?: SearchCategory;
  date?: SearchDateFilter;
  featured?: boolean;
  icon: typeof Wrench;
}

export interface RecommendationCard {
  id: string;
  type: SearchItemType | 'guide' | 'notice';
  favoriteType?: SearchItemType;
  path: string;
  label: LocalizedText;
  title: LocalizedText;
  details: LocalizedText;
  note: LocalizedText;
  image: string;
  icon: typeof Heart;
}

export const popularQueries: HomeActionCard[] = [
  { title: { ru: 'Где поменять резину?' }, query: 'шиномонтаж', category: 'service', icon: Wrench },
  { title: { ru: 'Где купить экипировку?' }, query: 'экипировка', category: 'equipment', icon: Shield },
  { title: { ru: 'Куда поехать сегодня?' }, type: 'route', date: 'today', icon: Route },
  { title: { ru: 'Что происходит вечером?' }, type: 'event', date: 'evening', icon: CalendarDays },
  { title: { ru: 'Где тренируются райдеры?' }, query: 'тренировка', category: 'training', icon: UsersRound },
];

export const verifiedPlaces: HomeActionCard[] = [
  { title: { ru: 'Сервисы и ремонт' }, description: { ru: 'Ремонт, ТО, шиномонтаж' }, category: 'service', icon: Wrench },
  { title: { ru: 'Экипировка и магазины' }, description: { ru: 'Магазины и примерка' }, category: 'equipment', icon: Store },
  { title: { ru: 'Маршруты и места' }, description: { ru: 'Куда поехать рядом' }, type: 'route', icon: MapPinned },
  { title: { ru: 'События и встречи' }, description: { ru: 'Встречи и заезды' }, type: 'event', icon: CalendarDays },
];

function nearestEvent(regionId: string) {
  const now = new Date();
  const futureWithDate = events
    .filter((event) => event.regionId === regionId && event.exactDate && new Date(event.exactDate) >= now)
    .sort((a, b) => new Date(a.exactDate!).getTime() - new Date(b.exactDate!).getTime());

  return futureWithDate[0] ?? events.find((event) => event.regionId === regionId);
}

export function getRecommendations(regionId: string): RecommendationCard[] {
  const pressureGuide = guides.find((guide) => guide.id === 'motorcycle-tire-pressure');
  const globalAdvice: RecommendationCard | undefined = pressureGuide ? {
    id: pressureGuide.id,
    type: 'guide',
    path: `/guides/${pressureGuide.slug}`,
    label: { ru: 'Совет MG67' },
    title: { ru: 'Проверяй давление в шинах до выезда' },
    details: pressureGuide.shortDescription,
    note: { ru: 'Это твоя безопасность.' },
    image: pressureGuide.image ?? '/assets/bot/tires.jpg',
    icon: Heart,
  } : undefined;

  if (getRegionContentStatus(regionId) === 'not_started') {
    return [
      ...(globalAdvice ? [globalAdvice] : []),
      {
        id: `region-empty-${regionId}`,
        type: 'notice',
        path: '/sections/guides',
        label: { ru: 'Регион пока не наполнен' },
        title: { ru: 'Регион пока не наполнен' },
        details: { ru: 'Мы ещё не добавили проверенные места, маршруты и события для этого региона.' },
        note: { ru: 'Пока можно пользоваться общей базой знаний и разделом навыков.' },
        image: '/assets/bot/check_list.jpg',
        icon: Heart,
      },
    ];
  }

  const route = routes.find((item) => item.regionId === regionId && item.featured) ?? routes.find((item) => item.regionId === regionId);
  const place = places.find((item) => item.regionId === regionId && item.featured) ?? places.find((item) => item.regionId === regionId);
  const event = nearestEvent(regionId);

  return [
    ...(globalAdvice ? [globalAdvice] : []),
    ...(route ? [{
      id: route.id,
      type: 'route' as const,
      favoriteType: 'route' as const,
      path: `/route/${route.id}`,
      label: { ru: 'Маршрут дня' },
      title: route.title,
      details: route.meta?.distance ?? route.description,
      note: route.meta?.duration ?? { ru: 'Проверенный маршрут региона' },
      image: route.image ?? '/assets/bot/first_ride.jpg',
      icon: Heart,
    }] : []),
    ...(place ? [{
      id: place.id,
      type: 'place' as const,
      favoriteType: 'place' as const,
      path: `/place/${place.id}`,
      label: { ru: place.verificationStatus === 'verified_mg67' ? 'MG67 рекомендует' : 'Проверенное место' },
      title: place.name,
      details: place.shortDescription,
      note: place.branches[0]?.address ?? { ru: 'Смоленская область' },
      image: place.coverImage ?? place.image ?? '/assets/bot/smolensk_services.jpg',
      icon: Heart,
    }] : []),
    ...(event ? [{
      id: event.id,
      type: 'event' as const,
      favoriteType: 'event' as const,
      path: `/event/${event.id}`,
      label: { ru: 'Ближайшее мероприятие' },
      title: event.title,
      details: event.meta?.date ?? event.description,
      note: event.meta?.place ?? { ru: 'Место уточняется' },
      image: event.image ?? '/assets/bot/smolensk_meetups.jpg',
      icon: Heart,
    }] : []),
  ];
}
