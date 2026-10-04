# Daoji Platform - Project Map

## Active Sprint
*   [ ] `16-events-registration-hub.md` - Operational Events domain:
    *   [x] Admin Events table (`EventsClient.tsx`) with quick livestream broadcast toggle.
    *   [x] Event Editor (`EventEditor.tsx`) with master banner retention, manual canvas cropper to `derivatives/crops/`, recurrence rules, blackout dates, and extracted `FormPickerModal`, `VenueModal`, and `OrganizerModal`.
    *   [x] Public Event Detail page (`/events/[id_or_slug]`) with dynamic form status resolution, new-tab registration trigger, manual/auto livestream gateway, dual navigation maps (Google Maps / Amap), `.ics`/Google Calendar exports, bilingual fallback chains, and zero-flash standalone mode.
    *   [ ] Public Events Calendar Hub (`/events/page.tsx`) with standalone new-window detachment and date filtering *(in progress)*.

## Upcoming Sprint
*   [ ] `21-numeric-tokens-and-identity-challenge-recovery.md` - Applicant Token Numeric Simplification, Pre-filled Prefix Mask, Form Question Identity Anchors, Submissions Archiving, and Self-Service Name & Phone Suffix Challenge Recovery *(Next up)*.

## Backlog
*   [ ] `17-articles-pages-news-feed.md` - Editorial Content Pages (`content_pages`), Markdown editor with `<MediaPicker/>`, bulletin feed (`/news`), static pages (`/[id_or_slug]`), and multi-event update attachments via `event_articles`[cite: 22].
*   [ ] `18-resources-hub-cross-domain-taxonomy.md` - Curated Resource Hub (`/resources`), multi-source media catalog, two-way Article ⟷ Resource sync, and cross-domain tag aggregator (`/tags/[id_or_slug]`)[cite: 22].
*   [ ] Optimize submission CSV exports with batch streaming[cite: 22].
*   [ ] Add cursor-based pagination for Audit Logs Explorer when total log volume exceeds 2,500 entries[cite: 22].

## Completed
*   [x] `20-forms-event-scoping-and-builder-hardening.md` - Decoupled applicant sequence numbers & tokens to `event_code` scope, enforced mandatory event linkage with relational forms table metadata (`[CODE] Title`), integrated MediaPicker into form cover and MarkdownEditor, introduced number field type with decimal precision, added `forms:view_schema` read-only mode, and enabled RFC 3986 vanity URL slug characters *(deployed to production)*[cite: 22].
*   [x] `19-admin-design-system-and-component-extraction.md` - Admin workspace UI design system unification (Indigo palette), extraction of shared list view primitives, editor primitives, and Media Pool deduplication[cite: 22].
*   [x] `15-storage-taxonomy-rbac-foundation.md` - Core database migration, `nanoid(8)` generator, centralized RBAC matrix expansion, R2 Media Pool with direct presigned PUT uploads, reusable `<MediaPicker/>`, Taxonomy Manager, and silent denial UI patterns[cite: 22].
*   [x] `14-system-audit-logs.md` - Automated PostgreSQL CDC trigger audit trail for `forms` and `team_members` mutations with GitHub-style delta diff Explorer and human-readable entity labels[cite: 22].
*   [x] `13-strict-file-privacy.md` - Segregate test/real submission file uploads via folder paths and enforce strict RBAC routing[cite: 22].
*   [x] `12-team-rbac-matrix.md` - Team RBAC, Hybrid Auth, & Form State Immutability[cite: 22].
*   [x] `11-form-slug-routing.md` - Form Slug Routing & Edge Caching[cite: 22].
*   [x] `10-dynamic-seo-metadata.md` - Dynamic Nature & Metadata Architecture (Chinese-First Priority)[cite: 22].
*   [x] `09-applicant-sequence-numbers.md` - Applicant Sequence Numbers (PostgreSQL Trigger)[cite: 22].
*   [x] `08-forms-public-assets-and-success-message.md` - Public Assets & Success Message Configuration[cite: 22].
*   [x] `07-security-deployment-routing.md` - Security, Deployment, & China Routing[cite: 22].
*   [x] `06-forms-standalone-and-event-codes.md` - Event Codes & Standalone Form Mode[cite: 22].
*   [x] `05-forms-file-upload.md` - S3/OSS File Upload Integration[cite: 22].
*   [x] `04-form-lifecycle-preview-testing.md` - Form Lifecycle, Preview, & Testing Controls[cite: 22].
*   [x] `03-forms-public-submission.md` - Connect Public Form Engine, Inline Token Verification, and Admin Submissions Data View[cite: 22].
*   [x] `02-forms-builder-admin-ui.md` - Refactor Admin Form Builder UI (Event Binding, Follow-up Toggle, `applicant_token` field)[cite: 22].
*   [x] `01-forms-db-schema.md` - Update Supabase Schema for Forms, Submissions, and Magic Tokens[cite: 22].
*   [x] Project initialized with Next.js, Tailwind, and Supabase[cite: 22].
*   [x] Local Markdown issue tracker and Domain Model established[cite: 22].