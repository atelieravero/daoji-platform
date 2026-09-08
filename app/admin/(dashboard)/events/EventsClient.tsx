'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  CalendarDays, Plus, MapPin, Eye, Trash2, Copy, Radio, Share2, Building2, Globe2 
} from 'lucide-react';
import { 
  listEventsAction, 
  deleteEventAction, 
  saveEventAction,
  toggleLivestreamLiveAction,
  EventRecord, 
  EventStatus,
  EventLanguage 
} from './actions';
import { formatEventDateRange } from '@/lib/date';
import AdminPageHeader from '@/components/admin/shared/AdminPageHeader';
import AdminTableToolbar from '@/components/admin/shared/AdminTableToolbar';
import AdminTableCard from '@/components/admin/shared/AdminTableCard';
import AdminStatusBanner from '@/components/admin/shared/AdminStatusBanner';
import StatusBadgeSelect from '@/components/admin/shared/StatusBadgeSelect';
import ShareQrModal from '@/components/admin/shared/ShareQrModal';

const LANGUAGE_LABELS: Record<EventLanguage, string> = {
  cantonese: '粵',
  mandarin: '普',
  english: 'EN',
  thai: '泰',
};

interface EventsClientProps {
  permissions: {
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canPublish: boolean;
  };
  initialEvents: EventRecord[];
  initialTotal: number;
}

export default function EventsClient({ permissions, initialEvents, initialTotal }: EventsClientProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [events, setEvents] = useState<EventRecord[]>(initialEvents);
  const [total, setTotal] = useState(initialTotal);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [shareEvent, setShareEvent] = useState<EventRecord | null>(null);
  const [togglingLiveId, setTogglingLiveId] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await listEventsAction({ status: statusFilter, search, limit: 50 });
      setEvents(res.data);
      setTotal(res.total);
    } catch (err: any) {
      console.error('Error loading events:', err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, search]);

  const handleQuickLiveToggle = async (event: EventRecord) => {
    if (!permissions.canEdit) return;
    const nextLiveState = !event.is_livestream_live;
    setTogglingLiveId(event.id);

    try {
      const res = await toggleLivestreamLiveAction(event.id, nextLiveState);
      if (res.success) {
        setEvents((prev) =>
          prev.map((e) => (e.id === event.id ? { ...e, is_livestream_live: nextLiveState } : e))
        );
        setStatusMessage({
          type: 'success',
          text: `Livestream is now ${nextLiveState ? 'LIVE' : 'OFFLINE'} for "${event.title_zh}".`,
        });
      } else {
        alert(res.error || 'Failed to toggle livestream state.');
      }
    } finally {
      setTogglingLiveId(null);
    }
  };

  const handleDelete = async (event: EventRecord) => {
    if (!confirm(`Are you sure you want to delete event "${event.title_zh}"?`)) return;

    try {
      const res = await deleteEventAction(event.id);
      if (res.success) {
        setStatusMessage({ type: 'success', text: 'Event deleted successfully.' });
        fetchEvents();
      } else {
        setStatusMessage({ type: 'error', text: res.error || 'Failed to delete event.' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to delete event.' });
    }
  };

  const handleDuplicate = async (event: EventRecord) => {
    try {
      const duplicatePayload: Partial<EventRecord> = {
        ...event,
        id: undefined,
        slug: null,
        title_zh: `${event.title_zh} (Copy)`,
        title_en: event.title_en ? `${event.title_en} (Copy)` : null,
        status: 'draft',
      };
      const res = await saveEventAction(duplicatePayload);
      if (res.success && res.data) {
        router.push(`/admin/events/${res.data.id}`);
      } else {
        alert(res.error || 'Failed to duplicate event.');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to duplicate event.');
    }
  };

  const handleStatusChange = async (event: EventRecord, newStatus: string) => {
    try {
      const res = await saveEventAction({ ...event, status: newStatus as EventStatus });
      if (res.success) {
        setEvents((prev) => prev.map((e) => (e.id === event.id ? { ...e, status: newStatus as EventStatus } : e)));
      } else {
        alert(res.error || 'Failed to update status.');
      }
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-8 h-full font-sans relative">
      <ShareQrModal
        isOpen={Boolean(shareEvent)}
        onClose={() => setShareEvent(null)}
        title="Share Event"
        url={shareEvent ? `${typeof window !== 'undefined' ? window.location.origin : ''}/zh/events/${shareEvent.slug || shareEvent.short_id}` : ''}
        filename={shareEvent?.slug || shareEvent?.short_id || 'event'}
      />

      <AdminPageHeader
        title="Events Management"
        description="Design operational retreat schedules, recurring classes, and registration gates."
        actionButton={permissions.canCreate ? { label: 'Create Event', href: '/admin/events/new', icon: Plus } : undefined}
      />

      <AdminStatusBanner message={statusMessage} onDismiss={() => setStatusMessage(null)} className="mb-6 rounded-xl" />

      <AdminTableToolbar
        search={search}
        onSearchChange={(val) => { setSearch(val); fetchEvents(); }}
        searchPlaceholder="Search events by title, code, slug, organizer..."
        statusFilter={statusFilter}
        onStatusFilterChange={(val) => { setStatusFilter(val); fetchEvents(); }}
        filterOptions={[
          { value: 'all', label: 'All' },
          { value: 'published', label: 'Published' },
          { value: 'unlisted', label: 'Unlisted' },
          { value: 'draft', label: 'Draft' },
          { value: 'archived', label: 'Archived' },
        ]}
      />

      <AdminTableCard
        isLoading={isLoading}
        loadingText="Loading events registry..."
        isEmpty={events.length === 0}
        emptyTitle="No events found"
        emptyDescription="Create an event schedule or adjust your search filters."
      >
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50/50">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-2/5">
                Event & Organizer
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Schedule & Channels
              </th>
              <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Registration Gate
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
            {events.map((event) => {
              const venueName = event.is_in_person
                ? (event.venues?.name_zh || event.venue_override_zh || '待定場地')
                : null;
              
              const organizerName = event.organizers
                ? (event.organizers.name_zh || event.organizers.name_en)
                : null;

              return (
                <tr key={event.id} className="hover:bg-gray-50/80 transition-colors">
                  
                  {/* 1. EVENT & ORGANIZER */}
                  <td className="px-6 py-4">
                    <div className="flex items-start">
                      <div className="shrink-0 h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100 mt-0.5">
                        <CalendarDays className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="ml-4 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link 
                            href={`/admin/events/${event.id}`}
                            className="text-sm font-bold text-gray-900 hover:text-indigo-600 transition-colors"
                          >
                            {event.title_zh}
                          </Link>
                          {event.is_featured && (
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                              Featured
                            </span>
                          )}
                          {event.is_standalone && (
                            <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded font-mono">
                              Standalone
                            </span>
                          )}
                        </div>

                        {event.title_en && (
                          <div className="text-xs text-gray-500">{event.title_en}</div>
                        )}

                        <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                          {organizerName && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded">
                              <Building2 className="w-3 h-3 text-stone-400" />
                              <span className="truncate max-w-[140px]">{organizerName}</span>
                            </span>
                          )}

                          {event.languages && event.languages.length > 0 && (
                            <div className="inline-flex items-center gap-1">
                              {event.languages.map((lang) => (
                                <span 
                                  key={lang} 
                                  className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded"
                                >
                                  {LANGUAGE_LABELS[lang] || lang}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 font-mono text-[11px] text-gray-400">
                          {event.code && (
                            <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded font-bold border border-indigo-100">
                              {event.code}
                            </span>
                          )}
                          <span>id: {event.short_id}</span>
                          {event.slug && <span className="text-indigo-600 font-medium">/{event.slug}</span>}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* 2. SCHEDULE & CHANNELS */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-xs font-semibold text-gray-900 leading-snug">
                      {formatEventDateRange(
                        event.start_date, 
                        event.end_date, 
                        event.timezone, 
                        event.is_all_day, 
                        'zh-HK', 
                        event.recurrence_rule
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1.5 flex-wrap">
                      {event.is_in_person && venueName && (
                        <span className="inline-flex items-center gap-1 text-stone-700 font-medium bg-stone-50 px-1.5 py-0.5 rounded border border-stone-200/60">
                          <MapPin className="w-3 h-3 text-indigo-600 shrink-0" />
                          <span className="truncate max-w-[160px]">{venueName}</span>
                        </span>
                      )}

                      {/* LIVESTREAM STATUS QUICK TOGGLE */}
                      {event.is_livestream && (
                        <button
                          type="button"
                          onClick={() => handleQuickLiveToggle(event)}
                          disabled={!permissions.canEdit || togglingLiveId === event.id}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-semibold transition-all cursor-pointer ${
                            event.is_livestream_live
                              ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-2xs'
                              : 'bg-stone-50 border-stone-200 text-stone-500 hover:bg-stone-100'
                          }`}
                          title="Click to toggle live broadcast status on/off"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${event.is_livestream_live ? 'bg-rose-600 animate-pulse' : 'bg-stone-400'}`} />
                          <span>{event.is_livestream_live ? 'LIVE' : 'Offline'}</span>
                        </button>
                      )}

                      {event.recurrence_rule && (
                        <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold px-1.5 py-0.5 rounded">
                          定期
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 3. REGISTRATION GATE */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {event.registration_mode === 'internal_form' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold">
                        內部表單
                      </span>
                    ) : event.registration_mode === 'external_url' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-semibold">
                        外部連結
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold">
                        無需報名
                      </span>
                    )}
                  </td>

                  {/* 4. PUBLISHING STATUS */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <StatusBadgeSelect
                      value={event.status || 'draft'}
                      onChange={(newStatus) => handleStatusChange(event, newStatus)}
                      disabled={!permissions.canPublish}
                      options={[
                        { value: 'draft', label: 'Draft' },
                        { value: 'published', label: 'Published' },
                        { value: 'unlisted', label: 'Unlisted' },
                        { value: 'archived', label: 'Archived' },
                      ]}
                    />
                  </td>

                  {/* 5. ROW ACTIONS */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-1">
                      {permissions.canDelete && (
                        <button 
                          onClick={() => handleDelete(event)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Event"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      <a 
                        href={`/zh/events/${event.slug || event.short_id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer" 
                        title="Preview Public Page"
                      >
                        <Eye className="w-4 h-4" />
                      </a>

                      <button 
                        onClick={() => setShareEvent(event)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer" 
                        title="Share & QR Code"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>

                      {permissions.canCreate && (
                        <button 
                          onClick={() => handleDuplicate(event)}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer" 
                          title="Duplicate Event"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </AdminTableCard>
    </div>
  );
}