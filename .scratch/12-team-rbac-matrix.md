# 12. Team RBAC & Action Matrix

## Objective
Implement a robust Action-Based Access Control (ABAC) system utilizing a strict TypeScript Master Matrix to manage admin privileges, protect sensitive routes, and prevent privilege escalation[cite: 18].

## Context
As the platform grows, simple role checks (e.g., "is user admin") become brittle and cause technical debt[cite: 18]. To future-proof the application, the platform is adopting an Action-Based Access Control (ABAC) pattern[cite: 18]. The database will securely store a user's assigned roles as an array (e.g., `['form_editor', 'content_editor']`), but the application logic will exclusively check against specific action keys (e.g., `forms:delete`, `team:manage_workers`)[cite: 18]. The canonical map bridging roles to allowed actions lives in a strictly typed TypeScript dictionary (`lib/permissions.ts`) to ensure perfect autocomplete, zero database latency during permission checks, and strict compiler safety[cite: 18].

## Technical Constraints
*   **Database Schema:** A public `team_members` table links to Supabase's hidden `auth.users` table via a foreign key[cite: 18]. It stores the user's `email`, `display_name`, `roles` (`TEXT[]` array), and `status` (`active`/`suspended`/`invited`)[cite: 18].
*   **Single Source of Truth (TypeScript Matrix):** `lib/permissions.ts` acts as the authority for the RBAC system[cite: 18], exporting:
    *   A strongly typed `SystemAction` union and unified `hasPermission(roles, action)` utility function[cite: 18].
    *   `ROLE_DEFINITIONS`: Centralized UI labels and descriptions for all roles[cite: 18].
    *   `ROLE_ASSIGNMENT_AUTHORITY`: A strict mapping defining which roles have the authority to assign or revoke other roles[cite: 18].
*   **DRY Security Guards:** All server-side permission checks route through centralized utilities in `lib/auth-guards.ts`[cite: 18]. Server Actions are wrapped in a `withPermission` Higher-Order Function (HOF), and Server Components use a `requirePermission` guard at the top of the file to trigger redirects[cite: 18].
*   **Privilege Escalation Prevention:**
    *   **Self-Edit Block:** Users are strictly prohibited from modifying their own roles or status[cite: 18].
    *   **Super Admin Isolation:** Granting or revoking `super_admin` is completely excluded from the UI and application layer[cite: 18].
    *   **Dynamic Hierarchy Validation:** Server Actions utilize `canAssignRole` against `ROLE_ASSIGNMENT_AUTHORITY` to dynamically authorize or reject role modifications[cite: 18].
*   **UI Dashboard & Layout Shell:** 
    *   An interface at `app/admin/team` allows authorized users to view team members, invite new workers, update roles via a multi-select dropdown, and adjust status[cite: 18].
    *   `app/admin/layout.tsx` implements "Silent Denial", utilizing `hasPermission` to filter navigation links and exempting standalone auth screens (`/admin/login`, `/admin/setup-password`, `/admin/forgot-password`) from the sidebar shell[cite: 14, 18].
    *   `app/admin/page.tsx` evaluates user capabilities server-side to redirect to the first authorized module[cite: 18].
*   **Unified Password Setup & Recovery:**
    *   **Invites:** Direct Implicit Flow redirect to `/admin/setup-password`, where client-side hash parsing establishes the initial session before password submission[cite: 15, 18].
    *   **Password Resets:** PKCE code exchange via `/admin/auth/callback` before redirecting to `/admin/setup-password`[cite: 16, 18].
*   **Deterministic Activation:** Account status transitions from `invited` to `active` via the `completePasswordSetup` Server Action upon successful password submission[cite: 15].

## Acceptance Criteria
**Phase 1: Authentication & Invites (Completed)**
- [x] Build `app/admin/auth/callback/route.ts` to intercept PKCE codes for password resets[cite: 18].
- [x] Implement URL hash extraction and session setting in `app/admin/setup-password/page.tsx`[cite: 18].
- [x] Whitelist setup, forgot-password, and callback routes in `proxy.ts` middleware and Supabase URL Configuration[cite: 18].
- [x] Implement `app/admin/forgot-password/page.tsx` utilizing the PKCE callback pipeline[cite: 18].

**Phase 2: Core RBAC Implementation (Completed)**
- [x] Execute migration scripts creating and indexing the `team_members` table (`roles` GIN index, self-read RLS policy)[cite: 12, 18].
- [x] Build `lib/permissions.ts` defining roles, UI definitions, assignment authority, and action matrix[cite: 18].
- [x] Build `lib/auth-guards.ts` with `withPermission` and `requirePermission`[cite: 18].
- [x] Build `app/admin/team/page.tsx` and Server Actions (`inviteTeamMember`, `updateTeamMemberRoles`, `updateTeamMemberStatus`) with hierarchy validation and self-edit blocks[cite: 15, 18].
- [x] Implement Silent Denial in `app/admin/layout.tsx` and server-side capability routing in `app/admin/page.tsx`[cite: 14, 18].
- [x] Implement `completePasswordSetup` server action to transition `invited` accounts to `active` deterministically[cite: 15].

**Phase 3: Final Integrations & Page Reviews (In Progress)**
- [ ] Review `app/admin/users` UI and UX: audit data layout, search/filters, responsive behaviors, and view/edit permission guards.
- [ ] Perform end-to-end verification across each role type (`super_admin`, `team_manager`, `form_editor`, `submission_viewer`, `content_editor`).