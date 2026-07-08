import {
  Battery,
  Bike,
  FileText,
  Gauge,
  MapPin,
  ShieldCheck,
  Shirt,
  Snowflake,
  Wrench,
} from 'lucide-react';

export const journeyStages = [
  {
    id: 'category-a',
    title: 'Категория А',
    description: 'Как подойти к обучению спокойно и что делать сразу после экзамена.',
    sections: ['Где учиться', 'Как проходит обучение', 'Что после экзамена', 'Частые ошибки'],
    icon: ShieldCheck,
  },
  {
    id: 'first-bike',
    title: 'Первый мотоцикл',
    description: 'Как выбрать байк, который помогает учиться, а не добавляет тревоги.',
    sections: ['Как выбрать', 'Что купить', 'Типичные ошибки', 'Полезные статьи', 'Видео', 'Частые вопросы'],
    icon: Bike,
  },
  {
    id: 'gear',
    title: 'Экипировка',
    description: 'Что купить в первую очередь и как не потратить бюджет на лишнее.',
    sections: ['Шлем', 'Перчатки', 'Куртка и защита', 'Обувь', 'Где искать'],
    icon: Shirt,
  },
  {
    id: 'first-ride',
    title: 'Первый выезд',
    description: 'Короткий знакомый маршрут, спокойный темп и понятная цель.',
    sections: ['Маршрут', 'Проверка перед выездом', 'Ошибки новичков', 'После поездки'],
    icon: MapPin,
  },
  {
    id: 'maintenance',
    title: 'Обслуживание',
    description: 'Минимум, который должен понимать владелец мотоцикла.',
    sections: ['Масло', 'Цепь', 'Давление', 'Резина', 'Зимнее хранение'],
    icon: Wrench,
  },
  {
    id: 'skills',
    title: 'Навыки',
    description: 'База уверенной езды: взгляд, торможение, медленная езда и разворот.',
    sections: ['Взгляд', 'Торможение', 'Медленная езда', 'Разворот', 'Контраварийка'],
    icon: Gauge,
  },
  {
    id: 'city',
    title: 'Город',
    description: 'Как меньше нервничать в потоке и раньше читать ситуации.',
    sections: ['Дистанция', 'Позиция', 'Перекрёстки', 'Слепые зоны', 'Разбор ситуаций'],
    icon: MapPin,
  },
  {
    id: 'first-trip',
    title: 'Первое путешествие',
    description: 'Как подготовиться к короткой поездке за город без перегруза.',
    sections: ['Маршрут', 'Вещи', 'Проверка мотоцикла', 'Остановки', 'Погода'],
    icon: MapPin,
  },
  {
    id: 'winter',
    title: 'Подготовка к зиме',
    description: 'Что сделать в конце сезона, чтобы весной не начинать с проблем.',
    sections: ['Хранение', 'Аккумулятор', 'Цепь', 'Топливо', 'План на весну'],
    icon: Snowflake,
  },
];

export const motorcycleTopics = [
  {
    id: 'oil',
    title: 'Масло',
    description: 'Когда проверять, что записывать и почему важно не забывать.',
    status: 'Проверить уровень',
    icon: Wrench,
  },
  {
    id: 'chain',
    title: 'Цепь',
    description: 'Смазка, натяжение, чистота и признаки износа.',
    status: 'После дождя или 500-700 км',
    icon: Wrench,
  },
  {
    id: 'pressure',
    title: 'Давление',
    description: 'Быстрая проверка, которая влияет на управляемость и безопасность.',
    status: 'Раз в 1-2 недели',
    icon: Gauge,
  },
  {
    id: 'tires',
    title: 'Резина',
    description: 'Износ, возраст, повреждения и подготовка к поездкам.',
    status: 'Перед дальними поездками',
    icon: ShieldCheck,
  },
  {
    id: 'battery',
    title: 'Аккумулятор',
    description: 'Заряд, хранение, зимовка и первые признаки проблем.',
    status: 'Перед зимой',
    icon: Battery,
  },
  {
    id: 'documents',
    title: 'Документы',
    description: 'Полис, регистрация, права, сервисные записи и важные даты.',
    status: 'Держать под рукой',
    icon: FileText,
  },
];

export function findJourneyStage(stageId: string | undefined) {
  return journeyStages.find((stage) => stage.id === stageId);
}

export function findMotorcycleTopic(topicId: string | undefined) {
  return motorcycleTopics.find((topic) => topic.id === topicId);
}
