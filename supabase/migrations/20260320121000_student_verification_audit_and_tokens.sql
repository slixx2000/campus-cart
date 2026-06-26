alter table public.profiles
  add column if not exists verification_review_note text,
  add column if not exists verification_rejection_reason text,
  add column if not exists verification_reviewed_at timestamptz,
  add column if not exists verification_reviewed_by uuid references public.profiles(id);

create table if not exists public.student_email_verification_tokens (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  student_email text not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists student_email_verification_tokens_profile_idx
  on public.student_email_verification_tokens(profile_id, created_at desc);

alter table public.student_email_verification_tokens enable row level security;

create policy "student_email_verification_tokens_admin_read" on public.student_email_verification_tokens
  for select using (
    exists (
      select 1 from public.profiles admin_profile
      where admin_profile.id = auth.uid()
        and admin_profile.is_admin = true
    )
  );

create policy "student_email_verification_tokens_admin_insert" on public.student_email_verification_tokens
  for insert with check (
    exists (
      select 1 from public.profiles admin_profile
      where admin_profile.id = auth.uid()
        and admin_profile.is_admin = true
    )
    and created_by = auth.uid()
  );

create policy "student_email_verification_tokens_admin_update" on public.student_email_verification_tokens
  for update using (
    exists (
      select 1 from public.profiles admin_profile
      where admin_profile.id = auth.uid()
        and admin_profile.is_admin = true
    )
  )
  with check (
    exists (
      select 1 from public.profiles admin_profile
      where admin_profile.id = auth.uid()
        and admin_profile.is_admin = true
    )
  );

create or replace function public.consume_student_email_verification(p_token_hash text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token public.student_email_verification_tokens%rowtype;
  v_now timestamptz := now();
begin
  select *
  into v_token
  from public.student_email_verification_tokens
  where token_hash = p_token_hash
  for update;

  if not found then
    return false;
  end if;

  if v_token.consumed_at is not null or v_token.expires_at < v_now then
    return false;
  end if;

  update public.profiles
  set is_verified_student = true,
      student_email = v_token.student_email,
      student_email_verified_at = v_now,
      verification_rejection_reason = null,
      verification_reviewed_at = v_now,
      updated_at = v_now
  where id = v_token.profile_id;

  update public.student_email_verification_tokens
  set consumed_at = v_now
  where id = v_token.id;

  return true;
end;
$$;

grant execute on function public.consume_student_email_verification(text) to anon, authenticated;
