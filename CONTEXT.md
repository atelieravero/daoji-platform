# Daoji Platform - Domain Model & Architecture

## Tech Stack
*   **Framework:** Next.js (App Router)
*   **Styling:** Tailwind CSS
*   **Backend/Auth:** Supabase
*   **Storage:** Dual Cloudflare R2 bucket architecture utilizing `@aws-sdk/client-s3`. Private bucket for secure applicant submissions (`submissions/test/` vs `submissions/real/`). Public bucket with a CDN URL for public-facing web assets (banners, images).
*   **Internationalization:** `next-intl`
*   **External Brain:** Coda (Daoji Platform acts as a "dumb pipe")
*   **Infrastructure:** Vercel Hosting + Cloudflare Reverse Proxy (for Mainland China GFW mitigation).

## Core Domains & Paths
*   **Public Shell:** `app/[locale]/` (Events, Resources, Form Applications)
*   **Admin Dashboard:** `app/admin/` (Events, Forms Builder, Submissions, Team, Logs)
*   **Forms Builder:** `app/admin/forms/builder/page.tsx`
*   **Public Form Renderer:** `app/[locale]/form/[slug]/page.tsx` (Slug-based for edge caching)
*   **Submissions View:** `app/admin/forms/[form_id]/submissions/page.tsx`
*   **Team Management:** `app/admin/team/page.tsx`
*   **Audit Logs Explorer:** `app/admin/logs/page.tsx`
*   **Secure File Proxy:** `app/admin/file/route.ts`
*   **SEO Factory Utility:** `lib/seo.ts`

## Data Modeling & Schema
1.  **Forms Table:** Single `forms` table in Supabase. Dynamic field structures and configuration are stored in a `JSONB` `schema` column, including `isStandalone`, `interimEventCode`, `bannerImageUrl`, `successTitleEn/Zh`, and `successMessageEn/Zh`. Includes `id` (UUID), `slug` (Unique String), `event_id`, `title`, boolean `is_followup`, string `status` (draft/open/closed), and `created_at`.
2.  **Submissions Table:** Single `submissions` table. Dynamic responses are in `JSONB` `response`. Linked via `form_id` (UUID), `event_id`, and `applicant_token`. Includes `is_test` and `is_processed` boolean flags, and an auto-generated integer `applicant_seq_num`.
3.  **Team Members Table:** A `team_members` table storing user profiles, strictly linked via foreign key to Supabase's `auth.users` identity. Includes `email`, `display_name`, `roles` (TEXT Array), `status` (`active` | `suspended` | `invited`), `created_at`, and `updated_at`.
4.  **Audit Logs Table:** `audit_logs` stores Change Data Capture (CDC) mutation records: `id` (UUID), `created_at`, `actor_email`, `table_name` (`forms`, `team_members`), `operation` (`CREATE` | `UPDATE` | `DELETE`), `record_id`, `old_values` (JSONB), and `new_values` (JSONB). Protected by default-deny RLS.
5.  **Database Indexing & Version Control:** Core logic (tables, sequence generation functions, composite and GIN indexes for performance) is persisted directly in raw `.sql` files within the repository (`supabase/migrations/00_init_schema.sql`) to act as the source of truth and ensure cloud portability.

## Forms, Engine & Magic Token Lifecycle
1.  **Supported Field Types:** `text`, `email`, `mobile`, `date`, `time` (dual `HH`/`MM` boxes stored as `"HH:mm"` 24-hr string), `select`, `radio`, `checkbox`, `textarea`, `file`, `info` (display-only block), `applicant_token`.
2.  **Conditional Logic Engine:**
    *   Candidate targets exclude `info` blocks.
    *   Operators are constrained by field type (Text: `equals`, `contains`, `is_blank`; Choices: `is_one_of`, `is_blank`; Dates/Times: `equals`, `within_range`, `is_blank`; Files/Tokens: `is_blank`, `is_not_blank`).
    *   Unanswered fields evaluate to `false` for value checks, preventing premature negative matches. Dates auto-normalize to `YYYY-MM-DD`. Range operators evaluate `start..end`.
3.  **Magic Token Identity:** Applicants are tracked via an `applicant_token` (Formatted as `EVENTCODE-XXXX-XXXX`):
    *   **Initial Forms (`is_followup: false`):** Generates a new unique token upon successful submission. Forms support a custom `{{TOKEN_BOX}}` replacement tag in the Markdown success message to dictate exact visual placement.
    *   **Follow-up Forms (`is_followup: true`):** Strictly require a valid token provided via URL search parameters or manual pre-gate entry.
4.  **Submission Reset / Start Over:** "Submit another response" purges draft/success session storage and cleans URL parameters (`token`), redirecting back to pre-gate if follow-up form.
5.  **Human-Readable Sequencing:** A PL/pgSQL database trigger intercepts every submission. It checks the `applicant_token` against the `event_id`. If it's a follow-up, it inherits the existing sequence number. If it's a new token, it assigns `MAX(applicant_seq_num) + 1`, preventing race conditions.
6.  **Data View & Coda Handoff:** Admins use a dynamic table view to show/hide/reorder columns. File uploads render as clickable proxy links (`/admin/file?path=...`). Exporting a CSV automatically prepends Event/Form identifiers and toggles `is_processed: true` in the database.
7.  **Testing & Previews:** Previewing a form appends `?test=true`. Test submissions are tagged `is_test: true` and bypass strict token validation, allowing dummy tokens to be accepted and saved.

## Architectural, Security, i18n & SEO Rules
1.  **Strict Boundary Separation:** Admin routes and Public routes remain strictly isolated. Admin routes are protected by middleware and Supabase Auth.
2.  **Action-Based Access Control (ABAC) & DRY Guards:** Admin authorization, hierarchical role assignment, and role UI labels are centrally governed by a strict TypeScript Master Matrix (`lib/permissions.ts`) acting as the application's single source of truth. Application code must never check a user's role directly; it must only verify if the user's role array grants authorization for a specific action key (e.g., `hasPermission(roles, 'forms:delete')`).
    *   **Security Layers:** All security boundaries utilize utilities in `lib/auth-guards.ts`: `withPermission` (Higher-Order Function for Server Actions) and `requirePermission` (Top-level Server Component redirect guard). Both enforce `status === 'active'` verification.
    *   **Escalation Prevention:** Privilege escalation is mitigated by dynamic matrix checks for assignment authority, hard server-side self-edit blocks, and confining `super_admin` assignments to database-level access only.
    *   **Silent Denial & Smart Redirects:** The layout shell dynamically hides navigation groups users lack permissions for, while the root route (`/admin`) inspects capabilities server-side to redirect to the correct starting module.
3.  **Strict File Privacy & S3 Partitioning:** 
    *   Presigned upload URLs partition files into `submissions/test/` and `submissions/real/` based on submission context.
    *   The file download proxy (`/admin/file`) rejects path traversal (`..`) and checks action capabilities dynamically (`submissions:view_real` vs `submissions:view_test`).
    *   Submissions data views automatically restrict production datasets and disable production file links for users holding test-only viewing permissions.
4.  **Supabase Client/Server Separation:** Always use the server client (`lib/supabase/server.ts`) in Server Components and Server Actions.
5.  **Chinese-First Priority & i18n Chain:** Traditional Chinese is the primary site language. Fallbacks and default metadata prioritize Chinese (`/zh`). User-generated strings follow: `Current Language` ➔ `Other Language (Chinese Priority)` ➔ `Data Key / Default`.
6.  **Polymorphic SEO Factory:** All public routes generate `<head>` tags via a shared `lib/seo.ts` factory utility (`constructMetadata`), producing standard Open Graph, Twitter card, canonical, and `hreflang` tags.
7.  **Edge Caching (GFW Mitigation):** Public-facing routes (Forms, Posts, Events) utilize dynamic route segments (`/[slug]`) rather than URL query parameters for Next.js Static Generation (SSG) and CDN caching.
8.  **Authentication & Onboarding Flow:** User-initiated password recovery routes through PKCE code exchange (`/admin/auth/callback`) to establish a session cookie, while team invites route directly to `/admin/setup-password` using the Implicit Flow hash. Account activation is explicitly executed upon password submission via the `completePasswordSetup` Server Action.