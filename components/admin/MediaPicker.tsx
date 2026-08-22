'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  X, UploadCloud, Search, Check, Image as ImageIcon, 
  FileText, Music, Loader2, AlertCircle 
} from 'lucide-react';
import { 
  listAssetsAction, 
  getAssetPresignedUploadUrlAction, 
  registerAssetAction, 
  AssetRecord, 
  AssetCategory 
} from '@/app/admin/(dashboard)/assets/actions';

interface MediaPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (asset: AssetRecord) => void;
  allowedCategory?: AssetCategory;
  title?: string;
}

export default function MediaPicker({
  isOpen,
  onClose,
  onSelect,
  allowedCategory = 'all',
  title = 'Select Media Asset'
}: MediaPickerProps) {
  const [activeTab, setActiveTab] = useState<'browse' | 'upload'>('browse');
  const [category, setCategory] = useState<AssetCategory>(allowedCategory);
  const [search, setSearch] = useState('');
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<AssetRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form states for inline upload
  const [altTextZh, setAltTextZh] = useState('');
  const [altTextEn, setAltTextEn] = useState('');

  const fetchAssets = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await listAssetsAction({ category, search, limit: 30 });
      setAssets(res.data);
    } catch (err: any) {
      console.error('Failed to load assets:', err);
    } finally {
      setIsLoading(false);
    }
  }, [category, search]);

  useEffect(() => {
    if (isOpen) {
      fetchAssets();
      setSelectedAsset(null);
      setUploadError(null);
    }
  }, [isOpen, fetchAssets]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      // 1. Get presigned upload URL from Server Action
      const { uploadUrl, s3Key, fileUrl, error: presignError } = await getAssetPresignedUploadUrlAction({
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size,
      });

      // Type guard: Ensures uploadUrl, s3Key, and fileUrl are non-null strings
      if (presignError || !uploadUrl || !s3Key || !fileUrl) {
        throw new Error(presignError || 'Failed to generate presigned upload URL.');
      }

      // 2. Direct PUT upload from browser to Cloudflare R2
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
      });

      if (!uploadRes.ok) {
        throw new Error(`Direct storage upload failed with status ${uploadRes.status}`);
      }

      // 3. Register asset record in Supabase
      const regRes = await registerAssetAction({
        fileUrl,
        s3Key,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        fileSizeBytes: file.size,
        altTextZh: altTextZh || null,
        altTextEn: altTextEn || null,
      });

      if (!regRes.success || !regRes.data) {
        throw new Error(regRes.error || 'Failed to register asset.');
      }
      
      setSelectedAsset(regRes.data);
      setAltTextZh('');
      setAltTextEn('');
      setActiveTab('browse');
      await fetchAssets();
    } catch (err: any) {
      console.error('MediaPicker upload error:', err);
      setUploadError(err.message || 'Upload failed.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
        
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0 bg-white">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            <p className="text-xs text-gray-500">Choose from existing media or upload new files.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TABS */}
        <div className="px-6 pt-3 border-b border-gray-100 flex gap-4 bg-gray-50/50 shrink-0">
          <button
            onClick={() => setActiveTab('browse')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'browse' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Media Library
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'upload' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Upload New File
          </button>
        </div>

        {/* TAB 1: BROWSE LIBRARY */}
        {activeTab === 'browse' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Filter Bar */}
            <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-white shrink-0">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by file name or alt text..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-300 bg-white text-gray-950 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              
              {allowedCategory === 'all' && (
                <div className="flex bg-gray-100 p-0.5 rounded-lg text-xs font-medium text-gray-600">
                  {(['all', 'image', 'document', 'audio'] as AssetCategory[]).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`px-2.5 py-1 rounded-md capitalize transition-colors cursor-pointer ${
                        category === cat ? 'bg-white text-gray-900 shadow-xs' : 'hover:text-gray-900'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Asset Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {isLoading ? (
                <div className="h-full flex items-center justify-center text-gray-400 text-xs">
                  <Loader2 className="w-5 h-5 animate-spin mr-2 text-indigo-600" />
                  Loading assets...
                </div>
              ) : assets.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-gray-200 rounded-xl">
                  <ImageIcon className="w-10 h-10 text-gray-300 mb-2" />
                  <p className="text-sm font-semibold text-gray-700">No media found</p>
                  <p className="text-xs text-gray-400 mt-1">Try a different search query or upload a new file.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {assets.map((asset) => {
                    const isSelected = selectedAsset?.id === asset.id;
                    const isImage = asset.mime_type.startsWith('image/');
                    const isAudio = asset.mime_type.startsWith('audio/');

                    return (
                      <div
                        key={asset.id}
                        onClick={() => setSelectedAsset(asset)}
                        className={`group relative rounded-xl border-2 overflow-hidden cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-indigo-600 ring-2 ring-indigo-600/20 shadow-xs' 
                            : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                        }`}
                      >
                        <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                          {isImage ? (
                            <img 
                              src={asset.file_url} 
                              alt={asset.alt_text_zh || asset.file_name} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
                            />
                          ) : isAudio ? (
                            <Music className="w-8 h-8 text-amber-500" />
                          ) : (
                            <FileText className="w-8 h-8 text-indigo-500" />
                          )}
                        </div>

                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-indigo-600 text-white rounded-full p-1 shadow-sm">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}

                        <div className="p-2 bg-white">
                          <p className="text-xs font-semibold text-gray-900 truncate" title={asset.file_name}>
                            {asset.file_name}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {formatFileSize(asset.file_size_bytes)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: UPLOAD NEW FILE */}
        {activeTab === 'upload' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {uploadError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center text-xs text-red-700">
                <AlertCircle className="w-4 h-4 mr-2 shrink-0 text-red-500" />
                <span>{uploadError}</span>
              </div>
            )}

            <label className="border-2 border-dashed border-gray-300 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:border-indigo-500 hover:bg-indigo-50/30 cursor-pointer transition-all group">
              {isUploading ? (
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-3" />
              ) : (
                <UploadCloud className="w-10 h-10 text-gray-400 group-hover:text-indigo-600 mb-3 transition-colors" />
              )}
              <span className="text-sm font-bold text-gray-900">
                {isUploading ? 'Uploading to Media Pool...' : 'Click to browse or drop file here'}
              </span>
              <span className="text-xs text-gray-400 mt-1">
                Images (PNG, JPG, WebP, SVG), Audio (MP3, M4A, WAV), or PDFs up to 100MB
              </span>
              <input 
                ref={fileInputRef}
                type="file" 
                onChange={handleFileUpload} 
                disabled={isUploading} 
                className="hidden" 
              />
            </label>

            <div className="space-y-4 pt-2">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Accessibility & SEO (Optional)
              </h4>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Alt Text / Description (Chinese)
                </label>
                <input
                  type="text"
                  placeholder="例如：禪修營大殿全景"
                  value={altTextZh}
                  onChange={(e) => setAltTextZh(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 text-gray-950 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Alt Text / Description (English)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Panoramic view of the main meditation hall"
                  value={altTextEn}
                  onChange={(e) => setAltTextEn(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 text-gray-950 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50 shrink-0">
          <div className="text-xs text-gray-500">
            {selectedAsset ? (
              <span className="font-medium text-gray-900 truncate max-w-xs block">
                Selected: {selectedAsset.file_name}
              </span>
            ) : (
              'No asset selected'
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              disabled={!selectedAsset}
              onClick={() => {
                if (selectedAsset) {
                  onSelect(selectedAsset);
                  onClose();
                }
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              Insert Asset
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}