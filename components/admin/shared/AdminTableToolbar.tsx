'use client';

import React from 'react';
import { Search } from 'lucide-react';

interface FilterOption {
  value: string;
  label: string;
}

interface AdminTableToolbarProps {
  search: string;
  onSearchChange: (val: string) => void;
  searchPlaceholder?: string;
  statusFilter?: string;
  onStatusFilterChange?: (val: string) => void;
  filterOptions?: FilterOption[];
  children?: React.ReactNode;
}

export default function AdminTableToolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search...',
  statusFilter,
  onStatusFilterChange,
  filterOptions,
  children,
}: AdminTableToolbarProps) {
  return (
    <div className="bg-white p-4 rounded-t-xl border border-gray-200 border-b-0 flex flex-col sm:flex-row justify-between items-center gap-4">
      <div className="relative w-full sm:w-96">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          <Search className="h-4 w-4" />
        </div>
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-900 placeholder-gray-400 outline-none transition-colors focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
        {filterOptions && onStatusFilterChange && (
          <div className="flex bg-gray-100 p-1 rounded-lg text-xs font-semibold text-gray-600">
            {filterOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onStatusFilterChange(opt.value)}
                className={`px-3 py-1.5 rounded-md capitalize transition-colors cursor-pointer ${
                  statusFilter === opt.value
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'hover:text-gray-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}