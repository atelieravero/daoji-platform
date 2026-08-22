# Sprint 15: Storage Layer, Taxonomy & RBAC Foundation

## Objective
Establish the foundational data storage, taxonomy, and access control primitives required by all upcoming content domains[cite: 12]:
1. Implement the PostgreSQL `nanoid(8)` generator and define migrations for `assets`, `tags`, `taggables`, and forward base tables (`events`, `content_pages`, `resources`)[cite: 12].
2. Expand the centralized ABAC permission matrix (`lib/permissions.ts`) with typed action keys and role mappings across 7 system roles[cite: 12].
3. Build the Cloudflare R2 Media Pool backend and management interface (`/admin/assets`) targeting `https://cdn.ajahnyiu.org` with 100MB payload limits.
4. Develop the reusable `<MediaPicker/>` drawer component for asset selection across all future content editors[cite: 12].
5. Build the Taxonomy management interface (`/admin/tags`) using `FormControls` for Topic Pillars and polymorphic micro-tags[cite: 12].
6. Re-architect admin routes using Next.js route groups (`app/admin/(dashboard)/`) to isolate public auth views from protected layouts.

---

## Scope & Schema Contracts

### 1. Database Migrations (`supabase/migrations/`)
*   **`nanoid(8)` Function:** PL/pgSQL utility generating 8-character Base62 alphanumeric strings (`[0-9a-zA-Z]`) for collision-safe short URLs[cite: 12].
*   **`assets` Table (Media Pool):**
    *   Fields: `id` (UUID PK), `file_url` (CDN URL pointing to `cdn.ajahnyiu.org`), `s3_key` (unique), `file_name`, `mime_type`, `file_size_bytes`, `width`, `height`, `alt_text_zh`, `alt_text_en`, `created_by` (FK -> `auth.users`), `created_at`[cite: 12].
    *   Indexes: `mime_type`, `created_at DESC`[cite: 12].
*   **`tags` Table (Taxonomy):**
    *   Fields: `id` (UUID PK), `short_id` (`nanoid(8)` unique), `slug` (nullable unique), `name_zh`, `name_en`, `is_pillar` (boolean), `color` (hex), `created_at`[cite: 12].
    *   Indexes: `short_id`, partial unique on `slug`, `is_pillar`[cite: 12].
*   **`taggables` Table (Polymorphic Join):**
    *   Fields: `tag_id` (FK -> `tags.id`), `taggable_id` (UUID), `taggable_type` (`event` | `content_page` | `resource` | `asset`), `created_at`[cite: 12].
    *   Composite PK: `(tag_id, taggable_id, taggable_type)`[cite: 12].
*   **Forward Base Tables (`events`, `content_pages`, `resources`):**
    *   `events`: Added `code` column (`^[A-Z0-9]{1,8}$`) with auto-fallback to `UPPER(nanoid(6))` replacing `interimEventCode` for applicant magic tokens[cite: 12].
    *   Establish base tables and foreign key relationships referencing `assets.id` and `forms.id` with `nanoid(8)` short IDs[cite: 12].
*   **Security & Audit:**
    *   Apply default-deny RLS policies (public read for assets/tags, authenticated CRUD for authorized roles)[cite: 12].
    *   Attach CDC audit triggers on `assets`, `tags`, `events`, `content_pages`, and `resources` with fail-safe non-null system actor fallbacks logging to `audit_logs`[cite: 12, 15].

---

## Technical Checklist

### Phase 1: Database Migration & Schema
- [x] Create migration script with `nanoid()` function, `assets`, `tags`, `taggables`, and base forward tables[cite: 12].
- [x] Configure RLS policies and CDC audit logging triggers with non-null system fallbacks (`system@internal`)[cite: 12, 15].
- [x] Synchronize PostgREST 14.5 definitions in `lib/supabase/types.ts`[cite: 12].

### Phase 2: RBAC Matrix Expansion & Route Isolation
- [x] Add granular permission keys[cite: 12]:
  - Assets: `assets:view`, `assets:upload`, `assets:delete`[cite: 12]
  - Tags: `tags:view`, `tags:create`, `tags:edit`, `tags:delete`[cite: 12]
  - Events: `events:view`, `events:create`, `events:edit`, `events:delete`, `events:publish`[cite: 12]
  - Articles: `articles:view`, `articles:create`, `articles:edit`, `articles:delete`, `articles:publish`[cite: 12]
  - Resources: `resources:view`, `resources:create`, `resources:edit`, `resources:delete`, `resources:publish`[cite: 12]
- [x] Update role matrix mappings across all 7 user roles (`super_admin`, `team_manager`, `form_editor`, `submission_viewer`, `content_editor`, `event_coordinator`, `viewer`)[cite: 12].
- [x] Refactor admin route hierarchy into `app/admin/(dashboard)/` to prevent auth redirect loops on `/admin/login`.
- [x] Update sidebar navigation capability checks and inline Server Action signout handler.

### Phase 3: Media Pool Backend & Storage Configuration
- [x] Configure `NEXT_PUBLIC_CDN_URL=https://cdn.ajahnyiu.org` across environment variables and database records.
- [x] Configure `serverActions.bodySizeLimit: '100mb'` and `middlewareClientMaxBodySize: '100mb'` in `next.config.mjs` for large audio/video/document uploads[cite: 12].
- [x] `uploadAssetAction`: Uploads files to R2 public bucket via `@aws-sdk/client-s3`, inserts metadata into `assets` table[cite: 12].
- [x] `listAssetsAction`: Lists assets with MIME type filtering, search query, and pagination[cite: 12].
- [x] `deleteAssetAction`: Deletes from R2 and removes record after verifying no active entity references[cite: 12].

### Phase 4: Admin UI Components
- [x] **`/admin/assets` Page:** Media Pool Explorer with drag-and-drop upload zone, format filter tabs, search, hover quick actions (copy CDN link, delete), and inspector sidebar drawer[cite: 12].
- [x] **`<MediaPicker />` Component (`components/admin/MediaPicker.tsx`):** Reusable drawer modal supporting single/multi-selection, instant inline uploads, and format filtering[cite: 12].
- [x] **`/admin/tags` Page:** Taxonomy manager with Topic Pillar toggle, color picker, search, and usage count badges styled with `FormControls`[cite: 12].

---

## Acceptance Criteria
1. PostgreSQL `nanoid(8)` successfully generates unique 8-character Base62 IDs on insert[cite: 12].
2. Admins with `assets:upload` can upload images, audio (MP3/M4A), and PDFs up to 100MB to R2 via `cdn.ajahnyiu.org`[cite: 12].
3. The `<MediaPicker/>` component mounts cleanly and emits selected asset records[cite: 12].
4. Admins with `tags:*` permissions can create, update, and delete tags and toggle Topic Pillar status[cite: 12].
5. All Server Actions enforce strict fail-closed guards with `requirePermission`[cite: 12].
6. Asset uploads/deletions and tag mutations generate clear, attributed records in `audit_logs`[cite: 12].