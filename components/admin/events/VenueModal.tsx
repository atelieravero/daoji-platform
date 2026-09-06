'use client';

import React, { useState, useEffect } from 'react';
import { FormInput, FormSelect } from '@/components/ui/FormControls';
import MarkdownEditor from '@/components/shared/MarkdownEditor';
import { SUPPORTED_TIMEZONES, DEFAULT_TIMEZONE } from '@/lib/timezones';
import { upsertVenueAction, VenueRecord } from '@/app/admin/(dashboard)/events/actions';

interface VenueModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  initialData?: VenueRecord | null;
  onSuccess: (venue: VenueRecord) => void;
}

export default function VenueModal({
  isOpen,
  onClose,
  mode,
  initialData,
  onSuccess,
}: VenueModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    id: '',
    nameEn: '',
    nameZh: '',
    addressEn: '',
    addressZh: '',
    timezone: DEFAULT_TIMEZONE,
    googleMapsUrl: '',
    amapUrl: '',
    transportGuideEn: '',
    transportGuideZh: '',
  });

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialData) {
        setForm({
          id: initialData.id,
          nameEn: initialData.name_en || '',
          nameZh: initialData.name_zh || '',
          addressEn: initialData.address_en || '',
          addressZh: initialData.address_zh || '',
          timezone: initialData.timezone || DEFAULT_TIMEZONE,
          googleMapsUrl: initialData.google_maps_url || '',
          amapUrl: initialData.amap_url || '',
          transportGuideEn: initialData.transport_guide_en || '',
          transportGuideZh: initialData.transport_guide_zh || '',
        });
      } else {
        setForm({
          id: '',
          nameEn: '',
          nameZh: '',
          addressEn: '',
          addressZh: '',
          timezone: DEFAULT_TIMEZONE,
          googleMapsUrl: '',
          amapUrl: '',
          transportGuideEn: '',
          transportGuideZh: '',
        });
      }
    }
  }, [isOpen, mode, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nameZh.trim()) {
      alert('Venue Name (Chinese) is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<VenueRecord> = {
        ...(mode === 'edit' && form.id ? { id: form.id } : {}),
        name_en: form.nameEn.trim() || null,
        name_zh: form.nameZh.trim(),
        address_en: form.addressEn.trim() || null,
        address_zh: form.addressZh.trim() || null,
        timezone: form.timezone || DEFAULT_TIMEZONE,
        google_maps_url: form.googleMapsUrl.trim() || null,
        amap_url: form.amapUrl.trim() || null,
        transport_guide_en: form.transportGuideEn.trim() || null,
        transport_guide_zh: form.transportGuideZh.trim() || null,
      };

      const res = await upsertVenueAction(payload);
      if (res.success && res.data) {
        onSuccess(res.data);
        onClose();
      } else {
        alert(res.error || 'Failed to save venue.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
        <h3 className="text-sm font-bold text-gray-900">
          {mode === 'edit' ? 'Edit Venue' : 'Register New Venue'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Venue Name (English)"
            placeholder="e.g. Daoji Zen Monastery"
            value={form.nameEn}
            onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
          />

          <FormInput
            label="Venue Name (Chinese) *"
            placeholder="例如：大嶼山道跡禪林"
            value={form.nameZh}
            onChange={(e) => setForm({ ...form, nameZh: e.target.value })}
            required
          />

          <FormInput
            label="Address (English)"
            placeholder="e.g. Lantau Island, Hong Kong"
            value={form.addressEn}
            onChange={(e) => setForm({ ...form, addressEn: e.target.value })}
          />

          <FormInput
            label="Address (Chinese)"
            placeholder="例如：香港大嶼山..."
            value={form.addressZh}
            onChange={(e) => setForm({ ...form, addressZh: e.target.value })}
          />

          <FormSelect
            label="Venue Timezone"
            value={form.timezone}
            onChange={(e) => setForm({ ...form, timezone: e.target.value })}
          >
            {SUPPORTED_TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </FormSelect>

          <FormInput
            label="Google Maps URL"
            placeholder="https://maps.google.com/..."
            value={form.googleMapsUrl}
            onChange={(e) => setForm({ ...form, googleMapsUrl: e.target.value })}
          />

          <FormInput
            label="Amap (高德地圖) URL"
            placeholder="https://surl.amap.com/..."
            value={form.amapUrl}
            onChange={(e) => setForm({ ...form, amapUrl: e.target.value })}
          />

          <div>
            <label className="block text-sm font-semibold text-gray-950 mb-1.5">
              Transport Guide (English)
            </label>
            <MarkdownEditor
              rows={3}
              placeholder="Transit directions, bus routes, ferry timetables..."
              value={form.transportGuideEn}
              onChange={(val) => setForm({ ...form, transportGuideEn: val })}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-950 mb-1.5">
              Transport Guide (Chinese)
            </label>
            <MarkdownEditor
              rows={3}
              placeholder="交通指南、渡輪及巴士路線..."
              value={form.transportGuideZh}
              onChange={(val) => setForm({ ...form, transportGuideZh: val })}
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
              {isSubmitting ? 'Saving...' : mode === 'edit' ? 'Update Venue' : 'Save Venue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}