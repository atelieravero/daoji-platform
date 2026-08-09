'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Calendar, 
  FolderOpen, 
  Globe, 
  LayoutList, 
  Tags, 
  Users, 
  LogOut,
  Leaf,
  History
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const navGroups = [
  {
    title: "Content",
    items: [
      { id: '/admin/events', label: 'Events', icon: Calendar },
      { id: '/admin/resources', label: 'Resources', icon: FolderOpen },
      { id: '/admin/pages', label: 'Pages (About)', icon: Globe },
    ]
  },
  {
    title: "Applications",
    items: [
      { id: '/admin/forms', label: 'Forms & Data', icon: LayoutList },
    ]
  },
  {
    title: "Settings",
    items: [
      { id: '/admin/tags', label: 'Tags & Filters', icon: Tags },
      { id: '/admin/team', label: 'Team Roles', icon: Users },
      { id: '/admin/logs', label: 'Audit Logs', icon: History },
    ]
  }
];

export default function AdminLayout({
  children,
}: {
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const currentPathname = usePathname() || '/admin/events';
  const isLoginPage = currentPathname === '/admin/login';
  const activePath = currentPathname === '/' || currentPathname === '/admin' ? '/admin/events' : currentPathname;

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  };

  // If we are on the login page, render only the children without the sidebar shell
  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex h-screen overflow-hidden bg-gray-100">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-gray-800">
          <Leaf className="w-6 h-6 text-indigo-400" />
          <span className="font-bold text-lg ml-3 tracking-tight">Daoji Admin</span>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 hide-scrollbar">
          {navGroups.map((group, idx) => (
            <div key={idx}>
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.items.map(item => {
                  const Icon = item.icon;
                  const isActive = activePath.startsWith(item.id);
                  return (
                    <a
                      key={item.id}
                      href={item.id}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isActive 
                          ? 'bg-indigo-600 text-white' 
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mr-3 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                      {item.label}
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Footer / Sign Out */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm">
              AD
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Administrator</p>
              <button 
                onClick={handleSignOut}
                className="text-xs text-gray-400 hover:text-white transition-colors flex items-center mt-0.5 cursor-pointer"
              >
                <LogOut className="w-3 h-3 mr-1" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
        {children || (
          <div className="flex-1 p-8 flex items-center justify-center text-gray-500">
            <p>Select a menu item to load the corresponding view.</p>
          </div>
        )}
      </main>
      
    </div>
  );
}