-- ============================================================
-- CampusCart Supabase Schema Migration
-- Run this in the Supabase SQL editor or via supabase migrate
-- ============================================================

-- ─── Extensions ──────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ─── Enums ───────────────────────────────────────────────────
create type public.listing_condition as enum ('new', 'like_new', 'good', 'fair');
create type public.listing_status    as enum ('draft', 'active', 'sold', 'archived', 'removed');

-- ─── Reference Tables ────────────────────────────────────────
create table public.universities (
  id          uuid primary key default gen_random_uuid(),
  code        text unique not null,
  name        text unique not null,
  short_name  text not null,
  city        text not null,
  province    text not null,
  created_at  timestamptz not null default now()
);
alter table public.universities enable row level security;
create policy "universities_public_read" on public.universities
  for select using (true);

create table public.categories (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  name          text unique not null,
  material_icon text,
  color_class   text,
  created_at    timestamptz not null default now()
);
alter table public.categories enable row level security;
create policy "categories_public_read" on public.categories
  for select using (true);

-- ─── User Profiles ───────────────────────────────────────────
create table public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  full_name           text not null,
  phone               text,
  university_id       uuid references public.universities(id),
  avatar_url          text,
  is_verified_student boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles_public_read"    on public.profiles for select using (true);
create policy "profiles_owner_insert"   on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_owner_update"   on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Auto-create a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', null)
  );
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Listings ────────────────────────────────────────────────
create table public.listings (
  id            uuid primary key default gen_random_uuid(),
  seller_id     uuid not null references public.profiles(id) on delete cascade,
  title         text not null check (char_length(title) between 3 and 100),
  description   text not null check (char_length(description) between 10 and 2000),
  price         numeric(12,2) not null check (price > 0 and price < 1000000),
  category_id   uuid not null references public.categories(id),
  university_id uuid not null references public.universities(id),
  condition     public.listing_condition,
  is_service    boolean not null default false,
  featured      boolean not null default false,
  status        public.listing_status not null default 'active',
  last_bumped_at timestamptz not null default now(),
  view_count     bigint not null default 0 check (view_count >= 0),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

-- Indexes for common query patterns
create index idx_listings_status_created   on public.listings(status, created_at desc) where deleted_at is null;
create index idx_listings_category         on public.listings(category_id) where deleted_at is null;
create index idx_listings_university       on public.listings(university_id) where deleted_at is null;
create index idx_listings_seller           on public.listings(seller_id);
create index idx_listings_featured         on public.listings(featured) where status = 'active' and deleted_at is null;
create index idx_listings_recent_activity  on public.listings(last_bumped_at desc) where status = 'active' and deleted_at is null;
create index idx_listings_feed_status_bump on public.listings(status, last_bumped_at desc) where status = 'active' and deleted_at is null;
create index idx_listings_feed_university_bump on public.listings(university_id, last_bumped_at desc) where status = 'active' and deleted_at is null;

alter table public.listings enable row level security;
create policy "listings_public_read" on public.listings
  for select using (status = 'active' and deleted_at is null);
create policy "listings_owner_insert" on public.listings
  for insert with check (
    auth.uid() = seller_id
    and (
      select count(*)
      from public.listings l
      where l.seller_id = auth.uid()
        and l.created_at >= (now() - interval '1 hour')
    ) < 10
  );
create policy "listings_owner_update" on public.listings
  for update using (auth.uid() = seller_id);
create policy "listings_owner_delete" on public.listings
  for delete using (auth.uid() = seller_id);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger listings_updated_at
  before update on public.listings
  for each row execute procedure public.set_updated_at();

-- Atomic view counter used by the product detail page.
create or replace function public.increment_listing_view(p_listing_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.listings
  set view_count = view_count + 1
  where id = p_listing_id
    and deleted_at is null;
end;
$$;

create table public.listing_bump_events (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  request_id text not null,
  bumped_at timestamptz not null default now(),
  constraint listing_bump_events_request_unique unique (listing_id, user_id, request_id)
);

create index idx_listing_bump_events_listing_bumped on public.listing_bump_events(listing_id, bumped_at desc);
alter table public.listing_bump_events enable row level security;
create policy "listing_bump_events_owner_read" on public.listing_bump_events
  for select using (auth.uid() = user_id);
create policy "listing_bump_events_owner_insert" on public.listing_bump_events
  for insert with check (auth.uid() = user_id);

create or replace function public.bump_listing(p_listing_id uuid, p_request_id text default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_listing public.listings%rowtype;
begin
  if auth.uid() is null then
    raise exception 'You must sign in to bump listings.';
  end if;

  select *
  into v_listing
  from public.listings
  where id = p_listing_id
  for update;

  if not found then
    raise exception 'Listing not found.';
  end if;

  if p_request_id is not null and exists (
    select 1
    from public.listing_bump_events e
    where e.listing_id = p_listing_id
      and e.user_id = auth.uid()
      and e.request_id = p_request_id
  ) then
    return;
  end if;

  if v_listing.seller_id <> auth.uid() then
    raise exception 'Only the listing owner can bump this listing.';
  end if;

  if v_listing.status <> 'active' or v_listing.deleted_at is not null then
    raise exception 'Only active listings can be bumped.';
  end if;

  if v_listing.last_bumped_at > now() - interval '24 hours' then
    raise exception 'You can only bump this listing once every 24 hours.';
  end if;

  update public.listings
  set last_bumped_at = now()
  where id = p_listing_id;

  if p_request_id is not null then
    insert into public.listing_bump_events(listing_id, user_id, request_id)
    values (p_listing_id, auth.uid(), p_request_id)
    on conflict do nothing;
  end if;
end;
$$;

grant execute on function public.bump_listing(uuid, text) to authenticated;

-- ─── Listing Images ──────────────────────────────────────────
create table public.listing_images (
  id           uuid primary key default gen_random_uuid(),
  listing_id   uuid not null references public.listings(id) on delete cascade,
  storage_path text not null,
  public_url   text,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);
alter table public.listing_images enable row level security;
create policy "listing_images_public_read" on public.listing_images
  for select using (true);
create policy "listing_images_owner_insert" on public.listing_images
  for insert with check (
    auth.uid() = (select seller_id from public.listings where id = listing_id)
  );
create policy "listing_images_owner_delete" on public.listing_images
  for delete using (
    auth.uid() = (select seller_id from public.listings where id = listing_id)
  );

-- ─── Favorites ───────────────────────────────────────────────
create table public.favorites (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);
alter table public.favorites enable row level security;
create policy "favorites_owner_all" on public.favorites
  using (auth.uid() = user_id);

-- ─── Reports ─────────────────────────────────────────────────
create table public.reports (
  id               uuid primary key default gen_random_uuid(),
  reporter_id      uuid not null references public.profiles(id) on delete cascade,
  reported_user_id uuid references public.profiles(id) on delete set null,
  listing_id       uuid references public.listings(id) on delete set null,
  conversation_id  uuid,
  report_type      text not null check (report_type in ('user', 'listing', 'conversation')),
  reason           text not null,
  details          text,
  created_at       timestamptz not null default now()
);
alter table public.reports enable row level security;
create policy "reports_owner_insert" on public.reports
  for insert with check (auth.uid() = reporter_id);

create unique index reports_unique_listing_report
  on public.reports(reporter_id, listing_id)
  where report_type = 'listing' and listing_id is not null;

create unique index reports_unique_user_report
  on public.reports(reporter_id, reported_user_id)
  where report_type = 'user' and reported_user_id is not null;

-- ─── Blocked Users ──────────────────────────────────────────
-- A single directional edge: blocker_id -> blocked_id.
-- If either direction exists between two users, messaging is disabled for both.
create table public.blocked_users (
  blocker_id  uuid not null references public.profiles(id) on delete cascade,
  blocked_id  uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  constraint blocked_users_no_self_block check (blocker_id <> blocked_id),
  primary key (blocker_id, blocked_id)
);

create index idx_blocked_users_blocked on public.blocked_users(blocked_id);

alter table public.blocked_users enable row level security;
create policy "blocked_users_owner_read" on public.blocked_users
  for select using (auth.uid() = blocker_id or auth.uid() = blocked_id);
create policy "blocked_users_owner_insert" on public.blocked_users
  for insert with check (auth.uid() = blocker_id);
create policy "blocked_users_owner_delete" on public.blocked_users
  for delete using (auth.uid() = blocker_id);

-- ─── Reference Data Seed ─────────────────────────────────────
insert into public.universities (code, name, short_name, city, province) values
  ('unza',      'University of Zambia',                    'UNZA',     'Lusaka', 'Lusaka'),
  ('cbu',       'Copperbelt University',                   'CBU',      'Kitwe',  'Copperbelt'),
  ('mu',        'Mulungushi University',                   'MU',       'Kabwe',  'Central'),
  ('northrise', 'Northrise University',                    'Northrise','Ndola',  'Copperbelt'),
  ('cavendish', 'Cavendish University Zambia',             'CUZ',      'Lusaka', 'Lusaka'),
  ('dmmu',      'Dag Hammarskjöld University',             'DMMU',     'Lusaka', 'Lusaka'),
  ('lamu',      'Lusaka Apex Medical University',          'LAMU',     'Lusaka', 'Lusaka'),
  ('zica',      'Zambia Institute of Chartered Accountants','ZICA',    'Lusaka', 'Lusaka');

insert into public.categories (slug, name, material_icon, color_class) values
  ('food-drinks',        'Food & Drinks',         'restaurant',    'bg-orange-100 text-orange-600'),
  ('clothing-fashion',   'Clothing & Fashion',    'checkroom',     'bg-purple-100 text-purple-600'),
  ('electronics',        'Electronics',           'devices',       'bg-blue-100 text-blue-600'),
  ('books-stationery',   'Books & Stationery',    'auto_stories',  'bg-yellow-100 text-yellow-600'),
  ('services',           'Services',              'construction',  'bg-teal-100 text-teal-600'),
  ('beauty-personal',    'Beauty & Personal Care','spa',           'bg-pink-100 text-pink-600'),
  ('sports-fitness',     'Sports & Fitness',      'sports_soccer', 'bg-green-100 text-green-600'),
  ('home-dorm',          'Home & Dorm',           'chair_alt',     'bg-indigo-100 text-indigo-600'),
  ('tutoring',           'Tutoring',              'school',        'bg-red-100 text-red-600'),
  ('other',              'Other',                 'inventory_2',   'bg-slate-100 text-slate-600');

-- ─── Conversations ───────────────────────────────────────────
-- One conversation per (listing, buyer) pair. A buyer can only start
-- one thread per listing; the seller is denormalized for fast access.
create table public.conversations (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references public.listings(id) on delete cascade,
  buyer_id    uuid not null references public.profiles(id) on delete cascade,
  seller_id   uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint conversations_listing_buyer_unique unique (listing_id, buyer_id)
);

create index idx_conversations_buyer  on public.conversations(buyer_id, updated_at desc);
create index idx_conversations_seller on public.conversations(seller_id, updated_at desc);

alter table public.conversations enable row level security;
-- Only participants can view their conversations
create policy "conversations_participant_select" on public.conversations
  for select using (auth.uid() = buyer_id or auth.uid() = seller_id);
-- Only the buyer can create a conversation (they are the initiator)
create policy "conversations_buyer_insert" on public.conversations
  for insert with check (
    auth.uid() = buyer_id
    and not exists (
      select 1
      from public.blocked_users b
      where (b.blocker_id = buyer_id and b.blocked_id = seller_id)
         or (b.blocker_id = seller_id and b.blocked_id = buyer_id)
    )
  );

-- Auto-bump updated_at when a message is sent
create or replace function public.touch_conversation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.conversations set updated_at = now() where id = new.conversation_id;

  -- Liquidity loop: every message bumps listing activity so recently active
  -- feeds can surface listings that are actively being discussed.
  update public.listings
  set last_bumped_at = now()
  where id = (
    select c.listing_id
    from public.conversations c
    where c.id = new.conversation_id
  );

  return new;
end;
$$;

-- ─── Messages ────────────────────────────────────────────────
-- expires_at defaults to 24 hours after creation; the frontend must
-- never render messages where expires_at < current time.
create table public.messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.conversations(id) on delete cascade,
  sender_id        uuid not null references public.profiles(id) on delete cascade,
  content          text not null check (char_length(content) between 1 and 4000),
  expires_at       timestamptz not null default (now() + interval '24 hours'),
  created_at       timestamptz not null default now()
);

create index idx_messages_conversation on public.messages(conversation_id, created_at desc);

alter table public.messages enable row level security;

-- Only participants of the parent conversation can see messages
create policy "messages_participant_select" on public.messages
  for select using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );

-- Only a participant who is also the sender can insert
create policy "messages_participant_insert" on public.messages
  for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
    and not exists (
      select 1
      from public.conversations c
      join public.blocked_users b
        on (
          (b.blocker_id = c.buyer_id and b.blocked_id = c.seller_id)
          or (b.blocker_id = c.seller_id and b.blocked_id = c.buyer_id)
        )
      where c.id = messages.conversation_id
    )
  );

create trigger messages_touch_conversation
  after insert on public.messages
  for each row execute procedure public.touch_conversation();

-- Enable Supabase Realtime for the messages table so clients can
-- subscribe to live INSERTs via postgres_changes.
alter publication supabase_realtime add table public.messages;

-- ─── Storage Bucket ──────────────────────────────────────────
-- Run in Supabase Dashboard > Storage, or via management API:
--   Bucket name: listing-images
--   Public: true
-- Storage policy (SQL):
insert into storage.buckets (id, name, public) values ('listing-images', 'listing-images', true)
  on conflict (id) do nothing;

create policy "listing_images_public_read_storage" on storage.objects
  for select using (bucket_id = 'listing-images');
create policy "listing_images_auth_insert_storage" on storage.objects
  for insert with check (bucket_id = 'listing-images' and auth.role() = 'authenticated');
create policy "listing_images_owner_delete_storage" on storage.objects
  for delete using (bucket_id = 'listing-images' and auth.uid()::text = (storage.foldername(name))[1]);
