-- Clerk + Supabase identity bridge
-- Purpose:
-- 1) Read user UUID from JWT claim supabase_id (with auth.uid() fallback).
-- 2) Rewrite existing RLS policies/functions from auth.uid() to current_user_id().
-- 3) Decouple profiles.id from auth.users(id) so Clerk-managed users can be inserted.

begin;

create or replace function public.current_user_id()
returns uuid
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  claim text;
begin
  claim := nullif(current_setting('request.jwt.claim.supabase_id', true), '');

  if claim is not null then
    begin
      return claim::uuid;
    exception
      when invalid_text_representation then
        raise exception 'Invalid JWT claim supabase_id: expected UUID.';
    end;
  end if;

  return auth.uid();
end;
$$;

grant execute on function public.current_user_id() to anon, authenticated;

alter table public.profiles
  drop constraint if exists profiles_id_fkey;

-- Rewrite all RLS policies that currently depend on auth.uid().
do $$
declare
  pol record;
  roles_sql text;
  using_expr text;
  check_expr text;
  create_sql text;
begin
  for pol in
    select
      schemaname,
      tablename,
      policyname,
      permissive,
      cmd,
      roles,
      qual,
      with_check
    from pg_policies
    where (
      coalesce(qual, '') like '%auth.uid()%'
      or coalesce(with_check, '') like '%auth.uid()%'
    )
  loop
    roles_sql := '';
    if pol.roles is not null and array_length(pol.roles, 1) > 0 then
      roles_sql := ' TO ' || array_to_string(
        array(
          select case when r = 'public' then 'public' else quote_ident(r) end
          from unnest(pol.roles) as r
        ),
        ', '
      );
    end if;

    using_expr := case
      when pol.qual is null then null
      else replace(pol.qual, 'auth.uid()', 'public.current_user_id()')
    end;

    check_expr := case
      when pol.with_check is null then null
      else replace(pol.with_check, 'auth.uid()', 'public.current_user_id()')
    end;

    execute format('drop policy if exists %I on %I.%I', pol.policyname, pol.schemaname, pol.tablename);

    create_sql := format(
      'create policy %I on %I.%I as %s for %s%s',
      pol.policyname,
      pol.schemaname,
      pol.tablename,
      pol.permissive,
      pol.cmd,
      roles_sql
    );

    if using_expr is not null then
      create_sql := create_sql || ' USING (' || using_expr || ')';
    end if;

    if check_expr is not null then
      create_sql := create_sql || ' WITH CHECK (' || check_expr || ')';
    end if;

    execute create_sql;
  end loop;
end;
$$;

-- Rewrite public functions that still use auth.uid().
do $$
declare
  fn record;
  original_def text;
  rewritten_def text;
begin
  for fn in
    select p.oid, p.proname
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prokind = 'f'
      and p.proname <> 'current_user_id'
      and pg_get_functiondef(p.oid) like '%auth.uid()%'
  loop
    original_def := pg_get_functiondef(fn.oid);
    rewritten_def := replace(original_def, 'auth.uid()', 'public.current_user_id()');
    execute rewritten_def;
  end loop;
end;
$$;

commit;
