# Daoji Platform - Project Map

## Active Sprint
*   [ ] `16-events-registration-hub.md` - Operational Events domain (`/admin/events`), event lifecycle & registration states, linked form integration, and public calendar & event landing pages (`/events/[id_or_slug]`)[cite: 13].

## Backlog
*   [ ] `17-articles-pages-news-feed.md` - Editorial Content Pages (`content_pages`), Markdown editor with `<MediaPicker/>`, bulletin feed (`/news`), static pages (`/[id_or_slug]`), and event update attachments[cite: 13].
*   [ ] `18-resources-hub-cross-domain-taxonomy.md` - Curated Resource Hub (`/resources`), multi-source media catalog, two-way Article ⟷ Resource sync, and cross-domain tag aggregator (`/tags/[id_or_slug]`)[cite: 13].
*   [ ] Optimize submission CSV exports with batch streaming[cite: 13].
*   [ ] Add cursor-based pagination for Audit Logs Explorer when total log volume exceeds 2,500 entries[cite: 13].

## Completed
*   [x] `15-storage-taxonomy-rbac-foundation.md` - Core database migration, `nanoid(8)` generator, centralized RBAC matrix expansion, R2 Media Pool (`/admin/assets` on `cdn.ajahnyiu.org`), reusable `<MediaPicker/>`, Route Group `(dashboard)` isolation, and Taxonomy Manager (`/admin/tags`)[cite: 13].
*   [x] `14-system-audit-logs.md` - Automated PostgreSQL CDC trigger audit trail for `forms` and `team_members` mutations with GitHub-style delta diff Explorer and human-readable entity labels[cite: 13].
*   [x] `13-strict-file-privacy.md` - Segregate test/real submission file uploads via folder paths (`submissions/test/` vs `submissions/real/`) and enforce strict RBAC routing on document downloads[cite: 13].
*   [x] `12-team-rbac-matrix.md` - Team RBAC, Hybrid Auth, & Form State Immutability[cite: 13].
*   [x] `11-form-slug-routing.md` - Form Slug Routing & Edge Caching[cite: 13].
*   [x] `10-dynamic-seo-metadata.md` - Dynamic Nature & Metadata Architecture (Chinese-First Priority)[cite: 13].
*   [x] `09-applicant-sequence-numbers.md` - Applicant Sequence Numbers (PostgreSQL Trigger)[cite: 13].
*   [x] `08-forms-public-assets-and-success-message.md` - Public Assets & Success Message Configuration[cite: 13].
*   [x] `07-security-deployment-routing.md` - Security, Deployment, & China Routing[cite: 13].
*   [x] `06-forms-standalone-and-event-codes.md` - Event Codes & Standalone Form Mode[cite: 13].
*   [x] `05-forms-file-upload.md` - S3/OSS File Upload Integration[cite: 13].
*   [x] `04-form-lifecycle-preview-testing.md` - Form Lifecycle, Preview, & Testing Controls[cite: 13].
*   [x] `03-forms-public-submission.md` - Connect Public Form Engine, Inline Token Verification, and Admin Submissions Data View[cite: 13].
*   [x] `02-forms-builder-admin-ui.md` - Refactor Admin Form Builder UI (Event Binding, Follow-up Toggle, `applicant_token` field)[cite: 13].
*   [x] `01-forms-db-schema.md` - Update Supabase Schema for Forms, Submissions, and Magic Tokens[cite: 13].
*   [x] Project initialized with Next.js, Tailwind, and Supabase[cite: 13].
*   [x] Local Markdown issue tracker and Domain Model established[cite: 13].