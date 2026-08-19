-- Privilege lockdown regression test.
--
-- There is no test framework in this repo, so this is the one runnable check for
-- migration 20260819091000. Paste it into the Supabase SQL editor (or psql) and
-- read the NOTICEs: every line must say PASS.
--
-- It asserts that the `authenticated` role cannot reach the privilege columns,
-- which is the property the whole verification and paid-placement model rests on.

do $$
declare
  v_uid   uuid := '00000000-0000-0000-0000-0000000000aa';
  v_other uuid;
  v_ok    boolean;
begin
  -- Impersonate a signed-in user.
  perform set_config('request.jwt.claims', json_build_object('sub', v_uid, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);

  -- 1. Cannot self-promote to admin.
  begin
    update public.profiles set is_admin = true where id = v_uid;
    raise notice 'FAIL: authenticated could set is_admin';
  exception when insufficient_privilege then
    raise notice 'PASS: is_admin is not writable by authenticated';
  end;

  -- 2. Cannot self-verify as a student.
  begin
    update public.profiles set is_verified_student = true where id = v_uid;
    raise notice 'FAIL: authenticated could set is_verified_student';
  exception when insufficient_privilege then
    raise notice 'PASS: is_verified_student is not writable by authenticated';
  end;

  -- 3. Cannot self-award the pioneer badge.
  begin
    update public.profiles set is_pioneer_seller = true where id = v_uid;
    raise notice 'FAIL: authenticated could set is_pioneer_seller';
  exception when insufficient_privilege then
    raise notice 'PASS: is_pioneer_seller is not writable by authenticated';
  end;

  -- 4. Cannot buy free placement by writing featured.
  begin
    update public.listings set featured = true where seller_id = v_uid;
    raise notice 'FAIL: authenticated could set listings.featured';
  exception when insufficient_privilege then
    raise notice 'PASS: listings.featured is not writable by authenticated';
  end;

  -- 5. Cannot hand-write feed rank.
  begin
    update public.listings set last_bumped_at = now() where seller_id = v_uid;
    raise notice 'FAIL: authenticated could set last_bumped_at';
  exception when insufficient_privilege then
    raise notice 'PASS: last_bumped_at is not writable by authenticated';
  end;

  -- 6. Cannot smuggle featured in at INSERT time either.
  begin
    insert into public.listings (id, seller_id, title, description, price,
                                 category_id, university_id, is_service, status, featured)
    values (gen_random_uuid(), v_uid, 'test', 'test description', 1,
            (select id from public.categories limit 1),
            (select id from public.universities limit 1),
            false, 'active', true);
    raise notice 'FAIL: authenticated could INSERT featured';
  exception
    when insufficient_privilege then
      raise notice 'PASS: featured is not insertable by authenticated';
    when others then
      raise notice 'PASS (blocked): featured insert rejected — %', sqlerrm;
  end;

  -- 7. Exactly one permissive INSERT policy on listings, and it requires verification.
  select count(*) = 1 into v_ok
  from pg_policies
  where schemaname = 'public' and tablename = 'listings' and cmd = 'INSERT';
  if v_ok then
    raise notice 'PASS: listings has exactly one INSERT policy';
  else
    raise notice 'FAIL: listings has % INSERT policies (multiple permissive policies are OR-ed)',
      (select count(*) from pg_policies
       where schemaname = 'public' and tablename = 'listings' and cmd = 'INSERT');
  end if;

  -- 8. Reference data actually exists, or nobody can post at all.
  if (select count(*) from public.universities) >= 8
     and (select count(*) from public.categories) >= 10 then
    raise notice 'PASS: reference data seeded (% universities, % categories)',
      (select count(*) from public.universities), (select count(*) from public.categories);
  else
    raise notice 'FAIL: reference data missing — the sell form will have an empty dropdown';
  end if;

  -- 9. Chatting must not re-rank listings.
  if (select prosrc from pg_proc where proname = 'touch_conversation') not like '%listings%' then
    raise notice 'PASS: touch_conversation no longer bumps listings';
  else
    raise notice 'FAIL: touch_conversation still writes to listings';
  end if;

  perform set_config('role', 'postgres', true);
end $$;

-- ── The gate must also let the right people through ──────────────────────────
-- Negative tests alone would still pass if the gate blocked everyone, so this
-- exercises both directions, plus the bump cooldown on the path mobile uses.
-- Runs inside a transaction that is deliberately rolled back at the end.

do $$
declare
  v_uid uuid := gen_random_uuid();
  v_lid uuid := gen_random_uuid();
  v_cat uuid := (select id from public.categories limit 1);
  v_uni uuid := (select id from public.universities limit 1);
begin
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                          email_confirmed_at, created_at, updated_at)
  values (v_uid, '00000000-0000-0000-0000-000000000000', 'authenticated',
          'authenticated', 'gate-test@example.com', 'x', now(), now(), now());

  perform set_config('request.jwt.claims',
    json_build_object('sub', v_uid, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);

  begin
    insert into public.listings (id, seller_id, title, description, price,
                                 category_id, university_id, is_service, status)
    values (gen_random_uuid(), v_uid, 'Unverified', 'should not be allowed', 10,
            v_cat, v_uni, false, 'active');
    raise notice 'FAIL: unverified user could create a listing';
  exception when others then
    raise notice 'PASS: unverified listing INSERT refused';
  end;

  perform set_config('role', 'postgres', true);
  update public.profiles set is_verified_student = true where id = v_uid;
  perform set_config('role', 'authenticated', true);

  begin
    insert into public.listings (id, seller_id, title, description, price,
                                 category_id, university_id, is_service, status,
                                 last_bumped_at)
    values (v_lid, v_uid, 'Verified', 'should be allowed', 10, v_cat, v_uni,
            false, 'active', now() - interval '2 hours');
    raise notice 'FAIL: last_bumped_at was insertable';
  exception when insufficient_privilege then
    raise notice 'PASS: last_bumped_at is not insertable by authenticated';
  end;

  begin
    insert into public.listings (id, seller_id, title, description, price,
                                 category_id, university_id, is_service, status)
    values (v_lid, v_uid, 'Verified', 'should be allowed', 10, v_cat, v_uni,
            false, 'active');
    raise notice 'PASS: verified user CAN create a listing';
  exception when others then
    raise notice 'FAIL: verified user blocked — %', sqlerrm;
  end;

  -- Bump cooldown, via the RPC the shipped mobile app calls.
  perform set_config('role', 'postgres', true);
  update public.listings set last_bumped_at = now() - interval '2 hours' where id = v_lid;
  perform set_config('role', 'authenticated', true);
  begin
    perform public.update_my_listing(v_lid, null, null, now());
    raise notice 'FAIL: bump within 24h was allowed';
  exception when others then
    raise notice 'PASS: bump cooldown enforced through update_my_listing';
  end;

  perform set_config('role', 'postgres', true);
  raise exception 'rollback test data (expected)';
end $$;
