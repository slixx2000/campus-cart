-- Phase 11: Add 'boost' as a valid promotion kind for paid listing boosts.
-- The listing_promotions table currently only allows 'featured'. This migration
-- adds 'boost' so the webhook can record paid boosts for audit trail purposes.
-- Actual boost activation updates listing.last_bumped_at (handled in webhook).

alter table public.listing_promotions
drop constraint if exists listing_promotions_kind_check;

alter table public.listing_promotions
add constraint listing_promotions_kind_check
check (kind in ('featured', 'boost'));

-- Also add a security definer function for paid boosts that updates
-- last_bumped_at without the 24h cooldown (since the user paid for it).
create or replace function public.paid_boost_listing(
  p_listing_id uuid,
  p_user_id uuid,
  p_days integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing public.listings%rowtype;
begin
  select *
  into v_listing
  from public.listings
  where id = p_listing_id
  for update;

  if not found then
    raise exception 'Listing not found.';
  end if;

  if v_listing.seller_id <> p_user_id then
    raise exception 'Only the listing owner can boost this listing.';
  end if;

  if v_listing.status <> 'active' or v_listing.deleted_at is not null then
    raise exception 'Only active listings can be boosted.';
  end if;

  update public.listings
  set last_bumped_at = now()
  where id = p_listing_id;
end;
$$;

revoke all on function public.paid_boost_listing(uuid, uuid, integer)
  from public, anon, authenticated;
grant execute on function public.paid_boost_listing(uuid, uuid, integer)
  to authenticated;