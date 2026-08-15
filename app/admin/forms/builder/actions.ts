'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client } from '@/lib/s3/client';
import { withPermission } from '@/lib/auth-guards'; // <-- NEW IMPORT

const getSupabaseAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 🛡️ WRAPPED: Strictly Form Editors
export const getFormSchema = withPermission('forms:edit', async (id: string) => {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from('forms')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching form schema:', error);
    return null;
  }

  return data;
});

// 🛡️ WRAPPED: Strictly Form Editors (SBAC guard remains intact inside)
export const saveFormSchema = withPermission('forms:edit', async (payload: {
  event_id: string;
  slug: string; 
  title: string;
  is_followup: boolean;
  schema: any;
}, id?: string | null) => {
  const supabaseAdmin = getSupabaseAdmin();

  let error;
  let savedId = id;

  if (id) {
    // 1. Verify current status before allowing the update (State-Based Guard)
    const { data: existingForm, error: fetchError } = await supabaseAdmin
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

    // 2. Safe to update
    const res = await supabaseAdmin
      .from('forms')
      .update(payload)
      .eq('id', id);
    error = res.error;
  } else {
    // Handling for brand new forms
    const res = await supabaseAdmin
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
  return savedId;
});

// 🛡️ WRAPPED: Strictly Form Editors
export const getPublicPresignedUploadUrl = withPermission('forms:edit', async (fileName: string, fileType: string) => {
  try {
    const uniqueFileName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const fileKey = `public/assets/${uniqueFileName}`;
    
    const publicBucket = process.env.S3_PUBLIC_BUCKET_NAME;
    const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL;

    if (!publicBucket || !cdnUrl) {
      throw new Error("Public bucket or CDN URL is not configured in environment variables.");
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
});