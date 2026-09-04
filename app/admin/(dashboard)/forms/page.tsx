import { createClient } from '@/lib/supabase/server';
import { hasPermission, Role } from '@/lib/permissions';
import { requirePermission } from '@/lib/auth-guards';
import FormsClient from './FormsClient';

export default async function FormsPage() {
  await requirePermission('forms:view');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let roles: Role[] = [];
  if (user) {
    const { data: member } = await supabase
      .from('team_members')
      .select('roles, status')
      .eq('id', user.id)
      .single();
    if (member && member.status === 'active') {
      roles = (member.roles || []) as Role[];
    }
  }

  const permissions = {
    canView: hasPermission(roles, 'forms:view'),
    canViewSchema: hasPermission(roles, 'forms:view_schema'),
    canCreate: hasPermission(roles, 'forms:create'),
    canEdit: hasPermission(roles, 'forms:edit'),
    canDelete: hasPermission(roles, 'forms:delete'),
    canUpdateStatus: hasPermission(roles, 'forms:update_status'),
  };

  return <FormsClient permissions={permissions} />;
}