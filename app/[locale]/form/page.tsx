'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { getPublicForm, submitPublicForm, verifyApplicantToken, getPresignedUploadUrl } from './actions';
import { Loader2, CheckCircle2, AlertCircle, Smartphone, Calendar, KeyRound, Copy, Check, UploadCloud, CheckSquare } from 'lucide-react';
import MarkdownRenderer from '@/components/shared/MarkdownRenderer';

import enDict from '@/messages/en.json';
import zhDict from '@/messages/zh.json';

// --- Telephone Parsing & Formatting Utilities ---
const parseMobileString = (raw: string) => {
  const digits = raw.replace(/\D/g, '');
  let ccLength = 0;
  if (['1','7'].includes(digits.substring(0,1))) ccLength = 1;
  else if (/^(2[07]|3[0-469]|4[013-9]|5[1-8]|6[0-6]|8[1246]|9[0-58])/.test(digits)) ccLength = 2;
  else if (digits.length >= 3) ccLength = 3;
  else ccLength = digits.length;
  
  return { digits, ccLength };
};

const formatPhoneDisplay = (raw: string) => {
  if (!raw) return '';
  const { digits, ccLength } = parseMobileString(raw);
  if (digits.length === 0) return '';
  if (digits.length <= ccLength) return digits; 
  
  const cc = digits.substring(0, ccLength);
  const rest = digits.substring(ccLength);
  
  return cc + ' ' + rest;
};

export default function PublicFormRoute() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-surface-base">
        <div className="flex items-center space-x-2 text-stone-500 text-sm font-medium">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span>Loading form...</span>
        </div>
      </div>
    }>
      <PublicFormContent />
    </Suspense>
  );
}

function PublicFormContent() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  
  const searchParams = useSearchParams();
  const formId = searchParams.get('id');
  const token = searchParams.get('token');
  const isTest = searchParams.get('test') === 'true';

  const [form, setForm] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // REVERTED: Do not pull from URL search parameters anymore
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);

  const [manualToken, setManualToken] = useState('');
  const [isPreGateVerifying, setIsPreGateVerifying] = useState(false);
  const [preGateError, setPreGateError] = useState<string | null>(null);
  const [isPreGatePassed, setIsPreGatePassed] = useState(false);
  
  const [validatedToken, setValidatedToken] = useState<string | null>(null);
  const [isUrlTokenVerifying, setIsUrlTokenVerifying] = useState(false);
  const [hasCheckedUrlToken, setHasCheckedUrlToken] = useState(false);

  const [inlineTokens, setInlineTokens] = useState<Record<string, { verifying: boolean, verified: boolean, error: string | null }>>({});
  const [uploadStates, setUploadStates] = useState<Record<string, { isUploading: boolean, progress: number, error?: string }>>({});
  const [isCopied, setIsCopied] = useState(false);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  const t = locale === 'zh' ? zhDict.ApplyForm : enDict.ApplyForm;
  
  // Storage Keys
  const formStorageKey = formId ? `daoji_form_draft_${formId}` : null;
  const formSuccessKey = formId ? `daoji_form_success_${formId}` : null;

  const isStandalone = form?.schema?.isStandalone || searchParams.get('standalone') === 'true';

  // SECURE STATE PRESERVATION: Check sessionStorage for success state on load
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
        } catch (e) { /* silent fail */ }
      }
    }
  }, [formSuccessKey]);

  useEffect(() => {
    if (formStorageKey && !isSubmitted) {
      const saved = sessionStorage.getItem(formStorageKey);
      if (saved) {
        try { setAnswers(JSON.parse(saved)); } catch (e) { /* silent fail */ }
      }
    }
  }, [formStorageKey, isSubmitted]);

  useEffect(() => {
    if (!formId) {
      setIsLoading(false);
      return;
    }
    getPublicForm(formId).then((data) => {
      setForm(data);
      setIsLoading(false);
    });
  }, [formId]);

  useEffect(() => {
    let isMounted = true;
    if (form?.is_followup && token && !hasCheckedUrlToken) {
      setIsUrlTokenVerifying(true);
      verifyApplicantToken(token, form.event_id, isTest)
        .then(res => {
          if (!isMounted) return;
          if (res.valid) {
            setValidatedToken(token); 
            setIsPreGatePassed(true);
          } else {
            setPreGateError(t.invalidToken); 
          }
        })
        .catch(() => { if (isMounted) setPreGateError(t.invalidToken); })
        .finally(() => {
          if (!isMounted) return;
          setIsUrlTokenVerifying(false);
          setHasCheckedUrlToken(true);
        });
    }
    return () => { isMounted = false; };
  }, [form, token, hasCheckedUrlToken, isTest, t.invalidToken]);

  const handlePreGateVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken) return;
    setIsPreGateVerifying(true);
    setPreGateError(null);
    try {
      const res = await verifyApplicantToken(manualToken, form.event_id, isTest);
      if (res.valid) {
        setValidatedToken(manualToken); 
        setIsPreGatePassed(true);
      } else {
        setPreGateError(t.invalidToken); 
      }
    } catch (err) {
      setPreGateError(t.invalidToken);
    } finally {
      setIsPreGateVerifying(false);
    }
  };

  const handleInlineVerify = async (dataKey: string, tokenVal: string) => {
    if (!tokenVal) return;
    setInlineTokens(prev => ({ ...prev, [dataKey]: { verifying: true, verified: false, error: null } }));
    try {
      const res = await verifyApplicantToken(tokenVal, form.event_id, isTest);
      if (res.valid) {
        setInlineTokens(prev => ({ ...prev, [dataKey]: { verifying: false, verified: true, error: null } }));
      } else {
        setInlineTokens(prev => ({ ...prev, [dataKey]: { verifying: false, verified: false, error: t.invalidToken } })); 
      }
    } catch (err) {
      setInlineTokens(prev => ({ ...prev, [dataKey]: { verifying: false, verified: false, error: t.invalidToken } }));
    }
  };

  const handleFileUpload = async (dataKey: string, file: File) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setUploadStates(prev => ({ ...prev, [dataKey]: { isUploading: false, progress: 0, error: (t as any).fileSizeLimit } }));
      return;
    }
    setUploadStates(prev => ({ ...prev, [dataKey]: { isUploading: true, progress: 0, error: undefined } }));

    try {
      const res = await getPresignedUploadUrl(file.name, file.type);
      if (!res.success || !res.signedUrl || !res.fileKey) {
        throw new Error(res.error || 'Failed to initialize upload.');
      }
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', res.signedUrl!, true);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadStates(prev => ({ ...prev, [dataKey]: { isUploading: true, progress: Math.round((e.loaded / e.total) * 100) } }));
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
      setUploadStates(prev => ({ ...prev, [dataKey]: { isUploading: false, progress: 100 } }));
    } catch (err: any) {
      setUploadStates(prev => ({ ...prev, [dataKey]: { isUploading: false, progress: 0, error: err.message } }));
    }
  };

  const shouldShowField = (field: any, activeAnswers: Record<string, any>) => {
    if (!field.condition || !field.condition.rules || field.condition.rules.length === 0) return true;
    const { match, rules } = field.condition;
    const evaluations = rules.map((rule: any) => {
      const dependentVal = activeAnswers[rule.dependsOn];
      switch (rule.operator) {
        case 'equals': return Array.isArray(dependentVal) ? dependentVal.length === 1 && dependentVal[0] === rule.value : dependentVal === rule.value;
        case 'not_equals': return Array.isArray(dependentVal) ? dependentVal.length !== 1 || dependentVal[0] !== rule.value : dependentVal !== rule.value;
        case 'contains': return Array.isArray(dependentVal) ? dependentVal.includes(rule.value) : (typeof dependentVal === 'string' ? dependentVal.includes(rule.value) : false);
        case 'not_contains': return Array.isArray(dependentVal) ? !dependentVal.includes(rule.value) : (typeof dependentVal === 'string' ? !dependentVal.includes(rule.value) : true);
        case 'is_one_of': {
          const allowedValues = Array.isArray(rule.value) ? rule.value : typeof rule.value === 'string' ? rule.value.split(',').map((v: string) => v.trim()) : [];
          return Array.isArray(dependentVal) ? dependentVal.some((val: string) => allowedValues.includes(val)) : allowedValues.includes(dependentVal);
        }
        case 'is_not_one_of': {
          const disallowedValues = Array.isArray(rule.value) ? rule.value : typeof rule.value === 'string' ? rule.value.split(',').map((v: string) => v.trim()) : [];
          return Array.isArray(dependentVal) ? !dependentVal.some((val: string) => disallowedValues.includes(val)) : !disallowedValues.includes(dependentVal);
        }
        case 'is_blank': return !dependentVal || dependentVal.length === 0;
        case 'is_not_blank': return !!dependentVal && dependentVal.length > 0;
        default: return true;
      }
    });
    return match === 'OR' ? evaluations.some(Boolean) : evaluations.every(Boolean);
  };

  const handleInputChange = (dataKey: string, value: any) => {
    setAnswers(prev => {
      const updatedAnswers = { ...prev, [dataKey]: value };
      if (formStorageKey) sessionStorage.setItem(formStorageKey, JSON.stringify(updatedAnswers));
      return updatedAnswers;
    });
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

    if (Object.values(uploadStates).some(s => s.isUploading)) {
      setErrorMessage((t as any).waitFileUpload); 
      return;
    }

    for (const f of visibleFields) {
      if (f.required && f.type === 'checkbox') {
        const currentVals = activeAnswers[f.dataKey] || [];
        if (currentVals.length === 0) {
          const fieldLabel = locale === 'zh' 
            ? (f.labelZh || f.labelEn || f.title || f.dataKey) 
            : (f.labelEn || f.labelZh || f.title || f.dataKey);
          setErrorMessage(`${t.required}: ${fieldLabel}`);
          return;
        }
      }
    }

    const tokenFields = visibleFields.filter((f: any) => f.type === 'applicant_token');
    for (const f of tokenFields) {
      const isFilled = !!activeAnswers[f.dataKey];
      const isVerified = isTest ? isFilled : inlineTokens[f.dataKey]?.verified;
      if ((f.required && !isVerified) || (isFilled && !isVerified)) {
        setErrorMessage(t.verifyRequired);
        return;
      }
    }

    const inlineTokenVal = tokenFields.length > 0 ? activeAnswers[tokenFields[0].dataKey] : undefined;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await submitPublicForm({
        form_id: form.id,
        event_id: form.event_id,
        answers: activeAnswers, 
        is_test: isTest,
        applicant_token: form.is_followup ? (validatedToken || undefined) : (token || inlineTokenVal || undefined),
        interim_event_code: form.schema?.interimEventCode || 'MMC'
      });
      
      let newToken = null;
      if (response.applicant_token && !validatedToken && !inlineTokenVal) {
        newToken = response.applicant_token;
      }

      // SECURE STATE PRESERVATION: Save success state to sessionStorage
      if (formSuccessKey) {
        sessionStorage.setItem(formSuccessKey, JSON.stringify({
          submitted: true,
          token: newToken
        }));
      }

      // Clear the draft answers
      if (formStorageKey) sessionStorage.removeItem(formStorageKey);
      
      // Update local React state to render the success screen
      setIsSubmitted(true);
      if (newToken) setGeneratedToken(newToken);
      
    } catch (err: any) {
      setErrorMessage(err.message?.includes('Invalid or expired') ? t.invalidToken : t.submissionFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  const TokenUIRenderer = () => {
    if (!generatedToken) return null;
    return (
      <div className="my-6 p-6 bg-stone-50 border border-stone-200 rounded-xl text-left">
        <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">
          {(t as any).saveTokenTitle}
        </p>
        <div className="flex items-center justify-between bg-white border border-stone-300 rounded-xl p-2 pl-4">
          <code className="text-xl font-bold text-primary tracking-wider">{generatedToken}</code>
          <button
            onClick={() => {
              navigator.clipboard.writeText(generatedToken);
              setIsCopied(true);
              setTimeout(() => setIsCopied(false), 2000);
            }}
            className="p-2.5 text-stone-400 hover:text-primary hover:bg-surface-cream rounded-lg transition-colors focus:outline-none"
          >
            {isCopied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
        <p className="text-xs text-stone-400 mt-3 leading-relaxed">
          {(t as any).saveTokenDesc}
        </p>
      </div>
    );
  };

  const renderScreen = () => {
    if (!formId) {
      return <div className={`min-h-screen flex items-center justify-center text-red-500 font-medium ${isTest ? 'bg-surface-test' : 'bg-surface-base'}`}>{t.missingId}</div>;
    }

    if (isLoading) {
      return (
        <div className={`min-h-screen flex items-center justify-center ${isTest ? 'bg-surface-test' : 'bg-surface-base'}`}>
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      );
    }

    if (!form || (form.status === 'draft' && !isTest)) {
      return <div className={`min-h-screen flex items-center justify-center text-stone-500 font-medium ${isTest ? 'bg-surface-test' : 'bg-surface-base'}`}>{t.notFound}</div>;
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
          <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-sm border border-stone-200">
            <div className="flex items-center justify-center w-14 h-14 bg-primary/10 text-primary rounded-full mb-6 mx-auto">
              <KeyRound className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold text-stone-800 text-center mb-2">{t.tokenGateTitle}</h1>
            <p className="text-sm text-stone-500 text-center leading-relaxed">{t.tokenGateSubtitle}</p>
            <form onSubmit={handlePreGateVerify} className="mt-8">
              <input
                type="text"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value.toUpperCase())}
                placeholder={t.tokenPlaceholder ? t.tokenPlaceholder.replace('MMC', form?.schema?.interimEventCode || 'MMC') : `${form?.schema?.interimEventCode || 'MMC'}-XXXX-XXXX`}
                className="w-full px-4 py-3.5 rounded-xl border border-stone-300 text-center font-mono text-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-stone-800 transition-shadow"
              />
              {preGateError && (
                <div className="mt-3 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center justify-center text-center font-medium">
                  <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                  {preGateError}
                </div>
              )}
              <button
                type="submit"
                disabled={isPreGateVerifying || !manualToken}
                className="w-full mt-6 py-3.5 bg-primary hover:bg-primary-hover text-white font-medium rounded-xl shadow-sm transition-colors focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-50 flex items-center justify-center"
              >
                {isPreGateVerifying && <Loader2 className="w-5 h-5 animate-spin mr-2" />}
                {isPreGateVerifying ? t.verifying : t.verify}
              </button>
            </form>
          </div>
        </div>
      );
    }

    if (isSubmitted) {
      const successTitle = locale === 'zh' 
        ? (form.schema?.successTitleZh || form.schema?.successTitleEn || t.successTitle) 
        : (form.schema?.successTitleEn || form.schema?.successTitleZh || t.successTitle);
      
      let successMessage = locale === 'zh' 
        ? (form.schema?.successMessageZh || form.schema?.successMessageEn || t.successMessage) 
        : (form.schema?.successMessageEn || form.schema?.successMessageZh || t.successMessage);
      
      if (generatedToken && !successMessage.includes('{{TOKEN_BOX}}')) {
        successMessage += '\n\n{{TOKEN_BOX}}';
      }
      
      const messageParts = successMessage.split('{{TOKEN_BOX}}');

      return (
        <div className={`min-h-screen flex items-center justify-center px-4 py-12 transition-colors ${isTest ? 'bg-surface-test' : 'bg-surface-base'}`}>
          <div className="max-w-2xl w-full bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-stone-200">
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
          </div>
        </div>
      );
    }

    const formTitle = locale === 'zh' 
      ? (form.schema?.titleZh || form.schema?.titleEn || form.title || '') 
      : (form.schema?.titleEn || form.schema?.titleZh || form.title || '');
    const formSubtitle = locale === 'zh' 
      ? (form.schema?.subtitleZh || form.schema?.subtitleEn || '') 
      : (form.schema?.subtitleEn || form.schema?.subtitleZh || '');

    return (
      <div className={`min-h-screen py-12 px-4 sm:px-6 font-sans transition-colors ${isTest ? 'bg-surface-test' : 'bg-surface-base'}`}>
        <div className="max-w-2xl mx-auto">
          {isTest && (
            <div className="mb-6 bg-amber-50 border-2 border-amber-300 text-amber-900 px-5 py-4 rounded-xl text-sm font-bold flex items-center shadow-lg">
              <AlertCircle className="w-6 h-6 mr-3 text-amber-600 flex-shrink-0" />
              {(t as any).testModeBanner || 'TEST MODE ACTIVE (Submissions will be tagged as test data)'}
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden mb-6">
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {visibleFields.map((field: any) => {
              const fieldLabel = locale === 'zh' 
                ? (field.labelZh || field.labelEn || field.title || field.dataKey || '') 
                : (field.labelEn || field.labelZh || field.title || field.dataKey || '');
              const fieldDesc = locale === 'zh' 
                ? (field.descriptionZh || field.descriptionEn || '') 
                : (field.descriptionEn || field.descriptionZh || '');

              if (field.type === 'info') {
                return (
                  <div key={field.id} className="bg-surface-cream border border-surface-dark p-6 rounded-2xl">
                    <h3 className="text-base font-semibold text-stone-800 mb-1">{fieldLabel}</h3>
                    {fieldDesc && <MarkdownRenderer content={fieldDesc} className="text-sm text-stone-600 mt-2" />}
                  </div>
                );
              }

              return (
                <div key={field.id} className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 space-y-3">
                  <label className="block text-sm font-semibold text-stone-800">
                    {fieldLabel} {field.required && <span className="text-red-500 ml-0.5">*</span>}
                  </label>
                  {fieldDesc && <MarkdownRenderer content={fieldDesc} className="text-xs text-stone-500" />}

                  {field.type === 'text' || field.type === 'email' ? (
                    <input
                      type={field.type}
                      required={field.required}
                      value={activeAnswers[field.dataKey] || ''}
                      onChange={(e) => handleInputChange(field.dataKey, e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-stone-800 bg-white transition-shadow mt-2"
                      placeholder="..."
                    />
                  ) : field.type === 'textarea' ? (
                    <textarea
                      rows={4}
                      required={field.required}
                      value={activeAnswers[field.dataKey] || ''}
                      onChange={(e) => handleInputChange(field.dataKey, e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-stone-800 bg-white transition-shadow mt-2"
                      placeholder="..."
                    />
                  ) : field.type === 'mobile' ? (
                    <div className="relative mt-2 flex items-center">
                      <Smartphone className="absolute left-3.5 w-4 h-4 text-stone-400" />
                      <span className="absolute left-10 text-stone-800 text-sm font-medium pointer-events-none">+</span>
                      <input
                        type="tel"
                        required={field.required}
                        value={activeAnswers[field.dataKey] ? formatPhoneDisplay(activeAnswers[field.dataKey]) : ''}
                        onChange={(e) => {
                          const { digits, ccLength } = parseMobileString(e.target.value);
                          if (digits.length === 0) handleInputChange(field.dataKey, '');
                          else if (digits.length > ccLength) handleInputChange(field.dataKey, `${digits.substring(0, ccLength)}-${digits.substring(ccLength)}`);
                          else handleInputChange(field.dataKey, digits);
                        }}
                        className="w-full pl-14 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-stone-800 bg-white transition-shadow"
                        placeholder="852 1234 5678"
                      />
                    </div>
                  ) : field.type === 'date' ? (
                    <div className="relative mt-2">
                      <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
                      <input
                        type="date"
                        required={field.required}
                        value={activeAnswers[field.dataKey] || ''}
                        onChange={(e) => handleInputChange(field.dataKey, e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-stone-800 bg-white transition-shadow"
                      />
                    </div>
                  ) : field.type === 'file' ? (
                    <div className="mt-2">
                      {activeAnswers[field.dataKey] ? (
                        <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                          <div className="flex items-center truncate">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-2 flex-shrink-0" />
                            <span className="text-sm font-medium text-emerald-700 truncate">
                              {activeAnswers[field.dataKey].split('/').pop() || (t as any).uploadedFile}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              handleInputChange(field.dataKey, null);
                              setUploadStates(prev => {
                                 const next = {...prev};
                                 delete next[field.dataKey];
                                 return next;
                              });
                            }}
                            className="text-xs text-red-500 hover:text-red-700 font-medium ml-4 shrink-0"
                          >
                            {(t as any).remove}
                          </button>
                        </div>
                      ) : uploadStates[field.dataKey]?.isUploading ? (
                        <div className="p-4 border border-stone-200 rounded-xl bg-stone-50">
                          <div className="flex justify-between text-xs font-medium text-stone-500 mb-2">
                            <span>{(t as any).uploading}</span>
                            <span>{uploadStates[field.dataKey]?.progress || 0}%</span>
                          </div>
                          <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${uploadStates[field.dataKey]?.progress || 0}%` }}
                            ></div>
                          </div>
                        </div>
                      ) : (
                        <div className="relative border-2 border-dashed border-stone-300 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-stone-50 hover:bg-stone-100 transition-colors group">
                          <input
                            type="file"
                            required={field.required}
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) handleFileUpload(field.dataKey, e.target.files[0]);
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            accept="image/*,.pdf,.doc,.docx"
                          />
                          <UploadCloud className="w-8 h-8 text-stone-400 mb-2 group-hover:text-primary transition-colors" />
                          <span className="text-sm font-medium text-stone-600 group-hover:text-primary transition-colors">
                            {(t as any).clickToUpload}
                          </span>
                          <span className="text-xs text-stone-400 mt-1">{(t as any).fileTypes}</span>
                          {uploadStates[field.dataKey]?.error && (
                            <p className="text-xs text-red-500 font-medium mt-3 flex items-center justify-center text-center">
                              <AlertCircle className="w-4 h-4 mr-1.5 shrink-0" /> {uploadStates[field.dataKey]?.error}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : field.type === 'applicant_token' ? (
                    <div className="mt-3 space-y-2.5">
                      {(() => {
                        const hasValue = !!activeAnswers[field.dataKey];
                        const isFieldVerified = isTest ? hasValue : inlineTokens[field.dataKey]?.verified;
                        const isError = inlineTokens[field.dataKey]?.error;

                        return (
                          <>
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
                                <input
                                  type="text"
                                  required={field.required}
                                  value={activeAnswers[field.dataKey] || ''}
                                  onChange={(e) => handleInputChange(field.dataKey, e.target.value.toUpperCase())}
                                  disabled={inlineTokens[field.dataKey]?.verified && !isTest}
                                  placeholder={t.tokenPlaceholder ? t.tokenPlaceholder.replace('MMC', form?.schema?.interimEventCode || 'MMC') : `${form?.schema?.interimEventCode || 'MMC'}-XXXX-XXXX`}
                                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm font-mono focus:outline-none transition-shadow ${
                                    isFieldVerified ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : isError ? 'border-red-300 focus:ring-2 focus:ring-red-500/50 focus:border-red-500 text-stone-800 bg-white' : 'border-stone-300 focus:ring-2 focus:ring-primary/50 focus:border-primary text-stone-800 bg-white'
                                  }`}
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleInlineVerify(field.dataKey, activeAnswers[field.dataKey])}
                                disabled={!hasValue || inlineTokens[field.dataKey]?.verifying || isFieldVerified}
                                className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-semibold rounded-xl border border-stone-200 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[100px]"
                              >
                                {inlineTokens[field.dataKey]?.verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : isFieldVerified ? <Check className="w-5 h-5 text-emerald-600" /> : t.verify}
                              </button>
                            </div>
                            {isError && !isTest && (
                              <p className="text-xs text-red-500 font-medium flex items-center"><AlertCircle className="w-3.5 h-3.5 mr-1.5" /> {isError}</p>
                            )}
                            {isFieldVerified && !isTest && (
                              <p className="text-xs text-emerald-600 font-medium flex items-center"><CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> {t.tokenVerified}</p>
                            )}
                            {isFieldVerified && isTest && (
                              <p className="text-xs text-emerald-600 font-medium flex items-center"><CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> {(t as any).testAutoVerified}</p>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  ) : field.type === 'select' ? (
                    <select
                      required={field.required}
                      value={activeAnswers[field.dataKey] || ''}
                      onChange={(e) => handleInputChange(field.dataKey, e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none bg-white text-stone-800 transition-shadow mt-2"
                    >
                      <option value="">{t.selectDefault}</option>
                      {field.options?.map((opt: any, idx: number) => {
                        const optionLabel = locale === 'zh' ? (opt.labelZh || opt.labelEn || opt.value || '') : (opt.labelEn || opt.labelZh || opt.value || '');
                        return <option key={idx} value={opt.value}>{optionLabel}</option>;
                      })}
                    </select>
                  ) : field.type === 'radio' ? (
                    <div className="space-y-2.5 mt-2">
                      {field.options?.map((opt: any, idx: number) => {
                        const optionLabel = locale === 'zh' ? (opt.labelZh || opt.labelEn || opt.value || '') : (opt.labelEn || opt.labelZh || opt.value || '');
                        return (
                          <label key={idx} className="flex items-center space-x-3 text-sm text-stone-700 cursor-pointer group">
                            <input
                              type="radio"
                              name={field.dataKey}
                              required={field.required && !activeAnswers[field.dataKey]}
                              checked={activeAnswers[field.dataKey] === opt.value}
                              onChange={() => handleInputChange(field.dataKey, opt.value)}
                              className="w-4 h-4 text-primary border-stone-300 focus:ring-primary"
                            />
                            <span className="group-hover:text-stone-900 transition-colors">{optionLabel}</span>
                          </label>
                        );
                      })}
                    </div>
                  ) : field.type === 'checkbox' ? (
                    <div className="space-y-2.5 mt-2">
                      {field.options?.map((opt: any, idx: number) => {
                        const optionLabel = locale === 'zh' ? (opt.labelZh || opt.labelEn || opt.value || '') : (opt.labelEn || opt.labelZh || opt.value || '');
                        const currentVals = activeAnswers[field.dataKey] || [];
                        const isChecked = currentVals.includes(opt.value);
                        return (
                          <label key={idx} className="flex items-center space-x-3 text-sm text-stone-700 cursor-pointer group">
                            <input
                              type="checkbox"
                              required={field.required && currentVals.length === 0}
                              checked={isChecked}
                              onChange={(e) => {
                                let updated = [...currentVals];
                                if (e.target.checked) updated.push(opt.value);
                                else updated = updated.filter((v: string) => v !== opt.value);
                                handleInputChange(field.dataKey, updated);
                              }}
                              className="w-4 h-4 text-primary border-stone-300 rounded focus:ring-primary"
                            />
                            <span className="group-hover:text-stone-900 transition-colors">{optionLabel}</span>
                          </label>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}

            {errorMessage && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl flex items-center">
                <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 mt-4 bg-primary hover:bg-primary-hover text-white font-medium text-sm rounded-xl shadow-sm transition-colors focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none disabled:opacity-50 flex items-center justify-center"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {isSubmitting ? t.submitting : (isTest ? (t.submitTest || 'Submit Form (Test Data)') : t.submit)}
            </button>
          </form>
        </div>
      </div>
    );
  };

  return (
    <>
      {isStandalone && (
        <>
          <style>{`
            header, footer, nav { display: none !important; }
          `}</style>
          <div className="fixed top-4 right-4 md:top-8 md:right-8 z-50">
            <button 
              type="button"
              onClick={() => {
                const newLocale = locale === 'en' ? 'zh' : 'en';
                const newPath = window.location.pathname.replace(`/${locale}`, `/${newLocale}`);
                const urlParams = new URLSearchParams(window.location.search);
                urlParams.set('standalone', 'true');
                window.location.href = newPath + '?' + urlParams.toString();
              }}
              className="px-4 py-2 bg-white/80 backdrop-blur border border-stone-200 shadow-sm rounded-full text-sm font-medium text-stone-700 hover:text-primary transition-colors flex items-center"
            >
              {locale === 'en' ? '中文' : 'English'}
            </button>
          </div>
        </>
      )}
      {renderScreen()}
    </>
  );
}