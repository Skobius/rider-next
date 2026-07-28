import type { LocalizedText } from '../shared/i18n/localizedText';

export type SectionTaskTargetType = 'search' | 'category' | 'guide' | 'placeholder';

export interface SectionTask {
  id: string;
  sectionId: string;
  title: LocalizedText;
  description?: LocalizedText;
  icon: string;
  query?: string;
  filters?: Record<string, string>;
  targetType: SectionTaskTargetType;
}

export const sectionTasks: SectionTask[] = [
  { id: 'service-services', sectionId: 'service', title: { ru: 'Мотосервисы', en: 'Motorcycle services' }, icon: 'wrench', filters: { category: 'service' }, targetType: 'search' },
  { id: 'service-maintenance', sectionId: 'service', title: { ru: 'Сделать ТО', en: 'Get maintenance' }, icon: 'clipboard-check', query: 'ТО сервис масло', filters: { category: 'service' }, targetType: 'search' },
  { id: 'service-tires', sectionId: 'service', title: { ru: 'Поменять резину', en: 'Change tires' }, icon: 'circle-gauge', query: 'шиномонтаж резина', filters: { category: 'service' }, targetType: 'search' },
  { id: 'service-parts', sectionId: 'service', title: { ru: 'Запчасти для ремонта', en: 'Repair parts' }, icon: 'package', query: 'запчасти расходники', filters: { category: 'equipment' }, targetType: 'search' },
  { id: 'service-electrics', sectionId: 'service', title: { ru: 'Электрика и аккумуляторы', en: 'Electrics and batteries' }, icon: 'battery-charging', query: 'аккумулятор электрика', filters: { category: 'storage' }, targetType: 'search' },
  { id: 'service-road-help', sectionId: 'service', title: { ru: 'Помощь на дороге', en: 'Road assistance' }, icon: 'life-buoy', query: 'эвакуатор помощь', targetType: 'search' },
  { id: 'service-insurance', sectionId: 'service', title: { ru: 'Страховка и документы', en: 'Insurance and documents' }, icon: 'file-check', filters: { category: 'insurance' }, targetType: 'search' },
  { id: 'service-storage', sectionId: 'service', title: { ru: 'Зимнее хранение', en: 'Winter storage' }, icon: 'warehouse', filters: { category: 'storage' }, targetType: 'search' },
  { id: 'service-care', sectionId: 'service', title: { ru: 'Мойка и уход', en: 'Washing and care' }, icon: 'sparkles', query: 'мойка уход', targetType: 'search' },
  { id: 'service-season', sectionId: 'service', title: { ru: 'Подготовка к сезону', en: 'Season prep' }, icon: 'sun', query: 'подготовка к сезону', targetType: 'search' },

  { id: 'shopping-gear', sectionId: 'shopping', title: { ru: 'Экипировка', en: 'Gear' }, icon: 'shield', filters: { category: 'equipment' }, targetType: 'search' },
  { id: 'shopping-helmet', sectionId: 'shopping', title: { ru: 'Шлем', en: 'Helmet' }, icon: 'badge', query: 'шлем экипировка', filters: { category: 'equipment' }, targetType: 'search' },
  { id: 'shopping-gloves', sectionId: 'shopping', title: { ru: 'Перчатки', en: 'Gloves' }, icon: 'hand', query: 'перчатки экипировка', filters: { category: 'equipment' }, targetType: 'search' },
  { id: 'shopping-boots', sectionId: 'shopping', title: { ru: 'Мотоботы', en: 'Motorcycle boots' }, icon: 'footprints', query: 'боты экипировка', filters: { category: 'equipment' }, targetType: 'search' },
  { id: 'shopping-consumables', sectionId: 'shopping', title: { ru: 'Расходники', en: 'Consumables' }, icon: 'shopping-bag', query: 'масло расходники запчасти', targetType: 'search' },

  { id: 'routes-today', sectionId: 'routes', title: { ru: 'Куда поехать сегодня', en: 'Where to ride today' }, icon: 'route', filters: { type: 'route', date: 'today' }, targetType: 'search' },
  { id: 'routes-evening', sectionId: 'routes', title: { ru: 'Маршрут на вечер', en: 'Evening route' }, icon: 'moon', filters: { type: 'route', date: 'evening' }, targetType: 'search' },
  { id: 'routes-weekend', sectionId: 'routes', title: { ru: 'Маршрут выходного дня', en: 'Weekend route' }, icon: 'calendar-days', filters: { type: 'route', date: 'upcoming' }, targetType: 'search' },
  { id: 'routes-places', sectionId: 'routes', title: { ru: 'Красивые места', en: 'Nice places' }, icon: 'map-pinned', filters: { type: 'route' }, targetType: 'search' },

  { id: 'community-today', sectionId: 'community', title: { ru: 'Сегодня', en: 'Today' }, icon: 'calendar-days', filters: { type: 'event', date: 'today' }, targetType: 'search' },
  { id: 'community-week', sectionId: 'community', title: { ru: 'На этой неделе', en: 'This week' }, icon: 'calendar-range', filters: { type: 'event', date: 'upcoming' }, targetType: 'search' },
  { id: 'community-meetups', sectionId: 'community', title: { ru: 'Встречи и сходки', en: 'Meetups' }, icon: 'users-round', filters: { type: 'event' }, targetType: 'search' },
  { id: 'community-training', sectionId: 'community', title: { ru: 'Тренировки', en: 'Training' }, icon: 'dumbbell', query: 'тренировка', filters: { category: 'training' }, targetType: 'search' },
  { id: 'community-clubs', sectionId: 'community', title: { ru: 'Клубы и сообщества', en: 'Clubs and communities' }, icon: 'badge-check', targetType: 'placeholder' },

  { id: 'skills-basic', sectionId: 'skills', title: { ru: 'Базовое управление', en: 'Basic control' }, icon: 'bike', targetType: 'placeholder' },
  { id: 'skills-slow', sectionId: 'skills', title: { ru: 'Медленная езда', en: 'Slow riding' }, icon: 'gauge', targetType: 'placeholder' },
  { id: 'skills-braking', sectionId: 'skills', title: { ru: 'Торможение', en: 'Braking' }, icon: 'disc', targetType: 'placeholder' },
  { id: 'skills-city', sectionId: 'skills', title: { ru: 'Городская езда', en: 'City riding' }, icon: 'traffic-cone', targetType: 'placeholder' },
  { id: 'skills-training-place', sectionId: 'skills', title: { ru: 'Где тренироваться', en: 'Where to train' }, icon: 'map-pin', query: 'тренировка площадка', filters: { category: 'training' }, targetType: 'search' },
];
