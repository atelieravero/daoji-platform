'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  submitPublicForm, 
  verifyApplicantToken, 
  getPresignedUploadUrl, 
  recoverApplicantToken 
} from './actions';
import { 
  Loader2, CheckCircle2, AlertCircle, Smartphone, Calendar, 
  Clock, KeyRound, Copy, Check, UploadCloud, CheckSquare, 
  RotateCcw, User, Search, X 
} from 'lucide-react';
import MarkdownRenderer from '@/components/shared/MarkdownRenderer';
import StandaloneNotifier from '@/components/public/StandaloneNotifier';

import enDict from '@/messages/en.json';
import zhDict from '@/messages/zh.json';

const parseMobileString = (raw: string) => {
  const digits = raw.replace(/\D/g, '');
  let ccLength = 0;
  if (['1', '7'].includes(digits.substring(0, 1))) ccLength = 1;
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

// Strictly extracts up to 8 numeric digits (0-9) and formats with a readability hyphen (e.g., "1234-5678")
const extractTokenDigits = (raw: string, eventCode?: string) => {
  if (!raw) return '';
  const upper = raw.trim().toUpperCase();
  const prefix = eventCode ? `${eventCode.toUpperCase()}-` : '';
  const body = prefix && upper.startsWith(prefix) ? upper.slice(prefix.length) : upper;
  return body.replace(/\D/g, '').slice(0, 8);
};

const formatTokenBodyDisplay = (raw: string, eventCode?: string) => {
  const digits = extractTokenDigits(raw, eventCode);
  if (digits.length > 4) {
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  }
  return digits;
};

const buildFullToken = (eventCode: string, rawBody: string) => {
  const digits = extractTokenDigits(rawBody, eventCode);
  if (!digits) return '';
  if (digits.length > 4) {
    return `${eventCode}-${digits.slice(0, 4)}-${digits.slice(4)}`;
  }
  return `${eventCode}-${digits}`;
};

// Reusable DRY Mobile Phone Input Control ([+][CC] [Number])
function MobilePhoneInput({
  value,
  onChange,
  required,
  placeholder = '852 1234 5678',
}: {
  value: string;
  onChange: (formattedValue: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="relative flex items-center">
      <Smartphone className="absolute left-3.5 w-4 h-4 text-stone-400" />
      <span className="absolute left-10 text-stone-800 text-sm font-medium pointer-events-none">+</span>
      <input
        type="tel"
        required={required}
        value={value ? formatPhoneDisplay(value) : ''}
        onChange={(e) => {
          const { digits, ccLength } = parseMobileString(e.target.value);
          if (digits.length === 0) onChange('');
          else if (digits.length > ccLength) onChange(`${digits.substring(0, ccLength)}-${digits.substring(ccLength)}`);
          else onChange(digits);
        }}
        placeholder={placeholder}
        className="w-full pl-14 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-stone-800 bg-white transition-shadow"
      />
    </div>
  );
}

// Reusable DRY 8-Digit Token Input Control ([EVENT_CODE - ] [1234-5678])
function TokenDigitsInput({
  eventCode,
  value,
  onChangeDigits,
  placeholder = '1234-5678',
  size = 'sm',
  isVerified = false,
  isError = false,
  required = false,
}: {
  eventCode: string;
  value: string;
  onChangeDigits: (formattedBody: string) => void;
  placeholder?: string;
  size?: 'sm' | 'lg';
  isVerified?: boolean;
  isError?: boolean;
  required?: boolean;
}) {
  const isLg = size === 'lg';
  const borderClass = isVerified
    ? 'border-emerald-500 bg-emerald-50/40 focus-within:ring-2 focus-within:ring-emerald-500/40 focus-within:border-emerald-500'
    : isError
    ? 'border-red-300 bg-white focus-within:ring-2 focus-within:ring-red-500/40 focus-within:border-red-500'
    : 'border-stone-300 bg-white focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary';

  return (
    <div
      className={`flex flex-1 items-stretch overflow-hidden border transition-shadow ${
        isLg ? 'rounded-2xl shadow-2xs' : 'rounded-xl'
      } ${borderClass}`}
    >
      <div
        className={`bg-stone-100 flex items-center text-stone-600 font-mono font-bold border-r border-stone-200 select-none shrink-0 ${
          isLg ? 'px-4 text-base tracking-wider' : 'px-3 text-xs'
        }`}
      >
        {eventCode} -
      </div>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]{4}-?[0-9]{4}"
        maxLength={9}
        required={required}
        value={formatTokenBodyDisplay(value, eventCode)}
        onChange={(e) => onChangeDigits(formatTokenBodyDisplay(e.target.value, eventCode))}
        placeholder={placeholder}
        className={`w-full font-mono outline-none bg-transparent placeholder:text-stone-300 ${
          isVerified ? 'text-emerald-900 font-semibold' : 'text-stone-800'
        } ${isLg ? 'px-4 py-3.5 text-lg tracking-widest' : 'px-3 py-2.5 text-sm tracking-wider'}`}
      />
    </div>
  );
}

interface FormEngineProps {
  initialForm: any;
  locale: string;
}

export default function FormEngine({ initialForm, locale }: FormEngineProps) {
  const searchParams = useSearchParams();
  
  // Sanitize token from URL query string
  const rawUrlToken = searchParams.get('token');
  const token = rawUrlToken ? rawUrlToken.replace(/\s+/g, '').toUpperCase() : null;
  const isTest = searchParams.get('test') === 'true';

  const [form] = useState<any>(initialForm);
  const eventCode = form?.events?.code || form?.schema?.interimEventCode || 'MMC';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);

  // Pre-gate state (stores 8-digit body, e.g. "1234-5678")
  const [manualTokenBody, setManualTokenBody] = useState('');
  const [isPreGateVerifying, setIsPreGateVerifying] = useState(false);
  const [preGateError, setPreGateError] = useState<string | null>(null);
  const [isPreGatePassed, setIsPreGatePassed] = useState(false);
  
  const [validatedToken, setValidatedToken] = useState<string | null>(null);
  const [isUrlTokenVerifying, setIsUrlTokenVerifying] = useState(false);
  const [hasCheckedUrlToken, setHasCheckedUrlToken] = useState(false);

  // Challenge Recovery Modal state (shared between Pre-Gate and Inline Token Questions)
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryName, setRecoveryName] = useState('');
  const [recoveryPhone, setRecoveryPhone] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [recoveryTargetKey, setRecoveryTargetKey] = useState<string | null>(null); // null = pre-gate, string = field.dataKey

  const [inlineTokens, setInlineTokens] = useState<Record<string, { verifying: boolean; verified: boolean; error: string | null }>>({});
  const [uploadStates, setUploadStates] = useState<Record<string, { isUploading: boolean; progress: number; error?: string }>>({});
  const [isCopied, setIsCopied] = useState(false);
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

  /**
   * Unified handler to apply a verified token to either the Pre-Gate (targetKey === null)
   * or an Inline Applicant Token Question (targetKey === field.dataKey).
   */
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

  /**
   * Unified trigger to open the Challenge Recovery Modal for either Pre-Gate or Inline Question.
   */
  const openRecoveryModal = (targetKey: string | null) => {
    setRecoveryTargetKey(targetKey);
    setRecoveryError(null);
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
        } catch (e) {}
      }
    }
  }, [formSuccessKey]);

  useEffect(() => {
    if (formStorageKey && !isSubmitted) {
      const saved = sessionStorage.getItem(formStorageKey);
      if (saved) {
        try { setAnswers(JSON.parse(saved)); } catch (e) {}
      }
    }
  }, [formStorageKey, isSubmitted]);

  // URL-provided token auto-verification
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
        .catch(() => { if (isMounted) setPreGateError(t.invalidToken); })
        .finally(() => {
          if (!isMounted) return;
          setIsUrlTokenVerifying(false);
          setHasCheckedUrlToken(true);
        });
    }
    return () => { isMounted = false; };
  }, [form, token, hasCheckedUrlToken, isTest, t.invalidToken]);

  // Pre-gate verification
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
    } catch (err) {
      setPreGateError(t.invalidToken);
    } finally {
      setIsPreGateVerifying(false);
    }
  };

  // Inline token question verification
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
        setInlineTokens((prev) => ({ ...prev, [dataKey]: { verifying: false, verified: false, error: t.invalidToken } }));
      }
    } catch (err) {
      setInlineTokens((prev) => ({ ...prev, [dataKey]: { verifying: false, verified: false, error: t.invalidToken } }));
    }
  };

  // Challenge Recovery Handler (shared by Pre-Gate and Inline Question)
  const handleExecuteRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryName.trim() || !recoveryPhone.trim()) {
      setRecoveryError((t as any).recoveryErrorMissing);
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
        applyVerifiedToken(res.token, recoveryTargetKey);
        setShowRecoveryModal(false);
        setRecoveryName('');
        setRecoveryPhone('');
      } else {
        setRecoveryError((t as any).recoveryErrorFailed);
      }
    } catch (err: any) {
      setRecoveryError((t as any).recoveryErrorFailed);
    } finally {
      setIsRecovering(false);
    }
  };

  const handleFileUpload = async (dataKey: string, file: File) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setUploadStates((prev) => ({ ...prev, [dataKey]: { isUploading: false, progress: 0, error: (t as any).fileSizeLimit } }));
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
            setUploadStates((prev) => ({ ...prev, [dataKey]: { isUploading: true, progress: Math.round((e.loaded / e.total) * 100) } }));
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

  const shouldShowField = (field: any, activeAnswers: Record<string, any>) => {
    if (!field.condition || !field.condition.rules || field.condition.rules.length === 0) return true;
    const { match, rules } = field.condition;
    
    const normalize = (val: any): any => {
      if (typeof val !== 'string') return val;
      const s = val.trim();
      const dmyMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
      if (dmyMatch) {
        const [, d, m, y] = dmyMatch;
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }
      return s;
    };

    const isStrictNumeric = (val: any): boolean => {
      if (typeof val === 'number') return !isNaN(val);
      if (typeof val !== 'string') return false;
      const trimmed = val.trim();
      if (trimmed === '') return false;
      return !isNaN(Number(trimmed));
    };

    const evaluations = rules.map((rule: any) => {
      const dependentVal = activeAnswers[rule.dependsOn];
      const isEmpty = dependentVal === undefined || dependentVal === null || dependentVal === '' || (Array.isArray(dependentVal) && dependentVal.length === 0);

      if (rule.operator === 'is_blank') return isEmpty;
      if (rule.operator === 'is_not_blank') return !isEmpty;

      if (isEmpty) return false;

      const normDependentVal = Array.isArray(dependentVal) ? dependentVal.map(normalize) : normalize(dependentVal);
      const normRuleVal = normalize(rule.value);

      switch (rule.operator) {
        case 'greater_than': {
          if (isStrictNumeric(normDependentVal) && isStrictNumeric(normRuleVal)) {
            return Number(normDependentVal) > Number(normRuleVal);
          }
          return normDependentVal > normRuleVal;
        }

        case 'less_than': {
          if (isStrictNumeric(normDependentVal) && isStrictNumeric(normRuleVal)) {
            return Number(normDependentVal) < Number(normRuleVal);
          }
          return normDependentVal < normRuleVal;
        }

        case 'within_range': {
          const [startStr, endStr] = String(normRuleVal).split('..').map((s: string) => normalize(s.trim()));
          if (!startStr || !endStr) return false;
          if (isStrictNumeric(normDependentVal) && isStrictNumeric(startStr) && isStrictNumeric(endStr)) {
            const num = Number(normDependentVal);
            return num >= Number(startStr) && num <= Number(endStr);
          }
          return normDependentVal >= startStr && normDependentVal <= endStr;
        }

        case 'not_within_range': {
          const [startStr, endStr] = String(normRuleVal).split('..').map((s: string) => normalize(s.trim()));
          if (!startStr || !endStr) return true;
          if (isStrictNumeric(normDependentVal) && isStrictNumeric(startStr) && isStrictNumeric(endStr)) {
            const num = Number(normDependentVal);
            return num < Number(startStr) || num > Number(endStr);
          }
          return normDependentVal < startStr || normDependentVal > endStr;
        }

        case 'equals': {
          if (Array.isArray(normDependentVal)) {
            return normDependentVal.length === 1 && (
              isStrictNumeric(normDependentVal[0]) && isStrictNumeric(normRuleVal)
                ? Number(normDependentVal[0]) === Number(normRuleVal)
                : normDependentVal[0] === normRuleVal
            );
          }
          if (isStrictNumeric(normDependentVal) && isStrictNumeric(normRuleVal)) {
            return Number(normDependentVal) === Number(normRuleVal);
          }
          return normDependentVal === normRuleVal;
        }

        case 'not_equals': {
          if (Array.isArray(normDependentVal)) {
            return normDependentVal.length !== 1 || (
              isStrictNumeric(normDependentVal[0]) && isStrictNumeric(normRuleVal)
                ? Number(normDependentVal[0]) !== Number(normRuleVal)
                : normDependentVal[0] !== normRuleVal
            );
          }
          if (isStrictNumeric(normDependentVal) && isStrictNumeric(normRuleVal)) {
            return Number(normDependentVal) !== Number(normRuleVal);
          }
          return normDependentVal !== normRuleVal;
        }

        case 'contains': 
          return Array.isArray(normDependentVal) 
            ? normDependentVal.includes(normRuleVal) 
            : (typeof normDependentVal === 'string' ? normDependentVal.toLowerCase().includes(String(normRuleVal).toLowerCase()) : false);

        case 'not_contains': 
          return Array.isArray(normDependentVal) 
            ? !normDependentVal.includes(normRuleVal) 
            : (typeof normDependentVal === 'string' ? !normDependentVal.toLowerCase().includes(String(normRuleVal).toLowerCase()) : false);

        case 'is_one_of': {
          const allowed = (Array.isArray(rule.value) ? rule.value : (typeof rule.value === 'string' ? rule.value.split(',') : [])).map((v: string) => normalize(v.trim()));
          return Array.isArray(normDependentVal) 
            ? normDependentVal.some((val: string) => allowed.includes(val)) 
            : allowed.includes(normDependentVal);
        }

        case 'is_not_one_of': {
          const disallowed = (Array.isArray(rule.value) ? rule.value : (typeof rule.value === 'string' ? rule.value.split(',') : [])).map((v: string) => normalize(v.trim()));
          return Array.isArray(normDependentVal) 
            ? !normDependentVal.some((val: string) => disallowed.includes(val)) 
            : !disallowed.includes(normDependentVal);
        }

        default: 
          return true;
      }
    });

    return match === 'OR' ? evaluations.some(Boolean) : evaluations.every(Boolean);
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
      if (f.required) {
        const val = activeAnswers[f.dataKey];
        if (val === undefined || val === null || val === '') {
          const fieldLabel = locale === 'zh' 
            ? (f.labelZh || f.labelEn || f.title || f.dataKey) 
            : (f.labelEn || f.labelZh || f.title || f.dataKey);
          setErrorMessage(`${t.required}: ${fieldLabel}`);
          return;
        }
      }

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

      if (f.required && f.type === 'time') {
        const val = activeAnswers[f.dataKey] || '';
        const [h, m] = val.split(':');
        if (!h || !m || h.trim() === '' || m.trim() === '') {
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
      const rawTokenVal = form.is_followup ? (validatedToken || undefined) : (token || inlineTokenVal || undefined);
      const applicantToken = rawTokenVal ? rawTokenVal.replace(/\s+/g, '').toUpperCase() : undefined;

      const response = await submitPublicForm({
        form_id: form.id,
        event_id: form.event_id,
        answers: activeAnswers, 
        is_test: isTest,
        applicant_token: applicantToken,
        interim_event_code: eventCode
      });
      
      let newToken = null;
      if (response.applicant_token && !validatedToken && !inlineTokenVal) {
        newToken = response.applicant_token;
      }

      if (formSuccessKey) {
        sessionStorage.setItem(formSuccessKey, JSON.stringify({
          submitted: true,
          token: newToken
        }));
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
    setIsCopied(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        <p className="text-xs text-stone-400 mt-3 leading-relaxed">
          {(t as any).saveTokenDesc}
        </p>
      </div>
    );
  };

  const renderScreen = () => {
    if (form.status === 'draft' && !isTest) {
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

    // PRE-GATE TOKEN SCREEN
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
          <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-stone-200">
            <div className="flex items-center justify-center w-14 h-14 bg-primary/10 text-primary rounded-full mb-6 mx-auto">
              <KeyRound className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold text-stone-800 text-center mb-2">{t.tokenGateTitle}</h1>
            <p className="text-sm text-stone-500 text-center leading-relaxed">{t.tokenGateSubtitle}</p>
            
            <form onSubmit={handlePreGateVerify} noValidate className="mt-8 space-y-4">
              <div>
                <TokenDigitsInput
                  eventCode={eventCode}
                  value={manualTokenBody}
                  onChangeDigits={(formatted) => {
                    setManualTokenBody(formatted);
                    if (preGateError) setPreGateError(null);
                  }}
                  placeholder={(t as any).tokenPlaceholder || '1234-5678'}
                  size="lg"
                  isError={Boolean(preGateError)}
                />
                <p className="text-[11px] text-stone-400 mt-1.5 px-1">
                  {(t as any).tokenPrefixHint}
                </p>
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
                  onClick={() => openRecoveryModal(null)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-primary transition-colors cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{(t as any).forgotTokenPrompt}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    }

    // SUCCESS SCREEN
    if (isSubmitted) {
      const successTitle = locale === 'zh' 
        ? (form.schema?.successTitleZh || form.schema?.successTitleEn || t.successTitle) 
        : (form.schema?.successTitleEn || form.schema?.successTitleZh || t.successTitle);
      
      const successMessage = locale === 'zh' 
        ? (form.schema?.successMessageZh || form.schema?.successMessageEn || t.successMessage) 
        : (form.schema?.successMessageEn || form.schema?.successMessageZh || t.successMessage);
      
      const messageParts = successMessage.split('{{TOKEN_BOX}}');

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
                  onClick={handleStartOver}
                  className="inline-flex items-center text-sm font-medium text-stone-400 hover:text-stone-600 transition-colors focus:outline-none cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  {(t as any).submitAnother}
                </button>
              </div>
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

    // ACTIVE FORM CANVAS
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

                  {field.type === 'number' ? (
                    <div className="relative mt-2">
                      <input
                        type="number"
                        required={field.required}
                        min={field.min}
                        max={field.max}
                        step={field.decimals !== undefined ? (field.decimals === 0 ? '1' : String(Math.pow(10, -field.decimals))) : 'any'}
                        value={activeAnswers[field.dataKey] ?? ''}
                        onChange={(e) => handleInputChange(field.dataKey, e.target.value)}
                        onBlur={(e) => {
                          if (e.target.value !== '' && field.decimals !== undefined && field.decimals > 0) {
                            const parsed = parseFloat(e.target.value);
                            if (!isNaN(parsed)) {
                              handleInputChange(field.dataKey, parsed.toFixed(field.decimals));
                            }
                          }
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-mono focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-stone-800 bg-white transition-shadow"
                        placeholder={field.decimals === 2 ? '0.00' : field.decimals === 0 ? '0' : '...'}
                      />
                    </div>
                  ) : field.type === 'text' || field.type === 'email' ? (
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
                    <div className="mt-2">
                      <MobilePhoneInput
                        required={field.required}
                        value={activeAnswers[field.dataKey] || ''}
                        onChange={(val) => handleInputChange(field.dataKey, val)}
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
                  ) : field.type === 'time' ? (
                    <div className="mt-2 flex items-center gap-2 max-w-[200px]">
                      <div className="relative flex-1">
                        <Clock className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={2}
                          placeholder="HH"
                          value={(activeAnswers[field.dataKey] || '').split(':')[0] || ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                            if (val !== '' && parseInt(val, 10) > 23) return;
                            const currentMm = (activeAnswers[field.dataKey] || '').split(':')[1] || '';
                            handleInputChange(field.dataKey, val || currentMm ? `${val}:${currentMm}` : '');
                          }}
                          onBlur={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            if (val) {
                              const padded = val.padStart(2, '0');
                              const currentMm = (activeAnswers[field.dataKey] || '').split(':')[1] || '';
                              handleInputChange(field.dataKey, `${padded}:${currentMm}`);
                            }
                          }}
                          className="w-full pl-10 pr-2 py-2.5 rounded-xl border border-stone-300 text-sm font-mono text-center focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-stone-800 bg-white transition-shadow"
                        />
                      </div>
                      <span className="text-stone-400 font-bold select-none">:</span>
                      <div className="flex-1">
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={2}
                          placeholder="MM"
                          value={(activeAnswers[field.dataKey] || '').split(':')[1] || ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                            if (val !== '' && parseInt(val, 10) > 59) return;
                            const currentHh = (activeAnswers[field.dataKey] || '').split(':')[0] || '';
                            handleInputChange(field.dataKey, currentHh || val ? `${currentHh}:${val}` : '');
                          }}
                          onBlur={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            if (val) {
                              const padded = val.padStart(2, '0');
                              const currentHh = (activeAnswers[field.dataKey] || '').split(':')[0] || '';
                              handleInputChange(field.dataKey, `${currentHh}:${padded}`);
                            }
                          }}
                          className="w-full px-2 py-2.5 rounded-xl border border-stone-300 text-sm font-mono text-center focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-stone-800 bg-white transition-shadow"
                        />
                      </div>
                    </div>
                  ) : field.type === 'file' ? (
                    <div className="mt-2">
                      {activeAnswers[field.dataKey] ? (
                        <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                          <div className="flex items-center truncate">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-2 shrink-0" />
                            <span className="text-sm font-medium text-emerald-700 truncate">
                              {activeAnswers[field.dataKey].split('/').pop() || (t as any).uploadedFile}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              handleInputChange(field.dataKey, null);
                              setUploadStates((prev) => {
                                const next = { ...prev };
                                delete next[field.dataKey];
                                return next;
                              });
                            }}
                            className="text-xs text-red-500 hover:text-red-700 font-medium ml-4 shrink-0 cursor-pointer"
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
                        const rawVal = activeAnswers[field.dataKey] || '';
                        const digitCount = extractTokenDigits(rawVal, eventCode).length;
                        const tokenState = inlineTokens[field.dataKey];
                        const isFieldVerified = Boolean(tokenState?.verified);
                        const isVerifying = Boolean(tokenState?.verifying);
                        const isError = tokenState?.error;

                        return (
                          <>
                            <div className="flex gap-2">
                              <TokenDigitsInput
                                eventCode={eventCode}
                                value={rawVal}
                                required={field.required}
                                isVerified={isFieldVerified}
                                isError={Boolean(isError)}
                                placeholder={(t as any).tokenPlaceholder || '1234-5678'}
                                onChangeDigits={(formatted) => {
                                  handleInputChange(field.dataKey, formatted ? `${eventCode}-${formatted}` : '');
                                  if (tokenState?.verified || tokenState?.error) {
                                    setInlineTokens((prev) => ({
                                      ...prev,
                                      [field.dataKey]: { verifying: false, verified: false, error: null },
                                    }));
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => handleInlineVerify(field.dataKey, rawVal)}
                                disabled={digitCount !== 8 || isVerifying || isFieldVerified}
                                className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-semibold rounded-xl border border-stone-200 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[100px] cursor-pointer"
                              >
                                {isVerifying ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : isFieldVerified ? (
                                  <Check className="w-5 h-5 text-emerald-600" />
                                ) : (
                                  t.verify
                                )}
                              </button>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                              <div>
                                {isError && (
                                  <p className="text-xs text-red-500 font-medium flex items-center">
                                    <AlertCircle className="w-3.5 h-3.5 mr-1.5" /> {isError}
                                  </p>
                                )}
                                {isFieldVerified && (
                                  <p className="text-xs text-emerald-600 font-medium flex items-center">
                                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> {t.tokenVerified}
                                  </p>
                                )}
                              </div>
                              
                              <button
                                type="button"
                                onClick={() => openRecoveryModal(field.dataKey)}
                                className="text-xs font-semibold text-stone-500 hover:text-primary transition-colors cursor-pointer inline-flex items-center gap-1"
                              >
                                <Search className="w-3 h-3" />
                                <span>{(t as any).forgotTokenShort}</span>
                              </button>
                            </div>
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
                        const isChecked = activeAnswers[field.dataKey] === opt.value;
                        
                        return (
                          <label key={idx} className="flex items-center space-x-3 text-sm text-stone-700 cursor-pointer group">
                            <input
                              type="radio"
                              name={field.dataKey}
                              required={field.required && !activeAnswers[field.dataKey]}
                              checked={isChecked}
                              onChange={() => handleInputChange(field.dataKey, opt.value)}
                              onClick={(e) => {
                                if (!field.required && isChecked) {
                                  e.currentTarget.checked = false;
                                  handleInputChange(field.dataKey, ''); 
                                }
                              }}
                              className="w-4 h-4 text-primary border-stone-300 focus:ring-primary cursor-pointer"
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
                              className="w-4 h-4 text-primary border-stone-300 rounded focus:ring-primary cursor-pointer"
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
              {isSubmitting ? t.submitting : (isTest ? (t.submitTest || 'Submit Form (Test Data)') : t.submit)}
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

      {/* SHARED CHALLENGE RETRIEVAL MODAL (PRE-GATE & INLINE TOKEN QUESTION) */}
      {showRecoveryModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5 border border-stone-100 relative">
            <button
              type="button"
              onClick={() => setShowRecoveryModal(false)}
              className="absolute top-5 right-5 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  {(t as any).recoveryModalTitle}
                </h3>
                <p className="text-xs text-stone-500">
                  {(t as any).recoveryModalSubtitle}
                </p>
              </div>
            </div>

            <form onSubmit={handleExecuteRecovery} noValidate className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  {(t as any).recoveryFullNameLabel} *
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
                    placeholder={(t as any).recoveryFullNamePlaceholder}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-stone-800 bg-white transition-shadow"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  {(t as any).recoveryPhoneLabel} *
                </label>
                <MobilePhoneInput
                  required
                  value={recoveryPhone}
                  onChange={(val) => {
                    setRecoveryPhone(val);
                    if (recoveryError) setRecoveryError(null);
                  }}
                  placeholder={(t as any).recoveryPhonePlaceholder || '852 1234 5678'}
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
                  onClick={() => setShowRecoveryModal(false)}
                  disabled={isRecovering}
                  className="px-4 py-2.5 text-xs font-semibold text-stone-500 hover:text-stone-800 rounded-xl transition-colors cursor-pointer"
                >
                  {(t as any).recoveryCancel}
                </button>
                <button
                  type="submit"
                  disabled={isRecovering || !recoveryName.trim() || !recoveryPhone.trim()}
                  className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50 flex items-center cursor-pointer"
                >
                  {isRecovering && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                  {isRecovering ? (t as any).recoverySubmitting : (t as any).recoverySubmit}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}