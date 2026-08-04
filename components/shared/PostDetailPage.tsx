'use client';

import React from 'react';
import { ArrowLeft, Share2, Tag, Calendar, MapPin, FileText, Download, Play, Info, ArrowRight } from 'lucide-react';

interface PostDetailPageProps {
  post?: {
    id: string;
    type: 'event' | 'resource' | 'page';
    title: Record<'en' | 'zh', string>;
    date_added?: string;
    schedule_display?: Record<'en' | 'zh', string>;
    location?: Record<'en' | 'zh', string>;
    tags: Record<'en' | 'zh', string[]>;
    cover_image?: string | null;
    formStatus?: 'open' | 'closed';
    content: Record<'en' | 'zh', any[]>;
  };
  locale?: 'en' | 'zh';
  dictionary?: {
    back: string;
    share: string;
    dateTime?: string;
    location?: string;
    applyNow?: string;
    applicationClosed?: string;
    limitedSpots?: string;
  };
}

const BlockRenderer = ({ blocks }: { blocks: any[] }) => {
  const safeBlocks = Array.isArray(blocks) ? blocks : [];
  return (
    <div className="space-y-6">
      {safeBlocks.map((block) => {
        if (!block || typeof block !== 'object') return null;
        switch (block.type) {
          case 'h2':
            return <h2 key={block.id || Math.random()} className="text-2xl sm:text-3xl font-bold text-stone-800 mt-12 mb-4 tracking-tight">{block.content}</h2>;
          case 'h3':
            return <h3 key={block.id || Math.random()} className="text-xl font-bold text-stone-800 mt-8 mb-3">{block.content}</h3>;
          case 'p':
            return <p key={block.id || Math.random()} className="text-base sm:text-lg text-stone-600 leading-relaxed">{block.content}</p>;
          case 'quote':
            return (
              <blockquote key={block.id || Math.random()} className="border-l-4 border-[#A65D24] pl-6 py-2 my-8 italic text-xl sm:text-2xl text-stone-700 bg-stone-50/50 rounded-r-lg">
                "{block.content}"
              </blockquote>
            );
          case 'list':
            return (
              <ul key={block.id || Math.random()} className="space-y-3 my-6 pl-2">
                {Array.isArray(block.items) && block.items.map((item: string, i: number) => (
                  <li key={i} className="flex items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A65D24]/60 mt-2 mr-4 shrink-0"></span>
                    <span className="text-stone-600 sm:text-lg leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            );
          case 'image':
            return (
              <figure key={block.id || Math.random()} className="my-10">
                <img src={block.url} alt={block.alt || 'Image'} className="w-full rounded-2xl shadow-sm border border-stone-200 object-cover" />
                {block.alt && <figcaption className="text-center text-sm text-stone-500 mt-3">{block.alt}</figcaption>}
              </figure>
            );
          case 'video':
            return (
              <div key={block.id || Math.random()} className="my-10 aspect-video rounded-2xl overflow-hidden shadow-sm border border-stone-200 bg-stone-100">
                <iframe src={block.url} title="Video" className="w-full h-full border-0" allowFullScreen></iframe>
              </div>
            );
          case 'audio':
            return (
              <div key={block.id || Math.random()} className="flex items-center p-4 my-8 bg-white border border-stone-200 rounded-2xl shadow-sm">
                <div className="w-12 h-12 bg-[#A65D24] text-white rounded-xl flex items-center justify-center mr-4 shrink-0 shadow-sm cursor-pointer hover:bg-[#8B4D1E] transition-colors">
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-stone-800 font-semibold truncate">{block.name}</h4>
                  <p className="text-xs text-stone-500 mt-0.5">{block.duration || 'Audio'} • Recording</p>
                </div>
              </div>
            );
          case 'attachment':
            return (
              <a key={block.id || Math.random()} href={block.url || '#'} className="flex items-center p-4 my-8 bg-white border border-stone-200 rounded-xl hover:border-[#A65D24] hover:shadow-md transition-all group cursor-pointer">
                <div className="w-12 h-12 bg-[#FAF5F0] rounded-lg flex items-center justify-center mr-4 shrink-0 group-hover:bg-[#A65D24] transition-colors">
                  <FileText className="w-6 h-6 text-[#A65D24] group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-stone-800 font-medium group-hover:text-[#A65D24] transition-colors truncate">{block.name}</h4>
                  <p className="text-xs text-stone-500 mt-0.5">{block.size || 'Downloadable File'}</p>
                </div>
                <Download className="w-5 h-5 text-stone-400 group-hover:text-[#A65D24] transition-colors shrink-0 ml-4" />
              </a>
            );
          default:
            return null;
        }
      })}
    </div>
  );
};

export default function PostDetailPage({ post, locale = 'en', dictionary }: PostDetailPageProps) {
  const safePost = post || {
    id: 'evt_1',
    type: 'event',
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
    formStatus: 'open',
    content: {
      en: [
        { id: 'b1', type: 'h2', content: 'About the Program' },
        { id: 'b2', type: 'p', content: 'Join us for a profound journey into mindfulness.' }
      ],
      zh: [
        { id: 'b1', type: 'h2', content: '關於本計劃' },
        { id: 'b2', type: 'p', content: '加入我們，展開一段深刻的正念之旅。' }
      ]
    }
  };

  const t = dictionary || {
    back: locale === 'zh' ? '返回列表' : 'Back',
    share: locale === 'zh' ? '分享' : 'Share',
    dateTime: locale === 'zh' ? '日期與時間' : 'Date & Time',
    location: locale === 'zh' ? '地點' : 'Location',
    applyNow: locale === 'zh' ? '立即報名' : 'Apply Now',
    applicationClosed: locale === 'zh' ? '報名已截止' : 'Application Closed',
    limitedSpots: locale === 'zh' ? '名額有限。報名將以滾動方式進行審核。' : 'Spaces are limited. Applications are reviewed on a rolling basis.'
  };

  const isEvent = safePost.type === 'event';
  const postTitle = safePost.title?.[locale] || safePost.title?.['en'] || '';
  const postTags = safePost.tags?.[locale] || safePost.tags?.['en'] || [];
  const scheduleText = safePost.schedule_display?.[locale] || safePost.schedule_display?.['en'] || '';
  const locationText = safePost.location?.[locale] || safePost.location?.['en'] || '';
  const contentBlocks = safePost.content?.[locale] || safePost.content?.['en'] || [];

  return (
    <div className="w-full bg-[#FCFAF8] min-h-screen pb-32">
      <div className={`mx-auto px-4 sm:px-6 lg:px-8 py-6 ${isEvent ? 'max-w-6xl' : 'max-w-4xl'}`}>
        <a 
          href={`/${locale}/${isEvent ? 'events' : safePost.type === 'resource' ? 'resources' : ''}`} 
          className="inline-flex items-center text-sm font-medium text-stone-500 hover:text-[#A65D24] transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          {t.back}
        </a>
      </div>

      {safePost.cover_image && (
        <div className={`mx-auto px-4 sm:px-6 lg:px-8 mb-12 ${isEvent ? 'max-w-6xl' : 'max-w-4xl'}`}>
          <div className={`w-full rounded-3xl overflow-hidden relative shadow-sm ${isEvent ? 'h-64 sm:h-96 md:h-[28rem]' : 'h-64 sm:h-96'}`}>
            <img 
              src={safePost.cover_image} 
              alt={postTitle} 
              className="w-full h-full object-cover animate-in fade-in zoom-in-95 duration-1000 ease-out"
            />
          </div>
        </div>
      )}

      <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${isEvent ? 'max-w-6xl flex flex-col lg:flex-row gap-12 lg:gap-16 relative' : 'max-w-4xl'}`}>
        <div className={`flex-1 ${isEvent ? 'lg:max-w-3xl' : 'max-w-none'}`}>
          <div className="mb-10 pb-10 border-b border-stone-200/60">
            <div className="flex flex-wrap gap-2 mb-6">
              {Array.isArray(postTags) && postTags.map(tag => (
                <span key={tag} className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-[#FAF5F0] text-[#A65D24]">
                  <Tag className="w-3.5 h-3.5 mr-1.5" />
                  {tag}
                </span>
              ))}
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-stone-800 tracking-tight leading-tight mb-6">
              {postTitle}
            </h1>

            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-stone-400 font-medium">
                <Calendar className="w-4 h-4 mr-2 text-stone-400" />
                {safePost.date_added || scheduleText}
              </div>

              <div className="flex items-center text-sm font-medium text-stone-500 hover:text-stone-800 cursor-pointer transition-colors">
                <Share2 className="w-4 h-4 mr-2" />
                {t.share}
              </div>
            </div>
          </div>

          <article className="prose-stone max-w-none">
            <BlockRenderer blocks={contentBlocks} />
          </article>
        </div>

        {isEvent && (
          <div className="lg:w-80 shrink-0 relative">
            <div className="sticky top-28 bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm">
              <h3 className="text-lg font-bold text-stone-800 mb-6">{locale === 'en' ? 'Event Details' : '活動詳情'}</h3>
              
              <div className="space-y-6 mb-8">
                {scheduleText && (
                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-xl bg-[#FAF5F0] flex items-center justify-center shrink-0 mr-4">
                      <Calendar className="w-5 h-5 text-[#A65D24]" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1">{t.dateTime}</p>
                      <p className="text-sm font-medium text-stone-800 leading-relaxed">{scheduleText}</p>
                    </div>
                  </div>
                )}

                {locationText && (
                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-xl bg-[#FAF5F0] flex items-center justify-center shrink-0 mr-4">
                      <MapPin className="w-5 h-5 text-[#A65D24]" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1">{t.location}</p>
                      <p className="text-sm font-medium text-stone-800 leading-relaxed">{locationText}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="hidden lg:block border-t border-stone-100 pt-6">
                {safePost.formStatus === 'open' ? (
                  <>
                    <a href={`/${locale}/apply/f_1`} className="w-full flex items-center justify-center px-6 py-4 bg-[#A65D24] hover:bg-[#8B4D1E] text-white text-lg font-semibold rounded-xl transition-all shadow-sm group">
                      {t.applyNow || 'Apply Now'}
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </a>
                    <div className="flex items-start mt-4 text-stone-400">
                      <Info className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
                      <p className="text-xs leading-relaxed">{t.limitedSpots}</p>
                    </div>
                  </>
                ) : (
                  <button disabled className="w-full flex items-center justify-center px-6 py-4 bg-stone-100 text-stone-400 text-lg font-semibold rounded-xl cursor-not-allowed">
                    {t.applicationClosed || 'Closed'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}