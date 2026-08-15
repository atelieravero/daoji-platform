# Daoji Platform - Domain Model & Architecture

## Tech Stack
*   **Framework:** Next.js (App Router)[cite: 17]
*   **Styling:** Tailwind CSS[cite: 17]
*   **Backend/Auth:** Supabase[cite: 17]
*   **Storage:** Dual Cloudflare R2 bucket architecture utilizing `@aws-sdk/client-s3`[cite: 17]. Private bucket for secure applicant submissions[cite: 17]. Public bucket with a CDN URL for public-facing web assets (banners, images)[cite: 17].
*   **Internationalization:** `next-intl`[cite: 17]
*   **External Brain:** Coda (Daoji Platform acts as a "dumb pipe")[cite: 17]
*   **Infrastructure:** Vercel Hosting + Cloudflare Reverse Proxy (for Mainland China GFW mitigation)[cite: 17].

## Core Domains & Paths
*   **Public Shell:** `app/[locale]/` (Events, Resources, Form Applications)[cite: 17]
*   **Admin Dashboard:** `app/admin/` (Events, Forms Builder, Submissions, Team, Users)[cite: 17]
*   **Forms Builder:** `app/admin/forms/builder/page.tsx`[cite: 17]
*   **Public Form Renderer:** `app/[locale]/form/[slug]/page.tsx` (Slug-based for edge caching)[cite: 17]
*   **Submissions View:** `app/admin/forms/[form_id]/submissions/page.tsx`[cite: 17]
*   **Team Management:** `app/admin/team/page.tsx`[cite: 17]
*   **Secure File Proxy:** `app/admin/file/route.ts`[cite: 17]
*   **SEO Factory Utility:** `lib/seo.ts`[cite: 17]

## Data Modeling & Schema
1.  **Forms Table:** Single `forms` table in Supabase[cite: 17]. Dynamic field structures and configuration are stored in a `JSONB` `schema` column, including `isStandalone`, `interimEventCode`, `bannerImageUrl`, `successTitleEn/Zh`, and `successMessageEn/Zh`[cite: 17]. Includes `id` (UUID), `slug` (Unique String), `event_id`, `title`, boolean `is_followup`, string `status` (draft/open/closed), and `created_at`[cite: 17].
2.  **Submissions Table:** Single `submissions` table[cite: 17]. Dynamic responses are in `JSONB` `response`[cite: 17]. Linked via `form_id` (UUID), `event_id`, and `applicant_token`[cite: 17]. Includes `is_test` and `is_processed` boolean flags, and an auto-generated integer `applicant_seq_num`[cite: 17].
3.  **Team Members Table:** A `team_members` table storing user profiles, strictly linked via foreign key to Supabase's `auth.users` identity[cite: 17]. Includes `email`, `display_name`, `roles` (TEXT Array), and `status`[cite: 17].
4.  **Database Indexing & Version Control:** Core logic (tables, sequence generation functions, composite indexes for performance) is persisted directly in raw `.sql` files within the repository (e.g., `supabase/migrations/`) to act as the source of truth and ensure cloud portability[cite: 17].

## Forms & Magic Token Lifecycle
1.  **Event Linkage:** Every dynamic form and submission is explicitly bound to an `event_id` and utilizes an `interimEventCode` prefix defined in the form schema[cite: 17].
2.  **Magic Token Identity:** Applicants are tracked via an `applicant_token` (Formatted as `EVENTCODE-XXXX-XXXX`)[cite: 17]:
    *   **Initial Forms (`is_followup: false`):** Generates a new unique token upon successful submission[cite: 17]. Forms support a custom `{{TOKEN_BOX}}` replacement tag in the Markdown success message to dictate exact visual placement[cite: 17].
    *   **Follow-up Forms (`is_followup: true`):** Strictly require a valid token provided via URL search parameters or manual inline entry[cite: 17].
3.  **Human-Readable Sequencing:** A PL/pgSQL database trigger intercepts every submission[cite: 17]. It checks the `applicant_token` against the `event_id`[cite: 17]. If it's a follow-up, it inherits the existing sequence number[cite: 17]. If it's a new token, it assigns `MAX(applicant_seq_num) + 1`, preventing race conditions[cite: 17].
4.  **Data View & Coda Handoff:** Admins use a dynamic table view to show/hide/reorder columns[cite: 17]. File uploads render as clickable proxy links (`/admin/file?path=...`)[cite: 17]. Exporting a CSV automatically prepends Event/Form identifiers and toggles `is_processed: true` in the database[cite: 17].
5.  **Testing & Previews:** Previewing a form appends `?test=true`[cite: 17]. Test submissions are tagged `is_test: true` and bypass strict token validation, allowing dummy tokens to be accepted and saved[cite: 17].

## Architectural, Security, i18n & SEO Rules
1.  **Strict Boundary Separation:** Admin routes and Public routes remain strictly isolated[cite: 17]. Admin routes are protected by middleware and Supabase Auth[cite: 17].
2.  **Action-Based Access Control (ABAC) & DRY Guards:** Admin authorization, hierarchical role assignment, and role UI labels are centrally governed by a strict TypeScript Master Matrix (`lib/permissions.ts`) acting as the application's single source of truth[cite: 17]. Application code must never check a user's role directly; it must only verify if the user's role array grants authorization for a specific action key (e.g., `hasPermission(roles, 'forms:delete')`)[cite: 17].
    *   **Security Layers:** All security boundaries utilize utilities in `lib/auth-guards.ts`: `withPermission` (Higher-Order Function for Server Actions) and `requirePermission` (Top-level Server Component redirect guard)[cite: 17].
    *   **Escalation Prevention:** Privilege escalation is mitigated by dynamic matrix checks for assignment authority, hard server-side self-edit blocks, and confining `super_admin` assignments to database-level access only[cite: 17].
    *   **Silent Denial & Smart Redirects:** The layout shell dynamically hides navigation groups users lack permissions for[cite: 14], while the root route (`/admin`) inspects capabilities server-side to redirect to the correct starting module.
3.  **Supabase Client/Server Separation:** Always use the server client (`lib/supabase/server.ts`) in Server Components and Server Actions[cite: 17].
4.  **Chinese-First Priority & i18n Chain:** Traditional Chinese is the primary site language[cite: 17]. Fallbacks and default metadata prioritize Chinese (`/zh`)[cite: 17]. User-generated strings follow: `Current Language` ➔ `Other Language (Chinese Priority)` ➔ `Data Key / Default`[cite: 17].
5.  **Polymorphic SEO Factory:** All public routes generate `<head>` tags via a shared `lib/seo.ts` factory utility (`constructMetadata`), producing standard Open Graph, Twitter card, canonical, and `hreflang` tags[cite: 17].
6.  **Edge Caching (GFW Mitigation):** Public-facing routes (Forms, Posts, Events) utilize dynamic route segments (`/[slug]`) rather than URL query parameters for Next.js Static Generation (SSG) and CDN caching[cite: 17].
7.  **Authentication & Onboarding Flow:** User-initiated password recovery routes through PKCE code exchange (`/admin/auth/callback`) to establish a session cookie[cite: 16, 17], while team invites route directly to `/admin/setup-password` using the Implicit Flow hash[cite: 15, 17]. Account activation is explicitly executed upon password submission via the `completePasswordSetup` Server Action[cite: 15].