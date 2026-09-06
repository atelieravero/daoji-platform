'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Video, ExternalLink, FileSignature, CheckCircle2, 
  Copy, Check, X, Radio 
} from 'lucide-react';
import { EventRecord } from '@/app/admin/(dashboard)/events/actions';
import CalendarExportDropdown from '@/components/public/CalendarExportDropdown';

function YoutubeIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      width="24" 
      height="24" 
      stroke="currentColor" 
      strokeWidth="2" 
      fill="none" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <polygon points="10 15 15 12 10 9 10 15" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      width="24" 
      height="24" 
      stroke="currentColor" 
      strokeWidth="2" 
      fill="none" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

interface EventActionPortalProps {
  event: EventRecord;
  locale?: 'zh' | 'en';
}

export default function EventActionPortal({ event, locale = 'zh' }: EventActionPortalProps) {
  const isZh = locale === 'zh';
  const [now, setNow] = useState<Date | null>(null);
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // --------------------------------------------------------------------------
  // LIVESTREAM TIME-WINDOW ENGINE
  // --------------------------------------------------------------------------
  const streamConfig = event.livestream_config;
  const openMinutesBefore = streamConfig?.open_minutes_before ?? 15;

  const calculateLivestreamState = () => {
    if (!event.is_livestream || !streamConfig || !now) {
      return { status: 'disabled' as const, message: '' };
    }

    const start = new Date(event.start_date);
    const end = new Date(event.end_date);
    const durationMs = end.getTime() - start.getTime();

    // 1. Single Session
    if (!event.recurrence_rule) {
      const openTime = new Date(start.getTime() - openMinutesBefore * 60000);
      if (now >= openTime && now <= end) {
        return { status: 'active' as const, message: isZh ? '進入線上直播' : 'Join Livestream' };
      }
      if (now < openTime) {
        const timeStr = openTime.toLocaleTimeString(isZh ? 'zh-HK' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        const dateStr = openTime.toLocaleDateString(isZh ? 'zh-HK' : 'en-US', { month: 'numeric', day: 'numeric' });
        return { 
          status: 'upcoming' as const, 
          message: isZh ? `直播於 ${dateStr} ${timeStr} 開放` : `Opens at ${dateStr} ${timeStr}` 
        };
      }
      return { status: 'concluded' as const, message: isZh ? '直播已結束' : 'Session Concluded' };
    }

    // 2. Recurring Session: Search for next valid occurrence
    const targetDays: number[] = event.recurrence_rule.days_of_week || [start.getDay()];
    const until = event.recurrence_rule.until_date ? new Date(`${event.recurrence_rule.until_date}T23:59:59`) : null;
    const blackouts: string[] = event.blackout_dates || [];

    for (let dayOffset = 0; dayOffset <= 60; dayOffset++) {
      const candidateDate = new Date(now.getTime() + dayOffset * 86400000);
      if (until && candidateDate > until) break;

      if (targetDays.includes(candidateDate.getDay())) {
        const y = candidateDate.getFullYear();
        const m = String(candidateDate.getMonth() + 1).padStart(2, '0');
        const d = String(candidateDate.getDate()).padStart(2, '0');
        const dateKey = `${y}-${m}-${d}`;

        if (blackouts.includes(dateKey)) continue;

        const sessionStart = new Date(candidateDate);
        sessionStart.setHours(start.getHours(), start.getMinutes(), 0, 0);
        const sessionEnd = new Date(sessionStart.getTime() + durationMs);
        const openTime = new Date(sessionStart.getTime() - openMinutesBefore * 60000);

        if (now >= openTime && now <= sessionEnd) {
          return { status: 'active' as const, message: isZh ? '進入線上直播' : 'Join Livestream' };
        }
        if (now < openTime) {
          const timeStr = openTime.toLocaleTimeString(isZh ? 'zh-HK' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
          const dateStr = openTime.toLocaleDateString(isZh ? 'zh-HK' : 'en-US', { month: 'numeric', day: 'numeric' });
          return { 
            status: 'upcoming' as const, 
            message: isZh ? `下次直播於 ${dateStr} ${timeStr}` : `Next Live on ${dateStr} ${timeStr}` 
          };
        }
      }
    }

    return { status: 'concluded' as const, message: isZh ? '直播系列已圓滿' : 'Series Concluded' };
  };

  const livestreamState = calculateLivestreamState();

  // --------------------------------------------------------------------------
  // REGISTRATION BUTTON STATE
  // --------------------------------------------------------------------------
  const customLabel = isZh ? event.cta_label_zh : event.cta_label_en;

  const renderRegistrationButton = () => {
    if (event.registration_mode === 'not_required') {
      return (
        <div className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs font-semibold rounded-xl select-none shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{isZh ? '無需預先報名・自由入座' : 'No pre-registration required'}</span>
        </div>
      );
    }

    if (event.registration_status === 'upcoming') {
      return (
        <button 
          disabled 
          className="px-6 py-2.5 bg-[#FAF5F0] border border-[#A65D24]/40 text-[#A65D24] text-xs font-bold rounded-xl shadow-2xs cursor-not-allowed select-none"
        >
          {customLabel || (isZh ? '即將開放報名' : 'Opening Soon')}
        </button>
      );
    }

    if (event.registration_status === 'closed') {
      return (
        <button 
          disabled 
          className="px-6 py-2.5 bg-stone-200 border border-stone-300 text-stone-500 text-xs font-bold rounded-xl cursor-not-allowed select-none"
        >
          {customLabel || (isZh ? '報名截止' : 'Registration Closed')}
        </button>
      );
    }

    if (event.registration_mode === 'external_url' && event.external_url) {
      return (
        <a
          href={event.external_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#A65D24] hover:bg-[#8A4D1E] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <span>{customLabel || (isZh ? '前往外部報名' : 'Register on Portal')}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      );
    }

    const formTarget = event.linked_form_id 
      ? `/${locale}/form/${event.linked_form_id}`
      : '#register';

    return (
      <Link
        href={formTarget}
        className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#A65D24] hover:bg-[#8A4D1E] text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
      >
        <FileSignature className="w-3.5 h-3.5" />
        <span>{customLabel || (isZh ? '立即填表報名' : 'Register Now')}</span>
      </Link>
    );
  };

  return (
    <div className="flex flex-col md:items-end justify-between gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-stone-100">
      
      {/* TOP ACTION ROW: Calendar Export */}
      <CalendarExportDropdown
        event={{
          title: isZh ? event.title_zh : (event.title_en || event.title_zh),
          summary: isZh ? event.summary_zh : (event.summary_en || event.summary_zh),
          venueName: event.venues?.name_zh || event.venue_override_zh,
          startDate: event.start_date,
          endDate: event.end_date,
          isAllDay: event.is_all_day,
          recurrenceRule: event.recurrence_rule,
          blackoutDates: event.blackout_dates,
        }}
      />

      {/* BOTTOM ACTION ROW: Livestream Portal + Registration CTA */}
      <div className="flex items-center gap-2 flex-wrap">
        
        {/* LIVESTREAM PORTAL BUTTON */}
        {event.is_livestream && streamConfig && (
          <>
            {livestreamState.status === 'active' ? (
              <button
                type="button"
                onClick={() => setShowZoomModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer animate-pulse"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>{isZh ? '進入線上直播' : 'Join Live Stream'}</span>
              </button>
            ) : livestreamState.status === 'upcoming' ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50/80 border border-blue-200/80 text-blue-700 text-[11px] font-semibold rounded-xl select-none">
                <Radio className="w-3 h-3 text-blue-500 shrink-0" />
                <span>{livestreamState.message}</span>
              </div>
            ) : null}
          </>
        )}

        {/* REGISTRATION BUTTON */}
        {renderRegistrationButton()}
      </div>

      {/* MULTI-PLATFORM LIVESTREAM MODAL */}
      {showZoomModal && streamConfig && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-stone-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-blue-600 animate-pulse" />
                <h3 className="text-sm font-bold text-stone-900">
                  {isZh ? '線上直播頻道 (Live Channels)' : 'Live Streaming Gateways'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowZoomModal(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {/* ZOOM CHANNEL */}
              {streamConfig.zoom_url && (
                <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-bold text-stone-900">Zoom Cloud Meeting</span>
                    </div>
                    <a
                      href={streamConfig.zoom_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
                    >
                      {isZh ? '一鍵進入' : 'Direct Join'}
                    </a>
                  </div>

                  {(streamConfig.zoom_meeting_id || streamConfig.zoom_passcode) && (
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-blue-200/50 text-xs">
                      {streamConfig.zoom_meeting_id && (
                        <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-blue-200/60">
                          <div>
                            <span className="text-[10px] text-stone-400 block uppercase">ID</span>
                            <span className="font-mono font-bold text-stone-800">{streamConfig.zoom_meeting_id}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(streamConfig.zoom_meeting_id!, 'id')}
                            className="text-stone-400 hover:text-blue-600 transition-colors p-1"
                            title="Copy ID"
                          >
                            {copiedField === 'id' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      )}

                      {streamConfig.zoom_passcode && (
                        <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-blue-200/60">
                          <div>
                            <span className="text-[10px] text-stone-400 block uppercase">Passcode</span>
                            <span className="font-mono font-bold text-stone-800">{streamConfig.zoom_passcode}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(streamConfig.zoom_passcode!, 'pwd')}
                            className="text-stone-400 hover:text-blue-600 transition-colors p-1"
                            title="Copy Passcode"
                          >
                            {copiedField === 'pwd' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* YOUTUBE CHANNEL */}
              {streamConfig.youtube_url && (
                <a
                  href={streamConfig.youtube_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3.5 bg-red-50/60 hover:bg-red-50 text-red-900 rounded-2xl border border-red-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <YoutubeIcon className="w-4 h-4 text-red-600" />
                    <span className="text-xs font-bold">YouTube Live Stream</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-red-400" />
                </a>
              )}

              {/* FACEBOOK CHANNEL */}
              {streamConfig.facebook_url && (
                <a
                  href={streamConfig.facebook_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3.5 bg-indigo-50/60 hover:bg-indigo-50 text-indigo-900 rounded-2xl border border-indigo-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <FacebookIcon className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold">Facebook Live Stream</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}