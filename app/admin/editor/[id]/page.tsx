'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Settings, 
  Image as ImageIcon, 
  LayoutPanelLeft, 
  PanelLeft,
  GripVertical,
  Plus,
  X,
  Calendar,
  MapPin,
  LayoutTemplate,
  Link as LinkIcon,
  FileText
} from 'lucide-react';

const initialEnBlocks = [
  { id: 'en_1', type: 'h2', content: 'About the Program' },
  { id: 'en_2', type: 'p', content: 'Join us for a profound journey into mindfulness. This is designed to help you disconnect from the noise of daily life and reconnect with your inner stillness.' },
];

const initialZhBlocks = [
  { id: 'zh_1', type: 'h2', content: '關於本計劃' },
  { id: 'zh_2', type: 'p', content: '加入我們，展開一段深刻的正念之旅。本次活動旨在幫助您遠離日常生活的喧囂，重新與內在的寧靜建立連結。' },
];

// Next.js passes the URL parameters directly to the page component
export default function UnifiedEditorPage({ params }: { params: { id: string } }) {
  const [isSplitView, setIsSplitView] = useState(true);
  const [activeLang, setActiveLang] = useState<'en' | 'zh'>('en');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // PROTOTYPE ONLY: Let the user toggle the post type to see the dynamic metadata
  const [postType, setPostType] = useState<'event' | 'page' | 'resource'>('event');

  // In production, we would use the params.id to fetch the data from Supabase
  // useEffect(() => { fetchPost(params.id) }, [params.id]);

  const renderBlock = (block: any, lang: 'en' | 'zh') => {
    return (
      <div key={block.id} className="group relative flex items-start -ml-8 py-1">
        <div className="w-8 flex-shrink-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pt-1">
          <button className="p-1 text-gray-300 hover:text-gray-600 hover:bg-gray-100 rounded">
            <Plus className="w-4 h-4" />
          </button>
          <button className="p-1 text-gray-300 hover:text-gray-600 cursor-grab active:cursor-grabbing hover:bg-gray-100 rounded">
            <GripVertical className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 pl-2">
          {block.type === 'h2' && <h2 className="text-3xl font-bold text-gray-900 outline-none" contentEditable suppressContentEditableWarning>{block.content}</h2>}
          {block.type === 'h3' && <h3 className="text-xl font-semibold text-gray-800 outline-none mt-4" contentEditable suppressContentEditableWarning>{block.content}</h3>}
          {block.type === 'p' && <p className="text-gray-600 outline-none leading-relaxed min-h-[1.5em]" contentEditable suppressContentEditableWarning>{block.content}</p>}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden relative">
      
      {/* EDITOR HEADER */}
      <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 shrink-0 z-10 bg-white">
        <div className="flex items-center">
          <button onClick={() => window.history.back()} className="p-2 -ml-2 mr-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Editing {postType} ({params?.id || 'new'})
            </span>
            <h1 className="text-sm font-semibold text-gray-900">Daoji Foundation Program</h1>
          </div>
          <span className="ml-4 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            Published
          </span>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-gray-100 p-1 rounded-lg">
            <button 
              onClick={() => setIsSplitView(false)}
              className={`p-1.5 rounded-md text-sm font-medium flex items-center transition-colors ${!isSplitView ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              title="Single Pane"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setIsSplitView(true)}
              className={`p-1.5 rounded-md text-sm font-medium flex items-center transition-colors ${isSplitView ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              title="Split View"
            >
              <LayoutPanelLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="w-px h-6 bg-gray-200" />

          <button 
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`p-2 rounded-full transition-colors ${isSettingsOpen ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
            title="Metadata Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors">
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </button>
        </div>
      </div>

      {/* EDITOR WORKSPACE */}
      <div className="flex-1 flex overflow-hidden bg-gray-50/50">
        
        {/* ENGLISH PANE */}
        <div className={`flex-1 flex flex-col overflow-y-auto border-r border-gray-200 transition-all ${!isSplitView && activeLang === 'zh' ? 'hidden' : 'flex'}`}>
          {!isSplitView && (
             <div className="h-10 bg-gray-100 border-b border-gray-200 flex items-center px-4 space-x-2 shrink-0">
               <button onClick={() => setActiveLang('en')} className={`px-3 py-1 text-sm font-medium rounded-md ${activeLang === 'en' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-600 hover:bg-gray-200'}`}>English</button>
               <button onClick={() => setActiveLang('zh')} className={`px-3 py-1 text-sm font-medium rounded-md ${activeLang === 'zh' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-600 hover:bg-gray-200'}`}>中文</button>
             </div>
          )}
          {isSplitView && (
            <div className="h-8 bg-gray-100 border-b border-gray-200 flex items-center px-6 shrink-0">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">English Content</span>
            </div>
          )}
          <div className="flex-1 max-w-3xl mx-auto w-full p-12 lg:p-16">
            <div className="mb-12 group relative">
              <h1 className="text-4xl font-bold text-gray-900 placeholder-gray-300 outline-none" contentEditable suppressContentEditableWarning>
                Daoji Foundation Program
              </h1>
            </div>
            <div className="space-y-4">
               {initialEnBlocks.map(block => renderBlock(block, 'en'))}
            </div>
          </div>
        </div>

        {/* CHINESE PANE */}
        <div className={`flex-1 flex flex-col overflow-y-auto transition-all ${!isSplitView && activeLang === 'en' ? 'hidden' : 'flex'}`}>
           {!isSplitView && (
             <div className="h-10 bg-gray-100 border-b border-gray-200 flex items-center px-4 space-x-2 shrink-0">
               <button onClick={() => setActiveLang('en')} className={`px-3 py-1 text-sm font-medium rounded-md ${activeLang === 'en' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-600 hover:bg-gray-200'}`}>English</button>
               <button onClick={() => setActiveLang('zh')} className={`px-3 py-1 text-sm font-medium rounded-md ${activeLang === 'zh' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-600 hover:bg-gray-200'}`}>中文</button>
             </div>
          )}
          {isSplitView && (
            <div className="h-8 bg-gray-100 border-b border-gray-200 flex items-center px-6 shrink-0">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">中文內容</span>
            </div>
          )}
          <div className="flex-1 max-w-3xl mx-auto w-full p-12 lg:p-16">
            <div className="mb-12 group relative">
              <h1 className="text-4xl font-bold text-gray-900 placeholder-gray-300 outline-none" contentEditable suppressContentEditableWarning>
                道濟基金會計劃
              </h1>
            </div>
            <div className="space-y-4">
               {initialZhBlocks.map(block => renderBlock(block, 'zh'))}
            </div>
          </div>
        </div>
      </div>

      {/* METADATA SETTINGS SLIDE-OUT PANEL */}
      <div 
        className={`absolute inset-y-0 right-0 w-96 bg-white border-l border-gray-200 shadow-2xl transform transition-transform duration-300 ease-in-out z-40 flex flex-col ${isSettingsOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">Post Settings</h2>
          <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* PROTOTYPE TOGGLE: Switch post type */}
          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
            <label className="block text-xs font-bold text-indigo-800 uppercase tracking-wider mb-2">Prototype: Post Type</label>
            <div className="flex space-x-2">
              {(['event', 'page', 'resource'] as const).map(t => (
                <button 
                  key={t}
                  onClick={() => setPostType(t)}
                  className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors ${postType === t ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 border border-indigo-200'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* COMMON FIELDS (All types) */}
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-gray-900">Cover Image</label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer transition-colors">
              <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-indigo-600">Click to upload</span>
              <span className="text-xs text-gray-500 mt-1">16:9 ratio recommended</span>
            </div>
          </div>

          {/* CONDITIONAL: EVENT FIELDS */}
          {postType === 'event' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <hr className="border-gray-100" />
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-900">Schedule & Location</label>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input type="date" className="w-full pl-9 pr-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input type="date" className="w-full pl-9 pr-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between py-2 border-y border-gray-100 mt-2 mb-2">
                  <div>
                    <span className="text-sm font-medium text-gray-900">Recurring Event</span>
                    <p className="text-xs text-gray-500">Configure complex repeats (RRULE)</p>
                  </div>
                  <button className="relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none bg-gray-200">
                    <span className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-0" />
                  </button>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Human-Readable Display (Overrides dates on UI)</label>
                  <input type="text" placeholder="EN: 'Every Wednesday'" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                  <input type="text" placeholder="ZH: '每週三'" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                </div>

                <div className="relative pt-2">
                  <MapPin className="absolute left-3 top-4 w-4 h-4 text-gray-400" />
                  <input type="text" placeholder="Location Name" className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
              </div>

              <hr className="border-gray-100" />
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-900">Application Form</label>
                <p className="text-xs text-gray-500 mb-2">Select the primary form the "Apply Now" button should open.</p>
                <div className="relative">
                  <LayoutTemplate className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <select className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white">
                    <option>Standard Retreat Application</option>
                    <option>Weekly RSVP Form</option>
                    <option value="">None (Event is Informational)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* CONDITIONAL: PAGE FIELDS */}
          {postType === 'page' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <hr className="border-gray-100" />
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-900">Routing & Navigation</label>
                
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input type="text" placeholder="URL Slug (e.g., /about/team)" className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-indigo-500 focus:border-indigo-500" />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <span className="text-sm font-medium text-gray-900">Show in Main Navigation</span>
                    <p className="text-xs text-gray-500">Add to 'About Us' dropdown menu</p>
                  </div>
                  <button className="relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none bg-indigo-600">
                    <span className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CONDITIONAL: RESOURCE FIELDS */}
          {postType === 'resource' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <hr className="border-gray-100" />
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-semibold text-gray-900">Downloadable Assets</label>
                  <button className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">+ Add File</button>
                </div>
                <p className="text-xs text-gray-500 mb-2">Attach PDFs, audio, or external links for users to download. (Embed promo videos directly in the text editor).</p>

                <div className="space-y-3">
                  {/* Mock Downloadable File */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">meditation_guide.pdf</p>
                        <p className="text-xs text-gray-500">2.4 MB</p>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-red-500 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Mock External Link */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <LinkIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">External Audio Folder</p>
                        <p className="text-xs text-gray-500 truncate">drive.google.com/...</p>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-red-500 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer transition-colors mt-4">
                  <span className="text-sm font-medium text-indigo-600">Drag & Drop or Click to Upload</span>
                  <span className="text-xs text-gray-500 mt-1">Max 50MB per file</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}