# 09. Applicant Sequence Numbers (PostgreSQL Trigger)

## Objective
Implement a human-readable, event-scoped applicant sequence number generated automatically at the database level to ensure zero conflicts and perfect follow-up consistency.

## Context
While Magic Tokens are highly secure for digital routing and privacy, physical event check-ins and administrative reviews require simple, human-readable identifiers (e.g., Applicant #001, #002). Because high-traffic forms can experience simultaneous submissions, calculating this number in the Next.js application layer risks race conditions (duplicate numbers). Therefore, the generation must happen inside the database itself using row-locking mechanisms.

## Technical Constraints
*   **Event Scoping:** The sequence must be isolated to the `event_id`. (Event A has #1-100; Event B has its own #1-100).
*   **Token Persistence:** If an applicant submits a follow-up form utilizing an existing `applicant_token`, the database must recognize the token within that event and reuse their original sequence number.
*   **Version Control:** The database function and trigger must not be created exclusively via a GUI. It must be written as a raw `.sql` file stored in the repository (`supabase/migrations/`) to ensure cloud portability (e.g., migrating to AliCloud RDS).

## Acceptance Criteria
- [ ] Write a `.sql` migration script to add `applicant_seq_num` to the `submissions` table.
- [ ] Develop a PL/pgSQL `BEFORE INSERT` trigger function to handle the counting and Token-matching logic.
- [ ] Save the migration script into the repository for version control.
- [ ] Update the Submissions Admin View and CSV Export logic to fetch and display the new `applicant_seq_num`.