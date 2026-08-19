'use server';

import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth-guards';
import { revalidatePath } from 'next/cache';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client } from '@/lib/s3/client';

/**
 * Fetches form schema by ID.
 * Strictly restricted to Form Editors.
 */
export async function getFormSchema(id: string) {
  await requirePermission('forms:edit');
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('forms')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching form schema:', error);
    return null;
  }

  return data;
}

/**
 * Saves or updates form schema.
 * Direct async declaration preserves session cookies for auth.uid() CDC triggers.
 */
export async function saveFormSchema(payload: {
  event_id: string;
  slug: string; 
  title: string;
  is_followup: boolean;
  schema: any;
}, id?: string | null) {
  await requirePermission('forms:edit');
  const supabase = await createClient();

  let error;
  let savedId = id;

  if (id) {
    // 1. Verify current status before allowing update (State-Based Guard)
    const { data: existingForm, error: fetchError } = await supabase
      .from('forms')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchError || !existingForm) {
      throw new Error('Failed to verify form status before saving.');
    }

    if (existingForm.status !== 'draft') {
      throw new Error('Action blocked: Form schema cannot be modified while open or closed. Please revert to draft status first.');
    }

    // 2. Update with active auth.uid() context for PostgreSQL CDC trigger
    const res = await supabase
      .from('forms')
      .update(payload)
      .eq('id', id);
    error = res.error;
  } else {
    // Handling for brand new forms
    const res = await supabase
      .from('forms')
      .insert([payload])
      .select('id')
      .single();
    
    error = res.error;
    if (res.data) {
      savedId = res.data.id;
    }
  }

  if (error) {
    console.error('Supabase Error saving form schema:', error);
    throw new Error(error.message || 'Failed to save form schema.');
  }

  revalidatePath('/admin/forms');
  revalidatePath('/admin/logs');
  return savedId;
}

/**
 * Generates presigned URL for public form assets.
 */
export async function getPublicPresignedUploadUrl(fileName: string, fileType: string) {
  await requirePermission('forms:edit');

  try {
    const uniqueFileName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const fileKey = `public/assets/${uniqueFileName}`;
    
    const publicBucket = process.env.S3_PUBLIC_BUCKET_NAME;
    const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL;

    if (!publicBucket || !cdnUrl) {
      throw new Error('Public bucket or CDN URL is not configured in environment variables.');
    }

    const command = new PutObjectCommand({
      Bucket: publicBucket,
      Key: fileKey,
      ContentType: fileType,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    return { 
      success: true, 
      signedUrl, 
      finalUrl: `${cdnUrl}/${fileKey}` 
    };
  } catch (error: any) {
    console.error('Error generating public presigned URL:', error);
    return { success: false, error: error.message };
  }
}