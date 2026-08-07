'use server';

import { createClient } from '@supabase/supabase-js';

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
    const { data: existingSubmissions, error: tokenError } = await supabase
      .from('submissions')
      .select('id')
      .eq('applicant_token', activeToken)
      .eq('event_id', payload.event_id)
      .limit(1);

    if (tokenError || !existingSubmissions || existingSubmissions.length === 0) {
      throw new Error('Invalid or expired access token for this event.');
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
      response: payload.answers, // Updated to match your DB column
      applicant_token: activeToken, 
      // is_test is removed to prevent the schema cache error
    }]);

  if (insertError) {
    console.error('Submission error:', insertError);
    throw new Error('Failed to submit form. Please try again.');
  }

  // Return the token to the frontend so it can be displayed to the user
  return { success: true, applicant_token: activeToken };
}