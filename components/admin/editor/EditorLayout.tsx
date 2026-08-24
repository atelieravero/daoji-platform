'use client';

import React from 'react';

interface EditorLayoutProps {
  header: React.ReactNode;
  canvas: React.ReactNode;
  inspector: React.ReactNode;
  errorMessage?: string | null;
  onDismissError?: () => void;
}

export default function EditorLayout({
  header,
  canvas,
  inspector,
  errorMessage,
  onDismissError,
}: EditorLayoutProps) {
  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden font-sans">
      {/* HEADER */}
      {header}

      {/* ERROR FEEDBACK */}
      {errorMessage && (
        <div className="px-6 py-2.5 bg-red-50 text-red-800 border-b border-red-100 text-xs font-medium flex items-center justify-between">
          <span>{errorMessage}</span>
          {onDismissError && (
            <button onClick={onDismissError} className="underline cursor-pointer">
              Dismiss
            </button>
          )}
        </div>
      )}

      {/* WORKSPACE AREA */}
      <div className="flex-1 flex overflow-hidden">
        {/* CENTER CANVAS */}
        <div className="flex-1 flex overflow-hidden bg-gray-50/80">
          {canvas}
        </div>

        {/* 460PX RIGHT INSPECTOR */}
        <div className="w-[460px] bg-white border-l border-gray-200 flex flex-col shadow-xl z-20">
          {inspector}
        </div>
      </div>
    </div>
  );
}