'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { saveFormSchema, getFormSchema, getPublicPresignedUploadUrl } from './actions';
import { 
  ArrowLeft, Save, GripVertical, Settings2, Type, ListOrdered, 
  PlusCircle, Trash2, LayoutTemplate, X, GitBranch, Eye,
  FileText, Calendar, Clock, Smartphone, CheckSquare, UploadCloud,
  ChevronUp, ChevronDown, AlignLeft, AlertCircle, Loader2, KeyRound, ImageIcon, Image as ImageIconOutline
} from 'lucide-react';
import MarkdownRenderer from '@/components/shared/MarkdownRenderer';
import MarkdownEditor from '@/components/shared/MarkdownEditor';
import { FormInput, FormSelect } from '@/components/ui/FormControls';

type FieldType = 'text' | 'email' | 'mobile' | 'date' | 'time' | 'select' | 'radio' | 'checkbox' | 'textarea' | 'file' | 'info' | 'applicant_token';
type FieldOption = { value: string; labelEn: string; labelZh: string };
type LogicOperator = 
  | 'is_blank' 
  | 'is_not_blank' 
  | 'equals' 
  | 'not_equals' 
  | 'contains' 
  | 'not_contains' 
  | 'is_one_of' 
  | 'is_not_one_of' 
  | 'within_range' 
  | 'not_within_range';

interface LogicRule { id: string; dependsOn: string; operator: LogicOperator; value: string; }
interface FormField {
  id: string; dataKey: string; type: FieldType; labelEn: string; labelZh: string;
  descriptionEn?: string; descriptionZh?: string; required: boolean;
  options?: FieldOption[]; condition?: { match: 'AND' | 'OR'; rules: LogicRule[]; };
}

const initialFields: FormField[] = [];

export default function FormBuilderPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center h-full bg-gray-50">
        <div className="flex items-center space-x-2 text-gray-500 text-sm font-medium">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
          <span>Loading form builder...</span>
        </div>
      </div>
    }>
      <FormBuilderContent />
    </Suspense>
  );
}

function FormBuilderContent() {
  const searchParams = useSearchParams();
  const formIdParam = searchParams.get('id');

  const [currentFormId, setCurrentFormId] = useState<string | null>(formIdParam && formIdParam !== 'new' ? formIdParam : null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [invalidFieldIds, setInvalidFieldIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'form' | 'success'>('form');
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  
  const [formConfig, setFormConfig] = useState({
    internalName: 'Untitled Form',
    slug: '',
    titleEn: 'New Form', titleZh: '新表單',
    subtitleEn: '', subtitleZh: '',
    eventId: 'evt_1', isFollowUp: false, status: 'draft',
    interimEventCode: 'OCT26', isStandalone: false,
    bannerImageUrl: '',
    successTitleEn: 'Submission Successful', successTitleZh: '提交成功',
    successMessageEn: 'Thank you. Your submission has been securely received.\n\n{{TOKEN_BOX}}',
    successMessageZh: '感謝您。我們已安全收到您的提交。\n\n{{TOKEN_BOX}}',
  });
  
  const [fields, setFields] = useState<FormField[]>(initialFields);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);

  useEffect(() => {
    if (!formIdParam || formIdParam === 'new') return;
    let isMounted = true;
    setIsLoading(true);

    getFormSchema(formIdParam).then((record) => {
      if (!isMounted || !record) return;
      setCurrentFormId(record.id);
      setFormConfig({
        internalName: record.title || '', 
        slug: record.slug || '',
        eventId: record.event_id || 'evt_1', 
        isFollowUp: record.is_followup || false,
        titleEn: record.schema?.titleEn ?? '', 
        titleZh: record.schema?.titleZh ?? '',
        subtitleEn: record.schema?.subtitleEn ?? '', 
        subtitleZh: record.schema?.subtitleZh ?? '',
        status: record.schema?.status ?? 'draft', 
        interimEventCode: record.schema?.interimEventCode ?? 'OCT26',
        isStandalone: record.schema?.isStandalone ?? false, 
        bannerImageUrl: record.schema?.bannerImageUrl ?? '',
        successTitleEn: record.schema?.successTitleEn ?? 'Submission Successful', 
        successTitleZh: record.schema?.successTitleZh ?? '提交成功',
        successMessageEn: record.schema?.successMessageEn ?? 'Thank you. Your submission has been securely received.\n\n{{TOKEN_BOX}}',
        successMessageZh: record.schema?.successMessageZh ?? '感謝您。我們已安全收到您的提交。\n\n{{TOKEN_BOX}}',
      });
      if (record.schema?.fields && Array.isArray(record.schema.fields)) setFields(record.schema.fields);
    }).finally(() => { if (isMounted) setIsLoading(false); });
    return () => { isMounted = false; };
  }, [formIdParam]);

  const activeField = fields.find(f => f.id === activeFieldId);
  const activeFieldIndex = fields.findIndex(f => f.id === activeFieldId);
  const previousFields = fields
    .slice(0, activeFieldIndex > -1 ? activeFieldIndex : 0)
    .filter(f => f.type !== 'info');

  const updateActiveField = (updates: Partial<FormField>) => setFields(fields.map(f => f.id === activeFieldId ? { ...f, ...updates } : f));

  const moveField = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === fields.length - 1) return;
    const newFields = [...fields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = newFields[index];
    newFields[index] = newFields[targetIndex];
    newFields[targetIndex] = temp;
    setFields(newFields);
  };

  const moveOption = (index: number, direction: 'up' | 'down') => {
    if (!activeField || !activeField.options) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === activeField.options.length - 1) return;
    const newOpts = [...activeField.options];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = newOpts[index];
    newOpts[index] = newOpts[targetIndex];
    newOpts[targetIndex] = temp;
    updateActiveField({ options: newOpts });
  };

  const handleAddQuestion = () => {
    const newId = `field_${Date.now()}`;
    setFields([...fields, { id: newId, dataKey: `question_${fields.length + 1}`, type: 'text', labelEn: 'New Question', labelZh: '新問題', required: false }]);
    setActiveFieldId(newId);
  };

  const handleAddOption = () => { if (activeField) updateActiveField({ options: [...(activeField.options || []), { value: `opt_${(activeField.options?.length || 0) + 1}`, labelEn: `Option`, labelZh: `選項` }] }); };
  const handleUpdateOption = (index: number, key: keyof FieldOption, value: string) => { if (activeField?.options) { const newOpts = [...activeField.options]; newOpts[index] = { ...newOpts[index], [key]: value }; updateActiveField({ options: newOpts }); } };
  const handleRemoveOption = (index: number) => { if (activeField?.options) updateActiveField({ options: activeField.options.filter((_, i) => i !== index) }); };
  const handleAddRule = () => { 
    if (activeField) {
      updateActiveField({ 
        condition: { 
          match: activeField.condition?.match || 'AND', 
          rules: [...(activeField.condition?.rules || []), { id: `rule_${Date.now()}`, dependsOn: '', operator: 'equals', value: '' }] 
        } 
      }); 
    }
  };
  const handleUpdateRule = (ruleId: string, updates: Partial<LogicRule>) => { if (activeField?.condition) updateActiveField({ condition: { ...activeField.condition, rules: activeField.condition.rules.map(r => r.id === ruleId ? { ...r, ...updates } : r) } }); };
  const handleRemoveRule = (ruleId: string) => { if (activeField?.condition) { const rem = activeField.condition.rules.filter(r => r.id !== ruleId); updateActiveField({ condition: rem.length ? { ...activeField.condition, rules: rem } : undefined }); } };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingBanner(true);
    try {
      const res = await getPublicPresignedUploadUrl(file.name, file.type);
      if (!res.success || !res.signedUrl || !res.finalUrl) throw new Error(res.error || 'Server failed to generate signed URL');
      const uploadRes = await fetch(res.signedUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      if (!uploadRes.ok) throw new Error(`Bucket rejected upload: ${await uploadRes.text()}`);
      setFormConfig({ ...formConfig, bannerImageUrl: res.finalUrl });
    } catch (err: any) { alert(`Banner upload failed: ${err.message}`); } finally { setIsUploadingBanner(false); }
  };

  const handleSave = async () => {
    if (!formConfig.slug || formConfig.slug.trim() === '') {
      alert('Validation Error: URL Slug is required.');
      return;
    }
    
    const cleanSlug = formConfig.slug.replace(/^-|-$/g, '');

    const invalidIds: string[] = [];
    for (const f of fields) {
      if (f.type !== 'info' && (!f.dataKey || f.dataKey.trim() === '')) invalidIds.push(f.id);
      if (f.options) for (const opt of f.options) if (!opt.value || opt.value.trim() === '') if (!invalidIds.includes(f.id)) invalidIds.push(f.id);
    }
    if (invalidIds.length > 0) { setInvalidFieldIds(invalidIds); alert('Validation Error: Missing Data Keys or Option Values.'); return; }
    
    setInvalidFieldIds([]); setIsSaving(true);
    try {
      const payload = {
        event_id: formConfig.eventId, 
        slug: cleanSlug,
        title: formConfig.internalName, 
        is_followup: formConfig.isFollowUp,
        schema: {
          titleEn: formConfig.titleEn, titleZh: formConfig.titleZh, subtitleEn: formConfig.subtitleEn, subtitleZh: formConfig.subtitleZh,
          status: formConfig.status, interimEventCode: formConfig.interimEventCode.toUpperCase().replace(/[^A-Z0-9]/g, ''), isStandalone: formConfig.isStandalone,
          bannerImageUrl: formConfig.bannerImageUrl, successTitleEn: formConfig.successTitleEn, successTitleZh: formConfig.successTitleZh,
          successMessageEn: formConfig.successMessageEn, successMessageZh: formConfig.successMessageZh, fields: fields
        }
      };
      const savedId = await saveFormSchema(payload, currentFormId);
      if (savedId && !currentFormId) { setCurrentFormId(savedId); window.history.replaceState(null, '', `?id=${savedId}`); }
      alert('Form Schema saved successfully!');
    } catch (error: any) { 
      if (error.message.includes('duplicate key value violates unique constraint')) {
        alert('Validation Error: This URL Slug is already taken by another form. Please choose a unique slug.');
      } else {
        alert('Failed to save Form Schema.'); 
      }
    } finally { setIsSaving(false); }
  };

  const hasOptions = activeField?.type === 'select' || activeField?.type === 'radio' || activeField?.type === 'checkbox';

  const MockTokenBox = () => (
    <div className="my-6 p-4 border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-xl flex items-center justify-center text-indigo-400">
      <KeyRound className="w-4 h-4 mr-2" />
      <span className="text-xs font-bold uppercase tracking-wider">Applicant Token UI Block Rendered Here</span>
    </div>
  );

  if (isLoading) return <div className="flex-1 flex items-center justify-center h-full bg-gray-50"><div className="flex items-center space-x-2 text-gray-500 text-sm font-medium"><Loader2 className="w-5 h-5 animate-spin text-indigo-600" /><span>Loading form schema...</span></div></div>;

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden font-sans">
      {/* TOP HEADER */}
      <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center">
          <a href="/admin/forms" className="p-2 -ml-2 mr-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"><ArrowLeft className="w-5 h-5" /></a>
          <h1 className="text-lg font-semibold text-gray-900 truncate max-w-sm">{formConfig.internalName}</h1>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => { 
              if (formConfig.slug) window.open(`/en/form/${formConfig.slug}?test=true`, '_blank'); 
              else alert('Please set a URL Slug and save before previewing.'); 
            }} 
            className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 transition-colors"
          >
            <Eye className="w-4 h-4 mr-2" /> Preview & Test
          </button>
          <button onClick={handleSave} disabled={isSaving} className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"><Save className={`w-4 h-4 mr-2 ${isSaving ? 'animate-pulse' : ''}`} /> {isSaving ? 'Saving...' : 'Save Schema'}</button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* LIVE CANVAS */}
        <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center bg-gray-50/80 cursor-pointer" onClick={() => { setActiveFieldId(null); setViewMode('form'); }}>
          <div className="bg-white rounded-full p-1 border border-gray-200 shadow-sm flex mb-6 relative z-10" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => { setViewMode('form'); setActiveFieldId(null); }} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${viewMode === 'form' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}>Form Questions</button>
            <button onClick={() => { setViewMode('success'); setActiveFieldId(null); }} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${viewMode === 'success' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-500 hover:text-gray-900'}`}>Success Screen</button>
          </div>

          <div className="w-full max-w-2xl pb-32" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              {formConfig.bannerImageUrl && (
                <div className="w-full relative group"><img src={formConfig.bannerImageUrl} alt="Banner" className="w-full h-auto max-h-64 object-contain bg-stone-50" /><button onClick={() => setFormConfig({...formConfig, bannerImageUrl: ''})} className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur rounded-full text-gray-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"><Trash2 className="w-4 h-4" /></button></div>
              )}

              {viewMode === 'form' ? (
                <>
                  <div onClick={() => setActiveFieldId(null)} className={`p-8 border-b border-gray-100 cursor-pointer transition-colors ${activeFieldId === null ? 'bg-indigo-50/50 border-indigo-100' : 'bg-white hover:bg-gray-50'}`}>
                    <div className="mb-4"><h2 className="text-2xl font-bold text-gray-900">{formConfig.titleEn || 'New Form'}</h2><h3 className="text-lg font-medium text-gray-600 mt-1">{formConfig.titleZh}</h3></div>
                    {(formConfig.subtitleEn || formConfig.subtitleZh) && (
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <MarkdownRenderer content={formConfig.subtitleEn} className="text-sm text-gray-600" />
                        <MarkdownRenderer content={formConfig.subtitleZh} className="text-sm text-gray-600 mt-2" />
                      </div>
                    )}
                  </div>
                  <div className="p-8 space-y-6">
                    {fields.length === 0 && <div className="text-center py-12 px-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50"><LayoutTemplate className="w-12 h-12 text-gray-300 mx-auto mb-3" /><h3 className="text-sm font-medium text-gray-900 mb-1">Your form is empty</h3><p className="text-xs text-gray-500">Click the button below to add your first question.</p></div>}
                    {fields.map((field, idx) => {
                      const isInvalid = invalidFieldIds.includes(field.id);
                      return (
                        <div key={field.id} onClick={() => setActiveFieldId(field.id)} className={`relative p-5 rounded-xl border-2 transition-all cursor-pointer group ${activeFieldId === field.id ? 'border-indigo-500 bg-indigo-50/10 shadow-sm' : isInvalid ? 'border-red-500 bg-red-50/20 hover:border-red-600' : 'border-transparent hover:border-gray-200 hover:bg-gray-50'}`}>
                          {field.condition && field.condition.rules.length > 0 && <div className="absolute -top-3 left-4 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200 flex items-center shadow-sm"><GitBranch className="w-3 h-3 mr-1" />Conditional</div>}
                          {isInvalid && <div className="absolute -top-3 right-4 bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200 flex items-center shadow-sm"><AlertCircle className="w-3 h-3 mr-1 text-red-600" />Missing Key or Value</div>}
                          {activeFieldId === field.id && (
                            <div className="absolute -right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1 z-10">
                              <button onClick={(e) => { e.stopPropagation(); moveField(idx, 'up'); }} disabled={idx === 0} className="p-1 bg-white border border-gray-200 rounded shadow-sm text-gray-500 hover:text-indigo-600 disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                              <button onClick={(e) => { e.stopPropagation(); moveField(idx, 'down'); }} disabled={idx === fields.length - 1} className="p-1 bg-white border border-gray-200 rounded shadow-sm text-gray-500 hover:text-indigo-600 disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                            </div>
                          )}
                          <div className={`absolute -left-3 top-1/2 -translate-y-1/2 p-1 bg-white border border-gray-200 rounded text-gray-300 shadow-sm transition-opacity ${activeFieldId === field.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}><GripVertical className="w-4 h-4" /></div>

                          <div className="space-y-3">
                            <div>
                              <label className={`block font-semibold text-gray-900 ${field.type === 'info' ? 'text-base text-indigo-900 mb-1' : 'text-sm'}`}>
                                {field.labelEn} <span className="text-gray-400 font-normal ml-1">/ {field.labelZh}</span>
                                {field.type !== 'info' && <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded ml-2 font-normal">key: {field.dataKey || '(missing)'}</span>}
                                {field.required && field.type !== 'info' && <span className="text-red-500 ml-1">*</span>}
                              </label>
                              <MarkdownRenderer content={field.descriptionEn} className="text-sm text-gray-500 mt-1" />
                              <MarkdownRenderer content={field.descriptionZh} className="text-sm text-gray-500 mt-1" />
                            </div>
                            
                            {field.type === 'info' ? null : 
                             field.type === 'text' || field.type === 'email' ? (
                              <input type={field.type} disabled placeholder="..." className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white" />
                            ) : field.type === 'textarea' ? (
                              <textarea disabled rows={3} placeholder="..." className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white" />
                            ) : field.type === 'mobile' ? (
                              <div className="relative">
                                <Smartphone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <input type="tel" disabled placeholder="+852..." className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 bg-white" />
                              </div>
                            ) : field.type === 'date' ? (
                              <div className="relative">
                                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <input type="date" disabled className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 bg-white" />
                              </div>
                            ) : field.type === 'time' ? (
                              <div className="flex items-center gap-2 max-w-[200px]">
                                <div className="relative flex-1">
                                  <Clock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                  <input type="text" disabled placeholder="HH" className="w-full pl-9 pr-2 py-2.5 rounded-lg border border-gray-300 bg-white text-center font-mono text-sm" />
                                </div>
                                <span className="text-gray-400 font-bold">:</span>
                                <div className="flex-1">
                                  <input type="text" disabled placeholder="MM" className="w-full px-2 py-2.5 rounded-lg border border-gray-300 bg-white text-center font-mono text-sm" />
                                </div>
                              </div>
                            ) : field.type === 'file' ? (
                              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-gray-50">
                                <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
                              </div>
                            ) : field.type === 'applicant_token' ? (
                              <div className="flex gap-2">
                                <div className="relative flex-1">
                                  <KeyRound className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                  <input type="text" disabled placeholder="MMC-XXXX-XXXX" className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 bg-white font-mono" />
                                </div>
                                <button disabled className="px-4 py-2 bg-gray-100 text-gray-400 rounded-lg border border-gray-200">Verify</button>
                              </div>
                            ) : field.type === 'select' ? (
                              <select disabled className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white appearance-none">
                                <option>Select...</option>
                              </select>
                            ) : (field.type === 'radio' || field.type === 'checkbox') ? (
                              <div className="space-y-2">
                                {field.options?.map((opt, i) => (
                                  <div key={i} className="flex items-center">
                                    <input type={field.type} disabled className="w-4 h-4 text-indigo-600 border-gray-300" />
                                    <label className="ml-3 text-sm text-gray-700">
                                      {opt.labelEn} <span className="text-gray-400">/ {opt.labelZh}</span>
                                      <span className="font-mono text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded ml-2 font-normal">
                                        val: {opt.value}
                                      </span>
                                    </label>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                    <button onClick={handleAddQuestion} className="w-full py-4 mt-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-medium text-sm hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center justify-center"><PlusCircle className="w-5 h-5 mr-2" /> Add Question</button>
                  </div>
                </>
              ) : (
                <div className="p-12 bg-white text-center">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckSquare className="w-8 h-8" />
                  </div>
                  <div className="text-left bg-gray-50 rounded-2xl p-8 border border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      {formConfig.successTitleEn} <span className="text-gray-400 font-normal mx-2">/</span> {formConfig.successTitleZh}
                    </h2>
                    <hr className="mb-6 border-gray-200" />
                    
                    <div className="space-y-8">
                      <div className="space-y-6">
                        {formConfig.successMessageEn.split('{{TOKEN_BOX}}').map((part, index, array) => (
                          <React.Fragment key={`en-${index}`}>
                            <MarkdownRenderer content={part} className="text-sm text-gray-700" />
                            {index < array.length - 1 && <MockTokenBox />}
                          </React.Fragment>
                        ))}
                      </div>
  
                      <hr className="border-gray-200 border-dashed" />
  
                      <div className="space-y-6">
                        {formConfig.successMessageZh.split('{{TOKEN_BOX}}').map((part, index, array) => (
                          <React.Fragment key={`zh-${index}`}>
                            <MarkdownRenderer content={part} className="text-sm text-gray-700" />
                            {index < array.length - 1 && <MockTokenBox />}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT INSPECTOR */}
        <div className="w-[460px] bg-white border-l border-gray-200 flex flex-col shadow-xl z-20">
          <div className="h-14 border-b border-gray-100 flex items-center px-6 bg-gray-50/50 shrink-0">
            <Settings2 className="w-4 h-4 text-gray-500 mr-2" />
            <span className="text-sm font-semibold text-gray-700 uppercase tracking-wider">{viewMode === 'success' ? 'Success Config' : activeField ? 'Field Inspector' : 'Form Settings'}</span>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {viewMode === 'success' ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Success Titles</h3>
                  <FormInput label="Title (English)" value={formConfig.successTitleEn} onChange={(e) => setFormConfig({...formConfig, successTitleEn: e.target.value})} />
                  <FormInput label="Title (Chinese)" value={formConfig.successTitleZh} onChange={(e) => setFormConfig({...formConfig, successTitleZh: e.target.value})} />
                </div>
                <hr className="border-gray-100" />
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Success Content</h3>
                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                    <p className="text-xs text-amber-800 font-medium">Use <code className="bg-white px-1 py-0.5 rounded font-bold">{'{{TOKEN_BOX}}'}</code> exactly as written to place the Applicant Token card inside your message.</p>
                  </div>
                  <div><label className="block text-sm font-semibold text-gray-950 mb-1.5">Message (English)</label><MarkdownEditor value={formConfig.successMessageEn} onChange={(val) => setFormConfig({...formConfig, successMessageEn: val})} rows={6} /></div>
                  <div><label className="block text-sm font-semibold text-gray-950 mb-1.5">Message (Chinese)</label><MarkdownEditor value={formConfig.successMessageZh} onChange={(val) => setFormConfig({...formConfig, successMessageZh: val})} rows={6} /></div>
                </div>
              </div>
            ) : !activeField ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-900">Cover Banner Image</label>
                  <label className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer transition-colors group">
                    {isUploadingBanner ? <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mb-2" /> : <ImageIconOutline className="w-6 h-6 text-gray-400 mb-2 group-hover:text-indigo-500 transition-colors" />}
                    <span className="text-xs font-medium text-gray-600 group-hover:text-indigo-600">{isUploadingBanner ? 'Uploading...' : formConfig.bannerImageUrl ? 'Click to replace image' : 'Click to upload banner'}</span>
                    <input type="file" accept="image/*" onChange={handleBannerUpload} disabled={isUploadingBanner} className="hidden" />
                  </label>
                </div>
                <hr className="border-gray-100" />
                <div className="space-y-4">
                  <FormInput label="Internal Reference Name" helperText="Only visible to your admin team in the dashboard." value={formConfig.internalName} onChange={(e) => setFormConfig({...formConfig, internalName: e.target.value})} />
                  
                  <FormInput 
                    label="URL Slug" 
                    helperText="The public web address (e.g., /en/form/summer-retreat). Letters, numbers, and hyphens only." 
                    value={formConfig.slug} 
                    onChange={(e) => setFormConfig({...formConfig, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')})} 
                    required
                  />

                  <FormSelect label="Linked Event" value={formConfig.eventId} onChange={(e) => setFormConfig({...formConfig, eventId: e.target.value})}>
                    <option value="evt_1">7-Day Silent Zen Retreat</option>
                    <option value="evt_2">Weekly Wednesday Wisdom</option>
                  </FormSelect>
                  <FormInput label="Interim Event Code (Prefix)" helperText="Applicants will get tokens like [PREFIX]-A4X9-P2M8" maxLength={8} value={formConfig.interimEventCode} onChange={(e) => setFormConfig({...formConfig, interimEventCode: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')})} className="font-mono uppercase" placeholder="e.g., ZEN26" />
                  
                  <div className="flex items-center justify-between py-3 border-y border-gray-100 mt-4"><div><span className="text-sm font-bold text-gray-900">Follow-up Form</span><p className="text-[11px] text-gray-500 leading-tight mt-1">Requires an existing applicant<br/>magic token via URL to access.</p></div><button onClick={() => setFormConfig({ ...formConfig, isFollowUp: !formConfig.isFollowUp })} className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${formConfig.isFollowUp ? 'bg-indigo-600' : 'bg-gray-200'}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${formConfig.isFollowUp ? 'translate-x-4' : 'translate-x-0'}`} /></button></div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-100"><div><span className="text-sm font-bold text-gray-900">Standalone Form</span><p className="text-[11px] text-gray-500 leading-tight mt-1">Hides the website navigation & footer<br/>for a focused landing page.</p></div><button onClick={() => setFormConfig({ ...formConfig, isStandalone: !formConfig.isStandalone })} className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${formConfig.isStandalone ? 'bg-indigo-600' : 'bg-gray-200'}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${formConfig.isStandalone ? 'translate-x-4' : 'translate-x-0'}`} /></button></div>
                </div>

                <div className="space-y-4 pt-2">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Public Presentation</h3>
                  <FormInput label="Public Title (English)" value={formConfig.titleEn} onChange={(e) => setFormConfig({...formConfig, titleEn: e.target.value})} />
                  <FormInput label="Public Title (Chinese)" value={formConfig.titleZh} onChange={(e) => setFormConfig({...formConfig, titleZh: e.target.value})} />
                  <div><label className="block text-sm font-semibold text-gray-950 mb-1.5">Description (English)</label><MarkdownEditor value={formConfig.subtitleEn} onChange={(val) => setFormConfig({...formConfig, subtitleEn: val})} /></div>
                  <div><label className="block text-sm font-semibold text-gray-950 mb-1.5">Description (Chinese)</label><MarkdownEditor value={formConfig.subtitleZh} onChange={(val) => setFormConfig({...formConfig, subtitleZh: val})} /></div>
                </div>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                {activeField.type !== 'info' && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <FormInput label="Data Key (Database Column)" value={activeField.dataKey} onChange={(e) => updateActiveField({ dataKey: e.target.value })} required className="font-mono" helperText="This is the exact key your CSV export and Coda database will use." />
                  </div>
                )}

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">{activeField.type === 'info' ? 'Block Content' : 'Question Content'}</h3>
                  <FormInput label="Title (English)" value={activeField.labelEn} onChange={(e) => updateActiveField({ labelEn: e.target.value })} />
                  <FormInput label="Title (Chinese)" value={activeField.labelZh} onChange={(e) => updateActiveField({ labelZh: e.target.value })} />
                  <div className="pt-2"><label className="block text-sm font-semibold text-gray-950 mb-1.5">Description / Hint (English)</label><MarkdownEditor rows={2} value={activeField.descriptionEn || ''} onChange={(val) => updateActiveField({ descriptionEn: val })} placeholder="Optional. Use !!text!! for red warning." /></div>
                  <div><label className="block text-sm font-semibold text-gray-950 mb-1.5">Description / Hint (Chinese)</label><MarkdownEditor rows={2} value={activeField.descriptionZh || ''} onChange={(val) => updateActiveField({ descriptionZh: val })} placeholder="選填。" /></div>
                </div>

                <hr className="border-gray-100" />

                <div className="space-y-4">
                  <FormSelect 
                    label="Field Format" 
                    value={activeField.type} 
                    onChange={(e) => { const newType = e.target.value as FieldType; updateActiveField({ type: newType, dataKey: newType === 'info' ? '' : (activeField.dataKey || `question_${fields.length + 1}`), options: (['select', 'radio', 'checkbox'].includes(newType)) && !activeField.options ? [{ value: 'opt_1', labelEn: 'Option 1', labelZh: '選項 1' }] : activeField.options, }); }}
                    icon={Settings2}
                  >
                    <optgroup label="Text"><option value="text">Short Text</option><option value="textarea">Long Paragraph</option><option value="email">Email Address</option><option value="mobile">Mobile Number</option></optgroup>
                    <optgroup label="Choices"><option value="select">Dropdown Menu</option><option value="radio">Single Choice (Radio)</option><option value="checkbox">Multiple Choice (Checkboxes)</option></optgroup>
                    <optgroup label="Verification"><option value="applicant_token">Applicant Token (Verify)</option></optgroup>
                    <optgroup label="Other"><option value="date">Date Picker</option><option value="time">Time</option><option value="file">File Upload</option></optgroup>
                    <optgroup label="Layout"><option value="info">Informational Text Block</option></optgroup>
                  </FormSelect>

                  {hasOptions && (
                    <div className="space-y-3 pt-2">
                      <label className="block text-sm font-semibold text-gray-950">Choices Configuration</label>
                      <div className="space-y-3">
                        {activeField.options?.map((opt, index) => (
                          <div key={index} className="flex items-start bg-gray-50 p-3 rounded-lg border border-gray-200 gap-2">
                            <div className="flex flex-col gap-1 justify-center pt-2">
                              <button onClick={() => moveOption(index, 'up')} disabled={index === 0} className="p-1 text-gray-400 hover:text-indigo-600 disabled:opacity-30"><ChevronUp className="w-3.5 h-3.5" /></button>
                              <button onClick={() => moveOption(index, 'down')} disabled={!activeField.options || index === activeField.options.length - 1} className="p-1 text-gray-400 hover:text-indigo-600 disabled:opacity-30"><ChevronDown className="w-3.5 h-3.5" /></button>
                            </div>
                            <div className="flex-1 space-y-2">
                              <div><label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Value <span className="text-red-500">*</span></label><input type="text" value={opt.value} onChange={(e) => handleUpdateOption(index, 'value', e.target.value)} placeholder="Data value" className="w-full px-2 py-1.5 text-xs font-mono border border-gray-300 rounded focus:ring-indigo-500 text-gray-950 bg-white" required /></div>
                              <input type="text" value={opt.labelEn} onChange={(e) => handleUpdateOption(index, 'labelEn', e.target.value)} placeholder="English Label" className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-indigo-500 text-gray-950 bg-white" />
                              <input type="text" value={opt.labelZh} onChange={(e) => handleUpdateOption(index, 'labelZh', e.target.value)} placeholder="Chinese Label" className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-indigo-500 text-gray-950 bg-white" />
                            </div>
                            <button onClick={() => handleRemoveOption(index)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"><X className="w-4 h-4" /></button>
                          </div>
                        ))}
                      </div>
                      <button onClick={handleAddOption} className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-indigo-600 font-medium text-xs hover:bg-indigo-50">+ Add Choice</button>
                    </div>
                  )}

                  {activeField.type !== 'info' && (
                    <div className="flex items-center justify-between py-3 border-y border-gray-100">
                      <div><span className="text-sm font-medium text-gray-900">Required Field</span><p className="text-xs text-gray-500">Must be filled out to submit.</p></div>
                      <button onClick={() => updateActiveField({ required: !activeField.required })} className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${activeField.required ? 'bg-indigo-600' : 'bg-gray-200'}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${activeField.required ? 'translate-x-4' : 'translate-x-0'}`} /></button>
                    </div>
                  )}
                </div>

                <div className="space-y-4 p-4 bg-amber-50/50 border border-amber-200/60 rounded-xl">
                  <div className="flex items-center justify-between">
                     <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wider flex items-center"><GitBranch className="w-4 h-4 mr-2" />Conditional Logic</h3>
                     <button onClick={() => { if (activeField.condition) updateActiveField({ condition: undefined }); else updateActiveField({ condition: { match: 'AND', rules: [{ id: 'rule_1', dependsOn: '', operator: 'equals', value: '' }] } }); }} className={`relative inline-flex h-4 w-7 rounded-full transition-colors ${activeField.condition ? 'bg-amber-600' : 'bg-amber-200'}`}><span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition ${activeField.condition ? 'translate-x-3' : 'translate-x-0'}`} /></button>
                  </div>
                  
                  {activeField.condition && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center text-xs font-medium text-amber-800">
                        <span>Show this question if</span>
                        <select value={activeField.condition.match} onChange={(e) => updateActiveField({ condition: { ...activeField.condition!, match: e.target.value as 'AND' | 'OR' } })} className="mx-2 bg-white border border-amber-300 rounded px-2 py-1 focus:ring-amber-500 text-amber-950">
                          <option value="AND">ALL</option><option value="OR">ANY</option>
                        </select>
                        <span>of the following match:</span>
                      </div>

                      <div className="space-y-3 border-l-2 border-amber-200 pl-3">
                        {activeField.condition.rules.map((rule) => {
                          const dependentField = previousFields.find(f => f.dataKey === rule.dependsOn);
                          const depType = dependentField?.type;

                          const renderOperatorOptions = () => {
                            if (!depType) return null;

                            if (['text', 'email', 'mobile', 'textarea'].includes(depType)) {
                              return (
                                <>
                                  <option value="equals">Equals</option>
                                  <option value="not_equals">Does Not Equal</option>
                                  <option value="contains">Contains</option>
                                  <option value="not_contains">Does Not Contain</option>
                                  <option value="is_blank">Is Blank</option>
                                  <option value="is_not_blank">Is Not Blank</option>
                                </>
                              );
                            }

                            if (['radio', 'select', 'checkbox'].includes(depType)) {
                              return (
                                <>
                                  <option value="is_one_of">Is One Of (Any)</option>
                                  <option value="is_not_one_of">Is Not One Of (None)</option>
                                  <option value="is_blank">Is Blank</option>
                                  <option value="is_not_blank">Is Not Blank</option>
                                </>
                              );
                            }

                            if (depType === 'date' || depType === 'time') {
                              return (
                                <>
                                  <option value="equals">Equals</option>
                                  <option value="not_equals">Does Not Equal</option>
                                  <option value="within_range">Within Range (Between)</option>
                                  <option value="not_within_range">Not Within Range</option>
                                  <option value="is_blank">Is Blank</option>
                                  <option value="is_not_blank">Is Not Blank</option>
                                </>
                              );
                            }

                            if (depType === 'file' || depType === 'applicant_token') {
                              return (
                                <>
                                  <option value="is_blank">Is Blank</option>
                                  <option value="is_not_blank">Is Not Blank</option>
                                </>
                              );
                            }

                            return null;
                          };

                          const isBlankOp = rule.operator === 'is_blank' || rule.operator === 'is_not_blank';
                          const isRangeOp = rule.operator === 'within_range' || rule.operator === 'not_within_range';

                          return (
                            <div key={rule.id} className="space-y-2 bg-white p-3 rounded-lg border border-amber-200 shadow-sm relative group/rule">
                              <button onClick={() => handleRemoveRule(rule.id)} className="absolute -right-2 -top-2 bg-white border border-gray-200 text-gray-400 hover:text-red-500 rounded-full p-0.5 shadow-sm opacity-0 group-hover/rule:opacity-100">
                                <X className="w-3 h-3" />
                              </button>
                              
                              <select 
                                value={rule.dependsOn} 
                                onChange={(e) => {
                                  const newTarget = previousFields.find(f => f.dataKey === e.target.value);
                                  const defaultOp: LogicOperator = ['radio', 'select', 'checkbox'].includes(newTarget?.type || '') 
                                    ? 'is_one_of' 
                                    : ['file', 'applicant_token'].includes(newTarget?.type || '') 
                                    ? 'is_not_blank' 
                                    : 'equals';

                                  handleUpdateRule(rule.id, { dependsOn: e.target.value, operator: defaultOp, value: '' });
                                }} 
                                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded bg-white focus:ring-amber-500 text-gray-950"
                              >
                                <option value="">Select previous field...</option>
                                {previousFields.map(f => (
                                  <option key={f.id} value={f.dataKey}>
                                    {f.labelEn} ({f.labelZh}) [Key: {f.dataKey}]
                                  </option>
                                ))}
                              </select>

                              {dependentField && (
                                <div className="flex flex-col gap-2">
                                  <select 
                                    value={rule.operator} 
                                    onChange={(e) => handleUpdateRule(rule.id, { operator: e.target.value as LogicOperator, value: '' })} 
                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded bg-white focus:ring-amber-500 text-gray-950 font-medium"
                                  >
                                    {renderOperatorOptions()}
                                  </select>

                                  {!isBlankOp && (
                                    ['radio', 'select', 'checkbox'].includes(depType || '') ? (
                                      <div className="space-y-1 bg-gray-50 p-2 rounded border border-gray-200 max-h-36 overflow-y-auto">
                                        <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Select matching options:</span>
                                        {dependentField?.options?.map((opt, optIdx) => {
                                          const currentValues = rule.value ? rule.value.split(',').map(s => s.trim()).filter(Boolean) : [];
                                          const isChecked = currentValues.includes(opt.value);
                                          return (
                                            <label key={optIdx} className="flex items-center text-xs text-gray-800 cursor-pointer hover:bg-gray-100 p-1 rounded">
                                              <input 
                                                type="checkbox" 
                                                checked={isChecked} 
                                                onChange={(e) => { 
                                                  let updated = [...currentValues]; 
                                                  if (e.target.checked) updated.push(opt.value); 
                                                  else updated = updated.filter(v => v !== opt.value); 
                                                  handleUpdateRule(rule.id, { value: updated.join(',') }); 
                                                }} 
                                                className="w-3.5 h-3.5 text-indigo-600 border-gray-300 rounded mr-2" 
                                              />
                                              <span className="font-mono text-[11px] text-indigo-700 mr-1.5">[{opt.value}]</span>
                                              <span>{opt.labelEn || opt.labelZh}</span>
                                            </label>
                                          );
                                        })}
                                      </div>
                                    ) : depType === 'date' ? (
                                      isRangeOp ? (
                                        <div className="flex items-center gap-1.5">
                                          <input 
                                            type="date" 
                                            value={rule.value.split('..')[0] || ''} 
                                            onChange={(e) => {
                                              const to = rule.value.split('..')[1] || '';
                                              handleUpdateRule(rule.id, { value: `${e.target.value}..${to}` });
                                            }} 
                                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white text-gray-950 font-mono" 
                                          />
                                          <span className="text-xs text-gray-400 font-bold">to</span>
                                          <input 
                                            type="date" 
                                            value={rule.value.split('..')[1] || ''} 
                                            onChange={(e) => {
                                              const from = rule.value.split('..')[0] || '';
                                              handleUpdateRule(rule.id, { value: `${from}..${e.target.value}` });
                                            }} 
                                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white text-gray-950 font-mono" 
                                          />
                                        </div>
                                      ) : (
                                        <input 
                                          type="date" 
                                          value={rule.value} 
                                          onChange={(e) => handleUpdateRule(rule.id, { value: e.target.value })} 
                                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded bg-white font-mono text-gray-950" 
                                        />
                                      )
                                    ) : depType === 'time' ? (
                                      isRangeOp ? (
                                        <div className="flex items-center gap-1.5">
                                          <input 
                                            type="text" 
                                            placeholder="HH:mm" 
                                            maxLength={5}
                                            value={rule.value.split('..')[0] || ''} 
                                            onChange={(e) => {
                                              const to = rule.value.split('..')[1] || '';
                                              handleUpdateRule(rule.id, { value: `${e.target.value}..${to}` });
                                            }} 
                                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white text-gray-950 font-mono text-center" 
                                          />
                                          <span className="text-xs text-gray-400 font-bold">to</span>
                                          <input 
                                            type="text" 
                                            placeholder="HH:mm" 
                                            maxLength={5}
                                            value={rule.value.split('..')[1] || ''} 
                                            onChange={(e) => {
                                              const from = rule.value.split('..')[0] || '';
                                              handleUpdateRule(rule.id, { value: `${from}..${e.target.value}` });
                                            }} 
                                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white text-gray-950 font-mono text-center" 
                                          />
                                        </div>
                                      ) : (
                                        <input 
                                          type="text" 
                                          placeholder="HH:mm (e.g. 14:30)" 
                                          maxLength={5}
                                          value={rule.value} 
                                          onChange={(e) => handleUpdateRule(rule.id, { value: e.target.value })} 
                                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded bg-white font-mono text-gray-950" 
                                        />
                                      )
                                    ) : (
                                      <input 
                                        type="text" 
                                        value={rule.value} 
                                        onChange={(e) => handleUpdateRule(rule.id, { value: e.target.value })} 
                                        placeholder="Value..." 
                                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-amber-500 text-gray-950 bg-white" 
                                      />
                                    )
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <button onClick={handleAddRule} className="text-xs font-semibold text-amber-700 hover:text-amber-900 transition-colors flex items-center"><PlusCircle className="w-3 h-3 mr-1" /> Add Condition</button>
                    </div>
                  )}
                </div>

                <div className="pt-8">
                  <button onClick={() => { setFields(fields.filter(f => f.id !== activeFieldId)); setActiveFieldId(null); }} className="flex items-center text-sm font-medium text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Question
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