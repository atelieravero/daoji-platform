import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicForm } from './actions';
import { constructMetadata } from '@/lib/seo';
import FormEngine from './FormEngine';

export async function generateMetadata({ params }: { params: Promise<{ locale: string, slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const form = await getPublicForm(resolvedParams.slug);

  if (!form) {
    return constructMetadata({ locale: resolvedParams.locale, title: 'Not Found' });
  }

  // Follow the Chinese-First Fallback Chain
  const title = resolvedParams.locale === 'zh' 
    ? (form.schema?.titleZh || form.schema?.titleEn || form.title)
    : (form.schema?.titleEn || form.schema?.titleZh || form.title);
  
  const description = resolvedParams.locale === 'zh'
    ? (form.schema?.subtitleZh || form.schema?.subtitleEn)
    : (form.schema?.subtitleEn || form.schema?.subtitleZh);

  return constructMetadata({
    title,
    // Safely truncate the description for SEO cards if it exists
    description: description ? description.substring(0, 150) : undefined,
    image: form.schema?.bannerImageUrl,
    locale: resolvedParams.locale,
    path: `form/${resolvedParams.slug}`
  });
}

export default async function PublicFormPage({ params }: { params: Promise<{ locale: string, slug: string }> }) {
  const resolvedParams = await params;
  
  // 1. Fetch the form on the server using the dynamic slug
  const form = await getPublicForm(resolvedParams.slug);

  // 2. Safely trigger Next.js's 404 page if the slug doesn't exist
  if (!form) {
    notFound();
  }

  // 3. Pass the fetched data directly to the interactive client engine
  return <FormEngine initialForm={form} locale={resolvedParams.locale} />;
}