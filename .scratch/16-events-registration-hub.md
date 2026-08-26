# Sprint 16: Operational Events & Registration Hub

## Objective
Implement the operational **Events** domain, connecting event schedules, recurrence rules, blackout dates, venues (`venues`), organizers (`organizers`), multi-platform livestreams (Zoom/YouTube/Facebook), language delivery metadata, and linked application forms (`forms.event_id`)[cite: 29]:
1. Create PostgreSQL migrations for `organizers`, `venues`, updated `events` (with non-unique `code`, languages array, dual location toggles, multi-platform livestream config), and the N:N `event_articles` junction table[cite: 29].
2. Build Server Actions for Event, Venue, and Organizer lifecycle management guarded by `events:*` permissions[cite: 29].
3. Develop the administrative Event Editor (`/admin/events/[id]`) with:
   - Organizer dropdown and inline creator.
   - Language multi-selector (Cantonese, Mandarin, English, Thai)[cite: 29].
   - Dual format toggles (`is_in_person` & `is_livestream`) with multi-platform stream URLs (Zoom/YouTube/Facebook)[cite: 29].
   - 3-Mode Registration Gate (`internal_form`, `external_url`, `not_required`) with conditional `code` enforcement and dynamic form status inheritance[cite: 29].
   - First-occurrence session date/time picker with RFC-5545 recurrence and blackout date managers[cite: 29].
   - Natural aspect-ratio banner image selector via `<MediaPicker/>`[cite: 29].
4. Implement public-facing Event pages:
   - Calendar hub (`/events`) filtering by upcoming/past dates, language facets, and Topic Pillars[cite: 29].
   - Dynamic landing page (`/events/[id_or_slug]`) with natural width banner presentation, delivery language badges, dual-CTA bar (3-state registration button + time-windowed livestream portal), dual-map navigation (Google Maps + Amap), and one-click `.ics` / Google Calendar exports[cite: 29].

---

## Scope & Schema Contracts

### 1. Database Migrations (`supabase/migrations/`)
*   **`organizers` Table:**
    *   Fields: `id` (UUID PK), `name_en` (TEXT NOT NULL), `name_zh` (TEXT), `url` (TEXT), `description_zh` (TEXT), `description_en` (TEXT), `created_at` (TIMESTAMPTZ)[cite: 29].
*   **`venues` Table:**
    *   Fields: `id` (UUID PK), `name_zh`, `name_en`, `address_zh`, `address_en`, `google_maps_url`, `amap_url`, `transport_guide_zh`, `transport_guide_en`, `created_at`[cite: 29].
*   **`events` Table (Enhanced):**
    *   Identity: `id` (UUID PK), `short_id` (8-char Base62 unique), `slug` (text, nullable, unique)[cite: 29].
    *   Organizer: `organizer_id` (FK -> `organizers.id`, nullable)[cite: 29].
    *   Content: `title_zh`, `title_en`, `summary_zh`, `summary_en`, `body_zh`, `body_en`[cite: 29].
    *   Languages: `languages` (`TEXT[]`, default `'{cantonese}'` — `cantonese`, `mandarin`, `english`, `thai`)[cite: 29].
    *   Schedule: `start_date`, `end_date` (TIMESTAMPTZ, first session slot)[cite: 29], `timezone` (`'Asia/Hong_Kong'`), `is_all_day` (boolean), `recurrence_rule` (JSONB), `blackout_dates` (`DATE[]`)[cite: 29].
    *   Format & Location:
        *   `is_in_person` (boolean, default `true`), `venue_id` (FK -> `venues.id`), `venue_override_zh`, `venue_override_en`[cite: 29].
        *   `is_livestream` (boolean, default `false`), `livestream_config` (JSONB: `zoom_url`, `youtube_url`, `facebook_url`, `zoom_meeting_id`, `zoom_passcode`, `open_minutes_before`)[cite: 29].
    *   Registration Gate:
        *   `registration_mode` (`internal_form` | `external_url` | `not_required`)[cite: 29].
        *   `code` (text, 1–8 uppercase alphanumeric, non-unique index, mandatory when `registration_mode = 'internal_form'`)[cite: 29].
        *   `linked_form_id` (FK -> `forms.id`), `external_url` (text), `registration_status` (`upcoming` | `open` | `closed`)[cite: 29].
        *   `cta_label_zh`, `cta_label_en` (text)[cite: 29].
    *   Media & State: `banner_asset_id` (FK -> `assets.id`), `status` (`draft` | `published` | `unlisted` | `archived`), `is_featured` (boolean), `created_at`, `updated_at`[cite: 29].
*   **`event_articles` Table (N:N Junction):**
    *   Fields: `event_id` (FK -> `events.id`), `article_id` (FK -> `content_pages.id`), `sort_order` (int), `created_at` (TIMESTAMPTZ)[cite: 29].
    *   Composite PK: `(event_id, article_id)`[cite: 29].
*   **Security & Audit:**
    *   Apply RLS policies (public read for `published` and `unlisted` single events; authenticated staff CRUD via ABAC)[cite: 29].
    *   Attach CDC triggers on `events`, `organizers`, and `venues` logging mutations to `audit_logs`[cite: 29].

### 2. Dual-Lookup & Routing Contract
*   **Single Event Resolution:** `WHERE (short_id = :id_or_slug OR slug = :id_or_slug) AND status IN ('published', 'unlisted')`[cite: 29].
*   **Listing Hub Filter:** `WHERE status = 'published'` (`unlisted` events are excluded from the main calendar/list)[cite: 29].
*   **URL Fallback:** Defaults to `/events/[short_id]` (e.g., `/events/k8x9m2pz`)[cite: 29]. If a custom slug is specified (`/events/winter-retreat-2026`), both paths resolve to the same record with canonical SEO pointing to the vanity slug[cite: 29].

---

## Technical Checklist

### Phase 1: Database Migration & Server Actions
- [ ] Create migration script for `organizers`, updated `events` (non-unique `code`, `languages`, dual location toggles, `livestream_config`, `registration_mode`), `venues`, and `event_articles` with RLS and CDC triggers[cite: 29].
- [ ] Implement Organizer CRUD Server Actions (`listOrganizersAction`, `upsertOrganizerAction`, `deleteOrganizerAction`) guarded by `events:create` / `events:edit`[cite: 29].
- [x] Implement Venue CRUD Server Actions (`listVenuesAction`, `upsertVenueAction`) guarded by `events:create` / `events:edit`[cite: 18, 29].
- [x] Implement core Event Server Actions (`listEventsAction`, `getEventAction`, `saveEventAction`, `deleteEventAction`, `getEventPermissionsAction`) guarded by `events:*` ABAC permissions[cite: 18].
- [ ] Update `saveEventAction` to validate conditional `code` requirement under `internal_form` mode and persist `languages`, `organizer_id`, `is_in_person`, `is_livestream`, and `livestream_config`[cite: 29].

### Phase 2: Admin Events Interface (`app/admin/(dashboard)/events/`)
- [x] **Event List View (`app/admin/(dashboard)/events/page.tsx`):**
  - Standardized on `AdminPageHeader`, `AdminTableToolbar`, `AdminTableCard`, and `StatusBadgeSelect`.
  - Filter tabs (`All`, `Draft`, `Published`, `Unlisted`, `Archived`), status badges, search, and action buttons (Edit, Preview, Share/QR, Delete).
- [ ] **Event Editor (`components/admin/EventEditor.tsx`):**
  - [x] Integrate with `EditorLayout`, `EditorHeader`, `BilingualCanvas`, `CoverBannerPicker`, and `UrlSlugInspector`[cite: 19].
  - [x] Refactor Schedule section: first-occurrence date pickers (`start_date`, `end_date`) and RFC-5545 recurrence manager with live schedule preview[cite: 19, 29].
  - [x] Venue Selector + inline "+ New Venue" modal with Google Maps & Amap fields[cite: 19, 29].
  - [ ] Add Organizer selector with inline "+ New Organizer" modal[cite: 29].
  - [ ] Add Language multi-select chips (`Cantonese`, `Mandarin`, `English`, `Thai`)[cite: 29].
  - [ ] Implement Location Format dual toggles:
    - `In-Person`: Venue dropdown selector with Google Maps & Amap links[cite: 29].
    - `Livestream`: Multi-platform inputs (Zoom URL, Meeting ID, Passcode, YouTube Live URL, Facebook Live URL, Open Minutes Before)[cite: 29].
  - [ ] Refactor Registration section to 3-option mode selector (`internal_form`, `external_url`, `not_required`):
    - Under `internal_form`: show Form selector + mandatory `code` field (1-8 chars) + auto-inherited status badge[cite: 29].
    - Under `external_url`: show External URL input + manual status radio (`upcoming`, `open`, `closed`)[cite: 29].
    - Under `not_required`: disable code and form selectors, show notice info badge[cite: 29].
  - [ ] Update Cover Banner picker to display images with natural aspect ratio (width-fit without forced crop)[cite: 29].

### Phase 3: Public Events Experience (`app/[locale]/events/`)
- [x] **Calendar & Date Utilities (`lib/calendar.ts` & `lib/date.ts`):**
  - [x] RFC-5545 `.ics` generator supporting `RRULE`, `UNTIL`, `BYDAY`, and typed `EXDATE` timestamps[cite: 17, 22].
  - [x] 1-Click Google Calendar Intent URL generator[cite: 17].
  - [x] `CalendarExportDropdown.tsx` client component with dropdown and download triggers[cite: 16].
  - [x] Localized date range and recurrence description formatters (`formatEventDateRange`, `describeRecurrenceRule`)[cite: 21].
- [ ] **Event Landing Page (`app/[locale]/events/[id_or_slug]/page.tsx`):**
  - [x] Dynamic Dual-Lookup (`short_id` or `slug`) supporting `published` and `unlisted` events[cite: 20].
  - [x] Render Markdown body via `<MarkdownRenderer/>` and attached article timeline[cite: 20].
  - [x] Dynamic localized SEO metadata generation via `constructMetadata` in `lib/seo.ts`[cite: 20].
  - [x] Dual navigation links (Google Maps & Amap) when in-person venue is present[cite: 20].
  - [x] Calendar export dropdown (.ics and Google Calendar)[cite: 20].
  - [ ] Render banner with natural container width (`w-full h-auto` without hard crop)[cite: 29].
  - [ ] Display Organizer name & link, delivery language badge chips above title[cite: 29].
  - [ ] Implement Dual-CTA Action Bar:
    - **Registration Button:** 3-state brand button (`upcoming`, `open`, `closed`) or passive `not_required` badge[cite: 29].
    - **Livestream Gateway:** Time-windowed multi-platform button (Zoom modal, YouTube, Facebook) active from `start - X min` to `end`, or upcoming countdown badge[cite: 29].
- [ ] **Events Calendar Hub (`app/[locale]/events/page.tsx`):**
  - Schedule grid/list view with Topic Pillar filter tabs and upcoming/past date filters (excluding `unlisted` events).
  - Recurrence awareness rendering next scheduled occurrences while omitting `blackout_dates`[cite: 29].
  - Language filter facets and format badges (In-Person / Livestream)[cite: 29].

---

## Acceptance Criteria
1. **Dual-Lookup Permalinks:** An event publishes seamlessly to `/events/[short_id]` without requiring a slug, and resolves identically to `/events/[slug]` when a custom slug is assigned[cite: 29].
2. **Unlisted Direct Access:** An event with `status = 'unlisted'` does not appear on the public `/events` listing, but resolves cleanly when visited via its direct URL (`/events/[short_id]` or `/events/[slug]`)[cite: 29].
3. **Recurrence & Blackout Handling:** Recurring weekly/monthly events display correctly on the public calendar, and dates listed in `blackout_dates` are hidden with clear cancellation notices[cite: 29].
4. **Polymorphic CTA Engine:** Action buttons visually reflect the unified 3-state brand design across internal forms, external URLs, and Zoom meetings[cite: 29].
5. **Conditional Event Code:** `code` is strictly required when `registration_mode = 'internal_form'`, and optional/disabled for external or passive events. Multiple events can share the same `code` without unique constraint violations[cite: 29].
6. **Languages Multi-Selection:** Events support tagging multiple spoken/instruction languages (`cantonese`, `mandarin`, `english`, `thai`), rendered as badges on the public card and detail page[cite: 29].
7. **Organizer Linkage:** Organizers can be created and linked to events, displaying bilingual metadata and external links on the public page[cite: 29].
8. **Multi-Platform Livestream:** Events can configure Zoom, YouTube, and Facebook URLs simultaneously. The livestream action button unlocks strictly during the session time window and displays a countdown to the next scheduled session outside the window[cite: 29].
9. **Natural Banner Presentation:** Banner images scale to container width without forced cropping or distorted aspect ratios[cite: 29].
10. **Dual Navigation:** Venue records render functional Google Maps and Amap links on in-person event pages[cite: 29].
11. **Robust Calendar Exports:** Single and recurring events export valid Google Calendar intent links and RFC-5545 `.ics` files with correct `BYDAY`, `UNTIL`, and matching `EXDATE` timestamps[cite: 29].
12. **RBAC & Silent Denial:** Server Actions reject unauthorized mutations fail-closed, and delete actions are silently hidden from unauthorized users[cite: 29].