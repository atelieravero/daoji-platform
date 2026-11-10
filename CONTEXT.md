# Daoji Platform - Domain Model & Architecture

## System Overview & Core Philosophy
Daoji Platform is the public-facing operational portal and administrative management system for Maggapaṭipadā Meditation Centre (道跡禪院). It serves as a resilient, bilingual bridge connecting retreat applicants and Dhamma students with monastic operations. The platform operates as a high-performance "dumb pipe"—providing schema-driven dynamic application forms, recurring event calendars, editorial posts and static pages, multi-platform livestream gateways, and media archives, while deferring complex organizational fulfillment to external databases (Coda).

---

## Architectural Quirks & Essential Tweaks (Read First)
These ten architectural conventions define how this platform solves specific operational, networking, and UX challenges:

1. **Zero-Flash Standalone Shell (`<StandaloneNotifier/>` & `<StandaloneLanguageSwitcher/>`):**
   * Standalone pages (public forms, standalone events, and standalone posts/pages) suppress the top navbar, header, and footer without hydration flashes.
   * **Mechanism:** Rather than waiting for a client-side `useEffect` to unmount shell components, `StandaloneNotifier` synchronously injects an inline `<style>header, footer, nav { display: none !important; }</style>` tag into the initial server-rendered HTML payload.
   * **Strict DB vs. Query Enforcement:** When `is_standalone = true` on an Event, Post, or Static Page, standalone mode is enforced directly on the server (`forceStandaloneParam={false}`) so visitors cannot exit standalone mode by editing the URL. On public forms, `?standalone=true` is also supported and preserved across `/zh` $\leftrightarrow$ `/en` switches.

2. **Uniform `1.91:1` Master Asset Retention & Derivative Crop Partitioning:**
   * All cover banners across Events (`banner_asset_id` / `banner_original_asset_id`), Content Pages & Posts (`cover_asset_id` / `cover_original_asset_id`), and Forms (`bannerImageUrl` / `bannerOriginalImageUrl`) standardize on a **`1.91:1` (`1200×630`)** aspect ratio via `<CoverBannerPicker/>` and `<ImageCropModal/>`—matching OpenGraph social cards and compact list/grid thumbnails, and rendering full-width without artificial `max-height` letterboxing.
   * **Partitioning:** Cropped derivatives are saved under `derivatives/crops/YYYY/MM/...` with `is_system = true`. The user-facing Media Pool query strictly filters out `is_system = true` to prevent derivative crops from cluttering the asset library.

3. **Event-Code Scoped Submissions, Numeric Tokens & Identity Challenge Recovery:**
   * Applicant sequence numbers (`applicant_seq_num`) and magic return tokens are scoped globally to `event_code` (e.g., `STAY`), **not** individual form IDs or event UUIDs.
   * **8-Digit Numeric Tokens:** Tokens use pure numeric digits formatted as `[EVENT_CODE]-[DDDD-DDDD]` (e.g., `OCT26-3829-1940`). Both the follow-up pre-gate and inline `applicant_token` questions render `<TokenDigitsInput/>`, which displays the event code as a fixed read-only badge and prompts the applicant for only the 8 numeric digits (`inputMode="numeric"`).
   * **Identity Anchors (Application Forms Only):** On initial application forms (`is_followup = false`), form builders can designate one `text` question as `Identity Anchor: Full Name` (`is_identity_name`) and one `mobile` question as `Identity Anchor: Mobile Number` (`is_identity_phone`). Question type dropdowns are locked while designated as anchors. Saving the form recalculates anchor columns (`applicant_name`, `applicant_phone_suffix`) across existing submissions.
   * **Self-Service Challenge Recovery:** Applicants who misplace their token can challenge either the follow-up pre-gate or an inline `applicant_token` question via `<TokenRecoveryModal/>` using their Name and Mobile Number. The server canonicalizes the name (all spaces/punctuation stripped, lowercased) and phone (suffix-8 digits) and verifies that **exactly one non-archived match exists** with non-empty anchor values. Real mode matches against real submissions; test mode matches against test submissions.

4. **Dumb-Pipe-Safe Form Success Interpolation (`{{dataKey}}`):**
   * `submitPublicForm` chains `.select('applicant_token, response').single()` onto the `submissions` `INSERT` mutation, returning the committed `response` JSONB to the submitting browser session without opening any public `SELECT` policy on `submissions`.
   * Admins can embed `{{dataKey}}` placeholders in both the **Success Title** and **Success Message** alongside `{{TOKEN_BOX}}`.
   * `interpolateSuccessText` (`lib/form-engine-utils.ts`) formats answers inline by field type (`text`/`textarea`/`email`/`mobile`/`applicant_token` as single-line text, `number` as raw number string, `select`/`radio`/`checkbox` as localized option labels, `date` as `yyyy-mm-dd`, and `time` as `hh:mm`). Valid keys left blank output `""`; unknown or unsupported keys (`file`, `info`) output `{{dataKey}}` literally. `<SuccessScreenPreview/>` renders live Indigo preview badges in the Form Builder.

5. **Dynamic Registration State Inheritance & Crawler-Safe Public Resolution:**
   * When an event is set to `registration_mode: 'internal_form'`, the public action button's state (`upcoming`, `open`, `closed`) and destination URL are not stored statically on the event.
   * **Resolution:** `lib/events.ts` and `lib/content-pages.ts` use `getSupabaseAdmin()` (mirroring `getPublicForm` in `app/[locale]/form/[slug]/actions.ts`) to resolve public events, posts, static pages, cover assets, venues, organizers, and linked forms on the server without cookie or RLS discrepancies for anonymous visitors and social link preview crawlers (WhatsApp, WeChat, iMessage, Telegram).
   * **Explicit Status Filtering:** Public resolvers explicitly filter `.in('status', ['published', 'unlisted'])` on direct permalink lookups and `.eq('status', 'published')` on joined `event_articles` items so signed-in admins and anonymous visitors always see identical public data.

6. **Recurring Livestream Engine with Calendar Projection:**
   * Supports Zoom, YouTube, and Facebook Live simultaneously.
   * **Auto Mode:** An algorithmic projection engine calculates future recurring occurrences from RFC-5545 rules (`days_of_week`, `until_date`), filters out `blackout_dates`, and activates the live button strictly within `[session_start - open_minutes_before, session_end]`. Outside this window, it displays a localized countdown pill (`直播於 9月10日 19:15 開放` / *Opens at ...*).
   * **Manual Mode:** Broadcast state is driven by an explicit boolean `is_livestream_live`. When offline, the livestream entry remains completely hidden to prevent visual clutter.

7. **Strict Bilingual Fallback Chain & Auto-Excerpt SEO Engine:**
   * Traditional Chinese (`/zh`) is the primary system locale. All localized fields resolve via `resolveBilingualText` (`current lang > other lang > nil`).
   * **Zero-Friction Summaries (`resolveBilingualExcerpt` in `lib/seo.ts`):** Custom summaries (`summary_zh`, `summary_en`) are collapsed by default in `<BilingualCanvas/>`. When left blank, `resolveBilingualExcerpt` automatically strips Markdown formatting from the opening ~150 characters of `body_zh` / `body_en` (`subtitleZh` / `subtitleEn` on forms) for OpenGraph descriptions and list previews.

8. **Immutable Short IDs, Mutable Vanity Slugs & Reserved Slug Guard (`lib/slug.ts`):**
   * Every public entity generates an immutable 8-character Base62 `short_id` (`nanoid(8)`).
   * Slugs are optional, mutable, sanitized to RFC 3986 safe characters (`a-z0-9\-_.~+%`), and validated on both client and server against `RESERVED_SLUGS` (`admin`, `api`, `events`, `event`, `post`, `news`, `resources`, `form`, `apply`, `tags`, etc.) so top-level static pages (`/[locale]/[id_or_slug]`) never collide with system routes.
   * Route resolvers query `WHERE short_id = $1 OR slug = $1` using double-quoted PostgREST filter values (`short_id.eq."${decoded}",slug.eq."${decoded}"`).

9. **Relative Markdown Heading Hierarchy & Hyperlink Visual Separation (`<MarkdownRenderer/>`):**
   * `<MarkdownRenderer/>` shifts Markdown `#`–`######` headings relative to a contextual `baseHeadingLevel` prop ($\text{effectiveLevel} = \min(6, \text{baseHeadingLevel} + \text{mdLevel} - 1)$): `baseHeadingLevel={2}` on Event/Post/Page bodies, `3` on Form subtitles and success messages, `4` on Form `info` blocks, and `5` on Form question hints.
   * **Heading vs. Link Distinction:** Top-level Markdown section headings (`h2`) feature a `3px` left accent bar in `--color-primary` (`#8E442A`) with charcoal ink (`#26241F`), `h3` uses deep sienna-umber (`#5C2A18`), and inline hyperlinks use complementary **Peacock Teal (`#0D6E6E`)** with a thick `2.5px` dotted jade underline (`#22A699`) that turns solid with a soft mint highlight (`#E0F5F2`) on hover.

10. **Silent Denial RBAC & Immutable Forms:**
    * Permissions are strictly enforced server-side via `lib/permissions.ts`. Unauthorized UI controls (such as delete buttons or status selectors) are silently omitted or disabled in the DOM rather than triggering disruptive error redirects.
    * Submission status mutations are separated into `submissions:process` (toggling `is_processed` and bulk export processing) and `submissions:archive` (toggling `is_archived` to exclude duplicate/invalid rows from token recovery).
    * Once a form moves to `open` or `closed`, its schema is locked. Backend Server Actions reject mutations until the form is explicitly reverted to `draft`.

---

## Tech Stack & Infrastructure
* **Framework:** Next.js (App Router, Server Actions, Route Groups).
* **Styling:** Tailwind CSS (v4 `@theme inline` with Daoji Terracotta `#8E442A` brand palette, Peacock Teal `#0D6E6E` hyperlinks, and warm rice-paper surfaces).
* **Database & Auth:** Supabase (PostgreSQL with idempotent RLS policies, explicit `anon`/`authenticated` table grants, `pgcrypto`, and CDC audit triggers).
* **Storage:** Dual Cloudflare R2 bucket architecture via `@aws-sdk/client-s3`:
  * *Private Bucket:* Encrypted applicant file uploads partitioned into `submissions/test/` vs `submissions/real/`.
  * *Public CDN Bucket:* Custom domain `https://cdn.ajahnyiu.org` for media pool assets and cropped banners.
* **Upload Pipeline:** Direct browser-to-R2 presigned S3 PUT uploads bypassing serverless payload limits for files up to 100MB+.
* **Internationalization:** `next-intl` (Default `/zh`, English `/en`). All public strings centralized in `messages/` under `"EventDetail"`, `"PostDetail"`, and `"ApplyForm"`.
* **Infrastructure:** Vercel Hosting with Cloudflare Reverse Proxy for Mainland China network mitigation.

---

## Workspace Design System

### Palette Partitioning & Typography (`app/globals.css`)
* **Admin Dashboard (`/admin`):** Standardized on the **Indigo** system palette (`bg-indigo-600`, `text-indigo-600`, `bg-indigo-50`).
* **Public Portal (`/[locale]`):** Standardized on the **Daoji Terracotta & Warm Monastic Rice-Paper** palette (with OS dark-mode overrides disabled so the portal always renders on its intended warm light surfaces):
  * *Brand Primary:* `--color-primary: #8E442A` (from the official 道迹禅院 logo swatch `C=41 M=76 Y=100 K=13`), `--color-primary-hover: #743620`, `--color-primary-active: #5C2A18`, `--color-primary-soft: #F8EFEA`, `--color-primary-border: #E2C6B9`, `--color-accent-ochre: #B88644`.
  * *Distinct Hyperlinks (Peacock Teal & Jade):* `--color-link: #0D6E6E`, `--color-link-hover: #084C4C`, `--color-link-underline: #22A699`, `--color-link-highlight: #E0F5F2`.
  * *Warm Surfaces:* `--color-surface-base: #FCFAF7`, `--color-surface-card: #FFFFFF`, `--color-surface-cream: #F5EFE6`, `--color-surface-dark: #E6DDD0`.
  * *Ink Hierarchy:* `--color-ink-primary: #26241F` (titles & labels), `--color-ink-body: #3D3A33` (`16px` / `1.8` line-height long-form prose), `--color-ink-muted: #787166` (captions, dates, hints).
  * *Semantic Status Tokens:* `--color-status-success: #2D6A4F`, `--color-status-warning: #A16207`, `--color-status-danger: #B91C1C`.
* **Test Mode:** High-contrast Navy palette (`--color-surface-test: #1E1B4B`) to prevent accidental production testing.
* **Bilingual Font Stack (`--font-sans`):** `var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "PingFang TC", "Noto Sans TC", "HarmonyOS Sans TC", "Microsoft JhengHei", "Heiti TC", sans-serif`.

### Component Primitives
* **Admin Navigation:** Collapsible `<AdminSidebar/>` with persistent `localStorage` state, smooth transitions, and compact icon-only mode.
* **Admin Tables:** `<AdminPageHeader/>`, `<AdminTableToolbar/>` (debounced search + status tabs), `<AdminTableCard/>`, `<StatusBadgeSelect/>`, `<ShareQrModal/>` (high-res QR PNG generation).
* **Editor Architecture:** Two-pane `<EditorLayout/>` with fixed 460px inspector, `<BilingualCanvas/>` (with collapsible optional summaries), `<CoverBannerPicker/>` (`1.91:1` canvas cropper with master retention), and `<UrlSlugInspector/>`.
* **Relational Pickers:** Extracted modals (`<FormPickerModal/>`, `<EventPickerModal/>` supporting both single-select and multi-select, `<VenueModal/>`, `<OrganizerModal/>`).
* **Public Form Engine (`components/public/form/` & `lib/form-engine-utils.ts`):** Modularized into `<FormPreGateScreen/>`, `<FormSuccessScreen/>` (with `{{dataKey}}` interpolation), `<FormFieldCard/>`, `<TokenRecoveryModal/>`, and shared input primitives (`<MobilePhoneInput/>`, `<TokenDigitsInput/>`).

---

## Core Domains & Schema Architecture

```
                 ┌────────────────────────────────┐
                 │          organizers            │
                 └──────────────┬─────────────────┘
                                │ 1:N
┌──────────────┐ 1:N            ▼             N:M            ┌──────────────────┐
│    venues    │◄─────────── events ─────────►│ event_articles│◄──── content_pages
└──────────────┘                │                            └──────────────────┘
                                │ 1:N
                                ▼
                             forms
                                │ 1:N
                                ▼
                           submissions
```

### 1. `events` (Operational Event Domain)
* **Identity:** `id` (UUID PK), `short_id` (Base62 unique), `slug` (RFC 3986 unique, nullable).
* **Bilingual Content:** `title_zh`, `title_en`, `summary_zh`, `summary_en`, `body_zh`, `body_en`.
* **Instruction Languages:** `languages` (`TEXT[]`, default `'{cantonese}'` — Cantonese, Mandarin, English, Thai).
* **Schedule & Recurrence:** `start_date`, `end_date`, `timezone` (default `'Asia/Hong_Kong'`), `is_all_day` (boolean), `recurrence_rule` (JSONB: frequency, interval, days_of_week, until_date), `blackout_dates` (`DATE[]`).
* **Location Channels:**
  * *In-Person:* `is_in_person` (boolean), `venue_id` (FK $\rightarrow$ `venues.id`), `venue_override_zh`, `venue_override_en`.
  * *Livestream:* `is_livestream` (boolean), `is_livestream_live` (boolean, manual override), `livestream_config` (JSONB: `mode` ['auto' | 'manual'], zoom, youtube, facebook URLs, meeting IDs, passcodes, open minutes).
* **Registration Gate:** `registration_mode` (`internal_form` | `external_url` | `not_required`), `code` (1–8 uppercase alphanumeric, required for forms), `linked_form_id` (FK $\rightarrow$ `forms.id`, indexed via `idx_events_linked_form`), `external_url`, `registration_status`, `cta_label_zh`, `cta_label_en`.
* **Media & Shell:** `banner_asset_id` (cropped `1.91:1`), `banner_original_asset_id` (master), `status` (`draft` | `published` | `unlisted` | `archived`), `is_featured`, `is_standalone`.

### 2. `forms` & `submissions` (Dynamic Form Engine)
* **`forms`:** `id` (UUID PK), `slug`, `event_id` (UUID FK $\rightarrow$ `events.id` ON DELETE SET NULL), `title`, `is_followup` (token-gated), `status` (`draft` | `open` | `closed`), `schema` (JSONB: fields, validation, conditions, token-box & `{{dataKey}}` positioning, anchor designations `is_identity_name` and `is_identity_phone`).
* **`submissions`:** 
  * `id` (UUID PK), `form_id` (FK), `event_id`, `event_code`.
  * `locale`: Nullable `TEXT` recording the exact route locale code (`zh`, `en`, etc.) used when submitting the form, with no default assumption.
  * `applicant_token`: 8-digit numeric token (`[CODE]-DDDD-DDDD`).
  * `applicant_seq_num`: Sequential counter scoped to `event_code`.
  * `applicant_name`: Canonicalized full name (all whitespace/punctuation stripped, lowercase).
  * `applicant_phone_suffix`: Suffix-8 mobile digits.
  * `response`: JSONB raw answers (returned to the submitting session on `INSERT` for `{{dataKey}}` success interpolation).
  * `is_archived`: Boolean flag to de-index duplicate or invalid records from challenge recovery.
  * `is_test`, `is_processed`.

### 3. `content_pages` & `event_articles` (Editorial Posts & Static Pages)
* **`content_pages`:** `id` (UUID PK), `short_id` (Base62 unique), `slug` (RFC 3986 unique, nullable, guarded by `RESERVED_SLUGS`), `type` (`post` | `page`, default `'post'`), `title_zh`, `title_en`, `summary_zh`, `summary_en`, `body_zh`, `body_en`, `cover_asset_id` (cropped `1.91:1`), `cover_original_asset_id` (master), `is_pinned_in_feed` (boolean), `is_standalone` (boolean), `status` (`draft` | `published` | `unlisted` | `archived`), `published_at`.
* **`event_articles`:** Single source of truth N:M junction table (`event_id`, `article_id`, `sort_order`) linking posts to one or more operational events.

### 4. `assets` (Media Pool) & `tags` / `taggables` (Taxonomy)
* **`assets`:** `id`, `file_url`, `s3_key`, `file_name`, `mime_type`, `file_size_bytes`, `width`, `height`, `alt_text_zh`, `alt_text_en`, `is_system` (boolean: hides derivative crops from general picker), `created_by`.
* **`tags` & `taggables`:** `tags` (`id`, `short_id`, `slug`, `name_zh`, `name_en`, `is_pillar`, `color`) joined polymorphically via `taggables` (`tag_id`, `taggable_id`, `taggable_type` IN `'event' | 'content_page' | 'resource' | 'asset'`).

### 5. `venues` & `organizers`
* **`venues`:** `id`, `name_zh`, `name_en`, `address_zh`, `address_en`, `google_maps_url`, `amap_url` (Mainland China routing), `transport_guide_zh`, `transport_guide_en`, `timezone`.
* **`organizers`:** `id`, `name_en` (mandatory), `name_zh`, `url`, `description_zh`, `description_en`.

### 6. `audit_logs` (CDC System Ledger)
* Automated Change Data Capture engine via `log_cdc_mutation()` tracking mutations across `forms`, `events`, `venues`, `organizers`, `assets`, `team_members`, `tags`, `content_pages`, and `resources`.
* Strictly records `CREATE` for all insert operations (check constraint enforced).
* Tracks `old_values`, `new_values`, `operation` (`CREATE`, `UPDATE`, `DELETE`), actor email/name, and resolved entity titles with visual diffing in the Admin Audit Logs Explorer.

---

## Public Routing & Visibility Matrix
* **Published Events (`status = 'published'`):** Visible in public `/[locale]/events` calendar listings and accessible via canonical permalink (`/[locale]/event/[id_or_slug]`, with 301 redirect from legacy `/[locale]/events/[id_or_slug]`).
* **Unlisted Events (`status = 'unlisted'`):** Excluded from `/[locale]/events` calendar listings, but resolve when accessed via direct permalink (`/[locale]/event/[id_or_slug]`).
* **Published & Unlisted Posts (`type = 'post'`, `status IN ('published', 'unlisted')`):** Accessible via canonical permalink (`/[locale]/post/[id_or_slug]`, with 301 redirect from legacy `/[locale]/news/[id_or_slug]`). Only `status = 'published'` posts appear in the `/[locale]/news` feed and under "Related Articles & Updates" on event detail pages.
* **Published & Unlisted Static Pages (`type = 'page'`, `status IN ('published', 'unlisted')`):** Accessible via top-level permalink (`/[locale]/[id_or_slug]`).
* **Draft / Archived (`status IN ('draft', 'archived')`):** Strictly restricted to authenticated staff inside the admin workspace (`/admin/events`, `/admin/content`, `/admin/forms`).