'use server';

import { createClient as createAdminClient } from '@supabase/supabase-js';
import { requirePermission } from '@/lib/auth-guards';

const getSupabaseAdmin = () => createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getAuditLogs(filters?: { 
  search?: string; 
  operation?: string; 
  limit?: number; 
}) {
  await requirePermission('team:manage_workers');

  const supabase = getSupabaseAdmin();
  let query = supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(filters?.limit || 500);

  if (filters?.operation && filters.operation !== 'all') {
    query = query.eq('operation', filters.operation.toUpperCase());
  }

  if (filters?.search) {
    const term = filters.search.trim();
    query = query.or(
      `record_label.ilike.%${term}%,table_name.ilike.%${term}%,actor_email.ilike.%${term}%,actor_name.ilike.%${term}%,record_id.ilike.%${term}%`
    );
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching audit logs:', error);
    throw new Error('Failed to load audit logs.');
  }

  return data || [];
}