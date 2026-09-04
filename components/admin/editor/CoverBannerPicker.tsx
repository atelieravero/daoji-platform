'use client';

import React from 'react';
import { ImageIcon, Trash2 } from 'lucide-react';

interface CoverBannerPickerProps {
  label?: string;
  bannerUrl: string | null;
  onOpenPicker: () => void;
  onRemoveBanner: () => void;
  disabled?: boolean;
}

export default function CoverBannerPicker({
  label = 'Cover Banner Image',
  bannerUrl,
  onOpenPicker,
  onRemoveBanner,
  disabled = false,
}: CoverBannerPickerProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-bold text-gray-900">{label}</label>
      {bannerUrl ? (
        <div className="relative w-full aspect-21/9 rounded-xl border border-gray-200 overflow-hidden group bg-gray-50">
          <img src={bannerUrl} alt="Cover Banner" className="w-full h-full object-cover" />
          {!disabled && (
            <button
              type="button"
              onClick={onRemoveBanner}
              className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black text-white rounded-lg transition-colors cursor-pointer"
              title="Remove Banner"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={onOpenPicker}
          className={`w-full border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-colors group ${
            disabled 
              ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed' 
              : 'border-gray-300 hover:border-indigo-500 hover:bg-indigo-50/30 cursor-pointer'
          }`}
        >
          <ImageIcon className={`w-8 h-8 mb-2 transition-colors ${disabled ? 'text-gray-300' : 'text-gray-400 group-hover:text-indigo-600'}`} />
          <span className={`text-xs font-bold ${disabled ? 'text-gray-400' : 'text-gray-700 group-hover:text-indigo-600'}`}>
            {disabled ? 'No Cover Banner Selected' : 'Select Banner from Media Pool'}
          </span>
        </button>
      )}
    </div>
  );
}