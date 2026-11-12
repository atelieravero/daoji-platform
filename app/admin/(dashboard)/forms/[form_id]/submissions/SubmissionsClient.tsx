// app/admin/(dashboard)/forms/[form_id]/submissions/SubmissionsClient.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Download,
  Eye,
  EyeOff,
  CheckCircle2,
  Circle,
  Check,
  Settings2,
  ChevronUp,
  ChevronDown,
  Beaker,
  Trash2,
  ClipboardCheck,
  Layers,
  Globe,
  Hash,
} from 'lucide-react';
import {
  getFormAndSubmissions,
  toggleSubmissionProcessedStatus,
  toggleSubmissionArchivedStatus,
  bulkMarkAsProcessed,
  saveFormStatusConfig,
  updateSubmissionStatusField,
  bulkUpdateSubmissionStatusField,
} from './actions';
import AdminPageHeader from '@/components/admin/shared/AdminPageHeader';
import AdminTableToolbar from '@/components/admin/shared/AdminTableToolbar';
import AdminTableCard from '@/components/admin/shared/AdminTableCard';
import {
  useAdminTableFilters,
  AdminColumnHeaderFilter,
  AdminFilterResetButton,
} from '@/components/admin/shared/AdminColumnFilter';
import StatusConfigModal from '@/components/admin/forms/StatusConfigModal';
import {
  FormStatusConfig,
  normalizeStatusConfig,
  getStatusToneStyle,
} from '@/lib/status-inquiry';

interface ColumnDef {
  id: string;
  label: string;
  tooltip?: string;
  visible: boolean;
  isMeta: boolean;
  isCompactIcon?: boolean;
  isStatus?: boolean;
  statusKey?: string;
}

interface SubmissionsClientProps {
  form_id: string;
  permissions: {
    canViewTest?: boolean;
    canViewReal?: boolean;
    canExport?: boolean;
    canProcess?: boolean;
    canArchive?: boolean;
  };
}

export default function SubmissionsClient({ form_id, permissions }: SubmissionsClientProps) {
  const [formConfig, setFormConfig] = useState<any>(null);
  const [statusConfig, setStatusConfig] = useState<FormStatusConfig>({
    enabled: false,
    fields: [],
  });
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Table States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Status Config Modal & Bulk Status Assignment States
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [bulkFieldKey, setBulkFieldKey] = useState<string>('');
  const [bulkOptionValue, setBulkOptionValue] = useState<string>('');
  const [isBulkUpdatingStatus, setIsBulkUpdatingStatus] = useState(false);

  // Column Management States
  const [columns, setColumns] = useState<ColumnDef[]>([]);
  const [showColManager, setShowColManager] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const buildColumns = (form: any, parsedStatusConfig: FormStatusConfig): ColumnDef[] => {
    const cols: ColumnDef[] = [
      { id: 'created_at', label: 'created_at', visible: true, isMeta: true },
      {
        id: 'locale',
        label: 'locale',
        tooltip: 'Submission Locale (zh / en)',
        visible: true,
        isMeta: true,
        isCompactIcon: true,
      },
      {
        id: 'applicant_seq_num',
        label: 'seq_num',
        tooltip: 'Sequence Number (#)',
        visible: true,
        isMeta: true,
        isCompactIcon: true,
      },
      { id: 'applicant_token', label: 'application_code', visible: true, isMeta: true },
    ];

    parsedStatusConfig.fields.forEach((sf) => {
      if (sf.key) {
        cols.push({
          id: `status:${sf.key}`,
          label: sf.key,
          tooltip: `${sf.labelZh || ''} / ${sf.labelEn || ''} (${sf.key})`,
          visible: true,
          isMeta: false,
          isStatus: true,
          statusKey: sf.key,
        });
      }
    });

    const fields = form?.schema?.fields || [];
    fields.forEach((field: any) => {
      if (field.type !== 'info' && field.dataKey) {
        cols.push({
          id: field.dataKey,
          label: field.dataKey,
          tooltip: `${field.labelZh || ''} / ${field.labelEn || ''} (${field.dataKey})`,
          visible: true,
          isMeta: false,
        });
      }
    });

    return cols;
  };

  useEffect(() => {
    let isMounted = true;
    if (!form_id) {
      setFetchError('Invalid form ID provided.');
      setIsLoading(false);
      return;
    }

    getFormAndSubmissions(form_id)
      .then(({ form, submissions }) => {
        if (!isMounted) return;
        const parsedStatus = normalizeStatusConfig(form?.status_config);
        setFormConfig(form);
        setStatusConfig(parsedStatus);
        setSubmissions(submissions || []);
        setColumns(buildColumns(form, parsedStatus));
        if (parsedStatus.fields.length > 0) {
          setBulkFieldKey(parsedStatus.fields[0].key);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load submissions:', err);
        if (isMounted) {
          setFetchError(err.message || 'Failed to load form submissions.');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [form_id]);

  // 1. Global text search filter first
  const searchFilteredSubmissions = useMemo(() => {
    if (!searchTerm.trim()) return submissions;
    const term = searchTerm.toLowerCase();
    return submissions.filter((sub) => {
      const tokenMatch = (sub.applicant_token || '').toLowerCase().includes(term);
      const seqMatch = sub.applicant_seq_num && String(sub.applicant_seq_num).includes(term);
      const nameMatch = (sub.applicant_name || '').toLowerCase().includes(term);
      const localeMatch = (sub.locale || '').toLowerCase().includes(term);
      const dataMatch = JSON.stringify(sub.response || {}).toLowerCase().includes(term);
      const statusMatch = JSON.stringify(sub.status_data || {}).toLowerCase().includes(term);
      return tokenMatch || seqMatch || nameMatch || localeMatch || dataMatch || statusMatch;
    });
  }, [submissions, searchTerm]);

  // 2. Reusable Google-Sheets per-column filter & sort hook
  const allFilterableColumnIds = useMemo(
    () => ['_processed', '_archived', '_test', ...columns.map((c) => c.id)],
    [columns]
  );

  const getSubmissionCellValue = useCallback(
    (sub: any, colId: string): string | string[] | null => {
      if (colId === '_processed') return sub.is_processed ? 'Processed' : 'Unprocessed';
      if (colId === '_archived') return sub.is_archived ? 'Archived' : 'Active';
      if (colId === '_test') return sub.is_test ? 'Test' : 'Real';
      if (colId === 'created_at') {
        return sub.created_at ? new Date(sub.created_at).toISOString().slice(0, 10) : '';
      }
      if (colId === 'locale') return sub.locale || '';
      if (colId === 'applicant_seq_num') {
        return sub.applicant_seq_num
          ? `#${String(sub.applicant_seq_num).padStart(3, '0')}`
          : '';
      }
      if (colId === 'applicant_token') return sub.applicant_token || '';

      if (colId.startsWith('status:')) {
        const statusKey = colId.slice('status:'.length);
        const sf = statusConfig.fields.find((f) => f.key === statusKey);
        return sub.status_data?.[statusKey] || sf?.defaultValue || '';
      }

      const rawVal = sub.response?.[colId];
      if (Array.isArray(rawVal)) return rawVal.map(String);
      return rawVal !== undefined && rawVal !== null ? String(rawVal) : '';
    },
    [statusConfig.fields]
  );

  const {
    filteredRows: filteredSubmissions,
    optionsByColumn,
    columnFilters,
    sortConfig,
    activeFilterCount,
    setColumnFilter,
    setSortConfig,
    clearAllFilters,
  } = useAdminTableFilters({
    rows: searchFilteredSubmissions,
    columnIds: allFilterableColumnIds,
    getCellValue: getSubmissionCellValue,
  });

  const hasTestData = submissions.some((sub) => sub.is_test);
  const selectedBulkField = statusConfig.fields.find((f) => f.key === bulkFieldKey);

  const toggleColumnVisibility = (colId: string) => {
    setColumns((cols) => cols.map((c) => (c.id === colId ? { ...c, visible: !c.visible } : c)));
  };

  const moveColumn = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === columns.length - 1) return;

    const newCols = [...columns];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newCols[index], newCols[targetIndex]] = [newCols[targetIndex], newCols[index]];
    setColumns(newCols);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedRows(filteredSubmissions.map((s) => s.id));
    else setSelectedRows([]);
  };

  const handleSelectRow = (id: string) => {
    if (selectedRows.includes(id)) setSelectedRows(selectedRows.filter((rowId) => rowId !== id));
    else setSelectedRows([...selectedRows, id]);
  };

  const toggleProcessed = async (sub: any) => {
    if (!permissions.canProcess) return;
    const nextStatus = !sub.is_processed;
    setSubmissions((subs) => subs.map((s) => (s.id === sub.id ? { ...s, is_processed: nextStatus } : s)));
    try {
      await toggleSubmissionProcessedStatus(sub.id, sub.is_processed || false);
    } catch {
      setSubmissions((subs) => subs.map((s) => (s.id === sub.id ? { ...s, is_processed: sub.is_processed } : s)));
      alert('Failed to update status in database.');
    }
  };

  const toggleArchived = async (sub: any) => {
    if (!permissions.canArchive) return;
    const nextStatus = !sub.is_archived;
    setSubmissions((subs) => subs.map((s) => (s.id === sub.id ? { ...s, is_archived: nextStatus } : s)));
    try {
      await toggleSubmissionArchivedStatus(sub.id, sub.is_archived || false);
    } catch {
      setSubmissions((subs) => subs.map((s) => (s.id === sub.id ? { ...s, is_archived: sub.is_archived } : s)));
      alert('Failed to update archive status in database.');
    }
  };

  const handleInlineStatusChange = async (
    sub: any,
    fieldKey: string,
    newValue: string
  ) => {
    if (!permissions.canProcess) return;
    const prevStatusData = sub.status_data || {};
    const nextStatusData = { ...prevStatusData };
    if (!newValue) {
      delete nextStatusData[fieldKey];
    } else {
      nextStatusData[fieldKey] = newValue;
    }

    setSubmissions((subs) =>
      subs.map((s) =>
        s.id === sub.id ? { ...s, status_data: nextStatusData } : s
      )
    );

    try {
      await updateSubmissionStatusField(sub.id, fieldKey, newValue || null);
    } catch {
      setSubmissions((subs) =>
        subs.map((s) =>
          s.id === sub.id ? { ...s, status_data: prevStatusData } : s
        )
      );
      alert('Failed to update status field.');
    }
  };

  const handleBulkStatusApply = async () => {
    if (!permissions.canProcess || selectedRows.length === 0 || !bulkFieldKey) return;
    setIsBulkUpdatingStatus(true);
    try {
      await bulkUpdateSubmissionStatusField(
        selectedRows,
        bulkFieldKey,
        bulkOptionValue || null
      );
      setSubmissions((subs) =>
        subs.map((s) => {
          if (!selectedRows.includes(s.id)) return s;
          const nextData = { ...(s.status_data || {}) };
          if (!bulkOptionValue) {
            delete nextData[bulkFieldKey];
          } else {
            nextData[bulkFieldKey] = bulkOptionValue;
          }
          return { ...s, status_data: nextData };
        })
      );
      triggerToast(`Updated status for ${selectedRows.length} submissions!`);
    } catch {
      alert('Failed to bulk update status.');
    } finally {
      setIsBulkUpdatingStatus(false);
    }
  };

  const handleSaveStatusConfig = async (newConfig: FormStatusConfig) => {
    const res = await saveFormStatusConfig(form_id, newConfig);
    if (res.success) {
      setStatusConfig(res.status_config);
      setColumns(buildColumns(formConfig, res.status_config));
      if (res.status_config.fields.length > 0 && !bulkFieldKey) {
        setBulkFieldKey(res.status_config.fields[0].key);
      }
      triggerToast('Status Inquiry configuration saved!');
    }
  };

  const escapeCSV = (val: any) => {
    if (val === null || val === undefined || val === '') return '""';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const handleExportCSV = async () => {
    if (selectedRows.length === 0) return;

    const activeCols = columns.filter((c) => c.visible);
    const headersArray = ['Event', 'Form', 'Is Test', 'Is Archived', ...activeCols.map((c) => escapeCSV(c.label))];
    const headers = headersArray.join(',');

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const fileDataKeys =
      formConfig?.schema?.fields?.filter((f: any) => f.type === 'file').map((f: any) => f.dataKey) || [];

    const selectedSubs = submissions.filter((s) => selectedRows.includes(s.id));
    const csvRows = selectedSubs.map((sub) => {
      const rawEventCode = formConfig?.schema?.interimEventCode || formConfig?.event_id || 'MMC';
      const eventIdVal = escapeCSV(rawEventCode);
      const formTitleVal = escapeCSV(formConfig?.title || '');
      const isTestVal = escapeCSV(sub.is_test ? 'TRUE' : 'FALSE');
      const isArchivedVal = escapeCSV(sub.is_archived ? 'TRUE' : 'FALSE');

      const rowValues = activeCols.map((c) => {
        if (c.id === 'created_at') return escapeCSV(new Date(sub.created_at).toLocaleString());
        if (c.id === 'locale') return escapeCSV(sub.locale);
        if (c.id === 'applicant_seq_num')
          return escapeCSV(sub.applicant_seq_num ? `#${String(sub.applicant_seq_num).padStart(3, '0')}` : '-');
        if (c.id === 'applicant_token') return escapeCSV(sub.applicant_token);

        if (c.isStatus && c.statusKey) {
          const sf = statusConfig.fields.find((f) => f.key === c.statusKey);
          const rawStatusVal = sub.status_data?.[c.statusKey] || sf?.defaultValue || '';
          return escapeCSV(rawStatusVal);
        }

        let rawVal = sub.response?.[c.id];

        if (fileDataKeys.includes(c.id) && typeof rawVal === 'string' && rawVal.startsWith('submissions/')) {
          rawVal = `${baseUrl}/admin/file?path=${encodeURIComponent(rawVal)}`;
        } else if (Array.isArray(rawVal)) {
          rawVal = rawVal.join(', ');
        }

        return escapeCSV(rawVal);
      });

      return [eventIdVal, formTitleVal, isTestVal, isArchivedVal, ...rowValues].join(',');
    });

    const csvString = [headers, ...csvRows].join('\n');
    const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${formConfig?.title || 'Form'}_Export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    try {
      if (permissions.canProcess) {
        await bulkMarkAsProcessed(selectedRows);
        setSubmissions((subs) =>
          subs.map((sub) => (selectedRows.includes(sub.id) ? { ...sub, is_processed: true } : sub))
        );
      }
      setSelectedRows([]);
      triggerToast('CSV Exported & records marked as processed!');
    } catch {
      alert('Export successful, but failed to flag records as processed in the database.');
    }
  };

  const renderHeaderIcon = (colId: string) => {
    if (colId === 'locale') return <Globe className="w-3.5 h-3.5" />;
    if (colId === 'applicant_seq_num') return <Hash className="w-3.5 h-3.5" />;
    return undefined;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-8 h-full font-sans relative">
      {toastMessage && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-xl flex items-center space-x-3 z-50 animate-in fade-in slide-in-from-top-4">
          <Check className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* HEADER */}
      <AdminPageHeader
        title={`Submissions: ${formConfig?.title || 'Untitled Form'}`}
        backHref="/admin/forms"
        backLabel="Back to Forms"
      >
        <span className="text-sm text-gray-500 font-medium mr-2">
          {selectedRows.length} selected
        </span>

        {permissions.canProcess && !formConfig?.is_followup && (
          <button
            type="button"
            onClick={() => setShowStatusModal(true)}
            className="inline-flex items-center px-4 py-2.5 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 text-sm font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <ClipboardCheck className="w-4 h-4 mr-2 text-indigo-600" />
            <span>Status Inquiry Config</span>
            {statusConfig.enabled && (
              <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded-full">
                LIVE
              </span>
            )}
          </button>
        )}

        {permissions.canExport && (
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={selectedRows.length === 0}
            className={`inline-flex items-center px-4 py-2.5 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors focus:outline-none ${
              selectedRows.length > 0
                ? 'bg-emerald-600 hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 cursor-pointer'
                : 'bg-emerald-300 cursor-not-allowed'
            }`}
          >
            <Download className="w-4 h-4 mr-2" /> Export Selected CSV
          </button>
        )}
      </AdminPageHeader>

      {/* MULTI-ROW BULK STATUS ASSIGNMENT BAR */}
      {permissions.canProcess &&
        selectedRows.length > 0 &&
        statusConfig.fields.length > 0 && (
          <div className="mb-4 p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-950">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>
                Bulk Assign Status ({selectedRows.length} selected):
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={bulkFieldKey}
                onChange={(e) => {
                  setBulkFieldKey(e.target.value);
                  setBulkOptionValue('');
                }}
                className="px-3 py-1.5 text-xs font-mono font-semibold bg-white border border-indigo-200 rounded-lg text-gray-800"
              >
                {statusConfig.fields.map((sf) => (
                  <option key={sf.id} value={sf.key}>
                    {sf.key} ({sf.labelZh || sf.labelEn})
                  </option>
                ))}
              </select>

              <select
                value={bulkOptionValue}
                onChange={(e) => setBulkOptionValue(e.target.value)}
                className="px-3 py-1.5 text-xs font-mono bg-white border border-indigo-200 rounded-lg text-gray-800"
              >
                <option value="">— Clear / Reset —</option>
                {(selectedBulkField?.options || []).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.value} ({opt.labelZh || opt.labelEn})
                  </option>
                ))}
              </select>

              <button
                type="button"
                disabled={isBulkUpdatingStatus}
                onClick={handleBulkStatusApply}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isBulkUpdatingStatus ? 'Applying...' : `Apply to ${selectedRows.length} Selected`}
              </button>
            </div>
          </div>
        )}

      {/* TOOLBAR */}
      <AdminTableToolbar
        search={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search data, names, codes, or status..."
      >
        <AdminFilterResetButton
          activeFilterCount={activeFilterCount}
          onReset={clearAllFilters}
        />

        {/* COLUMN MANAGER POPOVER */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowColManager(!showColManager)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-xs text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <Settings2 className="w-4 h-4 mr-2 text-gray-500" /> View Settings
          </button>

          {showColManager && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 z-30 p-2 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 mb-2">
                Manage Columns
              </div>
              <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                {columns.map((col, idx) => (
                  <div key={col.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg group">
                    <div className="flex flex-col gap-0.5 mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveColumn(idx, 'up')}
                        className="text-gray-400 hover:text-indigo-600 disabled:opacity-30 cursor-pointer"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === columns.length - 1}
                        onClick={() => moveColumn(idx, 'down')}
                        className="text-gray-400 hover:text-indigo-600 disabled:opacity-30 cursor-pointer"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-sm text-gray-700 font-mono truncate flex-1" title={col.tooltip || col.label}>
                      {col.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleColumnVisibility(col.id)}
                      className={`p-1.5 rounded-md ml-2 transition-colors cursor-pointer ${
                        col.visible ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 hover:bg-gray-100'
                      }`}
                    >
                      {col.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </AdminTableToolbar>

      {/* DATA TABLE */}
      <AdminTableCard
        isLoading={isLoading}
        loadingText="Loading submissions..."
        isEmpty={filteredSubmissions.length === 0}
        emptyTitle="No submissions found"
        emptyDescription={
          fetchError ||
          (activeFilterCount > 0 || searchTerm
            ? 'No submissions match your active filters.'
            : 'No responses have been submitted to this form yet.')
        }
      >
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50/80">
            <tr>
              <th scope="col" className="px-4 py-3.5 text-center w-10 border-r border-gray-100">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                  onChange={handleSelectAll}
                  checked={filteredSubmissions.length > 0 && selectedRows.length === filteredSubmissions.length}
                />
              </th>

              {/* COMPACT ICON HEADER: PROCESSED */}
              <th scope="col" className="px-2 py-3 text-center w-11 border-r border-gray-100 group">
                <AdminColumnHeaderFilter
                  colId="_processed"
                  title="Processed"
                  icon={<CheckCircle2 className="w-4 h-4 text-gray-500" />}
                  options={optionsByColumn['_processed'] || []}
                  selectedValues={columnFilters['_processed']}
                  sortConfig={sortConfig}
                  onChangeFilter={(vals) => setColumnFilter('_processed', vals)}
                  onChangeSort={setSortConfig}
                  align="center"
                />
              </th>

              {/* COMPACT ICON HEADER: ARCHIVED (RUBBISH BIN) */}
              <th scope="col" className="px-2 py-3 text-center w-11 border-r border-gray-100 group">
                <AdminColumnHeaderFilter
                  colId="_archived"
                  title="Archived (Rubbish Bin)"
                  icon={<Trash2 className="w-4 h-4 text-gray-500" />}
                  options={optionsByColumn['_archived'] || []}
                  selectedValues={columnFilters['_archived']}
                  sortConfig={sortConfig}
                  onChangeFilter={(vals) => setColumnFilter('_archived', vals)}
                  onChangeSort={setSortConfig}
                  align="center"
                />
              </th>

              {/* COMPACT ICON HEADER: TEST */}
              {hasTestData && (
                <th scope="col" className="px-2 py-3 text-center w-11 border-r border-gray-100 group">
                  <AdminColumnHeaderFilter
                    colId="_test"
                    title="Test Submission"
                    icon={<Beaker className="w-4 h-4 text-gray-500" />}
                    options={optionsByColumn['_test'] || []}
                    selectedValues={columnFilters['_test']}
                    sortConfig={sortConfig}
                    onChangeFilter={(vals) => setColumnFilter('_test', vals)}
                    onChangeSort={setSortConfig}
                    align="center"
                  />
                </th>
              )}

              {/* DYNAMIC COLUMNS */}
              {columns
                .filter((c) => c.visible)
                .map((col) => (
                  <th
                    key={col.id}
                    scope="col"
                    className={`py-3 text-xs font-semibold whitespace-nowrap font-mono border-r border-gray-100 last:border-r-0 group ${
                      col.isCompactIcon
                        ? 'px-2 text-center w-12'
                        : col.isStatus
                        ? 'px-2.5 text-center'
                        : 'px-3.5 text-left'
                    } ${
                      col.isStatus
                        ? 'text-emerald-800 bg-emerald-50/50'
                        : col.isMeta
                        ? 'text-gray-500'
                        : 'text-indigo-700 bg-indigo-50/30'
                    }`}
                  >
                    <AdminColumnHeaderFilter
                      colId={col.id}
                      title={col.label}
                      tooltip={col.tooltip}
                      icon={col.isCompactIcon ? renderHeaderIcon(col.id) : undefined}
                      options={optionsByColumn[col.id] || []}
                      selectedValues={columnFilters[col.id]}
                      sortConfig={sortConfig}
                      onChangeFilter={(vals) => setColumnFilter(col.id, vals)}
                      onChangeSort={setSortConfig}
                      align={col.isCompactIcon || col.isStatus ? 'center' : 'left'}
                    />
                  </th>
                ))}
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-100">
            {filteredSubmissions.map((sub) => {
              const isSelected = selectedRows.includes(sub.id);
              return (
                <tr
                  key={sub.id}
                  className={`transition-colors group ${
                    isSelected
                      ? 'bg-indigo-100/90 hover:bg-indigo-200/75 ring-1 ring-inset ring-indigo-300'
                      : sub.is_archived
                      ? 'bg-amber-50/40 hover:bg-amber-50/70'
                      : 'hover:bg-gray-50/90'
                  } ${sub.is_processed && !isSelected ? 'opacity-60' : ''}`}
                >
                  <td
                    className={`px-4 py-3.5 whitespace-nowrap text-center border-r border-gray-100 ${
                      isSelected ? 'border-l-4 border-l-indigo-600' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                      checked={isSelected}
                      onChange={() => handleSelectRow(sub.id)}
                    />
                  </td>

                  {/* PROCESSED CELL */}
                  <td className="px-2 py-3.5 whitespace-nowrap text-center border-r border-gray-100">
                    {permissions.canProcess ? (
                      <button
                        type="button"
                        onClick={() => toggleProcessed(sub)}
                        className="focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full p-0.5 transition-transform active:scale-95 cursor-pointer"
                        title={sub.is_processed ? 'Mark as Unprocessed' : 'Mark as Processed'}
                      >
                        {sub.is_processed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Circle className="w-4 h-4 text-gray-300 hover:text-gray-400" />
                        )}
                      </button>
                    ) : (
                      <div className="inline-flex rounded-full p-0.5 cursor-default">
                        {sub.is_processed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Circle className="w-4 h-4 text-gray-300" />
                        )}
                      </div>
                    )}
                  </td>

                  {/* ARCHIVED CELL (RUBBISH BIN) */}
                  <td className="px-2 py-3.5 whitespace-nowrap text-center border-r border-gray-100">
                    {permissions.canArchive ? (
                      <button
                        type="button"
                        onClick={() => toggleArchived(sub)}
                        className={`focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-md p-1 transition-transform active:scale-95 cursor-pointer ${
                          sub.is_archived
                            ? 'text-amber-700 bg-amber-100 hover:bg-amber-200'
                            : 'text-gray-300 hover:text-red-500'
                        }`}
                        title={
                          sub.is_archived
                            ? 'Archived: Excluded from identity lookup. Click to restore.'
                            : 'Active: Click to move to archived.'
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <div
                        className={`inline-flex rounded-md p-1 ${
                          sub.is_archived ? 'text-amber-700 bg-amber-100' : 'text-gray-300'
                        }`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </div>
                    )}
                  </td>

                  {/* TEST CELL */}
                  {hasTestData && (
                    <td className="px-2 py-3.5 whitespace-nowrap text-center border-r border-gray-100">
                      {sub.is_test && (
                        <div title="Test Submission" className="inline-flex items-center justify-center">
                          <Beaker className="w-4 h-4 text-amber-500" />
                        </div>
                      )}
                    </td>
                  )}

                  {/* DYNAMIC CELLS */}
                  {columns
                    .filter((c) => c.visible)
                    .map((col) => {
                      let cellValue: React.ReactNode = '-';

                      if (col.id === 'created_at') {
                        cellValue = new Date(sub.created_at).toLocaleString();
                      } else if (col.id === 'locale') {
                        cellValue = sub.locale || '-';
                      } else if (col.id === 'applicant_seq_num') {
                        cellValue = sub.applicant_seq_num
                          ? `#${String(sub.applicant_seq_num).padStart(3, '0')}`
                          : '-';
                      } else if (col.id === 'applicant_token') {
                        cellValue = sub.applicant_token || '-';
                      } else if (col.isStatus && col.statusKey) {
                        const sf = statusConfig.fields.find((f) => f.key === col.statusKey);
                        const explicitVal = sub.status_data?.[col.statusKey] || '';
                        const effectiveVal = explicitVal || sf?.defaultValue || '';
                        const matchedOpt = sf?.options.find((o) => o.value === effectiveVal);
                        const toneStyle = getStatusToneStyle(matchedOpt?.tone);

                        cellValue = (
                          <select
                            disabled={!permissions.canProcess}
                            value={explicitVal}
                            title={
                              matchedOpt
                                ? `${matchedOpt.labelZh || ''} / ${matchedOpt.labelEn || ''} (${matchedOpt.value})`
                                : 'Unset (Hidden on public inquiry)'
                            }
                            onChange={(e) =>
                              handleInlineStatusChange(sub, col.statusKey!, e.target.value)
                            }
                            className={`px-2 py-0.5 rounded-md text-xs font-mono font-semibold border outline-none transition-colors ${
                              matchedOpt
                                ? toneStyle.adminBadgeClass
                                : 'bg-gray-50 text-gray-400 border-gray-200'
                            } ${permissions.canProcess ? 'cursor-pointer' : 'cursor-default opacity-80'}`}
                          >
                            <option value="">
                              {sf?.defaultValue ? `${sf.defaultValue}*` : '—'}
                            </option>
                            {(sf?.options || []).map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.value}
                              </option>
                            ))}
                          </select>
                        );
                      } else {
                        const rawVal = sub.response?.[col.id];
                        const isFileField =
                          formConfig?.schema?.fields?.find((f: any) => f.dataKey === col.id)?.type === 'file';

                        if (isFileField && typeof rawVal === 'string' && rawVal.startsWith('submissions/')) {
                          const baseUrl =
                            process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
                          const fileUrl = `${baseUrl}/admin/file?path=${encodeURIComponent(rawVal)}`;
                          const canViewThisFile = sub.is_test ? permissions?.canViewTest !== false : permissions?.canViewReal;

                          cellValue = canViewThisFile ? (
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-800 hover:underline font-medium truncate block"
                              title="Open secure file"
                            >
                              {rawVal.split('/').pop()}
                            </a>
                          ) : (
                            <span
                              className="text-gray-400 italic cursor-not-allowed truncate block select-none"
                              title="Restricted: Requires production submission view permissions"
                            >
                              {rawVal.split('/').pop()}
                            </span>
                          );
                        } else {
                          cellValue = Array.isArray(rawVal) ? rawVal.join(', ') : rawVal || '-';
                        }
                      }

                      return (
                        <td
                          key={col.id}
                          className={`py-3.5 text-sm whitespace-nowrap truncate max-w-[240px] border-r border-gray-100 last:border-r-0 ${
                            col.isCompactIcon
                              ? 'px-2 text-center font-mono text-xs text-gray-500'
                              : col.isMeta
                              ? 'px-4 text-gray-500 font-mono text-xs'
                              : col.isStatus
                              ? 'px-3 text-center'
                              : 'px-4 text-gray-900'
                          }`}
                        >
                          {cellValue}
                        </td>
                      );
                    })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </AdminTableCard>

      {/* STATUS CONFIG MODAL */}
      <StatusConfigModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        initialConfig={statusConfig}
        formSlug={formConfig?.slug}
        onSave={handleSaveStatusConfig}
      />
    </div>
  );
}