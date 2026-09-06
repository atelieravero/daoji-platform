'use client';

import React from 'react';
import { ExternalLink, FileSignature } from 'lucide-react';
import { EventRecord } from '@/app/admin/(dashboard)/events/actions';

interface EventCtaButtonProps {
  event: EventRecord;
  locale?: 'zh' | 'en';
  onScrollToForm?: () => void;
}

export default function EventCtaButton({
  event,
  locale = 'zh',
  onScrollToForm,
}: EventCtaButtonProps) {
  const isZh = locale === 'zh';
  const { registration_status, registration_mode, external_url } = event;

  // Custom label overrides
  const customLabel = isZh ? event.cta_label_zh : event.cta_label_en;

  // 1. Passive State: Not Required
  if (registration_mode === 'not_required') {
    return (
      <div className="inline-flex items-center px-5 py-2.5 rounded-xl bg-[#FAF5F0] border border-[#A65D24]/20 text-[#A65D24] text-xs font-semibold select-none">
        {isZh ? '無需報名・自由入座' : 'No Registration Required'}
      </div>
    );
  }

  // 2. Disabled State: Closed
  if (registration_status === 'closed') {
    return (
      <button
        disabled
        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-stone-200 border border-stone-300 text-stone-500 text-sm font-semibold cursor-not-allowed select-none transition-colors"
      >
        {customLabel || (isZh ? '報名截止' : 'Registration Closed')}
      </button>
    );
  }

  // 3. Upcoming State: Opening Soon (Outlined Cream)
  if (registration_status === 'upcoming') {
    return (
      <button
        disabled
        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#FAF5F0] border border-[#A65D24]/40 text-[#A65D24] text-sm font-semibold cursor-default select-none shadow-xs"
      >
        {customLabel || (isZh ? '即將開放報名' : 'Opening Soon')}
      </button>
    );
  }

  // 4. Open State: External Portal Link
  if (registration_mode === 'external_url' && external_url) {
    return (
      <a
        href={external_url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-xl bg-[#A65D24] hover:bg-[#8A4D1E] text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer"
      >
        <span>{customLabel || (isZh ? '立即前往報名' : 'Register on Portal')}</span>
        <ExternalLink className="w-4 h-4" />
      </a>
    );
  }

  // 5. Open State: Internal Form Registration Trigger
  return (
    <button
      type="button"
      onClick={onScrollToForm}
      className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#A65D24] hover:bg-[#8A4D1E] text-white text-sm font-semibold shadow-md transition-all hover:shadow-lg cursor-pointer"
    >
      <FileSignature className="w-4 h-4" />
      <span>{customLabel || (isZh ? '立即填表報名' : 'Register Now')}</span>
    </button>
  );
}