'use client';

import React, { useState } from 'react';
import { Menu, X, Globe, Leaf, ArrowUpRight, ChevronDown } from 'lucide-react';

interface DynamicPageLink {
  href: string;
  label: Record<'en' | 'zh', string>;
}

interface PublicShellProps {
  children: React.ReactNode;
  dynamicAboutPages?: DynamicPageLink[];
  footerPages?: DynamicPageLink[];
  locale?: 'en' | 'zh';
  dictionary?: any;
}

function Navbar({ dynamicAboutPages = [], locale = 'en', dictionary }: { dynamicAboutPages?: DynamicPageLink[], locale?: 'en' | 'zh', dictionary?: any }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAboutDropdownOpen, setIsAboutDropdownOpen] = useState(false);
  
  const t = dictionary?.Navigation || {
    events: locale === 'en' ? 'Events & Retreats' : '活動與禪修',
    resources: locale === 'en' ? 'Resources' : '更多資源',
    about: locale === 'en' ? 'About Us' : '關於我們',
    switchTo: locale === 'en' ? '中文' : 'English'
  };

  const toggleLanguage = () => {
    const nextLocale = locale === 'en' ? 'zh' : 'en';
    if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        const currentSearch = window.location.search; // Preserves query params like ?id=123
        const newPath = currentPath.replace(/^\/(en|zh)/, `/${nextLocale}`);
        
        window.location.href = (newPath || `/${nextLocale}`) + currentSearch;
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-stone-200 transition-all duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          
          {/* Logo */}
          <div className="flex items-center">
            <a href={`/${locale}`} className="flex items-center space-x-2 group">
              <div className="w-10 h-10 bg-surface-cream rounded-xl flex items-center justify-center group-hover:bg-surface-dark transition-colors">
                <Leaf className="w-6 h-6 text-primary" />
              </div>
              <span className="font-bold text-xl tracking-tight text-stone-800 group-hover:text-primary transition-colors">
                {locale === 'en' ? 'Maggapaṭipadā' : '道跡禪院'}
              </span>
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a 
              href={`/${locale}/events`}
              className="text-sm font-medium text-stone-500 hover:text-primary transition-colors"
            >
              {t.events}
            </a>
            <a 
              href={`/${locale}/resources`}
              className="text-sm font-medium text-stone-500 hover:text-primary transition-colors"
            >
              {t.resources}
            </a>

            {/* About Dropdown */}
            <div className="relative" onMouseLeave={() => setIsAboutDropdownOpen(false)}>
              <button 
                onMouseEnter={() => setIsAboutDropdownOpen(true)}
                className="inline-flex items-center text-sm font-medium text-stone-500 hover:text-primary transition-colors py-2"
              >
                {t.about}
                <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${isAboutDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isAboutDropdownOpen && dynamicAboutPages && dynamicAboutPages.length > 0 && (
                <div className="absolute top-full left-0 w-48 bg-white rounded-2xl shadow-xl border border-stone-200 py-2 animate-in fade-in slide-in-from-top-2">
                  {dynamicAboutPages.map((page, i) => (
                    <a 
                      key={i}
                      href={`/${locale}${page.href}`}
                      className="block px-4 py-2.5 text-sm text-stone-700 hover:bg-surface-cream hover:text-primary transition-colors"
                    >
                      {page.label[locale]}
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div className="w-px h-6 bg-stone-200" />

            {/* Language Switcher */}
            <button 
              onClick={toggleLanguage}
              className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors border border-stone-200 hover:border-stone-300"
            >
              <Globe className="w-4 h-4 mr-2 text-stone-400" />
              {t.switchTo}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-stone-100 bg-white absolute w-full animate-in slide-in-from-top-4 duration-200 shadow-xl">
          <div className="px-4 pt-2 pb-6 space-y-1">
            <a href={`/${locale}/events`} onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-3 rounded-xl text-base font-medium text-stone-800 hover:bg-surface-cream hover:text-primary">{t.events}</a>
            <a href={`/${locale}/resources`} onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-3 rounded-xl text-base font-medium text-stone-800 hover:bg-surface-cream hover:text-primary">{t.resources}</a>
            
            <div className="px-3 py-2 text-xs font-semibold text-stone-400 uppercase tracking-wider mt-2">{t.about}</div>
            
            {dynamicAboutPages?.map((page, i) => (
              <a key={i} href={`/${locale}${page.href}`} onClick={() => setIsMobileMenuOpen(false)} className="block px-6 py-2.5 rounded-xl text-sm font-medium text-stone-600 hover:bg-surface-cream hover:text-primary">
                {page.label[locale]}
              </a>
            ))}

            <div className="mt-4 pt-4 border-t border-stone-100">
              <button 
                onClick={toggleLanguage}
                className="w-full flex items-center justify-center px-4 py-3 rounded-xl text-base font-medium text-primary bg-surface-cream hover:bg-surface-dark transition-colors"
              >
                <Globe className="w-5 h-5 mr-2" />
                {t.switchTo}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

function Footer({ footerPages = [], locale = 'en', dictionary }: { footerPages?: DynamicPageLink[], locale?: 'en' | 'zh', dictionary?: any }) {
  
  const t = dictionary?.Footer || {
    orgName: locale === 'en' ? 'Maggapaṭipadā Meditation Centre' : '道跡禪院',
    tagline: locale === 'en' ? 'Cultivating stillness in a moving world.' : '在喧囂的世界中培育寧靜。',
    rights: locale === 'en' ? 'All rights reserved.' : '版權所有。'
  };
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-stone-200 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-8">
          
          {/* Footer Branding */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <div className="flex items-center space-x-2 text-primary mb-4">
              <Leaf className="w-5 h-5" />
              <span className="font-bold text-lg tracking-tight text-stone-800">{t.orgName}</span>
            </div>
            <p className="text-stone-500 text-sm max-w-xs leading-relaxed">
              {t.tagline}
            </p>
          </div>

          {/* Footer Links */}
          <div className="flex flex-wrap justify-center gap-6 text-sm font-medium text-stone-400">
            {footerPages.map((page, i) => (
              <a key={i} href={`/${locale}${page.href}`} className="hover:text-primary transition-colors flex items-center">
                {page.label[locale]} <ArrowUpRight className="w-3 h-3 ml-1 opacity-50" />
              </a>
            ))}
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-stone-100 text-center text-sm text-stone-400">
          <p>&copy; {currentYear} {t.orgName}. {t.rights}</p>
        </div>
      </div>
    </footer>
  );
}

export default function PublicShell({ children, dynamicAboutPages, footerPages, locale = 'en', dictionary }: PublicShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-surface-base font-sans text-stone-800 selection:bg-surface-dark selection:text-primary">
      <Navbar dynamicAboutPages={dynamicAboutPages} locale={locale} dictionary={dictionary} />
      <main className="flex-grow flex flex-col">
        {children}
      </main>
      <Footer footerPages={footerPages} locale={locale} dictionary={dictionary} />
    </div>
  );
}