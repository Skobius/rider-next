import type { SearchItem } from './searchContent';

export interface EventItem extends SearchItem {
  type: 'event';
  categoryId: string;
  status: 'soon' | 'date-pending';
  year: number;
  month: number;
  exactDate?: string;
  coordinates?: [number, number];
  mapUrl?: string;
}

export const events: EventItem[] = [
  {
    id: 'gymkhana-federation-cup-2026-08-22',
    type: 'event',
    categoryId: 'community-competitions',
    category: 'event',
    regionId: 'smolensk-oblast',
    title: { ru: 'Этап чемпионата «Кубок Федерации» по мотоджимхане' },
    description: { ru: 'Соревнования по мотоджимхане в Смоленской области. Программа и время регистрации уточняются у организатора.' },
    tags: ['событие', 'мотоджимхана', 'кубок федерации', 'соревнования', 'смоленское кольцо', '22 августа'],
    searchKeywords: [{ ru: 'что происходит вечером' }, { ru: 'мотоджимхана смоленск' }, { ru: 'соревнования мото' }],
    verified: false,
    demo: false,
    featured: true,
    status: 'soon',
    year: 2026,
    month: 8,
    exactDate: '2026-08-22',
    image: '/assets/bot/dev_training.jpg',
    coordinates: [33.368167, 54.98875],
    mapUrl: 'https://yandex.ru/maps/?pt=33.368167,54.98875&z=13&l=map',
    dateFilters: ['upcoming'],
    meta: {
      date: { ru: '22 августа 2026' },
      place: { ru: 'Автодром «Смоленское кольцо», Смоленская область' },
      organizer: { ru: '«Мото Джимхана Смоленск» / организаторы этапа Кубка Федерации' },
    },
    details: {
      format: { ru: 'Соревнования по мотоджимхане' },
      cost: { ru: 'Стоимость участия и условия для зрителей уточняются у организатора.' },
      stops: [
        { ru: 'Время регистрации и программа будут добавлены после официального анонса.' },
        { ru: 'Источник: gymkhana-cup.ru.' },
      ],
      warnings: [{ ru: 'Перед поездкой проверь актуальную информацию у организаторов.' }],
    },
  },
  {
    id: 'season-closing-2026-october',
    type: 'event',
    categoryId: 'community-season-closing',
    category: 'event',
    regionId: 'smolensk-oblast',
    title: { ru: 'Закрытие мотосезона 2026' },
    description: { ru: 'Сезонное событие для завершения мотосезона. Точная дата, место сбора и маршрут будут объявлены позже.' },
    tags: ['событие', 'закрытие сезона', 'октябрь', 'мотосезон', 'встреча', 'смоленск'],
    searchKeywords: [{ ru: 'что происходит вечером' }, { ru: 'закрытие мотосезона' }, { ru: 'мероприятия мото' }],
    verified: false,
    demo: false,
    featured: true,
    status: 'date-pending',
    year: 2026,
    month: 10,
    image: '/assets/bot/cold_asphalt.jpg',
    coordinates: [32.0453, 54.7826],
    mapUrl: 'https://yandex.ru/maps/?pt=32.0453,54.7826&z=12&l=map',
    dateFilters: ['upcoming'],
    meta: {
      date: { ru: 'Октябрь 2026, точная дата будет объявлена позже' },
      place: { ru: 'Смоленск, место сбора и маршрут уточняются' },
      organizer: { ru: 'Будет подтверждён после официального анонса' },
    },
    details: {
      format: { ru: 'Встреча / сезонный выезд' },
      cost: { ru: 'Уточняется.' },
      stops: [{ ru: 'Формат события будет обновлён после публикации официального анонса.' }],
      warnings: [{ ru: 'Не планируй поездку по этой карточке до появления точной даты и места сбора.' }],
    },
  },
];

export function getEventIdsForCategory(categoryId: string) {
  return events.filter((event) => event.categoryId === categoryId).map((event) => event.id);
}
