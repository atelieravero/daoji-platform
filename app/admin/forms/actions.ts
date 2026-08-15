'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { withPermission } from '@/lib/auth-guards'; // <-- NEW IMPORT

const getSupabaseAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 🛡️ WRAPPED: Baseline access shared by Editors and Viewers
export const getForms = withPermission('submissions:view_test', async () => {
  const supabase = getSupabaseAdmin(); 

  const { data, error } = await supabase
    .from('forms')
    .select('*, submissions(is_test)')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  
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
});

// 🛡️ WRAPPED: Strictly Editors
export const deleteForm = withPermission('forms:delete', async (id: string) => {
  const supabase = getSupabaseAdmin();

  const { data: form, error: fetchError } = await supabase
    .from('forms')
    .select('status')
    .eq('id', id)
    .single();

  if (fetchError || !form) throw new Error('Form not found.');
  if (form.status !== 'draft') throw new Error('Action blocked: Only draft forms can be deleted. Close the form instead.');

  const { count, error: countError } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('form_id', id);

  if (countError) throw new Error('Failed to verify form data.');
  if (count && count > 0) throw new Error('Action blocked: Cannot delete a form that has existing submissions. Please clear the submissions first.');

  const { error: deleteError } = await supabase
    .from('forms')
    .delete()
    .eq('id', id);

  if (deleteError) throw new Error('Failed to delete form from database.');
  revalidatePath('/admin/forms');
});

// 🛡️ WRAPPED: Strictly Editors
export const updateFormStatus = withPermission('forms:update_status', async (id: string, newStatus: string) => {
  const supabase = getSupabaseAdmin();
  
  const { error: updateError } = await supabase
    .from('forms')
    .update({ status: newStatus })
    .eq('id', id);

  if (updateError) throw new Error('Failed to update form status.');
  revalidatePath('/admin/forms');
});

// 🛡️ WRAPPED: Strictly Editors
export const duplicateForm = withPermission('forms:create', async (id: string) => {
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
    status: 'draft', 
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
});