# Coffee Journey Improvement Plan

## P0 - Privacy and Access Control

- [x] Ensure public profiles only expose content visible to the current viewer.
- [x] Ensure owner routes such as `/recipes/[id]`, `/recipes/[id]/edit`, `/brews/[id]`, and `/brews/[id]/edit` only load content owned by the current user.
- [x] Add regression coverage for private/followers visibility on profile and detail reads.

## P1 - Social Integrity

- [x] Validate social targets before likes, saves, comments, reports, and collection adds.
- [x] Respect recipe `commentPolicy` before inserting comments or replies.
- [x] Avoid double-counting aggregated recipe stats and live social counts in the UI.

## P1 - Gear and Setup Matching

- [x] Replace implicit recipe-to-gear matching with explicit relations, such as a `recipe_gear` join table or grinder/dripper/filter ids on recipes and brew logs.
- [x] Add settings UI to choose default grinder, dripper, and filter for "Works with my setup".
- [x] Update public gear pages to use explicit gear usage, not inferred global gear lists.

## P2 - Media Hardening

- [x] Verify object existence before marking media assets `ready`.
- [x] For local uploads, verify the file is present and has the expected size.
- [x] For R2/S3 uploads, use `HeadObject` before completion.

## P2 - Messaging

- [x] Add explicit conversation participants and recipient selection.
- [x] Enforce message privacy policy before sending.
- [x] Track unread counts per recipient.

## P2 - Release Workflow

- [x] Fix `pnpm format`/script execution in environments that enforce `pnpm approve-builds`.
- [x] Add CI jobs for typecheck, lint, unit tests, production build, migrations, and Playwright e2e.
- [ ] Wire Sentry SDK, not only environment placeholders. Skipped by request.
