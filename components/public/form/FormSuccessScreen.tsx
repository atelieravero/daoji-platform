'use client';

import React, { useState } from 'react';
import { CheckSquare, RotateCcw, Check, Copy } from 'lucide-react';
import MarkdownRenderer from '@/components/shared/MarkdownRenderer';

interface FormSuccessScreenProps {
  form: any;
  locale: string;
  isTest: boolean;
  generatedToken: string | null;
  t: Record<string, any>;
  onStartOver: () => void;
}

export default function FormSuccessScreen({
  form,
  locale,
  isTest,
  generatedToken,
  t,
  onStartOver,
}: FormSuccessScreenProps) {
  const [isCopied, setIsCopied] = useState(false);

  const successTitle =
    locale === 'zh'
      ? form.schema?.successTitleZh || form.schema?.successTitleEn || t.successTitle
      : form.schema?.successTitleEn || form.schema?.successTitleZh || t.successTitle;

  const successMessage =
    locale === 'zh'
      ? form.schema?.successMessageZh || form.schema?.successMessageEn || t.successMessage
      : form.schema?.successMessageEn || form.schema?.successMessageZh || t.successMessage;

  const messageParts = successMessage.split('{{TOKEN_BOX}}');

  const TokenUIRenderer = () => {
    if (!generatedToken) return null;
    return (
      <div className="my-6 p-6 bg-stone-50 border border-stone-200 rounded-xl text-left">
        <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">
          {t.saveTokenTitle}
        </p>
        <div className="flex items-center justify-between bg-white border border-stone-300 rounded-xl p-2 pl-4">
          <code className="text-xl font-bold text-primary tracking-wider">{generatedToken}</code>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(generatedToken);
              setIsCopied(true);
              setTimeout(() => setIsCopied(false), 2000);
            }}
            className="p-2.5 text-stone-400 hover:text-primary hover:bg-surface-cream rounded-lg transition-colors focus:outline-none cursor-pointer"
          >
            {isCopied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
        <p className="text-xs text-stone-400 mt-3 leading-relaxed">{t.saveTokenDesc}</p>
      </div>
    );
  };

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 py-12 transition-colors ${isTest ? 'bg-surface-test' : 'bg-surface-base'}`}>
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
        {form.schema?.bannerImageUrl && (
          <img
            src={form.schema.bannerImageUrl}
            alt="Banner"
            className="w-full h-auto max-h-64 object-contain bg-stone-50 border-b border-stone-100"
          />
        )}
        <div className="p-8 md:p-12">
          <div className="flex items-center justify-center w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full mx-auto mb-6">
            <CheckSquare className="w-8 h-8" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-stone-800 text-center mb-8">{successTitle}</h1>
          <div className="text-left">
            {messageParts.map((part: string, index: number, array: string[]) => (
              <React.Fragment key={index}>
                <MarkdownRenderer content={part} className="text-sm md:text-base text-stone-600" />
                {index < array.length - 1 && <TokenUIRenderer />}
              </React.Fragment>
            ))}
          </div>
          <div className="mt-12 pt-6 border-t border-stone-100 text-center">
            <button
              type="button"
              onClick={onStartOver}
              className="inline-flex items-center text-sm font-medium text-stone-400 hover:text-stone-600 transition-colors focus:outline-none cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {t.submitAnother}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}