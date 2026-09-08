# Sprint 16: Operational Events & Registration Hub

## Objective
Implement the operational **Events** domain, connecting event schedules, recurrence rules, blackout dates, venues (`venues`), organizers (`organizers`), multi-platform livestreams, master banner retention with local R2 crops, language delivery metadata, and linked application forms (`forms.event_id`)[cite: 29].

---

## Technical Checklist

### Phase 1: Database Migration & Server Actions
- [x] Create migration script for `organizers`, `venues`, updated `events` (`is_standalone`, `is_livestream_live`, `banner_original_asset_id`), and `assets.is_system` with RLS and CDC triggers[cite: 1, 29].
- [x] Implement Organizer CRUD Server Actions guarded by `events:*` permissions[cite: 29].
- [x] Implement Venue CRUD Server Actions guarded by `events:*` permissions[cite: 18, 29].
- [x] Implement core Event Server Actions (`listEventsAction`, `getEventAction`, `saveEventAction`, `deleteEventAction`, `toggleLivestreamLiveAction`)[cite: 1, 18].
- [x] Implement `fetchImageForCropAction` to bypass browser CORS cache collision when cropping CDN images[cite: 1].

### Phase 2: Admin Events Interface (`app/admin/(dashboard)/events/`)
- [x] **Event List View (`app/admin/(dashboard)/events/`):**
  - [x] Refactored `page.tsx` as a Server Component verifying permissions and fetching initial data.
  - [x] Extracted `EventsClient.tsx` interactive table with debounced search, status filter tabs, and quick live broadcast toggle (`LIVE` / `Offline`)[cite: 26, 37].
- [x] **Event Editor (`components/admin/EventEditor.tsx`):**
  - [x] Integrate with `EditorLayout`, `EditorHeader`, `BilingualCanvas`, `CoverBannerPicker`, and `UrlSlugInspector`[cite: 19].
  - [x] Save without route exit: persists `eventId`, updates browser URL via `window.history.replaceState`, and renders transient `Saved!` indicator[cite: 26].
  - [x] Schedule section: first-occurrence date pickers (`start_date`, `end_date`), all-day toggle, and RFC-5545 recurrence manager with blackout exception dates[cite: 19, 29].
  - [x] Extracted `VenueModal` (with Google Maps, Amap, and bilingual transport guide) and `OrganizerModal`[cite: 26].
  - [x] Extracted `FormPickerModal` replacing raw UUID text input[cite: 26].
  - [x] Language delivery selector (`Cantonese`, `Mandarin`, `English`, `Thai`)[cite: 26].
  - [x] Location Format toggles:
    - `In-Person`: Venue selector with overrides[cite: 26].
    - `Livestream`: Multi-platform inputs (Zoom URL, Meeting ID, Passcode, YouTube Live URL, Facebook Live URL) and activation mode (`auto` vs `manual`)[cite: 26, 29].
  - [x] Registration 3-mode selector (`internal_form`, `external_url`, `not_required`)[cite: 26, 29].
  - [x] Master banner retention (`banner_original_asset_id`) and 16:9 canvas crop modal saving derivative products to `derivatives/crops/`[cite: 1].
  - [x] Standalone toggle (`is_standalone`)[cite: 26].

### Phase 3: Public Event Landing Page (`app/[locale]/events/[id_or_slug]/`)
- [x] Dynamic Dual-Lookup (`short_id` or `slug`) supporting `published` and `unlisted` events in `lib/events.ts`[cite: 20].
- [x] Dynamic registration status inheritance from linked form (`forms.status` -> `events.registration_status`)[cite: 1].
- [x] Registration CTA button always opens in a new tab (`target="_blank" rel="noopener noreferrer"`)[cite: 26, 27].
- [x] Centralized zero-flash standalone handling via `<StandaloneNotifier/>` and `<StandaloneLanguageSwitcher/>`[cite: 28, 29].
- [x] Dual-CTA Action Bar:
  - 3-state brand button (`upcoming`, `open`, `closed`) or passive `not_required` badge[cite: 29].
  - Time-windowed & manual livestream portal with Zoom modal (ID/Passcode copy), YouTube, and Facebook gateway links[cite: 29, 33].
- [x] Localized fallback chain for Venue Name, Venue Address, and Organizer (`current lang > other lang > nil`)[cite: 43].
- [x] Calendar export dropdown (.ics and Google Calendar) with resolved venue location metadata[cite: 20, 40].
- [x] Centralized all public event strings to `messages/en.json` and `messages/zh.json` under `"EventDetail"`[cite: 38, 39].

### Phase 4: Public Events Calendar Hub (`app/[locale]/events/page.tsx`)
- [ ] Schedule list/grid view with upcoming and past event filtering (excluding `unlisted` events).
- [ ] Language filter facets and format badges (In-Person / Livestream).
- [ ] Standalone event cards force `target="_blank" rel="noopener noreferrer"`.