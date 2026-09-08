import React from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Radio, ArrowRight, ExternalLink } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { getPublicEvents } from '@/lib/events';
import { constructMetadata } from '@/lib/seo';
import { formatEventDateRange } from '@/lib/date';

interface EventsHubProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: EventsHubProps) {
  const { locale } = await params;
  return constructMetadata({
    title: locale === 'en' ? 'Events & Retreats' : '活動與修持日程',
    description: locale === 'en' ? 'Upcoming meditation retreats, Dhamma talks, and recurring sittings.' : '道跡禪院即將舉辦的禪修營、佛法講座及定期共修日程。',
    path: '/events',
    locale,
  });
}

export default async function PublicEventsPage({ params }: EventsHubProps) {
  const { locale } = await params;
  const isZh = locale !== 'en';

  const [tDetail, tFeed, events] = await Promise.all([
    getTranslations('EventDetail'),
    getTranslations('Feed'),
    getPublicEvents(),
  ]);

  return (
    <div className="min-h-screen bg-surface-base py-12 px-6 md:px-12 font-sans text-stone-900">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* PAGE HEADER */}
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">
            {isZh ? '道跡禪院' : 'Maggapaṭipadā'}
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-stone-900 tracking-tight">
            {tFeed('eventsTitle')}
          </h1>
          <p className="text-sm md:text-base text-stone-600 max-w-2xl">
            {tFeed('eventsSubtitle')}
          </p>
        </div>

        {/* EVENTS LISTING */}
        {events.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-stone-200/60 p-8 shadow-xs">
            <Calendar className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-stone-800">
              {isZh ? '目前暫無開放的活動' : 'No upcoming events at this time'}
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              {isZh ? '請稍後再回來查看最新禪修營與共修通知。' : 'Please check back later for new retreats and updates.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((evt) => {
              const targetSlug = evt.slug || evt.short_id;
              const title = isZh ? (evt.title_zh || evt.title_en) : (evt.title_en || evt.title_zh);
              const summary = isZh ? (evt.summary_zh || evt.summary_en) : (evt.summary_en || evt.summary_zh);

              // Venue fallback chain: current lang > other lang > nil
              const venue = evt.venues;
              const venueNameZh = evt.venue_override_zh || venue?.name_zh;
              const venueNameEn = evt.venue_override_en || venue?.name_en;
              const resolvedVenueName = isZh
                ? (venueNameZh || venueNameEn || (evt.is_livestream ? tDetail('livestreamAvailable') : tDetail('venueTba')))
                : (venueNameEn || venueNameZh || (evt.is_livestream ? tDetail('livestreamAvailable') : tDetail('venueTba')));

              const scheduleDisplay = formatEventDateRange(
                evt.start_date,
                evt.end_date,
                evt.timezone,
                evt.is_all_day,
                isZh ? 'zh-HK' : 'en-US',
                evt.recurrence_rule
              );

              return (
                <Link
                  key={evt.id}
                  href={`/${locale}/events/${targetSlug}`}
                  target={evt.is_standalone ? '_blank' : undefined}
                  rel={evt.is_standalone ? 'noopener noreferrer' : undefined}
                  className="group bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-xs hover:shadow-md hover:border-primary/50 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* BANNER PREVIEW */}
                    <div className="aspect-video bg-surface-cream overflow-hidden relative">
                      {evt.banner_asset?.file_url ? (
                        <img 
                          src={evt.banner_asset.file_url} 
                          alt="" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-300">
                          <Calendar className="w-12 h-12" />
                        </div>
                      )}

                      {/* BADGES */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                        {evt.recurrence_rule && (
                          <span className="bg-white/95 text-primary text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                            {isZh ? '定期活動' : 'Recurring'}
                          </span>
                        )}
                        {evt.is_standalone && (
                          <span className="bg-stone-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                            <span>{isZh ? '獨立頁面' : 'Standalone'}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* CONTENT BODY */}
                    <div className="p-5 space-y-3">
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-primary block">
                          {scheduleDisplay}
                        </span>
                        <h2 className="text-base font-bold text-stone-900 group-hover:text-primary transition-colors line-clamp-2">
                          {title}
                        </h2>
                      </div>

                      {summary && (
                        <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                          {summary}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* CARD FOOTER */}
                  <div className="px-5 py-3.5 bg-stone-50/70 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                    <div className="flex items-center gap-1.5 truncate max-w-[70%]">
                      {evt.is_in_person ? (
                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                      ) : (
                        <Radio className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      )}
                      <span className="truncate">{resolvedVenueName}</span>
                    </div>

                    <span className="inline-flex items-center text-primary font-semibold text-xs group-hover:translate-x-0.5 transition-transform">
                      {tFeed('readMore')} <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}