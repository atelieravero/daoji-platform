# Sprint 22: Form Success Variable Interpolation & Relative Markdown Headings

## Objective
1. Enable dynamic inline interpolation of applicant-submitted answers (`{{dataKey}}`) inside the Form Success Screen Title and Message, backed by the committed `submissions.response` JSONB payload returned from PostgreSQL.
2. Restore and standardize Markdown heading rendering (`#` through `######`) across the platform using a relative `baseHeadingLevel` offset so headings scale proportionally to their surrounding container hierarchy.

---

## 1. Form Success Screen Variable Interpolation (`{{dataKey}}`)

### 1.1 Dumb-Pipe-Safe Database Confirmation
* **`submitPublicForm` (`app/[locale]/form/[slug]/actions.ts`):** Chains `.select('applicant_token, response').single()` onto the `submissions` `INSERT` mutation so the server returns the exact committed `response` JSONB alongside `applicant_token` in the immediate HTTP action response, without opening any public `SELECT` RLS policy on `submissions`.
* **Session Persistence (`FormEngine.tsx`):** Stores `response` inside `daoji_form_success_${form.id}` in `sessionStorage` alongside `submitted` and `token` so page refreshes preserve interpolated values until the applicant clicks "Submit another response" or closes the tab.

### 1.2 Variable Syntax & Resolution Rules (`lib/form-engine-utils.ts`)
* **Syntax:** `{{dataKey}}` (matching the existing `{{TOKEN_BOX}}` placeholder convention) in both **Success Title** (`successTitleEn`, `successTitleZh`) and **Success Message** (`successMessageEn`, `successMessageZh`).
* **Fallback & Edge-Case Behavior:**
  * **Valid key with non-empty answer:** Replaced inline with the formatted answer (with HTML and inline Markdown control characters escaped before passing to `<MarkdownRenderer/>`).
  * **Valid key left blank / unanswered (optional or conditionally hidden):** Outputs an empty string (`""`).
  * **Invalid / unknown key or unsupported field type (`file`, `info`):** Outputs the literal token `{{dataKey}}` as-is so configuration typos remain immediately visible.
* **Type-Specific Formatting (`formatFieldAnswerInline`):**
  * **`text`, `textarea`, `email`, `mobile`, `applicant_token`:** Single-line plain string (newlines normalized to spaces).
  * **`number`:** Raw number string as stored.
  * **`select`, `radio`:** Localized option label following `current lang > other lang > value`.
  * **`checkbox`:** Array of localized option labels joined by `、` (in `/zh`) or `, ` (in `/en`).
  * **`date`:** Normalized to `yyyy-mm-dd`.
  * **`time`:** Normalized to `hh:mm`.

### 1.3 Admin Form Builder Live Preview (`SuccessScreenPreview.tsx`)
* In the Form Builder's **Success Screen** preview tab, valid `{{dataKey}}` tokens render as styled inline Indigo preview badges (`{{dataKey}} (Field Label)`) in both the Title and Message, while invalid keys remain raw `{{typo}}` text.

---

## 2. Relative Markdown Heading Hierarchy (`MarkdownRenderer.tsx`)

### 2.1 Root Cause & Solution
* Tailwind Preflight resets `<h1>`–`<h6>` to `font-size: inherit; font-weight: inherit;`.
* `<MarkdownRenderer/>` now defines explicit typography scales for `h1`–`h6` (plus `blockquote`, `hr`, `img`, and inline/block `code`), and normalizes CJK line-start `#標題` (without a space) into `# 標題`.
* **Relative Shifting Formula:**
  $$\text{effectiveLevel} = \min(6,\; \max(1,\; \text{baseHeadingLevel} + \text{markdownLevel} - 1))$$

### 2.2 `baseHeadingLevel` Mapping Across Contexts
* **`baseHeadingLevel={2}` (Default — Event, Post & Static Page Bodies):** Page title is `<h1>` (`text-2xl md:text-4xl`), so `#` in Markdown renders as `<h2>` (`text-xl md:text-2xl font-bold`), `##` as `<h3>`, etc.
* **`baseHeadingLevel={3}` (Form Header Subtitles & Success Messages):** Form title is `<h2>`/`<h1>` (`text-2xl`), so `#` in Markdown renders as `<h3>` (`text-lg md:text-xl font-bold`).
* **`baseHeadingLevel={4}` (Form Informational `info` Blocks):** Block label is `<h3>` (`text-base`), so `#` in description renders as `<h4>` (`text-base font-bold`).
* **`baseHeadingLevel={5}` (Form Question Descriptions / Hints):** Question label is `text-sm`, so `#` in a question hint renders as `<h5>` (`text-sm font-bold`).