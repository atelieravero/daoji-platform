import { redirect } from 'next/navigation';
import { createClient, getSupabaseAdmin } from '@/lib/supabase/server';
import { Role, hasPermission } from '@/lib/permissions';

export default async function AdminRootRedirect() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/admin/login');
  }

  // Fetch the user's roles
  const adminDb = getSupabaseAdmin();
  const { data: profile } = await adminDb.from('team_members').select('roles').eq('id', user.id).single();
  const userRoles = (profile?.roles || []) as Role[];

  // 1. Check for Content capabilities
  if (hasPermission(userRoles, 'content:edit')) {
    redirect('/admin/events');
  }
  
  // 2. Check for Form/Submission capabilities
  if (
    hasPermission(userRoles, 'forms:edit') || 
    hasPermission(userRoles, 'submissions:view_real') || 
    hasPermission(userRoles, 'submissions:view_test')
  ) {
    redirect('/admin/forms');
  }

  // 3. Check for Team Management capabilities
  if (hasPermission(userRoles, 'team:manage_workers')) {
    redirect('/admin/team');
  }

  // Fallback: If they have no recognized roles for the main navigation, log them out
  const { error: signOutError } = await supabase.auth.signOut();
  redirect('/admin/login?error=unauthorized');
}