# 12. Team RBAC & Action Matrix

## Objective
Implement a robust Action-Based Access Control (ABAC) system utilizing a strict TypeScript Master Matrix to manage admin privileges, protect sensitive routes, and prevent privilege escalation[cite: 8].

## Context
As the platform grows, simple role checks (e.g., "is user admin") become brittle and cause technical debt[cite: 8]. To future-proof the application, the platform is adopting an Action-Based Access Control (ABAC) pattern[cite: 8]. The database will securely store a user's assigned roles as an array (e.g., `['form_editor', 'content_editor']`), but the application logic will exclusively check against specific action keys (e.g., `forms:delete`, `team:manage_workers`)[cite: 8]. The canonical map bridging roles to allowed actions will live in a strictly typed TypeScript dictionary (`lib/permissions.ts`) to ensure perfect autocomplete, zero database latency during permission checks, and strict compiler safety[cite: 8].

## Technical Constraints
*   **Database Schema:** A new public `team_members` table must link to Supabase's hidden `auth.users` table via a foreign key[cite: 8]. It will store the user's `email`, `display_name`, `roles` (`TEXT[]` array), and `status` (`active`/`suspended`/`invited`)[cite: 8].
*   **TypeScript Matrix:** `lib/permissions.ts` must export a strongly typed `SystemAction` union and a unified `hasPermission(roles, action)` utility function[cite: 8].
*   **DRY Security Guards:** To prevent boilerplate and human error, all server-side permission checks must be routed through centralized utilities in `lib/auth-guards.ts`[cite: 8]. Server Actions must be wrapped in a `withPermission` Higher-Order Function (HOF), and Server Components must use a `requirePermission` guard at the top of the file to trigger 403 redirects[cite: 8].
*   **Privilege Escalation Prevention:**
    *   **Self-Edit Block:** Users are strictly prohibited from modifying their own roles or status[cite: 8].
    *   **Super Admin Isolation:** The ability to grant or revoke the `super_admin` role is completely removed from the UI and backend logic[cite: 8]. This is a database-only operation[cite: 8].
*   **UI Dashboard:** An interface at `app/admin/team` must allow authorized users to view the team, invite new workers, update worker roles via a multi-select dropdown, and suspend access[cite: 8].
*   **Hybrid Authentication Flow:** To navigate Next.js SSR middleware constraints, the application uses a dual-auth architecture[cite: 8]. User-initiated flows (Password Resets) use Server-Side Code Exchange (PKCE) via a server callback[cite: 8]. Admin-initiated flows (Team Invites) use the legacy Implicit Flow, utilizing a manual client-side URL hash extractor on the `/admin/setup-password` page to secure the session before the Next.js router intercepts the hash[cite: 8].
*   **Automated User Activation:** A PostgreSQL trigger must listen for the initial password creation event on `auth.users` to synchronously update the user's status from `invited` to `active` in the `team_members` table, ensuring no user is left in an authentication limbo state.

## Acceptance Criteria
**Phase 1: Authentication & Invites (Completed)**
- [x] Build `app/admin/auth/callback/route.ts` to intercept PKCE codes for password resets and bypass middleware blocks[cite: 8].
- [x] Implement manual URL hash extraction in `app/admin/setup-password/page.tsx` to reliably parse Implicit Flow invite tokens and establish sessions[cite: 8].
- [x] Whitelist setup and callback routes in `proxy.ts` middleware to ensure the client-side parser can load[cite: 8].
- [x] Implement `app/admin/forgot-password/page.tsx` utilizing the unified PKCE callback pipeline[cite: 8].

**Phase 2: Core RBAC Implementation (Pending)**
- [ ] Execute `03_create_team_members.sql` migration to create the `team_members` table with the `roles` array and necessary indexes[cite: 8].
- [ ] Build `lib/permissions.ts` defining the roles, the master matrix of actions, and the multi-role `hasPermission` utility[cite: 8].
- [ ] Build `lib/auth-guards.ts` establishing the `withPermission` (Server Action HOF) and `requirePermission` (Page Guard) DRY utilities[cite: 8].
- [ ] Build the Admin Team Dashboard (`app/admin/team/page.tsx`) for user management, incorporating multi-select arrays[cite: 8].
- [ ] Implement Server Actions with strict Self-Edit blocks and Super Admin protection rules[cite: 8].
- [ ] Implement the `activate_invited_user` PostgreSQL database trigger to automatically update status from `invited` to `active` upon initial password setup.