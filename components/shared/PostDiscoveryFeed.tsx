'use client';

import React, { useState, useMemo } from 'react';
import { ArrowRight, Tag, Search, Calendar } from 'lucide-react';

interface PostDiscoveryFeedProps {
  postType?: 'event' | 'resource' | 'page';
  posts?: any[];
  locale?: 'en' | 'zh';
  dictionary?: {
    title?: string;
    subtitle?: string;
    searchPlaceholder?: string;
    filterAll?: string;
    readMore?: string;
  };
}

export default function PostDiscoveryFeed({ 
  postType = 'event', 
  posts = [], 
  locale = 'en', 
  dictionary = {
    title: 'Events & Retreats',
    subtitle: 'Explore upcoming retreats and programs.',
    filterAll: 'All',
    readMore: 'Read More'
  } 
}: PostDiscoveryFeedProps) {
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder] = useState<'earliest' | 'latest'>('earliest');

  const getTimeStatus = (startDateStr?: string, endDateStr?: string | null) => {
    if (!startDateStr) return 'upcoming';
    const now = new Date('2026-08-04T00:00:00').getTime();
    const start = new Date(startDateStr).getTime();
    const end = new Date(endDateStr || startDateStr).getTime() + 86400000;

    if (now < start) return 'upcoming';
    if (now > end) return 'past';
    return 'happening';
  };

  const allTags = useMemo(() => {
    const safePosts = Array.isArray(posts) ? posts : [];
    return Array.from(new Set(safePosts.filter(p => p && p.type === postType).flatMap(p => {
      const tagsObj = p.tags;
      if (!tagsObj) return [];
      const tagList = tagsObj[locale] || tagsObj['en'] || [];
      return Array.isArray(tagList) ? tagList : [];
    })));
  }, [posts, postType, locale]);

  const filteredPosts = useMemo(() => {
    const safePosts = Array.isArray(posts) ? posts : [];
    let result = safePosts.filter(p => p && p.type === postType);

    if (activeTag) {
      result = result.filter(p => {
        const tagList = p.tags?.[locale] || p.tags?.['en'] || [];
        return Array.isArray(tagList) && tagList.includes(activeTag);
      });
    }

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(p => {
        const titleStr = typeof p.title === 'string' ? p.title : (p.title?.[locale] || p.title?.['en'] || '');
        const excerptStr = typeof p.excerpt === 'string' ? p.excerpt : (p.excerpt?.[locale] || p.excerpt?.['en'] || '');
        return titleStr.toLowerCase().includes(term) || excerptStr.toLowerCase().includes(term);
      });
    }

    result.sort((a, b) => {
      const timeA = new Date(a.date_added || a.start_date || 0).getTime();
      const timeB = new Date(b.date_added || b.start_date || 0).getTime();
      return sortOrder === 'earliest' ? timeA - timeB : timeB - timeA;
    });

    return result;
  }, [posts, postType, activeTag, searchTerm, sortOrder, locale]);

  return (
    <div className="w-full bg-[#FCFAF8] min-h-screen pb-20">
      <div className="bg-[#FAF5F0] border-b border-[#F2E8DC] py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-800 tracking-tight mb-4">
            {dictionary?.title || ''}
          </h1>
          <p className="text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed">
            {dictionary?.subtitle || ''}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="space-y-6 mb-10">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTag(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTag === null 
                    ? 'bg-[#A65D24] text-white shadow-md' 
                    : 'bg-white text-stone-600 border border-stone-200 hover:border-[#A65D24]'
                }`}
              >
                {dictionary?.filterAll || 'All'}
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(tag)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    activeTag === tag 
                      ? 'bg-[#A65D24] text-white shadow-md' 
                      : 'bg-white text-stone-600 border border-stone-200 hover:border-[#A65D24]'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            {dictionary?.searchPlaceholder && (
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
                <input 
                  type="text"
                  placeholder={dictionary.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-none focus:border-[#A65D24] shadow-sm"
                />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {filteredPosts.map((post) => {
            const timeStatus = postType === 'event' ? getTimeStatus(post.start_date, post.end_date) : null;
            const postTitle = typeof post.title === 'string' ? post.title : (post.title?.[locale] || post.title?.['en'] || '');
            const postExcerpt = typeof post.excerpt === 'string' ? post.excerpt : (post.excerpt?.[locale] || post.excerpt?.['en'] || '');
            const postTags = post.tags?.[locale] || post.tags?.['en'] || [];

            return (
              <div 
                key={post.id}
                className="bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden group"
              >
                {post.cover_image && (
                  <div className="w-full h-48 sm:h-56 bg-stone-100 overflow-hidden relative border-b border-stone-100">
                    {timeStatus === 'happening' && (
                      <div className="absolute top-4 left-4 z-10 bg-emerald-600/95 backdrop-blur-sm text-white text-xs font-bold tracking-wide px-3 py-1.5 rounded-full shadow-md flex items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse mr-1.5"></span>
                        Happening Now
                      </div>
                    )}
                    <img 
                      src={post.cover_image} 
                      alt={postTitle} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                )}

                <div className="flex flex-col sm:flex-row p-6 sm:p-8 gap-8 justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {Array.isArray(postTags) && postTags.map((tag: string) => (
                        <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-[#FAF5F0] text-[#A65D24]">
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>

                    <h2 className="text-2xl font-bold text-stone-800 mb-2 group-hover:text-[#A65D24] transition-colors">
                      {postTitle}
                    </h2>

                    <p className="text-stone-600 text-sm sm:text-base leading-relaxed mb-6">
                      {postExcerpt}
                    </p>

                    <div className="flex items-center text-xs text-stone-400 font-medium">
                      <Calendar className="w-3.5 h-3.5 mr-1.5" />
                      {post.date_added || (typeof post.schedule_display === 'string' ? post.schedule_display : (post.schedule_display?.[locale] || post.schedule_display?.['en'])) || '2026'}
                    </div>
                  </div>

                  <div className="sm:w-48 flex flex-col justify-center shrink-0 border-t sm:border-t-0 sm:border-l border-stone-100 pt-6 sm:pt-0 sm:pl-6">
                    <a 
                      href={`/${locale}/${postType === 'event' ? 'events' : 'resources'}/${post.id}`}
                      className="w-full flex items-center justify-center px-6 py-3.5 bg-[#FAF5F0] hover:bg-[#A65D24] text-[#A65D24] hover:text-white font-semibold rounded-xl text-sm transition-all group/btn shadow-sm"
                    >
                      {dictionary?.readMore || 'Read More'}
                      <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
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