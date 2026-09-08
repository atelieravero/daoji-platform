'use client';

import React, { useEffect } from 'react';
import { usePublicShell } from '@/components/shared/PublicShell';
import StandaloneLanguageSwitcher from './StandaloneLanguageSwitcher';

interface StandaloneNotifierProps {
  isStandalone: boolean;
  locale?: string;
  forceStandaloneParam?: boolean;
}

export default function StandaloneNotifier({
  isStandalone,
  locale,
  forceStandaloneParam = true,
}: StandaloneNotifierProps) {
  const { setIsStandalone } = usePublicShell();

  useEffect(() => {
    setIsStandalone(isStandalone);
    return () => setIsStandalone(false);
  }, [isStandalone, setIsStandalone]);

  if (!isStandalone) return null;

  return (
    <>
      {/* 
        Synchronous CSS block in initial HTML stream.
        Suppresses header, footer, and nav on first paint before React hydrates.
      */}
      <style>{`
        header, footer, nav { display: none !important; }
      `}</style>

      {locale && (
        <StandaloneLanguageSwitcher
          locale={locale}
          forceStandaloneParam={forceStandaloneParam}
        />
      )}
    </>
  );
}