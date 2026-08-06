# Daoji Platform - Domain Model & Architecture

## Tech Stack
*   **Framework:** Next.js (App Router)
*   **Styling:** Tailwind CSS
*   **Backend/Auth:** Supabase
*   **Internationalization:** `next-intl`
*   **External Brain:** Coda (Daoji Platform acts as a "dumb pipe")

## Core Domains & Terminology
*   **Public Shell:** The front-facing application (`app/[locale]/`). Includes events, resource discovery, and form applications. 
*   **Admin Dashboard:** The restricted management interface (`app/admin/`). Handles event creation, form building, team management, and logs.
*   **Forms Builder:** A core module allowing dynamic creation and management of application forms (`app/admin/forms/builder/`).

## Forms Builder & Dumb Pipe Architecture
1.  **Data Modeling:** Forms utilize a single `forms` table in Supabase. Dynamic schemas are stored in a `JSONB` column to maximize flexibility and avoid over-normalized relational structures.
2.  **State & Validation:** The platform is a "dumb pipe" optimized for low-scale, high-touch submissions (~200 per form). Avoid heavy client-side validation libraries. Use simple React state for the Admin Builder and native HTML `<form>` submissions for the Public Shell.
3.  **Data Mutations:** All form submissions route through Next.js Server Actions. These actions handle light input sanitization, Supabase writes, and the secure handoff to the Coda "brain" (e.g., via webhooks).
4.  **Internationalization (Chain of Collapse):** User-generated forms require EN and ZH inputs. To prevent UI crashes on missing data, the fallback chain is strictly: `Current Language` -> `Other Language` -> `Data Key / Option Label` -> `Nil`.

## Architectural Rules
1.  **Strict Boundary Separation:** Admin routes and Public routes must remain strictly isolated. Shared components should live in `components/shared/` or `components/ui/`, but business logic must not bleed across boundaries.
2.  **Supabase Client/Server:** Maintain clear separation between Supabase client instantiation (`lib/supabase/client.ts`) and server instantiation (`lib/supabase/server.ts`). Always use the server client in Server Components and Server Actions.
3.  **i18n Implementation:** All static public-facing text must be routed through `next-intl` utilizing the translation dictionaries (`messages/en.json`, `messages/zh.json`). Shared fallback utilities reside in `lib/utils.ts`.