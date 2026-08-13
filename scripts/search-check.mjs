import assert from 'node:assert/strict';

const items = [
  {
    id: 'tires',
    type: 'place',
    regionId: 'smolensk-oblast',
    categoryId: 'places-tire-services',
    title: 'Мотошиномонтаж',
    description: 'Замена резины, давление и балансировка.',
    services: ['шиномонтаж', 'резина'],
    tags: ['шиномонтаж', 'резина', 'tire'],
    searchKeywords: ['резина', 'шины', 'моторезина', 'поменять резину', 'переобуть мотоцикл'],
  },
  {
    id: 'rolling-moto-service-smolensk',
    type: 'place',
    regionId: 'smolensk-oblast',
    categoryId: 'places-services',
    title: 'Rolling Moto — сервис и обслуживание',
    description: 'Сервисная карточка Rolling Moto для обслуживания и консультаций по мотоциклу.',
    services: ['консультация по обслуживанию', 'запчасти и расходники'],
    tags: ['сервис', 'обслуживание', 'то', 'rolling moto', 'ремонт', 'масло'],
    searchKeywords: [],
  },
  {
    id: 'parts-shop',
    type: 'place',
    regionId: 'smolensk-oblast',
    categoryId: 'moto-shops',
    title: 'Магазин запчастей',
    description: 'Магазин экипировки, запчастей и расходников.',
    services: ['экипировка', 'запчасти'],
    tags: ['магазин', 'запчасти'],
    searchKeywords: [],
  },
  {
    id: 'tire-pressure',
    type: 'guide',
    regionId: 'smolensk-oblast',
    title: 'Как проверять давление в шинах?',
    description: 'Короткая карточка про давление.',
    services: [],
    tags: [],
    searchKeywords: ['резина', 'шины', 'давление в шинах'],
  },
  {
    id: 'gear-gloves',
    type: 'guide',
    regionId: 'smolensk-oblast',
    title: 'Как выбрать первые перчатки?',
    description: 'Экипировка для рук и хвата.',
    services: [],
    tags: ['экипировка', 'перчатки'],
    searchKeywords: ['перчатки', 'экипировка'],
  },
  {
    id: 'route-evening',
    type: 'route',
    regionId: 'smolensk-oblast',
    title: 'Вечерний маршрут',
    description: 'Куда поехать после работы.',
    services: [],
    tags: ['маршрут'],
    searchKeywords: ['маршрут', 'вечерний маршрут'],
  },
  {
    id: 'city-fear',
    type: 'guide',
    regionId: 'smolensk-oblast',
    title: 'Как не бояться города?',
    description: 'Поток, дистанция и спокойная езда.',
    services: [],
    tags: [],
    searchKeywords: ['город', 'страх города', 'поток'],
  },
  {
    id: 'other-region',
    type: 'place',
    regionId: 'moscow',
    title: 'Мотосервис Москва',
    description: 'Ремонт и обслуживание.',
    services: ['ремонт'],
    tags: ['сервис'],
    searchKeywords: ['сервис', 'ремонт'],
  },
];

const synonyms = {
  резина: ['шина', 'шины', 'колесо', 'колеса', 'шиномонтаж', 'моторезина'],
  шиномонтаж: ['резина', 'шины', 'колеса', 'переобуть'],
  мотошиномонтаж: ['шиномонтаж', 'резина', 'шины', 'колеса', 'переобуть'],
  экипировка: ['шлем', 'перчатки', 'куртка', 'боты', 'защита'],
  маршрут: ['поездка', 'куда', 'route'],
  тренировка: ['практика', 'упражнения', 'площадка'],
  страховка: ['осаго', 'документы'],
  сервис: ['мотосервис', 'мотосервисы', 'ремонт', 'то', 'масло', 'обслуживание'],
  мотосервис: ['мотосервисы', 'сервис', 'ремонт', 'то', 'обслуживание', 'диагностика'],
  мотосервисы: ['мотосервис', 'сервис', 'ремонт', 'то', 'обслуживание', 'диагностика'],
  магазин: ['мотомагазин', 'экипировка', 'запчасти', 'расходники'],
  мотомагазин: ['магазин', 'экипировка', 'запчасти', 'расходники'],
};

const categoryAliases = {
  'places-services': ['мотосервис', 'мотосервисы', 'сервис', 'ремонт', 'обслуживание', 'то', 'диагностика'],
  'places-tire-services': ['шиномонтаж', 'мотошиномонтаж', 'резина', 'шины', 'переобуть'],
  'moto-shops': ['магазин', 'мотомагазин', 'экипировка', 'запчасти', 'расходники'],
};

function normalize(value) {
  return value.toLowerCase().replaceAll('ё', 'е').replace(/[^\p{L}\p{N}\s-]/gu, ' ').replace(/\s+/g, ' ').trim();
}

function tokenize(value) {
  const normalized = normalize(value);
  return normalized ? normalized.split(' ').filter(Boolean) : [];
}

function expandTokens(tokens) {
  const expanded = new Set(tokens);
  tokens.forEach((token) => (synonyms[token] ?? []).forEach((word) => tokenize(word).forEach((part) => expanded.add(part))));
  return [...expanded];
}

function hasExactToken(text, token) {
  return tokenize(text).includes(token);
}

function hasPrefixToken(text, token) {
  return token.length >= 4 && tokenize(text).some((word) => word.length >= 4 && (word.startsWith(token) || token.startsWith(word)));
}

function scoreField(text, token, exact, prefix = 0) {
  if (hasExactToken(text, token)) return exact;
  if (prefix && hasPrefixToken(text, token)) return prefix;
  return 0;
}

function search(query, { regionId = 'smolensk-oblast', type = 'all' } = {}) {
  const queryTokens = tokenize(query);
  const tokens = expandTokens(queryTokens);
  return items
    .filter((item) => item.regionId === regionId)
    .filter((item) => type === 'all' || item.type === type)
    .map((item) => {
      const title = normalize(item.title);
      const description = normalize(item.description);
      const services = normalize(item.services.join(' '));
      const tags = normalize(item.tags.join(' '));
      const keywords = normalize([...item.searchKeywords, ...(categoryAliases[item.categoryId] ?? [])].join(' '));
      const score = tokens.reduce((sum, token) => (
        sum +
        scoreField(title, token, 30, 18) +
        scoreField(keywords, token, 28, 14) +
        scoreField(services, token, 20, 10) +
        scoreField(tags, token, 16, 8) +
        scoreField(description, token, 6, 0)
      ), 0);
      return { item, score };
    })
    .filter((result) => !queryTokens.length || result.score >= 18)
    .sort((a, b) => b.score - a.score)
    .map((result) => result.item.id);
}

assert.equal(normalize('Колёса'), 'колеса');
assert.deepEqual(search('резина'), ['tires', 'tire-pressure']);
assert.equal(search('резина').includes('route-evening'), false);
assert.equal(search('резина').includes('gear-gloves'), false);
assert.equal(search('резина').includes('city-fear'), false);
assert.equal(search('перчатки')[0], 'gear-gloves');
assert.equal(search('марш')[0], 'route-evening');
assert.equal(search('город')[0], 'city-fear');
assert.equal(search('мотосервис')[0], 'rolling-moto-service-smolensk');
assert.equal(search('мотосервисы').includes('rolling-moto-service-smolensk'), true);
assert.equal(search('шиномонтаж')[0], 'tires');
assert.equal(search('мотошиномонтаж')[0], 'tires');
assert.equal(search('магазин').includes('parts-shop'), true);
assert.equal(search('мотомагазин').includes('parts-shop'), true);
assert.equal(search('Rolling Moto').includes('rolling-moto-service-smolensk'), true);
assert.equal(search('сервис', { regionId: 'moscow' })[0], 'other-region');
assert.equal(search('сервис', { regionId: 'smolensk-oblast' }).includes('other-region'), false);
assert.equal(search('совсемнетакогозапроса').length, 0);
assert.equal(search('', { type: 'route' })[0], 'route-evening');

console.log('search checks passed');
