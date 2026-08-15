import { requirePermission } from '@/lib/auth-guards';
import { hasPermission } from '@/lib/permissions';
import SubmissionsClient from './SubmissionsClient';

export default async function FormSubmissionsPage({ params }: { params: Promise<{ form_id: string }> }) {
  const { form_id } = await params;

  // 1. PAGE GUARD: Baseline access is view_test (Form Editors and Submission Viewers pass)
  const { profile } = await requirePermission('submissions:view_test');

  // 2. UI RBAC: Calculate granular permissions
  const permissions = {
    canManage: hasPermission(profile.roles, 'submissions:manage'),
    canExport: hasPermission(profile.roles, 'submissions:export_real') || hasPermission(profile.roles, 'submissions:export_test'),
  };

  return <SubmissionsClient form_id={form_id} permissions={permissions} />;
}