'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  History,
  Activity,
  FileEdit,
  Trash2,
  LogIn,
  Power
} from 'lucide-react';

const mockLogs = [
  {
    id: 'log_1',
    timestamp: '2026-08-04 16:45:12',
    admin_name: 'Master Lin',
    admin_email: 'director@daoji.org',
    action: 'UPDATE',
    module: 'admins',
    target: 'Alex Former',
    details: 'Suspended user account',
    ip_address: '192.168.1.104'
  },
  {
    id: 'log_2',
    timestamp: '2026-08-04 14:20:05',
    admin_name: 'Sarah Chen',
    admin_email: 'sarah.chen@daoji.org',
    action: 'UPDATE',
    module: 'forms',
    target: 'Standard Retreat Application',
    details: 'Changed status from draft to open',
    ip_address: '203.0.113.42'
  },
  {
    id: 'log_3',
    timestamp: '2026-08-03 10:15:00',
    admin_name: 'Sarah Chen',
    admin_email: 'sarah.chen@daoji.org',
    action: 'CREATE',
    module: 'forms',
    target: 'Standard Retreat Application',
    details: 'Created new form schema',
    ip_address: '203.0.113.42'
  },
  {
    id: 'log_4',
    timestamp: '2026-08-03 09:00:22',
    admin_name: 'Master Lin',
    admin_email: 'director@daoji.org',
    action: 'LOGIN',
    module: 'auth',
    target: 'System',
    details: 'Logged in via Magic Link',
    ip_address: '192.168.1.104'
  },
  {
    id: 'log_5',
    timestamp: '2026-08-02 16:30:00',
    admin_name: 'John Writer',
    admin_email: 'volunteer_copy@daoji.org',
    action: 'UPDATE',
    module: 'posts',
    target: '7-Day Silent Zen Retreat',
    details: 'Updated English description content',
    ip_address: '198.51.100.7'
  }
];

export default function AuditLogsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const getActionIcon = (action: string) => {
    switch(action) {
      case 'CREATE': return <PlusIcon className="w-4 h-4 text-emerald-600" />;
      case 'UPDATE': return <FileEdit className="w-4 h-4 text-blue-600" />;
      case 'DELETE': return <Trash2 className="w-4 h-4 text-red-600" />;
      case 'LOGIN': return <LogIn className="w-4 h-4 text-purple-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };
  
  // Local simple icon for CREATE to avoid lucide import issues if Plus isn't imported
  const PlusIcon = ({ className }: { className: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="M12 5v14"/></svg>
  );

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-8 h-full">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center">
            <History className="w-6 h-6 mr-2 text-indigo-600" />
            Audit Logs
          </h1>
          <p className="text-sm text-gray-500 mt-1">Read-only, immutable history of all critical admin actions across the platform.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-t-xl border border-gray-200 border-b-0 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search logs by admin, module, or details..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 outline-none transition-colors text-gray-900 placeholder-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors">
          <Filter className="w-4 h-4 mr-2 text-gray-500" />
          Filter by Action
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-b-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Admin User
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/3">
                  Target & Details
                </th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  IP Address
                </th>
              </tr>
            </thead>
            
            <tbody className="bg-white divide-y divide-gray-200 text-sm">
              {mockLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-mono text-xs">
                    {log.timestamp}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{log.admin_name}</div>
                    <div className="text-xs text-gray-500">{log.admin_email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`p-1.5 rounded-md mr-2 ${
                        log.action === 'CREATE' ? 'bg-emerald-50' :
                        log.action === 'UPDATE' ? 'bg-blue-50' :
                        log.action === 'DELETE' ? 'bg-red-50' : 'bg-purple-50'
                      }`}>
                        {getActionIcon(log.action)}
                      </div>
                      <span className="font-semibold text-gray-700">{log.action}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center mb-1">
                      <span className="px-2 py-0.5 rounded text-xs font-mono bg-gray-100 text-gray-600 mr-2">
                        {log.module}
                      </span>
                      <span className="font-medium text-gray-900">{log.target}</span>
                    </div>
                    <div className="text-gray-500 text-xs mt-1 truncate max-w-sm" title={log.details}>
                      {log.details}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-gray-400 font-mono text-xs">
                    {log.ip_address}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Audit logs are retained permanently and cannot be altered or deleted.
          </p>
        </div>
      </div>
      
    </div>
  );
}