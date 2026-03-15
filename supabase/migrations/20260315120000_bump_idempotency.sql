create table if not exists public.listing_bump_events (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  request_id text not null,
  bumped_at timestamptz not null default now(),
  constraint listing_bump_events_request_unique unique (listing_id, user_id, request_id)
);

create index if not exists idx_listing_bump_events_listing_bumped
  on public.listing_bump_events(listing_id, bumped_at desc);

drop function if exists public.bump_listing(uuid);

create or replace function public.bump_listing(p_listing_id uuid, p_request_id text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing public.listings%rowtype;
begin
  if auth.uid() is null then
    raise exception 'You must sign in to bump listings.';
  end if;

  select *
  into v_listing
  from public.listings
  where id = p_listing_id
  for update;

  if not found then
    raise exception 'Listing not found.';
  end if;

  if p_request_id is not null and exists (
    select 1
    from public.listing_bump_events e
    where e.listing_id = p_listing_id
      and e.user_id = auth.uid()
      and e.request_id = p_request_id
  ) then
    return;
  end if;

  if v_listing.seller_id <> auth.uid() then
    raise exception 'Only the listing owner can bump this listing.';
  end if;

  if v_listing.status <> 'active' or v_listing.deleted_at is not null then
    raise exception 'Only active listings can be bumped.';
  end if;

  if v_listing.last_bumped_at > now() - interval '24 hours' then
    raise exception 'You can only bump this listing once every 24 hours.';
  end if;

  update public.listings
  set last_bumped_at = now()
  where id = p_listing_id;

  if p_request_id is not null then
    insert into public.listing_bump_events(listing_id, user_id, request_id)
    values (p_listing_id, auth.uid(), p_request_id)
    on conflict do nothing;
  end if;
end;
$$;

grant execute on function public.bump_listing(uuid, text) to authenticated;
