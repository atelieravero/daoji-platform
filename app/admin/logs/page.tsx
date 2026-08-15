import { requirePermission } from '@/lib/auth-guards';
import LogsClient from './LogsClient';

export default async function AuditLogsPage() {
  // 1. PAGE GUARD: Audit logs are highly sensitive. 
  // We restrict this to users who have team management capabilities.
  await requirePermission('team:manage_workers');

  return <LogsClient />;
}