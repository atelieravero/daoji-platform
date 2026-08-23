# Sprint 16: Operational Events & Registration Hub

## Objective
Implement the operational **Events** domain, connecting event schedules, recurrence rules, blackout dates, physical/digital venues (`venues`), registration lifecycles, and linked application forms (`forms.event_id`) with the dual-lookup (`short_id` + optional `slug`) routing architecture[cite: 25]:
1. Create PostgreSQL migrations for `venues`, enhanced `events` (supporting `unlisted` status), and the N:N `event_articles` junction table[cite: 25].
2. Build Server Actions for Event and Venue lifecycle management guarded by `events:*` permissions[cite: 25].
3. Develop the administrative Event management interface (`/admin/events`) with date/time pickers, recurrence/blackout editors, venue selector (with Google Maps & Amap integration), polymorphic CTA switcher, Markdown body editor with `<MediaPicker/>`, and collapsible SEO settings[cite: 25].
4. Implement public-facing Event pages: the schedule/calendar listing (`/events`) and dynamic event landing page (`/events/[id_or_slug]`) with embedded form rendering, 3-state CTA engine, `.ics` calendar export, and attached article timelines[cite: 25].
5. Integrate with `lib/seo.ts` for dynamic OpenGraph, canonical headers, and localized metadata[cite: 25].

---

## Scope & Schema Contracts

### 1. Database Migrations (`supabase/migrations/`)
*   **`venues` Table:**
    *   Fields: `id` (UUID PK), `name_zh`, `name_en`, `address_zh`, `address_en`, `google_maps_url`, `amap_url`, `transport_guide_zh`, `transport_guide_en`, `created_at`[cite: 25].
*   **`events` Table (Enhanced):**
    *   Identity: `id` (UUID PK), `short_id` (8-char Base62, auto-generated unique), `code` (1–8 uppercase alphanumeric unique), `slug` (text, nullable, unique partial index)[cite: 25].
    *   Content: `title_zh`, `title_en`, `summary_zh`, `summary_en` (plain-text preview snippet), `body_zh`, `body_en` (rich Markdown with inline images)[cite: 25].
    *   Schedule: `start_date`, `end_date` (TIMESTAMPTZ), `timezone` (default `'Asia/Hong_Kong'`), `is_all_day` (boolean), `recurrence_rule` (JSONB), `blackout_dates` (`DATE[]` default `{}`)[cite: 25].
    *   Venue & Format: `location_type` (`in_person` | `online` | `hybrid`), `venue_id` (FK -> `venues.id`), `venue_override_zh`, `venue_override_en`[cite: 25].
    *   CTA & Registration: `registration_status` (`upcoming` | `open` | `waitlist` | `closed` | `not_required`), `cta_type` (`internal_form` | `external_url` | `zoom` | `none`), `cta_label_zh`, `cta_label_en`, `external_url`, `zoom_config` (JSONB), `linked_form_id` (FK -> `forms.id`)[cite: 25].
    *   Media & State: `banner_asset_id` (FK -> `assets.id`), `status` (`draft` | `published` | `unlisted` | `archived`), `is_featured` (boolean), `created_at`, `updated_at`.
*   **`event_articles` Table (N:N Junction):**
    *   Fields: `event_id` (FK -> `events.id`), `article_id` (FK -> `content_pages.id`), `sort_order` (int), `created_at` (TIMESTAMPTZ)[cite: 25].
    *   Composite PK: `(event_id, article_id)`[cite: 25].
*   **Security & Audit:**
    *   Apply RLS policies (public read for `published` and `unlisted` single events; authenticated staff CRUD via ABAC)[cite: 25].
    *   Attach CDC triggers on `events` and `venues` logging mutations to `audit_logs`[cite: 25].

### 2. Dual-Lookup & Routing Contract
*   **Single Event Resolution:** `WHERE (short_id = :id_or_slug OR slug = :id_or_slug) AND status IN ('published', 'unlisted')`.
*   **Listing Hub Filter:** `WHERE status = 'published'` (`unlisted` events are excluded from the main calendar/list).
*   **URL Fallback:** Defaults to `/events/[short_id]` (e.g., `/events/k8x9m2pz`)[cite: 25]. If a custom slug is specified (`/events/winter-retreat-2026`), both paths resolve to the same record with canonical SEO pointing to the vanity slug[cite: 25].

---

## Technical Checklist

### Phase 1: Database Migration & Server Actions
- [ ] Create migration script for `venues`, updated `events` (`unlisted` status), and `event_articles` with RLS and CDC triggers.
- [ ] Implement `createEventAction` & `updateEventAction` with Zod validation, recurrence rules, blackout dates, CTA config, and tag bindings. Guarded by `events:create` / `events:edit`[cite: 25].
- [ ] Implement `deleteEventAction` with active reference checks and graceful failure. Guarded by `events:delete`[cite: 25].
- [ ] Implement `publishEventAction` managing lifecycle transitions (`draft` ➔ `published` ➔ `unlisted` ➔ `archived`). Guarded by `events:publish`.
- [ ] Implement Venue CRUD Server Actions (`listVenuesAction`, `createVenueAction`, `updateVenueAction`, `deleteVenueAction`). Guarded by `events:create` / `events:edit`[cite: 25].

### Phase 2: Admin Events Interface (`app/admin/(dashboard)/events/`)
- [ ] **Event List View (`/admin/(dashboard)/events/page.tsx`):**
  - Filter pills (`All`, `Draft`, `Published`, `Unlisted`, `Archived`), status badges, search, and date filters.
  - Quick action buttons (Edit, View Public Page, Copy Link, Duplicate Event, Silent Denial Delete).
- [ ] **Event Editor (`/admin/(dashboard)/events/new`, `[id]/page.tsx`):**
  - Localized Title, Plain Summary, and Rich Markdown Body with `<MediaPicker/>` inline image insertion[cite: 25].
  - Date & Time pickers with timezone selector and Recurrence / Blackout Date manager[cite: 25].
  - Location Type selector and Venue Picker (with inline create/edit for Google Maps / Amap URLs)[cite: 25].
  - Polymorphic CTA Switcher (`internal_form`, `external_url`, `zoom`, `none`) with dynamic label overrides[cite: 25].
  - Banner Selector via `<MediaPicker/>` and Topic Pillar / Micro-Tag selector[cite: 25].
  - Collapsible **"URL & SEO Settings"** panel with immutable `short_id` and optional `slug`[cite: 25].

### Phase 3: Public Events Experience (`app/[locale]/events/`)
- [ ] **Schedule & Calendar Hub (`app/[locale]/events/page.tsx`):**
  - Grid/List toggle view with Topic Pillar filter tabs and upcoming/past date filters (excluding `unlisted` events).
  - Recurrence awareness rendering next scheduled occurrences while hiding `blackout_dates`[cite: 25].
- [ ] **Event Landing Page (`app/[locale]/events/[id_or_slug]/page.tsx`):**
  - Hero banner with localized metadata, venue details, and navigation links (Google Maps + Amap)[cite: 25].
  - 3-State Daoji Brand CTA Button (`draft` / `open` / `closed`) with smooth scroll to embedded form[cite: 25].
  - **Embedded Form Renderer:** Renders linked form with Magic Token and sequential applicant numbering[cite: 25].
  - **Calendar Export Dropdown:** One-click Google Calendar intent and client-side RFC-5545 `.ics` download (handling `RRULE` and `EXDATE`)[cite: 25].
  - **Timeline of Attached Updates:** Renders linked articles/bulletins from `event_articles`[cite: 25].
- [ ] **SEO Integration:** Polymorphic dynamic metadata generation via `constructMetadata` in `lib/seo.ts`[cite: 25].

---

## Acceptance Criteria
1. **Dual-Lookup Permalinks:** An event publishes seamlessly to `/events/[short_id]` without requiring a slug, and resolves identically to `/events/[slug]` when a custom slug is assigned[cite: 25].
2. **Unlisted Direct Access:** An event with `status = 'unlisted'` does not appear on the public `/events` listing, but resolves cleanly when visited via its direct URL (`/events/[short_id]` or `/events/[slug]`).
3. **Venue Navigation:** Venue records store and render distinct `google_maps_url` and `amap_url` links on the public landing page[cite: 25].
4. **Recurrence & Blackout Handling:** Recurring weekly/monthly events display correctly on the public calendar, and dates listed in `blackout_dates` are hidden with clear cancellation notices[cite: 25].
5. **Polymorphic CTA Engine:** Action buttons visually reflect the unified 3-state brand design across internal forms, external URLs, and Zoom meetings[cite: 25].
6. **Calendar Integration:** Users can export the event to Google Calendar via direct intent and download a valid `.ics` file compatible with Apple Calendar and Outlook[cite: 25].
7. **RBAC & Silent Denial:** Server Actions reject unauthorized mutations fail-closed, and delete actions are silently hidden from unauthorized users[cite: 25].