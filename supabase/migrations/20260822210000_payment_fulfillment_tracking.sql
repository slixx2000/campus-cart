-- Phase 11: Add fulfillment tracking to payments for idempotent webhook processing.
-- Without this, a webhook retry after partial success could apply a promotion twice.

alter table public.payments
add column if not exists fulfilled_at timestamptz;

-- Add an index for efficient lookups
create index if not exists idx_payments_fulfilled
  on public.payments (fulfilled_at)
  where fulfilled_at is not null;

-- Backfill: any payment that already has paid_at set should be considered fulfilled
-- if it has a corresponding promotion record.
update public.payments p
set fulfilled_at = p.paid_at
where p.fulfilled_at is null
  and p.paid_at is not null
  and p.purpose in ('listing_boost', 'featured_listing')
  and exists (
    select 1 from public.listing_promotions lp
    where lp.listing_id = (p.metadata->>'listingId')::uuid
      and lp.kind = case when p.purpose = 'listing_boost' then 'boost' else 'featured' end
      and lp.created_at >= p.paid_at - interval '1 minute'
      and lp.created_at <= p.paid_at + interval '5 minutes'
  );