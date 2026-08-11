# 11. Form Slug Routing & Edge Caching

## Objective
Migrate public form access from UUID query parameters (`?id=...`) to dynamic URL slugs (`/[slug]`) to enable Next.js static generation, maximizing Cloudflare edge caching for users behind the Great Firewall (GFW).[cite: 19]

## Context
Currently, forms are accessed via a dynamic query parameter (`/en/form?id=uuid`).[cite: 19] Next.js fundamentally treats query parameters as dynamic requests, bypassing static caching and forcing a server-side database fetch for every visitor.[cite: 19] For users in mainland China, this introduces significant latency and packet loss risks.[cite: 19] By migrating to a slug-based URL structure (`/zh/form/summer-retreat`), Next.js can statically generate (SSG) the form page along with its SEO metadata.[cite: 19] This static HTML can then be heavily cached at Cloudflare's Edge nodes, ensuring instantaneous loading times regardless of database latency.[cite: 19]

## Technical Constraints
*   **Database Schema:** The `forms` table must be updated to include a `slug` column (`TEXT UNIQUE`).[cite: 19]
*   **Relational Integrity:** The internal UUID (`id`) must still be used for relational data (e.g., binding `submissions` to `forms`) to prevent breakage if a slug is later renamed.[cite: 19]
*   **Admin UI:** The Form Builder must include a new validation-enforced input field for administrators to define the URL slug (alphanumeric and hyphens only).[cite: 19]
*   **Route Restructuring:** The public form route must be physically moved from `app/[locale]/form/page.tsx` to `app/[locale]/form/[slug]/page.tsx`.[cite: 19]

## Acceptance Criteria
- [x] Write a `.sql` migration script to add the `slug` column (with a unique constraint) to the `forms` table.[cite: 19]
- [x] Update the Admin Form Builder UI to allow users to input and edit the form `slug`.[cite: 19]
- [x] Move the public form route to `app/[locale]/form/[slug]/page.tsx`.[cite: 19]
- [x] Refactor `getPublicForm` to fetch the form data by `slug` instead of `id`.[cite: 19]
- [x] Ensure the submit action still properly maps the hidden `form_id` UUID into the `submissions` table.[cite: 19]