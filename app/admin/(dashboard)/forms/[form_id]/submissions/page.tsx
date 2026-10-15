import { requirePermission } from '@/lib/auth-guards';
import { hasPermission } from '@/lib/permissions';
import SubmissionsClient from './SubmissionsClient';

interface PageProps {
  params: Promise<{ form_id?: string; id?: string }> | { form_id?: string; id?: string };
}

export default async function SubmissionsPage(props: PageProps) {
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
    canProcess: hasPermission(profile.roles, 'submissions:process'),
    canArchive: hasPermission(profile.roles, 'submissions:archive'),
  };

  return <SubmissionsClient form_id={formId} permissions={permissions} />;
}