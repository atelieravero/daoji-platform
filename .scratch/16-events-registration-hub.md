# Sprint 16: Operational Events & Registration Hub

## Objective
Implement the operational **Events** domain, connecting event schedules, locations, registration lifecycles, and linked application forms (`forms.event_id`) with the dual-lookup (`short_id` + optional `slug`) routing architecture:
1. Build Server Actions for Event lifecycle management guarded by the centralized RBAC matrix.
2. Develop the administrative Event management interface (`/admin/events`) with date pickers, venue controls, linked form binding, `<MediaPicker/>` banner selection, and collapsible SEO settings.
3. Implement public-facing Event pages: the schedule/calendar listing (`/events`) and dynamic event landing page (`/events/[id_or_slug]`) with embedded form rendering and status state machines.
4. Integrate with `lib/seo.ts` for dynamic OpenGraph, canonical headers, and localized metadata.

---

## Scope & Schema Contracts

### 1. Domain Entities & Relations
*   **`events` Table:**
    *   Identity: `id` (UUID PK), `short_id` (8-char Base62, auto-generated, unique), `slug` (text, nullable, unique partial index).
    *   Localized Info: `title_zh`, `title_en`, `summary_zh`, `summary_en`, `venue_details_zh`, `venue_details_en`.
    *   Temporal: `start_date` (TIMESTAMPTZ), `end_date` (TIMESTAMPTZ).
    *   Operational: `location_type` (`in_person` | `online` | `hybrid`), `registration_status` (`upcoming` | `open` | `waitlist` | `closed` | `not_required`).
    *   Foreign Keys: `linked_form_id` (FK -> `forms.id`), `banner_asset_id` (FK -> `assets.id`).
    *   Publication: `status` (`draft` | `published` | `archived`), `created_at`, `updated_at`.
*   **Taxonomy:** Associated with Topic Pillars and Micro-tags via `taggables` (`taggable_type: 'event'`).

### 2. Dual-Lookup & Routing Contract
*   **Query Resolution:** `WHERE (short_id = :id_or_slug OR slug = :id_or_slug) AND status = 'published'`.
*   **URL Fallback:** If no slug is specified by the admin, the page publishes to `/events/[short_id]` (e.g., `/events/k8x9m2pz`). If a custom slug exists, both `/events/k8x9m2pz` and `/events/winter-retreat-2026` resolve to the same record, with canonical SEO pointing to the vanity slug.

---

## Technical Checklist

### Phase 1: Data Layer & Server Actions (`app/admin/events/actions.ts`)
- [ ] Define Zod schemas for Event creation, updates, and publication validation.
- [ ] Implement `createEventAction`: Auto-generates `short_id`, validates slug uniqueness, saves metadata, banner asset, linked form, and tags. Guarded by `events:create`.
- [ ] Implement `updateEventAction`: Updates operational metadata, dates, venue, and taxonomy associations. Guarded by `events:edit`.
- [ ] Implement `deleteEventAction`: Soft/hard delete with dependency checks. Guarded by `events:delete`.
- [ ] Implement `publishEventAction`: Manages state transitions (`draft` ➔ `published` ➔ `archived`). Guarded by `events:publish`.
- [ ] Attach CDC audit triggers to record mutations in `audit_logs`.

### Phase 2: Admin Events Interface (`app/admin/events/`)
- [ ] **Event List View (`/admin/events`):**
  - Status filter pills (`All`, `Draft`, `Upcoming`, `Open`, `Closed`, `Archived`).
  - Search by title and date range filters.
  - Quick action buttons (Edit, View Public Page, Copy Link).
- [ ] **Event Editor (`/admin/events/new`, `/admin/events/[id]`):**
  - Localized Title and Summary fields.
  - Date & Time pickers for Start and End dates with timezone display.
  - Location selector (`In-Person`, `Online`, `Hybrid`) with venue input.
  - Registration Status switcher (`Upcoming`, `Open`, `Waitlist`, `Closed`, `Not Required`).
  - Linked Form Selector (dropdown querying active forms from `forms` table).
  - Banner Selector using the reusable `<MediaPicker/>` component.
  - Tag selector for Topic Pillars and Micro-tags.
  - Collapsible **"URL & SEO Settings"** panel displaying the permanent `short_id` and optional custom `slug`.

### Phase 3: Public Events Experience (`app/[locale]/events/`)
- [ ] **Shared Route Resolver:** Build helper `resolveEntityByIdOrSlug('events', param)`.
- [ ] **Events Schedule / Calendar (`/events`):**
  - List and calendar toggle view for upcoming and past events.
  - Topic Pillar filter tabs and location type filters.
- [ ] **Event Landing Page (`/events/[id_or_slug]`):**
  - Hero banner with localized title, date badges, and venue info.
  - **Dynamic Registration Gate:**
    - `registration_status: 'open'` + `linked_form_id`: Embeds public form renderer with Magic Token support and sequence generation.
    - `registration_status: 'upcoming' | 'waitlist' | 'closed'`: Renders appropriate informational banner.
    - `registration_status: 'not_required'`: Displays "No Registration Required" notice.
  - Timeline placeholder container for attached article updates (to be connected in Sprint 17).
- [ ] **SEO Integration:** Connect dynamic metadata generation via `constructMetadata` in `lib/seo.ts`.

---

## Acceptance Criteria
1. **Zero-Friction Publishing:** An admin can create and publish an event without entering a slug; the page immediately resolves at `/events/[short_id]`.
2. **Vanity Slug & Permalink Dual-Lookup:** If an admin sets a custom slug (`winter-retreat-2026`), both `/events/winter-retreat-2026` and the permanent `/events/[short_id]` resolve successfully.
3. **Registration Form Embedding:** When an open form is linked, the public event landing page embeds the form, collects responses, and generates valid Magic Tokens (`EVENTCODE-XXXX-XXXX`).
4. **Lifecycle State Banners:** Changing registration status (`upcoming`, `closed`, `waitlist`) immediately updates the visual call-to-action on the public page.
5. **RBAC Guard Enforcement:** All Server Actions strictly fail closed and reject unauthorized users via `requirePermission`.
6. **Audit Trail:** All event creations, modifications, and state transitions generate attributed records in `audit_logs`.