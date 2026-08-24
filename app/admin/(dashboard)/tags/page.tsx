'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Loader2, X, Check, Bookmark, Hash } from 'lucide-react';
import { FormInput } from '@/components/ui/FormControls';
import { listTagsAction, createTagAction, updateTagAction, deleteTagAction, TagRecord } from './actions';
import AdminPageHeader from '@/components/admin/shared/AdminPageHeader';
import AdminTableToolbar from '@/components/admin/shared/AdminTableToolbar';
import AdminTableCard from '@/components/admin/shared/AdminTableCard';
import AdminStatusBanner from '@/components/admin/shared/AdminStatusBanner';

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
  const [filterType, setFilterType] = useState<string>('all');
  
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

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-8 h-full font-sans relative">
      {/* HEADER */}
      <AdminPageHeader
        title="Taxonomy & Tags"
        description="Manage Tier-2 Topic Pillars and polymorphic micro-tags across all content."
        actionButton={{
          label: 'Create Tag',
          onClick: openCreateModal,
          icon: Plus,
        }}
      />

      {/* FEEDBACK BANNER */}
      <AdminStatusBanner message={statusMessage} onDismiss={() => setStatusMessage(null)} className="mb-6 rounded-xl" />

      {/* TOOLBAR */}
      <AdminTableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search tags by name, slug, or short_id..."
        statusFilter={filterType}
        onStatusFilterChange={setFilterType}
        filterOptions={[
          { value: 'all', label: `All Tags (${tags.length})` },
          { value: 'pillars', label: `Topic Pillars (${tags.filter(t => t.is_pillar).length})` },
          { value: 'micro', label: `Micro-Tags (${tags.filter(t => !t.is_pillar).length})` },
        ]}
      />

      {/* TABLE */}
      <AdminTableCard
        isLoading={isLoading}
        loadingText="Loading taxonomy..."
        isEmpty={filteredTags.length === 0}
        emptyTitle="No tags found"
        emptyDescription="Get started by creating your first Topic Pillar or Micro-tag."
      >
        <table className="min-w-full divide-y divide-gray-200 text-left">
          <thead className="bg-gray-50/50">
            <tr className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              <th className="py-3.5 px-6">Tag Name & Badge</th>
              <th className="py-3.5 px-6">Type</th>
              <th className="py-3.5 px-6">Short ID / Vanity Slug</th>
              <th className="py-3.5 px-6">Linked Usage</th>
              <th className="py-3.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100 text-sm">
            {filteredTags.map((tag) => (
              <tr key={tag.id} className="hover:bg-gray-50/75 transition-colors group">
                <td className="py-4 px-6 whitespace-nowrap">
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
                <td className="py-4 px-6 whitespace-nowrap">
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
                <td className="py-4 px-6 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="font-mono text-xs text-gray-900">id: {tag.short_id}</span>
                    {tag.slug ? (
                      <span className="font-mono text-[11px] text-indigo-600">/{tag.slug}</span>
                    ) : (
                      <span className="text-[11px] text-gray-400 italic">No vanity slug</span>
                    )}
                  </div>
                </td>
                <td className="py-4 px-6 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                    {tag.usage_count || 0} reference(s)
                  </span>
                </td>
                <td className="py-4 px-6 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(tag)}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                      title="Edit Tag"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
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
      </AdminTableCard>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">
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
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition ${
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
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors flex items-center cursor-pointer"
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