// app/[locale]/form/[slug]/status/StatusInquiryClient.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ClipboardCheck,
  AlertCircle,
  Copy,
  Check,
  RotateCcw,
  ArrowLeft,
} from 'lucide-react';
import { inquireApplicantStatus } from '../actions';
import { formatTokenBodyDisplay } from '@/lib/form-engine-utils';
import {
  normalizeStatusConfig,
  getStatusToneStyle,
  ResolvedPublicStatusItem,
} from '@/lib/status-inquiry';
import ApplicantIdentityGate, {
  IdentityLookupPayload,
} from '@/components/public/form/ApplicantIdentityGate';
import MarkdownRenderer from '@/components/shared/MarkdownRenderer';
import StandaloneNotifier from '@/components/public/StandaloneNotifier';

import enDict from '@/messages/en.json';
import zhDict from '@/messages/zh.json';

interface StatusInquiryClientProps {
  initialForm: any;
  locale: string;
}

export default function StatusInquiryClient({
  initialForm,
  locale,
}: StatusInquiryClientProps) {
  const searchParams = useSearchParams();
  const isZh = locale === 'zh';
  const t = (isZh ? zhDict.ApplyForm : enDict.ApplyForm) as Record<string, any>;

  const rawUrlToken = searchParams.get('token');
  const urlToken = rawUrlToken ? rawUrlToken.replace(/\s+/g, '').toUpperCase() : null;
  const isTest = searchParams.get('test') === 'true';
  const isStandalone =
    initialForm?.schema?.isStandalone || searchParams.get('standalone') === 'true';

  const statusConfig = normalizeStatusConfig(initialForm?.status_config);
  const eventCode =
    initialForm?.events?.code || initialForm?.schema?.interimEventCode || 'MMC';

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [verifiedToken, setVerifiedToken] = useState<string | null>(null);
  const [statusItems, setStatusItems] = useState<ResolvedPublicStatusItem[] | null>(
    null
  );
  const [isCopied, setIsCopied] = useState(false);
  const [hasAutoCheckedUrlToken, setHasAutoCheckedUrlToken] = useState(false);

  const formTitle = isZh
    ? initialForm.schema?.titleZh || initialForm.schema?.titleEn || initialForm.title || ''
    : initialForm.schema?.titleEn || initialForm.schema?.titleZh || initialForm.title || '';

  const introMarkdown = isZh
    ? statusConfig.introZh || statusConfig.introEn || ''
    : statusConfig.introEn || statusConfig.introZh || '';

  const mapErrorCode = (code?: string) => {
    switch (code) {
      case 'invalid_token':
        return t.invalidToken;
      case 'missing_identity':
        return t.recoveryErrorMissing;
      case 'not_found':
      case 'multiple_matches':
        return t.recoveryErrorFailed;
      default:
        return t.recoveryErrorFailed;
    }
  };

  useEffect(() => {
    if (urlToken && !hasAutoCheckedUrlToken) {
      setHasAutoCheckedUrlToken(true);
      setIsLoading(true);
      inquireApplicantStatus({
        formId: initialForm.id,
        eventCode,
        mode: 'token',
        token: urlToken,
        isTest,
      })
        .then((res) => {
          if (res.success && res.items) {
            setVerifiedToken(res.applicantToken || urlToken);
            setStatusItems(res.items);
          } else {
            setErrorMsg(mapErrorCode(res.errorCode));
          }
        })
        .catch(() => setErrorMsg(t.invalidToken))
        .finally(() => setIsLoading(false));
    }
  }, [urlToken, hasAutoCheckedUrlToken, initialForm.id, eventCode, isTest]);

  const handleLookup = async (payload: IdentityLookupPayload) => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const res =
        payload.mode === 'token'
          ? await inquireApplicantStatus({
              formId: initialForm.id,
              eventCode,
              mode: 'token',
              token: payload.token,
              isTest,
            })
          : await inquireApplicantStatus({
              formId: initialForm.id,
              eventCode,
              mode: 'identity',
              name: payload.name,
              phone: payload.phone,
              isTest,
            });

      if (res.success && res.items) {
        setVerifiedToken(
          res.applicantToken || (payload.mode === 'token' ? payload.token : '')
        );
        setStatusItems(res.items);
      } else {
        setErrorMsg(mapErrorCode(res.errorCode));
      }
    } catch {
      setErrorMsg(
        payload.mode === 'token' ? t.invalidToken : t.recoveryErrorFailed
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setVerifiedToken(null);
    setStatusItems(null);
    setErrorMsg(null);
  };

  if (!statusConfig.enabled && !isTest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-base px-4 font-sans text-ink-muted">
        <StandaloneNotifier
          isStandalone={Boolean(isStandalone)}
          locale={locale}
          forceStandaloneParam
        />
        <div className="max-w-md w-full bg-surface-card p-8 rounded-3xl border border-surface-dark text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-ink-muted mx-auto" />
          <h1 className="text-lg font-bold text-ink-primary">
            {t.statusInquiryUnavailable}
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen py-12 px-4 sm:px-6 font-sans transition-colors ${
        isTest ? 'bg-surface-test' : 'bg-surface-base'
      }`}
    >
      <StandaloneNotifier
        isStandalone={Boolean(isStandalone)}
        locale={locale}
        forceStandaloneParam
      />

      <div className="max-w-2xl mx-auto space-y-6">
        {!isStandalone && initialForm?.events?.short_id && (
          <Link
            href={`/${locale}/event/${initialForm.events.slug || initialForm.events.short_id}`}
            className="group inline-flex items-center text-[13px] font-semibold text-ink-muted hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5 transition-transform group-hover:-translate-x-0.5" />
            <span>{t.back}</span>
          </Link>
        )}

        {isTest && (
          <div className="bg-amber-50 border-2 border-amber-300 text-amber-900 px-5 py-4 rounded-2xl text-sm font-bold flex items-center shadow-lg">
            <AlertCircle className="w-6 h-6 mr-3 text-amber-600 shrink-0" />
            {t.testModeBanner}
          </div>
        )}

        <div className="bg-surface-card rounded-3xl shadow-xs border border-surface-dark overflow-hidden">
          {initialForm.schema?.bannerImageUrl && (
            <img
              src={initialForm.schema.bannerImageUrl}
              alt="Banner"
              className="w-full h-auto object-contain block bg-surface-cream border-b border-surface-dark"
            />
          )}

          <div className="p-8 md:p-10 space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                <ClipboardCheck className="w-4 h-4" />
                <span>{t.statusInquiryBadge}</span>
              </div>
              <h1 className="text-[22px] md:text-[28px] font-extrabold text-ink-primary tracking-tight leading-[1.3]">
                {formTitle}
              </h1>
            </div>

            {statusItems === null ? (
              <div className="space-y-6 pt-2">
                <p className="text-sm text-ink-body leading-relaxed">
                  {t.statusInquirySubtitle}
                </p>

                <ApplicantIdentityGate
                  eventCode={eventCode}
                  t={t}
                  isLoading={isLoading}
                  errorMessage={errorMsg}
                  initialTokenBody={
                    urlToken ? formatTokenBodyDisplay(urlToken, eventCode) : ''
                  }
                  submitLabel={t.statusCheckButton}
                  onClearError={() => setErrorMsg(null)}
                  onSubmitLookup={handleLookup}
                />
              </div>
            ) : (
              <div className="space-y-6 pt-2 animate-in fade-in">
                {verifiedToken && (
                  <div className="p-4 bg-surface-cream border border-primary-border rounded-2xl flex items-center justify-between gap-4">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted block">
                        {t.yourApplicantToken}
                      </span>
                      <code className="text-lg font-bold font-mono text-primary tracking-wider">
                        {verifiedToken}
                      </code>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(verifiedToken);
                        setIsCopied(true);
                        setTimeout(() => setIsCopied(false), 2000);
                      }}
                      className="p-2.5 bg-surface-card hover:bg-primary-soft text-ink-muted hover:text-primary border border-surface-dark rounded-xl transition-colors cursor-pointer"
                    >
                      {isCopied ? (
                        <Check className="w-4 h-4 text-status-success" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )}

                {introMarkdown && (
                  <MarkdownRenderer
                    content={introMarkdown}
                    baseHeadingLevel={3}
                    className="text-base leading-[1.8] text-ink-body"
                  />
                )}

                {statusItems.length === 0 ? (
                  <div className="p-8 bg-surface-base rounded-2xl border border-surface-dark text-center text-sm text-ink-muted">
                    {t.statusNoItemsYet}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {statusItems.map((item) => {
                      const toneStyle = getStatusToneStyle(item.tone);
                      const fieldLabel = isZh ? item.fieldLabelZh : item.fieldLabelEn;
                      const optionLabel = isZh ? item.optionLabelZh : item.optionLabelEn;
                      const instruction = isZh
                        ? item.instructionZh || item.instructionEn
                        : item.instructionEn || item.instructionZh;

                      return (
                        <div
                          key={item.key}
                          className="p-5 md:p-6 rounded-2xl bg-surface-base border border-surface-dark space-y-3"
                        >
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <h2 className="text-base font-bold text-ink-primary">
                              {fieldLabel}
                            </h2>
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${toneStyle.publicBadgeClass}`}
                            >
                              {optionLabel}
                            </span>
                          </div>

                          {instruction && (
                            <div className="pt-3 border-t border-surface-dark/70">
                              <MarkdownRenderer
                                content={instruction}
                                baseHeadingLevel={4}
                                className="text-[15px] leading-[1.8] text-ink-body"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="pt-4 border-t border-surface-dark text-center">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center text-sm font-semibold text-ink-muted hover:text-primary transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    <span>{t.statusCheckAnother}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}