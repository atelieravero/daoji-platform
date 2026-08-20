# Daoji Platform - Project Map

## Active Sprint
*   [ ] `15-storage-taxonomy-rbac-foundation.md` - Core database migration, `nanoid(8)` generator, centralized RBAC matrix expansion, R2 Media Pool (`/admin/assets`), reusable `<MediaPicker/>`, and Taxonomy Manager (`/admin/tags`).

## Backlog
*   [ ] `16-events-registration-hub.md` - Operational Events domain (`/admin/events`), event lifecycle & registration states, linked form integration, and public calendar & event landing pages (`/events/[id_or_slug]`).
*   [ ] `17-articles-pages-news-feed.md` - Editorial Content Pages (`content_pages`), Markdown editor with `<MediaPicker/>`, bulletin feed (`/news`), static pages (`/[id_or_slug]`), and event update attachments.
*   [ ] `18-resources-hub-cross-domain-taxonomy.md` - Curated Resource Hub (`/resources`), multi-source media catalog, two-way Article ⟷ Resource sync, and cross-domain tag aggregator (`/tags/[id_or_slug]`).
*   [ ] Optimize submission CSV exports with batch streaming.
*   [ ] Add cursor-based pagination for Audit Logs Explorer when total log volume exceeds 2,500 entries.

## Completed
*   [x] `14-system-audit-logs.md` - Automated PostgreSQL CDC trigger audit trail for `forms` and `team_members` mutations with GitHub-style delta diff Explorer and human-readable entity labels.
*   [x] `13-strict-file-privacy.md` - Segregate test/real submission file uploads via folder paths (`submissions/test/` vs `submissions/real/`) and enforce strict RBAC routing on document downloads.
*   [x] `12-team-rbac-matrix.md` - Team RBAC, Hybrid Auth, & Form State Immutability
*   [x] `11-form-slug-routing.md` - Form Slug Routing & Edge Caching
*   [x] `10-dynamic-seo-metadata.md` - Dynamic Nature & Metadata Architecture (Chinese-First Priority)
*   [x] `09-applicant-sequence-numbers.md` - Applicant Sequence Numbers (PostgreSQL Trigger)
*   [x] `08-forms-public-assets-and-success-message.md` - Public Assets & Success Message Configuration
*   [x] `07-security-deployment-routing.md` - Security, Deployment, & China Routing
*   [x] `06-forms-standalone-and-event-codes.md` - Event Codes & Standalone Form Mode
*   [x] `05-forms-file-upload.md` - S3/OSS File Upload Integration
*   [x] `04-form-lifecycle-preview-testing.md` - Form Lifecycle, Preview, & Testing Controls
*   [x] `03-forms-public-submission.md` - Connect Public Form Engine, Inline Token Verification, and Admin Submissions Data View
*   [x] `02-forms-builder-admin-ui.md` - Refactor Admin Form Builder UI (Event Binding, Follow-up Toggle, `applicant_token` field)
*   [x] `01-forms-db-schema.md` - Update Supabase Schema for Forms, Submissions, and Magic Tokens
*   [x] Project initialized with Next.js, Tailwind, and Supabase.
*   [x] Local Markdown issue tracker and Domain Model established.