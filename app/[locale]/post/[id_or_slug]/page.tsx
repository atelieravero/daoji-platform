// app/[locale]/post/[id_or_slug]/page.tsx
import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  ArrowLeft,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { getPublicContentByIdOrSlug } from '@/lib/content-pages';
import {
  constructMetadata,
  resolveBilingualText,
  resolveBilingualExcerpt,
} from '@/lib/seo';
import { formatEventDateRange } from '@/lib/date';
import MarkdownRenderer from '@/components/shared/MarkdownRenderer';
import StandaloneNotifier from '@/components/public/StandaloneNotifier';

interface PostPageProps {
  params: Promise<{ locale: string; id_or_slug: string }>;
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { locale, id_or_slug } = await params;
  const post = await getPublicContentByIdOrSlug(id_or_slug, 'post');

  if (!post) {
    return constructMetadata({ locale, title: 'Not Found' });
  }

  const title = resolveBilingualText(locale, post.title_zh, post.title_en) || undefined;
  const description = resolveBilingualExcerpt({
    locale,
    summaryZh: post.summary_zh,
    summaryEn: post.summary_en,
    bodyZh: post.body_zh,
    bodyEn: post.body_en,
    maxLength: 150,
  });

  return constructMetadata({
    title,
    description,
    image: post.cover_asset?.file_url || undefined,
    path: `post/${post.slug || post.short_id}`,
    locale,
    type: 'article',
  });
}

export default async function PublicPostDetailPage({ params }: PostPageProps) {
  const { locale, id_or_slug } = await params;
  const isZh = locale !== 'en';

  const [t, post] = await Promise.all([
    getTranslations('PostDetail'),
    getPublicContentByIdOrSlug(id_or_slug, 'post'),
  ]);

  if (!post) {
    notFound();
  }

  const title = resolveBilingualText(locale, post.title_zh, post.title_en);
  const body = resolveBilingualText(locale, post.body_zh, post.body_en);
  const hasRelatedEvents = post.related_events && post.related_events.length > 0;

  const formattedPublishedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString(isZh ? 'zh-HK' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <div className="min-h-screen bg-surface-base py-10 px-6 md:px-12 font-sans text-stone-900">
      <StandaloneNotifier
        isStandalone={Boolean(post.is_standalone)}
        locale={locale}
        forceStandaloneParam={false}
      />

      <div
        className={`mx-auto space-y-8 ${
          hasRelatedEvents ? 'max-w-6xl' : 'max-w-4xl'
        }`}
      >
        {/* BACK NAV */}
        {!post.is_standalone && (
          <Link
            href={`/${locale}/news`}
            className="inline-flex items-center text-xs font-semibold text-stone-500 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span>{t('backToNews')}</span>
          </Link>
        )}

        {/* MAIN GRID: SINGLE COLUMN OR 2-COLUMN WITH STICKY RELATED EVENTS */}
        <div
          className={
            hasRelatedEvents
              ? 'grid grid-cols-1 lg:grid-cols-12 gap-8 items-start'
              : 'space-y-8'
          }
        >
          {/* LEFT / MAIN ARTICLE COLUMN */}
          <article
            className={
              hasRelatedEvents ? 'lg:col-span-8 space-y-6' : 'space-y-6'
            }
          >
            {/* COVER BANNER */}
            {post.cover_asset?.file_url && (
              <div className="w-full rounded-3xl overflow-hidden shadow-sm border border-stone-200/60 bg-surface-cream">
                <img
                  src={post.cover_asset.file_url}
                  alt={title}
                  className="w-full h-auto object-contain block"
                />
              </div>
            )}

            {/* ARTICLE HEADER */}
            <div className="space-y-3">
              {formattedPublishedDate && (
                <div className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <time dateTime={post.published_at || undefined}>
                    {t('publishedOn', { date: formattedPublishedDate })}
                  </time>
                </div>
              )}

              <h1 className="text-2xl md:text-4xl font-extrabold text-stone-900 tracking-tight leading-tight">
                {title}
              </h1>
            </div>

            {/* MARKDOWN BODY */}
            {body && (
              <div className="bg-white p-8 md:p-10 rounded-3xl border border-stone-200/80 shadow-xs">
                <MarkdownRenderer
                  content={body}
                  className="text-sm md:text-base leading-relaxed text-stone-800 space-y-4"
                />
              </div>
            )}
          </article>

          {/* RIGHT STICKY SIDEBAR (DESKTOP) / BOTTOM CARD (MOBILE) FOR RELATED EVENTS */}
          {hasRelatedEvents && (
            <aside className="lg:col-span-4 lg:sticky lg:top-8 space-y-4">
              <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>{t('relatedEventsTitle')}</span>
                </h2>

                <div className="space-y-3">
                  {post.related_events.map((evt) => {
                    const evtTitle = resolveBilingualText(
                      locale,
                      evt.title_zh,
                      evt.title_en
                    );
                    const evtSchedule = formatEventDateRange(
                      evt.start_date,
                      evt.end_date,
                      evt.timezone,
                      evt.is_all_day,
                      isZh ? 'zh-HK' : 'en-US',
                      evt.recurrence_rule
                    );
                    const evtVenue = evt.is_in_person
                      ? resolveBilingualText(
                          locale,
                          evt.venue_override_zh || evt.venues?.name_zh,
                          evt.venue_override_en || evt.venues?.name_en
                        )
                      : null;

                    return (
                      <Link
                        key={evt.id}
                        href={`/${locale}/event/${evt.slug || evt.short_id}`}
                        className="block p-4 rounded-2xl bg-surface-cream/70 hover:bg-surface-cream border border-stone-200/70 hover:border-primary/40 transition-all group space-y-2.5"
                      >
                        {evt.banner_asset?.file_url && (
                          <div className="w-full rounded-xl overflow-hidden border border-stone-200/60 bg-white">
                            <img
                              src={evt.banner_asset.file_url}
                              alt={evtTitle}
                              className="w-full aspect-[1200/630] object-cover"
                            />
                          </div>
                        )}

                        <div className="space-y-1">
                          {evt.code && (
                            <span className="inline-block bg-white text-primary text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-primary/20">
                              {evt.code}
                            </span>
                          )}
                          <h3 className="text-sm font-bold text-stone-900 group-hover:text-primary transition-colors leading-snug">
                            {evtTitle}
                          </h3>
                        </div>

                        <div className="space-y-1 text-xs text-stone-600">
                          <div className="flex items-start gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                            <span>{evtSchedule}</span>
                          </div>
                          {evtVenue && (
                            <div className="flex items-start gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                              <span className="truncate">{evtVenue}</span>
                            </div>
                          )}
                        </div>

                        <div className="pt-1 flex items-center text-xs font-bold text-primary">
                          <span>{t('viewEventDetails')}</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}