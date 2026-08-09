'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';

// Hardcoding the minimal text allows us to toggle state instantly
// without fighting Next.js server routing or next-intl loading states.
const content = {
  en: {
    title: "Welcome to Maggapaṭipadā Meditation Centre",
    subtitle: "We are thoughtfully building our new digital home to better serve our community. Please check back soon."
  },
  zh: {
    title: "歡迎訪問道跡禪院",
    subtitle: "為弘法利生，我們正在用心建設全新的網站。敬請期待。"
  }
};

export default function HomePage() {
  const params = useParams();
  const initialLocale = (params?.locale as 'en' | 'zh') || 'zh';
  
  const [lang, setLang] = useState<'en' | 'zh'>(initialLocale);

  // Automatically swap language text every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setLang((prev) => (prev === 'en' ? 'zh' : 'en'));
    }, 10000);

    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {/* 1. Forcefully hide the global layout's nav, header, and footer */}
      <style dangerouslySetInnerHTML={{__html: `
        header, nav, footer { display: none !important; }
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(5px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}} />

      <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center font-sans">
        
        {/* 2. The Ethereal Canvas Background */}
        <div className="absolute inset-0 z-0 bg-stone-900">
          <Image
            src="/images/home-bg.jpg"
            alt="Meditation Centre"
            fill
            className="object-cover"
            quality={100}
            priority
          />
          {/* 
            Changed to a dark wash (stone-900/40) to dim the photo, 
            allowing the bright text to pop while maintaining the medium blur. 
          */}
          <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-md" />
        </div>

        {/* 3. The Minimalist Floating Text */}
        {/* The key={lang} forces the div to re-mount, triggering the CSS fade animation */}
        <div 
          key={lang} 
          className="relative z-10 flex flex-col items-center text-center px-6 max-w-3xl animate-[fadeIn_2s_ease-in-out]"
        >
          {/* Text changed to almost white (stone-50) with a slightly stronger shadow */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium text-stone-50 tracking-wide mb-8 drop-shadow-lg">
            {content[lang].title}
          </h1>
          {/* Subtitle changed to light gray (stone-200) for gentle contrast against the title */}
          <p className="text-base md:text-lg text-stone-200 font-light tracking-wide leading-relaxed max-w-3xl drop-shadow-md">
            {content[lang].subtitle}
          </p>
        </div>
      </div>
    </>
  );
}