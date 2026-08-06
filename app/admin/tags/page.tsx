'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  Tag as TagIcon,
  X,
  Save,
  AlertCircle
} from 'lucide-react';
import { FormInput } from '../../../components/ui/FormControls';

type Tag = {
  id: string;
  slug: string;
  nameEn: string;
  nameZh: string;
  usageCount: number;
};

const mockTags: Tag[] = [
  { id: 'tag_1', slug: 'silent-retreat', nameEn: 'Silent Retreat', nameZh: '止語禪修', usageCount: 12 },
  { id: 'tag_2', slug: 'online', nameEn: 'Online', nameZh: '線上', usageCount: 45 },
  { id: 'tag_3', slug: 'beginner', nameEn: 'Beginner Friendly', nameZh: '適合初學者', usageCount: 8 },
  { id: 'tag_4', slug: 'youth', nameEn: 'Youth Program', nameZh: '青年計劃', usageCount: 0 }
];

export default function TagsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Partial<Tag> | null>(null);

  const filteredTags = mockTags.filter(tag => 
    tag.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) || 
    tag.nameZh.includes(searchTerm) ||
    tag.slug.includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (tag?: Tag) => {
    if (tag) {
      setEditingTag(tag);
    } else {
      setEditingTag({ slug: '', nameEn: '', nameZh: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setEditingTag(null), 200);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-8 h-full relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-950 tracking-tight">Tags & Filters</h1>
          <p className="text-sm text-gray-500 mt-1">Manage the bilingual categories used in the public discovery feed.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Tag
        </button>
      </div>

      <div className="bg-white p-4 rounded-t-xl border border-gray-200 border-b-0 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="w-full sm:w-96">
          <FormInput
            icon={Search}
            placeholder="Search tags by name or slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-50"
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-b-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-2/5">
                  Tag Display Name
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  URL Slug
                </th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Usage Count
                </th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTags.map((tag) => (
                <tr key={tag.id} className="hover:bg-gray-50/80 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100">
                        <TagIcon className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-gray-950">{tag.nameEn}</div>
                        <div className="text-sm text-gray-500 mt-0.5">{tag.nameZh}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-xs font-mono text-slate-800">
                      {tag.slug}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      tag.usageCount > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {tag.usageCount} posts
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleOpenModal(tag)}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" 
                        title="Edit Tag"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        className={`p-1.5 rounded-md transition-colors ${
                          tag.usageCount > 0 
                            ? 'text-gray-300 cursor-not-allowed' 
                            : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                        }`}
                        title={tag.usageCount > 0 ? "Cannot delete tag in use" : "Delete Tag"}
                        disabled={tag.usageCount > 0}
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
          <h2 className="text-lg font-semibold text-gray-950">
            {editingTag?.id ? 'Edit Tag' : 'Create New Tag'}
          </h2>
          <button 
            onClick={handleCloseModal}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-4">
            <FormInput
              label="English Name"
              value={editingTag?.nameEn || ''}
              onChange={(e) => setEditingTag({ ...editingTag, nameEn: e.target.value })}
              placeholder="e.g. Zen Retreat"
            />
            
            <FormInput
              label="Chinese Name"
              value={editingTag?.nameZh || ''}
              onChange={(e) => setEditingTag({ ...editingTag, nameZh: e.target.value })}
              placeholder="e.g. 禪修營"
            />

            <FormInput
              label="URL Slug (Must be unique)"
              value={editingTag?.slug || ''}
              onChange={(e) => setEditingTag({ 
                ...editingTag, 
                slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') 
              })}
              placeholder="e.g. zen-retreat"
              helperText="This is the exact text that will appear in the web address (e.g., /events?tag=zen-retreat)"
              className="font-mono bg-gray-50"
            />
          </div>

          {editingTag?.id && (
            <div className="bg-amber-50 rounded-lg p-4 flex items-start border border-amber-200">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                Warning: Changing the URL slug will break any existing external links that point specifically to this tag filter.
              </p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 shrink-0 flex justify-end space-x-3">
          <button 
            onClick={handleCloseModal}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors">
            <Save className="w-4 h-4 mr-2" />
            Save Tag
          </button>
        </div>
      </div>
    </div>
  );
}