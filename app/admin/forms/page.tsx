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
  Loader2
} from 'lucide-react';

export default function FormsPage() {
  const router = useRouter();
  const [forms, setForms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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
      setForms(forms.map(f => f.id === id ? { ...f, schema: { ...f.schema, status: newStatus } } : f));
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

  const filteredForms = forms.filter(form => 
    (form.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (form.schema?.titleEn || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-8 h-full font-sans">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Form Builder</h1>
          <p className="text-sm text-gray-500 mt-1">Design applications, health declarations, and feedback surveys.</p>
        </div>
        <Link href="/admin/forms/builder?id=new" className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none">
          <Plus className="w-4 h-4 mr-2" />
          Create Form
        </Link>
      </div>

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
                  const status = form.schema?.status || 'draft';
                  const isFollowUp = form.is_followup;
                  // Safely extract count based on common Supabase return shapes
                  const submissionCount = form.submission_count || 0;

                  return (
                    <tr key={form.id} className="hover:bg-gray-50/80 transition-colors group">
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
                          className={`text-xs font-medium rounded-full px-3 py-1 cursor-pointer focus:ring-2 focus:ring-indigo-500 outline-none appearance-none border-0 text-center ${
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
                      
                      {/* New Submissions Count Column */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <Link 
                          href={`/admin/forms/${form.id}/submissions`} 
                          className="inline-flex items-center justify-center min-w-[2.5rem] px-3 py-1 rounded-full bg-gray-100 text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 hover:ring-2 hover:ring-indigo-200 font-semibold text-sm transition-all"
                          title="View Submissions Data"
                        >
                          {submissionCount}
                        </Link>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          
                          <Link href={`/admin/forms/builder?id=${form.id}`} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="Edit Schema">
                            <LayoutTemplate className="w-4 h-4" />
                          </Link>
                          
                          <button 
                            onClick={() => window.open(`/en/form?id=${form.id}&test=true`, '_blank')}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" 
                            title="Preview & Test"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button 
                            onClick={() => handleDuplicate(form.id)}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" 
                            title="Duplicate Form"
                          >
                            <Copy className="w-4 h-4" />
                          </button>                          
                          
                          {status === 'draft' && (
                            <button 
                              onClick={() => handleDelete(form.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title="Delete Draft Form"
                            >
                              <Trash2 className="w-4 h-4" />
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