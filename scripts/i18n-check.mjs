import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/shared/i18n/translations.ts', import.meta.url), 'utf8');

function extractLocaleBlock(locale) {
  const startToken = `  ${locale}: {`;
  const start = source.indexOf(startToken);
  assert.notEqual(start, -1, `Missing locale ${locale}`);

  let depth = 0;
  let end = -1;

  for (let index = start + startToken.length - 1; index < source.length; index += 1) {
    const char = source[index];
    if (char === '{') depth += 1;
    if (char === '}') depth -= 1;
    if (depth === 0) {
      end = index + 1;
      break;
    }
  }

  assert.notEqual(end, -1, `Locale ${locale} block is not closed`);
  return source.slice(start + `  ${locale}: `.length, end);
}

function extractKeys(block) {
  return [...block.matchAll(/^\s{4,}([a-zA-Z][a-zA-Z0-9]*):/gm)].map((match) => match[1]);
}

function extractEmptyStrings(block, locale) {
  return [...block.matchAll(/^\s{4,}([a-zA-Z][a-zA-Z0-9]*):\s*''/gm)].map((match) => `${locale}.${match[1]}`);
}

const ruBlock = extractLocaleBlock('ru');
const enBlock = extractLocaleBlock('en');
const ruKeys = new Set(extractKeys(ruBlock));
const enKeys = new Set(extractKeys(enBlock));

const missingInEn = [...ruKeys].filter((key) => !enKeys.has(key));
const missingInRu = [...enKeys].filter((key) => !ruKeys.has(key));
const emptyStrings = [...extractEmptyStrings(ruBlock, 'ru'), ...extractEmptyStrings(enBlock, 'en')];

assert.deepEqual(missingInEn, [], `Missing English translation keys: ${missingInEn.join(', ')}`);
assert.deepEqual(missingInRu, [], `Missing Russian translation keys: ${missingInRu.join(', ')}`);
assert.deepEqual(emptyStrings, [], `Empty translation values: ${emptyStrings.join(', ')}`);

console.log('i18n checks passed');
