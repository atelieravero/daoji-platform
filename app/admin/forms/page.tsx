'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  LayoutTemplate, 
  Eye, 
  Copy, 
  Trash2, 
  FileSignature,
  CalendarDays,
  Inbox
} from 'lucide-react';

const mockForms = [
  {
    id: 'f_1',
    title: 'Standard Retreat Application',
    linkedEvent: '7-Day Silent Zen Retreat',
    type: 'application',
    status: 'open',
    submissionsCount: 42
  },
  {
    id: 'f_2',
    title: 'Pre-Arrival Health & Diet Confirmation',
    linkedEvent: '7-Day Silent Zen Retreat',
    type: 'confirmation',
    status: 'draft',
    submissionsCount: 0
  },
  {
    id: 'f_3',
    title: 'Weekly RSVP',
    linkedEvent: 'Weekly Wednesday Wisdom',
    type: 'application',
    status: 'closed',
    submissionsCount: 128
  }
];

export default function FormsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-8 h-full">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Form Builder</h1>
          <p className="text-sm text-gray-500 mt-1">Design applications, health declarations, and feedback surveys.</p>
        </div>
        <a href="/admin/forms/builder?id=new" className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none">
          <Plus className="w-4 h-4 mr-2" />
          Create Form
        </a>
      </div>

      <div className="bg-white p-4 rounded-t-xl border border-gray-200 border-b-0 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search forms by title..."
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
                  Form Name
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Linked Event
                </th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Submissions
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
              {mockForms.map((form) => (
                <tr key={form.id} className="hover:bg-gray-50/80 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100">
                        <FileSignature className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-gray-900">{form.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5 capitalize">{form.type}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-600">
                      <CalendarDays className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                      {form.linkedEvent}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {form.submissionsCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <select
                      defaultValue={form.status}
                      className={`text-xs font-medium rounded-full px-3 py-1 cursor-pointer focus:ring-2 focus:ring-indigo-500 outline-none appearance-none border-0 text-center ${
                        form.status === 'open' ? 'bg-emerald-100 text-emerald-800' :
                        form.status === 'closed' ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800'
                      }`}
                    >
                      <option value="draft">Draft</option>
                      <option value="open">Open</option>
                      <option value="closed">Closed</option>
                    </select>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Navigate to the specific form's submission data */}
                      <a href={`/admin/forms/${form.id}/submissions`} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors" title="View Submissions Data">
                        <Inbox className="w-4 h-4" />
                      </a>
                      {/* In a real app, this would be a Next.js <Link href={`/admin/forms/builder?id=${form.id}`}> */}
                      <a href={`/admin/forms/builder?id=${form.id}`} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="Edit Schema">
                        <LayoutTemplate className="w-4 h-4" />
                      </a>
                      <button className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="Preview & Test">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="Duplicate Form">
                        <Copy className="w-4 h-4" />
                      </button>
                      <button 
                        className={`p-1.5 rounded-md transition-colors ${
                          form.submissionsCount > 0 
                            ? 'text-gray-300 cursor-not-allowed' 
                            : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                        }`}
                        title={form.submissionsCount > 0 ? "Cannot delete form with submissions" : "Delete Form"}
                        disabled={form.submissionsCount > 0}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}