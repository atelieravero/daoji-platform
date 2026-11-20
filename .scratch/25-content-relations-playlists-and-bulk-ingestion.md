# Sprint 25: Content Relations, Collections & Pre-Launch Bulk Ingestion [READY]

## Objective
1. Upgrade the content and media database schema *before* bulk loading—flattening `content_pages.type` into `'page' | 'news' | 'teaching'` with split canonical routes and adding N:M media pairing and curated collections so edited teaching articles, source audio/video recordings, ebooks, and sequential playlists/article series are relationally modeled from day one.
2. Build idempotent local CLI bulk-ingestion scripts (with explicit human-in-the-loop review manifests and custom Simplified → Traditional Chinese glossary overrides) to populate the platform with Ajahn Yiu's existing archive across 4 sources before public launch.

---

## 1. Schema Refinements (`00_init_schema.sql`) & Route Split

### 1.1 Single-Layer `content_pages.type` & Canonical Route Split
* Flatten `content_pages.type` to `TEXT NOT NULL DEFAULT 'news' CHECK (type IN ('page', 'news', 'teaching'))` (migrating existing `'post'` rows to `'news'`) and add `external_source_key TEXT` (unique partial index for idempotent WeChat imports).
* **Canonical Route Map (with Cross-Type 301 Protection):**
  * `type = 'page'` → `/[locale]/[id_or_slug]` (Static Pages; add `'teaching'` to `RESERVED_SLUGS` in `lib/slug.ts`).
  * `type = 'news'` → `/[locale]/news/[id_or_slug]` (Operational bulletins, event notices, and recaps surfaced in `/[locale]/news` and Event detail pages; may quote or link to a teaching article in Markdown if needed).
  * `type = 'teaching'` → `/[locale]/teaching/[id_or_slug]` (Edited Dhamma articles adapted from audio/video recordings surfaced exclusively in `/[locale]/resources` and Article Series; never appear in `/[locale]/news`).
  * Legacy `/[locale]/post/[id_or_slug]` → converts to a lightweight 301 redirector resolving the record and forwarding to `/news/...` or `/teaching/...`.
  * Cross-type protection: if a record is reclassified between `'news'`, `'teaching'`, and `'page'`, visiting its old path issues a 301 permanent redirect to the canonical route.
* **Admin Content Workspace Updates (`/admin/content` & `ContentPageEditor.tsx`):**
  * Update segmented type filter (`All`, `News`, `Teaching`, `Page`) and 3-way type selector in the editor inspector (scoping `event_articles` & `is_pinned_in_feed` to `'news'`, `article_resources` to `'teaching'`, and hiding feed/relation controls on `'page'`).

### 1.2 `resources` Media & Idempotent Import Metadata
* Add columns to `resources`:
  * `duration_seconds INTEGER` (Audio/video playback duration for podcast & library UI)
  * `recorded_at TIMESTAMPTZ` (Original class/retreat recording date, distinct from `created_at`)
  * `external_source_key TEXT` (Unique partial index for idempotent upserts: `yt:<video_id>`, `audio:<slug>`, `book:<slug>`)
  * `media_meta JSONB NOT NULL DEFAULT '{}'::jsonb` (Stores optional secondary links and metadata such as `readmoo_url`, `youtube_id`, `wechat_url`, and `session_segment`)
* Expand `resources.status` check constraint to `'draft' | 'published' | 'unlisted' | 'archived'`.

### 1.3 `article_resources` (N:M Edited Article ⟷ Source Media Pairing)
* Replaces the 1:1 limitation of `resources.target_page_id` so one edited article can link to both an R2 MP3 audio file and a YouTube video (and one long retreat recording can link to multiple edited articles):
  * `article_id UUID NOT NULL REFERENCES content_pages(id) ON DELETE CASCADE`
  * `resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE`
  * `relation_type TEXT NOT NULL DEFAULT 'source_audio' CHECK (relation_type IN ('source_audio', 'source_video', 'related'))`
  * `sort_order INTEGER NOT NULL DEFAULT 0`
  * `PRIMARY KEY (article_id, resource_id)`

### 1.4 `collections` & `collection_items` (Playlists & Article Series)
* Unified DRY schema powering both flat media playlists and sequential reading series:
  * **`collections`:** `id` (UUID PK), `short_id` (`nanoid(8)`), `slug`, `collection_type` (`'audio_playlist' | 'video_playlist' | 'article_series'`), `title_zh`, `title_en`, `description_zh`, `description_en`, `cover_asset_id`, `event_id` (optional FK to parent retreat), `external_source_key` (unique partial index: `audio_folder:<slug>`, `yt_playlist:<id>`, `wechat_album:<id>`), `is_featured`, `status` (`'draft' | 'published' | 'unlisted' | 'archived'`), `created_at`, `updated_at`.
  * **`collection_items`:** `id` (UUID PK), `collection_id` (FK), `resource_id` (FK, nullable), `article_id` (FK, nullable), `sort_order`, with `collection_items_target_check` enforcing exactly one of `resource_id` or `article_id` is non-null, plus unique partial indexes preventing duplicate entries per collection.
* Expand `taggables.taggable_type` check constraint to include `'collection'`.

### 1.5 Initial Six Pillar Tags (`tags` with `is_pillar = true`)
1. `guided-meditation` — Guided Meditation / 禪修引導
2. `dhamma-discourse` — Dhamma Discourse / 佛法開示
3. `dhamma-qa` — Dhamma Q&A / 佛法答疑
4. `active-practice` — Active Practice / 動中修行
5. `dialogue-interview` — Dialogue & Interview / 對談與訪談
6. `ebooks` — Ebooks / 出版書籍

---

## 2. Pre-Launch Bulk Ingestion Pipeline (Local CLI Scripts)

All scripts run locally on macOS against Cloudflare R2 and Supabase Service Role, writing dry-run manifests for explicit human sign-off before committing to production.

### 2.1 Shared Conversion Guard (`scripts/ingest/s2hk-glossary.json`)
* Converts Simplified Chinese titles and WeChat article bodies to Hong Kong Traditional Chinese via `opencc-js` (`s2hk`).
* Applies a version-controlled custom override glossary (`scripts/ingest/s2hk-glossary.json`) right after `opencc-js` to catch Buddhist, Pali-derived, and practice terminology edge cases (reusable later in the Admin WeChat Importer).

### 2.2 Source-Specific Pipelines
1. **10 PDF Ebooks (`hktheravada.org` — `出版書籍`):**
   * Upload PDFs and cover images to R2 (`books/...`), upsert into `assets` + `resources` (`source_type = 'asset'`), tag with `ebooks`, and reserve `media_meta.readmoo_url` for future Readmoo links on the same unified card.
2. **Baidu Pan Audio Archive (Local Folder Staging — Selected Public Folders Only):**
   * Admin downloads only approved public folders locally (preserving folder structure). Internal folders (such as `# 阿赞耀-法工会`) are strictly excluded.
   * Local CLI walks the folder tree, parses filenames (`YYYY年MM月DD日阿赞耀禅修课 引导/开示/答疑.mp3`) into `recorded_at`, `duration_seconds`, pillar tags, and flat chronological `audio_playlist` collections.
   * Transcodes raw `70MB–117MB` MP3s via `ffmpeg` (`-ac 1 -b:a 96k`, ~15MB/hr) for fast mobile and Mainland China streaming on R2 (`audio/YYYY/MM/...`); original masters stay archived locally on NAS.
3. **YouTube Channel (`@hktheravada` — Selected Playlists Only):**
   * Zero video files stored on R2 (embedded playback only).
   * Exports selected playlist URLs via `yt-dlp --flat-playlist --dump-json`, preserving playlist order in `collections` (`collection_type = 'video_playlist'`) while deduplicating shared videos via `external_source_key = 'yt:<video_id>'`.
4. **WeChat Official Account (`林中道跡` — 6 Albums + Standalone Articles):**
   * Imports full article text into `content_pages` (`type = 'teaching'`).
   * **Strict Pure Markdown:** Strips all WeChat HTML wrappers, inline styles, `<span>`/`<section>` tags, and decorative boilerplate so imported articles contain strictly clean Markdown (`#`/`##` section headings, body paragraphs, blockquotes, lists, and mirrored R2 images).
   * Mirrors all `mmbiz.qpic.cn` images to R2 (`cdn.ajahnyiu.org`) before rewriting Markdown image links.
   * Groups each WeChat album into an `article_series` collection.
   * Generates a **proposed `article_resources` match manifest (CSV/JSON)** pairing articles with matching-date R2 audio and YouTube videos for **mandatory human sign-off** before inserting links.