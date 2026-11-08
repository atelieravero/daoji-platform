// components/public/form/FormSuccessScreen.tsx
'use client';

import React, { useState } from 'react';
import { CheckSquare, RotateCcw, Check, Copy } from 'lucide-react';
import MarkdownRenderer from '@/components/shared/MarkdownRenderer';
import { interpolateSuccessText } from '@/lib/form-engine-utils';

export interface FormSuccessScreenProps {
  form: any;
  locale: string;
  isTest: boolean;
  generatedToken: string | null;
  submittedResponse?: Record<string, any>;
  t: Record<string, any>;
  onStartOver: () => void;
}

export default function FormSuccessScreen({
  form,
  locale,
  isTest,
  generatedToken,
  submittedResponse = {},
  t,
  onStartOver,
}: FormSuccessScreenProps) {
  const [isCopied, setIsCopied] = useState(false);
  const fields = form?.schema?.fields || [];

  const rawSuccessTitle =
    locale === 'zh'
      ? form.schema?.successTitleZh || form.schema?.successTitleEn || t.successTitle
      : form.schema?.successTitleEn || form.schema?.successTitleZh || t.successTitle;

  const rawSuccessMessage =
    locale === 'zh'
      ? form.schema?.successMessageZh || form.schema?.successMessageEn || t.successMessage
      : form.schema?.successMessageEn || form.schema?.successMessageZh || t.successMessage;

  const successTitle = interpolateSuccessText(
    rawSuccessTitle || '',
    fields,
    submittedResponse,
    locale,
    { escapeForMarkdown: false }
  );

  const messageParts = (rawSuccessMessage || '').split('{{TOKEN_BOX}}');

  const TokenUIRenderer = () => {
    if (!generatedToken) return null;
    return (
      <div className="my-6 p-6 bg-surface-cream border border-primary-border rounded-2xl text-left">
        <p className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-3">
          {t.saveTokenTitle}
        </p>
        <div className="flex items-center justify-between bg-surface-card border border-surface-dark rounded-xl p-2 pl-4">
          <code className="text-xl font-bold font-mono text-primary tracking-wider">{generatedToken}</code>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(generatedToken);
              setIsCopied(true);
              setTimeout(() => setIsCopied(false), 2000);
            }}
            className="p-2.5 text-ink-muted hover:text-primary hover:bg-primary-soft rounded-lg transition-colors focus:outline-none cursor-pointer"
          >
            {isCopied ? <Check className="w-5 h-5 text-status-success" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
        <p className="text-xs text-ink-muted mt-3 leading-relaxed">{t.saveTokenDesc}</p>
      </div>
    );
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center px-4 py-12 font-sans transition-colors ${
        isTest ? 'bg-surface-test' : 'bg-surface-base'
      }`}
    >
      <div className="max-w-2xl w-full bg-surface-card rounded-3xl shadow-xs border border-surface-dark overflow-hidden">
        {form.schema?.bannerImageUrl && (
          <img
            src={form.schema.bannerImageUrl}
            alt="Banner"
            className="w-full h-auto object-contain block bg-surface-cream border-b border-surface-dark"
          />
        )}
        <div className="p-8 md:p-12">
          <div className="flex items-center justify-center w-16 h-16 bg-emerald-100 text-status-success rounded-full mx-auto mb-6">
            <CheckSquare className="w-8 h-8" />
          </div>
          <h1 className="text-[22px] md:text-3xl font-extrabold text-ink-primary text-center mb-8 tracking-tight leading-snug">
            {successTitle}
          </h1>
          <div className="text-left">
            {messageParts.map((part: string, index: number, array: string[]) => {
              const interpolatedPart = interpolateSuccessText(
                part,
                fields,
                submittedResponse,
                locale,
                { escapeForMarkdown: true }
              );
              return (
                <React.Fragment key={index}>
                  <MarkdownRenderer
                    content={interpolatedPart}
                    baseHeadingLevel={3}
                    className="text-base leading-[1.8] text-ink-body"
                  />
                  {index < array.length - 1 && <TokenUIRenderer />}
                </React.Fragment>
              );
            })}
          </div>
          <div className="mt-12 pt-6 border-t border-surface-dark text-center">
            <button
              type="button"
              onClick={onStartOver}
              className="inline-flex items-center text-sm font-semibold text-ink-muted hover:text-primary transition-colors focus:outline-none cursor-pointer"
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