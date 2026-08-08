'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { getPublicForm, submitPublicForm, verifyApplicantToken, getPresignedUploadUrl } from './actions';
import { Loader2, CheckCircle2, AlertCircle, Smartphone, Calendar, KeyRound, Copy, Check, UploadCloud } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

import enDict from '@/messages/en.json';
import zhDict from '@/messages/zh.json';

// --- Reusable Markdown Renderer ---
const MarkdownRenderer = ({ content, className }: { content: string, className?: string }) => (
  <div className={className}>
    <ReactMarkdown
      components={{
        p: ({ node, ...props }) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
        a: ({ node, ...props }) => (
          <a className="text-primary hover:text-primary-hover hover:underline font-medium transition-colors" target="_blank" rel="noopener noreferrer" {...props} />
        ),
        ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-2 space-y-1" {...props} />,
        ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-2 space-y-1" {...props} />,
        strong: ({ node, ...props }) => <strong className="font-semibold text-stone-800" {...props} />,
      }}
    >
      {content}
    </ReactMarkdown>
  </div>
);

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
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pre-Gate State
  const [manualToken, setManualToken] = useState('');
  const [isPreGateVerifying, setIsPreGateVerifying] = useState(false);
  const [preGateError, setPreGateError] = useState<string | null>(null);
  const [isPreGatePassed, setIsPreGatePassed] = useState(false);
  
  // URL Token Verification State
  const [validatedToken, setValidatedToken] = useState<string | null>(null);
  const [isUrlTokenVerifying, setIsUrlTokenVerifying] = useState(false);
  const [hasCheckedUrlToken, setHasCheckedUrlToken] = useState(false);

  // Inline Token Verification State
  const [inlineTokens, setInlineTokens] = useState<Record<string, { verifying: boolean, verified: boolean, error: string | null }>>({});

  // File Upload State
  const [uploadStates, setUploadStates] = useState<Record<string, { isUploading: boolean, progress: number, error?: string }>>({});

  // Success Screen State
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Raw state containing all user interactions
  const [answers, setAnswers] = useState<Record<string, any>>({});

  const t = locale === 'zh' ? zhDict.ApplyForm : enDict.ApplyForm;

  const formStorageKey = formId ? `daoji_form_draft_${formId}` : null;

  useEffect(() => {
    if (formStorageKey) {
      const saved = sessionStorage.getItem(formStorageKey);
      if (saved) {
        try {
          setAnswers(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse saved form draft.");
        }
      }
    }
  }, [formStorageKey]);

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

  // Security Gate: Verify URL token on load if it's a follow-up form
  useEffect(() => {
    let isMounted = true;
    if (form?.is_followup && token && !hasCheckedUrlToken) {
      setIsUrlTokenVerifying(true);
      // Pass the isTest flag to bypass db checks for previewers
      verifyApplicantToken(token, form.event_id, isTest)
        .then(res => {
          if (!isMounted) return;
          if (res.valid) {
            setValidatedToken(token); // Lock in the valid token
            setIsPreGatePassed(true);
          } else {
            setPreGateError(t.invalidToken); // Throw them to the manual screen
          }
        })
        .catch(() => {
          if (!isMounted) return;
          setPreGateError(t.invalidToken);
        })
        .finally(() => {
          if (!isMounted) return;
          setIsUrlTokenVerifying(false);
          setHasCheckedUrlToken(true);
        });
    }
    return () => { isMounted = false; };
  }, [form, token, hasCheckedUrlToken, isTest, t.invalidToken]);

  // Handle Follow-up Form Pre-Gate Verification (Manual Entry)
  const handlePreGateVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken) return;
    
    setIsPreGateVerifying(true);
    setPreGateError(null);
    
    try {
      // Pass the isTest flag to bypass db checks for previewers
      const res = await verifyApplicantToken(manualToken, form.event_id, isTest);
      if (res.valid) {
        setValidatedToken(manualToken); // Lock in the valid token
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

  // Handle Inline Field Verification (Still fires if they manually click it)
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

  // --- NEW: Handle S3/OSS File Upload via pre-signed URL ---
  const handleFileUpload = async (dataKey: string, file: File) => {
    if (!file) return;

    // Validate size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setUploadStates(prev => ({ ...prev, [dataKey]: { isUploading: false, progress: 0, error: locale === 'zh' ? '文件大小不可超過10MB。' : 'File size cannot exceed 10MB.' } }));
      return;
    }

    setUploadStates(prev => ({ ...prev, [dataKey]: { isUploading: true, progress: 0, error: undefined } }));

    try {
      // 1. Get pre-signed URL from server
      const res = await getPresignedUploadUrl(file.name, file.type);
      if (!res.success || !res.signedUrl || !res.fileKey) {
        throw new Error(res.error || 'Failed to initialize upload.');
      }

      // 2. Upload file directly to S3 via XMLHttpRequest to track progress
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', res.signedUrl!, true);
        xhr.setRequestHeader('Content-Type', file.type);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            setUploadStates(prev => ({ ...prev, [dataKey]: { isUploading: true, progress: percentComplete } }));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(true);
          } else {
            reject(new Error('Network error during upload.'));
          }
        };

        xhr.onerror = () => reject(new Error('Network error during upload.'));
        xhr.send(file);
      });

      // 3. Save the public URL to answers
      handleInputChange(dataKey, res.fileKey);
      setUploadStates(prev => ({ ...prev, [dataKey]: { isUploading: false, progress: 100 } }));

    } catch (err: any) {
      setUploadStates(prev => ({ ...prev, [dataKey]: { isUploading: false, progress: 0, error: err.message } }));
    }
  };

  const shouldShowField = (field: any, activeAnswers: Record<string, any>) => {
    if (!field.condition || !field.condition.rules || field.condition.rules.length === 0) {
      return true;
    }

    const { match, rules } = field.condition;
    const evaluations = rules.map((rule: any) => {
      const dependentVal = activeAnswers[rule.dependsOn];
      
      switch (rule.operator) {
        case 'equals': 
          if (Array.isArray(dependentVal)) return dependentVal.length === 1 && dependentVal[0] === rule.value;
          return dependentVal === rule.value;
        case 'not_equals': 
          if (Array.isArray(dependentVal)) return dependentVal.length !== 1 || dependentVal[0] !== rule.value;
          return dependentVal !== rule.value;
        case 'contains':
          if (Array.isArray(dependentVal)) return dependentVal.includes(rule.value);
          if (typeof dependentVal === 'string') return dependentVal.includes(rule.value);
          return false;
        case 'not_contains':
          if (Array.isArray(dependentVal)) return !dependentVal.includes(rule.value);
          if (typeof dependentVal === 'string') return !dependentVal.includes(rule.value);
          return true;
        case 'is_one_of': {
          const allowedValues = Array.isArray(rule.value) ? rule.value : typeof rule.value === 'string' ? rule.value.split(',').map((v: string) => v.trim()) : [];
          if (Array.isArray(dependentVal)) return dependentVal.some((val: string) => allowedValues.includes(val));
          return allowedValues.includes(dependentVal);
        }
        case 'is_not_one_of': {
          const disallowedValues = Array.isArray(rule.value) ? rule.value : typeof rule.value === 'string' ? rule.value.split(',').map((v: string) => v.trim()) : [];
          if (Array.isArray(dependentVal)) return !dependentVal.some((val: string) => disallowedValues.includes(val));
          return !disallowedValues.includes(dependentVal);
        }
        case 'is_blank': return !dependentVal || dependentVal.length === 0;
        case 'is_not_blank': return !!dependentVal && dependentVal.length > 0;
        default: return true;
      }
    });

    if (match === 'OR') return evaluations.some(Boolean);
    return evaluations.every(Boolean);
  };

  const handleInputChange = (dataKey: string, value: any) => {
    setAnswers(prev => {
      const updatedAnswers = { ...prev, [dataKey]: value };
      if (formStorageKey) {
        sessionStorage.setItem(formStorageKey, JSON.stringify(updatedAnswers));
      }
      return updatedAnswers;
    });
  };

  const activeAnswers: Record<string, any> = {};
  const visibleFields = (form?.schema?.fields || []).filter((field: any) => {
    const isVisible = shouldShowField(field, activeAnswers);
    if (isVisible && field.dataKey) {
      activeAnswers[field.dataKey] = answers[field.dataKey];
    }
    return isVisible;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    // --- NEW: Prevent submission if any files are currently uploading ---
    const isAnyFileUploading = Object.values(uploadStates).some(s => s.isUploading);
    if (isAnyFileUploading) {
      setErrorMessage(locale === 'zh' ? '請等待所有文件上傳完成。' : 'Please wait for all file uploads to finish.');
      return;
    }

    const tokenFields = visibleFields.filter((f: any) => f.type === 'applicant_token');
    for (const f of tokenFields) {
      const isFilled = !!activeAnswers[f.dataKey];
      
      // FIX: Bypass the strict click-to-verify requirement if test mode is active
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
        // Only submit the token if it has been strictly validated
        applicant_token: form.is_followup ? (validatedToken || undefined) : (token || inlineTokenVal || undefined),
      });
      
      setIsSubmitted(true);
      
      if (response.applicant_token && !validatedToken && !inlineTokenVal) {
        setGeneratedToken(response.applicant_token);
      }
      
      if (formStorageKey) {
        sessionStorage.removeItem(formStorageKey);
      }
      
    } catch (err: any) {
      const backendError = err.message || '';
      if (backendError.includes('Invalid or expired')) {
        setErrorMessage(t.invalidToken);
      } else {
        setErrorMessage(t.submissionFailed);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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

  if (!form) {
    return <div className={`min-h-screen flex items-center justify-center text-stone-500 font-medium ${isTest ? 'bg-surface-test' : 'bg-surface-base'}`}>{t.notFound}</div>;
  }

  // 1. BLOCK DRAFTS: If form is draft AND this is NOT a test URL, act like it doesn't exist.
  if (form.status === 'draft' && !isTest) {
    return <div className={`min-h-screen flex items-center justify-center text-stone-500 font-medium ${isTest ? 'bg-surface-test' : 'bg-surface-base'}`}>{t.notFound}</div>;
  }

  // 2. FORM CLOSED CHECK: Use root-level status
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

  // --- PRE-GATE SCREEN ---
  if (form.is_followup && !isPreGatePassed) {
    
    // Show a loading screen while the URL token is silently verified
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
              placeholder={t.tokenPlaceholder}
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

  // --- SUCCESS SCREEN ---
  if (isSubmitted) {
    return (
      <div className={`min-h-screen flex items-center justify-center px-4 transition-colors ${isTest ? 'bg-surface-test' : 'bg-surface-base'}`}>
        <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-sm border border-stone-200 text-center">
          <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-5" />
          <h1 className="text-2xl font-bold text-stone-800 mb-2">{t.successTitle}</h1>
          <p className="text-sm text-stone-500">{t.successMessage}</p>

          {generatedToken && (
            <div className="mt-8 p-6 bg-stone-50 border border-stone-200 rounded-xl text-left">
              <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">
                {locale === 'zh' ? '請妥善保存您的核驗碼' : 'Save your Access Token'}
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
                {locale === 'zh' ? '此代碼將用於進入後續表單。請務必複製或截圖保存。' : 'You will need this code to access follow-up forms. Please copy or screenshot it now.'}
              </p>
            </div>
          )}
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
            {t.testModeBanner || 'TEST MODE ACTIVE (Submissions will be tagged as test data)'}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden mb-6 p-8">
          <h1 className="text-2xl font-bold text-stone-800">{formTitle}</h1>
          {formSubtitle && <MarkdownRenderer content={formSubtitle} className="text-sm text-stone-500 mt-3" />}
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
                  <div className="relative mt-2">
                    <Smartphone className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
                    <input
                      type="tel"
                      required={field.required}
                      value={activeAnswers[field.dataKey] || ''}
                      onChange={(e) => handleInputChange(field.dataKey, e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-stone-800 bg-white transition-shadow"
                      placeholder="+852 1234 5678"
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
                            {activeAnswers[field.dataKey].split('/').pop() || 'Uploaded File'}
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
                          {locale === 'zh' ? '移除' : 'Remove'}
                        </button>
                      </div>
                    ) : uploadStates[field.dataKey]?.isUploading ? (
                      <div className="p-4 border border-stone-200 rounded-xl bg-stone-50">
                        <div className="flex justify-between text-xs font-medium text-stone-500 mb-2">
                          <span>{locale === 'zh' ? '上傳中...' : 'Uploading...'}</span>
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
                            if (e.target.files && e.target.files[0]) {
                              handleFileUpload(field.dataKey, e.target.files[0]);
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          accept="image/*,.pdf,.doc,.docx"
                        />
                        <UploadCloud className="w-8 h-8 text-stone-400 mb-2 group-hover:text-primary transition-colors" />
                        <span className="text-sm font-medium text-stone-600 group-hover:text-primary transition-colors">
                          {locale === 'zh' ? '點擊或拖曳文件上傳' : 'Click or drag file to upload'}
                        </span>
                        <span className="text-xs text-stone-400 mt-1">PDF, JPG, PNG (Max 10MB)</span>
                        {uploadStates[field.dataKey]?.error && (
                          <p className="text-xs text-red-500 font-medium mt-3 flex items-center justify-center">
                            <AlertCircle className="w-4 h-4 mr-1.5" /> {uploadStates[field.dataKey]?.error}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : field.type === 'applicant_token' ? (
                  <div className="mt-3 space-y-2.5">
                    {(() => {
                      const hasValue = !!activeAnswers[field.dataKey];
                      // FIX: Instantly mark as verified if in test mode and has any text typed
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
                                placeholder={t.tokenPlaceholder}
                                className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm font-mono focus:outline-none transition-shadow ${
                                  isFieldVerified
                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                                    : isError
                                    ? 'border-red-300 focus:ring-2 focus:ring-red-500/50 focus:border-red-500 text-stone-800 bg-white'
                                    : 'border-stone-300 focus:ring-2 focus:ring-primary/50 focus:border-primary text-stone-800 bg-white'
                                }`}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleInlineVerify(field.dataKey, activeAnswers[field.dataKey])}
                              disabled={!hasValue || inlineTokens[field.dataKey]?.verifying || isFieldVerified}
                              className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-semibold rounded-xl border border-stone-200 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[100px]"
                            >
                              {inlineTokens[field.dataKey]?.verifying ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : isFieldVerified ? (
                                <Check className="w-5 h-5 text-emerald-600" />
                              ) : (
                                t.verify
                              )}
                            </button>
                          </div>
                          {isError && !isTest && (
                            <p className="text-xs text-red-500 font-medium flex items-center"><AlertCircle className="w-3.5 h-3.5 mr-1.5" /> {isError}</p>
                          )}
                          {isFieldVerified && !isTest && (
                            <p className="text-xs text-emerald-600 font-medium flex items-center"><CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> {t.tokenVerified}</p>
                          )}
                          {isFieldVerified && isTest && (
                            <p className="text-xs text-emerald-600 font-medium flex items-center"><CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Test Mode Auto-Verified</p>
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
                      const optionLabel = locale === 'zh' 
                        ? (opt.labelZh || opt.labelEn || opt.value || '') 
                        : (opt.labelEn || opt.labelZh || opt.value || '');
                      
                      return (
                        <option key={idx} value={opt.value}>
                          {optionLabel}
                        </option>
                      );
                    })}
                  </select>
                ) : field.type === 'radio' ? (
                  <div className="space-y-2.5 mt-2">
                    {field.options?.map((opt: any, idx: number) => {
                      const optionLabel = locale === 'zh' 
                        ? (opt.labelZh || opt.labelEn || opt.value || '') 
                        : (opt.labelEn || opt.labelZh || opt.value || '');

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
                      const optionLabel = locale === 'zh' 
                        ? (opt.labelZh || opt.labelEn || opt.value || '') 
                        : (opt.labelEn || opt.labelZh || opt.value || '');

                      const currentVals = activeAnswers[field.dataKey] || [];
                      const isChecked = currentVals.includes(opt.value);
                      
                      return (
                        <label key={idx} className="flex items-center space-x-3 text-sm text-stone-700 cursor-pointer group">
                          <input
                            type="checkbox"
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
}