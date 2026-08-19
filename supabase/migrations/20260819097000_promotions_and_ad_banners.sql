-- Monetization plumbing: paid featured placement and banner ad slots.
--
-- No payment gateway yet — an admin grants a promotion after being paid over
-- mobile money. The point of doing the plumbing first is that Phase A already
-- made `featured` and `last_bumped_at` unwritable by sellers, so placement is
-- finally worth paying for.
--
-- Design note: `listing_promotions` is the source of truth (it carries the time
-- window, the amount and who granted it); `listings.featured` stays as a
-- *derived cache* rather than being replaced by a `featured_until` column.
-- That is deliberate — the shipped v1.1.0 APK queries `.eq('featured', true)`,
-- and dropping the column would break its home carousel. The cache is written
-- synchronously by the grant/end functions, and `refresh_featured_listings()`
-- handles natural expiry, so it can only be stale for expiries, by at most a day.

create table if not exists public.listing_promotions (
  id            uuid primary key default gen_random_uuid(),
  listing_id    uuid not null references public.listings(id) on delete cascade,
  kind          text not null default 'featured' check (kind in ('featured')),
  starts_at     timestamptz not null default now(),
  ends_at       timestamptz not null,
  amount_kwacha numeric(10, 2),
  note          text,
  granted_by    uuid not null references public.profiles(id),
  created_at    timestamptz not null default now(),
  -- >= not >: ending a promotion sets ends_at = now(), and a promotion granted
  -- and cancelled in the same transaction has starts_at = now() too. A
  -- zero-length window is a valid "cancelled immediately" record, and the
  -- active test (now() >= starts_at and now() < ends_at) still excludes it.
  constraint listing_promotions_window check (ends_at >= starts_at)
);

create index if not exists idx_listing_promotions_active
  on public.listing_promotions (listing_id, ends_at desc);

alter table public.listing_promotions enable row level security;

-- Admins can see what has been sold. Nobody else touches this table directly;
-- all writes go through the definer functions below.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'listing_promotions'
      and policyname = 'listing_promotions_admin_read'
  ) then
    -- `to authenticated` matters: policy expressions are evaluated with the
    -- caller's privileges, and anon can no longer read profiles.is_admin
    -- (migration 20260819096000). Without this, an anonymous query against the
    -- table errors with "permission denied for table profiles" instead of
    -- simply returning nothing.
    create policy "listing_promotions_admin_read" on public.listing_promotions
      for select to authenticated using (
        exists (select 1 from public.profiles p
                where p.id = auth.uid() and p.is_admin = true)
      );
  end if;
end $$;

revoke insert, update, delete on public.listing_promotions from anon, authenticated;

-- ─── Banner ad slots ─────────────────────────────────────────────────────────
create table if not exists public.ad_banners (
  id         uuid primary key default gen_random_uuid(),
  placement  text not null check (placement in ('home', 'browse')),
  title      text not null,
  image_url  text not null,
  target_url text not null,
  advertiser text,
  starts_at  timestamptz not null default now(),
  ends_at    timestamptz not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint ad_banners_window check (ends_at > starts_at)
);

create index if not exists idx_ad_banners_live
  on public.ad_banners (placement, sort_order);

alter table public.ad_banners enable row level security;

-- Anyone may read a banner that is currently running; expired and future ones
-- are invisible without needing a cleanup job.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'ad_banners'
      and policyname = 'ad_banners_live_read'
  ) then
    create policy "ad_banners_live_read" on public.ad_banners
      for select using (now() >= starts_at and now() < ends_at);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'ad_banners'
      and policyname = 'ad_banners_admin_all'
  ) then
    -- Same reason as above — and here it is user-facing: without `to
    -- authenticated`, evaluating this policy as anon errors the whole query, so
    -- logged-out visitors would see no banners at all.
    create policy "ad_banners_admin_all" on public.ad_banners
      for all to authenticated using (
        exists (select 1 from public.profiles p
                where p.id = auth.uid() and p.is_admin = true)
      );
  end if;
end $$;

-- ─── Keeping the `featured` cache honest ─────────────────────────────────────
create or replace function public.refresh_featured_listings()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_changed integer;
begin
  update public.listings l
  set featured = p.active, updated_at = now()
  from (
    select l2.id,
           exists (
             select 1 from public.listing_promotions pr
             where pr.listing_id = l2.id
               and now() >= pr.starts_at
               and now() < pr.ends_at
           ) as active
    from public.listings l2
  ) p
  where p.id = l.id and l.featured is distinct from p.active;

  get diagnostics v_changed = row_count;
  return v_changed;
end;
$$;

revoke all on function public.refresh_featured_listings() from public, anon, authenticated;

create or replace function public.admin_grant_listing_promotion(
  p_listing_id uuid,
  p_days       integer,
  p_amount     numeric default null,
  p_note       text default null
)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ends timestamptz;
begin
  if not exists (select 1 from public.profiles p
                 where p.id = auth.uid() and p.is_admin = true) then
    raise exception 'Admin access required.';
  end if;

  if p_days is null or p_days < 1 then
    raise exception 'Promotion length must be at least one day.';
  end if;

  if not exists (select 1 from public.listings
                 where id = p_listing_id and deleted_at is null) then
    raise exception 'Listing not found.';
  end if;

  -- Extend from the current end date rather than from today, so buying a second
  -- week mid-run adds seven days instead of overwriting. Each purchase stays a
  -- separate row — that is the audit trail of what was actually sold.
  select max(ends_at) into v_ends
  from public.listing_promotions
  where listing_id = p_listing_id and now() < ends_at;

  v_ends := coalesce(v_ends, now()) + make_interval(days => p_days);

  insert into public.listing_promotions
    (listing_id, kind, starts_at, ends_at, amount_kwacha, note, granted_by)
  values
    (p_listing_id, 'featured', now(), v_ends, p_amount,
     nullif(btrim(coalesce(p_note, '')), ''), auth.uid());

  update public.listings
  set featured = true, updated_at = now()
  where id = p_listing_id;

  return v_ends;
end;
$$;

revoke all on function public.admin_grant_listing_promotion(uuid, integer, numeric, text)
  from public, anon;
grant execute on function public.admin_grant_listing_promotion(uuid, integer, numeric, text)
  to authenticated;

create or replace function public.admin_end_listing_promotion(p_listing_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles p
                 where p.id = auth.uid() and p.is_admin = true) then
    raise exception 'Admin access required.';
  end if;

  update public.listing_promotions
  set ends_at = now()
  where listing_id = p_listing_id and now() < ends_at;

  update public.listings
  set featured = false, updated_at = now()
  where id = p_listing_id;
end;
$$;

revoke all on function public.admin_end_listing_promotion(uuid) from public, anon;
grant execute on function public.admin_end_listing_promotion(uuid) to authenticated;

-- Expire promotions daily. Same caveat as the message purge: if pg_cron isn't
-- available the function is still callable by hand, and the only cost of a
-- missed run is a listing staying featured slightly too long.
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.schedule(
      'refresh-featured-listings',
      '5 * * * *',
      $cron$select public.refresh_featured_listings();$cron$
    );
  end if;
exception when others then
  raise notice 'Could not schedule featured refresh (%). Call refresh_featured_listings() on a schedule.', sqlerrm;
end $$;
