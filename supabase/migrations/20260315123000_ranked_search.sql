create index if not exists idx_listings_search_fts
  on public.listings
  using gin (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')))
  where status = 'active' and deleted_at is null;

create or replace function public.search_listings_ranked(
  p_query text,
  p_page int default 0,
  p_page_size int default 20,
  p_category_id uuid default null,
  p_university_id uuid default null,
  p_max_price numeric default null,
  p_is_service boolean default null
)
returns table(
  listing_id uuid,
  combined_score double precision,
  total_count bigint
)
language sql
stable
set search_path = public
as $$
with filtered as (
  select
    l.id,
    l.title,
    l.description,
    l.view_count,
    l.created_at,
    ts_rank(
      to_tsvector('english', coalesce(l.title, '') || ' ' || coalesce(l.description, '')),
      plainto_tsquery('english', p_query)
    ) as text_rank
  from public.listings l
  where l.status = 'active'
    and l.deleted_at is null
    and to_tsvector('english', coalesce(l.title, '') || ' ' || coalesce(l.description, '')) @@ plainto_tsquery('english', p_query)
    and (p_category_id is null or l.category_id = p_category_id)
    and (p_university_id is null or l.university_id = p_university_id)
    and (p_max_price is null or l.price <= p_max_price)
    and (p_is_service is null or l.is_service = p_is_service)
),
scored as (
  select
    f.id,
    f.text_rank,
    ln(greatest(1, f.view_count + 1)::numeric) as popularity_raw,
    exp(-extract(epoch from (now() - f.created_at)) / (60 * 60 * 24 * 14)) as recency_raw
  from filtered f
),
normalized as (
  select
    s.id,
    case
      when max(s.text_rank) over () > 0 then s.text_rank / max(s.text_rank) over ()
      else 0
    end as text_score,
    case
      when max(s.popularity_raw) over () > 0 then s.popularity_raw / max(s.popularity_raw) over ()
      else 0
    end as popularity_score,
    s.recency_raw as recency_score,
    count(*) over () as total_count
  from scored s
)
select
  n.id as listing_id,
  (0.6 * n.text_score + 0.2 * n.popularity_score + 0.2 * n.recency_score) as combined_score,
  n.total_count
from normalized n
order by combined_score desc, n.id
offset greatest(0, p_page) * greatest(1, p_page_size)
limit greatest(1, p_page_size);
$$;

grant execute on function public.search_listings_ranked(text, int, int, uuid, uuid, numeric, boolean) to anon, authenticated;
