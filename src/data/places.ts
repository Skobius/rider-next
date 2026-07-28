import type { SearchCategory, SearchItem } from './searchContent';
import type { LocalizedText } from '../shared/i18n/localizedText';

export type VerificationStatus = 'verified_mg67' | 'confirmed' | 'community' | 'pending';

export interface PlaceBranch {
  id: string;
  title?: LocalizedText;
  address: LocalizedText;
  phone?: string;
  schedule?: LocalizedText;
  coordinates?: { lat: number; lng: number };
  mapUrl?: string;
}

export interface PlaceContact {
  type: 'phone' | 'website' | 'vk' | 'telegram' | 'whatsapp' | 'email';
  label?: LocalizedText;
  value: string;
  url?: string;
}

export interface PlaceItem extends SearchItem {
  type: 'place';
  slug: string;
  name: LocalizedText;
  categoryId: string;
  shortDescription: LocalizedText;
  fullDescription: LocalizedText;
  coverImage?: string;
  logoImage?: string;
  gallery?: string[];
  coordinates?: [number, number] | null;
  mapVisibility?: boolean;
  mapUrl?: string;
  verificationStatus: VerificationStatus;
  verificationNote?: LocalizedText;
  informationCheckedAt?: string;
  branches: PlaceBranch[];
  contacts: PlaceContact[];
  products?: string[];
  features?: string[];
  mg67Comment?: LocalizedText;
  isFeatured?: boolean;
  status: 'placeholder' | 'listed';
  badge: LocalizedText;
}

export const verificationLabels: Record<VerificationStatus, LocalizedText> = {
  verified_mg67: { ru: 'Проверено MG67' },
  confirmed: { ru: 'Информация подтверждена' },
  community: { ru: 'Добавлено сообществом' },
  pending: { ru: 'Информация уточняется' },
};

export const productLabels: Record<string, LocalizedText> = {
  motorcycles: { ru: 'мототехника' },
  'riding-gear': { ru: 'экипировка' },
  'enduro-gear': { ru: 'эндуро-экипировка' },
  helmets: { ru: 'шлемы' },
  'body-protection': { ru: 'защита тела' },
  boots: { ru: 'мотоботы' },
  gloves: { ru: 'перчатки' },
  parts: { ru: 'запчасти' },
  consumables: { ru: 'расходники' },
  accessories: { ru: 'аксессуары' },
  oils: { ru: 'масла' },
  'motorcycle-chemicals': { ru: 'мотохимия' },
  showroom: { ru: 'мотосалон' },
  service: { ru: 'сервисные работы' },
  diagnostics: { ru: 'диагностика' },
  maintenance: { ru: 'ТО' },
  'by-appointment': { ru: 'по записи' },
  tires: { ru: 'шины' },
  balancing: { ru: 'балансировка' },
  'motorcycle-tire-service': { ru: 'мотошиномонтаж' },
  training: { ru: 'тренировки' },
  'closed-area': { ru: 'закрытая площадка' },
  instructor: { ru: 'инструктор' },
  'category-a': { ru: 'категория А' },
  'defensive-riding': { ru: 'контраварийная подготовка' },
  'city-riding': { ru: 'городская подготовка' },
};

const categoryToSearch: Record<string, SearchCategory> = {
  'places-services': 'service',
  'places-tire-services': 'service',
  'moto-shops': 'equipment',
  'places-training-areas': 'training',
  'places-schools-instructors': 'training',
};

function place(config: Omit<PlaceItem, 'type' | 'category' | 'regionId' | 'title' | 'description' | 'verified' | 'demo' | 'status' | 'badge'>): PlaceItem {
  return {
    ...config,
    type: 'place',
    category: categoryToSearch[config.categoryId] ?? 'service',
    regionId: 'smolensk-oblast',
    title: config.name,
    description: config.shortDescription,
    verified: config.verificationStatus === 'verified_mg67' || config.verificationStatus === 'confirmed',
    demo: false,
    status: 'listed',
    badge: verificationLabels[config.verificationStatus],
  };
}

export const places: PlaceItem[] = [
  place({
    id: 'rolling-moto-shop-smolensk',
    slug: 'rolling-moto-shop-smolensk',
    name: { ru: 'Rolling Moto' },
    categoryId: 'moto-shops',
    shortDescription: { ru: 'Мотосалон в Смоленске: мототехника и товары для мотоциклистов.' },
    fullDescription: { ru: 'Rolling Moto — смоленский мотосалон федеральной сети. Здесь можно посмотреть мототехнику и подобрать товары, связанные с эксплуатацией мотоцикла.\n\nПеред поездкой лучше уточнить наличие конкретной модели, размера экипировки или нужного товара.' },
    coverImage: '/assets/bot/smolensk_shops.jpg',
    image: '/assets/bot/smolensk_shops.jpg',
    coordinates: [31.972202, 54.791412],
    mapUrl: 'https://yandex.ru/maps/?pt=31.972202,54.791412&z=16&l=map',
    verificationStatus: 'confirmed',
    informationCheckedAt: '23.07.2026',
    branches: [{ id: 'main', address: { ru: 'Смоленск, посёлок Серебрянка, 84Б' }, phone: '+79532687636', schedule: { ru: 'Ежедневно, 10:00–18:00' } }],
    contacts: [
      { type: 'phone', value: '+79532687636' },
      { type: 'website', value: 'rollingmoto.ru', url: 'https://www.rollingmoto.ru/' },
    ],
    products: ['motorcycles', 'riding-gear', 'parts', 'consumables', 'accessories', 'showroom'],
    services: [{ ru: 'мототехника' }, { ru: 'экипировка' }, { ru: 'запчасти' }],
    tags: ['rolling moto', 'мотосалон', 'мотомагазин', 'экипировка', 'запчасти', 'серебрянка'],
    searchKeywords: [{ ru: 'где купить экипировку' }, { ru: 'мотомагазин смоленск' }, { ru: 'расходники' }],
    isFeatured: true,
    featured: true,
  }),
  place({
    id: 'atv-motoshop-smolensk',
    slug: 'atv-motoshop-smolensk',
    name: { ru: 'ATV-Motoshop' },
    categoryId: 'moto-shops',
    shortDescription: { ru: 'Мотосалон и магазин мототехники, экипировки, запчастей, расходников и аксессуаров.' },
    fullDescription: { ru: 'ATV-Motoshop — смоленский мотосалон и специализированный магазин. На официальном сайте заявлены мототехника, экипировка, запчасти, расходные материалы, аксессуары, масла и мотохимия.\n\nПеред поездкой лучше позвонить и уточнить наличие конкретного товара, бренда или размера.' },
    coverImage: '/assets/bot/helmet.jpg',
    image: '/assets/bot/helmet.jpg',
    coordinates: [32.082477, 54.760818],
    mapUrl: 'https://yandex.ru/maps/?pt=32.082477,54.760818&z=16&l=map',
    verificationStatus: 'confirmed',
    informationCheckedAt: '23.07.2026',
    branches: [{ id: 'main', address: { ru: 'Смоленск, улица Маршала Соколовского, 17' }, phone: '+79107880090', schedule: { ru: 'Пн–Пт 09:00–18:00; Сб–Вс 09:00–16:00' } }],
    contacts: [
      { type: 'phone', value: '+79107880090' },
      { type: 'website', value: 'atv-motoshop.ru', url: 'https://atv-motoshop.ru/' },
    ],
    products: ['motorcycles', 'riding-gear', 'parts', 'consumables', 'accessories', 'oils', 'motorcycle-chemicals'],
    services: [{ ru: 'экипировка' }, { ru: 'масла' }, { ru: 'мотохимия' }],
    tags: ['atv-motoshop', 'мотомагазин', 'экипировка', 'масла', 'соколовского'],
    searchKeywords: [{ ru: 'где купить шлем' }, { ru: 'масло для мотоцикла' }, { ru: 'мотохимия' }],
    isFeatured: true,
    featured: true,
  }),
  place({
    id: 'enduro-bronya-smolensk',
    slug: 'enduro-bronya-smolensk',
    name: { ru: 'Эндуро Броня' },
    categoryId: 'moto-shops',
    shortDescription: { ru: 'Специализированный магазин мотоэкипировки и товаров для эндуро.' },
    fullDescription: { ru: '«Эндуро Броня» — специализированный магазин экипировки и защиты для эндуро.\n\nПеред поездкой обязательно уточнить по телефону актуальный адрес, график и наличие нужного размера: в открытых справочниках встречаются разные данные.' },
    coverImage: '/assets/bot/jacket.jpg',
    image: '/assets/bot/jacket.jpg',
    coordinates: [32.045654, 54.774663],
    mapUrl: 'https://yandex.ru/maps/?pt=32.045654,54.774663&z=16&l=map',
    verificationStatus: 'pending',
    verificationNote: { ru: 'В открытых источниках встречаются разные адреса. Перед публикацией нужно подтвердить данные у владельца.' },
    informationCheckedAt: '23.07.2026',
    branches: [{ id: 'main', address: { ru: 'Предварительно: Смоленск, проспект Гагарина, 10/2, ТЦ «Гамаюн»' }, phone: '+79913483141', schedule: { ru: 'Предварительно: Пн–Пт 10:00–19:00; Сб–Вс 10:00–17:00' } }],
    contacts: [{ type: 'phone', value: '+79913483141' }],
    products: ['enduro-gear', 'helmets', 'body-protection', 'boots', 'gloves'],
    services: [{ ru: 'эндуро-экипировка' }, { ru: 'защита тела' }],
    tags: ['эндуро броня', 'эндуро', 'экипировка', 'защита', 'гамаюн'],
    searchKeywords: [{ ru: 'эндуро экипировка' }, { ru: 'где купить защиту' }, { ru: 'мотоботы' }],
  }),
  place({
    id: 'rolling-moto-service-smolensk',
    slug: 'rolling-moto-service-smolensk',
    name: { ru: 'Rolling Moto — сервис и обслуживание' },
    categoryId: 'places-services',
    shortDescription: { ru: 'Сервисная карточка Rolling Moto для обслуживания и консультаций по мотоциклу.' },
    fullDescription: { ru: 'Смоленское представительство Rolling Moto. В карточке сервиса показываем его отдельно от карточки магазина, но обе сущности могут вести на одну организацию.\n\nПеред поездкой нужно позвонить и уточнить, выполняется ли требуемая работа и есть ли запись.' },
    coverImage: '/assets/bot/smolensk_services.jpg',
    image: '/assets/bot/smolensk_services.jpg',
    coordinates: [31.972202, 54.791412],
    mapUrl: 'https://yandex.ru/maps/?pt=31.972202,54.791412&z=16&l=map',
    verificationStatus: 'confirmed',
    informationCheckedAt: '28.07.2026',
    branches: [{ id: 'main', address: { ru: 'Смоленск, посёлок Серебрянка, 84Б' }, phone: '+79532687636', schedule: { ru: 'Ежедневно, 10:00–18:00' } }],
    contacts: [
      { type: 'phone', value: '+79532687636' },
      { type: 'website', value: 'rollingmoto.ru/contacts/smolensk', url: 'https://www.rollingmoto.ru/contacts/smolensk/' },
    ],
    products: ['parts', 'consumables'],
    features: ['service', 'maintenance', 'by-appointment'],
    services: [{ ru: 'консультация по обслуживанию' }, { ru: 'запчасти и расходники' }],
    tags: ['сервис', 'обслуживание', 'то', 'rolling moto', 'ремонт', 'масло'],
    searchKeywords: [{ ru: 'где поменять масло' }, { ru: 'мотосервис' }, { ru: 'то мотоцикла' }],
    featured: true,
  }),
  place({
    id: 'moto-repair-67',
    slug: 'moto-repair-67',
    name: { ru: 'MOTO-REPAIR 67' },
    categoryId: 'places-services',
    shortDescription: { ru: 'Мастерская по ремонту мотоциклов, мопедов и скутеров.' },
    fullDescription: { ru: 'Мастерская заявляет ремонт мотоциклов, мопедов и скутеров.\n\nПеред публикацией нужно позвонить, подтвердить актуальность, специализацию, график, возможность диагностики и приёма дорожных мотоциклов.' },
    coverImage: '/assets/bot/fault.jpg',
    image: '/assets/bot/fault.jpg',
    coordinates: [31.9938, 54.7794],
    mapUrl: 'https://yandex.ru/maps/?pt=31.9938,54.7794&z=16&l=map',
    verificationStatus: 'pending',
    verificationNote: { ru: 'Нужно подтвердить актуальность, специализацию, график и перечень работ.' },
    informationCheckedAt: '28.07.2026',
    branches: [{ id: 'main', address: { ru: 'Предварительно: Смоленск, ГСК «Кловка-2», 1' }, phone: '+79206678188', schedule: { ru: 'По предварительной записи; в справочниках указана круглосуточная работа' } }],
    contacts: [{ type: 'phone', value: '+79206678188' }],
    features: ['service', 'diagnostics', 'maintenance', 'by-appointment'],
    services: [{ ru: 'ремонт мототехники' }, { ru: 'диагностика — уточнить' }],
    tags: ['moto-repair 67', 'ремонт', 'мотосервис', 'мопед', 'скутер', 'кловка'],
    searchKeywords: [{ ru: 'ремонт мотоцикла' }, { ru: 'диагностика мотоцикла' }],
  }),
  place({
    id: 'dom-shin-67-under-bridge',
    slug: 'dom-shin-67-under-bridge',
    name: { ru: '«Под мостом» / Дом шин 67' },
    categoryId: 'places-tire-services',
    shortDescription: { ru: 'Кандидат на мотошиномонтаж рядом с Колхозной площадью и мостом.' },
    fullDescription: { ru: 'Шиномонтаж рядом с Колхозной площадью и мостом. В открытых источниках встречаются варианты адреса «8А» и «8 стр. 3», поэтому приложение показывает предупреждение до прямой проверки.' },
    coverImage: '/assets/bot/tires.jpg',
    image: '/assets/bot/tires.jpg',
    coordinates: [32.0469, 54.7959],
    mapUrl: 'https://yandex.ru/maps/?pt=32.0469,54.7959&z=16&l=map',
    verificationStatus: 'pending',
    verificationNote: { ru: 'Нужно подтвердить точный въезд, график и работу с мотоциклетными колёсами.' },
    informationCheckedAt: '28.07.2026',
    branches: [{ id: 'main', address: { ru: 'Предварительно: Смоленск, улица Кашена, 8А / строение 3' }, phone: '+79043628167', schedule: { ru: 'Круглосуточно — по открытым источникам' } }],
    contacts: [
      { type: 'phone', value: '+79043628167' },
      { type: 'website', value: 'domshin67.ru', url: 'https://domshin67.ru/' },
    ],
    products: ['tires'],
    features: ['motorcycle-tire-service', 'balancing'],
    services: [{ ru: 'мотошиномонтаж — заявлен' }, { ru: 'шины и диски' }],
    tags: ['шиномонтаж', 'резина', 'шины', 'дом шин 67', 'кашена', 'под мостом'],
    searchKeywords: [{ ru: 'где поменять резину' }, { ru: 'мотошиномонтаж' }, { ru: 'балансировка колеса' }],
    featured: true,
  }),
  place({
    id: 'ford-reanimator-tire-service',
    slug: 'ford-reanimator-tire-service',
    name: { ru: 'Ford Реаниматор' },
    categoryId: 'places-tire-services',
    shortDescription: { ru: 'Кандидат на мотошиномонтаж в южной части Смоленска.' },
    fullDescription: { ru: 'Кандидат на второй мотошиномонтаж в южной части Смоленска, по направлению к ипподрому.\n\nВ карточке нельзя обещать снятие и установку мотоциклетного колеса до прямого подтверждения.' },
    coverImage: '/assets/bot/tires.jpg',
    image: '/assets/bot/tires.jpg',
    coordinates: [32.045278, 54.764167],
    mapUrl: 'https://yandex.ru/maps/?pt=32.045278,54.764167&z=16&l=map',
    verificationStatus: 'pending',
    verificationNote: { ru: 'Нужно подтвердить мотоуслуги, адрес, график и возможность снятия/установки колёс.' },
    informationCheckedAt: '28.07.2026',
    branches: [{ id: 'main', address: { ru: 'Предварительно: Смоленск, проспект Гагарина, 46А' }, phone: '+79107825372', schedule: { ru: 'Пн–Сб 10:30–19:00; воскресенье — выходной. Уточнить.' } }],
    contacts: [{ type: 'phone', value: '+79107825372' }],
    products: ['tires'],
    features: ['motorcycle-tire-service', 'balancing', 'by-appointment'],
    services: [{ ru: 'мотошиномонтаж — заявлен' }, { ru: 'балансировка — уточнить' }],
    tags: ['шиномонтаж', 'резина', 'ford реаниматор', 'гагарина', 'ипподром'],
    searchKeywords: [{ ru: 'поменять резину юг смоленска' }, { ru: 'мотошиномонтаж смоленск' }],
  }),
  place({
    id: 'gymkhana-smolensk-area',
    slug: 'gymkhana-smolensk-area',
    name: { ru: 'Площадка «Мотоджимхана Смоленск»' },
    categoryId: 'places-training-areas',
    shortDescription: { ru: 'Большая асфальтовая площадка с историей тренировок мотоджимханы.' },
    fullDescription: { ru: 'Место подтверждено картами и MG67, но текущая возможность въезда ограничена.\n\nНа подъезде/въезде установлен дорожный знак. Самовольный въезд может привести к штрафу. Перед поездкой обязательно уточнить доступ у MG67; не рекомендовать площадку как свободную.' },
    coverImage: '/assets/bot/smolensk_training.jpg',
    image: '/assets/bot/smolensk_training.jpg',
    coordinates: [31.958536, 54.728919],
    mapUrl: 'https://yandex.ru/maps/?pt=31.958536,54.728919&z=15&l=map',
    verificationStatus: 'pending',
    verificationNote: { ru: 'Доступ нужно уточнять заранее. Самостоятельный въезд не рекомендуется.' },
    informationCheckedAt: '28.07.2026',
    branches: [{ id: 'main', address: { ru: 'Р-120 Юго-Западный обход, точный подъезд уточнять у MG67' }, phone: '+79516932782' }],
    contacts: [
      { type: 'phone', value: '+79516932782' },
      { type: 'website', value: 'gymkhana-cup.ru', url: 'https://gymkhana-cup.ru/' },
    ],
    features: ['training', 'closed-area', 'by-appointment'],
    services: [{ ru: 'большая асфальтовая площадка' }, { ru: 'организованный доступ — уточнять' }],
    tags: ['мотоджимхана', 'площадка', 'тренировка', 'упражнения', 'р-120'],
    searchKeywords: [{ ru: 'где тренируются райдеры' }, { ru: 'мотоджимхана смоленск' }, { ru: 'площадка для тренировки' }],
  }),
  place({
    id: 'mg67-training-area',
    slug: 'mg67-training-area',
    name: { ru: 'Тренировочная площадка MG67' },
    categoryId: 'places-training-areas',
    shortDescription: { ru: 'Площадка MG67 для практических занятий и тренировок.' },
    fullDescription: { ru: 'Площадка используется MG67 для практических занятий. Она не является общественной парковкой или свободным мотодромом: формат посещения, время и допуск нужно согласовывать заранее.' },
    coverImage: '/assets/bot/dev_training.jpg',
    image: '/assets/bot/dev_training.jpg',
    coordinates: [32.19155, 54.724458],
    mapUrl: 'https://yandex.ru/maps/?pt=32.19155,54.724458&z=15&l=map',
    verificationStatus: 'verified_mg67',
    informationCheckedAt: '28.07.2026',
    branches: [{ id: 'main', address: { ru: 'Смоленский муниципальный округ, Р-120, Северо-Восточный обход Смоленска, 26-й километр' }, phone: '+79516932782' }],
    contacts: [
      { type: 'phone', value: '+79516932782' },
      { type: 'website', value: 'mg67.ru', url: 'https://mg67.ru/' },
    ],
    features: ['training', 'category-a', 'defensive-riding', 'city-riding', 'by-appointment'],
    services: [{ ru: 'практические занятия MG67' }, { ru: 'контраварийная подготовка' }],
    tags: ['mg67', 'тренировка', 'площадка', 'категория а', 'контраварийка', 'городская подготовка'],
    searchKeywords: [{ ru: 'где тренироваться' }, { ru: 'упм' }, { ru: 'инструктор' }],
    mg67Comment: { ru: 'Главная рекомендованная точка обучения в карточках навыков.' },
    featured: true,
  }),
  place({
    id: 'gleb-simdyankin-mg67',
    slug: 'gleb-simdyankin-mg67',
    name: { ru: 'Глеб Симдянкин · MG67 Moto Guide' },
    categoryId: 'places-schools-instructors',
    shortDescription: { ru: 'Основатель MG67, инструктор и организатор мотоджимханы в Смоленске.' },
    fullDescription: { ru: 'Глеб Симдянкин — мотоциклист, инструктор и основатель MG67. Направления: категория А через партнёрскую автошколу, контраварийная подготовка, городская подготовка, индивидуальные занятия и мототуры.\n\nПодход: пошаговое обучение, объяснение причин каждого действия, работа с безопасностью, уверенностью и реальными задачами ученика.' },
    coverImage: '/assets/bot/theory_a.jpg',
    image: '/assets/bot/theory_a.jpg',
    coordinates: [32.19155, 54.724458],
    mapUrl: 'https://yandex.ru/maps/?pt=32.19155,54.724458&z=15&l=map',
    verificationStatus: 'verified_mg67',
    informationCheckedAt: '28.07.2026',
    branches: [{ id: 'main', address: { ru: 'Р-120 Северо-Восточный обход Смоленска, 26-й километр' }, phone: '+79516932782' }],
    contacts: [
      { type: 'phone', value: '+79516932782' },
      { type: 'website', value: 'mg67.ru', url: 'https://mg67.ru/' },
    ],
    features: ['instructor', 'category-a', 'defensive-riding', 'city-riding', 'training'],
    services: [{ ru: 'индивидуальные занятия' }, { ru: 'городская подготовка' }, { ru: 'мототуры' }],
    tags: ['глеб симдянкин', 'mg67', 'инструктор', 'мотошкола', 'категория а', 'мотоджимхана'],
    searchKeywords: [{ ru: 'инструктор смоленск' }, { ru: 'обучение на мотоцикле' }, { ru: 'категория а' }],
    mg67Comment: { ru: 'Официальная карточка MG67 без рекламных обещаний и лишнего пафоса.' },
  }),
  place({
    id: 'maxim-airport-category-a',
    slug: 'maxim-airport-category-a',
    name: { ru: 'Максим · инструктор категории А' },
    categoryId: 'places-schools-instructors',
    shortDescription: { ru: 'Инструктор по подготовке на категорию А в автошколе «Аэропорт».' },
    fullDescription: { ru: 'Карточка инструктора категории А в автошколе «Аэропорт». Перед публикацией нужно подтвердить фамилию, фото, опыт и личный контакт.\n\nПока карточка помогает показать архитектуру раздела без неподтверждённых обещаний.' },
    coverImage: '/assets/bot/theory_a.jpg',
    image: '/assets/bot/theory_a.jpg',
    coordinates: [32.0455, 54.779],
    mapUrl: 'https://yandex.ru/maps/?pt=32.0455,54.779&z=16&l=map',
    verificationStatus: 'pending',
    verificationNote: { ru: 'Нужно подтвердить фамилию, фото, опыт и личный контакт.' },
    informationCheckedAt: '28.07.2026',
    branches: [{ id: 'school', title: { ru: 'Автошкола «Аэропорт»' }, address: { ru: 'Смоленск, проспект Гагарина, 2' }, phone: '+74812560900' }],
    contacts: [
      { type: 'phone', label: { ru: 'Автошкола «Аэропорт»' }, value: '+74812560900' },
      { type: 'website', value: 'as-airport.ru', url: 'https://as-airport.ru/' },
    ],
    features: ['instructor', 'category-a', 'training'],
    services: [{ ru: 'категория А' }, { ru: 'практические занятия' }],
    tags: ['максим', 'инструктор', 'категория а', 'автошкола аэропорт', 'гагарина'],
    searchKeywords: [{ ru: 'категория а смоленск' }, { ru: 'инструктор категория а' }],
  }),
];

export function getPlaceIdsForCategory(categoryId: string) {
  return places.filter((place) => place.categoryId === categoryId).map((place) => place.id);
}

export function findPlaceById(id: string | undefined) {
  if (!id) return undefined;
  return places.find((place) => place.id === id);
}

export function getPlacePrimaryBranch(place: PlaceItem) {
  return place.branches[0];
}

export function getPlaceChips(place: PlaceItem) {
  return [...(place.products ?? []), ...(place.services?.map((service) => service.ru) ?? []), ...(place.features ?? [])];
}
