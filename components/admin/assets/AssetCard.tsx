'use client';

import React from 'react';
import { Image as ImageIcon, Music, FileText, Check, Copy, Trash2 } from 'lucide-react';
import { AssetRecord } from '@/app/admin/(dashboard)/assets/actions';
import { formatFileSize } from '@/lib/format';

interface AssetCardProps {
  asset: AssetRecord;
  isSelected: boolean;
  onSelect: (asset: AssetRecord) => void;
  onCopyUrl?: (e: React.MouseEvent, url: string, id: string) => void;
  onDelete?: (e: React.MouseEvent, asset: AssetRecord) => void;
  copiedId?: string | null;
  canDelete?: boolean;
}

export default function AssetCard({
  asset,
  isSelected,
  onSelect,
  onCopyUrl,
  onDelete,
  copiedId,
  canDelete = false,
}: AssetCardProps) {
  const isImage = asset.mime_type.startsWith('image/');
  const isAudio = asset.mime_type.startsWith('audio/');

  return (
    <div
      onClick={() => onSelect(asset)}
      className={`group relative bg-white rounded-2xl border-2 overflow-hidden cursor-pointer transition-all shadow-xs ${
        isSelected
          ? 'border-indigo-600 ring-4 ring-indigo-600/10'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
      }`}
    >
      {/* QUICK ACTIONS OVERLAY */}
      <div className="absolute top-2 right-2 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        {onCopyUrl && (
          <button
            onClick={(e) => onCopyUrl(e, asset.file_url, asset.id)}
            className="p-1.5 bg-white/95 hover:bg-white text-gray-700 hover:text-indigo-600 rounded-md shadow-xs transition-colors backdrop-blur-xs cursor-pointer"
            title="Copy Link"
          >
            {copiedId === asset.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        )}
        {canDelete && onDelete && (
          <button
            onClick={(e) => onDelete(e, asset)}
            className="p-1.5 bg-white/95 hover:bg-red-50 text-gray-700 hover:text-red-600 rounded-md shadow-xs transition-colors backdrop-blur-xs cursor-pointer"
            title="Delete Asset"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* THUMBNAIL */}
      <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden border-b border-gray-100">
        {isImage ? (
          <img
            src={asset.file_url}
            alt={asset.alt_text_zh || asset.file_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : isAudio ? (
          <Music className="w-10 h-10 text-amber-500" />
        ) : (
          <FileText className="w-10 h-10 text-indigo-500" />
        )}
      </div>

      {/* METADATA */}
      <div className="p-3">
        <p className="text-xs font-bold text-gray-900 truncate" title={asset.file_name}>
          {asset.file_name}
        </p>
        <div className="flex items-center justify-between mt-1 text-[11px] text-gray-400">
          <span>{formatFileSize(asset.file_size_bytes)}</span>
          <span className="capitalize">{asset.mime_type.split('/')[1] || 'file'}</span>
        </div>
      </div>
    </div>
  );
}