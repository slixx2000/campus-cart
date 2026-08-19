-- Enforce the bump cooldown on every path that can move a listing up the feed.
--
-- `bump_listing` already implements this correctly (24h cooldown, request-id
-- idempotency, row lock, writes listing_bump_events) but has ZERO callers.
-- Mobile bumps by passing p_last_bumped_at to `update_my_listing`, which applied
-- it unconditionally — so bumping was one tap, unlimited.
--
-- Rather than change the RPC signature (which would break the already-shipped
-- v1.1.0 APK), the parameter is kept but no longer trusted: it now routes through
-- bump_listing instead of writing the column. Shipped clients therefore get the
-- cooldown, and the bump audit trail, with no app update.

create or replace function public.update_my_listing(
  p_listing_id uuid,
  p_status public.listing_status default null,
  p_deleted_at timestamptz default null,
  p_last_bumped_at timestamptz default null
)
returns public.listings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.listings;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  -- A bump was requested. Never trust a client-supplied timestamp for feed rank:
  -- delegate to bump_listing, which owns the cooldown and the audit trail.
  if p_last_bumped_at is not null then
    perform public.bump_listing(p_listing_id);
  end if;

  update public.listings
  set
    status = coalesce(p_status, status),
    deleted_at = case
      when p_deleted_at is null then deleted_at
      else p_deleted_at
    end,
    updated_at = now()
  where id = p_listing_id
    and seller_id = auth.uid()
  returning * into v_row;

  if v_row.id is null then
    raise exception 'Listing not found or not owned by user';
  end if;

  return v_row;
end;
$$;
