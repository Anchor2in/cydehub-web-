create extension if not exists "uuid-ossp";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_public" on public.profiles
for select
to authenticated
using (true);

create policy "profiles_insert_own" on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create table if not exists public.listings (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text not null,
  category text not null,
  price_cents integer not null,
  currency text not null default 'USD',
  seller_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.listings enable row level security;

create policy "listings_select_public" on public.listings
for select
to anon, authenticated
using (true);

create policy "listings_insert_authenticated" on public.listings
for insert
to authenticated
with check (auth.uid() = seller_id);

create policy "listings_update_owner" on public.listings
for update
to authenticated
using (auth.uid() = seller_id)
with check (auth.uid() = seller_id);

create table if not exists public.blog_posts (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  content text not null,
  author_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.blog_posts enable row level security;

create policy "blog_select_public" on public.blog_posts
for select
to anon, authenticated
using (true);

create policy "blog_insert_authenticated" on public.blog_posts
for insert
to authenticated
with check (auth.uid() = author_id);

create table if not exists public.tournaments (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  game text not null,
  starts_at timestamptz not null,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.tournaments enable row level security;

create policy "tournaments_select_public" on public.tournaments
for select
to anon, authenticated
using (true);

create policy "tournaments_insert_authenticated" on public.tournaments
for insert
to authenticated
with check (auth.uid() = created_by);

create table if not exists public.chat_rooms (
  id uuid primary key default uuid_generate_v4(),
  title text,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.chat_rooms enable row level security;
alter table public.chat_messages enable row level security;

create policy "chat_rooms_select" on public.chat_rooms
for select
to authenticated
using (true);

create policy "chat_rooms_insert" on public.chat_rooms
for insert
to authenticated
with check (auth.uid() = created_by);

create policy "chat_messages_select" on public.chat_messages
for select
to authenticated
using (true);

create policy "chat_messages_insert" on public.chat_messages
for insert
to authenticated
with check (auth.uid() = sender_id);
