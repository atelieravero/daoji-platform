import React from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Radio, ArrowRight } from 'lucide-react';
import { getPublicEvents } from '@/lib/events';
import { constructMetadata } from '@/lib/seo';

interface EventsHubProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: EventsHubProps) {
  const { locale } = await params;
  return constructMetadata({
    title: locale === 'en' ? 'Events & Retreats' : '活動與修持日程',
    description: locale === 'en' ? 'Upcoming meditation retreats, Dhamma talks, and recurring sittings.' : '道濟禪林即將舉辦的禪修營、佛法講座及定期共修日程。',
    path: '/events',
    locale,
  });
}

export default async function PublicEventsPage({ params }: EventsHubProps) {
  const { locale } = await params;
  const isZh = locale !== 'en';
  const events = await getPublicEvents();

  const formatDate = (start: string, end: string, isAllDay: boolean) => {
    const s = new Date(start);
    const e = new Date(end);
    const sDate = s.toLocaleDateString(isZh ? 'zh-HK' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const eDate = e.toLocaleDateString(isZh ? 'zh-HK' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    if (sDate === eDate) {
      if (isAllDay) return sDate;
      const sTime = s.toLocaleTimeString(isZh ? 'zh-HK' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      const eTime = e.toLocaleTimeString(isZh ? 'zh-HK' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      return `${sDate} ${sTime} – ${eTime}`;
    }
    return `${sDate} – ${eDate}`;
  };

  return (
    <div className="min-h-screen bg-[#FCFAF8] py-12 px-6 md:px-12 font-sans text-stone-900">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* PAGE HEADER */}
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-[#A65D24]">Daoji Platform</span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-stone-900 tracking-tight">
            {isZh ? '活動與修持日程' : 'Events & Retreat Schedules'}
          </h1>
          <p className="text-sm md:text-base text-stone-600 max-w-2xl">
            {isZh 
              ? '歡迎參與道濟禪林之實體禪修營、線上經教研讀及每週共修活動。' 
              : 'Join meditation retreats, sutta study sessions, and regular community sittings.'}
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
              const title = isZh ? evt.title_zh : (evt.title_en || evt.title_zh);
              const summary = isZh ? evt.summary_zh : (evt.summary_en || evt.summary_zh);
              const venueName = evt.venues?.name_zh || evt.venue_override_zh || (evt.location_type === 'online' ? (isZh ? '線上會議 (Zoom)' : 'Online (Zoom)') : (isZh ? '地點待定' : 'TBD'));

              return (
                <Link
                  key={evt.id}
                  href={`/${locale}/events/${targetSlug}`}
                  className="group bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-xs hover:shadow-md hover:border-[#A65D24]/50 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* BANNER PREVIEW */}
                    <div className="aspect-video bg-[#FAF5F0] overflow-hidden relative">
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
                      {evt.recurrence_rule && (
                        <span className="absolute top-3 left-3 bg-white/95 text-[#A65D24] text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                          {isZh ? '定期活動' : 'Recurring'}
                        </span>
                      )}
                    </div>

                    {/* CONTENT BODY */}
                    <div className="p-5 space-y-3">
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-[#A65D24] block">
                          {formatDate(evt.start_date, evt.end_date, evt.is_all_day)}
                        </span>
                        <h2 className="text-base font-bold text-stone-900 group-hover:text-[#A65D24] transition-colors line-clamp-2">
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
                      {evt.location_type === 'online' ? (
                        <Radio className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      ) : (
                        <MapPin className="w-3.5 h-3.5 text-[#A65D24] shrink-0" />
                      )}
                      <span className="truncate">{venueName}</span>
                    </div>

                    <span className="inline-flex items-center text-[#A65D24] font-semibold text-xs group-hover:translate-x-0.5 transition-transform">
                      {isZh ? '詳情' : 'Details'} <ArrowRight className="w-3.5 h-3.5 ml-1" />
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