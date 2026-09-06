'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  CalendarDays, Plus, MapPin, Eye, Trash2, Copy, Radio, Share2, Building2, Globe2 
} from 'lucide-react';
import { 
  listEventsAction, 
  deleteEventAction, 
  getEventPermissionsAction, 
  saveEventAction,
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

export default function EventsAdminPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [shareEvent, setShareEvent] = useState<EventRecord | null>(null);

  const [permissions, setPermissions] = useState({
    canView: false,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canPublish: false,
  });

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const [eventsRes, permsRes] = await Promise.all([
        listEventsAction({ status: statusFilter, search, limit: 50 }),
        getEventPermissionsAction(),
      ]);
      setEvents(eventsRes.data);
      setTotal(eventsRes.total);
      setPermissions(permsRes);
    } catch (err: any) {
      console.error('Error loading events:', err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

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
        setEvents((prev) => prev.map((e) => e.id === event.id ? { ...e, status: newStatus as EventStatus } : e));
      } else {
        alert(res.error || 'Failed to update status.');
      }
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  const renderRegistrationModeBadge = (event: EventRecord) => {
    switch (event.registration_mode) {
      case 'internal_form':
        return (
          <div className="flex flex-col items-center gap-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200/80 text-amber-800 text-[11px] font-semibold">
              內部表單
            </span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
              event.registration_status === 'open'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : event.registration_status === 'closed'
                ? 'bg-gray-100 text-gray-500 border-gray-200'
                : 'bg-stone-50 text-stone-600 border-stone-200'
            }`}>
              {event.registration_status}
            </span>
          </div>
        );
      case 'external_url':
        return (
          <div className="flex flex-col items-center gap-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200/80 text-blue-700 text-[11px] font-semibold">
              外部連結
            </span>
            <span className="text-[10px] font-mono text-gray-500">
              {event.registration_status}
            </span>
          </div>
        );
      case 'not_required':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-[11px] font-semibold">
            無需報名
          </span>
        );
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-8 h-full font-sans relative">
      
      {/* UNIVERSAL QR SHARE MODAL */}
      <ShareQrModal
        isOpen={Boolean(shareEvent)}
        onClose={() => setShareEvent(null)}
        title="Share Event"
        url={shareEvent ? `${typeof window !== 'undefined' ? window.location.origin : ''}/zh/events/${shareEvent.slug || shareEvent.short_id}` : ''}
        filename={shareEvent?.slug || shareEvent?.short_id || 'event'}
      />

      {/* HEADER */}
      <AdminPageHeader
        title="Events Management"
        description="Design operational retreat schedules, recurring classes, and registration gates."
        actionButton={permissions.canCreate ? { label: 'Create Event', href: '/admin/events/new', icon: Plus } : undefined}
      />

      {/* FEEDBACK BANNER */}
      <AdminStatusBanner message={statusMessage} onDismiss={() => setStatusMessage(null)} className="mb-6 rounded-xl" />

      {/* TOOLBAR */}
      <AdminTableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search events by title, code, slug, organizer..."
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        filterOptions={[
          { value: 'all', label: 'All' },
          { value: 'published', label: 'Published' },
          { value: 'unlisted', label: 'Unlisted' },
          { value: 'draft', label: 'Draft' },
          { value: 'archived', label: 'Archived' },
        ]}
      />

      {/* TABLE CARD */}
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

                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1 flex-wrap">
                      {event.is_in_person && venueName && (
                        <span className="inline-flex items-center gap-1 text-stone-700 font-medium bg-stone-50 px-1.5 py-0.5 rounded border border-stone-200/60">
                          <MapPin className="w-3 h-3 text-indigo-600 shrink-0" />
                          <span className="truncate max-w-[160px]">{venueName}</span>
                        </span>
                      )}

                      {event.is_livestream && (
                        <span className="inline-flex items-center gap-1 text-blue-700 font-medium bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60">
                          <Radio className="w-3 h-3 text-blue-500 shrink-0" />
                          <span>直播</span>
                        </span>
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
                    {renderRegistrationModeBadge(event)}
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