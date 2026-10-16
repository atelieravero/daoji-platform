'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  submitPublicForm,
  verifyApplicantToken,
  getPresignedUploadUrl,
} from './actions';
import { Loader2, AlertCircle } from 'lucide-react';
import MarkdownRenderer from '@/components/shared/MarkdownRenderer';
import StandaloneNotifier from '@/components/public/StandaloneNotifier';

import {
  extractTokenDigits,
  formatTokenBodyDisplay,
  buildFullToken,
  shouldShowField,
} from '@/lib/form-engine-utils';
import FormPreGateScreen from '@/components/public/form/FormPreGateScreen';
import FormSuccessScreen from '@/components/public/form/FormSuccessScreen';
import FormFieldCard from '@/components/public/form/FormFieldCard';
import TokenRecoveryModal from '@/components/public/form/TokenRecoveryModal';

import enDict from '@/messages/en.json';
import zhDict from '@/messages/zh.json';

interface FormEngineProps {
  initialForm: any;
  locale: string;
}

export default function FormEngine({ initialForm, locale }: FormEngineProps) {
  const searchParams = useSearchParams();

  const rawUrlToken = searchParams.get('token');
  const token = rawUrlToken ? rawUrlToken.replace(/\s+/g, '').toUpperCase() : null;
  const isTest = searchParams.get('test') === 'true';

  const [form] = useState<any>(initialForm);
  const eventCode = form?.events?.code || form?.schema?.interimEventCode || 'MMC';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);

  // Pre-gate state
  const [manualTokenBody, setManualTokenBody] = useState('');
  const [isPreGateVerifying, setIsPreGateVerifying] = useState(false);
  const [preGateError, setPreGateError] = useState<string | null>(null);
  const [isPreGatePassed, setIsPreGatePassed] = useState(false);

  const [validatedToken, setValidatedToken] = useState<string | null>(null);
  const [isUrlTokenVerifying, setIsUrlTokenVerifying] = useState(false);
  const [hasCheckedUrlToken, setHasCheckedUrlToken] = useState(false);

  // Challenge Recovery Modal target state (null = pre-gate, string = inline field.dataKey)
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryTargetKey, setRecoveryTargetKey] = useState<string | null>(null);

  const [inlineTokens, setInlineTokens] = useState<
    Record<string, { verifying: boolean; verified: boolean; error: string | null }>
  >({});
  const [uploadStates, setUploadStates] = useState<
    Record<string, { isUploading: boolean; progress: number; error?: string }>
  >({});
  const [answers, setAnswers] = useState<Record<string, any>>({});

  const t = locale === 'zh' ? zhDict.ApplyForm : enDict.ApplyForm;

  const formStorageKey = `daoji_form_draft_${form.id}`;
  const formSuccessKey = `daoji_form_success_${form.id}`;

  const isStandalone = form?.schema?.isStandalone || searchParams.get('standalone') === 'true';

  const handleInputChange = (dataKey: string, value: any) => {
    setAnswers((prev) => {
      const updatedAnswers = { ...prev, [dataKey]: value };
      if (formStorageKey) sessionStorage.setItem(formStorageKey, JSON.stringify(updatedAnswers));
      return updatedAnswers;
    });
  };

  const applyVerifiedToken = (rawFullToken: string, targetKey: string | null) => {
    const normalized = buildFullToken(eventCode, rawFullToken);
    if (targetKey) {
      handleInputChange(targetKey, normalized);
      setInlineTokens((prev) => ({
        ...prev,
        [targetKey]: { verifying: false, verified: true, error: null },
      }));
    } else {
      setValidatedToken(normalized);
      setManualTokenBody(formatTokenBodyDisplay(normalized, eventCode));
      setPreGateError(null);
      setIsPreGatePassed(true);
    }
  };

  const openRecoveryModal = (targetKey: string | null) => {
    setRecoveryTargetKey(targetKey);
    setShowRecoveryModal(true);
  };

  useEffect(() => {
    if (formSuccessKey) {
      const savedSuccess = sessionStorage.getItem(formSuccessKey);
      if (savedSuccess) {
        try {
          const parsed = JSON.parse(savedSuccess);
          if (parsed.submitted) {
            setIsSubmitted(true);
            if (parsed.token) setGeneratedToken(parsed.token);
          }
        } catch {}
      }
    }
  }, [formSuccessKey]);

  useEffect(() => {
    if (formStorageKey && !isSubmitted) {
      const saved = sessionStorage.getItem(formStorageKey);
      if (saved) {
        try {
          setAnswers(JSON.parse(saved));
        } catch {}
      }
    }
  }, [formStorageKey, isSubmitted]);

  useEffect(() => {
    let isMounted = true;
    if (form?.is_followup && token && !hasCheckedUrlToken) {
      setIsUrlTokenVerifying(true);
      verifyApplicantToken(token, form.event_id, isTest)
        .then((res) => {
          if (!isMounted) return;
          if (res.valid) {
            applyVerifiedToken(res.token || token, null);
          } else {
            setPreGateError(t.invalidToken);
          }
        })
        .catch(() => {
          if (isMounted) setPreGateError(t.invalidToken);
        })
        .finally(() => {
          if (!isMounted) return;
          setIsUrlTokenVerifying(false);
          setHasCheckedUrlToken(true);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [form, token, hasCheckedUrlToken, isTest, t.invalidToken]);

  const handlePreGateVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = extractTokenDigits(manualTokenBody, eventCode);
    if (digits.length !== 8) return;

    const fullToken = buildFullToken(eventCode, digits);
    setIsPreGateVerifying(true);
    setPreGateError(null);
    try {
      const res = await verifyApplicantToken(fullToken, form.event_id, isTest);
      if (res.valid) {
        applyVerifiedToken(res.token || fullToken, null);
      } else {
        setPreGateError(t.invalidToken);
      }
    } catch {
      setPreGateError(t.invalidToken);
    } finally {
      setIsPreGateVerifying(false);
    }
  };

  const handleInlineVerify = async (dataKey: string, currentVal: string) => {
    const digits = extractTokenDigits(currentVal, eventCode);
    if (digits.length !== 8) return;

    const fullToken = buildFullToken(eventCode, digits);
    handleInputChange(dataKey, fullToken);
    setInlineTokens((prev) => ({ ...prev, [dataKey]: { verifying: true, verified: false, error: null } }));
    try {
      const res = await verifyApplicantToken(fullToken, form.event_id, isTest);
      if (res.valid) {
        applyVerifiedToken(res.token || fullToken, dataKey);
      } else {
        setInlineTokens((prev) => ({
          ...prev,
          [dataKey]: { verifying: false, verified: false, error: t.invalidToken },
        }));
      }
    } catch {
      setInlineTokens((prev) => ({
        ...prev,
        [dataKey]: { verifying: false, verified: false, error: t.invalidToken },
      }));
    }
  };

  const handleFileUpload = async (dataKey: string, file: File) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setUploadStates((prev) => ({
        ...prev,
        [dataKey]: { isUploading: false, progress: 0, error: (t as any).fileSizeLimit },
      }));
      return;
    }
    setUploadStates((prev) => ({ ...prev, [dataKey]: { isUploading: true, progress: 0, error: undefined } }));

    try {
      const res = await getPresignedUploadUrl(file.name, file.type, isTest);
      if (!res.success || !res.signedUrl || !res.fileKey) {
        throw new Error(res.error || 'Failed to initialize upload.');
      }
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', res.signedUrl!, true);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadStates((prev) => ({
              ...prev,
              [dataKey]: { isUploading: true, progress: Math.round((e.loaded / e.total) * 100) },
            }));
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve(true);
          else reject(new Error(`Upload rejected by bucket (Status: ${xhr.status})`));
        };
        xhr.onerror = () => reject(new Error('Upload blocked by Network disruption.'));
        xhr.send(file);
      });

      handleInputChange(dataKey, res.fileKey);
      setUploadStates((prev) => ({ ...prev, [dataKey]: { isUploading: false, progress: 100 } }));
    } catch (err: any) {
      setUploadStates((prev) => ({ ...prev, [dataKey]: { isUploading: false, progress: 0, error: err.message } }));
    }
  };

  const activeAnswers: Record<string, any> = {};
  const visibleFields = (form?.schema?.fields || []).filter((field: any) => {
    const isVisible = shouldShowField(field, activeAnswers);
    if (isVisible && field.dataKey) activeAnswers[field.dataKey] = answers[field.dataKey];
    return isVisible;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    if (Object.values(uploadStates).some((s) => s.isUploading)) {
      setErrorMessage((t as any).waitFileUpload);
      return;
    }

    for (const f of visibleFields) {
      const fieldLabel =
        locale === 'zh'
          ? f.labelZh || f.labelEn || f.title || f.dataKey
          : f.labelEn || f.labelZh || f.title || f.dataKey;

      if (f.required) {
        const val = activeAnswers[f.dataKey];
        if (val === undefined || val === null || val === '') {
          setErrorMessage(`${t.required}: ${fieldLabel}`);
          return;
        }
      }

      if (f.required && f.type === 'checkbox') {
        const currentVals = activeAnswers[f.dataKey] || [];
        if (currentVals.length === 0) {
          setErrorMessage(`${t.required}: ${fieldLabel}`);
          return;
        }
      }

      if (f.required && f.type === 'time') {
        const val = activeAnswers[f.dataKey] || '';
        const [h, m] = val.split(':');
        if (!h || !m || h.trim() === '' || m.trim() === '') {
          setErrorMessage(`${t.required}: ${fieldLabel}`);
          return;
        }
      }
    }

    const tokenFields = visibleFields.filter((f: any) => f.type === 'applicant_token');
    for (const f of tokenFields) {
      const digits = extractTokenDigits(activeAnswers[f.dataKey], eventCode);
      const isFilled = digits.length > 0;
      const isVerified = inlineTokens[f.dataKey]?.verified;
      if ((f.required && !isVerified) || (isFilled && !isVerified)) {
        setErrorMessage(t.verifyRequired);
        return;
      }
    }

    const inlineTokenVal = tokenFields.length > 0 ? activeAnswers[tokenFields[0].dataKey] : undefined;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const rawTokenVal = form.is_followup ? validatedToken || undefined : token || inlineTokenVal || undefined;
      const applicantToken = rawTokenVal ? rawTokenVal.replace(/\s+/g, '').toUpperCase() : undefined;

      const response = await submitPublicForm({
        form_id: form.id,
        event_id: form.event_id,
        answers: activeAnswers,
        is_test: isTest,
        applicant_token: applicantToken,
        interim_event_code: eventCode,
      });

      let newToken = null;
      if (response.applicant_token && !validatedToken && !inlineTokenVal) {
        newToken = response.applicant_token;
      }

      if (formSuccessKey) {
        sessionStorage.setItem(formSuccessKey, JSON.stringify({ submitted: true, token: newToken }));
      }
      if (formStorageKey) sessionStorage.removeItem(formStorageKey);

      setIsSubmitted(true);
      if (newToken) setGeneratedToken(newToken);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMessage(err.message?.includes('Invalid or expired') ? t.invalidToken : t.submissionFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartOver = () => {
    if (formSuccessKey) sessionStorage.removeItem(formSuccessKey);
    if (formStorageKey) sessionStorage.removeItem(formStorageKey);

    if (typeof window !== 'undefined') {
      const currentUrl = new URL(window.location.href);
      if (currentUrl.searchParams.has('token')) {
        currentUrl.searchParams.delete('token');
        window.location.replace(currentUrl.toString());
        return;
      }
    }

    setIsSubmitted(false);
    setGeneratedToken(null);
    setManualTokenBody('');
    setValidatedToken(null);
    setIsPreGatePassed(false);
    setHasCheckedUrlToken(true);
    setIsUrlTokenVerifying(false);
    setPreGateError(null);
    setErrorMessage(null);
    setAnswers({});
    setInlineTokens({});
    setUploadStates({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderScreen = () => {
    if (form.status === 'draft' && !isTest) {
      return (
        <div className={`min-h-screen flex items-center justify-center text-stone-500 font-medium ${isTest ? 'bg-surface-test' : 'bg-surface-base'}`}>
          {t.notFound}
        </div>
      );
    }

    if (form.status === 'closed') {
      return (
        <div className={`min-h-screen flex items-center justify-center px-4 ${isTest ? 'bg-surface-test' : 'bg-surface-base'}`}>
          <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-stone-200 text-center">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-stone-800">{t.formClosed}</h1>
            <p className="text-sm text-stone-500 mt-2">{t.closedSub}</p>
          </div>
        </div>
      );
    }

    if (form.is_followup && !isPreGatePassed && !isSubmitted) {
      return (
        <FormPreGateScreen
          eventCode={eventCode}
          isTest={isTest}
          isUrlTokenVerifying={isUrlTokenVerifying}
          manualTokenBody={manualTokenBody}
          isPreGateVerifying={isPreGateVerifying}
          preGateError={preGateError}
          t={t as Record<string, any>}
          onChangeTokenBody={(formatted) => {
            setManualTokenBody(formatted);
            if (preGateError) setPreGateError(null);
          }}
          onVerifySubmit={handlePreGateVerify}
          onOpenRecovery={() => openRecoveryModal(null)}
        />
      );
    }

    if (isSubmitted) {
      return (
        <FormSuccessScreen
          form={form}
          locale={locale}
          isTest={isTest}
          generatedToken={generatedToken}
          t={t as Record<string, any>}
          onStartOver={handleStartOver}
        />
      );
    }

    const formTitle =
      locale === 'zh'
        ? form.schema?.titleZh || form.schema?.titleEn || form.title || ''
        : form.schema?.titleEn || form.schema?.titleZh || form.title || '';
    const formSubtitle =
      locale === 'zh'
        ? form.schema?.subtitleZh || form.schema?.subtitleEn || ''
        : form.schema?.subtitleEn || form.schema?.subtitleZh || '';

    return (
      <div className={`min-h-screen py-12 px-4 sm:px-6 font-sans transition-colors ${isTest ? 'bg-surface-test' : 'bg-surface-base'}`}>
        <div className="max-w-2xl mx-auto">
          {isTest && (
            <div className="mb-6 bg-amber-50 border-2 border-amber-300 text-amber-900 px-5 py-4 rounded-2xl text-sm font-bold flex items-center shadow-lg">
              <AlertCircle className="w-6 h-6 mr-3 text-amber-600 shrink-0" />
              {(t as any).testModeBanner}
            </div>
          )}

          <div className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden mb-6">
            {form.schema?.bannerImageUrl && (
              <img
                src={form.schema.bannerImageUrl}
                alt="Banner"
                className="w-full h-auto max-h-64 object-contain bg-stone-50 border-b border-stone-100"
              />
            )}

            <div className="p-8">
              <h1 className="text-2xl font-bold text-stone-800">{formTitle}</h1>
              {formSubtitle && <MarkdownRenderer content={formSubtitle} className="text-sm text-stone-500 mt-3" />}
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {visibleFields.map((field: any) => (
              <FormFieldCard
                key={field.id}
                field={field}
                locale={locale}
                eventCode={eventCode}
                value={activeAnswers[field.dataKey]}
                t={t as Record<string, any>}
                tokenState={inlineTokens[field.dataKey]}
                uploadState={uploadStates[field.dataKey]}
                onChange={handleInputChange}
                onResetInlineToken={(dataKey) =>
                  setInlineTokens((prev) => ({
                    ...prev,
                    [dataKey]: { verifying: false, verified: false, error: null },
                  }))
                }
                onInlineVerify={handleInlineVerify}
                onOpenRecovery={(dataKey) => openRecoveryModal(dataKey)}
                onFileUpload={handleFileUpload}
                onFileRemove={(dataKey) => {
                  handleInputChange(dataKey, null);
                  setUploadStates((prev) => {
                    const next = { ...prev };
                    delete next[dataKey];
                    return next;
                  });
                }}
              />
            ))}

            {errorMessage && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl flex items-center">
                <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 mt-4 bg-primary hover:bg-primary-hover text-white font-medium text-sm rounded-xl shadow-sm transition-colors focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none disabled:opacity-50 flex items-center justify-center cursor-pointer"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {isSubmitting ? t.submitting : isTest ? t.submitTest || 'Submit Form (Test Data)' : t.submit}
            </button>
          </form>
        </div>
      </div>
    );
  };

  return (
    <>
      <StandaloneNotifier
        isStandalone={Boolean(isStandalone)}
        locale={locale}
        forceStandaloneParam
      />

      {renderScreen()}

      <TokenRecoveryModal
        isOpen={showRecoveryModal}
        eventCode={eventCode}
        isTest={isTest}
        t={t as Record<string, any>}
        onClose={() => setShowRecoveryModal(false)}
        onRecovered={(recoveredToken) => applyVerifiedToken(recoveredToken, recoveryTargetKey)}
      />
    </>
  );
}