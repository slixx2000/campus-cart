create extension if not exists pg_net;

create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  expo_push_token text not null,
  platform text not null default 'unknown' check (platform in ('android', 'ios', 'web', 'unknown')),
  is_active boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, expo_push_token)
);

create index if not exists push_tokens_user_idx
  on public.push_tokens (user_id, is_active);

alter table public.push_tokens enable row level security;

create policy "push_tokens_select_own" on public.push_tokens
  for select using (auth.uid() = user_id);

create policy "push_tokens_insert_own" on public.push_tokens
  for insert with check (auth.uid() = user_id);

create policy "push_tokens_update_own" on public.push_tokens
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "push_tokens_delete_own" on public.push_tokens
  for delete using (auth.uid() = user_id);

create or replace function public.send_expo_push_to_user(
  p_user_id uuid,
  p_title text,
  p_body text,
  p_data jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  token_row record;
begin
  for token_row in
    select expo_push_token
    from public.push_tokens
    where user_id = p_user_id
      and is_active = true
  loop
    perform net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      headers := '{"Content-Type":"application/json"}'::jsonb,
      body := jsonb_build_object(
        'to', token_row.expo_push_token,
        'title', p_title,
        'body', p_body,
        'sound', 'default',
        'data', coalesce(p_data, '{}'::jsonb)
      )
    );
  end loop;
end;
$$;

grant execute on function public.send_expo_push_to_user(uuid, text, text, jsonb) to authenticated;

create or replace function public.notify_message_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer_id uuid;
  v_seller_id uuid;
  v_listing_id uuid;
  v_recipient_id uuid;
  v_sender_name text;
  v_preview text;
begin
  select buyer_id, seller_id, listing_id
    into v_buyer_id, v_seller_id, v_listing_id
  from public.conversations
  where id = new.conversation_id;

  if v_buyer_id is null or v_seller_id is null then
    return new;
  end if;

  v_recipient_id := case when new.sender_id = v_buyer_id then v_seller_id else v_buyer_id end;

  select coalesce(full_name, 'Campus Cart user')
    into v_sender_name
  from public.profiles
  where id = new.sender_id;

  v_preview := left(new.content, 120);

  perform public.send_expo_push_to_user(
    v_recipient_id,
    format('New message from %s', v_sender_name),
    v_preview,
    jsonb_build_object(
      'type', 'message',
      'conversation_id', new.conversation_id,
      'listing_id', v_listing_id,
      'sender_id', new.sender_id
    )
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_message_insert on public.messages;
create trigger trg_notify_message_insert
after insert on public.messages
for each row execute function public.notify_message_insert();

create or replace function public.notify_listing_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  participant record;
  v_title text;
  v_body text;
begin
  if old.status is not distinct from new.status then
    return new;
  end if;

  if new.status not in ('sold', 'archived', 'removed') then
    return new;
  end if;

  if new.status = 'sold' then
    v_title := 'Listing marked as sold';
    v_body := format('%s is no longer available.', new.title);
  elsif new.status = 'archived' then
    v_title := 'Listing archived';
    v_body := format('%s has been archived by the seller.', new.title);
  else
    v_title := 'Listing removed';
    v_body := format('%s is no longer visible.', new.title);
  end if;

  for participant in
    select distinct case
      when c.buyer_id = new.seller_id then c.seller_id
      else c.buyer_id
    end as user_id
    from public.conversations c
    where c.listing_id = new.id
      and (c.buyer_id <> new.seller_id or c.seller_id <> new.seller_id)
  loop
    if participant.user_id is not null and participant.user_id <> new.seller_id then
      perform public.send_expo_push_to_user(
        participant.user_id,
        v_title,
        v_body,
        jsonb_build_object(
          'type', 'listing_status',
          'listing_id', new.id,
          'status', new.status
        )
      );
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists trg_notify_listing_status_change on public.listings;
create trigger trg_notify_listing_status_change
after update of status on public.listings
for each row execute function public.notify_listing_status_change();

create or replace function public.notify_verification_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.is_verified_student is distinct from new.is_verified_student then
    if new.is_verified_student = true then
      perform public.send_expo_push_to_user(
        new.id,
        'Student verification approved',
        'You are now verified and can post listings on Campus Cart.',
        jsonb_build_object('type', 'verification', 'status', 'approved')
      );
    elsif new.is_verified_student = false and old.is_verified_student = true then
      perform public.send_expo_push_to_user(
        new.id,
        'Student verification updated',
        'Your seller verification status has changed. Please review your account settings.',
        jsonb_build_object('type', 'verification', 'status', 'updated')
      );
    end if;
  end if;

  if new.verification_rejection_reason is not null
     and new.verification_rejection_reason is distinct from old.verification_rejection_reason then
    perform public.send_expo_push_to_user(
      new.id,
      'Student verification needs attention',
      'Your verification request was reviewed. Open Campus Cart for details.',
      jsonb_build_object('type', 'verification', 'status', 'rejected')
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_verification_review on public.profiles;
create trigger trg_notify_verification_review
after update of is_verified_student, verification_rejection_reason on public.profiles
for each row execute function public.notify_verification_review();
