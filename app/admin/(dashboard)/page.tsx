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

  // 1. Content & Events Priority (Super Admins, Content Editors, Event Coordinators, Viewers)
  if (hasPermission(userRoles, 'events:view')) {
    redirect('/admin/events');
  }

  if (hasPermission(userRoles, 'articles:view')) {
    redirect('/admin/articles');
  }

  if (hasPermission(userRoles, 'resources:view')) {
    redirect('/admin/resources');
  }

  // 2. Forms & Submissions Priority (Form Editors, Submission Viewers)
  if (
    hasPermission(userRoles, 'forms:view') ||
    hasPermission(userRoles, 'forms:edit') || 
    hasPermission(userRoles, 'submissions:view_real') || 
    hasPermission(userRoles, 'submissions:view_test')
  ) {
    redirect('/admin/forms');
  }

  // 3. Shared Foundation Priority
  if (hasPermission(userRoles, 'assets:view')) {
    redirect('/admin/assets');
  }

  if (hasPermission(userRoles, 'tags:view')) {
    redirect('/admin/tags');
  }

  // 4. Team Administration Priority (Team Managers)
  if (hasPermission(userRoles, 'team:view') || hasPermission(userRoles, 'team:manage_workers')) {
    redirect('/admin/team');
  }

  if (hasPermission(userRoles, 'logs:view')) {
    redirect('/admin/logs');
  }

  // Fallback for authenticated users with zero valid permissions
  await supabase.auth.signOut();
  redirect('/admin/login?error=unauthorized');
}