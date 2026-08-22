# Outstanding work

Status as of 2026-08-22. Written after the v1.2.0 release attempt and a repo scan of the R2 migration work.

---

## 1. Finish the v1.2.0 release

The reason this release matters: migration `20260819096000` is live and revokes
`phone` from `anon`. The published APK (**v1.1.0, 2026-04-04**) still names that
column in `LISTING_SELECT`, and Postgres fails the whole request on a revoked
column. **Signed-out users of the installed app get an empty feed right now.**
Confirmed against production — the shipped select returns `42501`, the current one
returns rows.

- [ ] **Rebuild the APK.** The last good build (`ab0a6065`) was made at commit
      `a3f67ee`. It predates `aa31472`, so it still has the invisible light-mode
      spinners and the 9-avatar cap.
      `cd mobile && npx eas-cli build -p android --profile preview --non-interactive --no-wait`
- [ ] **Push `aa31472`** — everything else is already on
      `origin/mobile-redesign-and-auth-fixes`.
- [ ] **Publish the release.** Tag `v1.2.0`, asset named exactly
      **`campuscart.apk`** — `src/app/downloads/page.tsx` falls back to
      `.../download/v<version>/campuscart.apk`, and `mobile/src/lib/appUpdates.ts`
      polls `releases/latest`. Publishing prompts every installed v1.1.0 user to
      update, which is the intent but not something to trigger by accident.
- [ ] **Merge the branch into `main`.** `origin/main` has the web work (PR #5) but
      none of the five mobile commits. Leaving them unmerged is how production
      drifted from `main` last time.
- [ ] **Decide on `releases/`.** `git-lfs` is not installed on this machine, and
      the existing `releases/*.apk` entries are 133-byte LFS pointer stubs. Adding
      a real 79 MB APK without the LFS binary would break the convention. The repo
      copy is vestigial — both clients read the Releases API — so skipping it is
      fine, but the choice should be deliberate.

## 2. Not yet verified

Everything here is unverified, not known-broken.

- [ ] **Light mode on the signed-in mobile screens** (Account profile card, stat
      cards, Account Settings, Seller Profile). Dark is confirmed on a real build.
      Light is inferred from the same tokens working elsewhere.
- [ ] **Google sign-in end to end on the APK.** The PKCE fix (`3a95c30`) has never
      been exercised on a real build.
- [ ] **Push notification registration on the APK.** `pushNotifications.ts`
      lazy-loads `expo-notifications` behind an Expo Go guard — this is the first
      build where that guard is false, so it takes a path Expo Go never runs.
- [ ] The test account was signed out on the emulator during verification.

## 3. Dashboard and console — not code

- [ ] **Supabase → Emails → Templates.** Both message bodies still start with a
      literal `Subject: …` line (my formatting, pasted in by mistake). Delete that
      line and the blank line under it, then set the Subject fields:
      "Reset your CampusCart password" and "Confirm your CampusCart email".
- [ ] **Google Cloud Console → OAuth consent screen.** Add branding and publish.
      While it sits in Testing, only listed test users can complete Google
      sign-in — and v1.2.0 advertises that sign-in as fixed.
- [ ] **Vercel → Settings → Git → Production Branch.** Confirm it points at `main`.
      It was serving production from the feature branch.
- [ ] **Google Search Console.** Verify `campuscart.social` by DNS TXT at Name.com,
      submit `sitemap.xml`, and request re-indexing so the new title, description
      and favicon replace the cached crawl.
- [ ] **Rotate the test account password.** `slixx2000@gmail.com`'s password was
      pasted into a chat transcript.
- [ ] **Zoho Mail MX records.** The domain sends mail but cannot receive any, which
      is a mild negative signal to spam filters.
- [ ] **DMARC → `p=quarantine`.** Currently `p=none`. Move it up once SPF and DKIM
      have passed consistently for a couple of weeks.

## 4. Known-deferred code

- [ ] **`cli.appVersionSource` is unset** in `eas.json`. EAS warns on every build
      and will require it. It decides whether `versionCode` comes from `app.json`
      (current behaviour) or is managed remotely. Deliberately not changed
      mid-release — it alters versioning behaviour.
- [ ] **`docs/avatars/` is untracked**, along with a stray
      `docs/Avatar set review (1).zip`. The PNGs are the source of what now lives in
      `profile-images/profile-icons`. Worth committing the sources and deleting the
      zip.
- [ ] **`forgotPasswordAction` in `src/app/auth/actions.ts` is dead code** — nothing
      imports it. The live path is `ForgotPasswordForm` → `sendPasswordResetEmail`.
- [ ] **`ForgotPasswordForm` says "login code or reset link"** but no OTP-code entry
      path exists; reset is link-only. Cosmetic, but it promises something absent.
- [ ] **Supabase CLI is v2.79.0**, v2.115.0 is out.
- [ ] `npm install` in `mobile/` reports 20 vulnerabilities (1 critical). Not
      triaged.

## 5. Landmines worth remembering

Things that cost time this session and would cost it again.

- **EAS environment variables silently override `eas.json`.** The `preview`
  environment held an anon key from the *old* Supabase project
  (`oylrsfntvbgucdldxbwa`), so every build back to v1.1.0 shipped a key that did
  not match the URL — the "Invalid API key" error at sign-in. Those duplicate
  variables are now deleted; `eas.json` is the single source of truth. Do not
  re-add them without deleting the `eas.json` copies.
- **Expo Go cannot catch native version mismatches.** It ships its own matched
  native modules. `expo-font` resolved to 57.x against `expo-modules-core` 55.x and
  crashed on launch in a real build while Expo Go was perfectly happy. `mobile/package.json`
  now pins `expo-font` via `overrides` because `@expo/vector-icons` declares it as
  an unbounded peer dependency (`>=14.0.4`) and npm auto-installs peers.
- **`expo install --fix` only checks direct dependencies.** It reported
  "up to date" while a broken transitive copy sat at the root of `node_modules`.
- **Grep for colour literals must cover both quote styles.** A sweep matching only
  `'#rrggbb'` missed 38 double-quoted ones in JSX attributes and reported the
  theme migration complete when it was not.
- **Anything that touches a revoked column fails the whole request.** Client
  changes ship *before* the revoke migration, never after.

Status snapshot from the current repo (checked 2026-08-22): Phases 4-6 are implemented.
Phase 7 remains outstanding.

- [x] Phase 4 — Web writes to R2

  This is already in the repo: `src/lib/imageUpload.ts` compresses to WebP and a
  second thumbnail, `src/app/api/uploads/presign/route.ts` mints presigned R2 PUTs,
  `src/app/sell/actions.ts` persists both `object_key` and `public_url`, and
  `src/lib/mappers.ts` prefers `object_key` with the CDN fallback. `next.config.mjs`
  allows both hosts during the transition, and `src/components/ListingImage.tsx`
  serves R2/CDN images unoptimized while leaving the product-page hero on the
  optimizer.

  The remaining verification work is the operational check described below, not a
  code gap.

- [x] Phase 5 — Mobile writes to R2

  Mobile now resizes to a 1200px JPEG + thumbnail, requests presigned R2 URLs via
  `EXPO_PUBLIC_UPLOAD_API_URL`, and inserts `object_key` along with the CDN URL for
  backward compatibility. The dependency is now in `mobile/package.json`, and the env
  and app metadata have been updated in `mobile/.env.example` and `mobile/app.json`.

- [x] Phase 6 — Reaper

  Added the dry-run-first cron handler in `src/app/api/cron/reap-images/route.ts`,
  created the Vercel cron entry in `vercel.json`, and signed the R2 DELETE URLs in
  `src/lib/r2.ts`. The route checks `CRON_SECRET` and defaults to dry-run mode so it
  can be observed before enabling live deletion.

- [x] Phase 7 — Decommission

  Dropped the Supabase Storage host from `next.config.mjs`, and added the migration to disable direct
  authenticated writes into the legacy listing-image bucket. The bucket remains as a rollback safety
  net, and legacy `public_url` dual writes stay in place until old APK traffic is negligible.

## 6. Planned monetization roadmap (phases 8+)

These are the feature phases to implement next, ordered to match the product roadmap in
`docs/paymentsUpgrade.md` and to keep the first launch focused on paid visibility rather than broad
commerce infrastructure.

- [x] **Phase 8 — Payment abstraction and provider service**

  - Added a single payment service layer with a provider abstraction and a Bila implementation.
  - Wired environment-backed config for the selected provider and webhook signing secrets.
  - Kept provider logic server-only and separated it from the UI.
  - Added a webhook route that verifies Bila's signature using the documented `timestamp.body` HMAC scheme.

- [x] **Phase 9 — Payment database model**

  - Added the canonical `payment_products`, `payments`, and `payment_webhook_events` tables in Supabase.
  - Added provider, amount, currency, status, purpose, metadata, and webhook tracking fields.
  - Added indexes and RLS policies for authenticated user/admin access and payment-record integrity.

- [x] **Phase 10 — Payment provider integration**

  - Integrated the first provider with a secure server-side Bila collection session flow.
  - Added ZMW pricing conversion and integer-safe minor-unit tracking.
  - Added a provider-backed session route that creates the payment record and returns the provider response.

- [ ] **Phase 11 — Webhook processing and fulfillment**

  - Add `/api/payments/webhook` with signature verification and event replay protection.
  - Mark payments as `paid`/`failed` only after verified provider responses.
  - Trigger the correct feature activation only once per payment (`idempotency`).

- [ ] **Phase 12 — Product and pricing system**

  - Add configurable pricing items for Boost, Featured, and Seller Pro.
  - Store product definitions in the database rather than hard-coding them in components.
  - Add admin controls for enabling/disabling price points and durations.

- [ ] **Phase 13 — Listing Boost**

  - Let sellers purchase a temporary visibility bump for an existing listing.
  - Add a boost duration selector, purchase flow, status tracking, and expiration logic.
  - Update ranking logic so boosted listings get a boost without overshadowing organic discovery.

- [ ] **Phase 14 — Featured Listings**

  - Add premium placements for homepage/category/search featuring.
  - Require labeled sponsored/featured display and moderation controls.
  - Track expiration and rotation so featured inventory is finite and reviewable.

- [ ] **Phase 15 — Promotion expiration and analytics**

  - Add a scheduled job that expires outdated promotions and removes premium ranking.
  - Record impressions/clicks and conversion metrics at the listing and seller level.
  - Add admin reporting for active, expired, and failed promotion records.

- [ ] **Phase 16 — Seller Pro**

  - Add a recurring subscription flow for power sellers.
  - Include premium profile/storefront options, discounted boosts, and higher listing limits.
  - Scope this as a revenue-validation feature, not a full business-facing SaaS rollout.

- [ ] **Phase 17 — Seller storefronts**

  - Add a seller profile page with banner, description, categories, and featured inventory.
  - Restrict storefront upgrades to paying sellers only and keep free profiles basic.
  - Treat this as a later enhancement after the first monetization proof is validated.

- [ ] **Phase 18 — Business advertising**

  - Add campus-specific sponsored placements, business ad units, and promotion bundles.
  - Keep all branded placement clearly labelled and moderated.
  - Defer until the platform has a stable revenue loop and clear ad policy.

- [ ] **Phase 19 — CampusCart Checkout**

  - Build a buyer-facing commerce layer only after core monetization is stable.
  - Add order management, cart/checkout flows, and transaction records where needed.
  - Keep this out of the first MVP unless product direction explicitly requires it.

- [ ] **Phase 20 — Transaction fees and delivery**

  - Add platform fees, payout logic, shipping/delivery support, and refunds/disputes.
  - This is a later-stage commerce feature and should not be launched before the visibility MVP is proven.

### MVP recommendation for the next phase

The repo should start from the first concrete revenue slice:

- [ ] Boost Listing
- [ ] Featured Listing
- [ ] Seller Pro (lightweight subscription tier only)
- [ ] Payment abstraction + provider integration + verified webhook processing
- [ ] Product/pricing configuration + admin controls

This covers the minimum viable monetization path described in the roadmap without prematurely
building checkout, payouts, or delivery infrastructure.

Explicitly out of scope

- Avatars stay on Supabase Storage (user's call). Known consequence: the mobile avatar orphan
  bug persists — mobile/src/lib/profileUpload.ts:31 writes avatar-${Date.now()}.${ext}, so every
  mobile avatar change leaks the previous file. Web is fine (fixed avatar.jpg, upsert).
- Hotlink protection. R2 egress is free, so hotlinking costs $0, and Referer blocking would
  break WhatsApp link previews — the app's primary sharing channel (src/lib/whatsapp.ts).
- Backfill / dual-read for legacy data. There is none.

Verification

No test framework exists in this repo. The gates are:

npm run build                        # only real typecheck for src/
npm --prefix mobile run typecheck
node --env-file=.env.local scripts/count-supabase-storage.mjs   # re-measure any time

Plus per phase, in order: curl -I the CDN URL (Phase 1) → curl the presign endpoint through all
five rejection cases (Phase 2) → post + abandon a listing on web (Phase 3) → post on web and confirm
the old APK still renders it (Phase 4) → post from a device, both directions (Phase 5) → run the
reaper dry-run and confirm no live listing loses an image (Phase 6).

Non-blocking questions

Answers refine numbers; none block starting.

1. Is campuscart.social already on Cloudflare nameservers? Decides whether §7.1 is a footnote or
   a day of DNS work.
2. Vercel plan + current image-optimization usage — sharpens the Phase 4 thumbnail argument.
3. Retention window for soft-deleted listings' images. Plan assumes 30 days; longer if you ever
   want to restore an archived listing with photos intact.
4. How long to support old APKs — sets when the public_url dual write can stop.
5. Real traffic numbers (Vercel Analytics / Supabase dashboard) — the MAU-per-listing ratios in the
   cost model are invented.