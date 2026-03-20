alter table public.profiles
  add column if not exists student_email text,
  add column if not exists student_email_requested_at timestamptz,
  add column if not exists student_email_verified_at timestamptz;

create unique index if not exists profiles_student_email_unique
  on public.profiles (lower(student_email))
  where student_email is not null;
