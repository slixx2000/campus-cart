-- Allow sellers to read their own non-active listings while keeping public feeds active-only.

drop policy if exists "listings_owner_select" on public.listings;
create policy "listings_owner_select" on public.listings
  for select
  using (
    deleted_at is null
    and (
      status = 'active'
      or seller_id = auth.uid()
    )
  );
