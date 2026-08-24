'use client';

import React from 'react';
import { GitBranch, PlusCircle, X } from 'lucide-react';
import { FormField } from './QuestionCanvasItem';

export type LogicOperator =
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

export interface LogicRule {
  id: string;
  dependsOn: string;
  operator: LogicOperator;
  value: string;
}

interface ConditionalLogicInspectorProps {
  condition?: { match: 'AND' | 'OR'; rules: LogicRule[] };
  previousFields: FormField[];
  onToggleCondition: () => void;
  onChangeMatch: (match: 'AND' | 'OR') => void;
  onAddRule: () => void;
  onUpdateRule: (ruleId: string, updates: Partial<LogicRule>) => void;
  onRemoveRule: (ruleId: string) => void;
}

export default function ConditionalLogicInspector({
  condition,
  previousFields,
  onToggleCondition,
  onChangeMatch,
  onAddRule,
  onUpdateRule,
  onRemoveRule,
}: ConditionalLogicInspectorProps) {
  return (
    <div className="space-y-4 p-4 bg-amber-50/50 border border-amber-200/60 rounded-xl">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wider flex items-center">
          <GitBranch className="w-4 h-4 mr-2" /> Conditional Logic
        </h3>
        <button
          type="button"
          onClick={onToggleCondition}
          className={`relative inline-flex h-4 w-7 rounded-full transition-colors cursor-pointer ${
            condition ? 'bg-amber-600' : 'bg-amber-200'
          }`}
        >
          <span
            className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition ${
              condition ? 'translate-x-3' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {condition && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center text-xs font-medium text-amber-800">
            <span>Show this question if</span>
            <select
              value={condition.match}
              onChange={(e) => onChangeMatch(e.target.value as 'AND' | 'OR')}
              className="mx-2 bg-white border border-amber-300 rounded px-2 py-1 focus:ring-amber-500 text-amber-950"
            >
              <option value="AND">ALL</option>
              <option value="OR">ANY</option>
            </select>
            <span>of the following match:</span>
          </div>

          <div className="space-y-3 border-l-2 border-amber-200 pl-3">
            {condition.rules.map((rule) => {
              const dependentField = previousFields.find((f) => f.dataKey === rule.dependsOn);
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
                <div
                  key={rule.id}
                  className="space-y-2 bg-white p-3 rounded-lg border border-amber-200 shadow-xs relative group/rule"
                >
                  <button
                    type="button"
                    onClick={() => onRemoveRule(rule.id)}
                    className="absolute -right-2 -top-2 bg-white border border-gray-200 text-gray-400 hover:text-red-500 rounded-full p-0.5 shadow-xs opacity-0 group-hover/rule:opacity-100 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>

                  <select
                    value={rule.dependsOn}
                    onChange={(e) => {
                      const newTarget = previousFields.find((f) => f.dataKey === e.target.value);
                      const defaultOp: LogicOperator = ['radio', 'select', 'checkbox'].includes(newTarget?.type || '')
                        ? 'is_one_of'
                        : ['file', 'applicant_token'].includes(newTarget?.type || '')
                        ? 'is_not_blank'
                        : 'equals';

                      onUpdateRule(rule.id, {
                        dependsOn: e.target.value,
                        operator: defaultOp,
                        value: '',
                      });
                    }}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded bg-white focus:ring-amber-500 text-gray-950"
                  >
                    <option value="">Select previous field...</option>
                    {previousFields.map((f) => (
                      <option key={f.id} value={f.dataKey}>
                        {f.labelEn} ({f.labelZh}) [Key: {f.dataKey}]
                      </option>
                    ))}
                  </select>

                  {dependentField && (
                    <div className="flex flex-col gap-2">
                      <select
                        value={rule.operator}
                        onChange={(e) =>
                          onUpdateRule(rule.id, {
                            operator: e.target.value as LogicOperator,
                            value: '',
                          })
                        }
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded bg-white focus:ring-amber-500 text-gray-950 font-medium"
                      >
                        {renderOperatorOptions()}
                      </select>

                      {!isBlankOp &&
                        (['radio', 'select', 'checkbox'].includes(depType || '') ? (
                          <div className="space-y-1 bg-gray-50 p-2 rounded border border-gray-200 max-h-36 overflow-y-auto">
                            <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                              Select matching options:
                            </span>
                            {dependentField?.options?.map((opt, optIdx) => {
                              const currentValues = rule.value
                                ? rule.value.split(',').map((s) => s.trim()).filter(Boolean)
                                : [];
                              const isChecked = currentValues.includes(opt.value);
                              return (
                                <label
                                  key={optIdx}
                                  className="flex items-center text-xs text-gray-800 cursor-pointer hover:bg-gray-100 p-1 rounded"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      let updated = [...currentValues];
                                      if (e.target.checked) updated.push(opt.value);
                                      else updated = updated.filter((v) => v !== opt.value);
                                      onUpdateRule(rule.id, { value: updated.join(',') });
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
                                  onUpdateRule(rule.id, { value: `${e.target.value}..${to}` });
                                }}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white text-gray-950 font-mono"
                              />
                              <span className="text-xs text-gray-400 font-bold">to</span>
                              <input
                                type="date"
                                value={rule.value.split('..')[1] || ''}
                                onChange={(e) => {
                                  const from = rule.value.split('..')[0] || '';
                                  onUpdateRule(rule.id, { value: `${from}..${e.target.value}` });
                                }}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white text-gray-950 font-mono"
                              />
                            </div>
                          ) : (
                            <input
                              type="date"
                              value={rule.value}
                              onChange={(e) => onUpdateRule(rule.id, { value: e.target.value })}
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
                                  onUpdateRule(rule.id, { value: `${e.target.value}..${to}` });
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
                                  onUpdateRule(rule.id, { value: `${from}..${e.target.value}` });
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
                              onChange={(e) => onUpdateRule(rule.id, { value: e.target.value })}
                              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded bg-white font-mono text-gray-950"
                            />
                          )
                        ) : (
                          <input
                            type="text"
                            value={rule.value}
                            onChange={(e) => onUpdateRule(rule.id, { value: e.target.value })}
                            placeholder="Value..."
                            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-amber-500 text-gray-950 bg-white"
                          />
                        ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onAddRule}
            className="text-xs font-semibold text-amber-700 hover:text-amber-900 transition-colors flex items-center cursor-pointer"
          >
            <PlusCircle className="w-3 h-3 mr-1" /> Add Condition
          </button>
        </div>
      )}
    </div>
  );
}