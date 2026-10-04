# Sprint 21: Numeric Tokens & Identity Challenge Recovery

## Objective
Streamline applicant token entry by transitioning tokens to 8-digit numeric sequences (`0-9`), pre-filling event codes in pre-gate inputs, and introducing self-service token recovery via Name and Phone suffix matching to eliminate manual organizer support overhead for lost tokens.

---

## 1. Core Mechanics & Specifications

### 1.1 Token Simplification
*   **Format:** `[EVENT_CODE]-[DDDD-DDDD]` (e.g., `OCT26-3829-1940`).
*   **Character Set:** Pure numeric digits `0–9`.
*   **Collision Space:** $10^8$ (100 million combinations per cohort; near-zero collision probability for cohorts $\le 200$).

### 1.2 Pre-Gate Input Mask
*   **Prefix Lock:** Displays `[ EVENT_CODE - ]` as a static, read-only UI badge.
*   **Input Mask:** User enters only the 8 numeric digits. Displays with an auto-inserted hyphen (`[ 3829 - 1940 ]`).
*   **Mobile Keypad:** Triggers native mobile numeric keypad (`inputMode="numeric"`, `pattern="[0-9]*"`).

### 1.3 Identity Anchors (Option B)
*   No new question types. Existing `text` and `mobile` question types are designated as anchors in the Form Builder:
    *   On a `text` question: Toggle `Identity Anchor: Full Name` (`is_identity_name`).
    *   On a `mobile` question: Toggle `Identity Anchor: Mobile Number` (`is_identity_phone`).
*   **Dropdown Locking:** Once an anchor toggle is activated, the Question Type dropdown is locked. Admin must uncheck the anchor to change the question type.
*   **Form Save Backfill:** Saving the form recalculates `applicant_name` and `applicant_phone_suffix` across all existing submissions for that `form_id`.

### 1.4 Dedicated Submissions Columns & Archiving
*   `applicant_name TEXT`: Canonicalized full name (all whitespace and punctuation stripped, lowercased).
*   `applicant_phone_suffix VARCHAR(8)`: Suffix-8 mobile digits (all non-digits stripped, rightmost 8 digits).
*   `is_archived BOOLEAN DEFAULT FALSE`: Operational flag allowing admins to archive duplicate/invalid submissions to prevent matching conflicts.

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
*   **Cardinality Guardrail:** Succeeds **only if exactly 1 matching record is returned**. Returns an error if 0 or $>1$ records match.
*   **Environment Isolation:** Real mode (`isTest = false`) matches strictly against real submissions; Test mode (`isTest = true`) matches strictly against test submissions. Real tokens are never accessible from test mode URLs.

### 1.6 User Experience Flow
1. Pre-gate displays: *"Forgot token? Retrieve by Name & Phone"*.
2. User enters Name and Phone.
3. Upon single matching result, modal closes, token auto-fills into the pre-gate, and `FormEngine` immediately unlocks the form into the question canvas.

---

## 2. File Implementation Checklist

### Database & Schema
*   [ ] `00_init_schema.sql` (and migration file):
    *   Add `applicant_name TEXT`, `applicant_phone_suffix VARCHAR(8)`, and `is_archived BOOLEAN NOT NULL DEFAULT FALSE` to `submissions`.
    *   Add composite index `idx_submissions_challenge_lookup` on `(event_code, applicant_phone_suffix, applicant_name, is_archived, is_test)`.

### Utilities & Core Logic
*   [ ] `lib/applicant-identity.ts` (New):
    *   `canonicalizeApplicantName(raw: string)`: Strips `[\s\p{P}\p{S}]+` and converts to lowercase.
    *   `canonicalizePhoneSuffix(raw: string)`: Strips `\D`, returns `.slice(-8)`.
    *   `generateNumericToken(eventCode: string)`: Generates `[CODE]-DDDD-DDDD` using digits `0-9`.

### Server Actions & Form Engine
*   [ ] `app/[locale]/form/[slug]/actions.ts`:
    *   Update `generateMagicToken` to use 8 numeric digits.
    *   In `submitPublicForm`, resolve anchor questions, sanitize values, and populate `applicant_name` and `applicant_phone_suffix`.
    *   Implement `recoverApplicantToken({ eventCode, name, phone, isTest })`.
*   [ ] `app/[locale]/form/[slug]/FormEngine.tsx`:
    *   Split pre-gate token field into pre-filled event code prefix + 8-digit numeric input with `inputMode="numeric"`.
    *   Add "Forgot Token?" recovery dialog/tab invoking `recoverApplicantToken`.
    *   Auto-populate recovered token and seamlessly pass the pre-gate.

### Form Builder & Question Settings
*   [ ] `app/admin/(dashboard)/forms/builder/page.tsx` (Question Inspector):
    *   Add `Identity Anchor: Full Name` toggle to `text` questions.
    *   Add `Identity Anchor: Mobile Number` toggle to `mobile` questions.
    *   Lock question type dropdown while an anchor toggle is active.
*   [ ] `app/admin/(dashboard)/forms/builder/actions.ts`:
    *   Recalculate anchor columns for all submissions of the form upon saving schema.

### Submissions Admin Table
*   [ ] `app/admin/(dashboard)/forms/[form_id]/submissions/page.tsx`:
    *   Add `Archive` toggle button alongside `is_processed` to toggle `is_archived`.
*   [ ] `app/admin/(dashboard)/forms/[form_id]/submissions/actions.ts`:
    *   Add `toggleArchiveSubmissionAction(submissionId, isArchived)`.

### Localization
*   [ ] `messages/zh.json` & `messages/en.json`:
    *   Add keys for "Forgot Token?", recovery modal labels, and cardinality error messages under `ApplyForm`.