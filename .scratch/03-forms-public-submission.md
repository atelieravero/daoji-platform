# 03. Connect Public Form Engine with Magic Token Gate

## Objective
Wire the existing public form page (`app/[locale]/apply/[form_id]/page.tsx`) to render dynamic fields and enforce the Magic Token access rules.

## Context
The renderer page must dynamically adapt based on the `is_followup` flag of the fetched form. Follow-up forms require a `token` URL search parameter assembled by Coda/Admin. Initial forms will generate this token securely on the server upon submission.

## Technical Constraints
*   Target file: `app/[locale]/apply/[form_id]/page.tsx`
*   Fetch form schema via Supabase Server Client.
*   If `is_followup` is true, verify the presence of the `token` parameter in the Next.js `searchParams`. If absent, return a "Deny Access" UI.
*   If `is_followup` is false, the Next.js Server Action must generate a new UUID (`applicant_token`) upon successful submission.
*   Submit payload via a Next.js Server Action that writes to `submissions` (storing `form_id`, `event_id`, `applicant_token`, and `response`).

## Acceptance Criteria
- [ ] Public page successfully loads and renders the dynamic schema utilizing existing `FormControls.tsx` components.
- [ ] Follow-up forms deny access if the `token` URL query parameter is missing.
- [ ] Server Action handles submission, utilizing the passed token (for follow-ups) or generating a new one (for initial forms).
- [ ] Data successfully writes to the `submissions` table.