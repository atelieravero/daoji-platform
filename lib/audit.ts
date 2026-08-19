import { createClient } from '@supabase/supabase-js';

const getSupabaseAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface LogEventParams {
  actorId?: string;
  actorEmail?: string;
  action: string;
  level?: 'info' | 'warn' | 'error';
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, any>;
}

export async function logEvent({
  actorId,
  actorEmail,
  action,
  level = 'info',
  targetType,
  targetId,
  metadata = {}
}: LogEventParams) {
  try {
    const supabase = getSupabaseAdmin();
    await supabase.from('audit_logs').insert({
      actor_id: actorId,
      actor_email: actorEmail,
      action,
      level,
      target_type: targetType,
      target_id: targetId,
      metadata
    });
  } catch (err) {
    // Non-blocking: Logging failure should never break active user mutations
    console.error('[AUDIT LOG FAILED]', err);
  }
}