# Daoji Platform - Domain Model & Architecture

## Tech Stack
*   **Framework:** Next.js (App Router)[cite: 5]
*   **Styling:** Tailwind CSS[cite: 5]
*   **Backend/Auth:** Supabase[cite: 5]
*   **Storage:** Dual Cloudflare R2 bucket architecture utilizing `@aws-sdk/client-s3`[cite: 5]. Private bucket for secure applicant submissions[cite: 5]. Public bucket with a CDN URL for public-facing web assets (banners, images)[cite: 5].
*   **Internationalization:** `next-intl`[cite: 5]
*   **External Brain:** Coda (Daoji Platform acts as a "dumb pipe")[cite: 5]
*   **Infrastructure:** Vercel Hosting + Cloudflare Reverse Proxy (for Mainland China GFW mitigation)[cite: 5].

## Core Domains & Paths
*   **Public Shell:** `app/[locale]/` (Events, Resources, Form Applications)[cite: 5]
*   **Admin Dashboard:** `app/admin/` (Events, Forms Builder, Submissions, Team)[cite: 5]
*   **Forms Builder:** `app/admin/forms/builder/page.tsx`[cite: 5]
*   **Public Form Renderer:** `app/[locale]/form/[slug]/page.tsx` (Slug-based for edge caching)[cite: 5]
*   **Submissions View:** `app/admin/forms/[form_id]/submissions/page.tsx`[cite: 5]
*   **Team Management:** `app/admin/team/page.tsx`[cite: 5]
*   **Secure File Proxy:** `app/admin/file/route.ts`[cite: 5]
*   **SEO Factory Utility:** `lib/seo.ts`[cite: 5]

## Data Modeling & Schema
1.  **Forms Table:** Single `forms` table in Supabase[cite: 5]. Dynamic field structures and configuration are stored in a `JSONB` `schema` column, including `isStandalone`, `interimEventCode`, `bannerImageUrl`, `successTitleEn/Zh`, and `successMessageEn/Zh`[cite: 5]. Includes `id` (UUID), `slug` (Unique String), `event_id`, `title`, boolean `is_followup`, string `status` (draft/open/closed), and `created_at`[cite: 5].
2.  **Submissions Table:** Single `submissions` table[cite: 5]. Dynamic responses are in `JSONB` `response`[cite: 5]. Linked via `form_id` (UUID), `event_id`, and `applicant_token`[cite: 5]. Includes `is_test` and `is_processed` boolean flags, and an auto-generated integer `applicant_seq_num`[cite: 5].
3.  **Team Members Table:** A `team_members` table storing user profiles, strictly linked via foreign key to Supabase's `auth.users` identity[cite: 5]. Includes `email`, `display_name`, `roles` (TEXT Array), and `status`[cite: 5]. 
4.  **Database Indexing & Version Control:** Core logic (tables, sequence generation functions, composite indexes for performance) is persisted directly in raw `.sql` files within the repository (e.g., `supabase/migrations/`) to act as the source of truth and ensure cloud portability[cite: 5].

## Forms & Magic Token Lifecycle
1.  **Event Linkage:** Every dynamic form and submission is explicitly bound to an `event_id` and utilizes an `interimEventCode` prefix defined in the form schema[cite: 5].
2.  **Magic Token Identity:** Applicants are tracked via an `applicant_token` (Formatted as `EVENTCODE-XXXX-XXXX`)[cite: 5]:
    *   **Initial Forms (`is_followup: false`):** Generates a new unique token upon successful submission[cite: 5]. Forms support a custom `{{TOKEN_BOX}}` replacement tag in the Markdown success message to dictate exact visual placement[cite: 5].
    *   **Follow-up Forms (`is_followup: true`):** Strictly require a valid token provided via URL search parameters or manual inline entry[cite: 5].
3.  **Human-Readable Sequencing:** A PL/pgSQL database trigger intercepts every submission[cite: 5]. It checks the `applicant_token` against the `event_id`[cite: 5]. If it's a follow-up, it inherits the existing sequence number[cite: 5]. If it's a new token, it assigns `MAX(applicant_seq_num) + 1`, preventing race conditions[cite: 5].
4.  **Data View & Coda Handoff:** Admins use a dynamic table view to show/hide/reorder columns[cite: 5]. File uploads render as clickable proxy links (`/admin/file?path=...`)[cite: 5]. Exporting a CSV automatically prepends Event/Form identifiers and toggles `is_processed: true` in the database[cite: 5].
5.  **Testing & Previews:** Previewing a form appends `?test=true`[cite: 5]. Test submissions are tagged `is_test: true` and bypass strict token validation, allowing dummy tokens to be accepted and saved[cite: 5].

## Architectural, Security, i18n & SEO Rules
1.  **Strict Boundary Separation:** Admin routes and Public routes remain strictly isolated[cite: 5]. Admin routes are protected by middleware and Supabase Auth[cite: 5].
2.  **Action-Based Access Control (ABAC) & DRY Guards:** Admin authorization is handled via a strict TypeScript Master Matrix (`lib/permissions.ts`)[cite: 5]. Application code must never check a user's role directly; it must only verify if the user's role array grants authorization for a specific action key (e.g., `hasPermission(roles, 'forms:delete')`)[cite: 5]. To preserve DRY principles, all security boundaries must utilize the utilities in `lib/auth-guards.ts`: `withPermission` (Higher-Order Function for Server Actions) and `requirePermission` (Top-level Server Component redirect guard). Privilege escalation is mitigated by hard server-side self-edit blocks and confining `super_admin` assignments to database-level access only[cite: 5].
3.  **Supabase Client/Server Separation:** Always use the server client (`lib/supabase/server.ts`) in Server Components and Server Actions[cite: 5].
4.  **Chinese-First Priority & i18n Chain:** Traditional Chinese is the primary site language[cite: 5]. All arbitrary fallback decisions, default site identity strings, and metadata prioritize Chinese (`/zh`)[cite: 5]. User-generated strings follow the fallback chain: `Current Language` ➔ `Other Language (Chinese Priority)` ➔ `Data Key / Default`[cite: 5].
5.  **Polymorphic SEO Factory:** All public routes generate `<head>` tags via a shared `lib/seo.ts` factory utility (`constructMetadata`), producing standard Open Graph, Twitter card, canonical, and `hreflang` tags[cite: 5].
6.  **Edge Caching (GFW Mitigation):** Public-facing routes (Forms, Posts, Events) must utilize dynamic route segments (`/[slug]`) rather than URL query parameters to ensure compatibility with Next.js Static Generation (SSG) and aggressive CDN edge caching[cite: 5].
7.  **Hybrid Authentication Flow (PKCE & Implicit):** Due to Next.js App Router and middleware constraints, authentication relies on a dual-strategy[cite: 5]. User-initiated actions (Password Reset) utilize the PKCE flow with a secure server-side callback (`/admin/auth/callback`)[cite: 5]. Admin-initiated actions (Team Invites via Service Role) utilize the legacy Implicit Flow (`#access_token`), requiring targeted middleware whitelisting and manual client-side URL hash extraction upon component mount to prevent Next.js from swallowing the token during navigation[cite: 5].