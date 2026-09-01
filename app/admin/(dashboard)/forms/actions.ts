'use server';

import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth-guards';
import { revalidatePath } from 'next/cache';

const getSupabaseAdmin = () => createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Fetches all forms with linked event details and submission counts.
 */
export async function getForms() {
  await requirePermission('submissions:view_test');
  const supabase = getSupabaseAdmin(); 

  const { data, error } = await supabase
    .from('forms')
    .select('*, events:events!forms_event_id_fkey(id, title_zh, title_en, code, short_id, status), submissions(is_test)')
    .order('created_at', { ascending: false });

  // Fallback query if FK relationship cache is still refreshing
  if (error) {
    const { data: fallbackForms, error: fallbackError } = await supabase
      .from('forms')
      .select('*, submissions(is_test)')
      .order('created_at', { ascending: false });

    if (fallbackError) throw new Error(fallbackError.message);

    const eventIds = (fallbackForms || []).map((f: any) => f.event_id).filter(Boolean);
    let eventsMap: Record<string, any> = {};

    if (eventIds.length > 0) {
      const { data: eventsList } = await supabase
        .from('events')
        .select('id, title_zh, title_en, code, short_id, status')
        .in('id', eventIds);

      (eventsList || []).forEach((e: any) => {
        eventsMap[e.id] = e;
      });
    }

    return (fallbackForms || []).map((form: any) => {
      const subs = form.submissions || [];
      const testCount = subs.filter((s: any) => s.is_test).length;
      const realCount = subs.filter((s: any) => !s.is_test).length;
      
      return {
        ...form,
        events: form.event_id ? eventsMap[form.event_id] || null : null,
        real_count: realCount,
        test_count: testCount
      };
    });
  }
  
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

/**
 * Deletes a draft form with no submissions.
 */
export async function deleteForm(id: string) {
  await requirePermission('forms:delete');
  const supabase = await createClient();

  const { data: form, error: fetchError } = await supabase
    .from('forms')
    .select('status')
    .eq('id', id)
    .single();

  if (fetchError || !form) throw new Error('Form not found.');
  if (form.status !== 'draft') {
    throw new Error('Action blocked: Only draft forms can be deleted. Close the form instead.');
  }

  const { count, error: countError } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('form_id', id);

  if (countError) throw new Error('Failed to verify form data.');
  if (count && count > 0) {
    throw new Error('Action blocked: Cannot delete a form that has existing submissions. Please clear the submissions first.');
  }

  const { error: deleteError } = await supabase
    .from('forms')
    .delete()
    .eq('id', id);

  if (deleteError) throw new Error('Failed to delete form from database.');
  
  revalidatePath('/admin/forms');
  revalidatePath('/admin/logs');
}

/**
 * Updates status (draft | open | closed).
 */
export async function updateFormStatus(id: string, newStatus: string) {
  await requirePermission('forms:update_status');
  const supabase = await createClient();
  
  const { error: updateError } = await supabase
    .from('forms')
    .update({ status: newStatus })
    .eq('id', id);

  if (updateError) throw new Error('Failed to update form status.');
  
  revalidatePath('/admin/forms');
  revalidatePath('/admin/logs');
}

/**
 * Duplicates a form.
 */
export async function duplicateForm(id: string) {
  await requirePermission('forms:create');
  const supabase = await createClient();

  const { data: original, error: fetchError } = await supabase
    .from('forms')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !original) throw new Error('Form not found for duplication.');

  const originalSchema = (
    original.schema && typeof original.schema === 'object' && !Array.isArray(original.schema)
      ? (original.schema as Record<string, any>)
      : {}
  );

  const uniqueSlug = original.slug 
    ? `${original.slug}-copy-${Date.now().toString().slice(-4)}` 
    : `form-${Date.now()}`;

  const duplicatedPayload = {
    event_id: original.event_id,
    slug: uniqueSlug,
    title: `${original.title} (Copy)`,
    is_followup: original.is_followup,
    status: 'draft', 
    schema: {
      ...originalSchema,
      titleEn: originalSchema.titleEn ? `${originalSchema.titleEn} (Copy)` : '',
      titleZh: originalSchema.titleZh ? `${originalSchema.titleZh} (複製)` : '',
    }
  };

  const { data: inserted, error: insertError } = await supabase
    .from('forms')
    .insert([duplicatedPayload])
    .select('id')
    .single();

  if (insertError || !inserted) {
    console.error('Insert error during duplication:', insertError);
    throw new Error(insertError?.message || 'Failed to duplicate form.');
  }

  revalidatePath('/admin/forms');
  revalidatePath('/admin/logs');
  return inserted.id;
}