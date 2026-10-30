// app/[locale]/events/[id_or_slug]/page.tsx
import { permanentRedirect } from 'next/navigation';

interface LegacyEventRedirectProps {
  params: Promise<{ locale: string; id_or_slug: string }>;
}

export default async function LegacyEventRedirect({ params }: LegacyEventRedirectProps) {
  const { locale, id_or_slug } = await params;
  
  // Permanently redirect 301 to the canonical singular route
  permanentRedirect(`/${locale}/event/${id_or_slug}`);
}