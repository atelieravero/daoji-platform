# 12. Team RBAC & Action Matrix

## Objective
Implement a robust Action-Based Access Control (ABAC) system utilizing a strict TypeScript Master Matrix to manage admin privileges, protect sensitive routes, and prevent privilege escalation[cite: 12].

## Context
As the platform grows, simple role checks (e.g., "is user admin") become brittle and cause technical debt[cite: 12]. To future-proof the application, the platform is adopting an Action-Based Access Control (ABAC) pattern[cite: 12]. The database will securely store a user's assigned roles as an array (e.g., `['form_editor', 'content_editor']`), but the application logic will exclusively check against specific action keys (e.g., `forms:delete`, `team:manage_workers`)[cite: 12]. The canonical map bridging roles to allowed actions will live in a strictly typed TypeScript dictionary (`lib/permissions.ts`) to ensure perfect autocomplete, zero database latency during permission checks, and strict compiler safety[cite: 12].

## Technical Constraints
*   **Database Schema:** A new public `team_members` table must link to Supabase's hidden `auth.users` table via a foreign key[cite: 12]. It will store the user's `email`, `display_name`, `roles` (`TEXT[]` array), and `status` (`active`/`suspended`/`invited`)[cite: 12].
*   **Single Source of Truth (TypeScript Matrix):** `lib/permissions.ts` acts as the absolute authority for the RBAC system, exporting:
    *   A strongly typed `SystemAction` union and a unified `hasPermission(roles, action)` utility function[cite: 12].
    *   `ROLE_DEFINITIONS`: The centralized UI labels for all roles.
    *   `ROLE_ASSIGNMENT_AUTHORITY`: A strict mapping defining which roles have the authority to assign or revoke other specific roles.
*   **DRY Security Guards:** To prevent boilerplate and human error, all server-side permission checks must be routed through centralized utilities in `lib/auth-guards.ts`[cite: 12]. Server Actions must be wrapped in a `withPermission` Higher-Order Function (HOF), and Server Components must use a `requirePermission` guard at the top of the file to trigger 403 redirects[cite: 12].
*   **Privilege Escalation Prevention:**
    *   **Self-Edit Block:** Users are strictly prohibited from modifying their own roles or status[cite: 12].
    *   **Super Admin Isolation:** The ability to grant or revoke the `super_admin` role is completely removed from the UI and backend logic[cite: 12]. This is a database-only operation[cite: 12].
    *   **Dynamic Hierarchy Validation:** Server Actions must utilize a `canAssignRole` helper against the `ROLE_ASSIGNMENT_AUTHORITY` matrix to dynamically authorize or reject role modifications, replacing hardcoded `if/else` checks.
*   **UI Dashboard & Navigation:** 
    *   An interface at `app/admin/team` must allow authorized users to view the team, invite new workers, update worker roles via a multi-select dropdown, and suspend access[cite: 12].
    *   The global layout must employ a "Silent Denial" pattern, utilizing `hasPermission` to dynamically hide navigation groups the user lacks actions for.
    *   The root admin route must utilize smart server-side capability checks to seamlessly redirect users to their appropriate dashboard module without client-side flashing.
*   **Hybrid Authentication Flow:** To navigate Next.js SSR middleware constraints, the application uses a dual-auth architecture[cite: 12]. User-initiated flows (Password Resets) use Server-Side Code Exchange (PKCE) via a server callback[cite: 12]. Admin-initiated flows (Team Invites) use the legacy Implicit Flow, utilizing a manual client-side URL hash extractor on the `/admin/setup-password` page to secure the session before the Next.js router intercepts the hash[cite: 12].
*   **Automated User Activation:** A PostgreSQL trigger must listen for the initial password creation event on `auth.users` to synchronously update the user's status from `invited` to `active` in the `team_members` table, ensuring no user is left in an authentication limbo state[cite: 12].

## Acceptance Criteria
**Phase 1: Authentication & Invites (Completed)**
- [x] Build `app/admin/auth/callback/route.ts` to intercept PKCE codes for password resets and bypass middleware blocks[cite: 12].
- [x] Implement manual URL hash extraction in `app/admin/setup-password/page.tsx` to reliably parse Implicit Flow invite tokens and establish sessions[cite: 12].
- [x] Whitelist setup and callback routes in `proxy.ts` middleware to ensure the client-side parser can load[cite: 12].
- [x] Implement `app/admin/forgot-password/page.tsx` utilizing the unified PKCE callback pipeline[cite: 12].

**Phase 2: Core RBAC Implementation (Completed)**
- [x] Execute `03_create_team_members.sql` migration to create the `team_members` table with the `roles` array and necessary indexes[cite: 12].
- [x] Build `lib/permissions.ts` defining the roles, UI definitions, assignment hierarchy, the master matrix of actions, and utilities (`hasPermission`, `canAssignRole`)[cite: 12].
- [x] Build `lib/auth-guards.ts` establishing the `withPermission` (Server Action HOF) and `requirePermission` (Page Guard) DRY utilities[cite: 12].
- [x] Build the Admin Team Dashboard (`app/admin/team/page.tsx`) for user management, incorporating multi-select arrays mapped from the central definitions[cite: 12].
- [x] Implement Server Actions with strict Self-Edit blocks, Super Admin protection rules, and dynamic `canAssignRole` hierarchy loops[cite: 12].
- [x] Refactor root `app/admin/page.tsx` with smart server-side capability redirects and `app/admin/layout.tsx` with Silent Denial navigation filtering.

**Phase 3: Final Integrations (Pending)**
- [ ] Implement the `activate_invited_user` PostgreSQL database trigger to automatically update status from `invited` to `active` upon initial password setup[cite: 12].
- [ ] Ensure public user directory (`admin/users`) is protected by viewer/manager guards.