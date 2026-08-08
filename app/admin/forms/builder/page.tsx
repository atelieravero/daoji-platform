'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { saveFormSchema, getFormSchema } from './actions';
import { 
  ArrowLeft, Save, GripVertical, Settings2, Type, ListOrdered, 
  PlusCircle, Trash2, LayoutTemplate, X, GitBranch, Eye,
  FileText, Calendar, Smartphone, CheckSquare, UploadCloud,
  ChevronUp, ChevronDown, AlignLeft, AlertCircle, Loader2, KeyRound
} from 'lucide-react';

type FieldType = 'text' | 'email' | 'mobile' | 'date' | 'select' | 'radio' | 'checkbox' | 'textarea' | 'file' | 'info' | 'applicant_token';

type FieldOption = { value: string; labelEn: string; labelZh: string };

type LogicOperator = 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'is_blank' | 'is_not_blank' | 'is_one_of' | 'is_not_one_of';

interface LogicRule {
  id: string;
  dependsOn: string;
  operator: LogicOperator;
  value: string;
}

interface FormField {
  id: string;
  dataKey: string;
  type: FieldType;
  labelEn: string;
  labelZh: string;
  descriptionEn?: string;
  descriptionZh?: string;
  required: boolean;
  options?: FieldOption[];
  condition?: {
    match: 'AND' | 'OR';
    rules: LogicRule[];
  };
}

const MarkdownPreview = ({ text, className = "" }: { text?: string, className?: string }) => {
  if (!text) return null;
  
  let html = text
    .replace(/</g, '&lt;').replace(/>/g, '&gt;') 
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-indigo-600 hover:underline" target="_blank">$1</a>') 
    .replace(/!!(.*?)!!/g, '<span class="text-red-500 font-medium">$1</span>'); 

  const lines = html.split('\n');
  let inUl = false, inOl = false, result = '';

  lines.forEach(line => {
    if (line.trim().startsWith('- ')) {
      if (!inUl) { result += '<ul class="list-disc pl-5 my-1 space-y-1">'; inUl = true; }
      result += `<li>${line.substring(2)}</li>`;
    } else if (/^\d+\.\s/.test(line.trim())) {
      if (!inOl) { result += '<ol class="list-decimal pl-5 my-1 space-y-1">'; inOl = true; }
      result += `<li>${line.replace(/^\d+\.\s/, '')}</li>`;
    } else {
      if (inUl) { result += '</ul>'; inUl = false; }
      if (inOl) { result += '</ol>'; inOl = false; }
      result += `${line}<br />`;
    }
  });
  if (inUl) result += '</ul>';
  if (inOl) result += '</ol>';

  return <div dangerouslySetInnerHTML={{ __html: result }} className={`text-sm text-gray-500 mt-1 ${className}`} />;
};

// Start with an empty canvas instead of mock data
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

  const [currentFormId, setCurrentFormId] = useState<string | null>(
    formIdParam && formIdParam !== 'new' ? formIdParam : null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [invalidFieldIds, setInvalidFieldIds] = useState<string[]>([]);
  
  // Start with a clean, empty form configuration
  const [formConfig, setFormConfig] = useState({
    internalName: 'Untitled Form',
    titleEn: 'New Form',
    titleZh: '新表單',
    subtitleEn: '',
    subtitleZh: '',
    eventId: 'evt_1',
    isFollowUp: false,
    status: 'draft',
    interimEventCode: 'OCT26'
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
        eventId: record.event_id || 'evt_1',
        isFollowUp: record.is_followup || false,
        titleEn: record.schema?.titleEn || '',
        titleZh: record.schema?.titleZh || '',
        subtitleEn: record.schema?.subtitleEn || '',
        subtitleZh: record.schema?.subtitleZh || '',
        status: record.schema?.status || 'draft',
        interimEventCode: record.schema?.interimEventCode || 'OCT26'
      });

      if (record.schema?.fields && Array.isArray(record.schema.fields)) {
        setFields(record.schema.fields);
      }
    }).finally(() => {
      if (isMounted) setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [formIdParam]);

  const activeField = fields.find(f => f.id === activeFieldId);
  const activeFieldIndex = fields.findIndex(f => f.id === activeFieldId);
  const previousFields = fields.slice(0, activeFieldIndex > -1 ? activeFieldIndex : 0);

  const updateActiveField = (updates: Partial<FormField>) => {
    setFields(fields.map(f => f.id === activeFieldId ? { ...f, ...updates } : f));
  };

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
    const newField: FormField = {
      id: newId,
      dataKey: `question_${fields.length + 1}`,
      type: 'text',
      labelEn: 'New Question',
      labelZh: '新問題',
      required: false
    };
    setFields([...fields, newField]);
    setActiveFieldId(newId);
  };

  const handleAddOption = () => {
    if (!activeField) return;
    const currentOpts = activeField.options || [];
    const newCount = currentOpts.length + 1;
    updateActiveField({
      options: [...currentOpts, { value: `opt_${newCount}`, labelEn: `Option ${newCount}`, labelZh: `選項 ${newCount}` }]
    });
  };

  const handleUpdateOption = (index: number, key: keyof FieldOption, value: string) => {
    if (!activeField || !activeField.options) return;
    const newOpts = [...activeField.options];
    newOpts[index] = { ...newOpts[index], [key]: value };
    updateActiveField({ options: newOpts });
  };

  const handleRemoveOption = (index: number) => {
    if (!activeField || !activeField.options) return;
    updateActiveField({
      options: activeField.options.filter((_, i) => i !== index)
    });
  };

  const handleAddRule = () => {
    if (!activeField) return;
    const defaultCondition = activeField.condition || { match: 'AND', rules: [] };
    const newRule: LogicRule = { id: `rule_${Date.now()}`, dependsOn: '', operator: 'equals', value: '' };
    updateActiveField({
      condition: { ...defaultCondition, rules: [...defaultCondition.rules, newRule] }
    });
  };

  const handleUpdateRule = (ruleId: string, updates: Partial<LogicRule>) => {
    if (!activeField || !activeField.condition) return;
    updateActiveField({
      condition: {
        ...activeField.condition,
        rules: activeField.condition.rules.map(r => r.id === ruleId ? { ...r, ...updates } : r)
      }
    });
  };

  const handleRemoveRule = (ruleId: string) => {
    if (!activeField || !activeField.condition) return;
    const remainingRules = activeField.condition.rules.filter(r => r.id !== ruleId);
    if (remainingRules.length === 0) {
      updateActiveField({ condition: undefined });
    } else {
      updateActiveField({ condition: { ...activeField.condition, rules: remainingRules } });
    }
  };

  const handleSave = async () => {
    const invalidIds: string[] = [];

    for (const f of fields) {
      if (f.type !== 'info' && (!f.dataKey || f.dataKey.trim() === '')) {
        invalidIds.push(f.id);
      }
      if (f.options) {
        for (const opt of f.options) {
          if (!opt.value || opt.value.trim() === '') {
            if (!invalidIds.includes(f.id)) invalidIds.push(f.id);
          }
        }
      }
    }

    if (invalidIds.length > 0) {
      setInvalidFieldIds(invalidIds);
      alert('Validation Error: Some questions have missing Data Keys or Option Values. Please check the highlighted questions in red.');
      return;
    }

    setInvalidFieldIds([]);
    setIsSaving(true);
    try {
      const payload = {
        event_id: formConfig.eventId,
        title: formConfig.internalName,
        is_followup: formConfig.isFollowUp,
        schema: {
          titleEn: formConfig.titleEn,
          titleZh: formConfig.titleZh,
          subtitleEn: formConfig.subtitleEn,
          subtitleZh: formConfig.subtitleZh,
          status: formConfig.status,
          interimEventCode: formConfig.interimEventCode.toUpperCase().replace(/[^A-Z0-9]/g, ''),
          fields: fields
        }
      };
      
      const savedId = await saveFormSchema(payload, currentFormId);
      
      if (savedId && !currentFormId) {
        setCurrentFormId(savedId);
        window.history.replaceState(null, '', `?id=${savedId}`);
      }

      alert('Form Schema saved successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to save Form Schema.');
    } finally {
      setIsSaving(false);
    }
  };

  const hasOptions = activeField?.type === 'select' || activeField?.type === 'radio' || activeField?.type === 'checkbox';

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full bg-gray-50">
        <div className="flex items-center space-x-2 text-gray-500 text-sm font-medium">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
          <span>Loading form schema...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden font-sans">
      
      {/* TOP HEADER */}
      <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center">
          <a href="/admin/forms" className="p-2 -ml-2 mr-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </a>
          <h1 className="text-lg font-semibold text-gray-900 truncate max-w-sm">{formConfig.internalName}</h1>
          <select 
            value={formConfig.status}
            onChange={(e) => setFormConfig({...formConfig, status: e.target.value})}
            className="ml-4 text-xs font-medium bg-amber-100 text-amber-800 rounded-full px-3 py-1.5 cursor-pointer focus:ring-2 focus:ring-amber-500 outline-none appearance-none border-0 hover:bg-amber-200 transition-colors"
          >
            <option value="draft">Draft (Private)</option>
            <option value="open">Open (Live)</option>
            <option value="closed">Closed (Locked)</option>
          </select>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => {
              if (currentFormId) {
                window.open(`/en/form?id=${currentFormId}&test=true`, '_blank');
              } else {
                alert('Please save the form first to preview it.');
              }
            }}
            className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 transition-colors"
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview & Test
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
          >
            <Save className={`w-4 h-4 mr-2 ${isSaving ? 'animate-pulse' : ''}`} />
            {isSaving ? 'Saving...' : 'Save Schema'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* LIVE CANVAS */}
        <div className="flex-1 overflow-y-auto p-8 flex justify-center bg-gray-50/80 cursor-pointer" onClick={() => setActiveFieldId(null)}>
          <div className="w-full max-w-2xl pb-32" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div 
                onClick={() => setActiveFieldId(null)}
                className={`p-8 border-b border-gray-100 cursor-pointer transition-colors ${activeFieldId === null ? 'bg-indigo-50/50 border-indigo-100' : 'bg-white hover:bg-gray-50'}`}
              >
                <div className="mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">{formConfig.titleEn}</h2>
                  <h3 className="text-lg font-medium text-gray-600 mt-1">{formConfig.titleZh}</h3>
                </div>
                {(formConfig.subtitleEn || formConfig.subtitleZh) && (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <MarkdownPreview text={formConfig.subtitleEn} className="text-gray-600" />
                    <MarkdownPreview text={formConfig.subtitleZh} className="text-gray-600 mt-2" />
                  </div>
                )}
              </div>
              
              <div className="p-8 space-y-6">
                {fields.length === 0 && (
                  <div className="text-center py-12 px-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                    <LayoutTemplate className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-sm font-medium text-gray-900 mb-1">Your form is empty</h3>
                    <p className="text-xs text-gray-500">Click the button below to add your first question.</p>
                  </div>
                )}

                {fields.map((field, idx) => {
                  const isInvalid = invalidFieldIds.includes(field.id);
                  return (
                    <div 
                      key={field.id}
                      onClick={() => setActiveFieldId(field.id)}
                      className={`relative p-5 rounded-xl border-2 transition-all cursor-pointer group ${
                        activeFieldId === field.id 
                          ? 'border-indigo-500 bg-indigo-50/10 shadow-sm' 
                          : isInvalid
                          ? 'border-red-500 bg-red-50/20 hover:border-red-600'
                          : 'border-transparent hover:border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {field.condition && field.condition.rules.length > 0 && (
                        <div className="absolute -top-3 left-4 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200 flex items-center shadow-sm">
                          <GitBranch className="w-3 h-3 mr-1" />
                          Conditional
                        </div>
                      )}

                      {isInvalid && (
                        <div className="absolute -top-3 right-4 bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200 flex items-center shadow-sm">
                          <AlertCircle className="w-3 h-3 mr-1 text-red-600" />
                          Missing Data Key or Option Value
                        </div>
                      )}

                      {activeFieldId === field.id && (
                        <div className="absolute -right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1 z-10">
                          <button 
                            onClick={(e) => { e.stopPropagation(); moveField(idx, 'up'); }}
                            disabled={idx === 0}
                            className="p-1 bg-white border border-gray-200 rounded shadow-sm text-gray-500 hover:text-indigo-600 disabled:opacity-30 transition-colors"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); moveField(idx, 'down'); }}
                            disabled={idx === fields.length - 1}
                            className="p-1 bg-white border border-gray-200 rounded shadow-sm text-gray-500 hover:text-indigo-600 disabled:opacity-30 transition-colors"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      <div className={`absolute -left-3 top-1/2 -translate-y-1/2 p-1 bg-white border border-gray-200 rounded text-gray-300 shadow-sm transition-opacity ${
                        activeFieldId === field.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}>
                        <GripVertical className="w-4 h-4" />
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className={`block font-semibold text-gray-900 ${field.type === 'info' ? 'text-base text-indigo-900 mb-1' : 'text-sm'}`}>
                            {field.labelEn} <span className="text-gray-400 font-normal ml-1">/ {field.labelZh}</span>
                            {field.type !== 'info' && (
                              <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded ml-2 font-normal">
                                key: {field.dataKey || '(missing)'}
                              </span>
                            )}
                            {field.required && field.type !== 'info' && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          <MarkdownPreview text={field.descriptionEn} />
                          <MarkdownPreview text={field.descriptionZh} />
                        </div>
                        
                        {field.type === 'info' ? null : field.type === 'text' || field.type === 'email' ? (
                          <input type={field.type} disabled placeholder="Applicant input..." className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 placeholder-gray-400" />
                        ) : field.type === 'textarea' ? (
                          <textarea disabled rows={3} placeholder="Applicant input..." className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 placeholder-gray-400" />
                        ) : field.type === 'mobile' ? (
                          <div className="relative">
                            <Smartphone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input type="tel" disabled placeholder="+852 1234 5678" className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 placeholder-gray-400" />
                          </div>
                        ) : field.type === 'date' ? (
                          <div className="relative">
                            <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input type="date" disabled className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 placeholder-gray-400" />
                          </div>
                        ) : field.type === 'file' ? (
                          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-gray-50">
                            <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
                            <span className="text-sm font-medium text-indigo-600">Click or drag file to upload</span>
                          </div>
                        ) : field.type === 'applicant_token' ? (
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <KeyRound className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                              <input type="text" disabled placeholder="MMC-XXXX-XXXX" className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 font-mono placeholder-gray-400" />
                            </div>
                            <button disabled className="px-4 py-2 bg-gray-100 text-gray-400 text-sm font-medium rounded-lg border border-gray-200">
                              Verify
                            </button>
                          </div>
                        ) : field.type === 'select' ? (
                          <select disabled className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 appearance-none">
                            <option>Select an option...</option>
                          </select>
                        ) : field.type === 'radio' ? (
                          <div className="space-y-2">
                            {field.options?.map((opt, i) => (
                              <div key={i} className="flex items-center">
                                <input type="radio" disabled className="w-4 h-4 text-indigo-600 border-gray-300" />
                                <label className="ml-3 block text-sm font-medium text-gray-700">
                                  {opt.labelEn} <span className="text-gray-400 font-normal ml-1">/ {opt.labelZh}</span>
                                  <span className="font-mono text-xs text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded ml-2">
                                    val: {opt.value || '(empty)'}
                                  </span>
                                </label>
                              </div>
                            ))}
                          </div>
                        ) : field.type === 'checkbox' ? (
                          <div className="space-y-2">
                            {field.options?.map((opt, i) => (
                              <div key={i} className="flex items-center">
                                <input type="checkbox" disabled className="w-4 h-4 text-indigo-600 border-gray-300 rounded" />
                                <label className="ml-3 block text-sm font-medium text-gray-700">
                                  {opt.labelEn} <span className="text-gray-400 font-normal ml-1">/ {opt.labelZh}</span>
                                  <span className="font-mono text-xs text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded ml-2">
                                    val: {opt.value || '(empty)'}
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

                <button 
                  onClick={handleAddQuestion}
                  className="w-full py-4 mt-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-medium text-sm hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center justify-center"
                >
                  <PlusCircle className="w-5 h-5 mr-2" />
                  Add Question
                </button>

              </div>
            </div>
          </div>
        </div>

        {/* RIGHT INSPECTOR */}
        <div className="w-[460px] bg-white border-l border-gray-200 flex flex-col shadow-xl z-20">
          <div className="h-14 border-b border-gray-100 flex items-center px-6 bg-gray-50/50 shrink-0">
            <Settings2 className="w-4 h-4 text-gray-500 mr-2" />
            <span className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
              {activeField ? 'Field Inspector' : 'Form Settings'}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {!activeField ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-1">Internal Reference Name</label>
                    <p className="text-[11px] text-gray-500 mb-2">Only visible to your admin team in the dashboard.</p>
                    <input
                      type="text"
                      value={formConfig.internalName}
                      onChange={(e) => setFormConfig({...formConfig, internalName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400 bg-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-1">Linked Event</label>
                    <select
                      value={formConfig.eventId}
                      onChange={(e) => setFormConfig({...formConfig, eventId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900"
                    >
                      <option value="evt_1">7-Day Silent Zen Retreat</option>
                      <option value="evt_2">Weekly Wednesday Wisdom</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-1">Interim Event Code (Token Prefix)</label>
                    <p className="text-[11px] text-gray-500 mb-2">Applicants will get tokens like [PREFIX]-A4X9-P2M8</p>
                    <input
                      type="text"
                      maxLength={8}
                      value={formConfig.interimEventCode}
                      onChange={(e) => setFormConfig({...formConfig, interimEventCode: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400 bg-white"
                      placeholder="e.g., ZEN26"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-y border-gray-100 mt-4">
                    <div>
                      <span className="text-sm font-bold text-gray-900">Follow-up Form</span>
                      <p className="text-[11px] text-gray-500 leading-tight mt-1">
                        Requires an existing applicant<br/>magic token via URL to access.
                      </p>
                    </div>
                    <button 
                      onClick={() => setFormConfig({ ...formConfig, isFollowUp: !formConfig.isFollowUp })}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                        formConfig.isFollowUp ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
                        formConfig.isFollowUp ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Public Presentation</h3>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Public Title (English)</label>
                    <input
                      type="text"
                      value={formConfig.titleEn}
                      onChange={(e) => setFormConfig({...formConfig, titleEn: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Public Title (Chinese)</label>
                    <input
                      type="text"
                      value={formConfig.titleZh}
                      onChange={(e) => setFormConfig({...formConfig, titleZh: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center justify-between">
                      Description (English)
                      <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-400">Markdown OK</span>
                    </label>
                    <textarea
                      rows={3}
                      value={formConfig.subtitleEn}
                      onChange={(e) => setFormConfig({...formConfig, subtitleEn: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400 bg-white"
                      placeholder="Welcome to the application. **Bold** and [Links](url) are supported."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center justify-between">
                      Description (Chinese)
                      <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-400">Markdown OK</span>
                    </label>
                    <textarea
                      rows={3}
                      value={formConfig.subtitleZh}
                      onChange={(e) => setFormConfig({...formConfig, subtitleZh: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400 bg-white"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                
                {activeField.type !== 'info' && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                      Data Key (Database Column) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={activeField.dataKey}
                      onChange={(e) => updateActiveField({ dataKey: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-slate-500 focus:border-slate-500 bg-white text-slate-900 placeholder-slate-400"
                      required
                    />
                    <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                      This is the exact key your CSV export and Coda database will use.
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                    {activeField.type === 'info' ? 'Block Content' : 'Question Content'}
                  </h3>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Title (English)</label>
                    <input
                      type="text"
                      value={activeField.labelEn}
                      onChange={(e) => updateActiveField({ labelEn: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Title (Chinese)</label>
                    <input
                      type="text"
                      value={activeField.labelZh}
                      onChange={(e) => updateActiveField({ labelZh: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400 bg-white"
                    />
                  </div>
                  <div className="pt-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center justify-between">
                      Description / Hint (English)
                      <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-400">Markdown OK</span>
                    </label>
                    <textarea
                      rows={2}
                      value={activeField.descriptionEn || ''}
                      onChange={(e) => updateActiveField({ descriptionEn: e.target.value })}
                      placeholder="Optional. Use !!text!! for red warning."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center justify-between">
                      Description / Hint (Chinese)
                      <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-400">Markdown OK</span>
                    </label>
                    <textarea
                      rows={2}
                      value={activeField.descriptionZh || ''}
                      onChange={(e) => updateActiveField({ descriptionZh: e.target.value })}
                      placeholder="選填。"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400 bg-white"
                    />
                  </div>
                </div>

                <hr className="border-gray-100" />

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Field Format</label>
                    <div className="relative">
                      <select
                        value={activeField.type}
                        onChange={(e) => {
                          const newType = e.target.value as FieldType;
                          updateActiveField({ 
                            type: newType,
                            dataKey: newType === 'info' ? '' : (activeField.dataKey || `question_${fields.length + 1}`),
                            options: (['select', 'radio', 'checkbox'].includes(newType)) && !activeField.options ? [{ value: 'opt_1', labelEn: 'Option 1', labelZh: '選項 1' }] : activeField.options,
                          });
                        }}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white text-gray-900"
                      >
                        <optgroup label="Text">
                          <option value="text">Short Text</option>
                          <option value="textarea">Long Paragraph</option>
                          <option value="email">Email Address</option>
                          <option value="mobile">Mobile Number</option>
                        </optgroup>
                        <optgroup label="Choices">
                          <option value="select">Dropdown Menu</option>
                          <option value="radio">Single Choice (Radio)</option>
                          <option value="checkbox">Multiple Choice (Checkboxes)</option>
                        </optgroup>
                        <optgroup label="Verification">
                          <option value="applicant_token">Applicant Token (Verify)</option>
                        </optgroup>
                        <optgroup label="Other">
                          <option value="date">Date Picker</option>
                          <option value="file">File Upload</option>
                        </optgroup>
                        <optgroup label="Layout">
                          <option value="info">Informational Text Block</option>
                        </optgroup>
                      </select>
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        {['text', 'email', 'textarea'].includes(activeField.type) ? <Type className="w-4 h-4 text-gray-400" /> : 
                         ['select', 'radio', 'checkbox'].includes(activeField.type) ? <ListOrdered className="w-4 h-4 text-gray-400" /> :
                         activeField.type === 'date' ? <Calendar className="w-4 h-4 text-gray-400" /> :
                         activeField.type === 'file' ? <FileText className="w-4 h-4 text-gray-400" /> :
                         activeField.type === 'applicant_token' ? <KeyRound className="w-4 h-4 text-gray-400" /> :
                         activeField.type === 'info' ? <AlignLeft className="w-4 h-4 text-gray-400" /> :
                         <Smartphone className="w-4 h-4 text-gray-400" />}
                      </div>
                    </div>
                  </div>

                  {hasOptions && (
                    <div className="space-y-3 pt-2">
                      <label className="block text-xs font-medium text-gray-500">Choices Configuration</label>
                      <div className="space-y-3">
                        {activeField.options?.map((opt, index) => (
                          <div key={index} className="flex items-start bg-gray-50 p-3 rounded-lg border border-gray-200 gap-2">
                            <div className="flex flex-col gap-1 justify-center pt-2">
                              <button 
                                onClick={() => moveOption(index, 'up')}
                                disabled={index === 0}
                                className="p-1 text-gray-400 hover:text-indigo-600 disabled:opacity-30 transition-colors"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => moveOption(index, 'down')}
                                disabled={!activeField.options || index === activeField.options.length - 1}
                                className="p-1 text-gray-400 hover:text-indigo-600 disabled:opacity-30 transition-colors"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="flex-1 space-y-2">
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Value <span className="text-red-500">*</span></label>
                                <input
                                  type="text"
                                  value={opt.value}
                                  onChange={(e) => handleUpdateOption(index, 'value', e.target.value)}
                                  placeholder="Data value (e.g., vegan)"
                                  className="w-full px-2 py-1.5 text-xs font-mono border border-gray-300 rounded focus:ring-indigo-500 text-gray-900 placeholder-gray-400 bg-white"
                                  required
                                />
                              </div>
                              <input
                                type="text"
                                value={opt.labelEn}
                                onChange={(e) => handleUpdateOption(index, 'labelEn', e.target.value)}
                                placeholder="English Label"
                                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-indigo-500 text-gray-900 placeholder-gray-400 bg-white"
                              />
                              <input
                                type="text"
                                value={opt.labelZh}
                                onChange={(e) => handleUpdateOption(index, 'labelZh', e.target.value)}
                                placeholder="Chinese Label"
                                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-indigo-500 text-gray-900 placeholder-gray-400 bg-white"
                              />
                            </div>
                            <button 
                              onClick={() => handleRemoveOption(index)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button 
                        onClick={handleAddOption}
                        className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-indigo-600 font-medium text-xs hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
                      >
                        + Add Choice
                      </button>
                    </div>
                  )}

                  {activeField.type !== 'info' && (
                    <div className="flex items-center justify-between py-3 border-y border-gray-100">
                      <div>
                        <span className="text-sm font-medium text-gray-900">Required Field</span>
                        <p className="text-xs text-gray-500">Must be filled out to submit.</p>
                      </div>
                      <button 
                        onClick={() => updateActiveField({ required: !activeField.required })}
                        className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                          activeField.required ? 'bg-indigo-600' : 'bg-gray-200'
                        }`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
                          activeField.required ? 'translate-x-4' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-4 p-4 bg-amber-50/50 border border-amber-200/60 rounded-xl">
                  <div className="flex items-center justify-between">
                     <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wider flex items-center">
                       <GitBranch className="w-4 h-4 mr-2" />
                       Conditional Logic
                     </h3>
                     <button 
                        onClick={() => {
                          if (activeField.condition) updateActiveField({ condition: undefined });
                          else updateActiveField({ condition: { match: 'AND', rules: [{ id: 'rule_1', dependsOn: '', operator: 'equals', value: '' }] } });
                        }}
                        className={`relative inline-flex h-4 w-7 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                          activeField.condition ? 'bg-amber-600' : 'bg-amber-200'
                        }`}
                      >
                        <span className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow transition duration-200 ${
                          activeField.condition ? 'translate-x-3' : 'translate-x-0'
                        }`} />
                      </button>
                  </div>
                  
                  {activeField.condition && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center text-xs font-medium text-amber-800">
                        <span>Show this question if</span>
                        <select
                          value={activeField.condition.match}
                          onChange={(e) => updateActiveField({ condition: { ...activeField.condition!, match: e.target.value as 'AND' | 'OR' } })}
                          className="mx-2 bg-white border border-amber-300 rounded px-2 py-1 focus:ring-amber-500 text-amber-900"
                        >
                          <option value="AND">ALL</option>
                          <option value="OR">ANY</option>
                        </select>
                        <span>of the following match:</span>
                      </div>

                      <div className="space-y-3 border-l-2 border-amber-200 pl-3">
                        {activeField.condition.rules.map((rule, idx) => {
                          const dependentField = previousFields.find(f => f.dataKey === rule.dependsOn);
                          const dependentOptions = dependentField?.options;
                          const showValueDropdown = dependentOptions && dependentOptions.length > 0;
                          
                          const isMultiValueOp = rule.operator === 'contains' || rule.operator === 'not_contains' || rule.operator === 'is_one_of' || rule.operator === 'is_not_one_of';

                          return (
                            <div key={rule.id} className="space-y-2 bg-white p-3 rounded-lg border border-amber-200 shadow-sm relative group/rule">
                              <button 
                                onClick={() => handleRemoveRule(rule.id)}
                                className="absolute -right-2 -top-2 bg-white border border-gray-200 text-gray-400 hover:text-red-500 rounded-full p-0.5 shadow-sm opacity-0 group-hover/rule:opacity-100 transition-opacity"
                              >
                                <X className="w-3 h-3" />
                              </button>
                              
                              <select
                                value={rule.dependsOn}
                                onChange={(e) => handleUpdateRule(rule.id, { dependsOn: e.target.value, value: '' })}
                                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded bg-white focus:ring-amber-500 text-gray-900"
                              >
                                <option value="">Select previous field...</option>
                                {previousFields.map(f => (
                                  <option key={f.id} value={f.dataKey}>
                                    {f.labelEn} (Key: {f.dataKey})
                                  </option>
                                ))}
                              </select>

                              <div className="flex flex-col gap-2">
                                <select
                                  value={rule.operator}
                                  onChange={(e) => handleUpdateRule(rule.id, { operator: e.target.value as LogicOperator, value: '' })}
                                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded bg-white focus:ring-amber-500 text-gray-900"
                                >
                                  <option value="equals">Equals</option>
                                  <option value="not_equals">Does Not Equal</option>
                                  <option value="contains">Contains</option>
                                  <option value="not_contains">Does Not Contain</option>
                                  <option value="is_one_of">Is One Of (Multiple)</option>
                                  <option value="is_not_one_of">Is Not One Of (Multiple)</option>
                                  <option value="is_blank">Is Blank</option>
                                  <option value="is_not_blank">Is Not Blank</option>
                                </select>

                                {rule.operator !== 'is_blank' && rule.operator !== 'is_not_blank' && (
                                  showValueDropdown ? (
                                    isMultiValueOp ? (
                                      <div className="space-y-1 bg-gray-50 p-2 rounded border border-gray-200 max-h-36 overflow-y-auto">
                                        <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Select matching options:</span>
                                        {dependentOptions.map((opt, optIdx) => {
                                          const currentValues = rule.value ? rule.value.split(',').map(s => s.trim()).filter(Boolean) : [];
                                          const isChecked = currentValues.includes(opt.value);
                                          return (
                                            <label key={optIdx} className="flex items-center text-xs text-gray-800 cursor-pointer hover:bg-gray-100 p-1 rounded">
                                              <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={(e) => {
                                                  let updated = [...currentValues];
                                                  if (e.target.checked) {
                                                    updated.push(opt.value);
                                                  } else {
                                                    updated = updated.filter(v => v !== opt.value);
                                                  }
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
                                    ) : (
                                      <select
                                        value={rule.value}
                                        onChange={(e) => handleUpdateRule(rule.id, { value: e.target.value })}
                                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded bg-white focus:ring-amber-500 text-gray-900"
                                      >
                                        <option value="">Select option value...</option>
                                        {dependentOptions.map((opt, optIdx) => (
                                          <option key={optIdx} value={opt.value}>
                                            [{opt.value}] {opt.labelEn || opt.labelZh}
                                          </option>
                                        ))}
                                      </select>
                                    )
                                  ) : (
                                    <input
                                      type="text"
                                      value={rule.value}
                                      onChange={(e) => handleUpdateRule(rule.id, { value: e.target.value })}
                                      placeholder="Value (separate multiple with commas)..."
                                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-amber-500 font-mono text-gray-900 placeholder-gray-400 bg-white"
                                    />
                                  )
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <button 
                        onClick={handleAddRule}
                        className="text-xs font-semibold text-amber-700 hover:text-amber-900 transition-colors flex items-center"
                      >
                        <PlusCircle className="w-3 h-3 mr-1" /> Add Condition
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-8">
                  <button 
                    onClick={() => {
                      setFields(fields.filter(f => f.id !== activeFieldId));
                      setActiveFieldId(null);
                    }}
                    className="flex items-center text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Question
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