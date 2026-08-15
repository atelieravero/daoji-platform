'use server';

import { getSupabaseAdmin, createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { Role, canAssignRole } from '@/lib/permissions';
import { withPermission } from '@/lib/auth-guards';

// Helper to fetch the user executing the server action
async function getCurrentUser() {
  const supabase = await createClient(); 
  
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Unauthorized request.");

  const adminDb = getSupabaseAdmin();
  const { data: profile } = await adminDb.from('team_members').select('roles').eq('id', user.id).single();

  return { id: user.id, roles: (profile?.roles || []) as Role[] };
}

// 🛡️ WRAPPED: Strictly Managers
export const getTeamMembers = withPermission('team:manage_workers', async () => {
  const currentUser = await getCurrentUser();
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch team: ${error.message}`);
  
  return { members: data, currentUserId: currentUser.id };
});

// 🛡️ WRAPPED: Strictly Managers
export const inviteTeamMember = withPermission('team:manage_workers', async (email: string, displayName: string, roles: Role[]) => {
  const currentUser = await getCurrentUser();
  
  for (const newRole of roles) {
    if (!canAssignRole(currentUser.roles, newRole)) {
      throw new Error(`Security Exception: You do not have authority to grant the '${newRole}' role.`);
    }
  }

  const supabase = getSupabaseAdmin();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  const { data: authData, error: authError } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${siteUrl}/admin/setup-password`
  });
    
  if (authError) {
    if (authError.message.includes('already exists')) throw new Error('This user already has an account.');
    throw new Error(`Auth Error: ${authError.message}`);
  }

  if (authData.user) {
    const { error: dbError } = await supabase.from('team_members').insert({
      id: authData.user.id,
      email: email.toLowerCase(),
      display_name: displayName,
      roles: roles,
      status: 'invited'
    });
    if (dbError) throw new Error(`Database Error: ${dbError.message}`);
  }

  revalidatePath('/admin/team');
  return { success: true };
});

// 🛡️ WRAPPED: Strictly Managers
export const updateTeamMemberRoles = withPermission('team:manage_workers', async (targetId: string, newRoles: Role[]) => {
  const currentUser = await getCurrentUser();

  if (currentUser.id === targetId) {
    throw new Error("Security Exception: You cannot modify your own access level.");
  }

  const supabase = getSupabaseAdmin();
  const { data: targetProfile } = await supabase.from('team_members').select('roles').eq('id', targetId).single();
  const currentTargetRoles = (targetProfile?.roles || []) as Role[];

  // 1. Verify authority over removed roles
  for (const oldRole of currentTargetRoles) {
    if (!newRoles.includes(oldRole) && !canAssignRole(currentUser.roles, oldRole)) {
      throw new Error(`Security Exception: You do not have authority to revoke the '${oldRole}' role.`);
    }
  }

  // 2. Verify authority over added roles
  for (const newRole of newRoles) {
    if (!currentTargetRoles.includes(newRole) && !canAssignRole(currentUser.roles, newRole)) {
      throw new Error(`Security Exception: You do not have authority to grant the '${newRole}' role.`);
    }
  }

  // 3. Super admin protection
  if (currentTargetRoles.includes('super_admin') && !currentUser.roles.includes('super_admin')) {
      throw new Error("Security Exception: You cannot modify a Super Admin's profile.");
  }

  const { error } = await supabase
    .from('team_members')
    .update({ roles: newRoles, updated_at: new Date().toISOString() })
    .eq('id', targetId);

  if (error) throw new Error(`Failed to update roles: ${error.message}`);
  revalidatePath('/admin/team');
});

// 🛡️ WRAPPED: Strictly Managers
export const updateTeamMemberStatus = withPermission('team:manage_workers', async (targetId: string, newStatus: 'invited' | 'active' | 'suspended') => {
  const currentUser = await getCurrentUser();

  if (currentUser.id === targetId) {
    throw new Error("Security Exception: You cannot modify your own status.");
  }

  const supabase = getSupabaseAdmin();
  
  const { data: targetProfile } = await supabase.from('team_members').select('roles').eq('id', targetId).single();
  const currentTargetRoles = (targetProfile?.roles || []) as Role[];
  
  if (currentTargetRoles.includes('super_admin') && !currentUser.roles.includes('super_admin')) {
     throw new Error("Security Exception: You cannot suspend a Super Admin.");
  }

  const { error } = await supabase
    .from('team_members')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', targetId);

  if (error) throw new Error(`Failed to update status: ${error.message}`);
  revalidatePath('/admin/team');
});

// 🔓 ONBOARDING ACTION: Activates invited user upon password completion
export async function completePasswordSetup(userId: string) {
  const supabase = getSupabaseAdmin();
  
  const { error } = await supabase
    .from('team_members')
    .update({ 
      status: 'active', 
      updated_at: new Date().toISOString() 
    })
    .eq('id', userId)
    .eq('status', 'invited');

  if (error) {
    console.error('Failed to activate team member:', error.message);
  }
  return { success: true };
}