'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { getPublicForm, submitPublicForm } from './actions';
import { Loader2, CheckCircle2, AlertCircle, Smartphone, Calendar } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

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

  // Raw state containing all user interactions (including orphaned data from hidden fields)
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

  // Evaluates rules strictly against ACTIVE (visible) answers
  const shouldShowField = (field: any, activeAnswers: Record<string, any>) => {
    if (!field.condition || !field.condition.rules || field.condition.rules.length === 0) {
      return true;
    }

    const { match, rules } = field.condition;
    const evaluations = rules.map((rule: any) => {
      const dependentVal = activeAnswers[rule.dependsOn];
      
      switch (rule.operator) {
        case 'equals': return dependentVal === rule.value;
        case 'not_equals': return dependentVal !== rule.value;
        case 'contains':
          if (Array.isArray(dependentVal)) return dependentVal.includes(rule.value);
          if (typeof dependentVal === 'string') return dependentVal.includes(rule.value);
          return false;
        case 'not_contains':
          if (Array.isArray(dependentVal)) return !dependentVal.includes(rule.value);
          if (typeof dependentVal === 'string') return !dependentVal.includes(rule.value);
          return true;
          
        // NEW: is_one_of (Supports array or comma-separated string)
        case 'is_one_of': {
          const allowedValues = Array.isArray(rule.value) 
            ? rule.value 
            : typeof rule.value === 'string' 
              ? rule.value.split(',').map((v: string) => v.trim()) 
              : [];
          
          if (Array.isArray(dependentVal)) {
            return dependentVal.some(val => allowedValues.includes(val));
          }
          return allowedValues.includes(dependentVal);
        }
          
        // NEW: is_not_one_of
        case 'is_not_one_of': {
          const disallowedValues = Array.isArray(rule.value) 
            ? rule.value 
            : typeof rule.value === 'string' 
              ? rule.value.split(',').map((v: string) => v.trim()) 
              : [];
              
          if (Array.isArray(dependentVal)) {
            return !dependentVal.some(val => disallowedValues.includes(val));
          }
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
    setAnswers(prev => ({ ...prev, [dataKey]: value }));
  };

  // 1. Build the cascading logic tree on every render
  const activeAnswers: Record<string, any> = {};
  const visibleFields = (form?.schema?.fields || []).filter((field: any) => {
    const isVisible = shouldShowField(field, activeAnswers);
    // If field is visible, register its answer so downstream fields can evaluate against it
    if (isVisible && field.dataKey) {
      activeAnswers[field.dataKey] = answers[field.dataKey];
    }
    return isVisible;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await submitPublicForm({
        form_id: form.id,
        event_id: form.event_id,
        answers: activeAnswers, // STRICTLY submit only visible/active answers
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
    return <div className="min-h-screen flex items-center justify-center text-red-500 font-medium bg-surface-base">Missing form ID parameter in URL.</div>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-base">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!form) {
    return <div className="min-h-screen flex items-center justify-center text-stone-500 font-medium bg-surface-base">Form not found or unavailable.</div>;
  }

  if (form.schema?.status === 'closed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-base px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-stone-200 text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-stone-800">Form Closed</h1>
          <p className="text-sm text-stone-500 mt-2">This application form is currently closed and no longer accepting submissions.</p>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-base px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-stone-200 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-stone-800">Application Submitted</h1>
          <p className="text-sm text-stone-500 mt-2">Thank you! Your responses have been successfully recorded.</p>
        </div>
      </div>
    );
  }

  // 2. Strict Fallback Chains for Form Headers
  const formTitle = locale === 'zh' 
    ? (form.schema?.titleZh || form.schema?.titleEn || form.title || '') 
    : (form.schema?.titleEn || form.schema?.titleZh || form.title || '');
    
  const formSubtitle = locale === 'zh' 
    ? (form.schema?.subtitleZh || form.schema?.subtitleEn || '') 
    : (form.schema?.subtitleEn || form.schema?.subtitleZh || '');

  return (
    <div className="min-h-screen bg-surface-base py-12 px-4 sm:px-6 font-sans">
      <div className="max-w-2xl mx-auto">
        
        {isTest && (
          <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-xl text-xs font-semibold flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 text-amber-600" />
            TEST MODE ACTIVE (Submissions will be tagged as test data)
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden mb-6 p-8">
          <h1 className="text-2xl font-bold text-stone-800">{formTitle}</h1>
          {formSubtitle && <MarkdownRenderer content={formSubtitle} className="text-sm text-stone-500 mt-3" />}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {visibleFields.map((field: any) => {
            
            // 3. Strict Fallback Chains for Fields
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
                    placeholder="Your answer..."
                  />
                ) : field.type === 'textarea' ? (
                  <textarea
                    rows={4}
                    required={field.required}
                    value={activeAnswers[field.dataKey] || ''}
                    onChange={(e) => handleInputChange(field.dataKey, e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-stone-800 bg-white transition-shadow mt-2"
                    placeholder="Your answer..."
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
                ) : field.type === 'select' ? (
                  <select
                    required={field.required}
                    value={activeAnswers[field.dataKey] || ''}
                    onChange={(e) => handleInputChange(field.dataKey, e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none bg-white text-stone-800 transition-shadow mt-2"
                  >
                    <option value="">Select an option...</option>
                    {field.options?.map((opt: any, idx: number) => {
                      // 4. Strict Fallback Chain for Options
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
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-primary hover:bg-primary-hover text-white font-medium text-sm rounded-xl shadow-sm transition-colors focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none disabled:opacity-50 flex items-center justify-center"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {isSubmitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>

      </div>
    </div>
  );
}