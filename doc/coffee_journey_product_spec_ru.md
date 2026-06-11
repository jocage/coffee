# Coffee Journey — Product Spec & Design Brief

**Tagline:** Every Drop Matters  
**Tone:** dark, premium, warm, minimal, coffee-focused. No Japanese characters in the UI by default; optional localization can be added later.  
**Primary platform:** mobile-first responsive web app / PWA, comfortable on desktop and tablet.

---

## 1. Product vision

Coffee Journey replaces a Notion-based coffee workspace with a dedicated app for:

1. keeping a personal recipe library;
2. logging every brew as a journal entry;
3. connecting recipes, coffees, grinders, drippers, filters and brew results;
4. launching a recipe as an animated brew guide/timer;
5. exporting beautiful recipe cards for Instagram, stories, transparent PNG overlays and public share pages.

The key product principle: **recipe-first, journal-second, export-ready by design.**

A recipe should not feel like a database row. It should feel like a polished brew protocol that can be brewed, logged, improved and shared.

---

## 2. Problems with the current Notion setup

From the screenshots, the current workspace already has the right structure:

- Dashboard: Coffee Journey, Quick Actions, Recent Brews, Recent Coffees, Favorite Recipes, Favorites.
- Databases: Drippers, Grinders, Tasting Notes, Coffees, Recipes.
- Recipe detail: properties plus a manual Brew Steps table.
- Visual inspiration: premium dark navy/gold recipe graphics, recipe cards, brewing timelines and Instagram-style vertical recipe steps.

But Notion creates friction:

- brewing from a table is awkward on mobile;
- brew timer and step animation are not native;
- recipe pages are not visually export-ready;
- public sharing is not controlled enough;
- cards for social media have to be designed separately;
- linked databases are powerful, but feel too heavy during actual brewing;
- recipe versions, experiments and taste adjustments are hard to compare.

---

## 3. Target users

### Primary user
A coffee enthusiast who brews manually, uses different drippers/grinders/coffees, saves recipes, experiments and wants to share polished recipe cards.

### Secondary users
- friends/followers opening a shared recipe;
- other coffee nerds copying/adapting a recipe;
- future public recipe collectors if the app grows into a community library.

---

## 4. Core product objects

### 4.1 Recipe — the main object
A repeatable brew protocol.

Fields:

- Name
- Slug / public URL
- Method: V60, Origami, Kalita, Switch, AeroPress, Espresso, etc.
- Filter type
- Default dripper
- Default grinder
- Coffee dose, g
- Water, g
- Ratio
- Temperature, °C
- Grind text
- Grind settings per grinder
- Target brew time
- Difficulty
- Roast fit: light / medium / dark / omni
- Flavor intent: clarity, sweetness, body, acidity, aroma
- Notes
- Tags
- Rating / favorite flag
- Visibility: private / unlisted / public
- Cover image
- Export theme
- Version number
- Created by / adapted from

### 4.2 Brew Step
Structured instructions inside a recipe.

Fields:

- Step number
- Label: Bloom, 1st Pour, 2nd Pour, Final Pour, Switch Close, Switch Open, Stir, Swirl, Wait
- Start time
- End time or duration
- Water added, g
- Water total, g
- Pour style: center, circles, spiral, aggressive, gentle, bypass, immersion
- Motion cue: pour / wait / swirl / stir / bloom / drain
- Notes
- Alert type: sound / haptic / silent
- Visual marker color or icon

### 4.3 Coffee
A bean/roast entry.

Fields:

- Name
- Roaster
- Country / region / farm / producer
- Process
- Variety
- Roast level
- Flavor notes
- Roast date
- Opened date
- Bag size
- Remaining amount
- Rating
- Comments
- Photos: bag front, label, roast info

### 4.4 Brew Session / Tasting Note
A single brew attempt.

Fields:

- Date
- Coffee
- Recipe
- Recipe version
- Grinder
- Dripper
- Filter
- Actual dose
- Actual water
- Actual temperature
- Actual grind setting
- Actual brew time
- Step deviations
- Rating
- Taste notes
- Acidity / sweetness / body / clarity / bitterness / aftertaste
- Result: under / balanced / over / experimental
- Adjustment suggestion for next brew
- Photos

### 4.5 Equipment

#### Grinder
- Name
- Type: electric / manual
- Brand
- Burr type
- Main use
- Filter setting
- Espresso setting
- Notes

#### Dripper
- Name
- Brand
- Material
- Size
- Brew speed
- Notes

#### Filter
- Name
- Brand
- Shape
- Size
- Flow speed
- Notes

#### Kettle, scale, water profile — v2
Useful later for deeper logging.

---

## 5. Main user flows

### Flow A — Add recipe
1. Tap **New Recipe**.
2. Pick method template: V60, Origami, Kalita, Switch, Custom.
3. Enter dose, water, ratio, temperature, grind, target time.
4. Build steps in a visual timeline.
5. Preview recipe card and brew mode.
6. Save as private or share-ready.

### Flow B — Start brew
1. Open recipe.
2. Tap **Start Brew**.
3. Choose coffee and grinder setting.
4. Brew mode opens full-screen.
5. Timeline animates through steps.
6. The app shows current target: time, water total, water to add, motion cue.
7. Haptic/sound alert when next pour starts.
8. At finish, app asks for rating and tasting notes.
9. Brew session is saved to the journal.

### Flow C — Log tasting note manually
1. Tap **New Brew Log**.
2. Select coffee + recipe + grinder.
3. Fill actual variables.
4. Add taste notes and rating.
5. Save.

### Flow D — Export/share recipe
1. Open recipe.
2. Tap **Share / Export**.
3. Choose format:
   - Instagram Post 4:5
   - Instagram Story 9:16
   - Square 1:1
   - Transparent PNG overlay
   - Printable card
   - Public web page
   - Animated brew guide video / GIF
4. Choose theme:
   - Signature Dark Gold
   - Paper Cream
   - Transparent Minimal
   - Espresso Black
   - Roaster Card
5. Export PNG/WebP/PDF/MP4 or copy public link.

### Flow E — Import from Notion
1. Upload Notion CSV exports or import from existing CSV files.
2. Map databases: Recipes, Coffees, Drippers, Grinders, Tasting Notes.
3. Match relations by name.
4. Preview errors and duplicates.
5. Import into Coffee Journey.

---

## 6. MVP scope

### Must-have
- Auth / private workspace
- Responsive app shell
- Recipe library
- Coffee library
- Equipment: grinders + drippers + filters
- Brew session journal
- Recipe steps builder
- Full-screen brew mode/timer
- Recipe card export: PNG 4:5, Story 9:16, Transparent PNG
- Public unlisted recipe page
- Notion CSV import
- Dark premium design system

### Should-have
- Recipe versioning
- Duplicate/adapt recipe
- Favorite recipes
- Recent brews dashboard
- Grinder-specific settings per recipe
- Taste rating sliders
- Export themes
- Basic analytics: best coffee, best recipe, average rating

### Later
- Native iOS/Android wrapper
- Community recipe discovery
- AI taste adjustment assistant
- Label scanner for coffee bags
- Video export with animated steps
- Offline sync/local-first mode
- Watch companion timer
- Bluetooth scale integration

---

## 7. Information architecture

### Global navigation
- Home
- Recipes
- Brew
- Journal
- Coffees
- Gear
- Exports
- Settings

### Desktop layout
- Left sidebar with navigation and quick create actions.
- Main content area with dashboard, tables, cards and detail panels.
- Optional right rail with selected recipe, recent brew or export preview.

### Mobile layout
- Bottom navigation: Home, Recipes, Brew, Journal, Library.
- Floating **Start Brew** action on recipe pages.
- Full-screen brew mode with large time, water target and next action.
- Card-based lists instead of wide tables.

---

## 8. Design direction

### Visual keywords
- dark navy
- espresso black
- warm gold
- cream typography
- subtle paper/noise texture
- thin divider lines
- tactile cards
- premium recipe poster aesthetic
- calm ritual feeling

### Palette
- Background: `#07111A` / `#101010`
- Surface: `#0C1A24`
- Surface elevated: `#102536`
- Gold: `#D9A441`
- Cream text: `#F6F1E8`
- Muted text: `#A9B0B8`
- Green accent: `#5DAE8B`
- Red warning/acidity accent: `#E06C5F`

### Typography
- Display: elegant high-contrast serif or strong geometric display for recipe cards.
- UI: clean sans-serif for app controls.
- Numbers: tabular numerals for timers, grams and temperature.

### Motion
- Brewing should feel calm, not gamified.
- Step marker travels down a vertical timeline.
- Current pour pulses softly.
- Water total fills as a vertical gauge.
- Completion has a small steam animation.
- Haptic/sound alerts are optional and configurable.

---

## 9. Key screens

### 9.1 Home dashboard
Purpose: overview and quick actions.

Blocks:
- Hero: Today’s Brew / Continue Recipe
- Quick Actions: New Coffee, New Recipe, New Brew Log
- Recent Brews
- Recent Coffees
- Favorite Recipes
- Stats: average rating, top recipe, brews this week

### 9.2 Recipes library
Purpose: browse and manage recipes.

Views:
- Cards
- Table
- Method board
- Favorites
- Public/shared

Card content:
- Name
- Method/filter
- Dose/water/ratio
- Temperature
- Time
- Rating
- Last brewed date
- Start Brew button

### 9.3 Recipe detail
Purpose: recipe as a polished object.

Sections:
- Header with cover, title and favorite/share actions
- Brew parameters
- Gear/settings
- Step timeline
- Taste intent
- Recent brew logs using this recipe
- Export preview
- Version history

### 9.4 Brew mode
Purpose: brewing without distraction.

Mobile-first layout:
- Big timer
- Current action: “Pour to 120 g”
- Water total
- Next step preview
- Vertical timeline
- Pause / skip / finish
- Lock-screen friendly large controls
- End screen: rate, notes, save

### 9.5 Journal
Purpose: compare results and improve.

Views:
- Chronological brew log
- Coffee detail history
- Recipe performance history
- Taste analytics

### 9.6 Export studio
Purpose: beautiful output.

Controls:
- Format
- Theme
- Background: dark / cream / image / transparent
- Language: English / Russian
- Include sections: steps, gear, notes, QR, creator
- Export PNG/WebP/PDF/MP4

---

## 10. Export templates

### Template A — Signature Dark Gold
Inspired by premium coffee recipe posters: dark navy background, gold lines/icons, large white title, recipe hero image, parameter column and step table.

Best for:
- Instagram posts
- recipe announcement
- public share image

### Template B — Story Timer
Vertical 9:16 format with large timeline, current step, grams and finish target.

Best for:
- Instagram stories
- Reels cover
- animated brewing guide

### Template C — Transparent Minimal
Only text, lines, icons and timeline, transparent background.

Best for:
- overlaying on video
- social clips
- thumbnails

### Template D — Paper Recipe Card
Warm paper background, less contrast, print-friendly.

Best for:
- saving as PDF
- sharing in chats
- printing

---

## 11. Data model sketch

```txt
User
  └── Workspace
        ├── Recipes
        │     ├── RecipeVersions
        │     └── BrewSteps
        ├── Coffees
        ├── BrewSessions
        ├── Grinders
        ├── Drippers
        ├── Filters
        ├── MediaAssets
        └── ExportPresets
```

### Important relations
- Recipe has many BrewSteps.
- Recipe has many BrewSessions.
- Coffee has many BrewSessions.
- BrewSession belongs to Coffee, Recipe, Grinder, Dripper and Filter.
- Recipe can have grinder-specific settings.
- ExportPreset belongs to Recipe or Workspace.

---

## 12. Technical direction

### Recommended MVP stack
- Frontend: Next.js + TypeScript
- Styling: Tailwind or CSS Modules with design tokens
- Animation: Framer Motion or CSS motion for brew mode
- Backend: Supabase / Postgres
- Auth: Supabase Auth or Clerk
- Storage: Supabase Storage / S3-compatible storage
- Public pages: server-rendered recipe pages
- Export renderer: HTML/SVG template rendered to PNG/WebP/PDF; transparent PNG support
- PWA: installable mobile web app with offline-friendly brew mode

### Why this approach
- Web-first matches the “start with the site” direction.
- PWA gives a native-like brew timer quickly.
- Postgres handles linked data better than a simple document store.
- HTML/SVG-based export keeps recipe cards visually consistent with the app.

---

## 13. Database tables

### recipes
- id
- user_id
- name
- slug
- method
- filter_type
- default_dripper_id
- default_grinder_id
- dose_g
- water_g
- ratio
- temp_c
- grind_text
- target_time_sec
- flavor_intent_json
- notes
- rating
- is_favorite
- visibility
- cover_asset_id
- current_version_id
- created_at
- updated_at

### recipe_steps
- id
- recipe_id
- version_id
- order_index
- label
- start_sec
- duration_sec
- water_added_g
- water_total_g
- pour_style
- action_type
- notes
- alert_type

### coffees
- id
- user_id
- name
- roaster
- country
- region
- process
- variety
- roast_level
- flavor_notes
- roast_date
- opened_date
- rating
- comments
- image_asset_id

### brew_sessions
- id
- user_id
- coffee_id
- recipe_id
- recipe_version_id
- grinder_id
- dripper_id
- filter_id
- brewed_at
- dose_g
- water_g
- temp_c
- grind_setting
- brew_time_sec
- rating
- taste_notes
- taste_scores_json
- deviations_json
- next_adjustment
- image_asset_id

### grinders / drippers / filters
Mirror the existing Notion properties, with optional additional fields later.

---

## 14. Success metrics

### Activation
- User imports or creates 3+ recipes.
- User logs first brew.
- User starts brew mode at least once.

### Retention
- Brews logged per week.
- Recipes brewed more than once.
- Coffee entries with more than one brew session.

### Sharing
- Recipe card exports per user.
- Public links created.
- Shared recipe page views.

### Quality
- Time to start brew from app open.
- Export success rate.
- Mobile brew mode completion rate.

---

## 15. MVP implementation plan

### Phase 1 — Foundation
- Design tokens
- App shell
- Auth
- Database schema
- Recipes/Coffees/Gear CRUD
- Import from CSV

### Phase 2 — Brew experience
- Step builder
- Recipe detail
- Full-screen brew mode
- Brew session save flow
- Journal timeline

### Phase 3 — Export/share
- Export studio
- PNG card rendering
- Transparent export
- Public recipe page
- QR/share links

### Phase 4 — Polish
- Mobile gestures
- Haptics/sound settings
- Recipe versioning
- Analytics widgets
- More export themes

---

## 16. Design principles

1. **Brew mode is not a database.** It must be full-screen, calm, readable and usable with wet hands.
2. **Every recipe is export-ready.** The same structured data powers the app, the timer and recipe cards.
3. **Journal entries should help improve the next cup.** Logging should connect taste with variables.
4. **Mobile first, desktop powerful.** Mobile for brewing; desktop for editing, organizing and exporting.
5. **Private by default, beautiful when shared.** Sharing should never expose private notes by accident.

---

## 17. First MVP recipe example

**New 10-Pour Recipe**

- Coffee: 20 g
- Water: 300 g
- Ratio: 1:15
- Temperature: 95–96°C
- Grind: Comandante C40, 40–45 clicks / extra-coarse
- Dripper: Hario V60 NEO
- Target finish: around 3:30

Steps:

| # | Time | Water total | Action |
|---|------|-------------|--------|
| 1 | 0:00 | 30 g | Pour 30 g and bloom |
| 2 | 0:30 | 60 g | Pour to 60 g |
| 3 | 0:45 | 90 g | Add 30 g |
| 4 | 1:00 | 120 g | Add 30 g |
| 5 | 1:15 | 150 g | Add 30 g |
| 6 | 1:30 | 180 g | Add 30 g |
| 7 | 1:45 | 210 g | Add 30 g |
| 8 | 2:00 | 240 g | Drawdown starts to slow |
| 9 | 2:15 | 270 g | Add 30 g |
| 10 | 2:30 | 300 g | Finish pouring |

