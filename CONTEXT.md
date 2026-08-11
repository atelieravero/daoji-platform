# Daoji Platform - Domain Model & Architecture

## Tech Stack
*   **Framework:** Next.js (App Router)[cite: 9]
*   **Styling:** Tailwind CSS[cite: 9]
*   **Backend/Auth:** Supabase[cite: 9]
*   **Storage:** Dual Cloudflare R2 bucket architecture utilizing `@aws-sdk/client-s3`. Private bucket for secure applicant submissions. Public bucket with a CDN URL for public-facing web assets (banners, images).[cite: 9]
*   **Internationalization:** `next-intl`[cite: 9]
*   **External Brain:** Coda (Daoji Platform acts as a "dumb pipe")[cite: 9]
*   **Infrastructure:** Vercel Hosting + Cloudflare Reverse Proxy (for Mainland China GFW mitigation).[cite: 9]

## Core Domains & Paths
*   **Public Shell:** `app/[locale]/` (Events, Resources, Form Applications)[cite: 9]
*   **Admin Dashboard:** `app/admin/` (Events, Forms Builder, Submissions, Team)[cite: 9]
*   **Forms Builder:** `app/admin/forms/builder/page.tsx`[cite: 9]
*   **Public Form Renderer:** `app/[locale]/form/page.tsx`[cite: 9]
*   **Submissions View:** `app/admin/forms/[form_id]/submissions/page.tsx`[cite: 9]
*   **Secure File Proxy:** `app/admin/file/route.ts`[cite: 9]

## Data Modeling & Schema
1.  **Forms Table:** Single `forms` table in Supabase. Dynamic field structures and configuration are stored in a `JSONB` `schema` column, including `isStandalone`, `interimEventCode`, `bannerImageUrl`, `successTitleEn/Zh`, and `successMessageEn/Zh`. Includes `id`, `event_id`, `title`, boolean `is_followup`, string `status` (draft/open/closed), and `created_at`.[cite: 9]
2.  **Submissions Table:** Single `submissions` table. Dynamic responses are in `JSONB` `response`. Linked via `form_id`, `event_id`, and `applicant_token`. Includes `is_test` and `is_processed` boolean flags, and an auto-generated integer `applicant_seq_num`.[cite: 9]

## Forms & Magic Token Lifecycle
1.  **Event Linkage:** Every dynamic form and submission is explicitly bound to an `event_id` and utilizes an `interimEventCode` prefix defined in the form schema.[cite: 9]
2.  **Magic Token Identity:** Applicants are tracked via an `applicant_token` (Formatted as `EVENTCODE-XXXX-XXXX`):[cite: 9]
    *   **Initial Forms (`is_followup: false`):** Generates a new unique token upon successful submission. Forms support a custom `{{TOKEN_BOX}}` replacement tag in the Markdown success message to dictate exact visual placement.[cite: 9]
    *   **Follow-up Forms (`is_followup: true`):** Strictly require a valid token provided via URL search parameters or manual inline entry.[cite: 9] 
3.  **Human-Readable Sequencing:** A PL/pgSQL database trigger intercepts every submission. It checks the `applicant_token` against the `event_id`. If it's a follow-up, it inherits the existing sequence number. If it's a new token, it assigns `MAX(applicant_seq_num) + 1`, preventing race conditions.
4.  **Data View & Coda Handoff:** Admins use a dynamic table view to show/hide/reorder columns. File uploads render as clickable proxy links (`/admin/file?path=...`). Exporting a CSV automatically prepends Event/Form identifiers and toggles `is_processed: true` in the database.[cite: 9]
5.  **Testing & Previews:** Previewing a form appends `?test=true`. Test submissions are tagged `is_test: true` and bypass strict token validation, allowing dummy tokens to be accepted and saved.[cite: 9]

## Architectural & i18n Rules
1.  **Strict Boundary Separation:** Admin routes and Public routes remain strictly isolated. Admin routes are protected by middleware and Supabase Auth.[cite: 9]
2.  **Supabase Client/Server Separation:** Always use the server client (`lib/supabase/server.ts`) in Server Components and Server Actions.[cite: 9]
3.  **i18n & Chain of Collapse Fallback:** Static public text routes through imported JSON dictionaries (`messages/en.json`, `messages/zh.json`). User-generated form strings follow a fallback chain: `Current Language` -> `Other Language` -> `Data Key / Option Label` -> `Nil`.[cite: 9]