// components/admin/forms/StatusConfigModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Loader2,
  ClipboardCheck,
  ExternalLink,
} from 'lucide-react';
import MarkdownEditor from '@/components/shared/MarkdownEditor';
import {
  FormStatusConfig,
  StatusFieldConfig,
  StatusOptionConfig,
  STATUS_TONE_OPTIONS,
  getStatusToneStyle,
  normalizeStatusConfig,
} from '@/lib/status-inquiry';

interface StatusConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialConfig: FormStatusConfig;
  formSlug?: string | null;
  onSave: (newConfig: FormStatusConfig) => Promise<void>;
}

export default function StatusConfigModal({
  isOpen,
  onClose,
  initialConfig,
  formSlug,
  onSave,
}: StatusConfigModalProps) {
  const [config, setConfig] = useState<FormStatusConfig>(() =>
    normalizeStatusConfig(initialConfig)
  );
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const normalized = normalizeStatusConfig(initialConfig);
      setConfig(normalized);
      setActiveFieldId(normalized.fields[0]?.id || null);
    }
  }, [isOpen, initialConfig]);

  if (!isOpen) return null;

  const activeFieldIndex = config.fields.findIndex((f) => f.id === activeFieldId);
  const activeField = activeFieldIndex > -1 ? config.fields[activeFieldIndex] : null;

  const updateActiveField = (updates: Partial<StatusFieldConfig>) => {
    if (!activeField) return;
    setConfig((prev) => ({
      ...prev,
      fields: prev.fields.map((f) => (f.id === activeField.id ? { ...f, ...updates } : f)),
    }));
  };

  const handleAddField = () => {
    const newId = `sf_${Date.now()}`;
    const nextIndex = config.fields.length + 1;
    const newField: StatusFieldConfig = {
      id: newId,
      key: `status_${nextIndex}`,
      labelZh: `狀態項目 ${nextIndex}`,
      labelEn: `Status Field ${nextIndex}`,
      defaultValue: '',
      options: [
        {
          value: 'pending',
          labelZh: '處理中',
          labelEn: 'Pending',
          tone: 'warning',
          instructionZh: '',
          instructionEn: '',
        },
        {
          value: 'confirmed',
          labelZh: '已確認',
          labelEn: 'Confirmed',
          tone: 'success',
          instructionZh: '',
          instructionEn: '',
        },
      ],
    };
    setConfig((prev) => ({ ...prev, fields: [...prev.fields, newField] }));
    setActiveFieldId(newId);
  };

  const handleRemoveField = (id: string) => {
    const remaining = config.fields.filter((f) => f.id !== id);
    setConfig((prev) => ({ ...prev, fields: remaining }));
    if (activeFieldId === id) {
      setActiveFieldId(remaining[0]?.id || null);
    }
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === config.fields.length - 1) return;
    const next = [...config.fields];
    const target = direction === 'up' ? index - 1 : index + 1;
    [next[index], next[target]] = [next[target], next[index]];
    setConfig((prev) => ({ ...prev, fields: next }));
  };

  const handleAddOption = () => {
    if (!activeField) return;
    const nextIndex = activeField.options.length + 1;
    const newOpt: StatusOptionConfig = {
      value: `opt_${nextIndex}`,
      labelZh: `選項 ${nextIndex}`,
      labelEn: `Option ${nextIndex}`,
      tone: 'neutral',
      instructionZh: '',
      instructionEn: '',
    };
    updateActiveField({ options: [...activeField.options, newOpt] });
  };

  const handleUpdateOption = (
    optIndex: number,
    updates: Partial<StatusOptionConfig>
  ) => {
    if (!activeField) return;
    const nextOpts = activeField.options.map((opt, idx) =>
      idx === optIndex ? { ...opt, ...updates } : opt
    );
    updateActiveField({ options: nextOpts });
  };

  const handleRemoveOption = (optIndex: number) => {
    if (!activeField) return;
    const removedVal = activeField.options[optIndex]?.value;
    const nextOpts = activeField.options.filter((_, idx) => idx !== optIndex);
    updateActiveField({
      options: nextOpts,
      defaultValue:
        activeField.defaultValue === removedVal ? '' : activeField.defaultValue,
    });
  };

  const moveOption = (optIndex: number, direction: 'up' | 'down') => {
    if (!activeField) return;
    if (direction === 'up' && optIndex === 0) return;
    if (direction === 'down' && optIndex === activeField.options.length - 1) return;
    const nextOpts = [...activeField.options];
    const target = direction === 'up' ? optIndex - 1 : optIndex + 1;
    [nextOpts[optIndex], nextOpts[target]] = [nextOpts[target], nextOpts[optIndex]];
    updateActiveField({ options: nextOpts });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(config);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to save configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Application Status Inquiry Configuration
              </h2>
              <p className="text-xs text-gray-500">
                Configure status checkpoints and follow-up instructions for applicants.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {formSlug && config.enabled && (
              <a
                href={`/zh/form/${formSlug}/status`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
              >
                <span>Open Public Inquiry Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TOP BAR: ENABLE TOGGLE & OPTIONAL INTRO */}
        <div className="px-6 py-3.5 bg-indigo-50/40 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setConfig((prev) => ({ ...prev, enabled: !prev.enabled }))}
              className={`relative inline-flex h-6 w-11 rounded-full transition-colors cursor-pointer ${
                config.enabled ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition mt-0.5 ${
                  config.enabled ? 'translate-x-5.5' : 'translate-x-0.5'
                }`}
              />
            </button>
            <div>
              <span className="text-sm font-bold text-gray-900 block">
                Enable Public Status Inquiry
              </span>
              <span className="text-xs text-gray-500">
                When enabled, applicants can check their status via token or Name + Mobile, and a link appears beneath the Event Register button.
              </span>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg text-xs text-amber-900">
            Tip: Use{' '}
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText('{{TOKEN}}')}
              className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-amber-300 hover:border-indigo-400 cursor-pointer"
              title="Click to copy {{TOKEN}}"
            >
              {'{{TOKEN}}'}
            </button>{' '}
            in option instructions to auto-fill the applicant&apos;s token in follow-up form URLs.
          </div>
        </div>

        {/* BODY: 2-PANE SPLIT */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12">
          {/* LEFT SIDEBAR: STATUS FIELDS LIST */}
          <div className="md:col-span-4 border-r border-gray-200 bg-gray-50/60 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Status Checkpoints ({config.fields.length})
              </span>
              <button
                type="button"
                onClick={handleAddField}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Field
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {config.fields.length === 0 ? (
                <div className="text-center py-10 px-4 text-xs text-gray-400">
                  No status fields configured yet. Click &ldquo;Add Field&rdquo; to create your first checkpoint (e.g. Application Status, Fees Paid).
                </div>
              ) : (
                config.fields.map((field, idx) => {
                  const isSelected = field.id === activeFieldId;
                  return (
                    <div
                      key={field.id}
                      onClick={() => setActiveFieldId(field.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-white border-indigo-500 shadow-xs ring-2 ring-indigo-500/10'
                          : 'bg-white/70 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-gray-900 truncate">
                          {field.labelZh || field.labelEn || '(Untitled)'}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {field.labelEn} ·{' '}
                          <span className="font-mono text-[11px] text-indigo-600">
                            {field.key}
                          </span>
                        </div>
                      </div>

                      <div
                        className="flex items-center gap-1 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveField(idx, 'up')}
                          className="p-1 text-gray-400 hover:text-indigo-600 disabled:opacity-30 cursor-pointer"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === config.fields.length - 1}
                          onClick={() => moveField(idx, 'down')}
                          className="p-1 text-gray-400 hover:text-indigo-600 disabled:opacity-30 cursor-pointer"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveField(field.id)}
                          className="p-1 text-gray-400 hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT PANE: ACTIVE FIELD & OPTIONS EDITOR */}
          <div className="md:col-span-8 overflow-y-auto p-6 space-y-6">
            {!activeField ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-400">
                Select or add a status checkpoint on the left to configure its options and instructions.
              </div>
            ) : (
              <>
                {/* FIELD METADATA */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Field Key (Column ID) *
                      </label>
                      <input
                        type="text"
                        value={activeField.key}
                        onChange={(e) =>
                          updateActiveField({
                            key: e.target.value.replace(/[^a-zA-Z0-9_]/g, ''),
                          })
                        }
                        placeholder="e.g. app_status"
                        className="w-full px-3 py-2 text-xs font-mono bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Label (Chinese) *
                      </label>
                      <input
                        type="text"
                        value={activeField.labelZh}
                        onChange={(e) => updateActiveField({ labelZh: e.target.value })}
                        placeholder="例如：報名審核狀態"
                        className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Label (English) *
                      </label>
                      <input
                        type="text"
                        value={activeField.labelEn}
                        onChange={(e) => updateActiveField({ labelEn: e.target.value })}
                        placeholder="e.g. Application Status"
                        className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Default Behavior When Unset on a Submission
                    </label>
                    <select
                      value={activeField.defaultValue || ''}
                      onChange={(e) =>
                        updateActiveField({ defaultValue: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="">
                        Hide this field on Public Inquiry until an admin assigns a value
                      </option>
                      {activeField.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          Default to: {opt.labelZh || opt.labelEn} ({opt.value})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* OPTIONS & INSTRUCTIONS LIST */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Status Options & Follow-up Instructions ({activeField.options.length})
                    </h3>
                    <button
                      type="button"
                      onClick={handleAddOption}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Option
                    </button>
                  </div>

                  <div className="space-y-4">
                    {activeField.options.map((opt, optIdx) => {
                      const toneStyle = getStatusToneStyle(opt.tone);
                      return (
                        <div
                          key={optIdx}
                          className="p-4 rounded-xl border border-gray-200 bg-white shadow-2xs space-y-3"
                        >
                          <div className="flex items-center justify-between gap-2 pb-2 border-b border-gray-100">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${toneStyle.adminBadgeClass}`}
                            >
                              {opt.labelZh || opt.labelEn || opt.value}
                            </span>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={optIdx === 0}
                                onClick={() => moveOption(optIdx, 'up')}
                                className="p-1 text-gray-400 hover:text-indigo-600 disabled:opacity-30 cursor-pointer"
                              >
                                <ChevronUp className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                disabled={optIdx === activeField.options.length - 1}
                                onClick={() => moveOption(optIdx, 'down')}
                                className="p-1 text-gray-400 hover:text-indigo-600 disabled:opacity-30 cursor-pointer"
                              >
                                <ChevronDown className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveOption(optIdx)}
                                className="p-1 text-gray-400 hover:text-red-600 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                            <div>
                              <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                                Option Key *
                              </label>
                              <input
                                type="text"
                                value={opt.value}
                                onChange={(e) =>
                                  handleUpdateOption(optIdx, {
                                    value: e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''),
                                  })
                                }
                                className="w-full px-2.5 py-1.5 text-xs font-mono border border-gray-300 rounded-lg"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                                Badge Label (ZH) *
                              </label>
                              <input
                                type="text"
                                value={opt.labelZh}
                                onChange={(e) =>
                                  handleUpdateOption(optIdx, { labelZh: e.target.value })
                                }
                                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                                Badge Label (EN) *
                              </label>
                              <input
                                type="text"
                                value={opt.labelEn}
                                onChange={(e) =>
                                  handleUpdateOption(optIdx, { labelEn: e.target.value })
                                }
                                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                                Badge Color Tone
                              </label>
                              <select
                                value={opt.tone}
                                onChange={(e) =>
                                  handleUpdateOption(optIdx, {
                                    tone: e.target.value as any,
                                  })
                                }
                                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg bg-white"
                              >
                                {STATUS_TONE_OPTIONS.map((t) => (
                                  <option key={t.value} value={t.value}>
                                    {t.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div>
                              <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                                Instruction / Action Paragraph (Chinese Markdown)
                              </label>
                              <MarkdownEditor
                                rows={2}
                                value={opt.instructionZh || ''}
                                onChange={(val) =>
                                  handleUpdateOption(optIdx, { instructionZh: val })
                                }
                                placeholder="選填。可輸入補交連結，例如：[點此上傳保險](/zh/form/ins?token={{TOKEN}})"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                                Instruction / Action Paragraph (English Markdown)
                              </label>
                              <MarkdownEditor
                                rows={2}
                                value={opt.instructionEn || ''}
                                onChange={(val) =>
                                  handleUpdateOption(optIdx, { instructionEn: val })
                                }
                                placeholder="Optional. Supports Markdown & {{TOKEN}} in URLs."
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-white border border-gray-300 rounded-lg cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Save Status Configuration</span>
          </button>
        </div>
      </div>
    </div>
  );
}