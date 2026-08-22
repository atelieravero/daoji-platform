'use server';

import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth-guards';
import { revalidatePath } from 'next/cache';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
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
 * Upload an asset directly to Cloudflare R2 and register it in the Media Pool.
 * Guarded by 'assets:upload'.
 */
export async function uploadAssetAction(formData: FormData): Promise<{ success: boolean; data?: AssetRecord; error?: string }> {
  await requirePermission('assets:upload');

  const file = formData.get('file') as File | null;
  const altTextZh = (formData.get('alt_text_zh') as string) || null;
  const altTextEn = (formData.get('alt_text_en') as string) || null;

  if (!file) {
    return { success: false, error: 'No file provided.' };
  }

  const publicBucket = process.env.S3_PUBLIC_BUCKET_NAME;
  const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL;

  if (!publicBucket || !cdnUrl) {
    return { success: false, error: 'Storage environment variables are not configured.' };
  }

  try {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const s3Key = `assets/${year}/${month}/${Date.now()}-${sanitizedFileName}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    // 1. Upload to Cloudflare R2 public bucket
    const putCommand = new PutObjectCommand({
      Bucket: publicBucket,
      Key: s3Key,
      Body: buffer,
      ContentType: file.type || 'application/octet-stream',
    });
    await s3Client.send(putCommand);

    const finalUrl = `${cdnUrl}/${s3Key}`;

    // 2. Insert into Supabase assets table (using user server client to preserve auth.uid())
    const supabase = await createClient();
    const { data: userAuth } = await supabase.auth.getUser();

    const { data: asset, error: dbError } = await supabase
      .from('assets')
      .insert({
        file_url: finalUrl,
        s3_key: s3Key,
        file_name: file.name,
        mime_type: file.type || 'application/octet-stream',
        file_size_bytes: file.size,
        alt_text_zh: altTextZh,
        alt_text_en: altTextEn,
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
    console.error('Upload asset error:', error);
    return { success: false, error: error.message || 'Asset upload failed.' };
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