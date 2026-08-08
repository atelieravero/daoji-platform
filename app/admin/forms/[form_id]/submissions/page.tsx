'use client';

import React, { useState, useEffect, use } from 'react';
import { getFormAndSubmissions, toggleSubmissionProcessedStatus, bulkMarkAsProcessed } from './actions';
import { 
  Download, Search, Filter, Eye, EyeOff, ArrowLeft,
  CheckCircle2, Circle, Check, Loader2, Settings2, ChevronUp, ChevronDown, Beaker
} from 'lucide-react';

interface ColumnDef {
  id: string;
  label: string;
  visible: boolean;
  isMeta: boolean;
}

export default function FormSubmissionsPage({ params }: { params: Promise<{ form_id: string }> }) {
  const { form_id } = use(params);

  const [formConfig, setFormConfig] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Table States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [filterProcessed, setFilterProcessed] = useState(false);
  const [showExportToast, setShowToast] = useState(false);
  
  // Column Management States
  const [columns, setColumns] = useState<ColumnDef[]>([]);
  const [showColManager, setShowColManager] = useState(false);

  // Initialize Data
  useEffect(() => {
    let isMounted = true;
    
    getFormAndSubmissions(form_id).then(({ form, submissions }) => {
      if (!isMounted) return;
      
      setFormConfig(form);
      setSubmissions(submissions);

      // Build the initial column definitions
      const initialCols: ColumnDef[] = [
        { id: 'created_at', label: 'created_at', visible: true, isMeta: true },
        { id: 'applicant_token', label: 'applicant_token', visible: true, isMeta: true },
      ];

      // Extract dynamic fields from schema
      const fields = form.schema?.fields || [];
      fields.forEach((field: any) => {
        if (field.type !== 'info' && field.dataKey) {
          initialCols.push({ 
            id: field.dataKey, 
            label: field.dataKey, 
            visible: true, 
            isMeta: false 
          });
        }
      });

      setColumns(initialCols);
      setIsLoading(false);
    }).catch(err => {
      console.error(err);
      setIsLoading(false);
    });

    return () => { isMounted = false; };
  }, [form_id]);

  // --- COLUMN MANAGEMENT LOGIC ---
  const toggleColumnVisibility = (colId: string) => {
    setColumns(cols => cols.map(c => c.id === colId ? { ...c, visible: !c.visible } : c));
  };

  const moveColumn = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === columns.length - 1) return;
    
    const newCols = [...columns];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newCols[index], newCols[targetIndex]] = [newCols[targetIndex], newCols[index]];
    setColumns(newCols);
  };

  // --- SUBMISSION ACTIONS ---
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedRows(filteredSubmissions.map(s => s.id));
    else setSelectedRows([]);
  };

  const handleSelectRow = (id: string) => {
    if (selectedRows.includes(id)) setSelectedRows(selectedRows.filter(rowId => rowId !== id));
    else setSelectedRows([...selectedRows, id]);
  };

  const toggleProcessed = async (sub: any) => {
    // Optimistic UI update for is_processed
    setSubmissions(subs => subs.map(s => s.id === sub.id ? { ...s, is_processed: !s.is_processed } : s));
    
    try {
      await toggleSubmissionProcessedStatus(sub.id, sub.is_processed || false);
    } catch (e) {
      // Revert on failure
      setSubmissions(subs => subs.map(s => s.id === sub.id ? { ...s, is_processed: sub.is_processed } : s));
      alert("Failed to update status in database.");
    }
  };

  // --- CSV GENERATOR ---
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

    // 1. Get ONLY the visible columns in their exact ordered state
    const activeCols = columns.filter(c => c.visible);
    
    // 2. Build Headers - Prepend Event, Form, and explicitly add Is Test
    const headersArray = ['Event', 'Form', 'Is Test', ...activeCols.map(c => escapeCSV(c.label))];
    const headers = headersArray.join(',');
    
    // --- NEW: Prepare File Export Base URL ---
    // Fallback to window origin if the env var isn't set
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const fileDataKeys = formConfig?.schema?.fields?.filter((f: any) => f.type === 'file').map((f: any) => f.dataKey) || [];

    // 3. Build Rows based on selected submissions
    const selectedSubs = submissions.filter(s => selectedRows.includes(s.id));
    const csvRows = selectedSubs.map(sub => {
      
      // Read directly from the schema, fallback to event_id
      const rawEventCode = formConfig?.schema?.interimEventCode || formConfig?.event_id || 'MMC'; // <-- Renamed
      const eventIdVal = escapeCSV(rawEventCode);
      const formTitleVal = escapeCSV(formConfig?.title || '');
      const isTestVal = escapeCSV(sub.is_test ? 'TRUE' : 'FALSE');

      const rowValues = activeCols.map(c => {
        if (c.id === 'created_at') return escapeCSV(new Date(sub.created_at).toLocaleString());
        if (c.id === 'applicant_token') return escapeCSV(sub.applicant_token);
        
        let rawVal = sub.response?.[c.id];

        // --- NEW: Convert raw S3 keys to secure proxy URLs for CSV ---
        if (fileDataKeys.includes(c.id) && typeof rawVal === 'string' && rawVal.startsWith('submissions/')) {
          rawVal = `${baseUrl}/admin/file?path=${encodeURIComponent(rawVal)}`;
        } else if (Array.isArray(rawVal)) {
          rawVal = rawVal.join(', '); // Cleanly stringify checkbox arrays
        }

        return escapeCSV(rawVal);
      });

      return [eventIdVal, formTitleVal, isTestVal, ...rowValues].join(',');
    });

    const csvString = [headers, ...csvRows].join('\n');

    // 4. Trigger Download
    const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${formConfig?.title || 'Form'}_Export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    // 5. Update DB and local state for "is_processed" auto-flagging
    try {
      await bulkMarkAsProcessed(selectedRows);
      setSubmissions(subs => subs.map(sub => selectedRows.includes(sub.id) ? { ...sub, is_processed: true } : sub));
      setSelectedRows([]);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (e) {
      alert("Export successful, but failed to flag records as processed in the database.");
    }
  };

  // --- FILTERING & DISPLAY LOGIC ---
  const filteredSubmissions = submissions.filter(sub => {
    if (filterProcessed && sub.is_processed) return false;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const tokenMatch = (sub.applicant_token || '').toLowerCase().includes(term);
      const dataMatch = JSON.stringify(sub.response || {}).toLowerCase().includes(term);
      return tokenMatch || dataMatch;
    }
    
    return true;
  });

  // Check if we need to display the test column
  const hasTestData = filteredSubmissions.some(sub => sub.is_test);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full bg-gray-50">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-8 h-full relative">
      
      {showExportToast && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-xl flex items-center space-x-3 z-50 animate-in fade-in slide-in-from-top-4">
          <Check className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">CSV Exported & records marked as processed!</span>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <a href="/admin/forms" className="flex items-center text-sm text-gray-500 mb-2 hover:text-gray-900 cursor-pointer w-fit transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Forms
          </a>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Submissions: <span className="text-indigo-600">{formConfig?.title || 'Untitled Form'}</span>
          </h1>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-500 font-medium mr-2">
            {selectedRows.length} selected
          </span>
          <button 
            onClick={handleExportCSV}
            disabled={selectedRows.length === 0}
            className={`inline-flex items-center px-4 py-2.5 text-white text-sm font-medium rounded-lg shadow-sm transition-all focus:outline-none ${
              selectedRows.length > 0 ? 'bg-emerald-600 hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2' : 'bg-emerald-300 cursor-not-allowed'
            }`}
          >
            <Download className="w-4 h-4 mr-2" /> Export Selected CSV
          </button>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="bg-white p-4 rounded-t-xl border border-gray-200 border-b-0 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex-1 w-full flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search data or tokens..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 outline-none text-gray-900"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button 
            onClick={() => setFilterProcessed(!filterProcessed)}
            className={`inline-flex items-center px-3 py-2 border shadow-sm text-sm font-medium rounded-lg transition-colors ${
              filterProcessed ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className={`w-4 h-4 mr-2 ${filterProcessed ? 'text-indigo-600' : 'text-gray-500'}`} />
            Hide Processed
          </button>
        </div>
        
        {/* VIEW SETTINGS POPOVER */}
        <div className="relative">
          <button 
            onClick={() => setShowColManager(!showColManager)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
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
                      <button disabled={idx === 0} onClick={() => moveColumn(idx, 'up')} className="text-gray-400 hover:text-indigo-600 disabled:opacity-30"><ChevronUp className="w-3 h-3" /></button>
                      <button disabled={idx === columns.length - 1} onClick={() => moveColumn(idx, 'down')} className="text-gray-400 hover:text-indigo-600 disabled:opacity-30"><ChevronDown className="w-3 h-3" /></button>
                    </div>
                    <span className="text-sm text-gray-700 font-mono truncate flex-1">{col.label}</span>
                    <button onClick={() => toggleColumnVisibility(col.id)} className={`p-1.5 rounded-md ml-2 transition-colors ${col.visible ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 hover:bg-gray-100'}`}>
                      {col.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DYNAMIC DATA TABLE */}
      <div className="bg-white border border-gray-200 rounded-b-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left w-12 border-r border-gray-100">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                    onChange={handleSelectAll}
                    checked={filteredSubmissions.length > 0 && selectedRows.length === filteredSubmissions.length}
                  />
                </th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider border-r border-gray-100">
                  Processed
                </th>

                {/* Conditional Fixed Test Column Header */}
                {hasTestData && (
                  <th scope="col" className="px-3 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider border-r border-gray-100 whitespace-nowrap font-mono">
                    Test
                  </th>
                )}
                
                {/* Dynamically Map Visible Columns for Headers */}
                {columns.filter(c => c.visible).map(col => (
                  <th key={col.id} scope="col" className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap font-mono ${col.isMeta ? 'text-gray-500' : 'text-indigo-600 bg-indigo-50/30'}`}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={columns.filter(c => c.visible).length + (hasTestData ? 3 : 2)} className="px-6 py-12 text-center text-gray-500 text-sm">
                    No submissions found.
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((sub) => (
                  <tr key={sub.id} className={`transition-colors group ${selectedRows.includes(sub.id) ? 'bg-indigo-50/50' : 'hover:bg-gray-50/80'} ${sub.is_processed ? 'opacity-60' : ''}`}>
                    
                    <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                        checked={selectedRows.includes(sub.id)}
                        onChange={() => handleSelectRow(sub.id)}
                      />
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-center border-r border-gray-100">
                      <button 
                        onClick={() => toggleProcessed(sub)}
                        className="focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full p-0.5 transition-transform active:scale-95"
                        title={sub.is_processed ? "Mark as Unprocessed" : "Mark as Processed"}
                      >
                        {sub.is_processed ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5 text-gray-300 hover:text-gray-400" />}
                      </button>
                    </td>

                    {/* Conditional Fixed Test Column Cell */}
                    {hasTestData && (
                      <td className="px-3 py-4 whitespace-nowrap text-center border-r border-gray-100">
                        {sub.is_test && (
                          <div title="test data" className="inline-flex items-center justify-center">
                            <Beaker className="w-4 h-4 text-amber-500" />
                          </div>
                        )}
                      </td>
                    )}

                    {/* Dynamically Map Visible Columns for Cells */}
                    {columns.filter(c => c.visible).map(col => {
                      let cellValue: React.ReactNode = '-';
                      
                      if (col.id === 'created_at') {
                        cellValue = new Date(sub.created_at).toLocaleString();
                      } else if (col.id === 'applicant_token') {
                        cellValue = sub.applicant_token || '-';
                      } else {
                        const rawVal = sub.response?.[col.id];
                        const isFileField = formConfig?.schema?.fields?.find((f: any) => f.dataKey === col.id)?.type === 'file';

                        // --- NEW: Render UI link for files in the admin dashboard ---
                        if (isFileField && typeof rawVal === 'string' && rawVal.startsWith('submissions/')) {
                          const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
                          const fileUrl = `${baseUrl}/admin/file?path=${encodeURIComponent(rawVal)}`;
                          
                          cellValue = (
                            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 hover:underline font-medium">
                              {rawVal.split('/').pop()}
                            </a>
                          );
                        } else {
                          cellValue = Array.isArray(rawVal) ? rawVal.join(', ') : (rawVal || '-');
                        }
                      }

                      return (
                        <td key={col.id} className={`px-6 py-4 text-sm whitespace-nowrap truncate max-w-[250px] ${col.isMeta ? 'text-gray-500 font-mono text-xs' : 'text-gray-900'}`}>
                          {cellValue}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}