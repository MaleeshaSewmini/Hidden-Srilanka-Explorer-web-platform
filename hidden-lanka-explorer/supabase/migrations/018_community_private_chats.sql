-- Private one-to-one chats for users with community profiles.
-- Run this migration against the project's Supabase database.

create table if not exists public.community_conversations (
  id uuid primary key default gen_random_uuid(),
  participant_one uuid not null references public.profiles(id) on delete cascade,
  participant_two uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint community_conversations_distinct_participants
    check (participant_one < participant_two),
  constraint community_conversations_unique_pair
    unique (participant_one, participant_two)
);

create table if not exists public.community_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.community_conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists community_conversations_participant_one_idx
  on public.community_conversations (participant_one, created_at desc);
create index if not exists community_conversations_participant_two_idx
  on public.community_conversations (participant_two, created_at desc);
create index if not exists community_messages_conversation_created_idx
  on public.community_messages (conversation_id, created_at);

alter table public.community_conversations enable row level security;
alter table public.community_messages enable row level security;

drop policy if exists "Participants can view their conversations"
  on public.community_conversations;
create policy "Participants can view their conversations"
  on public.community_conversations
  for select
  using (
    (select auth.uid()) = participant_one
    or (select auth.uid()) = participant_two
  );

drop policy if exists "Profile users can start conversations"
  on public.community_conversations;
create policy "Profile users can start conversations"
  on public.community_conversations
  for insert
  with check (
    (select auth.uid()) = participant_one
    or (select auth.uid()) = participant_two
  );

drop policy if exists "Participants can view conversation messages"
  on public.community_messages;
create policy "Participants can view conversation messages"
  on public.community_messages
  for select
  using (
    exists (
      select 1
      from public.community_conversations conversation
      where conversation.id = conversation_id
        and (
          (select auth.uid()) = conversation.participant_one
          or (select auth.uid()) = conversation.participant_two
        )
    )
  );

drop policy if exists "Participants can send conversation messages"
  on public.community_messages;
create policy "Participants can send conversation messages"
  on public.community_messages
  for insert
  with check (
    sender_id = (select auth.uid())
    and exists (
      select 1
      from public.community_conversations conversation
      where conversation.id = conversation_id
        and (
          (select auth.uid()) = conversation.participant_one
          or (select auth.uid()) = conversation.participant_two
        )
    )
  );

notify pgrst, 'reload schema';
