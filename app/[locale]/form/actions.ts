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

// Generates a recognizable but highly secure token (e.g., MMC-A4X9-P2M8)
// Excludes confusing characters (0, O, 1, I) to prevent transcription errors
function generateMagicToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; 
  let token = 'MMC-';
  for (let i = 0; i < 8; i++) {
    if (i === 4) token += '-';
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export async function getPublicForm(formId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('forms')
    .select('*')
    .eq('id', formId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function verifyApplicantToken(token: string, eventId: string, isTest: boolean = false) {
  // IF TEST MODE: Deem ANY token verified immediately to allow admin previews to pass the gate.
  if (isTest) {
    return { valid: true };
  }

  const supabase = getSupabaseAdmin();
  
  if (!token || !eventId) {
    return { valid: false, message: 'Token and Event ID are required.' };
  }

  const { data: existingSubmissions, error } = await supabase
    .from('submissions')
    .select('id')
    .eq('applicant_token', token.trim())
    .eq('event_id', eventId)
    .limit(1);

  if (error || !existingSubmissions || existingSubmissions.length === 0) {
    return { valid: false, message: 'Invalid or expired access token for this event.' };
  }

  return { valid: true };
}

export async function submitPublicForm(payload: {
  form_id: string;
  event_id: string;
  answers: Record<string, any>;
  is_test?: boolean;
  applicant_token?: string;
}) {
  const supabase = getSupabaseAdmin();
  let activeToken = payload.applicant_token;

  // 1. Verify or Create the Magic Token
  if (activeToken) {
    // Follow-up Form: Verify the token exists for this specific EVENT
    // SKIP this database check if it is a test submission, so we can save the dummy token
    if (!payload.is_test) {
      const { data: existingSubmissions, error: tokenError } = await supabase
        .from('submissions')
        .select('id')
        .eq('applicant_token', activeToken)
        .eq('event_id', payload.event_id)
        .limit(1);

      if (tokenError || !existingSubmissions || existingSubmissions.length === 0) {
        throw new Error('Invalid or expired access token for this event.');
      }
    }
  } else {
    // Initial Application: Generate a new token
    activeToken = generateMagicToken();
  }

  // 2. Insert the Submission
  const { error: insertError } = await supabase
    .from('submissions')
    .insert([{
      form_id: payload.form_id,
      event_id: payload.event_id,
      response: payload.answers, // Mapped to your Supabase JSONB column
      applicant_token: activeToken, 
      is_test: payload.is_test || false, // Explicitly tag test submissions in the DB
    }]);

  if (insertError) {
    console.error('Submission error:', insertError);
    throw new Error('Failed to submit form. Please try again.');
  }

  // Return the token to the frontend so it can be displayed to the user
  return { success: true, applicant_token: activeToken };
}

export async function getPresignedUploadUrl(fileName: string, contentType: string) {
  try {
    const uniqueId = randomUUID();
    const extension = fileName.split('.').pop() || 'file';
    const objectKey = `submissions/${uniqueId}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: objectKey,
      ContentType: contentType,
    });

    // Generate a temporary URL valid for 15 minutes (900 seconds) for UPLOAD only
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

    // RETURN THE RAW KEY, NOT A PUBLIC URL
    return { success: true, signedUrl, fileKey: objectKey };
  } catch (error: any) {
    console.error('Error generating pre-signed URL:', error);
    return { success: false, error: 'Failed to generate secure upload URL.' };
  }
}