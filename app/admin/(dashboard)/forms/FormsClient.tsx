'use client';

import React, { useState, useEffect } from 'react';
import { getForms, deleteForm, updateFormStatus, duplicateForm } from './actions';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  LayoutTemplate, 
  Eye, 
  Copy, 
  Trash2, 
  FileSignature,
  CalendarDays,
  Loader2,
  Share2,
  X,
  Download,
  Check
} from 'lucide-react';

export default function FormsClient({ permissions }: { permissions: any }) {
  const router = useRouter();
  const [forms, setForms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Share Modal States
  const [shareForm, setShareForm] = useState<any>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloadingQR, setIsDownloadingQR] = useState(false);

  const loadForms = async () => {
    setIsLoading(true);
    try {
      const data = await getForms();
      setForms(data);
    } catch (err) {
      console.error(err);
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
      setForms(forms.filter(f => f.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete form.');
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateFormStatus(id, newStatus);
      setForms(forms.map(f => f.id === id ? { ...f, status: newStatus } : f));
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

  // QR Code Downloader Helper
  const handleDownloadQR = async (url: string, slug: string) => {
    setIsDownloadingQR(true);
    try {
      // MOD: Added &margin=50 for a thick, scannable white border
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&margin=50&data=${encodeURIComponent(url)}`;
      const response = await fetch(qrApiUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${slug}-QR.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      alert('Failed to download QR code. Please try again.');
    } finally {
      setIsDownloadingQR(false);
    }
  };

  const filteredForms = forms.filter(form => 
    (form.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (form.schema?.titleEn || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-8 h-full font-sans relative">
      
      {/* SHARE MODAL OVERLAY */}
      {shareForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">Share Form</h3>
              <button onClick={() => setShareForm(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Link Copier */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Public Link</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={`${window.location.origin}/zh/form/${shareForm.slug}`}
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/zh/form/${shareForm.slug}`);
                      setIsCopied(true);
                      setTimeout(() => setIsCopied(false), 2000);
                    }}
                    className="flex items-center justify-center px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-sm font-semibold transition-colors"
                  >
                    {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* QR Code generator */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">QR Code (1000x1000)</label>
                <div className="flex items-center gap-6 p-4 border border-gray-100 rounded-xl bg-gray-50/50">
                  <img 
                    // MOD: Added &margin=10 to the preview API call
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=10&data=${encodeURIComponent(`${window.location.origin}/zh/form/${shareForm.slug}`)}`} 
                    alt="QR Code Preview"
                    // MOD: Added p-2.5 to visually pad the image box
                    className="w-24 h-24 rounded-lg bg-white p-2.5 shadow-sm border border-gray-200 object-contain"
                  />
                  <button
                    onClick={() => handleDownloadQR(`${window.location.origin}/zh/form/${shareForm.slug}`, shareForm.slug)}
                    disabled={isDownloadingQR}
                    className="flex-1 flex items-center justify-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    {isDownloadingQR ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                    Download PNG
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Form Builder</h1>
          <p className="text-sm text-gray-500 mt-1">Design applications, health declarations, and feedback surveys.</p>
        </div>
        {permissions.canCreate && (
          <Link href="/admin/forms/builder?id=new" className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none">
            <Plus className="w-4 h-4 mr-2" />
            Create Form
          </Link>
        )}
      </div>

      {/* TOOLBAR */}
      <div className="bg-white p-4 rounded-t-xl border border-gray-200 border-b-0 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search forms by title..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 outline-none transition-colors text-gray-900 placeholder-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white border border-gray-200 rounded-b-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-gray-500 text-sm">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600 mr-2" />
            Loading forms from database...
          </div>
        ) : filteredForms.length === 0 ? (
          <div className="text-center py-20 text-gray-500 text-sm">
            No forms found. Click "Create Form" above to build your first one!
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                  
                  const displayCount = testCount > 0 
                    ? `${realCount} (${testCount})` 
                    : realCount.toString();

                  return (
                    <tr key={form.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100">
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
                          <CalendarDays className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                          {form.event_id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isFollowUp ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                          {isFollowUp ? 'Follow-up' : 'Application'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <select
                          value={status}
                          onChange={(e) => handleStatusChange(form.id, e.target.value)}
                          disabled={!permissions.canUpdateStatus}
                          className={`text-xs font-medium rounded-full px-3 py-1 outline-none appearance-none border-0 text-center ${
                            !permissions.canUpdateStatus ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer focus:ring-2 focus:ring-indigo-500'
                          } ${
                            status === 'open' ? 'bg-emerald-100 text-emerald-800' :
                            status === 'closed' ? 'bg-rose-100 text-rose-800' :
                            'bg-amber-100 text-amber-800'
                          }`}
                        >
                          <option value="draft">Draft</option>
                          <option value="open">Open</option>
                          <option value="closed">Closed</option>
                        </select>
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
                        {/* MOD 5 UX: Removed opacity-0 / group-hover to ensure visible touch access */}
                        <div className="flex items-center justify-end space-x-1.5">

                          {/* DELETE */}
                          {permissions.canDelete && status === 'draft' && realCount === 0 && testCount === 0 && (
                            <button 
                              onClick={() => handleDelete(form.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Draft Form"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* EDIT SCHEMA */}
                          {permissions.canEdit && status === 'draft' && (
                            <Link href={`/admin/forms/builder?id=${form.id}`} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit Schema">
                              <LayoutTemplate className="w-4 h-4" />
                            </Link>
                          )}
                          
                          {/* MOD 3: Preview link shifted to utilize slug */}
                          <button 
                            onClick={() => {
                              if (form.slug) {
                                window.open(`/en/form/${form.slug}?test=true`, '_blank');
                              } else {
                                alert('Please edit the form and set a URL Slug to preview it.');
                              }
                            }}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" 
                            title="Preview & Test"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {/* MOD 4: Share & QR Button */}
                          <button 
                            onClick={() => {
                              if (!form.slug) {
                                alert('This form does not have a URL Slug yet. Please edit the form and save a slug first.');
                                return;
                              }
                              setShareForm(form);
                            }}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" 
                            title="Share & QR Code"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>

                          {/* DUPLICATE */}
                          {permissions.canCreate && (
                            <button 
                              onClick={() => handleDuplicate(form.id)}
                              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" 
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
          </div>
        )}
      </div>
      
    </div>
  );
}