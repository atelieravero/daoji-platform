# Daoji Platform - Domain Model & Architecture

## Tech Stack
*   **Framework:** Next.js (App Router)
*   **Styling:** Tailwind CSS
*   **Backend/Auth:** Supabase
*   **Internationalization:** `next-intl`

## Core Domains & Terminology
*   **Public Shell:** The front-facing application (`app/[locale]/`). Includes events, resource discovery, and form applications. 
*   **Admin Dashboard:** The restricted management interface (`app/admin/`). Handles event creation, form building, team management, and logs.
*   **Forms Builder:** A core module allowing dynamic creation and management of application forms (`app/admin/forms/builder/`).

## Architectural Rules
1.  **Strict Boundary Separation:** Admin routes and Public routes must remain strictly isolated. Shared components should live in `components/shared/` or `components/ui/`, but business logic must not bleed across boundaries.
2.  **Supabase Client/Server:** Maintain clear separation between Supabase client instantiation (`lib/supabase/client.ts`) and server instantiation (`lib/supabase/server.ts`). Always use the server client in Server Components and Server Actions.
3.  **i18n Implementation:** All static public-facing text must be routed through `next-intl` utilizing the translation dictionaries (`messages/en.json`, `messages/zh.json`).