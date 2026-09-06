export interface EventSchedule {
  startDate: string | Date;
  endDate: string | Date;
  timezone?: string;
  isAllDay?: boolean;
  recurrenceRule?: {
    frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval?: number;
    daysOfWeek?: number[];
    days_of_week?: number[];
    untilDate?: string;
    until_date?: string;
    count?: number;
  } | null;
  blackoutDates?: string[];
  blackout_dates?: string[];
}

export interface CalendarExportMetadata {
  title: string;
  description?: string;
  location?: string;
  url?: string;
  uid?: string;
}

export function buildRRuleString(rule?: any): string | null {
  if (!rule || !rule.frequency) return null;

  const parts: string[] = [`FREQ=${String(rule.frequency).toUpperCase()}`];

  const interval = rule.interval;
  if (interval && Number(interval) > 1) {
    parts.push(`INTERVAL=${interval}`);
  }

  const days: number[] = rule.daysOfWeek || rule.days_of_week || [];
  if (days.length > 0) {
    const dayMap = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
    const byDays = days.map((d) => dayMap[d]).filter(Boolean).join(',');
    if (byDays) parts.push(`BYDAY=${byDays}`);
  }

  const until = rule.untilDate || rule.until_date;
  if (until) {
    const untilFormatted = String(until).replace(/-/g, '') + 'T235959Z';
    parts.push(`UNTIL=${untilFormatted}`);
  } else if (rule.count) {
    parts.push(`COUNT=${rule.count}`);
  }

  return parts.join(';');
}

/**
 * Helper to add 1 day to YYYY-MM-DD for exclusive all-day calendar endpoints.
 */
function addOneDayToDateString(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  const ny = next.getUTCFullYear();
  const nm = String(next.getUTCMonth() + 1).padStart(2, '0');
  const nd = String(next.getUTCDate()).padStart(2, '0');
  return `${ny}${nm}${nd}`;
}

/**
 * Generates 1-Click Google Calendar Intent URL[cite: 21]
 */
export function getGoogleCalendarUrl(
  schedule: EventSchedule,
  meta: CalendarExportMetadata
): string {
  const tz = schedule.timezone || 'Asia/Hong_Kong';
  const isAllDay = Boolean(schedule.isAllDay);
  const sStr = typeof schedule.startDate === 'string' ? schedule.startDate : schedule.startDate.toISOString();
  const eStr = typeof schedule.endDate === 'string' ? schedule.endDate : schedule.endDate.toISOString();

  let datesParam = '';
  if (isAllDay) {
    const sDate = sStr.split('T')[0].replace(/-/g, '');
    const eDateNext = addOneDayToDateString(eStr.split('T')[0]);
    datesParam = `${sDate}/${eDateNext}`;
  } else {
    const start = new Date(sStr);
    const end = new Date(eStr);
    const formatTimed = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    datesParam = `${formatTimed(start)}/${formatTimed(end)}`;
  }

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: meta.title,
    dates: datesParam,
    details: meta.description || '',
    location: meta.location || '',
    ctz: tz,
  });

  const rrule = buildRRuleString(schedule.recurrenceRule);
  if (rrule) {
    params.append('recur', `RRULE:${rrule}`);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generates RFC-5545 .ics payload matching DTSTART and EXDATE type specifications[cite: 21].
 */
export function downloadICSFile(
  schedule: EventSchedule,
  meta: CalendarExportMetadata,
  filename?: string
): void {
  const uid = meta.uid || `${Date.now()}@daoji.org`;
  const isAllDay = Boolean(schedule.isAllDay);
  const sStr = typeof schedule.startDate === 'string' ? schedule.startDate : schedule.startDate.toISOString();
  const eStr = typeof schedule.endDate === 'string' ? schedule.endDate : schedule.endDate.toISOString();

  let dtstartLine = '';
  let dtendLine = '';

  if (isAllDay) {
    const sDate = sStr.split('T')[0].replace(/-/g, '');
    const eDateNext = addOneDayToDateString(eStr.split('T')[0]);
    dtstartLine = `DTSTART;VALUE=DATE:${sDate}`;
    dtendLine = `DTEND;VALUE=DATE:${eDateNext}`;
  } else {
    const start = new Date(sStr);
    const end = new Date(eStr);
    const formatTimed = (d: Date) => `${d.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
    dtstartLine = `DTSTART:${formatTimed(start)}`;
    dtendLine = `DTEND:${formatTimed(end)}`;
  }

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Daoji Platform//Schedule Engine//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
    dtstartLine,
    dtendLine,
    `SUMMARY:${meta.title.replace(/,/g, '\\,')}`,
    `DESCRIPTION:${(meta.description || '').replace(/\n/g, '\\n').replace(/,/g, '\\,')}`,
    `LOCATION:${(meta.location || '').replace(/,/g, '\\,')}`,
    'STATUS:CONFIRMED',
  ];

  if (meta.url) {
    lines.push(`URL:${meta.url}`);
  }

  const rrule = buildRRuleString(schedule.recurrenceRule);
  if (rrule) {
    lines.push(`RRULE:${rrule}`);
  }

  const blackouts = schedule.blackoutDates || schedule.blackout_dates || [];
  if (blackouts.length > 0) {
    if (isAllDay) {
      const exdates = blackouts.map((d) => String(d).replace(/-/g, '')).join(',');
      lines.push(`EXDATE;VALUE=DATE:${exdates}`);
    } else {
      const start = new Date(sStr);
      const timeSuffix = start.toISOString().split('T')[1].replace(/[-:]/g, '').split('.')[0] + 'Z';
      const exdates = blackouts
        .map((d) => `${String(d).replace(/-/g, '')}T${timeSuffix}`)
        .join(',');
      lines.push(`EXDATE:${exdates}`);
    }
  }

  lines.push('END:VEVENT', 'END:VCALENDAR');

  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename ? (filename.endsWith('.ics') ? filename : `${filename}.ics`) : 'event.ics';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}