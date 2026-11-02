// components/admin/editor/UrlSlugInspector.tsx
'use client';

import React from 'react';
import { Globe, Lock, AlertCircle } from 'lucide-react';
import { RESERVED_SLUGS, isReservedSlug, sanitizeSlug } from '@/lib/slug';

export { RESERVED_SLUGS, isReservedSlug, sanitizeSlug };

interface UrlSlugInspectorProps {
  label?: string;
  slug: string;
  onChange: (sanitized: string) => void;
  pathPrefix?: string;
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function UrlSlugInspector({
  label = 'URL Slug',
  slug,
  onChange,
  pathPrefix = '/event/',
  placeholder = 'vanity-slug_2026+intro',
  helperText = 'Legitimate characters: letters, numbers, -, _, ., +, %, ~',
  required = false,
  disabled = false,
  className = '',
}: UrlSlugInspectorProps) {
  const reservedCollision = isReservedSlug(slug);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    onChange(sanitizeSlug(e.target.value));
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {disabled && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
            <Lock className="w-3 h-3" /> Locked
          </span>
        )}
      </div>

      <div
        className={`flex rounded-xl border transition-all ${
          disabled
            ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
            : reservedCollision
            ? 'bg-red-50/30 border-red-400 focus-within:ring-2 focus-within:ring-red-500 focus-within:border-red-500'
            : 'bg-white border-gray-300 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500'
        }`}
      >
        <span className="inline-flex items-center px-3 text-xs font-mono text-gray-500 border-r border-gray-200 bg-gray-50/80 rounded-l-xl select-none shrink-0">
          <Globe className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
          {pathPrefix}
        </span>
        <input
          type="text"
          value={slug}
          disabled={disabled}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 text-xs font-mono text-gray-900 bg-transparent outline-none disabled:cursor-not-allowed disabled:text-gray-500"
        />
      </div>

      {reservedCollision ? (
        <p className="text-[11px] text-red-600 font-medium flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>&ldquo;{slug}&rdquo; is a system-reserved path and cannot be used as a slug.</span>
        </p>
      ) : (
        helperText && <p className="text-[11px] text-gray-500">{helperText}</p>
      )}
    </div>
  );
}