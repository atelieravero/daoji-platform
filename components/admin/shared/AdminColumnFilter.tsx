// components/admin/shared/AdminColumnFilter.tsx
'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  ListFilter,
  ArrowDownAZ,
  ArrowUpZA,
  Search,
  Check,
  X,
  RotateCcw,
} from 'lucide-react';

export const BLANK_FILTER_TOKEN = '__BLANK__';

export interface FilterOptionItem {
  value: string;
  label: string;
  count: number;
}

export interface SortConfig {
  colId: string;
  direction: 'asc' | 'desc';
}

interface UseAdminTableFiltersProps<T> {
  rows: T[];
  columnIds: string[];
  /**
   * Returns a string (or string[] for multi-value cells like checkboxes/tags)
   * representing the raw filterable value(s) of `row` for `colId`.
   */
  getCellValue: (row: T, colId: string) => string | string[] | null | undefined;
  /**
   * Optional custom label formatter for filter checklist items.
   */
  formatOptionLabel?: (colId: string, rawValue: string) => string;
}

export function useAdminTableFilters<T>({
  rows,
  columnIds,
  getCellValue,
  formatOptionLabel,
}: UseAdminTableFiltersProps<T>) {
  // Maps colId -> array of allowed values. If a colId key is undefined, all values are allowed.
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  const normalizeRowValues = (row: T, colId: string): string[] => {
    const raw = getCellValue(row, colId);
    if (raw === null || raw === undefined || raw === '') {
      return [BLANK_FILTER_TOKEN];
    }
    if (Array.isArray(raw)) {
      const cleaned = raw.map((v) => String(v ?? '').trim()).filter(Boolean);
      return cleaned.length > 0 ? cleaned : [BLANK_FILTER_TOKEN];
    }
    const str = String(raw).trim();
    return str ? [str] : [BLANK_FILTER_TOKEN];
  };

  // Compute unique value counts per column across the base rows
  const optionsByColumn = useMemo(() => {
    const result: Record<string, FilterOptionItem[]> = {};

    for (const colId of columnIds) {
      const counts = new Map<string, number>();
      for (const row of rows) {
        const vals = normalizeRowValues(row, colId);
        for (const v of vals) {
          counts.set(v, (counts.get(v) || 0) + 1);
        }
      }

      const items: FilterOptionItem[] = Array.from(counts.entries()).map(
        ([value, count]) => ({
          value,
          label:
            value === BLANK_FILTER_TOKEN
              ? '(Blanks / Unset)'
              : formatOptionLabel
              ? formatOptionLabel(colId, value)
              : value,
          count,
        })
      );

      items.sort((a, b) => {
        if (a.value === BLANK_FILTER_TOKEN) return 1;
        if (b.value === BLANK_FILTER_TOKEN) return -1;
        return a.label.localeCompare(b.label, undefined, { numeric: true });
      });

      result[colId] = items;
    }

    return result;
  }, [rows, columnIds, getCellValue, formatOptionLabel]);

  // Apply column filters (AND across columns, OR within a column) + sort
  const filteredRows = useMemo(() => {
    const activeColIds = Object.keys(columnFilters);

    let result = rows;
    if (activeColIds.length > 0) {
      result = rows.filter((row) =>
        activeColIds.every((colId) => {
          const allowed = columnFilters[colId];
          if (!allowed) return true;
          if (allowed.length === 0) return false;
          const rowVals = normalizeRowValues(row, colId);
          return rowVals.some((v) => allowed.includes(v));
        })
      );
    }

    if (sortConfig) {
      const { colId, direction } = sortConfig;
      result = [...result].sort((a, b) => {
        const valA = normalizeRowValues(a, colId)[0];
        const valB = normalizeRowValues(b, colId)[0];

        if (valA === valB) return 0;
        if (valA === BLANK_FILTER_TOKEN) return 1;
        if (valB === BLANK_FILTER_TOKEN) return -1;

        const cmp = valA.localeCompare(valB, undefined, {
          numeric: true,
          sensitivity: 'base',
        });
        return direction === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  }, [rows, columnFilters, sortConfig]);

  const setColumnFilter = (colId: string, selectedValues: string[] | null) => {
    setColumnFilters((prev) => {
      const next = { ...prev };
      const allOptions = optionsByColumn[colId] || [];
      if (
        selectedValues === null ||
        (allOptions.length > 0 && selectedValues.length >= allOptions.length)
      ) {
        delete next[colId];
      } else {
        next[colId] = selectedValues;
      }
      return next;
    });
  };

  const clearAllFilters = () => {
    setColumnFilters({});
    setSortConfig(null);
  };

  const activeFilterCount =
    Object.keys(columnFilters).length + (sortConfig ? 1 : 0);

  return {
    filteredRows,
    optionsByColumn,
    columnFilters,
    sortConfig,
    activeFilterCount,
    setColumnFilter,
    setSortConfig,
    clearAllFilters,
  };
}

interface AdminColumnHeaderFilterProps {
  colId: string;
  title: string;
  /** Optional hover tooltip / full description (not rendered in the header cell) */
  tooltip?: string;
  /** If provided, renders a compact icon instead of text label in the table header */
  icon?: React.ReactNode;
  options: FilterOptionItem[];
  selectedValues?: string[];
  sortConfig: SortConfig | null;
  onChangeFilter: (selectedValues: string[] | null) => void;
  onChangeSort: (sort: SortConfig | null) => void;
  align?: 'left' | 'center';
}

export function AdminColumnHeaderFilter({
  colId,
  title,
  tooltip,
  icon,
  options,
  selectedValues,
  sortConfig,
  onChangeFilter,
  onChangeSort,
  align = 'left',
}: AdminColumnHeaderFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [optionSearch, setOptionSearch] = useState('');
  const [coords, setCoords] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const isFiltered = selectedValues !== undefined;
  const isSorted = sortConfig?.colId === colId;
  const isActive = isFiltered || isSorted;

  const allValues = useMemo(() => options.map((o) => o.value), [options]);
  const effectiveSelected = isFiltered ? selectedValues : allValues;

  const openPopover = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popoverWidth = 260;
    const safeLeft = Math.min(
      window.innerWidth - popoverWidth - 12,
      Math.max(12, rect.left)
    );
    setCoords({ top: rect.bottom + 6, left: safeLeft });
    setOptionSearch('');
    setIsOpen(true);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', () => setIsOpen(false), true);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', () => setIsOpen(false), true);
    };
  }, [isOpen]);

  const visibleOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(optionSearch.toLowerCase())
  );

  const toggleValue = (val: string) => {
    const set = new Set(effectiveSelected);
    if (set.has(val)) {
      set.delete(val);
    } else {
      set.add(val);
    }
    onChangeFilter(Array.from(set));
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (isOpen ? setIsOpen(false) : openPopover())}
        title={`${tooltip || title} — Click to filter or sort`}
        className={`inline-flex items-center gap-1 rounded-md px-1.5 py-1 transition-colors cursor-pointer select-none ${
          align === 'center' ? 'justify-center mx-auto' : 'justify-between w-full'
        } ${
          isActive
            ? 'bg-indigo-100 text-indigo-800 ring-1 ring-indigo-300'
            : 'hover:bg-gray-200/70 text-inherit'
        }`}
      >
        {icon ? (
          <span className="inline-flex items-center justify-center">{icon}</span>
        ) : (
          <span className="truncate">{title}</span>
        )}
        <ListFilter
          className={`w-3 h-3 shrink-0 transition-opacity ${
            isActive ? 'text-indigo-700 opacity-100' : 'opacity-40 group-hover:opacity-80'
          }`}
        />
      </button>

      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={popoverRef}
            style={{ top: coords.top, left: coords.left }}
            className="fixed z-50 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 text-left font-sans animate-in fade-in zoom-in-95 duration-100 overflow-hidden"
          >
            {/* POPOVER HEADER */}
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-xs font-bold font-mono text-gray-900 block truncate">
                  {title}
                </span>
                {tooltip && tooltip !== title && (
                  <span className="text-[10px] text-gray-500 block truncate">
                    {tooltip}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-0.5 text-gray-400 hover:text-gray-600 rounded cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* SORT CONTROLS */}
            <div className="p-1.5 border-b border-gray-100 grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() =>
                  onChangeSort(
                    isSorted && sortConfig?.direction === 'asc'
                      ? null
                      : { colId, direction: 'asc' }
                  )
                }
                className={`px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  isSorted && sortConfig?.direction === 'asc'
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ArrowDownAZ className="w-3.5 h-3.5" />
                <span>Sort A → Z</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  onChangeSort(
                    isSorted && sortConfig?.direction === 'desc'
                      ? null
                      : { colId, direction: 'desc' }
                  )
                }
                className={`px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  isSorted && sortConfig?.direction === 'desc'
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ArrowUpZA className="w-3.5 h-3.5" />
                <span>Sort Z → A</span>
              </button>
            </div>

            {/* SEARCH WITHIN VALUES (IF > 5 OPTIONS) */}
            {options.length > 5 && (
              <div className="p-2 border-b border-gray-100">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2" />
                  <input
                    type="text"
                    value={optionSearch}
                    onChange={(e) => setOptionSearch(e.target.value)}
                    placeholder="Filter values..."
                    className="w-full pl-8 pr-2.5 py-1 text-xs border border-gray-200 rounded-lg outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* SELECT ALL / CLEAR BAR */}
            <div className="px-3 py-1.5 bg-gray-50/60 border-b border-gray-100 flex items-center justify-between text-[11px] font-semibold">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => onChangeFilter(null)}
                  className="text-indigo-600 hover:underline cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-gray-300">·</span>
                <button
                  type="button"
                  onClick={() => onChangeFilter([])}
                  className="text-gray-500 hover:text-gray-800 hover:underline cursor-pointer"
                >
                  Clear
                </button>
              </div>
              <span className="text-gray-400 font-normal">
                {effectiveSelected.length}/{options.length}
              </span>
            </div>

            {/* CHECKLIST OF UNIQUE VALUES */}
            <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5">
              {visibleOptions.length === 0 ? (
                <div className="py-6 text-center text-xs text-gray-400">
                  No matching values
                </div>
              ) : (
                visibleOptions.map((opt) => {
                  const isChecked = effectiveSelected.includes(opt.value);
                  return (
                    <div
                      key={opt.value}
                      onClick={() => toggleValue(opt.value)}
                      className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer group"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                            isChecked
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'border-gray-300 bg-white'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span
                          className={`text-xs truncate ${
                            opt.value === BLANK_FILTER_TOKEN
                              ? 'italic text-gray-400'
                              : 'text-gray-700 font-mono'
                          }`}
                        >
                          {opt.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onChangeFilter([opt.value]);
                          }}
                          className="hidden group-hover:inline-block px-1.5 py-0.5 text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded cursor-pointer"
                        >
                          Only
                        </button>
                        <span className="text-[11px] text-gray-400 font-mono">
                          {opt.count}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

export function AdminFilterResetButton({
  activeFilterCount,
  onReset,
}: {
  activeFilterCount: number;
  onReset: () => void;
}) {
  if (activeFilterCount === 0) return null;
  return (
    <button
      type="button"
      onClick={onReset}
      className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
    >
      <RotateCcw className="w-3.5 h-3.5" />
      <span>Reset Filters ({activeFilterCount})</span>
    </button>
  );
}