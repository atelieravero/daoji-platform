# Daoji Platform - Domain Model & Architecture

## Tech Stack
*   **Framework:** Next.js (App Router)
*   **Styling:** Tailwind CSS
*   **Backend/Auth:** Supabase
*   **Internationalization:** `next-intl`
*   **External Brain:** Coda (Daoji Platform acts as a "dumb pipe")

## Core Domains & Paths
*   **Public Shell:** `app/[locale]/` (Events, Resources, Form Applications)
*   **Admin Dashboard:** `app/admin/` (Events, Forms Builder, Submissions, Team)
*   **Forms Builder:** `app/admin/forms/builder/page.tsx`
*   **Public Form Renderer:** `app/[locale]/apply/[form_id]/page.tsx`
*   **Shared UI Controls:** `components/ui/FormControls.tsx`

## Data Modeling & Schema
1.  **Forms Table:** Single `forms` table in Supabase. Dynamic field structures are stored in a `JSONB` `schema` column to avoid over-normalization. Includes `id`, `event_id`, `title`, boolean `is_followup` flag, and `created_at`.
2.  **Submissions Table:** Single `submissions` table in Supabase. Dynamic responses are stored in a `JSONB` `response` column, linked via `form_id`, `event_id`, and `applicant_token`.

## Forms & Magic Token Lifecycle
1.  **Event Linkage:** Every dynamic form and submission MUST be explicitly bound to an `event_id` (referencing the parent event/post).
2.  **Magic Token Identity:** Applicants are tracked statelessly across an event using an `applicant_token`:
    *   **Initial Forms (`is_followup: false`):** Do not require a token as input; generates a new unique UUID token upon submission.
    *   **Follow-up Forms (`is_followup: true`):** Strictly require a valid token provided via URL search parameters (assembled and distributed by Coda/Admin). Access is denied if missing.
3.  **Dumb Pipe Execution:** Bypasses heavy client-side validation libraries. Uses plain React state for the Admin Builder and native HTML `<form>` submissions for the Public Shell.
4.  **Data Mutations:** All form submissions route through Next.js Server Actions (`lib/supabase/server.ts`). Actions handle light input sanitization, Supabase writes, and secure handoffs to Coda (e.g., via webhooks).

## Architectural & i18n Rules
1.  **Strict Boundary Separation:** Admin routes (`app/admin/`) and Public routes (`app/[locale]/`) must remain strictly isolated. Business logic must not bleed across boundaries.
2.  **Existing Code Preservation:** Refactor existing UI layouts in `app/admin/forms/builder/page.tsx` and `app/[locale]/apply/[form_id]/page.tsx` rather than rewriting from scratch. Preserve existing `components/ui/FormControls.tsx` primitives.
3.  **Supabase Client/Server Separation:** Maintain clear separation between browser client (`lib/supabase/client.ts`) and server client (`lib/supabase/server.ts`). Always use the server client in Server Components and Server Actions.
4.  **i18n & Chain of Collapse Fallback:** Static public text routes through `next-intl` (`messages/en.json`, `messages/zh.json`). User-generated form strings follow a strict fallback chain in `lib/utils.ts`: `Current Language` -> `Other Language` -> `Data Key / Option Label` -> `Nil`.