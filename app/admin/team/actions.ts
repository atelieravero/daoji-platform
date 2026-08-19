'use server';

import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth-guards';
import { revalidatePath } from 'next/cache';

const getSupabaseAdmin = () => createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Fetches all team members and current user ID.
 */
export async function getTeamMembers() {
  await requirePermission('team:manage_workers');
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    const admin = getSupabaseAdmin();
    const { data: adminData, error: adminError } = await admin
      .from('team_members')
      .select('*')
      .order('created_at', { ascending: false });

    if (adminError) throw new Error(adminError.message || 'Failed to fetch team members.');
    return { members: adminData || [], currentUserId: user?.id || null };
  }

  return { members: data || [], currentUserId: user?.id || null };
}

/**
 * Invites a new team member.
 */
export async function inviteTeamMember(
  emailOrData: string | { email: string; displayName: string; roles: string[] },
  displayNameArg?: string,
  rolesArg?: string[]
) {
  await requirePermission('team:manage_workers');

  let email = '';
  let displayName = '';
  let roles: string[] = [];

  if (typeof emailOrData === 'object' && emailOrData !== null) {
    email = emailOrData.email;
    displayName = emailOrData.displayName;
    roles = emailOrData.roles || [];
  } else {
    email = emailOrData;
    displayName = displayNameArg || '';
    roles = rolesArg || [];
  }
  
  const supabaseAdmin = getSupabaseAdmin();
  const { data: authData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
    email.trim(),
    {
      data: { display_name: displayName },
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/admin/setup-password`,
    }
  );

  if (inviteError || !authData.user) {
    throw new Error(inviteError?.message || 'Failed to send invite');
  }

  const supabase = await createClient();
  const { error: dbError } = await supabase
    .from('team_members')
    .insert([{
      id: authData.user.id,
      email: email.trim(),
      display_name: displayName,
      roles: roles,
      status: 'invited',
    }]);

  if (dbError) throw new Error(dbError.message || 'Failed to create team member record.');

  revalidatePath('/admin/team');
  revalidatePath('/admin/logs');
  return { success: true };
}

/**
 * Completes user password setup and marks the account active upon initial onboarding.
 */
export async function completePasswordSetup(
  payload?: { userId?: string; displayName?: string } | string,
  displayNameArg?: string
) {
  const supabase = await createClient();
  let targetUserId: string | undefined;
  let targetDisplayName: string | undefined;

  if (typeof payload === 'object' && payload !== null) {
    targetUserId = payload.userId;
    targetDisplayName = payload.displayName;
  } else if (typeof payload === 'string') {
    targetUserId = payload;
    targetDisplayName = displayNameArg;
  }

  if (!targetUserId) {
    const { data: { user } } = await supabase.auth.getUser();
    targetUserId = user?.id;
  }

  if (!targetUserId) {
    throw new Error('User ID is required to complete password setup.');
  }

  const updates: {
    status: string;
    updated_at: string;
    display_name?: string;
  } = {
    status: 'active',
    updated_at: new Date().toISOString(),
  };

  if (targetDisplayName && targetDisplayName.trim()) {
    updates.display_name = targetDisplayName.trim();
  }

  const { error: dbError } = await supabase
    .from('team_members')
    .update(updates)
    .eq('id', targetUserId);

  if (dbError) {
    const admin = getSupabaseAdmin();
    const { error: adminError } = await admin
      .from('team_members')
      .update(updates)
      .eq('id', targetUserId);

    if (adminError) throw new Error(adminError.message || 'Failed to activate team member.');
  }

  revalidatePath('/admin/team');
  revalidatePath('/admin/logs');
  return { success: true };
}

/**
 * Updates roles for an existing worker.
 */
export async function updateTeamMemberRoles(targetUserId: string, newRoles: string[]) {
  await requirePermission('team:manage_workers');
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (user && user.id === targetUserId) {
    throw new Error('Self-modification of roles is strictly prohibited.');
  }

  const { error } = await supabase
    .from('team_members')
    .update({ roles: newRoles, updated_at: new Date().toISOString() })
    .eq('id', targetUserId);

  if (error) throw new Error(error.message || 'Failed to update roles.');

  revalidatePath('/admin/team');
  revalidatePath('/admin/logs');
  return { success: true };
}

/**
 * Updates account status (active | suspended).
 */
export async function updateTeamMemberStatus(targetUserId: string, newStatus: 'active' | 'suspended') {
  await requirePermission('team:manage_workers');
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (user && user.id === targetUserId) {
    throw new Error('Self-suspension is not permitted.');
  }

  const { error } = await supabase
    .from('team_members')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', targetUserId);

  if (error) throw new Error(error.message || 'Failed to update status.');

  revalidatePath('/admin/team');
  revalidatePath('/admin/logs');
  return { success: true };
}

/**
 * Resends the onboarding invite email.
 */
export async function resendInvite(targetIdOrEmail: string) {
  await requirePermission('team:manage_workers');
  const supabaseAdmin = getSupabaseAdmin();

  let targetEmail = targetIdOrEmail.trim();
  if (!targetEmail.includes('@')) {
    const { data: member } = await supabaseAdmin
      .from('team_members')
      .select('email')
      .eq('id', targetIdOrEmail)
      .single();
    
    if (member?.email) {
      targetEmail = member.email;
    }
  }

  const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(targetEmail, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/admin/setup-password`,
  });

  if (error) throw new Error(error.message || 'Failed to resend invitation email.');
  return { success: true };
}

export const resendTeamInvite = resendInvite;

/**
 * Deletes a team member from team_members table and auth users.
 */
export async function deleteTeamMember(targetUserId: string) {
  await requirePermission('team:manage_workers');
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (user && user.id === targetUserId) {
    throw new Error('You cannot delete your own account.');
  }

  const { error: dbError } = await supabase
    .from('team_members')
    .delete()
    .eq('id', targetUserId);

  if (dbError) throw new Error(dbError.message || 'Failed to remove team member record.');

  const supabaseAdmin = getSupabaseAdmin();
  await supabaseAdmin.auth.admin.deleteUser(targetUserId);

  revalidatePath('/admin/team');
  revalidatePath('/admin/logs');
  return { success: true };
}