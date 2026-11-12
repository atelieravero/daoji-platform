// components/public/form/ApplicantIdentityGate.tsx
'use client';

import React, { useState } from 'react';
import { KeyRound, UserCheck, Loader2, AlertCircle } from 'lucide-react';
import { extractTokenDigits, buildFullToken } from '@/lib/form-engine-utils';
import { MobilePhoneInput, TokenDigitsInput } from './FormInputs';

export type IdentityLookupPayload =
  | { mode: 'token'; token: string; tokenBody: string }
  | { mode: 'identity'; name: string; phone: string };

interface ApplicantIdentityGateProps {
  eventCode: string;
  t: Record<string, any>;
  isLoading: boolean;
  errorMessage: string | null;
  initialTokenBody?: string;
  submitLabel?: string;
  onClearError: () => void;
  onSubmitLookup: (payload: IdentityLookupPayload) => Promise<void> | void;
}

export default function ApplicantIdentityGate({
  eventCode,
  t,
  isLoading,
  errorMessage,
  initialTokenBody = '',
  submitLabel,
  onClearError,
  onSubmitLookup,
}: ApplicantIdentityGateProps) {
  const [lookupMode, setLookupMode] = useState<'token' | 'identity'>('token');
  const [tokenDigitsBody, setTokenDigitsBody] = useState(initialTokenBody);
  const [fullName, setFullName] = useState('');
  const [mobilePhone, setMobilePhone] = useState('');

  const digitsCount = extractTokenDigits(tokenDigitsBody, eventCode).length;
  const isSubmitDisabled =
    isLoading ||
    (lookupMode === 'token'
      ? digitsCount !== 8
      : !fullName.trim() || !mobilePhone.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lookupMode === 'token') {
      if (digitsCount !== 8) return;
      const fullToken = buildFullToken(eventCode, tokenDigitsBody);
      await onSubmitLookup({
        mode: 'token',
        token: fullToken,
        tokenBody: tokenDigitsBody,
      });
    } else {
      if (!fullName.trim() || !mobilePhone.trim()) return;
      await onSubmitLookup({
        mode: 'identity',
        name: fullName.trim(),
        phone: mobilePhone.trim(),
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* SIDE-BY-SIDE MODE SWITCHER TABS */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-surface-cream rounded-xl border border-surface-dark">
        <button
          type="button"
          onClick={() => {
            setLookupMode('token');
            onClearError();
          }}
          className={`py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            lookupMode === 'token'
              ? 'bg-surface-card text-primary shadow-2xs border border-surface-dark/60'
              : 'text-ink-muted hover:text-ink-primary'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5 shrink-0" />
          <span>{t.statusLookupByToken}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setLookupMode('identity');
            onClearError();
          }}
          className={`py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            lookupMode === 'identity'
              ? 'bg-surface-card text-primary shadow-2xs border border-surface-dark/60'
              : 'text-ink-muted hover:text-ink-primary'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5 shrink-0" />
          <span>{t.statusLookupByIdentity}</span>
        </button>
      </div>

      {/* FORM INPUTS */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {lookupMode === 'token' ? (
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-ink-primary">
              {t.tokenGateTitle}
            </label>
            <TokenDigitsInput
              eventCode={eventCode}
              value={tokenDigitsBody}
              required
              size="lg"
              isError={Boolean(errorMessage)}
              placeholder={t.tokenPlaceholder || '1234-5678'}
              onChangeDigits={(formatted) => {
                setTokenDigitsBody(formatted);
                if (errorMessage) onClearError();
              }}
            />
            <p className="text-xs text-ink-muted">{t.tokenPrefixHint}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-ink-primary mb-1.5">
                {t.recoveryFullNameLabel} *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errorMessage) onClearError();
                }}
                placeholder={t.recoveryFullNamePlaceholder}
                className="w-full px-3.5 py-2.5 rounded-xl border border-surface-dark text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-ink-primary bg-surface-card"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink-primary mb-1.5">
                {t.recoveryPhoneLabel} *
              </label>
              <MobilePhoneInput
                required
                value={mobilePhone}
                onChange={(val) => {
                  setMobilePhone(val);
                  if (errorMessage) onClearError();
                }}
                placeholder={t.recoveryPhonePlaceholder || '852 1234 5678'}
              />
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-status-danger text-xs font-medium rounded-xl flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitDisabled}
          className="w-full py-3.5 bg-primary hover:bg-primary-hover active:bg-primary-active text-white font-semibold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center cursor-pointer disabled:opacity-40"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          <span>{isLoading ? t.verifying : submitLabel || t.verify}</span>
        </button>
      </form>
    </div>
  );
}