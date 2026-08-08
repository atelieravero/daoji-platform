'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const getSupabaseAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getForms() {
  const supabase = getSupabaseAdmin(); 

  // Fetch forms and get the is_test flag for all submissions to tally them
  const { data, error } = await supabase
    .from('forms')
    .select('*, submissions(is_test)')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  
  // Format the counts for the frontend
  return (data || []).map((form: any) => {
    const subs = form.submissions || [];
    const testCount = subs.filter((s: any) => s.is_test).length;
    const realCount = subs.filter((s: any) => !s.is_test).length;
    
    return {
      ...form,
      real_count: realCount,
      test_count: testCount
    };
  });
}

export async function deleteForm(id: string) {
  const supabase = getSupabaseAdmin();

  // 1. Fetch form to verify its status
  const { data: form, error: fetchError } = await supabase
    .from('forms')
    .select('status')
    .eq('id', id)
    .single();

  if (fetchError || !form) {
    throw new Error('Form not found.');
  }

  if (form.status !== 'draft') {
    throw new Error('Action blocked: Only draft forms can be deleted. Close the form instead.');
  }

  // 2. Count ALL submissions (Removed the is_test filter entirely)
  const { count, error: countError } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('form_id', id);

  if (countError) {
    console.error('Error verifying form submissions:', countError);
    throw new Error('Failed to verify form data.');
  }

  // If even a single submission exists (test, real, or null), strictly block the deletion
  if (count && count > 0) {
    throw new Error('Action blocked: Cannot delete a form that has existing submissions. Please clear the submissions first.');
  }

  // 3. Safe to perform hard delete
  const { error: deleteError } = await supabase
    .from('forms')
    .delete()
    .eq('id', id);

  if (deleteError) {
    console.error('Error deleting form:', deleteError);
    throw new Error('Failed to delete form from database.');
  }

  revalidatePath('/admin/forms');
}

export async function updateFormStatus(id: string, newStatus: string) {
  const supabase = getSupabaseAdmin();
  
  // Directly update the root status column
  const { error: updateError } = await supabase
    .from('forms')
    .update({ status: newStatus })
    .eq('id', id);

  if (updateError) throw new Error('Failed to update form status.');
  revalidatePath('/admin/forms');
}

export async function duplicateForm(id: string) {
  const supabase = getSupabaseAdmin();

  const { data: original, error: fetchError } = await supabase
    .from('forms')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !original) throw new Error('Form not found for duplication.');

  const duplicatedPayload = {
    event_id: original.event_id,
    title: `${original.title} (Copy)`,
    is_followup: original.is_followup,
    status: 'draft', // Set root status to draft
    schema: {
      ...original.schema,
      titleEn: original.schema?.titleEn ? `${original.schema.titleEn} (Copy)` : '',
      titleZh: original.schema?.titleZh ? `${original.schema.titleZh} (複製)` : '',
    }
  };

  const { data: inserted, error: insertError } = await supabase
    .from('forms')
    .insert([duplicatedPayload])
    .select('id')
    .single();

  if (insertError || !inserted) throw new Error('Failed to duplicate form.');

  revalidatePath('/admin/forms');
  return inserted.id;
}