'use client';

import React from 'react';
import { ChevronUp, ChevronDown, X, PlusCircle } from 'lucide-react';

export interface FieldOption {
  value: string;
  labelEn: string;
  labelZh: string;
}

interface ChoicesConfiguratorProps {
  options?: FieldOption[];
  onAddOption: () => void;
  onUpdateOption: (index: number, key: keyof FieldOption, value: string) => void;
  onRemoveOption: (index: number) => void;
  onMoveOption: (index: number, direction: 'up' | 'down') => void;
}

export default function ChoicesConfigurator({
  options = [],
  onAddOption,
  onUpdateOption,
  onRemoveOption,
  onMoveOption,
}: ChoicesConfiguratorProps) {
  return (
    <div className="space-y-3 pt-2">
      <label className="block text-sm font-semibold text-gray-950">Choices Configuration</label>
      <div className="space-y-3">
        {options.map((opt, index) => (
          <div key={index} className="flex items-start bg-gray-50 p-3 rounded-lg border border-gray-200 gap-2">
            <div className="flex flex-col gap-1 justify-center pt-2">
              <button
                type="button"
                onClick={() => onMoveOption(index, 'up')}
                disabled={index === 0}
                className="p-1 text-gray-400 hover:text-indigo-600 disabled:opacity-30 cursor-pointer"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onMoveOption(index, 'down')}
                disabled={index === options.length - 1}
                className="p-1 text-gray-400 hover:text-indigo-600 disabled:opacity-30 cursor-pointer"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex-1 space-y-2">
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">
                  Value <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={opt.value}
                  onChange={(e) => onUpdateOption(index, 'value', e.target.value)}
                  placeholder="Data value"
                  className="w-full px-2 py-1.5 text-xs font-mono border border-gray-300 rounded focus:ring-indigo-500 text-gray-950 bg-white"
                  required
                />
              </div>
              <input
                type="text"
                value={opt.labelEn}
                onChange={(e) => onUpdateOption(index, 'labelEn', e.target.value)}
                placeholder="English Label"
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-indigo-500 text-gray-950 bg-white"
              />
              <input
                type="text"
                value={opt.labelZh}
                onChange={(e) => onUpdateOption(index, 'labelZh', e.target.value)}
                placeholder="Chinese Label"
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-indigo-500 text-gray-950 bg-white"
              />
            </div>

            <button
              type="button"
              onClick={() => onRemoveOption(index)}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onAddOption}
        className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-indigo-600 font-medium text-xs hover:bg-indigo-50 cursor-pointer flex items-center justify-center gap-1.5"
      >
        <PlusCircle className="w-3.5 h-3.5" /> Add Choice
      </button>
    </div>
  );
}