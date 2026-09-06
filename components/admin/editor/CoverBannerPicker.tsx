'use client';

import React, { useState } from 'react';
import { ImageIcon, Trash2, Crop } from 'lucide-react';
import ImageCropModal from './ImageCropModal';
import { AssetRecord } from '@/app/admin/(dashboard)/assets/actions';

interface CoverBannerPickerProps {
  label?: string;
  bannerUrl: string | null;
  onOpenPicker: () => void;
  onRemoveBanner: () => void;
  onCropSuccess?: (croppedAsset: AssetRecord) => void;
  aspectRatio?: number; // e.g. 16/9, 16/5
  aspectRatioLabel?: string; // e.g. "16:9", "16:5"
  disabled?: boolean;
}

export default function CoverBannerPicker({
  label = 'Cover Banner Image',
  bannerUrl,
  onOpenPicker,
  onRemoveBanner,
  onCropSuccess,
  aspectRatio = 16 / 9,
  aspectRatioLabel = '16:9',
  disabled = false,
}: CoverBannerPickerProps) {
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-bold text-gray-900">{label}</label>
          {aspectRatioLabel && (
            <span className="text-[11px] font-mono text-gray-400 font-medium">
              Ratio {aspectRatioLabel}
            </span>
          )}
        </div>

        {bannerUrl ? (
          <div
            style={{ aspectRatio: `${aspectRatio}` }}
            className="relative w-full rounded-xl border border-gray-200 overflow-hidden group bg-gray-50"
          >
            <img src={bannerUrl} alt="Cover Banner" className="w-full h-full object-cover" />
            
            {!disabled && (
              <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                {onCropSuccess && (
                  <button
                    type="button"
                    onClick={() => setIsCropModalOpen(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-black/70 hover:bg-black text-white text-xs font-semibold rounded-lg shadow-sm backdrop-blur-xs transition-colors cursor-pointer"
                    title={`Crop Banner (${aspectRatioLabel})`}
                  >
                    <Crop className="w-3.5 h-3.5" />
                    <span>Crop</span>
                  </button>
                )}
                
                <button
                  type="button"
                  onClick={onRemoveBanner}
                  className="p-1.5 bg-black/70 hover:bg-red-600 text-white rounded-lg shadow-sm backdrop-blur-xs transition-colors cursor-pointer"
                  title="Remove Banner"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            disabled={disabled}
            onClick={onOpenPicker}
            style={{ aspectRatio: `${aspectRatio}` }}
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
            <span className="text-[11px] text-gray-400 mt-0.5">
              Recommended aspect ratio: {aspectRatioLabel}
            </span>
          </button>
        )}
      </div>

      {/* CROP MODAL */}
      {bannerUrl && onCropSuccess && (
        <ImageCropModal
          isOpen={isCropModalOpen && !disabled}
          onClose={() => setIsCropModalOpen(false)}
          imageUrl={bannerUrl}
          aspectRatio={aspectRatio}
          aspectRatioLabel={aspectRatioLabel}
          onCropSuccess={onCropSuccess}
        />
      )}
    </>
  );
}