-- Seller contact privacy and message expiry.
--
-- Paste into the Supabase SQL editor (or psql) and read the NOTICEs: every line
-- must say PASS. The closing ERROR is deliberate — it rolls back the test data.
--
-- NOTE: this deliberately does NOT test "anon cannot call listing_seller_contact"
-- locally. On the Supabase CLI's local Postgres image, a permission-denied
-- function call as `anon` segfaults the backend (signal 11) — a bug in that
-- image, reproducible with any trivial function, not with ours. Supabase cloud
-- returns a clean 401. Verify that case against the deployed project:
--   curl -s -o /dev/null -w '%{http_code}\n' -X POST \
--     "$SUPABASE_URL/rest/v1/rpc/listing_seller_contact" \
--     -H "apikey: $ANON_KEY" -H 'Content-Type: application/json' \
--     -d '{"p_listing_id":"00000000-0000-0000-0000-000000000000"}'   # expect 401

do $$
declare
  v_seller uuid := gen_random_uuid();
  v_buyer  uuid := gen_random_uuid();
  v_lid    uuid := gen_random_uuid();
  v_cid    uuid := gen_random_uuid();
  v_phone  text;
  v_n      int;
begin
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                          created_at, updated_at)
  values (v_seller, '00000000-0000-0000-0000-000000000000', 'authenticated',
          'authenticated', 'seller@zcasu.edu.zm', 'x', now(), now()),
         (v_buyer,  '00000000-0000-0000-0000-000000000000', 'authenticated',
          'authenticated', 'buyer@zcasu.edu.zm',  'x', now(), now());

  update public.profiles
  set phone = '+260971234567', is_verified_student = true
  where id = v_seller;

  insert into public.listings (id, seller_id, title, description, price,
                               category_id, university_id, is_service, status)
  values (v_lid, v_seller, 'Contact test', 'description for the contact test', 10,
          (select id from public.categories limit 1),
          (select id from public.universities where code = 'zcasu'),
          false, 'active');

  -- ── Anonymous callers must not be able to harvest phone numbers ────────────
  perform set_config('role', 'anon', true);

  begin
    perform phone from public.profiles limit 1;
    raise notice 'FAIL: anon can still read phone numbers in bulk';
  exception when insufficient_privilege then
    raise notice 'PASS: anon cannot read phone numbers';
  end;

  begin
    perform id, full_name, avatar_url, is_verified_student from public.profiles limit 1;
    raise notice 'PASS: anon keeps the public profile columns (browsing still works)';
  exception when others then
    raise notice 'FAIL: anon lost public profile reads — %', sqlerrm;
  end;

  -- ── A signed-in buyer gets the number, for one listing at a time ───────────
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_buyer, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);

  select public.listing_seller_contact(v_lid) into v_phone;
  if v_phone = '+260971234567' then
    raise notice 'PASS: signed-in buyer gets the seller number for a listing';
  else
    raise notice 'FAIL: expected the seller phone, got %', coalesce(v_phone, '<null>');
  end if;

  -- ── Message expiry is enforced by the database, not just the UI ────────────
  perform set_config('role', 'postgres', true);
  insert into public.conversations (id, listing_id, buyer_id, seller_id)
  values (v_cid, v_lid, v_buyer, v_seller);
  insert into public.messages (conversation_id, sender_id, content)
  values (v_cid, v_buyer, 'fresh message'), (v_cid, v_buyer, 'old message');
  update public.messages set expires_at = now() - interval '1 hour'
  where content = 'old message';

  perform set_config('role', 'authenticated', true);
  select count(*) into v_n from public.messages where conversation_id = v_cid;
  if v_n = 1 then
    raise notice 'PASS: expired messages are unreadable, even straight from PostgREST';
  else
    raise notice 'FAIL: participant still sees % messages', v_n;
  end if;

  -- ── The purge actually deletes, after a grace period ───────────────────────
  perform set_config('role', 'postgres', true);
  perform public.purge_expired_messages();
  select count(*) into v_n from public.messages where conversation_id = v_cid;
  if v_n = 2 then
    raise notice 'PASS: recently-expired messages are kept for the grace period';
  else
    raise notice 'FAIL: purge deleted inside the grace period (count %)', v_n;
  end if;

  update public.messages set expires_at = now() - interval '30 days'
  where content = 'old message';
  perform public.purge_expired_messages();
  select count(*) into v_n from public.messages where conversation_id = v_cid;
  if v_n = 1 then
    raise notice 'PASS: purge deletes long-expired messages';
  else
    raise notice 'FAIL: purge left % messages', v_n;
  end if;

  raise exception 'rollback test data (expected)';
end $$;
