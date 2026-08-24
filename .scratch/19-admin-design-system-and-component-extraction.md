# Sprint 19: Admin Design System & Component Extraction

## Objective
Standardize the entire admin dashboard workspace on the **Indigo** theme (`indigo-600`, `indigo-50`, `indigo-500`) and extract shared, reusable UI primitives across all administrative list views (`Forms`, `Events`, `Submissions`, `Assets`, `Taxonomy`, `Logs`) and editor workspaces (`FormBuilder`, `EventEditor`, and upcoming `ArticleEditor`)[cite: 27, 28, 33]:
1. Eliminate UI duplication across admin list tables, search toolbars, status dropdowns, and QR share modals.
2. Standardize the **Canvas + 460px Right Inspector** editor layout architecture with unified bilingual split/tab editing across all content domains[cite: 24, 28, 31].
3. Deduplicate the Media Pool explorer (`AssetsPage`) and the `<MediaPicker/>` drawer by extracting shared asset cards, grid shells, and direct presigned upload dropzones.
4. Enforce strict color token separation: **Indigo** exclusively for internal Admin tooling; **Daoji Ochre** (`#A65D24`, `#FAF5F0`) exclusively for public-facing shell pages (`/[locale]/...`)[cite: 14, 27].

---

## Scope & Architectural Blueprint

```text
components/admin/
├── shared/
│   ├── AdminPageHeader.tsx       # Standardized title, subtitle, optional breadcrumb, primary action button slot
│   ├── AdminTableToolbar.tsx     # Debounced search input + status filter tabs / action slots
│   ├── AdminTableCard.tsx        # Standard white card container, divide-y table shell, loading & empty states
│   ├── AdminStatusBanner.tsx     # Standardized dismissable success/error feedback banner
│   ├── ShareQrModal.tsx          # Universal modal for copying public link & downloading 1000x1000 scannable QR PNG
│   └── StatusBadgeSelect.tsx     # Color-coded status switcher (Draft, Published, Unlisted, Closed, Archived)
│
├── editor/
│   ├── EditorLayout.tsx          # Top bar + Center Canvas + 460px Right Inspector shell
│   ├── EditorHeader.tsx          # Back button, entity title, permalink/code badge, split-view toggle, save button
│   ├── BilingualCanvas.tsx       # Standardized EN/ZH writing surface (Side-by-side or Tabbed) with media triggers
│   ├── CoverBannerPicker.tsx     # Standardized cover image slot connected to MediaPool with preview/remove actions
│   └── UrlSlugInspector.tsx      # Slug input with auto-sanitization, domain prefix, and short_id permalink helper
│
└── assets/
    ├── AssetCard.tsx             # Universal media tile (preview, hover actions, metadata, selection ring)
    ├── AssetGrid.tsx             # Responsive grid container with format filters, loading, and empty states
    ├── AssetInspectorDrawer.tsx  # Metadata inspector panel with copyable CDN URL and delete controls
    └── UploadDropzone.tsx        # Drag-and-drop file upload zone with presigned R2 upload pipeline
```

---

## Technical Checklist

### Phase 1: Shared List Components (`components/admin/shared/`)
- [ ] Create `AdminPageHeader.tsx`: Title, subtitle, optional breadcrumb/back link, and primary action slot (`+ Create ...`).
- [ ] Create `AdminTableToolbar.tsx`: Debounced search input, status pill filter bar, and secondary action button slots.
- [ ] Create `AdminTableCard.tsx`: Standard white card container, table shell, `divide-y divide-gray-200`, loading skeleton/spinner, and empty state placeholder.
- [ ] Create `AdminStatusBanner.tsx`: Dismissable feedback banner with green/red status styling and dismiss callback.
- [ ] Create `ShareQrModal.tsx`: Universal sharing modal with public link copy input and high-resolution 1000x1000 scannable QR code PNG downloader (with 50px white margin).
- [ ] Create `StatusBadgeSelect.tsx`: Standardized status switcher with semantic color badges (`open`/`published` -> Emerald, `draft`/`unlisted` -> Amber/Gray, `closed`/`archived` -> Rose) supporting optimistic updates.
- [ ] Create `TableRowActions.tsx`: Reusable row action group (Preview, Share/QR, Duplicate, Delete) with permission-based silent denial.

### Phase 2: Editor Architecture Primitives (`components/admin/editor/`)
- [ ] Create `EditorLayout.tsx`: Two-pane workspace container (`flex-1 flex overflow-hidden` with central scrollable canvas and fixed 460px right inspector sidebar).
- [ ] Create `EditorHeader.tsx`: Top navigation bar with back navigation, entity title, code/short_id chip, single/split-pane view switcher, public preview button, and primary save action with loading state.
- [ ] Create `BilingualCanvas.tsx`: Writing surface managing side-by-side split view or single-language tabbed view (中文 Traditional / English) with integrated `MarkdownEditor` and Media Pool insertion triggers.
- [ ] Create `CoverBannerPicker.tsx`: Standardized cover image slot connecting directly to `<MediaPicker/>` with preview thumbnail and removal actions.
- [ ] Create `UrlSlugInspector.tsx`: Live-sanitized vanity URL slug input with domain prefix display, validation warnings, and permanent `short_id` permalink helper text.

### Phase 3: Media Pool & Utility Deduplication (`components/admin/assets/` & `lib/`)
- [ ] Create `lib/format.ts`: Centralize file size formatting (`formatFileSize`) and shared string helpers.
- [ ] Create `components/admin/assets/AssetCard.tsx`: Media tile displaying file preview (image thumbnail, audio icon, document icon), file size, MIME type badge, hover actions (copy URL, delete), and selection ring.
- [ ] Create `components/admin/assets/AssetGrid.tsx`: Responsive grid container with format filter tabs (`all`, `image`, `document`, `audio`, `video`), loading spinner, and empty state.
- [ ] Create `components/admin/assets/AssetInspectorDrawer.tsx`: Slide-out panel for asset inspection with preview, copyable CDN link, file metadata, and silent denial delete action.
- [ ] Create `components/admin/assets/UploadDropzone.tsx`: Drag-and-drop file upload zone managing direct presigned S3 PUT uploads.

### Phase 4: Migration & Refactoring
- [ ] **Forms Manager (`app/admin/(dashboard)/forms/`):** Refactor `FormsClient.tsx` to use `AdminPageHeader`, `AdminTableToolbar`, `AdminTableCard`, `StatusBadgeSelect`, and `ShareQrModal`.
- [ ] **Form Builder (`app/admin/(dashboard)/forms/builder/`):** Refactor `BuilderClient.tsx` to use `EditorLayout`, `CoverBannerPicker`, and `UrlSlugInspector`.
- [ ] **Submissions View (`app/admin/(dashboard)/forms/[form_id]/submissions/`):** Refactor `SubmissionsClient.tsx` to use `AdminPageHeader`, `AdminTableToolbar`, and `AdminTableCard`.
- [ ] **Events Manager (`app/admin/(dashboard)/events/`):** Refactor `EventsAdminPage` to use `AdminPageHeader`, `AdminTableToolbar`, `AdminTableCard`, `StatusBadgeSelect`, and `ShareQrModal` with Indigo styling.
- [ ] **Event Editor (`components/admin/EventEditor.tsx`):** Refactor to use `EditorLayout`, `EditorHeader`, `BilingualCanvas`, `CoverBannerPicker`, and `UrlSlugInspector`.
- [ ] **Media Pool (`app/admin/(dashboard)/assets/` & `components/admin/MediaPicker.tsx`):** Refactor both to consume `components/admin/assets/` primitives.

---

## Acceptance Criteria
1. **Zero Markup Duplication:** `FormsClient`, `EventsAdminPage`, and `SubmissionsClient` share the exact same toolbar, table card, and header components without copy-pasting JSX markup.
2. **Unified Theme Enforcement:** All admin pages and editor sidebars strictly use the Indigo color palette (`bg-indigo-600`, `text-indigo-600`, `bg-indigo-50`, `focus:ring-indigo-500`).
3. **Reusable Editor Shell:** `FormBuilder` and `EventEditor` share the exact same `EditorLayout` container, top bar controls, and right inspector dimensions (`460px`).
4. **Shared QR Modal:** Form and Event sharing open the single extracted `ShareQrModal` and download 1000x1000 high-res QR codes with clear white margins.
5. **No Regressions:** Form building, event management, media pool browsing, and submission filtering continue functioning identically with clean TypeScript compilation (`npm run build`).