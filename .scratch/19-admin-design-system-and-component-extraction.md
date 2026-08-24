# Sprint 19: Admin Design System & Component Extraction

## Objective
Standardize the entire admin dashboard workspace on the **Indigo** theme (`indigo-600`, `indigo-50`, `indigo-500`) and extract shared, reusable UI primitives across all administrative list views (`Forms`, `Events`, `Submissions`, `Assets`, `Taxonomy`, `Logs`, `Team`) and editor workspaces (`FormBuilder`, `EventEditor`, and upcoming `ArticleEditor`):
1. Eliminate UI duplication across admin list tables, search toolbars, status dropdowns, and QR share modals.
2. Standardize the **Canvas + 460px Right Inspector** editor layout architecture with unified bilingual split/tab editing across all content domains.
3. Modularize `FormBuilder` by extracting field configuration, choices management, conditional logic rules, and success previews into decoupled components.
4. Deduplicate the Media Pool explorer (`AssetsPage`) and the `<MediaPicker/>` drawer by extracting shared asset cards, inspector drawers, and utilities.
5. Enforce strict color token separation: **Indigo** exclusively for internal Admin tooling; **Daoji Ochre** (`#A65D24`, `#FAF5F0`) exclusively for public-facing shell pages (`/[locale]/...`).

---

## Scope & Architectural Blueprint

```text
components/admin/
├── shared/
│   ├── AdminPageHeader.tsx          # Standardized title, subtitle, optional breadcrumb, primary action button slot
│   ├── AdminTableToolbar.tsx        # Debounced search input + status filter tabs / action slots
│   ├── AdminTableCard.tsx           # Standard white card container, divide-y table shell, loading & empty states
│   ├── AdminStatusBanner.tsx        # Standardized dismissable success/error feedback banner
│   ├── ShareQrModal.tsx             # Universal modal for copying public link & downloading 1000x1000 scannable QR PNG
│   └── StatusBadgeSelect.tsx        # Color-coded status switcher (Draft, Published, Unlisted, Closed, Archived)
│
├── editor/
│   ├── EditorLayout.tsx             # Top bar + Center Canvas + 460px Right Inspector shell
│   ├── EditorHeader.tsx             # Back button, entity title, permalink/code badge, split-view toggle, save button
│   ├── BilingualCanvas.tsx          # Standardized EN/ZH writing surface (Side-by-side or Tabbed) with MarkdownEditor
│   ├── CoverBannerPicker.tsx        # Standardized cover image slot connected to MediaPool with preview/remove actions
│   └── UrlSlugInspector.tsx         # Slug input with auto-sanitization, domain prefix, and short_id permalink helper
│
├── forms/
│   ├── QuestionCanvasItem.tsx       # Live question canvas card rendering mock previews for all 12 field formats
│   ├── ChoicesConfigurator.tsx      # Add/remove/reorder select/radio/checkbox options with EN/ZH labels
│   ├── ConditionalLogicInspector.tsx# Rule builder with type-aware operators, range inputs, and dependency selectors
│   └── SuccessScreenPreview.tsx     # Completion screen preview with {{TOKEN_BOX}} token placeholder rendering
│
└── assets/
    ├── AssetCard.tsx                # Universal media tile (preview, hover actions, metadata, selection ring)
    ├── AssetInspectorDrawer.tsx     # Slide-out metadata inspector with copyable CDN URL and delete controls
    └── MediaPicker.tsx              # Modal drawer consuming shared AssetCard and formatting utilities
```

---

## Technical Checklist

### Phase 1: Shared List Components (`components/admin/shared/`)
- [x] Create `AdminPageHeader.tsx`: Title, subtitle, optional breadcrumb/back link, and primary action slot (`+ Create ...`).
- [x] Create `AdminTableToolbar.tsx`: Debounced search input, status pill filter bar, and secondary action button slots.
- [x] Create `AdminTableCard.tsx`: Standard white card container, table shell, `divide-y divide-gray-200`, loading skeleton/spinner, and empty state placeholder.
- [x] Create `AdminStatusBanner.tsx`: Dismissable feedback banner with green/red status styling and dismiss callback.
- [x] Create `ShareQrModal.tsx`: Universal sharing modal with public link copy input and high-resolution 1000x1000 scannable QR code PNG downloader with 50px white margin.
- [x] Create `StatusBadgeSelect.tsx`: Standardized status switcher with semantic color badges (`open`/`published` -> Emerald, `draft`/`unlisted` -> Amber/Gray, `closed`/`archived` -> Rose) supporting optimistic updates.

### Phase 2: Editor Architecture Primitives (`components/admin/editor/`)
- [x] Create `EditorLayout.tsx`: Two-pane workspace container (`flex-1 flex overflow-hidden` with central scrollable canvas and fixed 460px right inspector sidebar).
- [x] Create `EditorHeader.tsx`: Top navigation bar with back navigation, entity title, code/short_id chip, single/split-pane view switcher, public preview button, and primary save action with loading state.
- [x] Create `BilingualCanvas.tsx`: Writing surface managing side-by-side split view or single-language tabbed view (中文 Traditional / English) with integrated `MarkdownEditor`.
- [x] Create `CoverBannerPicker.tsx`: Standardized cover image slot connecting directly to `<MediaPicker/>` with preview thumbnail and removal actions.
- [x] Create `UrlSlugInspector.tsx`: Live-sanitized vanity URL slug input with domain prefix display, validation warnings, and permanent `short_id` permalink helper text.

### Phase 3: Form Builder Modularization (`components/admin/forms/`)
- [x] Create `QuestionCanvasItem.tsx`: Visual preview container for all 12 input field types (`text`, `email`, `mobile`, `date`, `time`, `select`, `radio`, `checkbox`, `textarea`, `file`, `info`, `applicant_token`), condition badges, and reordering controls.
- [x] Create `ChoicesConfigurator.tsx`: Dynamic option management for dropdown, radio, and checkbox fields (value keys, bilingual labels, reordering, deletion).
- [x] Create `ConditionalLogicInspector.tsx`: Complete conditional rule builder with type-aware operators (`equals`, `contains`, `is_one_of`, `within_range`, `is_blank`) and target value inputs.
- [x] Create `SuccessScreenPreview.tsx`: Preview screen for dual-language submission confirmation messages and applicant token placement.

### Phase 4: Media Pool & Utility Deduplication (`components/admin/assets/` & `lib/`)
- [x] Create `lib/format.ts`: Centralize file size formatting (`formatFileSize`) and URL slug sanitization (`sanitizeSlug`).
- [x] Create `components/admin/assets/AssetCard.tsx`: Media tile displaying file preview (image thumbnail, audio icon, document icon), file size, MIME type badge, hover actions (copy URL, delete), and selection ring.
- [x] Create `components/admin/assets/AssetInspectorDrawer.tsx`: Slide-out panel for asset inspection with preview, copyable CDN link, file metadata, and silent denial delete action.
- [x] Refactor `components/admin/MediaPicker.tsx` to consume `<AssetCard/>` and `lib/format.ts` utilities.

### Phase 5: View Migration & Theme Harmonization
- [x] **Forms Manager (`app/admin/(dashboard)/forms/`):** Refactored `FormsClient.tsx` to use `AdminPageHeader`, `AdminTableToolbar`, `AdminTableCard`, `StatusBadgeSelect`, and `ShareQrModal`.
- [x] **Form Builder (`app/admin/(dashboard)/forms/builder/`):** Refactored `BuilderClient.tsx` to consume `EditorLayout`, `EditorHeader`, `CoverBannerPicker`, `UrlSlugInspector`, and all modular `forms/` components.
- [x] **Submissions View (`app/admin/(dashboard)/forms/[form_id]/submissions/`):** Refactored `SubmissionsClient.tsx` to use `AdminPageHeader`, `AdminTableToolbar`, and `AdminTableCard`.
- [x] **Events Manager (`app/admin/(dashboard)/events/`):** Refactored `EventsAdminPage` to use `AdminPageHeader`, `AdminTableToolbar`, `AdminTableCard`, `StatusBadgeSelect`, and `ShareQrModal` with Indigo styling.
- [x] **Event Editor (`components/admin/EventEditor.tsx`):** Refactored to use `EditorLayout`, `EditorHeader`, `BilingualCanvas`, `CoverBannerPicker`, and `UrlSlugInspector`.
- [x] **Media Pool (`app/admin/(dashboard)/assets/`):** Refactored `AssetsPage` to use `AdminPageHeader`, `AdminTableToolbar`, `AssetCard`, and `AssetInspectorDrawer`.
- [x] **Taxonomy & Tags (`app/admin/(dashboard)/tags/`):** Refactored `TagsPage` to use `AdminPageHeader`, `AdminTableToolbar`, `AdminTableCard`, and `AdminStatusBanner`.
- [x] **Team Management (`app/admin/(dashboard)/team/`):** Refactored `TeamClient.tsx` to use `AdminPageHeader`, `AdminTableToolbar`, and `AdminTableCard`.
- [x] **Audit Logs Explorer (`app/admin/(dashboard)/logs/`):** Preserved SSR data fetching in `page.tsx` while refactoring `LogsClient.tsx` to use `AdminPageHeader`, `AdminTableToolbar`, and `AdminTableCard`.

---

## Acceptance Criteria
1. **Zero Markup Duplication:** `FormsClient`, `EventsAdminPage`, `SubmissionsClient`, `TagsPage`, `TeamClient`, and `LogsClient` share the exact same toolbar, table card, and header primitives without copy-pasting JSX markup.
2. **Unified Theme Enforcement:** All admin pages and editor sidebars strictly use the Indigo color palette (`bg-indigo-600`, `text-indigo-600`, `bg-indigo-50`, `focus:ring-indigo-500`).
3. **Reusable Editor Shell:** `FormBuilder` and `EventEditor` share the exact same `EditorLayout` container, top bar controls, and right inspector dimensions (`460px`).
4. **Modular Form Builder:** `BuilderClient.tsx` is streamlined by delegating question previews, choice configurations, and conditional logic to discrete child components.
5. **Shared QR Modal:** Form and Event sharing open the single extracted `ShareQrModal` and download 1000x1000 high-res QR codes with clear white margins.
6. **No Regressions:** Form building, event management, media pool browsing, team management, and audit log inspection function with clean TypeScript compilation (`npm run build`).