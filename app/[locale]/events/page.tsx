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
  }
];

const dictionaries = {
  en: {
    title: 'Events & Retreats',
    subtitle: 'Join us for upcoming retreats, weekly classes, and special ceremonies.',
    searchPlaceholder: 'Search events...',
    filterAll: 'All Events',
    readMore: 'View Details',
    statusOpen: 'Apply Now',
    statusClosed: 'Application Closed'
  },
  zh: {
    title: '活動與禪修',
    subtitle: '歡迎參加我們即將舉辦的禪修營、每週共修及特別法會。',
    searchPlaceholder: '搜尋活動...',
    filterAll: '所有活動',
    readMore: '查看詳情',
    statusOpen: '立即報名',
    statusClosed: '報名已截止'
  }
};

export default function EventsPageWrapper({ params }: { params?: Promise<{ locale?: string }> | { locale?: string } }) {
  const resolvedParams = params ? (typeof (params as any).then === 'function' ? React.use(params as Promise<{ locale?: string }>) : params) : {};
  const locale = ((resolvedParams as { locale?: string })?.locale === 'zh' ? 'zh' : 'en') as 'en' | 'zh';
  return (
    <PostDiscoveryFeed 
      postType="event" 
      posts={mockEvents} 
      locale={locale} 
      dictionary={dictionaries[locale]} 
    />
  );
}