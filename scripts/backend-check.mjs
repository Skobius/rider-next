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
    // Optional in CI; values can come from process.env.
  }
}

await readEnvFile('.env.local');

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.log('backend checks skipped: Supabase env is not configured');
  process.exit(0);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

async function count(table) {
  const { count, error } = await supabase.from(table).select('id', { count: 'exact', head: true });
  if (error) throw new Error(`${table} count failed: ${error.message}`);
  return count ?? 0;
}

const [placesCount, routesCount, eventsCount, guidesCount, exercisesCount, categoriesCount, regionsCount] = await Promise.all([
  count('places'),
  count('routes'),
  count('events'),
  count('guides'),
  count('exercises'),
  count('categories'),
  count('regions'),
]);

if (regionsCount < 1) throw new Error('regions seed is empty');
if (placesCount < 10) throw new Error(`places seed is incomplete: ${placesCount}`);
if (routesCount < 2) throw new Error(`routes seed is incomplete: ${routesCount}`);
if (eventsCount < 2) throw new Error(`events seed is incomplete: ${eventsCount}`);
if (guidesCount < 10) throw new Error(`guides seed is incomplete: ${guidesCount}`);
if (exercisesCount < 5) throw new Error(`exercises seed is incomplete: ${exercisesCount}`);
if (categoriesCount < 7) throw new Error(`published categories seed is incomplete: ${categoriesCount}`);

const { error: favoriteError } = await supabase
  .from('favorites')
  .insert({ user_id: crypto.randomUUID(), entity_type: 'place', entity_id: 'rolling-moto-shop-smolensk' });

if (!favoriteError) throw new Error('anon unexpectedly inserted favorite');

const { error: bootstrapError } = await supabase.rpc('bootstrap_superadmin', { target_email: 'nobody@example.com' });
if (!bootstrapError) throw new Error('anon unexpectedly executed bootstrap_superadmin');

console.log(`backend checks passed: ${placesCount} places, ${routesCount} routes, ${eventsCount} events, ${guidesCount} guides, ${exercisesCount} exercises, ${categoriesCount} categories`);
