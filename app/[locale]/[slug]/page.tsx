'use client';

import React from 'react';
import PostDetailPage from '@/components/shared/PostDetailPage';

const mockPagesDatabase: Record<string, any> = {
  lineage: {
    id: 'pg_lineage',
    type: 'page' as const,
    title: {
      en: 'Our Lineage & History',
      zh: '傳承與歷史'
    },
    date_added: '2026-01-15',
    tags: {
      en: ['Lineage', 'History', 'Tradition'],
      zh: ['傳承', '歷史', '傳統']
    },
    cover_image: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&q=80&w=1200',
    content: {
      en: [
        { id: 'b1', type: 'h2', content: 'The Roots of Our Practice' },
        { id: 'b2', type: 'p', content: 'Maggapaṭipadā Meditation Centre traces its spiritual heritage back to the early forest monastic traditions, emphasizing strict adherence to the foundational discourses and practical mindfulness.' },
        { id: 'b3', type: 'quote', content: 'The path of practice is walked step by step, breath by breath.' }
      ],
      zh: [
        { id: 'b1', type: 'h2', content: '我們實修的根基' },
        { id: 'b2', type: 'p', content: '道跡禪院的法脈傳承源自早期森林僧團傳統，強調對根本經典的嚴格依循與切實的正念修行。' },
        { id: 'b3', type: 'quote', content: '修行之路，一步一腳印，一息一覺察。' }
      ]
    }
  },
  privacy: {
    id: 'pg_privacy',
    type: 'page' as const,
    title: {
      en: 'Privacy Policy',
      zh: '隱私政策'
    },
    date_added: '2026-01-01',
    tags: {
      en: ['Legal', 'Privacy'],
      zh: ['法律聲明', '隱私政策']
    },
    cover_image: null,
    content: {
      en: [
        { id: 'p1', type: 'h2', content: 'Our Commitment to Your Privacy' },
        { id: 'p2', type: 'p', content: 'Maggapaṭipadā Meditation Centre respects your personal data. Any contact details or retreat application answers submitted through our forms are strictly confidential and used solely for organizing our programs.' }
      ],
      zh: [
        { id: 'p1', type: 'h2', content: '我們對您隱私的承諾' },
        { id: 'p2', type: 'p', content: '道跡禪院尊重您的個人資料。透過我們的表單提交的所有聯絡資訊或禪修申請回答均嚴格保密，僅用於籌辦相關活動。' }
      ]
    }
  }
};

const dictionaries = {
  en: {
    back: 'Back to Home',
    share: 'Share Page'
  },
  zh: {
    back: '返回首頁',
    share: '分享頁面'
  }
};

export default function StaticPageDynamicRoute({ params }: { params?: Promise<{ locale?: string; slug?: string }> | { locale?: string; slug?: string } }) {
  const resolvedParams = params ? (typeof (params as any).then === 'function' ? React.use(params as Promise<{ locale?: string; slug?: string }>) : params) : {};
  const locale = ((resolvedParams as { locale?: string })?.locale === 'zh' ? 'zh' : 'en') as 'en' | 'zh';
  const slug = (resolvedParams as { slug?: string })?.slug || 'lineage';

  const pageData = mockPagesDatabase[slug] || mockPagesDatabase['lineage'];

  return (
    <PostDetailPage 
      post={pageData} 
      locale={locale} 
      dictionary={{
        ...dictionaries[locale],
        back: locale === 'zh' ? '返回首頁' : 'Back to Home'
      }} 
    />
  );
}