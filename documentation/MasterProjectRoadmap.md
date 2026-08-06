Daoji Platform - Master Project Roadmap

Based on the full repository architecture (Next.js App Router, next-intl, Supabase, Tailwind), here are the sequential steps required to complete the platform.

Phase 1: Design System & Shared UI (✅ We are here)

Goal: Establish accessible, reusable building blocks to ensure consistency and speed up future development.

Completed: Abstracted FormInput and FormSelect into components/ui/FormControls.tsx.

Completed: Fixed global font color contrast and placeholder legibility.

Completed: Refactored /admin/tags and /admin/editor/[id] to use DRY components.

Phase 2: Admin Dashboard Standardization (Next Immediate Steps)

Goal: Bring the rest of the /admin portal up to the new UI standards.

Step 2.1: Refactor /admin/events, /admin/resources, /admin/pages, and /admin/team using the new FormControls.tsx.

Step 2.2: Update the Dynamic Forms Builder (/admin/forms/builder) and Forms list (/admin/forms).

Step 2.3: Standardize the logs dashboard (/admin/logs) and form submissions view (/admin/forms/[form_id]/submissions).

Phase 3: Backend Integration & Authentication (Supabase)

Goal: Replace mock data with live database connections and secure the admin portal.

Step 3.1: Implement Supabase Auth for the /admin/login page. Protect all /admin/* routes via middleware.

Step 3.2: Wire up lib/supabase/client.ts and server.ts to perform CRUD operations for Tags, Events, Resources, and Pages.

Step 3.3: Connect the Unified Editor's "Save" functionality to write JSON blocks directly to the Supabase database.

Phase 4: Public Portal & Internationalization (i18n)

Goal: Connect the frontend [locale] routes to the database and ensure seamless English/Traditional Chinese support.

Step 4.1: Wire components/shared/PostDiscoveryFeed.tsx to fetch published events and resources from Supabase.

Step 4.2: Populate public detail pages (/[locale]/events/[id], /[locale]/resources/[id], /[locale]/[slug]).

Step 4.3: Audit i18n/request.ts and ensure all static UI text is properly mapped in messages/en.json and messages/zh.json.

Phase 5: Dynamic Applications System

Goal: Launch the custom form builder and user application flows.

Step 5.1: Finalize the data schema for saving custom form templates from /admin/forms/builder.

Step 5.2: Build out the public-facing application flow at /[locale]/apply/[form_id] to render dynamic inputs.

Step 5.3: Ensure form submissions securely write to Supabase and correctly display in the admin submissions dashboard.