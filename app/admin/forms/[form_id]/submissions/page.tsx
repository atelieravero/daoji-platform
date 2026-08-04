'use client';

import React, { useState } from 'react';
import { 
  Download, 
  Search, 
  Filter, 
  Eye, 
  Trash2, 
  ArrowLeft,
  CheckCircle2,
  Circle,
  Check
} from 'lucide-react';

const mockFormSchema = {
  id: 'f_1',
  title: 'Standard Retreat Application',
  // The data keys represent the dynamic headers defined in the builder
  dataKeys: ['full_name', 'email_address', 'dietary_requirements'] 
};

const initialSubmissions = [
  {
    id: 'sub_1',
    mobileNumber: '+852 9123 4567',
    magicToken: 'abc-123-def',
    isTest: false,
    processed: true, // Already exported previously
    createdAt: '2026-08-15 14:32',
    answers: {
      full_name: 'Li Wei',
      email_address: 'li.wei@example.com',
      dietary_requirements: 'Vegetarian'
    }
  },
  {
    id: 'sub_2',
    mobileNumber: '+852 9876 5432',
    magicToken: 'xyz-987-uvw',
    isTest: false,
    processed: false, // New submission, waiting to be exported
    createdAt: '2026-08-16 09:15',
    answers: {
      full_name: 'Sarah Chen',
      email_address: 'sarah.c@example.com',
      dietary_requirements: 'None'
    }
  }
];

export default function FormSubmissionsPage({ params }: { params: { form_id: string } }) {
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [showExportToast, setShowToast] = useState(false);

  // Selection Logic
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedRows(submissions.map(s => s.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id: string) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter(rowId => rowId !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  // Toggle individual processed flag manually
  const toggleProcessed = (id: string) => {
    setSubmissions(submissions.map(s => 
      s.id === id ? { ...s, processed: !s.processed } : s
    ));
  };

  // Export Logic (Auto-flags selected rows as processed)
  const handleExportCSV = () => {
    if (selectedRows.length === 0) return;

    // 1. Mark selected rows as processed automatically
    setSubmissions(prev => prev.map(sub => 
      selectedRows.includes(sub.id) ? { ...sub, processed: true } : sub
    ));

    // 2. Clear selections
    setSelectedRows([]);

    // 3. Show success toast (mocking file download)
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-8 h-full relative">
      
      {/* MOCK TOAST NOTIFICATION */}
      {showExportToast && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-xl flex items-center space-x-3 z-50 animate-in fade-in slide-in-from-top-4">
          <Check className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">CSV Exported & records marked as processed!</span>
        </div>
      )}

      {/* HEADER & ACTIONS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <a href="/admin/forms" className="flex items-center text-sm text-gray-500 mb-2 hover:text-gray-900 cursor-pointer w-fit transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Forms
          </a>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Submissions: <span className="text-indigo-600">{mockFormSchema.title}</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">Form ID: {params?.form_id || 'f_1'}</p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-500 font-medium mr-2">
            {selectedRows.length} selected
          </span>
          <button 
            onClick={handleExportCSV}
            disabled={selectedRows.length === 0}
            className={`inline-flex items-center px-4 py-2.5 text-white text-sm font-medium rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:outline-none ${
              selectedRows.length > 0 
                ? 'bg-emerald-600 hover:bg-emerald-700' 
                : 'bg-emerald-300 cursor-not-allowed'
            }`}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Selected CSV
          </button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-t-xl border border-gray-200 border-b-0 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex-1 w-full flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by data or mobile..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 outline-none transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors shrink-0">
          <Filter className="w-4 h-4 mr-2 text-gray-500" />
          Filter Processed
        </button>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white border border-gray-200 rounded-b-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/50">
              <tr>
                {/* Master Checkbox */}
                <th scope="col" className="px-6 py-4 text-left w-12">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                    onChange={handleSelectAll}
                    checked={submissions.length > 0 && selectedRows.length === submissions.length}
                  />
                </th>
                
                {/* Meta Columns */}
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Processed
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Identity (Mobile / Token)
                </th>

                {/* Dynamic Data Key Columns */}
                {mockFormSchema.dataKeys.map(key => (
                  <th key={key} scope="col" className="px-6 py-4 text-left text-xs font-semibold text-indigo-600 uppercase tracking-wider bg-indigo-50/30">
                    {key}
                  </th>
                ))}

                {/* Actions */}
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            
            <tbody className="bg-white divide-y divide-gray-200">
              {submissions.map((sub) => (
                <tr 
                  key={sub.id} 
                  className={`transition-colors group ${selectedRows.includes(sub.id) ? 'bg-indigo-50/50' : 'hover:bg-gray-50/80'} ${sub.processed ? 'opacity-75' : ''}`}
                >
                  
                  {/* Row Checkbox */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                      checked={selectedRows.includes(sub.id)}
                      onChange={() => handleSelectRow(sub.id)}
                    />
                  </td>

                  {/* Processed Toggle */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button 
                      onClick={() => toggleProcessed(sub.id)}
                      className="focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full p-0.5"
                      title={sub.processed ? "Mark as Unprocessed" : "Mark as Processed"}
                    >
                      {sub.processed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-300 hover:text-gray-400" />
                      )}
                    </button>
                  </td>
                  
                  {/* Contact/Identity Info */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-medium">{sub.mobileNumber}</div>
                    <div className="text-xs font-mono text-gray-500 mt-1">
                      {sub.magicToken}
                    </div>
                  </td>

                  {/* Dynamic Answer Cells */}
                  {mockFormSchema.dataKeys.map(key => (
                    <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {/* @ts-ignore - we know answers is an object in our mock */}
                      {sub.answers[key] || <span className="text-gray-300">-</span>}
                    </td>
                  ))}
                  
                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="View Raw JSON">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete Submission">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}