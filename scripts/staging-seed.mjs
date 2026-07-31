import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const dbUrl = process.env.SUPABASE_STAGING_DB_URL;
const seedFile = 'supabase/seed.sql';

if (!dbUrl) {
  throw new Error('Set SUPABASE_STAGING_DB_URL only for this command. Do not commit it.');
}

if (!existsSync(seedFile)) {
  throw new Error(`${seedFile} is missing. Run node scripts/export-content-seed.mjs if it needs regeneration.`);
}

function runPsql(args) {
  return execFileSync('psql', args, { stdio: 'pipe', encoding: 'utf8' });
}

runPsql([dbUrl, '-v', 'ON_ERROR_STOP=1', '-f', seedFile]);

const countsSql = `
select 'regions=' || count(*) from public.regions;
select 'categories=' || count(*) from public.categories;
select 'places=' || count(*) from public.places;
select 'routes=' || count(*) from public.routes;
select 'events=' || count(*) from public.events;
select 'guides=' || count(*) from public.guides;
select 'exercises=' || count(*) from public.exercises;
select 'rider_tasks=' || count(*) from public.rider_tasks;
select 'service_definitions=' || count(*) from public.service_definitions;
select 'task_links=' || count(*) from public.rider_task_links;
select 'place_services=' || count(*) from public.place_service_definitions;
`;

const output = runPsql([dbUrl, '-t', '-A', '-v', 'ON_ERROR_STOP=1', '-c', countsSql]);
console.log(`staging seed applied\n${output.trim()}`);
