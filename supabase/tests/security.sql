set client_min_messages = warning;

insert into public.regions (id, slug, title, status)
values ('test-other-region', 'test-other-region', '{"ru":"Test Other Region"}'::jsonb, 'published')
on conflict (id) do nothing;

delete from public.verification_events
where created_by in (
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000004'
);
delete from public.visit_reports
where user_id in (
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000007'
);
delete from public.owner_confirmations
where confirmed_by = '00000000-0000-4000-8000-000000000003';

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'security-user@example.test', '', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'security-other@example.test', '', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'security-owner@example.test', '', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'security-moderator@example.test', '', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-4000-8000-000000000005', 'authenticated', 'authenticated', 'security-admin@example.test', '', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-4000-8000-000000000006', 'authenticated', 'authenticated', 'security-superadmin@example.test', '', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-4000-8000-000000000007', 'authenticated', 'authenticated', 'security-blocked@example.test', '', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now())
on conflict (id) do nothing;

insert into public.profiles (id, display_name, account_status)
values
  ('00000000-0000-4000-8000-000000000001', 'Security User', 'active'),
  ('00000000-0000-4000-8000-000000000002', 'Security Other User', 'active'),
  ('00000000-0000-4000-8000-000000000003', 'Security Owner', 'active'),
  ('00000000-0000-4000-8000-000000000004', 'Security Moderator', 'active'),
  ('00000000-0000-4000-8000-000000000005', 'Security Admin', 'active'),
  ('00000000-0000-4000-8000-000000000006', 'Security Superadmin', 'active'),
  ('00000000-0000-4000-8000-000000000007', 'Security Blocked', 'blocked')
on conflict (id) do update set account_status = excluded.account_status;

insert into public.user_role_assignments (user_id, role_id, scope_type, scope_id)
select '00000000-0000-4000-8000-000000000004', id, 'region', 'smolensk-oblast' from public.roles where code = 'moderator'
on conflict do nothing;
insert into public.user_role_assignments (user_id, role_id, scope_type, scope_id)
select '00000000-0000-4000-8000-000000000005', id, 'region', 'smolensk-oblast' from public.roles where code = 'admin'
on conflict do nothing;
insert into public.user_role_assignments (user_id, role_id, scope_type, scope_id)
select '00000000-0000-4000-8000-000000000006', id, 'global', null from public.roles where code = 'superadmin'
on conflict do nothing;
insert into public.user_role_assignments (user_id, role_id, scope_type, scope_id)
select '00000000-0000-4000-8000-000000000007', id, 'global', null from public.roles where code = 'admin'
on conflict do nothing;

insert into public.organizations (id, name, slug, status, region_id)
values
  ('10000000-0000-4000-8000-000000000001', 'Security Own Organization', 'security-own-organization', 'active', 'smolensk-oblast'),
  ('10000000-0000-4000-8000-000000000002', 'Security Other Organization', 'security-other-organization', 'active', 'test-other-region')
on conflict (id) do nothing;

insert into public.organization_memberships (organization_id, user_id, membership_role, status)
values ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000003', 'owner', 'active')
on conflict do nothing;

insert into public.content_submissions (id, entity_type, submission_type, region_id, author_id, proposed_data, status)
values
  ('20000000-0000-4000-8000-000000000001', 'place', 'create_entity', 'smolensk-oblast', '00000000-0000-4000-8000-000000000001', '{"title":"Own"}'::jsonb, 'submitted'),
  ('20000000-0000-4000-8000-000000000002', 'place', 'create_entity', 'test-other-region', '00000000-0000-4000-8000-000000000002', '{"title":"Other"}'::jsonb, 'submitted')
on conflict (id) do nothing;

insert into public.places (id, slug, region_id, category_id, status, name, short_description)
values ('security-draft-place', 'security-draft-place', 'test-other-region', 'places-services', 'draft', '{"ru":"Security Draft Place"}'::jsonb, '{"ru":"Draft"}'::jsonb)
on conflict (id) do nothing;

do $$
declare
  missing_rls integer;
  bad_bucket integer;
  unsafe_definer integer;
begin
  select count(*) into missing_rls
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;
  if missing_rls <> 0 then raise exception 'public tables without RLS: %', missing_rls; end if;

  select count(*) into bad_bucket
  from storage.buckets
  where id in ('avatars', 'submission-media', 'published-media')
    and (
      allowed_mime_types && array['image/svg+xml', 'text/html', 'application/javascript', 'application/x-msdownload']
      or (id = 'submission-media' and public)
      or (id = 'published-media' and not public)
    );
  if bad_bucket <> 0 then raise exception 'unsafe storage bucket policy'; end if;

  select count(*) into unsafe_definer
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.prosecdef
    and not exists (
      select 1
      from unnest(coalesce(p.proconfig, array[]::text[])) item
      where item = 'search_path=public'
    );
  if unsafe_definer <> 0 then raise exception 'SECURITY DEFINER without search_path: %', unsafe_definer; end if;

  if has_function_privilege('anon', 'public.bootstrap_superadmin(text)', 'execute') then
    raise exception 'anon can execute bootstrap_superadmin';
  end if;
  if has_function_privilege('authenticated', 'public.write_audit(text,text,text,text,jsonb,jsonb,jsonb)', 'execute') then
    raise exception 'authenticated can execute write_audit directly';
  end if;
end $$;

select 'security sql setup passed' as result;

set session authorization anon;
do $$
declare
  forbidden_succeeded boolean;
begin
  if (select count(*) from public.places where status = 'published') < 1 then raise exception 'guest cannot read published places'; end if;
  if (select count(*) from public.rider_tasks where status = 'published') < 3 then raise exception 'guest cannot read published rider tasks'; end if;
  if (select count(*) from public.service_definitions where status = 'published') < 8 then raise exception 'guest cannot read published service definitions'; end if;
  if exists (select 1 from public.places where status = 'draft') then raise exception 'guest can read draft places'; end if;
  begin
    insert into public.content_submissions (entity_type, submission_type, region_id, author_id)
    values ('place', 'create_entity', 'smolensk-oblast', '00000000-0000-4000-8000-000000000001');
    forbidden_succeeded := true;
  exception when insufficient_privilege or check_violation or with_check_option_violation then
    forbidden_succeeded := false;
  end;
  if forbidden_succeeded then raise exception 'guest created submission'; end if;
  begin
    insert into public.visit_reports (user_id, place_id, region_id)
    values ('00000000-0000-4000-8000-000000000001', 'rolling-moto-shop-smolensk', 'smolensk-oblast');
    forbidden_succeeded := true;
  exception when others then
    forbidden_succeeded := false;
  end;
  if forbidden_succeeded then raise exception 'guest created visit report'; end if;
  begin
    perform 1 from public.audit_log limit 1;
    forbidden_succeeded := true;
  exception when insufficient_privilege then
    forbidden_succeeded := false;
  end;
  if forbidden_succeeded then raise exception 'guest can read audit log'; end if;
end $$;
reset session authorization;

set session authorization authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', false);
do $$
declare
  forbidden_succeeded boolean;
begin
  update public.profiles set display_name = 'Security User Updated' where id = '00000000-0000-4000-8000-000000000001';
  if not found then raise exception 'user cannot update own profile'; end if;
  insert into public.favorites (user_id, entity_type, entity_id)
  values ('00000000-0000-4000-8000-000000000001', 'place', 'rolling-moto-shop-smolensk')
  on conflict do nothing;
  insert into public.visit_reports (user_id, place_id, region_id, is_open, services_confirmed)
  values ('00000000-0000-4000-8000-000000000001', 'rolling-moto-shop-smolensk', 'smolensk-oblast', true, array['service']);
  begin
    insert into public.visit_reports (user_id, place_id, region_id, is_open)
    values ('00000000-0000-4000-8000-000000000001', 'rolling-moto-shop-smolensk', 'smolensk-oblast', true);
    forbidden_succeeded := true;
  exception when others then
    forbidden_succeeded := false;
  end;
  if forbidden_succeeded then raise exception 'user bypassed same place visit report limit'; end if;
  begin
    insert into public.visit_reports (user_id, place_id, region_id, is_open)
    values ('00000000-0000-4000-8000-000000000002', 'rolling-moto-shop-smolensk', 'smolensk-oblast', true);
    forbidden_succeeded := true;
  exception when others then
    forbidden_succeeded := false;
  end;
  if forbidden_succeeded then raise exception 'user created visit report for another account'; end if;
  if exists (select 1 from public.content_submissions where author_id = '00000000-0000-4000-8000-000000000002') then
    raise exception 'user can read another user submission';
  end if;
  begin
    perform public.assign_role('00000000-0000-4000-8000-000000000001', 'admin', 'global', null);
    forbidden_succeeded := true;
  exception when others then
    forbidden_succeeded := false;
  end;
  if forbidden_succeeded then raise exception 'user assigned role'; end if;
  begin
    perform public.update_content_summary('places', 'rolling-moto-shop-smolensk', '{"ru":"Bad"}'::jsonb, '{"ru":"Bad"}'::jsonb, 'published');
    forbidden_succeeded := true;
  exception when others then
    forbidden_succeeded := false;
  end;
  if forbidden_succeeded then raise exception 'user published content'; end if;
  begin
    perform public.admin_update_place('rolling-moto-shop-smolensk', '{"name":"Bad"}'::jsonb);
    forbidden_succeeded := true;
  exception when others then
    forbidden_succeeded := false;
  end;
  if forbidden_succeeded then raise exception 'user used admin_update_place'; end if;
end $$;
reset session authorization;

set session authorization authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000003', false);
do $$
declare
  forbidden_succeeded boolean;
begin
  if not exists (select 1 from public.organization_memberships where organization_id = '10000000-0000-4000-8000-000000000001') then
    raise exception 'owner cannot read own membership';
  end if;
  if exists (select 1 from public.organization_memberships where organization_id = '10000000-0000-4000-8000-000000000002') then
    raise exception 'owner can read other organization membership';
  end if;
  begin
    update public.places set verification_status = 'verified' where id = 'rolling-moto-shop-smolensk';
    forbidden_succeeded := found;
  exception when insufficient_privilege or check_violation or with_check_option_violation then
    forbidden_succeeded := false;
  end;
  if forbidden_succeeded then raise exception 'owner updated published place directly'; end if;
  insert into public.owner_confirmations (organization_id, place_id, confirmed_by, region_id, confirmation_data)
  values ('10000000-0000-4000-8000-000000000001', 'rolling-moto-shop-smolensk', '00000000-0000-4000-8000-000000000003', 'smolensk-oblast', '{"unchanged":true}'::jsonb);
  begin
    insert into public.owner_confirmations (organization_id, place_id, confirmed_by, region_id, confirmation_data)
    values ('10000000-0000-4000-8000-000000000002', 'rolling-moto-shop-smolensk', '00000000-0000-4000-8000-000000000003', 'smolensk-oblast', '{"unchanged":true}'::jsonb);
    forbidden_succeeded := true;
  exception when others then
    forbidden_succeeded := false;
  end;
  if forbidden_succeeded then raise exception 'owner confirmed organization without membership'; end if;
end $$;
reset session authorization;

set session authorization authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000004', false);
do $$
declare
  forbidden_succeeded boolean;
begin
  if not exists (select 1 from public.content_submissions where id = '20000000-0000-4000-8000-000000000001') then
    raise exception 'moderator cannot read own-region submission';
  end if;
  if exists (select 1 from public.content_submissions where id = '20000000-0000-4000-8000-000000000002') then
    raise exception 'moderator can read other-region submission';
  end if;
  begin
    perform public.assign_role('00000000-0000-4000-8000-000000000001', 'admin', 'region', 'smolensk-oblast');
    forbidden_succeeded := true;
  exception when others then
    forbidden_succeeded := false;
  end;
  if forbidden_succeeded then raise exception 'moderator assigned role'; end if;
  update public.visit_reports
  set status = 'accepted', reviewed_by = '00000000-0000-4000-8000-000000000004', reviewed_at = now()
  where place_id = 'rolling-moto-shop-smolensk' and status = 'submitted';
  if not found then raise exception 'moderator cannot update own-region visit report'; end if;
  insert into public.verification_events (entity_type, entity_id, place_id, region_id, source, status, created_by)
  values ('place', 'rolling-moto-shop-smolensk', 'rolling-moto-shop-smolensk', 'smolensk-oblast', 'user_report', 'confirmed', '00000000-0000-4000-8000-000000000004');
  begin
    perform public.admin_update_place('rolling-moto-shop-smolensk', '{"name":"Bad moderator update"}'::jsonb);
    forbidden_succeeded := true;
  exception when others then
    forbidden_succeeded := false;
  end;
  if forbidden_succeeded then raise exception 'moderator used admin_update_place'; end if;
end $$;
reset session authorization;

set session authorization authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000005', false);
do $$
declare
  forbidden_succeeded boolean;
  versions_before integer;
  versions_after integer;
begin
  perform public.update_content_summary('places', 'rolling-moto-shop-smolensk', '{"ru":"Rolling Moto Shop"}'::jsonb, '{"ru":"Security check"}'::jsonb, 'published');
  select count(*) into versions_before from public.content_versions where entity_type = 'place' and entity_id = 'rolling-moto-shop-smolensk';
  perform public.admin_update_place(
    'rolling-moto-shop-smolensk',
    jsonb_build_object(
      'name', 'Rolling Moto Admin',
      'short_description', 'Admin full edit check',
      'full_description', 'Full description changed by protected RPC',
      'category_id', 'moto-shops',
      'region_id', 'smolensk-oblast',
      'status', 'published',
      'verification_status', 'confirmed',
      'business_status', 'open',
      'information_checked_at', '31.07.2026',
      'coordinates', jsonb_build_array(31.972202, 54.791412),
      'map_visibility', true,
      'map_url', 'https://yandex.ru/maps/?pt=31.972202,54.791412&z=16&l=map',
      'branches', jsonb_build_array(jsonb_build_object('id', 'main', 'address', jsonb_build_object('ru', 'Smolensk test address'), 'phone', '+70000000000', 'schedule', jsonb_build_object('ru', '10:00-18:00'))),
      'contacts', jsonb_build_array(jsonb_build_object('type', 'phone', 'value', '+70000000000'), jsonb_build_object('type', 'website', 'value', 'rollingmoto.ru', 'url', 'https://www.rollingmoto.ru/')),
      'tags', jsonb_build_array('rolling', 'admin-check')
    )
  );
  select count(*) into versions_after from public.content_versions where entity_type = 'place' and entity_id = 'rolling-moto-shop-smolensk';
  if versions_after <= versions_before then raise exception 'admin_update_place did not create content version'; end if;
  if not exists (select 1 from public.audit_log where action = 'admin_update_place' and target_id = 'rolling-moto-shop-smolensk') then
    raise exception 'admin_update_place did not create audit log';
  end if;
  if not exists (select 1 from public.places where id = 'rolling-moto-shop-smolensk' and name->>'ru' = 'Rolling Moto Admin' and business_status = 'open') then
    raise exception 'admin_update_place did not update place fields';
  end if;
  begin
    perform public.update_content_summary('places', 'security-draft-place', '{"ru":"Bad"}'::jsonb, '{"ru":"Bad"}'::jsonb, 'published');
    forbidden_succeeded := true;
  exception when others then
    forbidden_succeeded := false;
  end;
  if forbidden_succeeded then raise exception 'admin updated content outside region scope'; end if;
  begin
    perform public.admin_update_place('security-draft-place', '{"name":"Bad region update"}'::jsonb);
    forbidden_succeeded := true;
  exception when others then
    forbidden_succeeded := false;
  end;
  if forbidden_succeeded then raise exception 'admin used admin_update_place outside region scope'; end if;
  begin
    perform public.assign_role('00000000-0000-4000-8000-000000000001', 'superadmin', 'global', null);
    forbidden_succeeded := true;
  exception when others then
    forbidden_succeeded := false;
  end;
  if forbidden_succeeded then raise exception 'admin assigned superadmin'; end if;
end $$;
reset session authorization;

set session authorization authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000006', false);
do $$
declare
  assigned_id uuid;
  super_role_id uuid;
  forbidden_succeeded boolean;
begin
  assigned_id := public.assign_role('00000000-0000-4000-8000-000000000001', 'moderator', 'region', 'smolensk-oblast');
  perform public.revoke_role(assigned_id);
  begin
    perform public.assign_role('00000000-0000-4000-8000-000000000007', 'moderator', 'region', 'smolensk-oblast');
    forbidden_succeeded := true;
  exception when others then
    forbidden_succeeded := false;
  end;
  if forbidden_succeeded then raise exception 'superadmin assigned role to blocked user'; end if;
  select ura.id into super_role_id from public.user_role_assignments ura join public.roles r on r.id = ura.role_id where ura.user_id = '00000000-0000-4000-8000-000000000006' and r.code = 'superadmin' and ura.revoked_at is null limit 1;
  begin
    perform public.revoke_role(super_role_id);
    forbidden_succeeded := true;
  exception when others then
    forbidden_succeeded := false;
  end;
  if forbidden_succeeded then raise exception 'last superadmin revoked'; end if;
  begin
    perform public.block_user('00000000-0000-4000-8000-000000000006');
    forbidden_succeeded := true;
  exception when others then
    forbidden_succeeded := false;
  end;
  if forbidden_succeeded then raise exception 'last superadmin blocked'; end if;
  if not exists (select 1 from public.audit_log where action in ('assign_role', 'revoke_role')) then
    raise exception 'privileged role operations did not create audit log';
  end if;
end $$;
reset session authorization;

set session authorization authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000007', false);
do $$
declare
  forbidden_succeeded boolean;
begin
  if public.has_role('admin') then raise exception 'blocked user still has active role'; end if;
  update public.profiles set display_name = 'Blocked Updated' where id = '00000000-0000-4000-8000-000000000007';
  if found then raise exception 'blocked user updated profile'; end if;
  begin
    insert into public.content_submissions (entity_type, submission_type, region_id, author_id, proposed_data, status)
    values ('place', 'create_entity', 'smolensk-oblast', '00000000-0000-4000-8000-000000000007', '{}'::jsonb, 'draft');
    forbidden_succeeded := true;
  exception when insufficient_privilege or check_violation or with_check_option_violation then
    forbidden_succeeded := false;
  end;
  if forbidden_succeeded then raise exception 'blocked user created submission'; end if;
  begin
    insert into public.visit_reports (user_id, place_id, region_id)
    values ('00000000-0000-4000-8000-000000000007', 'rolling-moto-shop-smolensk', 'smolensk-oblast');
    forbidden_succeeded := true;
  exception when others then
    forbidden_succeeded := false;
  end;
  if forbidden_succeeded then raise exception 'blocked user created visit report'; end if;
  begin
    perform public.update_content_summary('places', 'rolling-moto-shop-smolensk', '{"ru":"Bad"}'::jsonb, '{"ru":"Bad"}'::jsonb, 'published');
    forbidden_succeeded := true;
  exception when others then
    forbidden_succeeded := false;
  end;
  if forbidden_succeeded then raise exception 'blocked user used privileged RPC'; end if;
  begin
    perform public.admin_update_place('rolling-moto-shop-smolensk', '{"name":"Bad blocked update"}'::jsonb);
    forbidden_succeeded := true;
  exception when others then
    forbidden_succeeded := false;
  end;
  if forbidden_succeeded then raise exception 'blocked user used admin_update_place'; end if;
end $$;
reset session authorization;

select 'security checks passed' as result;
