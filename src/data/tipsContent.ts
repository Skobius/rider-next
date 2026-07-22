import type { LocalizedText } from '../shared/i18n/localizedText';

export interface TipItem {
  id: string;
  title: LocalizedText;
  image: string;
  summary: LocalizedText;
  whyImportant: LocalizedText[];
  actions: LocalizedText[];
  warning: LocalizedText;
  related: LocalizedText[];
}

export const tipsContent: TipItem[] = [
  {
    id: 'pressure-before-ride',
    title: { ru: 'Проверь давление до выезда', en: 'Check pressure before the ride' },
    image: '/assets/bot/tires.jpg',
    summary: {
      ru: 'Давление в шинах лучше проверять на холодных колёсах: до поездки, а не после нескольких километров до заправки.',
      en: 'Tire pressure is best checked on cold tires: before the ride, not after several kilometers to the gas station.',
    },
    whyImportant: [
      { ru: 'После движения шины нагреваются.', en: 'Tires heat up after riding.' },
      { ru: 'Давление увеличивается, и измерение становится менее показательным.', en: 'Pressure rises, so the reading becomes less useful.' },
      { ru: 'Неправильное давление влияет на управляемость и износ.', en: 'Wrong pressure affects handling and tire wear.' },
    ],
    actions: [
      { ru: 'Узнай рекомендованное давление для своего мотоцикла.', en: 'Find the recommended pressure for your motorcycle.' },
      { ru: 'Проверяй его перед дальней поездкой.', en: 'Check it before a longer ride.' },
      { ru: 'Используй исправный манометр.', en: 'Use a working pressure gauge.' },
      { ru: 'Не ориентируйся только на внешний вид шины.', en: 'Do not rely only on how the tire looks.' },
    ],
    warning: {
      ru: 'Точные значения давления бери из руководства к своему мотоциклу или с заводской наклейки.',
      en: 'Use exact pressure values from your motorcycle manual or factory label.',
    },
    related: [
      { ru: 'Демо мотошиномонтаж', en: 'Demo motorcycle tire fitting' },
      { ru: 'Сервисы и ремонт', en: 'Service and repair' },
    ],
  },
];

export function findTip(id: string | undefined) {
  if (!id) return undefined;
  return tipsContent.find((tip) => tip.id === id);
}
