'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

export async function saveFormSchema(payload: {
  event_id: string;
  title: string;
  is_followup: boolean;
  schema: any;
}) {
  // Instantiate the admin client using the Service Role Key to safely bypass RLS
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabaseAdmin.from('forms').insert([payload]);

  if (error) {
    console.error('Supabase Error saving form schema:', error);
    throw new Error('Failed to save form schema.');
  }

  // Revalidate the admin forms list to reflect the new form
  revalidatePath('/admin/forms');
}