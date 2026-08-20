# CampusCart — Supabase Storage → Cloudflare R2 Migration Plan

Companion to `ARCHITECTURE.md`, which is the factual map this plan is built on. Read that first.
Nothing in this session changed application code; the only file written besides these two docs is
`scripts/count-supabase-storage.mjs` (read-only measurement tool).

---

## 0. Read this before anything else — three things that change the shape of the job

### 0.1 There is no data to migrate

Measured today against `mtbpuhxyhreyjefvumtf` (the ref in `.env.local` *and* hardcoded in
`next.config.mjs`):

```
listing-images    0 objects,  0.00 MB    listings        0 rows
profile-images   16 objects,  0.41 MB    listing_images  0 rows
                 (all 16 = the shipped     profiles        2 rows, 0 with an avatar
                  profile-icons/ defaults)
```

**Half of your brief — backfill, dual-read fallback, coexistence during transition — is
unnecessary as a data problem.** There is nothing to copy. You are not migrating; you are
choosing a storage backend before launch, which is enormously easier.

Coexistence still matters, but for a different reason: **APKs are distributed via GitHub Releases
(`mobile/src/lib/appUpdates.ts`), so old mobile builds live in the wild indefinitely.** The
compatibility problem is old *clients*, not old *data*. That changes the fallback design — see
§5.6.

If this ref is *not* production, this whole section is wrong and the plan needs re-costing.
It's the first open question in §9.

### 0.2 You have a live egress bug that is worth more than this migration, today

*(Fixed 2026-08-20 — recorded here because the reasoning still applies on R2.)*

Uploads set `cacheControl: "3600"`. Confirmed against a live object:

```
curl https://<ref>.supabase.co/storage/v1/object/public/profile-images/profile-icons/campus-01.png
→ cache-control: public, max-age=3600
```

Supabase echoes the upload parameter straight into the response header, and
`node_modules/next/dist/server/image-optimizer.js:875` computes
`maxAge = Math.max(minimumCacheTTL, getMaxAge(upstream))` — so **Vercel re-fetched every hot
source image from Supabase roughly once an hour, forever.**

One popular listing photo at 400 KB, refetched hourly across two size variants:
`400 KB × 2 × 24 × 30 ≈ 576 MB/month`. **Twenty** hot images ≈ 11 GB/month against a 5 GB free
egress allowance — with a catalogue that would fit in a phone's photo roll.

**What was actually changed** — narrower than first planned, for two reasons found during
implementation:

- `minimumCacheTTL` in `next.config.mjs` is **not needed**. It is only a *floor*; raising the
  upstream header alone gets there. Setting it would also have been actively harmful — see below.
- **Only unique-key uploads got the long TTL.** `src/lib/imageUpload.ts` (UUID key, `upsert:false`),
  `mobile/src/lib/imageUpload.ts` and `mobile/src/lib/profileUpload.ts` (both timestamped keys) are
  immutable by construction → `cacheControl: "31536000"`.
- **Web avatars were deliberately left at `3600`.** `src/lib/avatarService.ts:69` and
  `src/app/auth/actions.ts:141` write a *fixed* `${uid}/avatar.jpg` with `upsert: true` — a mutable
  key. A one-year TTL there pins a stale avatar for a year, and a global `minimumCacheTTL` would
  have done exactly that through `AvatarImage`'s `next/image`. There is a comment at the listing
  upload site warning against copying the value across.

Net diff: three lines. This was worth more than the migration at current scale.

### 0.3 What actually justifies the R2 move

Not egress (that's fixable above, and Vercel already caches). Not performance (Cloudflare and
Vercel both have African edge presence). The real driver is **Supabase's 1 GB free file-storage
cap**, which is a hard ceiling you cannot cache your way around:

At ~4 images/listing × ~400 KB, you cross 1 GB at roughly **600 listings**. That is a plausible
first-year number for a university marketplace, and the only remedy on Supabase is $25/month Pro.
R2's free tier is 10 GB — you cross *that* at roughly **9,000 listings** on the current format, or
**~35,000** after the WebP + thumbnail change, and the overage is $0.015/GB-month rather than a
$25 step.

So: **the move is justified, and now — with zero data — is the cheapest moment it will ever be.**
Good call on the timing. The rest of this document is about the design, where I push back.

---

## 1. Verdict on each element of your target design

| Your proposal | Verdict | Why |
|---|---|---|
| R2 bucket behind `cdn.campuscart.social` | **Yes** | Clean. Egress is free, custom domain gets full Cloudflare CDN, and `next.config.mjs:14` needs a one-line host swap. |
| Direct client → R2 via presigned PUT from a server endpoint | **Yes, with a re-ordering** | Fits, but the *current* web flow uploads before authorization. Fix that ordering while you're in there — §3. |
| Next.js route handler vs Supabase Edge Function | **Route handler, clearly** | §2. |
| Postgres stores the key, not the URL | **Yes, but keep writing `public_url` too** | Old APKs only select `public_url` (`mobile/src/lib/constants.ts:38`). §5.6. |
| Client-side WebP ~200–300 KB | **Yes on web, JPEG on mobile** | Expo has no WebP encode path on iOS. §4.1. |
| Separate ~30 KB thumbnail uploaded alongside | **Yes — and it's more valuable than you think** | It removes your dependence on Vercel's image-optimization quota. §4.2. |
| Supabase keeps auth / Postgres / realtime | **Yes** | Uncontroversial and correct. |
| Hotlink protection | **No — don't build it** | §5.2. |

---

## 2. Presign endpoint: Next.js route handler, not an Edge Function

**Route handler. Not close.**

For it:
- `supabase/functions/` **does not exist** in this repo. There is no Deno toolchain, no
  `deno.json`, no function deploy step in any script. Choosing Edge Functions means standing up a
  second runtime, a second deploy pipeline, and a second secret store on day one.
- `src/app/api/` already has four route handlers (`home-feed`, `search`, `profile-reviews`,
  `dev/bump-events`). The pattern, the lint config, and the Vercel deploy are all in place.
- The server-only-secret convention already exists and has a working precedent in
  `src/lib/mailer.ts:35–41` (un-prefixed env var, read inside server code, degrades gracefully).
- `@supabase/ssr`'s server client is already wired in `src/lib/supabase/server.ts` for JWT
  verification.

Against it — and this is real, so weigh it:
- **Mobile currently has zero dependency on the web app.** It talks only to
  `EXPO_PUBLIC_SUPABASE_URL`. Putting the presign endpoint on Vercel means the Expo app now
  breaks if the Vercel deploy breaks, and old APKs will hardcode whatever base URL you ship.
  An Edge Function would live on the Supabase origin mobile already trusts, and the Functions
  gateway verifies the JWT for you.
- `src/lib/supabase/server.ts` is **cookie-based**. Mobile sends a `Bearer` token, not cookies.
  You need a small second client factory that reads `Authorization` — maybe 10 lines, but it is a
  new code path, and getting it wrong means an unauthenticated presign endpoint.

Net: the second-runtime cost is paid immediately and forever; the coupling cost is a stable URL
in an env var. Take the route handler. Ship the base URL as `EXPO_PUBLIC_UPLOAD_API_URL` so an
old APK can be pointed elsewhere without a rebuild, and never change the endpoint path — treat
`/api/uploads/presign` as a frozen public contract from day one.

**Dependency pushback:** the obvious move is `@aws-sdk/client-s3` +
`@aws-sdk/s3-request-presigner`. That is ~2 MB of dependency and measurable cold-start cost in a
serverless function, to produce **one signed query string**. SigV4 query presigning is about
40 lines of `node:crypto` HMAC. For a single PUT and a single DELETE shape, hand-roll it in
`src/lib/r2.ts` and add no dependency. Leave one `assert`-based self-check next to it (sign a
known request, compare to a fixture) — that is the piece where a silent bug is expensive.

If you'd rather not own the signing code, `@aws-sdk/s3-request-presigner` is a legitimate choice
and I won't argue hard. But don't reach for it reflexively.

---

## 3. Authorization: verifying the caller before minting a URL

Today's storage policy is
`bucket_id = 'listing-images' AND auth.role() = 'authenticated'`
(`supabase/migrations/20260322153001_storage_buckets_and_policies.sql:17–18`).
Note what it does **not** check: the path. Delete and update policies verify
`auth.uid()::text = foldername(name)[1]`; insert does not. **Any authenticated user can write into
any other user's folder today.** Moving to presigned URLs is a chance to close that, not just to
port it.

### The rule that makes this safe

**The client never proposes a key.** The endpoint takes `{ listingId, count, contentType }` and
returns server-chosen keys. The user id comes from the verified JWT, never from the request body.
Path traversal, cross-user writes, and namespacing bugs all disappear by construction.

```
POST /api/uploads/presign
  Authorization: Bearer <supabase access token>   (mobile)  |  cookie session (web)
  { listingId: uuid, count: 1..6, contentType: "image/webp" | "image/jpeg" }

→ [{ key: "listings/<uid>/<listingId>/<uuid>.webp",
     thumbKey: "listings/<uid>/<listingId>/<uuid>_t.webp",
     putUrl, thumbPutUrl, expiresAt }]
```

### Checks, in order, before signing anything

1. **Authenticate.** `supabase.auth.getUser(token)`. This is a network round-trip to Supabase
   (~50 ms) but it is the lazy correct option — it validates signature *and* revocation, and you
   don't have to store a JWT secret. Local signature verification is a later optimisation; don't
   start there.
2. **`is_verified_student`.** Same check `src/app/sell/actions.ts:56` already makes. Reuse it.
3. **Listing ownership.** `select seller_id, status from listings where id = $1`. Must exist and
   `seller_id = uid`. **This is why the draft-first re-ordering below matters** — without a real
   listing row there is nothing to check ownership against, and you're back to trusting a
   client-generated UUID.
4. **Quota.** `count(*) from listing_images where listing_id = $1` plus the requested `count`
   must be ≤ 6 (`MAX_LISTING_IMAGE_COUNT`, `src/lib/imageUpload.ts:4`).
5. **Rate limit.** §5.1.

All of steps 2–4 run on the caller's own RLS-bound session, so no service-role key is needed and
your "nothing bypasses RLS" property survives.

### The re-ordering: create the listing as a draft first

`listing_status` already includes `'draft'` (`supabase/schema.sql:12`) and it is in the INSERT
column allowlist (`20260819091000_lock_down_privilege_columns.sql:165`). `listings_owner_select`
(`20260401121000_listings_owner_select_policy.sql`) lets an owner read their own non-active rows,
and `listings_public_read` (`schema.sql:141`) keeps drafts out of every feed. **Everything this
needs already exists.**

Today web does: mint a UUID client-side (`SellForm.tsx:126`) → upload 6 objects → *then* check
`is_verified_student` server-side (`sell/actions.ts:56`). An unverified user can push 5 MB into
your bucket and only then be told they can't sell, and the compensating delete at
`sell/actions.ts:139` only fires on listing-insert failure — not on the early returns at `:57` or
`:117`. Those objects leak, permanently.

Draft-first fixes that, and three other things at once:
- authorization runs before a single byte is uploaded,
- orphan cleanup becomes "reap old drafts", reusing the existing
  `on delete cascade` from `listings` to `listing_images` (`schema.sql:498`),
- web and mobile finally agree on ordering — `mobile/App.tsx:1274` already inserts the listing
  first.

Cost: `SellForm.tsx` submits a draft on first image-add instead of holding a client UUID, and
`createListingAction` flips `status: 'draft' → 'active'` instead of inserting. Both are inside
files you're editing anyway.

**Trade-off to be aware of:** the `listings_owner_insert` rate limit
(`schema.sql:142–151`, 10 rows/hour) now counts abandoned drafts. Someone who opens the sell form
eleven times and backs out gets locked out for an hour. Either exclude
`status = 'draft'` from that policy's count, or accept it. Flagging because it will look like a
bug in production and be hard to diagnose from a support ticket.

---

## 4. Compression and variants

### 4.1 WebP: yes on web, no on mobile

**Web:** `browser-image-compression` is already a dependency and already does exactly this
(`src/lib/imageUpload.ts:26`). Change `fileType: "image/jpeg"` → `"image/webp"`, adjust
`maxSizeMB` to `0.3`. That is a two-line change, and the 800 KB → ~250 KB drop is real.

**Mobile:** this is where your design gets awkward, and it's worth knowing before you commit.
`mobile/package.json` has **no image-processing library at all** — the only compression is
`ImagePicker`'s `quality: 0.75` (`mobile/src/lib/imageUpload.ts:22`), with no resize and no
dimension cap. To produce a resized WebP plus a thumbnail you must add `expo-image-manipulator`.
And `expo-image-manipulator`'s `SaveFormat.WEBP` **is Android-only — iOS does not support WebP
encode.** So "client-side WebP" means either an iOS special case or a format split.

Recommendation: **`expo-image-manipulator` on mobile, JPEG output, both variants.** Getting mobile
from "unbounded full-resolution phone photo" down to a capped 1200 px JPEG is worth ~80% of the
bytes. The extra ~25% from WebP is not worth a platform-conditional encode path in an app that
already carries duplicated logic on both sides. Store the extension in the key so a future
format change is per-object, not a migration.

Note that this is a **new native dependency in an Expo app that builds APKs via EAS** — it needs a
new build, and `mobile/app.json` `versionCode` must bump (`CLAUDE.md`). Not a code change you can
ship over-the-air.

### 4.2 Thumbnails: agree, and here's the argument you didn't make

You justified the thumbnail with "R2 has no free on-the-fly resizing." True, but the stronger
reason is this: **`src/components/ListingImage.tsx:37` currently leans on Vercel's image
optimizer for every card in the browse grid.** Vercel's Hobby plan meters image optimization
(source images / transformations per month — *the exact current limit is unknown, needs
confirmation from your Vercel dashboard*). At 2,000 listings × 4 images you are well into
metered territory, and blowing that quota degrades or bills in a way that has nothing to do with
Supabase or R2.

Serving a pre-made 30 KB thumbnail directly from `cdn.campuscart.social` with `unoptimized`
sidesteps that meter entirely for the grid — which is the overwhelming majority of image
requests. Keep `next/image` optimization for the product-page hero only.

One caveat worth stating: two variants means **two PUTs per image**, so Class A operations
double. At 5,000 listings × 4 images × 2 = 40,000 PUTs against R2's 1,000,000/month free
allowance, this is not remotely a concern. Mentioned only so it isn't a surprise line item.

Also set `Cache-Control: public, max-age=31536000, immutable` as a **signed header** on the PUT.
Keys are UUID-unique, so objects are immutable by construction, and this is the §0.2 fix carried
forward correctly.

---

## 5. The hard parts

### 5.1 Rate limiting and abuse

Constraints you get for free from the presign design:

- **`Content-Length`, signed.** SigV4 lets you sign `content-length` as a signed header; R2 rejects
  a PUT whose body doesn't match. Sign the *exact* byte count the client declares, and refuse to
  sign anything above 400 KB (full) / 60 KB (thumb) server-side. This is strictly stronger than
  today's client-side `MAX_LISTING_IMAGE_SIZE_BYTES` check (`SellForm.tsx:103`), which is trivially
  bypassable.
- **`Content-Type`, signed.** Allowlist `image/webp` and `image/jpeg`. Note this constrains the
  header, not the bytes — someone can still PUT arbitrary data labelled `image/webp`. It is
  capped at 400 KB, unguessably keyed, and served as an image, so the residual risk is "user
  wastes 400 KB of their own quota." Acceptable.
- **Short expiry.** 120 seconds. Long enough for a slow Zambian mobile connection to finish a
  400 KB PUT, short enough that a leaked URL is worthless.
- **Namespacing by uid**, by construction (§3) — closing the existing hole.

What you still have to build: **a presign rate limit**. Counting `listing_images` rows won't work,
because an abuser who never inserts rows never appears in that count. The lazy option that also
solves orphans is one small table:

```sql
create table public.upload_grants (
  object_key  text primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  listing_id  uuid references public.listings(id) on delete cascade,
  created_at  timestamptz not null default now()
);
create index on public.upload_grants (user_id, created_at desc);
```

The endpoint inserts one row per key it signs, and refuses if that user has more than N grants in
the last hour (start at 60 — ten listings × six images, matching `MAX_LISTINGS_PER_HOUR`). One
table, and it is also the orphan ledger in §5.3. Don't add a Redis or an edge rate limiter for
this; you have a database and the query is indexed.

> **Do not build hotlink protection.** You asked about it, so: it's a bad idea here. R2 egress is
> free — hotlinking costs you literally nothing. Referer-based blocking breaks link previews in
> WhatsApp, which is the primary sharing channel for this app (`src/lib/whatsapp.ts` exists for
> exactly that reason). You'd be spending effort to break your own distribution in order to save
> $0. Skip it.

### 5.2 What "public bucket" actually exposes

Public + custom domain means anyone who knows a key can GET it. Keys contain a v4 UUID, so they
are unguessable, and listing photos are public content by design. The one thing to keep in mind:
**there is no `LIST` exposure on a custom domain** — R2 custom domains serve objects, not
listings — so the bucket contents are not enumerable. Do not enable the R2 "public r2.dev
development URL"; use only the custom domain, so you keep the CDN and the rate limits that come
with it.

### 5.3 Orphans

With draft-first (§3) plus `upload_grants` (§5.1), reconciliation is a single sweep, and it is
the same sweep as §5.4:

```
For each upload_grant older than 24h with no matching listing_images row:
    DELETE the R2 object (and its _t thumbnail)
    DELETE the grant row
For each listing with status='draft' and created_at < now() - 24h:
    DELETE the listing row  → cascades to listing_images (schema.sql:498)
    (its objects are caught by the grant sweep above)
```

Run it from `src/app/api/cron/reap-images/route.ts` behind a Vercel Cron entry in `vercel.json`,
guarded by a `CRON_SECRET` bearer check. Daily is plenty.

Alternative I considered and rejected: upload to a `staging/` prefix and server-side-copy to the
final key on claim, letting an R2 lifecycle rule expire `staging/`. It's more "correct" and needs
no ledger, but it doubles Class A ops, adds a copy step to the hot path, and R2 lifecycle rules
are prefix-based so you'd need the prefix split anyway. The ledger is less machinery for the same
guarantee. Take the ledger.

### 5.4 Deletion

Two gaps, and only one of them is about R2.

**The pre-existing one:** `deleteListingAction` (`src/app/my-listings/actions.ts:69–91`) is a
*soft* delete — `deleted_at` + `status='archived'`. **Nothing in this codebase has ever deleted a
listing's images.** That's true on Supabase Storage today. Your bucket grows monotonically
regardless of backend, and 1 GB arrives sooner than the listing count suggests.

**The mobile one:** `mobile/src/lib/profileUpload.ts:31` writes `avatar-${Date.now()}.${ext}`, so
every mobile avatar change orphans the previous file forever. Web is fine — it upserts a fixed
`avatar.jpg` (`src/lib/avatarService.ts:69`). Either make mobile use the fixed key or add it to
the sweep.

Where deletion hooks in: **the same daily reaper, not a DB trigger.** You already have
`pg_net`-based triggers for push (`notify_message_insert`), so a trigger doing network I/O is
technically on-pattern — but a trigger that fails leaves you with no retry, no visibility, and a
delete path that can block on a network call. Add a third pass to the sweep:

```
For each listing_images row whose listing has deleted_at < now() - 30 days:
    DELETE the R2 object + thumbnail, then DELETE the row
```

Thirty days is a guess — see §9. This gives you an undo window and makes the reaper the single
place where objects die, which is much easier to reason about at 3am than three delete paths.

### 5.5 Existing data

Zero user objects (§0.1). Nothing to backfill. The 16 `profile-icons/*.png` defaults stay where
they are — avatars are out of scope (§1), so R2 starts completely empty.

Re-run the count any time with:

```bash
node --env-file=.env.local scripts/count-supabase-storage.mjs
```

It walks both buckets via the anon key (both have public `select` policies on `storage.objects`)
and prints objects and bytes per bucket. It writes nothing. Set `SUPABASE_SERVICE_ROLE_KEY` in
the environment instead if you ever lock those policies down.

### 5.6 Fallback and coexistence — the real version

Not about data. About **old APKs**, which `mobile/src/lib/appUpdates.ts` prompts to update but
cannot force.

Schema change:

```sql
alter table public.listing_images add column object_key text;
-- listing_images was NOT touched by 20260819091000, so table-level grants are intact
-- and this column is client-writable. (profiles and listings would need explicit grants —
-- see the "Database privileges" section of CLAUDE.md.)
```

Then, during transition, **write both columns**: `object_key` = the R2 key, and `public_url` =
the fully-qualified `https://cdn.campuscart.social/<key>` URL. Old APKs select only `public_url`
(`mobile/src/lib/constants.ts:38`) and keep working, pointed at R2, with no rebuild. New clients
prefer `object_key`.

Readers become one expression, in two places:

- `src/lib/mappers.ts:12` — `img.object_key ? cdnUrl(img.object_key) : (img.public_url ?? PLACEHOLDER)`
- `mobile/src/lib/mappers.ts:6` — same, once mobile's `LISTING_SELECT`
  (`mobile/src/lib/constants.ts:38`) starts selecting `object_key`

`next.config.mjs:14` lists **both** hosts for the transition, then drops the Supabase one when
you're satisfied. Same for `avatar_url` on `profiles`, which is a full URL in three places
(`profiles.avatar_url`, auth user metadata, and mobile's copy) — leave it as a URL for now; it's
one small image per user and not what's filling your bucket. Move avatars in a later, separate
pass, or never.

Drop the dual write once your GitHub Releases telemetry says the old APK cohort is small enough.
Until then it costs one `text` column and nothing else.

---

## 6. Phased plan

Every phase leaves the app working. Rollback for each is stated.

### Phase 0 — Cache-control fix ✅ DONE 2026-08-20
- **Changed:** `cacheControl: "31536000"` at `src/lib/imageUpload.ts`,
  `mobile/src/lib/imageUpload.ts`, `mobile/src/lib/profileUpload.ts` — the three unique-key
  upload sites. Web avatar sites and `next.config.mjs` deliberately untouched (§0.2).
- **Checks run:** `npm run build` ✅, `npm --prefix mobile run typecheck` ✅.
- **Still to verify at runtime:** post a listing while signed in, then `curl` the new object and
  expect `cache-control: public, max-age=31536000`. Watch Supabase egress fall over the following
  week. (Note: use GET — `curl -I` returns a misleading `no-cache` on Supabase Storage.)
- **Rollback:** revert; existing objects keep their old header until re-uploaded (harmless).

### Phase 1 — Infrastructure, no code ✅ DONE 2026-08-20
Bucket `campuscart-images`, scoped Object-Read-&-Write token, `cdn.campuscart.social`, and CORS
are all live. Nameservers moved off name.com to Cloudflare (`alaric`/`elaine.ns.cloudflare.com`).

**Verified by probe** (`scratchpad/r2probe.mjs`, throwaway — the real signer lands in
`src/lib/r2.ts` in Phase 2):

| Check | Result |
|---|---|
| Token authenticates (ListObjectsV2) | 200 |
| Presigned PUT with a correct body | 200 |
| Presigned PUT with a **size mismatch** | **403** |
| Unsigned PUT | 400 |
| Object served over `cdn.campuscart.social` | 200, `cf-ray`, `cf-cache-status: HIT` |
| CORS preflight, allowed origins | 204 on both the CDN host **and the S3 endpoint** |
| CORS preflight, `https://evil.example.com` | 403 |
| `cache-control` accepted as a signed/allowed header | yes |

Two findings worth carrying into Phase 2:

- **The signed `content-length` guardrail is real, not assumed.** §5.1 claimed R2 would reject a
  body that doesn't match the signed length; it returns **403**. That is now the enforcement
  mechanism for the size cap, and it is not bypassable from the client.
- **CORS must be satisfied at the S3 endpoint, not the CDN domain.** Presigned PUTs target
  `<account>.r2.cloudflarestorage.com`, so that is where the browser preflight lands. The bucket
  policy covers both, but anyone debugging a CORS failure should look at the S3 host.

- **Rollback:** delete the bucket. Nothing references it yet.

### Phase 2 — Presign endpoint ✅ DONE 2026-08-20

**Files added:** `src/lib/r2.ts` (SigV4 presign, `buildImageKeys`, `cdnUrl`,
`assertR2SigningUnchanged`), `src/app/api/uploads/presign/route.ts`,
`src/lib/supabase/bearer.ts`, migration
`20260820120000_r2_object_keys_and_upload_grants.sql` (applied to production).
`src/types/database.ts` gained `object_key` on `ListingImageRow` (optional on Insert
until Phase 4 populates it) and a `UploadGrantRow` / `upload_grants` mirror.

Nothing calls the endpoint yet — it deploys dark.

**Verified:**

| Check | Result |
|---|---|
| `npm run build`, `npm run lint` | clean |
| `assertR2SigningUnchanged()` | passes |
| Migration applied; `listing_images.object_key` present | yes |
| anon INSERT into `upload_grants` | 401 (RLS holds) |
| No auth / bogus bearer / malformed body | 401 |
| `GET` on the endpoint | 405 |
| **Live PUT with signed `cache-control`** | 200 |
| Same PUT omitting the signed header | 403 |
| CDN returns `public, max-age=31536000, immutable` | yes |

Three things found while building it:

- **Malformed JSON returned 500** with a raw parser message. `request.json()` throws,
  and the outer catch turned a client error into a server error. Now a guarded parse
  returning 400.
- **Validation ran before authentication**, so an anonymous caller got full zod field
  errors and cost us the work. Reordered to authenticate first — which also means the
  earlier rejection probes were all dying at zod and never testing the auth gate at all.
- **`cache-control` as a signed header was never covered by the Phase 1 probe.** It was
  added to `presignPut` afterwards, so it got its own live test above. Worth knowing:
  the Phase 0 immutable-cache work is now structurally guaranteed for R2 uploads rather
  than depending on a client passing the right option.

**Authenticated path verified 2026-08-20** from the browser console on `localhost:3000`,
using the real cookie session (so this also exercised the browser CORS preflight against
the S3 endpoint):

| Check | Result |
|---|---|
| Presign on own listing | 200 |
| Key namespaced under `listings/<uid>/<listingId>/` | yes |
| PUT full + thumb to R2 | 200 / 200 |
| GET back over CDN | 200, `public, max-age=31536000, immutable` |
| Presign against another listing id | 404 |
| 2 existing + 5 requested > 6 cap | 409 |
| `image/gif` | 400 |
| Declared size over 400 KB | 400 |

**Still unexercised: the 429 rate limit.** It needs >60 grants in an hour, but the quota
check (409) runs first and a listing caps at 6 images, so reaching it would take ~31
listings. The ordering is deliberate; the branch is simply untested.

**Deliberate leftover — do not "clean this up".** That run left two real R2 objects
(`listings/782d5aa4…/7e09ebe2…/17ab442f….webp` and its `_t` thumbnail) plus their two
`upload_grants` rows, with no matching `listing_images` row. That is precisely the
orphan shape the Phase 6 reaper exists to find, so it is being kept as a live fixture
rather than deleted and re-fabricated later. Note `upload_grants` has no DELETE policy,
so nothing but the reaper (or the SQL editor) can remove those rows.

**Rollback:** delete the route and `src/lib/r2.ts`. The migration is additive — leave it.

### Phase 3 — Draft-first sell flow ✅ DONE 2026-08-20 (verified end-to-end)

Still on Supabase Storage, deliberately — the storage swap is Phase 4 so a sell-flow
regression is unambiguous.

**`src/app/sell/actions.ts` split into two actions:**
- `createDraftListingAction(formData)` — authenticates, checks `is_verified_student`,
  validates all content, checks the (draft-excluded) hourly limit, inserts a
  `status='draft'` row, returns its id.
- `createListingAction(prev, formData)` — verifies the caller owns that draft and it is
  still a draft, inserts `listing_images`, then flips `status` to `'active'`.

**`src/app/sell/SellForm.tsx`** calls the draft action before uploading anything, then
uploads against the returned real id. A `draftIdRef` reuses the same draft if the user
retries after a failed upload, so a retry does not strand a second row. Draft errors are
merged into the existing `state` object, so all ~15 error render sites are untouched.

**Deviation from the original plan, deliberate:** the plan said create the draft "on
first image-add". The existing form does not upload at image-add time — everything
happens in `handleSubmit` — so hooking image-add would have added a state machine for
nothing. Creating the draft at the top of submit achieves the same three goals
(authorization before bytes, a real row for the presign endpoint to own-check, orphans
become stale drafts) with a much smaller diff.

**Two changes worth flagging:**
- **The listing id is now generated by the database, not the browser.** Previously
  `SellForm.tsx:126` did `crypto.randomUUID()`, which meant the client chose the key
  namespace its uploads would land in. It no longer has a say.
- **Images are inserted before the status flip.** A published listing with no photos is
  worse than a draft that failed to publish, and the draft is retryable.

**Migration `20260820130000_draft_listings_rate_limit.sql`** (applied): the INSERT
policy now counts non-draft rows against the 10/hour limit and gives drafts their own
looser cap of 30/hour, plus an index on `(seller_id, status, created_at desc)`.

**Verified:** `npm run build` clean, `npm run lint` clean, migration applied, drafts
invisible to anon (`status=eq.draft` returns `[]` for an unauthenticated reader).

**Verified end-to-end 2026-08-20.** A real listing was posted with two images. The proof
that draft-first actually works is the storage path:
`782d5aa4…/7e09ebe2-8ea1-47aa-95da-10662d89de70/c5e2481f….jpg` — that middle segment is
`listings.id`, and it came from Postgres. Under the old flow it came from
`crypto.randomUUID()` in the browser, so the draft row demonstrably existed before any
byte was uploaded.

**Three bugs found and fixed during that test:**
- `SellForm.tsx` file input rendered as a blank green pill: `dark:file:bg-accent` and
  `dark:file:text-accent` are the same colour. Light mode was fine, so it only showed in
  dark. Hover was also a no-op (identical to the base).
- **"Invalid university" on a field that was visibly filled.** The select carried
  `disabled={isLoading || universities.length === 0}`, and **a disabled control is
  omitted from FormData entirely** — submitting before `useUniversities` resolved sent no
  `universityId` at all. By the time the error rendered the dropdown had loaded and
  looked correct. Removing `disabled` lets the empty placeholder + `required` block
  submission in the browser, naming the real problem instead of a server round-trip that
  blames a filled-in field.
- **Introduced by this phase:** `draftIdRef` reuses the draft on retry, but
  `createListingAction` only flipped `status` — so edits made after the draft existed
  were silently discarded. Publish now re-validates and rewrites every content column,
  so the published row always equals the submitted form.

**Known gap, documented in the migration:** publishing is now an UPDATE, and
`listings_owner_update` has no rate limit, so the 10/hour publish ceiling is enforced in
the action rather than by the database. Gating the transition properly needs a trigger
(an RLS `WITH CHECK` cannot see the OLD row, so it would also block ordinary edits by
anyone with 10 recent listings). Not worth it today: relisting an archived listing has
always been unlimited through that same policy, so this is a pre-existing gap rather
than one draft-first introduced.

**Rollback:** revert the two files; stranded drafts are invisible to users.

### Phase 4 — Web writes to R2
- **Files:** `src/lib/imageUpload.ts` (WebP + thumbnail + presigned PUT, replacing the
  `supabase.storage` calls at `:62–79`), `src/app/sell/actions.ts` (persist `object_key`, and
  `public_url` as the CDN URL), `src/lib/mappers.ts:12` (prefer key), `next.config.mjs`
  (**both** hosts).
- **Verify:** post a listing on web; confirm the object lands in R2 under
  `listings/<uid>/<listingId>/`, that both columns are populated, that the card renders, and that
  the **unmodified current mobile APK** still renders the same listing. That last check is the
  whole point of the dual write.
- **Rollback:** revert; Supabase-written rows still have `public_url`, R2-written rows also have
  `public_url`. Both render either way. This is the phase the dual-write design exists to protect.

### Phase 5 — Mobile writes to R2
- **Files:** add `expo-image-manipulator`; `mobile/src/lib/imageUpload.ts` (resize + thumbnail +
  presigned PUT), `mobile/App.tsx:1286–1299`, `mobile/src/lib/constants.ts:38` (select
  `object_key`), `mobile/src/lib/mappers.ts:6`, `mobile/.env.example`
  (`EXPO_PUBLIC_CDN_URL`, `EXPO_PUBLIC_UPLOAD_API_URL`), `mobile/app.json` (`version`,
  `android.versionCode`).
- Needs an EAS build and a GitHub Release — not shippable over-the-air.
- **Verify:** `npm --prefix mobile run typecheck`; post from a device; confirm the thumbnail is
  what the grid loads; confirm a listing posted from mobile renders on web and vice versa.
- **Rollback:** publish the previous APK as latest; `appUpdates.ts` will offer it. Slower than a
  web rollback — hence why this phase is last among the writers.

### Phase 6 — Reaper
- **Files:** new `src/app/api/cron/reap-images/route.ts`, `vercel.json` cron entry, `CRON_SECRET`.
- Ship it in **dry-run mode first** (log what it would delete, delete nothing), read a week of
  logs, then enable deletion. A reaper is the one component where a bug is unrecoverable, so
  this is the place not to be lazy.
- **Verify:** create a draft, abandon it, run the job manually, confirm the grant and object are
  gone and no live listing lost an image.
- **Rollback:** remove the cron entry.

### Phase 7 — Decommission
- Drop the Supabase host from `next.config.mjs:14`. Optionally revoke the storage INSERT policies
  in a new migration. Keep the buckets — they cost nothing empty, and they are your undo.
- Only after old-APK traffic is negligible: stop writing `public_url` (§5.6).

---

## 7. YOUR MANUAL STEPS

Everything here is done by you in a browser or dashboard. Values you generate go into the env
files as marked. **Do not paste any R2 credential into a `NEXT_PUBLIC_` or `EXPO_PUBLIC_` var** —
those are compiled into the client bundle and, for mobile, into the APK.

### 7.1 Prerequisite — move the domain to Cloudflare

**Confirmed 2026-08-20: `campuscart.social` is on name.com nameservers, not Cloudflare.**

```
NS  campuscart.social  →  ns1hwy / ns2fln / ns3cgw / ns4lrt .name.com
```

`cdn.campuscart.social` can only be attached to an R2 bucket if Cloudflare is authoritative for
the zone, so this move is a hard prerequisite for everything else in Phase 1.

The good news is the zone is small and carries **no MX records**, so there is no inbound email to
break. Complete current contents, measured:

| Type | Name | Value | After the move |
|---|---|---|---|
| A | `@` | `216.198.79.1` (Vercel) | **DNS only — grey cloud** |
| CNAME | `www` | `5dfca209d91dea76.vercel-dns-017.com` | **DNS only — grey cloud** |
| TXT | `@` | `apple-domain-verification=aJeemhlADgXyLLag` | as-is |
| TXT | `@` | `google-site-verification=6XBcw92io8HssifuO3EVxXUdQeR5ouANwEcFkRzOgGw` | as-is |
| TXT | `_dmarc` | `v=DMARC1; p=none;` | as-is |

No AAAA, no MX, no CAA, no SPF.

Steps:

1. Cloudflare dashboard → **Add a site** → `campuscart.social` → **Free** plan.
2. Cloudflare scans and imports the existing records. **Compare the result against the table
   above, row by row, before continuing.** All five must be present.
3. **Set the two Vercel records (`@` and `www`) to DNS only — click the orange cloud so it turns
   grey.** Cloudflare imports them as proxied by default, and proxying a Vercel-hosted site
   through Cloudflare on top of Vercel's own edge and TLS causes redirect loops and certificate
   errors. This is the single most likely way to take the site down during this step.
4. Copy the two Cloudflare nameservers shown, then at **name.com → Domains → campuscart.social →
   Nameservers**, replace all four name.com nameservers with Cloudflare's two.
5. Wait for the Cloudflare zone to show **Active** (usually minutes; up to 24h).
6. Verify before moving on:
   ```bash
   dig +short NS campuscart.social          # expect the two Cloudflare nameservers
   curl -sI https://campuscart.social | head -1   # expect 200/307, site still up
   curl -sI https://www.campuscart.social | head -1
   ```

**Unrelated but worth fixing while you are in the DNS editor:** `MAIL_FROM` sends from
`@campuscart.social`, but the zone has **no SPF record** and no DKIM selector I could find. That
will be hurting deliverability on the student-verification emails (`src/lib/mailer.ts`) today,
independent of this migration. ZeptoMail's dashboard gives you the exact SPF and DKIM records to
add. Verify against ZeptoMail rather than trusting this note — DKIM selectors are arbitrary and I
only probed the common ones.

### 7.2 Create the bucket

1. Cloudflare dashboard → **R2 Object Storage** → if this is your first time, **Purchase R2**
   (the free tier still requires a payment method on file — no charge below the free limits).
2. **Create bucket**.
   - Name: `campuscart-images`
   - Location: **Automatic**, or set the hint to **Western Europe (WEUR)** — lowest-latency origin
     for Zambian traffic among R2's regions. With a custom domain the CDN caches at the Lusaka
     edge anyway, so this only affects cache misses and uploads.
   - Storage class: **Standard**.
3. **Create bucket**.

### 7.3 Create the S3-compatible API token

1. R2 → **API** → **Manage API tokens** → **Create API token**.
2. Token name: `campuscart-presign`.
3. Permissions: **Object Read & Write**. *Not* Admin Read & Write — that grants bucket
   create/delete, which your endpoint never needs.
4. **Specify bucket(s)** → select **only** `campuscart-images`.
5. TTL: **Forever** (or set a reminder to rotate; rotation means re-running this step and updating
   two env values).
6. **Create API Token**. The next screen shows, once only:
   - **Access Key ID** → `R2_ACCESS_KEY_ID`
   - **Secret Access Key** → `R2_SECRET_ACCESS_KEY`
   - **Endpoint** `https://<account-id>.r2.cloudflarestorage.com` — the hex string is your
     `R2_ACCOUNT_ID`
   Copy all three now.

### 7.4 Attach the custom domain

1. R2 → `campuscart-images` → **Settings** → **Public access** → **Custom Domains** →
   **Connect Domain**.
2. Enter `cdn.campuscart.social` → **Continue** → **Connect Domain**.
3. Cloudflare creates the CNAME automatically in the `campuscart.social` zone, **proxied**
   (orange cloud). Do not un-proxy it — grey-cloud means no CDN, and R2's free egress is via the
   Cloudflare edge.
4. Wait for status **Active**, then confirm:
   ```bash
   curl -I https://cdn.campuscart.social/anything   # expect 404 + a cf-ray header
   ```
   A `cf-ray` header proves you're hitting Cloudflare. A 404 (not a DNS error) proves the binding.
5. Leave the **r2.dev public development URL disabled** (§5.2).

### 7.5 CORS — required for direct browser PUTs

R2 → `campuscart-images` → **Settings** → **CORS Policy** → **Add CORS policy**, paste:

```json
[
  {
    "AllowedOrigins": [
      "https://campuscart.social",
      "https://www.campuscart.social",
      "http://localhost:3000"
    ],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["content-type", "content-length", "cache-control"],
    "ExposeHeaders": ["etag"],
    "MaxAgeSeconds": 3600
  }
]
```

Notes:
- Add your Vercel preview domain if you test uploads from previews — preview URLs are per-deploy,
  so a wildcard entry like `https://*.vercel.app` is the practical option. It is also broad; only
  add it if you actually need preview uploads.
- The Expo app is **not** a browser and does not preflight, so mobile needs nothing here.
- `AllowedHeaders` must include every header you sign. If you add a signed header later and forget
  this list, browser uploads start failing with an opaque CORS error while `curl` still works —
  that is the failure mode to remember.

### 7.6 Where each value goes

**`.env.local`** (local dev) **and** Vercel → Project `campus-cart` → Settings → Environment
Variables (Production + Preview + Development):

| Var | Value | Exposure |
|---|---|---|
| `R2_ACCOUNT_ID` | the hex account id from 7.3 | **server only** |
| `R2_ACCESS_KEY_ID` | from 7.3 | **server only** |
| `R2_SECRET_ACCESS_KEY` | from 7.3 | **server only** |
| `R2_BUCKET` | `campuscart-images` | **server only** |
| `NEXT_PUBLIC_CDN_URL` | `https://cdn.campuscart.social` | public (it's a public URL) |
| `CRON_SECRET` | `openssl rand -hex 32` | **server only** |

**`mobile/.env`** (and `mobile/.env.example`, values redacted):

| Var | Value |
|---|---|
| `EXPO_PUBLIC_CDN_URL` | `https://cdn.campuscart.social` |
| `EXPO_PUBLIC_UPLOAD_API_URL` | `https://campuscart.social` |

`mobile/.env` is baked into the APK at build time, so both must be set **before** the EAS build in
Phase 5, and both are public by definition. No R2 credential appears in either.

Also add `R2_*` and `CRON_SECRET` to EAS secrets? **No** — mobile never sees them. If you find
yourself needing to, something has gone wrong in the design.

### 7.7 Smoke-test the domain

~~Upload the default avatar set.~~ **Not needed** — avatars are out of scope (§1), so the 16
`profile-icons/*.png` stay in Supabase Storage and R2 holds listing images only.

Instead, upload any throwaway file to prove the binding works end to end:

R2 → `campuscart-images` → **Objects** → **Upload** → any small PNG, named `_smoketest.png`.

```bash
curl -sI https://cdn.campuscart.social/_smoketest.png | grep -i 'HTTP/\|cf-ray\|cf-cache-status'
# expect: 200, a cf-ray header, and cf-cache-status
```

A `cf-ray` header proves you are hitting Cloudflare's edge; a 200 proves the bucket binding.
Delete `_smoketest.png` afterwards so the reaper never has to reason about it.

---

## 8. Cost model

### Stated assumptions — correct these and the numbers move

- 4 images per listing average (cap is 6, `src/lib/imageUpload.ts:4`).
- **Today:** ~400 KB per image (JPEG, 1200 px, 800 KB hard cap) = **1.6 MB/listing**.
- **After:** ~250 KB full + ~30 KB thumb = **1.12 MB/listing**.
- Traffic scales with catalogue: 500 listings ≈ 300 MAU, 2,000 ≈ 1,200 MAU, 5,000 ≈ 3,000 MAU.
  **This is a guess and it is the least reliable input here** — see §9.
- Free-tier limits below are from memory and **should be verified against current pricing pages
  before you rely on them**: Supabase Free = 500 MB database, 1 GB file storage, 5 GB egress/mo.
  R2 Free = 10 GB-month storage, 1 M Class A ops/mo, 10 M Class B ops/mo, **egress always free**.

### Database size — never the constraint

A `listings` row plus 4 `listing_images` rows is ~1.6 KB; with indexes call it ~3.5 KB/listing.

| Listings | DB size | % of 500 MB |
|---|---|---|
| 500 | ~2 MB | 0.4% |
| 2,000 | ~7 MB | 1.4% |
| 5,000 | ~18 MB | 3.5% |

Messages, conversations and profiles dominate long before images do, and even those don't get you
near 500 MB at 3,000 MAU. **Postgres is not a limit in any scenario.** Storing keys instead of
URLs saves ~50 bytes/row — a rounding error, so do it for the flexibility, not the space.

### Scenario 1 — 500 listings

| | Supabase today | After R2 |
|---|---|---|
| Object storage | **800 MB / 1 GB → 80%** | 560 MB in R2 (5.6% of 10 GB) |
| Supabase egress | ~1–3 GB/mo *(or 10 GB+ with the §0.2 cache bug live)* | <0.5 GB/mo (JSON only) |
| R2 Class A | — | ~4,000 PUTs (0.4% of 1 M) |
| R2 Class B | — | negligible; CDN hits don't count |

**First limit hit: Supabase file storage, at roughly 600 listings.** If §0.2 goes unfixed, egress
beats it there — you could exceed 5 GB/month with a few dozen popular listings. Fix §0.2 and
storage is the honest ceiling.

### Scenario 2 — 2,000 listings

| | Supabase today | After R2 |
|---|---|---|
| Object storage | **3.2 GB → 3.2× over free; forces Pro ($25/mo)** | 2.24 GB (22% of 10 GB) |
| Supabase egress | 4–8 GB/mo → over free | <1 GB/mo |
| R2 Class A | — | ~16,000 PUTs |
| Everything else | | comfortably free |

**On Supabase: you're already paying $25/month.** On R2: still entirely free, and the binding
limit has become Vercel's image-optimization quota — which the §4.2 thumbnail plan removes.

### Scenario 3 — 5,000 listings

| | Supabase today | After R2 |
|---|---|---|
| Object storage | **8 GB → Pro ($25) + 8 GB over the 100 GB Pro allowance? no — inside it, but you're paying** | 5.6 GB (56% of 10 GB, **still free**) |
| Supabase egress | 10–20 GB/mo → over Pro's 250 GB? no — inside, but metered | ~1.8 GB/mo JSON |
| R2 Class A | — | ~40,000 PUTs (4%) |
| R2 Class B | — | maybe 200k–1 M origin misses (2–10%) |

**First limit hit after R2: R2 storage, at roughly 35,000 listings** — and the overage is
$0.015/GB-month, i.e. **about $0.38/month at 35,000 listings**, not a $25 step. Supabase stays on
the free tier throughout, because without images its footprint is tiny.

### Summary

| Scenario | Stay on Supabase | Move to R2 |
|---|---|---|
| 500 listings | ~$0, at 80% of the storage cap | $0, at 6% |
| 2,000 | **$25/mo** (Pro forced by storage) | $0 |
| 5,000 | **$25/mo** | $0 |
| ~35,000 | $25/mo+ | ~$0.40/mo |

The migration pays for itself the moment you cross ~600 listings, and the payment is $25/month
for as long as you'd otherwise stay. Doing it at zero data — as you are — costs one weekend and
no risk. **Do it.**

Caveat I'll repeat because it undercuts the urgency: **fix §0.2 first.** The egress numbers above
assume sane cache headers. Without them, the "Supabase today" column is much worse and you might
conclude R2 is more urgent than it is.

---

## 9. Open questions — I need answers to these before implementation

1. **Is `mtbpuhxyhreyjefvumtf` production?** Everything in §0.1 and §8 assumes yes, because it is
   what `.env.local` and `next.config.mjs:17` both point at. If production is a different ref with
   real listings, the backfill sections need rewriting and there is a real migration to plan.
2. **Is `campuscart.social` already on Cloudflare nameservers?** §7.1 is either a footnote or a
   day of DNS work depending on the answer.
3. **What are your actual traffic numbers?** The MAU-per-listing ratios in §8 are invented. If you
   have Vercel Analytics or Supabase dashboard figures for the last 30 days, the egress column
   becomes real instead of illustrative.
4. **Vercel plan and current image-optimization usage?** §4.2's argument depends on whether you're
   near that quota. Vercel → Usage → Image Optimization.
5. **Do you accept JPEG on mobile** (§4.1), or do you want the iOS/Android format split to get
   WebP everywhere? My recommendation is JPEG; I'd rather you say no than assume.
6. **Do you accept the draft-first sell flow** (§3)? It's the largest UX-adjacent change in the
   plan and it touches `SellForm.tsx`. Without it, orphan handling and pre-upload authorization
   both get materially worse — but it is your call.
7. **Retention for soft-deleted listings' images?** I assumed 30 days (§5.4). If you ever want to
   restore an archived listing with its photos intact, it needs to be longer.
8. **How long do you support old APKs?** This sets when the `public_url` dual write can stop
   (§5.6). If you have download stats per release, that's the input.
9. **Avatars: in scope or not?** I've scoped this to listing images, with avatars staying on
   Supabase Storage (§5.6) since they're small and the URL is duplicated across three places. Say
   if you want them moved in the same pass.
10. **Who runs `npx supabase db push`, and against what?** The plan adds three migrations
    (`upload_grants`, `listing_images.object_key`, the draft rate-limit exclusion). Confirm the
    deploy path, since `CLAUDE.md` describes linking by hand.
