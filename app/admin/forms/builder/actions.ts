'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const getSupabaseAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getFormSchema(id: string) {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from('forms')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching form schema:', error);
    return null;
  }

  return data;
}

export async function saveFormSchema(payload: {
  event_id: string;
  title: string;
  is_followup: boolean;
  schema: any;
}, id?: string | null) {
  const supabaseAdmin = getSupabaseAdmin();

  let error;
  let savedId = id;

  if (id) {
    const res = await supabaseAdmin
      .from('forms')
      .update(payload)
      .eq('id', id);
    error = res.error;
  } else {
    const res = await supabaseAdmin
      .from('forms')
      .insert([payload])
      .select('id')
      .single();
    
    error = res.error;
    if (res.data) {
      savedId = res.data.id;
    }
  }

  if (error) {
    console.error('Supabase Error saving form schema:', error);
    throw new Error('Failed to save form schema.');
  }

  revalidatePath('/admin/forms');
  return savedId;
}