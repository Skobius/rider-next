import type { SearchCategory } from './searchContent';
import type { ContentIconName } from '../shared/ui/contentIcons';
import type { LocalizedText } from '../shared/i18n/localizedText';

export type RiderTaskStatus = 'draft' | 'published' | 'archived';
export type RiderTaskRegionScope = 'global' | 'regional';
export type RiderTaskUrgency = 'low' | 'medium' | 'high';

export interface RiderTaskCta {
  label: LocalizedText;
  to: string;
}

export interface RiderTask {
  id: string;
  slug: string;
  title: LocalizedText;
  shortTitle: LocalizedText;
  shortDescription: LocalizedText;
  fullDescription: LocalizedText;
  icon: ContentIconName;
  coverImage?: string;
  status: RiderTaskStatus;
  isFeatured: boolean;
  featuredPriority: number;
  regionScope: RiderTaskRegionScope;
  regionId?: string;
  quickAnswer: LocalizedText;
  urgency: {
    level: RiderTaskUrgency;
    text: LocalizedText;
  };
  selfCheck: LocalizedText[];
  prepareBeforeContact: LocalizedText[];
  safetyWarning?: LocalizedText;
  searchAliases: LocalizedText[];
  tags: string[];
  relatedGuideIds: string[];
  relatedSkillIds: string[];
  relatedPlaceCategoryIds: string[];
  relatedServiceDefinitionIds: string[];
  relatedRouteIds?: string[];
  relatedEventIds?: string[];
  recommendedPlaceIds?: string[];
  cta: RiderTaskCta;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export const riderTasks: RiderTask[] = [
  {
    id: 'change-tires',
    slug: 'pomenyat-rezinu',
    title: { ru: 'Поменять резину', en: 'Change tires' },
    shortTitle: { ru: 'Поменять резину', en: 'Change tires' },
    shortDescription: { ru: 'Понять, когда ехать в мотошиномонтаж и что уточнить перед записью.', en: 'Understand when to visit a motorcycle tire service and what to ask before booking.' },
    fullDescription: { ru: 'Сценарий для ситуации, когда нужно заменить, проверить или сезонно переобуть резину на мотоцикле.', en: 'A task for replacing, checking or seasonal tire service on a motorcycle.' },
    icon: 'circle-gauge',
    coverImage: '/assets/bot/tires.jpg',
    status: 'published',
    isFeatured: true,
    featuredPriority: 10,
    regionScope: 'regional',
    regionId: 'smolensk-oblast',
    quickAnswer: { ru: 'Сначала проверь состояние шин, давление и размер. Если есть порезы, сильный износ, вибрация, спускание или нужна сезонная замена, лучше выбрать мотошиномонтаж и заранее уточнить, работают ли они именно с мотоциклетными колёсами.', en: 'Check tire condition, pressure and size first. If there are cuts, heavy wear, vibration, pressure loss or a seasonal change is needed, choose a motorcycle tire service and confirm they work with motorcycle wheels.' },
    urgency: {
      level: 'high',
      text: { ru: 'Срочно, если шина спускает, есть порез, грыжа, видимый корд, сильная вибрация или мотоцикл стало вести в сторону.', en: 'Urgent if the tire loses pressure, has a cut, bulge, visible cord, strong vibration or the bike pulls to one side.' },
    },
    selfCheck: [
      { ru: 'Посмотри дату производства, остаток протектора и равномерность износа.', en: 'Check the production date, tread depth and evenness of wear.' },
      { ru: 'Проверь давление на холодных шинах по мануалу своего мотоцикла.', en: 'Check cold tire pressure according to your motorcycle manual.' },
      { ru: 'Убедись, что размер и индекс нагрузки подходят твоему мотоциклу.', en: 'Make sure size and load rating fit your motorcycle.' },
    ],
    prepareBeforeContact: [
      { ru: 'Марку и модель мотоцикла.', en: 'Motorcycle make and model.' },
      { ru: 'Размер передней и задней шины.', en: 'Front and rear tire size.' },
      { ru: 'Нужно ли снять колёса с мотоцикла или ты привезёшь уже снятые.', en: 'Whether wheels must be removed from the bike or you bring loose wheels.' },
      { ru: 'Нужна ли балансировка и замена вентиля.', en: 'Whether balancing and valve replacement are needed.' },
    ],
    safetyWarning: { ru: 'Не езди на повреждённой или быстро спускающей шине. Если сомневаешься в состоянии резины, лучше не рисковать и довезти мотоцикл до сервиса безопасным способом.', en: 'Do not ride on a damaged or quickly deflating tire. If unsure, transport the motorcycle safely to service.' },
    searchAliases: [
      { ru: 'где поменять резину', en: 'where to change tires' },
      { ru: 'мотошиномонтаж', en: 'motorcycle tire service' },
      { ru: 'переобуть мотоцикл', en: 'change motorcycle tires' },
      { ru: 'балансировка мото колеса', en: 'motorcycle wheel balancing' },
    ],
    tags: ['резина', 'шины', 'мотошиномонтаж', 'давление', 'балансировка', 'колёса', 'tires'],
    relatedGuideIds: ['motorcycle-tire-pressure'],
    relatedSkillIds: [],
    relatedPlaceCategoryIds: ['places-tire-services'],
    relatedServiceDefinitionIds: ['motorcycle-tire-service', 'balancing', 'tires'],
    recommendedPlaceIds: ['dom-shin-67-under-bridge', 'ford-reanimator-tire-service'],
    cta: { label: { ru: 'Найти мотошиномонтажи', en: 'Find tire services' }, to: '/search?category=service&q=мотошиномонтаж' },
    createdAt: '2026-07-31',
    updatedAt: '2026-07-31',
    publishedAt: '2026-07-31',
  },
  {
    id: 'service-or-repair-motorcycle',
    slug: 'otremontirovat-ili-obsluzhit-motocikl',
    title: { ru: 'Отремонтировать или обслужить мотоцикл', en: 'Repair or service a motorcycle' },
    shortTitle: { ru: 'Ремонт или ТО', en: 'Repair or service' },
    shortDescription: { ru: 'Понять, куда обратиться с ТО, диагностикой, маслом, электрикой или ремонтом.', en: 'Find where to go for maintenance, diagnostics, oil, electrics or repair.' },
    fullDescription: { ru: 'Сценарий для планового ТО, диагностики, ремонта и подготовки мотоцикла к сезону.', en: 'A task for scheduled maintenance, diagnostics, repair and season preparation.' },
    icon: 'wrench',
    coverImage: '/assets/bot/smolensk_services.jpg',
    status: 'published',
    isFeatured: true,
    featuredPriority: 20,
    regionScope: 'regional',
    regionId: 'smolensk-oblast',
    quickAnswer: { ru: 'Определи задачу: плановое ТО, диагностика, ремонт после поломки или подготовка к сезону. После этого выбирай сервис по специализации и заранее уточняй, берут ли твою модель, есть ли запись и можно ли приехать со своими расходниками.', en: 'Define the task: scheduled service, diagnostics, breakdown repair or season prep. Then choose a service by specialization and confirm they work with your model, have booking slots and allow own parts.' },
    urgency: {
      level: 'medium',
      text: { ru: 'Срочно, если есть течь, проблемы с тормозами, перегрев, пропала зарядка, мотоцикл глохнет или появились резкие посторонние звуки.', en: 'Urgent if there is a leak, brake issue, overheating, no charging, stalling or sharp unusual noises.' },
    },
    selfCheck: [
      { ru: 'Запиши симптомы: когда появились, на какой скорости, после каких действий.', en: 'Write down symptoms: when they appeared, at what speed and after what action.' },
      { ru: 'Проверь уровень масла, видимые течи, тормоза, свет и заряд аккумулятора.', en: 'Check oil level, visible leaks, brakes, lights and battery charge.' },
      { ru: 'Посмотри пробег и дату последнего обслуживания.', en: 'Check mileage and date of the last service.' },
    ],
    prepareBeforeContact: [
      { ru: 'Марку, модель, год и пробег мотоцикла.', en: 'Make, model, year and mileage.' },
      { ru: 'Короткое описание проблемы или список работ.', en: 'Short problem description or work list.' },
      { ru: 'Фото/видео симптома, если это безопасно снять.', en: 'Photo/video of the symptom if safe to capture.' },
      { ru: 'Список своих запчастей или расходников, если хочешь привезти их сам.', en: 'List of own parts or consumables if you want to bring them.' },
    ],
    safetyWarning: { ru: 'Не продолжай движение, если проблема связана с тормозами, рулём, сильной течью, перегревом или нестабильной работой двигателя.', en: 'Do not continue riding if the issue involves brakes, steering, heavy leak, overheating or unstable engine operation.' },
    searchAliases: [
      { ru: 'где отремонтировать мотоцикл', en: 'where to repair motorcycle' },
      { ru: 'мотосервис', en: 'motorcycle service' },
      { ru: 'пройти ТО', en: 'scheduled maintenance' },
      { ru: 'диагностика мотоцикла', en: 'motorcycle diagnostics' },
      { ru: 'замена масла', en: 'oil change' },
    ],
    tags: ['сервис', 'ремонт', 'то', 'масло', 'диагностика', 'электрика', 'карбюратор', 'инжектор', 'service', 'repair'],
    relatedGuideIds: ['when-to-change-motorcycle-oil', 'motorcycle-chain-care', 'motorcycle-check-after-winter'],
    relatedSkillIds: [],
    relatedPlaceCategoryIds: ['places-services'],
    relatedServiceDefinitionIds: ['service', 'maintenance', 'diagnostics'],
    recommendedPlaceIds: ['rolling-moto-service-smolensk', 'moto-repair-67'],
    cta: { label: { ru: 'Найти мотосервисы', en: 'Find motorcycle services' }, to: '/search?category=service&q=мотосервис' },
    createdAt: '2026-07-31',
    updatedAt: '2026-07-31',
    publishedAt: '2026-07-31',
  },
  {
    id: 'ride-more-confidently',
    slug: 'nauchitsya-uverennee-ezdit',
    title: { ru: 'Научиться увереннее ездить', en: 'Ride more confidently' },
    shortTitle: { ru: 'Ездить увереннее', en: 'Ride confidently' },
    shortDescription: { ru: 'Понять, что тренировать самому и когда идти к инструктору.', en: 'Understand what to practice yourself and when to work with an instructor.' },
    fullDescription: { ru: 'Сценарий для новичка, который хочет спокойнее чувствовать мотоцикл, город и базовые манёвры.', en: 'A task for a beginner who wants to feel calmer with the bike, city and basic maneuvers.' },
    icon: 'shield-check',
    coverImage: '/assets/bot/smolensk_training.jpg',
    status: 'published',
    isFeatured: true,
    featuredPriority: 30,
    regionScope: 'regional',
    regionId: 'smolensk-oblast',
    quickAnswer: { ru: 'Начни не с скорости, а с базы: посадка, взгляд, сцепление, торможение, медленные манёвры и развороты. Если страшно в городе или непонятно, что именно тренировать, лучше взять занятие с инструктором и потом закреплять упражнения самостоятельно.', en: 'Start not with speed but basics: posture, vision, clutch, braking, slow maneuvers and U-turns. If city riding feels scary or you do not know what to practice, take a lesson and then repeat drills yourself.' },
    urgency: {
      level: 'low',
      text: { ru: 'Обычно это не срочно, но не откладывай, если страх мешает выезжать, ты часто теряешь равновесие или не контролируешь торможение.', en: 'Usually not urgent, but do not delay if fear stops you riding, you often lose balance or cannot control braking.' },
    },
    selfCheck: [
      { ru: 'Отметь, что именно вызывает напряжение: старт, остановка, поворот, поток, скорость или разворот.', en: 'Name what creates tension: start, stop, turn, traffic, speed or U-turn.' },
      { ru: 'Выбери одну задачу на тренировку, а не пытайся улучшить всё сразу.', en: 'Pick one training goal instead of improving everything at once.' },
      { ru: 'Тренируйся на спокойной площадке и заканчивай до усталости.', en: 'Practice in a calm area and finish before fatigue.' },
    ],
    prepareBeforeContact: [
      { ru: 'Скажи инструктору свой стаж, мотоцикл и главный страх.', en: 'Tell the instructor your experience, motorcycle and main fear.' },
      { ru: 'Подготовь экипировку и исправный мотоцикл.', en: 'Prepare gear and a mechanically sound motorcycle.' },
      { ru: 'Сформулируй цель занятия: город, торможение, развороты, медленная езда или УПМ.', en: 'Set the lesson goal: city, braking, U-turns, slow riding or advanced drills.' },
    ],
    safetyWarning: { ru: 'Не тренируй экстренные манёвры в потоке и на незнакомой дороге. Для этого нужна площадка и понятная зона безопасности.', en: 'Do not practice emergency maneuvers in traffic or on an unfamiliar road. Use a practice area with a clear safety zone.' },
    searchAliases: [
      { ru: 'как ездить увереннее', en: 'how to ride more confidently' },
      { ru: 'мототренировка', en: 'motorcycle training' },
      { ru: 'инструктор по мото', en: 'motorcycle instructor' },
      { ru: 'площадка для тренировки', en: 'practice area' },
      { ru: 'упражнения на мотоцикле', en: 'motorcycle drills' },
    ],
    tags: ['навыки', 'тренировка', 'инструктор', 'площадка', 'город', 'страх', 'упражнения', 'training', 'skills'],
    relatedGuideIds: ['city-fear', 'blind-zones', 'visibility-city'],
    relatedSkillIds: ['basic-position', 'basic-acceleration-braking', 'basic-snake', 'upm-emergency-braking'],
    relatedPlaceCategoryIds: ['places-training-areas', 'places-schools-instructors'],
    relatedServiceDefinitionIds: ['training', 'instructor', 'defensive-riding', 'city-riding'],
    recommendedPlaceIds: ['mg67-training-area', 'gleb-simdyankin-mg67', 'gymkhana-smolensk-area'],
    cta: { label: { ru: 'Найти тренировки и инструкторов', en: 'Find training and instructors' }, to: '/search?category=training&q=тренировка' },
    createdAt: '2026-07-31',
    updatedAt: '2026-07-31',
    publishedAt: '2026-07-31',
  },
];

export function getPublishedRiderTasks() {
  return riderTasks.filter((task) => task.status === 'published');
}

export function getFeaturedRiderTasks() {
  return getPublishedRiderTasks()
    .filter((task) => task.isFeatured)
    .sort((a, b) => a.featuredPriority - b.featuredPriority);
}

export function findRiderTaskBySlug(slug: string | undefined) {
  if (!slug) return undefined;
  return riderTasks.find((task) => task.slug === slug && task.status === 'published');
}
