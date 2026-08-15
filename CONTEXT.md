# Daoji Platform - Domain Model & Architecture

## Tech Stack
*   **Framework:** Next.js (App Router)[cite: 13]
*   **Styling:** Tailwind CSS[cite: 13]
*   **Backend/Auth:** Supabase[cite: 13]
*   **Storage:** Dual Cloudflare R2 bucket architecture utilizing `@aws-sdk/client-s3`[cite: 13]. Private bucket for secure applicant submissions[cite: 13]. Public bucket with a CDN URL for public-facing web assets (banners, images)[cite: 13].
*   **Internationalization:** `next-intl`[cite: 13]
*   **External Brain:** Coda (Daoji Platform acts as a "dumb pipe")[cite: 13]
*   **Infrastructure:** Vercel Hosting + Cloudflare Reverse Proxy (for Mainland China GFW mitigation)[cite: 13].

## Core Domains & Paths
*   **Public Shell:** `app/[locale]/` (Events, Resources, Form Applications)[cite: 13]
*   **Admin Dashboard:** `app/admin/` (Events, Forms Builder, Submissions, Team)[cite: 13]
*   **Forms Builder:** `app/admin/forms/builder/page.tsx`[cite: 13]
*   **Public Form Renderer:** `app/[locale]/form/[slug]/page.tsx` (Slug-based for edge caching)[cite: 13]
*   **Submissions View:** `app/admin/forms/[form_id]/submissions/page.tsx`[cite: 13]
*   **Team Management:** `app/admin/team/page.tsx`[cite: 13]
*   **Secure File Proxy:** `app/admin/file/route.ts`[cite: 13]
*   **SEO Factory Utility:** `lib/seo.ts`[cite: 13]

## Data Modeling & Schema
1.  **Forms Table:** Single `forms` table in Supabase[cite: 13]. Dynamic field structures and configuration are stored in a `JSONB` `schema` column, including `isStandalone`, `interimEventCode`, `bannerImageUrl`, `successTitleEn/Zh`, and `successMessageEn/Zh`[cite: 13]. Includes `id` (UUID), `slug` (Unique String), `event_id`, `title`, boolean `is_followup`, string `status` (draft/open/closed), and `created_at`[cite: 13].
2.  **Submissions Table:** Single `submissions` table[cite: 13]. Dynamic responses are in `JSONB` `response`[cite: 13]. Linked via `form_id` (UUID), `event_id`, and `applicant_token`[cite: 13]. Includes `is_test` and `is_processed` boolean flags, and an auto-generated integer `applicant_seq_num`[cite: 13].
3.  **Team Members Table:** A `team_members` table storing user profiles, strictly linked via foreign key to Supabase's `auth.users` identity[cite: 13]. Includes `email`, `display_name`, `roles` (TEXT Array), and `status`[cite: 13]. 
4.  **Database Indexing & Version Control:** Core logic (tables, sequence generation functions, composite indexes for performance) is persisted directly in raw `.sql` files within the repository (e.g., `supabase/migrations/`) to act as the source of truth and ensure cloud portability[cite: 13].

## Forms & Magic Token Lifecycle
1.  **Event Linkage:** Every dynamic form and submission is explicitly bound to an `event_id` and utilizes an `interimEventCode` prefix defined in the form schema[cite: 13].
2.  **Magic Token Identity:** Applicants are tracked via an `applicant_token` (Formatted as `EVENTCODE-XXXX-XXXX`)[cite: 13]:
    *   **Initial Forms (`is_followup: false`):** Generates a new unique token upon successful submission[cite: 13]. Forms support a custom `{{TOKEN_BOX}}` replacement tag in the Markdown success message to dictate exact visual placement[cite: 13].
    *   **Follow-up Forms (`is_followup: true`):** Strictly require a valid token provided via URL search parameters or manual inline entry[cite: 13].
3.  **Human-Readable Sequencing:** A PL/pgSQL database trigger intercepts every submission[cite: 13]. It checks the `applicant_token` against the `event_id`[cite: 13]. If it's a follow-up, it inherits the existing sequence number[cite: 13]. If it's a new token, it assigns `MAX(applicant_seq_num) + 1`, preventing race conditions[cite: 13].
4.  **Data View & Coda Handoff:** Admins use a dynamic table view to show/hide/reorder columns[cite: 13]. File uploads render as clickable proxy links (`/admin/file?path=...`)[cite: 13]. Exporting a CSV automatically prepends Event/Form identifiers and toggles `is_processed: true` in the database[cite: 13].
5.  **Testing & Previews:** Previewing a form appends `?test=true`[cite: 13]. Test submissions are tagged `is_test: true` and bypass strict token validation, allowing dummy tokens to be accepted and saved[cite: 13].

## Architectural, Security, i18n & SEO Rules
1.  **Strict Boundary Separation:** Admin routes and Public routes remain strictly isolated[cite: 13]. Admin routes are protected by middleware and Supabase Auth[cite: 13].
2.  **Action-Based Access Control (ABAC) & DRY Guards:** Admin authorization, hierarchical role assignment, and role UI labels are centrally governed by a strict TypeScript Master Matrix (`lib/permissions.ts`) acting as the application's single source of truth[cite: 13]. Application code must never check a user's role directly; it must only verify if the user's role array grants authorization for a specific action key (e.g., `hasPermission(roles, 'forms:delete')`)[cite: 13]. 
    *   **Security Layers:** To preserve DRY principles, all security boundaries must utilize the utilities in `lib/auth-guards.ts`: `withPermission` (Higher-Order Function for Server Actions) and `requirePermission` (Top-level Server Component redirect guard)[cite: 13]. 
    *   **Escalation Prevention:** Privilege escalation is mitigated by dynamic matrix checks for assignment authority, hard server-side self-edit blocks, and confining `super_admin` assignments to database-level access only[cite: 13].
    *   **Silent Denial:** The UI must employ a 'Silent Denial' pattern, filtering out navigation elements the user lacks actions for, alongside smart server-side redirects at the admin root to route users to their appropriate dashboard modules.
3.  **Supabase Client/Server Separation:** Always use the server client (`lib/supabase/server.ts`) in Server Components and Server Actions[cite: 13].
4.  **Chinese-First Priority & i18n Chain:** Traditional Chinese is the primary site language[cite: 13]. All arbitrary fallback decisions, default site identity strings, and metadata prioritize Chinese (`/zh`)[cite: 13]. User-generated strings follow the fallback chain: `Current Language` ➔ `Other Language (Chinese Priority)` ➔ `Data Key / Default`[cite: 13].
5.  **Polymorphic SEO Factory:** All public routes generate `<head>` tags via a shared `lib/seo.ts` factory utility (`constructMetadata`), producing standard Open Graph, Twitter card, canonical, and `hreflang` tags[cite: 13].
6.  **Edge Caching (GFW Mitigation):** Public-facing routes (Forms, Posts, Events) must utilize dynamic route segments (`/[slug]`) rather than URL query parameters to ensure compatibility with Next.js Static Generation (SSG) and aggressive CDN edge caching[cite: 13].
7.  **Hybrid Authentication Flow (PKCE & Implicit):** Due to Next.js App Router and middleware constraints, authentication relies on a dual-strategy[cite: 13]. User-initiated actions (Password Reset) utilize the PKCE flow with a secure server-side callback (`/admin/auth/callback`)[cite: 13]. Admin-initiated actions (Team Invites via Service Role) utilize the legacy Implicit Flow (`#access_token`), requiring targeted middleware whitelisting and manual client-side URL hash extraction upon component mount to prevent Next.js from swallowing the token during navigation[cite: 13].