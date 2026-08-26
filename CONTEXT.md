# Daoji Platform - Domain Model & Architecture

## Tech Stack
*   **Framework:** Next.js (App Router)[cite: 24]
*   **Styling:** Tailwind CSS[cite: 24]
*   **Backend/Auth:** Supabase[cite: 24]
*   **Storage:** Dual Cloudflare R2 bucket architecture utilizing `@aws-sdk/client-s3`[cite: 24]. Private bucket for secure applicant submissions (`submissions/test/` vs `submissions/real/`)[cite: 24]. Public bucket with custom CDN URL (`https://cdn.ajahnyiu.org`) for public-facing web assets (banners, images, media pool)[cite: 24].
*   **Upload Pipeline:** Direct browser-to-R2 presigned S3 PUT uploads for both form submissions and Media Pool assets, bypassing serverless function payload limits for files up to 100MB+[cite: 24].
*   **Internationalization:** `next-intl` (Chinese-first priority)[cite: 24]
*   **External Brain:** Coda (Daoji Platform acts as a "dumb pipe")[cite: 24]
*   **Infrastructure:** Vercel Hosting + Cloudflare Reverse Proxy (for Mainland China GFW mitigation)[cite: 24].

---

## Admin Workspace Design System & Theme Architecture
To ensure strict visual consistency and eliminate code duplication across domains:

*   **Color Token Partitioning:**
    *   **Admin Dashboard (`app/admin/(dashboard)/`):** Standardized on the **Indigo** system palette (`bg-indigo-600`, `hover:bg-indigo-700`, `bg-indigo-50`, `text-indigo-600`, `focus:ring-indigo-500`).
    *   **Public Portal (`app/[locale]/`):** Uses the **Daoji Ochre** brand palette (`--color-primary: #A65D24`, `--color-surface-cream: #FAF5F0`, `--color-surface-base: #FCFAF8`)[cite: 14].
*   **Shared Admin Primitives (`components/admin/shared/`):**
    *   `<AdminPageHeader/>`: Standard title, subtitle, optional breadcrumb link, and primary action button[cite: 25].
    *   `<AdminTableToolbar/>`: Debounced search input, status filter tabs, and action slots[cite: 25].
    *   `<AdminTableCard/>`: Unified table container with loading skeleton, empty state, and responsive scroll[cite: 25].
    *   `<AdminStatusBanner/>`: Dismissable success/error notification banners[cite: 25].
    *   `<ShareQrModal/>`: Universal URL copier and 1000x1000 high-res QR PNG downloader[cite: 25].
    *   `<StatusBadgeSelect/>`: Color-coded operational status switcher (`open`/`published`, `draft`/`unlisted`, `closed`/`archived`)[cite: 25].
*   **Unified Editor Architecture (`components/admin/editor/`):**
    *   `<EditorLayout/>`: Standardized two-pane layout shell with center scrollable canvas and fixed `460px` right inspector.
    *   `<EditorHeader/>`: Top bar with back navigation, entity title, code chip, split/single view switcher, preview, and save button.
    *   `<BilingualCanvas/>`: Side-by-side or tabbed writing surface for English and Traditional Chinese content with integrated `<MediaPicker/>` triggers[cite: 24].
    *   `<CoverBannerPicker/>`: Cover banner upload/selection card linked directly to the Media Pool.
    *   `<UrlSlugInspector/>`: Live-sanitized vanity URL input with permalink assistance and domain prefix.

---

## Core Domains & Paths

### Public Shell (`app/[locale]/`)
*   **Events Calendar & Hub:** `app/[locale]/events/page.tsx` & `app/[locale]/events/[id_or_slug]/page.tsx`[cite: 24]
*   **Bulletin / News Feed:** `app/[locale]/news/page.tsx` & `app/[locale]/news/[id_or_slug]/page.tsx`[cite: 24]
*   **Knowledge Resource Hub:** `app/[locale]/resources/page.tsx` & `app/[locale]/resources/[id_or_slug]/page.tsx`[cite: 24]
*   **Static Pages:** `app/[locale]/[id_or_slug]/page.tsx` (About Us, Contact, Facility Rules)[cite: 24]
*   **Form Renderer:** `app/[locale]/form/[id_or_slug]/page.tsx` (Slug / short_id edge cached)[cite: 24]
*   **Tag Hubs:** `app/[locale]/tags/[id_or_slug]/page.tsx` (Cross-domain topic aggregator)[cite: 24]

### Admin Dashboard (`app/admin/`)
*   **Auth Routes (Public):** `app/admin/login/`, `app/admin/forgot-password/`, `app/admin/setup-password/`, `app/admin/auth/`[cite: 24]
*   **Protected Workspace (`app/admin/(dashboard)/`):**
    *   **Events Manager:** `app/admin/(dashboard)/events/` (Operational dates, venues, organizers, registration modes, recurrence rules, blackout dates)[cite: 24]
    *   **Editorial Content / Articles:** `app/admin/(dashboard)/articles/` (Markdown editor with `<MediaPicker/>`, feed toggles, multi-event linking)[cite: 24]
    *   **Resource Hub Curator:** `app/admin/(dashboard)/resources/` (Curated library index: assets, YouTube, articles, external links)[cite: 24]
    *   **Media Pool (Assets):** `app/admin/(dashboard)/assets/` (Centralized R2 storage pool & reusable `<MediaPicker/>`)[cite: 24]
    *   **Taxonomy Manager:** `app/admin/(dashboard)/tags/` (Topic Pillars and polymorphic Micro-tags)[cite: 24]
    *   **Forms Builder:** `app/admin/(dashboard)/forms/builder/page.tsx`[cite: 24]
    *   **Submissions View:** `app/admin/(dashboard)/forms/[form_id]/submissions/page.tsx`[cite: 24]
    *   **Team Management:** `app/admin/(dashboard)/team/page.tsx`[cite: 24]
    *   **Audit Logs Explorer:** `app/admin/(dashboard)/logs/page.tsx`[cite: 24]
*   **Secure File Proxy:** `app/admin/file/route.ts`[cite: 24]

---

## Data Modeling & Schema

### 1. Storage & Media Layer (`assets`)
*   **Role:** Physical Cloudflare R2 binary registry (The Media Pool) served over `https://cdn.ajahnyiu.org`[cite: 24].
*   **Fields:** `id` (UUID), `file_url` (CDN link), `s3_key`, `file_name`, `mime_type`, `file_size_bytes`, `width`, `height`, `alt_text_zh`, `alt_text_en`, `created_by` (UUID), `created_at`[cite: 24].
*   **Display Policy:** Banner images render with natural aspect ratios (fitted to container width, no hard aspect-ratio cropping).

### 2. Organizers Registry (`organizers`)
*   **Role:** Repository for internal and external organizing bodies, sangha trusts, and affiliated foundations.
*   **Fields:** `id` (UUID PK), `name_en` (Text NOT NULL, mandatory), `name_zh` (Text, nullable), `url` (Text, nullable), `description_zh` (Text, nullable), `description_en` (Text, nullable), `created_at` (TIMESTAMPTZ).
*   **Access Control:** Governed under `events:create`, `events:edit`, and `events:delete`.

### 3. Venues Registry (`venues`)
*   **Role:** Centralized repository for physical event locations[cite: 24].
*   **Fields:** `id` (UUID PK), `name_zh` (Text), `name_en` (Text, nullable), `address_zh` (Text, nullable), `address_en` (Text, nullable), `google_maps_url` (Text, nullable), `amap_url` (Text, nullable for Mainland China navigation), `transport_guide_zh` (Text, nullable), `transport_guide_en` (Text, nullable), `created_at` (TIMESTAMPTZ)[cite: 24].
*   **Access Control:** Governed under `events:create`, `events:edit`, and `events:delete`.

### 4. Operational Domain (`events`)
*   **Role:** First-class operational hub for dates, recurring schedules, venues, organizers, registration state machines, and livestream gateways[cite: 24].
*   **Fields:**
    *   `id` (UUID PK), `short_id` (Text, 8-char Base62, Unique), `slug` (Text, nullable, Unique)[cite: 24].
    *   `organizer_id` (FK -> `organizers.id`, nullable).
    *   `title_zh`, `title_en` (Text)[cite: 24].
    *   `summary_zh`, `summary_en` (Text, plain-text preview snippet for cards, calendars, and SEO OpenGraph)[cite: 24].
    *   `body_zh`, `body_en` (Text, rich Markdown description with inline assets)[cite: 24].
    *   `languages` (`TEXT[]`, default `'{cantonese}'` — Multiple selection from: `cantonese`, `mandarin`, `english`, `thai`).
    *   `start_date` (TIMESTAMPTZ), `end_date` (TIMESTAMPTZ) — **Defines the first occurrence/session slot and duration**[cite: 24].
    *   `timezone` (Text, default `'Asia/Hong_Kong'`), `is_all_day` (Boolean)[cite: 24].
    *   `recurrence_rule` (JSONB: `frequency`, `interval`, `days_of_week`, `until_date`, `count`)[cite: 24].
    *   `blackout_dates` (`DATE[]`, skipped occurrences e.g. when teacher is away)[cite: 24].
    *   **Location Format Toggles:**
        *   `is_in_person` (Boolean, default `true`): Enables `venue_id` (FK -> `venues.id`), `venue_override_zh`, `venue_override_en`[cite: 24].
        *   `is_livestream` (Boolean, default `false`): Enables `livestream_config` (JSONB: `zoom_url`, `youtube_url`, `facebook_url`, `zoom_meeting_id`, `zoom_passcode`, `open_minutes_before` default 15).
    *   **Registration & Participation Gate:**
        *   `registration_mode` (`internal_form` | `external_url` | `not_required`).
        *   `code` (Text, 1–8 uppercase alphanumeric, **non-unique**, mandatory *only* when `registration_mode = 'internal_form'`, defines the applicant token namespace e.g. `STAY-XXXX-XXXX`)[cite: 24].
        *   `linked_form_id` (FK -> `forms.id`, nullable, active when `registration_mode = 'internal_form'`)[cite: 24].
        *   `external_url` (Text, nullable, active when `registration_mode = 'external_url'`)[cite: 24].
        *   `registration_status` (`upcoming` | `open` | `closed`)[cite: 24].
        *   `cta_label_zh`, `cta_label_en` (Text, nullable custom button labels)[cite: 24].
    *   `banner_asset_id` (FK -> `assets.id`, nullable)[cite: 24].
    *   `status` (`draft` | `published` | `unlisted` | `archived`), `is_featured` (Boolean), `created_at`, `updated_at`.

### 5. Multi-Event Articles Junction (`event_articles`)
*   **Role:** N:N associative relation allowing single announcement articles to promote multiple events, or single events to aggregate chronological article updates[cite: 24].
*   **Fields:** `event_id` (UUID FK -> `events.id`), `article_id` (UUID FK -> `content_pages.id`), `sort_order` (Integer), `created_at` (TIMESTAMPTZ)[cite: 24].
*   **Primary Key:** `(event_id, article_id)`[cite: 24].

### 6. Editorial & Static Content (`content_pages`)
*   **Role:** Web-native reading material, blog reflections, bulletin updates, and fixed layout pages[cite: 24].
*   **Fields:** `id` (UUID), `short_id` (Text, 8-char Base62, Unique), `slug` (Text, nullable, Unique), `type` (`page` | `article`), `title_zh`, `title_en`, `body_zh` (Markdown), `body_en`, `cover_asset_id` (FK -> `assets.id`, nullable), `is_in_feed` (Boolean, shows in `/news`), `is_pinned_in_feed` (Boolean, sticky banner), `status` (`draft` | `published` | `archived`), `published_at`, `created_at`, `updated_at`[cite: 24].

### 7. Knowledge Hub Catalog (`resources`)
*   **Role:** Curated public library entries (`/[locale]/resources`) linking across formats[cite: 24].
*   **Fields:** `id` (UUID), `short_id` (Text, 8-char Base62, Unique), `slug` (Text, nullable, Unique), `source_type` (`asset` | `youtube` | `article` | `external_link`), `target_asset_id` (FK -> `assets.id`, nullable), `target_page_id` (FK -> `content_pages.id`, nullable), `external_url` (Text, nullable), `title_zh`, `title_en`, `description_zh`, `description_en`, `author_speaker_zh`, `author_speaker_en`, `cover_asset_id` (FK -> `assets.id`, nullable), `is_featured` (Boolean), `status` (`draft` | `published` | `archived`), `created_at`, `updated_at`[cite: 24].

### 8. Polymorphic Taxonomy (`tags` & `taggables`)
*   **`tags` Table:** `id` (UUID), `short_id` (Text, 8-char Base62, Unique), `slug` (Text, nullable, Unique), `name_zh`, `name_en`, `is_pillar` (Boolean, marks Tier-2 Topic Pillars), `color` (Hex code), `created_at`[cite: 24].
*   **`taggables` Table:** `tag_id` (UUID), `taggable_id` (UUID), `taggable_type` (`event` | `content_page` | `resource` | `asset`), with a composite primary key `(tag_id, taggable_id, taggable_type)`[cite: 24].

---

## Operational Action & Button State Machines

### 1. Registration Button State Machine (3 States)
*   **Mode: `internal_form` (Dynamic Inheritance):**
    *   `forms.status === 'draft'` ➔ **State 1: Upcoming** (`即將開放` / *Opening Soon*). Outlined Cream (`bg-[#FAF5F0] border border-[#A65D24]/40 text-[#A65D24]`)[cite: 24].
    *   `forms.status === 'open'` ➔ **State 2: Open** (`立即報名` / *Register Now*). Solid Daoji Ochre (`bg-[#A65D24] text-white shadow-xs`)[cite: 24] ➔ smooth-scroll or navigate to form[cite: 24, 25].
    *   `forms.status === 'closed'` ➔ **State 3: Closed** (`報名截止` / *Registration Closed*). Muted Stone (`bg-stone-200 text-stone-500 cursor-not-allowed`)[cite: 24].
*   **Mode: `external_url` (Manual Selection):**
    *   Admin selects `upcoming`, `open`, or `closed` directly[cite: 24].
*   **Mode: `not_required` (Passive Badge):**
    *   Renders informational banner: `無需預先報名・自由入座` (*No pre-registration required*).

### 2. Livestream Action Engine (Time-Windowed & Multi-Platform)
*   **Active Window:** `now >= (next_session_start - open_minutes_before)` **AND** `now <= next_session_end`.
    *   Renders multi-platform trigger bar with platform-specific badges:
        *   **Zoom:** Direct app link + Meeting ID & Passcode copy modal.
        *   **YouTube:** Direct YouTube live stream URL.
        *   **Facebook:** Direct Facebook Live stream URL.
*   **Outside Window (Single & Recurring Sessions):**
    *   Finds next scheduled session date/time (omitting `blackout_dates`)[cite: 24].
    *   Renders status hint: `直播將於 [日期 時間 - X分鐘] 開放進入` (*Livestream opens at [Date Time - X min]*).
*   **After Event Concluded:**
    *   Hides livestream buttons automatically when all occurrences have passed.

---

## URL Routing & Identifier Architecture (Dual-Lookup)
1.  **Permanent `short_id` (Immutable):** Every public record receives an auto-generated 8-character Base62 string (e.g., `k8x9m2pz`)[cite: 24].
2.  **Optional `slug` (Mutable Vanity String):** Slugs are optional and globally unique[cite: 24]. When left blank, editor suggests lowercase `/{code}` as initial draft[cite: 24].
3.  **Unified Resolution:** Route handlers execute a single indexed lookup:
    ```sql
    WHERE (short_id = $1 OR slug = $1) AND status IN ('published', 'unlisted')
    ```
4.  **Listing vs Single Page Visibility:**
    *   Public `/events` hub lists records with `status = 'published'`.
    *   Direct links (`/events/[short_id]` or `/events/[slug]`) resolve for both `status = 'published'` and `status = 'unlisted'`.
5.  **SEO & Permanence:** Changing a slug never breaks existing inbound links because the permanent `short_id` remains valid indefinitely[cite: 24]. When accessed via `short_id` for an entity with a vanity slug, the canonical URL points to the slug[cite: 24].

---

## Information Architecture & Taxonomy Model
*   **Tier 1: Top-Level Channels (Fixed Navigation):**[cite: 24]
    1.  `Events` (`/events`) - Operational schedule, venue, forms, registration[cite: 24].
    2.  `Resources` (`/resources`) - Curated knowledge library (Audio, PDFs, Guides, Videos)[cite: 24].
    3.  `Bulletin` (`/news`) - Chronological stream of announcements, articles, and event updates[cite: 24].
    4.  `About` (`/[slug]`) - Static informational pages[cite: 24].
*   **Tier 2: Topic Pillars (Curated Filter Facets):**[cite: 24]
    *   Meditation Practice (禪修), Dhamma Talks & Suttas (經教佛法), Chanting & Liturgy (課誦儀軌), Monastic Life & Vinaya (僧團戒律), Community News (最新動態)[cite: 24].
*   **Tier 3: Polymorphic Micro-Tags (Relational):**[cite: 24]
    *   Free-form tags (`#Anapanasati`, `#Retreat2026`, `#AjahnChah`) connecting related Events, Articles, and Resources on dedicated tag aggregation pages[cite: 24].

---

## Content & Operational Lifecycle Rules
1.  **Event ⟷ Post Relationship (N : N):**
    *   Events exist independently as calendar/operational records without requiring articles[cite: 24].
    *   Articles can optionally link to one or more `events` via `event_articles` to provide updates, registration openings, or post-event recaps[cite: 24].
    *   Event pages automatically aggregate and render all attached posts in a chronological timeline[cite: 24].
2.  **Two-Way Article ⟷ Resource Workflow:**[cite: 24]
    *   *From Article Editor:* Checking `[x] Publish to Resource Hub` automatically provisions/updates a corresponding `resources` record (`source_type: 'article'`)[cite: 24].
    *   *From Resource Curator:* Selecting `source_type: 'article'` enables search and direct linking to existing articles[cite: 24].
3.  **Media Pool Integration:**[cite: 24]
    *   Any file uploaded across editors (Article, Event, Resource) is persisted to `assets`[cite: 24].
    *   Reusable via the slide-over `<MediaPicker/>` component[cite: 24].

---

## Architectural, Security, i18n & SEO Rules
1.  **Action-Based Access Control (ABAC) & Silent Denial:** Centrally governed by `lib/permissions.ts`. All mutations guarded by `hasPermission` with non-redirecting graceful failure payloads and UI action suppression (e.g., hidden delete buttons for unauthorized roles)[cite: 24].
    *   `events:*` (`view`, `create`, `edit`, `delete`, `publish`) — also governs `venues` CRUD[cite: 24].
    *   `articles:*` (`view`, `create`, `edit`, `delete`, `publish`)[cite: 24]
    *   `resources:*` (`view`, `create`, `edit`, `delete`, `publish`)[cite: 24]
    *   `assets:*` (`view`, `upload`, `delete`)[cite: 24]
    *   `tags:*` (`view`, `create`, `edit`, `delete`)[cite: 24]
2.  **Strict File Privacy & S3 Partitioning:**[cite: 24]
    *   Private submissions: `submissions/test/` vs `submissions/real/`[cite: 24].
    *   Public media pool: Public R2 CDN bucket with direct access URLs (`https://cdn.ajahnyiu.org`)[cite: 24].
3.  **Payload Buffering & Streaming:** Configured with 100MB stream limits in `next.config.mjs` (`serverActions.bodySizeLimit: '100mb'`, `proxyClientMaxBodySize: '100mb'`)[cite: 24].
4.  **Chinese-First Priority & i18n Chain:** Traditional Chinese is primary (`/zh`)[cite: 24]. Fallback chain: `Current Language` ➔ `Chinese Primary (zh)` ➔ `Default/Key`[cite: 24].
5.  **Polymorphic SEO Factory:** Dynamic metadata generated via `constructMetadata` in `lib/seo.ts` across Events, Resources, Articles, and Static Pages[cite: 24].
6.  **Edge Caching (GFW Mitigation):** All public-facing routes (`/events/[id_or_slug]`, `/news/[id_or_slug]`, `/resources/[id_or_slug]`, `/[id_or_slug]`) use dynamic route segments for Next.js ISR/SSG and CDN edge caching[cite: 24].