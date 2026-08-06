'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const getSupabaseAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getForms() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('forms')
    .select('*')
    .order('id', { ascending: false });

  if (error) {
    console.error('Error fetching forms:', error);
    return [];
  }

  return data;
}

export async function deleteForm(id: string) {
  const supabase = getSupabaseAdmin();

  // 1. Fetch form to verify its status is strictly 'draft'
  const { data: form, error: fetchError } = await supabase
    .from('forms')
    .select('schema')
    .eq('id', id)
    .single();

  if (fetchError || !form) {
    throw new Error('Form not found.');
  }

  const status = form.schema?.status || 'draft';
  if (status !== 'draft') {
    throw new Error('Action blocked: Only draft forms can be deleted. Close the form instead.');
  }

  // 2. Check for real user submissions (excluding test submissions where is_test = true)
  const { count, error: countError } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('form_id', id)
    .eq('is_test', false);

  if (countError) {
    console.error('Error verifying form submissions:', countError);
    // If the submissions table doesn't exist yet or query fails safely handle it
    // but if it exists and count > 0, block deletion:
  }

  if (count && count > 0) {
    throw new Error('Action blocked: This draft contains real applicant submissions.');
  }

  // 3. Safe to perform hard delete
  const { error: deleteError } = await supabase
    .from('forms')
    .delete()
    .eq('id', id);

  if (deleteError) {
    console.error('Error deleting form:', deleteError);
    throw new Error('Failed to delete form.');
  }

  revalidatePath('/admin/forms');
}

export async function updateFormStatus(id: string, newStatus: string) {
  const supabase = getSupabaseAdmin();
  
  const { data: form, error: fetchError } = await supabase
    .from('forms')
    .select('schema')
    .eq('id', id)
    .single();

  if (fetchError || !form) {
    throw new Error('Form not found.');
  }

  const updatedSchema = {
    ...form.schema,
    status: newStatus
  };

  const { error: updateError } = await supabase
    .from('forms')
    .update({ schema: updatedSchema })
    .eq('id', id);

  if (updateError) {
    console.error('Error updating form status:', updateError);
    throw new Error('Failed to update form status.');
  }

  revalidatePath('/admin/forms');
}

export async function duplicateForm(id: string) {
  const supabase = getSupabaseAdmin();

  // 1. Fetch the original form
  const { data: original, error: fetchError } = await supabase
    .from('forms')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !original) {
    throw new Error('Form not found for duplication.');
  }

  // 2. Prepare the duplicated payload
  const duplicatedPayload = {
    event_id: original.event_id,
    title: `${original.title} (Copy)`,
    is_followup: original.is_followup,
    schema: {
      ...original.schema,
      status: 'draft', // Force status to draft for safety
      titleEn: original.schema?.titleEn ? `${original.schema.titleEn} (Copy)` : '',
      titleZh: original.schema?.titleZh ? `${original.schema.titleZh} (複製)` : '',
    }
  };

  // 3. Insert as a new row and return the new ID
  const { data: inserted, error: insertError } = await supabase
    .from('forms')
    .insert([duplicatedPayload])
    .select('id')
    .single();

  if (insertError || !inserted) {
    console.error('Error duplicating form:', insertError);
    throw new Error('Failed to duplicate form.');
  }

  revalidatePath('/admin/forms');
  return inserted.id;
}