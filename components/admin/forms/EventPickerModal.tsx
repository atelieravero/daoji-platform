'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, CalendarDays, Check, Loader2 } from 'lucide-react';
import { getEventsForFormBuilder, FormEventOption } from '@/app/admin/(dashboard)/forms/builder/actions';

interface EventPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEventId: string | null;
  onSelectEvent: (event: FormEventOption) => void;
}

export default function EventPickerModal({
  isOpen,
  onClose,
  selectedEventId,
  onSelectEvent,
}: EventPickerModalProps) {
  const [events, setEvents] = useState<FormEventOption[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      getEventsForFormBuilder()
        .then((data) => setEvents(data))
        .catch((err) => console.error('Error loading events:', err))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredEvents = events.filter((e) => {
    const q = search.toLowerCase();
    return (
      e.title_zh.toLowerCase().includes(q) ||
      (e.title_en && e.title_en.toLowerCase().includes(q)) ||
      (e.code && e.code.toLowerCase().includes(q)) ||
      e.short_id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
        
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-gray-900">Select Linked Event</h3>
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
              placeholder="Search by event title, code, or short ID..."
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
              <span>Loading events...</span>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400">
              No events matched your query.
            </div>
          ) : (
            filteredEvents.map((evt) => {
              const isSelected = selectedEventId === evt.id;
              return (
                <div
                  key={evt.id}
                  onClick={() => {
                    onSelectEvent(evt);
                    onClose();
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'bg-white border-gray-200 hover:border-indigo-200 hover:bg-gray-50/80'
                  }`}
                >
                  <div className="space-y-1 pr-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-gray-900">{evt.title_zh}</span>
                      {evt.code && (
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 bg-indigo-50 text-indigo-700 border border-indigo-200/60 rounded">
                          [{evt.code}]
                        </span>
                      )}
                      <span className="text-[10px] uppercase font-semibold text-gray-500 font-mono">
                        ({evt.status})
                      </span>
                    </div>

                    {evt.title_en && (
                      <p className="text-[11px] text-gray-500">{evt.title_en}</p>
                    )}

                    <div className="text-[10px] text-gray-400 font-mono">
                      id: {evt.short_id}
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