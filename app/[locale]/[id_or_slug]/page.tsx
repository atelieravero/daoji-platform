// app/[locale]/[id_or_slug]/page.tsx
import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Clock } from 'lucide-react';
import { getPublicContentByIdOrSlug } from '@/lib/content-pages';
import {
  constructMetadata,
  resolveBilingualText,
  resolveBilingualExcerpt,
} from '@/lib/seo';
import { isReservedSlug } from '@/lib/slug';
import MarkdownRenderer from '@/components/shared/MarkdownRenderer';
import StandaloneNotifier from '@/components/public/StandaloneNotifier';

interface StaticPageProps {
  params: Promise<{ locale: string; id_or_slug: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: StaticPageProps): Promise<Metadata> {
  const { locale, id_or_slug } = await params;

  if (isReservedSlug(id_or_slug)) {
    return constructMetadata({ locale, title: 'Not Found' });
  }

  const page = await getPublicContentByIdOrSlug(id_or_slug, 'page');
  if (!page) {
    return constructMetadata({ locale, title: 'Not Found' });
  }

  const title =
    resolveBilingualText(locale, page.title_zh, page.title_en) || undefined;
  const description = resolveBilingualExcerpt({
    locale,
    summaryZh: page.summary_zh,
    summaryEn: page.summary_en,
    bodyZh: page.body_zh,
    bodyEn: page.body_en,
    maxLength: 150,
  });

  return constructMetadata({
    title,
    description,
    image: page.cover_asset?.file_url || undefined,
    path: `${page.slug || page.short_id}`,
    locale,
    type: 'website',
  });
}

export default async function PublicStaticPage({ params }: StaticPageProps) {
  const { locale, id_or_slug } = await params;
  const isZh = locale !== 'en';

  if (isReservedSlug(id_or_slug)) {
    notFound();
  }

  const page = await getPublicContentByIdOrSlug(id_or_slug, 'page');

  if (!page) {
    notFound();
  }

  const title = resolveBilingualText(locale, page.title_zh, page.title_en);
  const body = resolveBilingualText(locale, page.body_zh, page.body_en);

  const formattedPublishedDate = page.published_at
    ? new Date(page.published_at).toLocaleDateString(isZh ? 'zh-HK' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <div className="min-h-screen bg-surface-base py-12 px-6 md:px-12 font-sans text-stone-900">
      <StandaloneNotifier
        isStandalone={Boolean(page.is_standalone)}
        locale={locale}
        forceStandaloneParam={false}
      />

      <article className="max-w-4xl mx-auto space-y-8">
        {page.cover_asset?.file_url && (
          <div className="w-full rounded-3xl overflow-hidden shadow-sm border border-stone-200/60 bg-surface-cream">
            <img
              src={page.cover_asset.file_url}
              alt={title}
              className="w-full h-auto object-contain block"
            />
          </div>
        )}

        <header className="space-y-3">
          {formattedPublishedDate && (
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <time dateTime={page.published_at || undefined}>
                {isZh ? `發佈於 ${formattedPublishedDate}` : `Published on ${formattedPublishedDate}`}
              </time>
            </div>
          )}

          <h1 className="text-2xl md:text-4xl font-extrabold text-stone-900 tracking-tight leading-tight">
            {title}
          </h1>
        </header>

        {body && (
          <div className="bg-white p-8 md:p-10 rounded-3xl border border-stone-200/80 shadow-xs">
            <MarkdownRenderer
              content={body}
              className="text-sm md:text-base leading-relaxed text-stone-800 space-y-4"
            />
          </div>
        )}
      </article>
    </div>
  );
}