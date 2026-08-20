# Sprint 15: Storage Layer, Taxonomy & RBAC Foundation

## Objective
Establish the foundational data storage, taxonomy, and access control primitives required by all upcoming content domains:
1. Implement the PostgreSQL `nanoid(8)` generator and define migrations for `assets`, `tags`, `taggables`, and forward base tables (`events`, `content_pages`, `resources`).
2. Expand the centralized ABAC permission matrix (`lib/permissions.ts`) with typed action keys and role mappings.
3. Build the Cloudflare R2 Media Pool backend and management interface (`/admin/assets`).
4. Develop the reusable `<MediaPicker/>` drawer component for asset selection across all future content editors.
5. Build the Taxonomy management interface (`/admin/tags`) for Topic Pillars and polymorphic micro-tags.

---

## Scope & Schema Contracts

### 1. Database Migrations (`supabase/migrations/`)
*   **`nanoid(8)` Function:** PL/pgSQL utility generating 8-character Base62 alphanumeric strings (`[0-9a-zA-Z]`) for collision-safe short URLs.
*   **`assets` Table (Media Pool):**
    *   Fields: `id` (UUID PK), `file_url` (CDN URL), `s3_key` (unique), `file_name`, `mime_type`, `file_size_bytes`, `width`, `height`, `alt_text_zh`, `alt_text_en`, `created_by` (FK -> `auth.users`), `created_at`.
    *   Indexes: `mime_type`, `created_at DESC`.
*   **`tags` Table (Taxonomy):**
    *   Fields: `id` (UUID PK), `short_id` (`nanoid(8)` unique), `slug` (nullable unique), `name_zh`, `name_en`, `is_pillar` (boolean), `color` (hex), `created_at`.
    *   Indexes: `short_id`, partial unique on `slug`, `is_pillar`.
*   **`taggables` Table (Polymorphic Join):**
    *   Fields: `tag_id` (FK -> `tags.id`), `taggable_id` (UUID), `taggable_type` (`event` | `content_page` | `resource` | `asset`), `created_at`.
    *   Composite PK: `(tag_id, taggable_id, taggable_type)`.
*   **Forward Base Tables (`events`, `content_pages`, `resources`):**
    *   Establish base tables and foreign key relationships referencing `assets.id` and `forms.id` with `nanoid(8)` short IDs to ensure schema portability.
*   **Security & Audit:**
    *   Apply default-deny RLS policies (public read for assets/tags, authenticated CRUD for authorized roles).
    *   Attach CDC audit triggers on `assets` and `tags` logging to `audit_logs`.

---

## Technical Checklist

### Phase 1: Database Migration
- [ ] Create migration script with `nanoid()` function, `assets`, `tags`, `taggables`, and base forward tables.
- [ ] Configure RLS policies and CDC audit logging triggers for new tables.

### Phase 2: RBAC Matrix Expansion (`lib/permissions.ts`)
- [ ] Add granular permission keys:
  - Assets: `assets:view`, `assets:upload`, `assets:delete`
  - Tags: `tags:manage`
  - Events: `events:view`, `events:create`, `events:edit`, `events:delete`, `events:publish`
  - Articles: `articles:view`, `articles:create`, `articles:edit`, `articles:delete`, `articles:publish`
  - Resources: `resources:view`, `resources:create`, `resources:edit`, `resources:delete`, `resources:publish`
- [ ] Update role matrix mappings across all user roles.
- [ ] Update `app/admin/layout.tsx` navigation sidebar capability checks.

### Phase 3: Media Pool Backend (`app/admin/assets/actions.ts`)
- [ ] `uploadAssetAction`: Uploads files (images, PDFs, audio) to Cloudflare R2 public bucket via `@aws-sdk/client-s3`, inserts metadata into `assets` table. Guarded by `assets:upload`.
- [ ] `listAssetsAction`: Lists assets with MIME type filtering, search query, and pagination. Guarded by `assets:view`.
- [ ] `deleteAssetAction`: Deletes from R2 and removes record after validating no active references. Guarded by `assets:delete`.

### Phase 4: Admin UI Components
- [ ] **`/admin/assets` Page:** Media Pool Explorer with drag-and-drop upload zone, format filter tabs (`All`, `Images`, `Docs`, `Audio`, `Video`), search, and CDN link copying.
- [ ] **`<MediaPicker />` Component (`components/admin/MediaPicker.tsx`):** Reusable drawer modal supporting single/multi-selection, instant inline uploads, and format filtering.
- [ ] **`/admin/tags` Page:** Taxonomy manager with Topic Pillar toggle, color picker, search, and usage count badges. Guarded by `tags:manage`.

---

## Acceptance Criteria
1. PostgreSQL `nanoid(8)` successfully generates unique 8-character Base62 IDs on insert.
2. Admins with `assets:upload` can upload images, PDFs, and audio to R2, viewing them immediately in the Media Pool.
3. The `<MediaPicker/>` component can be mounted in an isolated container and cleanly emits selected asset records.
4. Admins with `tags:manage` can create, update, and delete tags and toggle Topic Pillar status.
5. All Server Actions enforce strict fail-closed guards with `requirePermission`.
6. Asset uploads/deletions and tag mutations generate clear, attributed records in `audit_logs`.