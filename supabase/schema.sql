-- ==============================================================================
-- NEXUS CHAT — PRODUCTION DATABASE SCHEMA (POSTGRESQL / SUPABASE)
-- Fully compliant with Row Level Security (RLS), Realtime, and Functions
-- ==============================================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. ENUMS
create type user_status_type as enum ('online', 'busy', 'away', 'offline');
create type conversation_type as enum ('direct', 'group', 'saved');
create type message_type as enum ('text', 'image', 'video', 'audio', 'voice_note', 'file', 'system');
create type message_status as enum ('sending', 'sent', 'delivered', 'read');
create type call_type as enum ('voice', 'video');
create type call_status as enum ('ringing', 'ongoing', 'ended', 'missed', 'declined');

-- 3. PROFILES TABLE (Extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  display_name text not null,
  email text not null,
  avatar_url text,
  banner_url text,
  bio text default '',
  status_text text default '',
  status user_status_type default 'offline',
  is_online boolean default false,
  last_seen timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. CONTACTS TABLE
create table if not exists public.contacts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  contact_id uuid references public.profiles(id) on delete cascade not null,
  nickname text,
  category text default 'General',
  is_favorite boolean default false,
  is_blocked boolean default false,
  created_at timestamptz default now(),
  unique (user_id, contact_id)
);

-- 5. CONVERSATIONS TABLE
create table if not exists public.conversations (
  id uuid default gen_random_uuid() primary key,
  type conversation_type default 'direct' not null,
  name text,
  avatar_url text,
  description text,
  created_by uuid references public.profiles(id) on delete set null,
  wallpaper text,
  accent_theme text,
  disappearing_seconds integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 6. CONVERSATION PARTICIPANTS
create table if not exists public.conversation_participants (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text default 'member', -- 'admin', 'member'
  joined_at timestamptz default now(),
  last_read_at timestamptz default now(),
  is_muted boolean default false,
  is_pinned boolean default false,
  is_archived boolean default false,
  unique (conversation_id, user_id)
);

-- 7. MESSAGES TABLE
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete set null not null,
  content text default '',
  type message_type default 'text' not null,
  reply_to_id uuid references public.messages(id) on delete set null,
  is_pinned boolean default false,
  is_starred boolean default false,
  is_edited boolean default false,
  is_deleted boolean default false,
  deleted_for_all boolean default false,
  status message_status default 'sent',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 8. MESSAGE ATTACHMENTS
create table if not exists public.message_attachments (
  id uuid default gen_random_uuid() primary key,
  message_id uuid references public.messages(id) on delete cascade not null,
  name text not null,
  url text not null,
  type text not null,
  size bigint not null,
  duration integer,
  created_at timestamptz default now()
);

-- 9. MESSAGE REACTIONS
create table if not exists public.message_reactions (
  id uuid default gen_random_uuid() primary key,
  message_id uuid references public.messages(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  emoji text not null,
  created_at timestamptz default now(),
  unique (message_id, user_id, emoji)
);

-- 10. CALL SESSIONS
create table if not exists public.calls (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade,
  caller_id uuid references public.profiles(id) on delete set null not null,
  type call_type default 'voice' not null,
  status call_status default 'ringing' not null,
  duration integer default 0,
  started_at timestamptz default now(),
  ended_at timestamptz
);

-- 11. CALL PARTICIPANTS
create table if not exists public.call_participants (
  id uuid default gen_random_uuid() primary key,
  call_id uuid references public.calls(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  status text default 'joined',
  joined_at timestamptz default now(),
  left_at timestamptz
);

-- 12. STATUS UPDATES (24-hour stories)
create table if not exists public.status_updates (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text check (type in ('text', 'image', 'video')) not null,
  content text not null,
  caption text,
  background_color text default '#6366f1',
  expires_at timestamptz default (now() + interval '24 hours'),
  created_at timestamptz default now()
);

-- 13. STATUS VIEWS
create table if not exists public.status_views (
  id uuid default gen_random_uuid() primary key,
  status_id uuid references public.status_updates(id) on delete cascade not null,
  viewer_id uuid references public.profiles(id) on delete cascade not null,
  viewed_at timestamptz default now(),
  unique (status_id, viewer_id)
);

-- 14. USER SETTINGS
create table if not exists public.user_settings (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  theme text default 'dark',
  accent_color text default '#6366f1',
  font_size text default 'medium',
  density text default 'comfortable',
  bubble_style text default 'modern',
  enter_to_send boolean default true,
  read_receipts boolean default true,
  last_seen_visibility text default 'everyone',
  online_status_visibility text default 'everyone',
  profile_photo_visibility text default 'everyone',
  sound_notifications boolean default true,
  desktop_notifications boolean default false,
  mute_all boolean default false,
  custom_wallpaper text default '',
  disappearing_default integer default 0,
  reduced_motion boolean default false,
  high_contrast boolean default false,
  updated_at timestamptz default now()
);

-- 15. NOTIFICATIONS
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null,
  title text not null,
  body text not null,
  data jsonb default '{}',
  is_read boolean default false,
  created_at timestamptz default now()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
alter table public.profiles enable row level security;
alter table public.contacts enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.message_attachments enable row level security;
alter table public.message_reactions enable row level security;
alter table public.calls enable row level security;
alter table public.call_participants enable row level security;
alter table public.status_updates enable row level security;
alter table public.status_views enable row level security;
alter table public.user_settings enable row level security;
alter table public.notifications enable row level security;

-- Profiles: Anyone authenticated can read profiles, only owner can update
create policy "Profiles viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Contacts: Users can only see and manage their own contacts
create policy "Users can manage own contacts" on public.contacts for all using (auth.uid() = user_id);

-- Conversations: Accessible only by conversation participants
create policy "Participants can view conversations" on public.conversations for select
  using (exists (select 1 from public.conversation_participants cp where cp.conversation_id = id and cp.user_id = auth.uid()));

-- Messages: Participants can read and insert messages
create policy "Participants can read messages" on public.messages for select
  using (exists (select 1 from public.conversation_participants cp where cp.conversation_id = conversation_id and cp.user_id = auth.uid()));

create policy "Participants can post messages" on public.messages for insert
  with check (exists (select 1 from public.conversation_participants cp where cp.conversation_id = conversation_id and cp.user_id = auth.uid()));

-- Settings: Only user can view and edit their settings
create policy "Users can manage own settings" on public.user_settings for all using (auth.uid() = user_id);

-- Notifications: Only recipient can view
create policy "Users can view own notifications" on public.notifications for all using (auth.uid() = user_id);

-- ==============================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER
-- ==============================================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  );

  insert into public.user_settings (user_id)
  values (new.id);

  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Realtime publications
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversations;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.status_updates;
