'use client';

import React from 'react';
import { CheckSquare, KeyRound } from 'lucide-react';
import MarkdownRenderer from '@/components/shared/MarkdownRenderer';

interface SuccessScreenPreviewProps {
  titleEn: string;
  titleZh: string;
  messageEn: string;
  messageZh: string;
}

export function MockTokenBox() {
  return (
    <div className="my-6 p-4 border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-xl flex items-center justify-center text-indigo-400">
      <KeyRound className="w-4 h-4 mr-2" />
      <span className="text-xs font-bold uppercase tracking-wider">Applicant Token UI Block Rendered Here</span>
    </div>
  );
}

export default function SuccessScreenPreview({
  titleEn,
  titleZh,
  messageEn,
  messageZh,
}: SuccessScreenPreviewProps) {
  return (
    <div className="p-12 bg-white text-center">
      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckSquare className="w-8 h-8" />
      </div>
      <div className="text-left bg-gray-50 rounded-2xl p-8 border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {titleEn} <span className="text-gray-400 font-normal mx-2">/</span> {titleZh}
        </h2>
        <hr className="mb-6 border-gray-200" />

        <div className="space-y-8">
          <div className="space-y-6">
            {messageEn.split('{{TOKEN_BOX}}').map((part, index, array) => (
              <React.Fragment key={`en-${index}`}>
                <MarkdownRenderer content={part} className="text-sm text-gray-700" />
                {index < array.length - 1 && <MockTokenBox />}
              </React.Fragment>
            ))}
          </div>

          <hr className="border-gray-200 border-dashed" />

          <div className="space-y-6">
            {messageZh.split('{{TOKEN_BOX}}').map((part, index, array) => (
              <React.Fragment key={`zh-${index}`}>
                <MarkdownRenderer content={part} className="text-sm text-gray-700" />
                {index < array.length - 1 && <MockTokenBox />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}