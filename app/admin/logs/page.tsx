import { requirePermission } from '@/lib/auth-guards';
import LogsClient from './LogsClient';

export default async function LogsPage() {
  // PAGE GUARD: Strictly restrict audit log inspection to management roles
  const { profile } = await requirePermission('team:manage_workers');

  return <LogsClient />;
}