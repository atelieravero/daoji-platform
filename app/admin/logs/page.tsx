import { requirePermission } from '@/lib/auth-guards';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import LogsClient from './LogsClient';

const getSupabaseAdmin = () => createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function LogsPage() {
  // PAGE GUARD: Strictly restrict audit log inspection to management roles[cite: 20]
  await requirePermission('team:manage_workers');

  const supabase = getSupabaseAdmin();
  const { data: initialLogs } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  return <LogsClient initialLogs={initialLogs || []} />;
}