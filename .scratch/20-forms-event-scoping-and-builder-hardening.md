# Sprint 20: Forms Event Scoping & Builder Hardening

## Objective
Modernize the Form Management system by enforcing real event linkage, decoupling sequence numbers and applicant tokens to global `event_code` namespaces, integrating the Media Pool into form covers and rich markdown editors, introducing the `number` question type with decimal precision, adding the `forms:view_schema` read-only permission, and enabling full RFC 3986 URL slug character compatibility.

---

## Technical Deliverables

### 1. Database & Sequence Scoping
*   **Column Ingestion:** Added `event_code TEXT NOT NULL` to the `submissions` table with index `idx_submissions_event_code_token` and `idx_submissions_event_code_seq`.
*   **Trigger Refactoring:** Updated `set_applicant_seq_num()` to sequence applicant numbers and reuse magic tokens by `event_code` rather than raw `event_id`.
*   **Relation Constraint:** Added explicit foreign key constraint `forms_event_id_fkey` linking `forms.event_id` (UUID) to `events.id` with `ON DELETE SET NULL`.

### 2. Admin Forms Interface & Permissions
*   **Event Metadata Display:** Enriched `getForms()` action to join `events!forms_event_id_fkey`, allowing `FormsClient` to render event codes (`[CODE]`), localized titles, short IDs, and status chips.
*   **`forms:view_schema` Action:** Added permission to `lib/permissions.ts` and assigned it to `form_editor`, `event_coordinator`, and `viewer`.
*   **Adaptive Action Icons:** In `FormsClient`, rendered `Pencil` icon for editable `draft` forms and `LayoutTemplate` icon for read-only schema inspection when viewing non-draft forms or when lacking `forms:edit`.
*   **Read-Only Schema Builder:**
    *   Form builder displays amber status notice banner when locked.
    *   Inputs, question options, and conditional logic editors are disabled.
    *   Header save button is disabled with status-specific label (e.g., `Locked (OPEN)` / `View Only`).
    *   Backend guard `saveFormSchema` rejects any mutation payload if form status is not `draft`.

### 3. Form Field Engine & Question Types
*   **`number` Field Format:** Added support for numeric questions with custom `decimals` (e.g., `0` for integer, `2` for currency), `min`, and `max`.
*   **Decimal Formatting:** Form Engine automatically formats numeric inputs on blur using `toFixed(decimals)` and sets dynamic `step` increments.
*   **Condition Logic Expansion:** Implemented numeric operators (`greater_than`, `less_than`, `within_range`, `not_within_range`, exact numeric equality) with strict numeric validation to avoid string-parsing date truncation issues.

### 4. URL Slug & Markdown Enhancements
*   **RFC 3986 URL Slug Sanitizer:** Upgraded `UrlSlugInspector` and `sanitizeSlug` to allow `a-z`, `0-9`, `-`, `_`, `.`, `+`, `%`, and `~` while stripping path traversal slashes.
*   **Media Pool Markdown Integration:** Replaced ad-hoc file inputs in `MarkdownEditor` with `MediaPicker`, inserting markdown images `![alt](url)` with SEO alt text at active cursor positions.
*   **Success Screen Token Card Gate:** The applicant token box only renders when the `{{TOKEN_BOX}}` placeholder is explicitly declared in the success message template.