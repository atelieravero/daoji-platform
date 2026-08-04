'use client';

import React, { useState } from 'react';
import { Menu, X, Globe, Leaf, ArrowUpRight, ChevronDown } from 'lucide-react';

const dictionaries = {
  en: {
    nav: {
      events: 'Events & Retreats',
      resources: 'Resources',
      about: 'About Us',
      aboutSub: [
        { label: 'Our Lineage', href: '/en/about/lineage' },
        { label: 'Core Teachings', href: '/en/about/teachings' },
        { label: 'Contact Us', href: '/en/about/contact' }
      ]
    },
    footer: {
      orgName: 'Maggapaṭipadā Meditation Centre',
      tagline: 'Cultivating stillness in a moving world.',
      privacy: 'Privacy Policy',
      contact: 'Contact Us',
      rights: 'All rights reserved.'
    }
  },
  zh: {
    nav: {
      events: '活動與禪修',
      resources: '更多資源',
      about: '關於我們',
      aboutSub: [
        { label: '傳承與歷史', href: '/zh/about/lineage' },
        { label: '核心教義', href: '/zh/about/teachings' },
        { label: '聯絡我們', href: '/zh/about/contact' }
      ]
    },
    footer: {
      orgName: '道跡禪院',
      tagline: '在喧囂的世界中培育寧靜。',
      privacy: '隱私政策',
      contact: '聯絡我們',
      rights: '版權所有。'
    }
  }
};

function Navbar({ currentLang, onToggleLang }: { currentLang: 'en' | 'zh', onToggleLang: () => void }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAboutDropdownOpen, setIsAboutDropdownOpen] = useState(false);
  const t = dictionaries[currentLang].nav;

  return (
    <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-stone-200 transition-all duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          
          {/* Logo Section */}
          <div className="flex items-center">
            <a href={'/' + currentLang} className="flex items-center space-x-2 group">
              <div className="w-10 h-10 bg-[#FAF5F0] rounded-xl flex items-center justify-center group-hover:bg-[#F2E8DC] transition-colors">
                <Leaf className="w-6 h-6 text-[#A65D24]" />
              </div>
              <span className="font-bold text-xl tracking-tight text-stone-800 group-hover:text-[#A65D24] transition-colors">
                {currentLang === 'en' ? 'Maggapaṭipadā' : '道跡禪院'}
              </span>
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a 
              href={`/${currentLang}/events`}
              className="text-sm font-medium text-stone-500 hover:text-[#A65D24] transition-colors"
            >
              {t.events}
            </a>
            <a 
              href={`/${currentLang}/resources`}
              className="text-sm font-medium text-stone-500 hover:text-[#A65D24] transition-colors"
            >
              {t.resources}
            </a>

            {/* About Dropdown */}
            <div className="relative" onMouseLeave={() => setIsAboutDropdownOpen(false)}>
              <button 
                onMouseEnter={() => setIsAboutDropdownOpen(true)}
                className="inline-flex items-center text-sm font-medium text-stone-500 hover:text-[#A65D24] transition-colors py-2"
              >
                {t.about}
                <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${isAboutDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isAboutDropdownOpen && (
                <div className="absolute top-full left-0 w-48 bg-white rounded-2xl shadow-xl border border-stone-200 py-2 animate-in fade-in slide-in-from-top-2">
                  {t.aboutSub.map((sub, i) => (
                    <a 
                      key={i}
                      href={sub.href}
                      onClick={(e) => e.preventDefault()} // Disabled for preview
                      className="block px-4 py-2.5 text-sm text-stone-700 hover:bg-[#FAF5F0] hover:text-[#A65D24] transition-colors"
                    >
                      {sub.label}
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div className="w-px h-6 bg-stone-200" />

            {/* Language Switcher */}
            <button 
              onClick={onToggleLang}
              className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors border border-stone-200 hover:border-stone-300"
            >
              <Globe className="w-4 h-4 mr-2 text-stone-400" />
              {currentLang === 'en' ? '中文' : 'English'}
            </button>
          </div>

          {/* Mobile menu button */}
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

      {/* Mobile Menu Panel */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-stone-100 bg-white absolute w-full animate-in slide-in-from-top-4 duration-200 shadow-xl">
          <div className="px-4 pt-2 pb-6 space-y-1">
            <a href={`/${currentLang}/events`} className="block px-3 py-3 rounded-xl text-base font-medium text-stone-800 hover:bg-[#FAF5F0] hover:text-[#A65D24]">{t.events}</a>
            <a href={`/${currentLang}/resources`} className="block px-3 py-3 rounded-xl text-base font-medium text-stone-800 hover:bg-[#FAF5F0] hover:text-[#A65D24]">{t.resources}</a>
            
            <div className="px-3 py-2 text-xs font-semibold text-stone-400 uppercase tracking-wider mt-2">{t.about}</div>
            {t.aboutSub.map((sub, i) => (
              <a key={i} href={sub.href} className="block px-6 py-2.5 rounded-xl text-sm font-medium text-stone-600 hover:bg-[#FAF5F0] hover:text-[#A65D24]">
                {sub.label}
              </a>
            ))}

            <div className="mt-4 pt-4 border-t border-stone-100">
              <button 
                onClick={() => {
                  onToggleLang();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center px-4 py-3 rounded-xl text-base font-medium text-[#A65D24] bg-[#FAF5F0] hover:bg-[#F2E8DC] transition-colors"
              >
                <Globe className="w-5 h-5 mr-2" />
                Switch to {currentLang === 'en' ? '中文' : 'English'}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

function Footer({ currentLang }: { currentLang: 'en' | 'zh' }) {
  const t = dictionaries[currentLang].footer;
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-stone-200 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-8">
          
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <div className="flex items-center space-x-2 text-[#A65D24] mb-4">
              <Leaf className="w-5 h-5" />
              <span className="font-bold text-lg tracking-tight text-stone-800">{t.orgName}</span>
            </div>
            <p className="text-stone-500 text-sm max-w-xs leading-relaxed">
              {t.tagline}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm font-medium text-stone-400">
            <a href="#" className="hover:text-[#A65D24] transition-colors flex items-center">
              {t.privacy} <ArrowUpRight className="w-3 h-3 ml-1 opacity-50" />
            </a>
            <a href="#" className="hover:text-[#A65D24] transition-colors flex items-center">
              {t.contact} <ArrowUpRight className="w-3 h-3 ml-1 opacity-50" />
            </a>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-stone-100 text-center text-sm text-stone-400">
          <p>&copy; {currentYear} {t.orgName}. {t.rights}</p>
        </div>
      </div>
    </footer>
  );
}

export default function PublicLayout({ children }: { children?: React.ReactNode }) {
  const [locale, setLocale] = useState<'en' | 'zh'>('en');

  const toggleLanguage = () => {
    setLocale(prev => prev === 'en' ? 'zh' : 'en');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFAF8] font-sans text-stone-800 selection:bg-[#F2E8DC] selection:text-[#A65D24]">
      <Navbar currentLang={locale} onToggleLang={toggleLanguage} />
      
      <main className="flex-grow flex flex-col">
        {children || (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-[#FAF5F0] rounded-full flex items-center justify-center mb-6 shadow-sm border border-stone-100">
              <Leaf className="w-10 h-10 text-[#A65D24]/70" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-stone-800 mb-4">
              {locale === 'en' ? 'Welcome to Maggapaṭipadā' : '歡迎來到道跡禪院'}
            </h1>
            <p className="text-lg text-stone-500 max-w-md">
              {locale === 'en' 
                ? 'Hover over "About Us" above to see the drop-down navigation for our static pages.'
                : '將鼠標懸停在上方的「關於我們」即可查看靜態頁面的下拉導航。'}
            </p>
          </div>
        )}
      </main>

      <Footer currentLang={locale} />
    </div>
  );
}