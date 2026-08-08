# Daoji Platform - Domain Model & Architecture

## Tech Stack
*   **Framework:** Next.js (App Router)
*   **Styling:** Tailwind CSS
*   **Backend/Auth:** Supabase
*   **Storage:** Cloudflare R2 bucket utilizing standard `@aws-sdk/client-s3` for GFW resilience, zero egress fees, and easy migration to AliCloud OSS.
*   **Internationalization:** `next-intl`
*   **External Brain:** Coda (Daoji Platform acts as a "dumb pipe")
*   **Infrastructure:** Vercel Hosting + Cloudflare Reverse Proxy (for Mainland China GFW mitigation).

## Core Domains & Paths
*   **Public Shell:** `app/[locale]/` (Events, Resources, Form Applications)
*   **Admin Dashboard:** `app/admin/` (Events, Forms Builder, Submissions, Team)
*   **Forms Builder:** `app/admin/forms/builder/page.tsx`
*   **Public Form Renderer:** `app/[locale]/form/page.tsx`
*   **Submissions View:** `app/admin/forms/[form_id]/submissions/page.tsx`
*   **Secure File Proxy:** `app/admin/file/route.ts`

## Data Modeling & Schema
1.  **Forms Table:** Single `forms` table in Supabase. Dynamic field structures and configuration (like `isStandalone` and `interimEventCode`) are stored in a `JSONB` `schema` column. Includes `id`, `event_id`, `title`, boolean `is_followup`, string `status` (draft/open/closed), and `created_at`.
2.  **Submissions Table:** Single `submissions` table. Dynamic responses are in `JSONB` `response`. Linked via `form_id`, `event_id`, and `applicant_token`. Includes `is_test` and `is_processed` boolean flags.

## Forms & Magic Token Lifecycle
1.  **Event Linkage:** Every dynamic form and submission is explicitly bound to an `event_id` and utilizes an `interimEventCode` prefix defined in the form schema.
2.  **Magic Token Identity:** Applicants are tracked via an `applicant_token` (Formatted as `EVENTCODE-XXXX-XXXX`):
    *   **Initial Forms (`is_followup: false`):** Generates a new unique token upon successful submission and displays it to the user.
    *   **Follow-up Forms (`is_followup: true`):** Strictly require a valid token provided via URL search parameters or manual inline entry. 
3.  **Data View & Coda Handoff:** Admins use a dynamic table view to show/hide/reorder columns. File uploads render as clickable proxy links (`/admin/file?path=...`). Exporting a CSV automatically prepends Event/Form identifiers and toggles `is_processed: true` in the database.
4.  **Testing & Previews:** Previewing a form appends `?test=true`. Test submissions are tagged `is_test: true` and bypass strict token validation, allowing dummy tokens to be accepted and saved.

## Architectural & i18n Rules
1.  **Strict Boundary Separation:** Admin routes and Public routes remain strictly isolated. Admin routes are protected by middleware and Supabase Auth.
2.  **Supabase Client/Server Separation:** Always use the server client (`lib/supabase/server.ts`) in Server Components and Server Actions.
3.  **i18n & Chain of Collapse Fallback:** Static public text routes through imported JSON dictionaries (`messages/en.json`, `messages/zh.json`). User-generated form strings follow a fallback chain: `Current Language` -> `Other Language` -> `Data Key / Option Label` -> `Nil`.