-- Backfill the student verification that 20260819094000 only applied going forward.
--
-- That migration did two things in the right order but missed the middle:
--   * 20260819093000 seeded university_domains (empty before then)
--   * 20260819094000 added on_auth_user_email_confirmed, which verifies a student when
--     email_confirmed_at flips from null
--
-- Both are AFTER-the-fact for anyone who had already confirmed. At signup their domain
-- did not match (university_domains was empty), so handle_new_user wrote
-- university_id = null and is_verified_student = false; and the confirm trigger fires
-- on UPDATE of email_confirmed_at, which for them had already happened months earlier.
-- The result is an account that is a legitimately confirmed student, at a seeded
-- university, permanently unable to sell — with the only escape being the manual
-- link-a-student-email flow.
--
-- This applies exactly the same rule the trigger applies, to the rows the trigger
-- could never reach. It is deliberately identical in effect to
-- verify_student_on_email_confirmed so there is one definition of "verified student",
-- not two that can drift.
--
-- Idempotent: the `is_verified_student = false` guard means re-running is a no-op, and
-- it never downgrades or overwrites an already-verified account.

do $$
declare
  v_count integer;
begin
  update public.profiles p
  set is_verified_student       = true,
      university_id             = coalesce(p.university_id, ud.university_id),
      student_email             = lower(u.email),
      student_email_verified_at = coalesce(p.student_email_verified_at, u.email_confirmed_at),
      updated_at                = now()
  from auth.users u
  join public.university_domains ud
    on ud.domain = lower(split_part(u.email, '@', 2))
  where p.id = u.id
    and u.email_confirmed_at is not null
    and p.is_verified_student = false;

  get diagnostics v_count = row_count;
  raise notice 'backfilled % pre-existing confirmed student account(s)', v_count;
end $$;
