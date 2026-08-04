'use client';

import React, { useState, useMemo } from 'react';
import { Calendar, MapPin, ArrowRight, Tag, Clock, ArrowDownUp } from 'lucide-react';

// MOCK DATA: Representing the joined Supabase 'posts' and 'forms' tables
const mockEvents = [
  {
    id: 'evt_1',
    type: 'event',
    title: {
      en: '7-Day Silent Vipassanā Retreat',
      zh: '七日內觀止語禪修營'
    },
    excerpt: {
      en: 'A deep dive into mindfulness and meditation practice away from the noise of the city. Suitable for both beginners and experienced practitioners.',
      zh: '遠離城市喧囂，深入體驗正念與內觀冥想。適合初學者與有經驗的禪修者。'
    },
    schedule_display: {
      en: 'October 1st - October 7th, 2026',
      zh: '2026年10月1日 - 10月7日'
    },
    start_date: '2026-10-01',
    end_date: '2026-10-07',
    location: {
      en: 'Maggapaṭipadā Main Hall, Lantau',
      zh: '道跡禪院 主禪堂 (大嶼山)'
    },
    tags: {
      en: ['Silent Retreat', 'In-Person', 'Beginner Friendly'],
      zh: ['止語禪修', '實體活動', '適合初學者']
    },
    cover_image: 'https://images.unsplash.com/photo-1545389336-cf090694435e?auto=format&fit=crop&q=80&w=1000',
    formStatus: 'open', 
  },
  {
    id: 'evt_2',
    type: 'event',
    title: {
      en: 'Weekly Sutta Study & Meditation',
      zh: '每週經教學習與共修'
    },
    excerpt: {
      en: 'Join our community every Wednesday evening for teachings from the Pali Canon followed by guided meditation.',
      zh: '每週三晚加入我們的社群，學習巴利三藏經文並進行導引禪修。'
    },
    schedule_display: {
      en: 'Every Wednesday, 7:30 PM - 9:00 PM',
      zh: '每週三晚 7:30 - 9:00'
    },
    start_date: '2026-08-01',
    end_date: '2026-12-31',
    location: {
      en: 'Online (Zoom)',
      zh: '線上 (Zoom)'
    },
    tags: {
      en: ['Online', 'Weekly', 'Study'],
      zh: ['線上', '每週活動', '經教研讀']
    },
    cover_image: 'https://images.unsplash.com/photo-1600455431608-8e68dbb6c781?auto=format&fit=crop&q=80&w=1000',
    formStatus: 'open',
  },
  {
    id: 'evt_3',
    type: 'event',
    title: {
      en: 'Monastic Robe Offering Ceremony (Kaṭhina)',
      zh: '迦絺那衣（供僧衣）法會'
    },
    excerpt: {
      en: 'The annual ceremony to offer robes and requisites to the Sangha after the Rains Retreat.',
      zh: '一年一度的雨安居結束後，向僧團供養袈裟及四資具的隆重法會。'
    },
    schedule_display: {
      en: 'November 15, 2026',
      zh: '2026年11月15日'
    },
    start_date: '2026-11-15',
    end_date: '2026-11-15',
    location: {
      en: 'Maggapaṭipadā Main Hall, Lantau',
      zh: '道跡禪院 主禪堂 (大嶼山)'
    },
    tags: {
      en: ['Ceremony', 'In-Person'],
      zh: ['法會', '實體活動']
    },
    cover_image: null, // Intentionally left null to demonstrate fallback layout
    formStatus: 'closed',
  },
  {
    id: 'evt_4',
    type: 'event',
    title: {
      en: 'Spring Mindfulness Weekend',
      zh: '春季正念週末營'
    },
    excerpt: {
      en: 'A short 2-day introduction to mindfulness walking and sitting meditation.',
      zh: '為期兩天的正念行禪與坐禪入門，幫助您在週末重拾平靜。'
    },
    schedule_display: {
      en: 'May 1st - May 2nd, 2026',
      zh: '2026年5月1日 - 5月2日'
    },
    start_date: '2026-05-01',
    end_date: '2026-05-02',
    location: {
      en: 'Maggapaṭipadā Main Hall, Lantau',
      zh: '道跡禪院 主禪堂 (大嶼山)'
    },
    tags: {
      en: ['In-Person', 'Beginner Friendly'],
      zh: ['實體活動', '適合初學者']
    },
    cover_image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=1000',
    formStatus: 'closed',
  }
];

// MOCK DICTIONARY
const dictionaries = {
  en: {
    title: 'Events & Retreats',
    subtitle: 'Join us for upcoming retreats, weekly classes, and special ceremonies.',
    filterAll: 'All Events',
    filterHappening: 'Happening Now',
    filterUpcoming: 'Upcoming',
    filterPast: 'Past Events',
    sortLabel: 'Sort by:',
    sortEarliest: 'Earliest First',
    sortLatest: 'Latest First',
    statusOpen: 'Apply Now',
    statusClosed: 'Application Closed',
  },
  zh: {
    title: '活動與禪修',
    subtitle: '歡迎參加我們即將舉辦的禪修營、每週共修及特別法會。',
    filterAll: '所有活動',
    filterHappening: '進行中',
    filterUpcoming: '即將舉辦',
    filterPast: '已結束',
    sortLabel: '排序:',
    sortEarliest: '從近到遠',
    sortLatest: '最新發佈',
    statusOpen: '立即報名',
    statusClosed: '報名已截止',
  }
};

export default function EventsDiscoveryPage() {
  // MOCK: Assuming 'en' for the preview environment. In Next.js, this comes from the URL [locale] param.
  const locale = 'en' as 'en' | 'zh'; 
  const t = dictionaries[locale];

  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [timeFilters, setTimeFilters] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<'earliest' | 'latest'>('earliest');

  // Helper to determine event status based on current date
  const getTimeStatus = (startDateStr: string, endDateStr: string | null) => {
    // MOCK: The context date is August 4, 2026
    const now = new Date('2026-08-04T00:00:00').getTime(); 
    const start = new Date(startDateStr).getTime();
    const end = new Date(endDateStr || startDateStr).getTime() + 86400000; // Add 1 day to make end date inclusive

    if (now < start) return 'upcoming';
    if (now > end) return 'past';
    return 'happening';
  };

  const toggleTimeFilter = (status: string) => {
    setTimeFilters(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  // Extract all unique tags for the current locale
  const allTags = Array.from(
    new Set(mockEvents.flatMap(event => event.tags[locale]))
  );

  // Filter and sort events (Memoized for performance)
  const filteredAndSortedEvents = useMemo(() => {
    let result = mockEvents;

    // 1. Tag Filter
    if (activeTag) {
      result = result.filter(event => event.tags[locale].includes(activeTag));
    }

    // 2. Time Filter (Happening, Upcoming, Past)
    if (timeFilters.length > 0) {
      result = result.filter(event => {
        const status = getTimeStatus(event.start_date, event.end_date);
        return timeFilters.includes(status);
      });
    }

    // 3. Sort Order
    result.sort((a, b) => {
      const timeA = new Date(a.start_date).getTime();
      const timeB = new Date(b.start_date).getTime();
      return sortOrder === 'earliest' ? timeA - timeB : timeB - timeA;
    });

    return result;
  }, [activeTag, timeFilters, sortOrder, locale]);

  return (
    <div className="w-full bg-[#FCFAF8] min-h-screen pb-20">
      
      {/* Hero Section */}
      <div className="bg-[#FAF5F0] border-b border-[#F2E8DC] py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-800 tracking-tight mb-4">
            {t.title}
          </h1>
          <p className="text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed">
            {t.subtitle}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Filter Bar */}
        <div className="space-y-6 mb-10 animate-in fade-in duration-700 delay-150">
          
          {/* Top Row: Tags */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTag(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                activeTag === null 
                  ? 'bg-[#A65D24] text-white shadow-md' 
                  : 'bg-white text-stone-600 border border-stone-200 hover:border-[#A65D24] hover:text-[#A65D24]'
              }`}
            >
              {t.filterAll}
            </button>
            
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeTag === tag 
                    ? 'bg-[#A65D24] text-white shadow-md' 
                    : 'bg-white text-stone-600 border border-stone-200 hover:border-[#A65D24] hover:text-[#A65D24]'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Bottom Row: Time Toggles & Sort */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-stone-200/60">
            
            <div className="flex flex-wrap gap-2">
              {['happening', 'upcoming', 'past'].map(status => {
                const labelMap: Record<string, string> = {
                  happening: t.filterHappening,
                  upcoming: t.filterUpcoming,
                  past: t.filterPast
                };
                return (
                  <button
                    key={status}
                    onClick={() => toggleTimeFilter(status)}
                    className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                      timeFilters.includes(status) 
                        ? 'bg-stone-800 text-white shadow-sm' 
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {timeFilters.includes(status) && <Clock className="w-3.5 h-3.5 mr-1.5 text-stone-300" />}
                    {labelMap[status]}
                  </button>
                )
              })}
            </div>

            <div className="flex items-center gap-2 text-sm">
              <ArrowDownUp className="w-4 h-4 text-stone-400" />
              <span className="text-stone-500 font-medium mr-1">{t.sortLabel}</span>
              <select 
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'earliest' | 'latest')}
                className="bg-transparent font-medium text-stone-800 cursor-pointer outline-none focus:ring-0 appearance-none border-b border-dashed border-stone-300 pb-0.5 hover:border-[#A65D24] transition-colors"
              >
                <option value="earliest">{t.sortEarliest}</option>
                <option value="latest">{t.sortLatest}</option>
              </select>
            </div>

          </div>
        </div>

        {/* Event List */}
        <div className="space-y-6">
          {filteredAndSortedEvents.map((event, index) => {
            const timeStatus = getTimeStatus(event.start_date, event.end_date);
            return (
              <div 
                key={event.id} 
                className="bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden group animate-in fade-in slide-in-from-bottom-4"
                style={{ animationFillMode: 'both', animationDelay: `${150 + index * 100}ms` }}
              >
                
                {/* Cover Image (If Set) */}
                {event.cover_image && (
                  <div className="w-full h-48 sm:h-56 bg-stone-100 overflow-hidden relative border-b border-stone-100">
                    {timeStatus === 'happening' && (
                      <div className="absolute top-4 left-4 z-10 bg-emerald-600/95 backdrop-blur-sm text-white text-xs font-bold tracking-wide px-3 py-1.5 rounded-full shadow-md flex items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse mr-1.5"></span>
                        {t.filterHappening}
                      </div>
                    )}
                    <img 
                      src={event.cover_image} 
                      alt={event.title[locale]} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                  </div>
                )}

                {/* Content & Action Area Container */}
                <div className="flex flex-col sm:flex-row p-6 sm:p-8 gap-8">
                  
                  {/* Content Area */}
                  <div className="flex-1">
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {event.tags[locale].map(tag => (
                        <span 
                          key={tag} 
                          className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-[#FAF5F0] text-[#A65D24]"
                        >
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>

                    <h2 className="text-2xl font-bold text-stone-800 mb-3 hover:text-[#A65D24] transition-colors cursor-pointer">
                      {event.title[locale]}
                    </h2>
                    
                    <p className="text-stone-600 mb-6 leading-relaxed">
                      {event.excerpt[locale]}
                    </p>

                    {/* Metadata Items */}
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 text-sm text-stone-500 font-medium">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-[#A65D24]/70" />
                        {event.schedule_display[locale]}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-[#A65D24]/70" />
                        {event.location[locale]}
                      </div>
                    </div>
                  </div>

                  {/* Action Area */}
                  <div className="sm:w-48 flex flex-col justify-center shrink-0 border-t sm:border-t-0 sm:border-l border-stone-100 pt-6 sm:pt-0 sm:pl-6 mt-2 sm:mt-0">
                    {event.formStatus === 'open' ? (
                      <button className="w-full flex items-center justify-center px-6 py-3.5 bg-[#A65D24] hover:bg-[#8B4D1E] text-white font-semibold rounded-xl transition-all shadow-sm hover:shadow group focus:ring-2 focus:ring-[#A65D24] focus:ring-offset-2">
                        {t.statusOpen}
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </button>
                    ) : (
                      <button disabled className="w-full flex items-center justify-center px-6 py-3.5 bg-stone-100 text-stone-400 font-semibold rounded-xl cursor-not-allowed">
                        {t.statusClosed}
                      </button>
                    )}
                    
                    <a href="#" className="text-sm font-medium text-stone-500 hover:text-[#A65D24] text-center mt-4 transition-colors">
                      {locale === 'en' ? 'View Details' : '查看詳情'}
                    </a>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}