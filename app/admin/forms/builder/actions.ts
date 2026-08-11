'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client } from '@/lib/s3/client';

const getSupabaseAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getFormSchema(id: string) {
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
}

export async function saveFormSchema(payload: {
  event_id: string;
  title: string;
  is_followup: boolean;
  schema: any;
}, id?: string | null) {
  const supabaseAdmin = getSupabaseAdmin();

  let error;
  let savedId = id;

  if (id) {
    const res = await supabaseAdmin
      .from('forms')
      .update(payload)
      .eq('id', id);
    error = res.error;
  } else {
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
    throw new Error('Failed to save form schema.');
  }

  revalidatePath('/admin/forms');
  return savedId;
}

export async function getPublicPresignedUploadUrl(fileName: string, fileType: string) {
  try {
    // Generate a unique filename to prevent overwriting
    const uniqueFileName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const fileKey = `public/assets/${uniqueFileName}`;
    
    // Pull the new public bucket configurations from .env
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

    // The presigned URL is only for the UPLOAD action (expires in 5 mins)
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    // The finalUrl is the permanent public link we will save to the database and use for display
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