# Coffee Journey — SPEC.md

Версия: 2.0  
Дата: 2026-06-10  
Статус: продуктовый и технический спек для MVP → Beta → Social Network

## 0. Коротко

**Coffee Journey** — социальная сеть и персональный журнал для любителей кофе. Пользователь ведет приватные заварки, хранит рецепты, зерно и оборудование, запускает красивый brew mode с таймером, публикует лучшие рецепты, повторяет рецепты других людей, делает ремиксы, делится карточками в соцсетях и строит публичный кофейный профиль.

Главная идея:

> Track every cup. Share every recipe. Brew better coffee together.

Продукт не должен ощущаться как Notion-таблица. Это должен быть современный кофейный продукт: приватный журнал + социальная база рецептов + красивый публичный слой.

---

## 1. Продуктовое позиционирование

### 1.1 Что строим

Coffee Journey объединяет 5 продуктов в одном:

1. **Private Brew Journal** — личный журнал всех заварок.
2. **Recipe Builder** — конструктор рецептов с шагами, фото, оборудованием и видимостью.
3. **Live Brew Mode** — красивый режим приготовления с таймером, подсказками, haptics/voice cues.
4. **Coffee Social Network** — лента, профили, подписки, комментарии, лайки, сохранения, ремиксы, клубы.
5. **Export Studio** — генератор красивых карточек рецептов и заварок для Instagram, stories, transparent PNG, print.

### 1.2 Для кого

**Home barista beginner**  
Хочет не забывать пропорции, видеть понятный таймер, повторять рецепты других.

**Coffee nerd / enthusiast**  
Хочет вести точный журнал, сравнивать изменения, искать рецепты под свою воронку, дозу и кофемолку.

**Creator / barista / roaster**  
Хочет публиковать рецепты, собирать аудиторию, получать повторы рецептов, делать красивые export cards.

**Cafe / roaster community**  
Хочет публиковать рецепты под свои зерна, запускать челленджи, видеть отзывы и brew logs.

### 1.3 Северная звезда продукта

**Brewed from shared recipes per week** — сколько заварок сделано по рецептам, которые были опубликованы или сохранены из сообщества.

Вторичные метрики:

- число опубликованных рецептов;
- число brew logs;
- repeat rate рецепта;
- remix rate;
- saves per recipe;
- comments/questions per recipe;
- completion rate brew mode;
- export shares;
- retention D7/D30.

---

## 2. Технологический стек

### 2.1 Основной стек

Текущий стек фиксируем на момент старта, но в `package.json` можно ставить exact versions или `latest` после проверки `pnpm outdated`.

| Слой | Выбор | Версия/заметка |
|---|---|---|
| Web framework | **Next.js App Router** | `next@16.2.9` как актуальный npm latest на 2026-06-10; перед установкой перепроверить |
| UI | React | `react@19.2.7`, `react-dom@19.2.7` |
| Language | TypeScript | `typescript@6.0.3` |
| Styling | Tailwind CSS | `tailwindcss@4.3.0` + CSS variables/design tokens |
| Auth | **Better Auth** | `better-auth@1.6.16` stable |
| DB | **PostgreSQL** | Production: PostgreSQL 18.x. PostgreSQL 19 Beta не использовать в production |
| ORM | **Drizzle ORM** | Stable: `drizzle-orm@0.45.2`, `drizzle-kit@latest`; Drizzle v1 RC/beta только после отдельной миграционной проверки |
| DB Driver | postgres.js | `postgres@3.4.9` |
| Validation | Zod | `zod@4.4.3` |
| Package manager | pnpm | latest |
| Upload storage | Cloudflare R2 | R2 S3-compatible API, local filesystem fallback |
| Image processing | Sharp / background worker | thumbnails, blurhash, export cards |
| Search | Postgres full-text first | позже Meilisearch/Typesense/Algolia |
| Cache/queues | Redis-compatible | Upstash Redis / BullMQ / Inngest later |
| Hosting | Vercel / Fly / Railway / Render | зависит от DB/storage |
| Email | Resend/Postmark | transactional emails |
| Analytics | PostHog / Umami | product + funnel analytics |
| Error tracking | Sentry | web + server errors |

### 2.2 Почему Next + Better Auth + Postgres + Drizzle

- **Next.js App Router**: server components, route handlers, server actions, metadata/OG, easy public pages.
- **Better Auth**: современный TypeScript auth, email/password, social login, plugins, Drizzle adapter.
- **PostgreSQL**: сильная база для социальных связей, JSONB, full-text search, индексы, транзакции.
- **Drizzle ORM**: SQL-first, типобезопасные схемы, легкая миграция, удобно держать доменную модель рядом с кодом.

### 2.3 Репозиторий

Рекомендуемый старт: один Next.js app repo.

```txt
coffee-journey/
  app/
    (marketing)/
    (auth)/
    (app)/
    api/
  components/
    ui/
    coffee/
    social/
    forms/
    export/
  db/
    schema/
    migrations/
    index.ts
  lib/
    auth/
    media/
    permissions/
    search/
    validators/
    server-actions/
  modules/
    recipes/
    brews/
    coffees/
    gear/
    social/
    profiles/
    export-studio/
    clubs/
  public/
  tests/
  drizzle.config.ts
  next.config.ts
  package.json
```

### 2.4 Первичный `package.json` baseline

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "auth:generate": "npx auth@latest generate --yes",
    "test": "vitest run",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "@aws-sdk/client-s3": "latest",
    "@aws-sdk/s3-request-presigner": "latest",
    "better-auth": "^1.6.16",
    "drizzle-orm": "^0.45.2",
    "next": "^16.2.9",
    "postgres": "^3.4.9",
    "react": "^19.2.7",
    "react-dom": "^19.2.7",
    "zod": "^4.4.3"
  },
  "devDependencies": {
    "drizzle-kit": "latest",
    "tailwindcss": "^4.3.0",
    "typescript": "^6.0.3",
    "vitest": "latest",
    "playwright": "latest"
  }
}
```

---

## 3. Информационная архитектура

### 3.1 Главные разделы приложения

**Mobile bottom nav**

1. Home — социальная лента и персональные рекомендации.
2. Explore — рецепты, люди, зерно, оборудование, клубы.
3. Brew — быстрый запуск brew mode.
4. Community — clubs, challenges, messages, notifications.
5. Profile — личный профиль, коллекции, статистика.

**Desktop sidebar**

1. Home Feed
2. Explore
3. My Recipes
4. Brew Logs
5. Coffees
6. Gear
7. Clubs
8. Messages
9. Export Studio
10. Profile
11. Settings

### 3.2 Типы контента

| Тип | Приватный | Public | Unlisted | Followers | Remixable | Комментарии |
|---|---:|---:|---:|---:|---:|---:|
| Recipe | да | да | да | да | да | да |
| Brew Log | да | да | да | да | нет | да |
| Coffee Beans | да | да | да | нет | нет | да |
| Gear Item | да | да | нет | нет | нет | да |
| Collection | да | да | да | collaborative | нет | да |
| Profile | частично | да | нет | нет | нет | да |
| Club Post | нет | зависит от клуба | нет | members | нет | да |

### 3.3 Visibility модель

```ts
type Visibility = "private" | "unlisted" | "followers" | "public";
type RemixPolicy = "none" | "with_credit" | "ask_permission";
type CommentPolicy = "disabled" | "followers" | "public";
```

Правила:

- `private`: видит только владелец.
- `unlisted`: видит владелец и любой с прямой ссылкой.
- `followers`: видит владелец и подписчики.
- `public`: видит весь интернет, может индексироваться.
- `remixable`: доступно только для public/unlisted рецептов.
- Любой public контент можно пожаловаться/скрыть.

---

## 4. Ключевые пользовательские сценарии

### 4.1 Создать приватный brew log

1. Пользователь выбирает рецепт или создает free brew.
2. Заполняет кофе, оборудование, дозу, воду, температуру, помол, время.
3. Ставит рейтинг и tasting notes.
4. Прикрепляет фото.
5. Сохраняет как private.

### 4.2 Опубликовать заварку как социальный пост

1. После brew mode появляется post-brew экран.
2. Пользователь добавляет фото, rating, заметку, что изменил.
3. Visibility: Public / Followers / Private.
4. Нажимает Publish.
5. Brew log появляется в профиле и ленте подписчиков.

### 4.3 Повторить чужой рецепт

1. Пользователь находит рецепт в Explore.
2. Открывает public recipe page.
3. Нажимает **Brew this recipe**.
4. Проходит brew mode.
5. Сохраняет результат как brew log.
6. Может оставить rating/comment автору.

### 4.4 Сделать remix рецепта

1. Пользователь нажимает **Remix**.
2. Система копирует recipe draft с `parentRecipeId`.
3. Пользователь меняет параметры/steps.
4. Публикует с attribution.
5. На странице оригинала появляется вкладка Remixes.
6. На странице remix виден diff: что изменилось.

### 4.5 Найти рецепт под свое оборудование

1. Пользователь добавляет grinder, dripper, filters.
2. В Explore включает **Works with my setup**.
3. Система показывает рецепты, которые совпадают с методом, дрipper/filter, диапазоном дозы и помола.
4. Пользователь сохраняет или запускает рецепт.

### 4.6 Сгенерировать красивую карточку

1. Открыть Export Studio.
2. Выбрать recipe/brew log.
3. Выбрать формат: post/story/square/transparent/print.
4. Выбрать тему и блоки.
5. Preview.
6. Export PNG/JPG/WebP, copy link, share.

---

## 5. Модули продукта

## 5.1 Landing

### Цель

Показать, что это не просто журнал, а социальный дом для кофеманов.

### Hero варианты

- **Brew better. Share more. Connect.**
- **The social brewing journal for coffee people.**
- **Track every cup. Share every recipe. Discover your next brew.**

### Landing секции

1. Hero с CTA: `Join Coffee Journey`, `Explore Recipes`.
2. Social proof: users, shared recipes, brew logs, countries.
3. Private Journal: “Keep your personal brews private”.
4. Public Recipes: “Publish your best recipes”.
5. Explore Database: filters by method, dose, water, grinder, roast, flavor.
6. Brew Mode: interactive timer.
7. Profiles: coffee passport.
8. Community: follows, clubs, challenges.
9. Export Studio: social cards.
10. Pricing/Waitlist.
11. Footer.

### SEO

Публичные страницы:

- `/r/[handle]/[recipeSlug]`
- `/u/[handle]`
- `/explore`
- `/coffee/[slug]`
- `/gear/[slug]`
- `/clubs/[slug]`

---

## 5.2 Auth + Onboarding

### Auth методы

MVP:

- email/password;
- email verification;
- reset password;
- Google OAuth;
- Apple OAuth later;
- magic link optional.

### Better Auth

- Использовать Drizzle adapter с provider `pg`.
- Auth tables генерировать CLI и хранить в `db/schema/auth.ts`.
- App profile хранить отдельно в `profiles`.
- Username/handle — уникальный, case-insensitive.
- Session cookies secure, httpOnly, sameSite=lax.

### Onboarding steps

1. Welcome.
2. Choose handle.
3. Select brew methods: V60, Origami, Kalita, AeroPress, Espresso, French Press, Switch.
4. Add first gear: grinder/dripper/filter.
5. Add first coffee or skip.
6. Privacy default: private-first или social-first.
7. Follow suggested creators/clubs.

---

## 5.3 Social Home Feed

### Feed tabs

- For You
- Following
- Popular
- Latest
- Same Gear
- Same Beans
- Nearby later

### Feed item types

1. Brew log post.
2. Recipe post.
3. Recipe remix.
4. Collection post.
5. Club challenge.
6. Roaster/cafe recipe.

### Feed card actions

- Like
- Comment
- Save
- Brew this
- Remix
- Share
- Follow author
- Hide/report

### Feed ranking MVP

Первый этап без ML:

- `following` first;
- свежесть;
- совпадение метода/gear/flavor;
- saves + repeats + comments;
- исключить blocked/muted users;
- разнообразие авторов.

---

## 5.4 Explore

### Объекты поиска

- Recipes
- People
- Coffees
- Roasters
- Gear
- Clubs
- Collections
- Brew logs

### Recipe filters

- visibility: public/my/private/following;
- method;
- dripper;
- filter;
- grinder;
- dose range;
- water range;
- ratio range;
- temperature range;
- brew time range;
- grind label;
- roast level;
- origin;
- process;
- variety;
- flavor notes;
- difficulty;
- rating;
- repeat count;
- language;
- `worksWithMySetup`.

### Coffee filters

- roaster;
- country;
- region;
- farm;
- variety;
- process;
- roast level;
- flavor notes;
- rating;
- roast date freshness;
- “has public recipes”.

### Gear filters

- type: grinder/dripper/filter/kettle/scale/server;
- brand;
- model;
- material;
- brew methods;
- rating;
- popular recipes.

---

## 5.5 Public User Profile

### Profile sections

1. Cover image + avatar.
2. Handle, display name, bio, location.
3. Badges: Verified barista, Roaster, Challenge winner.
4. Stats: recipes, brew logs, followers, following, total recipe brews.
5. Taste profile radar.
6. Favorite methods/gear.
7. Tabs:
   - Recipes
   - Brew Logs
   - Collections
   - Gear
   - Coffees
   - Clubs
   - Likes/Saved optional private
8. Follow/message buttons.

### Profile photo uploads

- Avatar: square crop, 512×512 output.
- Cover: 1600×600 desktop, 900×600 mobile crop.
- Store original privately, expose optimized derivatives.

---

## 5.6 Recipes

### Recipe fields

Core:

- title;
- slug;
- subtitle;
- description;
- method;
- visibility;
- remix policy;
- cover photo;
- author;
- parent recipe for remix;
- coffee dose g;
- water g/ml;
- ratio;
- temperature °C;
- grind label;
- grind setting;
- total brew time;
- difficulty;
- filter;
- dripper;
- grinder;
- coffee optional;
- taste profile;
- flavor notes;
- notes/tips;
- steps.

### Recipe steps

Each step:

- label: Bloom, Pour 1, Pour 2, Drawdown;
- start time;
- end time optional;
- pour water amount;
- cumulative water;
- pour style;
- instruction;
- cue text;
- cue audio later;
- animation type: circle, pulse, wave, line, droplet.

### Recipe social stats

- likes count;
- saves count;
- brews count;
- average rating;
- repeat rate;
- remixes count;
- comments count;
- public brew logs count.

---

## 5.7 Recipe Builder

### Desktop layout

3-column editor:

1. Left: media + metadata.
2. Center: parameters + steps table.
3. Right: live preview + visibility/social settings.

### Mobile layout

Wizard:

1. Basics
2. Ingredients
3. Gear
4. Steps
5. Taste profile
6. Visibility
7. Preview

### Uploads

- Recipe cover image.
- Step images optional later.
- Author signature optional.

### Validation

- title required;
- method required;
- dose > 0;
- water > 0;
- ratio auto-calc if dose/water present;
- steps cumulative water must not exceed total water unless override;
- public recipe must have cover or generated cover.

---

## 5.8 Live Brew Mode

### Modes

1. Classic timeline.
2. Big circular timer.
3. Manual step-by-step.
4. Voice/haptic guided.
5. Screen-awake mode.

### Core elements

- current time;
- current step;
- next target;
- target water total;
- poured water input/manual;
- temperature;
- pause/reset/skip/end;
- progress ring/timeline;
- tips;
- recipe summary.

### Post-brew result

After finishing:

- total time;
- actual water;
- grind setting;
- rating;
- tasting notes;
- what changed;
- photo upload;
- visibility;
- publish/save private.

---

## 5.9 Brew Logs

### Brew log fields

- title;
- recipe id optional;
- coffee id optional;
- grinder id optional;
- dripper id optional;
- filter id optional;
- dose;
- water;
- ratio;
- temp;
- grind label/setting;
- brew time;
- brewed at;
- rating;
- tasting notes text;
- flavor tags;
- tasting scores: aroma, sweetness, acidity, body, balance, finish;
- notes;
- photos;
- visibility;
- compare-to-recipe delta.

### Social post behavior

If public/followers:

- feed item created;
- followers notified if high-signal optional;
- related recipe stats updated;
- public comments allowed by policy.

---

## 5.10 Coffee Beans Library

### Coffee entity layers

**Global coffee lot** — общая страница зерна/лота.  
**User coffee** — конкретный пакет пользователя, roast date, amount, notes, private/public.

### Fields

- name;
- roaster;
- origin country;
- region;
- farm;
- producer;
- variety;
- process;
- roast level;
- roast date;
- flavor notes;
- altitude;
- bag size;
- price optional private;
- photos;
- rating;
- status: active/finished/wishlist.

### Social coffee page

- people brewing this coffee;
- best recipes for this coffee;
- average rating;
- most common flavor notes;
- public brew logs;
- roaster page link.

---

## 5.11 Gear Library

### Gear types

- grinder;
- dripper;
- filter;
- kettle;
- scale;
- server;
- espresso machine;
- other.

### Grinder fields

- brand;
- model;
- type: manual/electric;
- burr type;
- burr size;
- zero point;
- espresso range;
- filter range;
- notes;
- photo;
- visibility;
- linked recipes/brew logs.

### Dripper fields

- brand;
- model;
- material;
- size;
- brew speed;
- filter compatibility;
- notes;
- photo.

### Gear social pages

- public recipes using this gear;
- brew logs using this gear;
- common settings by method;
- user reviews;
- “people also use”.

---

## 5.12 Collections

### Collection types

- recipes;
- brew logs;
- coffee beans;
- gear;
- mixed.

### Features

- private/public/unlisted;
- collaborative collections;
- cover image;
- description;
- reorder items;
- share link;
- follow collection.

---

## 5.13 Clubs & Challenges

### Clubs

Examples:

- V60 Club;
- Origami Lovers;
- Light Roast Society;
- Espresso Dial-in;
- Home Baristas;
- Kyoto Coffee.

Club features:

- public/private/members-only;
- posts;
- pinned recipes;
- weekly challenge;
- leaderboard;
- moderation.

### Challenges

Example challenge:

- title;
- description;
- recipe constraints;
- date range;
- entry rules;
- leaderboard metric;
- badge reward.

Entry:

- brew log;
- photo;
- rating;
- notes;
- public by default.

---

## 5.14 Messages & Questions

MVP can start with comments only. Beta adds direct messages.

Message use cases:

- ask author about recipe;
- ask about grinder settings;
- club discussions;
- roaster/customer Q&A.

Safety:

- request inbox;
- block/report;
- followers-only messages option.

---

## 5.15 Notifications

Notification types:

- someone followed you;
- someone liked your recipe/brew log;
- someone commented;
- someone brewed your recipe;
- someone remixed your recipe;
- challenge reminder;
- club mention;
- new reply;
- admin/moderation.

Notification channels:

- in-app MVP;
- email digest later;
- push notifications later.

---

## 5.16 Export Studio

### Input

- recipe;
- brew log;
- collection;
- coffee page later.

### Formats

- Instagram Post 4:5;
- Instagram Story/Reels 9:16;
- Square 1:1;
- Transparent PNG overlay;
- Printable A5/A4;
- Public web page;
- animated MP4/GIF later.

### Customization

- theme;
- photo;
- typography;
- accent color;
- blocks show/hide;
- language;
- author signature;
- QR code;
- privacy watermark optional.

### Output

- client-side preview;
- server-side high-res render;
- stored media asset;
- copy link;
- download PNG/JPG/WebP/PDF.

---

## 6. Uploads & Media Architecture

### 6.1 Какие фото нужны

- profile avatar;
- profile cover;
- recipe cover;
- recipe step images later;
- brew log photos;
- coffee bean bag/photo;
- roaster logo;
- grinder photo;
- dripper photo;
- filter photo;
- kettle/scale/server photo;
- club cover;
- collection cover;
- export card outputs.

### 6.2 Storage

Recommended:

- Local dev: local filesystem upload fallback.
- Production: Cloudflare R2.
- CDN: Cloudflare.
- DB stores metadata only, not binary images.

### 6.3 Upload flow

1. Client selects file.
2. Client validates size/type locally.
3. Client calls `POST /api/media/presign` with `{ entityType, entityId?, fileName, mimeType, size }`.
4. Server checks auth + rate limit + permission.
5. Server creates `media_assets` row with status `pending`.
6. Server returns signed PUT URL and storage key.
7. Client uploads directly to storage.
8. Client calls `POST /api/media/complete`.
9. Server verifies object exists.
10. Background job creates derivatives:
    - thumb 256;
    - card 1080;
    - cover 1600;
    - blurhash;
    - EXIF stripped;
    - WebP/AVIF optional.
11. Server updates `media_assets.status = ready`.
12. Entity table stores `coverAssetId` or relation table.

### 6.4 File rules

| Use | Types | Max size | Output |
|---|---|---:|---|
| Avatar | jpg/png/webp/heic | 8 MB | 512 square |
| Cover | jpg/png/webp/heic | 12 MB | 1600 wide |
| Recipe | jpg/png/webp/heic | 15 MB | 1080/1600 variants |
| Brew log | jpg/png/webp/heic | 15 MB | gallery + post variants |
| Gear | jpg/png/webp/heic | 10 MB | product card variants |
| Export output | png/jpg/webp/pdf | generated | high-res |

### 6.5 Privacy

- Private assets are not served via public URL.
- Use signed read URLs or CDN token auth for private/unlisted assets.
- Public derivatives can be cached aggressively.
- Original uploads remain private by default.
- Delete account must enqueue media deletion.

---

## 7. Database Design

### 7.1 Naming

- Tables: snake_case plural.
- Columns: snake_case.
- TypeScript objects: camelCase.
- IDs: `uuid` unless Better Auth generated schema uses text IDs.
- Timestamps: `created_at`, `updated_at`, optional `deleted_at`.
- Soft delete for user content.

### 7.2 Core enums

```ts
visibility: private | unlisted | followers | public
recipe_method: v60 | origami | kalita | aeropress | espresso | french_press | switch | chemex | cold_brew | other
media_status: pending | processing | ready | failed | deleted
media_kind: avatar | cover | recipe | brew_log | coffee | gear | export | club | collection
gear_type: grinder | dripper | filter | kettle | scale | server | espresso_machine | other
reaction_type: like | cheers | love | helpful
notification_type: follow | like | comment | reply | recipe_brewed | recipe_remixed | mention | challenge | system
```

### 7.3 Tables

#### Auth tables

Generated by Better Auth CLI into `db/schema/auth.ts`.

Expected core:

- `user`
- `session`
- `account`
- `verification`

Do not manually diverge from generated auth schema unless migration is planned.

#### profiles

```txt
id uuid pk
user_id text/uuid unique references auth user
handle citext unique not null
display_name text not null
bio text
location text
website_url text
avatar_asset_id uuid references media_assets
cover_asset_id uuid references media_assets
default_visibility visibility default private
is_public boolean default true
is_verified boolean default false
created_at timestamptz
updated_at timestamptz
```

#### media_assets

```txt
id uuid pk
owner_id references user
kind media_kind
status media_status
bucket text
storage_key text unique
public_url text nullable
mime_type text
size_bytes integer
width integer
height integer
blurhash text
alt_text text
visibility visibility
metadata jsonb
created_at timestamptz
updated_at timestamptz
```

#### follows

```txt
follower_id user id
following_id user id
created_at
primary key (follower_id, following_id)
```

#### recipes

```txt
id uuid pk
author_id user id
parent_recipe_id uuid references recipes nullable
slug text
version integer default 1
title text
subtitle text
description text
method recipe_method
visibility visibility
remix_policy text
comment_policy text
cover_asset_id uuid
coffee_dose_g numeric(6,2)
water_g numeric(7,2)
ratio text
temperature_c numeric(5,2)
grind_label text
grind_setting text
total_time_seconds integer
difficulty text
language text default 'en'
is_published boolean default false
published_at timestamptz
created_at timestamptz
updated_at timestamptz
deleted_at timestamptz
unique(author_id, slug)
```

#### recipe_steps

```txt
id uuid pk
recipe_id uuid references recipes on delete cascade
position integer
label text
start_seconds integer
end_seconds integer nullable
pour_g numeric(7,2) nullable
total_water_g numeric(7,2) nullable
pour_style text
instruction text
cue_text text
animation_key text
created_at timestamptz
updated_at timestamptz
unique(recipe_id, position)
```

#### brew_logs

```txt
id uuid pk
user_id user id
recipe_id uuid nullable
coffee_id uuid nullable
grinder_id uuid nullable
dripper_id uuid nullable
filter_id uuid nullable
title text
visibility visibility
brewed_at timestamptz
coffee_dose_g numeric(6,2)
water_g numeric(7,2)
ratio text
temperature_c numeric(5,2)
grind_label text
grind_setting text
brew_time_seconds integer
rating numeric(2,1)
notes text
what_changed text
cover_asset_id uuid
is_published boolean default false
created_at timestamptz
updated_at timestamptz
deleted_at timestamptz
```

#### brew_log_scores

```txt
brew_log_id uuid pk references brew_logs
aroma smallint
sweetness smallint
acidity smallint
body smallint
balance smallint
finish smallint
overall smallint
```

#### coffees / roasters / user_coffees

`roasters`:

```txt
id uuid pk
name text
slug text unique
country text
city text
website_url text
logo_asset_id uuid
created_at
updated_at
```

`coffees` global lot:

```txt
id uuid pk
roaster_id uuid nullable
name text
slug text
origin_country text
region text
farm text
producer text
variety text
process text
roast_level text
flavor_notes text[]
cover_asset_id uuid
created_by user id
visibility visibility
created_at
updated_at
```

`user_coffees`:

```txt
id uuid pk
user_id user id
coffee_id uuid nullable
custom_name text
roast_date date
opened_at date
finished_at date
bag_size_g integer
price_cents integer nullable
private_notes text
rating numeric(2,1)
status text
visibility visibility
cover_asset_id uuid
created_at
updated_at
```

#### gear_products / user_gear

`gear_products` global:

```txt
id uuid pk
type gear_type
brand text
model text
slug text unique
material text
size text
description text
cover_asset_id uuid
metadata jsonb
created_at
updated_at
```

`user_gear`:

```txt
id uuid pk
user_id user id
gear_product_id uuid nullable
type gear_type
custom_brand text
custom_model text
name text
visibility visibility
cover_asset_id uuid
settings jsonb
notes text
is_default boolean
created_at
updated_at
```

For grinder settings, use `settings`:

```json
{
  "burrType": "conical",
  "burrSizeMm": 38,
  "zeroPoint": "touch point",
  "filterRange": "18-28 clicks",
  "espressoRange": "6-12 clicks"
}
```

#### social interactions

`comments`:

```txt
id uuid pk
author_id user id
target_type text
target_id uuid
parent_id uuid nullable
body text
created_at
updated_at
deleted_at
```

`reactions`:

```txt
id uuid pk
user_id user id
target_type text
target_id uuid
type reaction_type
created_at
unique(user_id, target_type, target_id, type)
```

`saves`:

```txt
id uuid pk
user_id user id
target_type text
target_id uuid
collection_id uuid nullable
created_at
unique(user_id, target_type, target_id)
```

`notifications`:

```txt
id uuid pk
user_id user id
actor_id user id nullable
type notification_type
target_type text
target_id uuid
payload jsonb
read_at timestamptz nullable
created_at
```

#### collections

```txt
collections:
id uuid pk
owner_id user id
title text
slug text
description text
visibility visibility
cover_asset_id uuid
created_at
updated_at

collection_items:
id uuid pk
collection_id uuid
item_type text
item_id uuid
position integer
note text
created_at
```

#### clubs / challenges

```txt
clubs:
id uuid pk
owner_id user id
slug text unique
name text
description text
visibility visibility
cover_asset_id uuid
created_at
updated_at

club_members:
club_id uuid
user_id user id
role text
joined_at
primary key (club_id, user_id)

challenges:
id uuid pk
club_id uuid nullable
creator_id user id
title text
description text
starts_at timestamptz
ends_at timestamptz
rules jsonb
badge_asset_id uuid
created_at
updated_at

challenge_entries:
id uuid pk
challenge_id uuid
user_id user id
brew_log_id uuid
score numeric nullable
created_at
unique(challenge_id, user_id, brew_log_id)
```

### 7.4 Indexes

Must-have:

- `profiles(handle)` unique, citext.
- `recipes(author_id, slug)` unique.
- `recipes(visibility, published_at desc)`.
- `recipes(method, visibility)`.
- `brew_logs(user_id, brewed_at desc)`.
- `brew_logs(recipe_id, visibility)`.
- `coffees(origin_country, process, roast_level)`.
- `gear_products(type, brand, model)`.
- `comments(target_type, target_id, created_at)`.
- `reactions(target_type, target_id)`.
- `notifications(user_id, read_at, created_at desc)`.
- Full text index on recipe title/description/tags.

---

## 8. API / Server Actions

Prefer Server Actions for form mutations inside authenticated app; route handlers for upload, public API, webhooks and generated exports.

### 8.1 Auth

- `GET/POST /api/auth/*` — Better Auth handler.
- `GET /api/session` optional wrapper.

### 8.2 Media

- `POST /api/media/presign`
- `POST /api/media/complete`
- `DELETE /api/media/[id]`
- `GET /api/media/[id]/signed-url`

### 8.3 Recipes

- `createRecipeAction`
- `updateRecipeAction`
- `publishRecipeAction`
- `deleteRecipeAction`
- `remixRecipeAction`
- `GET /api/recipes/search`
- `GET /r/[handle]/[slug]` public page

### 8.4 Brew Logs

- `createBrewLogAction`
- `updateBrewLogAction`
- `publishBrewLogAction`
- `GET /api/brew-logs/search`

### 8.5 Social

- `followUserAction`
- `unfollowUserAction`
- `reactAction`
- `saveAction`
- `commentAction`
- `reportAction`
- `GET /api/feed`
- `GET /api/notifications`

### 8.6 Gear & coffee

- `createCoffeeAction`
- `createUserCoffeeAction`
- `createGearAction`
- `createUserGearAction`
- `GET /api/explore/coffees`
- `GET /api/explore/gear`

### 8.7 Export

- `POST /api/export/preview`
- `POST /api/export/render`
- `GET /api/export/[id]`

---

## 9. Permissions

### 9.1 Read access

```txt
owner: always
private: owner only
unlisted: owner + direct link
followers: owner + accepted followers
public: everyone
```

### 9.2 Write access

- Entity owner can edit/delete.
- Club owner/moderator can moderate club content.
- Admin can hide/remove content.
- Collaborators can edit collaborative collections only.

### 9.3 Remix access

- Only if recipe `remix_policy !== none`.
- Always keep `parent_recipe_id` and attribution.
- Original author can request removal of misleading attribution.

---

## 10. Design System

### 10.1 Direction

Новая визуальная система: не копировать старые “золотые таблицы рецептов”. Сделать более современную кофейную соцсеть:

- premium dark;
- soft glass surfaces;
- espresso black;
- warm clay/copper accents;
- cream typography;
- tactile cards;
- editorial recipe pages;
- mobile-first social interactions;
- focus on photos and readable data.

### 10.2 Tokens

```css
:root {
  --bg: #0c0b0a;
  --bg-soft: #141210;
  --surface: rgba(255,255,255,0.055);
  --surface-strong: rgba(255,255,255,0.09);
  --border: rgba(255,255,255,0.12);
  --text: #f4efe7;
  --muted: #a9a09a;
  --accent: #d58a54;
  --accent-2: #caa36a;
  --green: #7f8a56;
  --danger: #d15b52;
  --radius-sm: 10px;
  --radius-md: 16px;
  --radius-lg: 24px;
}
```

### 10.3 Typography

- Headings: editorial serif or high-contrast display.
- UI: clean sans.
- Data labels: small uppercase tracking.
- Timers: large serif/sans hybrid.

### 10.4 Components

- App shell desktop/mobile.
- Feed card.
- Recipe card.
- Brew log card.
- Profile header.
- Stat capsule.
- Visibility switch.
- Upload dropzone.
- Photo crop modal.
- Step editor table.
- Brew timer ring.
- Filter drawer.
- Comment thread.
- Export preview canvas.
- Bottom sheet.
- Command palette.

---

## 11. Screen Map

Full screen set for MVP/Beta:

1. Landing desktop.
2. Landing mobile.
3. Sign up / sign in.
4. Onboarding.
5. Social Home Feed desktop.
6. Social Home Feed mobile.
7. Explore desktop.
8. Explore mobile.
9. Filter drawer mobile.
10. Recipe list desktop.
11. Recipe list mobile.
12. Recipe detail public desktop.
13. Recipe detail public mobile.
14. Recipe detail owner/edit desktop.
15. Add recipe desktop.
16. Add recipe mobile wizard.
17. Live brew mode desktop.
18. Live brew mode mobile.
19. Post-brew/add brew log desktop.
20. Post-brew/add brew log mobile.
21. Brew logs history desktop.
22. Brew logs history mobile.
23. Coffees collection desktop.
24. Coffees collection mobile.
25. Add coffee desktop.
26. Add coffee mobile.
27. Gear library desktop.
28. Gear library mobile.
29. Add grinder desktop.
30. Add grinder mobile.
31. Add dripper/filter desktop.
32. Add dripper/filter mobile.
33. User profile desktop.
34. User profile mobile.
35. Edit profile desktop/mobile.
36. Collections desktop/mobile.
37. Clubs desktop/mobile.
38. Challenge detail desktop/mobile.
39. Messages desktop/mobile.
40. Notifications desktop/mobile.
41. Export Studio desktop.
42. Export Studio mobile.
43. Export preview/share page.
44. Settings desktop/mobile.
45. Admin/moderation dashboard.

---

## 12. MVP Scope

### MVP must-have

- Auth + onboarding.
- Profile with avatar/cover upload.
- Private/public recipes.
- Recipe builder with photo upload.
- Brew mode timer.
- Brew log creation with photo upload.
- Coffees library with photo upload.
- Gear library with grinder/dripper/filter photo upload.
- Social feed MVP.
- Follow, like, save, comment.
- Explore recipes with filters.
- Public user profile.
- Public recipe page.
- Export Studio basic PNG.
- Responsive desktop/mobile.

### Beta

- Remix diff.
- Clubs.
- Challenges.
- Notifications.
- Better recommendations.
- Public gear/coffee pages.
- Collaborative collections.
- Push notifications.
- Animated export.

### Later

- Native app wrapper.
- Bluetooth scale integration.
- Automatic water tracking.
- AI recipe suggestions.
- Roaster/cafe accounts.
- Marketplace/affiliate gear links.

---

## 13. Non-functional Requirements

### Performance

- Mobile LCP < 2.5s on landing.
- App route TTFB < 500ms for cached pages.
- Feed pagination cursor-based.
- Images lazy-loaded with responsive sizes.
- Server-side image derivatives.

### Accessibility

- WCAG AA contrast.
- Keyboard navigation.
- Focus states.
- Screen reader labels.
- Reduced motion mode for brew animations.

### Privacy

- Private by default during onboarding unless user chooses social-first.
- Easy visibility toggle on every recipe/log/collection.
- Download/export personal data later.
- Delete account + media cleanup.

### Security

- Better Auth secure session cookies.
- CSRF protection for mutations.
- Rate limits for auth, upload, comments, follows.
- MIME sniffing for uploads.
- EXIF stripping.
- Signed upload URLs expire quickly.
- Server-side permission checks for every mutation.
- Moderation reporting.

### Observability

- Sentry for errors.
- PostHog events for funnel.
- DB slow query logging.
- Audit events for sensitive actions.

---

## 14. Analytics Events

Core events:

- `auth_signup_started`
- `auth_signup_completed`
- `onboarding_completed`
- `recipe_created`
- `recipe_published`
- `recipe_brew_started`
- `recipe_brew_completed`
- `brew_log_created`
- `brew_log_published`
- `recipe_saved`
- `recipe_remixed`
- `user_followed`
- `comment_created`
- `export_card_generated`
- `export_card_downloaded`
- `media_uploaded`
- `search_performed`
- `filter_applied`

---

## 15. Acceptance Criteria для MVP

MVP считается готовым, когда:

1. Пользователь может зарегистрироваться, пройти onboarding и загрузить avatar.
2. Пользователь может создать private recipe с фото, шагами и параметрами.
3. Пользователь может сделать recipe public.
4. Другой пользователь может найти public recipe, сохранить и сварить его.
5. Brew mode запускается с шагами и завершает заварку.
6. После brew mode создается brew log с rating, notes и фото.
7. Public brew log появляется в feed.
8. Можно follow/like/save/comment.
9. Explore фильтрует рецепты по method, dose, water, gear, roast/flavor.
10. Пользователь может добавить grinder/dripper/filter/coffee с фото.
11. Публичный профиль показывает recipes, brew logs, gear, stats.
12. Export Studio генерирует PNG карточку рецепта.
13. Все ключевые экраны адаптированы под desktop и mobile.
14. Private контент недоступен другим пользователям даже по прямому URL.
15. Uploads работают через signed URLs, оригиналы не публичные по умолчанию.

---

## 16. Open Questions

1. Нужен ли native mobile app сразу или достаточно PWA?
2. Какая модель монетизации: Pro export, roaster pages, advanced analytics?
3. Делать ли public map cafes/roasters в MVP или beta?
4. Какой стиль фоток: пользовательские фото first или curated generated covers?
5. Нужны ли русская/английская/японская локализации в MVP?
6. Нужны ли organization accounts для roasters/cafes в Beta?

---

## 17. Источники версий, проверенные при составлении

- Next.js npm/latest и документация: https://www.npmjs.com/package/next, https://nextjs.org/docs/app/getting-started/installation
- Better Auth changelog/docs: https://better-auth.com/changelog, https://www.better-auth.com/docs/adapters/drizzle
- Drizzle ORM npm/docs: https://www.npmjs.com/package/drizzle-orm, https://orm.drizzle.team/docs/upgrade-v1
- PostgreSQL official releases: https://www.postgresql.org/
- Postgres.js npm: https://www.npmjs.com/package/postgres
- React/TypeScript/Tailwind/Zod npm/docs: npm package pages and official docs
