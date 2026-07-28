import type { LocalizedText } from '../shared/i18n/localizedText';
import { appCategories, getCategoryMaterialCountForRegion, type AppCategory } from './categories';

export type ContentEntityType =
  | 'section'
  | 'category'
  | 'place'
  | 'guide'
  | 'route'
  | 'destination'
  | 'event'
  | 'organization'
  | 'skill';

export type SectionId = 'places' | 'guides' | 'routes' | 'community' | 'skills';

export interface AppSection {
  id: SectionId;
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  icon: string;
  image: string;
  categoryIds: string[];
  status: 'ready' | 'filling';
}

export const appSections: AppSection[] = [
  {
    id: 'places',
    slug: 'places',
    title: { ru: 'Места', en: 'Places' },
    description: {
      ru: 'Сервисы, магазины и другие полезные точки для мотоциклиста в вашем регионе.',
      en: 'Services, shops and other useful points for riders in your region.',
    },
    icon: 'map-pin',
    image: '/assets/bot/smolensk_services.jpg',
    categoryIds: [
      'places-services',
      'places-tire-services',
      'moto-shops',
      'places-insurance',
      'places-storage',
      'places-road-assistance',
      'places-training-areas',
      'places-schools-instructors',
      'places-clubs-meetups',
    ],
    status: 'ready',
  },
  {
    id: 'guides',
    slug: 'guides',
    title: { ru: 'Полезно знать', en: 'Useful guides' },
    description: {
      ru: 'Короткие понятные ответы про обслуживание, экипировку, документы и первый сезон.',
      en: 'Short clear answers about maintenance, gear, documents and the first season.',
    },
    icon: 'book-open',
    image: '/assets/bot/check_list.jpg',
    categoryIds: [
      'guides-maintenance',
      'guides-gear',
      'guides-documents',
      'guides-season',
      'guides-safety',
      'guides-buying',
    ],
    status: 'filling',
  },
  {
    id: 'routes',
    slug: 'routes',
    title: { ru: 'Маршруты и места', en: 'Routes and destinations' },
    description: {
      ru: 'Идеи поездок, направления и спокойные маршруты для разных ситуаций.',
      en: 'Ride ideas, destinations and calm routes for different situations.',
    },
    icon: 'map-pinned',
    image: '/assets/bot/first_ride.jpg',
    categoryIds: [
      'routes-evening',
      'routes-weekend',
    ],
    status: 'ready',
  },
  {
    id: 'community',
    slug: 'community',
    title: { ru: 'События и сообщество', en: 'Events and community' },
    description: {
      ru: 'Встречи, тренировки, совместные поездки и мото-жизнь рядом.',
      en: 'Meetups, training, group rides and motorcycle life nearby.',
    },
    icon: 'users-round',
    image: '/assets/bot/smolensk_meetups.jpg',
    categoryIds: [
      'community-competitions',
      'community-season-closing',
    ],
    status: 'ready',
  },
  {
    id: 'skills',
    slug: 'skills',
    title: { ru: 'Навыки и безопасность', en: 'Skills and safety' },
    description: {
      ru: 'Практика, городская езда и безопасное развитие мотоциклиста без лишней теории.',
      en: 'Practice, city riding and safer rider development without extra theory.',
    },
    icon: 'shield-check',
    image: '/assets/bot/smolensk_training.jpg',
    categoryIds: [
      'skills-basic-exercises',
      'skills-upm',
    ],
    status: 'ready',
  },
];

export function findSectionBySlug(slug: string | undefined) {
  if (!slug) return undefined;
  return appSections.find((section) => section.slug === slug);
}

export function getSectionCategories(section: AppSection) {
  return section.categoryIds
    .map((categoryId) => appCategories.find((category) => category.id === categoryId))
    .filter((category): category is AppCategory => Boolean(category));
}

export function getSectionMaterialCount(section: AppSection) {
  return getSectionCategories(section).reduce((sum, category) => sum + category.entityIds.length, 0);
}

export function isRegionalSection(section: AppSection) {
  return section.id === 'places' || section.id === 'routes' || section.id === 'community';
}

export function getSectionMaterialCountForRegion(section: AppSection, regionId: string) {
  return getSectionCategories(section).reduce((sum, category) => (
    sum + (isRegionalSection(section) ? getCategoryMaterialCountForRegion(category, regionId) : category.entityIds.length)
  ), 0);
}
