import { redirect } from 'next/navigation';
import { createClient, getSupabaseAdmin } from '@/lib/supabase/server';
import { Role, hasPermission } from '@/lib/permissions';

export default async function AdminRootRedirect() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/admin/login');
  }

  // Fetch status and roles directly via admin client
  const adminDb = getSupabaseAdmin();
  const { data: profile } = await adminDb
    .from('team_members')
    .select('roles, status')
    .eq('id', user.id)
    .single();

  // Eject immediately if inactive or suspended
  if (!profile || profile.status !== 'active') {
    await supabase.auth.signOut();
    redirect('/admin/login?error=account_suspended');
  }

  const userRoles = (profile.roles || []) as Role[];

  if (hasPermission(userRoles, 'content:edit')) {
    redirect('/admin/events');
  }
  
  if (
    hasPermission(userRoles, 'forms:edit') || 
    hasPermission(userRoles, 'submissions:view_real') || 
    hasPermission(userRoles, 'submissions:view_test')
  ) {
    redirect('/admin/forms');
  }

  if (hasPermission(userRoles, 'team:manage_workers')) {
    redirect('/admin/team');
  }

  await supabase.auth.signOut();
  redirect('/admin/login?error=unauthorized');
}