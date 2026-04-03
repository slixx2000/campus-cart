-- Follow-up migration for listing lifecycle and seller-only edit/relist actions.

drop policy if exists "listings_owner_update" on public.listings;
create policy "listings_owner_update" on public.listings
  for update
  using (auth.uid() = seller_id)
  with check (auth.uid() = seller_id);

create or replace function public.update_my_listing(
  p_listing_id uuid,
  p_status public.listing_status default null,
  p_deleted_at timestamptz default null,
  p_last_bumped_at timestamptz default null
)
returns public.listings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.listings;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  update public.listings
  set
    status = coalesce(p_status, status),
    deleted_at = case when p_deleted_at is null then deleted_at else p_deleted_at end,
    last_bumped_at = coalesce(p_last_bumped_at, last_bumped_at),
    updated_at = now()
  where id = p_listing_id
    and seller_id = auth.uid()
  returning * into v_row;

  if v_row.id is null then
    raise exception 'Listing not found or not owned by user';
  end if;

  return v_row;
end;
$$;

grant execute on function public.update_my_listing(uuid, public.listing_status, timestamptz, timestamptz) to authenticated;

create or replace function public.update_my_listing_details(
  p_listing_id uuid,
  p_title text,
  p_description text,
  p_price numeric
)
returns public.listings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.listings;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  update public.listings
  set
    title = p_title,
    description = p_description,
    price = p_price,
    updated_at = now()
  where id = p_listing_id
    and seller_id = auth.uid()
  returning * into v_row;

  if v_row.id is null then
    raise exception 'Listing not found or not owned by user';
  end if;

  return v_row;
end;
$$;

grant execute on function public.update_my_listing_details(uuid, text, text, numeric) to authenticated;

create table if not exists public.hidden_conversations (
  user_id uuid not null references public.profiles(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, conversation_id)
);

alter table public.hidden_conversations enable row level security;

drop policy if exists "hidden_conversations_owner_select" on public.hidden_conversations;
create policy "hidden_conversations_owner_select" on public.hidden_conversations
  for select
  using (auth.uid() = user_id);

drop policy if exists "hidden_conversations_owner_insert" on public.hidden_conversations;
create policy "hidden_conversations_owner_insert" on public.hidden_conversations
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "hidden_conversations_owner_delete" on public.hidden_conversations;
create policy "hidden_conversations_owner_delete" on public.hidden_conversations
  for delete
  using (auth.uid() = user_id);
