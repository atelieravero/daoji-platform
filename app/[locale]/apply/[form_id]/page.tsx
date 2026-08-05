'use client';

import React, { useState, use } from 'react';
import { ArrowLeft, CheckCircle2, Loader2, Calendar, MapPin, AlertCircle } from 'lucide-react';

const mockFormData = {
  id: 'f_1',
  event_id: 'evt_1',
  title: {
    en: '7-Day Silent Vipassanā Retreat - Application Form',
    zh: '七日內觀止語禪修營 - 報名表單'
  },
  event_title: {
    en: '7-Day Silent Vipassanā Retreat',
    zh: '七日內觀止語禪修營'
  },
  schedule_display: {
    en: 'October 1st - October 7th, 2026',
    zh: '2026年10月1日 - 10月7日'
  },
  location: {
    en: 'Maggapaṭipadā Main Hall, Lantau',
    zh: '道跡禪院 主禪堂 (大嶼山)'
  },
  formStatus: 'open',
  schema: [
    {
      id: 'field_1',
      dataKey: 'full_name',
      type: 'text',
      label: { en: 'Full Legal Name (as per ID)', zh: '真實姓名（與身份證相符）' },
      required: true
    },
    {
      id: 'field_2',
      dataKey: 'email_address',
      type: 'email',
      label: { en: 'Email Address', zh: '電子郵件地址' },
      required: true
    },
    {
      id: 'field_3',
      dataKey: 'dietary_requirements',
      type: 'select',
      label: { en: 'Dietary Requirements', zh: '飲食要求' },
      required: true,
      options: [
        { value: 'regular', label: { en: 'None / Regular', zh: '無 / 普通飲食' } },
        { value: 'vegetarian', label: { en: 'Vegetarian (Lacto-Ovo)', zh: '蛋奶素' } },
        { value: 'vegan', label: { en: 'Vegan', zh: '純素' } },
        { value: 'other', label: { en: 'Other (Please specify)', zh: '其他（請註明）' } }
      ]
    },
    {
      id: 'field_4',
      dataKey: 'dietary_other',
      type: 'text',
      label: { en: 'Please specify your dietary requirements', zh: '請具體說明您的飲食要求' },
      required: true,
      condition: { dependsOn: 'dietary_requirements', equals: 'other' }
    },
    {
      id: 'field_5',
      dataKey: 'has_meditation_experience',
      type: 'radio',
      label: { en: 'Have you attended a meditation retreat before?', zh: '您以前參加過禪修營嗎？' },
      required: true,
      options: [
        { value: 'yes', label: { en: 'Yes', zh: '有' } },
        { value: 'no', label: { en: 'No', zh: '沒有' } }
      ]
    },
    {
      id: 'field_6',
      dataKey: 'meditation_details',
      type: 'textarea',
      label: { en: 'Please briefly describe your previous retreat experience.', zh: '請簡述您過往的禪修經驗。' },
      required: true,
      condition: { dependsOn: 'has_meditation_experience', equals: 'yes' }
    }
  ]
};

const dictionaries = {
  en: {
    back: 'Back to Event',
    officialForm: 'Official Application Form',
    selectDefault: 'Select an option...',
    submit: 'Submit Application',
    submitting: 'Submitting...',
    successTitle: 'Application Received!',
    successMessage: 'Thank you for applying. We have successfully received your application data.',
    nextSteps: 'We will review your application and contact you via email or WhatsApp within 3-5 working days.',
    returnToEvents: 'Return to Events',
    formClosed: 'Form Closed',
    closedSub: 'Applications for this retreat have reached capacity or the deadline has passed.'
  },
  zh: {
    back: '返回活動詳情',
    officialForm: '官方報名表單',
    selectDefault: '請選擇...',
    submit: '提交報名申請',
    submitting: '提交中...',
    successTitle: '報名申請已成功提交！',
    successMessage: '感謝您報名道跡禪院。我們已成功收到您的報名資料。',
    nextSteps: '我們將在 3-5 個工作日內審核您的申請，並透過電郵或 WhatsApp 與您聯繫。',
    returnToEvents: '返回活動列表',
    formClosed: '表單已關閉',
    closedSub: '此活動的報名名額已滿或已過截止日期。'
  }
};

export default function ApplyPage({ params }: { params?: any }) {
  // Safely unwrap Next.js 15 params (Promise) and extract the locale from the URL
  const resolvedParams = params && typeof params.then === 'function' ? use(params) : params;
  const locale = (resolvedParams?.locale === 'zh' ? 'zh' : 'en') as 'en' | 'zh';
  
  const t = (key: keyof typeof dictionaries['en']) => dictionaries[locale][key];
  const formData = mockFormData;

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  const handleInputChange = (key: string, value: string) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setTimeout(() => {
      setStatus('success');
      console.log("Submitted JSON Payload:", answers);
    }, 1200);
  };

  const visibleFields = formData.schema.filter(field => {
    if (!field.condition) return true;
    const parentValue = answers[field.condition.dependsOn];
    return parentValue === field.condition.equals;
  });

  return (
    <div className="w-full bg-[#FCFAF8] min-h-screen pb-32 font-sans text-stone-800">
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <a 
          href={`/${locale}/events/${formData.event_id}`} 
          className="inline-flex items-center text-sm font-medium text-stone-500 hover:text-[#A65D24] transition-colors group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          {t('back')}
        </a>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-8 sm:p-10 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-[#FAF5F0] text-[#A65D24] mb-4">
            {t('officialForm')}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-800 tracking-tight mb-4 leading-snug">
            {formData.title[locale]}
          </h1>
          
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 text-sm text-stone-500 font-medium pt-5 border-t border-stone-100">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-[#A65D24]" />
              {formData.schedule_display[locale]}
            </div>
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-[#A65D24]" />
              {formData.location[locale]}
            </div>
          </div>
        </div>

        {formData.formStatus !== 'open' ? (
          <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-stone-400">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-stone-800 mb-2">{t('formClosed')}</h3>
            <p className="text-stone-500 max-w-md mx-auto">{t('closedSub')}</p>
          </div>
        ) : status === 'success' ? (
          <div className="bg-white rounded-3xl border border-stone-200 p-8 sm:p-12 text-center shadow-sm animate-in fade-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-100">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-800 mb-4">{t('successTitle')}</h2>
            <p className="text-stone-600 text-base sm:text-lg mb-8 max-w-xl mx-auto leading-relaxed">
              {t('successMessage')}
            </p>
            <p className="text-stone-500 text-sm max-w-md mx-auto leading-relaxed mb-8">
              {t('nextSteps')}
            </p>
            <a 
              href={`/${locale}/events`}
              className="inline-flex items-center justify-center px-8 py-3.5 bg-[#A65D24] hover:bg-[#8B4D1E] text-white font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
            >
              {t('returnToEvents')}
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-stone-200 shadow-sm p-8 sm:p-10 space-y-10 animate-in fade-in duration-500">
            
            <div className="space-y-8">
              {visibleFields.map((field) => (
                <div key={field.id} className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex justify-between items-baseline">
                    <label className="block text-sm sm:text-base font-semibold text-stone-800">
                      {field.label[locale]}
                      {field.required && <span className="text-[#A65D24] ml-1.5">*</span>}
                    </label>
                  </div>

                  {field.type === 'text' || field.type === 'email' ? (
                    <input 
                      type={field.type}
                      required={field.required}
                      value={answers[field.dataKey] || ''}
                      onChange={(e) => handleInputChange(field.dataKey, e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl border border-stone-200 focus:border-[#A65D24] focus:ring-2 focus:ring-[#A65D24]/20 outline-none transition-all text-stone-800 bg-stone-50/30"
                    />
                  ) : field.type === 'textarea' ? (
                    <textarea 
                      rows={4}
                      required={field.required}
                      value={answers[field.dataKey] || ''}
                      onChange={(e) => handleInputChange(field.dataKey, e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl border border-stone-200 focus:border-[#A65D24] focus:ring-2 focus:ring-[#A65D24]/20 outline-none transition-all text-stone-800 bg-stone-50/30 resize-y"
                    />
                  ) : field.type === 'select' ? (
                    <div className="relative">
                      <select 
                        required={field.required}
                        value={answers[field.dataKey] || ''}
                        onChange={(e) => handleInputChange(field.dataKey, e.target.value)}
                        className="w-full px-4 py-3.5 rounded-xl border border-stone-200 focus:border-[#A65D24] focus:ring-2 focus:ring-[#A65D24]/20 outline-none transition-all text-stone-800 bg-white cursor-pointer appearance-none"
                      >
                        <option value="">{t('selectDefault')}</option>
                        {field.options?.map((opt, i) => (
                          <option key={i} value={opt.value}>{opt.label[locale]}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-stone-500">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  ) : field.type === 'radio' ? (
                     <div className="space-y-3 pt-1">
                      {field.options?.map((opt, i) => (
                        <label key={i} className="flex items-center p-3 sm:p-4 border border-stone-200 rounded-xl cursor-pointer hover:bg-[#FAF5F0] hover:border-[#A65D24] transition-colors group">
                          <input 
                            type="radio" 
                            name={field.dataKey}
                            required={field.required}
                            value={opt.value}
                            checked={answers[field.dataKey] === opt.value}
                            onChange={(e) => handleInputChange(field.dataKey, e.target.value)}
                            className="w-4 h-4 text-[#A65D24] border-stone-300 focus:ring-[#A65D24]"
                          />
                          <span className="ml-3 text-sm font-medium text-stone-700 group-hover:text-[#A65D24] transition-colors">
                            {opt.label[locale]}
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="pt-8 mt-8 border-t border-stone-100">
              <button 
                type="submit"
                disabled={status === 'submitting'}
                className="w-full sm:w-auto px-8 py-4 bg-[#A65D24] hover:bg-[#8B4D1E] text-white text-lg font-semibold rounded-xl transition-all shadow-md hover:shadow-lg focus:ring-2 focus:ring-[#A65D24] focus:ring-offset-2 disabled:opacity-70 disabled:cursor-wait flex items-center justify-center mx-auto"
              >
                {status === 'submitting' ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                    {t('submitting')}
                  </>
                ) : (
                  t('submit')
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}