-- Align place submissions with the add-place form and moderation workflow.
alter table public.places
  add column if not exists category_id uuid,
  add column if not exists category text,
  add column if not exists nearest_town text,
  add column if not exists address text,
  add column if not exists short_description text,
  add column if not exists image_url text,
  add column if not exists season text,
  add column if not exists best_season text,
  add column if not exists best_time text,
  add column if not exists visit_duration text,
  add column if not exists entrance_fee text,
  add column if not exists opening_hours text,
  add column if not exists distance_from_colombo double precision,
  add column if not exists accessibility text,
  add column if not exists transport text,
  add column if not exists road_condition text,
  add column if not exists activities text[] not null default '{}',
  add column if not exists safety_level text,
  add column if not exists safety_tips text,
  add column if not exists warnings text,
  add column if not exists hidden_tips text,
  add column if not exists hero_image_url text,
  add column if not exists created_by uuid,
  add column if not exists is_verified boolean not null default false,
  add column if not exists view_count integer not null default 0,
  add column if not exists like_count integer not null default 0,
  add column if not exists rating_avg double precision not null default 0,
  add column if not exists rating_count integer not null default 0;

alter table public.places
  alter column created_by drop not null,
  alter column status set default 'pending';

do $$
declare
  categories_id_type oid;
  places_category_id_type oid;
begin
  if to_regclass('public.categories') is null then
    return;
  end if;

  select atttypid
    into places_category_id_type
    from pg_attribute
    where attrelid = 'public.places'::regclass
      and attname = 'category_id'
      and not attisdropped;

  select atttypid
    into categories_id_type
    from pg_attribute
    where attrelid = 'public.categories'::regclass
      and attname = 'id'
      and not attisdropped;

  if places_category_id_type = categories_id_type
    and not exists (
      select 1
      from pg_constraint
      where conrelid = 'public.places'::regclass
        and conname = 'places_category_id_fkey'
    )
  then
    alter table public.places
      add constraint places_category_id_fkey
      foreign key (category_id)
      references public.categories (id)
      on delete set null
      not valid;
  end if;
end
$$;

alter table public.places enable row level security;

do $$
begin
  if to_regclass('public.categories') is not null then
    execute 'grant select on public.categories to anon, authenticated';
    execute 'drop policy if exists "Public can view categories" on public.categories';
    execute 'create policy "Public can view categories"
      on public.categories
      for select
      to anon, authenticated
      using (true)';
  end if;
end
$$;

drop policy if exists "Anyone can submit a place" on public.places;
drop policy if exists "Anyone can submit a pending place" on public.places;
create policy "Anyone can submit a pending place"
  on public.places
  for insert
  to anon, authenticated
  with check (
    status = 'pending'
    and (created_by is null or created_by = (select auth.uid()))
  );

drop policy if exists "Public can view approved places" on public.places;
create policy "Public can view approved places"
  on public.places
  for select
  to anon, authenticated
  using (status in ('approved', 'published'));

drop policy if exists "Authenticated users can view all places" on public.places;
create policy "Authenticated users can view all places"
  on public.places
  for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can update place review status" on public.places;
create policy "Authenticated users can update place review status"
  on public.places
  for update
  to authenticated
  using (true)
  with check (true);

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'place-images',
  'place-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view place images" on storage.objects;
create policy "Public can view place images"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'place-images');

drop policy if exists "Community can upload place images" on storage.objects;
create policy "Community can upload place images"
  on storage.objects
  for insert
  to anon, authenticated
  with check (
    bucket_id = 'place-images'
    and (
      (
        (select auth.uid()) is null
        and (storage.foldername(name))[1] in ('community-submissions', 'community-photos')
      )
      or (
        (select auth.uid()) is not null
        and (
          (storage.foldername(name))[1] in ('community-submissions', 'community-photos')
          or (storage.foldername(name))[1] = (select auth.uid())::text
        )
      )
    )
  );
