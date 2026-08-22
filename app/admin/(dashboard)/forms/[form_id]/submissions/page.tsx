import { requirePermission } from '@/lib/auth-guards';
import { hasPermission } from '@/lib/permissions';
import SubmissionsClient from './SubmissionsClient';

interface PageProps {
  params: Promise<{ form_id?: string; id?: string }> | { form_id?: string; id?: string };
}

export default async function SubmissionsPage(props: PageProps) {
  // Support both Next.js 15 (Promise params) and Next.js 14 (object params)
  const resolvedParams = await Promise.resolve(props.params);
  const formId = resolvedParams.form_id || resolvedParams.id;

  if (!formId) {
    throw new Error('Route Error: Missing form ID parameter in URL.');
  }

  // 1. PAGE GUARD: Minimum requirement to access this route
  const { profile } = await requirePermission('submissions:view_test');

  // 2. UI RBAC Permissions
  const permissions = {
    canViewTest: hasPermission(profile.roles, 'submissions:view_test'),
    canViewReal: hasPermission(profile.roles, 'submissions:view_real'),
    canExport: hasPermission(profile.roles, 'submissions:export_real') || hasPermission(profile.roles, 'submissions:export_test'),
    canManage: hasPermission(profile.roles, 'submissions:manage'),
  };

  return <SubmissionsClient form_id={formId} permissions={permissions} />;
}