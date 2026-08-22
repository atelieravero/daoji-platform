# Daoji Platform - Domain Model & Architecture

## Tech Stack
*   **Framework:** Next.js (App Router)[cite: 12]
*   **Styling:** Tailwind CSS[cite: 12]
*   **Backend/Auth:** Supabase[cite: 12]
*   **Storage:** Dual Cloudflare R2 bucket architecture utilizing `@aws-sdk/client-s3`. Private bucket for secure applicant submissions (`submissions/test/` vs `submissions/real/`). Public bucket with custom CDN URL (`https://cdn.ajahnyiu.org`) for public-facing web assets (banners, images, media pool)[cite: 12].
*   **Upload Pipeline:** Direct browser-to-R2 presigned S3 PUT uploads for both form submissions and Media Pool assets, bypassing serverless function payload limits for files up to 100MB+.
*   **Internationalization:** `next-intl` (Chinese-first priority)[cite: 12]
*   **External Brain:** Coda (Daoji Platform acts as a "dumb pipe")[cite: 12]
*   **Infrastructure:** Vercel Hosting + Cloudflare Reverse Proxy (for Mainland China GFW mitigation)[cite: 12].

## Core Domains & Paths

### Public Shell (`app/[locale]/`)
*   **Events Calendar & Hub:** `app/[locale]/events/page.tsx` & `app/[locale]/events/[id_or_slug]/page.tsx`[cite: 12]
*   **Bulletin / News Feed:** `app/[locale]/news/page.tsx` & `app/[locale]/news/[id_or_slug]/page.tsx`[cite: 12]
*   **Knowledge Resource Hub:** `app/[locale]/resources/page.tsx` & `app/[locale]/resources/[id_or_slug]/page.tsx`[cite: 12]
*   **Static Pages:** `app/[locale]/[id_or_slug]/page.tsx` (About Us, Contact, Facility Rules)[cite: 12]
*   **Form Renderer:** `app/[locale]/form/[id_or_slug]/page.tsx` (Slug / short_id edge cached)[cite: 12]
*   **Tag Hubs:** `app/[locale]/tags/[id_or_slug]/page.tsx` (Cross-domain topic aggregator)[cite: 12]

### Admin Dashboard (`app/admin/`)
*   **Auth Routes (Public):** `app/admin/login/`, `app/admin/forgot-password/`, `app/admin/setup-password/`, `app/admin/auth/`[cite: 12]
*   **Protected Workspace (`app/admin/(dashboard)/`):**
    *   **Events Manager:** `app/admin/(dashboard)/events/` (Operational dates, venue, linked forms, registration status)[cite: 12]
    *   **Editorial Content / Articles:** `app/admin/(dashboard)/articles/` (Markdown/Notion-style editor, feed toggles, event linking)[cite: 12]
    *   **Resource Hub Curator:** `app/admin/(dashboard)/resources/` (Curated library index: assets, YouTube, articles, external links)[cite: 12]
    *   **Media Pool (Assets):** `app/admin/(dashboard)/assets/` (Centralized R2 storage pool & reusable `<MediaPicker/>`)[cite: 12]
    *   **Taxonomy Manager:** `app/admin/(dashboard)/tags/` (Topic Pillars and polymorphic Micro-tags)[cite: 12]
    *   **Forms Builder:** `app/admin/(dashboard)/forms/builder/page.tsx`[cite: 12]
    *   **Submissions View:** `app/admin/(dashboard)/forms/[form_id]/submissions/page.tsx`[cite: 12]
    *   **Team Management:** `app/admin/(dashboard)/team/page.tsx`[cite: 12]
    *   **Audit Logs Explorer:** `app/admin/(dashboard)/logs/page.tsx`[cite: 12]
*   **Secure File Proxy:** `app/admin/file/route.ts`[cite: 12]

## Data Modeling & Schema

### 1. Storage & Media Layer (`assets`)
*   **Role:** Physical Cloudflare R2 binary registry (The Media Pool) served over `https://cdn.ajahnyiu.org`[cite: 12].
*   **Fields:** `id` (UUID), `file_url` (CDN link), `s3_key`, `file_name`, `mime_type`, `file_size_bytes`, `width`, `height`, `alt_text_zh`, `alt_text_en`, `created_by` (UUID), `created_at`[cite: 12].
*   **Usage:** Shared pool for inline article images, event flyers, banner graphics, audio talks, and PDF e-books[cite: 12].

### 2. Operational Domain (`events`)
*   **Role:** First-class operational hub for dates, locations, linked forms, applicant tokens, and registration queues[cite: 12].
*   **Fields:** `id` (UUID), `short_id` (Text, 8-char Base62, Unique), `code` (Text, 1–8 uppercase alphanumeric, Unique, replaces `interimEventCode`), `slug` (Text, nullable, Unique), `title_zh`, `title_en`, `summary_zh`, `summary_en`, `start_date` (TIMESTAMPTZ), `end_date` (TIMESTAMPTZ), `location_type` (`in_person` | `online` | `hybrid`), `venue_details_zh`, `venue_details_en`, `registration_status` (`upcoming` | `open` | `waitlist` | `closed` | `not_required`), `linked_form_id` (FK -> `forms.id`, nullable), `banner_asset_id` (FK -> `assets.id`, nullable), `status` (`draft` | `published` | `archived`), `created_at`, `updated_at`[cite: 12].

### 3. Editorial & Static Content (`content_pages`)
*   **Role:** Web-native reading material, blog reflections, bulletin updates, and fixed layout pages[cite: 12].
*   **Fields:** `id` (UUID), `short_id` (Text, 8-char Base62, Unique), `slug` (Text, nullable, Unique), `type` (`page` | `article`), `title_zh`, `title_en`, `body_zh` (Markdown), `body_en`, `cover_asset_id` (FK -> `assets.id`, nullable), `event_id` (FK -> `events.id`, nullable - 1:N event updates), `is_in_feed` (Boolean, shows in `/news`), `is_pinned_in_feed` (Boolean, sticky banner), `status` (`draft` | `published` | `archived`), `published_at`, `created_at`, `updated_at`[cite: 12].

### 4. Knowledge Hub Catalog (`resources`)
*   **Role:** Curated public library entries (`/[locale]/resources`) linking across formats[cite: 12].
*   **Fields:** `id` (UUID), `short_id` (Text, 8-char Base62, Unique), `slug` (Text, nullable, Unique), `source_type` (`asset` | `youtube` | `article` | `external_link`), `target_asset_id` (FK -> `assets.id`, nullable), `target_page_id` (FK -> `content_pages.id`, nullable), `external_url` (Text, nullable), `title_zh`, `title_en`, `description_zh`, `description_en`, `author_speaker_zh`, `author_speaker_en`, `cover_asset_id` (FK -> `assets.id`, nullable), `is_featured` (Boolean), `status` (`draft` | `published` | `archived`), `created_at`, `updated_at`[cite: 12].

### 5. Polymorphic Taxonomy (`tags` & `taggables`)
*   **`tags` Table:** `id` (UUID), `short_id` (Text, 8-char Base62, Unique), `slug` (Text, nullable, Unique), `name_zh`, `name_en`, `is_pillar` (Boolean, marks Tier-2 Topic Pillars), `color` (Hex code), `created_at`[cite: 12].
*   **`taggables` Table:** `tag_id` (UUID), `taggable_id` (UUID), `taggable_type` (`event` | `content_page` | `resource` | `asset`), with a composite primary key `(tag_id, taggable_id, taggable_type)`[cite: 12].

### 6. Forms, Submissions & Audit Logs (Existing)
*   **`forms` Table:** Single `forms` table with dynamic JSONB `schema`, `short_id`, optional `slug`, `event_id`, and `is_followup` flags[cite: 12].
*   **`submissions` Table:** Dynamic JSONB responses, Magic Tokens (`EVENTCODE-XXXX-XXXX`), sequential human-readable numbers (`applicant_seq_num`), test/real isolation[cite: 12].
*   **`team_members` Table:** Admin user profiles, roles array (`super_admin`, `team_manager`, `form_editor`, `submission_viewer`, `content_editor`, `event_coordinator`, `viewer`), auth links[cite: 12].
*   **`audit_logs` Table:** PostgreSQL CDC mutation records via triggers for `forms`, `team_members`, `events`, `content_pages`, `resources`, `tags`, and `assets` with neutral `system@internal` actor attribution[cite: 12, 15].

## URL Routing & Identifier Architecture (Dual-Lookup)
To eliminate administrative friction for Chinese-first content while supporting vanity URLs[cite: 12]:
1.  **Permanent `short_id` (Immutable):** Every public record receives an auto-generated 8-character Base62 string (e.g., `k8x9m2pz`) via database default[cite: 12].
2.  **Optional `slug` (Mutable Vanity String):** Slugs are completely optional. Admins can leave them blank or set custom English/ASCII slugs for branding/SEO[cite: 12].
3.  **Unified Resolution:** Route handlers execute a single indexed lookup[cite: 12]:
    ```sql
    WHERE (short_id = $1 OR slug = $1) AND status = 'published'
    ```
4.  **SEO & Permanence:** Changing a slug never breaks existing inbound links because the permanent `short_id` remains valid indefinitely[cite: 12]. When accessed via `short_id` for an entity with a vanity slug, the canonical URL points to the slug[cite: 12].

## Information Architecture & Taxonomy Model
*   **Tier 1: Top-Level Channels (Fixed Navigation):**[cite: 12]
    1.  `Events` (`/events`) - Operational schedule, venue, forms, registration[cite: 12].
    2.  `Resources` (`/resources`) - Curated knowledge library (Audio, PDFs, Guides, Videos)[cite: 12].
    3.  `Bulletin` (`/news`) - Chronological stream of announcements, articles, and event updates[cite: 12].
    4.  `About` (`/[slug]`) - Static informational pages[cite: 12].
*   **Tier 2: Topic Pillars (Curated Filter Facets):**[cite: 12]
    *   Meditation Practice (禪修), Dhamma Talks & Suttas (經教佛法), Chanting & Liturgy (課誦儀軌), Monastic Life & Vinaya (僧團戒律), Community News (最新動態)[cite: 12].
*   **Tier 3: Polymorphic Micro-Tags (Relational):**[cite: 12]
    *   Free-form tags (`#Anapanasati`, `#Retreat2026`, `#AjahnChah`) connecting related Events, Articles, and Resources on dedicated tag aggregation pages[cite: 12].

## Content & Operational Lifecycle Rules
1.  **Event ⟷ Post Relationship (1 : 0..N):**[cite: 12]
    *   Events exist independently as calendar/operational records without requiring articles[cite: 12].
    *   Articles can optionally link to an `event_id` to provide updates, registration openings, or post-event recaps[cite: 12].
    *   Event pages automatically aggregate and render all attached posts in a chronological timeline[cite: 12].
2.  **Two-Way Article ⟷ Resource Workflow:**[cite: 12]
    *   *From Article Editor:* Checking `[x] Publish to Resource Hub` automatically provisions/updates a corresponding `resources` record (`source_type: 'article'`)[cite: 12].
    *   *From Resource Curator:* Selecting `source_type: 'article'` enables search and direct linking to existing articles[cite: 12].
3.  **Media Pool Integration:**[cite: 12]
    *   Any file uploaded across editors (Article, Event, Resource) is persisted to `assets`[cite: 12].
    *   Reusable via the slide-over `<MediaPicker/>` component[cite: 12].

## Architectural, Security, i18n & SEO Rules
1.  **Action-Based Access Control (ABAC):** Centrally governed by `lib/permissions.ts`. All mutations guarded by `requirePermission('<domain>:<action>')`[cite: 12].
    *   `events:*` (`view`, `create`, `edit`, `delete`, `publish`)[cite: 12]
    *   `articles:*` (`view`, `create`, `edit`, `delete`, `publish`)[cite: 12]
    *   `resources:*` (`view`, `create`, `edit`, `delete`, `publish`)[cite: 12]
    *   `assets:*` (`view`, `upload`, `delete`)[cite: 12]
    *   `tags:*` (`view`, `create`, `edit`, `delete`)[cite: 12]
2.  **Strict File Privacy & S3 Partitioning:**[cite: 12]
    *   Private submissions: `submissions/test/` vs `submissions/real/`[cite: 12].
    *   Public media pool: Public R2 CDN bucket with direct access URLs (`https://cdn.ajahnyiu.org`)[cite: 12].
3.  **Payload Buffering & Streaming:** Configured with 100MB stream limits in `next.config.mjs` (`serverActions.bodySizeLimit: '100mb'`, `proxyClientMaxBodySize: '100mb'`).
4.  **Chinese-First Priority & i18n Chain:** Traditional Chinese is primary (`/zh`). Fallback chain: `Current Language` ➔ `Chinese Primary (zh)` ➔ `Default/Key`[cite: 12].
5.  **Polymorphic SEO Factory:** Dynamic metadata generated via `constructMetadata` in `lib/seo.ts` across Events, Resources, Articles, and Static Pages[cite: 12].
6.  **Edge Caching (GFW Mitigation):** All public-facing routes (`/events/[id_or_slug]`, `/news/[id_or_slug]`, `/resources/[id_or_slug]`, `/[id_or_slug]`) use dynamic route segments for Next.js ISR/SSG and CDN edge caching[cite: 12].