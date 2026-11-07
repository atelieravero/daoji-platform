# Sprint 17: Editorial Content Pages & Posts (`content_pages`)

## Objective
Build the administrative workspace, two-pane editor, and public single-page views for Editorial Posts (`type = 'post'`) and Static Pages (`type = 'page'`).
*Note: Directory/hub feeds (`/news`, `/events`, `/resources`) and global filtering are deferred to Phase 2, and Taxonomy Tags (`taggables`) are deferred to a dedicated Tags sprint.*

---

## 1. Database Schema (`00_init_schema.sql`)

### 1.1 `content_pages`
* `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
* `short_id`: `TEXT NOT NULL UNIQUE DEFAULT nanoid(8)` (Immutable Base62 identifier)
* `slug`: `TEXT` (Optional, mutable, RFC 3986 safe characters, unique partial index `idx_content_pages_slug_unique`, validated against `RESERVED_SLUGS` in `lib/slug.ts`)
* `type`: `TEXT NOT NULL DEFAULT 'post' CHECK (type IN ('page', 'post'))`
* `title_zh`: `TEXT NOT NULL`
* `title_en`: `TEXT`
* `summary_zh`: `TEXT` (Optional custom summary; falls back to auto-extracted plain text from `body_zh`)
* `summary_en`: `TEXT` (Optional custom summary; falls back to auto-extracted plain text from `body_en`)
* `body_zh`: `TEXT NOT NULL DEFAULT ''`
* `body_en`: `TEXT`
* `cover_asset_id`: `UUID REFERENCES assets(id) ON DELETE SET NULL` (Active `1.91:1` cropped banner)
* `cover_original_asset_id`: `UUID REFERENCES assets(id) ON DELETE SET NULL` (Master uncropped asset for non-destructive re-cropping)
* `is_pinned_in_feed`: `BOOLEAN NOT NULL DEFAULT FALSE`
* `is_standalone`: `BOOLEAN NOT NULL DEFAULT FALSE` (Strictly suppresses site header, nav, and footer on the server)
* `status`: `TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'unlisted', 'archived'))`
* `published_at`: `TIMESTAMPTZ` (Auto-populated on first publish if blank, editable for both `post` and `page`)
* `created_at`, `updated_at`: `TIMESTAMPTZ`

### 1.2 `event_articles` (Single Source of Truth for Event Attachments)
* `event_id`: `UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE`
* `article_id`: `UUID NOT NULL REFERENCES content_pages(id) ON DELETE CASCADE`
* `sort_order`: `INTEGER NOT NULL DEFAULT 0`
* `PRIMARY KEY (event_id, article_id)`

---

## 2. Phase 1 Deliverables (Completed)

### 2.1 Platform-Wide Shared Enhancements
* **Uniform `1.91:1` (`1200×630`) Banner Aspect Ratio:** Standardized `<CoverBannerPicker/>` and `<ImageCropModal/>` to `1.91:1` across Events, Forms, and Content Pages/Posts for zero-crop parity with OpenGraph social cards and list/grid thumbnails.
* **Zero-Friction Summary & Auto-Excerpt Engine (`lib/seo.ts` & `<BilingualCanvas/>`):** Added `stripMarkdownToPlainText`, `resolveBilingualText`, and `resolveBilingualExcerpt` (`Explicit Summary -> Plain-text stripped from first 150 chars of Markdown Body`). Custom summary inputs in `<BilingualCanvas/>` are collapsed by default behind an optional toggle.
* **Centralized Slug Sanitization & Reserved Path Guard (`lib/slug.ts`):** Shared between client `<UrlSlugInspector/>` and server actions to protect system routes (`admin`, `api`, `events`, `event`, `post`, `news`, `resources`, `form`, `apply`, `tags`, etc.).

### 2.2 Admin Content Workspace (`/admin/content`)
* **List View (`ContentClient.tsx`):** Segmented type filter (`All Content`, `Posts`, `Static Pages`), status tabs (`All`, `Published`, `Unlisted`, `Draft`, `Archived`), debounced search, inline `<StatusBadgeSelect/>` via `updateContentStatusAction`, duplication, and `<ShareQrModal/>`.
* **Two-Pane Editor (`ContentPageEditor.tsx`):**
  * Left pane: `<BilingualCanvas/>` with collapsible custom summaries and `<MarkdownEditor/>` with `<MediaPicker/>` image insertion.
  * Right 460px inspector: Status selector, `post` vs `page` classification, `published_at` datetime picker, `1.91:1` `<CoverBannerPicker/>` with master crop retention, multi-select `<EventPickerModal/>` with ordering controls (for `post`), `<UrlSlugInspector/>` (`/post/` vs `/`), `is_pinned_in_feed` (for `post`), and `is_standalone`.

### 2.3 Public Single Post, Static Page & Event Routing
* **Public Single Post (`/[locale]/post/[id_or_slug]`):** Resolves `type = 'post'` with `status IN ('published', 'unlisted')` via `getSupabaseAdmin()` in `lib/content-pages.ts`. Renders a 2-column desktop layout with a `lg:sticky lg:top-8` Related Events sidebar (and bottom stacked card on mobile) when linked events exist, or a centered single-column layout otherwise. Legacy `/[locale]/news/[id_or_slug]` permanently redirects (301) to `/[locale]/post/[id_or_slug]`.
* **Public Static Page (`/[locale]/[id_or_slug]`):** Resolves `type = 'page'` with `status IN ('published', 'unlisted')`, guarded by `isReservedSlug`. Displays cover banner, `published_at` date, title, and Markdown body.
* **Public Single Event Route (`/[locale]/event/[id_or_slug]`):** Moved single event detail route to `/[locale]/event/[id_or_slug]` (with 301 permanent redirect from legacy `/[locale]/events/[id_or_slug]`) to reserve `/[locale]/events` for the Phase 2 Events Hub.