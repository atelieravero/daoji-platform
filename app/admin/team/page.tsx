'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Shield,
  ShieldAlert,
  Mail,
  X,
  Save,
  Check,
  UserCog,
  Ban,
  RefreshCw
} from 'lucide-react';

type Admin = {
  id: string;
  email: string;
  name: string;
  is_super_admin: boolean;
  can_manage_posts: boolean;
  can_manage_forms: boolean;
  can_view_submissions: boolean;
  status: 'active' | 'invited' | 'suspended';
};

const mockAdmins: Admin[] = [
  {
    id: 'adm_1',
    email: 'director@daoji.org',
    name: 'Master Lin',
    is_super_admin: true,
    can_manage_posts: true,
    can_manage_forms: true,
    can_view_submissions: true,
    status: 'active'
  },
  {
    id: 'adm_2',
    email: 'sarah.chen@daoji.org',
    name: 'Sarah Chen',
    is_super_admin: false,
    can_manage_posts: false,
    can_manage_forms: true,
    can_view_submissions: true,
    status: 'active'
  },
  {
    id: 'adm_3',
    email: 'volunteer_copy@daoji.org',
    name: 'John Writer',
    is_super_admin: false,
    can_manage_posts: true,
    can_manage_forms: false,
    can_view_submissions: false,
    status: 'invited'
  },
  {
    id: 'adm_4',
    email: 'former_staff@daoji.org',
    name: 'Alex Former',
    is_super_admin: false,
    can_manage_posts: false,
    can_manage_forms: false,
    can_view_submissions: false,
    status: 'suspended'
  }
];

export default function TeamPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Partial<Admin> | null>(null);

  // Mocking the logged-in user to demonstrate the self-lockout prevention
  const currentUserId = 'adm_1';

  const filteredAdmins = mockAdmins.filter(admin => 
    admin.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    admin.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (admin?: Admin) => {
    if (admin) {
      setEditingAdmin(admin);
    } else {
      setEditingAdmin({ 
        email: '', 
        name: '',
        is_super_admin: false,
        can_manage_posts: false,
        can_manage_forms: false,
        can_view_submissions: false
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setEditingAdmin(null), 200);
  };

  const renderPermissionBadges = (admin: Admin) => {
    if (admin.is_super_admin) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded bg-indigo-100 text-xs font-semibold text-indigo-800 border border-indigo-200">
          <ShieldAlert className="w-3 h-3 mr-1 text-indigo-600" />
          Super Admin
        </span>
      );
    }

    if (admin.status === 'suspended') {
      return <span className="text-xs text-gray-400 italic">Access Revoked</span>;
    }

    const badges = [];
    if (admin.can_manage_posts) badges.push('Content');
    if (admin.can_manage_forms) badges.push('Forms');
    if (admin.can_view_submissions) badges.push('Data Export');

    if (badges.length === 0) {
      return <span className="text-xs text-gray-400 italic">No modules assigned</span>;
    }

    return (
      <div className="flex gap-1.5">
        {badges.map(badge => (
          <span key={badge} className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-xs font-medium text-slate-700 border border-slate-200">
            {badge}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-8 h-full relative">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Team Roles & Permissions</h1>
          <p className="text-sm text-gray-500 mt-1">Manage who can edit content, build forms, and view applicant data.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
        >
          <Plus className="w-4 h-4 mr-2" />
          Invite Member
        </button>
      </div>

      <div className="bg-white p-4 rounded-t-xl border border-gray-200 border-b-0 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by name or email..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 outline-none transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-b-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-2/5">
                  Team Member
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Access Level
                </th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAdmins.map((admin) => (
                <tr key={admin.id} className={`hover:bg-gray-50/80 transition-colors group ${admin.status === 'suspended' ? 'opacity-60 grayscale-[50%]' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm ${admin.status === 'suspended' ? 'bg-gray-200 text-gray-500' : 'bg-indigo-100 text-indigo-700'}`}>
                        {admin.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className={`text-sm font-semibold ${admin.status === 'suspended' ? 'text-gray-600 line-through' : 'text-gray-900'}`}>{admin.name}</div>
                        <div className="text-sm text-gray-500 mt-0.5">{admin.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {renderPermissionBadges(admin)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {admin.status === 'active' ? (
                       <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                         <Check className="w-3 h-3 mr-1" /> Active
                       </span>
                    ) : admin.status === 'invited' ? (
                       <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                         <Mail className="w-3 h-3 mr-1" /> Invited
                       </span>
                    ) : (
                       <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                         <Ban className="w-3 h-3 mr-1" /> Suspended
                       </span>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleOpenModal(admin)}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" 
                        title="Edit Permissions"
                      >
                        <UserCog className="w-4 h-4" />
                      </button>
                      
                      {/* Safety Check: You cannot suspend yourself if you are the logged in user */}
                      {admin.id === currentUserId ? (
                        <button 
                          className="p-1.5 text-gray-300 cursor-not-allowed rounded-md" 
                          title="You cannot suspend your own account"
                          disabled
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      ) : admin.status === 'suspended' ? (
                        <button 
                          className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                          title="Reactivate User"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      ) : (
                        <button 
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Suspend User"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div 
          className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm z-40 transition-opacity"
          onClick={handleCloseModal}
        />
      )}

      <div 
        className={`absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col border-l border-gray-200 ${
          isModalOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 shrink-0 bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-indigo-600" />
            {editingAdmin?.id ? 'Edit Permissions' : 'Invite Team Member'}
          </h2>
          <button 
            onClick={handleCloseModal}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={editingAdmin?.name || ''}
                onChange={(e) => setEditingAdmin({ ...editingAdmin, name: e.target.value })}
                placeholder="e.g. Jane Doe"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={editingAdmin?.email || ''}
                disabled={!!editingAdmin?.id}
                onChange={(e) => setEditingAdmin({ ...editingAdmin, email: e.target.value })}
                placeholder="jane@daoji.org"
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                  editingAdmin?.id ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'
                }`}
              />
            </div>
          </div>

          <hr className="border-gray-100" />

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Module Access</h3>
            
            <div className="flex items-center justify-between py-3 px-4 bg-indigo-50 border border-indigo-100 rounded-xl">
              <div>
                <span className="text-sm font-bold text-indigo-900">Super Admin</span>
                <p className="text-xs text-indigo-700/80 mt-0.5 pr-4">Unrestricted access to all data, settings, and team management.</p>
              </div>
              <button 
                onClick={() => setEditingAdmin({ ...editingAdmin, is_super_admin: !editingAdmin?.is_super_admin })}
                disabled={editingAdmin?.id === currentUserId}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
                  editingAdmin?.is_super_admin ? 'bg-indigo-600' : 'bg-gray-300'
                } ${editingAdmin?.id === currentUserId ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  editingAdmin?.is_super_admin ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </button>
            </div>

            <div className={`space-y-2 transition-opacity duration-200 ${editingAdmin?.is_super_admin ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              <div className="flex items-center justify-between py-2">
                <div>
                  <span className="text-sm font-medium text-gray-900">Manage Content</span>
                  <p className="text-xs text-gray-500">Create, edit, and publish Events, Pages, and Resources.</p>
                </div>
                <button 
                  onClick={() => setEditingAdmin({ ...editingAdmin, can_manage_posts: !editingAdmin?.can_manage_posts })}
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none bg-gray-200 ${
                    editingAdmin?.can_manage_posts || editingAdmin?.is_super_admin ? 'bg-emerald-500' : 'bg-gray-200'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    editingAdmin?.can_manage_posts || editingAdmin?.is_super_admin ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <span className="text-sm font-medium text-gray-900">Manage Forms</span>
                  <p className="text-xs text-gray-500">Build questionnaires, edit schemas, and open/close forms.</p>
                </div>
                <button 
                  onClick={() => setEditingAdmin({ ...editingAdmin, can_manage_forms: !editingAdmin?.can_manage_forms })}
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none bg-gray-200 ${
                    editingAdmin?.can_manage_forms || editingAdmin?.is_super_admin ? 'bg-emerald-500' : 'bg-gray-200'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    editingAdmin?.can_manage_forms || editingAdmin?.is_super_admin ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <span className="text-sm font-medium text-gray-900">View & Export Data</span>
                  <p className="text-xs text-gray-500">Access PII and export Submissions CSVs to Coda.</p>
                </div>
                <button 
                  onClick={() => setEditingAdmin({ ...editingAdmin, can_view_submissions: !editingAdmin?.can_view_submissions })}
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none bg-gray-200 ${
                    editingAdmin?.can_view_submissions || editingAdmin?.is_super_admin ? 'bg-emerald-500' : 'bg-gray-200'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    editingAdmin?.can_view_submissions || editingAdmin?.is_super_admin ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 shrink-0 flex justify-end space-x-3">
          <button 
            onClick={handleCloseModal}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors">
            {editingAdmin?.id ? (
              <Save className="w-4 h-4 mr-2" />
            ) : (
              <Mail className="w-4 h-4 mr-2" />
            )}
            {editingAdmin?.id ? 'Save Permissions' : 'Send Invite Link'}
          </button>
        </div>
      </div>

    </div>
  );
}