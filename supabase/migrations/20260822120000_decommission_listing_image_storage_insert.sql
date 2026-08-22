-- Phase 7: stop direct browser uploads into the legacy listing-images bucket.
-- Listing images are now written via presigned R2 PUTs; the bucket stays as an undo
-- path with public read access, but authenticated clients are no longer allowed to
-- upload new objects into it.

drop policy if exists "listing_images_auth_insert_storage" on storage.objects;
