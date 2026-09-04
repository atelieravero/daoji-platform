'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PlusCircle, Trash2, LayoutTemplate, Settings2, Loader2, Lock, AlertTriangle } from 'lucide-react';
import { saveFormSchema, getFormSchema, getEventsForFormBuilder, FormEventOption } from './actions';
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

interface BuilderClientProps {
  canEditPermission?: boolean;
}

export default function FormBuilderPage({ canEditPermission = false }: BuilderClientProps) {
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
      <FormBuilderContent canEditPermission={canEditPermission} />
    </Suspense>
  );
}

function FormBuilderContent({ canEditPermission = false }: BuilderClientProps) {
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

  // Real Database Events List
  const [availableEvents, setAvailableEvents] = useState<FormEventOption[]>([]);

  const [formConfig, setFormConfig] = useState({
    internalName: 'Untitled Form',
    slug: '',
    titleEn: 'New Form',
    titleZh: '新表單',
    subtitleEn: '',
    subtitleZh: '',
    eventId: '',
    isFollowUp: false,
    status: 'draft',
    interimEventCode: '',
    isStandalone: false,
    bannerImageUrl: '',
    successTitleEn: 'Submission Successful',
    successTitleZh: '提交成功',
    successMessageEn: 'Thank you. Your submission has been securely received.\n\n{{TOKEN_BOX}}',
    successMessageZh: '感謝您。我們已安全收到您的提交。\n\n{{TOKEN_BOX}}',
  });

  const [fields, setFields] = useState<FormField[]>([]);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);

  // READ-ONLY LOCK: Locked if user lacks edit permissions OR if form is already open/closed
  const isReadOnly = !canEditPermission || formConfig.status !== 'draft';

  // Load Real Events
  useEffect(() => {
    getEventsForFormBuilder().then((events) => {
      setAvailableEvents(events);
    });
  }, []);

  // Load Form Data
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
          eventId: record.event_id || '',
          isFollowUp: record.is_followup || false,
          titleEn: schema.titleEn ?? '',
          titleZh: schema.titleZh ?? '',
          subtitleEn: schema.subtitleEn ?? '',
          subtitleZh: schema.subtitleZh ?? '',
          status: record.status || schema.status || 'draft',
          interimEventCode: schema.interimEventCode ?? schema.eventCode ?? '',
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

  const selectedEvent = availableEvents.find((e) => e.id === formConfig.eventId);
  const effectiveEventCode = selectedEvent?.code || formConfig.interimEventCode || '';

  const activeField = fields.find((f) => f.id === activeFieldId);
  const activeFieldIndex = fields.findIndex((f) => f.id === activeFieldId);
  const previousFields = fields
    .slice(0, activeFieldIndex > -1 ? activeFieldIndex : 0)
    .filter((f) => f.type !== 'info');

  const updateActiveField = (updates: Partial<FormField>) => {
    if (isReadOnly) return;
    setFields(fields.map((f) => (f.id === activeFieldId ? { ...f, ...updates } : f)));
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    if (isReadOnly) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === fields.length - 1) return;
    const newFields = [...fields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
    setFields(newFields);
  };

  const moveOption = (index: number, direction: 'up' | 'down') => {
    if (isReadOnly || !activeField || !activeField.options) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === activeField.options.length - 1) return;
    const newOpts = [...activeField.options];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newOpts[index], newOpts[targetIndex]] = [newOpts[targetIndex], newOpts[index]];
    updateActiveField({ options: newOpts });
  };

  const handleAddQuestion = () => {
    if (isReadOnly) return;
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
    if (isReadOnly || !activeField) return;
    updateActiveField({
      options: [
        ...(activeField.options || []),
        { value: `opt_${(activeField.options?.length || 0) + 1}`, labelEn: 'Option', labelZh: '選項' },
      ],
    });
  };

  const handleUpdateOption = (index: number, key: keyof FieldOption, value: string) => {
    if (isReadOnly || !activeField?.options) return;
    const newOpts = [...activeField.options];
    newOpts[index] = { ...newOpts[index], [key]: value };
    updateActiveField({ options: newOpts });
  };

  const handleRemoveOption = (index: number) => {
    if (isReadOnly || !activeField?.options) return;
    updateActiveField({ options: activeField.options.filter((_, i) => i !== index) });
  };

  const handleAddRule = () => {
    if (isReadOnly || !activeField) return;
    updateActiveField({
      condition: {
        match: activeField.condition?.match || 'AND',
        rules: [...(activeField.condition?.rules || []), { id: `rule_${Date.now()}`, dependsOn: '', operator: 'equals', value: '' }],
      },
    });
  };

  const handleUpdateRule = (ruleId: string, updates: Partial<LogicRule>) => {
    if (isReadOnly || !activeField?.condition) return;
    updateActiveField({
      condition: {
        ...activeField.condition,
        rules: activeField.condition.rules.map((r) => (r.id === ruleId ? { ...r, ...updates } : r)),
      },
    });
  };

  const handleRemoveRule = (ruleId: string) => {
    if (isReadOnly || !activeField?.condition) return;
    const rem = activeField.condition.rules.filter((r) => r.id !== ruleId);
    updateActiveField({ condition: rem.length ? { ...activeField.condition, rules: rem } : undefined });
  };

  const handleSave = async () => {
    if (isReadOnly) {
      alert('Action blocked: Form schema is in read-only mode.');
      return;
    }

    if (!formConfig.slug || formConfig.slug.trim() === '') {
      alert('Validation Error: URL Slug is required.');
      return;
    }

    if (!formConfig.eventId) {
      alert('Validation Error: Please select an event to link to this form.');
      return;
    }

    const cleanSlug = formConfig.slug
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9\-_.~+%]/g, '')
      .replace(/^-|-$/g, '');

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
      const eventCodeToSave = selectedEvent?.code || formConfig.interimEventCode.toUpperCase().replace(/[^A-Z0-9]/g, '');

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
          interimEventCode: eventCodeToSave,
          eventCode: eventCodeToSave,
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
        alert(error.message || 'Failed to save Form Schema.');
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
            codeBadge={effectiveEventCode || undefined}
            previewUrl={formConfig.slug ? `/en/form/${formConfig.slug}?test=true` : undefined}
            onSave={handleSave}
            disabled={isReadOnly}
            isSaving={isSaving}
            saveLabel={
              isReadOnly
                ? formConfig.status !== 'draft'
                  ? `Locked (${formConfig.status.toUpperCase()})`
                  : 'View Only'
                : 'Save Schema'
            }
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
            {/* READ-ONLY BANNER NOTICE */}
            {isReadOnly && (
              <div className="w-full max-w-2xl mb-5 p-3.5 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-center gap-3 text-amber-900 shadow-xs animate-in fade-in">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <div className="text-xs leading-relaxed">
                  <span className="font-bold block">
                    Read-Only Mode {formConfig.status !== 'draft' ? `(${formConfig.status.toUpperCase()})` : '(Viewing Schema)'}
                  </span>
                  {formConfig.status !== 'draft'
                    ? 'Modifications are locked to protect live submission schema. Revert the form status to Draft in the Forms Manager to make changes.'
                    : 'You have read-only access to view this schema. Saving changes requires the Form Editor permission.'}
                </div>
              </div>
            )}

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
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => setFormConfig({ ...formConfig, bannerImageUrl: '' })}
                        className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-xs rounded-full text-gray-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-xs cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
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
                          <p className="text-xs text-gray-500">
                            {isReadOnly ? 'No questions in this form.' : 'Click the button below to add your first question.'}
                          </p>
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

                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={handleAddQuestion}
                          className="w-full py-4 mt-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-semibold text-sm hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-colors flex items-center justify-center cursor-pointer"
                        >
                          <PlusCircle className="w-5 h-5 mr-2" /> Add Question
                        </button>
                      )}
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
            <div className="h-14 border-b border-gray-100 flex items-center justify-between px-6 bg-gray-50/50 shrink-0">
              <div className="flex items-center">
                <Settings2 className="w-4 h-4 text-gray-500 mr-2" />
                <span className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  {viewMode === 'success' ? 'Success Config' : activeField ? 'Field Inspector' : 'Form Settings'}
                </span>
              </div>
              {isReadOnly && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100/70 border border-amber-200 px-2 py-0.5 rounded-md">
                  <Lock className="w-3 h-3" /> Read Only
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {viewMode === 'success' ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Success Titles</h3>
                    <FormInput
                      label="Title (English)"
                      value={formConfig.successTitleEn}
                      disabled={isReadOnly}
                      onChange={(e) => setFormConfig({ ...formConfig, successTitleEn: e.target.value })}
                    />
                    <FormInput
                      label="Title (Chinese)"
                      value={formConfig.successTitleZh}
                      disabled={isReadOnly}
                      onChange={(e) => setFormConfig({ ...formConfig, successTitleZh: e.target.value })}
                    />
                  </div>
                  <hr className="border-gray-100" />
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Success Content</h3>
                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                      <p className="text-xs text-amber-800 font-medium">
                        Use <code className="bg-white px-1 py-0.5 rounded font-bold">{'{{TOKEN_BOX}}'}</code> exactly as written to place the Applicant Token card inside your message. If omitted, no token card will be displayed.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-950 mb-1.5">Message (English)</label>
                      <MarkdownEditor
                        value={formConfig.successMessageEn}
                        onChange={(val) => !isReadOnly && setFormConfig({ ...formConfig, successMessageEn: val })}
                        rows={6}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-950 mb-1.5">Message (Chinese)</label>
                      <MarkdownEditor
                        value={formConfig.successMessageZh}
                        onChange={(val) => !isReadOnly && setFormConfig({ ...formConfig, successMessageZh: val })}
                        rows={6}
                      />
                    </div>
                  </div>
                </div>
              ) : !activeField ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <CoverBannerPicker
                    bannerUrl={formConfig.bannerImageUrl || null}
                    disabled={isReadOnly}
                    onOpenPicker={() => setIsMediaPickerOpen(true)}
                    onRemoveBanner={() => setFormConfig({ ...formConfig, bannerImageUrl: '' })}
                  />

                  <hr className="border-gray-100" />
                  <div className="space-y-4">
                    <FormInput
                      label="Internal Reference Name"
                      helperText="Only visible to your admin team in the dashboard."
                      value={formConfig.internalName}
                      disabled={isReadOnly}
                      onChange={(e) => setFormConfig({ ...formConfig, internalName: e.target.value })}
                    />

                    <UrlSlugInspector
                      slug={formConfig.slug}
                      disabled={isReadOnly}
                      onChange={(cleanSlug) => setFormConfig({ ...formConfig, slug: cleanSlug })}
                      pathPrefix="/form/"
                      helperText="Legitimate characters: letters, numbers, -, _, ., +, %, ~"
                      required
                    />

                    {/* MANDATORY EVENT SELECTOR */}
                    <div className="space-y-2">
                      <FormSelect
                        label="Linked Event *"
                        value={formConfig.eventId}
                        disabled={isReadOnly}
                        onChange={(e) => {
                          const newEventId = e.target.value;
                          const evt = availableEvents.find((item) => item.id === newEventId);
                          setFormConfig({
                            ...formConfig,
                            eventId: newEventId,
                            interimEventCode: evt?.code || '',
                          });
                        }}
                        required
                      >
                        <option value="">-- Choose Linked Event * --</option>
                        {availableEvents.map((evt) => (
                          <option key={evt.id} value={evt.id}>
                            {evt.title_zh} {evt.code ? `[${evt.code}]` : ''} ({evt.status})
                          </option>
                        ))}
                      </FormSelect>

                      {selectedEvent && (
                        <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100 flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-gray-900 block">Event Code Namespace</span>
                            <span className="text-[11px] text-gray-500">
                              Tokens generated: <code className="font-bold text-indigo-700 font-mono">[{selectedEvent.code || 'NO-CODE'}]-XXXX-XXXX</code>
                            </span>
                          </div>
                          <span className="px-2 py-1 bg-white font-mono font-bold text-indigo-600 rounded-md border border-indigo-200 text-xs shadow-2xs">
                            {selectedEvent.code || 'None'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between py-3 border-y border-gray-100 mt-4">
                      <div>
                        <span className="text-sm font-bold text-gray-900">Follow-up Form</span>
                        <p className="text-[11px] text-gray-500 leading-tight mt-1">
                          Requires an existing applicant<br />magic token via URL to access.
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={isReadOnly}
                        onClick={() => setFormConfig({ ...formConfig, isFollowUp: !formConfig.isFollowUp })}
                        className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${
                          isReadOnly ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                        } ${formConfig.isFollowUp ? 'bg-indigo-600' : 'bg-gray-200'}`}
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
                        disabled={isReadOnly}
                        onClick={() => setFormConfig({ ...formConfig, isStandalone: !formConfig.isStandalone })}
                        className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${
                          isReadOnly ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                        } ${formConfig.isStandalone ? 'bg-indigo-600' : 'bg-gray-200'}`}
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
                      disabled={isReadOnly}
                      onChange={(e) => setFormConfig({ ...formConfig, titleEn: e.target.value })}
                    />
                    <FormInput
                      label="Public Title (Chinese)"
                      value={formConfig.titleZh}
                      disabled={isReadOnly}
                      onChange={(e) => setFormConfig({ ...formConfig, titleZh: e.target.value })}
                    />
                    <div>
                      <label className="block text-sm font-semibold text-gray-950 mb-1.5">Description (English)</label>
                      <MarkdownEditor
                        value={formConfig.subtitleEn}
                        onChange={(val) => !isReadOnly && setFormConfig({ ...formConfig, subtitleEn: val })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-950 mb-1.5">Description (Chinese)</label>
                      <MarkdownEditor
                        value={formConfig.subtitleZh}
                        onChange={(val) => !isReadOnly && setFormConfig({ ...formConfig, subtitleZh: val })}
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
                        disabled={isReadOnly}
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
                      disabled={isReadOnly}
                      onChange={(e) => updateActiveField({ labelEn: e.target.value })}
                    />
                    <FormInput
                      label="Title (Chinese)"
                      value={activeField.labelZh}
                      disabled={isReadOnly}
                      onChange={(e) => updateActiveField({ labelZh: e.target.value })}
                    />
                    <div className="pt-2">
                      <label className="block text-sm font-semibold text-gray-950 mb-1.5">
                        Description / Hint (English)
                      </label>
                      <MarkdownEditor
                        rows={2}
                        value={activeField.descriptionEn || ''}
                        onChange={(val) => !isReadOnly && updateActiveField({ descriptionEn: val })}
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
                        onChange={(val) => !isReadOnly && updateActiveField({ descriptionZh: val })}
                        placeholder="選填。"
                      />
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  <div className="space-y-4">
                    <FormSelect
                      label="Field Format"
                      value={activeField.type}
                      disabled={isReadOnly}
                      onChange={(e) => {
                        const newType = e.target.value as FieldType;
                        updateActiveField({
                          type: newType,
                          dataKey: newType === 'info' ? '' : activeField.dataKey || `question_${fields.length + 1}`,
                          decimals: newType === 'number' ? 2 : undefined,
                          options:
                            ['select', 'radio', 'checkbox'].includes(newType) && !activeField.options
                              ? [{ value: 'opt_1', labelEn: 'Option 1', labelZh: '選項 1' }]
                              : activeField.options,
                        });
                      }}
                      icon={Settings2}
                    >
                      <optgroup label="Text & Numbers">
                        <option value="text">Short Text</option>
                        <option value="number">Number / Amount (數字 / 金額)</option>
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
                    
                    {/* NUMBER CONFIGURATION INSPECTOR */}
                    {activeField.type === 'number' && (
                      <div className="p-4 bg-blue-50/60 border border-blue-200/80 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-blue-950 uppercase tracking-wider">Number Settings</span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2">
                          <FormInput
                            label="Decimals"
                            type="number"
                            min={0}
                            max={6}
                            disabled={isReadOnly}
                            placeholder="e.g. 2"
                            value={activeField.decimals !== undefined ? String(activeField.decimals) : '2'}
                            onChange={(e) => {
                              const val = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
                              updateActiveField({ decimals: isNaN(val as number) ? undefined : val });
                            }}
                            helperText="0 = Integer, 2 = $0.00"
                          />
                          <FormInput
                            label="Min Value"
                            type="number"
                            disabled={isReadOnly}
                            placeholder="No min"
                            value={activeField.min !== undefined ? String(activeField.min) : ''}
                            onChange={(e) => {
                              const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                              updateActiveField({ min: isNaN(val as number) ? undefined : val });
                            }}
                          />
                          <FormInput
                            label="Max Value"
                            type="number"
                            disabled={isReadOnly}
                            placeholder="No max"
                            value={activeField.max !== undefined ? String(activeField.max) : ''}
                            onChange={(e) => {
                              const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                              updateActiveField({ max: isNaN(val as number) ? undefined : val });
                            }}
                          />
                        </div>
                      </div>
                    )}

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
                          disabled={isReadOnly}
                          onClick={() => updateActiveField({ required: !activeField.required })}
                          className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${
                            isReadOnly ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                          } ${activeField.required ? 'bg-indigo-600' : 'bg-gray-200'}`}
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
                      if (isReadOnly) return;
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
                      !isReadOnly && updateActiveField({ condition: { ...activeField.condition!, match } })
                    }
                    onAddRule={handleAddRule}
                    onUpdateRule={handleUpdateRule}
                    onRemoveRule={handleRemoveRule}
                  />

                  {!isReadOnly && (
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
                  )}
                </div>
              )}
            </div>
          </>
        }
      />

      {/* MEDIA PICKER MODAL */}
      <MediaPicker
        isOpen={isMediaPickerOpen && !isReadOnly}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={(asset: AssetRecord) => setFormConfig({ ...formConfig, bannerImageUrl: asset.file_url })}
        allowedCategory="image"
        title="Select Cover Banner from Media Pool"
      />
    </>
  );
}