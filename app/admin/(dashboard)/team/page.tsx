import { requirePermission } from '@/lib/auth-guards';
import TeamClient from './TeamClient';

export default async function TeamPage() {
  // 1. PAGE GUARD: Strictly limit access to users with oversight capabilities.
  await requirePermission('team:manage_workers');

  return <TeamClient />;
}