'use client';

import React, { useState, useEffect } from 'react';
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
  const [pathname, setPathname] = useState('/admin/team');

  // Fallback to safely get the current path in the browser if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPathname(window.location.pathname === '/' ? '/admin/team' : window.location.pathname);
    }
  }, []);

  return (
    <div className="min-h-screen flex h-screen overflow-hidden bg-gray-100">
      
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
                  const isActive = pathname.startsWith(item.id);
                  return (
                    <a
                      key={item.id}
                      href={item.id}
                      onClick={(e) => {
                        e.preventDefault();
                        setPathname(item.id);
                      }}
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

        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm">
              ML
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Master Lin</p>
              <button className="text-xs text-gray-400 hover:text-white transition-colors flex items-center mt-0.5">
                <LogOut className="w-3 h-3 mr-1" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </aside>

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