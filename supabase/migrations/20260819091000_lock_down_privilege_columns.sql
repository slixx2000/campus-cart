-- Security lockdown.
--
-- Three holes closed here, all exploitable with nothing but the public anon key:
--
--   1. `profiles_owner_update` is column-blind and no column grants existed, so any
--      signed-in user could PATCH their own row with {"is_verified_student":true,
--      "is_admin":true}. Granting themselves is_admin then unlocked `profiles_admin_update`,
--      i.e. write access to every profile in the system.
--   2. Two *permissive* INSERT policies on listings (`listings_owner_insert` and
--      `verified_students_can_create_listings`) were OR'd together by Postgres, so the
--      verified-student requirement never blocked anything.
--   3. `listings_owner_update` is column-blind too, so a seller could PATCH
--      {"featured":true} into the paid Featured carousel, or write last_bumped_at
--      directly to hold the top of the feed.
--
-- Note on technique: a column-level REVOKE does NOT subtract from a table-level grant.
-- The only reliable way to restrict columns is to revoke the table-level privilege and
-- re-grant an explicit column allowlist, which is what this migration does.

-- ─── profiles: column allowlist ──────────────────────────────
-- student_email stays user-writable so the already-shipped mobile app (which upserts it
-- in handleSaveProfile) keeps working; the trigger below is what stops it being abused.
revoke update on public.profiles from authenticated, anon;
grant update (
  full_name,
  phone,
  avatar_url,
  university_id,
  student_email,
  student_email_requested_at,
  updated_at
) on public.profiles to authenticated;

-- INSERT was as open as UPDATE: without this, is_admin could simply be supplied
-- at insert time instead of patched afterwards.
revoke insert on public.profiles from authenticated, anon;
grant insert (
  id,
  full_name,
  phone,
  avatar_url,
  university_id,
  student_email,
  student_email_requested_at,
  created_at,
  updated_at
) on public.profiles to authenticated;

-- Changing the claimed student email must always drop you back to unverified.
-- Web's linkStudentEmailAction did this in application code; mobile's handleSaveProfile
-- did not, so a verified user could swap their address and keep the badge.
create or replace function public.reset_verification_on_student_email_change()
returns trigger language plpgsql as $$
begin
  -- The `is_verified_student` guard matters: consume_student_email_verification
  -- sets the email AND the flag in one statement, and without it this trigger
  -- would immediately undo the verification it just granted.
  if new.student_email is distinct from old.student_email
     and new.is_verified_student = old.is_verified_student then
    new.is_verified_student := false;
    new.student_email_verified_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_reset_verification_on_email_change on public.profiles;
create trigger profiles_reset_verification_on_email_change
  before update of student_email on public.profiles
  for each row execute function public.reset_verification_on_student_email_change();

-- ─── profiles: admin review moves behind a definer function ──
-- Admins act with their own session (there is no service-role key in the app), so the
-- revoke above would otherwise lock admins out of approving anyone.
create or replace function public.admin_review_student_verification(
  p_profile_id uuid,
  p_approve    boolean,
  p_note       text default null,
  p_reason     text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
begin
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  ) then
    raise exception 'Only admins can review student verification.';
  end if;

  if p_approve then
    update public.profiles set
      is_verified_student          = true,
      student_email_verified_at    = v_now,
      verification_review_note     = nullif(btrim(coalesce(p_note, '')), ''),
      verification_rejection_reason= null,
      verification_reviewed_at     = v_now,
      verification_reviewed_by     = auth.uid(),
      updated_at                   = v_now
    where id = p_profile_id;
  else
    if nullif(btrim(coalesce(p_reason, '')), '') is null then
      raise exception 'A rejection reason is required.';
    end if;
    update public.profiles set
      is_verified_student          = false,
      student_email                = null,
      student_email_requested_at   = null,
      student_email_verified_at    = null,
      verification_rejection_reason= p_reason,
      verification_review_note     = nullif(btrim(coalesce(p_note, '')), ''),
      verification_reviewed_at     = v_now,
      verification_reviewed_by     = auth.uid(),
      updated_at                   = v_now
    where id = p_profile_id;
  end if;
end;
$$;

revoke all on function public.admin_review_student_verification(uuid, boolean, text, text) from public;
grant execute on function public.admin_review_student_verification(uuid, boolean, text, text) to authenticated;

-- ─── listings: one INSERT policy, not two permissive ones ────
drop policy if exists "listings_owner_insert" on public.listings;
drop policy if exists "verified_students_can_create_listings" on public.listings;

create policy "listings_verified_owner_insert" on public.listings
  for insert with check (
    auth.uid() = seller_id
    and (
      select count(*)
      from public.listings l
      where l.seller_id = auth.uid()
        and l.created_at >= (now() - interval '1 hour')
    ) < 10
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_verified_student = true
    )
  );

-- ─── listings: column allowlist ──────────────────────────────
-- featured and last_bumped_at drive paid placement and feed rank, so they may only move
-- through security-definer functions (bump_listing, update_my_listing). seller_id is
-- excluded so a listing can never be handed to another account.
-- Same hole on INSERT: `featured: true` supplied at creation time would have
-- landed straight in the paid carousel without any UPDATE at all.
revoke insert on public.listings from authenticated, anon;
grant insert (
  id,
  seller_id,
  title,
  description,
  price,
  category_id,
  university_id,
  condition,
  is_service,
  status
) on public.listings to authenticated;

revoke update on public.listings from authenticated, anon;
grant update (
  title,
  description,
  price,
  category_id,
  university_id,
  condition,
  is_service,
  status,
  deleted_at,
  updated_at
) on public.listings to authenticated;

-- ─── stop chat from re-ranking the feed ──────────────────────
-- The "liquidity loop" here set listings.last_bumped_at on every message, and
-- last_bumped_at desc is the feed sort key — so two accounts chatting could hold the top
-- of the feed indefinitely, for free, which also devalues paid placement.
-- Conversation freshness is preserved; listing rank is not touched.
create or replace function public.touch_conversation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.conversations set updated_at = now() where id = new.conversation_id;
  return new;
end;
$$;
