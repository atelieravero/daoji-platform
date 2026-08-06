'use client';

import React from 'react';
import PostDiscoveryFeed from '@/components/shared/PostDiscoveryFeed';

const mockEvents = [
  {
    id: 'evt_1',
    type: 'event',
    title: {
      en: '7-Day Silent Vipassanā Retreat',
      zh: '七日內觀止語禪修營'
    },
    excerpt: {
      en: 'A deep dive into mindfulness and meditation practice away from the noise of the city.',
      zh: '遠離城市喧囂，深入體驗正念與內觀冥想。'
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
  }
];

const dictionaries = {
  en: {
    title: 'Upcoming Events & Retreats',
    subtitle: 'Join us for upcoming retreats, weekly classes, and special ceremonies.',
    searchPlaceholder: 'Search events...',
    filterAll: 'All Events',
    readMore: 'View Details',
  },
  zh: {
    title: '近期活動與禪修',
    subtitle: '歡迎參加我們即將舉辦的禪修營、每週共修及特別法會。',
    searchPlaceholder: '搜尋活動...',
    filterAll: '所有活動',
    readMore: '查看詳情',
  }
};

export default function LocaleHomePage({ params }: { params?: Promise<{ locale?: string }> | { locale?: string } }) {
  const resolvedParams = params ? (typeof (params as any).then === 'function' ? React.use(params as Promise<{ locale?: string }>) : params) : {};
  const locale = ((resolvedParams as { locale?: string })?.locale === 'zh' ? 'zh' : 'en') as 'en' | 'zh';
  const dict = dictionaries[locale];

  return (
    <div className="w-full">
      <PostDiscoveryFeed 
        postType="event" 
        posts={mockEvents} 
        locale={locale} 
        dictionary={dict} 
      />
    </div>
  );
}