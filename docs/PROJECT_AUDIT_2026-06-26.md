# Campus Cart Project Audit

Date: 2026-06-26
Workspace: campus-cart-main

## 1) What this project is

Campus Cart is a monorepo with:
- A Next.js web app in src/
- An Expo React Native mobile app in mobile/
- A shared TypeScript package in packages/shared/
- Supabase database schema and migrations in supabase/

Primary purpose:
- Student marketplace platform with listings, messaging, profile/account, and admin routes.

## 2) Runtime architecture

Web app:
- Framework: Next.js App Router
- Entry routes in src/app/
- Shared UI in src/components/
- Utilities and domain logic in src/lib/ and src/types/
- Protected route handling in src/middleware.ts

Mobile app:
- Framework: Expo + React Native
- App entry: mobile/App.tsx and mobile/index.ts
- Feature code in mobile/src/components, mobile/src/screens, mobile/src/lib

Shared package:
- Package: @campuscart/shared
- Location: packages/shared/
- Exports shared types and Supabase-related definitions

Database:
- Source of truth in supabase/schema.sql + supabase/migrations/
- Includes RLS policies, database functions, triggers, and storage integration

## 3) Tooling and workflows

Root scripts in package.json support:
- next dev/build/start/lint
- mobile command forwarding (mobile:start, mobile:android, mobile:ios, mobile:web)
- shared type checking

Supporting scripts at root:
- extract-from-supabase.sh
- analyze-schema.sh
- verify-schema-completeness.sh
- get-docker.sh

## 4) Repository initialization

Performed in this workspace:
- git init -b main
- git remote add origin https://github.com/slixx2000/campus-cart.git

Current remote:
- origin (fetch/push): https://github.com/slixx2000/campus-cart.git

## 5) Cleanup and reorganization performed

Goal:
- Keep necessary runtime/config files in the repository root.
- Move non-runtime design/archive artifacts out of the root into a structured archive area.

Created:
- archive/design-mockups/
- archive/backups/

Moved into archive/design-mockups/:
- 404_error_page/
- campus-cart-darkmode/
- campus-cart-lightmode/
- no_connection_light_mode/
- Design/

Moved into archive/backups/:
- mobile-backup-20260319-221141.zip

Reasoning:
- These assets are not part of active build/runtime paths.
- Their relocation reduces root clutter while preserving history/reference material.

## 6) Current root layout after cleanup

Root now focuses on active project areas:
- src/, mobile/, packages/, supabase/, docs/, public/, releases/, archive/
- Core config and run files (package.json, next.config.mjs, tsconfig.json, etc.)
- Operational scripts kept at root for continuity

## 7) Risks and notes

- No source/doc references were found to moved mockup folders in common text/code files.
- If any external process expects old absolute paths, update those scripts manually.
- Runtime code structure was not modified; only folder organization changed.

## 8) Recommended next steps

1. Commit current state with a cleanup commit message.
2. Push to origin main.
3. Optionally introduce stricter root organization for scripts (for example scripts/db and scripts/dev) in a separate change to avoid mixing concerns.
