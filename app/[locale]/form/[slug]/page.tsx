// app/[locale]/form/[slug]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicForm } from './actions';
import { constructMetadata, resolveBilingualText, resolveBilingualExcerpt } from '@/lib/seo';
import FormEngine from './FormEngine';

export async function generateMetadata({ params }: { params: Promise<{ locale: string, slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const form = await getPublicForm(resolvedParams.slug);

  if (!form) {
    return constructMetadata({ locale: resolvedParams.locale, title: 'Not Found' });
  }

  const title =
    resolveBilingualText(resolvedParams.locale, form.schema?.titleZh, form.schema?.titleEn) ||
    form.title;

  const description = resolveBilingualExcerpt({
    locale: resolvedParams.locale,
    summaryZh: form.schema?.summaryZh,
    summaryEn: form.schema?.summaryEn,
    bodyZh: form.schema?.subtitleZh,
    bodyEn: form.schema?.subtitleEn,
    maxLength: 150,
  });

  return constructMetadata({
    title,
    description,
    image: form.schema?.bannerImageUrl,
    locale: resolvedParams.locale,
    path: `form/${resolvedParams.slug}`,
  });
}

export default async function PublicFormPage({ params }: { params: Promise<{ locale: string, slug: string }> }) {
  const resolvedParams = await params;
  const form = await getPublicForm(resolvedParams.slug);

  if (!form) {
    notFound();
  }

  return <FormEngine initialForm={form} locale={resolvedParams.locale} />;
}