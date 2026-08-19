-- Reference data seed.
--
-- These rows previously existed only in schema.sql, which `supabase db push`
-- never applies — it runs migrations/ only. The result was that every
-- environment built from migrations had zero universities and zero categories,
-- so the sell form's university dropdown was empty and no listing could be
-- posted at all. Seeding here makes migrations self-sufficient.
--
-- Idempotent: safe to re-run, and safe on databases that already have the rows.

insert into public.universities (code, name, short_name, city, province) values
  ('unza',      'University of Zambia',                     'UNZA',     'Lusaka', 'Lusaka'),
  ('cbu',       'Copperbelt University',                    'CBU',      'Kitwe',  'Copperbelt'),
  ('mu',        'Mulungushi University',                    'MU',       'Kabwe',  'Central'),
  ('northrise', 'Northrise University',                     'Northrise','Ndola',  'Copperbelt'),
  ('cavendish', 'Cavendish University Zambia',              'CUZ',      'Lusaka', 'Lusaka'),
  ('dmmu',      'Dag Hammarskjöld University',              'DMMU',     'Lusaka', 'Lusaka'),
  ('lamu',      'Lusaka Apex Medical University',           'LAMU',     'Lusaka', 'Lusaka'),
  ('zica',      'Zambia Institute of Chartered Accountants','ZICA',     'Lusaka', 'Lusaka')
on conflict (code) do nothing;

insert into public.categories (slug, name, material_icon, color_class) values
  ('food-drinks',        'Food & Drinks',         'restaurant',    'bg-orange-100 text-orange-600'),
  ('clothing-fashion',   'Clothing & Fashion',    'checkroom',     'bg-purple-100 text-purple-600'),
  ('electronics',        'Electronics',           'devices',       'bg-blue-100 text-blue-600'),
  ('books-stationery',   'Books & Stationery',    'auto_stories',  'bg-yellow-100 text-yellow-600'),
  ('services',           'Services',              'construction',  'bg-teal-100 text-teal-600'),
  ('beauty-personal',    'Beauty & Personal Care','spa',           'bg-pink-100 text-pink-600'),
  ('sports-fitness',     'Sports & Fitness',      'sports_soccer', 'bg-green-100 text-green-600'),
  ('home-dorm',          'Home & Dorm',           'chair_alt',     'bg-indigo-100 text-indigo-600'),
  ('tutoring',           'Tutoring',              'school',        'bg-red-100 text-red-600'),
  ('other',              'Other',                 'inventory_2',   'bg-slate-100 text-slate-600')
on conflict (slug) do nothing;
