# Daoji Platform - Domain Model & Architecture

## System Overview & Core Philosophy
Daoji Platform is the public-facing operational portal and administrative management system for Maggapaṭipadā Meditation Centre (道跡禪院). It serves as a resilient, bilingual bridge connecting retreat applicants and Dhamma students with monastic operations. The platform operates as a high-performance "dumb pipe"—providing schema-driven dynamic application forms, recurring event calendars, multi-platform livestream gateways, and media archives, while deferring complex organizational fulfillment to external databases (Coda)[cite: 34].

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

3. **Event-Code Scoped Submissions & Magic Tokens:**
   * Applicant sequence numbers (`applicant_seq_num`) and magic return tokens (`[EVENT_CODE]-XXXX-XXXX`) are scoped globally to `event_code` (e.g., `STAY`), **not** individual form IDs or event UUIDs[cite: 34].
   * **Database Trigger:** The PostgreSQL trigger `set_applicant_seq_num()` automatically detects returning tokens within the same `event_code` cohort and maintains sequential numbering across multiple recurring retreats[cite: 34].

4. **Dynamic Registration State Inheritance:**
   * When an event is set to `registration_mode: 'internal_form'`, the public action button's state (`upcoming`, `open`, `closed`) and destination URL are not stored statically on the event[cite: 34].
   * **Resolution:** `lib/events.ts` joins the linked form and dynamically derives the operational status from `forms.status` (`draft` $\rightarrow$ Upcoming, `open` $\rightarrow$ Open, `closed` $\rightarrow$ Closed)[cite: 34]. When clicked, registration buttons always open in a new tab (`target="_blank" rel="noopener noreferrer"`).

5. **Recurring Livestream Engine with Calendar Projection:**
   * Supports Zoom, YouTube, and Facebook Live simultaneously[cite: 34].
   * **Auto Mode:** An algorithmic projection engine calculates future recurring occurrences from RFC-5545 rules (`days_of_week`, `until_date`), filters out `blackout_dates`, and activates the live button strictly within `[session_start - open_minutes_before, session_end]`[cite: 34]. Outside this window, it displays a localized countdown pill (`直播於 9月10日 19:15 開放` / *Opens at ...*).
   * **Manual Mode:** Broadcast state is driven by an explicit boolean `is_livestream_live`. When offline, the livestream entry remains completely hidden to prevent visual clutter.

6. **Strict Bilingual Fallback Chain (`current lang > other lang > nil`):**
   * Traditional Chinese (`/zh`) is the primary system locale[cite: 34]. If a field lacks content in the requested locale, it gracefully falls back to the alternate language before displaying a placeholder or blank space[cite: 34].
   * Applied across event titles, markdown descriptions, venue names (`venue_override` $\rightarrow$ `venue.name`), venue addresses, and organizer names.

7. **Immutable Short IDs vs. Mutable Vanity Slugs:**
   * Every public entity generates an immutable 8-character Base62 `short_id` (`nanoid(8)`)[cite: 34].
   * Slugs are optional, mutable, and sanitized to RFC 3986 safe characters (`a-z0-9\-_.~+%`)[cite: 34]. Route resolvers query `WHERE short_id = $1 OR slug = $1`[cite: 34]. Changing a slug never breaks existing inbound links or printed QR codes[cite: 34].

8. **Silent Denial RBAC & Immutable Forms:**
   * Permissions are strictly enforced server-side via `lib/permissions.ts`[cite: 34]. Unauthorized UI controls (such as delete buttons) are silently omitted from the DOM rather than triggering disruptive error redirects[cite: 34].
   * Once a form moves to `open` or `closed`, its schema is locked[cite: 34]. Backend Server Actions reject mutations until the form is explicitly reverted to `draft`[cite: 34].

---

## Tech Stack & Infrastructure
* **Framework:** Next.js (App Router, Server Actions, Route Groups)[cite: 34].
* **Styling:** Tailwind CSS (v4 `@theme inline` with Daoji Ochre brand palette)[cite: 34].
* **Database & Auth:** Supabase (PostgreSQL with RLS, pg_crypto, and CDC audit triggers)[cite: 34].
* **Storage:** Dual Cloudflare R2 bucket architecture via `@aws-sdk/client-s3`[cite: 34]:
  * *Private Bucket:* Encrypted applicant file uploads partitioned into `submissions/test/` vs `submissions/real/`[cite: 34].
  * *Public CDN Bucket:* Custom domain `https://cdn.ajahnyiu.org` for media pool assets and cropped banners[cite: 34].
* **Upload Pipeline:** Direct browser-to-R2 presigned S3 PUT uploads bypassing serverless payload limits for files up to 100MB+[cite: 34].
* **Internationalization:** `next-intl` (Default `/zh`, English `/en`)[cite: 34]. All public event strings centralized in `messages/` under `"EventDetail"`.
* **Infrastructure:** Vercel Hosting with Cloudflare Reverse Proxy for Mainland China network mitigation[cite: 34].

---

## Workspace Design System

### Palette Partitioning
* **Admin Dashboard (`/admin`):** Standardized on the **Indigo** system palette (`bg-indigo-600`, `text-indigo-600`, `bg-indigo-50`)[cite: 34].
* **Public Portal (`/[locale]`):** Standardized on the **Daoji Ochre** brand palette (`--color-primary: #A65D24`, `--color-surface-cream: #FAF5F0`, `--color-surface-base: #FCFAF8`)[cite: 34].
* **Test Mode:** High-contrast Navy palette (`--color-surface-test: #1e1b4b`) to prevent accidental production testing.

### Component Primitives
* **Admin Navigation:** Collapsible `<AdminSidebar/>` with persistent `localStorage` state, smooth transitions, and compact icon-only mode.
* **Admin Tables:** `<AdminPageHeader/>`, `<AdminTableToolbar/>` (debounced search + status tabs), `<AdminTableCard/>`, `<ShareQrModal/>` (high-res QR PNG generation)[cite: 34].
* **Editor Architecture:** Two-pane `<EditorLayout/>` with fixed 460px inspector, `<BilingualCanvas/>`, `<CoverBannerPicker/>` (canvas cropper with master retention), and `<UrlSlugInspector/>`[cite: 34].
* **Relational Pickers:** Extracted modals (`<FormPickerModal/>`, `<EventPickerModal/>`, `<VenueModal/>`, `<OrganizerModal/>`).

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
* **Identity:** `id` (UUID PK), `short_id` (Base62 unique), `slug` (RFC 3986 unique, nullable)[cite: 34].
* **Bilingual Content:** `title_zh`, `title_en`, `summary_zh`, `summary_en`, `body_zh`, `body_en`[cite: 34].
* **Instruction Languages:** `languages` (`TEXT[]`, default `'{cantonese}'` — Cantonese, Mandarin, English, Thai)[cite: 34].
* **Schedule & Recurrence:** `start_date`, `end_date`, `timezone` (default `'Asia/Hong_Kong'`), `is_all_day` (boolean), `recurrence_rule` (JSONB: frequency, interval, days_of_week, until_date), `blackout_dates` (`DATE[]`)[cite: 34].
* **Location Channels:**
  * *In-Person:* `is_in_person` (boolean), `venue_id` (FK $\rightarrow$ `venues.id`), `venue_override_zh`, `venue_override_en`[cite: 34].
  * *Livestream:* `is_livestream` (boolean), `is_livestream_live` (boolean, manual override), `livestream_config` (JSONB: `mode` ['auto' | 'manual'], zoom, youtube, facebook URLs, meeting IDs, passcodes, open minutes)[cite: 34].
* **Registration Gate:** `registration_mode` (`internal_form` | `external_url` | `not_required`), `code` (1–8 uppercase alphanumeric, required for forms), `linked_form_id` (FK $\rightarrow$ `forms.id`), `external_url`, `registration_status`, `cta_label_zh`, `cta_label_en`[cite: 34].
* **Media & Shell:** `banner_asset_id` (cropped), `banner_original_asset_id` (master), `status` (`draft` | `published` | `unlisted` | `archived`), `is_featured`, `is_standalone`[cite: 34].

### 2. `forms` & `submissions` (Dynamic Form Engine)
* **`forms`:** `id` (UUID PK), `slug`, `event_id` (UUID FK $\rightarrow$ `events.id` ON DELETE SET NULL), `title`, `is_followup` (token-gated), `status` (`draft` | `open` | `closed`), `schema` (JSONB: fields, validation, conditions, token-box positioning)[cite: 34].
* **`submissions`:** `id`, `form_id` (FK), `event_id`, `event_code`, `applicant_token` (`[CODE]-XXXX-XXXX`), `applicant_seq_num` (scoped to code), `response` (JSONB), `is_test`, `is_processed`[cite: 34].

### 3. `assets` (Media Pool)
* `id`, `file_url`, `s3_key`, `file_name`, `mime_type`, `file_size_bytes`, `width`, `height`, `alt_text_zh`, `alt_text_en`, `is_system` (boolean: hides derivative crops from general picker), `created_by`[cite: 34].

### 4. `venues` & `organizers`
* **`venues`:** `id`, `name_zh`, `name_en`, `address_zh`, `address_en`, `google_maps_url`, `amap_url` (Mainland China routing), `transport_guide_zh`, `transport_guide_en`, `timezone`[cite: 34].
* **`organizers`:** `id`, `name_en` (mandatory), `name_zh`, `url`, `description_zh`, `description_en`[cite: 34].

### 5. `audit_logs` (CDC System Ledger)
* Automated Change Data Capture engine via `log_cdc_mutation()` tracking mutations across `forms`, `events`, `venues`, `organizers`, `assets`, `team_members`, and `tags`[cite: 33].
* Tracks `old_values`, `new_values`, `operation` (`CREATE`, `UPDATE`, `DELETE`), actor email/name, and resolved entity titles with visual diffing in the Admin Audit Logs Explorer[cite: 33].

---

## Public Routing & Visibility Matrix
* **Published Events (`status = 'published'`):** Visible in public `/events` calendar listings and accessible via permalink (`/events/[short_id]` or `/events/[slug]`)[cite: 34].
* **Unlisted Events (`status = 'unlisted'`):** Excluded from `/events` calendar listings, but resolve when accessed via direct permalink (for private retreats, member-only programs, and preliminary testing)[cite: 34].
* **Draft / Archived (`status IN ('draft', 'archived')`):** Strictly restricted to authenticated staff inside the admin workspace (`/admin/events`).