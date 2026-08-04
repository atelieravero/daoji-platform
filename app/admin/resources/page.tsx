'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Pencil, 
  Link as LinkIcon, 
  Trash2, 
  FileText, 
  Headphones, 
  Video,
  Calendar
} from 'lucide-react';

const mockResources = [
  {
    id: 'res_1',
    titleEn: 'Beginner Meditation Guide',
    titleZh: '初學者冥想指南',
    type: 'document', // 'document', 'audio', 'video'
    dateAdded: '2026-08-01',
    status: 'published'
  },
  {
    id: 'res_2',
    titleEn: 'Morning Chanting Recording',
    titleZh: '早課唱誦錄音',
    type: 'audio',
    dateAdded: '2026-07-28',
    status: 'published'
  },
  {
    id: 'res_3',
    titleEn: 'History of Daoji Foundation',
    titleZh: '道濟基金會歷史',
    type: 'video',
    dateAdded: '2026-08-04',
    status: 'draft'
  }
];

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'audio': return <Headphones className="h-5 w-5 text-indigo-600" />;
    case 'video': return <Video className="h-5 w-5 text-indigo-600" />;
    default: return <FileText className="h-5 w-5 text-indigo-600" />;
  }
};

export default function ResourcesPage() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-8 h-full">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Resources</h1>
          <p className="text-sm text-gray-500 mt-1">Manage downloadable guides, audio, and video content.</p>
        </div>
        <a href="/admin/editor/new?type=resource" className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none">
          <Plus className="w-4 h-4 mr-2" />
          Create Resource
        </a>
      </div>

      <div className="bg-white p-4 rounded-t-xl border border-gray-200 border-b-0 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search resources by name..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 outline-none transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors">
          <Filter className="w-4 h-4 mr-2 text-gray-500" />
          Filter
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-b-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-2/5">
                  Resource Name
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Date Added
                </th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Published
                </th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            
            <tbody className="bg-white divide-y divide-gray-200">
              {mockResources.map((resource) => (
                <tr key={resource.id} className="hover:bg-gray-50/80 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100">
                        {getTypeIcon(resource.type)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-gray-900">{resource.titleEn}</div>
                        <div className="text-sm text-gray-500 mt-0.5">{resource.titleZh}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Calendar className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                      {resource.dateAdded}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button 
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
                        resource.status === 'published' ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                      role="switch"
                      aria-checked={resource.status === 'published'}
                    >
                      <span 
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          resource.status === 'published' ? 'translate-x-4' : 'translate-x-0'
                        }`} 
                      />
                    </button>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a href={`/admin/editor/${resource.id}`} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="Edit Content">
                        <Pencil className="w-4 h-4" />
                      </a>
                      <button 
                        className={`p-1.5 rounded-md transition-colors ${
                          resource.status === 'published' 
                            ? 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50' 
                            : 'text-gray-300 cursor-not-allowed'
                        }`}
                        disabled={resource.status !== 'published'}
                        title="Copy Public Link"
                      >
                        <LinkIcon className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete Resource">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">1</span> to <span className="font-medium">3</span> of <span className="font-medium">3</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button className="relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors">
                  Previous
                </button>
                <button className="relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors">
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}