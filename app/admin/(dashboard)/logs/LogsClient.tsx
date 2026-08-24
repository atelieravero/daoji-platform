'use client';

import React, { useState, useMemo } from 'react';
import { 
  RefreshCw, ChevronRight, ChevronDown, Copy, Check, 
  Columns, AlignJustify, Maximize2, Minimize2, FileText, Users 
} from 'lucide-react';
import { getAuditLogs } from './actions';
import AdminPageHeader from '@/components/admin/shared/AdminPageHeader';
import AdminTableToolbar from '@/components/admin/shared/AdminTableToolbar';
import AdminTableCard from '@/components/admin/shared/AdminTableCard';

type DiffType = 'equal' | 'add' | 'delete';

interface DiffLine {
  type: DiffType;
  oldLineNumber?: number;
  newLineNumber?: number;
  content: string;
}

interface SplitDiffRow {
  oldLine?: { number: number; content: string; type: 'delete' | 'equal' };
  newLine?: { number: number; content: string; type: 'add' | 'equal' };
  isChange: boolean;
}

function computeLineDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText ? oldText.split('\n') : [];
  const newLines = newText ? newText.split('\n') : [];

  const m = oldLines.length;
  const n = newLines.length;

  if (m === 0) {
    return newLines.map((line, i) => ({
      type: 'add',
      newLineNumber: i + 1,
      content: line,
    }));
  }

  if (n === 0) {
    return oldLines.map((line, i) => ({
      type: 'delete',
      oldLineNumber: i + 1,
      content: line,
    }));
  }

  const maxLines = 1200;
  const oldSlice = oldLines.slice(0, maxLines);
  const newSlice = newLines.slice(0, maxLines);
  const mS = oldSlice.length;
  const nS = newSlice.length;

  const dp: number[][] = Array.from({ length: mS + 1 }, () => new Array(nS + 1).fill(0));

  for (let i = 0; i < mS; i++) {
    for (let j = 0; j < nS; j++) {
      if (oldSlice[i] === newSlice[j]) {
        dp[i + 1][j + 1] = dp[i][j] + 1;
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  let i = mS;
  let j = nS;
  const diff: DiffLine[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldSlice[i - 1] === newSlice[j - 1]) {
      diff.unshift({
        type: 'equal',
        oldLineNumber: i,
        newLineNumber: j,
        content: oldSlice[i - 1],
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      diff.unshift({
        type: 'add',
        newLineNumber: j,
        content: newSlice[j - 1],
      });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      diff.unshift({
        type: 'delete',
        oldLineNumber: i,
        content: oldSlice[i - 1],
      });
      i--;
    }
  }

  return diff;
}

function buildSplitDiff(diff: DiffLine[]): SplitDiffRow[] {
  const rows: SplitDiffRow[] = [];
  let i = 0;

  while (i < diff.length) {
    const item = diff[i];

    if (item.type === 'equal') {
      rows.push({
        oldLine: { number: item.oldLineNumber!, content: item.content, type: 'equal' },
        newLine: { number: item.newLineNumber!, content: item.content, type: 'equal' },
        isChange: false,
      });
      i++;
    } else {
      const deletes: DiffLine[] = [];
      const adds: DiffLine[] = [];

      while (i < diff.length && diff[i].type !== 'equal') {
        if (diff[i].type === 'delete') deletes.push(diff[i]);
        else if (diff[i].type === 'add') adds.push(diff[i]);
        i++;
      }

      const count = Math.max(deletes.length, adds.length);
      for (let k = 0; k < count; k++) {
        rows.push({
          oldLine: deletes[k]
            ? { number: deletes[k].oldLineNumber!, content: deletes[k].content, type: 'delete' }
            : undefined,
          newLine: adds[k]
            ? { number: adds[k].newLineNumber!, content: adds[k].content, type: 'add' }
            : undefined,
          isChange: true,
        });
      }
    }
  }

  return rows;
}

interface DiffViewerProps {
  oldValues: any;
  newValues: any;
  operation: string;
  logId: string;
}

function GitHubDiffViewer({ oldValues, newValues, operation }: DiffViewerProps) {
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');
  const [showOnlyChanges, setShowOnlyChanges] = useState(true);
  const [copied, setCopied] = useState(false);

  const oldJsonStr = useMemo(() => {
    if (operation === 'CREATE' || !oldValues) return '';
    return JSON.stringify(oldValues, null, 2);
  }, [oldValues, operation]);

  const newJsonStr = useMemo(() => {
    if (operation === 'DELETE' || !newValues) return '';
    return JSON.stringify(newValues, null, 2);
  }, [newValues, operation]);

  const unifiedDiff = useMemo(() => computeLineDiff(oldJsonStr, newJsonStr), [oldJsonStr, newJsonStr]);
  const splitDiff = useMemo(() => buildSplitDiff(unifiedDiff), [unifiedDiff]);

  const stats = useMemo(() => {
    let additions = 0;
    let deletions = 0;
    unifiedDiff.forEach((d) => {
      if (d.type === 'add') additions++;
      if (d.type === 'delete') deletions++;
    });
    return { additions, deletions };
  }, [unifiedDiff]);

  const filteredSplitRows = useMemo(() => {
    if (!showOnlyChanges) return splitDiff;
    
    const keepIndices = new Set<number>();
    splitDiff.forEach((row, idx) => {
      if (row.isChange) {
        for (let offset = -3; offset <= 3; offset++) {
          const target = idx + offset;
          if (target >= 0 && target < splitDiff.length) {
            keepIndices.add(target);
          }
        }
      }
    });

    if (keepIndices.size === 0) return splitDiff;
    return splitDiff.filter((_, idx) => keepIndices.has(idx));
  }, [splitDiff, showOnlyChanges]);

  const filteredUnifiedRows = useMemo(() => {
    if (!showOnlyChanges) return unifiedDiff;

    const keepIndices = new Set<number>();
    unifiedDiff.forEach((line, idx) => {
      if (line.type !== 'equal') {
        for (let offset = -3; offset <= 3; offset++) {
          const target = idx + offset;
          if (target >= 0 && target < unifiedDiff.length) {
            keepIndices.add(target);
          }
        }
      }
    });

    if (keepIndices.size === 0) return unifiedDiff;
    return unifiedDiff.filter((_, idx) => keepIndices.has(idx));
  }, [unifiedDiff, showOnlyChanges]);

  const copyDiff = () => {
    const payload = JSON.stringify({ old_values: oldValues, new_values: newValues }, null, 2);
    navigator.clipboard.writeText(payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#0d1117] text-[#c9d1d9] rounded-xl border border-[#30363d] overflow-hidden text-xs font-mono shadow-2xl">
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-[#161b22] border-b border-[#30363d] gap-3">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Delta Changes
          </span>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="px-1.5 py-0.5 rounded bg-[#238636]/20 text-[#3fb950] font-bold border border-[#238636]/40">
              +{stats.additions}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-[#da3633]/20 text-[#f85149] font-bold border border-[#da3633]/40">
              -{stats.deletions}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowOnlyChanges(!showOnlyChanges)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors border ${
              showOnlyChanges
                ? 'bg-[#1f6feb]/20 text-[#58a6ff] border-[#1f6feb]/40'
                : 'bg-[#21262d] text-gray-300 border-[#30363d] hover:bg-[#30363d]'
            }`}
          >
            {showOnlyChanges ? (
              <span className="flex items-center gap-1">
                <Minimize2 className="w-3 h-3" /> Changed Hunks
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Maximize2 className="w-3 h-3" /> Full File
              </span>
            )}
          </button>

          <div className="inline-flex rounded-md border border-[#30363d] bg-[#21262d] p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                viewMode === 'split' ? 'bg-[#30363d] text-white shadow-xs' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Columns className="w-3 h-3" /> Split
            </button>
            <button
              type="button"
              onClick={() => setViewMode('unified')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                viewMode === 'unified' ? 'bg-[#30363d] text-white shadow-xs' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <AlignJustify className="w-3 h-3" /> Unified
            </button>
          </div>

          <button
            type="button"
            onClick={copyDiff}
            className="flex items-center px-2.5 py-1 bg-[#21262d] hover:bg-[#30363d] text-gray-300 border border-[#30363d] rounded text-[11px] transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3 h-3 text-[#3fb950] mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
            {copied ? 'Copied' : 'Copy JSON'}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto max-h-[500px] overflow-y-auto leading-5 text-[11.5px] select-text">
        {viewMode === 'split' ? (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#161b22] text-[#8b949e] border-b border-[#30363d] text-[10px] uppercase font-bold">
                <th className="w-10 px-2 py-1 text-right border-r border-[#30363d]">#</th>
                <th className="px-3 py-1 text-left border-r border-[#30363d]">Original Value</th>
                <th className="w-10 px-2 py-1 text-right border-r border-[#30363d]">#</th>
                <th className="px-3 py-1 text-left">Modified Value</th>
              </tr>
            </thead>
            <tbody>
              {filteredSplitRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-500 font-sans">
                    No field modifications detected.
                  </td>
                </tr>
              ) : (
                filteredSplitRows.map((row, idx) => {
                  const isOldDel = row.oldLine?.type === 'delete';
                  const isNewAdd = row.newLine?.type === 'add';

                  return (
                    <tr key={idx} className="border-b border-[#21262d]/40">
                      {row.oldLine ? (
                        <>
                          <td
                            className={`w-10 px-2 py-0.5 text-right select-none font-mono text-[10px] border-r border-[#30363d] ${
                              isOldDel ? 'bg-[#da3633]/25 text-[#f85149] font-bold' : 'text-[#484f58] bg-[#0d1117]'
                            }`}
                          >
                            {row.oldLine.number}
                          </td>
                          <td
                            className={`px-3 py-0.5 font-mono whitespace-pre-wrap break-all border-r border-[#30363d] ${
                              isOldDel ? 'bg-[#da3633]/15 text-[#ff7b72]' : 'text-[#8b949e]'
                            }`}
                          >
                            {isOldDel && <span className="inline-block w-3 select-none text-[#f85149] font-bold">-</span>}
                            {row.oldLine.content}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="w-10 bg-[#161b22]/70 border-r border-[#30363d]" />
                          <td className="px-3 py-0.5 border-r border-[#30363d] bg-[repeating-linear-gradient(45deg,#161b22_0,#161b22_10px,#0d1117_10px,#0d1117_20px)]" />
                        </>
                      )}

                      {row.newLine ? (
                        <>
                          <td
                            className={`w-10 px-2 py-0.5 text-right select-none font-mono text-[10px] border-r border-[#30363d] ${
                              isNewAdd ? 'bg-[#238636]/25 text-[#3fb950] font-bold' : 'text-[#484f58] bg-[#0d1117]'
                            }`}
                          >
                            {row.newLine.number}
                          </td>
                          <td
                            className={`px-3 py-0.5 font-mono whitespace-pre-wrap break-all ${
                              isNewAdd ? 'bg-[#238636]/15 text-[#7ee787]' : 'text-[#c9d1d9]'
                            }`}
                          >
                            {isNewAdd && <span className="inline-block w-3 select-none text-[#3fb950] font-bold">+</span>}
                            {row.newLine.content}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="w-10 bg-[#161b22]/70 border-r border-[#30363d]" />
                          <td className="px-3 py-0.5 bg-[repeating-linear-gradient(45deg,#161b22_0,#161b22_10px,#0d1117_10px,#0d1117_20px)]" />
                        </>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full border-collapse">
            <tbody>
              {filteredUnifiedRows.map((line, idx) => {
                const isDel = line.type === 'delete';
                const isAdd = line.type === 'add';

                return (
                  <tr
                    key={idx}
                    className={`border-b border-[#21262d]/40 ${
                      isDel
                        ? 'bg-[#da3633]/15 text-[#ff7b72]'
                        : isAdd
                        ? 'bg-[#238636]/15 text-[#7ee787]'
                        : 'text-[#8b949e]'
                    }`}
                  >
                    <td className="w-10 px-2 py-0.5 text-right select-none font-mono text-[10px] text-[#484f58] border-r border-[#30363d]">
                      {line.oldLineNumber || ''}
                    </td>
                    <td className="w-10 px-2 py-0.5 text-right select-none font-mono text-[10px] text-[#484f58] border-r border-[#30363d]">
                      {line.newLineNumber || ''}
                    </td>
                    <td className="w-6 px-1.5 py-0.5 text-center font-bold select-none">
                      {isDel ? '-' : isAdd ? '+' : ' '}
                    </td>
                    <td className="px-3 py-0.5 font-mono whitespace-pre-wrap break-all">
                      {line.content}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function formatEntityDisplay(log: any) {
  const isForm = log.table_name === 'forms';
  const isTeam = log.table_name === 'team_members';

  let primaryTitle = log.record_label;

  if (!primaryTitle || primaryTitle === log.record_id) {
    const val = log.new_values || log.old_values || {};
    if (isForm) {
      primaryTitle = val.title || val.slug || `Form (${log.record_id.slice(0, 8)})`;
    } else if (isTeam) {
      primaryTitle = val.display_name 
        ? `${val.display_name} (${val.email || ''})` 
        : val.email || `Member (${log.record_id.slice(0, 8)})`;
    } else {
      primaryTitle = log.record_id;
    }
  }

  const val = log.new_values || log.old_values || {};
  let subContext = '';
  if (isForm && val.slug) {
    subContext = `slug: /${val.slug}`;
  } else {
    subContext = `id: ${log.record_id.slice(0, 8)}...`;
  }

  return {
    icon: isForm ? FileText : Users,
    primaryTitle,
    subContext,
  };
}

export default function LogsClient({ initialLogs = [] }: { initialLogs: any[] }) {
  const [logs, setLogs] = useState<any[]>(initialLogs);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOp, setSelectedOp] = useState<string>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchLogs = async (search = searchTerm, op = selectedOp) => {
    setIsLoading(true);
    try {
      const data = await getAuditLogs({ search, operation: op });
      setLogs(data);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    fetchLogs(val, selectedOp);
  };

  const handleOpChange = (op: string) => {
    setSelectedOp(op);
    fetchLogs(searchTerm, op);
  };

  const toggleExpand = (id: string) => {
    setExpandedLogId((prev) => (prev === id ? null : id));
  };

  const getOperationBadge = (op: string) => {
    switch (op?.toUpperCase()) {
      case 'CREATE':
        return <span className="px-2 py-0.5 text-xs font-mono font-bold rounded bg-emerald-100 text-emerald-700 border border-emerald-200">CREATE</span>;
      case 'UPDATE':
        return <span className="px-2 py-0.5 text-xs font-mono font-bold rounded bg-blue-100 text-blue-700 border border-blue-200">UPDATE</span>;
      case 'DELETE':
        return <span className="px-2 py-0.5 text-xs font-mono font-bold rounded bg-red-100 text-red-700 border border-red-200">DELETE</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-mono font-bold rounded bg-gray-100 text-gray-700">{op}</span>;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-8 h-full font-sans">
      {/* HEADER */}
      <AdminPageHeader
        title="Audit Logs Explorer"
        description="Read-only, automated Change Data Capture (CDC) audit trail for forms, team members, and events."
      >
        <button
          type="button"
          onClick={() => fetchLogs()}
          disabled={isLoading}
          className="inline-flex items-center px-3.5 py-2 border border-gray-300 shadow-xs text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 mr-2 text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </AdminPageHeader>

      {/* FILTER TOOLBAR */}
      <AdminTableToolbar
        search={searchTerm}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search form name, team member, email..."
        statusFilter={selectedOp}
        onStatusFilterChange={handleOpChange}
        filterOptions={[
          { value: 'all', label: 'All' },
          { value: 'CREATE', label: 'CREATE' },
          { value: 'UPDATE', label: 'UPDATE' },
          { value: 'DELETE', label: 'DELETE' },
        ]}
      />

      {/* CDC AUDIT TABLE */}
      <AdminTableCard
        isLoading={isLoading}
        loadingText="Loading mutation events..."
        isEmpty={logs.length === 0}
        emptyTitle="No CDC log records found"
        emptyDescription="System changes will automatically register here."
      >
        <table className="min-w-full divide-y divide-gray-200 font-mono text-xs">
          <thead className="bg-gray-50/75">
            <tr>
              <th scope="col" className="w-8 px-4 py-3"></th>
              <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-500 uppercase">Actor</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-500 uppercase">Timestamp</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-500 uppercase">Operation</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-500 uppercase">Target Entity</th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-100">
            {logs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              const actorDisplay =
                log.actor_name && log.actor_name !== 'system'
                  ? `${log.actor_name} (${log.actor_email})`
                  : log.actor_email || 'system';

              const entity = formatEntityDisplay(log);
              const Icon = entity.icon;

              return (
                <React.Fragment key={log.id}>
                  <tr
                    onClick={() => toggleExpand(log.id)}
                    className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                      isExpanded ? 'bg-indigo-50/40' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-gray-400">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-900 font-medium font-sans">
                      {actorDisplay}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getOperationBadge(log.operation)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-gray-400 shrink-0" />
                        <div>
                          <div className="font-semibold text-gray-900 font-sans truncate max-w-sm">
                            {entity.primaryTitle}
                          </div>
                          <div className="text-[11px] text-gray-400 font-mono">
                            {log.table_name} • {entity.subContext}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>

                  {/* EXPANDED GITHUB-STYLE DIFF DRAWER */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={5} className="px-6 py-5 bg-gray-900 border-y border-gray-800">
                        <GitHubDiffViewer
                          oldValues={log.old_values}
                          newValues={log.new_values}
                          operation={log.operation}
                          logId={log.id}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </AdminTableCard>
    </div>
  );
}