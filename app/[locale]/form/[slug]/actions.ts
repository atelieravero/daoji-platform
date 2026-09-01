'use server';

import { createClient } from '@supabase/supabase-js';
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "@/lib/s3/client";
import { randomUUID } from "crypto";

const getSupabaseAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function generateMagicToken(prefix: string = 'MMC'): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; 
  let token = `${prefix}-`;
  for (let i = 0; i < 8; i++) {
    if (i === 4) token += '-';
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export async function getPublicForm(slug: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('forms')
    .select('*, events:events!event_id(id, code, title_zh, title_en, status)')
    .eq('slug', slug)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

/**
 * Validates applicant tokens scoped by event_code.
 */
export async function verifyApplicantToken(token: string, eventCodeOrId: string, isTest: boolean = false) {
  if (isTest) {
    return { valid: true };
  }

  const supabase = getSupabaseAdmin();
  
  if (!token || !eventCodeOrId) {
    return { valid: false, message: 'Token and Event Code are required.' };
  }

  // Resolve event_code if UUID was passed
  let targetCode = eventCodeOrId.trim();
  if (targetCode.includes('-') && targetCode.length === 36) {
    const { data: evt } = await supabase.from('events').select('code').eq('id', targetCode).single();
    if (evt?.code) targetCode = evt.code;
  }

  const { data: existingSubmissions, error } = await supabase
    .from('submissions')
    .select('id, is_test')
    .eq('applicant_token', token.trim())
    .eq('event_code', targetCode)
    .limit(1);

  if (error || !existingSubmissions || existingSubmissions.length === 0) {
    return { valid: false, message: 'Invalid or expired access token for this event code.' };
  }

  if (existingSubmissions[0].is_test === true) {
    return { valid: false, message: 'Test tokens cannot be used for live applications.' };
  }

  return { valid: true };
}

/**
 * Submits public form record scoped to event_code.
 */
export async function submitPublicForm(payload: {
  form_id: string;
  event_id: string;
  answers: Record<string, any>;
  is_test?: boolean;
  applicant_token?: string;
  interim_event_code?: string;
}) {
  const supabase = getSupabaseAdmin();

  // Resolve true event_code
  let resolvedCode = payload.interim_event_code || 'MMC';
  if (payload.event_id) {
    const { data: evt } = await supabase.from('events').select('code').eq('id', payload.event_id).single();
    if (evt?.code) resolvedCode = evt.code;
  }

  let activeToken = payload.applicant_token;

  if (activeToken) {
    if (!payload.is_test) {
      const { data: existingSubmissions, error: tokenError } = await supabase
        .from('submissions')
        .select('id, is_test')
        .eq('applicant_token', activeToken.trim())
        .eq('event_code', resolvedCode)
        .limit(1);

      if (tokenError || !existingSubmissions || existingSubmissions.length === 0) {
        throw new Error('Invalid or expired access token for this event code.');
      }

      if (existingSubmissions[0].is_test === true) {
        throw new Error('Test tokens cannot be used for live applications.');
      }
    }
  } else {
    activeToken = generateMagicToken(resolvedCode);
  }

  const { error: insertError } = await supabase
    .from('submissions')
    .insert([{
      form_id: payload.form_id,
      event_id: payload.event_id,
      event_code: resolvedCode,
      response: payload.answers, 
      applicant_token: activeToken, 
      is_test: payload.is_test || false, 
    }]);

  if (insertError) {
    console.error('Submission error:', insertError);
    throw new Error('Failed to submit form. Please try again.');
  }

  return { success: true, applicant_token: activeToken };
}

export async function getPresignedUploadUrl(
  fileName: string, 
  contentType: string, 
  isTest: boolean = false
) {
  try {
    const uniqueId = randomUUID();
    const extension = fileName.split('.').pop() || 'file';
    const folder = isTest ? 'submissions/test' : 'submissions/real';
    const objectKey = `${folder}/${uniqueId}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: objectKey,
      ContentType: contentType,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

    return { success: true, signedUrl, fileKey: objectKey };
  } catch (error: any) {
    console.error('Error generating pre-signed URL:', error);
    return { success: false, error: 'Failed to generate secure upload URL.' };
  }
}