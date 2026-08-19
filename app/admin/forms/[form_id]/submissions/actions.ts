'use server';

import { createClient as createAdminClient } from '@supabase/supabase-js';
import { requirePermission } from '@/lib/auth-guards';
import { hasPermission } from '@/lib/permissions';
import { revalidatePath } from 'next/cache';

const getSupabaseAdmin = () => createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getFormAndSubmissions(formId: string) {
  if (!formId) throw new Error('Form ID is required.');

  const { profile } = await requirePermission('submissions:view_test');
  const canViewReal = hasPermission(profile.roles || [], 'submissions:view_real');

  const supabaseAdmin = getSupabaseAdmin();
  const { data: form, error: formError } = await supabaseAdmin
    .from('forms')
    .select('*')
    .eq('id', formId)
    .single();

  if (formError || !form) throw new Error(`Form not found: ${formId}`);

  let query = supabaseAdmin
    .from('submissions')
    .select('*')
    .eq('form_id', formId)
    .order('created_at', { ascending: false });

  if (!canViewReal) {
    query = query.eq('is_test', true);
  }

  const { data: submissions, error: subError } = await query;
  if (subError) throw new Error(`Failed to fetch submissions: ${subError.message}`);

  return { form, submissions: submissions || [] };
}

export async function toggleSubmissionProcessedStatus(submissionId: string, currentStatus: boolean) {
  await requirePermission('submissions:manage');
  const admin = getSupabaseAdmin();

  const { error } = await admin
    .from('submissions')
    .update({ is_processed: !currentStatus })
    .eq('id', submissionId);

  if (error) throw new Error('Failed to update status.');

  revalidatePath('/admin/forms/[form_id]/submissions', 'page');
  return { success: true, newStatus: !currentStatus };
}

export async function bulkMarkAsProcessed(submissionIds: string[]) {
  if (!submissionIds || submissionIds.length === 0) return { success: true };

  const { profile } = await requirePermission('submissions:manage');
  const userRoles = profile.roles || [];
  
  const canExportTest = hasPermission(userRoles, 'submissions:export_test');
  const canExportReal = hasPermission(userRoles, 'submissions:export_real');

  if (!canExportTest && !canExportReal) {
    throw new Error('Forbidden: You must have export permissions to trigger this action.');
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from('submissions')
    .update({ is_processed: true })
    .in('id', submissionIds);

  if (error) throw new Error('Failed to bulk update submissions.');

  revalidatePath('/admin/forms/[form_id]/submissions', 'page');
  return { success: true };
}