-- Lifetime pioneer badge for the first 30 unique sellers.

alter table public.profiles
  add column if not exists is_pioneer_seller boolean not null default false,
  add column if not exists pioneer_awarded_at timestamptz;

create index if not exists idx_profiles_pioneer_seller
  on public.profiles(is_pioneer_seller)
  where is_pioneer_seller = true;

create or replace function public.award_pioneer_badge_for_seller(p_seller_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_badged_count int;
begin
  -- Serialize concurrent badge grants to strictly cap at 30.
  perform pg_advisory_xact_lock(hashtext('public.pioneer_seller_badge'));

  if exists (
    select 1
    from public.profiles
    where id = p_seller_id
      and is_pioneer_seller = true
  ) then
    return;
  end if;

  select count(*)
  into v_badged_count
  from public.profiles
  where is_pioneer_seller = true;

  if v_badged_count >= 30 then
    return;
  end if;

  update public.profiles
  set is_pioneer_seller = true,
      pioneer_awarded_at = coalesce(pioneer_awarded_at, now())
  where id = p_seller_id;
end;
$$;

create or replace function public.handle_listing_pioneer_badge()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.award_pioneer_badge_for_seller(new.seller_id);
  return new;
end;
$$;

drop trigger if exists listing_award_pioneer_badge on public.listings;
create trigger listing_award_pioneer_badge
  after insert on public.listings
  for each row
  execute procedure public.handle_listing_pioneer_badge();

-- Backfill existing data based on first listing timestamp per seller.
with ranked_sellers as (
  select seller_id,
         min(created_at) as first_listing_at
  from public.listings
  group by seller_id
  order by first_listing_at asc, seller_id asc
  limit 30
)
update public.profiles p
set is_pioneer_seller = true,
    pioneer_awarded_at = coalesce(p.pioneer_awarded_at, r.first_listing_at)
from ranked_sellers r
where p.id = r.seller_id;
