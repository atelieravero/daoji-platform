import { requirePermission } from '@/lib/auth-guards';
import BuilderClient from './BuilderClient';

export default async function FormBuilderPage() {
  // 1. PAGE GUARD: Strictly limit access to Form Editors (and Super Admins)
  await requirePermission('forms:edit');

  return <BuilderClient />;
}