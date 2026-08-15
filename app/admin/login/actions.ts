'use server';

import { createClient, getSupabaseAdmin } from '@/lib/supabase/server';

export async function login(formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const supabase = await createClient();

  // 1. Authenticate credentials against Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    return { error: authError?.message || 'Invalid email or password.' };
  }

  // 2. Immediate Status Verification
  const adminDb = getSupabaseAdmin();
  const { data: profile, error: profileError } = await adminDb
    .from('team_members')
    .select('status')
    .eq('id', authData.user.id)
    .single();

  if (profileError || !profile) {
    await supabase.auth.signOut();
    return { error: 'Account profile not found. Please contact support.' };
  }

  if (profile.status === 'suspended') {
    await supabase.auth.signOut();
    return { error: 'This account has been suspended. Please contact an administrator.' };
  }

  if (profile.status === 'invited') {
    await supabase.auth.signOut();
    return { error: 'Please accept your email invite to finish setting up your account.' };
  }

  return { success: true };
}