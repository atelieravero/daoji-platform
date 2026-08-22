'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  UploadCloud, Search, Trash2, Copy, Check, Image as ImageIcon, 
  FileText, Music, Loader2, ExternalLink, X
} from 'lucide-react';
import { 
  listAssetsAction, 
  getAssetPresignedUploadUrlAction, 
  registerAssetAction, 
  deleteAssetAction, 
  getAssetPermissionsAction,
  AssetRecord, 
  AssetCategory 
} from './actions';

export default function AssetsPage() {
  const [category, setCategory] = useState<AssetCategory>('all');
  const [search, setSearch] = useState('');
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<AssetRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [permissions, setPermissions] = useState<{ canUpload: boolean; canDelete: boolean }>({
    canUpload: false,
    canDelete: false,
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchAssets = useCallback(async () => {
    setIsLoading(true);
    try {
      const [assetsRes, permsRes] = await Promise.all([
        listAssetsAction({ category, search, limit: 50 }),
        getAssetPermissionsAction(),
      ]);
      setAssets(assetsRes.data);
      setTotal(assetsRes.total);
      setPermissions(permsRes);
    } catch (err: any) {
      console.error('Error fetching assets:', err);
    } finally {
      setIsLoading(false);
    }
  }, [category, search]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setStatusMessage(null);

    try {
      const { uploadUrl, s3Key, fileUrl, error: presignError } = await getAssetPresignedUploadUrlAction({
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size,
      });

      if (presignError || !uploadUrl || !s3Key || !fileUrl) {
        throw new Error(presignError || 'Failed to generate upload URL.');
      }

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

      const regRes = await registerAssetAction({
        fileUrl,
        s3Key,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        fileSizeBytes: file.size,
      });

      if (regRes.success) {
        setStatusMessage({ type: 'success', text: `Uploaded ${file.name} successfully.` });
        fetchAssets();
      } else {
        throw new Error(regRes.error || 'Failed to register asset.');
      }
    } catch (err: any) {
      console.error('Asset upload exception:', err);
      setStatusMessage({ 
        type: 'error', 
        text: err.message || 'Error occurred during asset upload.' 
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (e: React.MouseEvent, asset: AssetRecord) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete "${asset.file_name}"?`)) return;

    try {
      const res = await deleteAssetAction(asset.id);
      if (res.success) {
        setStatusMessage({ type: 'success', text: 'Asset deleted successfully.' });
        if (selectedAsset?.id === asset.id) setSelectedAsset(null);
        fetchAssets();
      } else {
        setStatusMessage({ type: 'error', text: res.error || 'Failed to delete asset.' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to delete asset.' });
    }
  };

  const handleCopyUrl = (e: React.MouseEvent, url: string, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden font-sans">
      
      {/* HEADER */}
      <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Media Pool</h1>
          <p className="text-xs text-gray-500">Public CDN binary registry for banners, covers, audio, and docs.</p>
        </div>
        {permissions.canUpload && (
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-xs cursor-pointer transition-colors">
              {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UploadCloud className="w-4 h-4 mr-2" />}
              <span>{isUploading ? 'Uploading...' : 'Upload Asset'}</span>
              <input 
                ref={fileInputRef}
                type="file" 
                onChange={handleUpload} 
                disabled={isUploading} 
                className="hidden" 
              />
            </label>
          </div>
        )}
      </div>

      {/* FEEDBACK BANNER */}
      {statusMessage && (
        <div className={`px-8 py-2.5 text-xs font-medium flex items-center justify-between ${
          statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-100' : 'bg-red-50 text-red-800 border-b border-red-100'
        }`}>
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="underline ml-4 cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ASSETS GRID */}
        <div className="flex-1 flex flex-col overflow-hidden p-8">
          
          {/* SEARCH & FILTERS */}
          <div className="flex items-center justify-between mb-6 gap-4 shrink-0">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search assets by file name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-white text-gray-950 placeholder-gray-400 rounded-xl border border-gray-200 shadow-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-xs text-xs font-medium text-gray-600">
              {(['all', 'image', 'document', 'audio', 'video'] as AssetCategory[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg capitalize transition-colors cursor-pointer ${
                    category === cat ? 'bg-indigo-50 text-indigo-600 font-bold' : 'hover:text-gray-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* GRID */}
          <div className="flex-1 overflow-y-auto pr-1">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                <Loader2 className="w-6 h-6 animate-spin mr-2 text-indigo-600" />
                Loading media pool...
              </div>
            ) : assets.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-gray-200 rounded-2xl bg-white/50">
                <ImageIcon className="w-12 h-12 text-gray-300 mb-3" />
                <h3 className="text-sm font-bold text-gray-900">No assets found</h3>
                <p className="text-xs text-gray-500 mt-1">Upload a file or adjust your search filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {assets.map((asset) => {
                  const isSelected = selectedAsset?.id === asset.id;
                  const isImage = asset.mime_type.startsWith('image/');
                  const isAudio = asset.mime_type.startsWith('audio/');

                  return (
                    <div
                      key={asset.id}
                      onClick={() => setSelectedAsset(asset)}
                      className={`group relative bg-white rounded-2xl border-2 overflow-hidden cursor-pointer transition-all shadow-xs ${
                        isSelected 
                          ? 'border-indigo-600 ring-4 ring-indigo-600/10' 
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                      }`}
                    >
                      {/* HOVER QUICK ACTION BUTTONS */}
                      <div className="absolute top-2 right-2 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleCopyUrl(e, asset.file_url, asset.id)}
                          className="p-1.5 bg-white/95 hover:bg-white text-gray-700 hover:text-indigo-600 rounded-md shadow-sm transition-colors backdrop-blur-xs cursor-pointer"
                          title="Copy Link"
                        >
                          {copiedId === asset.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        
                        {/* SILENT DENIAL: Hidden if user lacks assets:delete */}
                        {permissions.canDelete && (
                          <button
                            onClick={(e) => handleDelete(e, asset)}
                            className="p-1.5 bg-white/95 hover:bg-red-50 text-gray-700 hover:text-red-600 rounded-md shadow-sm transition-colors backdrop-blur-xs cursor-pointer"
                            title="Delete Asset"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden border-b border-gray-100">
                        {isImage ? (
                          <img 
                            src={asset.file_url} 
                            alt={asset.file_name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
                          />
                        ) : isAudio ? (
                          <Music className="w-10 h-10 text-amber-500" />
                        ) : (
                          <FileText className="w-10 h-10 text-indigo-500" />
                        )}
                      </div>

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
                })}
              </div>
            )}
          </div>

          <div className="pt-4 text-xs text-gray-400 shrink-0">
            Total files: <span className="font-semibold text-gray-700">{total}</span>
          </div>
        </div>

        {/* ASSET DETAIL INSPECTOR SIDEBAR */}
        {selectedAsset && (
          <div className="w-80 bg-white border-l border-gray-200 p-6 flex flex-col justify-between shadow-xl z-10 animate-in slide-in-from-right duration-200">
            
            <div className="space-y-5 overflow-y-auto">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Asset Details</span>
                <div className="flex items-center gap-1">
                  {/* SILENT DENIAL: Hidden if user lacks assets:delete */}
                  {permissions.canDelete && (
                    <button
                      onClick={(e) => handleDelete(e, selectedAsset)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Asset"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button 
                    onClick={() => setSelectedAsset(null)} 
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                    title="Close Panel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Preview Thumbnail */}
              <div className="aspect-video bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden">
                {selectedAsset.mime_type.startsWith('image/') ? (
                  <img src={selectedAsset.file_url} alt="" className="w-full h-full object-contain" />
                ) : (
                  <FileText className="w-10 h-10 text-indigo-400" />
                )}
              </div>

              {/* Metadata Fields */}
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-gray-400 block font-medium">File Name</span>
                  <span className="font-semibold text-gray-900 break-all">{selectedAsset.file_name}</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">CDN URL</span>
                  <div className="flex items-center gap-1 mt-1">
                    <input 
                      readOnly 
                      value={selectedAsset.file_url} 
                      className="w-full px-2 py-1 bg-gray-50 border border-gray-200 rounded text-[11px] font-mono text-gray-600 select-all"
                    />
                    <button
                      onClick={(e) => handleCopyUrl(e, selectedAsset.file_url, selectedAsset.id)}
                      className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-600 transition-colors cursor-pointer"
                      title="Copy URL"
                    >
                      {copiedId === selectedAsset.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">File Size</span>
                  <span className="font-semibold text-gray-900">{formatFileSize(selectedAsset.file_size_bytes)}</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">MIME Type</span>
                  <span className="font-mono text-gray-900">{selectedAsset.mime_type}</span>
                </div>
                {selectedAsset.alt_text_zh && (
                  <div>
                    <span className="text-gray-400 block font-medium">Alt Text (ZH)</span>
                    <span className="text-gray-700">{selectedAsset.alt_text_zh}</span>
                  </div>
                )}
              </div>
            </div>

            {/* SIDEBAR FOOTER ACTIONS */}
            <div className="pt-4 border-t border-gray-100 flex flex-col gap-2 shrink-0">
              <a
                href={selectedAsset.file_url}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg flex items-center justify-center transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Open in New Tab
              </a>

              {/* SILENT DENIAL: Hidden if user lacks assets:delete */}
              {permissions.canDelete && (
                <button
                  onClick={(e) => handleDelete(e, selectedAsset)}
                  className="w-full py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-semibold rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete from Media Pool
                </button>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}