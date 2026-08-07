'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { getPublicForm, submitPublicForm } from './actions';
import { Loader2, CheckCircle2, AlertCircle, Smartphone, Calendar, UploadCloud, Type } from 'lucide-react';

export default function PublicFormRoute() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-2 text-gray-500 text-sm font-medium">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
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

  // Store applicant answers keyed by field dataKey
  const [answers, setAnswers] = useState<Record<string, any>>({});

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

  // Evaluate conditional logic for a given field
  const shouldShowField = (field: any, allAnswers: Record<string, any>) => {
    if (!field.condition || !field.condition.rules || field.condition.rules.length === 0) {
      return true;
    }

    const { match, rules } = field.condition;
    const evaluations = rules.map((rule: any) => {
      const dependentVal = allAnswers[rule.dependsOn];
      
      switch (rule.operator) {
        case 'equals':
          return dependentVal === rule.value;
        case 'not_equals':
          return dependentVal !== rule.value;
        case 'contains':
          if (Array.isArray(dependentVal)) return dependentVal.includes(rule.value);
          if (typeof dependentVal === 'string') return dependentVal.includes(rule.value);
          return false;
        case 'not_contains':
          if (Array.isArray(dependentVal)) return !dependentVal.includes(rule.value);
          if (typeof dependentVal === 'string') return !dependentVal.includes(rule.value);
          return true;
        case 'is_blank':
          return !dependentVal || dependentVal.length === 0;
        case 'is_not_blank':
          return !!dependentVal && dependentVal.length > 0;
        default:
          return true;
      }
    });

    if (match === 'OR') {
      return evaluations.some(Boolean);
    }
    return evaluations.every(Boolean);
  };

  const handleInputChange = (dataKey: string, value: any) => {
    setAnswers(prev => ({ ...prev, [dataKey]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await submitPublicForm({
        form_id: form.id,
        event_id: form.event_id,
        answers,
        is_test: isTest,
        applicant_token: token || undefined,
      });
      setIsSubmitted(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!formId) {
    return <div className="min-h-screen flex items-center justify-center text-red-500 font-medium">Missing form ID parameter in URL.</div>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!form) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500 font-medium">Form not found or unavailable.</div>;
  }

  if (form.schema?.status === 'closed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900">Form Closed</h1>
          <p className="text-sm text-gray-500 mt-2">This application form is currently closed and no longer accepting submissions.</p>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900">Application Submitted</h1>
          <p className="text-sm text-gray-500 mt-2">Thank you! Your responses have been successfully recorded.</p>
        </div>
      </div>
    );
  }

  const fields = form.schema?.fields || [];
  const title = locale === 'zh' ? (form.schema?.titleZh || form.schema?.titleEn) : form.schema?.titleEn;
  const subtitle = locale === 'zh' ? (form.schema?.subtitleZh || form.schema?.subtitleEn) : form.schema?.subtitleEn;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        
        {isTest && (
          <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-lg text-xs font-semibold flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 text-amber-600" />
            TEST MODE ACTIVE (Submissions will be tagged as test data)
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6 p-8">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-sm text-gray-600 mt-2 leading-relaxed">{subtitle}</p>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {fields.map((field: any) => {
            if (!shouldShowField(field, answers)) return null;

            const fieldLabel = locale === 'zh' ? (field.labelZh || field.labelEn) : field.labelEn;
            const fieldDesc = locale === 'zh' ? (field.descriptionZh || field.descriptionEn) : field.descriptionEn;

            if (field.type === 'info') {
              return (
                <div key={field.id} className="bg-indigo-50/50 border border-indigo-100 p-6 rounded-2xl">
                  <h3 className="text-base font-semibold text-indigo-900 mb-1">{fieldLabel}</h3>
                  {fieldDesc && <p className="text-sm text-indigo-700/80 leading-relaxed">{fieldDesc}</p>}
                </div>
              );
            }

            return (
              <div key={field.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-3">
                <label className="block text-sm font-semibold text-gray-900">
                  {fieldLabel} {field.required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                {fieldDesc && <p className="text-xs text-gray-500 leading-normal">{fieldDesc}</p>}

                {field.type === 'text' || field.type === 'email' ? (
                  <input
                    type={field.type}
                    required={field.required}
                    value={answers[field.dataKey] || ''}
                    onChange={(e) => handleInputChange(field.dataKey, e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                    placeholder="Your answer..."
                  />
                ) : field.type === 'textarea' ? (
                  <textarea
                    rows={4}
                    required={field.required}
                    value={answers[field.dataKey] || ''}
                    onChange={(e) => handleInputChange(field.dataKey, e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                    placeholder="Your answer..."
                  />
                ) : field.type === 'mobile' ? (
                  <div className="relative">
                    <Smartphone className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      required={field.required}
                      value={answers[field.dataKey] || ''}
                      onChange={(e) => handleInputChange(field.dataKey, e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                      placeholder="+852 1234 5678"
                    />
                  </div>
                ) : field.type === 'date' ? (
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      required={field.required}
                      value={answers[field.dataKey] || ''}
                      onChange={(e) => handleInputChange(field.dataKey, e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                    />
                  </div>
                ) : field.type === 'select' ? (
                  <select
                    required={field.required}
                    value={answers[field.dataKey] || ''}
                    onChange={(e) => handleInputChange(field.dataKey, e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-gray-900"
                  >
                    <option value="">Select an option...</option>
                    {field.options?.map((opt: any, idx: number) => (
                      <option key={idx} value={opt.value}>
                        {locale === 'zh' ? (opt.labelZh || opt.labelEn) : opt.labelEn}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'radio' ? (
                  <div className="space-y-2">
                    {field.options?.map((opt: any, idx: number) => (
                      <label key={idx} className="flex items-center space-x-3 text-sm text-gray-700 cursor-pointer">
                        <input
                          type="radio"
                          name={field.dataKey}
                          required={field.required && !answers[field.dataKey]}
                          checked={answers[field.dataKey] === opt.value}
                          onChange={() => handleInputChange(field.dataKey, opt.value)}
                          className="w-4 h-4 text-indigo-600 border-gray-300"
                        />
                        <span>{locale === 'zh' ? (opt.labelZh || opt.labelEn) : opt.labelEn}</span>
                      </label>
                    ))}
                  </div>
                ) : field.type === 'checkbox' ? (
                  <div className="space-y-2">
                    {field.options?.map((opt: any, idx: number) => {
                      const currentVals = answers[field.dataKey] || [];
                      const isChecked = currentVals.includes(opt.value);
                      return (
                        <label key={idx} className="flex items-center space-x-3 text-sm text-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              let updated = [...currentVals];
                              if (e.target.checked) updated.push(opt.value);
                              else updated = updated.filter((v: string) => v !== opt.value);
                              handleInputChange(field.dataKey, updated);
                            }}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded"
                          />
                          <span>{locale === 'zh' ? (opt.labelZh || opt.labelEn) : opt.labelEn}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}

          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl shadow-sm transition-colors focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50 flex items-center justify-center"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {isSubmitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>

      </div>
    </div>
  );
}