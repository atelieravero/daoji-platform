# Daoji Platform - Project Map

## Active Sprint
*   [ ] Restructure and rebuild content-heavy modules (`events`, `resources`, `pages`, `tags`) with centralized RBAC guards[cite: 17].

## Backlog
*   [ ] Optimize submission CSV exports with batch streaming.
*   [ ] Add cursor-based pagination for Audit Logs Explorer when total log volume exceeds 2,500 entries.

## Completed
*   [x] `14-system-audit-logs.md` - Automated PostgreSQL CDC trigger audit trail for `forms` and `team_members` mutations with GitHub-style delta diff Explorer and human-readable entity labels[cite: 17].
*   [x] `13-strict-file-privacy.md` - Segregate test/real submission file uploads via folder paths (`submissions/test/` vs `submissions/real/`) and enforce strict RBAC routing on document downloads[cite: 17].
*   [x] `12-team-rbac-matrix.md` - Team RBAC, Hybrid Auth, & Form State Immutability[cite: 17]
*   [x] `11-form-slug-routing.md` - Form Slug Routing & Edge Caching[cite: 17]
*   [x] `10-dynamic-seo-metadata.md` - Dynamic Nature & Metadata Architecture (Chinese-First Priority)[cite: 17]
*   [x] `09-applicant-sequence-numbers.md` - Applicant Sequence Numbers (PostgreSQL Trigger)[cite: 17]
*   [x] `08-forms-public-assets-and-success-message.md` - Public Assets & Success Message Configuration[cite: 17]
*   [x] `07-security-deployment-routing.md` - Security, Deployment, & China Routing[cite: 17]
*   [x] `06-forms-standalone-and-event-codes.md` - Event Codes & Standalone Form Mode[cite: 17]
*   [x] `05-forms-file-upload.md` - S3/OSS File Upload Integration[cite: 17]
*   [x] `04-form-lifecycle-preview-testing.md` - Form Lifecycle, Preview, & Testing Controls[cite: 17]
*   [x] `03-forms-public-submission.md` - Connect Public Form Engine, Inline Token Verification, and Admin Submissions Data View[cite: 17]
*   [x] `02-forms-builder-admin-ui.md` - Refactor Admin Form Builder UI (Event Binding, Follow-up Toggle, `applicant_token` field)[cite: 17]
*   [x] `01-forms-db-schema.md` - Update Supabase Schema for Forms, Submissions, and Magic Tokens[cite: 17]
*   [x] Project initialized with Next.js, Tailwind, and Supabase[cite: 17].
*   [x] Local Markdown issue tracker and Domain Model established[cite: 17].