# Daoji Platform - Domain Model & Architecture

## Tech Stack
*   **Framework:** Next.js (App Router)[cite: 16]
*   **Styling:** Tailwind CSS[cite: 16]
*   **Backend/Auth:** Supabase[cite: 16]
*   **Storage:** Dual Cloudflare R2 bucket architecture utilizing `@aws-sdk/client-s3`. Private bucket for secure applicant submissions. Public bucket with a CDN URL for public-facing web assets (banners, images).[cite: 16]
*   **Internationalization:** `next-intl`[cite: 16]
*   **External Brain:** Coda (Daoji Platform acts as a "dumb pipe")[cite: 16]
*   **Infrastructure:** Vercel Hosting + Cloudflare Reverse Proxy (for Mainland China GFW mitigation).[cite: 16]

## Core Domains & Paths
*   **Public Shell:** `app/[locale]/` (Events, Resources, Form Applications)[cite: 16]
*   **Admin Dashboard:** `app/admin/` (Events, Forms Builder, Submissions, Team)[cite: 16]
*   **Forms Builder:** `app/admin/forms/builder/page.tsx`[cite: 16]
*   **Public Form Renderer:** `app/[locale]/form/[slug]/page.tsx` (Slug-based for edge caching)
*   **Submissions View:** `app/admin/forms/[form_id]/submissions/page.tsx`[cite: 16]
*   **Secure File Proxy:** `app/admin/file/route.ts`[cite: 16]
*   **SEO Factory Utility:** `lib/seo.ts`[cite: 16]

## Data Modeling & Schema
1.  **Forms Table:** Single `forms` table in Supabase. Dynamic field structures and configuration are stored in a `JSONB` `schema` column, including `isStandalone`, `interimEventCode`, `bannerImageUrl`, `successTitleEn/Zh`, and `successMessageEn/Zh`. Includes `id` (UUID), `slug` (Unique String), `event_id`, `title`, boolean `is_followup`, string `status` (draft/open/closed), and `created_at`.
2.  **Submissions Table:** Single `submissions` table. Dynamic responses are in `JSONB` `response`. Linked via `form_id` (UUID), `event_id`, and `applicant_token`. Includes `is_test` and `is_processed` boolean flags, and an auto-generated integer `applicant_seq_num`.[cite: 16]
3.  **Database Indexing & Version Control:** Core logic (tables, sequence generation functions, composite indexes for performance) is persisted directly in raw `.sql` files within the repository (e.g., `supabase/migrations/`) to act as the source of truth and ensure cloud portability.[cite: 16]

## Forms & Magic Token Lifecycle
1.  **Event Linkage:** Every dynamic form and submission is explicitly bound to an `event_id` and utilizes an `interimEventCode` prefix defined in the form schema.[cite: 16]
2.  **Magic Token Identity:** Applicants are tracked via an `applicant_token` (Formatted as `EVENTCODE-XXXX-XXXX`):[cite: 16]
    *   **Initial Forms (`is_followup: false`):** Generates a new unique token upon successful submission. Forms support a custom `{{TOKEN_BOX}}` replacement tag in the Markdown success message to dictate exact visual placement.[cite: 16]
    *   **Follow-up Forms (`is_followup: true`):** Strictly require a valid token provided via URL search parameters or manual inline entry.[cite: 16]
3.  **Human-Readable Sequencing:** A PL/pgSQL database trigger intercepts every submission. It checks the `applicant_token` against the `event_id`. If it's a follow-up, it inherits the existing sequence number. If it's a new token, it assigns `MAX(applicant_seq_num) + 1`, preventing race conditions.[cite: 16]
4.  **Data View & Coda Handoff:** Admins use a dynamic table view to show/hide/reorder columns. File uploads render as clickable proxy links (`/admin/file?path=...`). Exporting a CSV automatically prepends Event/Form identifiers and toggles `is_processed: true` in the database.[cite: 16]
5.  **Testing & Previews:** Previewing a form appends `?test=true`. Test submissions are tagged `is_test: true` and bypass strict token validation, allowing dummy tokens to be accepted and saved.[cite: 16]

## Architectural, i18n & SEO Rules
1.  **Strict Boundary Separation:** Admin routes and Public routes remain strictly isolated. Admin routes are protected by middleware and Supabase Auth.[cite: 16]
2.  **Supabase Client/Server Separation:** Always use the server client (`lib/supabase/server.ts`) in Server Components and Server Actions.[cite: 16]
3.  **Chinese-First Priority & i18n Chain:** Traditional Chinese is the primary site language. All arbitrary fallback decisions, default site identity strings, and metadata prioritize Chinese (`/zh`). User-generated strings follow the fallback chain: `Current Language` ➔ `Other Language (Chinese Priority)` ➔ `Data Key / Default`.[cite: 16]
4.  **Polymorphic SEO Factory:** All public routes generate `<head>` tags via a shared `lib/seo.ts` factory utility (`constructMetadata`), producing standard Open Graph, Twitter card, canonical, and `hreflang` tags.[cite: 16]
5.  **Edge Caching (GFW Mitigation):** Public-facing routes (Forms, Posts, Events) must utilize dynamic route segments (`/[slug]`) rather than URL query parameters to ensure compatibility with Next.js Static Generation (SSG) and aggressive CDN edge caching.