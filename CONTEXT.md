# Daoji Platform - Domain Model & Architecture

## Tech Stack
*   **Framework:** Next.js (App Router)
*   **Styling:** Tailwind CSS
*   **Backend/Auth:** Supabase
*   **Storage:** Dual Cloudflare R2 bucket architecture utilizing `@aws-sdk/client-s3`. Private bucket for secure applicant submissions (`submissions/test/` vs `submissions/real/`). Public bucket with a CDN URL for public-facing web assets (banners, images, media pool).
*   **Internationalization:** `next-intl` (Chinese-first priority)
*   **External Brain:** Coda (Daoji Platform acts as a "dumb pipe")
*   **Infrastructure:** Vercel Hosting + Cloudflare Reverse Proxy (for Mainland China GFW mitigation).

## Core Domains & Paths

### Public Shell (`app/[locale]/`)
*   **Events Calendar & Hub:** `app/[locale]/events/page.tsx` & `app/[locale]/events/[id_or_slug]/page.tsx`
*   **Bulletin / News Feed:** `app/[locale]/news/page.tsx` & `app/[locale]/news/[id_or_slug]/page.tsx`
*   **Knowledge Resource Hub:** `app/[locale]/resources/page.tsx` & `app/[locale]/resources/[id_or_slug]/page.tsx`
*   **Static Pages:** `app/[locale]/[id_or_slug]/page.tsx` (About Us, Contact, Facility Rules)
*   **Form Renderer:** `app/[locale]/form/[id_or_slug]/page.tsx` (Slug / short_id edge cached)
*   **Tag Hubs:** `app/[locale]/tags/[id_or_slug]/page.tsx` (Cross-domain topic aggregator)

### Admin Dashboard (`app/admin/`)
*   **Events Manager:** `app/admin/events/` (Operational dates, venue, linked forms, registration status)
*   **Editorial Content / Articles:** `app/admin/articles/` (Markdown/Notion-style editor, feed toggles, event linking)
*   **Resource Hub Curator:** `app/admin/resources/` (Curated library index: assets, YouTube, articles, external links)
*   **Media Pool (Assets):** `app/admin/assets/` (Centralized R2 storage pool & reusable `<MediaPicker/>`)
*   **Taxonomy Manager:** `app/admin/tags/` (Topic Pillars and polymorphic Micro-tags)
*   **Forms Builder:** `app/admin/forms/builder/page.tsx`
*   **Submissions View:** `app/admin/forms/[form_id]/submissions/page.tsx`
*   **Team Management:** `app/admin/team/page.tsx`
*   **Audit Logs Explorer:** `app/admin/logs/page.tsx`
*   **Secure File Proxy:** `app/admin/file/route.ts`

## Data Modeling & Schema

### 1. Storage & Media Layer (`assets`)
*   **Role:** Physical Cloudflare R2 binary registry (The Media Pool).
*   **Fields:** `id` (UUID), `file_url` (CDN link), `s3_key`, `file_name`, `mime_type`, `file_size_bytes`, `width`, `height`, `alt_text_zh`, `alt_text_en`, `created_by` (UUID), `created_at`.
*   **Usage:** Shared pool for inline article images, event flyers, banner graphics, audio talks, and PDF e-books.

### 2. Operational Domain (`events`)
*   **Role:** First-class operational hub for dates, locations, linked forms, applicant tokens, and registration queues.
*   **Fields:** `id` (UUID), `short_id` (Text, 8-char Base62, Unique), `slug` (Text, nullable, Unique), `title_zh`, `title_en`, `summary_zh`, `summary_en`, `start_date` (TIMESTAMPTZ), `end_date` (TIMESTAMPTZ), `location_type` (`in_person` | `online` | `hybrid`), `venue_details_zh`, `venue_details_en`, `registration_status` (`upcoming` | `open` | `waitlist` | `closed` | `not_required`), `linked_form_id` (FK -> `forms.id`, nullable), `banner_asset_id` (FK -> `assets.id`, nullable), `status` (`draft` | `published` | `archived`), `created_at`, `updated_at`.

### 3. Editorial & Static Content (`content_pages`)
*   **Role:** Web-native reading material, blog reflections, bulletin updates, and fixed layout pages.
*   **Fields:** `id` (UUID), `short_id` (Text, 8-char Base62, Unique), `slug` (Text, nullable, Unique), `type` (`page` | `article`), `title_zh`, `title_en`, `body_zh` (Markdown), `body_en`, `cover_asset_id` (FK -> `assets.id`, nullable), `event_id` (FK -> `events.id`, nullable - 1:N event updates), `is_in_feed` (Boolean, shows in `/news`), `is_pinned_in_feed` (Boolean, sticky banner), `status` (`draft` | `published` | `archived`), `published_at`, `created_at`, `updated_at`.

### 4. Knowledge Hub Catalog (`resources`)
*   **Role:** Curated public library entries (`/[locale]/resources`) linking across formats.
*   **Fields:** `id` (UUID), `short_id` (Text, 8-char Base62, Unique), `slug` (Text, nullable, Unique), `source_type` (`asset` | `youtube` | `article` | `external_link`), `target_asset_id` (FK -> `assets.id`, nullable), `target_page_id` (FK -> `content_pages.id`, nullable), `external_url` (Text, nullable), `title_zh`, `title_en`, `description_zh`, `description_en`, `author_speaker_zh`, `author_speaker_en`, `cover_asset_id` (FK -> `assets.id`, nullable), `is_featured` (Boolean), `status` (`draft` | `published` | `archived`), `created_at`, `updated_at`.

### 5. Polymorphic Taxonomy (`tags` & `taggables`)
*   **`tags` Table:** `id` (UUID), `short_id` (Text, 8-char Base62, Unique), `slug` (Text, nullable, Unique), `name_zh`, `name_en`, `is_pillar` (Boolean, marks Tier-2 Topic Pillars), `color` (Hex code), `created_at`.
*   **`taggables` Table:** `tag_id` (UUID), `taggable_id` (UUID), `taggable_type` (`event` | `content_page` | `resource` | `asset`), with a composite primary key `(tag_id, taggable_id, taggable_type)`.

### 6. Forms, Submissions & Audit Logs (Existing)
*   **`forms` Table:** Single `forms` table with dynamic JSONB `schema`, `short_id`, optional `slug`, `event_id`, and `is_followup` flags.
*   **`submissions` Table:** Dynamic JSONB responses, Magic Tokens (`EVENTCODE-XXXX-XXXX`), sequential human-readable numbers (`applicant_seq_num`), test/real isolation.
*   **`team_members` Table:** Admin user profiles, roles array, auth links.
*   **`audit_logs` Table:** PostgreSQL CDC mutation records via triggers for `forms`, `team_members`, `events`, `content_pages`, `resources`, `tags`, and `assets`.

## URL Routing & Identifier Architecture (Dual-Lookup)
To eliminate administrative friction for Chinese-first content while supporting vanity URLs:
1.  **Permanent `short_id` (Immutable):** Every public record receives an auto-generated 8-character Base62 string (e.g., `k8x9m2pz`) via database default.
2.  **Optional `slug` (Mutable Vanity String):** Slugs are completely optional. Admins can leave them blank or set custom English/ASCII slugs for branding/SEO.
3.  **Unified Resolution:** Route handlers execute a single indexed lookup:
    ```sql
    WHERE (short_id = $1 OR slug = $1) AND status = 'published'
    ```
4.  **SEO & Permanence:** Changing a slug never breaks existing inbound links because the permanent `short_id` remains valid indefinitely. When accessed via `short_id` for an entity with a vanity slug, the canonical URL points to the slug.

## Information Architecture & Taxonomy Model
*   **Tier 1: Top-Level Channels (Fixed Navigation):**
    1.  `Events` (`/events`) - Operational schedule, venue, forms, registration.
    2.  `Resources` (`/resources`) - Curated knowledge library (Audio, PDFs, Guides, Videos).
    3.  `Bulletin` (`/news`) - Chronological stream of announcements, articles, and event updates.
    4.  `About` (`/[slug]`) - Static informational pages.
*   **Tier 2: Topic Pillars (Curated Filter Facets):**
    *   Meditation Practice (禪修), Dhamma Talks & Suttas (經教佛法), Chanting & Liturgy (課誦儀軌), Monastic Life & Vinaya (僧團戒律), Community News (最新動態).
*   **Tier 3: Polymorphic Micro-Tags (Relational):**
    *   Free-form tags (`#Anapanasati`, `#Retreat2026`, `#AjahnChah`) connecting related Events, Articles, and Resources on dedicated tag aggregation pages.

## Content & Operational Lifecycle Rules
1.  **Event ⟷ Post Relationship (1 : 0..N):**
    *   Events exist independently as calendar/operational records without requiring articles.
    *   Articles can optionally link to an `event_id` to provide updates, registration openings, or post-event recaps.
    *   Event pages automatically aggregate and render all attached posts in a chronological timeline.
2.  **Two-Way Article ⟷ Resource Workflow:**
    *   *From Article Editor:* Checking `[x] Publish to Resource Hub` automatically provisions/updates a corresponding `resources` record (`source_type: 'article'`).
    *   *From Resource Curator:* Selecting `source_type: 'article'` enables search and direct linking to existing articles.
3.  **Media Pool Integration:**
    *   Any file uploaded across editors (Article, Event, Resource) is persisted to `assets`.
    *   Reusable via the slide-over `<MediaPicker/>` component.

## Architectural, Security, i18n & SEO Rules
1.  **Action-Based Access Control (ABAC):** Centrally governed by `lib/permissions.ts`. All mutations guarded by `requirePermission('<domain>:<action>')`.
    *   `events:*` (`create`, `read`, `update`, `delete`, `publish`)
    *   `articles:*` (`create`, `read`, `update`, `delete`, `publish`)
    *   `resources:*` (`create`, `read`, `update`, `delete`, `publish`)
    *   `assets:*` (`upload`, `read`, `delete`)
    *   `tags:*` (`manage`)
2.  **Strict File Privacy & S3 Partitioning:**
    *   Private submissions: `submissions/test/` vs `submissions/real/`.
    *   Public media pool: Public R2 CDN bucket with direct access URLs.
3.  **Chinese-First Priority & i18n Chain:** Traditional Chinese is primary (`/zh`). Fallback chain: `Current Language` ➔ `Chinese Primary (zh)` ➔ `Default/Key`.
4.  **Polymorphic SEO Factory:** Dynamic metadata generated via `constructMetadata` in `lib/seo.ts` across Events, Resources, Articles, and Static Pages.
5.  **Edge Caching (GFW Mitigation):** All public-facing routes (`/events/[id_or_slug]`, `/news/[id_or_slug]`, `/resources/[id_or_slug]`, `/[id_or_slug]`) use dynamic route segments for Next.js ISR/SSG and CDN edge caching.