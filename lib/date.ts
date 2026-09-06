/**
 * Convert UTC ISO timestamp or pure date string to a date-only string (YYYY-MM-DD) in target timezone[cite: 22].
 */
export function toDateInputString(dateString?: string | null, timeZone: string = 'Asia/Hong_Kong'): string {
  if (!dateString) return '';
  // If already a pure YYYY-MM-DD string, return directly
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return formatter.format(date);
}

/**
 * Convert UTC ISO timestamp into a datetime-local input string (YYYY-MM-DDTHH:mm) in target timezone[cite: 22].
 */
export function toDateTimeLocalString(dateString?: string | null, timeZone: string = 'Asia/Hong_Kong'): string {
  if (!dateString) return '';
  // If date-only string provided, append default morning hour for datetime-local
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return `${dateString}T09:00`;
  }

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const getPart = (type: string) => parts.find((p) => p.type === type)?.value || '';

  const year = getPart('year');
  const month = getPart('month');
  const day = getPart('day');
  let hour = getPart('hour');
  if (hour === '24') hour = '00';
  const minute = getPart('minute');

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

/**
 * Convert a datetime-local string (YYYY-MM-DDTHH:mm) into a UTC ISO 8601 string[cite: 22].
 */
export function fromDateTimeLocalToUTC(localString: string, timeZone: string = 'Asia/Hong_Kong'): string {
  if (!localString) return '';
  if (!localString.includes('T')) return localString;

  const [datePart, timePart] = localString.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = (timePart || '00:00').split(':').map(Number);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return '';

  const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const invDate = new Date(utcDate.toLocaleString('en-US', { timeZone: 'UTC' }));
  const targetDate = new Date(utcDate.toLocaleString('en-US', { timeZone }));
  const diff = targetDate.getTime() - invDate.getTime();

  return new Date(utcDate.getTime() - diff).toISOString();
}

/**
 * Describe a recurrence rule in human-readable localized text[cite: 22].
 */
export function describeRecurrenceRule(
  rule: any,
  startDateStr?: string | Date | null,
  locale: string = 'zh-HK'
): string {
  if (!rule || !rule.frequency) return '';
  const isZh = locale.startsWith('zh');
  const dayNamesZh = ['日', '一', '二', '三', '四', '五', '六'];
  const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  let desc = '';
  if (rule.frequency === 'weekly') {
    const days = (rule.days_of_week || []).map((d: number) => (isZh ? `週${dayNamesZh[d]}` : dayNamesEn[d])).join('、');
    desc = isZh ? `每週${days ? ` (${days})` : ''}` : `Weekly${days ? ` on ${days}` : ''}`;
  } else if (rule.frequency === 'monthly') {
    desc = isZh ? '每月定期' : 'Monthly';
  } else if (rule.frequency === 'daily') {
    desc = isZh ? '每日' : 'Daily';
  }

  if (rule.until_date) {
    const untilFormatted = new Date(rule.until_date).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    desc += isZh ? `，至 ${untilFormatted}` : `, until ${untilFormatted}`;
  }

  return desc;
}

/**
 * Format date range strings for display, handling date-only all-day events without timezone shifts[cite: 22].
 */
export function formatEventDateRange(
  startInput: string | Date,
  endInput: string | Date,
  timeZone: string = 'Asia/Hong_Kong',
  isAllDay: boolean = false,
  locale: string = 'zh-HK',
  recurrenceRule?: any
): string {
  const isZh = locale.startsWith('zh');
  const startStr = typeof startInput === 'string' ? startInput : startInput.toISOString();
  const endStr = typeof endInput === 'string' ? endInput : endInput.toISOString();

  // 1. All-Day Event Display
  if (isAllDay) {
    const sDateOnly = startStr.split('T')[0];
    const eDateOnly = endStr.split('T')[0];

    const [sY, sM, sD] = sDateOnly.split('-').map(Number);
    const [eY, eM, eD] = eDateOnly.split('-').map(Number);

    const sDate = new Date(sY, sM - 1, sD).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    const eDate = new Date(eY, eM - 1, eD).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    if (recurrenceRule && recurrenceRule.frequency) {
      const recurDesc = describeRecurrenceRule(recurrenceRule, startInput, locale);
      return `${recurDesc} (${isZh ? '全日' : 'All Day'})`;
    }

    if (sDateOnly === eDateOnly) {
      return `${sDate} (${isZh ? '全日' : 'All Day'})`;
    }
    return `${sDate} – ${eDate}`;
  }

  // 2. Timed Event Display
  const s = new Date(startStr);
  const e = new Date(endStr);

  const timeOptions: Intl.DateTimeFormatOptions = {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  };

  const dateOptions: Intl.DateTimeFormatOptions = {
    timeZone,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  };

  if (recurrenceRule && recurrenceRule.frequency) {
    const recurDesc = describeRecurrenceRule(recurrenceRule, startInput, locale);
    const sTime = s.toLocaleTimeString(locale, timeOptions);
    const eTime = e.toLocaleTimeString(locale, timeOptions);
    return `${recurDesc}・${sTime} – ${eTime}`;
  }

  const sDate = s.toLocaleDateString(locale, dateOptions);
  const eDate = e.toLocaleDateString(locale, dateOptions);

  if (sDate === eDate) {
    const sTime = s.toLocaleTimeString(locale, timeOptions);
    const eTime = e.toLocaleTimeString(locale, timeOptions);
    return `${sDate} ${sTime} – ${eTime}`;
  }

  const sTime = s.toLocaleTimeString(locale, timeOptions);
  const eTime = e.toLocaleTimeString(locale, timeOptions);
  return `${sDate} ${sTime} – ${eDate} ${eTime}`;
}