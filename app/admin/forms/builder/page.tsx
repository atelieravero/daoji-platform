'use client';

import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Save, 
  GripVertical, 
  Settings2, 
  Type, 
  ListOrdered, 
  PlusCircle,
  Trash2,
  LayoutTemplate,
  X
} from 'lucide-react';

type FieldType = 'text' | 'email' | 'select' | 'radio' | 'textarea';

interface FormField {
  id: string;
  dataKey: string;
  type: FieldType;
  labelEn: string;
  labelZh: string;
  required: boolean;
  optionsEn?: string[];
  optionsZh?: string[];
}

const initialFields: FormField[] = [
  {
    id: 'field_1',
    dataKey: 'full_name',
    type: 'text',
    labelEn: 'Full Legal Name',
    labelZh: '全名',
    required: true,
  },
  {
    id: 'field_2',
    dataKey: 'email_address',
    type: 'email',
    labelEn: 'Email Address',
    labelZh: '電郵地址',
    required: true,
  },
  {
    id: 'field_3',
    dataKey: 'dietary_requirements',
    type: 'select',
    labelEn: 'Dietary Requirements',
    labelZh: '飲食要求',
    required: false,
    optionsEn: ['None', 'Vegetarian', 'Vegan', 'Other'],
    optionsZh: ['無', '素食', '純素', '其他'],
  }
];

export default function FormBuilderPage() {
  const [fields, setFields] = useState<FormField[]>(initialFields);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(initialFields[0].id);

  const activeField = fields.find(f => f.id === activeFieldId);

  const updateActiveField = (updates: Partial<FormField>) => {
    setFields(fields.map(f => f.id === activeFieldId ? { ...f, ...updates } : f));
  };

  const handleAddOption = () => {
    if (!activeField) return;
    const currentEn = activeField.optionsEn || [];
    const currentZh = activeField.optionsZh || [];
    updateActiveField({
      optionsEn: [...currentEn, `Option ${currentEn.length + 1}`],
      optionsZh: [...currentZh, `選項 ${currentZh.length + 1}`]
    });
  };

  const handleUpdateOption = (index: number, lang: 'en' | 'zh', value: string) => {
    if (!activeField) return;
    if (lang === 'en' && activeField.optionsEn) {
      const newOpts = [...activeField.optionsEn];
      newOpts[index] = value;
      updateActiveField({ optionsEn: newOpts });
    } else if (lang === 'zh' && activeField.optionsZh) {
      const newOpts = [...activeField.optionsZh];
      newOpts[index] = value;
      updateActiveField({ optionsZh: newOpts });
    }
  };

  const handleRemoveOption = (index: number) => {
    if (!activeField) return;
    if (activeField.optionsEn && activeField.optionsZh) {
      updateActiveField({
        optionsEn: activeField.optionsEn.filter((_, i) => i !== index),
        optionsZh: activeField.optionsZh.filter((_, i) => i !== index)
      });
    }
  };

  const hasOptions = activeField?.type === 'select' || activeField?.type === 'radio';

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden">
      
      {/* BUILDER HEADER */}
      <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center">
          <a href="/admin/forms" className="p-2 -ml-2 mr-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </a>
          <h1 className="text-lg font-semibold text-gray-900">Standard Retreat Application</h1>
          <select 
            className="ml-4 text-xs font-medium bg-amber-100 text-amber-800 rounded-full px-3 py-1 cursor-pointer focus:ring-2 focus:ring-amber-500 outline-none appearance-none border-0 hover:bg-amber-200 transition-colors"
            defaultValue="draft"
          >
            <option value="draft">Draft (Private)</option>
            <option value="open">Open (Live)</option>
            <option value="closed">Closed (Locked)</option>
          </select>
        </div>
        <div className="flex items-center space-x-3">
          <button className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2">
            Preview
          </button>
          <button className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors">
            <Save className="w-4 h-4 mr-2" />
            Save Schema
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT: LIVE CANVAS */}
        <div className="flex-1 overflow-y-auto p-8 flex justify-center">
          <div className="w-full max-w-2xl">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-8 border-b border-gray-100 bg-indigo-50/30">
                <h2 className="text-2xl font-bold text-gray-900">Application Form Preview</h2>
                <p className="text-gray-500 mt-2 text-sm">This is exactly how the applicant will see the questions.</p>
              </div>
              
              <div className="p-8 space-y-6">
                {fields.map((field) => (
                  <div 
                    key={field.id}
                    onClick={() => setActiveFieldId(field.id)}
                    className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer group ${
                      activeFieldId === field.id 
                        ? 'border-indigo-500 bg-indigo-50/10' 
                        : 'border-transparent hover:border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {/* Drag Handle */}
                    <div className={`absolute -left-3 top-1/2 -translate-y-1/2 p-1 bg-white border border-gray-200 rounded text-gray-400 shadow-sm transition-opacity ${
                      activeFieldId === field.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}>
                      <GripVertical className="w-4 h-4" />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-900">
                        {field.labelEn} <span className="text-gray-400 font-normal ml-1">/ {field.labelZh}</span>
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      
                      {field.type === 'text' || field.type === 'email' ? (
                        <input 
                          type={field.type} 
                          disabled 
                          placeholder="Applicant input..." 
                          className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-sm text-gray-500" 
                        />
                      ) : field.type === 'select' ? (
                        <select disabled className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-sm text-gray-500 appearance-none">
                          <option>Select an option...</option>
                        </select>
                      ) : field.type === 'radio' ? (
                        <div className="space-y-2 mt-3">
                          {field.optionsEn?.map((opt, i) => (
                            <div key={i} className="flex items-center">
                              <input type="radio" disabled className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500" />
                              <label className="ml-3 block text-sm font-medium text-gray-700">
                                {opt} <span className="text-gray-400 font-normal ml-1">/ {field.optionsZh?.[i]}</span>
                              </label>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}

                <button className="w-full py-4 mt-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-medium text-sm hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center justify-center">
                  <PlusCircle className="w-5 h-5 mr-2" />
                  Add Question
                </button>

              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: INSPECTOR PANEL */}
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col shadow-xl z-20">
          <div className="h-14 border-b border-gray-100 flex items-center px-6 bg-gray-50/50 shrink-0">
            <Settings2 className="w-4 h-4 text-gray-500 mr-2" />
            <span className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Field Inspector</span>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {!activeField ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 space-y-3">
                <LayoutTemplate className="w-12 h-12 text-gray-300" />
                <p className="text-sm">Select a question on the canvas to configure its properties.</p>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                
                {/* Data Key */}
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                  <label className="block text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">
                    Data Key (CSV Column)
                  </label>
                  <input
                    type="text"
                    value={activeField.dataKey}
                    onChange={(e) => updateActiveField({ dataKey: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                    className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm font-mono text-amber-900 focus:ring-amber-500 focus:border-amber-500 bg-white"
                  />
                </div>

                <hr className="border-gray-100" />

                {/* Bilingual Labels */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Question Title (English)</label>
                    <input
                      type="text"
                      value={activeField.labelEn}
                      onChange={(e) => updateActiveField({ labelEn: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Question Title (Chinese)</label>
                    <input
                      type="text"
                      value={activeField.labelZh}
                      onChange={(e) => updateActiveField({ labelZh: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Field Settings */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Field Type</label>
                    <div className="relative">
                      <select
                        value={activeField.type}
                        onChange={(e) => updateActiveField({ 
                          type: e.target.value as FieldType,
                          // Initialize options if switching to a choice field
                          optionsEn: (e.target.value === 'select' || e.target.value === 'radio') && !activeField.optionsEn ? ['Option 1'] : activeField.optionsEn,
                          optionsZh: (e.target.value === 'select' || e.target.value === 'radio') && !activeField.optionsZh ? ['選項 1'] : activeField.optionsZh,
                        })}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
                      >
                        <option value="text">Short Text</option>
                        <option value="textarea">Long Paragraph</option>
                        <option value="email">Email Address</option>
                        <option value="select">Dropdown Menu</option>
                        <option value="radio">Single Choice (Radio)</option>
                      </select>
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        {activeField.type === 'text' || activeField.type === 'email' ? <Type className="w-4 h-4 text-gray-400" /> : <ListOrdered className="w-4 h-4 text-gray-400" />}
                      </div>
                    </div>
                  </div>

                  {/* Options Editor (Only for Select/Radio) */}
                  {hasOptions && (
                    <div className="space-y-3 pt-2">
                      <label className="block text-sm font-medium text-gray-900">Choices Configuration</label>
                      <div className="space-y-2">
                        {activeField.optionsEn?.map((opt, index) => (
                          <div key={index} className="flex items-start space-x-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                            <div className="flex-1 space-y-2">
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => handleUpdateOption(index, 'en', e.target.value)}
                                placeholder="English option"
                                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                              />
                              <input
                                type="text"
                                value={activeField.optionsZh?.[index] || ''}
                                onChange={(e) => handleUpdateOption(index, 'zh', e.target.value)}
                                placeholder="Chinese option"
                                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                              />
                            </div>
                            <button 
                              onClick={() => handleRemoveOption(index)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors mt-0.5"
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

                  {/* Required Toggle */}
                  <div className="flex items-center justify-between py-3 border-y border-gray-100">
                    <div>
                      <span className="text-sm font-medium text-gray-900">Required Field</span>
                      <p className="text-xs text-gray-500">Applicant must fill this out to submit.</p>
                    </div>
                    <button 
                      onClick={() => updateActiveField({ required: !activeField.required })}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
                        activeField.required ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        activeField.required ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="pt-4">
                  <button className="flex items-center text-sm font-medium text-red-600 hover:text-red-700 transition-colors">
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