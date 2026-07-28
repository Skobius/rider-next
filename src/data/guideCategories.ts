import type { LocalizedText } from '../shared/i18n/localizedText';

export interface GuideCategory {
  id: string;
  sectionId: string;
  title: LocalizedText;
  description?: LocalizedText;
}

export const guideCategories: GuideCategory[] = [
  { id: 'service-maintenance', sectionId: 'service', title: { ru: 'Обслуживание', en: 'Maintenance' } },
  { id: 'service-help', sectionId: 'service', title: { ru: 'Помощь и документы', en: 'Help and documents' } },
  { id: 'shopping-gear', sectionId: 'shopping', title: { ru: 'Экипировка', en: 'Gear' } },
  { id: 'shopping-buying', sectionId: 'shopping', title: { ru: 'Покупки', en: 'Buying' } },
  { id: 'routes-rides', sectionId: 'routes', title: { ru: 'Поездки', en: 'Rides' } },
  { id: 'community-events', sectionId: 'community', title: { ru: 'События', en: 'Events' } },
  { id: 'skills-control', sectionId: 'skills', title: { ru: 'Навыки', en: 'Skills' } },
  { id: 'skills-safety', sectionId: 'skills', title: { ru: 'Безопасность', en: 'Safety' } },
];
