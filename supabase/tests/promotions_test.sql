-- Paid placement and ad banners.
--
-- Paste into the Supabase SQL editor (or psql): every line must say PASS. The
-- closing ERROR is deliberate — it rolls back the test data.

do $$
declare
  v_admin  uuid := gen_random_uuid();
  v_seller uuid;
  v_lid    uuid;
  v_ends   timestamptz;
  v_n      int;
begin
  select seller_id, id into v_seller, v_lid
  from public.listings where featured = false limit 1;

  if v_lid is null then
    raise notice 'SKIP: no listings to test against (run the local seed first)';
    return;
  end if;

  insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                          created_at, updated_at)
  values (v_admin, '00000000-0000-0000-0000-000000000000', 'authenticated',
          'authenticated', 'promo-admin@zcasu.edu.zm', 'x', now(), now());

  -- ── A seller must not be able to feature their own listing ────────────────
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_seller, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);

  begin
    perform public.admin_grant_listing_promotion(v_lid, 7, 50, 'self serve');
    raise notice 'FAIL: a non-admin granted themselves paid placement';
  exception when others then
    raise notice 'PASS: non-admin cannot grant paid placement';
  end;

  begin
    insert into public.ad_banners (placement, title, image_url, target_url, ends_at)
    values ('home', 'free ad', 'http://x/y.png', 'http://x', now() + interval '1 day');
    raise notice 'FAIL: a non-admin created a banner';
  exception when others then
    raise notice 'PASS: non-admin cannot create a banner';
  end;

  -- ── Admin grants, cache updates immediately ───────────────────────────────
  perform set_config('role', 'postgres', true);
  update public.profiles set is_admin = true where id = v_admin;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);

  select public.admin_grant_listing_promotion(v_lid, 7, 50, 'Airtel Money ref 123')
  into v_ends;

  perform set_config('role', 'postgres', true);
  if (select featured from public.listings where id = v_lid) then
    raise notice 'PASS: granting sets the featured cache immediately';
  else
    raise notice 'FAIL: listing not featured after grant';
  end if;

  -- ── Buying more time extends rather than restarting ───────────────────────
  perform set_config('role', 'authenticated', true);
  select public.admin_grant_listing_promotion(v_lid, 7, 50, 'renewal') into v_ends;
  perform set_config('role', 'postgres', true);
  if v_ends > now() + interval '13 days' then
    raise notice 'PASS: a second week extends the window (ends %)', v_ends::date;
  else
    raise notice 'FAIL: window did not extend (ends %)', v_ends::date;
  end if;

  select count(*) into v_n from public.listing_promotions where listing_id = v_lid;
  if v_n = 2 then
    raise notice 'PASS: each purchase is recorded separately (% rows)', v_n;
  else
    raise notice 'FAIL: expected 2 promotion rows, found %', v_n;
  end if;

  -- ── Natural expiry clears the cache ───────────────────────────────────────
  update public.listing_promotions
  set starts_at = now() - interval '10 days', ends_at = now() - interval '1 day'
  where listing_id = v_lid;
  perform public.refresh_featured_listings();

  if (select featured from public.listings where id = v_lid) = false then
    raise notice 'PASS: expired promotion clears the featured cache';
  else
    raise notice 'FAIL: still featured after expiry';
  end if;

  -- ── Cancelling immediately after granting must not error ──────────────────
  perform set_config('role', 'authenticated', true);
  perform public.admin_grant_listing_promotion(v_lid, 30, null, null);
  begin
    perform public.admin_end_listing_promotion(v_lid);
    raise notice 'PASS: a promotion can be cancelled the moment it is granted';
  exception when others then
    raise notice 'FAIL: cancelling right after granting errored — %', sqlerrm;
  end;

  perform set_config('role', 'postgres', true);
  if (select featured from public.listings where id = v_lid) = false then
    raise notice 'PASS: ending a promotion unfeatures immediately';
  else
    raise notice 'FAIL: still featured after ending';
  end if;

  -- ── Banner visibility follows its window ──────────────────────────────────
  insert into public.ad_banners (placement, title, image_url, target_url, starts_at, ends_at)
  values ('browse', 'live banner',   'http://x/a.png', 'http://x', now() - interval '1 hour', now() + interval '1 day'),
         ('browse', 'expired banner','http://x/b.png', 'http://x', now() - interval '2 days', now() - interval '1 day');

  perform set_config('role', 'anon', true);
  select count(*) into v_n from public.ad_banners;
  if v_n = 1 then
    raise notice 'PASS: only the running banner is publicly visible';
  else
    raise notice 'FAIL: anon sees % banners, expected 1', v_n;
  end if;

  perform set_config('role', 'postgres', true);
  raise exception 'rollback test data (expected)';
end $$;
