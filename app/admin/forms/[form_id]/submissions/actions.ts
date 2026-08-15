'use server';

import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { withPermission } from '@/lib/auth-guards';
import { hasPermission } from '@/lib/permissions';

const getSupabaseAdmin = () => createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 🛡️ DATA PRIVACY ENFORCEMENT: Custom role check to filter test vs real data
export async function getFormAndSubmissions(formId: string) {
  // 1. Authenticate the current user
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Unauthorized');

  // 2. Fetch User's Roles
  const { data } = await supabase
    .from('team_members' as any)
    .select('roles, status')
    .eq('id', user.id)
    .single();
    
  const profile = data as { roles: string[]; status: string } | null;
  if (!profile || profile.status !== 'active') throw new Error('Unauthorized');

  // 3. Determine View Scope
  const canViewTest = hasPermission(profile.roles, 'submissions:view_test');
  const canViewReal = hasPermission(profile.roles, 'submissions:view_real');

  if (!canViewTest && !canViewReal) {
    throw new Error('Forbidden: You do not have permission to view submissions.');
  }

  // 4. Fetch the Data
  const supabaseAdmin = getSupabaseAdmin();
  
  const { data: form, error: formError } = await supabaseAdmin
    .from('forms')
    .select('*')
    .eq('id', formId)
    .single();

  if (formError || !form) throw new Error('Form not found');

  // Base query
  let query = supabaseAdmin
    .from('submissions')
    .select('*')
    .eq('form_id', formId)
    .order('created_at', { ascending: false });

  // 🔒 THE VAULT DOOR: If they cannot view real data, strictly limit to test submissions
  if (!canViewReal) {
    query = query.eq('is_test', true);
  }

  const { data: submissions, error: subError } = await query;
  if (subError) throw new Error('Failed to fetch submissions');

  return { form, submissions: submissions || [] };
}

// 🛡️ WRAPPED: Strictly Submission Viewers (Manual Toggle Only)
export const toggleSubmissionProcessedStatus = withPermission('submissions:manage', async (submissionId: string, currentStatus: boolean) => {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('submissions')
    .update({ is_processed: !currentStatus }) 
    .eq('id', submissionId);

  if (error) throw new Error('Failed to update status');
  return { success: true, newStatus: !currentStatus };
});

// 🛡️ EXPORT-BOUND: Allows execution if user has ANY export permission
export async function bulkMarkAsProcessed(submissionIds: string[]) {
  // 1. Authenticate & Fetch Profile
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Unauthorized');

  const { data } = await supabase
    .from('team_members' as any)
    .select('roles, status')
    .eq('id', user.id)
    .single();
    
  const profile = data as { roles: string[]; status: string } | null;
  if (!profile || profile.status !== 'active') throw new Error('Unauthorized');

  // 2. Verify they have AT LEAST one export permission
  const canExportTest = hasPermission(profile.roles, 'submissions:export_test');
  const canExportReal = hasPermission(profile.roles, 'submissions:export_real');

  if (!canExportTest && !canExportReal) {
    throw new Error('Forbidden: You must have export permissions to trigger this action.');
  }

  // 3. Execute bulk update
  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin
    .from('submissions')
    .update({ is_processed: true }) 
    .in('id', submissionIds);

  if (error) throw new Error('Failed to bulk update');
  return { success: true };
}