-- Ensure storage buckets and policies exist in every environment.
-- This prevents avatar/listing images from uploading but failing to display.

insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do update set public = excluded.public;

insert into storage.buckets (id, name, public)
values ('profile-images', 'profile-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "listing_images_public_read_storage" on storage.objects;
create policy "listing_images_public_read_storage" on storage.objects
  for select using (bucket_id = 'listing-images');

drop policy if exists "listing_images_auth_insert_storage" on storage.objects;
create policy "listing_images_auth_insert_storage" on storage.objects
  for insert with check (bucket_id = 'listing-images' and auth.role() = 'authenticated');

drop policy if exists "listing_images_owner_delete_storage" on storage.objects;
create policy "listing_images_owner_delete_storage" on storage.objects
  for delete using (bucket_id = 'listing-images' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "profile_images_public_read_storage" on storage.objects;
create policy "profile_images_public_read_storage" on storage.objects
  for select using (bucket_id = 'profile-images');

drop policy if exists "profile_images_auth_insert_storage" on storage.objects;
create policy "profile_images_auth_insert_storage" on storage.objects
  for insert with check (bucket_id = 'profile-images' and auth.role() = 'authenticated');

drop policy if exists "profile_images_owner_update_storage" on storage.objects;
create policy "profile_images_owner_update_storage" on storage.objects
  for update using (bucket_id = 'profile-images' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'profile-images' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "profile_images_owner_delete_storage" on storage.objects;
create policy "profile_images_owner_delete_storage" on storage.objects
  for delete using (bucket_id = 'profile-images' and auth.uid()::text = (storage.foldername(name))[1]);