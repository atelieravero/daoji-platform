'use server';

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client } from '@/lib/s3/client';
import { randomUUID } from 'crypto';
import {
  canonicalizeApplicantName,
  canonicalizePhoneSuffix,
  generateNumericToken,
} from '@/lib/applicant-identity';

const getSupabaseAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Resolves an event UUID or raw code string into the canonical uppercase event_code.
 */
async function resolveEventCode(
  supabase: SupabaseClient,
  eventCodeOrId?: string | null,
  fallback: string = 'MMC'
): Promise<string> {
  const raw = (eventCodeOrId || '').trim();
  if (!raw) return fallback;

  if (raw.includes('-') && raw.length === 36) {
    const { data: evt } = await supabase
      .from('events')
      .select('code')
      .eq('id', raw)
      .single();
    if (evt?.code) return evt.code.trim().toUpperCase();
  }

  return raw.toUpperCase();
}

/**
 * Normalizes a raw 8-digit string or full token into [EVENT_CODE]-DDDD-DDDD.
 */
function normalizeApplicantToken(rawToken: string | undefined | null, eventCode: string): string {
  const clean = (rawToken || '').replace(/\s+/g, '').toUpperCase();
  if (!clean) return '';

  const prefix = `${eventCode}-`;
  const body = clean.startsWith(prefix) ? clean.slice(prefix.length) : clean;
  const digitsOnly = body.replace(/\D/g, '');

  if (digitsOnly.length === 8) {
    return `${eventCode}-${digitsOnly.slice(0, 4)}-${digitsOnly.slice(4)}`;
  }

  return clean;
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
 * Validates applicant tokens scoped by event_code and environment mode (is_test).
 */
export async function verifyApplicantToken(
  token: string,
  eventCodeOrId: string,
  isTest: boolean = false
) {
  const supabase = getSupabaseAdmin();
  if (!token || !eventCodeOrId) {
    return { valid: false, message: 'Token and Event Code are required.' };
  }

  const targetCode = await resolveEventCode(supabase, eventCodeOrId, '');
  const cleanToken = normalizeApplicantToken(token, targetCode);

  if (!cleanToken || !targetCode) {
    return { valid: false, message: 'Token and Event Code are required.' };
  }

  const { data: existingSubmissions, error } = await supabase
    .from('submissions')
    .select('id, is_test')
    .eq('applicant_token', cleanToken)
    .eq('event_code', targetCode)
    .eq('is_archived', false)
    .eq('is_test', Boolean(isTest))
    .limit(1);

  if (error || !existingSubmissions || existingSubmissions.length === 0) {
    return { valid: false, message: 'Invalid or expired access token for this event code.' };
  }

  return { valid: true, token: cleanToken };
}

/**
 * Self-service identity challenge recovery:
 * Recovers an applicant's token using Name and Mobile suffix (last 8 digits).
 * Fails if 0 or >1 non-archived matches are found.
 */
export async function recoverApplicantToken(params: {
  eventCode: string;
  name: string;
  phone: string;
  isTest?: boolean;
}): Promise<{ success: boolean; token?: string; error?: string }> {
  const supabase = getSupabaseAdmin();
  const cleanName = canonicalizeApplicantName(params.name);
  const cleanPhone = canonicalizePhoneSuffix(params.phone);
  const isTest = Boolean(params.isTest);

  if (!cleanName || !cleanPhone) {
    return { 
      success: false, 
      error: 'Please provide both your full name and an 8+ digit phone number.' 
    };
  }

  const targetCode = await resolveEventCode(supabase, params.eventCode, '');
  if (!targetCode) {
    return { success: false, error: 'Event code is required.' };
  }

  const { data: matches, error } = await supabase
    .from('submissions')
    .select('applicant_token, applicant_name, applicant_phone_suffix')
    .eq('event_code', targetCode)
    .eq('applicant_name', cleanName)
    .eq('applicant_phone_suffix', cleanPhone)
    .eq('is_archived', false)
    .eq('is_test', isTest)
    .not('applicant_name', 'is', null)
    .neq('applicant_name', '')
    .not('applicant_phone_suffix', 'is', null)
    .neq('applicant_phone_suffix', '');

  if (error) {
    console.error('Error recovering applicant token:', error);
    return { success: false, error: 'Failed to verify identity. Please try again.' };
  }

  if (!matches || matches.length === 0) {
    return { 
      success: false, 
      error: 'No matching application found. Please verify your name and phone number.' 
    };
  }

  if (matches.length > 1) {
    return { 
      success: false, 
      error: 'Multiple active applications found with these details. Please contact the organizers directly.' 
    };
  }

  return { 
    success: true, 
    token: matches[0].applicant_token 
  };
}

/**
 * Submits public form record scoped to event_code, records the raw locale code,
 * populates identity anchors, and provisions 8-digit numeric magic tokens.
 */
export async function submitPublicForm(payload: {
  form_id: string;
  event_id: string;
  answers: Record<string, any>;
  is_test?: boolean;
  applicant_token?: string;
  interim_event_code?: string;
  locale?: string | null;
}) {
  const supabase = getSupabaseAdmin();
  const isTest = Boolean(payload.is_test);

  // 1. Resolve canonical event code
  const resolvedCode = await resolveEventCode(
    supabase,
    payload.event_id,
    payload.interim_event_code || 'MMC'
  );

  // 2. Resolve token (normalize existing or generate new 8-digit numeric token)
  let activeToken = normalizeApplicantToken(payload.applicant_token, resolvedCode) || undefined;

  if (activeToken) {
    const { data: existingSubmissions, error: tokenError } = await supabase
      .from('submissions')
      .select('id, is_test')
      .eq('applicant_token', activeToken)
      .eq('event_code', resolvedCode)
      .eq('is_archived', false)
      .eq('is_test', isTest)
      .limit(1);

    if (tokenError || !existingSubmissions || existingSubmissions.length === 0) {
      throw new Error('Invalid or expired access token for this event code.');
    }
  } else {
    activeToken = generateNumericToken(resolvedCode);
  }

  // 3. Resolve identity anchors from form schema (only for initial application forms)
  const { data: formRecord } = await supabase
    .from('forms')
    .select('schema, is_followup')
    .eq('id', payload.form_id)
    .single();

  let applicantName: string | null = null;
  let applicantPhoneSuffix: string | null = null;

  if (!formRecord?.is_followup) {
    const fields = formRecord?.schema?.fields || [];
    const nameField = fields.find((f: any) => f.is_identity_name);
    const phoneField = fields.find((f: any) => f.is_identity_phone);

    const rawName = nameField ? payload.answers[nameField.dataKey] : null;
    const rawPhone = phoneField ? payload.answers[phoneField.dataKey] : null;

    applicantName = canonicalizeApplicantName(rawName) || null;
    applicantPhoneSuffix = canonicalizePhoneSuffix(rawPhone) || null;
  }

  // 4. Ingest submission record with original locale code
  const { error: insertError } = await supabase
    .from('submissions')
    .insert([{
      form_id: payload.form_id,
      event_id: payload.event_id,
      event_code: resolvedCode,
      locale: payload.locale ?? null,
      response: payload.answers,
      applicant_token: activeToken,
      applicant_name: applicantName,
      applicant_phone_suffix: applicantPhoneSuffix,
      is_archived: false,
      is_test: isTest,
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