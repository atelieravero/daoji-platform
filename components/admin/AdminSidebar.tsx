'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Calendar, FileText, BookOpen, FileSpreadsheet, 
  Image as ImageIcon, Tag as TagIcon, Users, History, 
  LogOut, ShieldCheck, PanelLeftClose, PanelLeft
} from 'lucide-react';

interface AdminSidebarProps {
  userEmail: string;
  displayName: string | null;
  roleName: string;
  canViewEvents: boolean;
  canViewArticles: boolean;
  canViewResources: boolean;
  canViewForms: boolean;
  canViewAssets: boolean;
  canViewTags: boolean;
  canViewTeam: boolean;
  canViewLogs: boolean;
  signOutAction: () => Promise<void>;
}

export default function AdminSidebar({
  userEmail,
  displayName,
  roleName,
  canViewEvents,
  canViewArticles,
  canViewResources,
  canViewForms,
  canViewAssets,
  canViewTags,
  canViewTeam,
  canViewLogs,
  signOutAction,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Sync collapsed state with localStorage on client mount
  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem('daoji_admin_sidebar_collapsed');
    if (saved === 'true') {
      setIsCollapsed(true);
    }
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('daoji_admin_sidebar_collapsed', String(next));
      return next;
    });
  };

  const isRouteActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  const navItemClass = (href: string) => {
    const active = isRouteActive(href);
    return `flex items-center rounded-xl text-xs font-semibold transition-colors ${
      isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2'
    } ${
      active
        ? 'bg-slate-800 text-white shadow-xs'
        : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
    }`;
  };

  return (
    <aside
      className={`bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 border-r border-slate-800 transition-all duration-200 ease-in-out select-none ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* TOP BRAND & NAV ITEMS */}
      <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        
        {/* LOGO & COLLAPSE TOGGLE */}
        <div
          className={`h-16 flex items-center border-b border-slate-800 bg-slate-950/50 shrink-0 ${
            isCollapsed ? 'justify-center px-2' : 'justify-between px-4'
          }`}
        >
          <div className="flex items-center overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shrink-0 shadow-md">
              道
            </div>
            {!isCollapsed && (
              <div className="ml-3 truncate">
                <span className="font-bold text-white text-sm tracking-wide block">Daoji Admin</span>
                <span className="block text-[10px] text-slate-500 font-mono">Platform v2.0</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={toggleCollapse}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            {isCollapsed ? (
              <PanelLeft className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* NAVIGATION GROUPS */}
        <nav className={`py-4 space-y-6 ${isCollapsed ? 'px-2' : 'px-3'}`}>
          
          {/* GROUP 1: OPERATIONS & CONTENT */}
          <div>
            {!isCollapsed && (
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Operations & Content
              </span>
            )}
            <div className="space-y-1">
              {canViewEvents && (
                <Link
                  href="/admin/events"
                  title={isCollapsed ? 'Events' : undefined}
                  className={navItemClass('/admin/events')}
                >
                  <Calendar className={`w-4 h-4 shrink-0 text-indigo-400 ${!isCollapsed ? 'mr-2.5' : ''}`} />
                  {!isCollapsed && <span className="truncate">Events</span>}
                </Link>
              )}

              {canViewArticles && (
                <Link
                  href="/admin/articles"
                  title={isCollapsed ? 'Articles & Pages' : undefined}
                  className={navItemClass('/admin/articles')}
                >
                  <FileText className={`w-4 h-4 shrink-0 text-sky-400 ${!isCollapsed ? 'mr-2.5' : ''}`} />
                  {!isCollapsed && <span className="truncate">Articles & Pages</span>}
                </Link>
              )}

              {canViewResources && (
                <Link
                  href="/admin/resources"
                  title={isCollapsed ? 'Knowledge Hub' : undefined}
                  className={navItemClass('/admin/resources')}
                >
                  <BookOpen className={`w-4 h-4 shrink-0 text-amber-400 ${!isCollapsed ? 'mr-2.5' : ''}`} />
                  {!isCollapsed && <span className="truncate">Knowledge Hub</span>}
                </Link>
              )}

              {canViewForms && (
                <Link
                  href="/admin/forms"
                  title={isCollapsed ? 'Forms & Submissions' : undefined}
                  className={navItemClass('/admin/forms')}
                >
                  <FileSpreadsheet className={`w-4 h-4 shrink-0 text-emerald-400 ${!isCollapsed ? 'mr-2.5' : ''}`} />
                  {!isCollapsed && <span className="truncate">Forms & Submissions</span>}
                </Link>
              )}
            </div>
          </div>

          {/* GROUP 2: SHARED FOUNDATION */}
          {(canViewAssets || canViewTags) && (
            <div>
              {!isCollapsed ? (
                <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Shared Foundation
                </span>
              ) : (
                <hr className="border-slate-800 my-2" />
              )}
              <div className="space-y-1">
                {canViewAssets && (
                  <Link
                    href="/admin/assets"
                    title={isCollapsed ? 'Media Pool' : undefined}
                    className={navItemClass('/admin/assets')}
                  >
                    <ImageIcon className={`w-4 h-4 shrink-0 text-pink-400 ${!isCollapsed ? 'mr-2.5' : ''}`} />
                    {!isCollapsed && <span className="truncate">Media Pool</span>}
                  </Link>
                )}

                {canViewTags && (
                  <Link
                    href="/admin/tags"
                    title={isCollapsed ? 'Taxonomy & Tags' : undefined}
                    className={navItemClass('/admin/tags')}
                  >
                    <TagIcon className={`w-4 h-4 shrink-0 text-purple-400 ${!isCollapsed ? 'mr-2.5' : ''}`} />
                    {!isCollapsed && <span className="truncate">Taxonomy & Tags</span>}
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* GROUP 3: ADMINISTRATION */}
          {(canViewTeam || canViewLogs) && (
            <div>
              {!isCollapsed ? (
                <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Administration
                </span>
              ) : (
                <hr className="border-slate-800 my-2" />
              )}
              <div className="space-y-1">
                {canViewTeam && (
                  <Link
                    href="/admin/team"
                    title={isCollapsed ? 'Team Members' : undefined}
                    className={navItemClass('/admin/team')}
                  >
                    <Users className={`w-4 h-4 shrink-0 text-slate-400 ${!isCollapsed ? 'mr-2.5' : ''}`} />
                    {!isCollapsed && <span className="truncate">Team Members</span>}
                  </Link>
                )}

                {canViewLogs && (
                  <Link
                    href="/admin/logs"
                    title={isCollapsed ? 'Audit Logs' : undefined}
                    className={navItemClass('/admin/logs')}
                  >
                    <History className={`w-4 h-4 shrink-0 text-slate-400 ${!isCollapsed ? 'mr-2.5' : ''}`} />
                    {!isCollapsed && <span className="truncate">Audit Logs</span>}
                  </Link>
                )}
              </div>
            </div>
          )}

        </nav>
      </div>

      {/* USER PROFILE & LOGOUT FOOTER */}
      <div className={`border-t border-slate-800 bg-slate-950/40 p-3 shrink-0`}>
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-200 shrink-0"
              title={`${displayName || userEmail} (${roleName})`}
            >
              {displayName?.charAt(0) || userEmail?.charAt(0).toUpperCase()}
            </div>
            <form action={signOutAction}>
              <button
                type="submit"
                title="Sign out"
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5 truncate">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-200 shrink-0">
                {displayName?.charAt(0) || userEmail?.charAt(0).toUpperCase()}
              </div>
              <div className="truncate">
                <span className="block text-xs font-medium text-white truncate">
                  {displayName || userEmail}
                </span>
                <div className="flex items-center text-[10px] text-slate-400">
                  <ShieldCheck className="w-3 h-3 mr-1 text-emerald-400 shrink-0" />
                  <span className="capitalize truncate">{roleName}</span>
                </div>
              </div>
            </div>
            
            <form action={signOutAction}>
              <button
                type="submit"
                title="Sign out"
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </aside>
  );
}