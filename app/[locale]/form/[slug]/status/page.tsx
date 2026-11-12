// app/[locale]/form/[slug]/status/page.tsx
import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicForm } from '../actions';
import { constructMetadata, resolveBilingualText } from '@/lib/seo';
import StatusInquiryClient from './StatusInquiryClient';

export const dynamic = 'force-dynamic';

interface StatusPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({
  params,
}: StatusPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const form = await getPublicForm(decodeURIComponent(slug));

  if (!form) {
    return constructMetadata({ locale, title: 'Not Found' });
  }

  const isZh = locale !== 'en';
  const baseTitle = resolveBilingualText(
    locale,
    form.schema?.titleZh || form.events?.title_zh || form.title,
    form.schema?.titleEn || form.events?.title_en || form.title
  );

  const title = isZh
    ? `報名進度查詢 — ${baseTitle}`
    : `Application Status Inquiry — ${baseTitle}`;

  return {
    ...constructMetadata({
      title,
      image: form.schema?.bannerImageUrl || undefined,
      path: `form/${form.slug}/status`,
      locale,
    }),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function PublicFormStatusPage({ params }: StatusPageProps) {
  const { locale, slug } = await params;
  const form = await getPublicForm(decodeURIComponent(slug));

  if (!form) {
    notFound();
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-base" />}>
      <StatusInquiryClient initialForm={form} locale={locale} />
    </Suspense>
  );
}