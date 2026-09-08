import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { hasPermission, Role } from '@/lib/permissions';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // 1. Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/admin/login');
  }

  // 2. Fetch team member profile with roles
  const { data: member } = await supabase
    .from('team_members')
    .select('*')
    .eq('id', user.id)
    .single();

  const userRoles = (member?.roles as Role[]) || [];

  // Server Action for secure signout
  async function handleSignOut() {
    'use server';
    const supabaseClient = await createClient();
    await supabaseClient.auth.signOut();
    redirect('/admin/login');
  }

  // Evaluate module access permissions
  const canViewEvents = hasPermission(userRoles, 'events:view');
  const canViewArticles = hasPermission(userRoles, 'articles:view');
  const canViewResources = hasPermission(userRoles, 'resources:view');
  const canViewForms = hasPermission(userRoles, 'forms:view');
  const canViewAssets = hasPermission(userRoles, 'assets:view');
  const canViewTags = hasPermission(userRoles, 'tags:view');
  const canViewTeam = hasPermission(userRoles, 'team:view');
  const canViewLogs = hasPermission(userRoles, 'logs:view');

  const roleName = userRoles[0]?.replace(/_/g, ' ') || 'Member';

  return (
    <div className="flex h-screen bg-gray-100 font-sans antialiased overflow-hidden">
      {/* EXTRACTED COLLAPSIBLE SIDEBAR */}
      <AdminSidebar
        userEmail={user.email || ''}
        displayName={member?.display_name || null}
        roleName={roleName}
        canViewEvents={canViewEvents}
        canViewArticles={canViewArticles}
        canViewResources={canViewResources}
        canViewForms={canViewForms}
        canViewAssets={canViewAssets}
        canViewTags={canViewTags}
        canViewTeam={canViewTeam}
        canViewLogs={canViewLogs}
        signOutAction={handleSignOut}
      />

      {/* MAIN CONTENT WORKSPACE */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gray-50">
        {children}
      </main>
    </div>
  );
}