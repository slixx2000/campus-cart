-- LOCAL DEVELOPMENT SEED — never applied to a hosted project.
--
-- The Supabase CLI runs this automatically after `supabase db reset`. It is not
-- a migration, so `supabase db push` will never send it to production.
--
-- Creates two verified ZCAS sellers and a spread of listings so the feed, cards,
-- filters, product page and search have something real to render.

do $$
declare
  v_amara uuid := '11111111-1111-1111-1111-111111111111';
  v_chanda uuid := '22222222-2222-2222-2222-222222222222';
  v_zcas uuid;
  v_seller uuid;
  v_cat uuid;
  v_id uuid;
  r record;
  i int := 0;
begin
  select id into v_zcas from public.universities where code = 'zcasu';
  if v_zcas is null then
    raise notice 'Reference data missing — run migrations first.';
    return;
  end if;

  -- auth.users first: profiles.id references it, and handle_new_user creates the
  -- profile row for us.
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                          email_confirmed_at, created_at, updated_at)
  values
    (v_amara,  '00000000-0000-0000-0000-000000000000', 'authenticated',
     'authenticated', 'amara@zcasu.edu.zm',  'seed', now(), now(), now()),
    (v_chanda, '00000000-0000-0000-0000-000000000000', 'authenticated',
     'authenticated', 'chanda@zcasu.edu.zm', 'seed', now(), now(), now())
  on conflict (id) do nothing;

  update public.profiles set
    full_name = case id when v_amara then 'Amara Phiri' else 'Chanda Mwale' end,
    phone     = case id when v_amara then '+260971112223' else '+260772223334' end,
    university_id = v_zcas,
    is_verified_student = true
  where id in (v_amara, v_chanda);

  for r in
    select * from (values
      ('Calculus Early Transcendentals 8th Ed', 'Barely used, no highlighting. Covers MAT110 and MAT120. Collection on campus.', 450,   'books-stationery',  'good',     false),
      ('HP Pavilion 15 — i5, 8GB RAM',          'Two years old, battery still holds ~4 hours. Comes with charger and sleeve.',      8500,  'electronics',       'good',     false),
      ('Dorm Mini Fridge',                      'Perfect for a res room. Quiet, clean, works exactly as it should.',               1200,  'home-dorm',         'fair',     false),
      ('LED Study Lamp',                        'Adjustable arm and three brightness levels. Barely used.',                        250,   'home-dorm',         'like_new', false),
      ('Scientific Calculator (Casio fx-991)',  'Allowed in exams. Cover included, all keys responsive.',                          380,   'books-stationery',  'good',     false),
      ('Denim Jacket (M)',                      'Classic blue denim, worn a handful of times. No marks.',                          320,   'clothing-fashion',  'like_new', false),
      ('Nike Running Shoes (UK 8)',             'Used for one term of morning runs. Plenty of life left.',                         550,   'sports-fitness',    'good',     false),
      ('Rice Cooker 1.8L',                      'Feeds four comfortably. Ideal for shared self-catering.',                         600,   'home-dorm',         'good',     false),
      ('Accounting Principles Textbook',        'Required for ACC201. Clean pages, spine intact.',                                 520,   'books-stationery',  'good',     false),
      ('Bluetooth Headphones',                  'Over-ear, noise isolating. Case and cable included.',                             750,   'electronics',       'like_new', false),
      ('Maths & Stats Tutoring',                'First and second year. Small groups or one-to-one, on campus or online.',         150,   'tutoring',          null,       true),
      ('Assignment Typing & Formatting',        'APA and Harvard referencing, fast turnaround, proofread before delivery.',        100,   'services',          null,       true),
      ('Braiding & Hairdressing',               'Box braids, cornrows and twists. Evenings and weekends, hostel visits welcome.',  200,   'beauty-personal',   null,       true),
      ('Homemade Lunch Packs',                  'Daily lunch packs delivered on campus. Order the night before.',                  45,    'food-drinks',       null,       true),
      ('Study Desk & Chair',                    'Solid wooden desk with matching chair. Buyer collects.',                          900,   'home-dorm',         'good',     false),
      ('Backpack — Laptop Compartment',         'Fits a 15" laptop, water resistant, all zips working.',                           280,   'clothing-fashion',  'good',     false)
    ) as t(title, description, price, cat_slug, cond, is_service)
  loop
    i := i + 1;
    v_seller := case when i % 2 = 0 then v_chanda else v_amara end;
    select id into v_cat from public.categories where slug = r.cat_slug;
    v_id := gen_random_uuid();

    insert into public.listings (id, seller_id, title, description, price, category_id,
                                 university_id, condition, is_service, status,
                                 created_at, last_bumped_at)
    values (v_id, v_seller, r.title, r.description, r.price, v_cat, v_zcas,
            r.cond::public.listing_condition, r.is_service, 'active',
            now() - (i || ' hours')::interval,
            now() - (i || ' hours')::interval);

    -- One placeholder image each so cards and the gallery aren't empty.
    insert into public.listing_images (listing_id, storage_path, public_url, sort_order)
    values (v_id, 'seed/' || v_id || '.svg',
            '/images/placeholder-' ||
              case r.cat_slug
                when 'electronics'      then 'electronics'
                when 'books-stationery' then 'books'
                when 'clothing-fashion' then 'fashion'
                when 'food-drinks'      then 'food'
                when 'sports-fitness'   then 'sports'
                when 'tutoring'         then 'tutoring'
                when 'beauty-personal'  then 'beauty'
                else 'services'
              end || '.svg', 0);
  end loop;

  raise notice 'Seeded % listings across 2 verified ZCAS sellers.', i;
end $$;
