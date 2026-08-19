# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

CampusCart — a student marketplace for Zambian universities. One repo, three deployables:

- `src/` — Next.js 15 App Router web app (React 18, Tailwind, PWA)
- `mobile/` — Expo / React Native app (React 19, RN 0.83, NativeWind), built to APK via EAS
- `supabase/` — the actual backend: schema, migrations, RLS policies, Postgres functions

There is no server of our own. Both clients talk to Supabase directly; authorization lives in RLS
policies and `security definer` RPCs, not in application code.

## Commands

```bash
npm run dev            # web dev server (localhost:3000)
npm run build          # production build — the only real typecheck for src/
npm run lint           # next lint

npm run mobile:start   # expo start
npm run mobile:android # expo run:android
npm --prefix mobile run typecheck   # tsc --noEmit for mobile/ (its own tsconfig)
npm run shared:typecheck            # typecheck packages/shared

npx supabase link --project-ref <ref>
npx supabase db push   # apply supabase/migrations/* to the linked project
```

There is no test framework in this repo — no jest/vitest/playwright, no `npm test`. Verify changes
by running the app or the relevant build. `src/` has no standalone `tsc` script; `npm run build`
is what catches type errors there.

Env vars: web reads `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` from `.env.local`;
mobile reads `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` from `mobile/.env`
(see `mobile/.env.example`). Also on web: `NEXT_PUBLIC_SITE_URL` (canonical origin — without it
verification links point at localhost), and `RESEND_API_KEY` + `MAIL_FROM` for the student
verification email — or `ZEPTOMAIL_TOKEN` instead of the Resend key if using Zoho
ZeptoMail (`src/lib/mailer.ts` picks whichever is set). Missing mail config degrades to
showing the link rather than failing.

## Database privileges — read this before adding a column

`authenticated` no longer holds table-level INSERT/UPDATE on `profiles` or `listings`; migration
`20260819091000` revoked them and re-granted an explicit column allowlist (a bare column-level
REVOKE is a no-op against a table-level grant, which is why it is shaped that way). Consequences:

- **A new column is unwritable by clients until you `grant` it explicitly.** If a write starts
  failing with a 42501 after you add a column, this is why.
- Privilege columns (`is_admin`, `is_verified_student`, `is_pioneer_seller`, `featured`,
  `last_bumped_at`) may only be changed by `security definer` functions —
  `admin_review_student_verification`, `issue_student_email_verification`,
  `consume_student_email_verification`, `bump_listing`, `update_my_listing`.
- `supabase/tests/*.sql` are the runnable checks for all of this (there is no test framework).
  Paste them into the SQL editor after schema changes; every line must print PASS.

**Row types in `src/types/database.ts` must be `type` aliases, never `interface`.** postgrest-js
requires each table's `Row` to satisfy `Record<string, unknown>`; interfaces have no implicit index
signature, so one interface makes `Database["public"]` fail the `GenericSchema` constraint and the
client silently falls back to `any` — every `.from()` and `.rpc()` in the codebase loses its types
with no error reported. Symptom when it happens: unrelated calls start erroring with
`not assignable to parameter of type 'never' | 'undefined'`.

## Web architecture

Data access is layered and the layers are enforced by import boundaries:

- `src/lib/supabase/server.ts` — cookie-backed `@supabase/ssr` client for Server Components,
  Server Actions and route handlers.
- `src/lib/supabase/client.ts` — browser client for Client Components.
- `src/lib/repositories/*.ts` — server-only query layer (listings, conversations, profiles,
  universities). `LISTING_SELECT` in `repositories/listings.ts` is the canonical relation join
  (categories, universities, seller profile, images) — reuse it rather than hand-writing selects,
  because `dbListingToUi` depends on its shape.
- `src/lib/mappers.ts` — `dbListingToUi()` converts snake_case DB rows into the camelCase `Listing`
  UI type. Anything rendering a listing goes through it.
- `src/lib/chatService.ts`, `avatarService.ts`, `imageUpload.ts` — browser-only; never import from a
  Server Component or Server Action.

Mutations are Server Actions (`src/app/*/actions.ts`: auth, sell, my-listings, messages,
profile/settings, admin/student-verifications), not API routes. API routes exist only for the few
client-polled endpoints: `/api/home-feed`, `/api/search`, `/api/profile-reviews`, `/api/dev/*`.

`src/middleware.ts` refreshes the Supabase session on every non-static request (required for Server
Components to see a session) and gates `/sell`, `/my-listings`, `/account`.

Two type sources exist and are not the same thing: `src/types/database.ts` (DB row shapes, used by
the typed Supabase clients) and `src/types/index.ts` (UI shapes). `packages/shared` declares similar
types but **is currently imported by nothing** — don't assume editing it affects either app.

## Feed and search

- Home feed: `/api/home-feed` serves three sections (new / nearby / recently active) with an
  in-process 30s cache and a 4.5s query timeout, paginated for `ProgressiveListingGrid`. "Nearby"
  means same `university_id` as the signed-in user's profile. Ranking mixes recency with
  `last_bumped_at` into a computed `feed_score` in `repositories/listings.ts`.
- Bumping: sellers re-surface a listing via the `bump_listing` RPC (cooldown + idempotency enforced
  in the DB, see the `listing_bump_*` migrations).
- Search: `searchService.ts` calls the `search_listings` RPC, falls back to `search_listings_ranked`
  if it errors, then re-fetches full rows by id and re-orders them client-side to preserve rank.

## Messaging

Messages expire — `MESSAGE_EXPIRY_HOURS = 24` in `chatService.ts` sets `expires_at` on insert and
reads filter on `expires_at > now()`. Conversations use `mark_conversation_read` and `touch_conversation`
RPCs; blocking is enforced by the `users_are_blocked` DB function. Push notifications fire from DB
triggers (`notify_message_insert`, `notify_listing_status_change`) via `send_expo_push_to_user`.

## Database changes

`supabase/schema.sql` plus `supabase/migrations/*.sql` are the source of truth. Add a new timestamped
migration rather than editing existing ones or `schema.sql`. When a change alters row shape, update
`src/types/database.ts` (and `mobile/src/types/index.ts` if mobile reads it) by hand — types are not
generated. `analyze-schema.sh` and `verify-schema-completeness.sh` are grep-based sanity reports over
those files; `PRODUCTION-DEPLOYMENT-QUICKSTART.md` covers deploying to a fresh project.

Storage buckets: `listing-images` (path `${userId}/${listingId}/${uuid}.jpg`, images compressed to
JPEG ≤800KB / 1200px client-side before upload) and `profile-images`.

## Mobile app

Deliberately much flatter than the web app: `mobile/App.tsx` holds navigation *and* most feature
state, screens in `mobile/src/screens/`, direct `supabase-js` calls (AsyncStorage session) from
`mobile/src/lib/`. It duplicates web logic (its own `mappers.ts`, `imageUpload.ts`, `LISTING_SELECT`
in `lib/constants.ts`) rather than sharing it — a change to listing shape usually needs editing both
sides. A few legacy `.js` screens/components sit alongside `.tsx` ones; the `.tsx` versions are live.

Distribution is GitHub Releases, not app stores: `mobile/src/lib/appUpdates.ts` polls the repo's
latest release and prompts to update, and `src/app/downloads/page.tsx` resolves the newest `.apk`
asset from the same API with a hardcoded fallback URL. APKs in `releases/` are tracked with Git LFS.
Bumping a release means bumping `version` and `android.versionCode` in `mobile/app.json`.
