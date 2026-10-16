# Sprint 21: Numeric Tokens & Identity Challenge Recovery

## Objective
Streamline applicant token entry by transitioning tokens to 8-digit numeric sequences (`0-9`), pre-filling event codes in pre-gate and inline token inputs, and introducing self-service token recovery via Name and Phone suffix matching to eliminate manual organizer support overhead for lost tokens.

---

## 1. Core Mechanics & Specifications

### 1.1 Token Simplification
*   **Format:** `[EVENT_CODE]-[DDDD-DDDD]` (e.g., `OCT26-3829-1940`).
*   **Character Set:** Pure numeric digits `0–9`.
*   **Collision Space:** $10^8$ (100 million combinations per cohort; near-zero collision probability for cohorts $\le 200$).

### 1.2 Shared Token Input Mask (`<TokenDigitsInput/>`)
*   **Prefix Lock:** Displays `[ EVENT_CODE - ]` as a static, read-only UI badge on both the Follow-up Pre-Gate and inline `applicant_token` questions.
*   **Input Mask:** User enters only the 8 numeric digits. Displays with an auto-inserted hyphen (`[ 3829-1940 ]`).
*   **Mobile Keypad:** Triggers native mobile numeric keypad (`inputMode="numeric"`, `pattern="[0-9]{4}-?[0-9]{4}"`, with `noValidate` on form containers).

### 1.3 Identity Anchors (Option B — Application Forms Only)
*   Restricted strictly to initial Application forms (`is_followup = false`). Toggling `Follow-up Form` ON automatically strips any active anchor flags from the schema.
*   Existing `text` and `mobile` question types are designated as anchors in the Form Builder:
    *   On a `text` question: Toggle `Identity Anchor: Full Name` (`is_identity_name`).
    *   On a `mobile` question: Toggle `Identity Anchor: Mobile Number` (`is_identity_phone`).
*   **Dropdown Locking:** Once an anchor toggle is activated, the Question Type dropdown is locked. Admin must uncheck the anchor to change the question type.
*   **Canvas Badges:** Questions designated as anchors display `Anchor: Name` or `Anchor: Mobile` badges directly on the Form Builder canvas.
*   **Form Save Backfill:** Saving an application form recalculates `applicant_name` and `applicant_phone_suffix` across all existing submissions for that `form_id`.

### 1.4 Dedicated Submissions Columns, Archiving & Granular RBAC
*   `applicant_name TEXT`: Canonicalized full name (all whitespace and punctuation stripped, lowercased).
*   `applicant_phone_suffix VARCHAR(8)`: Suffix-8 mobile digits (all non-digits stripped, rightmost 8 digits).
*   `is_archived BOOLEAN NOT NULL DEFAULT FALSE`: Operational flag allowing staff to archive duplicate/invalid submissions to prevent matching conflicts.
*   **Granular RBAC Split:**
    *   `submissions:process`: Governs toggling `is_processed` and bulk-processing on CSV export (granted to `submission_viewer` and `event_coordinator`).
    *   `submissions:archive`: Governs toggling `is_archived` (granted to `event_coordinator` and `super_admin`).

### 1.5 Self-Service Challenge Engine (`recoverApplicantToken`)
*   **Input:** `eventCode`, `name`, `phone`, `isTest`.
*   **Invariants:** Both `name` and `phone` must produce non-empty canonical values (`NOT NULL AND != ''`).
*   **Matching Query:**
    ```sql
    SELECT applicant_token 
    FROM submissions 
    WHERE event_code = $eventCode
      AND applicant_name = $cleanName
      AND applicant_phone_suffix = $phoneTail8
      AND is_archived = FALSE
      AND is_test = $isTest;
    ```
*   **Cardinality Guardrail:** Succeeds **only if exactly 1 matching record is returned**. Returns a unified error (`recoveryErrorFailed`) if 0 or $>1$ records match.
*   **Environment Isolation:** Real mode (`isTest = false`) matches strictly against real submissions; Test mode (`isTest = true`) matches strictly against test submissions.

### 1.6 Unified DRY Recovery Flow & Modular FormEngine
1. Both the Follow-up Pre-Gate (`recoveryTargetKey = null`) and inline `applicant_token` questions (`recoveryTargetKey = field.dataKey`) open the single shared `<TokenRecoveryModal/>`.
2. User enters Full Name and Mobile Number (using the shared `<MobilePhoneInput/>` country-code control).
3. Upon a single match, `applyVerifiedToken(token, recoveryTargetKey)` populates the token and immediately marks the pre-gate as passed or the inline field as `verified: true` without firing a redundant verification request.

---

## 2. File Implementation Checklist

### Database & Schema
*   [x] `00_init_schema.sql` & Supabase types (`lib/supabase/types.ts`):
    *   Added `applicant_name TEXT`, `applicant_phone_suffix VARCHAR(8)`, and `is_archived BOOLEAN NOT NULL DEFAULT FALSE` to `submissions`.
    *   Added composite index `idx_submissions_challenge_lookup` on `(event_code, applicant_phone_suffix, applicant_name, is_archived, is_test)`.

### Utilities & Core Logic
*   [x] `lib/applicant-identity.ts`:
    *   `canonicalizeApplicantName(raw)`, `canonicalizePhoneSuffix(raw)`, and `generateNumericToken(eventCode)`.
*   [x] `lib/form-engine-utils.ts`:
    *   `parseMobileString`, `formatPhoneDisplay`, `extractTokenDigits`, `formatTokenBodyDisplay`, `buildFullToken`, and `shouldShowField`.

### Public Form Engine & Extracted Components
*   [x] `app/[locale]/form/[slug]/actions.ts`:
    *   Implemented `resolveEventCode` and `normalizeApplicantToken` helpers, 8-digit token generation, anchor ingestion on initial applications, environment-isolated verification, and `recoverApplicantToken`.
*   [x] `app/[locale]/form/[slug]/FormEngine.tsx`:
    *   Refactored into a ~240-line state orchestrator.
*   [x] `components/public/form/FormInputs.tsx`:
    *   Shared `<MobilePhoneInput/>` and `<TokenDigitsInput/>` controls.
*   [x] `components/public/form/TokenRecoveryModal.tsx`:
    *   Self-contained challenge recovery modal.
*   [x] `components/public/form/FormPreGateScreen.tsx`:
    *   Follow-up pre-gate screen and URL verification state.
*   [x] `components/public/form/FormSuccessScreen.tsx`:
    *   Post-submission confirmation screen and copyable token card.
*   [x] `components/public/form/FormFieldCard.tsx`:
    *   Individual question card renderer for all field types.

### Form Builder & Question Settings
*   [x] `app/admin/(dashboard)/forms/builder/BuilderClient.tsx`:
    *   Added `Identity Anchor: Full Name` and `Identity Anchor: Mobile Number` toggles restricted to `!formConfig.isFollowUp`.
    *   Locked question type dropdown while an anchor toggle is active.
*   [x] `components/admin/forms/QuestionCanvasItem.tsx`:
    *   Added `is_identity_name` and `is_identity_phone` to `FormField` and rendered anchor badges on canvas cards.
*   [x] `app/admin/(dashboard)/forms/builder/actions.ts`:
    *   Recalculates anchor columns across existing submissions upon saving an application form schema.

### Submissions Admin Table & RBAC
*   [x] `lib/permissions.ts`:
    *   Added independent `submissions:process` and `submissions:archive` actions.
*   [x] `app/admin/(dashboard)/forms/[form_id]/submissions/page.tsx`, `SubmissionsClient.tsx`, & `actions.ts`:
    *   Added `Archive` toggle button, `Hide Archived` toolbar filter, `Is Archived` CSV column, and `toggleSubmissionArchivedStatus` action guarded by `submissions:archive`.

### Localization
*   [x] `messages/zh.json` & `messages/en.json`:
    *   Added dictionary keys under `ApplyForm` for pre-gate hints and the challenge recovery modal.