'use client';

import React from 'react';
import { Smartphone } from 'lucide-react';
import {
  parseMobileString,
  formatPhoneDisplay,
  formatTokenBodyDisplay,
} from '@/lib/form-engine-utils';

export function MobilePhoneInput({
  value,
  onChange,
  required,
  placeholder = '852 1234 5678',
}: {
  value: string;
  onChange: (formattedValue: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="relative flex items-center">
      <Smartphone className="absolute left-3.5 w-4 h-4 text-stone-400" />
      <span className="absolute left-10 text-stone-800 text-sm font-medium pointer-events-none">+</span>
      <input
        type="tel"
        required={required}
        value={value ? formatPhoneDisplay(value) : ''}
        onChange={(e) => {
          const { digits, ccLength } = parseMobileString(e.target.value);
          if (digits.length === 0) onChange('');
          else if (digits.length > ccLength) onChange(`${digits.substring(0, ccLength)}-${digits.substring(ccLength)}`);
          else onChange(digits);
        }}
        placeholder={placeholder}
        className="w-full pl-14 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-stone-800 bg-white transition-shadow"
      />
    </div>
  );
}

export function TokenDigitsInput({
  eventCode,
  value,
  onChangeDigits,
  placeholder = '1234-5678',
  size = 'sm',
  isVerified = false,
  isError = false,
  required = false,
}: {
  eventCode: string;
  value: string;
  onChangeDigits: (formattedBody: string) => void;
  placeholder?: string;
  size?: 'sm' | 'lg';
  isVerified?: boolean;
  isError?: boolean;
  required?: boolean;
}) {
  const isLg = size === 'lg';
  const borderClass = isVerified
    ? 'border-emerald-500 bg-emerald-50/40 focus-within:ring-2 focus-within:ring-emerald-500/40 focus-within:border-emerald-500'
    : isError
    ? 'border-red-300 bg-white focus-within:ring-2 focus-within:ring-red-500/40 focus-within:border-red-500'
    : 'border-stone-300 bg-white focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary';

  return (
    <div
      className={`flex flex-1 items-stretch overflow-hidden border transition-shadow ${
        isLg ? 'rounded-2xl shadow-2xs' : 'rounded-xl'
      } ${borderClass}`}
    >
      <div
        className={`bg-stone-100 flex items-center text-stone-600 font-mono font-bold border-r border-stone-200 select-none shrink-0 ${
          isLg ? 'px-4 text-base tracking-wider' : 'px-3 text-xs'
        }`}
      >
        {eventCode} -
      </div>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]{4}-?[0-9]{4}"
        maxLength={9}
        required={required}
        value={formatTokenBodyDisplay(value, eventCode)}
        onChange={(e) => onChangeDigits(formatTokenBodyDisplay(e.target.value, eventCode))}
        placeholder={placeholder}
        className={`w-full font-mono outline-none bg-transparent placeholder:text-stone-300 ${
          isVerified ? 'text-emerald-900 font-semibold' : 'text-stone-800'
        } ${isLg ? 'px-4 py-3.5 text-lg tracking-widest' : 'px-3 py-2.5 text-sm tracking-wider'}`}
      />
    </div>
  );
}