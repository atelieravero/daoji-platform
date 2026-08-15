'use client';

import React, { useState, useEffect } from 'react';
import { getTeamMembers, inviteTeamMember, updateTeamMemberRoles, updateTeamMemberStatus } from './actions';
import { Role, ROLE_DEFINITIONS } from '@/lib/permissions';
import { FormInput } from '@/components/ui/FormControls';
import { 
  Users, Plus, Search, Shield, Loader2, 
  Mail, X, AlertCircle, Settings2
} from 'lucide-react';

// Define the assignable roles by filtering out super_admin
const ASSIGNABLE_ROLES = ROLE_DEFINITIONS.filter(r => r.id !== 'super_admin');

export default function TeamClient() {
  const [members, setMembers] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dropdown UI State for Table
  const [openRoleDropdown, setOpenRoleDropdown] = useState<string | null>(null);

  // Invite Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    displayName: '',
    roles: [] as Role[]
  });
  const [inviteError, setInviteError] = useState('');

  const loadTeam = async () => {
    setIsLoading(true);
    try {
      const { members, currentUserId } = await getTeamMembers();
      setMembers(members);
      setCurrentUserId(currentUserId);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTeam();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setIsInviting(true);
    try {
      await inviteTeamMember(inviteForm.email, inviteForm.displayName, inviteForm.roles);
      setShowInviteModal(false);
      setInviteForm({ email: '', displayName: '', roles: ['submission_viewer'] });
      loadTeam(); 
    } catch (err: any) {
      setInviteError(err.message || 'Failed to invite user.');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRoleToggle = async (memberId: string, roleToToggle: Role, currentRoles: Role[]) => {
    const updatedRoles = currentRoles.includes(roleToToggle)
      ? currentRoles.filter(r => r !== roleToToggle)
      : [...currentRoles, roleToToggle];
    
    try {
      // Optimistic UI update
      setMembers(members.map(m => m.id === memberId ? { ...m, roles: updatedRoles } : m));
      await updateTeamMemberRoles(memberId, updatedRoles);
    } catch (err: any) {
      alert(err.message || 'Failed to update roles.');
      loadTeam(); // Revert on failure
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'invited' | 'active' | 'suspended') => {
    try {
      setMembers(members.map(m => m.id === id ? { ...m, status: newStatus } : m));
      await updateTeamMemberStatus(id, newStatus);
    } catch (err: any) {
      alert(err.message || 'Failed to update status.');
      loadTeam(); 
    }
  };

  const filteredMembers = members.filter(m => 
    (m.display_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-8 h-full font-sans relative" onClick={() => setOpenRoleDropdown(null)}>
      
      {/* INVITE MODAL OVERLAY */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">Invite Team Member</h3>
              <button onClick={() => setShowInviteModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleInvite} className="p-6 space-y-5">
              {inviteError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start text-sm text-red-800">
                  <AlertCircle className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
                  <span>{inviteError}</span>
                </div>
              )}
              
              <div className="space-y-4">
                <FormInput 
                  label="Email Address"
                  icon={Mail}
                  type="email" 
                  required 
                  value={inviteForm.email} 
                  onChange={e => setInviteForm({...inviteForm, email: e.target.value})} 
                  placeholder="colleague@example.com" 
                />

                <FormInput 
                  label="Display Name"
                  type="text" 
                  required 
                  value={inviteForm.displayName} 
                  onChange={e => setInviteForm({...inviteForm, displayName: e.target.value})} 
                  placeholder="e.g., Alex Chen" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">System Roles (Multi-select)</label>
                <div className="space-y-2 bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                  {ASSIGNABLE_ROLES.map(role => (
                    <label key={role.id} className="flex items-center text-sm text-gray-700 cursor-pointer hover:bg-gray-100 p-1.5 rounded transition-colors">
                      <input 
                        type="checkbox" 
                        checked={inviteForm.roles.includes(role.id)} 
                        onChange={(e) => {
                          const newRoles = e.target.checked 
                            ? [...inviteForm.roles, role.id] 
                            : inviteForm.roles.filter(r => r !== role.id);
                          setInviteForm({...inviteForm, roles: newRoles});
                        }} 
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mr-3" 
                      />
                      {role.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setShowInviteModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={isInviting || inviteForm.roles.length === 0} className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg shadow-sm transition-colors">
                  {isInviting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Team Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage admin access, roles, and platform permissions.</p>
        </div>
        <button onClick={(e) => { e.stopPropagation(); setShowInviteModal(true); }} className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors">
          <Plus className="w-4 h-4 mr-2" />
          Invite User
        </button>
      </div>

      {/* TOOLBAR */}
      <div className="bg-white p-4 rounded-t-xl border border-gray-200 border-b-0 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search team members by name or email..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 outline-none transition-colors text-gray-900"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white border border-gray-200 rounded-b-xl shadow-sm overflow-visible">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-gray-500 text-sm">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600 mr-2" />
            Loading team members...
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-20 text-gray-500 text-sm">
            No team members found matching your search.
          </div>
        ) : (
          <div className="overflow-x-visible">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned Roles</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMembers.map((member) => {
                  const memberRoles = (member.roles || []) as Role[];
                  const isSelf = member.id === currentUserId;
                  const isSuperAdmin = memberRoles.includes('super_admin');

                  return (
                    <tr key={member.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-indigo-50 rounded-full flex items-center justify-center border border-indigo-100">
                            <Users className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center">
                              <span className="text-sm font-bold text-gray-900">{member.display_name}</span>
                              {isSelf && <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 uppercase">You</span>}
                            </div>
                            <div className="text-xs text-gray-500 font-mono mt-0.5">{member.email}</div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 relative">
                        {isSuperAdmin && (
                          <div className="mb-1"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 shadow-sm"><Shield className="w-3 h-3 mr-1" /> Super Admin</span></div>
                        )}
                        
                        {isSelf ? (
                          <div className="text-xs text-gray-500 italic max-w-xs truncate">
                            {memberRoles.filter(r => r !== 'super_admin').map(r => ASSIGNABLE_ROLES.find(ar => ar.id === r)?.label).join(', ') || (isSuperAdmin ? '' : 'No Roles Assigned')}
                          </div>
                        ) : (
                          <div className="relative">
                            <button 
                              onClick={(e) => { e.stopPropagation(); setOpenRoleDropdown(openRoleDropdown === member.id ? null : member.id); }}
                              className="flex items-center text-left max-w-[240px] px-3 py-1.5 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors focus:outline-none"
                            >
                              <Settings2 className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                              <span className="truncate">
                                {memberRoles.filter(r => r !== 'super_admin').length > 0 
                                  ? `${memberRoles.filter(r => r !== 'super_admin').length} Roles Assigned` 
                                  : 'Assign Roles...'}
                              </span>
                            </button>

                            {openRoleDropdown === member.id && (
                              <div onClick={e => e.stopPropagation()} className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                                <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">Modify Roles</div>
                                <div className="p-2 space-y-1">
                                  {ASSIGNABLE_ROLES.map(role => (
                                    <label key={role.id} className="flex items-center text-sm text-gray-700 cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors">
                                      <input 
                                        type="checkbox" 
                                        checked={memberRoles.includes(role.id)}
                                        onChange={() => handleRoleToggle(member.id, role.id, memberRoles)}
                                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mr-3" 
                                      />
                                      {role.label}
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {isSelf || isSuperAdmin ? (
                           <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            member.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            member.status === 'suspended' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                            'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {member.status}
                          </span>
                        ) : (
                          <select
                            value={member.status}
                            onChange={(e) => handleStatusChange(member.id, e.target.value as any)}
                            className={`text-xs font-bold rounded-full px-3 py-1 cursor-pointer focus:ring-2 focus:ring-indigo-500 outline-none appearance-none border-0 text-center uppercase tracking-wider ${
                              member.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                              member.status === 'suspended' ? 'bg-rose-100 text-rose-800' :
                              'bg-amber-100 text-amber-800'
                            }`}
                          >
                            <option value="invited">Invited</option>
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                          </select>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500 font-mono">
                        {new Date(member.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
    </div>
  );
}