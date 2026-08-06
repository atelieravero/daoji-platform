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
  const { error } = await supabase
    .from('forms')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting form:', error);
    throw new Error('Failed to delete form.');
  }

  revalidatePath('/admin/forms');
}

export async function updateFormStatus(id: string, newStatus: string) {
  const supabase = getSupabaseAdmin();
  
  // Fetch current form schema to update status inside the JSONB column
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