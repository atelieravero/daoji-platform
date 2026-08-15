import { createClient, getSupabaseAdmin } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { hasPermission, SystemAction, Role } from './permissions';

/**
 * 1. PAGE GUARD (For Server Components)
 */
export async function requirePermission(action: SystemAction) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/admin/login');
  }

  const adminDb = getSupabaseAdmin();
  const { data: profile } = await adminDb
    .from('team_members')
    .select('roles, status, display_name')
    .eq('id', user.id)
    .single();

  if (!profile || profile.status !== 'active') {
    await supabase.auth.signOut();
    redirect('/admin/login?error=account_suspended'); 
  }

  const userRoles = (profile.roles || []) as Role[];
  if (!hasPermission(userRoles, action)) {
    redirect('/admin/login?error=unauthorized');
  }

  return { user, profile };
}

/**
 * 2. ACTION GUARD (Higher-Order Function for Server Actions)
 */
export function withPermission<T extends any[], R>(
  action: SystemAction,
  serverAction: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized: You must be logged in.');
    }

    const adminDb = getSupabaseAdmin();
    const { data: profile } = await adminDb
      .from('team_members')
      .select('roles, status')
      .eq('id', user.id)
      .single();

    if (!profile || profile.status !== 'active') {
      throw new Error('Unauthorized: Account is inactive or suspended.');
    }

    const userRoles = (profile.roles || []) as Role[];
    if (!hasPermission(userRoles, action)) {
      throw new Error(`Forbidden: You do not have permission to perform action: ${action}`);
    }

    return serverAction(...args);
  };
}