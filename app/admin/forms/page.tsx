import { requirePermission } from '@/lib/auth-guards';
import { hasPermission } from '@/lib/permissions';
import FormsClient from './FormsClient';

export default async function FormsPage() {
  // 1. PAGE GUARD: Require baseline access to view this page
  const { profile } = await requirePermission('submissions:view_test');

  // 2. UI RBAC: Calculate granular permissions to pass to the client
  const permissions = {
    canCreate: hasPermission(profile.roles, 'forms:create'),
    canEdit: hasPermission(profile.roles, 'forms:edit'),
    canDelete: hasPermission(profile.roles, 'forms:delete'),
    canUpdateStatus: hasPermission(profile.roles, 'forms:update_status'),
  };

  return <FormsClient permissions={permissions} />;
}