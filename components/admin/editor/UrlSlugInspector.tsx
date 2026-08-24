'use client';

import React from 'react';
import { sanitizeSlug } from '@/lib/format';
import { FormInput } from '@/components/ui/FormControls';

interface UrlSlugInspectorProps {
  slug: string;
  onChange: (sanitized: string) => void;
  pathPrefix?: string;
  helperText?: string;
  required?: boolean;
}

export default function UrlSlugInspector({
  slug,
  onChange,
  pathPrefix = '/events/',
  helperText = 'Permanent short_id remains valid if slug is empty or modified.',
  required = false,
}: UrlSlugInspectorProps) {
  return (
    <div className="space-y-1">
      <FormInput
        label="URL Slug"
        placeholder="summer-retreat-2026"
        value={slug}
        onChange={(e) => onChange(sanitizeSlug(e.target.value))}
        helperText={helperText}
        required={required}
        className="font-mono text-xs"
      />
    </div>
  );
}