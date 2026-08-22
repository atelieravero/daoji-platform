import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { hasPermission, Role } from '@/lib/permissions';
import { 
  LayoutDashboard, FileSpreadsheet, Users, History, 
  Image as ImageIcon, Tag as TagIcon, Calendar, BookOpen, 
  FileText, LogOut, ShieldCheck 
} from 'lucide-react';

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

  // Super admin bypass or permission evaluations
  const canViewForms = hasPermission(userRoles, 'forms:view');
  const canViewTeam = hasPermission(userRoles, 'team:view');
  const canViewLogs = hasPermission(userRoles, 'logs:view');
  const canViewAssets = hasPermission(userRoles, 'assets:view');
  const canViewTags = hasPermission(userRoles, 'tags:view');
  const canViewEvents = hasPermission(userRoles, 'events:view');
  const canViewArticles = hasPermission(userRoles, 'articles:view');
  const canViewResources = hasPermission(userRoles, 'resources:view');

  return (
    <div className="flex h-screen bg-gray-100 font-sans antialiased overflow-hidden">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 border-r border-slate-800">
        
        {/* TOP BRAND & NAV ITEMS */}
        <div className="flex flex-col flex-1 overflow-y-auto">
          
          {/* LOGO */}
          <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950/50">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold mr-3 shadow-md">
              道
            </div>
            <div>
              <span className="font-bold text-white text-sm tracking-wide">Daoji Admin</span>
              <span className="block text-[10px] text-slate-500 font-mono">Platform v2.0</span>
            </div>
          </div>

          {/* NAVIGATION GROUPS */}
          <nav className="p-4 space-y-6">
            
            {/* CONTENT & OPERATIONS */}
            <div>
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Operations & Content
              </span>
              <div className="mt-2 space-y-1">
                {canViewEvents && (
                  <Link
                    href="/admin/events"
                    className="flex items-center px-3 py-2 text-xs font-semibold rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    <Calendar className="w-4 h-4 mr-2.5 text-indigo-400" />
                    Events
                  </Link>
                )}

                {canViewArticles && (
                  <Link
                    href="/admin/articles"
                    className="flex items-center px-3 py-2 text-xs font-semibold rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    <FileText className="w-4 h-4 mr-2.5 text-sky-400" />
                    Articles & Pages
                  </Link>
                )}

                {canViewResources && (
                  <Link
                    href="/admin/resources"
                    className="flex items-center px-3 py-2 text-xs font-semibold rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    <BookOpen className="w-4 h-4 mr-2.5 text-amber-400" />
                    Knowledge Hub
                  </Link>
                )}

                {canViewForms && (
                  <Link
                    href="/admin/forms"
                    className="flex items-center px-3 py-2 text-xs font-semibold rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-2.5 text-emerald-400" />
                    Forms & Submissions
                  </Link>
                )}
              </div>
            </div>

            {/* SHARED ASSETS & TAXONOMY (SPRINT 15) */}
            {(canViewAssets || canViewTags) && (
              <div>
                <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Shared Foundation
                </span>
                <div className="mt-2 space-y-1">
                  {canViewAssets && (
                    <Link
                      href="/admin/assets"
                      className="flex items-center px-3 py-2 text-xs font-semibold rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      <ImageIcon className="w-4 h-4 mr-2.5 text-pink-400" />
                      Media Pool
                    </Link>
                  )}

                  {canViewTags && (
                    <Link
                      href="/admin/tags"
                      className="flex items-center px-3 py-2 text-xs font-semibold rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      <TagIcon className="w-4 h-4 mr-2.5 text-purple-400" />
                      Taxonomy & Tags
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* ADMINISTRATION */}
            {(canViewTeam || canViewLogs) && (
              <div>
                <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Administration
                </span>
                <div className="mt-2 space-y-1">
                  {canViewTeam && (
                    <Link
                      href="/admin/team"
                      className="flex items-center px-3 py-2 text-xs font-semibold rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      <Users className="w-4 h-4 mr-2.5 text-slate-400" />
                      Team Members
                    </Link>
                  )}

                  {canViewLogs && (
                    <Link
                      href="/admin/logs"
                      className="flex items-center px-3 py-2 text-xs font-semibold rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      <History className="w-4 h-4 mr-2.5 text-slate-400" />
                      Audit Logs
                    </Link>
                  )}
                </div>
              </div>
            )}

          </nav>
        </div>

        {/* USER PROFILE & LOGOUT FOOTER */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5 truncate">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-200 shrink-0">
                {member?.display_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="truncate">
                <span className="block text-xs font-medium text-white truncate">
                  {member?.display_name || user.email}
                </span>
                <div className="flex items-center text-[10px] text-slate-400">
                  <ShieldCheck className="w-3 h-3 mr-1 text-emerald-400" />
                  <span className="capitalize">{userRoles[0]?.replace(/_/g, ' ') || 'Member'}</span>
                </div>
              </div>
            </div>
            
            <form action={handleSignOut}>
              <button 
                type="submit" 
                title="Sign out"
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

      </aside>

      {/* MAIN CONTENT WORKSPACE */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gray-50">
        {children}
      </main>

    </div>
  );
}