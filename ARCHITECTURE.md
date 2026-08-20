# CampusCart — Image Storage Architecture (as of 2026-08-20)

Factual map of the current system, produced by reading the repo at commit `57a59ff`
(branch `mobile-redesign-and-auth-fixes`). Anything I could not establish from the code
is marked **unknown, needs confirmation**.

---

## 1. Stack and layout

| Deployable | Path | Stack |
|---|---|---|
| Web app | `src/` | Next.js **15.5.12** (App Router), React **18.2.0**, Tailwind 3.4, PWA. Deployed to Vercel (`.vercel/project.json` → project `campus-cart`). |
| Mobile app | `mobile/` | Expo **~55.0.29**, React Native **0.83.10**, React **19.2.0**, TypeScript 5.9. Distributed as APK via GitHub Releases, not app stores. |
| Backend | `supabase/` | Postgres + RLS + `security definer` RPCs. `schema.sql` + `migrations/*.sql`. |
| Shared pkg | `packages/shared/` | Declares overlapping types but **is imported by nothing** — editing it affects neither app. |

**There is no Flutter directory and no reference to a separate mobile repo.** The only mobile
client is `mobile/` (Expo/RN). `docs/mobile/` contains notes, not code.

Two corrections to `CLAUDE.md` worth noting, since they matter for planning:
- `CLAUDE.md` says mobile uses **NativeWind**. It does not — `mobile/package.json` has no
  `nativewind` dependency; styling is `StyleSheet` in `mobile/src/lib/styles.tsx`.
- **`supabase/functions/` does not exist.** There are no Supabase Edge Functions in this repo
  and no Deno toolchain configured. This is decisive for the presigned-URL endpoint choice
  (see the migration plan).

There is **no test framework** — no jest/vitest/playwright, no `npm test`. `npm run build` is
the only real typecheck for `src/`; `npm --prefix mobile run typecheck` for mobile.

---

## 2. Every place Supabase Storage is touched

Two buckets exist, both **public**, created in
`supabase/migrations/20260322153001_storage_buckets_and_policies.sql`:

- `listing-images` — key shape `${userId}/${listingId}/${uuid}.jpg` (web),
  `${userId}/${listingId}/${Date.now()}-${index}.${ext}` (mobile)
- `profile-images` — key shape `${userId}/avatar.jpg` (web),
  `${userId}/avatar-${Date.now()}.${ext}` (mobile), plus a shared read-only
  `profile-icons/` folder holding the default avatar set

### Uploads

| File | Line | Bucket | Notes |
|---|---|---|---|
| `src/lib/imageUpload.ts` | 62–68 | `listing-images` | Browser client. `upsert: false`, `contentType: image/jpeg`, `cacheControl: 3600` |
| `src/lib/avatarService.ts` | 71–77 | `profile-images` | Browser client. `upsert: true` |
| `src/app/auth/actions.ts` | 140–147 | `profile-images` | **Server Action** — the only server-side upload. Sign-up avatar, `upsert: true` |
| `mobile/src/lib/imageUpload.ts` | 46–51 | `listing-images` | base64 → `decode()` → ArrayBuffer, `upsert: false` |
| `mobile/src/lib/profileUpload.ts` | 33–36 | `profile-images` | `upsert: true` |

### Deletes

| File | Line | Notes |
|---|---|---|
| `src/app/sell/actions.ts` | 139–141 | **The only storage delete in the entire codebase.** Compensating cleanup when the `listings` INSERT fails after images were already uploaded. |

There is **no delete on listing deletion** — `deleteListingAction`
(`src/app/my-listings/actions.ts:69–91`) is a *soft* delete (`deleted_at` + `status='archived'`).
Storage objects are never removed. There is no avatar-replacement cleanup either; the web
avatar path is fixed (`avatar.jpg`, upsert) so it self-overwrites, but the **mobile** avatar path
is timestamped (`avatar-${Date.now()}.${ext}`), so every mobile avatar change leaves a permanent
orphan.

### Public URL construction

Always via `supabase.storage.from(bucket).getPublicUrl(path)` — never hand-built:
`src/lib/imageUpload.ts:76`, `src/lib/avatarService.ts:54,85`,
`src/lib/repositories/profiles.ts:39`, `src/app/auth/actions.ts:151`,
`mobile/src/lib/imageUpload.ts:57`, `mobile/src/lib/profileUpload.ts:43,68`.

### Listing / transform / signed URLs

- `list()` is used only to enumerate the default avatar folder:
  `src/lib/avatarService.ts:38` (browser), `src/lib/repositories/profiles.ts:22` (server),
  `mobile/src/lib/profileUpload.ts:50`.
- **No `createSignedUrl` calls anywhere.**
- **No Supabase image transforms anywhere** — `next.config.mjs:8–21` explains why: Supabase's
  transforms are Pro-only, so resizing/WebP happens in Next's optimizer instead.

---

## 3. Database schema for image data

`public.listing_images` — `supabase/schema.sql:496–503`:

```sql
create table public.listing_images (
  id           uuid primary key default gen_random_uuid(),
  listing_id   uuid not null references public.listings(id) on delete cascade,
  storage_path text not null,   -- e.g. "user-uuid/listing-uuid/file-uuid.jpg"
  public_url   text,            -- full https://<ref>.supabase.co/storage/v1/... URL
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);
```

So today the DB stores **both** the key and the fully-qualified URL, and every render path reads
`public_url`, not `storage_path`. `storage_path` is written but never read by application code —
it is only selected in the web `LISTING_SELECT` (`src/lib/repositories/listings.ts:9`) and dropped
on the floor by `dbListingToUi`. The mobile `LISTING_SELECT` (`mobile/src/lib/constants.ts:38`)
does not even select it.

Other columns holding a storage reference:

| Table.column | Where | Contents |
|---|---|---|
| `listing_images.storage_path` | `schema.sql:499` | object key, unused by app code |
| `listing_images.public_url` | `schema.sql:500` | full Supabase public URL — **this is what renders** |
| `profiles.avatar_url` | `schema.sql:56` | full Supabase public URL, or a `profile-icons/` default URL, or null |
| `auth.users.user_metadata.avatar_url` | `src/app/auth/actions.ts:158`, `src/app/profile/settings/actions.ts:150` | duplicated copy of the same URL |

That last one matters: the avatar URL is written to **three** places
(`profiles.avatar_url`, auth user metadata, and in mobile's own path) and they can drift.

No other table holds a storage reference. Student verification
(`supabase/migrations/20260819094000_self_service_student_verification.sql`) is **email-based**
and uploads no documents — there is no verification-document bucket.

Row type mirrors: `src/types/database.ts:91` (`storage_path`), `:299` (`listing_images` table),
`:484` (`ListingWithRelations`), and `packages/shared/src/supabase/database.ts:73` (unused).

---

## 4. RLS and storage policies

**Table RLS** — `supabase/schema.sql:504–515`:
- `listing_images_public_read` — `for select using (true)`
- `listing_images_owner_insert` — insert allowed only if `auth.uid()` is the parent listing's `seller_id`
- `listing_images_owner_delete` — same check for delete
- No UPDATE policy → image rows are immutable once written.

**Storage policies** — `20260322153001_storage_buckets_and_policies.sql`:

```
listing-images:  select  bucket_id = 'listing-images'                       -- anyone, incl. anon
                 insert  bucket_id = 'listing-images' AND auth.role() = 'authenticated'
                 delete  bucket_id = 'listing-images' AND auth.uid()::text = foldername(name)[1]
profile-images:  select  bucket_id = 'profile-images'                       -- anyone, incl. anon
                 insert  bucket_id = 'profile-images' AND auth.role() = 'authenticated'
                 update  auth.uid()::text = foldername(name)[1]
                 delete  auth.uid()::text = foldername(name)[1]
```

**Finding — the insert policies are not namespaced.** Delete and update check that the first
path segment equals the caller's uid; **insert does not**. Any authenticated user can today
write an object into any other user's folder in either bucket, e.g. overwrite-adjacent uploads
under `victim-uuid/...`. `upsert:false` on listing images blunts the worst case (no silent
overwrite) but `profile-images` inserts allow `upsert`. This is a live gap regardless of the R2
decision — and it is exactly the check the presigned-URL endpoint has to get right.

Note also that `listings` deletion is soft, and `listing_images` has `on delete cascade` on
`listings.id` — so a *hard* listing delete would silently drop image rows and leave every object
behind with no remaining pointer.

---

## 5. Client upload flow, end to end

### Web — listing images (`src/app/sell/SellForm.tsx` → `src/lib/imageUpload.ts` → `src/app/sell/actions.ts`)

1. `<input type="file">` change handler, `SellForm.tsx:101` — takes at most
   `MAX_LISTING_IMAGE_COUNT` = **6** files (`imageUpload.ts:4`).
2. `SellForm.tsx:103` rejects any file over `MAX_LISTING_IMAGE_SIZE_BYTES` = **15 MB**
   (`imageUpload.ts:5`). **There is no MIME-type validation on the client** — only the
   `accept` attribute, which is advisory.
3. `SellForm.tsx:126` mints the listing id client-side: `formData.set("listingId", crypto.randomUUID())`.
   This is why images can be uploaded to a listing-shaped key *before* the row exists.
4. For each file, `uploadListingImage()` (`imageUpload.ts:46`):
   - `compressListingImage()` (`:22`) — `browser-image-compression`, `maxSizeMB: 0.8`,
     `maxWidthOrHeight: 1200`, `initialQuality: 0.8`, forced to **`image/jpeg`**, web worker.
     Throws if the result still exceeds 800 KB (`:34`).
   - uploads to `${userId}/${listingId}/${crypto.randomUUID()}.jpg` (`:59`)
   - calls `getPublicUrl` and returns `{ publicUrl, storagePath }` (`:74–79`)
5. `SellForm.tsx:154` stuffs the array into the form as JSON: `formData.set("uploadedImages", …)`.
6. `createListingAction` (`src/app/sell/actions.ts:33`) validates with zod
   (`uploadedImageSchema`, `:11–14` — `publicUrl` must be a URL, `storagePath` non-empty; max 6
   at `:25`), checks `is_verified_student` (`:56`), enforces a 10-listings-per-hour rate limit
   (`:105–118`), inserts the `listings` row, and only then inserts `listing_images`
   (`:152–168`). On listing-insert failure it removes the uploaded objects (`:139–141`).

Note the ordering: **objects are uploaded before any server-side authorization runs.** An
unverified user (or anyone with a session) can push bytes into the bucket and only then be told
they aren't allowed to sell — and nothing cleans those up, because the compensating delete only
fires when the *insert* fails, not when the action returns early at `:57` or `:117`.

### Web — avatars

- Sign-up: `SignUpForm` sends the raw `File`; the Server Action uploads it
  (`src/app/auth/actions.ts:138–161`). Compression happens client-side via
  `compressProfileAvatarForSubmit` (`avatarService.ts:32`).
- Settings: `uploadProfileAvatar()` (`avatarService.ts:58`) uploads from the browser, returns the
  public URL, and `updateProfileAvatarAction` (`src/app/profile/settings/actions.ts:101–160`)
  validates it as a URL and writes it to `profiles.avatar_url` and auth metadata. The zod schema
  is `z.string().url()` — **any URL passes**, including one pointing at a third-party host.
- Avatar compression: `maxSizeMB: 0.3`, `maxWidthOrHeight: 400`, quality 0.82, forced JPEG,
  hard cap 300 KB (`avatarService.ts:6–8`).

### Mobile — listing images (`mobile/App.tsx:1263–1305`, `mobile/src/lib/imageUpload.ts`)

1. `pickImages()` (`imageUpload.ts:12`) — `expo-image-picker`, `selectionLimit: 5`,
   `quality: 0.75`. That picker quality is the **only** compression on mobile; there is no
   resize, no dimension cap, and **no size or MIME validation at all**.
2. `mobile/App.tsx:1263` inserts the `listings` row **first**, then uploads images (`:1286`),
   then inserts `listing_images` (`:1297`). This is the opposite order from web — mobile can
   produce a listing with zero images if upload fails (`:1301` just alerts), where web can
   produce orphan objects with no listing.
3. Files are read to base64 (`FileSystem.readAsStringAsync`) and decoded with
   `base64-arraybuffer`. For a full-resolution phone photo this holds ~1.3× the file in memory
   as a base64 string — a real OOM risk on low-end Android, **unknown, needs confirmation**
   whether it has been hit in the field.

### Mobile — avatars

`mobile/src/lib/profileUpload.ts:25` — timestamped path, `upsert: true`, no compression beyond
picker `quality: 0.75`, no validation.

---

## 6. How images are rendered

| Surface | Component | Mechanism |
|---|---|---|
| Web listing cards / product page | `src/components/ListingImage.tsx:37` | `next/image` with `fill`, `sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"`, `onError` → local SVG fallback, `unoptimized` only for `.svg` (`:34`) |
| Web avatars | `src/components/AvatarImage.tsx:30` | `next/image`, fixed `256×256`, `sizes="256px"`, `onError` → icon fallback |
| Web ad banners | `src/components/AdBanner.tsx:36` | plain `<img>` — deliberately, so advertiser domains don't need `remotePatterns` |
| Web sell-form previews | `src/app/sell/SellForm.tsx:584` | plain `<img>` on a local `objectURL` |
| Mobile | `mobile/src/components/FallbackImage.tsx:17` | `expo-image` `<Image source={{uri}}>` with error→fallback URI |

**`next.config.mjs:14–20` allow-lists exactly one remote host:**

```js
remotePatterns: [{
  protocol: "https",
  hostname: "mtbpuhxyhreyjefvumtf.supabase.co",
  pathname: "/storage/v1/object/public/**",
}]
```

Consequences for the migration: the Supabase host is **hardcoded**, and Next's optimizer is
currently doing all resize/WebP work. Placeholder is a static local asset,
`/images/placeholder-electronics.svg` (`src/lib/mappers.ts:4`). There is no `blurDataURL`, no
`placeholder="blur"`, and no explicit `loading` prop — `next/image` defaults to lazy except where
`priority` is passed. No thumbnail variants exist at all today: the browse grid downloads the
same 1200px/800KB object the product page does, and only Next's optimizer keeps that cheap.

---

## 7. Env var conventions and secret handling

| Var | Read at | Exposure |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `src/lib/supabase/client.ts:5`, `server.ts:7` | public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `client.ts:6`, `server.ts:8` | public |
| `NEXT_PUBLIC_SITE_URL` | auth callback URL builder | public |
| `ZEPTOMAIL_TOKEN` / `RESEND_API_KEY` | `src/lib/mailer.ts:40–41` | **server-only** |
| `MAIL_FROM` | `src/lib/mailer.ts:35` | server-only |
| `EXPO_PUBLIC_SUPABASE_URL` / `_ANON_KEY` | `mobile/src/lib/supabase.ts`, `mobile/.env` | public (baked into the APK) |

Established convention: `NEXT_PUBLIC_` / `EXPO_PUBLIC_` prefix ⇒ shipped to the client;
un-prefixed ⇒ server-only, read inside `"use server"` files or route handlers.
`src/lib/mailer.ts` is the existing precedent for a server-only secret, and it degrades
gracefully when unset rather than throwing.

**There is no service-role key anywhere in the repo or in `.env.local`** — every server path
today runs on the caller's own cookie-backed anon session, i.e. under RLS. Nothing currently
bypasses RLS.

---

## 8. Current data volume (measured 2026-08-20)

Measured with `scripts/count-supabase-storage.mjs` (read-only, written this session) against the
project in `.env.local` — `mtbpuhxyhreyjefvumtf`, the same ref hardcoded in `next.config.mjs`:

```
listing-images        0 objects        0.00 MB
profile-images       16 objects        0.41 MB
TOTAL                16 objects        0.41 MB
```

All 16 objects are the shipped default avatar set (`profile-icons/campus-*.png`, ~27 KB each),
uploaded 2026-08-20. Cross-checked against Postgres via REST:

```
listings         0 rows
listing_images   0 rows
profiles         2 rows (0 with a non-null avatar_url)
```

**There is no user-generated image data to migrate.** Whether this ref is the real production
project or a staging one is **unknown, needs confirmation** — but it is the one `next.config.mjs`
and `.env.local` both point at, and the one Vercel deploys against.

Run it yourself with:

```bash
node --env-file=.env.local scripts/count-supabase-storage.mjs
```

---

## 9. Summary of pre-existing defects found while mapping

These are true today, independent of R2. Listed because the migration either fixes them for
free or inherits them.

1. **Storage INSERT policies are not namespaced by uid** (§4) — any authenticated user can write
   into any user's folder.
2. **Uploads happen before authorization** on web (§5) — unverified users can push bytes into the
   bucket and are only rejected afterwards, with no cleanup.
3. **Deleting a listing never deletes its objects** (§2) — soft delete only; the bucket grows
   monotonically.
4. **Mobile avatar changes orphan the previous file** every time (§2).
5. **`updateProfileAvatarAction` accepts any URL** (§5) — `z.string().url()` with no host check.
6. **Mobile does no compression, resizing, or size validation** (§5) — full-resolution phone
   photos land in the bucket; web caps them at 800 KB / 1200 px.
7. **Web and mobile write different key shapes** into the same bucket (§2), and mobile does not
   select `storage_path` at all (§3).
