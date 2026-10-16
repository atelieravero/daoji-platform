'use client';

import React, { useState } from 'react';
import { User, X, AlertCircle, Loader2 } from 'lucide-react';
import { recoverApplicantToken } from '@/app/[locale]/form/[slug]/actions';
import { MobilePhoneInput } from './FormInputs';

interface TokenRecoveryModalProps {
  isOpen: boolean;
  eventCode: string;
  isTest: boolean;
  t: Record<string, any>;
  onClose: () => void;
  onRecovered: (token: string) => void;
}

export default function TokenRecoveryModal({
  isOpen,
  eventCode,
  isTest,
  t,
  onClose,
  onRecovered,
}: TokenRecoveryModalProps) {
  const [recoveryName, setRecoveryName] = useState('');
  const [recoveryPhone, setRecoveryPhone] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    if (isRecovering) return;
    setRecoveryError(null);
    onClose();
  };

  const handleExecuteRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryName.trim() || !recoveryPhone.trim()) {
      setRecoveryError(t.recoveryErrorMissing);
      return;
    }

    setIsRecovering(true);
    setRecoveryError(null);

    try {
      const res = await recoverApplicantToken({
        eventCode,
        name: recoveryName,
        phone: recoveryPhone,
        isTest,
      });

      if (res.success && res.token) {
        onRecovered(res.token);
        setRecoveryName('');
        setRecoveryPhone('');
        onClose();
      } else {
        setRecoveryError(t.recoveryErrorFailed);
      }
    } catch {
      setRecoveryError(t.recoveryErrorFailed);
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5 border border-stone-100 relative">
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-5 right-5 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900">{t.recoveryModalTitle}</h3>
            <p className="text-xs text-stone-500">{t.recoveryModalSubtitle}</p>
          </div>
        </div>

        <form onSubmit={handleExecuteRecovery} noValidate className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              {t.recoveryFullNameLabel} *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={recoveryName}
                onChange={(e) => {
                  setRecoveryName(e.target.value);
                  if (recoveryError) setRecoveryError(null);
                }}
                placeholder={t.recoveryFullNamePlaceholder}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-stone-800 bg-white transition-shadow"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              {t.recoveryPhoneLabel} *
            </label>
            <MobilePhoneInput
              required
              value={recoveryPhone}
              onChange={(val) => {
                setRecoveryPhone(val);
                if (recoveryError) setRecoveryError(null);
              }}
              placeholder={t.recoveryPhonePlaceholder || '852 1234 5678'}
            />
          </div>

          {recoveryError && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs flex items-center font-medium">
              <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
              {recoveryError}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={handleClose}
              disabled={isRecovering}
              className="px-4 py-2.5 text-xs font-semibold text-stone-500 hover:text-stone-800 rounded-xl transition-colors cursor-pointer"
            >
              {t.recoveryCancel}
            </button>
            <button
              type="submit"
              disabled={isRecovering || !recoveryName.trim() || !recoveryPhone.trim()}
              className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50 flex items-center cursor-pointer"
            >
              {isRecovering && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              {isRecovering ? t.recoverySubmitting : t.recoverySubmit}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}