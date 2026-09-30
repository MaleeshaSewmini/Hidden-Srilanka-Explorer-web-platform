-- ============================================================
-- Hidden Lanka Explorer – Places Table
-- Run this entire script in:
-- Supabase Dashboard → SQL Editor → New Query → Run
-- ============================================================

-- 1. Create the places table
create table if not exists public.places (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),

  -- Core info
  name         text not null,
  slug         text not null unique,
  category     text not null,
  district     text not null,
  description  text not null,
  hidden_tips  text,

  -- Media
  image_url    text,

  -- Location
  latitude     double precision,
  longitude    double precision,

  -- Meta
  difficulty   text default 'Moderate',
  season       text default 'Year-Round',

  -- Moderation: pending | approved | rejected
  status       text not null default 'pending'
);

-- 2. Enable Row Level Security
alter table public.places enable row level security;

-- 3. Policy: anyone can read approved places
create policy "Public can view approved places"
  on public.places for select
  using (status = 'published');

-- 4. Policy: anyone can submit a place (it starts as pending)
create policy "Anyone can submit a place"
  on public.places for insert
  with check (true);
