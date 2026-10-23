-- ============================================================
-- 011_user_profiles_and_interactions.sql
-- Run this script in Supabase Dashboard → SQL Editor → New Query → Run
-- Sets up:
--   1. profiles table (with full user details from sign-up)
--   2. Automatic user creation trigger from auth.users metadata
--   3. user_likes table (persists liked places from Explorer)
--   4. user_saved_places table (persists trip saved places from Explorer)
--   5. Row Level Security (RLS) policies for secure access
--   6. Public avatar storage bucket with per-user upload permissions
-- ============================================================

-- 1. Create profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  bio text,
  district text,
  travel_style text,
  favorite_categories text[] default '{}',
  experience_level text,
  languages text[] default '{}',
  website_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure all columns exist if the table was created earlier
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='username') then
    alter table public.profiles add column username text unique;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='display_name') then
    alter table public.profiles add column display_name text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='avatar_url') then
    alter table public.profiles add column avatar_url text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='bio') then
    alter table public.profiles add column bio text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='district') then
    alter table public.profiles add column district text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='travel_style') then
    alter table public.profiles add column travel_style text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='favorite_categories') then
    alter table public.profiles add column favorite_categories text[] default '{}';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='experience_level') then
    alter table public.profiles add column experience_level text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='languages') then
    alter table public.profiles add column languages text[] default '{}';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='website_url') then
    alter table public.profiles add column website_url text;
  end if;
end $$;

-- 2. Trigger function to auto-create profile on new user signup
create or replace function public.handle_new_user()
returns trigger as $$
declare
  raw_meta jsonb;
  v_username text;
  v_display_name text;
  v_avatar_url text;
  v_bio text;
  v_district text;
  v_travel_style text;
  v_experience text;
  v_website text;
  v_favs text[];
  v_langs text[];
begin
  raw_meta := coalesce(new.raw_user_meta_data, '{}'::jsonb);

  v_username := coalesce(raw_meta->>'username', split_part(new.email, '@', 1));
  v_display_name := coalesce(raw_meta->>'display_name', raw_meta->>'full_name', split_part(new.email, '@', 1));
  v_avatar_url := raw_meta->>'avatar_url';
  v_bio := raw_meta->>'bio';
  v_district := raw_meta->>'district';
  v_travel_style := raw_meta->>'travel_style';
  v_experience := raw_meta->>'experience_level';
  v_website := raw_meta->>'website_url';

  if jsonb_typeof(raw_meta->'favorite_categories') = 'array' then
    select coalesce(array_agg(elem), '{}'::text[])
    into v_favs
    from jsonb_array_elements_text(raw_meta->'favorite_categories') as elem;
  else
    v_favs := '{}'::text[];
  end if;

  if jsonb_typeof(raw_meta->'languages') = 'array' then
    select coalesce(array_agg(elem), '{}'::text[])
    into v_langs
    from jsonb_array_elements_text(raw_meta->'languages') as elem;
  else
    v_langs := '{}'::text[];
  end if;

  insert into public.profiles (
    id,
    username,
    display_name,
    avatar_url,
    bio,
    district,
    travel_style,
    favorite_categories,
    experience_level,
    languages,
    website_url
  )
  values (
    new.id,
    v_username,
    v_display_name,
    v_avatar_url,
    v_bio,
    v_district,
    v_travel_style,
    v_favs,
    v_experience,
    v_langs,
    v_website
  )
  on conflict (id) do update set
    username = coalesce(excluded.username, profiles.username),
    display_name = coalesce(excluded.display_name, profiles.display_name),
    avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url),
    bio = coalesce(excluded.bio, profiles.bio),
    district = coalesce(excluded.district, profiles.district),
    travel_style = coalesce(excluded.travel_style, profiles.travel_style),
    favorite_categories = case when array_length(excluded.favorite_categories, 1) > 0 then excluded.favorite_categories else profiles.favorite_categories end,
    experience_level = coalesce(excluded.experience_level, profiles.experience_level),
    languages = case when array_length(excluded.languages, 1) > 0 then excluded.languages else profiles.languages end,
    website_url = coalesce(excluded.website_url, profiles.website_url),
    updated_at = now();

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Create user_likes table
create table if not exists public.user_likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  place_id uuid references public.places(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  unique(user_id, place_id)
);

-- 4. Create user_saved_places (Trips) table
create table if not exists public.user_saved_places (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  place_id uuid references public.places(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  unique(user_id, place_id)
);

-- 5. Enable RLS
alter table public.profiles enable row level security;
alter table public.user_likes enable row level security;
alter table public.user_saved_places enable row level security;

-- Profiles RLS
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- User likes RLS
drop policy if exists "Users can view their own likes" on public.user_likes;
create policy "Users can view their own likes"
  on public.user_likes for select
  using (auth.uid() = user_id);

drop policy if exists "Users can add likes" on public.user_likes;
create policy "Users can add likes"
  on public.user_likes for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can remove likes" on public.user_likes;
create policy "Users can remove likes"
  on public.user_likes for delete
  using (auth.uid() = user_id);

-- User saved places (trips) RLS
drop policy if exists "Users can view their saved places" on public.user_saved_places;
create policy "Users can view their saved places"
  on public.user_saved_places for select
  using (auth.uid() = user_id);

drop policy if exists "Users can save places to trip" on public.user_saved_places;
create policy "Users can save places to trip"
  on public.user_saved_places for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can remove places from trip" on public.user_saved_places;
create policy "Users can remove places from trip"
  on public.user_saved_places for delete
  using (auth.uid() = user_id);

-- 6. Profile avatar storage
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Avatar images are publicly viewable" on storage.objects;
create policy "Avatar images are publicly viewable"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "Users can upload their own avatars" on storage.objects;
create policy "Users can upload their own avatars"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users can update their own avatars" on storage.objects;
create policy "Users can update their own avatars"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users can delete their own avatars" on storage.objects;
create policy "Users can delete their own avatars"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
