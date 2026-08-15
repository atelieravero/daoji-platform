'use client';

import React, { useEffect, useState } from 'react';
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
  History,
  Loader2
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Role, SystemAction, hasPermission } from '@/lib/permissions';

const NAV_GROUPS: { title: string, items: { id: string, label: string, icon: any, requiredActions: SystemAction[] }[] }[] = [
  {
    title: "Content",
    items: [
      { id: '/admin/events', label: 'Events', icon: Calendar, requiredActions: ['content:edit'] },
      { id: '/admin/resources', label: 'Resources', icon: FolderOpen, requiredActions: ['content:edit'] },
      { id: '/admin/pages', label: 'Pages (About)', icon: Globe, requiredActions: ['content:edit'] },
    ]
  },
  {
    title: "Applications",
    items: [
      { id: '/admin/forms', label: 'Forms & Data', icon: LayoutList, requiredActions: ['forms:edit', 'submissions:view_test', 'submissions:view_real'] },
    ]
  },
  {
    title: "Settings",
    items: [
      { id: '/admin/tags', label: 'Tags & Filters', icon: Tags, requiredActions: ['content:edit'] },
      { id: '/admin/team', label: 'Team Roles', icon: Users, requiredActions: ['team:manage_workers'] },
      { id: '/admin/logs', label: 'Audit Logs', icon: History, requiredActions: ['team:manage_workers'] },
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
  
  const isAuthPage = 
    currentPathname.startsWith('/admin/login') ||
    currentPathname.startsWith('/admin/setup-password') ||
    currentPathname.startsWith('/admin/forgot-password');

  const activePath = currentPathname === '/' || currentPathname === '/admin' ? '/admin/events' : currentPathname;

  const [userRoles, setUserRoles] = useState<Role[]>([]);
  const [userProfile, setUserProfile] = useState<{ name: string, initials: string }>({ name: 'Administrator', initials: 'AD' });
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    if (isAuthPage) {
      setIsLoadingAuth(false);
      return;
    }
    
    async function fetchUserAccess() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data } = await supabase
          .from('team_members')
          .select('roles, display_name, status')
          .eq('id', user.id)
          .single();

        // Hard kick if status is not active
        if (!data || data.status !== 'active') {
          await supabase.auth.signOut();
          router.push('/admin/login?error=account_suspended');
          return;
        }

        setUserRoles((data.roles || []) as Role[]);
        const name = data.display_name || 'Administrator';
        const initials = name.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'AD';
        setUserProfile({ name, initials });
      } else {
        router.push('/admin/login');
      }
      setIsLoadingAuth(false);
    }
    
    fetchUserAccess();
  }, [isAuthPage, router]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  };

  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {children}
      </div>
    );
  }

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex h-screen items-center justify-center bg-gray-100">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const visibleGroups = NAV_GROUPS.map(group => ({
    ...group,
    items: group.items.filter(item => item.requiredActions.some(action => hasPermission(userRoles, action)))
  })).filter(group => group.items.length > 0);

  return (
    <div className="min-h-screen flex h-screen overflow-hidden bg-gray-100">
      <aside className="w-64 bg-gray-900 text-white flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-gray-800">
          <Leaf className="w-6 h-6 text-indigo-400" />
          <span className="font-bold text-lg ml-3 tracking-tight">Daoji Admin</span>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 hide-scrollbar">
          {visibleGroups.map((group, idx) => (
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

        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm">
              {userProfile.initials}
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{userProfile.name}</p>
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