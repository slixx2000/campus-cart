-- listing_images.storage_path was the Supabase Storage object path. Images now live in
-- Cloudflare R2 and are addressed by object_key, so new rows have nothing meaningful to
-- put here — and stuffing the R2 key into it would leave two columns holding the same
-- value under two different meanings, which is exactly the kind of thing that reads as
-- deliberate to whoever finds it at 3am.
--
-- Made nullable rather than dropped, because rows written before the cutover still
-- carry a real Supabase path, and old mobile APKs (which cannot be force-updated) still
-- INSERT it. Dropping it is Phase 7 work, once neither is true.

alter table public.listing_images
  alter column storage_path drop not null;

comment on column public.listing_images.storage_path is
  'Legacy Supabase Storage path. Null for R2-era rows — use object_key. Drop once no pre-cutover rows and no old APKs remain.';
