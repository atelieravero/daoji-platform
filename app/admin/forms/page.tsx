import { requirePermission } from '@/lib/auth-guards';
import { hasPermission } from '@/lib/permissions';
import FormsClient from './FormsClient';

export default async function FormsPage() {
  // 1. PAGE GUARD: Common baseline for Form Editors and Submission Viewers
  const { profile } = await requirePermission('submissions:view_test');

  // 2. UI RBAC: Granular permissions for the forms workspace
  const permissions = {
    canCreate: hasPermission(profile.roles, 'forms:create'),
    canEdit: hasPermission(profile.roles, 'forms:edit'),
    canDelete: hasPermission(profile.roles, 'forms:delete'),
    canUpdateStatus: hasPermission(profile.roles, 'forms:update_status'),
    canViewReal: hasPermission(profile.roles, 'submissions:view_real'),
    canExportReal: hasPermission(profile.roles, 'submissions:export_real'),
  };

  return <FormsClient permissions={permissions} />;
}