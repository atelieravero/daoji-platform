'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, FileSignature, Check, AlertCircle, Loader2 } from 'lucide-react';
import { getForms } from '@/app/admin/(dashboard)/forms/actions';

interface FormOption {
  id: string;
  title: string;
  slug: string | null;
  status: string;
  is_followup: boolean;
  events?: {
    code: string | null;
    title_zh: string;
  } | null;
}

interface FormPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFormId: string | null;
  onSelectForm: (form: FormOption) => void;
}

export default function FormPickerModal({
  isOpen,
  onClose,
  selectedFormId,
  onSelectForm,
}: FormPickerModalProps) {
  const [forms, setForms] = useState<FormOption[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      getForms()
        .then((data) => setForms(data))
        .catch((err) => console.error('Error loading forms:', err))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredForms = forms.filter((f) => {
    const q = search.toLowerCase();
    return (
      f.title.toLowerCase().includes(q) ||
      (f.slug && f.slug.toLowerCase().includes(q)) ||
      (f.events?.code && f.events.code.toLowerCase().includes(q)) ||
      (f.events?.title_zh && f.events.title_zh.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
        
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <FileSignature className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-gray-900">Select Linked Form</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SEARCH */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search forms by title, slug, or event code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
            />
          </div>
        </div>

        {/* LIST */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoading ? (
            <div className="py-12 flex items-center justify-center text-xs text-gray-400 gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span>Loading forms...</span>
            </div>
          ) : filteredForms.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400">
              No forms matched your search.
            </div>
          ) : (
            filteredForms.map((f) => {
              const isSelected = selectedFormId === f.id;
              return (
                <div
                  key={f.id}
                  onClick={() => {
                    onSelectForm(f);
                    onClose();
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'bg-white border-gray-200 hover:border-indigo-200 hover:bg-gray-50/80'
                  }`}
                >
                  <div className="space-y-1 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900">{f.title}</span>
                      {f.events?.code && (
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 bg-indigo-50 text-indigo-700 border border-indigo-200/60 rounded">
                          [{f.events.code}]
                        </span>
                      )}
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded border ${
                        f.status === 'open' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : f.status === 'closed'
                          ? 'bg-stone-100 text-stone-500 border-stone-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {f.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-gray-400 font-mono">
                      {f.slug && <span>/form/{f.slug}</span>}
                      {f.is_followup && (
                        <span className="text-purple-600 font-sans font-medium">• Follow-up</span>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}