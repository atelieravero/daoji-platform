'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Plus, LayoutTemplate, Eye, Copy, Trash2, 
  FileSignature, CalendarDays, Share2 
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

  const filteredForms = forms.filter(
    (form) =>
      (form.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (form.schema?.titleEn || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-8 h-full font-sans relative">
      {/* UNIVERSAL QR SHARE MODAL */}
      <ShareQrModal
        isOpen={Boolean(shareForm)}
        onClose={() => setShareForm(null)}
        title="Share Form"
        url={shareForm?.slug ? `${window.location.origin}/zh/form/${shareForm.slug}` : ''}
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
        searchPlaceholder="Search forms by title..."
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

              return (
                <tr key={form.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="shrink-0 h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100">
                        <FileSignature className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-gray-900">{form.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{form.schema?.titleEn || 'Untitled Form'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-600">
                      <CalendarDays className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
                      {form.event_id}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isFollowUp ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {isFollowUp ? 'Follow-up' : 'Application'}
                    </span>
                  </td>
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
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-1.5">
                      {permissions.canDelete && status === 'draft' && realCount === 0 && testCount === 0 && (
                        <button
                          onClick={() => handleDelete(form.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Draft Form"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      {permissions.canEdit && status === 'draft' && (
                        <Link
                          href={`/admin/forms/builder?id=${form.id}`}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit Schema"
                        >
                          <LayoutTemplate className="w-4 h-4" />
                        </Link>
                      )}

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

                      <button
                        onClick={() => {
                          if (!form.slug) {
                            alert('This form does not have a URL Slug yet. Please edit the form and save a slug first.');
                            return;
                          }
                          setShareForm(form);
                        }}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        title="Share & QR Code"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>

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