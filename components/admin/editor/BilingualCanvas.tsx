'use client';

import React from 'react';
import { FormInput } from '@/components/ui/FormControls';
import MarkdownEditor from '@/components/shared/MarkdownEditor';

interface BilingualCanvasProps {
  isSplitView: boolean;
  activeLang: 'zh' | 'en';
  onSelectLang: (lang: 'zh' | 'en') => void;
  titleZh: string;
  onTitleZhChange: (val: string) => void;
  titleEn: string;
  onTitleEnChange: (val: string) => void;
  summaryZh: string;
  onSummaryZhChange: (val: string) => void;
  summaryEn: string;
  onSummaryEnChange: (val: string) => void;
  bodyZh: string;
  onBodyZhChange: (val: string) => void;
  bodyEn: string;
  onBodyEnChange: (val: string) => void;
  bodyRows?: number;
}

export default function BilingualCanvas({
  isSplitView,
  activeLang,
  onSelectLang,
  titleZh,
  onTitleZhChange,
  titleEn,
  onTitleEnChange,
  summaryZh,
  onSummaryZhChange,
  summaryEn,
  onSummaryEnChange,
  bodyZh,
  onBodyZhChange,
  bodyEn,
  onBodyEnChange,
  bodyRows = 12,
}: BilingualCanvasProps) {
  return (
    <>
      {/* CHINESE CANVAS PANE */}
      <div
        className={`flex-1 flex flex-col overflow-y-auto border-r border-gray-200 p-8 pb-32 transition-all ${
          !isSplitView && activeLang === 'en' ? 'hidden' : 'flex'
        }`}
      >
        {!isSplitView && (
          <div className="flex items-center gap-2 mb-4 bg-gray-100 p-1 rounded-lg self-start">
            <button
              type="button"
              onClick={() => onSelectLang('zh')}
              className={`px-3 py-1 text-xs font-bold rounded-md cursor-pointer ${
                activeLang === 'zh' ? 'bg-white text-indigo-600 shadow-xs' : 'text-gray-600'
              }`}
            >
              中文
            </button>
            <button
              type="button"
              onClick={() => onSelectLang('en')}
              className={`px-3 py-1 text-xs font-bold rounded-md cursor-pointer ${
                activeLang === 'en' ? 'bg-white text-indigo-600 shadow-xs' : 'text-gray-600'
              }`}
            >
              English
            </button>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-8 space-y-6 max-w-2xl mx-auto w-full">
          <div className="border-b border-gray-100 pb-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">中文內容</span>
          </div>

          <FormInput
            label="標題"
            placeholder="請輸入中文標題..."
            value={titleZh}
            onChange={(e) => onTitleZhChange(e.target.value)}
            required
          />

          <div>
            <label className="block text-sm font-semibold text-gray-950 mb-1.5">簡介摘要</label>
            <p className="text-[11px] text-gray-500 mb-2">用於卡片預覽及社群分享簡介。</p>
            <textarea
              rows={2}
              value={summaryZh}
              onChange={(e) => onSummaryZhChange(e.target.value)}
              placeholder="簡短摘要介紹..."
              className="w-full px-3 py-2 text-sm bg-white text-gray-950 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-950 mb-1.5">詳細內容 (Markdown)</label>
            <MarkdownEditor
              value={bodyZh}
              onChange={onBodyZhChange}
              placeholder="支援 Markdown 格式..."
              rows={bodyRows}
            />
          </div>
        </div>
      </div>

      {/* ENGLISH CANVAS PANE */}
      <div
        className={`flex-1 flex flex-col overflow-y-auto p-8 pb-32 transition-all ${
          !isSplitView && activeLang === 'zh' ? 'hidden' : 'flex'
        }`}
      >
        {!isSplitView && (
          <div className="flex items-center gap-2 mb-4 bg-gray-100 p-1 rounded-lg self-start">
            <button
              type="button"
              onClick={() => onSelectLang('zh')}
              className={`px-3 py-1 text-xs font-bold rounded-md cursor-pointer ${
                activeLang === 'zh' ? 'bg-white text-indigo-600 shadow-xs' : 'text-gray-600'
              }`}
            >
              中文
            </button>
            <button
              type="button"
              onClick={() => onSelectLang('en')}
              className={`px-3 py-1 text-xs font-bold rounded-md cursor-pointer ${
                activeLang === 'en' ? 'bg-white text-indigo-600 shadow-xs' : 'text-gray-600'
              }`}
            >
              English
            </button>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-8 space-y-6 max-w-2xl mx-auto w-full">
          <div className="border-b border-gray-100 pb-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">English Content</span>
          </div>

          <FormInput
            label="Title"
            placeholder="Enter English title..."
            value={titleEn}
            onChange={(e) => onTitleEnChange(e.target.value)}
          />

          <div>
            <label className="block text-sm font-semibold text-gray-950 mb-1.5">Summary Snippet</label>
            <p className="text-[11px] text-gray-500 mb-2">Used for card previews and OpenGraph tags.</p>
            <textarea
              rows={2}
              value={summaryEn}
              onChange={(e) => onSummaryEnChange(e.target.value)}
              placeholder="Brief preview description..."
              className="w-full px-3 py-2 text-sm bg-white text-gray-950 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-950 mb-1.5">Detailed Body (Markdown)</label>
            <MarkdownEditor
              value={bodyEn}
              onChange={onBodyEnChange}
              placeholder="Extended markdown content..."
              rows={bodyRows}
            />
          </div>
        </div>
      </div>
    </>
  );
}