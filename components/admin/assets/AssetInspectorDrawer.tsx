'use client';

import React from 'react';
import { X, Copy, Check, Trash2, ExternalLink, FileText } from 'lucide-react';
import { AssetRecord } from '@/app/admin/(dashboard)/assets/actions';
import { formatFileSize } from '@/lib/format';

interface AssetInspectorDrawerProps {
  asset: AssetRecord | null;
  onClose: () => void;
  onDelete?: (asset: AssetRecord) => void;
  onCopyUrl?: (url: string, id: string) => void;
  copiedId?: string | null;
  canDelete?: boolean;
}

export default function AssetInspectorDrawer({
  asset,
  onClose,
  onDelete,
  onCopyUrl,
  copiedId,
  canDelete = false,
}: AssetInspectorDrawerProps) {
  if (!asset) return null;

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-6 flex flex-col justify-between shadow-xl z-10 animate-in slide-in-from-right duration-200">
      <div className="space-y-5 overflow-y-auto">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Asset Details</span>
          <div className="flex items-center gap-1">
            {canDelete && onDelete && (
              <button
                onClick={() => onDelete(asset)}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                title="Delete Asset"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              title="Close Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* THUMBNAIL */}
        <div className="aspect-video bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden">
          {asset.mime_type.startsWith('image/') ? (
            <img src={asset.file_url} alt="" className="w-full h-full object-contain" />
          ) : (
            <FileText className="w-10 h-10 text-indigo-400" />
          )}
        </div>

        {/* METADATA */}
        <div className="space-y-3 text-xs">
          <div>
            <span className="text-gray-400 block font-medium">File Name</span>
            <span className="font-semibold text-gray-900 break-all">{asset.file_name}</span>
          </div>
          <div>
            <span className="text-gray-400 block font-medium">CDN URL</span>
            <div className="flex items-center gap-1 mt-1">
              <input
                readOnly
                value={asset.file_url}
                className="w-full px-2 py-1 bg-gray-50 border border-gray-200 rounded text-[11px] font-mono text-gray-600 select-all"
              />
              {onCopyUrl && (
                <button
                  onClick={() => onCopyUrl(asset.file_url, asset.id)}
                  className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-600 transition-colors cursor-pointer"
                  title="Copy URL"
                >
                  {copiedId === asset.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>
          <div>
            <span className="text-gray-400 block font-medium">File Size</span>
            <span className="font-semibold text-gray-900">{formatFileSize(asset.file_size_bytes)}</span>
          </div>
          <div>
            <span className="text-gray-400 block font-medium">MIME Type</span>
            <span className="font-mono text-gray-900">{asset.mime_type}</span>
          </div>
          {asset.alt_text_zh && (
            <div>
              <span className="text-gray-400 block font-medium">Alt Text (ZH)</span>
              <span className="text-gray-700">{asset.alt_text_zh}</span>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div className="pt-4 border-t border-gray-100 flex flex-col gap-2 shrink-0">
        <a
          href={asset.file_url}
          target="_blank"
          rel="noreferrer"
          className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg flex items-center justify-center transition-colors cursor-pointer"
        >
          <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Open in New Tab
        </a>
        {canDelete && onDelete && (
          <button
            onClick={() => onDelete(asset)}
            className="w-full py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-semibold rounded-lg flex items-center justify-center transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete from Media Pool
          </button>
        )}
      </div>
    </div>
  );
}