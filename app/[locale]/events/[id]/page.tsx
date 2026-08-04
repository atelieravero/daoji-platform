'use client';

import React from 'react';
import PostDetailPage from '../../../../components/shared/PostDetailPage';

const mockEventDetail = {
  id: 'evt_1',
  type: 'event' as const,
  title: {
    en: '7-Day Silent Vipassanā Retreat',
    zh: '七日內觀止語禪修營'
  },
  date_added: '2026-08-01',
  schedule_display: {
    en: 'October 1st - October 7th, 2026',
    zh: '2026年10月1日 - 10月7日'
  },
  location: {
    en: 'Maggapaṭipadā Main Hall, Lantau',
    zh: '道跡禪院 主禪堂 (大嶼山)'
  },
  tags: {
    en: ['Silent Retreat', 'In-Person', 'Beginner Friendly'],
    zh: ['止語禪修', '實體活動', '適合初學者']
  },
  cover_image: 'https://images.unsplash.com/photo-1545389336-cf090694435e?auto=format&fit=crop&q=80&w=1200',
  formStatus: 'open' as const,
  content: {
    en: [
      { id: 'b1', type: 'h2', content: 'About the Program' },
      { id: 'b2', type: 'p', content: 'Join us for a profound journey into mindfulness. This 7-day silent retreat is designed to help you disconnect from the noise of daily life and reconnect with your inner stillness.' },
      { id: 'b3', type: 'quote', content: 'Peace comes from within. Do not seek it without.' },
      { id: 'b4', type: 'h3', content: 'Daily Schedule Overview' },
      { id: 'b5', type: 'list', items: [
        '04:00 AM - Wake up bell',
        '04:30 AM - Morning Chanting & Meditation',
        '06:30 AM - Breakfast mindful eating',
        '08:00 AM - Group sitting and instructions'
      ]},
      { id: 'b6', type: 'attachment', url: '#', name: 'Detailed 7-Day Retreat Schedule.pdf', size: '2.4 MB' }
    ],
    zh: [
      { id: 'b1', type: 'h2', content: '關於本計劃' },
      { id: 'b2', type: 'p', content: '加入我們，展開一段深刻的正念之旅。' },
      { id: 'b3', type: 'quote', content: '平靜來自內心，莫向外求。' },
      { id: 'b4', type: 'h3', content: '每日日程概覽' },
      { id: 'b5', type: 'list', items: [
        '04:00 AM - 起床鐘',
        '04:30 AM - 早課唱誦與禪修'
      ]},
      { id: 'b6', type: 'attachment', url: '#', name: '七日禪修營詳細日程表.pdf', size: '2.4 MB' }
    ]
  }
};

const dictionaries = {
  en: {
    back: 'Back to Events',
    share: 'Share',
    dateTime: 'Date & Time',
    location: 'Location',
    applyNow: 'Apply Now',
    applicationClosed: 'Application Closed',
    limitedSpots: 'Spaces are limited. Applications are reviewed on a rolling basis.'
  },
  zh: {
    back: '返回活動列表',
    share: '分享',
    dateTime: '日期與時間',
    location: '地點',
    applyNow: '立即報名',
    applicationClosed: '報名已截止',
    limitedSpots: '名額有限。報名將以滾動方式進行審核。'
  }
};

export default function EventDetailPageWrapper() {
  const locale = 'en' as 'en' | 'zh';
  return (
    <PostDetailPage 
      post={mockEventDetail} 
      locale={locale} 
      dictionary={dictionaries[locale]} 
    />
  );
}