# Sprint 17: Editorial Articles, Static Pages & Bulletin Feed

## Objective
Implement the web-native reading experience for blog reflections, announcements, static pages (About Us, Contact), and event updates:
1. Build Server Actions for `content_pages` (`type: 'article' | 'page'`) guarded by `articles:*` RBAC permissions.
2. Develop the administrative Markdown/Notion-style editor with `<MediaPicker/>` integration, cover image selection, feed toggles, and event update linking.
3. Build the public Bulletin feed (`/news`) with sticky announcement banner support.
4. Implement public reading routes (`/news/[id_or_slug]` and `/[id_or_slug]`) with dual-lookup resolution and SEO metadata.
5. Connect attached update posts to Sprint 16’s Event Landing Page timeline.

---

## Scope & Schema Contracts

### 1. Domain Entities & Relations
*   **`content_pages` Table:**
    *   Identity: `id` (UUID PK), `short_id` (8-char Base62, auto-generated, unique), `slug` (text, nullable, unique partial index).
    *   Type: `type` (`page` | `article`).
    *   Content: `title_zh`, `title_en`, `body_zh` (Markdown), `body_en`.
    *   Placement: `is_in_feed` (boolean), `is_pinned_in_feed` (boolean).
    *   Relations: `cover_asset_id` (FK -> `assets.id`), `event_id` (FK -> `events.id`, nullable for 1:N updates).
    *   Publication: `status` (`draft` | `published` | `archived`), `published_at`, `created_at`, `updated_at`.
*   **Taxonomy:** Associated with Topic Pillars and Micro-tags via `taggables` (`taggable_type: 'content_page'`).

### 2. Dual-Lookup & Routing Contract
*   **Articles:** `/[locale]/news/[id_or_slug]`
*   **Static Pages:** `/[locale]/[id_or_slug]` (e.g., `/about`, `/contact`)
*   **Resolution Query:** `WHERE (short_id = :id_or_slug OR slug = :id_or_slug) AND status = 'published'`.

---

## Technical Checklist

### Phase 1: Data Layer & Server Actions (`app/admin/articles/actions.ts`)
- [ ] Define Zod validation schemas for articles and static pages.
- [ ] Implement `createArticleAction`: Handles metadata, Markdown body, cover asset, feed switches, and optional `event_id`. Guarded by `articles:create`.
- [ ] Implement `updateArticleAction`: Updates content, taxonomy, and placement. Guarded by `articles:edit`.
- [ ] Implement `deleteArticleAction`: Deletes page and associated tag joins. Guarded by `articles:delete`.
- [ ] Implement `publishArticleAction`: Manages state transitions and sets `published_at`. Guarded by `articles:publish`.
- [ ] Attach CDC audit triggers to record mutations in `audit_logs`.

### Phase 2: Admin Editorial Interface (`app/admin/articles/`)
- [ ] **Content List View (`/admin/articles`):** Filters for `Type` (`Article` vs `Page`), `Feed Status`, and `Event Attachment`.
- [ ] **Markdown Editor (`/admin/articles/new`, `/admin/articles/[id]`):**
  - Localized Title and Markdown editor.
  - Toolbar button to trigger `<MediaPicker/>` and insert markdown image links `![alt](url)`.
  - Cover Image selector via `<MediaPicker/>`.
  - Placement toggles: `[x] Show in News Feed`, `[x] Pin as Top Announcement`.
  - **"Attach to Event (Optional)"** dropdown selector.
  - Tag selector for Topic Pillars and Micro-tags.
  - Collapsible **"URL & SEO Settings"** panel (`short_id` + optional `slug`).

### Phase 3: Public Reading Experience (`app/[locale]/`)
- [ ] **Bulletin Feed (`/news`):**
  - Sticky announcement banner for `is_pinned_in_feed: true` posts.
  - Chronological stream with date, author, reading time, and Topic Pillar badges.
  - Interactive Event Context Card on posts linked to an `event_id` with link to `/events/[id_or_slug]`.
- [ ] **Article Reader (`/news/[id_or_slug]`):** Responsive typography, cover image, and tag pill footer.
- [ ] **Static Page Renderer (`/[id_or_slug]`):** Clean layout for About Us, Contact, and monastery rules.
- [ ] **Event Timeline Wiring:** Update `/events/[id_or_slug]` to query and display all attached articles chronologically.
- [ ] Connect dynamic metadata generation via `constructMetadata` in `lib/seo.ts`.

---

## Acceptance Criteria
1. Articles can be drafted, formatted in Markdown, and published with inline images selected from the Media Pool.
2. Posts linked to an event automatically appear in the timeline of the corresponding `/events/[id_or_slug]` page.
3. Pinned articles render as priority alert banners at the top of `/news`.
4. Static pages resolve cleanly via `/[slug]` or `/[short_id]` without appearing in the news feed.
5. All Server Actions strictly enforce RBAC checks via `requirePermission`.