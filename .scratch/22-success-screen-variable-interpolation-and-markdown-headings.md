# Sprint 22: Form Success Variable Interpolation, Relative Markdown Headings & Public Brand Styling

## Objective
1. Enable dynamic inline interpolation of applicant-submitted answers (`{{dataKey}}`) inside the Form Success Screen Title and Message, backed by the committed `submissions.response` JSONB payload returned from PostgreSQL.
2. Restore and standardize Markdown heading rendering (`#` through `######`) across the platform using a relative `baseHeadingLevel` offset so headings scale proportionally to their surrounding container hierarchy.
3. Establish the official `#8E442A` Daoji Terracotta public-facing design system, Peacock Teal (`#0D6E6E`) dotted-underline hyperlink styling, CJK sans-serif typography stack, and `16px` (`1.8` line-height) reading rhythm across Events, Posts, Static Pages, and Forms.

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

### 1.3 Admin Form Builder Live Preview (`SuccessScreenPreview.tsx` & `BuilderClient.tsx`)
* In the Form Builder's **Success Screen** preview tab, valid `{{dataKey}}` tokens render as styled inline Indigo preview badges (`{{dataKey}} (Field Label)`) in both the Title and Message, while invalid keys remain raw `{{typo}}` text.
* The Success Content inspector lists all eligible question `{{dataKey}}` tokens as clickable copy-to-clipboard pills.

---

## 2. Relative Markdown Heading Hierarchy (`MarkdownRenderer.tsx`)

### 2.1 Root Cause & Solution
* Tailwind Preflight resets `<h1>`–`<h6>` to `font-size: inherit; font-weight: inherit;`.
* `<MarkdownRenderer/>` defines explicit typography scales for `h1`–`h6` (plus `blockquote`, `hr`, `img`, and inline/block `code`), and normalizes CJK line-start `#標題` (without a space) into `# 標題`.
* **Relative Shifting Formula:**
  $$\text{effectiveLevel} = \min(6,\; \max(1,\; \text{baseHeadingLevel} + \text{markdownLevel} - 1))$$

### 2.2 `baseHeadingLevel` Mapping Across Contexts
* **`baseHeadingLevel={2}` (Default — Event, Post & Static Page Bodies):** Page title is `<h1>` (`26px` mobile / `36px` desktop), so `#` in Markdown renders as `<h2>` (`20px` / `22px` bold with a `3px` `#8E442A` left accent bar), `##` as `<h3>` (`17px` / `18px` bold in deep sienna `#5C2A18`), etc.
* **`baseHeadingLevel={3}` (Form Header Subtitles & Success Messages):** Form title is `<h1>` (`22px` / `28px`), so `#` in Markdown renders as `<h3>`.
* **`baseHeadingLevel={4}` (Form Informational `info` Blocks):** Block label is `<h3>` (`16px`), so `#` in description renders as `<h4>`.
* **`baseHeadingLevel={5}` (Form Question Descriptions / Hints):** Question label is `15px`, so `#` in a question hint renders as `<h5>` (`14px`).

---

## 3. Public Portal Brand Palette, Hyperlinks & Typography (`app/globals.css`)

### 3.1 Color Tokens
* **Brand Terracotta (`#8E442A`):** Extracted from the official 道迹禅院 logo swatch (`C=41 M=76 Y=100 K=13`). Paired with `--color-primary-hover: #743620`, `--color-primary-active: #5C2A18`, `--color-primary-soft: #F8EFEA`, `--color-primary-border: #E2C6B9`, and `--color-accent-ochre: #B88644`.
* **Hyperlink Palette (Peacock Teal & Jade):** `--color-link: #0D6E6E`, `--color-link-hover: #084C4C`, `--color-link-underline: #22A699`, and `--color-link-highlight: #E0F5F2`. Inline Markdown links and external venue/organizer links render with a `2.5px` dotted jade underline (`underline-offset-[5px]`) that transitions to a solid underline with a mint highlighter pill on hover.
* **Warm Monastic Surfaces & Ink Hierarchy:** `--color-surface-base: #FCFAF7`, `--color-surface-card: #FFFFFF`, `--color-surface-cream: #F5EFE6`, `--color-surface-dark: #E6DDD0`, `--color-ink-primary: #26241F`, `--color-ink-body: #3D3A33`, and `--color-ink-muted: #787166`. OS dark-mode overrides are removed so the public portal consistently renders on its warm rice-paper surface.

### 3.2 Bilingual Font Stack & Reading Rhythm
* **`--font-sans`:** `var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "PingFang TC", "Noto Sans TC", "HarmonyOS Sans TC", "Microsoft JhengHei", "Heiti TC", sans-serif`.
* **Prose Scale & Banner Un-Letterboxing:** Upgraded Event, Post, Static Page, and Form subtitle/success prose to `16px` (`text-base`) with `1.8` line-height (`leading-[1.8]`) and `mb-4` paragraph spacing. Removed `max-h-64` on Form header and success banners so `1.91:1` banners display full-width without letterboxing.