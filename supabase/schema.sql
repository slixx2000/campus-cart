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
create policy "profiles_owner_update"   on public.profiles for update using (auth.uid() = id);

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

alter table public.listings enable row level security;
create policy "listings_public_read" on public.listings
  for select using (status = 'active' and deleted_at is null);
create policy "listings_owner_insert" on public.listings
  for insert with check (auth.uid() = seller_id);
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
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references public.listings(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason      text not null,
  details     text,
  created_at  timestamptz not null default now()
);
alter table public.reports enable row level security;
create policy "reports_owner_insert" on public.reports
  for insert with check (auth.uid() = reporter_id);

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
