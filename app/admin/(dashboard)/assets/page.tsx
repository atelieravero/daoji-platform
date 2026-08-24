'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UploadCloud, Loader2, Image as ImageIcon } from 'lucide-react';
import { 
  listAssetsAction, 
  getAssetPresignedUploadUrlAction, 
  registerAssetAction, 
  deleteAssetAction, 
  getAssetPermissionsAction,
  AssetRecord, 
  AssetCategory 
} from './actions';
import AdminStatusBanner from '@/components/admin/shared/AdminStatusBanner';
import AdminTableToolbar from '@/components/admin/shared/AdminTableToolbar';
import AssetCard from '@/components/admin/assets/AssetCard';
import AssetInspectorDrawer from '@/components/admin/assets/AssetInspectorDrawer';

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
      // 1. Request presigned upload URL from Server Action
      const { uploadUrl, s3Key, fileUrl, error: presignError } = await getAssetPresignedUploadUrlAction({
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size,
      });

      if (presignError || !uploadUrl || !s3Key || !fileUrl) {
        throw new Error(presignError || 'Failed to generate upload URL.');
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

      // 3. Register asset record in database
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

  const handleDelete = async (eOrAsset: React.MouseEvent | AssetRecord, maybeAsset?: AssetRecord) => {
    const asset = maybeAsset || (eOrAsset as AssetRecord);
    if ('stopPropagation' in eOrAsset) {
      eOrAsset.stopPropagation();
    }

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

  const handleCopyUrl = (eOrUrl: React.MouseEvent | string, urlOrId?: string, maybeId?: string) => {
    let targetUrl: string;
    let targetId: string;

    if (typeof eOrUrl === 'string') {
      targetUrl = eOrUrl;
      targetId = urlOrId!;
    } else {
      eOrUrl.stopPropagation();
      targetUrl = urlOrId!;
      targetId = maybeId!;
    }

    navigator.clipboard.writeText(targetUrl);
    setCopiedId(targetId);
    setTimeout(() => setCopiedId(null), 2000);
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
      <AdminStatusBanner message={statusMessage} onDismiss={() => setStatusMessage(null)} />

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ASSETS GRID VIEW */}
        <div className="flex-1 flex flex-col overflow-hidden p-8">
          
          <AdminTableToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search assets by file name..."
            statusFilter={category}
            onStatusFilterChange={(val) => setCategory(val as AssetCategory)}
            filterOptions={[
              { value: 'all', label: 'All' },
              { value: 'image', label: 'Images' },
              { value: 'document', label: 'Documents' },
              { value: 'audio', label: 'Audio' },
              { value: 'video', label: 'Video' },
            ]}
          />

          {/* GRID */}
          <div className="flex-1 overflow-y-auto pr-1 bg-white border border-gray-200 rounded-b-xl p-6 shadow-xs">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm py-20">
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
                {assets.map((asset) => (
                  <AssetCard
                    key={asset.id}
                    asset={asset}
                    isSelected={selectedAsset?.id === asset.id}
                    onSelect={setSelectedAsset}
                    onCopyUrl={handleCopyUrl}
                    onDelete={handleDelete}
                    copiedId={copiedId}
                    canDelete={permissions.canDelete}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 text-xs text-gray-400 shrink-0">
            Total files: <span className="font-semibold text-gray-700">{total}</span>
          </div>
        </div>

        {/* ASSET DETAIL INSPECTOR SIDEBAR */}
        <AssetInspectorDrawer
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
          onDelete={handleDelete}
          onCopyUrl={(url, id) => handleCopyUrl(url, id)}
          copiedId={copiedId}
          canDelete={permissions.canDelete}
        />

      </div>
    </div>
  );
}