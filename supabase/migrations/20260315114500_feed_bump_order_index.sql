create index if not exists idx_listings_feed_status_bump
  on public.listings(status, last_bumped_at desc)
  where status = 'active' and deleted_at is null;

create index if not exists idx_listings_feed_university_bump
  on public.listings(university_id, last_bumped_at desc)
  where status = 'active' and deleted_at is null;
