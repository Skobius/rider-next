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
  type: SearchItemType;
  label: LocalizedText;
  title: LocalizedText;
  details: LocalizedText;
  note: LocalizedText;
  image: string;
  icon: typeof Heart;
  demo: boolean;
}

export const popularQueries: HomeActionCard[] = [
  { title: { ru: 'Где поменять резину?', en: 'Where can I change tires?' }, query: 'шиномонтаж', category: 'service', icon: Wrench },
  { title: { ru: 'Где купить экипировку?', en: 'Where can I buy gear?' }, query: 'экипировка', category: 'equipment', icon: Shield },
  { title: { ru: 'Куда поехать сегодня?', en: 'Where to ride today?' }, type: 'route', date: 'today', icon: Route },
  { title: { ru: 'Что происходит вечером?', en: 'What is happening tonight?' }, type: 'event', date: 'evening', icon: CalendarDays },
  { title: { ru: 'Где тренируются райдеры?', en: 'Where do riders train?' }, query: 'тренировка', category: 'training', icon: UsersRound },
];

export const verifiedPlaces: HomeActionCard[] = [
  {
    title: { ru: 'Сервисы и ремонт', en: 'Service and repair' },
    description: { ru: 'Ремонт, ТО, шиномонтаж', en: 'Repair, service, tire fitting' },
    category: 'service',
    icon: Wrench,
  },
  {
    title: { ru: 'Экипировка и магазины', en: 'Gear and shops' },
    description: { ru: 'Магазины и примерка', en: 'Shops and fitting' },
    category: 'equipment',
    icon: Store,
  },
  {
    title: { ru: 'Маршруты и места', en: 'Routes and places' },
    description: { ru: 'Куда поехать рядом', en: 'Where to ride nearby' },
    type: 'route',
    icon: MapPinned,
  },
  {
    title: { ru: 'События и встречи', en: 'Events and meetups' },
    description: { ru: 'Встречи и заезды', en: 'Meetups and rides' },
    type: 'event',
    icon: CalendarDays,
  },
];

export const recommendations: RecommendationCard[] = [
  {
    id: 'demo-route-lakes',
    type: 'route',
    label: { ru: 'Маршрут дня', en: 'Route of the day' },
    title: { ru: 'Озёра Смоленщины', en: 'Smolensk region lakes' },
    details: { ru: '120 км • лёгкий темп', en: '120 km • easy pace' },
    note: { ru: 'Красивые виды и кафе по пути', en: 'Views and cafes along the way' },
    image: '/assets/bot/first_ride.jpg',
    icon: Heart,
    demo: true,
  },
  {
    id: 'demo-service-general',
    type: 'place',
    label: { ru: 'Проверенный формат', en: 'Verified format' },
    title: { ru: 'Демо мотосервис', en: 'Demo motorcycle service' },
    details: { ru: 'ТО • ремонт • шиномонтаж', en: 'Service • repair • tire fitting' },
    note: { ru: 'Демо-данные для проверки интерфейса', en: 'Demo data for interface testing' },
    image: '/assets/bot/smolensk_services.jpg',
    icon: Heart,
    demo: true,
  },
  {
    id: 'demo-event-training',
    type: 'event',
    label: { ru: 'Практика', en: 'Practice' },
    title: { ru: 'Ближайшая тренировка', en: 'Upcoming practice' },
    details: { ru: 'Сегодня • спокойно', en: 'Today • calm pace' },
    note: { ru: 'Площадка для базовых упражнений', en: 'Place for basic exercises' },
    image: '/assets/bot/smolensk_training.jpg',
    icon: Heart,
    demo: true,
  },
];
