# Daoji Platform - Project Map

## Active Sprint (Content Model & Pre-Launch Seeding)
*   [ ] **`25-content-relations-playlists-and-bulk-ingestion.md` (Ready for Implementation)**:
    *   [ ] Pre-import schema expansion: `article_resources` (N:M article ⟷ source audio/video), `playlists` & `playlist_items` (flat chronological series), `content_pages.category` (`news` | `teaching`), 6 pillar tags, and `resources` media metadata (`duration_seconds`, `recorded_at`, `external_source_key`, `media_meta`).
    *   [ ] Admin support for `content_pages.category`, `article_resources` attachment, and `playlists` curation.
    *   [ ] Idempotent local CLI bulk-ingestion pipelines (with human sign-off manifests): 10 `hktheravada.org` PDF ebooks (`media_meta.readmoo_url` ready), WeChat `林中道跡` 6 albums + standalone articles (strict pure Markdown + R2 image mirroring + `s2hk`), Baidu Pan selected public MP3 folders (`ffmpeg` 96kbps mono + `s2hk`, excluding internal `法工會`), and YouTube `@hktheravada` catalog (`yt-dlp`).

## Upcoming Sprints
*   [ ] **`18-dhamma-library-podcast-and-resources-hub.md`** - Public Dhamma Library (`/[locale]/resources`), 3D filtering (Format × 6 Pillar Tags × Flat Curated Playlists), persistent zero-login Podcast Mini-Player (`localStorage` ad-hoc queue), bi-directional Edited Article ⟷ Source Recording media dock, and ongoing Admin batch audio / WeChat URL import tools.
*   [ ] **`26-public-portal-hubs-and-navigation.md`** *(Split from Ticket 17 Phase 2)* - Public Events Calendar Hub (`/[locale]/events`), News Feed (`/[locale]/news` strictly `category = 'news'`), Homepage (`/[locale]`), and unified `#8E442A` global header/footer navigation.
*   [ ] **Dedicated Taxonomy & Tags Sprint** - Integrate polymorphic tag selectors (`taggables`) into Event, Content, and Resource editors, and build the public tag aggregator (`/tags/[id_or_slug]`).

## Backlog
*   [ ] `24-event-scoped-rbac.md` - Event-level permission delegation (`team_members.allowed_event_ids`) to scope Events, Forms, and Submissions access per assigned retreat/event.
*   [ ] Roll out reusable `<AdminColumnHeaderFilter/>` and `useAdminTableFilters` across remaining Admin table views (`/admin/events`, `/admin/content`, `/admin/forms`, `/admin/resources`).
*   [ ] Optimize submission CSV exports with batch streaming.
*   [ ] Add cursor-based pagination for Audit Logs Explorer when total log volume exceeds 2,500 entries.

## Completed
*   [x] `23-application-status-inquiry.md` - Added stateless, zero-PII Application Status & Instruction Inquiry (`forms.status_config` and `submissions.status_data`), Admin Status Config modal (`StatusConfigModal.tsx`), key-only inline & multi-row bulk status assignment in `/admin/forms/[form_id]/submissions`, reusable Google Sheets-style per-column filter & sort popover (`AdminColumnFilter.tsx`), compact icon-only system headers with `<Trash2/>` for archived, high-contrast row selection, DRY side-by-side `<ApplicantIdentityGate/>` shared across Follow-up Pre-Gate and `/[locale]/form/[slug]/status`, unified `Application Code` / `報名代碼` terminology, and a secondary status inquiry link in `EventActionPortal.tsx`.
*   [x] `22-markdown-headings-and-success-interpolation.md` - Added `{{dataKey}}` inline variable interpolation to Form Success Screen Titles and Messages backed by the committed `submissions.response` JSONB returned from `submitPublicForm`, added live inline variable badges and copyable variable pills in the Form Builder, implemented relative heading hierarchy (`baseHeadingLevel` `2`–`5`) with `3px` `#8E442A` accent bars on `h2` in `<MarkdownRenderer/>`, and overhauled the public portal design system (`#8E442A` Terracotta brand palette, Peacock Teal `#0D6E6E` hyperlinks with `2.5px` dotted underlines, CJK sans-serif font stack, `16px` / `1.8` line-height reading rhythm, and un-letterboxed `1.91:1` form banners).
*   [x] `17-articles-pages-news-feed.md` - Upgraded `content_pages` schema (`type` `'post' | 'page'`, `status` including `'unlisted'`, `summary_zh`/`summary_en`, `cover_original_asset_id`, `is_standalone`), standardized cover crops to `1.91:1` (`1200×630`), added collapsible summaries with auto-excerpt SEO fallback (`lib/seo.ts`), extracted `RESERVED_SLUGS` (`lib/slug.ts`), built Admin Content Workspace (`/admin/content`) and `ContentPageEditor.tsx` with multi-event attachments, and launched Public Single Post (`/[locale]/post/[id_or_slug]`), Static Page (`/[locale]/[id_or_slug]`), and canonical Single Event (`/[locale]/event/[id_or_slug]`) views with 301 legacy redirects. *(Public hubs & navigation split into `26-public-portal-hubs-and-navigation.md`.)*
*   [x] `21-numeric-tokens-and-identity-challenge-recovery.md` - Transitioned applicant tokens to 8-digit numeric sequences (`[CODE]-DDDD-DDDD`), added pre-filled event code prefix masks, restricted identity anchors (`is_identity_name`, `is_identity_phone`) to initial application forms with format locking and save-time submission backfills, split RBAC into `submissions:process` and `submissions:archive`, recorded raw submission `locale`, unified DRY challenge recovery across Pre-Gate and inline token questions, and modularized `FormEngine.tsx` into `components/public/form/` and `lib/form-engine-utils.ts`.
*   [x] `16-events-registration-hub.md` (Single Event & Admin Operations) - Completed Admin Events table (`EventsClient.tsx`) with quick livestream broadcast toggle, Event Editor (`EventEditor.tsx`) with master banner retention and derivative crops, and Public Event Detail page (`/event/[id_or_slug]`) with `getSupabaseAdmin()` crawler-safe OpenGraph metadata, dynamic form status inheritance, manual/auto livestream gateway, dual maps, `.ics` exports, and zero-flash standalone mode.
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