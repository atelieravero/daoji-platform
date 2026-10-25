# Daoji Platform - Domain Model & Architecture

## System Overview & Core Philosophy
Daoji Platform is the public-facing operational portal and administrative management system for Maggapaṭipadā Meditation Centre (道跡禪院). It serves as a resilient, bilingual bridge connecting retreat applicants and Dhamma students with monastic operations. The platform operates as a high-performance "dumb pipe"—providing schema-driven dynamic application forms, recurring event calendars, multi-platform livestream gateways, and media archives, while deferring complex organizational fulfillment to external databases (Coda).

---

## Architectural Quirks & Essential Tweaks (Read First)
These eight architectural conventions define how this platform solves specific operational, networking, and UX challenges:

1. **Zero-Flash Standalone Shell (`<StandaloneNotifier/>` & `<StandaloneLanguageSwitcher/>`):**
   * Standalone pages (public forms and standalone event landings) suppress the top navbar, header, and footer without hydration flashes.
   * **Mechanism:** Rather than waiting for a client-side `useEffect` to unmount shell components, `StandaloneNotifier` synchronously injects an inline `<style>header, footer, nav { display: none !important; }</style>` tag into the initial server-rendered HTML payload.
   * **Locale Shift Persistence:** The standalone language switcher appends `?standalone=true` when toggling `/zh` $\leftrightarrow$ `/en` to preserve standalone mode across full page reloads.

2. **Master Asset Retention & Derivative Crop Partitioning:**
   * Cropping an event banner preserves the original master image indefinitely via `banner_original_asset_id` alongside the active cropped version (`banner_asset_id`).
   * **Partitioning:** Cropped derivatives are saved under `derivatives/crops/YYYY/MM/...` with `is_system = true`. The user-facing Media Pool query strictly filters out `is_system = true` to prevent derivative crops from cluttering the asset library.

3. **Event-Code Scoped Submissions, Numeric Tokens & Identity Challenge Recovery:**
   * Applicant sequence numbers (`applicant_seq_num`) and magic return tokens are scoped globally to `event_code` (e.g., `STAY`), **not** individual form IDs or event UUIDs.
   * **8-Digit Numeric Tokens:** Tokens use pure numeric digits formatted as `[EVENT_CODE]-[DDDD-DDDD]` (e.g., `OCT26-3829-1940`). Both the follow-up pre-gate and inline `applicant_token` questions render `<TokenDigitsInput/>`, which displays the event code as a fixed read-only badge and prompts the applicant for only the 8 numeric digits (`inputMode="numeric"`).
   * **Identity Anchors (Application Forms Only):** On initial application forms (`is_followup = false`), form builders can designate one `text` question as `Identity Anchor: Full Name` (`is_identity_name`) and one `mobile` question as `Identity Anchor: Mobile Number` (`is_identity_phone`). Question type dropdowns are locked while designated as anchors. Saving the form recalculates anchor columns (`applicant_name`, `applicant_phone_suffix`) across existing submissions.
   * **Self-Service Challenge Recovery:** Applicants who misplace their token can challenge either the follow-up pre-gate or an inline `applicant_token` question via `<TokenRecoveryModal/>` using their Name and Mobile Number. The server canonicalizes the name (all spaces/punctuation stripped, lowercased) and phone (suffix-8 digits) and verifies that **exactly one non-archived match exists** with non-empty anchor values. Real mode matches against real submissions; test mode matches against test submissions.

4. **Dynamic Registration State Inheritance & Crawler-Safe Public Resolution:**
   * When an event is set to `registration_mode: 'internal_form'`, the public action button's state (`upcoming`, `open`, `closed`) and destination URL are not stored statically on the event.
   * **Resolution:** `lib/events.ts` uses `getSupabaseAdmin()` (mirroring `getPublicForm` in `app/[locale]/form/[slug]/actions.ts`) to resolve public events, `banner_asset`, `venues`, `organizers`, and `linked_form` on the server without cookie or RLS discrepancies for anonymous visitors and social link preview crawlers (WhatsApp, WeChat, iMessage, Telegram). It dynamically derives the operational status from `forms.status` (`draft` $\rightarrow$ Upcoming, `open` $\rightarrow$ Open, `closed` $\rightarrow$ Closed). When clicked, registration buttons always open in a new tab (`target="_blank" rel="noopener noreferrer"`).
   * **Explicit Status Filtering:** Public resolvers in `lib/events.ts` explicitly filter `events.status` (`published`, `unlisted`) and joined `event_articles` (`article.status === 'published'`) so signed-in admins and anonymous visitors always see identical public data.

5. **Recurring Livestream Engine with Calendar Projection:**
   * Supports Zoom, YouTube, and Facebook Live simultaneously.
   * **Auto Mode:** An algorithmic projection engine calculates future recurring occurrences from RFC-5545 rules (`days_of_week`, `until_date`), filters out `blackout_dates`, and activates the live button strictly within `[session_start - open_minutes_before, session_end]`. Outside this window, it displays a localized countdown pill (`直播於 9月10日 19:15 開放` / *Opens at ...*).
   * **Manual Mode:** Broadcast state is driven by an explicit boolean `is_livestream_live`. When offline, the livestream entry remains completely hidden to prevent visual clutter.

6. **Strict Bilingual Fallback Chain (`current lang > other lang > nil`):**
   * Traditional Chinese (`/zh`) is the primary system locale. If a field lacks content in the requested locale, it gracefully falls back to the alternate language before displaying a placeholder or blank space.
   * Applied across event titles, markdown descriptions, venue names (`venue_override` $\rightarrow$ `venue.name`), venue addresses, and organizer names.

7. **Immutable Short IDs vs. Mutable Vanity Slugs:**
   * Every public entity generates an immutable 8-character Base62 `short_id` (`nanoid(8)`).
   * Slugs are optional, mutable, and sanitized to RFC 3986 safe characters (`a-z0-9\-_.~+%`). Route resolvers query `WHERE short_id = $1 OR slug = $1` using double-quoted PostgREST filter values (`short_id.eq."${decoded}",slug.eq."${decoded}"`) so special characters like dots (`.`) never break filter parsing. Changing a slug never breaks existing inbound links or printed QR codes.

8. **Silent Denial RBAC & Immutable Forms:**
   * Permissions are strictly enforced server-side via `lib/permissions.ts`. Unauthorized UI controls (such as delete buttons) are silently omitted from the DOM rather than triggering disruptive error redirects.
   * Submission status mutations are separated into `submissions:process` (toggling `is_processed` and bulk export processing) and `submissions:archive` (toggling `is_archived` to exclude duplicate/invalid rows from token recovery).
   * Once a form moves to `open` or `closed`, its schema is locked. Backend Server Actions reject mutations until the form is explicitly reverted to `draft`.

---

## Tech Stack & Infrastructure
* **Framework:** Next.js (App Router, Server Actions, Route Groups).
* **Styling:** Tailwind CSS (v4 `@theme inline` with Daoji Ochre brand palette).
* **Database & Auth:** Supabase (PostgreSQL with idempotent RLS policies, explicit `anon`/`authenticated` table grants, `pgcrypto`, and CDC audit triggers).
* **Storage:** Dual Cloudflare R2 bucket architecture via `@aws-sdk/client-s3`:
  * *Private Bucket:* Encrypted applicant file uploads partitioned into `submissions/test/` vs `submissions/real/`.
  * *Public CDN Bucket:* Custom domain `https://cdn.ajahnyiu.org` for media pool assets and cropped banners.
* **Upload Pipeline:** Direct browser-to-R2 presigned S3 PUT uploads bypassing serverless payload limits for files up to 100MB+.
* **Internationalization:** `next-intl` (Default `/zh`, English `/en`). All public strings centralized in `messages/` under `"EventDetail"` and `"ApplyForm"`.
* **Infrastructure:** Vercel Hosting with Cloudflare Reverse Proxy for Mainland China network mitigation.

---

## Workspace Design System

### Palette Partitioning
* **Admin Dashboard (`/admin`):** Standardized on the **Indigo** system palette (`bg-indigo-600`, `text-indigo-600`, `bg-indigo-50`).
* **Public Portal (`/[locale]`):** Standardized on the **Daoji Ochre** brand palette (`--color-primary: #A65D24`, `--color-surface-cream: #FAF5F0`, `--color-surface-base: #FCFAF8`).
* **Test Mode:** High-contrast Navy palette (`--color-surface-test: #1e1b4b`) to prevent accidental production testing.

### Component Primitives
* **Admin Navigation:** Collapsible `<AdminSidebar/>` with persistent `localStorage` state, smooth transitions, and compact icon-only mode.
* **Admin Tables:** `<AdminPageHeader/>`, `<AdminTableToolbar/>` (debounced search + status tabs), `<AdminTableCard/>`, `<ShareQrModal/>` (high-res QR PNG generation).
* **Editor Architecture:** Two-pane `<EditorLayout/>` with fixed 460px inspector, `<BilingualCanvas/>`, `<CoverBannerPicker/>` (canvas cropper with master retention), and `<UrlSlugInspector/>`.
* **Relational Pickers:** Extracted modals (`<FormPickerModal/>`, `<EventPickerModal/>`, `<VenueModal/>`, `<OrganizerModal/>`).
* **Public Form Engine (`components/public/form/` & `lib/form-engine-utils.ts`):** Modularized into `<FormPreGateScreen/>`, `<FormSuccessScreen/>`, `<FormFieldCard/>`, `<TokenRecoveryModal/>`, and shared input primitives (`<MobilePhoneInput/>`, `<TokenDigitsInput/>`).

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
* **Media & Shell:** `banner_asset_id` (cropped), `banner_original_asset_id` (master), `status` (`draft` | `published` | `unlisted` | `archived`), `is_featured`, `is_standalone`.

### 2. `forms` & `submissions` (Dynamic Form Engine)
* **`forms`:** `id` (UUID PK), `slug`, `event_id` (UUID FK $\rightarrow$ `events.id` ON DELETE SET NULL), `title`, `is_followup` (token-gated), `status` (`draft` | `open` | `closed`), `schema` (JSONB: fields, validation, conditions, token-box positioning, anchor designations `is_identity_name` and `is_identity_phone`).
* **`submissions`:** 
  * `id` (UUID PK), `form_id` (FK), `event_id`, `event_code`.
  * `locale`: Nullable `TEXT` recording the exact route locale code (`zh`, `en`, etc.) used when submitting the form, with no default assumption.
  * `applicant_token`: 8-digit numeric token (`[CODE]-DDDD-DDDD`).
  * `applicant_seq_num`: Sequential counter scoped to `event_code`.
  * `applicant_name`: Canonicalized full name (all whitespace/punctuation stripped, lowercase).
  * `applicant_phone_suffix`: Suffix-8 mobile digits.
  * `response`: JSONB raw answers.
  * `is_archived`: Boolean flag to de-index duplicate or invalid records from challenge recovery.
  * `is_test`, `is_processed`.

### 3. `assets` (Media Pool)
* `id`, `file_url`, `s3_key`, `file_name`, `mime_type`, `file_size_bytes`, `width`, `height`, `alt_text_zh`, `alt_text_en`, `is_system` (boolean: hides derivative crops from general picker), `created_by`.

### 4. `venues` & `organizers`
* **`venues`:** `id`, `name_zh`, `name_en`, `address_zh`, `address_en`, `google_maps_url`, `amap_url` (Mainland China routing), `transport_guide_zh`, `transport_guide_en`, `timezone`.
* **`organizers`:** `id`, `name_en` (mandatory), `name_zh`, `url`, `description_zh`, `description_en`.

### 5. `audit_logs` (CDC System Ledger)
* Automated Change Data Capture engine via `log_cdc_mutation()` tracking mutations across `forms`, `events`, `venues`, `organizers`, `assets`, `team_members`, and `tags`.
* Strictly records `CREATE` for all insert operations (check constraint enforced).
* Tracks `old_values`, `new_values`, `operation` (`CREATE`, `UPDATE`, `DELETE`), actor email/name, and resolved entity titles with visual diffing in the Admin Audit Logs Explorer.

---

## Public Routing & Visibility Matrix
* **Published Events (`status = 'published'`):** Visible in public `/events` calendar listings and accessible via permalink (`/events/[short_id]` or `/events/[slug]`).
* **Unlisted Events (`status = 'unlisted'`):** Excluded from `/events` calendar listings, but resolve when accessed via direct permalink (for private retreats, member-only programs, and preliminary testing).
* **Draft / Archived (`status IN ('draft', 'archived')`):** Strictly restricted to authenticated staff inside the admin workspace (`/admin/events`).