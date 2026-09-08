'use client';

import React from 'react';
import { Globe } from 'lucide-react';

interface StandaloneLanguageSwitcherProps {
  locale: string;
  forceStandaloneParam?: boolean;
}

export default function StandaloneLanguageSwitcher({
  locale,
  forceStandaloneParam = true,
}: StandaloneLanguageSwitcherProps) {
  const toggleLanguage = () => {
    if (typeof window === 'undefined') return;
    const nextLocale = locale === 'en' ? 'zh' : 'en';
    const currentPath = window.location.pathname;

    // Safely replace root locale segment (/en/... <-> /zh/...)
    const newPath = currentPath.replace(/^\/(en|zh)(?=\/|$)/, `/${nextLocale}`) || `/${nextLocale}`;

    const urlParams = new URLSearchParams(window.location.search);
    if (forceStandaloneParam) {
      urlParams.set('standalone', 'true');
    }
    const qs = urlParams.toString();

    window.location.href = newPath + (qs ? `?${qs}` : '');
  };

  return (
    <div className="fixed top-4 right-4 md:top-8 md:right-8 z-50">
      <button
        type="button"
        onClick={toggleLanguage}
        className="px-4 py-2 bg-white/90 hover:bg-white backdrop-blur-md border border-stone-200 shadow-sm rounded-full text-sm font-medium text-stone-700 hover:text-primary transition-colors flex items-center gap-2 cursor-pointer select-none"
      >
        <Globe className="w-4 h-4 text-stone-400" />
        <span>{locale === 'en' ? '中文' : 'English'}</span>
      </button>
    </div>
  );
}