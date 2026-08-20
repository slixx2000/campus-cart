-- Groundwork for moving listing images from Supabase Storage to Cloudflare R2.
-- Additive only: nothing here changes an existing read or write path, so this can be
-- applied well before any client starts uploading to R2.
--
-- Two things are added:
--   1. listing_images.object_key — the R2 key. public_url stays, and keeps being
--      written (as the CDN URL) so APKs already in the wild, which select only
--      public_url (mobile/src/lib/constants.ts), keep rendering without a rebuild.
--   2. upload_grants — a ledger of every presigned URL we mint. It does double duty:
--      it is the rate-limit counter for the presign endpoint, and it is the orphan
--      ledger the Phase 6 reaper walks to delete objects that were uploaded but never
--      attached to a listing.
--
-- Note on privileges: listing_images was NOT touched by 20260819091000, so its
-- table-level INSERT/UPDATE grants to `authenticated` are intact and object_key is
-- immediately writable. Had this been profiles or listings, the new column would have
-- needed an explicit column-level grant (see the CLAUDE.md privileges section).

-- ─── 1. The R2 object key ────────────────────────────────────────────────────
-- Nullable on purpose. Rows written before the cutover have only public_url; rows
-- written after have both. Readers prefer object_key and fall back to public_url,
-- which is what lets the two coexist with no backfill.
alter table public.listing_images
  add column if not exists object_key text;

comment on column public.listing_images.object_key is
  'Cloudflare R2 object key, e.g. listings/<user>/<listing>/<uuid>.webp. Prefer this over public_url; the CDN host is env config so it can change without a data migration.';

-- ─── 2. The upload grant ledger ──────────────────────────────────────────────
create table if not exists public.upload_grants (
  object_key  text primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  listing_id  uuid references public.listings(id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- The rate-limit query is "grants for this user in the last hour", so index that shape.
create index if not exists idx_upload_grants_user_created
  on public.upload_grants (user_id, created_at desc);

-- The reaper's query is "grants older than N hours", so index that separately.
create index if not exists idx_upload_grants_created
  on public.upload_grants (created_at);

alter table public.upload_grants enable row level security;

-- A user may only ever see or create their own grants. The presign endpoint runs on
-- the caller's own RLS-bound session (no service-role key exists in this project), so
-- these two policies are what the endpoint operates under.
drop policy if exists "upload_grants_owner_select" on public.upload_grants;
create policy "upload_grants_owner_select" on public.upload_grants
  for select using (auth.uid() = user_id);

drop policy if exists "upload_grants_owner_insert" on public.upload_grants;
create policy "upload_grants_owner_insert" on public.upload_grants
  for insert with check (auth.uid() = user_id);

-- Deliberately NO update policy: a grant is a fact about something that already
-- happened. Nothing should ever rewrite one.

-- ponytail: the reaper (Phase 6) needs to read grants across ALL users, which these
-- policies forbid. Deferred rather than guessed at: the options are a `security
-- definer` RPC (matches how the rest of this schema does privileged work) or finally
-- introducing a service-role key scoped to the cron route. Decide when the reaper is
-- written; nothing here forecloses either.

grant select, insert on public.upload_grants to authenticated;
