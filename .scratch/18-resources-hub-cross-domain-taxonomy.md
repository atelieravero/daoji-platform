# Sprint 18: Knowledge Resource Hub & Cross-Domain Taxonomy

## Objective
Deliver the curated public Knowledge Resource Hub (`/resources`), supporting multi-source cataloging (R2 Assets, YouTube, Articles, External Links), bidirectional Article ⟷ Resource synchronization, and cross-domain tag aggregation pages (`/tags/[id_or_slug]`):
1. Build Server Actions for `resources` with discriminated union validation on `source_type`.
2. Develop the administrative Resource Curator interface (`/admin/resources`) supporting dynamic target selection.
3. Implement bidirectional sync: checking "Feature in Resource Hub" in the Article Editor automatically creates/updates the matching `resources` record.
4. Build the public Knowledge Hub (`/resources`) with Topic Pillar tabs, format filters, inline audio player, and YouTube embeds.
5. Build the cross-domain Tag Aggregator (`/tags/[id_or_slug]`).

---

## Scope & Schema Contracts

### 1. Domain Entities & Relations
*   **`resources` Table:**
    *   Identity: `id` (UUID PK), `short_id` (8-char Base62, auto-generated, unique), `slug` (text, nullable, unique partial index).
    *   Source Union: `source_type` (`asset` | `youtube` | `article` | `external_link`).
    *   Targets: `target_asset_id` (FK -> `assets.id`), `target_page_id` (FK -> `content_pages.id`), `external_url` (text).
    *   Metadata: `title_zh`, `title_en`, `description_zh`, `description_en`, `author_speaker_zh`, `author_speaker_en`.
    *   Presentation: `cover_asset_id` (FK -> `assets.id`), `is_featured` (boolean).
    *   Publication: `status` (`draft` | `published` | `archived`), `created_at`, `updated_at`.
*   **Taxonomy:** Associated with Topic Pillars and Micro-tags via `taggables` (`taggable_type: 'resource'`).

---

## Technical Checklist

### Phase 1: Data Layer & Server Actions (`app/admin/resources/actions.ts`)
- [ ] Define Zod schemas with discriminated union matching `source_type` target requirements.
- [ ] Implement `createResourceAction`, `updateResourceAction`, `deleteResourceAction`, and `publishResourceAction`. Guarded by `resources:*`.
- [ ] Implement two-way sync helper: publishing an article with `is_featured_in_resources: true` creates/updates its corresponding `resources` row.
- [ ] Attach CDC audit triggers to record mutations in `audit_logs`.

### Phase 2: Admin Resource Curator (`app/admin/resources/`)
- [ ] **Resource Catalog List (`/admin/resources`):** Filter by `Source Type`, `Topic Pillar`, and `Featured` status.
- [ ] **Resource Curator Form (`/admin/resources/new`, `/admin/resources/[id]`):**
  - Source Type switcher (`Hosted Asset`, `YouTube Video`, `Website Article`, `External Link`).
  - Contextual target selector (Asset Picker for R2 files, Article Autocomplete for internal pages, or URL input).
  - Localized Title, Description, and Author/Speaker fields.
  - Cover Image selector via `<MediaPicker/>` and Topic Pillar tag selector.
  - Collapsible **"URL & SEO Settings"** panel (`short_id` + optional `slug`).
- [ ] Add `[x] Publish to Resource Hub` checkbox inside Sprint 17's Article Editor.

### Phase 3: Public Knowledge Hub & Tag Aggregator (`app/[locale]/`)
- [ ] **Resource Hub Catalog (`/resources`):**
  - Featured highlights section for `is_featured: true` items.
  - Topic Pillar filter tabs (Meditation, Suttas, Chanting, Vinaya).
  - Format filter pills (🎧 Audio, 📄 E-Books & PDFs, 🎥 Videos, 📖 Articles).
  - Integrated audio streaming player and YouTube embed player.
  - PDF/E-Book download cards with file size indicators.
- [ ] **Cross-Domain Tag Hub (`/tags/[id_or_slug]`):**
  - Aggregator page querying and displaying all **Events**, **Articles**, and **Resources** sharing the requested tag.
- [ ] Connect dynamic metadata generation via `constructMetadata` in `lib/seo.ts`.

---

## Acceptance Criteria
1. Admins can catalog hosted R2 files, YouTube talks, internal articles, and external links into the Resource Hub.
2. Checking "Publish to Resource Hub" in an article automatically creates a linked `resources` record without duplicate entry.
3. Visitors on `/resources` can filter by Topic Pillar and format, stream audio, watch video embeds, and download PDFs.
4. Visiting `/tags/[id_or_slug]` aggregates all matching events, articles, and resources in a unified view.
5. All mutations enforce RBAC guards and log CDC audit records.