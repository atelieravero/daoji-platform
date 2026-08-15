# 12. Team RBAC & Action Matrix

## Objective
Implement a robust Action-Based Access Control (ABAC) system utilizing a strict TypeScript Master Matrix to manage admin privileges, protect sensitive routes, and prevent privilege escalation[cite: 18].

## Context
As the platform grows, simple role checks (e.g., "is user admin") become brittle and cause technical debt[cite: 18]. To future-proof the application, the platform is adopting an Action-Based Access Control (ABAC) pattern[cite: 18]. The database securely stores a user's assigned roles as an array (e.g., `['form_editor', 'content_editor']`), while application logic exclusively checks against specific action keys (e.g., `forms:delete`, `team:manage_workers`)[cite: 18]. The canonical map bridging roles to allowed actions lives in a strictly typed TypeScript dictionary (`lib/permissions.ts`) to ensure autocomplete, zero database latency during permission checks, and strict compiler safety[cite: 18].

## Technical Constraints
*   **Database Schema:** A public `team_members` table links to Supabase's hidden `auth.users` table via a foreign key[cite: 18]. It stores the user's `email`, `display_name`, `roles` (`TEXT[]` array), and `status` (`active` | `suspended` | `invited`)[cite: 18].
*   **Single Source of Truth (TypeScript Matrix):** `lib/permissions.ts` acts as the authority for the RBAC system[cite: 18], exporting:
    *   A strongly typed `SystemAction` union and unified `hasPermission(roles, action)` utility function[cite: 18].
    *   `ROLE_DEFINITIONS`: Centralized UI labels and granular descriptions for all roles[cite: 18].
    *   `ROLE_ASSIGNMENT_AUTHORITY`: A strict mapping defining which roles have the authority to assign or revoke other roles[cite: 18].
*   **DRY Security Guards:** All server-side permission checks route through centralized utilities in `lib/auth-guards.ts`[cite: 18]:
    *   Server Actions are wrapped in a `withPermission` Higher-Order Function (HOF)[cite: 18].
    *   Server Components use a `requirePermission` guard at the top of the file to trigger redirects[cite: 18].
    *   Both guards strictly enforce `status === 'active'`.
*   **Hard Ejection for Inactive/Suspended Accounts:**
    *   **`login/actions.ts`:** Validates `team_members.status` immediately upon authentication, terminating unauthorized sessions before layout mount.
    *   **`app/admin/layout.tsx` & `app/admin/page.tsx`:** Checks `status === 'active'` server-side; invalid sessions trigger immediate `signOut()` and redirect to `/admin/login?error=account_suspended`.
*   **Privilege Escalation Prevention:**
    *   **Self-Edit Block:** Users are strictly prohibited from modifying their own roles or status[cite: 18].
    *   **Super Admin Isolation:** Granting or revoking `super_admin` is completely excluded from the UI and application layer[cite: 18].
    *   **Dynamic Hierarchy Validation:** UI components and Server Actions filter role options using `canAssignRole` against `ROLE_ASSIGNMENT_AUTHORITY`[cite: 18].
*   **Status & Onboarding Lifecycle:**
    *   **Activation:** Transitions from `invited` to `active` via `completePasswordSetup` upon initial password creation[cite: 18].
    *   **Status Immutability:** Accounts cannot be manually demoted back to `invited`; managers can only toggle between `active` and `suspended`.
    *   **Resend Invites:** `resendInvite` action re-triggers email onboarding exclusively for pending `invited` accounts.
*   **UI Dashboard & Layout Shell:** 
    *   `app/admin/team`: Responsive directory displaying summary metrics, search/status filters, initial avatars, role badges, and non-clipping action menus.
    *   `app/admin/layout.tsx`: Dynamic navigation filtering ("Silent Denial")[cite: 14, 18].
    *   `app/admin/page.tsx`: Capability-based routing redirecting users to their primary authorized module[cite: 18].
*   **Unified Password Setup & Recovery:**
    *   **Invites:** Direct Implicit Flow redirect to `/admin/setup-password`, where client-side hash parsing establishes the initial session before password submission[cite: 18].
    *   **Password Resets:** PKCE code exchange via `/admin/auth/callback` before redirecting to `/admin/setup-password`[cite: 18].

## Acceptance Criteria
**Phase 1: Authentication & Invites (Completed)**
- [x] Build `app/admin/auth/callback/route.ts` to intercept PKCE codes for password resets[cite: 18].
- [x] Implement URL hash extraction and session setting in `app/admin/setup-password/page.tsx`[cite: 18].
- [x] Whitelist setup, forgot-password, and callback routes in `proxy.ts` middleware and Supabase URL Configuration[cite: 18].
- [x] Implement `app/admin/forgot-password/page.tsx` utilizing the PKCE callback pipeline[cite: 18].

**Phase 2: Core RBAC Implementation (Completed)**
- [x] Execute migration scripts creating and indexing the `team_members` table (`roles` GIN index, self-read RLS policy)[cite: 18].
- [x] Build `lib/permissions.ts` defining roles, UI definitions, assignment authority, and action matrix[cite: 18].
- [x] Build `lib/auth-guards.ts` with `withPermission` and `requirePermission` verifying active account status[cite: 18].
- [x] Build `app/admin/team/page.tsx` and Server Actions (`inviteTeamMember`, `updateTeamMemberRoles`, `updateTeamMemberStatus`, `resendInvite`)[cite: 18].
- [x] Implement Silent Denial in `app/admin/layout.tsx` and server-side capability routing in `app/admin/page.tsx`[cite: 14, 18].
- [x] Implement `completePasswordSetup` server action to transition `invited` accounts to `active` deterministically[cite: 18].

**Phase 3: Final Integrations & Page Reviews (Completed)**
- [x] Refactor `app/admin/team` UI/UX: metric overview cards, search/status filters, user-initial avatars, role chips, and non-clipping menus.
- [x] Forbid downgrading `active` members to `invited` and implement dedicated invite resend handling.
- [x] Guard `app/admin/forms/page.tsx` and `app/admin/logs/page.tsx` with `requirePermission`.
- [x] Complete PKCE password recovery verification.
- [x] Smoke test RBAC matrix permissions across `super_admin`, `team_manager`, `form_editor`, and `submission_viewer`.