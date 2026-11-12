# Sprint 23: Stateless Application Status & Instruction Inquiry

## Objective
Provide applicants with a frictionless, zero-PII self-service portal to check their application checkpoints (e.g., Application Status, Fees Paid, Insurance Uploaded, Flight Confirmed) and read tailored Markdown follow-up instructions without exposing raw submission answers or violating the platform's "dumb pipe" architecture.

---

## 1. Database Schema (`00_init_schema.sql`)
* **`forms.status_config` (`JSONB NOT NULL DEFAULT '{"enabled": false, "fields": []}'::jsonb`):**
  * Stored in a dedicated column decoupled from `forms.schema` so coordinators with `submissions:process` can add status fields or update instructions while a form is `open` or `closed`.
* **`submissions.status_data` (`JSONB NOT NULL DEFAULT '{}'::jsonb`):**
  * Stores a flat `{ [fieldKey]: optionValue }` map per submission row.

---

## 2. Admin Portal Workflow (`/admin/forms/[form_id]/submissions`)
* **RBAC Guard:** Strictly guarded by `submissions:process`.
* **Status Inquiry Config Modal (`StatusConfigModal.tsx`):**
  * Accessible from the Submissions header on initial application forms (`!is_followup`).
  * Configures `enabled`, optional intro Markdown, ordered `StatusFieldConfig` items (`key`, `labelZh`, `labelEn`, `defaultValue`), and `StatusOptionConfig` items (`value`, `labelZh`, `labelEn`, semantic `tone`, and bilingual Markdown instructions supporting `{{TOKEN}}` interpolation).
* **Inline & Bulk Management (`SubmissionsClient.tsx`):**
  * Renders each configured status field as a toggleable table column with an inline color-coded `<select>` dropdown.
  * Displays a multi-row bulk assignment bar when rows are checked to update status across $N$ selected applicants in one action.
  * Includes visible status columns in CSV exports.

---

## 3. Public Status Inquiry UX & Zero-PII Guarantee
* **Entry Points:**
  1. Dedicated route: `/[locale]/form/[slug]/status` (supports `?token=...` auto-verification and `?standalone=true`).
  2. Secondary link (`查詢報名進度與待辦事項` / `Check Application Status`) directly beneath the primary registration button in `<EventActionPortal/>` whenever `linked_form.status_config.enabled === true`.
* **Dual Lookup Gate (`inquireApplicantStatus`):**
  * Supports lookup via 8-digit numeric token (`[CODE]-DDDD-DDDD`) or canonicalized Full Name + Mobile Suffix-8 (requiring an exact single non-archived match).
  * Queries **only** `applicant_token, status_data` from `submissions`—never `submissions.response`.
* **Option A Visibility & `{{TOKEN}}` Interpolation (`lib/status-inquiry.ts`):**
  * Fields left unset on a submission without a `defaultValue` are omitted from the applicant's status view.
  * Active option instructions render via `<MarkdownRenderer baseHeadingLevel={4}/>` with `{{TOKEN}}` interpolated with the applicant's canonical `applicant_token`.