import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';
import ts from 'typescript';

const root = process.cwd();

const tempDir = resolve(root, '.tmp-seed-data');
const dataFiles = ['places.ts', 'routes.ts', 'events.ts', 'guides.ts', 'skills.ts', 'categories.ts', 'riderTasks.ts', 'serviceDefinitions.ts'];

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

function upsertServiceDefinition(service) {
  return `insert into public.service_definitions (id, slug, title, description, category, tags, status)
values (${sqlString(service.id)}, ${sqlString(service.slug)}, ${sqlJson(service.title)}, ${sqlJson(service.description)}, ${sqlString(service.category)}, ${sqlTextArray(service.tags)}, ${sqlString(service.status)})
on conflict (id) do update
set slug = excluded.slug,
    title = excluded.title,
    description = excluded.description,
    category = excluded.category,
    tags = excluded.tags,
    status = excluded.status;`;
}

function upsertRiderTask(task) {
  return `insert into public.rider_tasks (id, slug, title, short_title, short_description, full_description, icon, cover_image, status, is_featured, featured_priority, region_scope, region_id, quick_answer, urgency_level, urgency_text, self_check, prepare_before_contact, safety_warning, search_aliases, tags, cta, source_static_id, published_at)
values (${sqlString(task.id)}, ${sqlString(task.slug)}, ${sqlJson(task.title)}, ${sqlJson(task.shortTitle)}, ${sqlJson(task.shortDescription)}, ${sqlJson(task.fullDescription)}, ${sqlString(task.icon)}, ${sqlString(task.coverImage)}, ${sqlString(task.status === 'published' ? 'published' : task.status)}, ${task.isFeatured ? 'true' : 'false'}, ${Number(task.featuredPriority ?? 100)}, ${sqlString(task.regionScope)}, ${sqlString(task.regionId)}, ${sqlJson(task.quickAnswer)}, ${sqlString(task.urgency?.level ?? 'low')}, ${sqlJson(task.urgency?.text)}, ${sqlJson(task.selfCheck)}, ${sqlJson(task.prepareBeforeContact)}, ${sqlJson(task.safetyWarning)}, ${sqlJson(task.searchAliases)}, ${sqlTextArray(task.tags)}, ${sqlJson(task.cta)}, ${sqlString(task.id)}, ${task.publishedAt ? sqlString(`${task.publishedAt}T00:00:00Z`) : 'null'})
on conflict (id) do update
set slug = excluded.slug,
    title = excluded.title,
    short_title = excluded.short_title,
    short_description = excluded.short_description,
    full_description = excluded.full_description,
    icon = excluded.icon,
    cover_image = excluded.cover_image,
    status = excluded.status,
    is_featured = excluded.is_featured,
    featured_priority = excluded.featured_priority,
    region_scope = excluded.region_scope,
    region_id = excluded.region_id,
    quick_answer = excluded.quick_answer,
    urgency_level = excluded.urgency_level,
    urgency_text = excluded.urgency_text,
    self_check = excluded.self_check,
    prepare_before_contact = excluded.prepare_before_contact,
    safety_warning = excluded.safety_warning,
    search_aliases = excluded.search_aliases,
    tags = excluded.tags,
    cta = excluded.cta,
    source_static_id = excluded.source_static_id,
    published_at = excluded.published_at;`;
}

function upsertTaskLink(taskId, entityType, entityId, relationType = 'related', sortOrder = 0) {
  return `insert into public.rider_task_links (task_id, entity_type, entity_id, relation_type, sort_order)
values (${sqlString(taskId)}, ${sqlString(entityType)}, ${sqlString(entityId)}, ${sqlString(relationType)}, ${Number(sortOrder)})
on conflict (task_id, entity_type, entity_id, relation_type) do update
set sort_order = excluded.sort_order;`;
}

function placeServiceIds(place) {
  const ids = new Set();
  const values = [...(place.products ?? []), ...(place.features ?? [])];
  values.forEach((value) => {
    if (['service', 'maintenance', 'diagnostics'].includes(value)) ids.add(value);
    if (['tires', 'motorcycle-tire-service', 'balancing'].includes(value)) ids.add(value);
    if (['training', 'instructor', 'defensive-riding', 'city-riding'].includes(value)) ids.add(value);
  });
  if (place.categoryId === 'places-tire-services') ['motorcycle-tire-service', 'balancing', 'tires'].forEach((id) => ids.add(id));
  if (place.categoryId === 'places-services') ['service', 'maintenance', 'diagnostics'].forEach((id) => ids.add(id));
  if (place.categoryId === 'places-training-areas') ids.add('training');
  if (place.categoryId === 'places-schools-instructors') ['training', 'instructor', 'city-riding'].forEach((id) => ids.add(id));
  return [...ids];
}

function upsertPlaceService(place, serviceId) {
  const availability = place.verificationStatus === 'verified_mg67' || place.verificationStatus === 'confirmed' ? 'unknown' : 'unknown';
  return `insert into public.place_service_definitions (place_id, service_definition_id, availability, confirmation_status, confirmed_at, notes)
values (${sqlString(place.id)}, ${sqlString(serviceId)}, ${sqlString(availability)}, ${sqlString('unknown')}, null, ${sqlJson({ source: 'static_content', needsConfirmation: true })})
on conflict (place_id, service_definition_id) do update
set availability = excluded.availability,
    confirmation_status = excluded.confirmation_status,
    notes = excluded.notes;`;
}

function upsertPlaceSchedule(place) {
  return (place.branches ?? [])
    .filter((branch) => branch.schedule)
    .map((branch) => `insert into public.place_schedules (place_id, branch_id, schedule_text, structured_schedule, source, status, confirmed_at)
values (${sqlString(place.id)}, ${sqlString(branch.id)}, ${sqlJson(branch.schedule)}, ${sqlJson({ raw: branch.schedule })}, 'import', 'published', null)
on conflict do nothing;`);
}

function upsertFreshnessPolicy(policy) {
  return `insert into public.freshness_policies (id, entity_type, category_id, service_definition_id, region_id, recheck_days, stale_days, title, status)
values (${sqlString(policy.id)}, ${sqlString(policy.entityType)}, ${sqlString(policy.categoryId)}, ${sqlString(policy.serviceDefinitionId)}, ${sqlString(policy.regionId)}, ${Number(policy.recheckDays)}, ${Number(policy.staleDays)}, ${sqlJson(policy.title)}, 'published')
on conflict (id) do update
set entity_type = excluded.entity_type,
    category_id = excluded.category_id,
    service_definition_id = excluded.service_definition_id,
    region_id = excluded.region_id,
    recheck_days = excluded.recheck_days,
    stale_days = excluded.stale_days,
    title = excluded.title,
    status = excluded.status;`;
}

await prepareTempModules();

const [{ places }, { routes }, { events }, { guides }, { skills }, { appCategories }, { riderTasks }, { serviceDefinitions }] = await Promise.all([
  importTs('src/data/places.ts'),
  importTs('src/data/routes.ts'),
  importTs('src/data/events.ts'),
  importTs('src/data/guides.ts'),
  importTs('src/data/skills.ts'),
  importTs('src/data/categories.ts'),
  importTs('src/data/riderTasks.ts'),
  importTs('src/data/serviceDefinitions.ts'),
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
  `-- places: ${places.length}, routes: ${routes.length}, events: ${events.length}, guides: ${guides.length}, exercises: ${skills.length}, categories: ${categoryMap.size}, rider_tasks: ${riderTasks.length}, service_definitions: ${serviceDefinitions.length}`,
  ...[...categoryMap.values()].map(upsertCategory),
  ...serviceDefinitions.map(upsertServiceDefinition),
  ...places.map(upsertPlace),
  ...places.flatMap((place) => placeServiceIds(place).map((serviceId) => upsertPlaceService(place, serviceId))),
  ...places.flatMap(upsertPlaceSchedule),
  ...routes.map(upsertRoute),
  ...events.map(upsertEvent),
  ...guides.map(upsertGuide),
  ...skills.map(upsertExercise),
  ...riderTasks.map(upsertRiderTask),
  ...riderTasks.flatMap((task) => [
    ...task.relatedGuideIds.map((id, index) => upsertTaskLink(task.id, 'guide', id, 'related', index)),
    ...task.relatedSkillIds.map((id, index) => upsertTaskLink(task.id, 'exercise', id, 'related', index)),
    ...task.relatedPlaceCategoryIds.map((id, index) => upsertTaskLink(task.id, 'place_category', id, 'related', index)),
    ...task.relatedServiceDefinitionIds.map((id, index) => upsertTaskLink(task.id, 'service_definition', id, 'required', index)),
    ...(task.recommendedPlaceIds ?? []).map((id, index) => upsertTaskLink(task.id, 'place', id, 'recommended', index)),
    ...(task.relatedRouteIds ?? []).map((id, index) => upsertTaskLink(task.id, 'route', id, 'related', index)),
    ...(task.relatedEventIds ?? []).map((id, index) => upsertTaskLink(task.id, 'event', id, 'related', index)),
  ]),
  ...[
    { id: 'places-default', entityType: 'place', categoryId: null, serviceDefinitionId: null, regionId: null, recheckDays: 90, staleDays: 180, title: { ru: 'Обычная проверка места', en: 'Default place recheck' } },
    { id: 'tire-services', entityType: 'place', categoryId: 'places-tire-services', serviceDefinitionId: 'motorcycle-tire-service', regionId: null, recheckDays: 45, staleDays: 90, title: { ru: 'Проверка мотошиномонтажей', en: 'Motorcycle tire service recheck' } },
    { id: 'training-places', entityType: 'place', categoryId: 'places-training-areas', serviceDefinitionId: 'training', regionId: null, recheckDays: 60, staleDays: 120, title: { ru: 'Проверка тренировочных мест', en: 'Training place recheck' } },
  ].map(upsertFreshnessPolicy),
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
