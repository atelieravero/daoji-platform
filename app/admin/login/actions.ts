'use server';

import { createClient } from '@/lib/supabase/server';


export async function login(formData: FormData) {
  // Strips invisible spaces and enforces lowercase to prevent SPA auth clashes
  const rawEmail = formData.get('email') as string;
  const email = rawEmail?.trim().toLowerCase(); 
  const password = formData.get('password') as string;
  
  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
