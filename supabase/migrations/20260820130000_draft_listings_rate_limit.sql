-- Make the listings rate limit draft-aware.
--
-- The sell flow now reserves a `draft` row before uploading any image, so that
-- authorization happens before bytes land in storage and so the presign endpoint has a
-- real row to check ownership against. That breaks the old INSERT policy in one
-- specific way: it counted EVERY listing created in the last hour, so a user who
-- opened and abandoned ten sell forms would be locked out for an hour with nothing to
-- show for it — and the lockout would look, from a support ticket, exactly like a bug.
--
-- Drafts are invisible (listings_public_read requires status = 'active') and the reaper
-- clears them, so they should not consume the hourly allowance for real listings. They
-- are not free either — they are rows, and each one unlocks presigned uploads — so they
-- get their own, looser cap.

drop policy if exists "listings_verified_owner_insert" on public.listings;

create policy "listings_verified_owner_insert" on public.listings
  for insert with check (
    auth.uid() = seller_id
    -- Real listings: unchanged 10/hour.
    and (
      select count(*)
      from public.listings l
      where l.seller_id = auth.uid()
        and l.status <> 'draft'
        and l.created_at >= (now() - interval '1 hour')
    ) < 10
    -- Drafts: a much looser cap, high enough that no honest sell session reaches it
    -- and low enough to stop row spam. Uploads are separately capped by the
    -- upload_grants ledger, so this is not the only thing standing between a draft
    -- and a full bucket.
    and (
      select count(*)
      from public.listings l
      where l.seller_id = auth.uid()
        and l.status = 'draft'
        and l.created_at >= (now() - interval '1 hour')
    ) < 30
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_verified_student = true
    )
  );

-- Supports both subqueries above and the equivalent count in createDraftListingAction.
create index if not exists idx_listings_seller_status_created
  on public.listings (seller_id, status, created_at desc);

-- ponytail: publishing is now an UPDATE (draft -> active), and listings_owner_update
-- has no rate limit, so the 10/hour ceiling on publishes is enforced in
-- createDraftListingAction rather than by the database. Gating the transition properly
-- needs a trigger, because an RLS WITH CHECK cannot see the OLD row and would
-- therefore also block ordinary edits by anyone with 10 recent listings. Not worth a
-- trigger today: relisting an archived listing has always been unlimited through this
-- same policy, so this is a pre-existing gap, not one draft-first introduced.
-- Upgrade path: a BEFORE UPDATE trigger keyed on (old.status = 'draft' AND new.status
-- <> 'draft') if listing spam ever becomes real.
