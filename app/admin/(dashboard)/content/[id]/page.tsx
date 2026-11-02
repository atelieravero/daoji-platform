// app/admin/(dashboard)/content/[id]/page.tsx
import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { getContentPageAction, getContentPermissionsAction } from '../actions';
import ContentPageEditor from './ContentPageEditor';

export const dynamic = 'force-dynamic';

interface ContentEditorPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminContentEditorPage({ params }: ContentEditorPageProps) {
  const { id } = await params;
  const permissions = await getContentPermissionsAction();

  if (!permissions.canView) {
    redirect('/admin');
  }

  if (id === 'new') {
    if (!permissions.canCreate) {
      redirect('/admin/content');
    }
    return <ContentPageEditor isNew permissions={permissions} />;
  }

  const { data, error } = await getContentPageAction(id);
  if (error || !data) {
    notFound();
  }

  const initialEvents = (data.event_articles || [])
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((ea) => ea.events)
    .filter((evt): evt is NonNullable<typeof evt> => Boolean(evt));

  return (
    <ContentPageEditor
      initialItem={data}
      initialEvents={initialEvents}
      permissions={permissions}
    />
  );
}