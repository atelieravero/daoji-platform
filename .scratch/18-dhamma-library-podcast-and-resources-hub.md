# Sprint 18: Dhamma Library, Podcast Player & Resources Hub

## Objective
Deliver the public Dhamma Library at `/[locale]/resources` (audio podcast, embedded YouTube discourses, edited teaching articles, and published ebooks), a persistent zero-login **audio-only** podcast mini-player with full queue management, bi-directional Edited Article ⟷ Source Recording pairing, and ongoing Admin operational tools (including fixing the Media Pool drag-and-drop navigation bug).

---

## 1. Public Dhamma Library UX (`/[locale]/resources`)
* **Single Library Route:** All evergreen Dhamma content (`resources`, `collections`, and `content_pages` where `type = 'teaching'`) lives under `/[locale]/resources`.
* **Three-Dimensional Browsing:**
  * **Format Tabs:** `全部 All` | `錄音 Audio` | `錄影 Video` | `文字 Articles` | `書籍 Ebooks`
  * **Practice Category Pills (6 Pillar Tags):** `Guided Meditation / 禪修引導` | `Dhamma Discourse / 佛法開示` | `Dhamma Q&A / 佛法答疑` | `Active Practice / 動中修行` | `Dialogue & Interview / 對談與訪談` | `Ebooks / 出版書籍`
  * **Curated Collections Shelf (`collections`):**
    * `audio_playlist` → displayed as **錄音播放清單 / Audio Playlist** (flat chronological track list, with **"Play All"** and **"+ Add Playlist to Queue"** actions).
    * `video_playlist` → displayed as **錄影播放清單 / Video Playlist** (flat list with inline `youtube-nocookie.com` player).
    * `article_series` → displayed as **系列專題 / Article Series** (with a **"Previous / Next in Series"** navigator at the bottom of each linked teaching article).
* **Ebook Cards (`Ebooks`):** Single unified resource card (`source_type = 'asset'`) showing cover thumbnail and title/author. Clicking the PDF opens the R2 CDN URL directly in a **new browser tab** (`target="_blank" rel="noopener noreferrer"`) with no embedded PDF frame, alongside an optional external **Readmoo** link button when `media_meta.readmoo_url` is set.

---

## 2. Persistent Zero-Login Audio Mini-Player (Audio-Only)
* **Strict Audio-Only Scope (R2 MP3s):** Videos are **not** mixed into the mini-player queue (preserving mobile lock-screen background playback via the `MediaSession` API, Mainland China reliability, and YouTube ToS compliance). Videos play inline on video cards and video playlist views.
* **Global Mini-Player (`components/public/AudioPlayerProvider.tsx` & `GlobalAudioBar.tsx`):**
  * Mounted in `app/[locale]/layout.tsx`; continues playing uninterrupted across normal portal navigation (standalone pages open in a separate tab, requiring no special pause/interception logic on the listening tab).
  * **Playback Controls:** Play/Pause, `-15s / +30s`, playback speed (`1.0x`, `1.25x`, `1.5x`), scrub bar with elapsed/total duration, and expandable Queue Drawer.
  * **Full `localStorage` Queue Management (Zero Login):**
    * `Play Now` (play single audio track immediately)
    * `+ Queue` (append single track to end of current queue)
    * `Play All` (load a curated `audio_playlist` and start track 1)
    * `+ Add Playlist to Queue` (append all tracks of a curated `audio_playlist` onto the end of a non-empty queue without interrupting current playback)
    * Inside Queue Drawer: jump to any track, remove individual item (`×`), reorder items (up/down or drag), and `Clear Queue`.

---

## 3. Bi-Directional Edited Article ⟷ Source Recording Dock
* **On Teaching Article Pages (`/[locale]/teaching/[id_or_slug]`):**
  * Queries `article_resources` and displays a compact **"Original Recording / 原錄音/原錄影"** dock directly beneath the header.
  * R2 MP3 audio renders an independent `Play` + `+ Queue` bar launching the global mini-player (ensuring Mainland China visitors always have reliable playback even when YouTube is blocked), alongside an expandable YouTube embed if linked.
  * If the article belongs to an `article_series` collection, displays a compact series banner and **Previous / Next** links at the bottom.
* **On Audio / Video Resource Cards & Detail Views:**
  * Displays a **"Read Edited Article / 閱讀文字整理稿"** link pointing to `/[locale]/teaching/[id_or_slug]` whenever linked via `article_resources`.

---

## 4. Ongoing Admin Operations (`/admin/resources`, `/admin/collections` & Uploader Fix)
* **Drag-and-Drop Navigation Bug Fix:** Harden the Media Pool uploader and new Batch Audio Dropzone with `e.preventDefault(); e.stopPropagation();` on dropzone `dragenter`/`dragover`/`drop` handlers plus a `window`-level `dragover`/`drop` guard while mounted so missed drops never navigate the browser tab away from the page.
* **Admin Resources & Collections Manager:** CRUD for audio, video, ebooks (`media_meta.readmoo_url`), `article_resources` links, and flat-ordered `collections` (`audio_playlist`, `video_playlist`, `article_series`).
* **Batch Audio Dropzone:** Multi-file MP3 uploader that parses `YYYY年MM月DD日...引导/开示/答疑.mp3` filenames to pre-fill date, title, duration, pillar tag, and target `audio_playlist` in one step.
* **WeChat Article Importer (in `ContentPageEditor.tsx`):** Paste a WeChat URL to fetch HTML, mirror inline images to R2, strip raw HTML into clean pure Markdown, apply `opencc-js` (`s2hk`) + `s2hk-glossary.json`, and pre-fill the editor.