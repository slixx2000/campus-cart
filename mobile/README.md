# CampusCart Mobile (React Native)

This app is built from the UI reference screens in `mobile/mobile-design` and connected to the **same Supabase database** used by web.

## Design Mapping

- `mobile-design/mobile_home_feed` -> `src/screens/HomeFeedScreen.tsx`
- `mobile-design/mobile_item_details` -> `src/screens/ItemDetailsScreen.tsx`
- `mobile-design/mobile_chat` -> `src/screens/ChatThreadScreen.tsx`
- `mobile-design/mobile_profile` -> `src/screens/ProfileScreen.tsx`
- `mobile-design/mobile_post_upload_photos` -> `src/screens/PostUploadPhotosScreen.tsx`
- `mobile-design/mobile_post_item_details` -> `src/screens/PostItemDetailsScreen.tsx`

## Shared Web/Mobile Contracts

Shared contracts live in `packages/shared` and are imported as `@campuscart/shared`.

Examples:

```ts
import type { ListingSummary } from "@campuscart/shared";
import type { MobileDatabase } from "@campuscart/shared";
```

## Environment

Create `mobile/.env` from `mobile/.env.example`:

```bash
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

These values should match web (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) so both apps point to one backend.

## Run

From repository root:

```bash
npm install
npm run mobile:start
```

Then:

```bash
npm run mobile:android
```

## Notes

- Mobile and web both use Supabase tables (`listings`, `profiles`, `conversations`, `messages`).
- Mobile increments listing views using the same RPC used by web: `increment_listing_view`.
- Realtime chat uses `postgres_changes` subscription on `messages`, matching web behavior.
- Mobile posting uploads selected photos to Supabase Storage bucket `listing-images` and writes `listing_images` rows with `sort_order`.
