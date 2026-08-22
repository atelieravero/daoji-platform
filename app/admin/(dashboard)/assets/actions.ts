'use server';

import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth-guards';
import { revalidatePath } from 'next/cache';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client } from '@/lib/s3/client';

export interface AssetRecord {
  id: string;
  file_url: string;
  s3_key: string;
  file_name: string;
  mime_type: string;
  file_size_bytes: number;
  width: number | null;
  height: number | null;
  alt_text_zh: string | null;
  alt_text_en: string | null;
  created_at: string;
}

export type AssetCategory = 'all' | 'image' | 'audio' | 'video' | 'document';

/**
 * Generates an S3 presigned PUT upload URL for direct browser-to-R2 streaming.
 * Bypasses Vercel Serverless Function body size limits (supports up to 100MB+).
 * Guarded by 'assets:upload'.
 */
export async function getAssetPresignedUploadUrlAction(params: {
  fileName: string;
  fileType: string;
  fileSize: number;
}): Promise<{ uploadUrl: string; s3Key: string; fileUrl: string }> {
  await requirePermission('assets:upload');

  const publicBucket = process.env.S3_PUBLIC_BUCKET_NAME;
  const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL || 'https://cdn.ajahnyiu.org';

  if (!publicBucket) {
    throw new Error('Public bucket is not configured.');
  }

  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const sanitizedFileName = params.fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const s3Key = `assets/${year}/${month}/${Date.now()}-${sanitizedFileName}`;

  const putCommand = new PutObjectCommand({
    Bucket: publicBucket,
    Key: s3Key,
    ContentType: params.fileType || 'application/octet-stream',
  });

  // Generate direct presigned PUT URL valid for 10 minutes
  const uploadUrl = await getSignedUrl(s3Client, putCommand, { expiresIn: 600 });
  const fileUrl = `${cdnUrl}/${s3Key}`;

  return {
    uploadUrl,
    s3Key,
    fileUrl,
  };
}

/**
 * Registers an uploaded asset's metadata in Supabase.
 * Guarded by 'assets:upload'.
 */
export async function registerAssetAction(params: {
  fileUrl: string;
  s3Key: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  altTextZh?: string | null;
  altTextEn?: string | null;
}): Promise<{ success: boolean; data?: AssetRecord; error?: string }> {
  await requirePermission('assets:upload');

  try {
    const supabase = await createClient();
    const { data: userAuth } = await supabase.auth.getUser();

    const { data: asset, error: dbError } = await supabase
      .from('assets')
      .insert({
        file_url: params.fileUrl,
        s3_key: params.s3Key,
        file_name: params.fileName,
        mime_type: params.mimeType,
        file_size_bytes: params.fileSizeBytes,
        alt_text_zh: params.altTextZh || null,
        alt_text_en: params.altTextEn || null,
        created_by: userAuth?.user?.id || null,
      })
      .select()
      .single();

    if (dbError || !asset) {
      throw new Error(dbError?.message || 'Failed to insert asset record.');
    }

    revalidatePath('/admin/assets');
    revalidatePath('/admin/logs');

    return { success: true, data: asset as AssetRecord };
  } catch (error: any) {
    console.error('Register asset error:', error);
    return { success: false, error: error.message || 'Failed to register asset.' };
  }
}

/**
 * List assets with category filtering, search, and pagination.
 * Guarded by 'assets:view'.
 */
export async function listAssetsAction(params: {
  category?: AssetCategory;
  search?: string;
  offset?: number;
  limit?: number;
}): Promise<{ data: AssetRecord[]; total: number }> {
  await requirePermission('assets:view');
  const supabase = await createClient();

  const { category = 'all', search = '', offset = 0, limit = 24 } = params;

  let query = supabase
    .from('assets')
    .select('*', { count: 'exact' });

  // Category filter
  if (category === 'image') {
    query = query.ilike('mime_type', 'image/%');
  } else if (category === 'audio') {
    query = query.ilike('mime_type', 'audio/%');
  } else if (category === 'video') {
    query = query.ilike('mime_type', 'video/%');
  } else if (category === 'document') {
    query = query.or('mime_type.ilike.%pdf%,mime_type.ilike.%document%,mime_type.ilike.%sheet%');
  }

  // Search query
  if (search.trim()) {
    query = query.or(`file_name.ilike.%${search}%,alt_text_zh.ilike.%${search}%,alt_text_en.ilike.%${search}%`);
  }

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    console.error('Error fetching assets:', error);
    return { data: [], total: 0 };
  }

  return { data: (data as AssetRecord[]) || [], total: count || 0 };
}

/**
 * Delete an asset from S3 and Supabase after verifying no active references.
 * Guarded by 'assets:delete'.
 */
export async function deleteAssetAction(assetId: string): Promise<{ success: boolean; error?: string }> {
  await requirePermission('assets:delete');
  const supabase = await createClient();

  // 1. Fetch asset metadata
  const { data: asset, error: fetchError } = await supabase
    .from('assets')
    .select('s3_key')
    .eq('id', assetId)
    .single();

  if (fetchError || !asset) {
    return { success: false, error: 'Asset not found.' };
  }

  // 2. Reference Guard: Check if asset is actively used
  const [eventsCheck, pagesCheck, resourcesCheck] = await Promise.all([
    supabase.from('events').select('id', { count: 'exact', head: true }).eq('banner_asset_id', assetId),
    supabase.from('content_pages').select('id', { count: 'exact', head: true }).eq('cover_asset_id', assetId),
    supabase.from('resources').select('id', { count: 'exact', head: true }).or(`target_asset_id.eq.${assetId},cover_asset_id.eq.${assetId}`),
  ]);

  const usageCount = (eventsCheck.count || 0) + (pagesCheck.count || 0) + (resourcesCheck.count || 0);
  if (usageCount > 0) {
    return {
      success: false,
      error: `Cannot delete asset: It is currently referenced by ${usageCount} event(s), article(s), or resource(s).`,
    };
  }

  try {
    // 3. Delete from R2
    const publicBucket = process.env.S3_PUBLIC_BUCKET_NAME;
    if (publicBucket) {
      await s3Client.send(new DeleteObjectCommand({
        Bucket: publicBucket,
        Key: asset.s3_key,
      }));
    }

    // 4. Delete record from database
    const { error: deleteError } = await supabase
      .from('assets')
      .delete()
      .eq('id', assetId);

    if (deleteError) throw deleteError;

    revalidatePath('/admin/assets');
    revalidatePath('/admin/logs');
    return { success: true };
  } catch (error: any) {
    console.error('Delete asset error:', error);
    return { success: false, error: error.message || 'Failed to delete asset.' };
  }
}