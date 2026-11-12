// components/public/form/FormPreGateScreen.tsx
'use client';

import React, { useState } from 'react';
import { Loader2, KeyRound } from 'lucide-react';
import {
  verifyApplicantToken,
  recoverApplicantToken,
} from '@/app/[locale]/form/[slug]/actions';
import ApplicantIdentityGate, {
  IdentityLookupPayload,
} from './ApplicantIdentityGate';

interface FormPreGateScreenProps {
  eventCode: string;
  eventId: string;
  isTest: boolean;
  isUrlTokenVerifying: boolean;
  manualTokenBody: string;
  preGateError: string | null;
  t: Record<string, any>;
  onClearError: () => void;
  onVerified: (verifiedFullToken: string) => void;
}

export default function FormPreGateScreen({
  eventCode,
  eventId,
  isTest,
  isUrlTokenVerifying,
  manualTokenBody,
  preGateError,
  t,
  onClearError,
  onVerified,
}: FormPreGateScreenProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  if (isUrlTokenVerifying) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center px-4 ${
          isTest ? 'bg-surface-test' : 'bg-surface-base'
        }`}
      >
        <div className="flex flex-col items-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p
            className={`text-sm font-medium ${
              isTest ? 'text-indigo-200' : 'text-ink-muted'
            }`}
          >
            {t.verifying}
          </p>
        </div>
      </div>
    );
  }

  const handleLookup = async (payload: IdentityLookupPayload) => {
    setIsVerifying(true);
    setLocalError(null);
    onClearError();

    try {
      if (payload.mode === 'token') {
        const res = await verifyApplicantToken(payload.token, eventId, isTest);
        if (res.valid) {
          onVerified(res.token || payload.token);
        } else {
          setLocalError(t.invalidToken);
        }
      } else {
        const res = await recoverApplicantToken({
          eventCode: eventId || eventCode,
          name: payload.name,
          phone: payload.phone,
          isTest,
        });
        if (res.success && res.token) {
          onVerified(res.token);
        } else {
          setLocalError(t.recoveryErrorFailed);
        }
      }
    } catch {
      setLocalError(
        payload.mode === 'token' ? t.invalidToken : t.recoveryErrorFailed
      );
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center px-4 py-12 font-sans transition-colors ${
        isTest ? 'bg-surface-test' : 'bg-surface-base'
      }`}
    >
      <div className="max-w-md w-full bg-surface-card p-8 sm:p-10 rounded-3xl shadow-xs border border-surface-dark space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center w-14 h-14 bg-primary-soft text-primary border border-primary-border rounded-full mb-4 mx-auto">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-ink-primary tracking-tight">
            {t.tokenGateTitle}
          </h1>
          <p className="text-sm text-ink-muted leading-relaxed">
            {t.tokenGateSubtitle}
          </p>
        </div>

        <ApplicantIdentityGate
          eventCode={eventCode}
          t={t}
          isLoading={isVerifying}
          errorMessage={localError || preGateError}
          initialTokenBody={manualTokenBody}
          submitLabel={t.verify}
          onClearError={() => {
            setLocalError(null);
            onClearError();
          }}
          onSubmitLookup={handleLookup}
        />
      </div>
    </div>
  );
}