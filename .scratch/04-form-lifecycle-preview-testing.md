# 04. Form Lifecycle, Preview, & Testing Controls

## Objective
Implement strict form status controls (draft, open, closed), secure preview logic for draft forms, test submission tracking, and deletion safeguards.

## Context
Forms have a defined lifecycle. Admins must be able to securely preview draft forms—including follow-up forms that normally require magic tokens—without affecting real submission data. The database schema must be updated to track form status at the root level and explicitly flag test submissions.

## Technical Constraints
*   **Database:** Migrate `status` from the `schema` JSONB payload to a dedicated root column in the `forms` table[cite: 19].
*   **Public Engine (`app/[locale]/form/page.tsx`):**
    *   Draft forms accessed without the `test=true` flag must return a localized "Form not found" UI (requires dictionary support)[cite: 19].
    *   When `test=true` is present, the engine must still require an applicant token for follow-up forms (via URL or input), but *any* token provided will be deemed verified and saved exactly as given[cite: 19].
*   **Admin Dashboard (`app/admin/forms/page.tsx` & `actions.ts`):** 
    *   Calculate and format submission counts as `real (test)` (e.g., `13 (4)`, `0 (5)`, `71`)[cite: 19].
    *   Strictly enforce deletion rules: Only `draft` forms can be deleted, and only if they have absolutely zero submissions (neither real nor test data).

## Acceptance Criteria
- [x] `status` column successfully migrated to the root `forms` table[cite: 19].
- [x] "Form not found" localized state implemented for unauthorized draft access[cite: 19].
- [x] Test mode successfully bypasses strict token validation, accepting and saving any provided dummy token[cite: 19].
- [x] Test mode visual UI heavily updated (Navy background, banners, dictionary strings).
- [x] Test submissions are explicitly flagged with `is_test: true` in the `submissions` table[cite: 19].
- [x] Admin dashboard accurately aggregates and displays submissions as `real_count (test_count)`[cite: 19].
- [x] Form deletion is strictly blocked unless the form is a draft with 0 total submissions.