-- ZCAS University (the launch campus) and the email domains that drive
-- self-service student verification.
--
-- ZCAS was missing from the reference seed entirely. Note the existing 'zica'
-- row is the Zambia Institute of Chartered Accountants — a professional body,
-- a different institution from The ZCAS University, which ZCAS (Zambia Centre
-- for Accountancy Studies) founded in 2016.

insert into public.universities (code, name, short_name, city, province) values
  ('zcasu', 'The ZCAS University', 'ZCAS', 'Lusaka', 'Lusaka')
on conflict (code) do nothing;

-- Domain → university. A student whose *confirmed* email address is on this list
-- can verify themselves without an admin; everyone else falls back to manual
-- admin review, so an incomplete list degrades gracefully and never locks anyone
-- out. Adding a university later is one more row here — no code change.
--
-- Only domains confirmed against the institutions' own sites are listed.
insert into public.university_domains (university_id, domain)
select u.id, d.domain
from (values
  ('zcasu', 'zcasu.edu.zm'),  -- launch campus
  ('unza',  'unza.zm'),
  ('cbu',   'cbu.ac.zm')
) as d(code, domain)
join public.universities u on u.code = d.code
on conflict (domain) do nothing;
