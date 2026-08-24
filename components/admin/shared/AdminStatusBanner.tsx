'use client';

import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface AdminStatusBannerProps {
  message: { type: 'success' | 'error'; text: string } | null;
  onDismiss: () => void;
  className?: string;
}

export default function AdminStatusBanner({
  message,
  onDismiss,
  className = '',
}: AdminStatusBannerProps) {
  if (!message) return null;

  const isSuccess = message.type === 'success';

  return (
    <div
      className={`px-6 py-3 text-xs font-medium flex items-center justify-between shadow-xs transition-all ${
        isSuccess
          ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-100'
          : 'bg-red-50 text-red-800 border-b border-red-100'
      } ${className}`}
    >
      <div className="flex items-center gap-2">
        {isSuccess ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        ) : (
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
        )}
        <span>{message.text}</span>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="underline text-xs opacity-80 hover:opacity-100 cursor-pointer ml-4"
      >
        Dismiss
      </button>
    </div>
  );
}