import { requirePermission } from '@/lib/auth-guards';
import { getFormBuilderPermissionsAction } from './actions';
import BuilderClient from './BuilderClient';

export default async function FormBuilderPage() {
  await requirePermission('forms:view_schema');
  const permissions = await getFormBuilderPermissionsAction();

  return <BuilderClient canEditPermission={permissions.canEdit} />;
}