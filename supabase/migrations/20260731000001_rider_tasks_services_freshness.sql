do $$
begin
  if not exists (select 1 from pg_type where typname = 'task_urgency_level') then
    create type public.task_urgency_level as enum ('low', 'medium', 'high');
  end if;
  if not exists (select 1 from pg_type where typname = 'task_region_scope') then
    create type public.task_region_scope as enum ('global', 'regional');
  end if;
  if not exists (select 1 from pg_type where typname = 'service_availability') then
    create type public.service_availability as enum ('available', 'unknown', 'unavailable');
  end if;
  if not exists (select 1 from pg_type where typname = 'verification_source') then
    create type public.verification_source as enum ('mg67', 'owner', 'moderator', 'user_report', 'import');
  end if;
  if not exists (select 1 from pg_type where typname = 'visit_report_status') then
    create type public.visit_report_status as enum ('submitted', 'accepted', 'rejected');
  end if;
end $$;

alter type public.entity_type add value if not exists 'rider_task';
alter type public.entity_type add value if not exists 'service_definition';
alter type public.entity_type add value if not exists 'verification_event';
alter type public.entity_type add value if not exists 'visit_report';

create table public.service_definitions (
  id text primary key,
  slug text not null unique,
  title jsonb not null,
  description jsonb null,
  category text not null default 'service',
  tags text[] not null default '{}',
  status public.content_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.rider_tasks (
  id text primary key,
  slug text not null unique,
  title jsonb not null,
  short_title jsonb not null,
  short_description jsonb not null,
  full_description jsonb null,
  icon text null,
  cover_image text null,
  status public.content_status not null default 'draft',
  is_featured boolean not null default false,
  featured_priority integer not null default 100,
  region_scope public.task_region_scope not null default 'global',
  region_id text null references public.regions(id),
  quick_answer jsonb not null,
  urgency_level public.task_urgency_level not null default 'low',
  urgency_text jsonb not null,
  self_check jsonb not null default '[]'::jsonb,
  prepare_before_contact jsonb not null default '[]'::jsonb,
  safety_warning jsonb null,
  search_aliases jsonb not null default '[]'::jsonb,
  tags text[] not null default '{}',
  cta jsonb not null default '{}'::jsonb,
  source_static_id text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz null,
  constraint rider_task_region_scope_check check (
    (region_scope = 'global' and region_id is null)
    or (region_scope = 'regional' and region_id is not null)
  )
);

create table public.rider_task_links (
  id uuid primary key default gen_random_uuid(),
  task_id text not null references public.rider_tasks(id) on delete cascade,
  entity_type text not null check (entity_type in ('guide', 'exercise', 'place_category', 'service_definition', 'place', 'route', 'event')),
  entity_id text not null,
  relation_type text not null default 'related' check (relation_type in ('related', 'recommended', 'required')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique(task_id, entity_type, entity_id, relation_type)
);

create table public.place_service_definitions (
  id uuid primary key default gen_random_uuid(),
  place_id text not null references public.places(id) on delete cascade,
  service_definition_id text not null references public.service_definitions(id),
  availability public.service_availability not null default 'unknown',
  confirmation_status text not null default 'unknown' check (confirmation_status in ('unknown', 'owner_confirmed', 'moderator_confirmed', 'user_reported')),
  confirmed_at timestamptz null,
  confirmed_by uuid null references auth.users(id),
  notes jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(place_id, service_definition_id)
);

create table public.place_schedules (
  id uuid primary key default gen_random_uuid(),
  place_id text not null references public.places(id) on delete cascade,
  branch_id text null,
  schedule_text jsonb not null,
  structured_schedule jsonb not null default '{}'::jsonb,
  source public.verification_source not null default 'import',
  status public.content_status not null default 'published',
  confirmed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.freshness_policies (
  id text primary key,
  entity_type text not null,
  category_id text null,
  service_definition_id text null references public.service_definitions(id),
  region_id text null references public.regions(id),
  recheck_days integer not null check (recheck_days > 0),
  stale_days integer not null check (stale_days >= recheck_days),
  title jsonb not null,
  status public.content_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.verification_events (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('place', 'place_service', 'schedule', 'rider_task')),
  entity_id text not null,
  place_id text null references public.places(id) on delete cascade,
  region_id text null references public.regions(id),
  source public.verification_source not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'needs_recheck', 'rejected')),
  details jsonb not null default '{}'::jsonb,
  created_by uuid null references auth.users(id),
  confirmed_at timestamptz not null default now(),
  expires_at timestamptz null,
  created_at timestamptz not null default now()
);

create table public.visit_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  place_id text not null references public.places(id) on delete cascade,
  region_id text not null references public.regions(id),
  status public.visit_report_status not null default 'submitted',
  visited_at timestamptz null,
  is_open boolean null,
  services_confirmed text[] not null default '{}',
  comment text null check (comment is null or char_length(comment) <= 1000),
  photo_count integer not null default 0 check (photo_count between 0 and 3),
  reviewed_by uuid null references auth.users(id),
  reviewed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.owner_confirmations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  place_id text not null references public.places(id) on delete cascade,
  confirmed_by uuid not null references auth.users(id),
  region_id text not null references public.regions(id),
  confirmation_data jsonb not null default '{}'::jsonb,
  status public.submission_status not null default 'submitted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(place_id, confirmed_by, created_at)
);

create table public.app_rate_limits (
  id text primary key,
  config jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.app_rate_limits (id, config)
values ('user_signals', '{"visit_reports_per_day":10,"same_place_report_hours":24,"max_photos_per_report":3,"max_comment_length":1000}'::jsonb)
on conflict (id) do update set config = excluded.config, updated_at = now();

create or replace function public.guard_visit_report_limits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cfg jsonb;
  daily_limit integer;
  same_place_hours integer;
begin
  if not public.is_active_user(new.user_id) or new.user_id <> auth.uid() then
    raise exception 'forbidden';
  end if;

  select config into cfg from public.app_rate_limits where id = 'user_signals';
  daily_limit := coalesce((cfg->>'visit_reports_per_day')::integer, 10);
  same_place_hours := coalesce((cfg->>'same_place_report_hours')::integer, 24);

  if new.photo_count > coalesce((cfg->>'max_photos_per_report')::integer, 3) then
    raise exception 'too many photos';
  end if;

  if (select count(*) from public.visit_reports where user_id = new.user_id and created_at > now() - interval '24 hours') >= daily_limit then
    raise exception 'daily report limit exceeded';
  end if;

  if exists (
    select 1 from public.visit_reports
    where user_id = new.user_id
      and place_id = new.place_id
      and created_at > now() - make_interval(hours => same_place_hours)
  ) then
    raise exception 'same place report limit exceeded';
  end if;

  return new;
end;
$$;

create trigger visit_reports_guard before insert on public.visit_reports for each row execute function public.guard_visit_report_limits();
create trigger service_definitions_touch before update on public.service_definitions for each row execute function public.touch_updated_at();
create trigger rider_tasks_touch before update on public.rider_tasks for each row execute function public.touch_updated_at();
create trigger place_service_definitions_touch before update on public.place_service_definitions for each row execute function public.touch_updated_at();
create trigger place_schedules_touch before update on public.place_schedules for each row execute function public.touch_updated_at();
create trigger freshness_policies_touch before update on public.freshness_policies for each row execute function public.touch_updated_at();
create trigger visit_reports_touch before update on public.visit_reports for each row execute function public.touch_updated_at();
create trigger owner_confirmations_touch before update on public.owner_confirmations for each row execute function public.touch_updated_at();

create index rider_tasks_status_featured_idx on public.rider_tasks (status, is_featured, featured_priority);
create index rider_tasks_region_idx on public.rider_tasks (region_id, status);
create index rider_task_links_task_idx on public.rider_task_links (task_id, entity_type);
create index rider_task_links_entity_idx on public.rider_task_links (entity_type, entity_id);
create index place_service_definitions_place_idx on public.place_service_definitions (place_id, availability, confirmation_status);
create index place_service_definitions_service_idx on public.place_service_definitions (service_definition_id, availability);
create index place_schedules_place_idx on public.place_schedules (place_id, status);
create index freshness_policies_lookup_idx on public.freshness_policies (entity_type, category_id, service_definition_id, region_id, status);
create index verification_events_place_idx on public.verification_events (place_id, confirmed_at desc, expires_at);
create index verification_events_entity_idx on public.verification_events (entity_type, entity_id, confirmed_at desc);
create index verification_events_region_status_idx on public.verification_events (region_id, status, expires_at);
create index visit_reports_place_idx on public.visit_reports (place_id, status, created_at desc);
create index visit_reports_user_idx on public.visit_reports (user_id, created_at desc);
create index owner_confirmations_place_idx on public.owner_confirmations (place_id, status, created_at desc);

create or replace view public.place_trust_summaries as
select
  p.id as place_id,
  p.region_id,
  p.verification_status,
  p.information_checked_at,
  max(ve.confirmed_at) as last_verification_at,
  min(ve.expires_at) filter (where ve.expires_at is not null) as nearest_expires_at,
  count(vr.id) filter (where vr.status = 'accepted') as accepted_visit_reports,
  count(vr.id) filter (where vr.status = 'submitted') as pending_visit_reports
from public.places p
left join public.verification_events ve on ve.place_id = p.id
left join public.visit_reports vr on vr.place_id = p.id
where p.status = 'published'
group by p.id, p.region_id, p.verification_status, p.information_checked_at;

create or replace view public.recheck_queue as
select
  p.id as place_id,
  p.name,
  p.region_id,
  p.category_id,
  pts.last_verification_at,
  pts.nearest_expires_at,
  case
    when pts.nearest_expires_at is not null and pts.nearest_expires_at < now() then 'expired'
    when pts.last_verification_at is null then 'never_checked'
    else 'ok'
  end as recheck_status
from public.places p
left join public.place_trust_summaries pts on pts.place_id = p.id
where p.status = 'published';

create or replace view public.user_contribution_stats as
select
  p.id as user_id,
  count(vr.id) filter (where vr.status = 'accepted') as accepted_visit_reports,
  count(vr.id) filter (where vr.status = 'submitted') as pending_visit_reports,
  count(cs.id) filter (where cs.status = 'approved') as approved_submissions
from public.profiles p
left join public.visit_reports vr on vr.user_id = p.id
left join public.content_submissions cs on cs.author_id = p.id
group by p.id;

alter table public.service_definitions enable row level security;
alter table public.rider_tasks enable row level security;
alter table public.rider_task_links enable row level security;
alter table public.place_service_definitions enable row level security;
alter table public.place_schedules enable row level security;
alter table public.freshness_policies enable row level security;
alter table public.verification_events enable row level security;
alter table public.visit_reports enable row level security;
alter table public.owner_confirmations enable row level security;
alter table public.app_rate_limits enable row level security;

create policy "public can read published service definitions" on public.service_definitions for select using (status = 'published');
create policy "superadmin can manage service definitions" on public.service_definitions for all using (public.is_superadmin()) with check (public.is_superadmin());

create policy "public can read published rider tasks" on public.rider_tasks for select using (status = 'published' and (region_scope = 'global' or region_id is not null));
create policy "admin can manage scoped rider tasks" on public.rider_tasks for all using (region_scope = 'global' and public.is_superadmin() or region_scope = 'regional' and public.can_admin_region(region_id)) with check (region_scope = 'global' and public.is_superadmin() or region_scope = 'regional' and public.can_admin_region(region_id));

create policy "public can read published task links" on public.rider_task_links for select using (exists (select 1 from public.rider_tasks t where t.id = task_id and t.status = 'published'));
create policy "admin can manage task links" on public.rider_task_links for all using (exists (select 1 from public.rider_tasks t where t.id = task_id and (t.region_scope = 'global' and public.is_superadmin() or t.region_scope = 'regional' and public.can_admin_region(t.region_id)))) with check (exists (select 1 from public.rider_tasks t where t.id = task_id and (t.region_scope = 'global' and public.is_superadmin() or t.region_scope = 'regional' and public.can_admin_region(t.region_id))));

create policy "public can read place services for published places" on public.place_service_definitions for select using (exists (select 1 from public.places p where p.id = place_id and p.status = 'published'));
create policy "admin can manage place services" on public.place_service_definitions for all using (exists (select 1 from public.places p where p.id = place_id and public.can_admin_region(p.region_id))) with check (exists (select 1 from public.places p where p.id = place_id and public.can_admin_region(p.region_id)));

create policy "public can read schedules for published places" on public.place_schedules for select using (status = 'published' and exists (select 1 from public.places p where p.id = place_id and p.status = 'published'));
create policy "admin can manage schedules" on public.place_schedules for all using (exists (select 1 from public.places p where p.id = place_id and public.can_admin_region(p.region_id))) with check (exists (select 1 from public.places p where p.id = place_id and public.can_admin_region(p.region_id)));

create policy "public can read freshness policies" on public.freshness_policies for select using (status = 'published');
create policy "superadmin can manage freshness policies" on public.freshness_policies for all using (public.is_superadmin()) with check (public.is_superadmin());

create policy "public can read verification for published places" on public.verification_events for select using (place_id is not null and exists (select 1 from public.places p where p.id = place_id and p.status = 'published'));
create policy "moderators can create verification events" on public.verification_events for insert with check (region_id is null and public.is_superadmin() or region_id is not null and public.can_moderate_region(region_id));
create policy "moderators can update verification events" on public.verification_events for update using (region_id is null and public.is_superadmin() or region_id is not null and public.can_moderate_region(region_id)) with check (region_id is null and public.is_superadmin() or region_id is not null and public.can_moderate_region(region_id));

create policy "users read own visit reports" on public.visit_reports for select using (user_id = auth.uid() or public.can_moderate_region(region_id));
create policy "active users create own visit reports" on public.visit_reports for insert with check (user_id = auth.uid() and public.is_active_user());
create policy "moderators update visit reports" on public.visit_reports for update using (public.can_moderate_region(region_id)) with check (public.can_moderate_region(region_id));

create policy "owners read own confirmations" on public.owner_confirmations for select using (confirmed_by = auth.uid() or public.can_moderate_region(region_id) or public.is_organization_member(organization_id));
create policy "owners create confirmations" on public.owner_confirmations for insert with check (confirmed_by = auth.uid() and public.is_active_user() and public.is_organization_member(organization_id));
create policy "moderators update confirmations" on public.owner_confirmations for update using (public.can_moderate_region(region_id)) with check (public.can_moderate_region(region_id));

create policy "superadmin reads rate limits" on public.app_rate_limits for select using (public.is_superadmin());
create policy "superadmin manages rate limits" on public.app_rate_limits for all using (public.is_superadmin()) with check (public.is_superadmin());

grant select on public.service_definitions, public.rider_tasks, public.rider_task_links, public.place_service_definitions, public.place_schedules, public.freshness_policies, public.verification_events, public.place_trust_summaries to anon, authenticated;
grant select on public.recheck_queue, public.user_contribution_stats, public.app_rate_limits to authenticated;
grant insert, update, delete on public.service_definitions, public.rider_tasks, public.rider_task_links, public.place_service_definitions, public.place_schedules, public.freshness_policies, public.verification_events to authenticated;
grant select, insert, update on public.visit_reports, public.owner_confirmations to authenticated;
grant execute on function public.guard_visit_report_limits() to authenticated;
