alter table public.conversations
  add column if not exists buyer_last_read_at timestamptz,
  add column if not exists seller_last_read_at timestamptz;

update public.conversations
set
  buyer_last_read_at = coalesce(buyer_last_read_at, now()),
  seller_last_read_at = coalesce(seller_last_read_at, now());

create or replace function public.mark_conversation_read(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
begin
  v_uid := auth.uid();

  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  update public.conversations c
  set
    buyer_last_read_at = case
      when c.buyer_id = v_uid then greatest(coalesce(c.buyer_last_read_at, 'epoch'::timestamptz), now())
      else c.buyer_last_read_at
    end,
    seller_last_read_at = case
      when c.seller_id = v_uid then greatest(coalesce(c.seller_last_read_at, 'epoch'::timestamptz), now())
      else c.seller_last_read_at
    end
  where c.id = p_conversation_id
    and (c.buyer_id = v_uid or c.seller_id = v_uid);
end;
$$;

grant execute on function public.mark_conversation_read(uuid) to authenticated;
