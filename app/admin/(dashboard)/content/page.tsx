// app/admin/(dashboard)/content/page.tsx
import React from 'react';
import { redirect } from 'next/navigation';
import { getContentPermissionsAction, listContentPagesAction } from './actions';
import ContentClient from './ContentClient';

export const dynamic = 'force-dynamic';

export default async function AdminContentListPage() {
  const permissions = await getContentPermissionsAction();

  if (!permissions.canView) {
    redirect('/admin');
  }

  const initialList = await listContentPagesAction({ limit: 50 });

  return (
    <ContentClient
      permissions={permissions}
      initialItems={initialList.data}
      initialTotal={initialList.total}
    />
  );
}