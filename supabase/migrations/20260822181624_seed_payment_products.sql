-- Seed payment_products with initial MVP offerings
-- Idempotent: only inserts if a product with the same name does not exist

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.payment_products WHERE name = 'Boost Listing') THEN
    INSERT INTO public.payment_products (id, kind, name, description, price_minor, currency, duration_days, is_active, metadata)
    VALUES (
      gen_random_uuid(),
      'boost',
      'Boost Listing',
      'Boost a listing to the top of feeds for higher visibility.',
      2000, -- K20 -> 2000 minor units (ZMW * 100)
      'ZMW',
      1,    -- 1 day
      true,
      '{}'::jsonb
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.payment_products WHERE name = 'Featured Listing') THEN
    INSERT INTO public.payment_products (id, kind, name, description, price_minor, currency, duration_days, is_active, metadata)
    VALUES (
      gen_random_uuid(),
      'featured',
      'Featured Listing',
      'Feature a listing in the highlighted section for more exposure.',
      3000, -- K30 -> 3000 minor units
      'ZMW',
      7,    -- 7 days
      true,
      '{}'::jsonb
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.payment_products WHERE name = 'Seller Pro') THEN
    INSERT INTO public.payment_products (id, kind, name, description, price_minor, currency, duration_days, is_active, metadata)
    VALUES (
      gen_random_uuid(),
      'seller_pro',
      'Seller Pro',
      'Monthly Seller Pro subscription that unlocks seller perks and a profile badge.',
      5000, -- K50 -> 5000 minor units
      'ZMW',
      30,   -- 30 days (monthly)
      true,
      '{}'::jsonb
    );
  END IF;
END $$;
