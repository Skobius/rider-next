import type { LocalizedText } from '../shared/i18n/localizedText';

export interface ServiceDefinition {
  id: string;
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  category: 'service' | 'tire' | 'training' | 'gear' | 'documents';
  tags: string[];
  status: 'published' | 'draft' | 'archived';
}

export const serviceDefinitions: ServiceDefinition[] = [
  {
    id: 'motorcycle-tire-service',
    slug: 'motorcycle-tire-service',
    title: { ru: 'Мотошиномонтаж', en: 'Motorcycle tire service' },
    description: { ru: 'Замена, снятие, установка и проверка мотоциклетных шин.', en: 'Changing, removing, installing and checking motorcycle tires.' },
    category: 'tire',
    tags: ['резина', 'шины', 'колёса', 'мотошиномонтаж'],
    status: 'published',
  },
  {
    id: 'balancing',
    slug: 'balancing',
    title: { ru: 'Балансировка колёс', en: 'Wheel balancing' },
    description: { ru: 'Балансировка мотоциклетных колёс после замены резины или при вибрациях.', en: 'Balancing motorcycle wheels after tire changes or vibration.' },
    category: 'tire',
    tags: ['балансировка', 'вибрация', 'колёса'],
    status: 'published',
  },
  {
    id: 'tires',
    slug: 'tires',
    title: { ru: 'Шины и проверка состояния', en: 'Tires and condition check' },
    description: { ru: 'Подбор размера, осмотр износа, давления и повреждений.', en: 'Size selection, wear, pressure and damage checks.' },
    category: 'tire',
    tags: ['шины', 'давление', 'износ'],
    status: 'published',
  },
  {
    id: 'service',
    slug: 'service',
    title: { ru: 'Сервисные работы', en: 'Service work' },
    description: { ru: 'Базовое обслуживание и подготовка мотоцикла.', en: 'Basic maintenance and motorcycle preparation.' },
    category: 'service',
    tags: ['сервис', 'обслуживание', 'ремонт'],
    status: 'published',
  },
  {
    id: 'maintenance',
    slug: 'maintenance',
    title: { ru: 'Плановое ТО', en: 'Scheduled maintenance' },
    description: { ru: 'Масло, фильтры, цепь, тормоза и регламентные проверки.', en: 'Oil, filters, chain, brakes and scheduled checks.' },
    category: 'service',
    tags: ['то', 'масло', 'фильтры', 'цепь'],
    status: 'published',
  },
  {
    id: 'diagnostics',
    slug: 'diagnostics',
    title: { ru: 'Диагностика', en: 'Diagnostics' },
    description: { ru: 'Поиск причин неисправности перед ремонтом.', en: 'Finding the cause before repair.' },
    category: 'service',
    tags: ['диагностика', 'ошибка', 'неисправность'],
    status: 'published',
  },
  {
    id: 'training',
    slug: 'training',
    title: { ru: 'Тренировка навыков', en: 'Skills training' },
    description: { ru: 'Практика базовых упражнений и уверенного управления.', en: 'Practice basic drills and confident control.' },
    category: 'training',
    tags: ['тренировка', 'навыки', 'площадка'],
    status: 'published',
  },
  {
    id: 'instructor',
    slug: 'instructor',
    title: { ru: 'Инструктор', en: 'Instructor' },
    description: { ru: 'Индивидуальная помощь с техникой, страхом и городом.', en: 'Individual help with technique, fear and city riding.' },
    category: 'training',
    tags: ['инструктор', 'обучение', 'город'],
    status: 'published',
  },
  {
    id: 'defensive-riding',
    slug: 'defensive-riding',
    title: { ru: 'Контраварийная подготовка', en: 'Defensive riding' },
    description: { ru: 'Торможение, объезд препятствий и безопасные реакции.', en: 'Braking, obstacle avoidance and safer reactions.' },
    category: 'training',
    tags: ['контраварийка', 'торможение', 'упм'],
    status: 'published',
  },
  {
    id: 'city-riding',
    slug: 'city-riding',
    title: { ru: 'Городская езда', en: 'City riding' },
    description: { ru: 'Навыки для потока, дистанции, видимости и спокойных решений.', en: 'Skills for traffic, distance, visibility and calm decisions.' },
    category: 'training',
    tags: ['город', 'поток', 'страх'],
    status: 'published',
  },
];
