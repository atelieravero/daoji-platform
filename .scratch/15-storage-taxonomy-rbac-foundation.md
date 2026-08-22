# Sprint 15: Storage Layer, Taxonomy & RBAC Foundation

## Objective
Establish the foundational data storage, taxonomy, and access control primitives required by all upcoming content domains[cite: 18]:
1. Implement the PostgreSQL `nanoid(8)` generator and define migrations for `assets`, `tags`, `taggables`, and forward base tables (`events`, `content_pages`, `resources`)[cite: 18].
2. Expand the centralized ABAC permission matrix (`lib/permissions.ts`) with typed action keys and role mappings across 7 system roles[cite: 18].
3. Build the Cloudflare R2 Media Pool backend and management interface (`/admin/assets`) targeting `https://cdn.ajahnyiu.org` using direct client-to-R2 presigned PUT uploads supporting up to 100MB[cite: 18].
4. Develop the reusable `<MediaPicker/>` drawer component with inline direct presigned uploads for asset selection across all future content editors[cite: 18].
5. Build the Taxonomy management interface (`/admin/tags`) using `FormControls` for Topic Pillars and polymorphic micro-tags[cite: 18].
6. Re-architect admin routes using Next.js Route Groups (`app/admin/(dashboard)/`) to isolate public auth views from protected layouts and eliminate redirect loops[cite: 18].
7. Implement graceful permission error handling and silent denial UI patterns (hiding unauthorized actions like delete buttons)[cite: 18].

---

## Scope & Schema Contracts

### 1. Database Migrations (`supabase/migrations/`)
*   **`nanoid(8)` Function:** PL/pgSQL utility generating 8-character Base62 alphanumeric strings (`[0-9a-zA-Z]`) for collision-safe short URLs[cite: 18].
*   **`assets` Table (Media Pool):**
    *   Fields: `id` (UUID PK), `file_url` (CDN URL pointing to `cdn.ajahnyiu.org`), `s3_key` (unique), `file_name`, `mime_type`, `file_size_bytes`, `width`, `height`, `alt_text_zh`, `alt_text_en`, `created_by` (FK -> `auth.users`), `created_at`[cite: 18].
    *   Indexes: `mime_type`, `created_at DESC`[cite: 18].
*   **`tags` Table (Taxonomy):**
    *   Fields: `id` (UUID PK), `short_id` (`nanoid(8)` unique), `slug` (nullable unique), `name_zh`, `name_en`, `is_pillar` (boolean), `color` (hex), `created_at`[cite: 18].
    *   Indexes: `short_id`, partial unique on `slug`, `is_pillar`[cite: 18].
*   **`taggables` Table (Polymorphic Join):**
    *   Fields: `tag_id` (FK -> `tags.id`), `taggable_id` (UUID), `taggable_type` (`event` | `content_page` | `resource` | `asset`), `created_at`[cite: 18].
    *   Composite PK: `(tag_id, taggable_id, taggable_type)`[cite: 18].
*   **Forward Base Tables (`events`, `content_pages`, `resources`):**
    *   `events`: Added `code` column (`^[A-Z0-9]{1,8}$`) with auto-fallback to `UPPER(nanoid(6))` replacing `interimEventCode` for applicant magic tokens[cite: 18].
    *   Establish base tables and foreign key relationships referencing `assets.id` and `forms.id` with `nanoid(8)` short IDs[cite: 18].
*   **Security & Audit:**
    *   Apply default-deny RLS policies (public read for assets/tags, authenticated CRUD for authorized roles)[cite: 18].
    *   Attach CDC audit triggers on `assets`, `tags`, `events`, `content_pages`, and `resources` with neutral non-null system actor fallbacks (`system@internal`) logging to `audit_logs`[cite: 18].

---

## Technical Checklist

### Phase 1: Database Migration & Schema
- [x] Create migration script with `nanoid()` function, `assets`, `tags`, `taggables`, and base forward tables[cite: 18].
- [x] Configure RLS policies and CDC audit logging triggers with neutral non-null system fallbacks (`system@internal`)[cite: 18].
- [x] Synchronize PostgREST 14.5 definitions in `lib/supabase/types.ts`[cite: 18].

### Phase 2: RBAC Matrix Expansion & Route Group Isolation
- [x] Add granular permission keys[cite: 18]:
  - Assets: `assets:view`, `assets:upload`, `assets:delete`[cite: 18]
  - Tags: `tags:view`, `tags:create`, `tags:edit`, `tags:delete`[cite: 18]
  - Events: `events:view`, `events:create`, `events:edit`, `events:delete`, `events:publish`[cite: 18]
  - Articles: `articles:view`, `articles:create`, `articles:edit`, `articles:delete`, `articles:publish`[cite: 18]
  - Resources: `resources:view`, `resources:create`, `resources:edit`, `resources:delete`, `resources:publish`[cite: 18]
- [x] Update role matrix mappings across all 7 user roles (`super_admin`, `team_manager`, `form_editor`, `submission_viewer`, `content_editor`, `event_coordinator`, `viewer`)[cite: 18].
- [x] Refactor admin route hierarchy into `app/admin/(dashboard)/` to isolate unauthenticated login from protected layouts[cite: 18].
- [x] Update sidebar navigation capability checks and inline Server Action signout handler[cite: 18].
- [x] Update dashboard entry point (`app/admin/(dashboard)/page.tsx`) to route users dynamically based on active domain permissions[cite: 18].

### Phase 3: Media Pool Backend & Direct Presigned Storage
- [x] Configure `NEXT_PUBLIC_CDN_URL=https://cdn.ajahnyiu.org` across environment variables and database records[cite: 18].
- [x] Configure `serverActions.bodySizeLimit: '100mb'` and `proxyClientMaxBodySize: '100mb'` in `next.config.mjs` for large media streams[cite: 18].
- [x] `getAssetPresignedUploadUrlAction`: Generates S3 presigned PUT URLs for direct browser-to-R2 streaming, bypassing Vercel serverless payload limits[cite: 18].
- [x] `registerAssetAction`: Persists asset metadata to Supabase after successful direct storage upload[cite: 18].
- [x] `listAssetsAction`: Lists assets with MIME type filtering, search query, and pagination[cite: 18].
- [x] `deleteAssetAction`: Returns graceful failure objects on unauthorized attempts (no disruptive hard page redirects) and cleans up both R2 and DB records.
- [x] `getAssetPermissionsAction`: Server Action querying active user capability flags (`canUpload`, `canDelete`) for silent denial in the UI.

### Phase 4: Admin UI Components
- [x] **`/admin/assets` Page:** Media Pool Explorer with drag-and-drop upload zone, format filter tabs, search, hover quick actions (copy CDN link, delete), and full delete inspector sidebar drawer with silent denial checks[cite: 18].
- [x] **`<MediaPicker />` Component (`components/admin/MediaPicker.tsx`):** Reusable drawer modal supporting single/multi-selection, direct presigned uploads, and format filtering with typed payload guards[cite: 18].
- [x] **`/admin/tags` Page:** Taxonomy manager with Topic Pillar toggle, color picker, search, and usage count badges styled with `FormControls`[cite: 18].

---

## Acceptance Criteria
1. PostgreSQL `nanoid(8)` successfully generates unique 8-character Base62 IDs on insert[cite: 18].
2. Admins with `assets:upload` can upload images, audio (MP3/M4A), and PDFs up to 100MB directly to R2 via `cdn.ajahnyiu.org` without serverless payload errors[cite: 18].
3. The `<MediaPicker/>` component mounts cleanly and emits selected asset records[cite: 18].
4. Admins with `tags:*` permissions can create, update, and delete tags and toggle Topic Pillar status[cite: 18].
5. Unauthorized operations fail gracefully with contextual inline error banners rather than full-page redirect disruptions.
6. Delete actions are silently hidden from the UI for users without `assets:delete` permission.
7. Asset uploads/deletions and tag mutations generate clear, attributed records in `audit_logs`[cite: 18].