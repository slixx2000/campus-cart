-- Student verification regression test.
--
-- Paste into the Supabase SQL editor (or psql) and read the NOTICEs: every line
-- must say PASS. The final ERROR is deliberate — it rolls back the test data.
--
-- Covers the three routes a student can become verified, and the ways they must
-- not be able to.

do $$
declare
  v_personal uuid := gen_random_uuid();
  v_campus   uuid := gen_random_uuid();
  v_other    uuid := gen_random_uuid();
  v_token    text;
  v_ok       boolean;
begin
  if exists (select 1 from public.university_domains where domain = 'zcasu.edu.zm') then
    raise notice 'PASS: launch campus domain (zcasu.edu.zm) is on file';
  else
    raise notice 'FAIL: zcasu.edu.zm missing — ZCAS students cannot self-verify';
  end if;

  -- ── Route 1: personal signup, then link + confirm a student address ─────────
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                          created_at, updated_at)
  values (v_personal, '00000000-0000-0000-0000-000000000000', 'authenticated',
          'authenticated', 'student@personal.example', 'x', now(), now());

  if (select is_verified_student from public.profiles where id = v_personal) then
    raise notice 'FAIL: unconfirmed signup was auto-verified';
  else
    raise notice 'PASS: unconfirmed signup is NOT auto-verified';
  end if;

  perform set_config('request.jwt.claims',
    json_build_object('sub', v_personal, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);

  begin
    update public.profiles set student_email = 'me@gmail.com' where id = v_personal;
    raise notice 'FAIL: a free-mail address was accepted as a student email';
  exception when others then
    raise notice 'PASS: free-mail address refused as a student email';
  end;

  update public.profiles set student_email = 'me@zcasu.edu.zm' where id = v_personal;

  select public.issue_student_email_verification() into v_token;
  raise notice 'PASS: student minted their own token (% chars)', length(v_token);

  begin
    perform public.issue_student_email_verification();
    raise notice 'FAIL: resend throttle did not fire';
  exception when others then
    raise notice 'PASS: resend throttle fired';
  end;

  select public.consume_student_email_verification(
           encode(sha256(convert_to(v_token, 'UTF8')), 'hex')) into v_ok;
  perform set_config('role', 'postgres', true);

  if v_ok and (select is_verified_student from public.profiles where id = v_personal) then
    raise notice 'PASS: consuming the token verifies the student';
  else
    raise notice 'FAIL: verification did not stick (rpc returned %)', v_ok;
  end if;

  select public.consume_student_email_verification(
           encode(sha256(convert_to(v_token, 'UTF8')), 'hex')) into v_ok;
  if v_ok then
    raise notice 'FAIL: token could be reused';
  else
    raise notice 'PASS: token is single-use';
  end if;

  -- ── Route 2: signs up with the campus address directly ─────────────────────
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                          created_at, updated_at)
  values (v_campus, '00000000-0000-0000-0000-000000000000', 'authenticated',
          'authenticated', 'aisha@zcasu.edu.zm', 'x', now(), now());

  if (select is_verified_student from public.profiles where id = v_campus) then
    raise notice 'FAIL: verified before the address was confirmed';
  else
    raise notice 'PASS: campus signup not verified until confirmed';
  end if;

  if (select university_id from public.profiles where id = v_campus)
     = (select id from public.universities where code = 'zcasu') then
    raise notice 'PASS: university auto-assigned from the email domain';
  else
    raise notice 'FAIL: university not assigned from domain';
  end if;

  update auth.users set email_confirmed_at = now() where id = v_campus;
  if (select is_verified_student from public.profiles where id = v_campus) then
    raise notice 'PASS: auto-verified once the address is confirmed';
  else
    raise notice 'FAIL: still unverified after confirmation';
  end if;

  -- ── Route 3: a university not on file falls back to admin review ────────────
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                          created_at, updated_at)
  values (v_other, '00000000-0000-0000-0000-000000000000', 'authenticated',
          'authenticated', 'bob@personal.example', 'x', now(), now());
  update public.profiles set student_email = 'bob@someotheruni.ac.zm' where id = v_other;

  perform set_config('request.jwt.claims',
    json_build_object('sub', v_other, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);

  begin
    perform public.issue_student_email_verification();
    raise notice 'FAIL: minted a token for an unlisted domain';
  exception when others then
    if sqlerrm like '%no_domain_on_file%' then
      raise notice 'PASS: unlisted domain routes to admin review';
    else
      raise notice 'FAIL: unexpected error — %', sqlerrm;
    end if;
  end;

  begin
    perform public.issue_student_email_verification(v_campus);
    raise notice 'FAIL: a student minted a token for another account';
  exception when others then
    raise notice 'PASS: cannot mint a token for another account';
  end;

  perform set_config('role', 'postgres', true);
  raise exception 'rollback test data (expected)';
end $$;
