create or replace function public.search_listings(query_text text)
returns table (
  listing_id uuid,
  combined_score double precision,
  total_count bigint
)
language plpgsql
stable
set search_path = public
as $$
declare
  normalized_query text;
  expanded_query text;
  fts_threshold int := 8;
begin
  normalized_query := trim(lower(coalesce(query_text, '')));

  if normalized_query = '' then
    return;
  end if;

  select string_agg(distinct token, ' ')
  into expanded_query
  from (
    select normalized_query as token
    union all
    select s.synonym
    from public.search_synonyms s
    where s.word = normalized_query
    union all
    select s.word
    from public.search_synonyms s
    where s.synonym = normalized_query
  ) q;

  return query
  with parsed as (
    select
      plainto_tsquery('english', expanded_query) as expanded_ts_query,
      plainto_tsquery('english', normalized_query) as raw_ts_query
  ),
  fts as (
    select
      l.id as listing_id,
      ts_rank(l.search_vector, p.expanded_ts_query) as text_score,
      similarity(l.title, normalized_query) as typo_score
    from public.listings l
    cross join parsed p
    where l.status = 'active'
      and l.deleted_at is null
      and l.search_vector @@ p.expanded_ts_query
  ),
  fts_count as (
    select count(*)::int as total from fts
  ),
  typo_matches as (
    select
      l.id as listing_id,
      ts_rank(l.search_vector, p.raw_ts_query) as text_score,
      similarity(l.title, normalized_query) as typo_score
    from public.listings l
    cross join parsed p
    where l.status = 'active'
      and l.deleted_at is null
      and similarity(l.title, normalized_query) >= 0.18
      and not exists (select 1 from fts f where f.listing_id = l.id)
  ),
  blended as (
    select f.listing_id, f.text_score, f.typo_score from fts f
    union all
    select t.listing_id, t.text_score, t.typo_score
    from typo_matches t
    where (select total from fts_count) < fts_threshold
  ),
  ranked as (
    select
      b.listing_id,
      (coalesce(b.text_score, 0) * 0.6 + coalesce(b.typo_score, 0) * 0.4) as combined_score
    from blended b
  )
  select
    r.listing_id,
    r.combined_score,
    count(*) over () as total_count
  from ranked r
  order by r.combined_score desc, r.listing_id
  limit 20;
end;
$$;

grant execute on function public.search_listings(text) to anon, authenticated;
