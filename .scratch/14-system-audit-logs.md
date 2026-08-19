# 14. System Audit Logs & Activity Tracking

## Objective
Implement an automated, PostgreSQL trigger-driven Change Data Capture (CDC) audit trail for `forms` and `team_members` mutations, recording actor identity snapshots, human-readable entity labels, mutation operations (`CREATE`, `UPDATE`, `DELETE`), and delta diffs into a dedicated `audit_logs` table, viewable via an admin Audit Logs Explorer protected by RBAC guards (`team:manage_workers`).

## Context
Rather than maintaining manual application-level logger calls across various endpoints, audit logging uses automated database triggers on sensitive core tables (`forms` and `team_members`). Standard server mutations execute through the User Client (`createClient()`) so PostgreSQL triggers automatically resolve `auth.uid()` to capture a write-time snapshot of the user's name and email. Read-only pipelines (`submissions`) remain static and do not trigger audit logs.

## Technical Constraints
*   **Database Schema (`audit_logs` table in `supabase/migrations/00_init_schema.sql`):**
    *   `id`: UUID Primary Key (`gen_random_uuid()`).
    *   `created_at`: TIMESTAMPTZ (Default `NOW()`).
    *   `actor_id`: UUID nullable (`auth.uid()`).
    *   `actor_name`: TEXT (Snapshot from `team_members.display_name` or `auth.users`, defaults to `'system'`).
    *   `actor_email`: TEXT (Snapshot from `team_members.email` or `auth.users`, defaults to `'system'`).
    *   `table_name`: TEXT (`forms` | `team_members`).
    *   `record_id`: TEXT (Primary key of mutated record).
    *   `record_label`: TEXT (Human-readable entity descriptor: Form Title/Slug or Member Name/Email).
    *   `operation`: TEXT (`CREATE` | `UPDATE` | `DELETE`).
    *   `old_values`: JSONB (Old row on DELETE; delta before change on UPDATE; `NULL` on CREATE).
    *   `new_values`: JSONB (New row on CREATE; delta after change on UPDATE; `NULL` on DELETE).
    *   **Indexes:** B-tree indexes on `created_at DESC`, `table_name`, `actor_email`, and `record_label`.
    *   **RLS:** Strict default-deny on `audit_logs` for public/anon clients.
*   **Database Trigger (`process_audit_log_cdc`):**
    *   `AFTER INSERT OR UPDATE OR DELETE` on `forms` and `team_members`.
    *   Resolves `record_label` dynamically based on table type.
    *   Captures full state transitions and writes immutable log entries directly in PostgreSQL transaction space.
*   **Mutation Routing & Direct Async Server Actions:**
    *   Server actions use direct named exports (`export async function ...`) with inline `await requirePermission(...)` to avoid Higher-Order Function (HOF) closures stripping session headers.
    *   Mutations execute through the authenticated User Client (`@/lib/supabase/server.ts`) to forward JWT session headers to PostgREST.
*   **RBAC & Action Guard:**
    *   Server-side guard `requirePermission('team:manage_workers')` in `app/admin/logs/page.tsx` and `app/admin/logs/actions.ts`.
*   **Audit Logs Explorer UI (`app/admin/logs/`):**
    *   **CDC Table View:** Tabular listing displaying Actor, Timestamp, Operation badge, and Target Entity (primary label + table subcontext).
    *   **Search & Filter:** Keyword search over record label, table name, actor email, actor name, or record ID, with operation filter chips (`ALL`, `CREATE`, `UPDATE`, `DELETE`).
    *   **GitHub-Style Diff Viewer:** Expandable drawer featuring Split (side-by-side) and Unified diff views, line numbering, addition/deletion counters (`+X` / `-Y`), and hunk folding ("Changed Hunks" vs "Full File").
    *   **Query Limit:** Queries cap at 500 records by default to ensure fast response times without requiring pagination UI.

## Acceptance Criteria

### Phase 1: Database Trigger & Schema Migration
- [x] Create `audit_logs` table with `record_label`, indexes, and default-deny RLS in migration file.
- [x] Define PostgreSQL RLS policies allowing authenticated CRUD on `forms` and `team_members`.
- [x] Implement `process_audit_log_cdc()` trigger function calculating delta diffs, actor snapshots, and entity labels.
- [x] Attach CDC triggers to `forms` and `team_members` tables (excluding `submissions`).

### Phase 2: Mutation Routing & Action Guards
- [x] Refactor `team_members`, `forms`, and `forms/builder` actions to use direct named `export async function` declarations.
- [x] Ensure mutations execute via authenticated User Client (`lib/supabase/server.ts`) to preserve `auth.uid()`.
- [x] Verify background/service-role tasks fall back to `actor_name: 'system'`, `actor_email: 'system'`.

### Phase 3: Audit Logs Explorer UI
- [x] Build server-side page guard in `app/admin/logs/page.tsx` fetching initial 500 log records.
- [x] Build `LogsClient.tsx` featuring real-time search, operation filtering, target entity formatting, and GitHub-style hunk diffing.
- [x] Connect sidebar navigation under Settings for authorized roles.