'use client';

import React, { useRef, useState } from 'react';
import { ImageIcon } from 'lucide-react';
import MediaPicker from '@/components/admin/MediaPicker';
import { AssetRecord } from '@/app/admin/(dashboard)/assets/actions';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  disabled?: boolean;
}

export default function MarkdownEditor({
  value,
  onChange,
  placeholder,
  rows = 3,
  className = '',
  disabled = false,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  // Helper to inject text exactly where the cursor is positioned
  const insertTextAtCursor = (textToInsert: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = value.substring(0, start) + textToInsert + value.substring(end);
    
    onChange(newValue);

    // Reset cursor position after React re-renders to maintain typing flow
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + textToInsert.length;
      textarea.focus();
    }, 0);
  };

  const handleAssetSelect = (asset: AssetRecord) => {
    const altText = asset.alt_text_zh || asset.alt_text_en || asset.file_name;
    insertTextAtCursor(`\n![${altText}](${asset.file_url})\n`);
    setIsMediaPickerOpen(false);
  };

  return (
    <>
      <div
        className={`relative border rounded-lg overflow-hidden transition-shadow ${
          disabled
            ? 'bg-gray-100 border-gray-200 cursor-not-allowed'
            : 'bg-white border-gray-300 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500'
        } ${className}`}
      >
        <textarea
          ref={textareaRef}
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-3 py-2 text-sm text-gray-900 placeholder-gray-400 bg-transparent outline-none resize-y min-h-[80px] disabled:cursor-not-allowed disabled:text-gray-500"
        />
        
        {/* Formatting Toolbar / Footer */}
        <div className="flex items-center justify-between px-2 py-1.5 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center space-x-1">
            <button
              type="button"
              disabled={disabled}
              onClick={() => setIsMediaPickerOpen(true)}
              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors disabled:opacity-40 disabled:hover:text-gray-400 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
              title="Insert Image from Media Pool"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
          </div>
          <span className="text-[10px] text-gray-400 font-medium tracking-wide select-none">
            MARKDOWN SUPPORTED
          </span>
        </div>
      </div>

      {/* MEDIA POOL MODAL */}
      <MediaPicker
        isOpen={isMediaPickerOpen && !disabled}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={handleAssetSelect}
        allowedCategory="image"
        title="Insert Image from Media Pool"
      />
    </>
  );
}