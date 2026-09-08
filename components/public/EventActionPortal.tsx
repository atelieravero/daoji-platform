'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ExternalLink, FileSignature, CheckCircle2, Radio } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { EventRecord } from '@/app/admin/(dashboard)/events/actions';
import CalendarExportDropdown from '@/components/public/CalendarExportDropdown';
import { LivestreamGatewayModal } from '@/components/public/LivestreamGatewayModal';

/**
 * Formats a Date object:
 * - Chinese: `m月d日` (e.g. 9月10日)
 * - English: `d mmm` (e.g. 10 Sep)
 */
function formatShortDate(date: Date, isZh: boolean): string {
  if (isZh) {
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }
  const day = date.getDate();
  const mmm = date.toLocaleDateString('en-US', { month: 'short' });
  return `${day} ${mmm}`;
}

interface EventActionPortalProps {
  event: EventRecord;
  locale?: 'zh' | 'en';
}

export default function EventActionPortal({ event, locale = 'zh' }: EventActionPortalProps) {
  const t = useTranslations('EventDetail');
  const isZh = locale === 'zh';
  const [now, setNow] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  const streamConfig = event.livestream_config;
  const isLive = Boolean(event.is_livestream_live);
  const mode = (streamConfig?.mode as 'auto' | 'manual') || 'auto';
  const openMinutesBefore = streamConfig?.open_minutes_before ?? 15;

  const calculateLivestreamState = (): { status: 'active' | 'upcoming' | 'disabled'; message: string } => {
    if (!event.is_livestream || !streamConfig) {
      return { status: 'disabled', message: '' };
    }

    // 1. Manual live toggle override
    if (isLive) {
      return { status: 'active', message: t('joinLivestream') };
    }

    // 2. Manual mode without active live broadcast remains hidden
    if (mode === 'manual') {
      return { status: 'disabled', message: '' };
    }

    // 3. Auto schedule-based window calculation
    if (!now) return { status: 'disabled', message: '' };

    const start = new Date(event.start_date);
    const end = new Date(event.end_date);
    const durationMs = end.getTime() - start.getTime();

    // 3a. Single Session
    if (!event.recurrence_rule) {
      let sessionStart = new Date(start);
      let sessionEnd = new Date(end);

      if (event.is_all_day) {
        sessionStart.setHours(0, 0, 0, 0);
        sessionEnd.setHours(23, 59, 59, 999);
      }

      const openTime = new Date(sessionStart.getTime() - openMinutesBefore * 60000);

      if (now >= openTime && now <= sessionEnd) {
        return { status: 'active', message: t('joinLivestream') };
      }
      if (now < openTime) {
        const timeStr = event.is_all_day
          ? ''
          : openTime.toLocaleTimeString(isZh ? 'zh-HK' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        const dateStr = formatShortDate(openTime, isZh);
        return {
          status: 'upcoming',
          message: timeStr ? t('livestreamOpensAt', { date: dateStr, time: timeStr }) : dateStr,
        };
      }
      return { status: 'disabled', message: '' };
    }

    // 3b. Recurring Series Projection Engine
    const targetDays: number[] = event.recurrence_rule.days_of_week || [start.getDay()];
    const until = event.recurrence_rule.until_date ? new Date(`${event.recurrence_rule.until_date}T23:59:59`) : null;
    const blackouts: string[] = event.blackout_dates || [];

    for (let dayOffset = 0; dayOffset <= 60; dayOffset++) {
      const candidate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset);
      if (until && candidate > until) break;

      if (targetDays.includes(candidate.getDay())) {
        const y = candidate.getFullYear();
        const m = String(candidate.getMonth() + 1).padStart(2, '0');
        const d = String(candidate.getDate()).padStart(2, '0');
        const dateKey = `${y}-${m}-${d}`;

        if (blackouts.includes(dateKey)) continue;

        const sessionStart = new Date(candidate);
        let sessionEnd: Date;

        if (event.is_all_day) {
          sessionStart.setHours(0, 0, 0, 0);
          sessionEnd = new Date(candidate);
          sessionEnd.setHours(23, 59, 59, 999);
        } else {
          sessionStart.setHours(start.getHours(), start.getMinutes(), start.getSeconds() || 0, 0);
          sessionEnd = new Date(sessionStart.getTime() + (durationMs > 0 ? durationMs : 7200000));
        }

        if (sessionEnd < start) continue;

        const openTime = new Date(sessionStart.getTime() - openMinutesBefore * 60000);

        if (now >= openTime && now <= sessionEnd) {
          return { status: 'active', message: t('joinLivestream') };
        }
        if (now < openTime) {
          const timeStr = event.is_all_day
            ? ''
            : openTime.toLocaleTimeString(isZh ? 'zh-HK' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
          const dateStr = formatShortDate(openTime, isZh);
          return {
            status: 'upcoming',
            message: timeStr ? t('nextLivestream', { date: dateStr, time: timeStr }) : dateStr,
          };
        }
      }
    }

    return { status: 'disabled', message: '' };
  };

  const livestreamState = calculateLivestreamState();
  const customLabel = isZh ? event.cta_label_zh : event.cta_label_en;

  // Venue Name fallback for calendar export
  const venue = event.venues;
  const venueNameZh = event.venue_override_zh || venue?.name_zh;
  const venueNameEn = event.venue_override_en || venue?.name_en;
  const resolvedVenueName = isZh
    ? (venueNameZh || venueNameEn || undefined)
    : (venueNameEn || venueNameZh || undefined);

  const renderRegistrationButton = () => {
    if (event.registration_mode === 'not_required') {
      return (
        <div className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs font-semibold rounded-xl select-none shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{t('noRegistrationRequired')}</span>
        </div>
      );
    }

    if (event.registration_status === 'upcoming') {
      return (
        <button disabled className="px-6 py-2.5 bg-[#FAF5F0] border border-[#A65D24]/40 text-[#A65D24] text-xs font-bold rounded-xl shadow-2xs cursor-not-allowed select-none">
          {customLabel || t('openingSoon')}
        </button>
      );
    }

    if (event.registration_status === 'closed') {
      return (
        <button disabled className="px-6 py-2.5 bg-stone-200 border border-stone-300 text-stone-500 text-xs font-bold rounded-xl cursor-not-allowed select-none">
          {customLabel || t('registrationClosed')}
        </button>
      );
    }

    if (event.registration_mode === 'external_url' && event.external_url) {
      return (
        <a
          href={event.external_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <span>{customLabel || t('registerExternal')}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      );
    }

    const formSlugOrId = event.linked_form?.slug || event.linked_form_id;
    const formTarget = formSlugOrId ? `/${locale}/form/${formSlugOrId}` : '#register';

    return (
      <Link
        href={formTarget}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
      >
        <FileSignature className="w-3.5 h-3.5" />
        <span>{customLabel || t('registerNow')}</span>
      </Link>
    );
  };

  return (
    <div className="flex flex-col md:items-end justify-between gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-stone-100">
      <CalendarExportDropdown
        event={{
          title: isZh ? (event.title_zh || event.title_en || '') : (event.title_en || event.title_zh || ''),
          summary: isZh ? (event.summary_zh || event.summary_en) : (event.summary_en || event.summary_zh),
          venueName: resolvedVenueName,
          startDate: event.start_date,
          endDate: event.end_date,
          isAllDay: event.is_all_day,
          recurrenceRule: event.recurrence_rule,
          blackoutDates: event.blackout_dates,
        }}
      />

      <div className="flex items-center gap-2 flex-wrap">
        {livestreamState.status === 'active' ? (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer animate-pulse"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>{livestreamState.message}</span>
          </button>
        ) : livestreamState.status === 'upcoming' ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50/80 border border-blue-200/80 text-blue-700 text-[11px] font-semibold rounded-xl select-none">
            <Radio className="w-3 h-3 text-blue-500 shrink-0" />
            <span>{livestreamState.message}</span>
          </div>
        ) : null}

        {renderRegistrationButton()}
      </div>

      {streamConfig && (
        <LivestreamGatewayModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          streamConfig={streamConfig}
        />
      )}
    </div>
  );
}