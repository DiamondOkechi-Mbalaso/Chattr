-- ==============================================================================
-- CHATTR — PRODUCTION POSTGRESQL DATABASE SCHEMA
-- Fully compatible with Supabase, Neon, AWS RDS, and local PostgreSQL
-- ==============================================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. ENUMS
do $$ begin
  create type user_status_type as enum ('online', 'busy', 'away', 'offline');
exception when duplicate_object then null; end $$;

do $$ begin
  create type conversation_type as enum ('direct', 'group', 'saved');
exception when duplicate_object then null; end $$;

do $$ begin
  create type message_type as enum ('text', 'image', 'video', 'audio', 'voice_note', 'file', 'system');
exception when duplicate_object then null; end $$;

do $$ begin
  create type message_status as enum ('sending', 'sent', 'delivered', 'read');
exception when duplicate_object then null; end $$;

do $$ begin
  create type call_type as enum ('voice', 'video');
exception when duplicate_object then null; end $$;

do $$ begin
  create type call_status as enum ('ringing', 'ongoing', 'ended', 'missed', 'declined');
exception when duplicate_object then null; end $$;

-- 3. PROFILES TABLE (Users)
create table if not exists public.profiles (
  id text primary key default gen_random_uuid()::text,
  username text unique not null,
  display_name text not null,
  email text not null,
  phone text,
  avatar_url text,
  banner_url text,
  bio text default '',
  status_text text default '',
  status text default 'online',
  is_online boolean default true,
  last_seen timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. CONTACTS TABLE
create table if not exists public.contacts (
  id text primary key default gen_random_uuid()::text,
  user_id text references public.profiles(id) on delete cascade not null,
  contact_id text references public.profiles(id) on delete cascade not null,
  nickname text,
  category text default 'General',
  is_favorite boolean default false,
  is_blocked boolean default false,
  created_at timestamptz default now(),
  unique (user_id, contact_id)
);

-- 5. CONVERSATIONS TABLE
create table if not exists public.conversations (
  id text primary key default gen_random_uuid()::text,
  type text default 'direct' not null,
  name text,
  avatar_url text,
  description text,
  created_by text references public.profiles(id) on delete set null,
  wallpaper text,
  accent_theme text,
  disappearing_seconds integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 6. CONVERSATION PARTICIPANTS
create table if not exists public.conversation_participants (
  id text primary key default gen_random_uuid()::text,
  conversation_id text references public.conversations(id) on delete cascade not null,
  user_id text references public.profiles(id) on delete cascade not null,
  role text default 'member',
  joined_at timestamptz default now(),
  last_read_at timestamptz default now(),
  is_muted boolean default false,
  is_pinned boolean default false,
  is_archived boolean default false,
  unique (conversation_id, user_id)
);

-- 7. MESSAGES TABLE
create table if not exists public.messages (
  id text primary key default gen_random_uuid()::text,
  conversation_id text references public.conversations(id) on delete cascade not null,
  sender_id text references public.profiles(id) on delete set null not null,
  content text default '',
  type text default 'text' not null,
  reply_to_id text references public.messages(id) on delete set null,
  is_pinned boolean default false,
  is_starred boolean default false,
  is_edited boolean default false,
  is_deleted boolean default false,
  deleted_for_all boolean default false,
  status text default 'sent',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 8. MESSAGE ATTACHMENTS
create table if not exists public.message_attachments (
  id text primary key default gen_random_uuid()::text,
  message_id text references public.messages(id) on delete cascade not null,
  name text not null,
  url text not null,
  type text not null,
  size bigint not null default 0,
  duration integer,
  created_at timestamptz default now()
);

-- 9. CALL SESSIONS
create table if not exists public.calls (
  id text primary key default gen_random_uuid()::text,
  conversation_id text references public.conversations(id) on delete cascade,
  caller_id text references public.profiles(id) on delete set null not null,
  type text default 'voice' not null,
  status text default 'ringing' not null,
  duration integer default 0,
  started_at timestamptz default now(),
  ended_at timestamptz
);

-- 10. STATUS UPDATES (Stories)
create table if not exists public.status_updates (
  id text primary key default gen_random_uuid()::text,
  user_id text references public.profiles(id) on delete cascade not null,
  type text check (type in ('text', 'image', 'video')) not null,
  content text not null,
  caption text,
  background_color text default '#ff6b00',
  expires_at timestamptz default (now() + interval '24 hours'),
  created_at timestamptz default now()
);

-- Enable Row Level Security (RLS) but allow anonymous operations with Anon Key
alter table public.profiles enable row level security;
alter table public.contacts enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.message_attachments enable row level security;
alter table public.calls enable row level security;
alter table public.status_updates enable row level security;

-- Public Access policies (anon key enabled)
create policy "Allow all profiles" on public.profiles for all using (true) with check (true);
create policy "Allow all contacts" on public.contacts for all using (true) with check (true);
create policy "Allow all conversations" on public.conversations for all using (true) with check (true);
create policy "Allow all participants" on public.conversation_participants for all using (true) with check (true);
create policy "Allow all messages" on public.messages for all using (true) with check (true);
create policy "Allow all attachments" on public.message_attachments for all using (true) with check (true);
create policy "Allow all calls" on public.calls for all using (true) with check (true);
create policy "Allow all status updates" on public.status_updates for all using (true) with check (true);

-- Realtime publications
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when others then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.profiles;
exception when others then null; end $$;
