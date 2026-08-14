'use server';

import { getSupabaseAdmin, createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { UserRole } from '@/lib/permissions';

// SECURITY: Helper to reliably fetch the user executing the server action
async function getCurrentUser() {
  // FIX: Added 'await' because createClient reads Next.js cookies asynchronously
  const supabase = await createClient(); 
  
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Unauthorized request.");

  const adminDb = getSupabaseAdmin();
  const { data: profile } = await adminDb.from('team_members').select('roles').eq('id', user.id).single();

  return { id: user.id, roles: (profile?.roles || []) as UserRole[] };
}

export async function getTeamMembers() {
  const currentUser = await getCurrentUser();
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch team: ${error.message}`);
  
  // Return the data AND the current user's ID so the UI can disable self-edits
  return { members: data, currentUserId: currentUser.id };
}

export async function inviteTeamMember(email: string, displayName: string, roles: UserRole[]) {
  const currentUser = await getCurrentUser();
  
  // MANAGER HIERARCHY LOCK
  if (roles.includes('super_admin')) {
    throw new Error("Security Exception: super_admin can only be granted directly in the database.");
  }
  if (!currentUser.roles.includes('super_admin') && currentUser.roles.includes('team_manager') && roles.includes('team_manager')) {
    throw new Error("Security Exception: Team Managers cannot grant Manager privileges.");
  }

  const supabase = getSupabaseAdmin();
  
  // UPDATE: Point the invite to the server callback, and tell it to route to setup-password afterward
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
}

export async function updateTeamMemberRoles(targetId: string, newRoles: UserRole[]) {
  const currentUser = await getCurrentUser();

  // SELF-EDIT BLOCK
  if (currentUser.id === targetId) {
    throw new Error("Security Exception: You cannot modify your own access level.");
  }

  // SUPER ADMIN LOCK
  if (newRoles.includes('super_admin')) {
    throw new Error("Security Exception: super_admin can only be granted directly in the database.");
  }

  const supabase = getSupabaseAdmin();
  const { data: targetProfile } = await supabase.from('team_members').select('roles').eq('id', targetId).single();
  const currentTargetRoles = (targetProfile?.roles || []) as UserRole[];

  // MANAGER HIERARCHY LOCK
  if (!currentUser.roles.includes('super_admin') && currentUser.roles.includes('team_manager')) {
    if (currentTargetRoles.includes('super_admin')) {
      throw new Error("Security Exception: You cannot modify a Super Admin's profile.");
    }
    if (!currentTargetRoles.includes('team_manager') && newRoles.includes('team_manager')) {
      throw new Error("Security Exception: Team Managers cannot grant Manager privileges.");
    }
    if (currentTargetRoles.includes('team_manager') && !newRoles.includes('team_manager')) {
      throw new Error("Security Exception: Team Managers cannot revoke Manager privileges.");
    }
  }

  const { error } = await supabase
    .from('team_members')
    .update({ roles: newRoles, updated_at: new Date().toISOString() })
    .eq('id', targetId);

  if (error) throw new Error(`Failed to update roles: ${error.message}`);
  revalidatePath('/admin/team');
}

export async function updateTeamMemberStatus(targetId: string, newStatus: 'invited' | 'active' | 'suspended') {
  const currentUser = await getCurrentUser();

  // SELF-EDIT BLOCK
  if (currentUser.id === targetId) {
    throw new Error("Security Exception: You cannot modify your own status.");
  }

  const supabase = getSupabaseAdmin();
  
  // Hierarchy check: Managers cannot suspend Super Admins
  const { data: targetProfile } = await supabase.from('team_members').select('roles').eq('id', targetId).single();
  const currentTargetRoles = (targetProfile?.roles || []) as UserRole[];
  
  if (!currentUser.roles.includes('super_admin') && currentUser.roles.includes('team_manager')) {
     if (currentTargetRoles.includes('super_admin')) {
        throw new Error("Security Exception: You cannot suspend a Super Admin.");
     }
  }

  const { error } = await supabase
    .from('team_members')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', targetId);

  if (error) throw new Error(`Failed to update status: ${error.message}`);
  revalidatePath('/admin/team');
}