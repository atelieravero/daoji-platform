// lib/status-inquiry.ts

export type StatusBadgeTone = 'neutral' | 'info' | 'warning' | 'success' | 'danger';

export interface StatusOptionConfig {
  value: string;
  labelZh: string;
  labelEn: string;
  tone: StatusBadgeTone;
  instructionZh?: string;
  instructionEn?: string;
}

export interface StatusFieldConfig {
  id: string;
  key: string;
  labelZh: string;
  labelEn: string;
  defaultValue?: string;
  options: StatusOptionConfig[];
}

export interface FormStatusConfig {
  enabled: boolean;
  introZh?: string;
  introEn?: string;
  fields: StatusFieldConfig[];
}

export interface ResolvedPublicStatusItem {
  key: string;
  fieldLabelZh: string;
  fieldLabelEn: string;
  optionValue: string;
  optionLabelZh: string;
  optionLabelEn: string;
  tone: StatusBadgeTone;
  instructionZh: string;
  instructionEn: string;
}

export const STATUS_TONE_OPTIONS: {
  value: StatusBadgeTone;
  label: string;
  adminBadgeClass: string;
  publicBadgeClass: string;
}[] = [
  {
    value: 'neutral',
    label: 'Neutral (Stone / Gray)',
    adminBadgeClass: 'bg-gray-100 text-gray-700 border-gray-200',
    publicBadgeClass: 'bg-surface-cream text-ink-body border-surface-dark',
  },
  {
    value: 'info',
    label: 'Info (Blue / Indigo)',
    adminBadgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    publicBadgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
  },
  {
    value: 'warning',
    label: 'Action Required / Pending (Amber)',
    adminBadgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    publicBadgeClass: 'bg-amber-50 text-status-warning border-amber-200',
  },
  {
    value: 'success',
    label: 'Confirmed / Completed (Green)',
    adminBadgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    publicBadgeClass: 'bg-emerald-50 text-status-success border-emerald-200',
  },
  {
    value: 'danger',
    label: 'Alert / Declined (Red)',
    adminBadgeClass: 'bg-red-50 text-red-700 border-red-200',
    publicBadgeClass: 'bg-red-50 text-status-danger border-red-200',
  },
];

export function getStatusToneStyle(tone?: StatusBadgeTone) {
  return (
    STATUS_TONE_OPTIONS.find((t) => t.value === tone) || STATUS_TONE_OPTIONS[0]
  );
}

export function normalizeStatusConfig(raw: any): FormStatusConfig {
  if (!raw || typeof raw !== 'object') {
    return { enabled: false, introZh: '', introEn: '', fields: [] };
  }
  return {
    enabled: Boolean(raw.enabled),
    introZh: typeof raw.introZh === 'string' ? raw.introZh : '',
    introEn: typeof raw.introEn === 'string' ? raw.introEn : '',
    fields: Array.isArray(raw.fields)
      ? raw.fields.map((f: any, idx: number) => ({
          id: f.id || `sf_${idx}`,
          key: String(f.key || '').trim(),
          labelZh: String(f.labelZh || ''),
          labelEn: String(f.labelEn || ''),
          defaultValue: typeof f.defaultValue === 'string' ? f.defaultValue : '',
          options: Array.isArray(f.options)
            ? f.options.map((opt: any) => ({
                value: String(opt.value || '').trim(),
                labelZh: String(opt.labelZh || ''),
                labelEn: String(opt.labelEn || ''),
                tone: (['neutral', 'info', 'warning', 'success', 'danger'].includes(opt.tone)
                  ? opt.tone
                  : 'neutral') as StatusBadgeTone,
                instructionZh: typeof opt.instructionZh === 'string' ? opt.instructionZh : '',
                instructionEn: typeof opt.instructionEn === 'string' ? opt.instructionEn : '',
              }))
            : [],
        }))
      : [],
  };
}

/**
 * Resolves only the active status fields for a given submission.
 * Option A rule: If a field has no stored value in status_data AND no defaultValue
 * (or the value doesn't match a configured option), it is omitted from the public output.
 * Also interpolates {{TOKEN}} inside option instructions with the canonical applicantToken.
 */
export function resolveApplicantStatusItems(
  config: FormStatusConfig,
  statusData: Record<string, any> | null | undefined,
  applicantToken: string
): ResolvedPublicStatusItem[] {
  const data = statusData && typeof statusData === 'object' ? statusData : {};
  const results: ResolvedPublicStatusItem[] = [];

  const interpolateToken = (text?: string) => {
    if (!text) return '';
    return text.replace(/\{\{\s*TOKEN\s*\}\}/g, applicantToken);
  };

  for (const field of config.fields) {
    if (!field.key) continue;
    const rawVal = data[field.key];
    const effectiveValue =
      rawVal !== undefined && rawVal !== null && String(rawVal).trim() !== ''
        ? String(rawVal).trim()
        : field.defaultValue
        ? String(field.defaultValue).trim()
        : '';

    if (!effectiveValue) continue;

    const matchedOption = field.options.find((opt) => opt.value === effectiveValue);
    if (!matchedOption) continue;

    results.push({
      key: field.key,
      fieldLabelZh: field.labelZh || field.labelEn || field.key,
      fieldLabelEn: field.labelEn || field.labelZh || field.key,
      optionValue: matchedOption.value,
      optionLabelZh: matchedOption.labelZh || matchedOption.labelEn || matchedOption.value,
      optionLabelEn: matchedOption.labelEn || matchedOption.labelZh || matchedOption.value,
      tone: matchedOption.tone || 'neutral',
      instructionZh: interpolateToken(matchedOption.instructionZh),
      instructionEn: interpolateToken(matchedOption.instructionEn),
    });
  }

  return results;
}