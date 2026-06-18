# Coffee Journey — TASKS.md

Версия: 2.0  
Дата: 2026-06-10  
Формат: реализация screen-by-screen, desktop + mobile, от foundation до social network.

## 0. Правила работы

### Definition of Done для каждого экрана

Экран считается готовым, если:

- есть desktop и mobile layout;
- есть empty/loading/error states;
- есть dark theme tokens;
- есть accessibility labels;
- данные приходят из typed server layer, не из моков;
- mutations валидируются Zod-схемами;
- permissions проверены на сервере;
- основные actions покрыты тестами;
- для public страниц есть metadata/OG;
- responsive проверен на 390px, 768px, 1280px, 1440px.

### Приоритеты

- **P0** — необходимо для фундамента.
- **P1** — MVP.
- **P2** — Beta/social growth.
- **P3** — polish/advanced.

### Progress checklist

Audit date: 2026-06-17
Rule: `[x]` means there is concrete implementation evidence in the repo. `[ ] partial` means code exists, but the planned scope or Definition of Done still has open work. `[ ]` means not confirmed.

#### Sprint 1 — Foundation

- [x] A01 Bootstrap Next app — Next App Router, TypeScript, Tailwind, grouped routes, shell, lint/format/type/test tooling are present.
- [x] A02 Design tokens + UI kit — global CSS tokens and UI primitives exist, including `/dev/ui`.
- [x] A03 Database setup — Docker Postgres 18, Drizzle config, schema folders, migrations and DB scripts are present.
- [x] A04 Better Auth integration — Better Auth, Drizzle adapter, email/password, Google config placeholder, auth route, client helper and route guards are present.
- [x] A05 Media upload foundation — R2/S3 abstraction, local fallback, `media_assets`, presign/complete/local upload routes, protected local asset serving and crop upload component are present.

#### Sprint 2 — Auth + Profile + App Shell

- [x] S02 Sign Up / Sign In — forms, Zod validators, Better Auth client actions and error/loading states are present.
- [x] S03 Onboarding — multi-step onboarding flow, handle/profile setup, methods, optional gear/coffee, privacy and suggested follows/clubs are present.
- [x] S04 App Shell Desktop — desktop sidebar, top search/notifications/avatar and protected app layout are present.
- [x] S05 App Shell Mobile — mobile bottom nav and safe-area-aware app shell are present.
- [x] S10 Public User Profile — public/self profile routes, visibility-aware profile content and follow actions are present.
- [x] S11 Edit Profile — profile form, handle/display fields, default visibility and avatar/cover uploads are present.

#### Sprint 3 — Recipes

- [x] S12 My Recipes List — own/saved recipe views, search/filter controls and saved tab are present.
- [x] S13 Public Recipe Detail — public recipe route, metadata/OG, comments, brew CTA, save/remix/report/collection actions are present.
- [x] S14 Owner Recipe Detail / Edit Entry — owner detail/edit routes, update/delete/publish-style actions and remix attribution display are present.
- [x] S15 Add Recipe Desktop — recipe form, cover upload, parameters, step editor, draft save and publish button are present.
- [x] S16 Add Recipe Mobile Wizard — mobile 8-step wizard, back/forward navigation, draft save at any step and preserved form state are present.
- [x] S17 Recipe Remix Diff — remix action, draft copy, parent attribution and dose/water/temp/grind/time/steps diff UI are present.

#### Sprint 4 — Brew Mode + Logs

- [x] S18 Live Brew Mode Desktop — timer state machine, step transitions, keyboard controls and end-brew flow are present.
- [x] S19 Live Brew Mode Mobile — full-screen mobile timer, one-handed controls, progress ring, next pour target, haptics and voice cue toggles are present.
- [x] S20 Post-Brew / Add Brew Log Desktop — create brew log form, recipe defaults, actual parameters, photos, rating/tasting/visibility and save flow are present.
- [x] S21 Add Brew Log Mobile — mobile 6-step wizard covers recipe/coffee, actual data, tasting, photos, visibility and save flow.
- [x] S22 Brew Log Detail — detail route, actual data, photo, tasting scores, comments and owner edit/delete actions are present.
- [x] S23 Brew Logs History — brew logs route with timeline/cards and quick tabs is present.

#### Sprint 5 — Coffees + Gear

- [x] S24 Coffees Collection — collection route, status tabs/cards and add coffee entry point are present.
- [x] S25 Add Coffee Desktop — coffee form, photo upload, origin/process/roast/flavor/rating/status/visibility and save flow are present.
- [x] S26 Add Coffee Mobile — mobile 5-step wizard covers photo/camera upload, name/roaster, origin/process, roast/flavor and visibility.
- [x] S27 Public Coffee Page — public coffee aggregation page, comments, public recipes and public brew logs are present.
- [x] S28 Gear Library — gear route with categories/cards and add gear entry points is present.
- [x] S29 Add Grinder Desktop — grinder form/catalog linking/default toggle/image upload/save flow are present.
- [x] S30 Add Grinder Mobile — mobile 5-step wizard covers photo/camera upload, brand/model, type/burr, settings ranges, default method and visibility.
- [x] S31 Add Dripper Desktop/Mobile — dripper form, save flow and recipe-builder selection data are present.
- [x] S32 Add Filter Desktop/Mobile — filter form, save flow and recipe-builder selection data are present.
- [x] S33 Public Gear Page — public gear aggregation page, comments, public recipes and public brew logs are present.

#### Sprint 6 — Social MVP

- [x] S06 Social Home Feed — feed query, tabs, feed cards, right rail and visibility filtering are present.
- [x] S07 Feed Card Component — feed card variants/actions and `Brew this` path are present.
- [x] S08 Explore Main — recipe/people/coffee/gear/clubs search tabs and result grids are present.
- [x] S09 Filter Drawer — desktop sidebar and mobile bottom sheet support method, recipe metrics, gear, coffee, flavor, difficulty and setup filters via URL params.
- [x] S34 Follow System — follows table/actions/suggested people/count usage are present.
- [x] S35 Reactions / Likes — reactions table/action/count handling and duplicate protection are present.
- [x] S36 Saves / Bookmarks — saves table/action and saved recipes tab are present.
- [x] S37 Comments — comments table, one-level replies, delete and report flows are present.
- [x] S38 Notifications — notifications table, notification route, mark-read action and event creation hooks are present.
- [x] S39 Reports / Moderation — reports table, report actions, admin queue and hide content action are present.

#### Sprint 7 — Export + Landing

- [ ] partial S01 Landing Page — landing UI, hero, CTAs, stats, feature sections and preview card exist; SEO/performance acceptance is not verified.
- [x] S47 Export Studio Desktop — select/preview/customize controls, block toggles, theme controls and PNG export are present.
- [ ] partial S48 Export Studio Mobile — responsive export UI exists, but the planned mobile wizard is not implemented.
- [x] S49 Transparent PNG Output — transparent format mode and PNG export path are present.
- [x] S50 Public Share Page — share route, recipe summary, CTA and OG metadata are present.

#### Sprint 8 — Polish + Beta Prep

- [x] S40 Collections List — collections table, list, public/private indicator and create form are present.
- [x] S41 Collection Detail — collection detail, public share page, add/remove item flow and ordering data are present.
- [x] S42 Clubs List / Community Home — community/clubs pages, suggested clubs, active challenges and join action are present.
- [ ] partial S43 Club Detail — club page and join flow exist, but create post/membership-rule depth is not fully confirmed.
- [ ] partial S44 Challenge Detail — challenge page and brew-log entry form exist, but leaderboard/full entries feed are not confirmed.
- [x] S45 Messages List — conversations list and unread state are present.
- [ ] partial S46 Conversation Detail — thread UI and send message route exist, but attach recipe/block/report flows are not implemented.
- [x] S51 Settings — account/profile/privacy/units/export-oriented settings shell is present.
- [x] S52 Privacy Settings — default visibility/comment/message/profile toggles and persistence are present.
- [x] S53 Admin Moderation Dashboard — admin-gated moderation dashboard with reports/actions is present.

#### Data Quality + Release

- [x] P01 Seed Data — demo users, recipes, coffees, gear, feed/social data and seed/clear scripts are present.
- [ ] partial P02 Works With My Setup — default gear fields exist in profile/settings area, but Explore compatibility ranking/filter is not confirmed.
- [ ] partial P03 Recipe Stats Aggregation — stats fields and event updates exist, but a backfill job/complete aggregation pipeline is not confirmed.
- [x] Q01 Unit tests — validators, permission helpers, recipe math, storage and timer unit tests are present.
- [ ] partial Q02 E2E tests — Playwright smoke coverage exists for many flows, but the full listed E2E flow set is not complete.
- [ ] Q03 Production readiness — env/storage/deploy/Sentry/analytics/security headers/rate limiting readiness is not fully confirmed.

---

# EPIC A — Project Foundation

## A01 — Bootstrap Next app

Priority: P0

Tasks:

- Создать Next.js App Router проект с TypeScript.
- Подключить Tailwind CSS v4 и CSS variables.
- Настроить app routes: `(marketing)`, `(auth)`, `(app)`, `api`.
- Создать базовый app shell desktop/mobile.
- Настроить ESLint, Prettier, TypeScript strict.
- Добавить Vitest и Playwright.

Acceptance:

- `pnpm dev` запускается.
- `pnpm build` проходит.
- Есть пустые страницы landing/auth/app.

## A02 — Design tokens + UI kit

Priority: P0

Tasks:

- Создать `tokens.css` с цветами, radius, shadows, spacing.
- Создать компоненты: Button, Input, Textarea, Select, Modal, Drawer, BottomSheet, Tabs, Card, Avatar, Badge, Dropdown.
- Создать coffee-specific icons placeholders.
- Сделать Storybook optional или internal `/dev/ui` page.

Acceptance:

- Все формы и экраны используют единый UI kit.
- Есть focus/hover/disabled/error состояния.

## A03 — Database setup

Priority: P0

Tasks:

- Поднять PostgreSQL 18 локально через Docker Compose.
- Подключить `postgres` driver.
- Настроить Drizzle config.
- Создать `db/index.ts`.
- Создать schema folders: `auth.ts`, `profiles.ts`, `media.ts`, `recipes.ts`, `brews.ts`, `coffee.ts`, `gear.ts`, `social.ts`, `clubs.ts`.
- Создать миграции.

Acceptance:

- `pnpm db:generate` работает.
- `pnpm db:migrate` применяет миграции.
- `pnpm db:studio` открывает базу.

## A04 — Better Auth integration

Priority: P0

Tasks:

- Установить Better Auth.
- Настроить Drizzle adapter provider `pg`.
- Подключить email/password.
- Подключить Google OAuth config placeholder.
- Сгенерировать auth schema.
- Создать `/api/auth/[...all]` route handler.
- Создать auth client helper.
- Создать middleware/session guards для app routes.

Acceptance:

- Sign up/sign in/sign out работают.
- Protected routes редиректят guest users.
- Auth session доступна server-side.

## A05 — Media upload foundation

Priority: P0

Tasks:

- Настроить Cloudflare R2 upload abstraction.
- Добавить `.env` для Cloudflare R2 и local fallback.
- Создать `media_assets` table.
- Реализовать `POST /api/media/presign`.
- Реализовать `POST /api/media/complete`.
- Реализовать upload dropzone component.
- Реализовать image crop modal для avatar/cover.
- Добавить локальный mock storage fallback для dev.

Acceptance:

- Пользователь может загрузить изображение напрямую в storage.
- В DB появляется `media_assets.status=ready`.
- Private asset нельзя получить без auth.

---

# EPIC B — Marketing + Auth Screens

## S01 — Landing Page

Priority: P1  
Routes: `/`, mobile `/`

Desktop screen:

- Hero: “Brew better. Share more. Connect.”
- Visual: premium coffee photo + social cards.
- CTA: Join Coffee Journey, Explore Recipes.
- Stats: users, recipes, brew logs, countries.
- Sections: Private Journal, Public Recipes, Brew Mode, Explore, Profiles, Export Studio.

Mobile screen:

- Compact hero.
- Sticky CTA.
- Swipeable product cards.
- Social proof.

Implementation tasks:

- Build marketing layout.
- Add responsive hero.
- Add reusable feature sections.
- Add public recipe preview card.
- Add SEO metadata.

Acceptance:

- Landing loads under 2.5s LCP on mobile target.
- CTA routes to sign up.

## S02 — Sign Up / Sign In

Priority: P1  
Routes: `/sign-up`, `/sign-in`

Desktop:

- Split layout: auth form + coffee visual.
- Email/password.
- Google sign-in.
- Terms checkbox.

Mobile:

- Full-screen auth.
- Large inputs.
- OAuth button.

Implementation tasks:

- Build auth forms with Zod validation.
- Connect Better Auth client.
- Error states.
- Loading state.

Acceptance:

- New user can create account.
- Existing user can sign in.
- Errors displayed safely.

## S03 — Onboarding

Priority: P1  
Route: `/onboarding`

Screens:

1. Welcome.
2. Choose handle.
3. Select methods.
4. Add first gear.
5. Add first coffee.
6. Privacy preference.
7. Suggested follows/clubs.

Implementation tasks:

- Create onboarding stepper.
- Create profile record after handle.
- Validate handle availability.
- Save preferences.
- Seed suggested creators/clubs.

Acceptance:

- User cannot enter app without profile handle.
- Onboarding can skip optional steps.

---

# EPIC C — App Shell + Social Home

## S04 — App Shell Desktop

Priority: P0

Tasks:

- Desktop sidebar with nav.
- Top search/notifications/avatar area.
- Content max-width behavior.
- Active route states.
- User sync indicator.

Acceptance:

- All app routes render inside shell.
- Sidebar collapse optional.

## S05 — App Shell Mobile

Priority: P0

Tasks:

- Bottom nav: Home, Explore, Brew, Community, Profile.
- Header variants.
- Floating primary action for Brew/Add.
- Safe-area support.

Acceptance:

- Mobile nav works on 390px.
- No content hidden behind bottom nav.

## S06 — Social Home Feed

Priority: P1  
Route: `/home`

Desktop:

- Composer: “What are you brewing today?”
- Tabs: For You, Following, Popular, Latest.
- Feed cards.
- Right rail: trending, suggested people, active challenges.

Mobile:

- Feed-first layout.
- Stories/following avatars row.
- Composer compact.
- Feed cards with large imagery.

Backend tasks:

- Create feed query.
- Create feed item normalizer.
- Implement pagination cursor.
- Respect visibility and blocks.

Acceptance:

- Feed shows own + public/following content.
- Private content never appears.

## S07 — Feed Card Component

Priority: P1

Tasks:

- Brew log card variant.
- Recipe card variant.
- Remix card variant.
- Collection card variant.
- Like/comment/save/share actions.
- `Brew this` CTA.

Acceptance:

- Same component works desktop/mobile.
- Optimistic like/save works and reconciles.

---

# EPIC D — Explore + Search

## S08 — Explore Main

Priority: P1  
Route: `/explore`

Desktop:

- Search bar.
- Left filters rail.
- Object tabs: Recipes, People, Coffees, Gear, Clubs.
- Grid/list results.
- Sort: Popular, Latest, Most brewed, Rating.

Mobile:

- Search header.
- Horizontal chips.
- Filter bottom sheet.
- Infinite scroll cards.

Backend tasks:

- Implement recipe search query.
- Implement people search.
- Implement coffee/gear search minimal.
- Add full-text indexes.

Acceptance:

- Search by title/author/flavor works.
- Filters combine correctly.

## S09 — Filter Drawer

Priority: P1

Filters:

- Method.
- Dose range.
- Water range.
- Ratio.
- Temperature.
- Brew time.
- Grinder.
- Dripper.
- Roast level.
- Process.
- Flavor notes.
- Difficulty.
- Works with my setup.

Acceptance:

- Mobile bottom sheet usable.
- Desktop filters persist in URL query params.

---

# EPIC E — Profiles

## S10 — Public User Profile

Priority: P1  
Routes: `/u/[handle]`, `/profile`

Desktop:

- Cover, avatar, stats.
- Follow/message buttons.
- Taste profile.
- Tabs: Recipes, Brews, Collections, Gear, Coffees.
- Public social stats.

Mobile:

- Big cover header.
- Sticky profile actions.
- Horizontal tabs.
- Card grid/list.

Backend tasks:

- Profile read query with counts.
- Follow/unfollow actions.
- Visibility-aware tab queries.

Acceptance:

- Public profile accessible logged out if public.
- Private/followers content hidden.

## S11 — Edit Profile

Priority: P1  
Route: `/settings/profile`

Tasks:

- Edit display name, handle, bio, location, website.
- Avatar upload.
- Cover upload.
- Default visibility.
- Favorite methods.
- Taste profile preferences.

Acceptance:

- Avatar and cover crop/upload work.
- Handle uniqueness enforced.

---

# EPIC F — Recipes

## S12 — My Recipes List

Priority: P1  
Route: `/recipes`

Desktop:

- Tabs: All, Public, Private, Drafts, Favorites.
- Search.
- Table/list hybrid.
- Right preview panel.

Mobile:

- Recipe cards.
- Search + filter chips.
- FAB New Recipe.

Backend tasks:

- Query own recipes.
- Query saved recipes.
- Recipe stats joins.

Acceptance:

- Owner sees private/drafts.
- Other users do not.

## S13 — Public Recipe Detail

Priority: P1  
Route: `/r/[handle]/[slug]`

Desktop:

- Hero image + title.
- Author block.
- Recipe parameters.
- Steps.
- Comments.
- Public brew logs.
- Remixes.
- CTA: Brew this, Save, Remix.

Mobile:

- Hero-first recipe page.
- Sticky Brew button.
- Collapsible sections.

Backend tasks:

- Public recipe query.
- Increment view counter.
- Fetch comments/brew logs.
- Visibility checks.

Acceptance:

- Logged-out users can view public recipe.
- `Brew this` prompts sign-in or starts if authenticated.

## S14 — Owner Recipe Detail / Edit Entry

Priority: P1  
Route: `/recipes/[id]`

Tasks:

- Owner view with edit buttons.
- Save changes.
- Publish/unpublish.
- Generate export card button.
- Version selector later.

Acceptance:

- Only owner can edit.
- Published page updates after save.

## S15 — Add Recipe Desktop

Priority: P1  
Route: `/recipes/new`

Desktop layout:

- Left: cover upload + basics.
- Center: parameters + steps editor.
- Right: live mobile/public preview + visibility.

Fields:

- title, subtitle, description.
- method.
- visibility.
- remix policy.
- dose, water, ratio, temp, grind.
- dripper, grinder, filter, coffee optional.
- flavor notes.
- steps table.

Tasks:

- Build form with react server action.
- Auto-calculate ratio.
- Add/remove/reorder steps.
- Upload cover photo.
- Save draft.
- Publish.

Acceptance:

- Draft can be saved with partial data.
- Publish requires required fields.

## S16 — Add Recipe Mobile Wizard

Priority: P1  
Route: `/recipes/new` responsive

Steps:

1. Basics.
2. Photo.
3. Parameters.
4. Gear.
5. Steps.
6. Taste.
7. Visibility.
8. Preview.

Acceptance:

- Wizard can save draft at any step.
- Back/forward preserves data.

## S17 — Recipe Remix Diff

Priority: P2

Tasks:

- Create remix action.
- Copy recipe to draft.
- Track parent recipe.
- Show diff: dose/water/temp/grind/steps.
- Show attribution.

Acceptance:

- Remix page links back to original.
- Original page shows remix count.

---

# EPIC G — Live Brew Mode + Brew Logs

## S18 — Live Brew Mode Desktop

Priority: P1  
Route: `/brew/[recipeId]`

Desktop:

- Large timer/progress.
- Current step.
- Next target.
- Recipe summary rail.
- Step timeline.
- Pause/reset/skip/end.

Tasks:

- Build timer state machine.
- Step transition logic.
- Screen awake helper.
- Keyboard shortcuts.
- Persist progress in local state.

Acceptance:

- Timer continues accurately while tab active.
- Step transitions match recipe steps.

## S19 — Live Brew Mode Mobile

Priority: P1

Mobile:

- Full-screen immersive timer.
- Large current time.
- Progress ring.
- Next pour target.
- Bottom control row.
- Haptics/voice toggles.

Acceptance:

- Works one-handed.
- No accidental scroll during active brew.

## S20 — Post-Brew / Add Brew Log Desktop

Priority: P1  
Route: `/brews/new`, also after brew completion

Desktop:

- Recipe summary.
- Actual parameters.
- Rating.
- Tasting sliders.
- Notes.
- Photo gallery upload.
- Visibility/publish toggle.

Tasks:

- Build create brew log form.
- Attach recipe defaults.
- Attach photo uploads.
- Compare deltas from recipe.
- Publish to feed if public/followers.

Acceptance:

- User can save private log.
- Public log creates feed item.

## S21 — Add Brew Log Mobile

Priority: P1

Wizard:

1. Recipe/coffee.
2. Actual brew data.
3. Rating/tasting.
4. Photos.
5. Visibility.
6. Publish/save.

Acceptance:

- Fast entry under 60 seconds for common case.

## S22 — Brew Log Detail

Priority: P1  
Route: `/brews/[id]`

Tasks:

- Show actual brew data.
- Show photos.
- Show tasting scores.
- Show comments if public.
- Edit/delete owner actions.

Acceptance:

- Private log only owner can view.

## S23 — Brew Logs History

Priority: P1  
Route: `/brews`

Desktop:

- Timeline/table.
- Filters by recipe, coffee, rating, method.
- Calendar grouping.

Mobile:

- Card list.
- Quick filters.

Acceptance:

- User can find older brews quickly.

---

# EPIC H — Coffee Beans

## S24 — Coffees Collection

Priority: P1  
Route: `/coffees`

Desktop:

- Grid/list of user coffees.
- Status tabs: Active, Finished, Wishlist.
- Public/private indicator.

Mobile:

- Cards with coffee photo, roaster, notes, rating.
- FAB Add Coffee.

Acceptance:

- User sees own private coffee records.

## S25 — Add Coffee Desktop

Priority: P1  
Route: `/coffees/new`

Fields:

- photo upload.
- name.
- roaster.
- origin country/region/farm.
- process.
- variety.
- roast level.
- roast date.
- flavor notes.
- rating.
- status.
- visibility.

Tasks:

- Create global coffee or user coffee.
- Upload coffee photo.
- Autocomplete roaster.
- Save.

Acceptance:

- Coffee can be linked to brew logs and recipes.

## S26 — Add Coffee Mobile

Priority: P1

Wizard:

1. Photo.
2. Name/roaster.
3. Origin/process.
4. Roast/flavor.
5. Visibility.

Acceptance:

- Mobile form supports camera upload.

## S27 — Public Coffee Page

Priority: P2  
Route: `/coffee/[slug]`

Tasks:

- Show coffee lot info.
- Show public brew logs.
- Show best recipes.
- Show users brewing this coffee.

Acceptance:

- Public page aggregates public data only.

---

# EPIC I — Gear

## S28 — Gear Library

Priority: P1  
Route: `/gear`

Desktop:

- Tabs: Grinders, Drippers, Filters, Kettles, Scales, Servers.
- Cards/table.
- Default gear indicators.

Mobile:

- Category chips.
- Gear cards.
- FAB Add Gear.

Acceptance:

- Gear can be used in recipe and brew log forms.

## S29 — Add Grinder Desktop

Priority: P1  
Route: `/gear/grinders/new`

Fields:

- photo upload.
- name.
- brand.
- model.
- type manual/electric.
- burr type.
- burr size.
- zero point.
- filter range.
- espresso range.
- notes.
- visibility.
- default grinder toggle.

Tasks:

- Build desktop form.
- Add image crop/preview.
- Save as `user_gear`.
- Optionally link to global `gear_products`.

Acceptance:

- New grinder appears in gear library.
- New grinder appears in recipe/brew forms.

## S30 — Add Grinder Mobile

Priority: P1

Wizard:

1. Photo.
2. Brand/model.
3. Type/burr.
4. Settings ranges.
5. Visibility.

Acceptance:

- Easy camera upload.
- Can mark as default.

## S31 — Add Dripper Desktop/Mobile

Priority: P1  
Route: `/gear/drippers/new`

Fields:

- photo.
- brand.
- model.
- material.
- size.
- brew speed.
- compatible filters.
- notes.
- visibility.

Acceptance:

- Dripper can be selected in recipe builder.

## S32 — Add Filter Desktop/Mobile

Priority: P1  
Route: `/gear/filters/new`

Fields:

- photo.
- brand.
- model.
- size.
- material/paper type.
- compatible drippers.
- notes.

Acceptance:

- Filter can be selected in recipe builder.

## S33 — Public Gear Page

Priority: P2  
Route: `/gear/[slug]`

Tasks:

- Show global gear info.
- Show popular recipes using it.
- Show public brew logs.
- Show common settings.

Acceptance:

- Aggregates only public content.

---

# EPIC J — Social Interactions

## S34 — Follow System

Priority: P1

Tasks:

- Create follows table.
- Follow/unfollow actions.
- Suggested people query.
- Follower/following counts.

Acceptance:

- Following feed uses follows.

## S35 — Reactions / Likes

Priority: P1

Tasks:

- Add reactions table.
- Like recipe/brew log/comment.
- Optimistic UI.
- Counts.

Acceptance:

- Duplicate likes impossible.

## S36 — Saves / Bookmarks

Priority: P1

Tasks:

- Add saves table.
- Save recipe/brew log/collection.
- Saved recipes tab.
- Save to collection later.

Acceptance:

- User can retrieve saved recipes.

## S37 — Comments

Priority: P1

Tasks:

- Add comments table.
- Comment on recipe and brew log.
- Reply thread one level MVP.
- Delete own comment.
- Report comment.

Acceptance:

- Comments respect comment policy.

## S38 — Notifications

Priority: P2

Tasks:

- Add notifications table.
- Create notifications for follow/like/comment/remix/brewed.
- Notification bell.
- Mark read.

Acceptance:

- User receives key notifications.

## S39 — Reports / Moderation

Priority: P1

Tasks:

- Add reports table.
- Report user/content/comment.
- Admin moderation queue.
- Hide content action.

Acceptance:

- Report action available on public content.

---

# EPIC K — Collections

## S40 — Collections List

Priority: P2  
Route: `/collections`

Tasks:

- Create collections table.
- List user collections.
- Public/private indicators.
- Create collection modal.

Acceptance:

- User can create collection.

## S41 — Collection Detail

Priority: P2  
Route: `/collections/[id]`, public `/u/[handle]/collections/[slug]`

Tasks:

- Show items.
- Reorder items.
- Add/remove saved items.
- Public share page.

Acceptance:

- Public collection accessible via link.

---

# EPIC L — Clubs & Challenges

## S42 — Clubs List / Community Home

Priority: P2  
Route: `/community`, `/clubs`

Tasks:

- Show joined clubs.
- Suggested clubs.
- Active challenges.
- Club cards.

Acceptance:

- User can join public club.

## S43 — Club Detail

Priority: P2  
Route: `/clubs/[slug]`

Tasks:

- Club header.
- Posts.
- Pinned recipes.
- Members.
- Challenges.
- Create post.

Acceptance:

- Club content respects membership rules.

## S44 — Challenge Detail

Priority: P2  
Route: `/challenges/[id]`

Tasks:

- Challenge rules.
- Submit brew log.
- Leaderboard.
- Entries feed.

Acceptance:

- Entry requires brew log.

---

# EPIC M — Messages

## S45 — Messages List

Priority: P2  
Route: `/messages`

Tasks:

- Conversations list.
- Request inbox.
- Unread state.

Acceptance:

- Users can see conversations.

## S46 — Conversation Detail

Priority: P2  
Route: `/messages/[id]`

Tasks:

- Thread UI.
- Send message.
- Attach recipe link.
- Block/report.

Acceptance:

- Message permissions enforced.

---

# EPIC N — Export Studio

## S47 — Export Studio Desktop

Priority: P1  
Route: `/export`

Desktop:

- Select recipe/brew log.
- Format selector.
- Blocks editor.
- Theme controls.
- Live preview canvas.
- Export button.

Tasks:

- Build export layout.
- Create preview renderer.
- Implement templates: modern mocha, editorial cream, midnight, forest.
- Implement block toggles.
- Implement PNG export.

Acceptance:

- User can export recipe card PNG.

## S48 — Export Studio Mobile

Priority: P1

Mobile wizard:

1. Select content.
2. Format.
3. Style.
4. Blocks.
5. Preview.
6. Share.

Acceptance:

- Mobile export works without horizontal overflow.

## S49 — Transparent PNG Output

Priority: P2

Tasks:

- Add transparent template mode.
- Ensure no background in output.
- Export high-res PNG.

Acceptance:

- Output can be layered in Instagram/story editors.

## S50 — Public Share Page

Priority: P1  
Route: `/share/[id]`

Tasks:

- Render public export/share page.
- Show recipe summary.
- CTA to open app/brew recipe.
- OG image.

Acceptance:

- Shared link previews nicely.

---

# EPIC O — Settings + Admin

## S51 — Settings

Priority: P1  
Route: `/settings`

Sections:

- Account.
- Profile.
- Privacy.
- Units.
- Notifications.
- Export preferences.
- Data/delete account.

Acceptance:

- Default visibility can be changed.

## S52 — Privacy Settings

Priority: P1

Tasks:

- Default content visibility.
- Who can comment.
- Who can message.
- Show gear on profile toggle.
- Show coffee on profile toggle.

Acceptance:

- New content uses privacy defaults.

## S53 — Admin Moderation Dashboard

Priority: P2  
Route: `/admin/moderation`

Tasks:

- Reports list.
- Content preview.
- Hide/restore content.
- Warn/suspend user.

Acceptance:

- Only admin role can access.

---

# EPIC P — Data Quality + Recommendations

## P01 — Seed Data

Priority: P0

Tasks:

- Seed demo users.
- Seed recipes.
- Seed coffees.
- Seed gear products.
- Seed feed items.

Acceptance:

- New dev environment has realistic content.

## P02 — Works With My Setup

Priority: P1

Tasks:

- Store user's default grinder/dripper/filter.
- Match recipe method + gear + dose range.
- Add filter in Explore.

Acceptance:

- Results prioritize compatible recipes.

## P03 — Recipe Stats Aggregation

Priority: P1

Tasks:

- Aggregate likes/saves/brews/rating.
- Update on events.
- Backfill job.

Acceptance:

- Recipe cards show correct counts.

---

# EPIC Q — Testing & Release

## Q01 — Unit tests

Priority: P0

Tasks:

- Validators.
- Permission helpers.
- Ratio calculator.
- Brew timer state machine.
- Feed visibility filter.

Acceptance:

- Core unit tests pass.

## Q02 — E2E tests

Priority: P1

Flows:

1. Sign up → onboarding.
2. Add recipe with photo.
3. Publish recipe.
4. Search recipe.
5. Brew recipe.
6. Add brew log with photo.
7. Public feed interaction.
8. Add grinder.
9. Export recipe card.

Acceptance:

- Playwright tests pass on CI.

## Q03 — Production readiness

Priority: P1

Tasks:

- Configure env vars.
- Configure storage bucket CORS.
- Configure DB migrations on deploy.
- Configure Sentry.
- Configure analytics.
- Security headers.
- Rate limiting.

Acceptance:

- Production deploy works from clean branch.

---

# MVP Implementation Order

## Sprint 1 — Foundation

1. A01 Bootstrap Next app.
2. A02 Design tokens/UI kit.
3. A03 DB setup.
4. A04 Better Auth.
5. A05 Media upload.

## Sprint 2 — Auth + Profile + App Shell

1. S02 Sign up/sign in.
2. S03 Onboarding.
3. S04 Desktop shell.
4. S05 Mobile shell.
5. S10 Profile.
6. S11 Edit profile.

## Sprint 3 — Recipes

1. S12 My recipes.
2. S15 Add recipe desktop.
3. S16 Add recipe mobile.
4. S13 Public recipe detail.
5. S14 Owner recipe detail.

## Sprint 4 — Brew Mode + Logs

1. S18 Desktop brew mode.
2. S19 Mobile brew mode.
3. S20 Add brew log desktop.
4. S21 Add brew log mobile.
5. S22 Brew log detail.
6. S23 Brew logs history.

## Sprint 5 — Coffees + Gear

1. S24 Coffees collection.
2. S25 Add coffee desktop.
3. S26 Add coffee mobile.
4. S28 Gear library.
5. S29 Add grinder desktop.
6. S30 Add grinder mobile.
7. S31 Add dripper.
8. S32 Add filter.

## Sprint 6 — Social MVP

1. S06 Social home feed.
2. S07 Feed card.
3. S34 Follow system.
4. S35 Reactions.
5. S36 Saves.
6. S37 Comments.
7. S08 Explore.
8. S09 Filter drawer.

## Sprint 7 — Export + Landing

1. S01 Landing.
2. S47 Export Studio desktop.
3. S48 Export Studio mobile.
4. S50 Public share page.
5. Q02 E2E smoke tests.

## Sprint 8 — Polish + Beta Prep

1. S17 Remix diff.
2. S38 Notifications.
3. S39 Reports.
4. S40/S41 Collections.
5. Performance pass.
6. Accessibility pass.
7. Production readiness.

---

# Screen-by-screen checklist summary

| ID  | Screen               | Desktop |   Mobile | Priority |
| --- | -------------------- | ------- | -------: | -------- |
| S01 | Landing              | yes     |      yes | P1       |
| S02 | Auth                 | yes     |      yes | P1       |
| S03 | Onboarding           | yes     |      yes | P1       |
| S04 | App Shell Desktop    | yes     |       no | P0       |
| S05 | App Shell Mobile     | no      |      yes | P0       |
| S06 | Social Home Feed     | yes     |      yes | P1       |
| S07 | Feed Card            | yes     |      yes | P1       |
| S08 | Explore              | yes     |      yes | P1       |
| S09 | Filters              | yes     |      yes | P1       |
| S10 | User Profile         | yes     |      yes | P1       |
| S11 | Edit Profile         | yes     |      yes | P1       |
| S12 | My Recipes           | yes     |      yes | P1       |
| S13 | Public Recipe Detail | yes     |      yes | P1       |
| S14 | Owner Recipe Detail  | yes     |      yes | P1       |
| S15 | Add Recipe Desktop   | yes     |       no | P1       |
| S16 | Add Recipe Mobile    | no      |      yes | P1       |
| S18 | Brew Mode Desktop    | yes     |       no | P1       |
| S19 | Brew Mode Mobile     | no      |      yes | P1       |
| S20 | Add Brew Log Desktop | yes     |       no | P1       |
| S21 | Add Brew Log Mobile  | no      |      yes | P1       |
| S22 | Brew Log Detail      | yes     |      yes | P1       |
| S23 | Brew Log History     | yes     |      yes | P1       |
| S24 | Coffees              | yes     |      yes | P1       |
| S25 | Add Coffee Desktop   | yes     |       no | P1       |
| S26 | Add Coffee Mobile    | no      |      yes | P1       |
| S28 | Gear Library         | yes     |      yes | P1       |
| S29 | Add Grinder Desktop  | yes     |       no | P1       |
| S30 | Add Grinder Mobile   | no      |      yes | P1       |
| S31 | Add Dripper          | yes     |      yes | P1       |
| S32 | Add Filter           | yes     |      yes | P1       |
| S33 | Public Gear Page     | yes     |      yes | P2       |
| S40 | Collections          | yes     |      yes | P2       |
| S42 | Clubs                | yes     |      yes | P2       |
| S44 | Challenges           | yes     |      yes | P2       |
| S45 | Messages             | yes     |      yes | P2       |
| S47 | Export Studio        | yes     |       no | P1       |
| S48 | Export Studio Mobile | no      |      yes | P1       |
| S50 | Share Page           | yes     |      yes | P1       |
| S51 | Settings             | yes     |      yes | P1       |
| S53 | Admin Moderation     | yes     | optional | P2       |
