-- ============================================================
-- 016_personalized_trip_planner.sql
-- Personalized Location-Based Trip Planner & Notification System
-- Tables:
--   1. trips
--   2. trip_preferences
--   3. trip_destinations
--   4. trip_expenses
--   5. notifications
--   6. trip_reminders
--   7. trip_members
-- ============================================================

-- 1. TRIPS TABLE
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  start_location_name text not null default 'Colombo, Sri Lanka',
  start_latitude double precision not null default 6.9271,
  start_longitude double precision not null default 79.8612,
  start_date date,
  end_date date,
  duration_days integer not null default 1,
  traveler_count integer not null default 1,
  budget_currency text not null default 'LKR',
  total_budget double precision not null default 0,
  estimated_cost double precision not null default 0,
  transport_mode text not null default 'driving', -- 'driving', 'walking', 'cycling', 'transit'
  status text not null default 'planning', -- 'planning', 'ongoing', 'completed', 'cancelled'
  is_public boolean not null default false,
  share_token text unique default encode(gen_random_bytes(12), 'hex'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. TRIP PREFERENCES TABLE
create table if not exists public.trip_preferences (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references public.trips(id) on delete cascade not null unique,
  interests text[] not null default '{}',
  preferred_districts text[] not null default '{}',
  preferred_categories text[] not null default '{}',
  pace text not null default 'moderate', -- 'relaxed', 'moderate', 'packed'
  accommodation_tier text not null default 'mid_range', -- 'budget', 'mid_range', 'luxury'
  created_at timestamptz not null default now()
);

-- 3. TRIP DESTINATIONS TABLE (Ordered stops per day)
create table if not exists public.trip_destinations (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references public.trips(id) on delete cascade not null,
  place_id uuid references public.places(id) on delete cascade not null,
  day_number integer not null default 1,
  order_index integer not null default 0,
  visit_time_slot text not null default 'morning', -- 'morning', 'afternoon', 'sunset'
  planned_date date,
  notes text,
  is_visited boolean not null default false,
  visited_at timestamptz,
  created_at timestamptz not null default now()
);

-- 4. TRIP EXPENSES TABLE (Itemized budget calculator)
create table if not exists public.trip_expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references public.trips(id) on delete cascade not null,
  category text not null, -- 'transport', 'accommodation', 'food', 'entrance_fees', 'activities', 'other'
  title text not null,
  amount double precision not null default 0,
  is_estimated boolean not null default true,
  notes text,
  created_at timestamptz not null default now()
);

-- 5. NOTIFICATIONS TABLE (In-app notification system)
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  trip_id uuid references public.trips(id) on delete cascade,
  type text not null, -- 'trip_reminder', 'destination_reminder', 'weather_alert', 'place_recommendation', 'general'
  title text not null,
  message text not null,
  data jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- 6. TRIP REMINDERS TABLE (Scheduled reminders for trips & stops)
create table if not exists public.trip_reminders (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references public.trips(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  place_id uuid references public.places(id) on delete cascade,
  reminder_type text not null, -- 'trip_departure', 'packing', 'visit_stop', 'safety_alert'
  reminder_date timestamptz not null,
  title text not null,
  notes text,
  is_triggered boolean not null default false,
  created_at timestamptz not null default now()
);

-- 7. TRIP MEMBERS TABLE (Group trip collaboration)
create table if not exists public.trip_members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references public.trips(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null default 'editor', -- 'owner', 'editor', 'viewer'
  invited_email text,
  status text not null default 'accepted', -- 'pending', 'accepted'
  created_at timestamptz not null default now(),
  unique(trip_id, user_id)
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
create index if not exists idx_trips_user_id on public.trips(user_id);
create index if not exists idx_trips_share_token on public.trips(share_token);
create index if not exists idx_trip_dest_trip_id on public.trip_destinations(trip_id);
create index if not exists idx_trip_dest_day on public.trip_destinations(trip_id, day_number, order_index);
create index if not exists idx_trip_expenses_trip_id on public.trip_expenses(trip_id);
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_unread on public.notifications(user_id, is_read);
create index if not exists idx_trip_reminders_user_date on public.trip_reminders(user_id, reminder_date);
create index if not exists idx_trip_members_trip on public.trip_members(trip_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
alter table public.trips enable row level security;
alter table public.trip_preferences enable row level security;
alter table public.trip_destinations enable row level security;
alter table public.trip_expenses enable row level security;
alter table public.notifications enable row level security;
alter table public.trip_reminders enable row level security;
alter table public.trip_members enable row level security;

-- TRIPS POLICIES
drop policy if exists "Users can view own trips or public/shared trips" on public.trips;
create policy "Users can view own trips or public/shared trips"
  on public.trips for select
  using (
    auth.uid() = user_id
    or is_public = true
    or exists (select 1 from public.trip_members where trip_id = public.trips.id and user_id = auth.uid())
  );

drop policy if exists "Users can insert own trips" on public.trips;
create policy "Users can insert own trips"
  on public.trips for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own trips or edit as member" on public.trips;
create policy "Users can update own trips or edit as member"
  on public.trips for update
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.trip_members
      where trip_id = public.trips.id and user_id = auth.uid() and role in ('owner', 'editor')
    )
  );

drop policy if exists "Users can delete own trips" on public.trips;
create policy "Users can delete own trips"
  on public.trips for delete
  using (auth.uid() = user_id);

-- TRIP PREFERENCES POLICIES
drop policy if exists "Trip preferences access matches trip" on public.trip_preferences;
create policy "Trip preferences access matches trip"
  on public.trip_preferences for all
  using (
    exists (
      select 1 from public.trips
      where id = public.trip_preferences.trip_id
      and (
        user_id = auth.uid()
        or is_public = true
        or exists (select 1 from public.trip_members where trip_id = public.trips.id and user_id = auth.uid())
      )
    )
  );

-- TRIP DESTINATIONS POLICIES
drop policy if exists "Trip destinations viewable if trip accessible" on public.trip_destinations;
create policy "Trip destinations viewable if trip accessible"
  on public.trip_destinations for select
  using (
    exists (
      select 1 from public.trips
      where id = public.trip_destinations.trip_id
      and (
        user_id = auth.uid()
        or is_public = true
        or exists (select 1 from public.trip_members where trip_id = public.trips.id and user_id = auth.uid())
      )
    )
  );

drop policy if exists "Trip destinations editable by owner or editor" on public.trip_destinations;
create policy "Trip destinations editable by owner or editor"
  on public.trip_destinations for insert
  with check (
    exists (
      select 1 from public.trips
      where id = public.trip_destinations.trip_id
      and (
        user_id = auth.uid()
        or exists (select 1 from public.trip_members where trip_id = public.trips.id and user_id = auth.uid() and role in ('owner', 'editor'))
      )
    )
  );

drop policy if exists "Trip destinations updatable by owner or editor" on public.trip_destinations;
create policy "Trip destinations updatable by owner or editor"
  on public.trip_destinations for update
  using (
    exists (
      select 1 from public.trips
      where id = public.trip_destinations.trip_id
      and (
        user_id = auth.uid()
        or exists (select 1 from public.trip_members where trip_id = public.trips.id and user_id = auth.uid() and role in ('owner', 'editor'))
      )
    )
  );

drop policy if exists "Trip destinations deletable by owner or editor" on public.trip_destinations;
create policy "Trip destinations deletable by owner or editor"
  on public.trip_destinations for delete
  using (
    exists (
      select 1 from public.trips
      where id = public.trip_destinations.trip_id
      and (
        user_id = auth.uid()
        or exists (select 1 from public.trip_members where trip_id = public.trips.id and user_id = auth.uid() and role in ('owner', 'editor'))
      )
    )
  );

-- TRIP EXPENSES POLICIES
drop policy if exists "Trip expenses accessible by trip members" on public.trip_expenses;
create policy "Trip expenses accessible by trip members"
  on public.trip_expenses for all
  using (
    exists (
      select 1 from public.trips
      where id = public.trip_expenses.trip_id
      and (
        user_id = auth.uid()
        or exists (select 1 from public.trip_members where trip_id = public.trips.id and user_id = auth.uid())
      )
    )
  );

-- NOTIFICATIONS POLICIES
drop policy if exists "Users can view own notifications" on public.notifications;
create policy "Users can view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert notifications for self" on public.notifications;
create policy "Users can insert notifications for self"
  on public.notifications for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own notifications" on public.notifications;
create policy "Users can delete own notifications"
  on public.notifications for delete
  using (auth.uid() = user_id);

-- TRIP REMINDERS POLICIES
drop policy if exists "Users can manage own reminders" on public.trip_reminders;
create policy "Users can manage own reminders"
  on public.trip_reminders for all
  using (auth.uid() = user_id);

-- TRIP MEMBERS POLICIES
drop policy if exists "Trip members viewable by trip participants" on public.trip_members;
create policy "Trip members viewable by trip participants"
  on public.trip_members for select
  using (
    user_id = auth.uid()
    or exists (select 1 from public.trips where id = public.trip_members.trip_id and user_id = auth.uid())
  );

drop policy if exists "Trip owners can manage trip members" on public.trip_members;
create policy "Trip owners can manage trip members"
  on public.trip_members for insert
  with check (
    exists (select 1 from public.trips where id = public.trip_members.trip_id and user_id = auth.uid())
  );

drop policy if exists "Trip owners can delete members" on public.trip_members;
create policy "Trip owners can delete members"
  on public.trip_members for delete
  using (
    user_id = auth.uid()
    or exists (select 1 from public.trips where id = public.trip_members.trip_id and user_id = auth.uid())
  );

