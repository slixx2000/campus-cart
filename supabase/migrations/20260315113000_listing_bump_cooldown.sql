create or replace function public.bump_listing(p_listing_id uuid)
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
end;
$$;

grant execute on function public.bump_listing(uuid) to authenticated;
