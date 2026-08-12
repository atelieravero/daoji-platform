# 12. Team RBAC & Action Matrix

## Objective
Implement a robust Action-Based Access Control (ABAC) system utilizing a strict TypeScript Master Matrix to manage admin privileges, protect sensitive routes, and enforce strict developer guardrails.

## Context
As the platform grows, simple role checks (e.g., "is user admin") become brittle and cause technical debt. To future-proof the application, the platform is adopting an Action-Based Access Control (ABAC) pattern. The database will securely store a user's role (e.g., `super_admin`, `editor`, `viewer`), but the application logic will exclusively check against specific action keys (e.g., `forms:delete`, `team:manage`). The canonical map bridging roles to allowed actions will live in a strictly typed TypeScript dictionary (`lib/permissions.ts`) to ensure perfect autocomplete, zero database latency during permission checks, and strict compiler safety.

## Technical Constraints
*   **Database Schema:** A new public `team_members` table must link to Supabase's hidden `auth.users` table via a foreign key. It will store the user's `email`, `display_name`, `role`, and `status` (`active`/`suspended`).
*   **TypeScript Matrix:** `lib/permissions.ts` must export a strongly typed `SystemAction` union and a unified `hasPermission(role, action)` utility function. Any new feature added to the platform must register its specific action key here.
*   **Middleware & Server Actions:** Next.js Server Actions and page routes must utilize the `hasPermission` utility to authorize sensitive mutations or data fetches.
*   **UI Dashboard:** An interface at `app/admin/team` must allow authorized users (e.g., `super_admin`) to view the team, invite new members, update roles via a dropdown, and suspend access.

## Acceptance Criteria
- [ ] Execute `03_create_team_members.sql` migration to create the `team_members` table and necessary indexes.
- [ ] Build `lib/permissions.ts` defining the roles, the master matrix of actions, and the `hasPermission` utility.
- [ ] Build the Admin Team Dashboard (`app/admin/team/page.tsx`) for user management.
- [ ] Update Next.js middleware and existing Server Actions to respect the new permission matrix.