# Ticket 24 (Backlog): Event-Level RBAC Delegation (`allowed_event_ids`)

## Objective
Enable Super Admins and Team Managers to delegate operational responsibility for specific events (and their linked forms and submissions) to designated Event Coordinators, Form Editors, or Submission Viewers without granting global access to all events on the platform.

---

## 1. Proposed Schema & Guard Architecture
* **`team_members.allowed_event_ids` (`UUID[] DEFAULT NULL`):**
  * `NULL` (Default): Unrestricted access across all events (subject to functional role permissions in `lib/permissions.ts`).
  * `UUID[]` (Non-null array): Restricts the team member's access in `/admin/events`, `/admin/forms`, and `/admin/forms/[form_id]/submissions` strictly to records whose `event_id` is in `allowed_event_ids`.
* **Unified Server Guard (`requireEventAccess(action, eventId)` in `lib/auth-guards.ts`):**
  * Verifies both functional `SystemAction` permission and event-scope membership on all event, form, and submission server actions.