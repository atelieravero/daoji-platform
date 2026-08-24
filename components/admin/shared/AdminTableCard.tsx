'use client';

import React from 'react';
import { Loader2, FileSpreadsheet } from 'lucide-react';

interface AdminTableCardProps {
  isLoading: boolean;
  loadingText?: string;
  isEmpty: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  children: React.ReactNode;
}

export default function AdminTableCard({
  isLoading,
  loadingText = 'Loading data...',
  isEmpty,
  emptyTitle = 'No records found',
  emptyDescription = 'Create a new record or adjust your search filters.',
  children,
}: AdminTableCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-b-xl shadow-xs overflow-hidden">
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mr-2" />
          <span>{loadingText}</span>
        </div>
      ) : isEmpty ? (
        <div className="text-center py-20 p-8">
          <FileSpreadsheet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-gray-900">{emptyTitle}</h3>
          <p className="text-xs text-gray-500 mt-1">{emptyDescription}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">{children}</div>
      )}
    </div>
  );
}