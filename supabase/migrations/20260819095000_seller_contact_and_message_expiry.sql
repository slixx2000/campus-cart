-- Seller contact details behind a function, and message expiry that is real.
--
-- 1. `profiles_public_read` is `using (true)` with no column restrictions, and
--    LISTING_SELECT pulled `profiles(... phone ...)` into every browse/home/search
--    query. So an ANONYMOUS caller with the public anon key could dump every
--    user's phone number — in Zambia, that is a mobile-money identity, i.e. a
--    ready-made scam target list. Contact details now come from a function that
--    requires a session and a specific listing.
--
-- 2. "Messages disappear after 24 hours" was a client-side filter only: the RLS
--    SELECT policy had no expiry predicate, so a participant could read every
--    message ever sent straight from PostgREST, and nothing ever deleted them.

-- ─── 1. Seller contact, per listing, signed-in only ──────────────────────────
-- PL/pgSQL rather than `language sql`, for consistency with every other function
-- in this schema and so the "must be signed in" case is an explicit error rather
-- than an empty result.
create or replace function public.listing_seller_contact(p_listing_id uuid)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_phone text;
begin
  if auth.uid() is null then
    raise exception 'Sign in to see seller contact details.';
  end if;

  select p.phone into v_phone
  from public.listings l
  join public.profiles p on p.id = l.seller_id
  where l.id = p_listing_id
    and l.deleted_at is null;

  return v_phone;
end;
$$;

-- ponytail: no per-caller rate limit — a signed-in scraper can still walk listing
-- ids one at a time. Add a counter table if that ever shows up in the logs; the
-- point here is closing the anonymous bulk dump.
revoke all on function public.listing_seller_contact(uuid) from public, anon;
grant execute on function public.listing_seller_contact(uuid) to authenticated;

-- ─── 2. Expiry enforced in the database, not just the UI ─────────────────────
drop policy if exists "messages_participant_select" on public.messages;
create policy "messages_participant_select" on public.messages
  for select using (
    expires_at > now()
    and exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );

-- Actually delete them, rather than accumulating invisible rows forever.
-- idx_messages_expiry already exists for this.
create or replace function public.purge_expired_messages()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer;
begin
  delete from public.messages where expires_at <= now() - interval '7 days';
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke all on function public.purge_expired_messages() from public, anon, authenticated;

-- pg_cron is available on Supabase but not enabled by default, and enabling it
-- needs elevated rights — so schedule it if we can, and leave the function
-- callable by hand if we cannot. A missed purge costs disk, not correctness:
-- the RLS predicate above already makes expired messages unreadable.
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.schedule(
      'purge-expired-messages',
      '30 3 * * *',
      $cron$select public.purge_expired_messages();$cron$
    );
  else
    raise notice 'pg_cron unavailable — run select public.purge_expired_messages(); periodically';
  end if;
exception when others then
  raise notice 'Could not schedule message purge (%). Run it manually or via an external scheduler.', sqlerrm;
end $$;
