import React from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import PublicShell from '@/components/shared/PublicShell';

// MOCK: Simulates fetching dynamic navigation items where `showInNav: true`
const fetchDynamicNavItems = async () => {
  return [
    { href: '/lineage', label: { en: 'Our Lineage', zh: '傳承與歷史' } },
    { href: '/teachings', label: { en: 'Core Teachings', zh: '核心教義' } }
  ];
};

// MOCK: Simulates fetching specific reserved system pages for the footer
const fetchReservedFooterPages = async () => {
  return [
    { href: '/privacy', label: { en: 'Privacy Policy', zh: '隱私政策' } },
    { href: '/contact', label: { en: 'Contact Us', zh: '聯絡我們' } }
  ];
};

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const resolvedParams = typeof (params as any).then === 'function' ? await params : params;
  const locale = (resolvedParams as any).locale;

  // Enable Next.js static rendering optimizations for localization
  setRequestLocale(locale);

  // Fetch dictionaries and dynamic CMS routing items
  const messages = await getMessages();
  const dynamicAboutPages = await fetchDynamicNavItems();
  const footerPages = await fetchReservedFooterPages();

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <PublicShell 
        dynamicAboutPages={dynamicAboutPages} 
        footerPages={footerPages}
        locale={locale as 'en' | 'zh'}
        dictionary={messages}
      >
        {children}
      </PublicShell>
    </NextIntlClientProvider>
  );
}