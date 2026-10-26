# Sprint 17: Editorial Content Pages & Posts (`content_pages`)

## Objective
Build the administrative editor and public single-page view for Editorial Articles/Posts and Static Pages (`content_pages`). 
*Note: Directory/hub feeds (`/news`, `/events`, `/resources`, `/tags`) and global filtering are intentionally deferred to Phase 2 until the single Page/Post editor and public view are complete.*

---

## 1. Database Schema Reference (Already in `00_init_schema.sql`)

### 1.1 `content_pages`
*   `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
*   `short_id`: `TEXT NOT NULL UNIQUE DEFAULT nanoid(8)` (Immutable Base62 identifier)
*   `slug`: `TEXT` (Optional, mutable, RFC 3986 safe characters, unique partial index `idx_content_pages_slug_unique`)
*   `type`: `TEXT NOT NULL DEFAULT 'article' CHECK (type IN ('page', 'article'))`
*   `title_zh`: `TEXT NOT NULL`
*   `title_en`: `TEXT`
*   `body_zh`: `TEXT NOT NULL DEFAULT ''`
*   `body_en`: `TEXT`
*   `cover_asset_id`: `UUID REFERENCES assets(id) ON DELETE SET NULL`
*   `event_id`: `UUID REFERENCES events(id) ON DELETE SET NULL` (Legacy/primary event pointer)
*   `is_in_feed`: `BOOLEAN NOT NULL DEFAULT TRUE`
*   `is_pinned_in_feed`: `BOOLEAN NOT NULL DEFAULT FALSE`
*   `status`: `TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived'))`
*   `published_at`: `TIMESTAMPTZ`
*   `created_at`, `updated_at`: `TIMESTAMPTZ`

*(Optional schema enhancement to evaluate during implementation: whether `summary_zh` / `summary_en`, `cover_original_asset_id`, or `is_standalone` should be added to `content_pages` for parity with `events`.)*

### 1.2 `event_articles` (Multi-Event Attachments)
*   `event_id`: `UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE`
*   `article_id`: `UUID NOT NULL REFERENCES content_pages(id) ON DELETE CASCADE`
*   `sort_order`: `INTEGER NOT NULL DEFAULT 0`
*   `PRIMARY KEY (event_id, article_id)`

### 1.3 `taggables` (Polymorphic Tags)
*   `tag_id`, `taggable_id`, `taggable_type = 'content_page'`

---

## 2. Phase 1 Scope: Admin Editor & Public Single Page/Post

### 2.1 Admin List View (`/admin/articles` or `/admin/pages`)
*   Built with shared primitives: `<AdminPageHeader/>`, `<AdminTableToolbar/>`, `<AdminTableCard/>`, and `<ShareQrModal/>`.
*   **Filtering & Search:** Filter by `status` (`all`, `draft`, `published`, `archived`) and `type` (`article` vs `page`), plus debounced title/slug search.
*   **RBAC:** Guarded by `lib/permissions.ts` (`content:view`, `content:create`, `content:edit`, `content:publish`, `content:delete` — with silent denial for unauthorized actions).

### 2.2 Two-Pane Admin Editor (`ContentPageEditor.tsx`)
*   **Left Pane (`<BilingualCanvas/>`):**
    *   Bilingual Title (`title_zh`, `title_en`) and Markdown Body (`body_zh`, `body_en`) with `<MediaPicker/>` image insertion.
*   **Right Pane (460px Inspector inside `<EditorLayout/>`):**
    *   **Publishing & Type:** `status` (`draft`, `published`, `archived`), `type` (`article` vs `page`), and `published_at` timestamp (auto-populated on first publish if blank, editable by admin).
    *   **URL & Permalink (`<UrlSlugInspector/>`):** Displays immutable `short_id` and editable RFC 3986 vanity `slug`.
    *   **Cover Image (`<CoverBannerPicker/>`):** Connects `cover_asset_id` (and optional master crop retention if enabled).
    *   **Feed & Display Controls:** `is_in_feed` toggle, `is_pinned_in_feed` toggle.
    *   **Related Events (`event_articles`):** Multi-event picker allowing an article/update to be attached to one or more operational events (which immediately surfaces under "Related Articles & Updates" on `/[locale]/events/[id_or_slug]`).
    *   **Taxonomy Tags (`taggables`):** Tag selector syncing `taggable_type = 'content_page'`.

### 2.3 Public Single Page / Post View
*   **Routing:**
    *   `/[locale]/news/[id_or_slug]` (Matches existing links rendered on the Public Event Detail page: `href={`/${locale}/news/${art.slug || art.short_id}`}`).
    *   Evaluate whether `type = 'page'` shares `/[locale]/news/[id_or_slug]` or also resolves at `/[locale]/p/[id_or_slug]` / `/[locale]/[id_or_slug]`.
*   **Data Resolution (`lib/content-pages.ts`):**
    *   Uses `getSupabaseAdmin()` (matching `lib/events.ts` and `getPublicForm`) so social crawlers and anonymous users resolve `cover_asset`, attached events, and tags without RLS/cookie discrepancies.
    *   Dual lookup by `short_id` OR `slug` (`short_id.eq."${decoded}",slug.eq."${decoded}"`), strictly restricted to `status = 'published'`.
*   **Bilingual Fallback & SEO:**
    *   Follows `current lang > other lang > nil` for title and markdown body.
    *   `generateMetadata` uses `constructMetadata` from `lib/seo.ts` with `type: 'article'`, cover image URL, and plain-text excerpt fallback.