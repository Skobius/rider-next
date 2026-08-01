alter table public.places
  add column if not exists business_status text not null default 'unknown';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'places_business_status_check'
      and conrelid = 'public.places'::regclass
  ) then
    alter table public.places
      add constraint places_business_status_check
      check (business_status in ('unknown', 'open', 'temporarily_closed', 'closed'));
  end if;
end $$;

create or replace function public.admin_update_place(p_place_id text, p_patch jsonb)
returns public.places
language plpgsql
security definer
set search_path = public
as $$
declare
  before_place public.places%rowtype;
  after_place public.places%rowtype;
  next_region_id text;
  next_category_id text;
  next_status public.content_status;
  next_verification_status text;
  next_business_status text;
  next_coordinates double precision[];
  next_tags text[];
  next_version integer;
begin
  if auth.uid() is null or not public.is_active_user() then
    raise exception 'forbidden';
  end if;

  if p_patch is null or jsonb_typeof(p_patch) <> 'object' then
    raise exception 'invalid patch';
  end if;

  select *
  into before_place
  from public.places
  where id = p_place_id
  for update;

  if not found then
    raise exception 'place not found';
  end if;

  if not public.can_admin_region(before_place.region_id) then
    raise exception 'forbidden';
  end if;

  next_region_id := coalesce(nullif(p_patch->>'region_id', ''), before_place.region_id);
  if not exists (select 1 from public.regions where id = next_region_id) then
    raise exception 'unknown region';
  end if;
  if not public.can_admin_region(next_region_id) then
    raise exception 'forbidden';
  end if;

  next_category_id := coalesce(nullif(p_patch->>'category_id', ''), before_place.category_id);
  if not exists (select 1 from public.categories where id = next_category_id) then
    raise exception 'unknown category';
  end if;

  next_status := coalesce(nullif(p_patch->>'status', '')::public.content_status, before_place.status);
  next_verification_status := coalesce(nullif(p_patch->>'verification_status', ''), before_place.verification_status);
  if next_verification_status not in ('verified_mg67', 'confirmed', 'community', 'pending') then
    raise exception 'invalid verification status';
  end if;

  next_business_status := coalesce(nullif(p_patch->>'business_status', ''), before_place.business_status);
  if next_business_status not in ('unknown', 'open', 'temporarily_closed', 'closed') then
    raise exception 'invalid business status';
  end if;

  if p_patch ? 'coordinates' then
    if p_patch->'coordinates' is null or jsonb_typeof(p_patch->'coordinates') = 'null' then
      next_coordinates := null;
    elsif jsonb_typeof(p_patch->'coordinates') = 'array' and jsonb_array_length(p_patch->'coordinates') = 2 then
      next_coordinates := array[(p_patch->'coordinates'->>0)::double precision, (p_patch->'coordinates'->>1)::double precision];
      if next_coordinates[1] < -180 or next_coordinates[1] > 180 or next_coordinates[2] < -90 or next_coordinates[2] > 90 then
        raise exception 'invalid coordinates';
      end if;
    else
      raise exception 'invalid coordinates';
    end if;
  else
    next_coordinates := before_place.coordinates;
  end if;

  if p_patch ? 'tags' then
    if jsonb_typeof(p_patch->'tags') <> 'array' then
      raise exception 'invalid tags';
    end if;
    select coalesce(array_agg(trim(value)), '{}')
    into next_tags
    from jsonb_array_elements_text(p_patch->'tags')
    where trim(value) <> '';
  else
    next_tags := before_place.tags;
  end if;

  if p_patch ? 'branches' and jsonb_typeof(p_patch->'branches') <> 'array' then
    raise exception 'invalid branches';
  end if;
  if p_patch ? 'contacts' and jsonb_typeof(p_patch->'contacts') <> 'array' then
    raise exception 'invalid contacts';
  end if;
  if p_patch ? 'map_url' and nullif(p_patch->>'map_url', '') is not null and p_patch->>'map_url' !~ '^https?://' then
    raise exception 'invalid map url';
  end if;
  if p_patch ? 'contacts' and exists (
    select 1
    from jsonb_array_elements(p_patch->'contacts') item
    where item->>'type' = 'website'
      and nullif(coalesce(item->>'url', item->>'value'), '') is not null
      and coalesce(item->>'url', item->>'value') !~ '^https?://'
  ) then
    raise exception 'invalid website url';
  end if;

  select coalesce(max(version), 0) + 1
  into next_version
  from public.content_versions
  where entity_type = 'place'::public.entity_type
    and entity_id = p_place_id;

  insert into public.content_versions (entity_type, entity_id, version, data, created_by)
  values ('place', p_place_id, next_version, to_jsonb(before_place), auth.uid());

  update public.places
  set
    name = case
      when p_patch ? 'name' and jsonb_typeof(p_patch->'name') = 'object' then p_patch->'name'
      when p_patch ? 'name' then jsonb_build_object('ru', trim(p_patch->>'name'))
      else before_place.name
    end,
    short_description = case
      when p_patch ? 'short_description' and jsonb_typeof(p_patch->'short_description') = 'object' then p_patch->'short_description'
      when p_patch ? 'short_description' then jsonb_build_object('ru', trim(p_patch->>'short_description'))
      else before_place.short_description
    end,
    full_description = case
      when p_patch ? 'full_description' and jsonb_typeof(p_patch->'full_description') = 'object' then p_patch->'full_description'
      when p_patch ? 'full_description' then jsonb_build_object('ru', trim(p_patch->>'full_description'))
      else before_place.full_description
    end,
    category_id = next_category_id,
    region_id = next_region_id,
    status = next_status,
    verification_status = next_verification_status,
    business_status = next_business_status,
    information_checked_at = case when p_patch ? 'information_checked_at' then nullif(p_patch->>'information_checked_at', '') else before_place.information_checked_at end,
    image = case when p_patch ? 'image' then nullif(p_patch->>'image', '') else before_place.image end,
    cover_image = case when p_patch ? 'cover_image' then nullif(p_patch->>'cover_image', '') else before_place.cover_image end,
    coordinates = next_coordinates,
    coordinates_status = before_place.coordinates_status,
    map_visibility = case when p_patch ? 'map_visibility' then coalesce((p_patch->>'map_visibility')::boolean, true) else before_place.map_visibility end,
    map_url = case when p_patch ? 'map_url' then nullif(p_patch->>'map_url', '') else before_place.map_url end,
    branches = case when p_patch ? 'branches' then p_patch->'branches' else before_place.branches end,
    contacts = case when p_patch ? 'contacts' then p_patch->'contacts' else before_place.contacts end,
    products = case when p_patch ? 'products' then p_patch->'products' else before_place.products end,
    features = case when p_patch ? 'features' then p_patch->'features' else before_place.features end,
    tags = next_tags,
    mg67_comment = case when p_patch ? 'mg67_comment' then p_patch->'mg67_comment' else before_place.mg67_comment end
  where id = p_place_id
  returning * into after_place;

  if trim(after_place.name->>'ru') = '' or trim(after_place.short_description->>'ru') = '' then
    raise exception 'name and short description are required';
  end if;

  perform public.write_audit(
    'admin_update_place',
    'place',
    p_place_id,
    after_place.region_id,
    to_jsonb(before_place),
    to_jsonb(after_place),
    jsonb_build_object('changed_fields', p_patch)
  );

  return after_place;
end;
$$;

grant execute on function public.admin_update_place(text, jsonb) to authenticated;

drop policy if exists "admins read versions" on public.content_versions;
create policy "admins read versions" on public.content_versions
  for select
  using (
    public.is_superadmin()
    or public.can_admin_region(data->>'region_id')
  );
