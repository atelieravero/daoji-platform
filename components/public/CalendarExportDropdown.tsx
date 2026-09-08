'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, Download, ExternalLink, ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { 
  downloadICSFile, 
  getGoogleCalendarUrl, 
  EventSchedule, 
  CalendarExportMetadata 
} from '@/lib/calendar';

interface CalendarExportDropdownProps {
  event: {
    title: string;
    summary?: string | null;
    venueName?: string | null;
    startDate: string;
    endDate: string;
    isAllDay?: boolean;
    recurrenceRule?: any;
    blackoutDates?: string[];
    url?: string;
  };
}

export default function CalendarExportDropdown({ event }: CalendarExportDropdownProps) {
  const t = useTranslations('EventDetail');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const schedule: EventSchedule = {
    startDate: event.startDate,
    endDate: event.endDate,
    isAllDay: event.isAllDay,
    recurrenceRule: event.recurrenceRule,
    blackoutDates: event.blackoutDates,
  };

  const meta: CalendarExportMetadata = {
    title: event.title,
    description: event.summary || undefined,
    location: event.venueName || undefined,
    url: event.url,
  };

  const handleDownload = () => {
    downloadICSFile(schedule, meta, event.title.replace(/\s+/g, '_'));
    setIsOpen(false);
  };

  const googleCalUrl = getGoogleCalendarUrl(schedule, meta);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/90 hover:bg-white text-stone-700 text-xs font-semibold rounded-xl border border-stone-200/80 shadow-xs backdrop-blur-xs transition-colors cursor-pointer"
      >
        <CalendarIcon className="w-3.5 h-3.5 text-primary" />
        <span>{t('addToCalendar')}</span>
        <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-56 rounded-xl bg-white shadow-xl border border-stone-100 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
          <a
            href={googleCalUrl}
            target="_blank"
            rel="noreferrer"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-stone-700 hover:bg-surface-cream hover:text-primary transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
            <span>{t('googleCalendar')}</span>
          </a>
          <button
            type="button"
            onClick={handleDownload}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-stone-700 hover:bg-surface-cream hover:text-primary transition-colors cursor-pointer text-left"
          >
            <Download className="w-3.5 h-3.5 text-stone-400" />
            <span>{t('appleOutlookIcs')}</span>
          </button>
        </div>
      )}
    </div>
  );
}