// app/admin/(dashboard)/forms/[form_id]/submissions/actions.ts
'use server';

import { createClient as createAdminClient } from '@supabase/supabase-js';
import { requirePermission } from '@/lib/auth-guards';
import { hasPermission } from '@/lib/permissions';
import { revalidatePath } from 'next/cache';
import { FormStatusConfig, normalizeStatusConfig } from '@/lib/status-inquiry';

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
  await requirePermission('submissions:process');
  const admin = getSupabaseAdmin();

  const { error } = await admin
    .from('submissions')
    .update({ is_processed: !currentStatus })
    .eq('id', submissionId);

  if (error) throw new Error('Failed to update status.');

  revalidatePath('/admin/forms/[form_id]/submissions', 'page');
  return { success: true, newStatus: !currentStatus };
}

export async function toggleSubmissionArchivedStatus(submissionId: string, currentStatus: boolean) {
  await requirePermission('submissions:archive');
  const admin = getSupabaseAdmin();

  const { error } = await admin
    .from('submissions')
    .update({ is_archived: !currentStatus })
    .eq('id', submissionId);

  if (error) throw new Error('Failed to update archive status.');

  revalidatePath('/admin/forms/[form_id]/submissions', 'page');
  return { success: true, newStatus: !currentStatus };
}

export async function bulkMarkAsProcessed(submissionIds: string[]) {
  if (!submissionIds || submissionIds.length === 0) return { success: true };

  const { profile } = await requirePermission('submissions:process');
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

/**
 * Saves the form's status_config JSONB (independent of forms.schema lock).
 */
export async function saveFormStatusConfig(formId: string, rawConfig: FormStatusConfig) {
  await requirePermission('submissions:process');
  if (!formId) throw new Error('Form ID is required.');

  const sanitized = normalizeStatusConfig(rawConfig);

  // Validate keys and option values
  const seenKeys = new Set<string>();
  for (const field of sanitized.fields) {
    if (!field.key) {
      throw new Error('Each status field must have a unique key.');
    }
    if (seenKeys.has(field.key)) {
      throw new Error(`Duplicate status field key: "${field.key}".`);
    }
    seenKeys.add(field.key);

    for (const opt of field.options) {
      if (!opt.value) {
        throw new Error(`All options in "${field.labelEn || field.labelZh || field.key}" must have a value key.`);
      }
    }
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from('forms')
    .update({ status_config: sanitized, updated_at: new Date().toISOString() })
    .eq('id', formId);

  if (error) {
    console.error('Failed to save status_config:', error);
    throw new Error(error.message || 'Failed to save status inquiry configuration.');
  }

  revalidatePath('/admin/forms/[form_id]/submissions', 'page');
  revalidatePath('/[locale]/event/[id_or_slug]', 'page');
  revalidatePath('/[locale]/form/[slug]/status', 'page');
  return { success: true, status_config: sanitized };
}

/**
 * Updates a single status field value on a single submission row.
 */
export async function updateSubmissionStatusField(
  submissionId: string,
  fieldKey: string,
  optionValue: string | null
) {
  await requirePermission('submissions:process');
  if (!submissionId || !fieldKey) throw new Error('Submission ID and field key are required.');

  const admin = getSupabaseAdmin();
  const { data: existing, error: fetchError } = await admin
    .from('submissions')
    .select('status_data')
    .eq('id', submissionId)
    .single();

  if (fetchError || !existing) throw new Error('Submission not found.');

  const nextStatusData: Record<string, any> = {
    ...(existing.status_data && typeof existing.status_data === 'object' ? existing.status_data : {}),
  };

  if (optionValue === null || optionValue === '') {
    delete nextStatusData[fieldKey];
  } else {
    nextStatusData[fieldKey] = optionValue;
  }

  const { error: updateError } = await admin
    .from('submissions')
    .update({ status_data: nextStatusData })
    .eq('id', submissionId);

  if (updateError) throw new Error('Failed to update submission status field.');

  revalidatePath('/admin/forms/[form_id]/submissions', 'page');
  return { success: true, status_data: nextStatusData };
}

/**
 * Bulk updates a status field value across multiple selected submission rows.
 */
export async function bulkUpdateSubmissionStatusField(
  submissionIds: string[],
  fieldKey: string,
  optionValue: string | null
) {
  await requirePermission('submissions:process');
  if (!submissionIds || submissionIds.length === 0 || !fieldKey) {
    return { success: true };
  }

  const admin = getSupabaseAdmin();
  const { data: rows, error: fetchError } = await admin
    .from('submissions')
    .select('id, status_data')
    .in('id', submissionIds);

  if (fetchError || !rows) throw new Error('Failed to fetch selected submissions.');

  await Promise.all(
    rows.map((row) => {
      const nextStatusData: Record<string, any> = {
        ...(row.status_data && typeof row.status_data === 'object' ? row.status_data : {}),
      };
      if (optionValue === null || optionValue === '') {
        delete nextStatusData[fieldKey];
      } else {
        nextStatusData[fieldKey] = optionValue;
      }
      return admin
        .from('submissions')
        .update({ status_data: nextStatusData })
        .eq('id', row.id);
    })
  );

  revalidatePath('/admin/forms/[form_id]/submissions', 'page');
  return { success: true };
}