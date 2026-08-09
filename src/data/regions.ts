export type RegionType =
  | 'republic'
  | 'krai'
  | 'oblast'
  | 'federal_city'
  | 'autonomous_oblast'
  | 'autonomous_okrug';

export interface Region {
  id: string;
  name: string;
  shortName?: string;
  type: RegionType;
  isAvailable: boolean;
  mapCenter?: [number, number];
  mapZoom?: number;
  contentStatus?: RegionContentStatus;
}

export type RegionContentStatus = 'not_started' | 'in_progress' | 'ready';

const regionContentStatusById: Partial<Record<string, RegionContentStatus>> = {
  'smolensk-oblast': 'ready',
};

export const defaultRegionId = 'smolensk-oblast';

export const regions: Region[] = [
  { id: 'adygea', name: 'Республика Адыгея', type: 'republic', isAvailable: false },
  { id: 'altai-republic', name: 'Республика Алтай', type: 'republic', isAvailable: false },
  { id: 'bashkortostan', name: 'Республика Башкортостан', type: 'republic', isAvailable: false },
  { id: 'buryatia', name: 'Республика Бурятия', type: 'republic', isAvailable: false },
  { id: 'dagestan', name: 'Республика Дагестан', type: 'republic', isAvailable: false },
  { id: 'donetsk', name: 'Донецкая Народная Республика', type: 'republic', isAvailable: false },
  { id: 'ingushetia', name: 'Республика Ингушетия', type: 'republic', isAvailable: false },
  { id: 'kabardino-balkaria', name: 'Кабардино-Балкарская Республика', type: 'republic', isAvailable: false },
  { id: 'kalmykia', name: 'Республика Калмыкия', type: 'republic', isAvailable: false },
  { id: 'karachay-cherkessia', name: 'Карачаево-Черкесская Республика', type: 'republic', isAvailable: false },
  { id: 'karelia', name: 'Республика Карелия', type: 'republic', isAvailable: false },
  { id: 'komi', name: 'Республика Коми', type: 'republic', isAvailable: false },
  { id: 'crimea', name: 'Республика Крым', type: 'republic', isAvailable: false },
  { id: 'luhansk', name: 'Луганская Народная Республика', type: 'republic', isAvailable: false },
  { id: 'mari-el', name: 'Республика Марий Эл', type: 'republic', isAvailable: false },
  { id: 'mordovia', name: 'Республика Мордовия', type: 'republic', isAvailable: false },
  { id: 'sakha', name: 'Республика Саха (Якутия)', type: 'republic', isAvailable: false },
  { id: 'north-ossetia', name: 'Республика Северная Осетия - Алания', type: 'republic', isAvailable: false },
  { id: 'tatarstan', name: 'Республика Татарстан', type: 'republic', isAvailable: false },
  { id: 'tyva', name: 'Республика Тыва', type: 'republic', isAvailable: false },
  { id: 'udmurtia', name: 'Удмуртская Республика', type: 'republic', isAvailable: false },
  { id: 'khakassia', name: 'Республика Хакасия', type: 'republic', isAvailable: false },
  { id: 'chechnya', name: 'Чеченская Республика', type: 'republic', isAvailable: false },
  { id: 'chuvashia', name: 'Чувашская Республика', type: 'republic', isAvailable: false },
  { id: 'altai-krai', name: 'Алтайский край', type: 'krai', isAvailable: false },
  { id: 'zabaykalsky-krai', name: 'Забайкальский край', type: 'krai', isAvailable: false },
  { id: 'kamchatka-krai', name: 'Камчатский край', type: 'krai', isAvailable: false },
  { id: 'krasnodar-krai', name: 'Краснодарский край', type: 'krai', isAvailable: false },
  { id: 'krasnoyarsk-krai', name: 'Красноярский край', type: 'krai', isAvailable: false },
  { id: 'perm-krai', name: 'Пермский край', type: 'krai', isAvailable: false },
  { id: 'primorsky-krai', name: 'Приморский край', type: 'krai', isAvailable: false },
  { id: 'stavropol-krai', name: 'Ставропольский край', type: 'krai', isAvailable: false },
  { id: 'khabarovsk-krai', name: 'Хабаровский край', type: 'krai', isAvailable: false },
  { id: 'amur-oblast', name: 'Амурская область', type: 'oblast', isAvailable: false },
  { id: 'arkhangelsk-oblast', name: 'Архангельская область', type: 'oblast', isAvailable: false },
  { id: 'astrakhan-oblast', name: 'Астраханская область', type: 'oblast', isAvailable: false },
  { id: 'belgorod-oblast', name: 'Белгородская область', type: 'oblast', isAvailable: false },
  { id: 'bryansk-oblast', name: 'Брянская область', type: 'oblast', isAvailable: false },
  { id: 'vladimir-oblast', name: 'Владимирская область', type: 'oblast', isAvailable: false },
  { id: 'volgograd-oblast', name: 'Волгоградская область', type: 'oblast', isAvailable: false },
  { id: 'vologda-oblast', name: 'Вологодская область', type: 'oblast', isAvailable: false },
  { id: 'voronezh-oblast', name: 'Воронежская область', type: 'oblast', isAvailable: false },
  { id: 'zaporozhye-oblast', name: 'Запорожская область', type: 'oblast', isAvailable: false },
  { id: 'ivanovo-oblast', name: 'Ивановская область', type: 'oblast', isAvailable: false },
  { id: 'irkutsk-oblast', name: 'Иркутская область', type: 'oblast', isAvailable: false },
  { id: 'kaliningrad-oblast', name: 'Калининградская область', type: 'oblast', isAvailable: false },
  { id: 'kaluga-oblast', name: 'Калужская область', type: 'oblast', isAvailable: false },
  { id: 'kemerovo-oblast', name: 'Кемеровская область', type: 'oblast', isAvailable: false },
  { id: 'kirov-oblast', name: 'Кировская область', type: 'oblast', isAvailable: false },
  { id: 'kostroma-oblast', name: 'Костромская область', type: 'oblast', isAvailable: false },
  { id: 'kurgan-oblast', name: 'Курганская область', type: 'oblast', isAvailable: false },
  { id: 'kursk-oblast', name: 'Курская область', type: 'oblast', isAvailable: false },
  { id: 'leningrad-oblast', name: 'Ленинградская область', type: 'oblast', isAvailable: false },
  { id: 'lipetsk-oblast', name: 'Липецкая область', type: 'oblast', isAvailable: false },
  { id: 'magadan-oblast', name: 'Магаданская область', type: 'oblast', isAvailable: false },
  { id: 'moscow-oblast', name: 'Московская область', type: 'oblast', isAvailable: false },
  { id: 'murmansk-oblast', name: 'Мурманская область', type: 'oblast', isAvailable: false },
  { id: 'nizhny-novgorod-oblast', name: 'Нижегородская область', type: 'oblast', isAvailable: false },
  { id: 'novgorod-oblast', name: 'Новгородская область', type: 'oblast', isAvailable: false },
  { id: 'novosibirsk-oblast', name: 'Новосибирская область', type: 'oblast', isAvailable: false },
  { id: 'omsk-oblast', name: 'Омская область', type: 'oblast', isAvailable: false },
  { id: 'orenburg-oblast', name: 'Оренбургская область', type: 'oblast', isAvailable: false },
  { id: 'oryol-oblast', name: 'Орловская область', type: 'oblast', isAvailable: false },
  { id: 'penza-oblast', name: 'Пензенская область', type: 'oblast', isAvailable: false },
  { id: 'pskov-oblast', name: 'Псковская область', type: 'oblast', isAvailable: false },
  { id: 'rostov-oblast', name: 'Ростовская область', type: 'oblast', isAvailable: false },
  { id: 'ryazan-oblast', name: 'Рязанская область', type: 'oblast', isAvailable: false },
  { id: 'samara-oblast', name: 'Самарская область', type: 'oblast', isAvailable: false },
  { id: 'saratov-oblast', name: 'Саратовская область', type: 'oblast', isAvailable: false },
  { id: 'sakhalin-oblast', name: 'Сахалинская область', type: 'oblast', isAvailable: false },
  { id: 'sverdlovsk-oblast', name: 'Свердловская область', type: 'oblast', isAvailable: false },
  { id: 'smolensk-oblast', name: 'Смоленская область', shortName: 'Смоленск и область', type: 'oblast', isAvailable: true, mapCenter: [32.0453, 54.7826], mapZoom: 11 },
  { id: 'tambov-oblast', name: 'Тамбовская область', type: 'oblast', isAvailable: false },
  { id: 'tver-oblast', name: 'Тверская область', type: 'oblast', isAvailable: false },
  { id: 'tomsk-oblast', name: 'Томская область', type: 'oblast', isAvailable: false },
  { id: 'tula-oblast', name: 'Тульская область', type: 'oblast', isAvailable: false },
  { id: 'tyumen-oblast', name: 'Тюменская область', type: 'oblast', isAvailable: false },
  { id: 'ulyanovsk-oblast', name: 'Ульяновская область', type: 'oblast', isAvailable: false },
  { id: 'kherson-oblast', name: 'Херсонская область', type: 'oblast', isAvailable: false },
  { id: 'chelyabinsk-oblast', name: 'Челябинская область', type: 'oblast', isAvailable: false },
  { id: 'yaroslavl-oblast', name: 'Ярославская область', type: 'oblast', isAvailable: false },
  { id: 'moscow', name: 'Москва', type: 'federal_city', isAvailable: false },
  { id: 'saint-petersburg', name: 'Санкт-Петербург', type: 'federal_city', isAvailable: false },
  { id: 'sevastopol', name: 'Севастополь', type: 'federal_city', isAvailable: false },
  { id: 'jewish-autonomous-oblast', name: 'Еврейская автономная область', type: 'autonomous_oblast', isAvailable: false },
  { id: 'nenets-autonomous-okrug', name: 'Ненецкий автономный округ', type: 'autonomous_okrug', isAvailable: false },
  { id: 'khanty-mansi-autonomous-okrug', name: 'Ханты-Мансийский автономный округ - Югра', type: 'autonomous_okrug', isAvailable: false },
  { id: 'chukotka-autonomous-okrug', name: 'Чукотский автономный округ', type: 'autonomous_okrug', isAvailable: false },
  { id: 'yamalo-nenets-autonomous-okrug', name: 'Ямало-Ненецкий автономный округ', type: 'autonomous_okrug', isAvailable: false },
];

export function getRegionById(id: string) {
  return regions.find((region) => region.id === id) ?? regions.find((region) => region.id === defaultRegionId)!;
}

export function getRegionLabel(id: string) {
  const region = getRegionById(id);
  return region.shortName ?? region.name;
}

export function getRegionContentStatus(id: string): RegionContentStatus {
  return regionContentStatusById[id] ?? getRegionById(id).contentStatus ?? 'not_started';
}

export function getRegionMapLocation(id: string) {
  const region = getRegionById(id);
  return {
    center: region.mapCenter,
    zoom: region.mapZoom ?? 10,
  };
}

export function getRegionContentStatusText(status: RegionContentStatus) {
  if (status === 'ready') return 'Регион наполнен';
  if (status === 'in_progress') return 'Регион находится в процессе наполнения';
  return 'Регион пока не наполнен';
}

export function getRegionContentNotice(status: RegionContentStatus) {
  if (status === 'in_progress') {
    return 'Мы уже собираем и проверяем информацию для этого региона. Сейчас доступна только часть материалов.';
  }

  if (status === 'not_started') {
    return 'Этот регион пока не наполнен. Сейчас в МотоГде подготовлена информация по Смоленской области. Материалы для других регионов будут добавляться постепенно.';
  }

  return '';
}
