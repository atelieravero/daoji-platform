'use server';

import { createClient } from '@supabase/supabase-js';

const getSupabaseAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getFormAndSubmissions(formId: string) {
  const supabase = getSupabaseAdmin();
  
  const { data: form, error: formError } = await supabase
    .from('forms')
    .select('*')
    .eq('id', formId)
    .single();

  if (formError || !form) throw new Error('Form not found');

  const { data: submissions, error: subError } = await supabase
    .from('submissions')
    .select('*')
    .eq('form_id', formId)
    .order('created_at', { ascending: false });

  if (subError) throw new Error('Failed to fetch submissions');

  return { form, submissions: submissions || [] };
}

export async function toggleSubmissionProcessedStatus(submissionId: string, currentStatus: boolean) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('submissions')
    .update({ is_processed: !currentStatus }) // Target is_processed
    .eq('id', submissionId);

  if (error) throw new Error('Failed to update status');
  return { success: true, newStatus: !currentStatus };
}

export async function bulkMarkAsProcessed(submissionIds: string[]) {
  const supabase = getSupabaseAdmin();
  
  const { error } = await supabase
    .from('submissions')
    .update({ is_processed: true }) // Target is_processed
    .in('id', submissionIds);

  if (error) throw new Error('Failed to bulk update');
  return { success: true };
}