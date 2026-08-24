'use client';

import React from 'react';

interface StatusOption {
  value: string;
  label: string;
}

interface StatusBadgeSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: StatusOption[];
  disabled?: boolean;
}

export default function StatusBadgeSelect({
  value,
  onChange,
  options,
  disabled = false,
}: StatusBadgeSelectProps) {
  const getBadgeStyle = (status: string) => {
    switch (status) {
      case 'published':
      case 'open':
        return 'bg-emerald-100 text-emerald-800';
      case 'unlisted':
      case 'waitlist':
        return 'bg-amber-100 text-amber-800';
      case 'draft':
      case 'upcoming':
        return 'bg-gray-100 text-gray-700';
      case 'closed':
      case 'archived':
        return 'bg-rose-100 text-rose-800';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`text-xs font-semibold rounded-full px-3 py-1 outline-none appearance-none border-0 text-center transition-colors ${
        disabled ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer focus:ring-2 focus:ring-indigo-500'
      } ${getBadgeStyle(value)}`}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} className="bg-white text-gray-900 font-normal">
          {opt.label}
        </option>
      ))}
    </select>
  );
}