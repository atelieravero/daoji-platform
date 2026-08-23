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
    *   **Events Manager:** `app/admin/(dashboard)/events/` (Operational dates, venues, linked forms, registration status, recurrence rules, blackout dates)[cite: 24]
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
*   **Usage:** Shared pool for inline article images, event flyers, banner graphics, audio talks, and PDF e-books[cite: 24].

### 2. Venues Registry (`venues`)
*   **Role:** Centralized repository for recurring physical and digital event locations[cite: 24].
*   **Fields:** `id` (UUID PK), `name_zh` (Text), `name_en` (Text, nullable), `address_zh` (Text, nullable), `address_en` (Text, nullable), `google_maps_url` (Text, nullable), `amap_url` (Text, nullable for Mainland China navigation), `transport_guide_zh` (Text, nullable), `transport_guide_en` (Text, nullable), `created_at` (TIMESTAMPTZ)[cite: 24].
*   **Access Control:** Governed under `events:create`, `events:edit`, and `events:delete` (no separate venue permission keys required).

### 3. Operational Domain (`events`)
*   **Role:** First-class operational hub for dates, recurring schedules, venues, linked forms, applicant tokens, and registration state machines[cite: 24].
*   **Fields:**
    *   `id` (UUID PK), `short_id` (Text, 8-char Base62, Unique), `code` (Text, 1–8 uppercase alphanumeric, Unique, replaces `interimEventCode`), `slug` (Text, nullable, Unique)[cite: 24].
    *   `title_zh`, `title_en` (Text)[cite: 24].
    *   `summary_zh`, `summary_en` (Text, plain-text preview snippet for cards, calendars, and SEO OpenGraph)[cite: 24].
    *   `body_zh`, `body_en` (Text, rich Markdown description with inline assets)[cite: 24].
    *   `start_date` (TIMESTAMPTZ), `end_date` (TIMESTAMPTZ), `timezone` (Text, default `'Asia/Hong_Kong'`), `is_all_day` (Boolean)[cite: 24].
    *   `recurrence_rule` (JSONB, frequency, days of week, time window, until date)[cite: 24].
    *   `blackout_dates` (`DATE[]`, skipped occurrences e.g. when teacher is away)[cite: 24].
    *   `location_type` (`in_person` | `online` | `hybrid`)[cite: 24].
    *   `venue_id` (FK -> `venues.id`, nullable), `venue_override_zh`, `venue_override_en` (Text, nullable)[cite: 24].
    *   `registration_status` (`upcoming` | `open` | `waitlist` | `closed` | `not_required`)[cite: 24].
    *   `cta_type` (`internal_form` | `external_url` | `zoom` | `none`)[cite: 24].
    *   `cta_label_zh`, `cta_label_en` (Text, nullable custom button labels)[cite: 24].
    *   `external_url` (Text, nullable for external portal integration)[cite: 24].
    *   `zoom_config` (JSONB, meeting ID, password, URL, auto-activation window)[cite: 24].
    *   `linked_form_id` (FK -> `forms.id`, nullable), `banner_asset_id` (FK -> `assets.id`, nullable)[cite: 24].
    *   `status` (`draft` | `published` | `unlisted` | `archived`), `is_featured` (Boolean), `created_at`, `updated_at`.

### 4. Multi-Event Articles Junction (`event_articles`)
*   **Role:** N:N associative relation allowing single announcement articles to promote multiple events, or single events to aggregate chronological article updates[cite: 24].
*   **Fields:** `event_id` (UUID FK -> `events.id`), `article_id` (UUID FK -> `content_pages.id`), `sort_order` (Integer), `created_at` (TIMESTAMPTZ)[cite: 24].
*   **Primary Key:** `(event_id, article_id)`[cite: 24].

### 5. Editorial & Static Content (`content_pages`)
*   **Role:** Web-native reading material, blog reflections, bulletin updates, and fixed layout pages[cite: 24].
*   **Fields:** `id` (UUID), `short_id` (Text, 8-char Base62, Unique), `slug` (Text, nullable, Unique), `type` (`page` | `article`), `title_zh`, `title_en`, `body_zh` (Markdown), `body_en`, `cover_asset_id` (FK -> `assets.id`, nullable), `is_in_feed` (Boolean, shows in `/news`), `is_pinned_in_feed` (Boolean, sticky banner), `status` (`draft` | `published` | `archived`), `published_at`, `created_at`, `updated_at`[cite: 24].

### 6. Knowledge Hub Catalog (`resources`)
*   **Role:** Curated public library entries (`/[locale]/resources`) linking across formats[cite: 24].
*   **Fields:** `id` (UUID), `short_id` (Text, 8-char Base62, Unique), `slug` (Text, nullable, Unique), `source_type` (`asset` | `youtube` | `article` | `external_link`), `target_asset_id` (FK -> `assets.id`, nullable), `target_page_id` (FK -> `content_pages.id`, nullable), `external_url` (Text, nullable), `title_zh`, `title_en`, `description_zh`, `description_en`, `author_speaker_zh`, `author_speaker_en`, `cover_asset_id` (FK -> `assets.id`, nullable), `is_featured` (Boolean), `status` (`draft` | `published` | `archived`), `created_at`, `updated_at`[cite: 24].

### 7. Polymorphic Taxonomy (`tags` & `taggables`)
*   **`tags` Table:** `id` (UUID), `short_id` (Text, 8-char Base62, Unique), `slug` (Text, nullable, Unique), `name_zh`, `name_en`, `is_pillar` (Boolean, marks Tier-2 Topic Pillars), `color` (Hex code), `created_at`[cite: 24].
*   **`taggables` Table:** `tag_id` (UUID), `taggable_id` (UUID), `taggable_type` (`event` | `content_page` | `resource` | `asset`), with a composite primary key `(tag_id, taggable_id, taggable_type)`[cite: 24].

### 8. Forms, Submissions & Audit Logs
*   **`forms` Table:** Single `forms` table with dynamic JSONB `schema`, `short_id`, optional `slug`, `event_id`, and `is_followup` flags[cite: 24].
*   **`submissions` Table:** Dynamic JSONB responses, Magic Tokens (`EVENTCODE-XXXX-XXXX`), sequential human-readable numbers (`applicant_seq_num`), test/real isolation[cite: 24].
*   **`team_members` Table:** Admin user profiles, roles array (`super_admin`, `team_manager`, `form_editor`, `submission_viewer`, `content_editor`, `event_coordinator`, `viewer`), auth links[cite: 24].
*   **`audit_logs` Table:** PostgreSQL CDC mutation records via triggers for `forms`, `team_members`, `events`, `venues`, `content_pages`, `resources`, `tags`, and `assets` with neutral `system@internal` actor attribution[cite: 24].

---

## Call-to-Action (CTA) & Operational Design Matrix
All action buttons unify around Daoji Ochre brand tokens defined in `globals.css`[cite: 24]:

*   **State 1: Draft / Opening Soon / Paused**[cite: 24]
    *   Display Text: `即將開放` / *Opening Soon* (or `暫停報名` / *Paused*)[cite: 24]
    *   Condition: Linked form in `draft`, or external link / Zoom marked not yet active[cite: 24].
    *   Style: Outlined Cream (`bg-[#FAF5F0] border border-[#A65D24]/40 text-[#A65D24] hover:bg-[#F2E8DC] cursor-pointer`)[cite: 24]
*   **State 2: Open / Active**[cite: 24]
    *   Display Text: `立即報名` / *Register Now* (or `進入會議` / *Join Zoom Meeting*)[cite: 24]
    *   Condition: Linked form is `open`, or external link active, or Zoom within 30-min window[cite: 24].
    *   Style: Solid Daoji Ochre (`bg-[#A65D24] hover:bg-[#8A4D1E] text-white shadow-sm font-semibold transition-colors cursor-pointer`)[cite: 24]
*   **State 3: Closed / Ended**[cite: 24]
    *   Display Text: `報名截止` / *Registration Closed* (or `活動已結束` / *Event Concluded*)[cite: 24]
    *   Condition: Linked form is `closed`, or date has passed, or manually closed[cite: 24].
    *   Style: Muted Stone (`bg-stone-200 border border-stone-300 text-stone-500 cursor-not-allowed select-none`)[cite: 24]

---

## Recurrence & Calendar Export Architecture
1.  **Recurrence Engine:**[cite: 24]
    *   Events store a declarative `recurrence_rule` JSONB (`frequency`, `days_of_week`, `start_time`, `end_time`, `until_date`)[cite: 24].
    *   `blackout_dates` (`DATE[]`) skips discrete occurrences (e.g. holidays, teacher travel) without mutating the master event record[cite: 24].
2.  **Calendar Integration (`lib/calendar.ts`):**[cite: 24]
    *   **Google Calendar 1-Click Intent:** Encodes localized title, schedule, venue address, and description into a direct web intent URL[cite: 24].
    *   **RFC-5545 `.ics` Generator:** Generates standard iCalendar payload client-side supporting `RRULE`, `EXDATE` (from `blackout_dates`), and `TZID:Asia/Hong_Kong` for Apple Calendar, iOS, and Outlook[cite: 24].

---

## URL Routing & Identifier Architecture (Dual-Lookup)
To eliminate administrative friction for Chinese-first content while supporting vanity URLs[cite: 24]:
1.  **Permanent `short_id` (Immutable):** Every public record receives an auto-generated 8-character Base62 string (e.g., `k8x9m2pz`) via database default[cite: 24].
2.  **Optional `slug` (Mutable Vanity String):** Slugs are completely optional[cite: 24]. Admins can leave them blank or set custom English/ASCII slugs for branding/SEO[cite: 24].
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