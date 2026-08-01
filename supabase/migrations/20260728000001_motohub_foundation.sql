create extension if not exists pgcrypto;

create type public.account_status as enum ('active', 'blocked', 'deleted');
create type public.content_status as enum ('draft', 'published', 'archived');
create type public.role_scope_type as enum ('global', 'region');
create type public.organization_status as enum ('draft', 'active', 'archived');
create type public.membership_role as enum ('owner', 'editor');
create type public.membership_status as enum ('active', 'revoked');
create type public.submission_type as enum ('create_entity', 'update_entity', 'report_error', 'add_photo', 'claim_related_update');
create type public.submission_status as enum ('draft', 'submitted', 'in_review', 'changes_requested', 'approved', 'rejected', 'cancelled');
create type public.message_visibility as enum ('internal', 'applicant');
create type public.entity_type as enum ('place', 'route', 'event', 'guide', 'exercise', 'category', 'region', 'organization');
create type public.storage_asset_status as enum ('uploaded', 'submitted', 'approved', 'rejected', 'published', 'deleted');

create table public.regions (
  id text primary key,
  slug text not null unique,
  title jsonb not null,
  status public.content_status not null default 'published',
  map_center double precision[] null,
  map_zoom integer not null default 10,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id text primary key,
  slug text not null,
  section_id text not null,
  title jsonb not null,
  description jsonb null,
  icon text null,
  sort_order integer not null default 0,
  status public.content_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(section_id, slug)
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code in ('user', 'moderator', 'admin', 'superadmin')),
  title text not null,
  created_at timestamptz not null default now()
);

insert into public.roles (code, title) values
  ('user', 'User'),
  ('moderator', 'Moderator'),
  ('admin', 'Admin'),
  ('superadmin', 'Superadmin')
on conflict (code) do nothing;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text null,
  avatar_url text null,
  home_region_id text null references public.regions(id),
  account_status public.account_status not null default 'active',
  settings jsonb not null default '{}'::jsonb,
  privacy_accepted_at timestamptz null,
  terms_accepted_at timestamptz null,
  last_seen_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_role_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid not null references public.roles(id),
  scope_type public.role_scope_type not null default 'global',
  scope_id text null,
  assigned_by uuid null references auth.users(id),
  created_at timestamptz not null default now(),
  revoked_at timestamptz null,
  constraint role_scope_consistency check (
    (scope_type = 'global' and scope_id is null) or
    (scope_type = 'region' and scope_id is not null)
  )
);

create unique index user_role_active_unique on public.user_role_assignments (user_id, role_id, scope_type, coalesce(scope_id, 'global')) where revoked_at is null;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status public.organization_status not null default 'draft',
  region_id text null references public.regions(id),
  public_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  membership_role public.membership_role not null,
  status public.membership_status not null default 'active',
  granted_by uuid null references auth.users(id),
  created_at timestamptz not null default now(),
  revoked_at timestamptz null
);

create unique index organization_membership_active_unique on public.organization_memberships (organization_id, user_id, membership_role) where status = 'active';

create table public.places (
  id text primary key,
  slug text not null unique,
  region_id text not null references public.regions(id),
  category_id text not null references public.categories(id),
  organization_id uuid null references public.organizations(id),
  status public.content_status not null default 'draft',
  name jsonb not null,
  short_description jsonb not null,
  full_description jsonb null,
  cover_image text null,
  image text null,
  coordinates double precision[] null,
  coordinates_status text not null default 'unconfirmed',
  branches jsonb not null default '[]'::jsonb,
  contacts jsonb not null default '[]'::jsonb,
  services jsonb not null default '[]'::jsonb,
  products jsonb not null default '[]'::jsonb,
  features jsonb not null default '[]'::jsonb,
  tags text[] not null default '{}',
  verification_status text not null default 'pending',
  information_checked_at text null,
  map_visibility boolean not null default true,
  map_url text null,
  mg67_comment jsonb null,
  source_static_id text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.routes (
  id text primary key,
  slug text not null unique,
  region_id text not null references public.regions(id),
  category_id text null references public.categories(id),
  status public.content_status not null default 'draft',
  title jsonb not null,
  description jsonb not null,
  image text null,
  coordinates double precision[] null,
  route_coordinates jsonb not null default '[]'::jsonb,
  map_url text null,
  meta jsonb not null default '{}'::jsonb,
  details jsonb not null default '{}'::jsonb,
  tags text[] not null default '{}',
  source_static_id text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.events (
  id text primary key,
  slug text not null unique,
  region_id text not null references public.regions(id),
  category_id text null references public.categories(id),
  status public.content_status not null default 'draft',
  title jsonb not null,
  description jsonb not null,
  image text null,
  coordinates double precision[] null,
  map_url text null,
  exact_date date null,
  meta jsonb not null default '{}'::jsonb,
  details jsonb not null default '{}'::jsonb,
  tags text[] not null default '{}',
  source_static_id text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.guides (
  id text primary key,
  slug text not null unique,
  section_id text not null,
  category_id text null,
  status public.content_status not null default 'draft',
  title jsonb not null,
  card_title jsonb null,
  short_description jsonb not null,
  image text null,
  content jsonb not null default '{}'::jsonb,
  search_keywords jsonb not null default '[]'::jsonb,
  tags text[] not null default '{}',
  source_static_id text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.exercises (
  id text primary key,
  slug text not null unique,
  section_id text not null default 'skills',
  status public.content_status not null default 'draft',
  title jsonb not null,
  description jsonb not null,
  image text null,
  content jsonb not null default '{}'::jsonb,
  tags text[] not null default '{}',
  source_static_id text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type public.entity_type not null,
  entity_id text not null,
  created_at timestamptz not null default now(),
  unique(user_id, entity_type, entity_id)
);

create table public.content_versions (
  id uuid primary key default gen_random_uuid(),
  entity_type public.entity_type not null,
  entity_id text not null,
  version integer not null,
  data jsonb not null,
  created_by uuid null references auth.users(id),
  created_at timestamptz not null default now(),
  unique(entity_type, entity_id, version)
);

create table public.content_submissions (
  id uuid primary key default gen_random_uuid(),
  entity_type public.entity_type not null,
  entity_id text null,
  submission_type public.submission_type not null,
  region_id text not null references public.regions(id),
  author_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid null references public.organizations(id),
  proposed_data jsonb not null default '{}'::jsonb,
  original_data jsonb null,
  reason text null,
  status public.submission_status not null default 'draft',
  assigned_moderator_id uuid null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz null,
  reviewed_at timestamptz null,
  reviewed_by uuid null references auth.users(id),
  published_entity_id text null
);

create table public.moderation_messages (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.content_submissions(id) on delete cascade,
  author_id uuid not null references auth.users(id),
  message text not null,
  visibility public.message_visibility not null default 'applicant',
  created_at timestamptz not null default now()
);

create table public.ownership_claims (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid null references public.organizations(id),
  place_id text null,
  region_id text not null references public.regions(id),
  author_id uuid not null references auth.users(id) on delete cascade,
  evidence jsonb not null default '{}'::jsonb,
  status public.submission_status not null default 'draft',
  assigned_moderator_id uuid null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz null,
  reviewed_at timestamptz null,
  reviewed_by uuid null references auth.users(id),
  constraint claim_target_exists check (organization_id is not null or place_id is not null)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title jsonb not null,
  message jsonb not null,
  entity_type text null,
  entity_id text null,
  read_at timestamptz null,
  created_at timestamptz not null default now()
);

create table public.storage_assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  bucket text not null,
  object_path text not null,
  mime_type text not null,
  size_bytes integer not null,
  status public.storage_asset_status not null default 'uploaded',
  submission_id uuid null references public.content_submissions(id) on delete set null,
  published_entity_type public.entity_type null,
  published_entity_id text null,
  created_at timestamptz not null default now(),
  unique(bucket, object_path),
  constraint allowed_image_mime check (mime_type in ('image/jpeg', 'image/png', 'image/webp', 'image/avif'))
);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid null references auth.users(id),
  action text not null,
  target_type text not null,
  target_id text null,
  region_id text null references public.regions(id),
  before_data jsonb null,
  after_data jsonb null,
  metadata jsonb null,
  ip_hash text null,
  user_agent text null,
  created_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger organizations_touch before update on public.organizations for each row execute function public.touch_updated_at();
create trigger places_touch before update on public.places for each row execute function public.touch_updated_at();
create trigger routes_touch before update on public.routes for each row execute function public.touch_updated_at();
create trigger events_touch before update on public.events for each row execute function public.touch_updated_at();
create trigger guides_touch before update on public.guides for each row execute function public.touch_updated_at();
create trigger exercises_touch before update on public.exercises for each row execute function public.touch_updated_at();
create trigger content_submissions_touch before update on public.content_submissions for each row execute function public.touch_updated_at();
create trigger ownership_claims_touch before update on public.ownership_claims for each row execute function public.touch_updated_at();

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, privacy_accepted_at, terms_accepted_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    case when coalesce((new.raw_user_meta_data->>'privacy_accepted')::boolean, false) then now() else null end,
    case when coalesce((new.raw_user_meta_data->>'terms_accepted')::boolean, false) then now() else null end
  )
  on conflict (id) do nothing;

  insert into public.user_role_assignments (user_id, role_id, scope_type)
  select new.id, id, 'global'
  from public.roles
  where code = 'user'
  on conflict do nothing;

  return new;
end;
$$;

create trigger auth_create_profile
after insert on auth.users
for each row execute function public.create_profile_for_new_user();

create or replace function public.is_active_user(check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = check_user_id and p.account_status = 'active'
  );
$$;

create or replace function public.has_role(check_role_code text, check_region_scope text default null, check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_role_assignments ura
    join public.roles r on r.id = ura.role_id
    where ura.user_id = check_user_id
      and ura.revoked_at is null
      and r.code = check_role_code
      and public.is_active_user(check_user_id)
      and (
        ura.scope_type = 'global'
        or (check_region_scope is not null and ura.scope_type = 'region' and ura.scope_id = check_region_scope)
      )
  );
$$;

create or replace function public.is_superadmin(check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('superadmin', null, check_user_id);
$$;

create or replace function public.can_moderate_region(check_region_scope text, check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_superadmin(check_user_id)
    or public.has_role('admin', check_region_scope, check_user_id)
    or public.has_role('moderator', check_region_scope, check_user_id);
$$;

create or replace function public.can_admin_region(check_region_scope text, check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_superadmin(check_user_id)
    or public.has_role('admin', check_region_scope, check_user_id);
$$;

create or replace function public.is_organization_member(check_org_id uuid, allowed_roles public.membership_role[] default array['owner','editor']::public.membership_role[], check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_memberships om
    where om.organization_id = check_org_id
      and om.user_id = check_user_id
      and om.status = 'active'
      and om.membership_role = any(allowed_roles)
  );
$$;

create or replace function public.write_audit(
  action text,
  target_type text,
  target_id text default null,
  region_id text default null,
  before_data jsonb default null,
  after_data jsonb default null,
  metadata jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  audit_id uuid;
begin
  insert into public.audit_log (actor_user_id, action, target_type, target_id, region_id, before_data, after_data, metadata)
  values (auth.uid(), action, target_type, target_id, region_id, before_data, after_data, metadata)
  returning id into audit_id;
  return audit_id;
end;
$$;

create or replace function public.bootstrap_superadmin(target_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_user uuid;
  role_superadmin uuid;
  existing_count integer;
begin
  select count(*) into existing_count
  from public.user_role_assignments ura
  join public.roles r on r.id = ura.role_id
  where r.code = 'superadmin' and ura.revoked_at is null;

  if existing_count > 0 then
    raise exception 'superadmin already exists';
  end if;

  select id into target_user from auth.users where email = target_email limit 1;
  if target_user is null then
    raise exception 'target user not found';
  end if;

  select id into role_superadmin from public.roles where code = 'superadmin';
  insert into public.user_role_assignments (user_id, role_id, scope_type)
  values (target_user, role_superadmin, 'global');

  perform public.write_audit('bootstrap_superadmin', 'user', target_user::text, null, null, jsonb_build_object('email', target_email), null);
end;
$$;

create or replace function public.submit_submission(submission_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_active_user() then
    raise exception 'forbidden';
  end if;

  update public.content_submissions
  set status = 'submitted', submitted_at = now()
  where id = submission_id
    and author_id = auth.uid()
    and status in ('draft', 'changes_requested');

  if not found then
    raise exception 'submission not available';
  end if;

  perform public.write_audit('submit_submission', 'content_submission', submission_id::text);
end;
$$;

create or replace function public.set_submission_status(submission_id uuid, next_status public.submission_status, public_message text default null, internal_message text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  submission_row public.content_submissions%rowtype;
begin
  select * into submission_row from public.content_submissions where id = submission_id for update;
  if submission_row.id is null then
    raise exception 'submission not found';
  end if;
  if not public.can_moderate_region(submission_row.region_id) then
    raise exception 'forbidden';
  end if;
  if next_status not in ('in_review', 'changes_requested', 'approved', 'rejected', 'cancelled') then
    raise exception 'invalid status';
  end if;

  update public.content_submissions
  set status = next_status,
      assigned_moderator_id = coalesce(assigned_moderator_id, auth.uid()),
      reviewed_at = case when next_status in ('approved', 'rejected') then now() else reviewed_at end,
      reviewed_by = case when next_status in ('approved', 'rejected') then auth.uid() else reviewed_by end
  where id = submission_id;

  if public_message is not null then
    insert into public.moderation_messages (submission_id, author_id, message, visibility)
    values (submission_id, auth.uid(), public_message, 'applicant');
  end if;
  if internal_message is not null then
    insert into public.moderation_messages (submission_id, author_id, message, visibility)
    values (submission_id, auth.uid(), internal_message, 'internal');
  end if;

  insert into public.notifications (user_id, type, title, message, entity_type, entity_id)
  values (
    submission_row.author_id,
    'submission_status',
    jsonb_build_object('ru', 'Статус заявки изменён'),
    jsonb_build_object('ru', 'Новый статус: ' || next_status::text),
    'content_submission',
    submission_id::text
  );

perform public.write_audit('set_submission_status', 'content_submission', submission_id::text, submission_row.region_id, to_jsonb(submission_row), jsonb_build_object('status', next_status));
end;
$$;

create or replace function public.submit_ownership_claim(claim_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_active_user() then
    raise exception 'forbidden';
  end if;

  update public.ownership_claims
  set status = 'submitted', submitted_at = now()
  where id = claim_id
    and author_id = auth.uid()
    and status in ('draft', 'changes_requested');

  if not found then
    raise exception 'claim not available';
  end if;

  perform public.write_audit('submit_ownership_claim', 'organization', claim_id::text);
end;
$$;

create or replace function public.set_ownership_claim_status(claim_id uuid, next_status public.submission_status, public_message text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  claim_row public.ownership_claims%rowtype;
  org_id uuid;
  org_name text;
begin
  select * into claim_row from public.ownership_claims where id = claim_id for update;
  if claim_row.id is null then
    raise exception 'claim not found';
  end if;
  if not public.can_moderate_region(claim_row.region_id) then
    raise exception 'forbidden';
  end if;
  if next_status not in ('in_review', 'changes_requested', 'approved', 'rejected', 'cancelled', 'submitted') then
    raise exception 'invalid status';
  end if;

  update public.ownership_claims
  set status = next_status,
      assigned_moderator_id = coalesce(assigned_moderator_id, auth.uid()),
      reviewed_at = case when next_status in ('approved', 'rejected') then now() else reviewed_at end,
      reviewed_by = case when next_status in ('approved', 'rejected') then auth.uid() else reviewed_by end
  where id = claim_id;

  if next_status = 'approved' then
    org_name := coalesce(claim_row.evidence->>'organization_name', claim_row.evidence->>'place_name', claim_row.place_id, 'Организация');
    org_id := claim_row.organization_id;

    if org_id is null then
      insert into public.organizations (name, slug, status, region_id, public_data)
      values (
        org_name,
        'claim-' || claim_id::text,
        'active',
        claim_row.region_id,
        jsonb_build_object('source', 'ownership_claim', 'place_id', claim_row.place_id)
      )
      returning id into org_id;
    end if;

    insert into public.organization_memberships (organization_id, user_id, membership_role, status, granted_by)
    values (org_id, claim_row.author_id, 'owner', 'active', auth.uid())
    on conflict do nothing;
  end if;

  insert into public.notifications (user_id, type, title, message, entity_type, entity_id)
  values (
    claim_row.author_id,
    'ownership_claim_status',
    jsonb_build_object('ru', 'Статус заявки на владение изменён'),
    jsonb_build_object('ru', coalesce(public_message, 'Новый статус: ' || next_status::text)),
    'organization',
    claim_id::text
  );

  perform public.write_audit('set_ownership_claim_status', 'organization', claim_id::text, claim_row.region_id, to_jsonb(claim_row), jsonb_build_object('status', next_status));
end;
$$;

create or replace function public.update_content_summary(content_table text, content_id text, next_title jsonb, next_description jsonb, next_status public.content_status)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  region_scope text;
  before_row jsonb;
  title_column text;
  description_column text;
  next_version integer;
begin
  if content_table not in ('places', 'routes', 'events', 'guides', 'exercises', 'categories', 'regions') then
    raise exception 'unsupported content table';
  end if;

  title_column := case when content_table = 'places' then 'name' else 'title' end;
  description_column := case when content_table in ('places', 'guides') then 'short_description' else 'description' end;

  execute format('select %s, to_jsonb(t) from public.%I t where id = $1', case when content_table in ('guides', 'exercises', 'categories', 'regions') then '''global''' else 'region_id' end, content_table)
  into region_scope, before_row
  using content_id;

  if region_scope is null then
    raise exception 'content not found';
  end if;
  if content_table in ('guides', 'exercises', 'categories', 'regions') and not public.is_superadmin() then
    raise exception 'forbidden';
  end if;
  if content_table not in ('guides', 'exercises', 'categories', 'regions') and not public.can_admin_region(region_scope) then
    raise exception 'forbidden';
  end if;

  select coalesce(max(version), 0) + 1
  into next_version
  from public.content_versions
  where entity_type = case content_table
      when 'places' then 'place'::public.entity_type
      when 'routes' then 'route'::public.entity_type
      when 'events' then 'event'::public.entity_type
      when 'guides' then 'guide'::public.entity_type
      when 'exercises' then 'exercise'::public.entity_type
      when 'categories' then 'category'::public.entity_type
      else 'region'::public.entity_type
    end
    and entity_id = content_id;

  insert into public.content_versions (entity_type, entity_id, version, data, created_by)
  values (
    case content_table
      when 'places' then 'place'::public.entity_type
      when 'routes' then 'route'::public.entity_type
      when 'events' then 'event'::public.entity_type
      when 'guides' then 'guide'::public.entity_type
      when 'exercises' then 'exercise'::public.entity_type
      when 'categories' then 'category'::public.entity_type
      else 'region'::public.entity_type
    end,
    content_id,
    next_version,
    before_row,
    auth.uid()
  );

  if content_table = 'regions' then
    execute 'update public.regions set title = $1, status = $2 where id = $3'
    using next_title, next_status, content_id;
  else
    execute format('update public.%I set %I = $1, %I = $2, status = $3 where id = $4', content_table, title_column, description_column)
    using next_title, next_description, next_status, content_id;
  end if;

  perform public.write_audit('update_content_summary', (case content_table
      when 'places' then 'place'::public.entity_type
      when 'routes' then 'route'::public.entity_type
      when 'events' then 'event'::public.entity_type
      when 'guides' then 'guide'::public.entity_type
      when 'exercises' then 'exercise'::public.entity_type
      when 'categories' then 'category'::public.entity_type
      else 'region'::public.entity_type
    end)::text, content_id, nullif(region_scope, 'global'), before_row, jsonb_build_object('title', next_title, 'description', next_description, 'status', next_status));
end;
$$;

create or replace function public.assign_role(target_user_id uuid, role_code text, scope_type public.role_scope_type default 'global', scope_id text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  role_target uuid;
  assignment_id uuid;
  target_status public.account_status;
begin
  if not public.is_superadmin() then
    raise exception 'forbidden';
  end if;

  select account_status into target_status from public.profiles where id = target_user_id;
  if target_status is null then
    raise exception 'target user not found';
  end if;
  if target_status <> 'active' then
    raise exception 'target user is not active';
  end if;

  select id into role_target from public.roles where code = role_code;
  if role_target is null then
    raise exception 'unknown role';
  end if;
  if role_code = 'superadmin' and (scope_type <> 'global' or scope_id is not null) then
    raise exception 'superadmin must be global';
  end if;
  if scope_type = 'region' and not exists (select 1 from public.regions where id = scope_id) then
    raise exception 'unknown region scope';
  end if;

  insert into public.user_role_assignments (user_id, role_id, scope_type, scope_id, assigned_by)
  values (target_user_id, role_target, scope_type, scope_id, auth.uid())
  returning id into assignment_id;
  perform public.write_audit('assign_role', 'user_role_assignment', assignment_id::text, scope_id, null, jsonb_build_object('user_id', target_user_id, 'role', role_code, 'scope_type', scope_type, 'scope_id', scope_id));
  return assignment_id;
end;
$$;

create or replace function public.revoke_role(assignment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  old_row jsonb;
  old_role text;
  old_user uuid;
  active_superadmins integer;
begin
  if not public.is_superadmin() then
    raise exception 'forbidden';
  end if;

  select to_jsonb(ura.*), r.code, ura.user_id
  into old_row, old_role, old_user
  from public.user_role_assignments ura
  join public.roles r on r.id = ura.role_id
  where ura.id = assignment_id and ura.revoked_at is null;

  if old_row is null then
    raise exception 'role assignment not found';
  end if;
  if old_role = 'superadmin' then
    select count(*)
    into active_superadmins
    from public.user_role_assignments ura
    join public.roles r on r.id = ura.role_id
    join public.profiles p on p.id = ura.user_id
    where r.code = 'superadmin'
      and ura.revoked_at is null
      and p.account_status = 'active'
      and ura.user_id <> old_user;

    if active_superadmins < 1 then
      raise exception 'cannot revoke last active superadmin';
    end if;
  end if;

  update public.user_role_assignments set revoked_at = now() where id = assignment_id and revoked_at is null;
  perform public.write_audit('revoke_role', 'user_role_assignment', assignment_id::text, null, old_row, null);
end;
$$;

create or replace function public.block_user(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_superadmin() then
    raise exception 'forbidden';
  end if;
  if public.is_superadmin(target_user_id) then
    if (
      select count(*)
      from public.user_role_assignments ura
      join public.roles r on r.id = ura.role_id
      join public.profiles p on p.id = ura.user_id
      where r.code = 'superadmin'
        and ura.revoked_at is null
        and p.account_status = 'active'
        and ura.user_id <> target_user_id
    ) < 1 then
      raise exception 'cannot block last active superadmin';
    end if;
  end if;

  update public.profiles set account_status = 'blocked' where id = target_user_id;
  if not found then
    raise exception 'target user not found';
  end if;
  perform public.write_audit('block_user', 'user', target_user_id::text);
end;
$$;

create or replace function public.unblock_user(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_superadmin() then
    raise exception 'forbidden';
  end if;
  update public.profiles set account_status = 'active' where id = target_user_id and account_status = 'blocked';
  if not found then
    raise exception 'blocked target user not found';
  end if;
  perform public.write_audit('unblock_user', 'user', target_user_id::text);
end;
$$;

alter table public.regions enable row level security;
alter table public.categories enable row level security;
alter table public.roles enable row level security;
alter table public.profiles enable row level security;
alter table public.user_role_assignments enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.places enable row level security;
alter table public.routes enable row level security;
alter table public.events enable row level security;
alter table public.guides enable row level security;
alter table public.exercises enable row level security;
alter table public.favorites enable row level security;
alter table public.content_versions enable row level security;
alter table public.content_submissions enable row level security;
alter table public.moderation_messages enable row level security;
alter table public.ownership_claims enable row level security;
alter table public.notifications enable row level security;
alter table public.storage_assets enable row level security;
alter table public.audit_log enable row level security;

create policy "public can read published regions" on public.regions for select using (status = 'published');
create policy "admin can manage regions" on public.regions for all using (public.is_superadmin()) with check (public.is_superadmin());

create policy "public can read published categories" on public.categories for select using (status = 'published');
create policy "admin can manage categories" on public.categories for all using (public.is_superadmin()) with check (public.is_superadmin());

create policy "authenticated can read roles" on public.roles for select using (auth.uid() is not null);

create policy "users can read own profile" on public.profiles for select using (id = auth.uid() or public.is_superadmin());
create policy "users can update own safe profile fields" on public.profiles for update using (id = auth.uid() and public.is_active_user()) with check (id = auth.uid() and account_status = 'active');
create policy "superadmin can manage profiles" on public.profiles for all using (public.is_superadmin()) with check (public.is_superadmin());

create policy "users can read own role assignments" on public.user_role_assignments for select using (user_id = auth.uid() or public.is_superadmin());
create policy "superadmin can manage role assignments" on public.user_role_assignments for all using (public.is_superadmin()) with check (public.is_superadmin());

create policy "public can read active organizations" on public.organizations for select using (status = 'active' or public.is_superadmin() or public.is_organization_member(id));
create policy "admin can manage scoped organizations" on public.organizations for all using (public.can_admin_region(region_id)) with check (public.can_admin_region(region_id));

create policy "members can read own memberships" on public.organization_memberships for select using (user_id = auth.uid() or public.is_superadmin() or public.can_moderate_region((select o.region_id from public.organizations o where o.id = organization_id)));
create policy "superadmin can manage memberships" on public.organization_memberships for all using (public.is_superadmin()) with check (public.is_superadmin());

create policy "public can read published places" on public.places for select using (status = 'published');
create policy "admin can manage scoped places" on public.places for all using (public.can_admin_region(region_id)) with check (public.can_admin_region(region_id));
create policy "owners can read own organization places" on public.places for select using (organization_id is not null and public.is_organization_member(organization_id));

create policy "public can read published routes" on public.routes for select using (status = 'published');
create policy "admin can manage scoped routes" on public.routes for all using (public.can_admin_region(region_id)) with check (public.can_admin_region(region_id));

create policy "public can read published events" on public.events for select using (status = 'published');
create policy "admin can manage scoped events" on public.events for all using (public.can_admin_region(region_id)) with check (public.can_admin_region(region_id));

create policy "public can read published guides" on public.guides for select using (status = 'published');
create policy "superadmin can manage guides" on public.guides for all using (public.is_superadmin()) with check (public.is_superadmin());

create policy "public can read published exercises" on public.exercises for select using (status = 'published');
create policy "superadmin can manage exercises" on public.exercises for all using (public.is_superadmin()) with check (public.is_superadmin());

create policy "users manage own favorites" on public.favorites for all using (user_id = auth.uid() and public.is_active_user()) with check (user_id = auth.uid() and public.is_active_user());

create policy "admins read versions" on public.content_versions for select using (public.is_superadmin() or public.has_role('admin'));

create policy "authors read own submissions" on public.content_submissions for select using (author_id = auth.uid());
create policy "authors create own submissions" on public.content_submissions for insert with check (author_id = auth.uid() and public.is_active_user() and status = 'draft');
create policy "authors update own draft submissions" on public.content_submissions for update using (author_id = auth.uid() and status in ('draft', 'changes_requested')) with check (author_id = auth.uid() and status in ('draft', 'changes_requested'));
create policy "moderators read scoped submissions" on public.content_submissions for select using (public.can_moderate_region(region_id));

create policy "applicants read visible messages" on public.moderation_messages for select using (
  visibility = 'applicant' and exists (
    select 1 from public.content_submissions cs
    where cs.id = submission_id and (cs.author_id = auth.uid() or public.can_moderate_region(cs.region_id))
  )
);
create policy "moderators read internal messages" on public.moderation_messages for select using (
  exists (select 1 from public.content_submissions cs where cs.id = submission_id and public.can_moderate_region(cs.region_id))
);
create policy "participants create applicant messages" on public.moderation_messages for insert with check (
  author_id = auth.uid()
  and public.is_active_user()
  and visibility = 'applicant'
  and exists (
    select 1 from public.content_submissions cs
    where cs.id = submission_id and (cs.author_id = auth.uid() or public.can_moderate_region(cs.region_id))
  )
);

create policy "authors read own claims" on public.ownership_claims for select using (author_id = auth.uid());
create policy "authors create own claims" on public.ownership_claims for insert with check (author_id = auth.uid() and public.is_active_user() and status = 'draft');
create policy "authors update own draft claims" on public.ownership_claims for update using (author_id = auth.uid() and status in ('draft', 'changes_requested')) with check (author_id = auth.uid() and status in ('draft', 'changes_requested'));
create policy "moderators read scoped claims" on public.ownership_claims for select using (public.can_moderate_region(region_id));

create policy "users manage own notifications" on public.notifications for select using (user_id = auth.uid() and public.is_active_user());
create policy "users update own notifications" on public.notifications for update using (user_id = auth.uid() and public.is_active_user()) with check (user_id = auth.uid() and public.is_active_user());

create policy "users read own assets" on public.storage_assets for select using (owner_id = auth.uid() or public.is_superadmin());
create policy "users insert own assets" on public.storage_assets for insert with check (owner_id = auth.uid() and public.is_active_user());
create policy "moderators read scoped assets" on public.storage_assets for select using (
  submission_id is not null and exists (
    select 1 from public.content_submissions cs
    where cs.id = submission_id and public.can_moderate_region(cs.region_id)
  )
);

create policy "superadmin reads audit" on public.audit_log for select using (public.is_superadmin());
create policy "moderator reads scoped audit" on public.audit_log for select using (region_id is not null and public.can_moderate_region(region_id));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('submission-media', 'submission-media', false, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('published-media', 'published-media', true, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update
set allowed_mime_types = excluded.allowed_mime_types,
    file_size_limit = excluded.file_size_limit;

create policy "users upload own submission media" on storage.objects for insert with check (
  bucket_id = 'submission-media'
  and auth.uid() is not null
  and public.is_active_user()
  and position(auth.uid()::text in name) = 1
);

create policy "users read own submission media" on storage.objects for select using (
  bucket_id = 'submission-media'
  and auth.uid() is not null
  and position(auth.uid()::text in name) = 1
);

create policy "users delete own submission media" on storage.objects for delete using (
  bucket_id = 'submission-media'
  and auth.uid() is not null
  and public.is_active_user()
  and position(auth.uid()::text in name) = 1
);

create policy "public reads published media" on storage.objects for select using (bucket_id = 'published-media');
create policy "public reads avatars" on storage.objects for select using (bucket_id = 'avatars');
create policy "users manage own avatars" on storage.objects for all using (
  bucket_id = 'avatars'
  and auth.uid() is not null
  and public.is_active_user()
  and position(auth.uid()::text in name) = 1
) with check (
  bucket_id = 'avatars'
  and auth.uid() is not null
  and public.is_active_user()
  and position(auth.uid()::text in name) = 1
);

grant usage on schema public to anon, authenticated;

grant select on public.regions, public.categories, public.places, public.routes, public.events, public.guides, public.exercises, public.organizations to anon, authenticated;

grant select on public.roles, public.user_role_assignments, public.organization_memberships, public.audit_log to authenticated;

grant select on public.profiles to authenticated;
grant update (display_name, avatar_url, home_region_id, settings, privacy_accepted_at, terms_accepted_at, last_seen_at) on public.profiles to authenticated;

grant select, insert, update, delete on public.favorites to authenticated;
grant select, insert, update on public.content_submissions, public.ownership_claims, public.moderation_messages, public.notifications, public.storage_assets to authenticated;
grant select on public.content_versions to authenticated;

revoke execute on function public.bootstrap_superadmin(text) from public, anon, authenticated;
revoke execute on function public.create_profile_for_new_user() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;
revoke execute on function public.write_audit(text, text, text, text, jsonb, jsonb, jsonb) from public, anon, authenticated;

grant execute on function public.submit_submission(uuid) to authenticated;
grant execute on function public.submit_ownership_claim(uuid) to authenticated;
grant execute on function public.set_submission_status(uuid, public.submission_status, text, text) to authenticated;
grant execute on function public.set_ownership_claim_status(uuid, public.submission_status, text) to authenticated;
grant execute on function public.update_content_summary(text, text, jsonb, jsonb, public.content_status) to authenticated;
grant execute on function public.assign_role(uuid, text, public.role_scope_type, text) to authenticated;
grant execute on function public.revoke_role(uuid) to authenticated;
grant execute on function public.block_user(uuid) to authenticated;
grant execute on function public.unblock_user(uuid) to authenticated;
