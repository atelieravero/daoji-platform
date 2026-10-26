# Daoji Platform - Project Map

## Active Sprint (Single Page / Post Editor & Public View)
*   [ ] `17-articles-pages-news-feed.md` (Phase 1: Single Page & Post Engine):
    *   [ ] Admin Content Pages & Posts table (`/admin/pages` or `/admin/articles`) with search, type/status tabs (`article` vs `page`, `draft` / `published` / `archived`), and QR sharing.
    *   [ ] Two-pane Content Page / Post Editor (`ContentPageEditor.tsx`) reusing `<EditorLayout/>`, `<BilingualCanvas/>`, `<MarkdownEditor/>` with `<MediaPicker/>`, `<CoverBannerPicker/>`, and `<UrlSlugInspector/>`.
    *   [ ] Multi-Event attachment selector (`event_articles` junction table with `sort_order`) and polymorphic tag assignment (`taggables` where `taggable_type = 'content_page'`).
    *   [ ] Public Single Page / Post view (`/[locale]/news/[id_or_slug]` and static page route) with `short_id` / `slug` dual resolution, strict bilingual fallback (`current lang > other lang > nil`), `getSupabaseAdmin()` crawler-safe OpenGraph metadata, and standalone mode support.

## Upcoming Sprints (Portal Structure, Hubs, Tags & Filters)
*   [ ] **Phase 2: Public Portal Hubs, Feeds & Filtering** (Starts once single Page/Post view is complete):
    *   [ ] Public Events Calendar Hub (`/[locale]/events/page.tsx`) with date filtering and standalone new-window detachment (completing `16-events-registration-hub.md`).
    *   [ ] Public News & Bulletin Feed (`/[locale]/news/page.tsx`) with pinned posts (`is_pinned_in_feed`), feed visibility (`is_in_feed`), and category/tag filtering.
    *   [ ] `18-resources-hub-cross-domain-taxonomy.md` - Curated Resource Hub (`/resources`), multi-source media catalog (`asset`, `youtube`, `article`, `external_link`), two-way Article ⟷ Resource sync, and cross-domain tag aggregator (`/tags/[id_or_slug]`).
    *   [ ] Global navigation structure, header/footer links, and unified filter UX across Events, Contents, and Resources.

## Backlog
*   [ ] Optimize submission CSV exports with batch streaming.
*   [ ] Add cursor-based pagination for Audit Logs Explorer when total log volume exceeds 2,500 entries.

## Completed
*   [x] `21-numeric-tokens-and-identity-challenge-recovery.md` - Transitioned applicant tokens to 8-digit numeric sequences (`[CODE]-DDDD-DDDD`), added pre-filled event code prefix masks, restricted identity anchors (`is_identity_name`, `is_identity_phone`) to initial application forms with format locking and save-time submission backfills, split RBAC into `submissions:process` and `submissions:archive`, recorded raw submission `locale`, unified DRY challenge recovery across Pre-Gate and inline token questions, and modularized `FormEngine.tsx` into `components/public/form/` and `lib/form-engine-utils.ts`.
*   [x] `16-events-registration-hub.md` (Single Event & Admin Operations) - Completed Admin Events table (`EventsClient.tsx`) with quick livestream broadcast toggle, Event Editor (`EventEditor.tsx`) with master banner retention and derivative crops, and Public Event Detail page (`/events/[id_or_slug]`) with `getSupabaseAdmin()` crawler-safe OpenGraph metadata, dynamic form status inheritance, manual/auto livestream gateway, dual maps, `.ics` exports, and zero-flash standalone mode.
*   [x] `20-forms-event-scoping-and-builder-hardening.md` - Decoupled applicant sequence numbers & tokens to `event_code` scope, enforced mandatory event linkage with relational forms table metadata (`[CODE] Title`), integrated MediaPicker into form cover and MarkdownEditor, introduced number field type with decimal precision, added `forms:view_schema` read-only mode, and enabled RFC 3986 vanity URL slug characters *(deployed to production)*.
*   [x] `19-admin-design-system-and-component-extraction.md` - Admin workspace UI design system unification (Indigo palette), extraction of shared list view primitives, editor primitives, and Media Pool deduplication.
*   [x] `15-storage-taxonomy-rbac-foundation.md` - Core database migration, `nanoid(8)` generator, centralized RBAC matrix expansion, R2 Media Pool with direct presigned PUT uploads, reusable `<MediaPicker/>`, Taxonomy Manager, and silent denial UI patterns.
*   [x] `14-system-audit-logs.md` - Automated PostgreSQL CDC trigger audit trail for `forms` and `team_members` mutations with GitHub-style delta diff Explorer and human-readable entity labels.
*   [x] `13-strict-file-privacy.md` - Segregate test/real submission file uploads via folder paths and enforce strict RBAC routing.
*   [x] `12-team-rbac-matrix.md` - Team RBAC, Hybrid Auth, & Form State Immutability.
*   [x] `11-form-slug-routing.md` - Form Slug Routing & Edge Caching.
*   [x] `10-dynamic-seo-metadata.md` - Dynamic Nature & Metadata Architecture (Chinese-First Priority).
*   [x] `09-applicant-sequence-numbers.md` - Applicant Sequence Numbers (PostgreSQL Trigger).
*   [x] `08-forms-public-assets-and-success-message.md` - Public Assets & Success Message Configuration.
*   [x] `07-security-deployment-routing.md` - Security, Deployment, & China Routing.
*   [x] `06-forms-standalone-and-event-codes.md` - Event Codes & Standalone Form Mode.
*   [x] `05-forms-file-upload.md` - S3/OSS File Upload Integration.
*   [x] `04-form-lifecycle-preview-testing.md` - Form Lifecycle, Preview, & Testing Controls.
*   [x] `03-forms-public-submission.md` - Connect Public Form Engine, Inline Token Verification, and Admin Submissions Data View.
*   [x] `02-forms-builder-admin-ui.md` - Refactor Admin Form Builder UI (Event Binding, Follow-up Toggle, `applicant_token` field).
*   [x] `01-forms-db-schema.md` - Update Supabase Schema for Forms, Submissions, and Magic Tokens.
*   [x] Project initialized with Next.js, Tailwind, and Supabase.
*   [x] Local Markdown issue tracker and Domain Model established.