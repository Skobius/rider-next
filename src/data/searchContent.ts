import type { LocalizedText } from '../shared/i18n/localizedText';

export type SearchItemType = 'place' | 'route' | 'event';
export type SearchCategory = 'service' | 'equipment' | 'route' | 'event' | 'training' | 'insurance' | 'fuel' | 'storage';
export type SearchDateFilter = 'today' | 'evening' | 'upcoming';

export interface SearchItem {
  id: string;
  type: SearchItemType;
  category: SearchCategory;
  regionId: string;
  title: LocalizedText;
  description: LocalizedText;
  services?: LocalizedText[];
  tags: string[];
  searchKeywords?: LocalizedText[];
  verified: boolean;
  demo: boolean;
  featured?: boolean;
  image?: string;
  dateFilters?: SearchDateFilter[];
  details?: {
    surface?: LocalizedText;
    suitableFor?: LocalizedText;
    lastChecked?: LocalizedText;
    routePoints?: LocalizedText[];
    stops?: LocalizedText[];
    warnings?: LocalizedText[];
    cost?: LocalizedText;
    format?: LocalizedText;
  };
  meta?: {
    duration?: LocalizedText;
    distance?: LocalizedText;
    difficulty?: LocalizedText;
    date?: LocalizedText;
    place?: LocalizedText;
    organizer?: LocalizedText;
  };
}

export const searchContent: SearchItem[] = [
  {
    id: 'demo-tire-place',
    type: 'place',
    category: 'service',
    regionId: 'smolensk-oblast',
    title: { ru: 'Пример мотошиномонтажа', en: 'Sample motorcycle tire fitting' },
    description: { ru: 'Карточка для запросов про резину, давление, балансировку и сезонную замену колес.', en: 'A sample card for tire, pressure, balancing and seasonal wheel change queries.' },
    services: [{ ru: 'шиномонтаж', en: 'tire fitting' }, { ru: 'резина', en: 'tires' }, { ru: 'балансировка', en: 'balancing' }],
    tags: ['шиномонтаж', 'резина', 'шины', 'колеса', 'колёса', 'переобуть', 'давление', 'tire', 'tyre', 'pressure'],
    verified: false,
    demo: true,
    featured: true,
    image: '/assets/bot/tires.jpg',
  },
  {
    id: 'demo-service-general',
    type: 'place',
    category: 'service',
    regionId: 'smolensk-oblast',
    title: { ru: 'Пример мотосервиса', en: 'Sample motorcycle service' },
    description: { ru: 'Пример сервиса для будущих проверенных мест: ТО, ремонт, диагностика и сезонная подготовка.', en: 'A sample service for future verified places: maintenance, repair, diagnostics and seasonal prep.' },
    services: [{ ru: 'ТО', en: 'service' }, { ru: 'ремонт', en: 'repair' }, { ru: 'масло', en: 'oil' }],
    tags: ['сервис', 'ремонт', 'то', 'масло', 'диагностика', 'эвакуация', 'service', 'repair', 'oil'],
    verified: false,
    demo: true,
    featured: true,
    image: '/assets/bot/smolensk_services.jpg',
  },
  {
    id: 'demo-gear-shop',
    type: 'place',
    category: 'equipment',
    regionId: 'smolensk-oblast',
    title: { ru: 'Пример магазина экипировки', en: 'Sample gear shop' },
    description: { ru: 'Пример места для поиска шлемов, перчаток, курток, мотобот и базовой защиты.', en: 'A sample place for helmets, gloves, jackets, boots and basic protection.' },
    services: [{ ru: 'шлемы', en: 'helmets' }, { ru: 'перчатки', en: 'gloves' }, { ru: 'примерка', en: 'fitting' }],
    tags: ['экипировка', 'магазин', 'шлем', 'перчатки', 'куртка', 'боты', 'защита', 'запчасти', 'расходники', 'gear', 'helmet', 'gloves'],
    verified: false,
    demo: true,
    featured: true,
    image: '/assets/bot/helmet.jpg',
  },
  {
    id: 'demo-insurance',
    type: 'place',
    category: 'insurance',
    regionId: 'smolensk-oblast',
    title: { ru: 'Пример пункта страхования', en: 'Sample insurance point' },
    description: { ru: 'Заготовка для будущих проверенных мест по ОСАГО, документам и страховым вопросам.', en: 'A placeholder for future verified insurance and document places.' },
    services: [{ ru: 'ОСАГО', en: 'insurance' }, { ru: 'документы', en: 'documents' }],
    tags: ['страховка', 'осаго', 'документы', 'insurance', 'documents'],
    verified: false,
    demo: true,
  },
  {
    id: 'demo-winter-storage',
    type: 'place',
    category: 'storage',
    regionId: 'smolensk-oblast',
    title: { ru: 'Пример зимнего хранения', en: 'Sample winter storage' },
    description: { ru: 'Пример карточки для мест, где можно оставить мотоцикл на зиму и подготовить аккумулятор.', en: 'A sample card for places where a motorcycle can be stored for winter and the battery prepared.' },
    services: [{ ru: 'зимнее хранение', en: 'winter storage' }, { ru: 'аккумулятор', en: 'battery' }],
    tags: ['зима', 'хранение', 'аккумулятор', 'сезон', 'storage', 'battery'],
    verified: false,
    demo: true,
    image: '/assets/bot/battery.jpg',
  },
  {
    id: 'demo-training-place',
    type: 'place',
    category: 'training',
    regionId: 'smolensk-oblast',
    title: { ru: 'Пример тренировочной площадки', en: 'Sample training area' },
    description: { ru: 'Точка для базовых упражнений, разворотов и спокойной практики вне плотного потока.', en: 'A point for basic exercises, turns and calm practice away from dense traffic.' },
    services: [{ ru: 'базовые упражнения', en: 'basic drills' }, { ru: 'практика', en: 'practice' }],
    tags: ['тренировка', 'площадка', 'упражнения', 'джимхана', 'практика', 'школа', 'training', 'practice'],
    verified: false,
    demo: true,
    image: '/assets/bot/smolensk_training.jpg',
  },
  {
    id: 'demo-route-lakes',
    type: 'route',
    category: 'route',
    regionId: 'smolensk-oblast',
    title: { ru: 'Озёра Смоленщины', en: 'Smolensk region lakes' },
    description: { ru: 'Спокойный маршрут-пример для первого выезда за город без сложной навигации.', en: 'A calm sample route for an easy first ride outside the city.' },
    tags: ['маршрут', 'куда поехать', 'поездка', 'озера', 'озёра', 'сегодня', 'route', 'ride'],
    verified: false,
    demo: true,
    featured: true,
    dateFilters: ['today', 'upcoming'],
    image: '/assets/bot/first_ride.jpg',
    meta: {
      duration: { ru: '2-3 часа', en: '2-3 hours' },
      distance: { ru: '120 км', en: '120 km' },
      difficulty: { ru: 'лёгкий', en: 'easy' },
    },
    details: {
      surface: { ru: 'асфальт', en: 'asphalt' },
      suitableFor: { ru: 'новичкам после первых городских поездок', en: 'beginners after first city rides' },
      lastChecked: { ru: 'режим примера', en: 'sample mode' },
      routePoints: [
        { ru: 'Старт в Смоленске', en: 'Start in Smolensk' },
        { ru: 'Спокойный загородный участок', en: 'Calm countryside section' },
        { ru: 'Остановка у воды', en: 'Stop near water' },
        { ru: 'Возврат без сложных развязок', en: 'Return without complex junctions' },
      ],
      stops: [{ ru: 'Кафе или заправка по пути будут уточнены позже.', en: 'A cafe or gas station stop will be added later.' }],
      warnings: [{ ru: 'Не выезжай на незнакомый маршрут без запаса топлива и заряда телефона.', en: 'Do not ride an unfamiliar route without fuel reserve and phone charge.' }],
    },
  },
  {
    id: 'demo-route-evening',
    type: 'route',
    category: 'route',
    regionId: 'smolensk-oblast',
    title: { ru: 'Вечерний маршрут вокруг Смоленска', en: 'Evening route around Smolensk' },
    description: { ru: 'Короткая идея-пример для поездки после работы: немного города, спокойный темп и быстрый возврат.', en: 'A short sample idea after work: some city riding, calm pace and a quick return.' },
    tags: ['вечером', 'сегодня', 'маршрут', 'короткий', 'город', 'evening', 'short route'],
    verified: false,
    demo: true,
    dateFilters: ['today', 'evening'],
    meta: {
      duration: { ru: '40-60 минут', en: '40-60 minutes' },
      distance: { ru: '35 км', en: '35 km' },
      difficulty: { ru: 'лёгкий', en: 'easy' },
    },
    details: {
      surface: { ru: 'город и пригород', en: 'city and suburb' },
      suitableFor: { ru: 'короткой вечерней поездке', en: 'a short evening ride' },
      lastChecked: { ru: 'режим примера', en: 'sample mode' },
      routePoints: [
        { ru: 'Старт после работы', en: 'Start after work' },
        { ru: 'Короткий круг без дальнего выезда', en: 'Short loop without a long ride out' },
        { ru: 'Финиш до темноты', en: 'Finish before it gets too dark' },
      ],
      warnings: [{ ru: 'Вечером бери прозрачный визор или очки.', en: 'Use a clear visor or glasses in the evening.' }],
    },
  },
  {
    id: 'demo-route-weekend',
    type: 'route',
    category: 'route',
    regionId: 'smolensk-oblast',
    title: { ru: 'Маршрут выходного дня', en: 'Weekend route' },
    description: { ru: 'Маршрут-пример на несколько часов для спокойной поездки с остановками и запасом времени.', en: 'A sample route for several hours with stops and enough time.' },
    tags: ['выходные', 'маршрут', 'поездка', 'день', 'weekend', 'route'],
    verified: false,
    demo: true,
    dateFilters: ['upcoming'],
    image: '/assets/bot/first_ride.jpg',
    meta: {
      duration: { ru: '3-4 часа', en: '3-4 hours' },
      distance: { ru: '160 км', en: '160 km' },
      difficulty: { ru: 'средний', en: 'medium' },
    },
    details: {
      surface: { ru: 'асфальт, возможны неровные участки', en: 'asphalt, uneven sections possible' },
      suitableFor: { ru: 'тем, кто уже уверенно ездит за городом', en: 'riders already comfortable outside the city' },
      lastChecked: { ru: 'режим примера', en: 'sample mode' },
      routePoints: [
        { ru: 'Старт утром', en: 'Morning start' },
        { ru: 'Загородный участок', en: 'Countryside section' },
        { ru: 'Длинная остановка', en: 'Longer stop' },
        { ru: 'Возврат засветло', en: 'Return before dark' },
      ],
      stops: [{ ru: 'Плановая остановка каждые 60-90 минут.', en: 'Planned stop every 60-90 minutes.' }],
      warnings: [{ ru: 'Для новичка лучше ехать не одному и заранее обсудить темп.', en: 'A beginner should ride with someone and agree on pace in advance.' }],
    },
  },
  {
    id: 'demo-event-meetup',
    type: 'event',
    category: 'event',
    regionId: 'smolensk-oblast',
    title: { ru: 'Сегодняшняя встреча мотоциклистов', en: 'Today rider meetup' },
    description: { ru: 'Событие-пример для проверки поиска по сегодняшним и вечерним активностям.', en: 'A sample event for testing today and evening activity search.' },
    tags: ['событие', 'встреча', 'вечером', 'сегодня', 'райдеры', 'event', 'meetup', 'tonight'],
    verified: false,
    demo: true,
    featured: true,
    dateFilters: ['today', 'evening'],
    image: '/assets/bot/smolensk_meetups.jpg',
    meta: {
      date: { ru: 'Сегодня вечером', en: 'Tonight' },
      place: { ru: 'Место будет уточнено', en: 'Place to be confirmed' },
      organizer: { ru: 'Организатор будет уточнён', en: 'Organizer to be confirmed' },
    },
  },
  {
    id: 'demo-event-training',
    type: 'event',
    category: 'event',
    regionId: 'smolensk-oblast',
    title: { ru: 'Ближайшая тренировка', en: 'Upcoming practice' },
    description: { ru: 'Событие-пример для карточек практики и тренировок.', en: 'A sample event for practice and training cards.' },
    tags: ['тренировка', 'вечером', 'практика', 'упражнения', 'training', 'practice'],
    verified: false,
    demo: true,
    dateFilters: ['today', 'evening', 'upcoming'],
    image: '/assets/bot/smolensk_training.jpg',
    meta: {
      date: { ru: 'Сегодня', en: 'Today' },
      place: { ru: 'Площадка будет уточнена', en: 'Area to be confirmed' },
      organizer: { ru: 'MG67', en: 'MG67' },
    },
  },
  {
    id: 'demo-event-weekend-ride',
    type: 'event',
    category: 'event',
    regionId: 'smolensk-oblast',
    title: { ru: 'Выезд выходного дня', en: 'Weekend group ride' },
    description: { ru: 'Анонс-пример группового выезда, который появится в будущей афише региона.', en: 'A sample announcement for a future regional group ride.' },
    tags: ['выезд', 'выходные', 'событие', 'маршрут', 'event', 'weekend'],
    verified: false,
    demo: true,
    dateFilters: ['upcoming'],
    image: '/assets/bot/first_ride.jpg',
    meta: {
      date: { ru: 'Ближайшие выходные', en: 'This weekend' },
      place: { ru: 'Старт будет уточнён', en: 'Start point to be confirmed' },
      organizer: { ru: 'Организатор будет уточнён', en: 'Organizer to be confirmed' },
    },
  },
];
