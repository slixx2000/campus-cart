alter table public.listing_bump_events enable row level security;

drop policy if exists "listing_bump_events_owner_read" on public.listing_bump_events;
create policy "listing_bump_events_owner_read"
  on public.listing_bump_events
  for select
  using (auth.uid() = user_id);

drop policy if exists "listing_bump_events_owner_insert" on public.listing_bump_events;
create policy "listing_bump_events_owner_insert"
  on public.listing_bump_events
  for insert
  with check (auth.uid() = user_id);
