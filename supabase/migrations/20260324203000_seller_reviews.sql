create table if not exists public.seller_reviews (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete set null,
  rating int not null check (rating between 1 and 5),
  review_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint seller_reviews_no_self check (seller_id <> reviewer_id),
  constraint seller_reviews_unique_reviewer_seller unique (seller_id, reviewer_id)
);

create index if not exists idx_seller_reviews_seller_created
  on public.seller_reviews (seller_id, created_at desc);

create index if not exists idx_seller_reviews_reviewer
  on public.seller_reviews (reviewer_id);

alter table public.seller_reviews enable row level security;

create policy "seller_reviews_public_read" on public.seller_reviews
  for select using (true);

create policy "seller_reviews_reviewer_insert" on public.seller_reviews
  for insert with check (
    auth.uid() = reviewer_id
    and auth.uid() <> seller_id
  );

create policy "seller_reviews_reviewer_update" on public.seller_reviews
  for update using (auth.uid() = reviewer_id)
  with check (auth.uid() = reviewer_id);

create policy "seller_reviews_reviewer_delete" on public.seller_reviews
  for delete using (auth.uid() = reviewer_id);

create trigger seller_reviews_updated_at
  before update on public.seller_reviews
  for each row execute procedure public.set_updated_at();
