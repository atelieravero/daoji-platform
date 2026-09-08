import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth-guards';
import { hasPermission, Role } from '@/lib/permissions';
import { listEventsAction } from './actions';
import EventsClient from './EventsClient';

export default async function EventsPage() {
  await requirePermission('events:view');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let roles: Role[] = [];
  if (user) {
    const { data: member } = await supabase
      .from('team_members')
      .select('roles, status')
      .eq('id', user.id)
      .single();
    if (member && member.status === 'active') {
      roles = (member.roles || []) as Role[];
    }
  }

  const permissions = {
    canView: hasPermission(roles, 'events:view'),
    canCreate: hasPermission(roles, 'events:create'),
    canEdit: hasPermission(roles, 'events:edit'),
    canDelete: hasPermission(roles, 'events:delete'),
    canPublish: hasPermission(roles, 'events:publish'),
  };

  const initialEventsRes = await listEventsAction({ status: 'all', limit: 50 });

  return (
    <EventsClient 
      permissions={permissions} 
      initialEvents={initialEventsRes.data}
      initialTotal={initialEventsRes.total}
    />
  );
}