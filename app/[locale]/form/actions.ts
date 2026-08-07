'use server';

import { createClient } from '@supabase/supabase-js';

const getSupabaseAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

  // If it's a follow-up form, verify the applicant magic token exists
  if (payload.applicant_token) {
    const { data: applicant, error: tokenError } = await supabase
      .from('applicants')
      .select('id')
      .eq('token', payload.applicant_token)
      .single();

    if (tokenError || !applicant) {
      throw new Error('Invalid or expired access token.');
    }
  }

  // Insert submission into the database
  const { error: insertError } = await supabase
    .from('submissions')
    .insert([{
      form_id: payload.form_id,
      event_id: payload.event_id,
      answers: payload.answers,
      is_test: payload.is_test || false,
      applicant_token: payload.applicant_token || null,
    }]);

  if (insertError) {
    console.error('Submission error:', insertError);
    throw new Error('Failed to submit form. Please try again.');
  }

  return { success: true };
}