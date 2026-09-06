'use client';

import React, { useState, useEffect } from 'react';
import { FormInput } from '@/components/ui/FormControls';
import MarkdownEditor from '@/components/shared/MarkdownEditor';
import { upsertOrganizerAction, OrganizerRecord } from '@/app/admin/(dashboard)/events/actions';

interface OrganizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  initialData?: OrganizerRecord | null;
  onSuccess: (organizer: OrganizerRecord) => void;
}

export default function OrganizerModal({
  isOpen,
  onClose,
  mode,
  initialData,
  onSuccess,
}: OrganizerModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    id: '',
    nameEn: '',
    nameZh: '',
    url: '',
    descriptionEn: '',
    descriptionZh: '',
  });

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialData) {
        setForm({
          id: initialData.id,
          nameEn: initialData.name_en || '',
          nameZh: initialData.name_zh || '',
          url: initialData.url || '',
          descriptionEn: initialData.description_en || '',
          descriptionZh: initialData.description_zh || '',
        });
      } else {
        setForm({
          id: '',
          nameEn: '',
          nameZh: '',
          url: '',
          descriptionEn: '',
          descriptionZh: '',
        });
      }
    }
  }, [isOpen, mode, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nameEn.trim()) {
      alert('Organizer Name (English) is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<OrganizerRecord> = {
        ...(mode === 'edit' && form.id ? { id: form.id } : {}),
        name_en: form.nameEn.trim(),
        name_zh: form.nameZh.trim() || null,
        url: form.url.trim() || null,
        description_en: form.descriptionEn.trim() || null,
        description_zh: form.descriptionZh.trim() || null,
      };

      const res = await upsertOrganizerAction(payload);
      if (res.success && res.data) {
        onSuccess(res.data);
        onClose();
      } else {
        alert(res.error || 'Failed to save organizer.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
        <h3 className="text-sm font-bold text-gray-900">
          {mode === 'edit' ? 'Edit Organizer' : 'Register New Organizer'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Organizer Name (English) *"
            placeholder="e.g. Maggapatipada Sangha Trust"
            value={form.nameEn}
            onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
            required
          />

          <FormInput
            label="Organizer Name (Chinese)"
            placeholder="例如：道跡禪林僧團"
            value={form.nameZh}
            onChange={(e) => setForm({ ...form, nameZh: e.target.value })}
          />

          <FormInput
            label="Website URL"
            placeholder="https://daoji.org"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
          />

          <div>
            <label className="block text-sm font-semibold text-gray-950 mb-1.5">
              Description (English)
            </label>
            <MarkdownEditor
              rows={3}
              placeholder="Brief description, mission, or monastic lineage..."
              value={form.descriptionEn}
              onChange={(val) => setForm({ ...form, descriptionEn: val })}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-950 mb-1.5">
              Description (Chinese)
            </label>
            <MarkdownEditor
              rows={3}
              placeholder="機構簡介、願景或僧團淵源..."
              value={form.descriptionZh}
              onChange={(val) => setForm({ ...form, descriptionZh: val })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg cursor-pointer transition-colors"
            >
              {isSubmitting ? 'Saving...' : mode === 'edit' ? 'Update Organizer' : 'Save Organizer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}