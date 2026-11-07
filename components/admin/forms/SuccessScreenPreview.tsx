// components/admin/forms/SuccessScreenPreview.tsx
'use client';

import React from 'react';
import { CheckSquare, KeyRound } from 'lucide-react';
import MarkdownRenderer from '@/components/shared/MarkdownRenderer';
import { FormField } from './QuestionCanvasItem';
import {
  SUPPORTED_SUCCESS_VARIABLE_TYPES,
  interpolateSuccessPreviewMarkdown,
} from '@/lib/form-engine-utils';

interface SuccessScreenPreviewProps {
  titleEn: string;
  titleZh: string;
  messageEn: string;
  messageZh: string;
  fields?: FormField[];
}

export function MockTokenBox() {
  return (
    <div className="my-6 p-4 border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-xl flex items-center justify-center text-indigo-400">
      <KeyRound className="w-4 h-4 mr-2" />
      <span className="text-xs font-bold uppercase tracking-wider">
        Applicant Token UI Block Rendered Here
      </span>
    </div>
  );
}

function renderTitleWithPreviewBadges(
  title: string,
  fields: FormField[],
  locale: 'en' | 'zh'
) {
  if (!title) return null;
  const parts = title.split(/(\{\{[^{}]+\}\})/g);

  return parts.map((segment, idx) => {
    const match = segment.match(/^\{\{([^{}]+)\}\}$/);
    if (!match) return <React.Fragment key={idx}>{segment}</React.Fragment>;

    const key = match[1].trim();
    const field = fields.find(
      (f) => f.dataKey === key && SUPPORTED_SUCCESS_VARIABLE_TYPES.has(f.type)
    );

    if (!field) {
      // Invalid key: output literally
      return <React.Fragment key={idx}>{segment}</React.Fragment>;
    }

    const label =
      locale === 'zh'
        ? field.labelZh || field.labelEn || key
        : field.labelEn || field.labelZh || key;

    return (
      <span
        key={idx}
        className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 rounded-md text-xs font-mono font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 align-middle"
      >
        <span>{`{{${key}}}`}</span>
        <span className="font-sans font-normal text-indigo-500">({label})</span>
      </span>
    );
  });
}

export default function SuccessScreenPreview({
  titleEn,
  titleZh,
  messageEn,
  messageZh,
  fields = [],
}: SuccessScreenPreviewProps) {
  return (
    <div className="p-12 bg-white text-center">
      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckSquare className="w-8 h-8" />
      </div>
      <div className="text-left bg-gray-50 rounded-2xl p-8 border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 leading-snug">
          {renderTitleWithPreviewBadges(titleEn, fields, 'en')}{' '}
          <span className="text-gray-400 font-normal mx-2">/</span>{' '}
          {renderTitleWithPreviewBadges(titleZh, fields, 'zh')}
        </h2>
        <hr className="mb-6 border-gray-200" />

        <div className="space-y-8">
          <div className="space-y-6">
            {messageEn.split('{{TOKEN_BOX}}').map((part, index, array) => (
              <React.Fragment key={`en-${index}`}>
                <MarkdownRenderer
                  content={interpolateSuccessPreviewMarkdown(part, fields, 'en')}
                  baseHeadingLevel={3}
                  className="text-sm text-gray-700"
                />
                {index < array.length - 1 && <MockTokenBox />}
              </React.Fragment>
            ))}
          </div>

          <hr className="border-gray-200 border-dashed" />

          <div className="space-y-6">
            {messageZh.split('{{TOKEN_BOX}}').map((part, index, array) => (
              <React.Fragment key={`zh-${index}`}>
                <MarkdownRenderer
                  content={interpolateSuccessPreviewMarkdown(part, fields, 'zh')}
                  baseHeadingLevel={3}
                  className="text-sm text-gray-700"
                />
                {index < array.length - 1 && <MockTokenBox />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}