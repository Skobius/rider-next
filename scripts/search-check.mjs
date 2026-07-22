import assert from 'node:assert/strict';

const items = [
  { id: 'tires', type: 'place', regionId: 'smolensk-oblast', title: 'Демо шиномонтаж для мото', description: 'резина давление балансировка', tags: ['шиномонтаж', 'резина', 'колеса', 'tire', 'pressure'] },
  { id: 'gear', type: 'place', regionId: 'smolensk-oblast', title: 'Демо магазин экипировки', description: 'шлем перчатки защита', tags: ['экипировка', 'helmet', 'gear'] },
  { id: 'route', type: 'route', regionId: 'smolensk-oblast', title: 'Тестовый маршрут', description: 'куда поехать сегодня', tags: ['маршрут', 'route', 'ride'] },
  { id: 'event', type: 'event', regionId: 'smolensk-oblast', title: 'Демо встреча мотоциклистов', description: 'вечером сегодня', tags: ['событие', 'event', 'tonight'] },
  { id: 'other-region', type: 'place', regionId: 'moscow', title: 'Демо сервис Москва', description: 'ремонт', tags: ['сервис'] },
];

const synonyms = {
  резина: ['шина', 'шины', 'колеса', 'колёса', 'давление', 'шиномонтаж', 'tires', 'tyres'],
  экипировка: ['шлем', 'перчатки', 'gear', 'helmet'],
  маршрут: ['поездка', 'куда', 'ride', 'route'],
  вечером: ['сегодня', 'событие', 'event', 'tonight'],
};

function normalize(value) {
  return value.toLowerCase().replaceAll('ё', 'е').replace(/[^\p{L}\p{N}\s-]/gu, ' ').replace(/\s+/g, ' ').trim();
}

function tokens(value) {
  const base = normalize(value).split(' ').filter(Boolean);
  return [...new Set(base.flatMap((token) => [token, ...(synonyms[token] ?? []).map(normalize)]))];
}

function search(query, { regionId = 'smolensk-oblast', type = 'all' } = {}) {
  const queryTokens = tokens(query);
  return items
    .filter((item) => item.regionId === regionId)
    .filter((item) => type === 'all' || item.type === type)
    .map((item) => {
      const title = normalize(item.title);
      const body = normalize(`${item.description} ${item.tags.join(' ')}`);
      const score = queryTokens.reduce((sum, token) => sum + (title.includes(token) ? 10 : 0) + (body.includes(token) ? 4 : 0), 0);
      return { item, score };
    })
    .filter((result) => !queryTokens.length || result.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((result) => result.item.id);
}

assert.equal(normalize('Колёса'), 'колеса');
assert.deepEqual(search('резина')[0], 'tires');
assert.deepEqual(search('колеса')[0], 'tires');
assert.deepEqual(search('helmet')[0], 'gear');
assert.deepEqual(search('марш')[0], 'route');
assert.deepEqual(search('вечером', { type: 'event' })[0], 'event');
assert.equal(search('сервис', { regionId: 'moscow' })[0], 'other-region');
assert.equal(search('сервис', { regionId: 'smolensk-oblast' }).includes('other-region'), false);
assert.equal(search('совсемнетакогозапроса').length, 0);
assert.equal(search('', { type: 'route' })[0], 'route');

console.log('search checks passed');
