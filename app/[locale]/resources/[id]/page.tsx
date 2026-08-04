'use client';

import React from 'react';
import PostDetailPage from '../../../../components/shared/PostDetailPage';

const mockResourceDetail = {
  id: 'res_1',
  type: 'resource' as const,
  title: {
    en: 'Beginner Meditation & Posture Guide',
    zh: '初學者冥想與坐姿指南'
  },
  date_added: '2026-08-01',
  tags: {
    en: ['Guide', 'Beginner', 'Practice'],
    zh: ['指南', '初學者', '日常實修']
  },
  cover_image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=1200',
  content: {
    en: [
      { id: 'b1', type: 'h2', content: 'Welcome to Meditation Practice' },
      { id: 'b2', type: 'p', content: 'Proper posture forms the foundation of stable meditation. This guide will walk you through setting up your cushion, aligning your spine, and establishing a calm breath.' },
      { id: 'b3', type: 'quote', content: 'When the body is upright, the mind naturally settles.' },
      { id: 'b4', type: 'h3', content: 'Key Points Covered' },
      { id: 'b5', type: 'list', items: [
        'Choosing the right cushion height (Zafu and Zabuton)',
        'Full lotus, half lotus, and Burmese posture variations',
        'Managing knee and back tension during long sittings'
      ]},
      { id: 'b6', type: 'audio', url: '#', name: 'Guided Posture Adjustment (Audio)', duration: '12:45' },
      { id: 'b7', type: 'attachment', url: '#', name: 'Beginner Meditation & Posture Guide.pdf', size: '2.4 MB' }
    ],
    zh: [
      { id: 'b1', type: 'h2', content: '歡迎來到禪修實修' },
      { id: 'b2', type: 'p', content: '正確的坐姿是穩定禪修的基礎。本指南將引導您調整坐墊、伸展脊椎，並建立平穩的呼吸。' },
      { id: 'b3', type: 'quote', content: '身端則心正，心正則法安。' },
      { id: 'b4', type: 'h3', content: '本指南涵蓋之重點' },
      { id: 'b5', type: 'list', items: [
        '選擇合適的蒲團高度',
        '雙盤、單盤與緬甸坐的調整',
        '長時間靜坐時如何應對膝蓋與背部緊繃'
      ]},
      { id: 'b6', type: 'audio', url: '#', name: '坐姿調整引導 (音頻)', duration: '12:45' },
      { id: 'b7', type: 'attachment', url: '#', name: '初學者冥想與坐姿指南.pdf', size: '2.4 MB' }
    ]
  }
};

const dictionaries = {
  en: {
    back: 'Back to Resources',
    share: 'Share Resource',
  },
  zh: {
    back: '返回資源列表',
    share: '分享資源',
  }
};

export default function ResourceDetailPageWrapper() {
  const locale = 'en' as 'en' | 'zh';
  return (
    <PostDetailPage 
      post={mockResourceDetail} 
      locale={locale} 
      dictionary={dictionaries[locale]} 
    />
  );
}