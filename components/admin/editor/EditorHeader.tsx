'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Eye, Save, Loader2, Columns, Square } from 'lucide-react';

export interface EditorHeaderProps {
  backHref: string;
  title: string;
  codeBadge?: string;
  isSplitView?: boolean;
  onToggleSplitView?: (val: boolean) => void;
  previewUrl?: string;
  onSave?: () => void;
  disabled?: boolean;
  isSaving?: boolean;
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
  disabled = false,
  isSaving = false,
  saveLabel = 'Save Changes',
}: EditorHeaderProps) {
  const isSaveDisabled = disabled || isSaving || !onSave;

  return (
    <header className="h-16 border-b border-gray-200 bg-white px-6 flex items-center justify-between shrink-0 z-20">
      {/* LEFT: BACK & TITLE */}
      <div className="flex items-center gap-3">
        <Link
          href={backHref}
          className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          title="Go Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2">
          <h1 className="text-base font-bold text-gray-900 truncate max-w-sm md:max-w-md">
            {title || 'Untitled'}
          </h1>
          {codeBadge && (
            <span className="font-mono text-xs font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md">
              {codeBadge}
            </span>
          )}
        </div>
      </div>

      {/* RIGHT: CONTROLS */}
      <div className="flex items-center gap-3">
        {/* Split View Toggle */}
        {onToggleSplitView && isSplitView !== undefined && (
          <button
            type="button"
            onClick={() => onToggleSplitView(!isSplitView)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors cursor-pointer"
            title="Toggle Split Canvas"
          >
            {isSplitView ? <Columns className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
            <span>{isSplitView ? 'Split View' : 'Single View'}</span>
          </button>
        )}

        {/* Public Preview */}
        {previewUrl && (
          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-gray-500" />
            <span>Preview & Test</span>
          </a>
        )}

        {/* Save Schema / Locked Button */}
        <button
          type="button"
          onClick={onSave}
          disabled={isSaveDisabled}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl shadow-xs transition-all ${
            isSaveDisabled
              ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed select-none shadow-none'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer active:scale-95'
          }`}
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{saveLabel}</span>
        </button>
      </div>
    </header>
  );
}