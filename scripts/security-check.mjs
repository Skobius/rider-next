import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const sqlPath = 'supabase/tests/security.sql';
const containerName = process.env.SUPABASE_DB_CONTAINER ?? 'supabase_db_motohub-local';
const dbPassword = process.env.SUPABASE_LOCAL_DB_PASSWORD ?? 'postgres';

if (!existsSync(sqlPath)) throw new Error(`${sqlPath} is missing`);

function run(command, args, options = {}) {
  return execFileSync(command, args, { stdio: 'pipe', encoding: 'utf8', ...options });
}

try {
  run('docker', ['inspect', containerName]);
} catch {
  console.log('security checks skipped: local Supabase database container is not running or Docker is unavailable');
  process.exit(0);
}

run('docker', ['cp', sqlPath, `${containerName}:/tmp/motohub-security.sql`]);

const output = run('docker', [
  'exec',
  '-e',
  `PGPASSWORD=${dbPassword}`,
  containerName,
  'psql',
  '-U',
  'supabase_admin',
  '-d',
  'postgres',
  '-v',
  'ON_ERROR_STOP=1',
  '-f',
  '/tmp/motohub-security.sql',
]);

if (!output.includes('security checks passed')) {
  throw new Error('security checks did not report success');
}

console.log('security checks passed');
