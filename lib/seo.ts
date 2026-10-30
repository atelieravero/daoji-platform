// lib/seo.ts
import { Metadata } from 'next';

interface ConstructMetadataProps {
  title?: string;
  description?: string;
  image?: string;
  locale: string;
  path?: string; 
  type?: 'website' | 'article';
}

/**
 * Strips Markdown formatting into a clean single-line plain-text excerpt.
 */
export function stripMarkdownToPlainText(markdown?: string | null): string {
  if (!markdown) return '';
  return markdown
    // Remove fenced code blocks
    .replace(/```[\s\S]*?```/g, ' ')
    // Remove inline code
    .replace(/`([^`]+)`/g, '$1')
    // Remove images ![alt](url)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    // Replace links [text](url) with text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    // Remove custom red warning markers !!text!!
    .replace(/!!([^!]+)!!/g, '$1')
    // Remove template placeholders like {{TOKEN_BOX}}
    .replace(/\{\{[A-Z0-9_]+\}\}/g, ' ')
    // Remove HTML tags
    .replace(/<[^>]+>/g, ' ')
    // Remove headings, blockquotes, list markers, horizontal rules, emphasis
    .replace(/^[#>*\-+=\s]+/gm, ' ')
    .replace(/[*_~]+/g, '')
    // Collapse whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Enforces strict bilingual fallback chain: current lang > other lang > nil ('')
 */
export function resolveBilingualText(
  locale: string,
  zh?: string | null,
  en?: string | null
): string {
  const isZh = locale !== 'en';
  const primary = (isZh ? zh : en)?.trim();
  if (primary) return primary;
  const fallback = (isZh ? en : zh)?.trim();
  return fallback || '';
}

/**
 * Resolves explicit summary first (with bilingual fallback),
 * then falls back to plain-text stripped from the Markdown body.
 */
export function resolveBilingualExcerpt(params: {
  locale: string;
  summaryZh?: string | null;
  summaryEn?: string | null;
  bodyZh?: string | null;
  bodyEn?: string | null;
  maxLength?: number;
}): string | undefined {
  const { locale, summaryZh, summaryEn, bodyZh, bodyEn, maxLength = 150 } = params;

  const explicitSummary = resolveBilingualText(locale, summaryZh, summaryEn);
  const rawSource = explicitSummary
    ? stripMarkdownToPlainText(explicitSummary)
    : stripMarkdownToPlainText(resolveBilingualText(locale, bodyZh, bodyEn));

  if (!rawSource) return undefined;
  if (rawSource.length <= maxLength) return rawSource;
  return `${rawSource.slice(0, maxLength).trim()}…`;
}

export function constructMetadata({
  title,
  description,
  image,
  locale,
  path = '',
  type = 'website',
}: ConstructMetadataProps): Metadata {
  
  // Base URL fallback to handle local dev vs production automatically
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://daoji.info';
  
  // --- CHINESE-FIRST DEFAULTS ---
  const defaultTitle = '道跡禪院 | Maggapaṭipadā Meditation Centre';
  const defaultDescription = locale === 'en' 
    ? 'The ancient way illuminated. Your inner path to walk.' 
    : '返景林中，復照道跡，重覓內在的覺醒之道。';
  
  // Set Social locale based on current language
  const ogLocale = locale === 'en' ? 'en_US' : 'zh_HK';
  
  // Format the path cleanly
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const canonicalUrl = `${baseUrl}/${locale}${cleanPath}`;
  
  // MOD: Only use the passed title, no appended branding.
  const formattedTitle = title ? title : defaultTitle;

  return {
    title: formattedTitle,
    description: description || defaultDescription,
    metadataBase: new URL(baseUrl),
    
    // --- LANGUAGE ROUTING (Hreflang) ---
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en': `${baseUrl}/en${cleanPath}`,
        'zh': `${baseUrl}/zh${cleanPath}`,
        'x-default': `${baseUrl}/zh${cleanPath}`, 
      },
    },
    
    // --- OPEN GRAPH (Facebook, LinkedIn, WhatsApp, WeChat) ---
    openGraph: {
      title: title || defaultTitle,
      description: description || defaultDescription,
      url: canonicalUrl,
      // MOD: siteName removed to de-brand the origin
      images: [
        {
          url: image || `${baseUrl}/og-default.jpg`,
          width: 1200,
          height: 630,
          alt: title || defaultTitle,
        },
      ],
      locale: ogLocale,
      type,
    },
    
    // --- TWITTER / X CARDS ---
    twitter: {
      card: 'summary_large_image',
      title: title || defaultTitle,
      description: description || defaultDescription,
      images: [image || `${baseUrl}/og-default.jpg`],
    },
  };
}