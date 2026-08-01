create or replace function public.normalize_place_slug(input text)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  value text := lower(coalesce(input, ''));
begin
  value := translate(value, 'абвгдеёзийклмнопрстуфхцыэ', 'abvgdeeziyklmnoprstufhcye');
  value := replace(value, 'ж', 'zh');
  value := replace(value, 'ч', 'ch');
  value := replace(value, 'ш', 'sh');
  value := replace(value, 'щ', 'sch');
  value := replace(value, 'ю', 'yu');
  value := replace(value, 'я', 'ya');
  value := replace(value, 'ь', '');
  value := replace(value, 'ъ', '');
  value := regexp_replace(value, '[^a-z0-9]+', '-', 'g');
  value := trim(both '-' from value);
  return nullif(value, '');
end;
$$;

create or replace function public.submit_place_submission(p_data jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  submission_id uuid;
  title text := trim(coalesce(p_data->>'title', p_data->>'name', ''));
  category_id text := trim(coalesce(p_data->>'category_id', ''));
  region_id text := trim(coalesce(p_data->>'region_id', ''));
  address text := trim(coalesce(p_data->>'address', ''));
  description text := trim(coalesce(p_data->>'description', ''));
  source_comment text := trim(coalesce(p_data->>'source_comment', p_data->>'source', ''));
  phone text := trim(coalesce(p_data->>'phone', ''));
  website text := trim(coalesce(p_data->>'website', ''));
  schedule text := trim(coalesce(p_data->>'schedule', ''));
  photo_url text := trim(coalesce(p_data->>'photo_url', ''));
  extra text := trim(coalesce(p_data->>'extra', ''));
  lng double precision;
  lat double precision;
  cleaned jsonb;
begin
  if auth.uid() is null or not public.is_active_user() then
    raise exception 'forbidden';
  end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object' then
    raise exception 'invalid data';
  end if;
  if title = '' or category_id = '' or region_id = '' or address = '' or description = '' or source_comment = '' then
    raise exception 'required fields missing';
  end if;
  if length(title) > 120 or length(address) > 240 or length(description) > 1200 or length(source_comment) > 800 or length(extra) > 1200 then
    raise exception 'text is too long';
  end if;
  if phone <> '' and length(phone) > 80 then raise exception 'phone is too long'; end if;
  if schedule <> '' and length(schedule) > 160 then raise exception 'schedule is too long'; end if;
  if website <> '' and website !~ '^https?://' then raise exception 'invalid website url'; end if;
  if photo_url <> '' and photo_url !~ '^https?://' then raise exception 'invalid photo url'; end if;
  if not exists (select 1 from public.regions where id = region_id) then
    raise exception 'unknown region';
  end if;
  if not exists (select 1 from public.categories where id = category_id and section_id = 'places') then
    raise exception 'unknown category';
  end if;

  if nullif(p_data->>'lng', '') is not null or nullif(p_data->>'lat', '') is not null then
    lng := nullif(p_data->>'lng', '')::double precision;
    lat := nullif(p_data->>'lat', '')::double precision;
    if lng < -180 or lng > 180 or lat < -90 or lat > 90 then
      raise exception 'invalid coordinates';
    end if;
  end if;

  cleaned := jsonb_strip_nulls(jsonb_build_object(
    'title', title,
    'category_id', category_id,
    'region_id', region_id,
    'address', address,
    'description', description,
    'source_comment', source_comment,
    'phone', nullif(phone, ''),
    'website', nullif(website, ''),
    'lng', lng,
    'lat', lat,
    'schedule', nullif(schedule, ''),
    'photo_url', nullif(photo_url, ''),
    'extra', nullif(extra, '')
  ));

  insert into public.content_submissions (
    entity_type,
    submission_type,
    region_id,
    author_id,
    proposed_data,
    reason,
    status,
    submitted_at
  )
  values (
    'place',
    'create_entity',
    region_id,
    auth.uid(),
    cleaned,
    description,
    'submitted',
    now()
  )
  returning id into submission_id;

  perform public.write_audit('submit_place_submission', 'content_submission', submission_id::text, region_id, null, cleaned);
  return submission_id;
end;
$$;

grant execute on function public.submit_place_submission(jsonb) to authenticated;

create or replace function public.find_place_submission_duplicates(p_submission_id uuid)
returns table(place_id text, title text, reason text)
language plpgsql
security definer
set search_path = public
as $$
declare
  submission_row public.content_submissions%rowtype;
  data jsonb;
  title_value text;
  address_value text;
  phone_value text;
  lng double precision;
  lat double precision;
begin
  select * into submission_row from public.content_submissions where id = p_submission_id;
  if submission_row.id is null then raise exception 'submission not found'; end if;
  if not (submission_row.author_id = auth.uid() or public.can_moderate_region(submission_row.region_id)) then
    raise exception 'forbidden';
  end if;

  data := submission_row.proposed_data;
  title_value := lower(coalesce(data->>'title', ''));
  address_value := lower(coalesce(data->>'address', ''));
  phone_value := regexp_replace(coalesce(data->>'phone', ''), '[^0-9]+', '', 'g');
  lng := nullif(data->>'lng', '')::double precision;
  lat := nullif(data->>'lat', '')::double precision;

  return query
  select p.id,
    p.name->>'ru',
    trim(both ', ' from concat_ws(', ',
      case when title_value <> '' and lower(p.name->>'ru') like '%' || title_value || '%' then 'похожее название' end,
      case when address_value <> '' and exists (
        select 1 from jsonb_array_elements(p.branches) b
        where lower(coalesce(b->'address'->>'ru', '')) = address_value
      ) then 'тот же адрес' end,
      case when phone_value <> '' and regexp_replace(coalesce(p.contacts::text, ''), '[^0-9]+', '', 'g') like '%' || phone_value || '%' then 'похожий телефон' end,
      case when lng is not null and lat is not null and p.coordinates is not null and abs(p.coordinates[1] - lng) < 0.003 and abs(p.coordinates[2] - lat) < 0.003 then 'рядом по координатам' end
    )) as reason
  from public.places p
  where p.region_id = submission_row.region_id
    and p.status = 'published'
    and (
      (title_value <> '' and lower(p.name->>'ru') like '%' || title_value || '%')
      or (address_value <> '' and exists (
        select 1 from jsonb_array_elements(p.branches) b
        where lower(coalesce(b->'address'->>'ru', '')) = address_value
      ))
      or (phone_value <> '' and regexp_replace(coalesce(p.contacts::text, ''), '[^0-9]+', '', 'g') like '%' || phone_value || '%')
      or (lng is not null and lat is not null and p.coordinates is not null and abs(p.coordinates[1] - lng) < 0.003 and abs(p.coordinates[2] - lat) < 0.003)
    )
  limit 5;
end;
$$;

grant execute on function public.find_place_submission_duplicates(uuid) to authenticated;

create or replace function public.approve_place_submission(p_submission_id uuid, p_duplicate_confirmed boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  submission_row public.content_submissions%rowtype;
  data jsonb;
  duplicate_count integer;
  base_slug text;
  next_slug text;
  suffix integer := 1;
  next_version integer;
  created_place public.places%rowtype;
  lng double precision;
  lat double precision;
  contacts jsonb := '[]'::jsonb;
begin
  if auth.uid() is null or not public.is_active_user() then
    raise exception 'forbidden';
  end if;

  select * into submission_row
  from public.content_submissions
  where id = p_submission_id
  for update;

  if submission_row.id is null then raise exception 'submission not found'; end if;
  if submission_row.status <> 'submitted' then raise exception 'submission already processed'; end if;
  if submission_row.entity_type <> 'place' or submission_row.submission_type <> 'create_entity' then raise exception 'unsupported submission'; end if;
  if not public.can_moderate_region(submission_row.region_id) then raise exception 'forbidden'; end if;
  if not public.is_superadmin() and submission_row.author_id = auth.uid() then raise exception 'cannot approve own submission'; end if;

  data := submission_row.proposed_data;
  if trim(coalesce(data->>'title', '')) = '' or trim(coalesce(data->>'category_id', '')) = '' or trim(coalesce(data->>'address', '')) = '' or trim(coalesce(data->>'description', '')) = '' or trim(coalesce(data->>'source_comment', '')) = '' then
    raise exception 'required fields missing';
  end if;
  if not exists (select 1 from public.regions where id = submission_row.region_id) then raise exception 'unknown region'; end if;
  if not exists (select 1 from public.categories where id = data->>'category_id' and section_id = 'places') then raise exception 'unknown category'; end if;

  select count(*) into duplicate_count from public.find_place_submission_duplicates(p_submission_id);
  if duplicate_count > 0 and not p_duplicate_confirmed then
    raise exception 'possible duplicate';
  end if;

  base_slug := coalesce(public.normalize_place_slug(data->>'title'), 'place-' || left(replace(p_submission_id::text, '-', ''), 8));
  next_slug := base_slug;
  while exists (select 1 from public.places where slug = next_slug or id = next_slug) loop
    suffix := suffix + 1;
    next_slug := base_slug || '-' || suffix::text;
  end loop;

  if nullif(data->>'lng', '') is not null and nullif(data->>'lat', '') is not null then
    lng := (data->>'lng')::double precision;
    lat := (data->>'lat')::double precision;
  end if;

  if nullif(data->>'phone', '') is not null then
    contacts := contacts || jsonb_build_array(jsonb_build_object('type', 'phone', 'value', data->>'phone'));
  end if;
  if nullif(data->>'website', '') is not null then
    contacts := contacts || jsonb_build_array(jsonb_build_object('type', 'website', 'value', regexp_replace(data->>'website', '^https?://(www\.)?', ''), 'url', data->>'website'));
  end if;

  insert into public.places (
    id,
    slug,
    region_id,
    category_id,
    status,
    name,
    short_description,
    full_description,
    image,
    cover_image,
    coordinates,
    coordinates_status,
    branches,
    contacts,
    services,
    tags,
    verification_status,
    business_status,
    map_visibility,
    source_static_id
  )
  values (
    next_slug,
    next_slug,
    submission_row.region_id,
    data->>'category_id',
    'published',
    jsonb_build_object('ru', data->>'title'),
    jsonb_build_object('ru', data->>'description'),
    jsonb_build_object('ru', coalesce(nullif(data->>'extra', ''), data->>'description')),
    nullif(data->>'photo_url', ''),
    nullif(data->>'photo_url', ''),
    case when lng is not null and lat is not null then array[lng, lat] else null end,
    case when lng is not null and lat is not null then 'community_submitted' else 'unconfirmed' end,
    jsonb_build_array(jsonb_strip_nulls(jsonb_build_object(
      'id', 'main',
      'address', jsonb_build_object('ru', data->>'address'),
      'phone', nullif(data->>'phone', ''),
      'schedule', case when nullif(data->>'schedule', '') is not null then jsonb_build_object('ru', data->>'schedule') else null end,
      'coordinates', case when lng is not null and lat is not null then jsonb_build_object('lng', lng, 'lat', lat) else null end
    ))),
    contacts,
    '[]'::jsonb,
    array_remove(array['предложено пользователем', data->>'source_comment'], null),
    'community',
    'unknown',
    true,
    'submission:' || p_submission_id::text
  )
  returning * into created_place;

  select coalesce(max(version), 0) + 1
  into next_version
  from public.content_versions
  where entity_type = 'place'::public.entity_type
    and entity_id = created_place.id;

  insert into public.content_versions (entity_type, entity_id, version, data, created_by)
  values ('place', created_place.id, next_version, to_jsonb(created_place), auth.uid());

  update public.content_submissions
  set status = 'approved',
      reviewed_at = now(),
      reviewed_by = auth.uid(),
      assigned_moderator_id = coalesce(assigned_moderator_id, auth.uid()),
      published_entity_id = created_place.id
  where id = p_submission_id;

  perform public.write_audit(
    'approve_place_submission',
    'content_submission',
    p_submission_id::text,
    submission_row.region_id,
    to_jsonb(submission_row),
    jsonb_build_object('published_entity_id', created_place.id, 'slug', created_place.slug),
    jsonb_build_object('duplicate_confirmed', p_duplicate_confirmed)
  );

  return jsonb_build_object('id', created_place.id, 'slug', created_place.slug);
end;
$$;

grant execute on function public.approve_place_submission(uuid, boolean) to authenticated;
