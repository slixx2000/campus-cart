-- Student verification that can actually run without an admin.
--
-- Before this, three things were broken:
--   1. handle_new_user trusted the signup email's DOMAIN alone and set
--      is_verified_student = true immediately — before the address was ever
--      confirmed. Harmless only because university_domains was empty; the moment
--      domains are seeded (previous migration) it becomes "sign up as
--      anyone@zcasu.edu.zm and you're a verified seller".
--   2. Only an admin could mint a verification token, so the one cryptographically
--      sound path required a human in the loop for every student.
--   3. Nothing validated the claimed student email, so gmail addresses were accepted.

-- ─── 1. Auto-verify only on a CONFIRMED address ──────────────────────────────
-- university_id is still derived at signup (it's useful and harmless); the
-- verification flag now waits for proof of delivery.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  uni_id uuid;
begin
  select university_id into uni_id
  from public.university_domains
  where domain = lower(split_part(new.email, '@', 2))
  limit 1;

  insert into public.profiles (id, full_name, phone, university_id, is_verified_student)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', null),
    uni_id,
    -- OAuth (Google) arrives already confirmed; email/password does not.
    uni_id is not null and new.email_confirmed_at is not null
  );
  return new;
end;
$$;

-- ...and pick them up when they confirm later.
create or replace function public.verify_student_on_email_confirmed()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  uni_id uuid;
begin
  if old.email_confirmed_at is not null or new.email_confirmed_at is null then
    return new;
  end if;

  select university_id into uni_id
  from public.university_domains
  where domain = lower(split_part(new.email, '@', 2))
  limit 1;

  if uni_id is null then
    return new;
  end if;

  update public.profiles
  set is_verified_student       = true,
      university_id             = coalesce(university_id, uni_id),
      student_email             = lower(new.email),
      student_email_verified_at = now(),
      updated_at                = now()
  where id = new.id
    and is_verified_student = false;

  return new;
end;
$$;

drop trigger if exists on_auth_user_email_confirmed on auth.users;
create trigger on_auth_user_email_confirmed
  after update of email_confirmed_at on auth.users
  for each row execute function public.verify_student_on_email_confirmed();

-- ─── 2. A free-mail address is never a student email ─────────────────────────
-- Enforced in the database so it holds for the web action, the mobile upsert and
-- raw PostgREST alike, rather than in three separate clients.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_student_email_not_freemail'
  ) then
    alter table public.profiles
      add constraint profiles_student_email_not_freemail check (
        student_email is null
        or split_part(lower(student_email), '@', 2) not in (
          'gmail.com','googlemail.com','yahoo.com','yahoo.co.uk','ymail.com',
          'hotmail.com','hotmail.co.uk','outlook.com','live.com','msn.com',
          'icloud.com','me.com','aol.com','proton.me','protonmail.com','zoho.com'
        )
      );
  end if;
end $$;

-- ─── 3. Self-service token minting ───────────────────────────────────────────
-- Returns the raw token; the caller emails it. The hash-at-rest, 24h expiry and
-- single-use consumption are unchanged — consume_student_email_verification
-- (migration 20260320121000) was already correct, it just had no way to be reached.
create or replace function public.issue_student_email_verification(
  p_profile_id uuid default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller   uuid := auth.uid();
  v_target   uuid := coalesce(p_profile_id, auth.uid());
  v_is_admin boolean;
  v_email    text;
  v_token    text;
begin
  if v_caller is null then
    raise exception 'You must be signed in.';
  end if;

  select coalesce(is_admin, false) into v_is_admin
  from public.profiles where id = v_caller;

  if v_target <> v_caller and not v_is_admin then
    raise exception 'Admin access required.';
  end if;

  select lower(student_email) into v_email
  from public.profiles where id = v_target;

  if v_email is null then
    raise exception 'Link a student email first.';
  end if;

  -- Self-service is limited to universities whose domain is on file. Anything
  -- else raises `no_domain_on_file`, which the app turns into the admin-review
  -- message — so an unlisted university is a slower path, not a dead end.
  if not v_is_admin and not exists (
    select 1 from public.university_domains
    where lower(domain) = split_part(v_email, '@', 2)
  ) then
    raise exception 'no_domain_on_file';
  end if;

  -- Resend throttle. Also stops a token-flooding loop against the mailer quota.
  if exists (
    select 1 from public.student_email_verification_tokens
    where profile_id = v_target
      and created_at > now() - interval '5 minutes'
  ) then
    raise exception 'A verification email was just sent. Check your inbox, or try again in a few minutes.';
  end if;

  -- pgcrypto lives in the `extensions` schema on Supabase and this function
  -- pins search_path to public, so gen_random_bytes must be schema-qualified.
  v_token := encode(extensions.gen_random_bytes(24), 'hex');

  insert into public.student_email_verification_tokens
    (profile_id, student_email, token_hash, expires_at, created_by)
  values
    (v_target, v_email,
     encode(sha256(convert_to(v_token, 'UTF8')), 'hex'),
     now() + interval '24 hours',
     v_caller);

  update public.profiles
  set student_email_requested_at = now(), updated_at = now()
  where id = v_target;

  return v_token;
end;
$$;

-- EXECUTE is granted to PUBLIC by default, and anon is a member of PUBLIC.
revoke all on function public.issue_student_email_verification(uuid) from public, anon;
grant execute on function public.issue_student_email_verification(uuid) to authenticated;
