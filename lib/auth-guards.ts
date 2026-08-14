// lib/auth-guards.ts

import { createClient } from '@/lib/supabase/server'; // Adjust import path to your Supabase server client
import { redirect } from 'next/navigation';
import { hasPermission, SystemAction } from './permissions';

/**
 * 1. PAGE GUARD (For Server Components)
 * Place this at the top of any protected admin page (e.g., app/admin/team/page.tsx).
 * If the user lacks permission, it immediately redirects them to a 403 or login page.
 * 
 * @param action - The required SystemAction from the Master Matrix
 * @returns An object containing the authenticated `user` and their database `profile`
 */
export async function requirePermission(action: SystemAction) {
  const supabase = await createClient();
  
  // 1. Check Authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/admin/login');
  }

  // 2. Fetch User's Roles from the team_members table
  const { data: profile } = await supabase
    .from('team_members')
    .select('roles, status')
    .eq('id', user.id)
    .single();

  // 3. Status Security Checks
  if (!profile) {
    redirect('/admin/login'); 
  }

  if (profile.status !== 'active') {
    // If they are suspended or stuck in an invited state
    redirect('/admin/unauthorized?reason=inactive'); 
  }

  // 4. Validate against Master Matrix
  if (!hasPermission(profile.roles, action)) {
    redirect('/admin/unauthorized?reason=forbidden');
  }

  // Return the user and profile in case the page needs them for rendering
  return { user, profile };
}

/**
 * 2. ACTION GUARD (Higher-Order Function for Server Actions)
 * Wraps any Server Action to ensure strict authorization before execution.
 * 
 * Usage: 
 * export const deleteForm = withPermission('forms:delete', async (formId: string) => { ... })
 * 
 * @param action - The required SystemAction from the Master Matrix
 * @param serverAction - The actual server action function to execute if authorized
 */
export function withPermission<T extends any[], R>(
  action: SystemAction,
  serverAction: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    const supabase = await createClient();
    
    // 1. Check Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized: You must be logged in.');
    }

    // 2. Fetch User's Roles
    const { data: profile } = await supabase
      .from('team_members')
      .select('roles, status')
      .eq('id', user.id)
      .single();

    // 3. Status Security Checks
    if (!profile || profile.status !== 'active') {
      throw new Error('Unauthorized: Account is inactive or suspended.');
    }

    // 4. Validate against Master Matrix
    if (!hasPermission(profile.roles, action)) {
      throw new Error(`Forbidden: You do not have permission to perform action: ${action}`);
    }

    // 5. If authorized, execute the actual server action
    return serverAction(...args);
  };
}