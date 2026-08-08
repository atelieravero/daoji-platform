# 06. Event Codes & Standalone Form Mode

## Objective
Refactor the applicant token generator to use dynamic Event Codes and introduce a Standalone Mode for direct form distribution.

## Context
Before deploying live, the system needs to support direct-link distribution where the "Back to Event" context is hidden. The applicant token prefix must dynamically adapt to the associated event (e.g., `ZEN26-A4X9-P2M8`), and the CSV export should utilize this Event Code.

## Technical Constraints
*   **Standalone Mode:** Add an `is_standalone` boolean toggle to the Admin Builder. If true, the Public Form Engine hides the "Back to Event" header.
*   **Event Codes:** Update the event linkage to use a 4-6 character `event_code`.
*   **Token Generation:** Update `generateMagicToken` to accept the `event_code` and use it as the token prefix.
*   **CSV Export:** Update CSV logic to output the `event_code` instead of the raw `event_id`.

## Acceptance Criteria
- [ ] Admin Builder allows toggling "Standalone Mode".
- [ ] Public Engine hides the back button if Standalone Mode is active.
- [ ] `event_code` is integrated into the data structure and token generation.
- [ ] CSV Export uses the `event_code` in the Event column.