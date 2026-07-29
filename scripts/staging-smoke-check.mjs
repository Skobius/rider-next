import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

async function readEnvFile(path) {
  try {
    const text = await readFile(path, 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
    }
  } catch {
    // Optional file.
  }
}

await readEnvFile('.env.staging.local');
await readEnvFile('.env.staging');

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error('staging smoke-check requires VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY');
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

async function visibleCount(table, minimum) {
  const { count, error } = await supabase.from(table).select('id', { count: 'exact', head: true });
  if (error) throw new Error(`${table} public count failed: ${error.message}`);
  if ((count ?? 0) < minimum) throw new Error(`${table} count is too low: ${count ?? 0}, expected at least ${minimum}`);
  return count ?? 0;
}

const results = {
  regions: await visibleCount('regions', 1),
  categories: await visibleCount('categories', 7),
  places: await visibleCount('places', 10),
  routes: await visibleCount('routes', 2),
  events: await visibleCount('events', 2),
  guides: await visibleCount('guides', 10),
  exercises: await visibleCount('exercises', 5),
};

for (const table of ['places', 'routes', 'events', 'guides', 'exercises', 'categories', 'regions']) {
  const { data, error } = await supabase.from(table).select('id').eq('status', 'draft').limit(1);
  if (error) throw new Error(`${table} draft visibility check failed: ${error.message}`);
  if ((data ?? []).length > 0) throw new Error(`${table} exposes draft rows through public API`);
}

const { data: publishedObjects, error: publishedMediaError } = await supabase.storage.from('published-media').list('', { limit: 1 });
if (publishedMediaError) throw new Error(`published-media bucket is not readable as expected: ${publishedMediaError.message}`);

const { data: privateObjects, error: privateMediaError } = await supabase.storage.from('submission-media').list('', { limit: 1 });
if (!privateMediaError && (privateObjects ?? []).length > 0) {
  throw new Error('submission-media unexpectedly exposes files publicly');
}

console.log(`staging smoke checks passed: ${JSON.stringify(results)}`);
