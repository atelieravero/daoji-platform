// app/[locale]/event/[id_or_slug]/page.tsx
import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { 
  Calendar, MapPin, Radio, ArrowLeft, 
  ExternalLink, FileText, AlertCircle, Building2, Globe2 
} from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { getPublicEventByIdOrSlug } from '@/lib/events';
import { constructMetadata, resolveBilingualText, resolveBilingualExcerpt } from '@/lib/seo';
import { formatEventDateRange, describeRecurrenceRule } from '@/lib/date';
import EventActionPortal from '@/components/public/EventActionPortal';
import MarkdownRenderer from '@/components/shared/MarkdownRenderer';
import StandaloneNotifier from '@/components/public/StandaloneNotifier';

interface EventPageProps {
  params: Promise<{ locale: string; id_or_slug: string }>;
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const { locale, id_or_slug } = await params;
  const event = await getPublicEventByIdOrSlug(id_or_slug);
  if (!event) {
    return constructMetadata({ locale, title: 'Not Found' });
  }

  const title = resolveBilingualText(locale, event.title_zh, event.title_en) || undefined;
  const description = resolveBilingualExcerpt({
    locale,
    summaryZh: event.summary_zh,
    summaryEn: event.summary_en,
    bodyZh: event.body_zh,
    bodyEn: event.body_en,
    maxLength: 150,
  });

  return constructMetadata({
    title,
    description,
    image: event.banner_asset?.file_url || undefined,
    path: `event/${event.slug || event.short_id}`,
    locale,
  });
}

export default async function PublicEventDetailPage({ params }: EventPageProps) {
  const { locale, id_or_slug } = await params;
  const isZh = locale !== 'en';

  const [t, tLanguages, event] = await Promise.all([
    getTranslations('EventDetail'),
    getTranslations('Languages'),
    getPublicEventByIdOrSlug(id_or_slug),
  ]);

  if (!event) {
    notFound();
  }

  const title = resolveBilingualText(locale, event.title_zh, event.title_en);
  const body = resolveBilingualText(locale, event.body_zh, event.body_en);
  const venue = event.venues;

  // Venue Name fallback chain: current lang > other lang > nil (t('venueTba'))
  const venueNameZh = event.venue_override_zh || venue?.name_zh;
  const venueNameEn = event.venue_override_en || venue?.name_en;
  const venueName = resolveBilingualText(locale, venueNameZh, venueNameEn) || t('venueTba');

  // Venue Address fallback chain: current lang > other lang > nil
  const venueAddress = resolveBilingualText(locale, venue?.address_zh, venue?.address_en) || null;

  // Organizer Name fallback chain: current lang > other lang > nil
  const organizerName = event.organizers
    ? resolveBilingualText(locale, event.organizers.name_zh, event.organizers.name_en)
    : null;

  const scheduleDisplay = formatEventDateRange(
    event.start_date,
    event.end_date,
    event.timezone,
    event.is_all_day,
    isZh ? 'zh-HK' : 'en-US',
    event.recurrence_rule
  );

  const externalLinkClass =
    'font-semibold text-link underline decoration-dotted decoration-link-underline decoration-[2px] underline-offset-4 hover:text-link-hover hover:bg-link-highlight hover:decoration-solid hover:decoration-link-hover px-1 -mx-1 rounded-sm transition-all inline-flex items-center gap-1';

  return (
    <div className="min-h-screen bg-surface-base py-10 px-6 md:px-12 font-sans text-ink-body">
      <StandaloneNotifier 
        isStandalone={Boolean(event.is_standalone)} 
        locale={locale} 
        forceStandaloneParam={false}
      />

      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* BACK NAV */}
        {!event.is_standalone && (
          <Link
            href={`/${locale}/events`}
            className="group inline-flex items-center text-[13px] font-semibold text-ink-muted hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5 transition-transform group-hover:-translate-x-0.5" />
            <span>{t('backToEvents')}</span>
          </Link>
        )}

        {/* HERO BANNER */}
        {event.banner_asset?.file_url && (
          <div className="w-full rounded-3xl overflow-hidden shadow-xs border border-surface-dark bg-surface-cream">
            <img 
              src={event.banner_asset.file_url} 
              alt={title} 
              className="w-full h-auto object-contain block" 
            />
          </div>
        )}

        {/* EVENT TITLE & ACTIONS BAR */}
        <div className="space-y-4">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              {event.code && (
                <span className="bg-primary-soft text-primary text-xs font-mono font-bold px-2.5 py-0.5 rounded-md border border-primary-border">
                  {event.code}
                </span>
              )}

              {event.recurrence_rule && (
                <span className="bg-surface-cream text-primary-active text-xs font-semibold px-2.5 py-0.5 rounded-md border border-surface-dark">
                  {describeRecurrenceRule(event.recurrence_rule, event.start_date, isZh ? 'zh-HK' : 'en-US')}
                </span>
              )}

              {/* Delivery Languages */}
              {event.languages && event.languages.length > 0 && (
                <div className="inline-flex items-center gap-1">
                  <Globe2 className="w-3.5 h-3.5 text-ink-muted shrink-0 ml-1" />
                  {event.languages.map((lang) => (
                    <span
                      key={lang}
                      className="px-2 py-0.5 rounded-md bg-surface-cream text-ink-body text-[11px] font-medium border border-surface-dark"
                    >
                      {tLanguages(lang as any) || lang}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <h1 className="text-[26px] md:text-4xl font-extrabold text-ink-primary tracking-tight leading-[1.25]">
              {title}
            </h1>

            {/* Organizer Citation */}
            {event.organizers && organizerName && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted pt-1">
                <Building2 className="w-3.5 h-3.5 text-primary" />
                <span>{t('organizedBy')}</span>
                {event.organizers.url ? (
                  <a
                    href={event.organizers.url}
                    target="_blank"
                    rel="noreferrer"
                    className={externalLinkClass}
                  >
                    <span>{organizerName}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-ink-primary">{organizerName}</span>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-surface-card p-5 rounded-2xl border border-surface-dark shadow-xs">
            <div className="space-y-3 text-xs text-ink-body">
              <div className="flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold block text-ink-primary text-sm">{scheduleDisplay}</span>
                  <span className="text-ink-muted">{t('timezone')} {event.timezone}</span>
                  
                  {/* Blackout Notice */}
                  {event.blackout_dates && event.blackout_dates.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[11px] text-status-warning mt-1.5 bg-amber-50/90 border border-amber-200/80 px-2.5 py-1 rounded-lg">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-status-warning" />
                      <span>
                        {t('blackoutNotice', { dates: event.blackout_dates.join(isZh ? '、' : ', ') })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {event.is_in_person && (
                <div className="flex items-start gap-2.5 pt-2.5 border-t border-surface-dark/70">
                  <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold block text-ink-primary text-sm">{venueName}</span>
                    {venueAddress && <span className="text-ink-muted block mt-0.5">{venueAddress}</span>}
                    {venue && (venue.google_maps_url || venue.amap_url) && (
                      <div className="flex items-center gap-3.5 mt-2 font-semibold text-xs">
                        {venue.google_maps_url && (
                          <a
                            href={venue.google_maps_url}
                            target="_blank"
                            rel="noreferrer"
                            className={externalLinkClass}
                          >
                            <span>{t('googleMaps')}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {venue.amap_url && (
                          <a
                            href={venue.amap_url}
                            target="_blank"
                            rel="noreferrer"
                            className={externalLinkClass}
                          >
                            <span>{t('amap')}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {event.is_livestream && (
                <div className="flex items-start gap-2.5 pt-2.5 border-t border-surface-dark/70">
                  <Radio className="w-4 h-4 text-status-danger mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold block text-ink-primary">
                      {event.is_livestream_live ? t('livestreamLive') : t('livestreamAvailable')}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <EventActionPortal event={event} locale={isZh ? 'zh' : 'en'} />
          </div>
        </div>

        {/* BODY */}
        {body && (
          <div className="bg-surface-card p-8 md:p-10 rounded-3xl border border-surface-dark shadow-xs">
            <MarkdownRenderer
              content={body}
              baseHeadingLevel={2}
              className="text-base leading-[1.8] text-ink-body"
            />
          </div>
        )}

        {/* ATTACHED UPDATES */}
        {event.articles && event.articles.length > 0 && !event.is_standalone && (
          <div className="bg-surface-card p-6 md:p-8 rounded-3xl border border-surface-dark shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <span>{t('relatedArticles')}</span>
            </h3>
            <div className="divide-y divide-surface-dark/70">
              {event.articles.map((art) => {
                const artIdentifier = art.slug || art.short_id;
                const artHref = art.type === 'page'
                  ? `/${locale}/${artIdentifier}`
                  : `/${locale}/post/${artIdentifier}`;
                return (
                  <Link
                    key={art.id}
                    href={artHref}
                    className="py-3.5 flex items-center justify-between group hover:text-primary transition-colors"
                  >
                    <span className="text-[15px] font-bold text-ink-primary group-hover:text-primary transition-colors">
                      {resolveBilingualText(locale, art.title_zh, art.title_en)}
                    </span>
                    {art.published_at && (
                      <span className="text-xs text-ink-muted font-mono shrink-0 ml-4">
                        {new Date(art.published_at).toLocaleDateString(isZh ? 'zh-HK' : 'en-US')}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}