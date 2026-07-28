import type { SearchItem } from './searchContent';

export interface RouteItem extends SearchItem {
  type: 'route';
  categoryId: string;
  status: 'ready' | 'needs-check';
  coordinates?: [number, number];
  routeCoordinates?: [number, number][];
  mapUrl?: string;
}

export const routes: RouteItem[] = [
  {
    id: 'smolensk-poozerie-weekend',
    type: 'route',
    categoryId: 'routes-weekend',
    category: 'route',
    regionId: 'smolensk-oblast',
    title: { ru: 'Смоленское Поозерье: два дня среди озёр' },
    description: { ru: 'Маршрут выходного дня для спокойной поездки с ночёвкой, озёрами и понятным темпом.' },
    tags: ['маршрут', 'поозерье', 'выходные', 'озера', 'озёра', 'ночевка', 'ночёвка', 'куда поехать'],
    verified: false,
    demo: false,
    featured: true,
    status: 'needs-check',
    image: '/assets/bot/first_ride.jpg',
    coordinates: [31.8476, 55.5048],
    routeCoordinates: [
      [32.0453, 54.7826],
      [31.515, 55.268],
      [31.8476, 55.5048],
    ],
    mapUrl: 'https://yandex.ru/maps/?pt=31.8476,55.5048&z=10&l=map',
    dateFilters: ['upcoming'],
    meta: {
      duration: { ru: '2 дня / 1 ночёвка' },
      distance: { ru: 'примерно 230-280 км' },
      difficulty: { ru: 'средняя' },
    },
    details: {
      format: { ru: 'Маршрут выходного дня' },
      surface: { ru: 'Асфальт, возможны неровные участки и сельские дороги.' },
      suitableFor: { ru: 'Для райдера, который уже уверенно ездит за городом и готов к поездке с ночёвкой.' },
      lastChecked: { ru: 'Нужно проехать и проверить перед публичной рекомендацией.' },
      routePoints: [
        { ru: 'Смоленск' },
        { ru: 'Демидов' },
        { ru: 'Национальный парк «Смоленское Поозерье»' },
        { ru: 'Озёра и природные точки по маршруту' },
        { ru: 'Возвращение в Смоленск' },
      ],
      stops: [
        { ru: 'День 1: спокойный выезд из Смоленска, дорога до района Поозерья, остановки у воды, ночёвка.' },
        { ru: 'День 2: короткий утренний круг, возвращение без спешки.' },
        { ru: 'Топливо и еду лучше планировать заранее: в небольших населённых пунктах выбор может быть ограничен.' },
      ],
      warnings: [
        { ru: 'Не использовать карточку как точную навигацию до проверки трека.' },
        { ru: 'Перед поездкой проверить погоду, запас топлива, связь и состояние мотоцикла.' },
      ],
    },
  },
  {
    id: 'katyn-flenovo-evening',
    type: 'route',
    categoryId: 'routes-evening',
    category: 'route',
    regionId: 'smolensk-oblast',
    title: { ru: 'Катынь и Флёново: вечерний круг' },
    description: { ru: 'Короткий вечерний маршрут рядом со Смоленском: без дальнего выезда, с понятным возвращением до темноты.' },
    tags: ['маршрут', 'вечером', 'катынь', 'фленово', 'короткий маршрут', 'после работы', 'куда поехать'],
    verified: false,
    demo: false,
    featured: true,
    status: 'needs-check',
    image: '/assets/bot/dev_path.jpg',
    coordinates: [32.18306, 54.65437],
    routeCoordinates: [
      [32.0453, 54.7826],
      [31.7886, 54.775201],
      [32.18306, 54.65437],
      [32.0453, 54.7826],
    ],
    mapUrl: 'https://yandex.ru/maps/?pt=32.18306,54.65437&z=11&l=map',
    dateFilters: ['today', 'evening', 'upcoming'],
    meta: {
      duration: { ru: '1,5-2 часа' },
      distance: { ru: 'примерно 50-70 км' },
      difficulty: { ru: 'лёгкая' },
    },
    details: {
      format: { ru: 'Вечерний круг' },
      surface: { ru: 'Асфальт, город и пригород.' },
      suitableFor: { ru: 'Для спокойной поездки после работы, если уже есть базовая уверенность в городе.' },
      lastChecked: { ru: 'Нужно проехать и проверить детали перед публикацией точного трека.' },
      routePoints: [
        { ru: 'Смоленск' },
        { ru: 'Катынь' },
        { ru: 'Флёново' },
        { ru: 'Возвращение в Смоленск' },
      ],
      stops: [
        { ru: 'Лучше стартовать засветло и оставить запас времени на возвращение.' },
        { ru: 'Планируй короткие остановки без долгой стоянки, если едешь после работы.' },
        { ru: 'Топливо и кафе лучше уточнить заранее по текущему маршруту.' },
      ],
      warnings: [
        { ru: 'Вечером нужен прозрачный визор или очки.' },
        { ru: 'Не превращать короткий круг в скоростную поездку по незнакомым участкам.' },
      ],
    },
  },
];

export function getRouteIdsForCategory(categoryId: string) {
  return routes.filter((route) => route.categoryId === categoryId).map((route) => route.id);
}
