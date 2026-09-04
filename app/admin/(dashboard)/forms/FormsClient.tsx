'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Plus, LayoutTemplate, Pencil, Eye, Copy, Trash2, 
  FileSignature, Share2, AlertCircle 
} from 'lucide-react';
import { getForms, deleteForm, updateFormStatus, duplicateForm } from './actions';
import AdminPageHeader from '@/components/admin/shared/AdminPageHeader';
import AdminTableToolbar from '@/components/admin/shared/AdminTableToolbar';
import AdminTableCard from '@/components/admin/shared/AdminTableCard';
import StatusBadgeSelect from '@/components/admin/shared/StatusBadgeSelect';
import ShareQrModal from '@/components/admin/shared/ShareQrModal';

export default function FormsClient({ permissions }: { permissions: any }) {
  const router = useRouter();
  const [forms, setForms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [shareForm, setShareForm] = useState<any>(null);

  const loadForms = async () => {
    setIsLoading(true);
    try {
      const data = await getForms();
      setForms(data);
    } catch (err) {
      console.error('Error fetching forms:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadForms();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this draft form?')) return;
    try {
      await deleteForm(id);
      setForms(forms.filter((f) => f.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete form.');
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateFormStatus(id, newStatus);
      setForms(forms.map((f) => (f.id === id ? { ...f, status: newStatus } : f)));
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const newId = await duplicateForm(id);
      router.push(`/admin/forms/builder?id=${newId}`);
    } catch (err) {
      alert('Failed to duplicate form.');
    }
  };

  const filteredForms = forms.filter((form) => {
    const term = searchTerm.toLowerCase();
    const titleMatch = (form.title || '').toLowerCase().includes(term);
    const schemaTitleMatch = (form.schema?.titleEn || '').toLowerCase().includes(term);
    const eventMatch = (form.events?.title_zh || '').toLowerCase().includes(term) ||
                       (form.events?.code || '').toLowerCase().includes(term);
    return titleMatch || schemaTitleMatch || eventMatch;
  });

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-8 h-full font-sans relative">
      {/* UNIVERSAL QR SHARE MODAL */}
      <ShareQrModal
        isOpen={Boolean(shareForm)}
        onClose={() => setShareForm(null)}
        title="Share Form"
        url={shareForm?.slug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/zh/form/${shareForm.slug}` : ''}
        filename={shareForm?.slug || 'form'}
      />

      {/* HEADER */}
      <AdminPageHeader
        title="Form Builder"
        description="Design applications, health declarations, and feedback surveys."
        actionButton={
          permissions.canCreate
            ? { label: 'Create Form', href: '/admin/forms/builder?id=new', icon: Plus }
            : undefined
        }
      />

      {/* TOOLBAR */}
      <AdminTableToolbar
        search={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search forms by title, event, code..."
      />

      {/* TABLE */}
      <AdminTableCard
        isLoading={isLoading}
        loadingText="Loading forms from database..."
        isEmpty={filteredForms.length === 0}
        emptyTitle="No forms found"
        emptyDescription='Click "Create Form" above to build your first one!'
      >
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50/50">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-2/5">
                Form Name
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Linked Event
              </th>
              <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Submissions
              </th>
              <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {filteredForms.map((form) => {
              const status = form.status || 'draft';
              const isFollowUp = form.is_followup;
              const realCount = form.real_count || 0;
              const testCount = form.test_count || 0;
              const displayCount = testCount > 0 ? `${realCount} (${testCount})` : realCount.toString();
              const event = form.events;

              return (
                <tr key={form.id} className="hover:bg-gray-50/80 transition-colors">
                  
                  {/* 1. FORM TITLE */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="shrink-0 h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100">
                        <FileSignature className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-gray-900">{form.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{form.schema?.titleEn || 'Untitled Form'}</div>
                        {form.slug && (
                          <div className="text-[11px] font-mono text-indigo-600 mt-0.5">/form/{form.slug}</div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* 2. LINKED EVENT */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {event ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          {event.code && (
                            <span className="font-mono text-xs font-bold px-1.5 py-0.2 bg-indigo-50 text-indigo-700 border border-indigo-200/80 rounded">
                              [{event.code}]
                            </span>
                          )}
                          <span className="text-sm font-semibold text-gray-900 truncate max-w-[220px]">
                            {event.title_zh || event.title_en}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-gray-400 font-mono">
                          <span>id: {event.short_id}</span>
                          <span className="capitalize text-gray-500 font-sans">({event.status})</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Unlinked (Fallback: {form.schema?.eventCode || form.schema?.interimEventCode || 'MMC'})</span>
                      </div>
                    )}
                  </td>

                  {/* 3. TYPE */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isFollowUp ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {isFollowUp ? 'Follow-up' : 'Application'}
                    </span>
                  </td>

                  {/* 4. STATUS */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <StatusBadgeSelect
                      value={status}
                      onChange={(newStatus) => handleStatusChange(form.id, newStatus)}
                      disabled={!permissions.canUpdateStatus}
                      options={[
                        { value: 'draft', label: 'Draft' },
                        { value: 'open', label: 'Open' },
                        { value: 'closed', label: 'Closed' },
                      ]}
                    />
                  </td>

                  {/* 5. SUBMISSIONS COUNT */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <Link
                      href={`/admin/forms/${form.id}/submissions`}
                      className={`inline-flex items-center justify-center min-w-[2.5rem] px-3 py-1 rounded-full text-sm font-semibold transition-all ${
                        testCount > 0
                          ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 hover:ring-2 hover:ring-amber-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 hover:ring-2 hover:ring-indigo-200'
                      }`}
                      title="View Submissions Data"
                    >
                      {displayCount}
                    </Link>
                  </td>

                  {/* 6. ACTIONS */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-1.5">
                      
                      {/* Delete (Draft only, 0 submissions) */}
                      {permissions.canDelete && status === 'draft' && realCount === 0 && testCount === 0 && (
                        <button
                          onClick={() => handleDelete(form.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Draft Form"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}                  

                      {/* Schema Action: Pencil for Draft Edit, LayoutTemplate for View Only */}
                      {permissions.canEdit && status === 'draft' ? (
                        <Link
                          href={`/admin/forms/builder?id=${form.id}`}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Schema"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                      ) : (permissions.canViewSchema || permissions.canEdit) ? (
                        <Link
                          href={`/admin/forms/builder?id=${form.id}`}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title={`View Schema (${status.toUpperCase()} - Read Only)`}
                        >
                          <LayoutTemplate className="w-4 h-4" />
                        </Link>
                      ) : null}                  

                      {/* Public Preview & Test */}
                      <button
                        onClick={() => {
                          if (form.slug) {
                            window.open(`/en/form/${form.slug}?test=true`, '_blank');
                          } else {
                            alert('Please edit the form and set a URL Slug to preview it.');
                          }
                        }}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        title="Preview & Test"
                      >
                        <Eye className="w-4 h-4" />
                      </button>                  

                      {/* Share QR */}
                      <button
                        onClick={() => {
                          if (!form.slug) {
                            alert('This form does not have a URL Slug yet.');
                            return;
                          }
                          setShareForm(form);
                        }}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        title="Share & QR Code"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>                  

                      {/* Duplicate */}
                      {permissions.canCreate && (
                        <button
                          onClick={() => handleDuplicate(form.id)}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Duplicate Form"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </AdminTableCard>
    </div>
  );
}