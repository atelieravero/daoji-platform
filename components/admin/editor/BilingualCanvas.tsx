// components/admin/editor/BilingualCanvas.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Sparkles } from 'lucide-react';
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
  disabled?: boolean;
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
  disabled = false,
}: BilingualCanvasProps) {
  const [showSummaryZh, setShowSummaryZh] = useState(() => Boolean(summaryZh?.trim()));
  const [showSummaryEn, setShowSummaryEn] = useState(() => Boolean(summaryEn?.trim()));

  useEffect(() => {
    if (summaryZh?.trim()) setShowSummaryZh(true);
  }, [summaryZh]);

  useEffect(() => {
    if (summaryEn?.trim()) setShowSummaryEn(true);
  }, [summaryEn]);

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
            disabled={disabled}
            onChange={(e) => onTitleZhChange(e.target.value)}
            required
          />

          {/* COLLAPSIBLE OPTIONAL SUMMARY (ZH) */}
          <div className="rounded-xl border border-gray-200/80 bg-gray-50/50 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowSummaryZh((prev) => !prev)}
              className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-gray-100/70 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                {showSummaryZh ? (
                  <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                )}
                <span className="text-xs font-semibold text-gray-700">
                  自訂摘要 / SEO 簡介 (選填)
                </span>
              </div>
              {!summaryZh?.trim() ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  <Sparkles className="w-2.5 h-2.5" /> 留空將自動擷取內文首段
                </span>
              ) : (
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">
                  已設定自訂摘要
                </span>
              )}
            </button>

            {showSummaryZh && (
              <div className="px-3.5 pb-3.5 pt-1 border-t border-gray-200/60 space-y-1.5">
                <p className="text-[11px] text-gray-500">
                  用於列表卡片預覽及 WhatsApp / 社群分享簡介。若留空，系統會自動從下方內文擷取純文字摘要。
                </p>
                <textarea
                  rows={2}
                  disabled={disabled}
                  value={summaryZh}
                  onChange={(e) => onSummaryZhChange(e.target.value)}
                  placeholder="選填：輸入自訂簡短摘要（留空則自動從內文產生）..."
                  className="w-full px-3 py-2 text-sm bg-white text-gray-950 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-950 mb-1.5">詳細內容 (Markdown)</label>
            <MarkdownEditor
              value={bodyZh}
              onChange={(val) => !disabled && onBodyZhChange(val)}
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
            disabled={disabled}
            onChange={(e) => onTitleEnChange(e.target.value)}
          />

          {/* COLLAPSIBLE OPTIONAL SUMMARY (EN) */}
          <div className="rounded-xl border border-gray-200/80 bg-gray-50/50 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowSummaryEn((prev) => !prev)}
              className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-gray-100/70 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                {showSummaryEn ? (
                  <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                )}
                <span className="text-xs font-semibold text-gray-700">
                  Custom Summary / SEO Excerpt (Optional)
                </span>
              </div>
              {!summaryEn?.trim() ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  <Sparkles className="w-2.5 h-2.5" /> Auto-extracted if blank
                </span>
              ) : (
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">
                  Custom set
                </span>
              )}
            </button>

            {showSummaryEn && (
              <div className="px-3.5 pb-3.5 pt-1 border-t border-gray-200/60 space-y-1.5">
                <p className="text-[11px] text-gray-500">
                  Used for list card previews and OpenGraph social cards. Leave blank to auto-generate from the opening paragraph.
                </p>
                <textarea
                  rows={2}
                  disabled={disabled}
                  value={summaryEn}
                  onChange={(e) => onSummaryEnChange(e.target.value)}
                  placeholder="Optional: custom summary snippet (leave blank to auto-generate)..."
                  className="w-full px-3 py-2 text-sm bg-white text-gray-950 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-950 mb-1.5">Detailed Body (Markdown)</label>
            <MarkdownEditor
              value={bodyEn}
              onChange={(val) => !disabled && onBodyEnChange(val)}
              placeholder="Extended markdown content..."
              rows={bodyRows}
            />
          </div>
        </div>
      </div>
    </>
  );
}