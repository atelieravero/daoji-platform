# 04. Form Lifecycle, Preview, & Testing Controls

## Objective
Implement strict form status controls (draft, open, closed), secure preview logic for draft forms, test submission tracking, and deletion safeguards.

## Context
Forms have a defined lifecycle. Admins must be able to securely preview draft forms—including follow-up forms that normally require magic tokens—without affecting real submission data. The database schema must be updated to track form status at the root level and explicitly flag test submissions.

## Technical Constraints
*   **Database:** Migrate `status` from the `schema` JSONB payload to a dedicated root column in the `forms` table.
*   **Public Engine (`app/[locale]/form/page.tsx`):**
    *   Draft forms accessed without the `test=true` flag must return a localized "Form not found" UI (requires dictionary support).
    *   When `test=true` is present, the engine must still require an applicant token for follow-up forms (via URL or input), but *any* token provided will be deemed verified and saved exactly as given.
*   **Admin Dashboard (`app/admin/forms/page.tsx` & `actions.ts`):** 
    *   Calculate and format submission counts as `real (test)` (e.g., `13 (4)`, `0 (5)`, `71`).
    *   Strictly enforce deletion rules: Only `draft` forms can be deleted, and only if they have zero real submissions (`is_test: false`). Test submissions do not block deletion.

## Acceptance Criteria
- [ ] `status` column successfully migrated to the root `forms` table.
- [ ] "Form not found" localized state implemented for unauthorized draft access.
- [ ] Test mode successfully bypasses strict token validation, accepting and saving any provided dummy token.
- [ ] Test submissions are explicitly flagged with `is_test: true` in the `submissions` table.
- [ ] Admin dashboard accurately aggregates and displays submissions as `real_count (test_count)`.