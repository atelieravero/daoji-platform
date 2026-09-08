'use client';

import React from 'react';
import Link from 'next/link';
import { ExternalLink, FileSignature } from 'lucide-react';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('EventDetail');
  const isZh = locale === 'zh';
  const { registration_status, registration_mode, external_url } = event;

  const customLabel = isZh ? event.cta_label_zh : event.cta_label_en;

  // 1. Passive State: Not Required
  if (registration_mode === 'not_required') {
    return (
      <div className="inline-flex items-center px-5 py-2.5 rounded-xl bg-surface-cream border border-primary/20 text-primary text-xs font-semibold select-none">
        {t('noRegistrationRequired')}
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
        {customLabel || t('registrationClosed')}
      </button>
    );
  }

  // 3. Upcoming State: Opening Soon
  if (registration_status === 'upcoming') {
    return (
      <button
        disabled
        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-surface-cream border border-primary/40 text-primary text-sm font-semibold cursor-default select-none shadow-xs"
      >
        {customLabel || t('openingSoon')}
      </button>
    );
  }

  // 4. Open State: External Portal Link (New Tab)
  if (registration_mode === 'external_url' && external_url) {
    return (
      <a
        href={external_url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer"
      >
        <span>{customLabel || t('registerExternal')}</span>
        <ExternalLink className="w-4 h-4" />
      </a>
    );
  }

  // 5. Open State: Internal Form Link (New Tab)
  const formSlugOrId = event.linked_form?.slug || event.linked_form_id;
  if (formSlugOrId) {
    return (
      <Link
        href={`/${locale}/form/${formSlugOrId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold shadow-md transition-all hover:shadow-lg cursor-pointer"
      >
        <FileSignature className="w-4 h-4" />
        <span>{customLabel || t('registerNow')}</span>
      </Link>
    );
  }

  // Fallback if unlinked
  return (
    <button
      type="button"
      onClick={onScrollToForm}
      className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold shadow-md transition-all hover:shadow-lg cursor-pointer"
    >
      <FileSignature className="w-4 h-4" />
      <span>{customLabel || t('registerNow')}</span>
    </button>
  );
}