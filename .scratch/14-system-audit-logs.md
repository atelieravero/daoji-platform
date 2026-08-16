# 14. System Audit Logs & Activity Tracking

## Objective
Implement a lightweight, Supabase-style event logging system with a dedicated `audit_logs` PostgreSQL table, a non-blocking logger utility, and an admin Log Explorer interface restricted by RBAC capability guards (`logs:view`).

## Context
As the platform manages sensitive applicant data, role assignments, and form lifecycles, team admins require visibility into mutation and authentication activities. Drawing inspiration from Supabase's Log Explorer, the logging architecture uses an event-driven, JSONB-backed schema that records the actor, action type, severity level, target entity, and arbitrary metadata diffs without requiring ongoing schema migrations.

## Technical Constraints
*   **Database Schema (`audit_logs` table in `supabase/migrations/00_init_schema.sql`):**
    *   `id`: UUID Primary Key (`gen_random_uuid()`).
    *   `created_at`: TIMESTAMPTZ (Default `NOW()`).
    *   `actor_id`: UUID nullable (Foreign key reference to `auth.users(id)` ON DELETE SET NULL).
    *   `actor_email`: TEXT (Captured at time of action).
    *   `action`: TEXT (Dot-delimited action key, e.g., `team.member_invited`, `team.role_updated`, `team.status_changed`, `form.status_updated`, `form.created`).
    *   `level`: TEXT (`info` | `warn` | `error`, default `info`).
    *   `target_type`: TEXT nullable (e.g., `team_member`, `form`, `submission`, `file`).
    *   `target_id`: TEXT nullable (ID of affected resource).
    *   `metadata`: JSONB (Default `'{}'::jsonb` for flexible payload storage like diffs, client info, or error messages).
    *   **Indexes:** B-tree indexes on `created_at DESC` and `action`.
*   **Logger Utility (`lib/audit.ts`):**
    *   Export a non-blocking helper `logEvent({ ... })`.
    *   Always wrap inserts in `try/catch` using the Supabase Service Role client so log write failures never block core user mutations.
*   **RBAC & Action Guard:**
    *   Verify `logs:view` action key in `lib/permissions.ts` (granted to `super_admin` by default).
    *   Enforce `requirePermission('logs:view')` in `app/admin/logs/page.tsx`.
*   **Supabase-Style Log Explorer UI (`app/admin/logs/`):**
    *   **Timeline View:** Chronological dense tabular list with monospace timestamps, level tags (`INFO`, `WARN`, `ERROR`), action badges, and actor emails.
    *   **Search & Filter:** Keyword search over action, actor email, and target ID, plus severity level filtering.
    *   **Expandable JSON Drawer/Row:** Clicking a log entry reveals an indented, formatted JSON code block of `metadata`.

## Acceptance Criteria

### Phase 1: Database Schema & Logger Helper
- [ ] Add `audit_logs` table creation and index definitions to `supabase/migrations/00_init_schema.sql` (or migration file).
- [ ] Implement `lib/audit.ts` containing the non-blocking `logEvent` utility.
- [ ] Ensure `logs:view` capability is defined in `lib/permissions.ts` Master Matrix.

### Phase 2: Hooking Core Mutations & Security Events
- [ ] Instrument team actions (`inviteTeamMember`, `updateTeamMemberRoles`, `updateTeamMemberStatus`, `resendInvite`).
- [ ] Instrument form mutations (creation, updates, status changes).
- [ ] Instrument file proxy access/denial events where relevant.

### Phase 3: Log Explorer UI
- [ ] Create `app/admin/logs/page.tsx` with server-side `requirePermission('logs:view')` guard.
- [ ] Build `LogsClient.tsx` featuring real-time search, level filtering, and collapsible/expandable JSON metadata viewers.
- [ ] Connect the sidebar navigation item under Settings for authorized roles.