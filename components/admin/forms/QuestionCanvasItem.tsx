'use client';

import React from 'react';
import { 
  GripVertical, GitBranch, AlertCircle, ChevronUp, ChevronDown, 
  Smartphone, Calendar, Clock, UploadCloud, KeyRound, Hash 
} from 'lucide-react';
import MarkdownRenderer from '@/components/shared/MarkdownRenderer';
import { FieldOption } from './ChoicesConfigurator';
import { LogicRule } from './ConditionalLogicInspector';

export type FieldType =
  | 'text'
  | 'number'
  | 'email'
  | 'mobile'
  | 'date'
  | 'time'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'textarea'
  | 'file'
  | 'info'
  | 'applicant_token';

export interface FormField {
  id: string;
  dataKey: string;
  type: FieldType;
  labelEn: string;
  labelZh: string;
  descriptionEn?: string;
  descriptionZh?: string;
  required: boolean;
  decimals?: number; // e.g. 0 for integer, 2 for payment currency
  min?: number;
  max?: number;
  options?: FieldOption[];
  condition?: { match: 'AND' | 'OR'; rules: LogicRule[] };
}

interface QuestionCanvasItemProps {
  field: FormField;
  index: number;
  totalFields: number;
  isActive: boolean;
  isInvalid: boolean;
  onSelect: () => void;
  onMove: (index: number, direction: 'up' | 'down') => void;
}

export default function QuestionCanvasItem({
  field,
  index,
  totalFields,
  isActive,
  isInvalid,
  onSelect,
  onMove,
}: QuestionCanvasItemProps) {
  return (
    <div
      onClick={onSelect}
      className={`relative p-5 rounded-xl border-2 transition-all cursor-pointer group ${
        isActive
          ? 'border-indigo-500 bg-indigo-50/10 shadow-xs'
          : isInvalid
          ? 'border-red-500 bg-red-50/20 hover:border-red-600'
          : 'border-transparent hover:border-gray-200 hover:bg-gray-50'
      }`}
    >
      {/* BADGES */}
      {field.condition && field.condition.rules.length > 0 && (
        <div className="absolute -top-3 left-4 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200 flex items-center shadow-xs">
          <GitBranch className="w-3 h-3 mr-1" /> Conditional
        </div>
      )}
      {isInvalid && (
        <div className="absolute -top-3 right-4 bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200 flex items-center shadow-xs">
          <AlertCircle className="w-3 h-3 mr-1 text-red-600" /> Missing Key or Value
        </div>
      )}

      {/* REORDER BUTTONS */}
      {isActive && (
        <div className="absolute -right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1 z-10">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMove(index, 'up');
            }}
            disabled={index === 0}
            className="p-1 bg-white border border-gray-200 rounded shadow-xs text-gray-500 hover:text-indigo-600 disabled:opacity-30 cursor-pointer"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMove(index, 'down');
            }}
            disabled={index === totalFields - 1}
            className="p-1 bg-white border border-gray-200 rounded shadow-xs text-gray-500 hover:text-indigo-600 disabled:opacity-30 cursor-pointer"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* GRIP */}
      <div
        className={`absolute -left-3 top-1/2 -translate-y-1/2 p-1 bg-white border border-gray-200 rounded text-gray-300 shadow-xs transition-opacity ${
          isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* QUESTION CONTENT & PREVIEW */}
      <div className="space-y-3">
        <div>
          <label
            className={`block font-semibold text-gray-900 ${
              field.type === 'info' ? 'text-base text-indigo-900 mb-1' : 'text-sm'
            }`}
          >
            {field.labelEn} <span className="text-gray-400 font-normal ml-1">/ {field.labelZh}</span>
            {field.type !== 'info' && (
              <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded ml-2 font-normal">
                key: {field.dataKey || '(missing)'}
              </span>
            )}
            {field.type === 'number' && field.decimals !== undefined && (
              <span className="font-mono text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded ml-1 font-semibold border border-blue-200">
                {field.decimals === 0 ? 'Integer' : `${field.decimals} Decimals`}
              </span>
            )}
            {field.required && field.type !== 'info' && <span className="text-red-500 ml-1">*</span>}
          </label>
          <MarkdownRenderer content={field.descriptionEn} className="text-sm text-gray-500 mt-1" />
          <MarkdownRenderer content={field.descriptionZh} className="text-sm text-gray-500 mt-1" />
        </div>

        {/* INPUT MOCK PREVIEWS */}
        {field.type === 'info' ? null : field.type === 'number' ? (
          <div className="relative">
            <Hash className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input 
              type="number" 
              disabled 
              placeholder={field.decimals === 2 ? '0.00' : '0'} 
              className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 bg-white font-mono text-sm" 
            />
          </div>
        ) : field.type === 'text' || field.type === 'email' ? (
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
            <button disabled className="px-4 py-2 bg-gray-100 text-gray-400 rounded-lg border border-gray-200">
              Verify
            </button>
          </div>
        ) : field.type === 'select' ? (
          <select disabled className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white appearance-none">
            <option>Select...</option>
          </select>
        ) : field.type === 'radio' || field.type === 'checkbox' ? (
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
}