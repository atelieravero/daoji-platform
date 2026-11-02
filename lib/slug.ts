// lib/slug.ts

/**
 * System-reserved top-level paths and route prefixes that cannot be used as vanity slugs.
 */
export const RESERVED_SLUGS = new Set([
  'admin',
  'api',
  'auth',
  'login',
  'logout',
  'events',
  'event',
  'post',
  'posts',
  'news',
  'article',
  'articles',
  'content',
  'page',
  'pages',
  'resources',
  'resource',
  'form',
  'forms',
  'apply',
  'tags',
  'tag',
  'assets',
  'media',
  'zh',
  'en',
  'new',
  'edit',
  'preview',
  'robots.txt',
  'sitemap.xml',
  'favicon.ico',
]);

export function isReservedSlug(slug?: string | null): boolean {
  if (!slug) return false;
  return RESERVED_SLUGS.has(slug.trim().toLowerCase());
}

/**
 * Universal slug sanitizer allowing all RFC 3986 legitimate URL path characters:
 * Alphanumerics, hyphens, underscores, dots, plus, percent, and tildes.
 * Converts whitespace to hyphens and collapses duplicate hyphens.
 */
export function sanitizeSlug(raw: string): string {
  if (!raw) return '';
  return raw
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-_.~+%]/g, '')
    .replace(/-+/g, '-');
}