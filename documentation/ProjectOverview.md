Daoji Platform - Project Overview

Core Architecture & Tech Stack

Framework: Next.js (App Router, [locale] internationalization routing)

Language: TypeScript

Styling: Tailwind CSS (Utility-first, responsive design, dark/light contrast considerations)

Icons: lucide-react

Database & Backend: Supabase (client.ts, server.ts, types)

Localization: next-intl (English and Traditional Chinese / 繁體中文 support)

Key Modules

Public Portal: Bilingual discovery feed (PostDiscoveryFeed), detail pages (PostDetailPage), and application flows (/apply/[form_id]).

Admin Dashboard (/admin):

Unified Editor (/admin/editor/[id]): Split-view or single-pane bilingual editing supporting blocks (headings, paragraphs, attachments, maps) and dynamic post types (events, pages, resources).

Tags & Filters (/admin/tags): Management of bilingual categorization slugs with usage tracking.

Forms Builder & Submissions: Dynamic form creation and response tracking.

Team, Resources, and Logs Management.