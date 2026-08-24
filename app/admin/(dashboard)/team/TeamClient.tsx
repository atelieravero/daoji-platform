'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, Plus, Shield, Loader2, Mail, X, 
  AlertCircle, CheckCircle2, RotateCcw, 
  UserCheck, Clock, UserX, ChevronDown, Check
} from 'lucide-react';
import { 
  getTeamMembers, 
  inviteTeamMember, 
  resendInvite,
  updateTeamMemberRoles, 
  updateTeamMemberStatus 
} from './actions';
import { Role, ROLE_DEFINITIONS, canAssignRole } from '@/lib/permissions';
import { FormInput } from '@/components/ui/FormControls';
import AdminPageHeader from '@/components/admin/shared/AdminPageHeader';
import AdminTableToolbar from '@/components/admin/shared/AdminTableToolbar';
import AdminTableCard from '@/components/admin/shared/AdminTableCard';

const ROLE_BADGE_STYLES: Record<string, string> = {
  super_admin: 'bg-purple-50 text-purple-700 border-purple-200',
  team_manager: 'bg-blue-50 text-blue-700 border-blue-200',
  form_editor: 'bg-amber-50 text-amber-700 border-amber-200',
  submission_viewer: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  content_editor: 'bg-sky-50 text-sky-700 border-sky-200',
};

function getInitials(name?: string, email?: string): string {
  if (name && name.trim()) {
    return name.split(' ').filter(Boolean).map((n) => n[0]).join('').substring(0, 2).toUpperCase();
  }
  return (email?.substring(0, 2) || 'AD').toUpperCase();
}

export default function TeamClient() {
  const [members, setMembers] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Interactive UI States
  const [openRoleMenuId, setOpenRoleMenuId] = useState<string | null>(null);
  const [openStatusMenuId, setOpenStatusMenuId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Invite Modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    displayName: '',
    roles: [] as Role[],
  });
  const [inviteError, setInviteError] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadTeam = async () => {
    setIsLoading(true);
    try {
      const { members, currentUserId } = await getTeamMembers();
      setMembers(members || []);
      setCurrentUserId(currentUserId);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load team members.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTeam();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenRoleMenuId(null);
        setOpenStatusMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentUserRoles = useMemo<string[]>(() => {
    return members.find((m) => m.id === currentUserId)?.roles || [];
  }, [members, currentUserId]);

  const assignableRoles = useMemo(() => {
    return ROLE_DEFINITIONS.filter((r) => canAssignRole(currentUserRoles, r.id));
  }, [currentUserRoles]);

  const stats = useMemo(() => {
    return {
      total: members.length,
      active: members.filter((m) => m.status === 'active').length,
      invited: members.filter((m) => m.status === 'invited').length,
      suspended: members.filter((m) => m.status === 'suspended').length,
    };
  }, [members]);

  const handleInvite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setInviteError('');
    setIsInviting(true);
    try {
      await inviteTeamMember(inviteForm.email.trim(), inviteForm.displayName.trim(), inviteForm.roles);
      setShowInviteModal(false);
      setInviteForm({ email: '', displayName: '', roles: [] });
      showToast('success', `Invitation sent to ${inviteForm.email}`);
      loadTeam(); 
    } catch (err: any) {
      setInviteError(err.message || 'Failed to invite user.');
    } finally {
      setIsInviting(false);
    }
  };

  const handleResendInvite = async (memberId: string, email: string) => {
    setResendingId(memberId);
    try {
      await resendInvite(memberId);
      showToast('success', `Invitation link resent to ${email}`);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to resend invitation.');
    } finally {
      setResendingId(null);
    }
  };

  const handleRoleToggle = async (memberId: string, roleToToggle: Role, currentRoles: Role[]) => {
    const updatedRoles = currentRoles.includes(roleToToggle)
      ? currentRoles.filter((r) => r !== roleToToggle)
      : [...currentRoles, roleToToggle];
    
    setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, roles: updatedRoles } : m)));
    
    try {
      await updateTeamMemberRoles(memberId, updatedRoles);
      showToast('success', 'Roles updated successfully.');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update roles.');
      loadTeam();
    }
  };

  const handleStatusChange = async (memberId: string, newStatus: 'active' | 'suspended') => {
    setOpenStatusMenuId(null);
    setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, status: newStatus } : m)));
    
    try {
      await updateTeamMemberStatus(memberId, newStatus);
      showToast('success', `Status updated to ${newStatus}.`);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update status.');
      loadTeam(); 
    }
  };

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchesSearch = 
        (m.display_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.email || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [members, searchTerm, statusFilter]);

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-6 md:p-8 h-full font-sans relative">
      {/* TOAST BANNER */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all transform duration-200 animate-in fade-in slide-in-from-bottom-5 ${
          toastMessage.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 mr-2.5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 mr-2.5 text-rose-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* HEADER */}
      <AdminPageHeader
        title="Team Management"
        description="Manage administrative accounts, role assignments, and member access."
        actionButton={{
          label: 'Invite User',
          onClick: () => setShowInviteModal(true),
          icon: Plus,
        }}
      />

      {/* METRIC OVERVIEW CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mr-3 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Members</p>
            <p className="text-xl font-bold text-gray-900">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mr-3 shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active</p>
            <p className="text-xl font-bold text-emerald-700">{stats.active}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mr-3 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending</p>
            <p className="text-xl font-bold text-amber-700">{stats.invited}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center">
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center mr-3 shrink-0">
            <UserX className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Suspended</p>
            <p className="text-xl font-bold text-rose-700">{stats.suspended}</p>
          </div>
        </div>
      </div>

      {/* TOOLBAR */}
      <AdminTableToolbar
        search={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by name or email..."
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        filterOptions={[
          { value: 'all', label: 'All' },
          { value: 'active', label: 'Active' },
          { value: 'invited', label: 'Invited' },
          { value: 'suspended', label: 'Suspended' },
        ]}
      />

      {/* TABLE */}
      <div ref={dropdownRef}>
        <AdminTableCard
          isLoading={isLoading}
          loadingText="Loading team members..."
          isEmpty={filteredMembers.length === 0}
          emptyTitle="No team members found"
          emptyDescription="No users match your active search filters."
        >
          <div className="overflow-x-auto min-h-[380px] pb-44">
            <table className="min-w-full divide-y divide-gray-200 text-left">
              <thead className="bg-gray-50/75">
                <tr>
                  <th scope="col" className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Member</th>
                  <th scope="col" className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned Roles</th>
                  <th scope="col" className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Created / Active</th>
                </tr>
              </thead>
              
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredMembers.map((member) => {
                  const memberRoles = (member.roles || []) as Role[];
                  const isSelf = member.id === currentUserId;
                  const isSuperAdmin = memberRoles.includes('super_admin');
                  const initials = getInitials(member.display_name, member.email);
                  const isMenuOpen = openRoleMenuId === member.id || openStatusMenuId === member.id;

                  return (
                    <tr 
                      key={member.id} 
                      className={`hover:bg-gray-50/80 transition-colors ${isMenuOpen ? 'relative z-20' : ''}`}
                    >
                      {/* USER COLUMN */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-9 w-9 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">
                            {initials}
                          </div>
                          <div className="ml-3.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-semibold text-gray-900">{member.display_name}</span>
                              {isSelf && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wider">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 font-mono mt-0.5">{member.email}</div>
                          </div>
                        </div>
                      </td>
                      
                      {/* ROLES COLUMN */}
                      <td className="px-6 py-4 relative">
                        <div className="flex flex-wrap items-center gap-1.5 max-w-md">
                          {isSuperAdmin && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                              <Shield className="w-3 h-3 mr-1 text-purple-600" /> Super Admin
                            </span>
                          )}

                          {memberRoles
                            .filter((r) => r !== 'super_admin')
                            .map((roleKey) => {
                              const roleDef = ROLE_DEFINITIONS.find((r) => r.id === roleKey);
                              const badgeStyle = ROLE_BADGE_STYLES[roleKey] || 'bg-gray-100 text-gray-700 border-gray-200';
                              return (
                                <span 
                                  key={roleKey} 
                                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${badgeStyle}`}
                                >
                                  {roleDef?.label || roleKey}
                                </span>
                              );
                            })}

                          {memberRoles.length === 0 && (
                            <span className="text-xs text-gray-400 italic">No roles assigned</span>
                          )}

                          {/* Role Toggle Trigger */}
                          {!isSelf && !isSuperAdmin && assignableRoles.length > 0 && (
                            <div className="relative inline-block ml-1">
                              <button
                                type="button"
                                onClick={() => setOpenRoleMenuId(openRoleMenuId === member.id ? null : member.id)}
                                className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                                title="Edit Roles"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>

                              {openRoleMenuId === member.id && (
                                <div className="absolute left-0 top-full mt-1.5 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                                  <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Assign Capabilities
                                  </div>
                                  <div className="p-2 space-y-1">
                                    {assignableRoles.map((role) => {
                                      const hasRole = memberRoles.includes(role.id);
                                      return (
                                        <button
                                          key={role.id}
                                          type="button"
                                          onClick={() => handleRoleToggle(member.id, role.id, memberRoles)}
                                          className="w-full flex items-center justify-between text-left px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors text-gray-700 cursor-pointer"
                                        >
                                          <span>{role.label}</span>
                                          {hasRole && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* STATUS & RESEND COLUMN */}
                      <td className="px-6 py-4 whitespace-nowrap relative">
                        {member.status === 'invited' ? (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-amber-500" />
                              Invited
                            </span>
                            {!isSelf && (
                              <button
                                type="button"
                                disabled={resendingId === member.id}
                                onClick={() => handleResendInvite(member.id, member.email)}
                                className="inline-flex items-center px-2 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md border border-indigo-200 transition-colors disabled:opacity-50 cursor-pointer"
                                title="Resend invitation link"
                              >
                                {resendingId === member.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin mr-1 text-indigo-600" />
                                ) : (
                                  <RotateCcw className="w-3 h-3 mr-1" />
                                )}
                                Resend
                              </button>
                            )}
                          </div>
                        ) : isSelf || isSuperAdmin ? (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize border ${
                            member.status === 'active' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                              member.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'
                            }`} />
                            {member.status}
                          </span>
                        ) : (
                          <div className="relative inline-block">
                            <button
                              type="button"
                              onClick={() => setOpenStatusMenuId(openStatusMenuId === member.id ? null : member.id)}
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize border transition-all cursor-pointer ${
                                member.status === 'active' 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                member.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'
                              }`} />
                              {member.status}
                              <ChevronDown className="w-3 h-3 ml-1 opacity-60" />
                            </button>

                            {openStatusMenuId === member.id && (
                              <div className="absolute left-0 top-full mt-1.5 w-32 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden py-1">
                                {(['active', 'suspended'] as const).map((statusOption) => (
                                  <button
                                    key={statusOption}
                                    type="button"
                                    onClick={() => handleStatusChange(member.id, statusOption)}
                                    className={`w-full flex items-center px-3 py-1.5 text-xs font-medium capitalize text-left hover:bg-gray-50 transition-colors cursor-pointer ${
                                      member.status === statusOption ? 'text-indigo-600 font-bold bg-indigo-50/50' : 'text-gray-700'
                                    }`}
                                  >
                                    {statusOption}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* TIMESTAMP COLUMN */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs text-gray-500 font-mono">
                        {member.created_at ? new Date(member.created_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </AdminTableCard>
      </div>

      {/* INVITE MODAL OVERLAY */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div>
                <h3 className="text-base font-bold text-gray-900">Invite Team Member</h3>
                <p className="text-xs text-gray-500 mt-0.5">Send an onboarding invite to grant admin workspace access.</p>
              </div>
              <button onClick={() => setShowInviteModal(false)} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleInvite} className="p-6 space-y-5">
              {inviteError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start text-xs text-red-800">
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
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} 
                  placeholder="name@organization.org" 
                />

                <FormInput 
                  label="Display Name"
                  type="text" 
                  required 
                  value={inviteForm.displayName} 
                  onChange={(e) => setInviteForm({ ...inviteForm, displayName: e.target.value })} 
                  placeholder="e.g. Alex Chen" 
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700">Assigned Capabilities</label>
                  <span className="text-xs text-gray-400">At least 1 role required</span>
                </div>

                <div className="space-y-2 bg-gray-50 border border-gray-200 rounded-xl p-3 max-h-52 overflow-y-auto">
                  {assignableRoles.map((role) => {
                    const isChecked = inviteForm.roles.includes(role.id);
                    return (
                      <label 
                        key={role.id} 
                        className={`flex items-start p-2.5 rounded-lg border transition-all cursor-pointer ${
                          isChecked 
                            ? 'bg-indigo-50/60 border-indigo-200' 
                            : 'bg-white border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <input 
                          type="checkbox" 
                          checked={isChecked} 
                          onChange={(e) => {
                            const newRoles = e.target.checked 
                              ? [...inviteForm.roles, role.id] 
                              : inviteForm.roles.filter((r) => r !== role.id);
                            setInviteForm({ ...inviteForm, roles: newRoles });
                          }} 
                          className="w-4 h-4 mt-0.5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 shrink-0" 
                        />
                        <div className="ml-3">
                          <p className="text-xs font-semibold text-gray-800 leading-none">{role.label}</p>
                          <p className="text-[11px] text-gray-500 mt-1 leading-snug">{role.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setShowInviteModal(false)} 
                  className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isInviting || inviteForm.roles.length === 0} 
                  className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  {isInviting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}