-- Bootstrap core schema so migration replays work on empty/shadow databases.
-- This migration is intentionally idempotent for existing linked environments.

create extension if not exists "pgcrypto";
create extension if not exists pg_trgm;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'listing_condition'
  ) then
    create type public.listing_condition as enum ('new', 'like_new', 'good', 'fair');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'listing_status'
  ) then
    create type public.listing_status as enum ('draft', 'active', 'sold', 'archived', 'removed');
  end if;
end $$;

create table if not exists public.universities (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text unique not null,
  short_name text not null,
  city text not null,
  province text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text unique not null,
  material_icon text,
  color_class text,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  university_id uuid references public.universities(id),
  avatar_url text,
  is_verified_student boolean not null default false,
  is_pioneer_seller boolean not null default false,
  pioneer_awarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 100),
  description text not null check (char_length(description) between 10 and 2000),
  search_vector tsvector generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
  ) stored,
  price numeric(12,2) not null check (price > 0 and price < 1000000),
  category_id uuid not null references public.categories(id),
  university_id uuid not null references public.universities(id),
  condition public.listing_condition,
  is_service boolean not null default false,
  featured boolean not null default false,
  status public.listing_status not null default 'active',
  last_bumped_at timestamptz not null default now(),
  view_count bigint not null default 0 check (view_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_user_id uuid references public.profiles(id) on delete set null,
  listing_id uuid references public.listings(id) on delete set null,
  conversation_id uuid,
  report_type text not null check (report_type in ('user', 'listing', 'conversation')),
  reason text not null,
  details text,
  created_at timestamptz not null default now()
);

create table if not exists public.blocked_users (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint blocked_users_no_self_block check (blocker_id <> blocked_id),
  primary key (blocker_id, blocked_id)
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversations_listing_buyer_unique unique (listing_id, buyer_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 4000),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now()
);

create index if not exists idx_listings_status_created
  on public.listings(status, created_at desc) where deleted_at is null;
create index if not exists idx_listings_category
  on public.listings(category_id) where deleted_at is null;
create index if not exists idx_listings_university
  on public.listings(university_id) where deleted_at is null;
create index if not exists idx_listings_seller on public.listings(seller_id);
create index if not exists idx_messages_conversation
  on public.messages(conversation_id, created_at desc);
create index if not exists idx_conversations_buyer
  on public.conversations(buyer_id, updated_at desc);
create index if not exists idx_conversations_seller
  on public.conversations(seller_id, updated_at desc);

alter table public.universities enable row level security;
alter table public.categories enable row level security;
alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.reports enable row level security;
alter table public.blocked_users enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'universities' and policyname = 'universities_public_read') then
    create policy "universities_public_read" on public.universities for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'categories' and policyname = 'categories_public_read') then
    create policy "categories_public_read" on public.categories for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_public_read') then
    create policy "profiles_public_read" on public.profiles for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_owner_insert') then
    create policy "profiles_owner_insert" on public.profiles for insert with check (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_owner_update') then
    create policy "profiles_owner_update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'listings' and policyname = 'listings_public_read') then
    create policy "listings_public_read" on public.listings for select using (status = 'active' and deleted_at is null);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'listings' and policyname = 'listings_owner_insert') then
    create policy "listings_owner_insert" on public.listings for insert with check (auth.uid() = seller_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'listings' and policyname = 'listings_owner_update') then
    create policy "listings_owner_update" on public.listings for update using (auth.uid() = seller_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'listings' and policyname = 'listings_owner_delete') then
    create policy "listings_owner_delete" on public.listings for delete using (auth.uid() = seller_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'reports' and policyname = 'reports_owner_insert') then
    create policy "reports_owner_insert" on public.reports for insert with check (auth.uid() = reporter_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'blocked_users' and policyname = 'blocked_users_owner_read') then
    create policy "blocked_users_owner_read" on public.blocked_users for select using (auth.uid() = blocker_id or auth.uid() = blocked_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'blocked_users' and policyname = 'blocked_users_owner_insert') then
    create policy "blocked_users_owner_insert" on public.blocked_users for insert with check (auth.uid() = blocker_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'blocked_users' and policyname = 'blocked_users_owner_delete') then
    create policy "blocked_users_owner_delete" on public.blocked_users for delete using (auth.uid() = blocker_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'conversations' and policyname = 'conversations_participant_select') then
    create policy "conversations_participant_select" on public.conversations for select using (auth.uid() = buyer_id or auth.uid() = seller_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'conversations' and policyname = 'conversations_buyer_insert') then
    create policy "conversations_buyer_insert" on public.conversations for insert with check (auth.uid() = buyer_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'messages' and policyname = 'messages_participant_select') then
    create policy "messages_participant_select" on public.messages
      for select using (
        exists (
          select 1
          from public.conversations c
          where c.id = messages.conversation_id
            and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
        )
      );
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'messages' and policyname = 'messages_participant_insert') then
    create policy "messages_participant_insert" on public.messages
      for insert with check (
        auth.uid() = sender_id
        and exists (
          select 1
          from public.conversations c
          where c.id = messages.conversation_id
            and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
        )
      );
  end if;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', null)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'on_auth_user_created'
      and tgrelid = 'auth.users'::regclass
  ) then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute procedure public.handle_new_user();
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgname = 'listings_updated_at'
      and tgrelid = 'public.listings'::regclass
  ) then
    create trigger listings_updated_at
      before update on public.listings
      for each row execute procedure public.set_updated_at();
  end if;
end $$;
