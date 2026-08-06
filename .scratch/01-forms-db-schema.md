# 01. Update Supabase Schema for Forms, Submissions, and Magic Tokens

## Objective
Update the Supabase `forms` and `submissions` tables to store JSONB data, bind to `event_id`, and support the Magic Token lifecycle.

## Context
Forms and submissions must be associated with specific events. Furthermore, we must track users statelessly across multiple form submissions for the same event using a generated `applicant_token`. The `forms` table needs to distinguish between initial and follow-up forms.

## Technical Constraints
*   Target file: `lib/supabase/types.ts` (update generated types after migration).
*   `forms` table columns: `id` (UUID), `event_id` (Text/UUID, Indexed), `title` (Text), `schema` (JSONB), `is_followup` (Boolean, default false), `created_at` (Timestamp).
*   `submissions` table columns: `id` (UUID), `form_id` (UUID, FK), `event_id` (Text/UUID, Indexed), `applicant_token` (UUID, Indexed), `response` (JSONB), `created_at` (Timestamp).
*   Enable RLS on both tables.

## Acceptance Criteria
- [ ] Migration script applied for `forms` and `submissions` with `event_id`, `is_followup`, and `applicant_token` columns.
- [ ] Foreign keys and indexes created on `event_id`, `form_id`, and `applicant_token`.
- [ ] Supabase TypeScript definitions updated in `lib/supabase/types.ts`.