# 10. Dynamic SEO & Metadata Architecture

## Objective
Build a reusable, extensible metadata generation system for public routes to ensure accurate browser tab titles, rich social sharing (OG tags), and proper bilingual search engine indexing (hreflang), explicitly prioritizing Traditional Chinese content and fallback coverage.

## Context
Currently, public pages inherit default Next.js boilerplate metadata (e.g., "Create Next App"). The platform requires dynamic `<title>` tags that mirror the specific content being viewed. Because the platform will eventually host various content types (Forms, Posts, Events), the architecture must utilize a shared core utility (`lib/seo.ts`) to prevent code duplication, while allowing type-specific adapters to handle unique requirements. Given that the platform's primary audience and content are predominantly Traditional Chinese (>75%), Chinese metadata and fallback chains must take explicit priority whenever default or arbitrary fallback choices are made.

## Technical Constraints
*   **Next.js Standards:** Must utilize the App Router's native `generateMetadata` function.
*   **Shared Core Utility:** A central factory function (`constructMetadata` in `lib/seo.ts`) managing site-wide constants (Chinese-first Org Name, default OG structure, Twitter card formats) and automatically generating alternate `hreflang` links for `/zh` and `/en`.
*   **Chinese-First i18n & Fallback Chain:**
    *   **Chinese locale (`/zh`):** `titleZh` ➔ `titleEn` ➔ Default Chinese Site Title ("道跡禪院 | Maggapaṭipadā Meditation Centre").
    *   **English locale (`/en`):** `titleEn` ➔ `titleZh` ➔ Default English/Bilingual Title.
    *   **Default `og:locale`:** Defaults to `zh_HK` (or `zh_TW`) for primary Chinese branding, switching to `en_US` for `/en` routes.
*   **Type-Specific Adapters:** The public Form route must fetch its specific schema and map localized title/subtitle fields to the SEO Title and Description.
*   **Asset Handling:** `bannerImageUrl` must be mapped to the `og:image` property, paving the way for future aspect-ratio manipulation.

## Acceptance Criteria
- [ ] Create a shared `lib/seo.ts` containing the core metadata factory function (`constructMetadata`).
- [ ] Implement `generateMetadata` in `app/[locale]/form/page.tsx` to dynamically fetch the form schema prior to rendering.
- [ ] Ensure the browser tab `<title>` perfectly matches the localized form title with Chinese-first fallback rules.
- [ ] Verify that Open Graph (`og:title`, `og:description`, `og:image`, `og:locale`) and Twitter card tags are correctly injected into the `<head>`.
- [ ] Verify canonical URLs and alternate language tags (`hreflang`) are correctly generated for `/zh` and `/en`.