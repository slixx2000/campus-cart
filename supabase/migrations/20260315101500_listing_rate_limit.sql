drop policy if exists "listings_owner_insert" on public.listings;

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