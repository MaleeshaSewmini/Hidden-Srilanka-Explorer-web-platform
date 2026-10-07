-- ============================================================
-- Hidden Lanka Explorer – Place Photos Community Contribution
-- Run this script in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Create table for community-contributed place photos
create table if not exists public.place_photos (
  id               uuid primary key default gen_random_uuid(),
  place_id         uuid not null references public.places(id) on delete cascade,
  image_url        text not null,
  caption          text,
  contributor_name text,
  status           text not null default 'pending', -- pending | approved | rejected
  created_at       timestamptz not null default now()
);

-- 2. Enable Row Level Security
alter table public.place_photos enable row level security;

-- 3. Policy: Public can view approved photos
drop policy if exists "Public can view approved photos" on public.place_photos;
create policy "Public can view approved photos"
  on public.place_photos for select
  using (status in ('approved', 'published'));

-- 4. Policy: Anyone can submit a photo (pending review)
drop policy if exists "Anyone can submit a place photo" on public.place_photos;
create policy "Anyone can submit a place photo"
  on public.place_photos for insert
  with check (true);

-- 5. Policy: Allow dashboard/moderators to view all photos
drop policy if exists "Allow reading all place photos for dashboard" on public.place_photos;
create policy "Allow reading all place photos for dashboard"
  on public.place_photos for select
  using (true);

-- 6. Policy: Allow updating photo review status
drop policy if exists "Allow updating photo status" on public.place_photos;
create policy "Allow updating photo status"
  on public.place_photos for update
  using (true)
  with check (true);

