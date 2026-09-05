# Daoji Platform - Domain Model & Architecture

## Tech Stack
*   **Framework:** Next.js (App Router)[cite: 38]
*   **Styling:** Tailwind CSS[cite: 38]
*   **Backend/Auth:** Supabase[cite: 38]
*   **Storage:** Dual Cloudflare R2 bucket architecture utilizing `@aws-sdk/client-s3`[cite: 38]. Private bucket for secure applicant submissions (`submissions/test/` vs `submissions/real/`)[cite: 38]. Public bucket with custom CDN URL (`https://cdn.ajahnyiu.org`) for public-facing web assets (banners, images, media pool)[cite: 38].
*   **Upload Pipeline:** Direct browser-to-R2 presigned S3 PUT uploads for both form submissions and Media Pool assets, bypassing serverless function payload limits for files up to 100MB+[cite: 38].
*   **Internationalization:** `next-intl` (Traditional Chinese as default locale `/zh`)[cite: 38]
*   **External Brain:** Coda (Daoji Platform acts as a "dumb pipe")[cite: 38]
*   **Infrastructure:** Vercel Hosting + Cloudflare Reverse Proxy (for Mainland China GFW mitigation)[cite: 38].

---

## Admin Workspace Design System & Theme Architecture
To ensure strict visual consistency and eliminate code duplication across domains:

*   **Color Token Partitioning:**
    *   **Admin Dashboard (`app/admin/(dashboard)/`):** Standardized on the **Indigo** system palette (`bg-indigo-600`, `hover:bg-indigo-700`, `bg-indigo-50`, `text-indigo-600`, `focus:ring-indigo-500`)[cite: 38].
    *   **Public Portal (`app/[locale]/`):** Uses the **Daoji Ochre** brand palette (`--color-primary: #A65D24`, `--color-surface-cream: #FAF5F0`, `--color-surface-base: #FCFAF8`)[cite: 38].
*   **Shared Admin Primitives (`components/admin/shared/`):**
    *   `<AdminPageHeader/>`: Standard title, subtitle, optional breadcrumb link, and primary action button[cite: 38].
    *   `<AdminTableToolbar/>`: Debounced search input, status filter tabs, and action slots[cite: 38].
    *   `<AdminTableCard/>`: Unified table container with loading skeleton, empty state, and responsive scroll[cite: 38].
    *   `<AdminStatusBanner/>`: Dismissable success/error notification banners[cite: 38].
    *   `<ShareQrModal/>`: Universal URL copier and 1000x1000 high-res QR PNG downloader[cite: 38].
    *   `<StatusBadgeSelect/>`: Color-coded operational status switcher (`open`/`published`, `draft`/`unlisted`, `closed`/`archived`)[cite: 38].
*   **Unified Editor Architecture (`components/admin/editor/`):**
    *   `<EditorLayout/>`: Standardized two-pane layout shell with center scrollable canvas and fixed `460px` right inspector[cite: 38].
    *   `<EditorHeader/>`: Top bar with back navigation, entity title, code chip, split/single view switcher, preview, locked/read-only indicator, and save button[cite: 38].
    *   `<BilingualCanvas/>`: Side-by-side or tabbed writing surface for English and Traditional Chinese content with integrated `<MediaPicker/>` triggers[cite: 38].
    *   `<CoverBannerPicker/>`: Cover banner selector linked directly to the Media Pool with natural aspect-ratio rendering and disabled state support[cite: 37, 38].
    *   `<UrlSlugInspector/>`: Live-sanitized vanity URL input supporting RFC 3986 path characters (`a-z0-9\-_.~+%`), lock badge, and prefix visualization.
    *   `<MarkdownEditor/>`: Reusable rich markdown editor with embedded `<MediaPicker/>` integration, injecting SEO/alt text image markdown at cursor positions[cite: 36, 38].

---

## Core Domains & Paths

### Public Shell (`app/[locale]/`)
*   **Events Calendar & Hub:** `app/[locale]/events/page.tsx` & `app/[locale]/events/[id_or_slug]/page.tsx`[cite: 38]
*   **Bulletin / News Feed:** `app/[locale]/news/page.tsx` & `app/[locale]/news/[id_or_slug]/page.tsx`[cite: 38]
*   **Knowledge Resource Hub:** `app/[locale]/resources/page.tsx` & `app/[locale]/resources/[id_or_slug]/page.tsx`[cite: 38]
*   **Static Pages:** `app/[locale]/[id_or_slug]/page.tsx` (About Us, Contact, Facility Rules)[cite: 38]
*   **Form Renderer:** `app/[locale]/form/[id_or_slug]/page.tsx` (Slug / short_id edge cached)[cite: 38]
*   **Tag Hubs:** `app/[locale]/tags/[id_or_slug]/page.tsx` (Cross-domain topic aggregator)[cite: 38]

### Admin Dashboard (`app/admin/`)
*   **Auth Routes (Public):** `app/admin/login/`, `app/admin/forgot-password/`, `app/admin/setup-password/`, `app/admin/auth/`[cite: 38]
*   **Protected Workspace (`app/admin/(dashboard)/`):**
    *   **Events Manager:** `app/admin/(dashboard)/events/` (Operational dates, venues, organizers, registration modes, recurrence rules, blackout dates)[cite: 38]
    *   **Editorial Content / Articles:** `app/admin/(dashboard)/articles/` (Markdown editor with `<MediaPicker/>`, feed toggles, multi-event linking)[cite: 38]
    *   **Resource Hub Curator:** `app/admin/(dashboard)/resources/` (Curated library index: assets, YouTube, articles, external links)[cite: 38]
    *   **Media Pool (Assets):** `app/admin/(dashboard)/assets/` (Centralized R2 storage pool & reusable `<MediaPicker/>`)[cite: 38]
    *   **Taxonomy Manager:** `app/admin/(dashboard)/tags/` (Topic Pillars and polymorphic Micro-tags)[cite: 38]
    *   **Forms Builder:** `app/admin/(dashboard)/forms/builder/page.tsx` (Schema visual editor, question canvas, logic inspector, read-only guard)[cite: 38]
    *   **Forms Management Table:** `app/admin/(dashboard)/forms/page.tsx` (Relational event code badges, submission counts, QR sharing)[cite: 21, 38]
    *   **Submissions View:** `app/admin/(dashboard)/forms/[form_id]/submissions/page.tsx`[cite: 38]
    *   **Team Management:** `app/admin/(dashboard)/team/page.tsx`[cite: 38]
    *   **Audit Logs Explorer:** `app/admin/(dashboard)/logs/page.tsx`[cite: 38]
*   **Secure File Proxy:** `app/admin/file/route.ts`[cite: 38]

---

## Data Modeling & Schema

### 1. Storage & Media Layer (`assets`)
*   **Role:** Physical Cloudflare R2 binary registry (The Media Pool) served over `https://cdn.ajahnyiu.org`[cite: 38].
*   **Fields:** `id` (UUID), `file_url` (CDN link), `s3_key`, `file_name`, `mime_type`, `file_size_bytes`, `width`, `height`, `alt_text_zh`, `alt_text_en`, `created_by` (UUID), `created_at`[cite: 38].
*   **Display Policy:** Banner images render with natural aspect ratios (fitted to container width, no hard aspect-ratio cropping)[cite: 38].

### 2. Organizers Registry (`organizers`)
*   **Role:** Repository for internal and external organizing bodies, sangha trusts, and affiliated foundations[cite: 38].
*   **Fields:** `id` (UUID PK), `name_en` (Text NOT NULL, mandatory), `name_zh` (Text, nullable), `url` (Text, nullable), `description_zh` (Text, nullable), `description_en` (Text, nullable), `created_at` (TIMESTAMPTZ)[cite: 38].
*   **Access Control:** Governed under `events:create`, `events:edit`, and `events:delete`[cite: 38].

### 3. Venues Registry (`venues`)
*   **Role:** Centralized repository for physical event locations[cite: 38].
*   **Fields:** `id` (UUID PK), `name_zh` (Text), `name_en` (Text, nullable), `address_zh` (Text, nullable), `address_en` (Text, nullable), `google_maps_url` (Text, nullable), `amap_url` (Text, nullable for Mainland China navigation), `transport_guide_zh` (Text, nullable), `transport_guide_en` (Text, nullable), `created_at` (TIMESTAMPTZ)[cite: 38].
*   **Access Control:** Governed under `events:create`, `events:edit`, and `events:delete`[cite: 38].

### 4. Operational Domain (`events`)
*   **Role:** First-class operational hub for dates, recurring schedules, venues, organizers, registration state machines, and livestream gateways[cite: 38].
*   **Fields:**
    *   `id` (UUID PK), `short_id` (Text, 8-char Base62, Unique), `slug` (Text, nullable, Unique)[cite: 38].
    *   `organizer_id` (FK -> `organizers.id`, nullable)[cite: 38].
    *   `title_zh`, `title_en` (Text)[cite: 38].
    *   `summary_zh`, `summary_en` (Text, plain-text preview snippet for cards, calendars, and SEO OpenGraph)[cite: 38].
    *   `body_zh`, `body_en` (Text, rich Markdown description with inline assets)[cite: 38].
    *   `languages` (`TEXT[]`, default `'{cantonese}'` — Multiple selection from: `cantonese`, `mandarin`, `english`, `thai`)[cite: 38].
    *   `start_date` (TIMESTAMPTZ), `end_date` (TIMESTAMPTZ) — **Defines the first occurrence/session slot and duration**[cite: 38].
    *   `timezone` (Text, default `'Asia/Hong_Kong'`), `is_all_day` (Boolean)[cite: 38].
    *   `recurrence_rule` (JSONB: `frequency`, `interval`, `days_of_week`, `until_date`, `count`)[cite: 38].
    *   `blackout_dates` (`DATE[]`, skipped occurrences e.g. when teacher is away)[cite: 38].
    *   **Location Format Toggles:**
        *   `is_in_person` (Boolean, default `true`): Enables `venue_id` (FK -> `venues.id`), `venue_override_zh`, `venue_override_en`[cite: 38].
        *   `is_livestream` (Boolean, default `false`): Enables `livestream_config` (JSONB: `zoom_url`, `youtube_url`, `facebook_url`, `zoom_meeting_id`, `zoom_passcode`, `open_minutes_before` default 15)[cite: 38].
    *   **Registration & Participation Gate:**
        *   `registration_mode` (`internal_form` | `external_url` | `not_required`)[cite: 38].
        *   `code` (Text, 1–8 uppercase alphanumeric, **non-unique**, mandatory *only* when `registration_mode = 'internal_form'`, defines the applicant token namespace e.g. `STAY-XXXX-XXXX`)[cite: 38].
        *   `linked_form_id` (FK -> `forms.id`, nullable, active when `registration_mode = 'internal_form'`)[cite: 38].
        *   `external_url` (Text, nullable, active when `registration_mode = 'external_url'`)[cite: 38].
        *   `registration_status` (`upcoming` | `open` | `closed`)[cite: 38].
        *   `cta_label_zh`, `cta_label_en` (Text, nullable custom button labels)[cite: 38].
    *   `banner_asset_id` (FK -> `assets.id`, nullable)[cite: 38].
    *   `status` (`draft` | `published` | `unlisted` | `archived`), `is_featured` (Boolean), `created_at`, `updated_at`[cite: 38].

### 5. Multi-Event Articles Junction (`event_articles`)
*   **Role:** N:N associative relation allowing single announcement articles to promote multiple events, or single events to aggregate chronological article updates[cite: 38].
*   **Fields:** `event_id` (UUID FK -> `events.id`), `article_id` (UUID FK -> `content_pages.id`), `sort_order` (Integer), `created_at` (TIMESTAMPTZ)[cite: 38].
*   **Primary Key:** `(event_id, article_id)`[cite: 38].

### 6. Dynamic Forms Engine (`forms`)
*   **Role:** Schema-driven dynamic forms supporting applications, supplementary surveys, and registration flows[cite: 19, 38].
*   **Fields:**
    *   `id` (UUID PK)[cite: 19].
    *   `slug` (Text Unique, RFC 3986 safe character set)[cite: 19].
    *   `event_id` (UUID NOT NULL, FK -> `events.id` ON DELETE SET NULL constraint `forms_event_id_fkey`)[cite: 19]. Every form is mandatory-bound to a parent event record.
    *   `title` (Text, internal reference name)[cite: 19].
    *   `is_followup` (Boolean, requires prior applicant token to enter)[cite: 19].
    *   `status` (`draft` | `open` | `closed`)[cite: 19].
    *   `schema` (JSONB, holds public titles, subtitles, banner image URL, success screen config, event code namespace, and fields array)[cite: 19].
    *   `created_at`, `updated_at` (TIMESTAMPTZ)[cite: 19].
*   **Read-Only State Lock:**
    *   Forms with status `open` or `closed` are strictly read-only in both the UI and backend Server Actions (`saveFormSchema` rejects mutations unless status is reverted to `draft`)[cite: 27].
    *   Users with only `forms:view_schema` permission can inspect schemas in read-only mode across all statuses (`draft`, `open`, `closed`).
*   **Field Types Supported:**
    *   Text: `text`, `textarea`, `email`, `mobile` (international phone parsing)[cite: 11].
    *   Numeric: `number` (with custom `decimals`, `min`, `max` settings, formatting on blur e.g. `0.00` for currency).
    *   Choices: `select`, `radio`, `checkbox`[cite: 11].
    *   Verification: `applicant_token` (inline token check against event code cohort)[cite: 11].
    *   DateTime & Files: `date`, `time` (HH:MM split validation), `file` (R2 upload)[cite: 11].
    *   Layout: `info` (informational text block)[cite: 11].
*   **Conditional Logic Rule Engine:**
    *   Evaluates single and composite rules (`AND` / `OR`).
    *   Supports operations: `equals`, `not_equals`, `greater_than`, `less_than`, `within_range`, `not_within_range`, `contains`, `not_contains`, `is_one_of`, `is_not_one_of`, `is_blank`, `is_not_blank`.
    *   Strict type isolation prevents numeric operations from breaking string date/time comparisons.
*   **Success Screen Configuration:**
    *   Applicant Token card displays strictly if and where `{{TOKEN_BOX}}` is explicitly placed in the markdown success message (no forced auto-append).

### 7. Form Submissions & Magic Token Ledger (`submissions`)
*   **Role:** Raw applicant responses, magic tokens, and cohort sequencing[cite: 19, 38].
*   **Fields:**
    *   `id` (UUID PK)[cite: 19].
    *   `form_id` (UUID FK -> `forms.id` ON DELETE CASCADE)[cite: 19].
    *   `event_id` (UUID NOT NULL)[cite: 19].
    *   `event_code` (TEXT NOT NULL, indexed via `idx_submissions_event_code_token` and `idx_submissions_event_code_seq`).
    *   `applicant_token` (Text, indexed, formatted as `[EVENT_CODE]-XXXX-XXXX`)[cite: 19].
    *   `applicant_seq_num` (Integer, sequential applicant number within the shared `event_code`)[cite: 19].
    *   `response` (JSONB, raw key-value submission data)[cite: 19].
    *   `is_test` (Boolean, tags test submissions from `?test=true` preview sessions)[cite: 19].
    *   `is_processed` (Boolean, tracking administrative fulfillment)[cite: 19].
    *   `created_at` (TIMESTAMPTZ)[cite: 19].
*   **Event Code Scoping:**
    *   Sequence numbers (`applicant_seq_num`) and returning token reuse are partitioned globally by `event_code` via the PostgreSQL `set_applicant_seq_num()` trigger[cite: 19].
    *   Multiple events sharing the same event code share a unified token and sequence namespace.

### 8. Editorial & Static Content (`content_pages`)
*   **Role:** Web-native reading material, blog reflections, bulletin updates, and fixed layout pages[cite: 38].
*   **Fields:** `id` (UUID), `short_id` (Text, 8-char Base62, Unique), `slug` (Text, nullable, Unique), `type` (`page` | `article`), `title_zh`, `title_en`, `body_zh` (Markdown), `body_en`, `cover_asset_id` (FK -> `assets.id`, nullable), `is_in_feed` (Boolean, shows in `/news`), `is_pinned_in_feed` (Boolean, sticky banner), `status` (`draft` | `published` | `archived`), `published_at`, `created_at`, `updated_at`[cite: 38].

### 9. Knowledge Hub Catalog (`resources`)
*   **Role:** Curated public library entries (`/[locale]/resources`) linking across formats[cite: 38].
*   **Fields:** `id` (UUID), `short_id` (Text, 8-char Base62, Unique), `slug` (Text, nullable, Unique), `source_type` (`asset` | `youtube` | `article` | `external_link`), `target_asset_id` (FK -> `assets.id`, nullable), `target_page_id` (FK -> `content_pages.id`, nullable), `external_url` (Text, nullable), `title_zh`, `title_en`, `description_zh`, `description_en`, `author_speaker_zh`, `author_speaker_en`, `cover_asset_id` (FK -> `assets.id`, nullable), `is_featured` (Boolean), `status` (`draft` | `published` | `archived`), `created_at`, `updated_at`[cite: 38].

### 10. Polymorphic Taxonomy (`tags` & `taggables`)
*   **`tags` Table:** `id` (UUID), `short_id` (Text, 8-char Base62, Unique), `slug` (Text, nullable, Unique), `name_zh`, `name_en`, `is_pillar` (Boolean, marks Tier-2 Topic Pillars), `color` (Hex code), `created_at`[cite: 38].
*   **`taggables` Table:** `tag_id` (UUID), `taggable_id` (UUID), `taggable_type` (`event` | `content_page` | `resource` | `asset`), with a composite primary key `(tag_id, taggable_id, taggable_type)`[cite: 38].

---

## Operational Action & Button State Machines

### 1. Registration Button State Machine (3 States)
*   **Mode: `internal_form` (Dynamic Inheritance):**
    *   `forms.status === 'draft'` ➔ **State 1: Upcoming** (`即將開放` / *Opening Soon*). Outlined Cream (`bg-[#FAF5F0] border border-[#A65D24]/40 text-[#A65D24]`)[cite: 38].
    *   `forms.status === 'open'` ➔ **State 2: Open** (`立即報名` / *Register Now*). Solid Daoji Ochre (`bg-[#A65D24] text-white shadow-xs`)[cite: 38] ➔ smooth-scroll or navigate to form[cite: 38].
    *   `forms.status === 'closed'` ➔ **State 3: Closed** (`報名截止` / *Registration Closed*). Muted Stone (`bg-stone-200 text-stone-500 cursor-not-allowed`)[cite: 38].
*   **Mode: `external_url` (Manual Selection):**
    *   Admin selects `upcoming`, `open`, or `closed` directly[cite: 38].
*   **Mode: `not_required` (Passive Badge):**
    *   Renders informational banner: `無需預先報名・自由入座` (*No pre-registration required*)[cite: 38].

### 2. Livestream Action Engine (Time-Windowed & Multi-Platform)
*   **Active Window:** `now >= (next_session_start - open_minutes_before)` **AND** `now <= next_session_end`[cite: 38].
    *   Renders multi-platform trigger bar with platform-specific badges:
        *   **Zoom:** Direct app link + Meeting ID & Passcode copy modal[cite: 38].
        *   **YouTube:** Direct YouTube live stream URL[cite: 38].
        *   **Facebook:** Direct Facebook Live stream URL[cite: 38].
*   **Outside Window (Single & Recurring Sessions):**
    *   Finds next scheduled session date/time (omitting `blackout_dates`)[cite: 38].
    *   Renders status hint: `直播將於 [日期 時間 - X分鐘] 開放進入` (*Livestream opens at [Date Time - X min]*)[cite: 38].
*   **After Event Concluded:**
    *   Hides livestream buttons automatically when all occurrences have passed[cite: 38].

---

## URL Routing & Identifier Architecture
1.  **Permanent `short_id` (Immutable):** Every public record receives an auto-generated 8-character Base62 string (e.g., `k8x9m2pz`)[cite: 38].
2.  **Vanity `slug` (Mutable URL String):**
    *   Slugs support RFC 3986 legitimate characters: `a-z`, `0-9`, `-`, `_`, `.`, `+`, `%`, `~`.
    *   Sanitized automatically by `sanitizeSlug` to prevent path traversal (`/`, `\`) or query breaks (`?`, `#`).
3.  **Unified Resolution:** Route handlers execute an indexed lookup[cite: 38]:
    ```sql
    WHERE (short_id = $1 OR slug = $1) AND status IN ('published', 'unlisted')
    ```
4.  **Listing vs Single Page Visibility:**
    *   Public `/events` hub lists records with `status = 'published'`[cite: 38].
    *   Direct links (`/events/[short_id]` or `/events/[slug]`) resolve for both `status = 'published'` and `status = 'unlisted'`[cite: 38].
5.  **SEO & Permanence:** Changing a slug never breaks existing inbound links because the permanent `short_id` remains valid indefinitely[cite: 38].

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
1.  **Action-Based Access Control (ABAC) & Silent Denial:** Centrally governed by `lib/permissions.ts`[cite: 38]. All mutations guarded by `hasPermission` with non-redirecting graceful failure payloads and UI action suppression (e.g., hidden delete buttons for unauthorized roles)[cite: 38]:
    *   `forms:*` (`view`, `view_schema`, `create`, `edit`, `delete`, `update_status`)[cite: 32].
    *   `submissions:*` (`view_real`, `view_test`, `export_real`, `export_test`, `manage`)[cite: 32].
    *   `events:*` (`view`, `create`, `edit`, `delete`, `publish`) — also governs `venues` and `organizers`[cite: 32, 38].
    *   `articles:*` (`view`, `create`, `edit`, `delete`, `publish`)[cite: 32, 38].
    *   `resources:*` (`view`, `create`, `edit`, `delete`, `publish`)[cite: 32, 38].
    *   `assets:*` (`view`, `upload`, `delete`)[cite: 32, 38].
    *   `tags:*` (`view`, `create`, `edit`, `delete`)[cite: 32, 38].
2.  **Strict File Privacy & S3 Partitioning:**
    *   Private submissions: `submissions/test/` vs `submissions/real/`[cite: 38].
    *   Public media pool: Public R2 CDN bucket with direct access URLs (`https://cdn.ajahnyiu.org`)[cite: 38].
3.  **Payload Buffering & Streaming:** Configured with 100MB stream limits in `next.config.mjs` (`serverActions.bodySizeLimit: '100mb'`, `proxyClientMaxBodySize: '100mb'`)[cite: 24].
4.  **Bilingual Fallback Chain (Graceful Cross-Language Fallback):** Traditional Chinese is the default primary locale (`/zh`)[cite: 38]. Fallback chain: `Current Language` ➔ `Other Available Language` ➔ `Default/Key` (e.g., if an English-only retreat/article is visited via Chinese `/zh`, the English information is gracefully rendered rather than displaying blank fields).
5.  **Polymorphic SEO Factory:** Dynamic metadata generated via `constructMetadata` in `lib/seo.ts` across Events, Resources, Articles, and Static Pages[cite: 38].
6.  **Edge Caching (GFW Mitigation):** All public-facing routes (`/events/[id_or_slug]`, `/news/[id_or_slug]`, `/resources/[id_or_slug]`, `/[id_or_slug]`) use dynamic route segments for Next.js ISR/SSG and CDN edge caching.