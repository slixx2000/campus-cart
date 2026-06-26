# Campus Cart Mobile

Clean Expo rebuild of the Campus Cart mobile app, based on the web project in the parent workspace.

## What this version includes

- Supabase auth with persistent sessions
- Home screen with Campus Cart branding
- Browse/search/filter listings
- Listing detail screen
- Account screen
- Seller gate that matches the web rule: only verified students can post
- Basic create-listing flow for verified student accounts
- EAS config for APK (`preview`) and Play Store bundle (`production`)

## Environment

Uses Expo public env vars:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

`.env.example` is included.

## Run locally

```bash
cd mobile
npm install
npm start
```

## Build APK

```bash
eas build -p android --profile preview
```

## Release sanity checks

```bash
npm run typecheck
npm run doctor
```

## Monorepo note

This mobile app lives inside the Campus Cart web repo, which uses different React versions at the root. `expo-doctor` may warn about duplicate `react` / `react-native` installations because it can see the parent workspace dependencies. That warning is about the monorepo layout, not necessarily a broken mobile app.

If it becomes a build problem later, the clean fix is to isolate the mobile app into its own repo or tighten workspace dependency resolution.

## Notes

This rebuild intentionally avoids the old broken native Android setup. It starts from a fresh Expo base and only adds the dependencies needed for the current Campus Cart flows.
