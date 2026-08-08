# 06. Event Codes & Standalone Form Mode

## Objective
Refactor the applicant token generator to use dynamic Event Codes and introduce a Standalone Mode for direct form distribution.

## Context
Before deploying live, the system needs to support direct-link distribution where the main website navigation is hidden. The applicant token prefix must dynamically adapt to the associated event (e.g., `ZEN26-A4X9-P2M8`), and the CSV export should utilize this Event Code. To expedite rollout without complex database migrations, both features utilize the existing Form Schema JSON.

## Technical Constraints
*   **Standalone Mode:** Add an `isStandalone` boolean toggle to the Admin Builder Schema. The Public Form Engine uses CSS injection (`display: none !important` on headers) and a URL param hint to prevent layout flashing, creating a focused landing page.
*   **Event Codes:** Implement `interimEventCode` inside the Form Builder Schema JSON to bypass the need for a relational `posts` table temporarily.
*   **Token Generation:** Update `generateMagicToken` to accept the `interimEventCode` payload and use it as the token prefix.
*   **CSV Export:** Update CSV logic to output the `interimEventCode` from the schema.

## Acceptance Criteria
- [x] Admin Builder allows toggling "Standalone Form" and inputting "Interim Event Code".
- [x] Public Engine cleanly hides the global layout and renders a floating language switch if Standalone Mode is active, without UI flashing.
- [x] `interimEventCode` is integrated into the token generation.
- [x] CSV Export uses the `interimEventCode` in the Event column.