'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, LucideIcon } from 'lucide-react';

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  actionButton?: {
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: LucideIcon;
  };
  children?: React.ReactNode;
}

export default function AdminPageHeader({
  title,
  description,
  backHref,
  backLabel,
  actionButton,
  children,
}: AdminPageHeaderProps) {
  const ActionIcon = actionButton?.icon;

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
      <div>
        {backHref && (
          <Link
            href={backHref}
            className="inline-flex items-center text-xs font-semibold text-gray-500 hover:text-gray-900 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            <span>{backLabel || 'Back'}</span>
          </Link>
        )}
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>

      <div className="flex items-center space-x-3">
        {children}
        {actionButton &&
          (actionButton.href ? (
            <Link
              href={actionButton.href}
              className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {ActionIcon && <ActionIcon className="w-4 h-4 mr-2" />}
              <span>{actionButton.label}</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={actionButton.onClick}
              className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
            >
              {ActionIcon && <ActionIcon className="w-4 h-4 mr-2" />}
              <span>{actionButton.label}</span>
            </button>
          ))}
      </div>
    </div>
  );
}