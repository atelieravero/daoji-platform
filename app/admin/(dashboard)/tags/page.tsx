'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Tag as TagIcon, Plus, Search, Edit2, Trash2, Loader2, 
  X, Check, Bookmark, Hash
} from 'lucide-react';
import { FormInput } from '@/components/ui/FormControls';
import { listTagsAction, createTagAction, updateTagAction, deleteTagAction, TagRecord } from './actions';

const PRESET_COLORS = [
  '#4F46E5', // Indigo
  '#059669', // Emerald
  '#D97706', // Amber
  '#DC2626', // Red
  '#7C3AED', // Purple
  '#2563EB', // Blue
  '#0D9488', // Teal
  '#DB2777', // Pink
  '#4B5563', // Slate
];

export default function TagsPage() {
  const [tags, setTags] = useState<TagRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'pillars' | 'micro'>('all');
  
  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingTag, setEditingTag] = useState<TagRecord | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    name_zh: '',
    name_en: '',
    slug: '',
    is_pillar: false,
    color: '#4F46E5',
  });

  const fetchTags = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await listTagsAction();
      setTags(res.data);
    } catch (err: any) {
      console.error('Error fetching tags:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const openCreateModal = () => {
    setEditingTag(null);
    setFormData({
      name_zh: '',
      name_en: '',
      slug: '',
      is_pillar: false,
      color: PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (tag: TagRecord) => {
    setEditingTag(tag);
    setFormData({
      name_zh: tag.name_zh,
      name_en: tag.name_en || '',
      slug: tag.slug || '',
      is_pillar: tag.is_pillar,
      color: tag.color || '#4F46E5',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name_zh.trim()) {
      setStatusMessage({ type: 'error', text: 'Chinese name is required.' });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    try {
      if (editingTag) {
        const res = await updateTagAction(editingTag.id, formData);
        if (!res.success) throw new Error(res.error || 'Failed to update tag.');
        setStatusMessage({ type: 'success', text: `Tag "${formData.name_zh}" updated successfully.` });
      } else {
        const res = await createTagAction(formData);
        if (!res.success) throw new Error(res.error || 'Failed to create tag.');
        setStatusMessage({ type: 'success', text: `Tag "${formData.name_zh}" created successfully.` });
      }
      setIsModalOpen(false);
      fetchTags();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (tag: TagRecord) => {
    if ((tag.usage_count || 0) > 0) {
      if (!confirm(`Warning: This tag is linked to ${tag.usage_count} entity/entities. Are you sure you want to delete "${tag.name_zh}"?`)) {
        return;
      }
    } else {
      if (!confirm(`Are you sure you want to delete tag "${tag.name_zh}"?`)) {
        return;
      }
    }

    try {
      const res = await deleteTagAction(tag.id);
      if (!res.success) throw new Error(res.error || 'Failed to delete tag.');
      setStatusMessage({ type: 'success', text: 'Tag deleted successfully.' });
      fetchTags();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const filteredTags = tags.filter((tag) => {
    const matchesSearch = 
      tag.name_zh.toLowerCase().includes(search.toLowerCase()) ||
      (tag.name_en && tag.name_en.toLowerCase().includes(search.toLowerCase())) ||
      (tag.slug && tag.slug.toLowerCase().includes(search.toLowerCase())) ||
      tag.short_id.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'pillars') return tag.is_pillar;
    if (filterType === 'micro') return !tag.is_pillar;
    return true;
  });

  const pillarCount = tags.filter(t => t.is_pillar).length;
  const microCount = tags.filter(t => !t.is_pillar).length;

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden font-sans">
      
      {/* TOP HEADER */}
      <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Taxonomy & Tags</h1>
          <p className="text-xs text-gray-500">Manage Tier-2 Topic Pillars and polymorphic micro-tags across all content.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openCreateModal}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Create Tag
          </button>
        </div>
      </div>

      {/* FEEDBACK NOTIFICATION */}
      {statusMessage && (
        <div className={`px-8 py-2.5 text-xs font-medium flex items-center justify-between ${
          statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-100' : 'bg-red-50 text-red-800 border-b border-red-100'
        }`}>
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="underline ml-4 cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col overflow-hidden p-8">
        
        {/* FILTERS & SEARCH */}
        <div className="flex items-center justify-between mb-6 gap-4 shrink-0">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search tags by name, slug, or short_id..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-white text-gray-950 placeholder-gray-400 rounded-xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm text-xs font-medium text-gray-600">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filterType === 'all' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'hover:text-gray-900'
              }`}
            >
              All Tags ({tags.length})
            </button>
            <button
              onClick={() => setFilterType('pillars')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center cursor-pointer ${
                filterType === 'pillars' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'hover:text-gray-900'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 mr-1" /> Topic Pillars ({pillarCount})
            </button>
            <button
              onClick={() => setFilterType('micro')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center cursor-pointer ${
                filterType === 'micro' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'hover:text-gray-900'
              }`}
            >
              <Hash className="w-3.5 h-3.5 mr-1" /> Micro-Tags ({microCount})
            </button>
          </div>
        </div>

        {/* TAGS TABLE / LIST */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                <Loader2 className="w-6 h-6 animate-spin mr-2 text-indigo-600" />
                Loading taxonomy...
              </div>
            ) : filteredTags.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-12">
                <TagIcon className="w-12 h-12 text-gray-300 mb-3" />
                <h3 className="text-sm font-bold text-gray-900">No tags found</h3>
                <p className="text-xs text-gray-500 mt-1">Get started by creating your first Topic Pillar or Micro-tag.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    <th className="py-3.5 px-6">Tag Name & Badge</th>
                    <th className="py-3.5 px-6">Type</th>
                    <th className="py-3.5 px-6">Short ID / Vanity Slug</th>
                    <th className="py-3.5 px-6">Linked Usage</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredTags.map((tag) => (
                    <tr key={tag.id} className="hover:bg-gray-50/75 transition-colors group">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <span 
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold text-white shadow-xs"
                            style={{ backgroundColor: tag.color }}
                          >
                            {tag.is_pillar ? <Bookmark className="w-3 h-3 mr-1" /> : <Hash className="w-3 h-3 mr-1" />}
                            {tag.name_zh}
                          </span>
                          {tag.name_en && (
                            <span className="text-xs text-gray-400 font-normal">
                              / {tag.name_en}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {tag.is_pillar ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Tier-2 Pillar
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-600">
                            Micro-tag
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="font-mono text-xs text-gray-900">id: {tag.short_id}</span>
                          {tag.slug ? (
                            <span className="font-mono text-[11px] text-indigo-600">/{tag.slug}</span>
                          ) : (
                            <span className="text-[11px] text-gray-400 italic">No vanity slug</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                          {tag.usage_count || 0} reference(s)
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(tag)}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Tag"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(tag)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Tag"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {editingTag ? 'Edit Tag' : 'Create New Tag'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 pt-4">
              <FormInput
                label="Tag Name (Chinese) *"
                placeholder="例如：經教佛法 或 禪修營2026"
                value={formData.name_zh}
                onChange={(e) => setFormData({ ...formData, name_zh: e.target.value })}
                required
              />

              <FormInput
                label="Tag Name (English)"
                placeholder="e.g. Dhamma Talks or Retreat 2026"
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
              />

              <FormInput
                label="Vanity URL Slug (Optional)"
                placeholder="e.g. dhamma-talks"
                helperText="Letters, numbers, and hyphens only. Auto-generated if left blank."
                value={formData.slug}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-') 
                })}
                className="font-mono text-xs"
              />

              {/* Color Swatch Picker */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-950">
                  Badge Color
                </label>
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  {PRESET_COLORS.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: hex })}
                      className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center shadow-xs cursor-pointer ${
                        formData.color === hex ? 'scale-110 ring-2 ring-offset-2 ring-gray-900' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: hex }}
                    >
                      {formData.color === hex && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                    </button>
                  ))}
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-7 h-7 rounded-full border-0 p-0 cursor-pointer overflow-hidden shadow-xs"
                    title="Custom Color"
                  />
                </div>
              </div>

              {/* Topic Pillar Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-amber-50/60 border border-amber-200/70 rounded-xl mt-2">
                <div>
                  <span className="text-xs font-bold text-amber-950 flex items-center">
                    <Bookmark className="w-3.5 h-3.5 mr-1 text-amber-600" /> Tier-2 Topic Pillar
                  </span>
                  <p className="text-[11px] text-amber-800 leading-tight mt-0.5">
                    Elevates this tag as a main navigation filter tab on `/resources` and `/events`.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_pillar: !formData.is_pillar })}
                  className={`relative inline-flex h-5 w-9 rounded-full transition-colors shrink-0 ml-3 cursor-pointer ${
                    formData.is_pillar ? 'bg-amber-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition ${
                      formData.is_pillar ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="pt-4 border-t border-gray-100 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors flex items-center cursor-pointer"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                  {editingTag ? 'Save Changes' : 'Create Tag'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}