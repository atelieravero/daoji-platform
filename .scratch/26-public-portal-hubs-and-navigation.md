# Sprint 26: Public Portal Hubs, Feeds & Global Navigation [DEFERRED FOR LATER REVIEW]

## Objective
Complete the public-facing navigation shell and directory hubs—Events Calendar (`/[locale]/events`), News & Announcements Feed (`/[locale]/news`), and Homepage (`/[locale]`)—styled in the `#8E442A` Daoji Terracotta design system and unified with the Dhamma Library (`/[locale]/resources`).

---

## 1. Public Events Calendar Hub (`/[locale]/events`)
* Fetches `status = 'published'` events via `getPublicEvents()` with real-time linked-form registration status (`open`, `upcoming`, `closed`).
* Date / status filtering (`Upcoming` vs. `Past Events`, plus delivery language and in-person/livestream filters).
* `1.91:1` banner cards linking to `/[locale]/event/[id_or_slug]` (with `target="_blank"` detachment when `is_standalone = true`).

---

## 2. Public News & Announcements Feed (`/[locale]/news`)
* Strictly fetches `type = 'news'`, `status = 'published'` ordered by `is_pinned_in_feed DESC, published_at DESC`.
* Teaching articles (`type = 'teaching'`) live under `/[locale]/resources` and `/[locale]/teaching/[id_or_slug]` and never appear in `/[locale]/news` (news posts may explicitly link to or quote teaching articles inside their Markdown body).
* Renders `1.91:1` thumbnail cards linking to `/[locale]/news/[id_or_slug]` with Bodhi Gold (`--color-accent-ochre`) pinned badges, `resolveBilingualExcerpt` plain-text previews, and linked-event chips.

---

## 3. Homepage (`/[locale]`) & Global Navigation Shell (`app/[locale]/layout.tsx`)
* **Header / Navbar:** Brand logo (`道跡禪院`), top-level links (`活動與禪修 Events`, `最新消息 News`, `法寶文庫 Resources`, static pages), and locale switcher (`中文 / English`).
* **Homepage Curated Sections:** Featured upcoming events (`is_featured`), latest pinned news announcements, and featured Dhamma Library playlists/ebooks.
* **Footer:** Warm monastic footer (`surface-cream`, `border-surface-dark`) with center details and quick links (suppressed on standalone routes via `<StandaloneNotifier/>`).

---

## 4. Open UI Detail for Later Review
* **[DECISION 26-B] Static Pages in Top Navbar:** Confirm which static pages (`/[locale]/[slug]`) should appear in the top navbar vs. footer (e.g., `關於我們 /about`, `禪院介紹`, `護持贊助`).