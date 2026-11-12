# Sprint 23: Stateless Application Status & Instruction Inquiry, DRY Identity Gate & Spreadsheet Table Filters

## Objective
1. Provide applicants with a frictionless, zero-PII self-service portal to check their application checkpoints (e.g., Application Status, Fees Paid, Insurance Uploaded, Flight Confirmed) and read tailored Markdown follow-up instructions without exposing raw submission answers or violating the platform's "dumb pipe" architecture.
2. Unify public identity verification across Follow-up Form Pre-Gates and Status Inquiry into a single DRY side-by-side component (`<ApplicantIdentityGate/>`) with standardized bilingual terminology (**`Application Code`** / **`報名代碼`**).
3. Upgrade the Admin Submissions table with a reusable Google Sheets-style per-column filter & sort engine (`<AdminColumnHeaderFilter/>`), compact icon-only system headers, key-only status columns, and high-contrast row selection.

---

## 1. Database Schema (`00_init_schema.sql`)
* **`forms.status_config` (`JSONB NOT NULL DEFAULT '{"enabled": false, "fields": []}'::jsonb`):**
  * Stored in a dedicated column decoupled from `forms.schema` so coordinators with `submissions:process` can add status fields or update instructions while a form is `open` or `closed` (updated directly via `.update({ status_config })` without touching `updated_at`).
* **`submissions.status_data` (`JSONB NOT NULL DEFAULT '{}'::jsonb`):**
  * Stores a flat `{ [fieldKey]: optionValue }` map per submission row.

---

## 2. Admin Portal Workflow (`/admin/forms/[form_id]/submissions`)

### 2.1 Status Inquiry Config Modal (`StatusConfigModal.tsx`)
* **RBAC Guard:** Strictly guarded by `submissions:process` and surfaced on initial application forms (`!is_followup`).
* Configures `enabled`, optional intro Markdown, ordered `StatusFieldConfig` items (`key`, `labelZh`, `labelEn`, `defaultValue`), and `StatusOptionConfig` items (`value`, `labelZh`, `labelEn`, semantic `tone`, and bilingual Markdown instructions supporting `{{TOKEN}}` interpolation).

### 2.2 Space-Saving Table Layout & High-Contrast Selection (`SubmissionsClient.tsx`)
* **Compact Icon-Only System Headers:** `processed` (`<CheckCircle2/>`), `archived` (`<Trash2/>` rubbish bin), `test` (`<Beaker/>`), `locale` (`<Globe/>`), and `seq_num` (`<Hash/>`) render as compact icon headers (`w-11`/`w-12`) with descriptive hover tooltips.
* **Terminology & Key-Only Status Columns:**
  * Renamed the `applicant_token` column header to `application code`.
  * Status columns display only the short field `key` (e.g., `status`, `fee`, `insurance`) in the table header and only the option `value` (e.g., `accepted`, `pending`) inside each row's color-coded `<select>` pill, while surfacing the full bilingual labels in hover tooltips and filter popovers.
* **High-Contrast Selected Rows:** Checked rows highlight with `bg-indigo-100/90 hover:bg-indigo-200/75 ring-1 ring-inset ring-indigo-300` and a `border-l-4 border-l-indigo-600` left accent bar.
* **Multi-Row Bulk Assignment & CSV Export:** Checking rows reveals a bulk status assignment bar (`bulkUpdateSubmissionStatusField`) and exports visible status columns to CSV.

### 2.3 Reusable Google Sheets-Style Per-Column Filter & Sort (`AdminColumnFilter.tsx`)
* **`useAdminTableFilters` Hook:** Client-side combinatorial filtering (`OR` within a column, `AND` across multiple columns) with live unique value counts, `(Blanks / Unset)` bucket support, array-cell splitting (for checkbox answers), and single-column `A → Z` / `Z → A` sorting.
* **`<AdminColumnHeaderFilter/>` Portal Popover:** Renders via `createPortal` to `document.body` so popovers never clip inside `overflow-x-auto` table containers. Separates the compact header `title` from the full descriptive `tooltip`, and provides in-popover search, `Select All`, `Clear`, and one-click `Only` filtering.
* **`<AdminFilterResetButton/>`:** Displays an active filter counter chip in the toolbar (`Reset Filters (N)`) whenever any column filter or sort is applied, replacing the legacy standalone `"Hide Processed"` and `"Hide Archived"` buttons.

---

## 3. Public Status Inquiry & DRY Side-by-Side Identity Gate

### 3.1 Standardized Terminology (`messages/en.json` & `messages/zh.json`)
* Standardized all public-facing token strings on **`Application Code`** (English) and **`報名代碼`** (Chinese) so applicants never confuse their `[CODE]-DDDD-DDDD` reference code with an SMS 2FA verification code.

### 3.2 DRY `<ApplicantIdentityGate/>` (`components/public/form/ApplicantIdentityGate.tsx`)
* Shared between **`FormPreGateScreen.tsx`** (Follow-up Form Pre-Gate) and **`StatusInquiryClient.tsx`** (`/[locale]/form/[slug]/status`).
* Presents **`By Application Code`** (`<TokenDigitsInput/>`) and **`By Name & Phone`** (`Full Name` + `<MobilePhoneInput/>`) side-by-side as equal primary tabs.

### 3.3 Zero-PII Status Resolution (`inquireApplicantStatus` & `lib/status-inquiry.ts`)
* **Entry Points:**
  1. Dedicated route: `/[locale]/form/[slug]/status` (with `robots: { index: false, follow: false }`, `?token=...` auto-lookup, and `?standalone=true` support).
  2. Secondary link (`查詢報名進度與待辦事項` / `Check Application Status`) directly beneath the primary registration button in `<EventActionPortal/>` whenever `linked_form.status_config.enabled === true`.
* **Zero-PII Guarantee:** Queries **only** `applicant_token, status_data` from `submissions`—never `submissions.response`.
* **Option A Visibility & `{{TOKEN}}` Interpolation:** Fields left unset on a submission without a `defaultValue` are omitted from the applicant's status card. Active option instructions render via `<MarkdownRenderer baseHeadingLevel={4}/>` with `{{TOKEN}}` interpolated with the applicant's canonical `applicant_token`.