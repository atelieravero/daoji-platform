'use client';

import React from 'react';
import { Loader2, KeyRound, AlertCircle, Search } from 'lucide-react';
import { extractTokenDigits } from '@/lib/form-engine-utils';
import { TokenDigitsInput } from './FormInputs';

interface FormPreGateScreenProps {
  eventCode: string;
  isTest: boolean;
  isUrlTokenVerifying: boolean;
  manualTokenBody: string;
  isPreGateVerifying: boolean;
  preGateError: string | null;
  t: Record<string, any>;
  onChangeTokenBody: (formatted: string) => void;
  onVerifySubmit: (e: React.FormEvent) => void;
  onOpenRecovery: () => void;
}

export default function FormPreGateScreen({
  eventCode,
  isTest,
  isUrlTokenVerifying,
  manualTokenBody,
  isPreGateVerifying,
  preGateError,
  t,
  onChangeTokenBody,
  onVerifySubmit,
  onOpenRecovery,
}: FormPreGateScreenProps) {
  if (isUrlTokenVerifying) {
    return (
      <div className={`min-h-screen flex items-center justify-center px-4 ${isTest ? 'bg-surface-test' : 'bg-surface-base'}`}>
        <div className="flex flex-col items-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p className={`text-sm font-medium ${isTest ? 'text-indigo-200' : 'text-stone-500'}`}>{t.verifying}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 transition-colors ${isTest ? 'bg-surface-test' : 'bg-surface-base'}`}>
      <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-stone-200">
        <div className="flex items-center justify-center w-14 h-14 bg-primary/10 text-primary rounded-full mb-6 mx-auto">
          <KeyRound className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-stone-800 text-center mb-2">{t.tokenGateTitle}</h1>
        <p className="text-sm text-stone-500 text-center leading-relaxed">{t.tokenGateSubtitle}</p>

        <form onSubmit={onVerifySubmit} noValidate className="mt-8 space-y-4">
          <div>
            <TokenDigitsInput
              eventCode={eventCode}
              value={manualTokenBody}
              onChangeDigits={onChangeTokenBody}
              placeholder={t.tokenPlaceholder || '1234-5678'}
              size="lg"
              isError={Boolean(preGateError)}
            />
            <p className="text-[11px] text-stone-400 mt-1.5 px-1">{t.tokenPrefixHint}</p>
          </div>

          {preGateError && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm flex items-center justify-center text-center font-medium">
              <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
              {preGateError}
            </div>
          )}

          <button
            type="submit"
            disabled={isPreGateVerifying || extractTokenDigits(manualTokenBody, eventCode).length !== 8}
            className="w-full py-3.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl shadow-xs transition-colors focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-40 flex items-center justify-center cursor-pointer"
          >
            {isPreGateVerifying && <Loader2 className="w-5 h-5 animate-spin mr-2" />}
            {isPreGateVerifying ? t.verifying : t.verify}
          </button>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={onOpenRecovery}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-primary transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{t.forgotTokenPrompt}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}