'use server';

import { createClient } from '@/lib/supabase/server';
import { hasPermission, Role } from '@/lib/permissions';
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
  is_system?: boolean;
  created_at: string;
}

export type AssetCategory = 'all' | 'image' | 'audio' | 'video' | 'document';

async function getAuthenticatedUserAndRoles() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { user: null, roles: [] as Role[], supabase };
  }

  const { data: member } = await supabase
    .from('team_members')
    .select('roles, status')
    .eq('id', user.id)
    .single();

  if (!member || member.status !== 'active') {
    return { user: null, roles: [] as Role[], supabase };
  }

  return { 
    user, 
    roles: (member.roles || []) as Role[], 
    supabase 
  };
}

export async function getAssetPresignedUploadUrlAction(params: {
  fileName: string;
  fileType: string;
  fileSize: number;
  folder?: string; // defaults to 'assets'
}): Promise<{ uploadUrl?: string; s3Key?: string; fileUrl?: string; error?: string }> {
  const { user, roles } = await getAuthenticatedUserAndRoles();

  if (!user || !hasPermission(roles, 'assets:upload')) {
    return { error: 'Permission denied: You do not have permission to upload assets.' };
  }

  const publicBucket = process.env.S3_PUBLIC_BUCKET_NAME;
  const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL || 'https://cdn.ajahnyiu.org';

  if (!publicBucket) {
    return { error: 'Public bucket is not configured.' };
  }

  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');

  const extension = params.fileName.includes('.') ? params.fileName.split('.').pop() : '';
  const baseName = params.fileName.includes('.') 
    ? params.fileName.substring(0, params.fileName.lastIndexOf('.'))
    : params.fileName;

  const sanitizedBase = baseName
    .replace(/[^a-zA-Z0-9-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '') || 'asset';

  const sanitizedFileName = extension ? `${sanitizedBase}.${extension}` : sanitizedBase;
  const folder = params.folder || 'assets';
  const s3Key = `${folder}/${year}/${month}/${Date.now()}-${sanitizedFileName}`;

  try {
    const putCommand = new PutObjectCommand({
      Bucket: publicBucket,
      Key: s3Key,
      ContentType: params.fileType || 'application/octet-stream',
    });

    const uploadUrl = await getSignedUrl(s3Client, putCommand, { expiresIn: 600 });
    const fileUrl = `${cdnUrl}/${s3Key}`;

    return { uploadUrl, s3Key, fileUrl };
  } catch (err: any) {
    return { error: err.message || 'Failed to generate upload URL.' };
  }
}

/**
 * Registers asset metadata with support for `is_system` (derivative/crop products).
 */
export async function registerAssetAction(params: {
  fileUrl: string;
  s3Key: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  altTextZh?: string | null;
  altTextEn?: string | null;
  is_system?: boolean;
}): Promise<{ success: boolean; data?: AssetRecord; error?: string }> {
  const { user, roles, supabase } = await getAuthenticatedUserAndRoles();

  if (!user || !hasPermission(roles, 'assets:upload')) {
    return { success: false, error: 'Permission denied: You do not have permission to upload assets.' };
  }

  try {
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
        is_system: params.is_system || false,
        created_by: user.id,
      })
      .select()
      .single();

    if (dbError || !asset) {
      throw new Error(dbError?.message || 'Failed to insert asset record.');
    }

    if (!params.is_system) {
      revalidatePath('/admin/assets');
    }
    revalidatePath('/admin/logs');

    return { success: true, data: asset as AssetRecord };
  } catch (error: any) {
    console.error('Register asset error:', error);
    return { success: false, error: error.message || 'Failed to register asset.' };
  }
}

/**
 * List assets — strictly filters out system/cropped images so they never appear in the Media Pool.
 */
export async function listAssetsAction(params: {
  category?: AssetCategory;
  search?: string;
  offset?: number;
  limit?: number;
}): Promise<{ data: AssetRecord[]; total: number; error?: string }> {
  const { user, roles, supabase } = await getAuthenticatedUserAndRoles();

  if (!user || !hasPermission(roles, 'assets:view')) {
    return { data: [], total: 0, error: 'Permission denied: You do not have permission to view assets.' };
  }

  const { category = 'all', search = '', offset = 0, limit = 24 } = params;

  let query = supabase
    .from('assets')
    .select('*', { count: 'exact' })
    .eq('is_system', false)
    .not('file_name', 'ilike', 'crop-%');

  if (category === 'image') {
    query = query.ilike('mime_type', 'image/%');
  } else if (category === 'audio') {
    query = query.ilike('mime_type', 'audio/%');
  } else if (category === 'video') {
    query = query.ilike('mime_type', 'video/%');
  } else if (category === 'document') {
    query = query.or('mime_type.ilike.%pdf%,mime_type.ilike.%document%,mime_type.ilike.%sheet%');
  }

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

export async function deleteAssetAction(assetId: string): Promise<{ success: boolean; error?: string }> {
  const { user, roles, supabase } = await getAuthenticatedUserAndRoles();

  if (!user || !hasPermission(roles, 'assets:delete')) {
    return { 
      success: false, 
      error: 'Permission denied: You do not have permission to delete media assets.' 
    };
  }

  const { data: asset, error: fetchError } = await supabase
    .from('assets')
    .select('s3_key')
    .eq('id', assetId)
    .single();

  if (fetchError || !asset) {
    return { success: false, error: 'Asset not found.' };
  }

  const [eventsCheck, origEventsCheck, pagesCheck, resourcesCheck] = await Promise.all([
    supabase.from('events').select('id', { count: 'exact', head: true }).eq('banner_asset_id', assetId),
    supabase.from('events').select('id', { count: 'exact', head: true }).eq('banner_original_asset_id', assetId),
    supabase.from('content_pages').select('id', { count: 'exact', head: true }).eq('cover_asset_id', assetId),
    supabase.from('resources').select('id', { count: 'exact', head: true }).or(`target_asset_id.eq.${assetId},cover_asset_id.eq.${assetId}`),
  ]);

  const usageCount = 
    (eventsCheck.count || 0) + 
    (origEventsCheck.count || 0) + 
    (pagesCheck.count || 0) + 
    (resourcesCheck.count || 0);

  if (usageCount > 0) {
    return {
      success: false,
      error: `Cannot delete asset: It is referenced by ${usageCount} event(s), article(s), or resource(s).`,
    };
  }

  try {
    const publicBucket = process.env.S3_PUBLIC_BUCKET_NAME;
    if (publicBucket) {
      await s3Client.send(new DeleteObjectCommand({
        Bucket: publicBucket,
        Key: asset.s3_key,
      }));
    }

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

export async function getAssetPermissionsAction(): Promise<{
  canUpload: boolean;
  canDelete: boolean;
}> {
  const { user, roles } = await getAuthenticatedUserAndRoles();

  if (!user) {
    return { canUpload: false, canDelete: false };
  }

  return {
    canUpload: hasPermission(roles, 'assets:upload'),
    canDelete: hasPermission(roles, 'assets:delete'),
  };
}

export async function fetchImageForCropAction(
  imageUrl: string
): Promise<{ dataUrl?: string; error?: string }> {
  const { user, roles } = await getAuthenticatedUserAndRoles();

  if (!user || !hasPermission(roles, 'assets:view')) {
    return { error: 'Permission denied: You do not have permission to view assets.' };
  }

  try {
    const res = await fetch(imageUrl, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`Failed to load image from CDN (HTTP ${res.status})`);
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    return { dataUrl: `data:${contentType};base64,${base64}` };
  } catch (err: any) {
    console.error('Error fetching image for crop:', err);
    return { error: err.message || 'Failed to load image for cropping.' };
  }
}