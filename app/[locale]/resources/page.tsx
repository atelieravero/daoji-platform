'use client';

import React from 'react';
import PostDiscoveryFeed from '../../../components/shared/PostDiscoveryFeed';

const mockResources = [
  {
    id: 'res_1',
    type: 'resource',
    title: {
      en: 'Beginner Meditation & Posture Guide',
      zh: '初學者冥想與坐姿指南'
    },
    excerpt: {
      en: 'A comprehensive guide covering the fundamentals of sitting posture, breath awareness, and managing physical discomfort during meditation.',
      zh: '一份全面的指南，涵蓋坐姿基礎、呼吸覺察以及如何處理禪修過程中的身體不適。'
    },
    date_added: '2026-08-01',
    tags: {
      en: ['Guide', 'Beginner', 'Practice'],
      zh: ['指南', '初學者', '日常實修']
    },
    cover_image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=1000',
  },
  {
    id: 'res_2',
    type: 'resource',
    title: {
      en: 'Morning Chanting & Metta Meditation',
      zh: '晨間唱誦與慈心禪導引'
    },
    excerpt: {
      en: 'Daily morning chants in Pali and English, accompanied by guided loving-kindness meditation audio for daily practice.',
      zh: '每日巴利語與英文早課唱誦，配有慈心禪引導音頻，適合日常實修。'
    },
    date_added: '2026-07-28',
    tags: {
      en: ['Audio', 'Chanting', 'Practice'],
      zh: ['音頻', '唱誦', '日常實修']
    },
    cover_image: 'https://images.unsplash.com/photo-1511295742362-92c96b1fc485?auto=format&fit=crop&q=80&w=1000',
  },
  {
    id: 'res_3',
    type: 'resource',
    title: {
      en: 'Introduction to the Early Buddhist Teachings',
      zh: '早期佛教教義導論'
    },
    excerpt: {
      en: 'Recorded lecture exploring the historical preservation, structural overview, and core teachings of the early scriptures.',
      zh: '現場錄影講座，探討早期經典的歷史流傳、結構概述及其核心教義。'
    },
    date_added: '2026-07-15',
    tags: {
      en: ['Study', 'Dhamma Talk', 'Video'],
      zh: ['經教研讀', '佛法開示', '視頻']
    },
    cover_image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&q=80&w=1000',
  }
];

const dictionaries = {
  en: {
    title: 'Dhamma Resources & Library',
    subtitle: 'Explore guides, audio recordings, and teachings from Maggapaṭipadā.',
    searchPlaceholder: 'Search library...',
    filterAll: 'All Resources',
    readMore: 'Read & View',
  },
  zh: {
    title: '法寶與資源文庫',
    subtitle: '探索道跡禪院提供的修行指南、唱誦音頻及影音開示。',
    searchPlaceholder: '搜尋資源文庫...',
    filterAll: '所有資源',
    readMore: '查看詳情',
  }
};

export default function ResourcesDiscoveryPage() {
  const locale = 'en' as 'en' | 'zh';
  return (
    <PostDiscoveryFeed 
      postType="resource" 
      posts={mockResources} 
      locale={locale} 
      dictionary={dictionaries[locale]} 
    />
  );
}