'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PlusCircle, Trash2, LayoutTemplate, Settings2, Loader2 } from 'lucide-react';
import { saveFormSchema, getFormSchema } from './actions';
import MarkdownRenderer from '@/components/shared/MarkdownRenderer';
import MarkdownEditor from '@/components/shared/MarkdownEditor';
import { FormInput, FormSelect } from '@/components/ui/FormControls';
import MediaPicker from '@/components/admin/MediaPicker';
import { AssetRecord } from '@/app/admin/(dashboard)/assets/actions';

import EditorLayout from '@/components/admin/editor/EditorLayout';
import EditorHeader from '@/components/admin/editor/EditorHeader';
import CoverBannerPicker from '@/components/admin/editor/CoverBannerPicker';
import UrlSlugInspector from '@/components/admin/editor/UrlSlugInspector';

import QuestionCanvasItem, { FormField, FieldType } from '@/components/admin/forms/QuestionCanvasItem';
import ChoicesConfigurator, { FieldOption } from '@/components/admin/forms/ChoicesConfigurator';
import ConditionalLogicInspector, { LogicRule } from '@/components/admin/forms/ConditionalLogicInspector';
import SuccessScreenPreview from '@/components/admin/forms/SuccessScreenPreview';

export default function FormBuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center h-full bg-gray-50">
          <div className="flex items-center space-x-2 text-gray-500 text-sm font-medium">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            <span>Loading form builder...</span>
          </div>
        </div>
      }
    >
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
  const [viewMode, setViewMode] = useState<'form' | 'success'>('form');
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  const [formConfig, setFormConfig] = useState({
    internalName: 'Untitled Form',
    slug: '',
    titleEn: 'New Form',
    titleZh: '新表單',
    subtitleEn: '',
    subtitleZh: '',
    eventId: 'evt_1',
    isFollowUp: false,
    status: 'draft',
    interimEventCode: 'OCT26',
    isStandalone: false,
    bannerImageUrl: '',
    successTitleEn: 'Submission Successful',
    successTitleZh: '提交成功',
    successMessageEn: 'Thank you. Your submission has been securely received.\n\n{{TOKEN_BOX}}',
    successMessageZh: '感謝您。我們已安全收到您的提交。\n\n{{TOKEN_BOX}}',
  });

  const [fields, setFields] = useState<FormField[]>([]);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);

  useEffect(() => {
    if (!formIdParam || formIdParam === 'new') return;
    let isMounted = true;
    setIsLoading(true);

    getFormSchema(formIdParam)
      .then((record) => {
        if (!isMounted || !record) return;
        setCurrentFormId(record.id);

        const schema =
          record.schema && typeof record.schema === 'object' && !Array.isArray(record.schema)
            ? (record.schema as Record<string, any>)
            : {};

        setFormConfig({
          internalName: record.title || '',
          slug: record.slug || '',
          eventId: record.event_id || 'evt_1',
          isFollowUp: record.is_followup || false,
          titleEn: schema.titleEn ?? '',
          titleZh: schema.titleZh ?? '',
          subtitleEn: schema.subtitleEn ?? '',
          subtitleZh: schema.subtitleZh ?? '',
          status: schema.status ?? 'draft',
          interimEventCode: schema.interimEventCode ?? 'OCT26',
          isStandalone: schema.isStandalone ?? false,
          bannerImageUrl: schema.bannerImageUrl ?? '',
          successTitleEn: schema.successTitleEn ?? 'Submission Successful',
          successTitleZh: schema.successTitleZh ?? '提交成功',
          successMessageEn: schema.successMessageEn ?? 'Thank you. Your submission has been securely received.\n\n{{TOKEN_BOX}}',
          successMessageZh: schema.successMessageZh ?? '感謝您。我們已安全收到您的提交。\n\n{{TOKEN_BOX}}',
        });
        if (schema.fields && Array.isArray(schema.fields)) setFields(schema.fields);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [formIdParam]);

  const activeField = fields.find((f) => f.id === activeFieldId);
  const activeFieldIndex = fields.findIndex((f) => f.id === activeFieldId);
  const previousFields = fields
    .slice(0, activeFieldIndex > -1 ? activeFieldIndex : 0)
    .filter((f) => f.type !== 'info');

  const updateActiveField = (updates: Partial<FormField>) =>
    setFields(fields.map((f) => (f.id === activeFieldId ? { ...f, ...updates } : f)));

  const moveField = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === fields.length - 1) return;
    const newFields = [...fields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
    setFields(newFields);
  };

  const moveOption = (index: number, direction: 'up' | 'down') => {
    if (!activeField || !activeField.options) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === activeField.options.length - 1) return;
    const newOpts = [...activeField.options];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newOpts[index], newOpts[targetIndex]] = [newOpts[targetIndex], newOpts[index]];
    updateActiveField({ options: newOpts });
  };

  const handleAddQuestion = () => {
    const newId = `field_${Date.now()}`;
    setFields([
      ...fields,
      {
        id: newId,
        dataKey: `question_${fields.length + 1}`,
        type: 'text',
        labelEn: 'New Question',
        labelZh: '新問題',
        required: false,
      },
    ]);
    setActiveFieldId(newId);
  };

  const handleAddOption = () => {
    if (activeField) {
      updateActiveField({
        options: [
          ...(activeField.options || []),
          { value: `opt_${(activeField.options?.length || 0) + 1}`, labelEn: 'Option', labelZh: '選項' },
        ],
      });
    }
  };

  const handleUpdateOption = (index: number, key: keyof FieldOption, value: string) => {
    if (activeField?.options) {
      const newOpts = [...activeField.options];
      newOpts[index] = { ...newOpts[index], [key]: value };
      updateActiveField({ options: newOpts });
    }
  };

  const handleRemoveOption = (index: number) => {
    if (activeField?.options) {
      updateActiveField({ options: activeField.options.filter((_, i) => i !== index) });
    }
  };

  const handleAddRule = () => {
    if (activeField) {
      updateActiveField({
        condition: {
          match: activeField.condition?.match || 'AND',
          rules: [...(activeField.condition?.rules || []), { id: `rule_${Date.now()}`, dependsOn: '', operator: 'equals', value: '' }],
        },
      });
    }
  };

  const handleUpdateRule = (ruleId: string, updates: Partial<LogicRule>) => {
    if (activeField?.condition) {
      updateActiveField({
        condition: {
          ...activeField.condition,
          rules: activeField.condition.rules.map((r) => (r.id === ruleId ? { ...r, ...updates } : r)),
        },
      });
    }
  };

  const handleRemoveRule = (ruleId: string) => {
    if (activeField?.condition) {
      const rem = activeField.condition.rules.filter((r) => r.id !== ruleId);
      updateActiveField({ condition: rem.length ? { ...activeField.condition, rules: rem } : undefined });
    }
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
      alert('Validation Error: Missing Data Keys or Option Values.');
      return;
    }

    setInvalidFieldIds([]);
    setIsSaving(true);

    try {
      const payload = {
        event_id: formConfig.eventId,
        slug: cleanSlug,
        title: formConfig.internalName,
        is_followup: formConfig.isFollowUp,
        schema: {
          titleEn: formConfig.titleEn,
          titleZh: formConfig.titleZh,
          subtitleEn: formConfig.subtitleEn,
          subtitleZh: formConfig.subtitleZh,
          status: formConfig.status,
          interimEventCode: formConfig.interimEventCode.toUpperCase().replace(/[^A-Z0-9]/g, ''),
          isStandalone: formConfig.isStandalone,
          bannerImageUrl: formConfig.bannerImageUrl,
          successTitleEn: formConfig.successTitleEn,
          successTitleZh: formConfig.successTitleZh,
          successMessageEn: formConfig.successMessageEn,
          successMessageZh: formConfig.successMessageZh,
          fields: fields,
        },
      };

      const savedId = await saveFormSchema(payload, currentFormId);
      if (savedId && !currentFormId) {
        setCurrentFormId(savedId);
        window.history.replaceState(null, '', `?id=${savedId}`);
      }
      alert('Form Schema saved successfully!');
    } catch (error: any) {
      if (error.message.includes('duplicate key value violates unique constraint')) {
        alert('Validation Error: This URL Slug is already taken by another form.');
      } else {
        alert('Failed to save Form Schema.');
      }
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
    <>
      <EditorLayout
        header={
          <EditorHeader
            backHref="/admin/forms"
            title={formConfig.internalName}
            codeBadge={formConfig.interimEventCode}
            previewUrl={formConfig.slug ? `/en/form/${formConfig.slug}?test=true` : undefined}
            onSave={handleSave}
            isSaving={isSaving}
            saveLabel="Save Schema"
          />
        }
        canvas={
          <div
            className="flex-1 overflow-y-auto p-8 flex flex-col items-center bg-gray-50/80 cursor-pointer"
            onClick={() => {
              setActiveFieldId(null);
              setViewMode('form');
            }}
          >
            {/* VIEW MODE TABS */}
            <div
              className="bg-white rounded-full p-1 border border-gray-200 shadow-xs flex mb-6 relative z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => {
                  setViewMode('form');
                  setActiveFieldId(null);
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  viewMode === 'form' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Form Questions
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewMode('success');
                  setActiveFieldId(null);
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  viewMode === 'success' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Success Screen
              </button>
            </div>

            <div className="w-full max-w-2xl pb-32" onClick={(e) => e.stopPropagation()}>
              <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
                {formConfig.bannerImageUrl && (
                  <div className="w-full relative group">
                    <img src={formConfig.bannerImageUrl} alt="Banner" className="w-full h-auto max-h-64 object-contain bg-stone-50" />
                    <button
                      type="button"
                      onClick={() => setFormConfig({ ...formConfig, bannerImageUrl: '' })}
                      className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-xs rounded-full text-gray-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-xs cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {viewMode === 'form' ? (
                  <>
                    <div
                      onClick={() => setActiveFieldId(null)}
                      className={`p-8 border-b border-gray-100 cursor-pointer transition-colors ${
                        activeFieldId === null ? 'bg-indigo-50/50 border-indigo-100' : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="mb-4">
                        <h2 className="text-2xl font-bold text-gray-900">{formConfig.titleEn || 'New Form'}</h2>
                        <h3 className="text-lg font-medium text-gray-600 mt-1">{formConfig.titleZh}</h3>
                      </div>
                      {(formConfig.subtitleEn || formConfig.subtitleZh) && (
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                          <MarkdownRenderer content={formConfig.subtitleEn} className="text-sm text-gray-600" />
                          <MarkdownRenderer content={formConfig.subtitleZh} className="text-sm text-gray-600 mt-2" />
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

                      {fields.map((field, idx) => (
                        <QuestionCanvasItem
                          key={field.id}
                          field={field}
                          index={idx}
                          totalFields={fields.length}
                          isActive={activeFieldId === field.id}
                          isInvalid={invalidFieldIds.includes(field.id)}
                          onSelect={() => setActiveFieldId(field.id)}
                          onMove={moveField}
                        />
                      ))}

                      <button
                        type="button"
                        onClick={handleAddQuestion}
                        className="w-full py-4 mt-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-semibold text-sm hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-colors flex items-center justify-center cursor-pointer"
                      >
                        <PlusCircle className="w-5 h-5 mr-2" /> Add Question
                      </button>
                    </div>
                  </>
                ) : (
                  <SuccessScreenPreview
                    titleEn={formConfig.successTitleEn}
                    titleZh={formConfig.successTitleZh}
                    messageEn={formConfig.successMessageEn}
                    messageZh={formConfig.successMessageZh}
                  />
                )}
              </div>
            </div>
          </div>
        }
        inspector={
          <>
            <div className="h-14 border-b border-gray-100 flex items-center px-6 bg-gray-50/50 shrink-0">
              <Settings2 className="w-4 h-4 text-gray-500 mr-2" />
              <span className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                {viewMode === 'success' ? 'Success Config' : activeField ? 'Field Inspector' : 'Form Settings'}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {viewMode === 'success' ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Success Titles</h3>
                    <FormInput
                      label="Title (English)"
                      value={formConfig.successTitleEn}
                      onChange={(e) => setFormConfig({ ...formConfig, successTitleEn: e.target.value })}
                    />
                    <FormInput
                      label="Title (Chinese)"
                      value={formConfig.successTitleZh}
                      onChange={(e) => setFormConfig({ ...formConfig, successTitleZh: e.target.value })}
                    />
                  </div>
                  <hr className="border-gray-100" />
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Success Content</h3>
                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                      <p className="text-xs text-amber-800 font-medium">
                        Use <code className="bg-white px-1 py-0.5 rounded font-bold">{'{{TOKEN_BOX}}'}</code> exactly as written to place the Applicant Token card inside your message.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-950 mb-1.5">Message (English)</label>
                      <MarkdownEditor
                        value={formConfig.successMessageEn}
                        onChange={(val) => setFormConfig({ ...formConfig, successMessageEn: val })}
                        rows={6}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-950 mb-1.5">Message (Chinese)</label>
                      <MarkdownEditor
                        value={formConfig.successMessageZh}
                        onChange={(val) => setFormConfig({ ...formConfig, successMessageZh: val })}
                        rows={6}
                      />
                    </div>
                  </div>
                </div>
              ) : !activeField ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <CoverBannerPicker
                    bannerUrl={formConfig.bannerImageUrl || null}
                    onOpenPicker={() => setIsMediaPickerOpen(true)}
                    onRemoveBanner={() => setFormConfig({ ...formConfig, bannerImageUrl: '' })}
                  />

                  <hr className="border-gray-100" />
                  <div className="space-y-4">
                    <FormInput
                      label="Internal Reference Name"
                      helperText="Only visible to your admin team in the dashboard."
                      value={formConfig.internalName}
                      onChange={(e) => setFormConfig({ ...formConfig, internalName: e.target.value })}
                    />

                    <UrlSlugInspector
                      slug={formConfig.slug}
                      onChange={(cleanSlug) => setFormConfig({ ...formConfig, slug: cleanSlug })}
                      pathPrefix="/form/"
                      helperText="The public web address (e.g., /en/form/summer-retreat)."
                      required
                    />

                    <FormSelect
                      label="Linked Event"
                      value={formConfig.eventId}
                      onChange={(e) => setFormConfig({ ...formConfig, eventId: e.target.value })}
                    >
                      <option value="evt_1">7-Day Silent Zen Retreat</option>
                      <option value="evt_2">Weekly Wednesday Wisdom</option>
                    </FormSelect>

                    <FormInput
                      label="Interim Event Code (Prefix)"
                      helperText="Applicants will get tokens like [PREFIX]-A4X9-P2M8"
                      maxLength={8}
                      value={formConfig.interimEventCode}
                      onChange={(e) =>
                        setFormConfig({
                          ...formConfig,
                          interimEventCode: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''),
                        })
                      }
                      className="font-mono uppercase"
                      placeholder="e.g., ZEN26"
                    />

                    <div className="flex items-center justify-between py-3 border-y border-gray-100 mt-4">
                      <div>
                        <span className="text-sm font-bold text-gray-900">Follow-up Form</span>
                        <p className="text-[11px] text-gray-500 leading-tight mt-1">
                          Requires an existing applicant<br />magic token via URL to access.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormConfig({ ...formConfig, isFollowUp: !formConfig.isFollowUp })}
                        className={`relative inline-flex h-5 w-9 rounded-full transition-colors cursor-pointer ${
                          formConfig.isFollowUp ? 'bg-indigo-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                            formConfig.isFollowUp ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <div>
                        <span className="text-sm font-bold text-gray-900">Standalone Form</span>
                        <p className="text-[11px] text-gray-500 leading-tight mt-1">
                          Hides the website navigation & footer<br />for a focused landing page.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormConfig({ ...formConfig, isStandalone: !formConfig.isStandalone })}
                        className={`relative inline-flex h-5 w-9 rounded-full transition-colors cursor-pointer ${
                          formConfig.isStandalone ? 'bg-indigo-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                            formConfig.isStandalone ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Public Presentation</h3>
                    <FormInput
                      label="Public Title (English)"
                      value={formConfig.titleEn}
                      onChange={(e) => setFormConfig({ ...formConfig, titleEn: e.target.value })}
                    />
                    <FormInput
                      label="Public Title (Chinese)"
                      value={formConfig.titleZh}
                      onChange={(e) => setFormConfig({ ...formConfig, titleZh: e.target.value })}
                    />
                    <div>
                      <label className="block text-sm font-semibold text-gray-950 mb-1.5">Description (English)</label>
                      <MarkdownEditor
                        value={formConfig.subtitleEn}
                        onChange={(val) => setFormConfig({ ...formConfig, subtitleEn: val })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-950 mb-1.5">Description (Chinese)</label>
                      <MarkdownEditor
                        value={formConfig.subtitleZh}
                        onChange={(val) => setFormConfig({ ...formConfig, subtitleZh: val })}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                  {activeField.type !== 'info' && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <FormInput
                        label="Data Key (Database Column)"
                        value={activeField.dataKey}
                        onChange={(e) => updateActiveField({ dataKey: e.target.value })}
                        required
                        className="font-mono"
                        helperText="This is the exact key your CSV export and database will use."
                      />
                    </div>
                  )}

                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                      {activeField.type === 'info' ? 'Block Content' : 'Question Content'}
                    </h3>
                    <FormInput
                      label="Title (English)"
                      value={activeField.labelEn}
                      onChange={(e) => updateActiveField({ labelEn: e.target.value })}
                    />
                    <FormInput
                      label="Title (Chinese)"
                      value={activeField.labelZh}
                      onChange={(e) => updateActiveField({ labelZh: e.target.value })}
                    />
                    <div className="pt-2">
                      <label className="block text-sm font-semibold text-gray-950 mb-1.5">
                        Description / Hint (English)
                      </label>
                      <MarkdownEditor
                        rows={2}
                        value={activeField.descriptionEn || ''}
                        onChange={(val) => updateActiveField({ descriptionEn: val })}
                        placeholder="Optional. Use !!text!! for red warning."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-950 mb-1.5">
                        Description / Hint (Chinese)
                      </label>
                      <MarkdownEditor
                        rows={2}
                        value={activeField.descriptionZh || ''}
                        onChange={(val) => updateActiveField({ descriptionZh: val })}
                        placeholder="選填。"
                      />
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  <div className="space-y-4">
                    <FormSelect
                      label="Field Format"
                      value={activeField.type}
                      onChange={(e) => {
                        const newType = e.target.value as FieldType;
                        updateActiveField({
                          type: newType,
                          dataKey: newType === 'info' ? '' : activeField.dataKey || `question_${fields.length + 1}`,
                          options:
                            ['select', 'radio', 'checkbox'].includes(newType) && !activeField.options
                              ? [{ value: 'opt_1', labelEn: 'Option 1', labelZh: '選項 1' }]
                              : activeField.options,
                        });
                      }}
                      icon={Settings2}
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
                        <option value="time">Time</option>
                        <option value="file">File Upload</option>
                      </optgroup>
                      <optgroup label="Layout">
                        <option value="info">Informational Text Block</option>
                      </optgroup>
                    </FormSelect>

                    {hasOptions && (
                      <ChoicesConfigurator
                        options={activeField.options}
                        onAddOption={handleAddOption}
                        onUpdateOption={handleUpdateOption}
                        onRemoveOption={handleRemoveOption}
                        onMoveOption={moveOption}
                      />
                    )}

                    {activeField.type !== 'info' && (
                      <div className="flex items-center justify-between py-3 border-y border-gray-100">
                        <div>
                          <span className="text-sm font-medium text-gray-900">Required Field</span>
                          <p className="text-xs text-gray-500">Must be filled out to submit.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => updateActiveField({ required: !activeField.required })}
                          className={`relative inline-flex h-5 w-9 rounded-full transition-colors cursor-pointer ${
                            activeField.required ? 'bg-indigo-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                              activeField.required ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    )}
                  </div>

                  <ConditionalLogicInspector
                    condition={activeField.condition}
                    previousFields={previousFields}
                    onToggleCondition={() => {
                      if (activeField.condition) updateActiveField({ condition: undefined });
                      else
                        updateActiveField({
                          condition: {
                            match: 'AND',
                            rules: [{ id: `rule_${Date.now()}`, dependsOn: '', operator: 'equals', value: '' }],
                          },
                        });
                    }}
                    onChangeMatch={(match) =>
                      updateActiveField({ condition: { ...activeField.condition!, match } })
                    }
                    onAddRule={handleAddRule}
                    onUpdateRule={handleUpdateRule}
                    onRemoveRule={handleRemoveRule}
                  />

                  <div className="pt-8">
                    <button
                      type="button"
                      onClick={() => {
                        setFields(fields.filter((f) => f.id !== activeFieldId));
                        setActiveFieldId(null);
                      }}
                      className="flex items-center text-sm font-medium text-red-600 hover:text-red-700 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Delete Question
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        }
      />

      <MediaPicker
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={(asset: AssetRecord) => setFormConfig({ ...formConfig, bannerImageUrl: asset.file_url })}
        allowedCategory="image"
        title="Select Cover Banner"
      />
    </>
  );
}