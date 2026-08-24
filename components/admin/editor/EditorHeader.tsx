'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Eye, Save, Loader2, PanelLeft, LayoutPanelLeft } from 'lucide-react';

interface EditorHeaderProps {
  backHref: string;
  title: string;
  codeBadge?: string;
  isSplitView?: boolean;
  onToggleSplitView?: (split: boolean) => void;
  previewUrl?: string;
  onSave: () => void;
  isSaving: boolean;
  saveLabel?: string;
}

export default function EditorHeader({
  backHref,
  title,
  codeBadge,
  isSplitView,
  onToggleSplitView,
  previewUrl,
  onSave,
  isSaving,
  saveLabel = 'Save Changes',
}: EditorHeaderProps) {
  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 z-10">
      <div className="flex items-center">
        <Link
          href={backHref}
          className="p-2 -ml-2 mr-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-semibold text-gray-900 truncate max-w-sm">
          {title || 'Untitled'}
        </h1>
        {codeBadge && (
          <span className="ml-3 font-mono text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold border border-indigo-200">
            {codeBadge}
          </span>
        )}
      </div>

      <div className="flex items-center space-x-3">
        {onToggleSplitView && typeof isSplitView === 'boolean' && (
          <div className="flex items-center bg-gray-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => onToggleSplitView(false)}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center transition-colors cursor-pointer ${
                !isSplitView ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Single Language Pane"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onToggleSplitView(true)}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center transition-colors cursor-pointer ${
                isSplitView ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Bilingual Split View"
            >
              <LayoutPanelLeft className="w-4 h-4" />
            </button>
          </div>
        )}

        {previewUrl && (
          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 transition-colors cursor-pointer"
          >
            <Eye className="w-4 h-4 mr-2" /> Preview & Test
          </a>
        )}

        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          <span>{isSaving ? 'Saving...' : saveLabel}</span>
        </button>
      </div>
    </div>
  );
}