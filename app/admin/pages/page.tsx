'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Pencil, 
  Link as LinkIcon, 
  Trash2, 
  Globe, 
  GripVertical,
  AlertCircle
} from 'lucide-react';

const mockPages = [
  {
    id: 'pg_1',
    titleEn: 'Homepage',
    titleZh: '首頁',
    slug: '/',
    isHomepage: true,
    status: 'published',
    showInNav: false
  },
  {
    id: 'pg_2',
    titleEn: 'Our Lineage',
    titleZh: '傳承與歷史',
    slug: '/about/lineage',
    isHomepage: false,
    status: 'published',
    showInNav: true
  },
  {
    id: 'pg_3',
    titleEn: 'Contact Us',
    titleZh: '聯絡我們',
    slug: '/contact',
    isHomepage: false,
    status: 'draft',
    showInNav: true
  },
  {
    id: 'pg_4',
    titleEn: 'Privacy Policy',
    titleZh: '隱私政策',
    slug: '/privacy',
    isHomepage: false,
    status: 'published',
    showInNav: false
  }
];

export default function StaticPagesPage() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-8 h-full">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Pages</h1>
          <p className="text-sm text-gray-500 mt-1">Manage standard pages like 'About Us'. Drag rows to reorder them in navigation menus.</p>
        </div>
        <a href="/admin/editor/new?type=page" className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none">
          <Plus className="w-4 h-4 mr-2" />
          Create Page
        </a>
      </div>

      <div className="bg-white p-4 rounded-t-xl border border-gray-200 border-b-0 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search pages by name..."
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
                <th scope="col" className="w-12 px-4 py-4">
                  <span className="sr-only">Drag handle</span>
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-2/5">
                  Page Name
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Path
                </th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Show in Nav
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
              {mockPages.map((page) => (
                <tr key={page.id} className="hover:bg-gray-50/80 transition-colors group">
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <button className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing transition-colors" title="Drag to reorder">
                      <GripVertical className="w-5 h-5" />
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100">
                        <Globe className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-gray-900 flex items-center">
                          {page.titleEn}
                          {page.isHomepage && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              Homepage
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 mt-0.5">{page.titleZh}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500 font-mono bg-gray-100/50 px-2 py-1 rounded inline-block">
                      {page.slug}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button 
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                        page.showInNav ? 'bg-emerald-500' : 'bg-gray-200'
                      }`}
                      role="switch"
                      aria-checked={page.showInNav}
                    >
                      <span 
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          page.showInNav ? 'translate-x-4' : 'translate-x-0'
                        }`} 
                      />
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button 
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
                        page.status === 'published' ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                      role="switch"
                      aria-checked={page.status === 'published'}
                    >
                      <span 
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          page.status === 'published' ? 'translate-x-4' : 'translate-x-0'
                        }`} 
                      />
                    </button>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a href={`/admin/editor/${page.id}`} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="Edit Content">
                        <Pencil className="w-4 h-4" />
                      </a>
                      <button 
                        className={`p-1.5 rounded-md transition-colors ${
                          page.status === 'published' 
                            ? 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50' 
                            : 'text-gray-300 cursor-not-allowed'
                        }`}
                        disabled={page.status !== 'published'}
                        title="Copy Public Link"
                      >
                        <LinkIcon className="w-4 h-4" />
                      </button>
                      
                      {/* Trash icon is disabled and styled differently for the homepage */}
                      {page.isHomepage ? (
                        <button className="p-1.5 text-gray-300 cursor-not-allowed rounded-md" title="Cannot delete homepage" disabled>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete Page">
                          <Trash2 className="w-4 h-4" />
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
      
    </div>
  );
}