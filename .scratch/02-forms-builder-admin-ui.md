# 02. Refactor Admin Form Builder UI (Event Binding & Follow-up Toggle)

## Objective
Refactor the existing form builder in `app/admin/forms/builder/page.tsx` to integrate `event_id` selection, a follow-up form toggle, and save schemas via Server Actions.

## Context
We are connecting the pre-existing UI controls to our updated schema. The admin needs to associate the form with an event and define whether it is an initial application or a follow-up form (which strictly enforces the magic token requirement on the frontend).

## Technical Constraints
*   Target file: `app/admin/forms/builder/page.tsx`
*   Integrate an `event_id` selector.
*   Integrate a toggle/checkbox for `is_followup`.
*   Ensure fields utilize the i18n fallback structure (EN Label, ZH Label, Data Key).
*   Use Next.js Server Actions for saving the schema and metadata.

## Acceptance Criteria
- [ ] Existing builder UI updated to include an `event_id` binding field and `is_followup` toggle.
- [ ] Local state correctly constructs the JSONB schema array.
- [ ] Server Action successfully accepts the state and writes `event_id`, `title`, `is_followup`, and `schema` to the `forms` table.