import { Metadata } from 'next';

interface ConstructMetadataProps {
  title?: string;
  description?: string;
  image?: string;
  locale: string;
  path?: string; 
  type?: 'website' | 'article';
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
  
  // Format the path cleanly (handles cases where path might be '/form?id=xxx' or 'form?id=xxx')
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const canonicalUrl = `${baseUrl}/${locale}${cleanPath}`;
  
  // Format the browser tab title (e.g., "Retreat Application | 道跡禪院")
  const formattedTitle = title ? `${title} | 道跡禪院` : defaultTitle;

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
        // x-default explicitly tells Google to prioritize the Chinese version 
        // if a user searches from a locale we don't explicitly support (e.g., Japan, Spain)
        'x-default': `${baseUrl}/zh${cleanPath}`, 
      },
    },
    
    // --- OPEN GRAPH (Facebook, LinkedIn, WhatsApp, WeChat) ---
    openGraph: {
      title: title || defaultTitle,
      description: description || defaultDescription,
      url: canonicalUrl,
      siteName: defaultTitle,
      images: [
        {
          // Fallback to a generic OG image in your public bucket if none is provided
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
      card: 'summary_large_image', // Ensures wide banner images span the full tweet width
      title: title || defaultTitle,
      description: description || defaultDescription,
      images: [image || `${baseUrl}/og-default.jpg`],
    },
  };
}