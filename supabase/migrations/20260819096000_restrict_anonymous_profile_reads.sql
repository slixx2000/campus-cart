-- Close the anonymous phone directory.
--
-- `profiles_public_read` is `using (true)` and RLS is row-level, not column-level,
-- so an anonymous caller holding the public anon key could
--   GET /rest/v1/profiles?select=full_name,phone,student_email
-- and walk every user in the database. In Zambia a mobile number is also a
-- mobile-money identity, so at campus scale that is a ready-made target list.
--
-- Signed-in users can still read contact details (needed for the WhatsApp and
-- call buttons); the anonymous bulk read is what goes away. Tightening this
-- further for `authenticated` is possible but needs a my_profile() definer
-- function first, because column privileges are role-wide, not row-aware.
--
-- PREREQUISITE, already done in the same change as this migration:
--   * web  — LISTING_SELECT no longer joins `phone`; getProfileById selects an
--            explicit public column list instead of `*`
--   * mobile — same two changes, plus contact via listing_seller_contact()
-- A `select *` or an embedded join naming a revoked column fails the WHOLE
-- request with 42501, so shipping those client changes first is not optional.

revoke select on public.profiles from anon;

grant select (
  id,
  full_name,
  avatar_url,
  university_id,
  is_verified_student,
  is_pioneer_seller,
  pioneer_awarded_at,
  created_at,
  updated_at
) on public.profiles to anon;

-- Signed-in callers keep full read for now (see note above), minus nothing.
-- Explicitly re-granting keeps the intent visible rather than relying on the
-- inherited table-level grant.
grant select on public.profiles to authenticated;
