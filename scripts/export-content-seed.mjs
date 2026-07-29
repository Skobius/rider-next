import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';
import ts from 'typescript';

const root = process.cwd();

const tempDir = resolve(root, '.tmp-seed-data');
const dataFiles = ['places.ts', 'routes.ts', 'events.ts', 'guides.ts', 'skills.ts', 'categories.ts'];

async function prepareTempModules() {
  await rm(tempDir, { recursive: true, force: true });
  await mkdir(tempDir, { recursive: true });

  for (const file of dataFiles) {
    const absolutePath = resolve(root, 'src/data', file);
    const source = await readFile(absolutePath, 'utf8');
    const js = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.ES2022,
        target: ts.ScriptTarget.ES2022,
        verbatimModuleSyntax: false,
      },
    }).outputText.replace(/from '(\.\/[^']+)'/g, "from '$1.mjs'");
    await writeFile(resolve(tempDir, file.replace(/\.ts$/, '.mjs')), js, 'utf8');
  }
}

async function importTs(relativePath) {
  const file = basename(relativePath).replace(/\.ts$/, '.mjs');
  const absolutePath = resolve(tempDir, file);
  return import(`file:///${absolutePath.replaceAll('\\', '/')}`);
}

async function importTsOld(relativePath) {
  const absolutePath = resolve(root, relativePath);
  const source = await readFile(absolutePath, 'utf8');
  const js = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
      verbatimModuleSyntax: false,
    },
  }).outputText;
  const encoded = Buffer.from(js).toString('base64');
  return import(`data:text/javascript;base64,${encoded}`);
}

function sqlString(value) {
  if (value === null || value === undefined) return 'null';
  return `'${String(value).replaceAll("'", "''")}'`;
}

function sqlJson(value) {
  return `${sqlString(JSON.stringify(value ?? {}))}::jsonb`;
}

function sqlArray(value) {
  if (!Array.isArray(value) || !value.length) return 'null';
  return `array[${value.map((item) => Number(item)).join(', ')}]::double precision[]`;
}

function sqlTextArray(values) {
  if (!Array.isArray(values) || !values.length) return `'{}'`;
  return `array[${values.map(sqlString).join(', ')}]`;
}

function upsertCategory(category) {
  return `insert into public.categories (id, slug, section_id, title, description, icon, status)
values (${sqlString(category.id)}, ${sqlString(category.slug)}, ${sqlString(category.sectionId)}, ${sqlJson(category.title)}, ${sqlJson(category.description)}, ${sqlString(category.icon)}, ${sqlString(category.status === 'ready' ? 'published' : 'draft')})
on conflict (id) do update
set slug = excluded.slug,
    section_id = excluded.section_id,
    title = excluded.title,
    description = excluded.description,
    icon = excluded.icon,
    status = excluded.status;`;
}

function upsertPlace(place) {
  return `insert into public.places (id, slug, region_id, category_id, status, name, short_description, full_description, cover_image, image, coordinates, coordinates_status, branches, contacts, services, products, features, tags, verification_status, information_checked_at, map_visibility, map_url, mg67_comment, source_static_id)
values (${sqlString(place.id)}, ${sqlString(place.slug)}, ${sqlString(place.regionId)}, ${sqlString(place.categoryId)}, 'published', ${sqlJson(place.name)}, ${sqlJson(place.shortDescription)}, ${sqlJson(place.fullDescription)}, ${sqlString(place.coverImage)}, ${sqlString(place.image)}, ${sqlArray(place.coordinates)}, ${sqlString(place.coordinates ? 'confirmed' : 'unconfirmed')}, ${sqlJson(place.branches)}, ${sqlJson(place.contacts)}, ${sqlJson(place.services)}, ${sqlJson(place.products)}, ${sqlJson(place.features)}, ${sqlTextArray(place.tags)}, ${sqlString(place.verificationStatus)}, ${sqlString(place.informationCheckedAt)}, ${place.mapVisibility === false ? 'false' : 'true'}, ${sqlString(place.mapUrl)}, ${sqlJson(place.mg67Comment)}, ${sqlString(place.id)})
on conflict (id) do update
set slug = excluded.slug,
    region_id = excluded.region_id,
    category_id = excluded.category_id,
    status = excluded.status,
    name = excluded.name,
    short_description = excluded.short_description,
    full_description = excluded.full_description,
    cover_image = excluded.cover_image,
    image = excluded.image,
    coordinates = excluded.coordinates,
    coordinates_status = excluded.coordinates_status,
    branches = excluded.branches,
    contacts = excluded.contacts,
    services = excluded.services,
    products = excluded.products,
    features = excluded.features,
    tags = excluded.tags,
    verification_status = excluded.verification_status,
    information_checked_at = excluded.information_checked_at,
    map_visibility = excluded.map_visibility,
    map_url = excluded.map_url,
    mg67_comment = excluded.mg67_comment,
    source_static_id = excluded.source_static_id;`;
}

function upsertRoute(route) {
  return `insert into public.routes (id, slug, region_id, category_id, status, title, description, image, coordinates, route_coordinates, map_url, meta, details, tags, source_static_id)
values (${sqlString(route.id)}, ${sqlString(route.id)}, ${sqlString(route.regionId)}, ${sqlString(route.categoryId)}, 'published', ${sqlJson(route.title)}, ${sqlJson(route.description)}, ${sqlString(route.image)}, ${sqlArray(route.coordinates)}, ${sqlJson(route.routeCoordinates)}, ${sqlString(route.mapUrl)}, ${sqlJson(route.meta)}, ${sqlJson(route.details)}, ${sqlTextArray(route.tags)}, ${sqlString(route.id)})
on conflict (id) do update
set slug = excluded.slug,
    region_id = excluded.region_id,
    category_id = excluded.category_id,
    status = excluded.status,
    title = excluded.title,
    description = excluded.description,
    image = excluded.image,
    coordinates = excluded.coordinates,
    route_coordinates = excluded.route_coordinates,
    map_url = excluded.map_url,
    meta = excluded.meta,
    details = excluded.details,
    tags = excluded.tags,
    source_static_id = excluded.source_static_id;`;
}

function upsertEvent(event) {
  return `insert into public.events (id, slug, region_id, category_id, status, title, description, image, coordinates, map_url, exact_date, meta, details, tags, source_static_id)
values (${sqlString(event.id)}, ${sqlString(event.id)}, ${sqlString(event.regionId)}, ${sqlString(event.categoryId)}, 'published', ${sqlJson(event.title)}, ${sqlJson(event.description)}, ${sqlString(event.image)}, ${sqlArray(event.coordinates)}, ${sqlString(event.mapUrl)}, ${event.exactDate ? sqlString(event.exactDate) : 'null'}, ${sqlJson(event.meta)}, ${sqlJson(event.details)}, ${sqlTextArray(event.tags)}, ${sqlString(event.id)})
on conflict (id) do update
set slug = excluded.slug,
    region_id = excluded.region_id,
    category_id = excluded.category_id,
    status = excluded.status,
    title = excluded.title,
    description = excluded.description,
    image = excluded.image,
    coordinates = excluded.coordinates,
    map_url = excluded.map_url,
    exact_date = excluded.exact_date,
    meta = excluded.meta,
    details = excluded.details,
    tags = excluded.tags,
    source_static_id = excluded.source_static_id;`;
}

function upsertGuide(guide) {
  return `insert into public.guides (id, slug, section_id, category_id, status, title, card_title, short_description, image, content, search_keywords, tags, source_static_id)
values (${sqlString(guide.id)}, ${sqlString(guide.slug)}, ${sqlString(guide.sectionId)}, ${sqlString(guide.categoryId)}, ${sqlString(guide.status === 'published' ? 'published' : 'draft')}, ${sqlJson(guide.title)}, ${sqlJson(guide.cardTitle)}, ${sqlJson(guide.shortDescription)}, ${sqlString(guide.image)}, ${sqlJson({ lead: guide.lead, keyPoints: guide.keyPoints, sections: guide.sections, checklist: guide.checklist, disclaimer: guide.disclaimer, reviewedAt: guide.reviewedAt, ctas: guide.ctas })}, ${sqlJson(guide.searchKeywords ?? [])}, ${sqlTextArray([])}, ${sqlString(guide.id)})
on conflict (id) do update
set slug = excluded.slug,
    section_id = excluded.section_id,
    category_id = excluded.category_id,
    status = excluded.status,
    title = excluded.title,
    card_title = excluded.card_title,
    short_description = excluded.short_description,
    image = excluded.image,
    content = excluded.content,
    search_keywords = excluded.search_keywords,
    tags = excluded.tags,
    source_static_id = excluded.source_static_id;`;
}

function upsertExercise(skill) {
  return `insert into public.exercises (id, slug, section_id, status, title, description, image, content, tags, source_static_id)
values (${sqlString(skill.id)}, ${sqlString(skill.id)}, 'skills', 'published', ${sqlJson(skill.title)}, ${sqlJson(skill.description)}, ${sqlString(skill.image)}, ${sqlJson({ categoryId: skill.categoryId, badge: skill.badge, purpose: skill.purpose, main: skill.main, practice: skill.practice, criterion: skill.criterion, safety: skill.safety, related: skill.related, source: skill.source })}, ${sqlTextArray([])}, ${sqlString(skill.id)})
on conflict (id) do update
set slug = excluded.slug,
    section_id = excluded.section_id,
    status = excluded.status,
    title = excluded.title,
    description = excluded.description,
    image = excluded.image,
    content = excluded.content,
    tags = excluded.tags,
    source_static_id = excluded.source_static_id;`;
}

await prepareTempModules();

const [{ places }, { routes }, { events }, { guides }, { skills }, { appCategories }] = await Promise.all([
  importTs('src/data/places.ts'),
  importTs('src/data/routes.ts'),
  importTs('src/data/events.ts'),
  importTs('src/data/guides.ts'),
  importTs('src/data/skills.ts'),
  importTs('src/data/categories.ts'),
]);

const categoryMap = new Map();
for (const category of appCategories) {
  categoryMap.set(category.id, {
    id: category.id,
    slug: category.slug,
    sectionId: category.sectionId,
    title: category.title,
    description: category.description,
    icon: category.icon,
    entityType: category.entityType,
    status: category.status === 'ready' ? 'ready' : 'draft',
  });
}
for (const place of places) {
  if (!categoryMap.has(place.categoryId)) categoryMap.set(place.categoryId, {
    id: place.categoryId,
    slug: place.categoryId,
    sectionId: 'places',
    title: { ru: place.categoryId },
    description: { ru: 'Импортировано из текущей базы MotoHub.' },
    icon: 'map-pin',
    image: place.coverImage ?? place.image ?? null,
    entityType: 'place',
    status: 'ready',
  });
}
for (const route of routes) {
  if (!categoryMap.has(route.categoryId)) categoryMap.set(route.categoryId, {
    id: route.categoryId,
    slug: route.categoryId,
    sectionId: 'routes',
    title: { ru: route.categoryId },
    description: { ru: 'Импортировано из текущей базы MotoHub.' },
    icon: 'route',
    image: route.image ?? null,
    entityType: 'route',
    status: 'ready',
  });
}
for (const event of events) {
  if (!categoryMap.has(event.categoryId)) categoryMap.set(event.categoryId, {
    id: event.categoryId,
    slug: event.categoryId,
    sectionId: 'events',
    title: { ru: event.categoryId },
    description: { ru: 'Импортировано из текущей базы MotoHub.' },
    icon: 'calendar',
    image: event.image ?? null,
    entityType: 'event',
    status: 'ready',
  });
}

const staticOutput = [
  '-- Generated by scripts/export-content-seed.mjs. Do not edit manually.',
  `-- places: ${places.length}, routes: ${routes.length}, events: ${events.length}, guides: ${guides.length}, exercises: ${skills.length}, categories: ${categoryMap.size}`,
  ...[...categoryMap.values()].map(upsertCategory),
  ...places.map(upsertPlace),
  ...routes.map(upsertRoute),
  ...events.map(upsertEvent),
  ...guides.map(upsertGuide),
  ...skills.map(upsertExercise),
  '',
].join('\n\n');

const baseSeed = `insert into public.regions (id, slug, title, status, map_center, map_zoom)
values
  ('smolensk-oblast', 'smolensk-oblast', '{"ru":"Смоленск и область","en":"Smolensk region"}'::jsonb, 'published', array[32.0453, 54.7826]::double precision[], 11)
on conflict (id) do update
set slug = excluded.slug,
    title = excluded.title,
    status = excluded.status,
    map_center = excluded.map_center,
    map_zoom = excluded.map_zoom;

insert into public.roles (code, title) values
  ('user', 'User'),
  ('moderator', 'Moderator'),
  ('admin', 'Admin'),
  ('superadmin', 'Superadmin')
on conflict (code) do nothing;
`;

const staticTarget = resolve(root, 'supabase/seed.static.sql');
const seedTarget = resolve(root, 'supabase/seed.sql');
await mkdir(dirname(staticTarget), { recursive: true });
await writeFile(staticTarget, staticOutput, 'utf8');
await writeFile(seedTarget, `${baseSeed}\n\n${staticOutput}`, 'utf8');
await rm(tempDir, { recursive: true, force: true });
console.log(`Wrote ${staticTarget}`);
console.log(`Wrote ${seedTarget}`);
