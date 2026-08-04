'use client';

import React, { useState } from 'react';
import { 
  ArrowLeft, Save, Settings, PanelLeft, LayoutPanelLeft, GripVertical, Plus, X, 
  Calendar, MapPin, LayoutTemplate, Link as LinkIcon, Image as ImageIcon, 
  Type, Heading2, Heading3, Quote, List, Music, PlaySquare, Film, Map as MapIcon, Paperclip, FileText, Download, Trash2
} from 'lucide-react';

// Enhanced initial blocks to show off the new in-line media capabilities
const initialEnBlocks = [
  { id: 'en_1', type: 'h2', content: 'About the Program' },
  { id: 'en_2', type: 'p', content: 'Join us for a profound journey into mindfulness. This is designed to help you disconnect from the noise of daily life and reconnect with your inner stillness.' },
  { id: 'en_3', type: 'attachment', url: '#', name: 'Preparation Guide.pdf', size: '1.2 MB' },
  { id: 'en_4', type: 'h3', content: 'Location & Arrival' },
  { id: 'en_5', type: 'p', content: 'Please review the map below to find the correct entrance to the main hall.' },
  { id: 'en_6', type: 'map', embed: '<iframe>...</iframe>' },
];

export default function UnifiedEditorPage({ params }: { params: { id: string } }) {
  const [isSplitView, setIsSplitView] = useState(true);
  const [activeLang, setActiveLang] = useState<'en' | 'zh'>('en');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [postType, setPostType] = useState<'event' | 'page' | 'resource'>('event');
  
  // State to manage the open Slash Command menu
  const [slashMenuOpenFor, setSlashMenuOpenFor] = useState<string | null>(null);

  const SlashMenu = ({ blockId }: { blockId: string }) => {
    const menuGroups = [
      {
        title: 'Basic Blocks',
        items: [
          { icon: Type, label: 'Text', desc: 'Just start writing with plain text.' },
          { icon: Heading2, label: 'Heading 2', desc: 'Large section heading.' },
          { icon: Heading3, label: 'Heading 3', desc: 'Medium subsection heading.' },
          { icon: Quote, label: 'Quote', desc: 'Capture a quote or sutta.' },
          { icon: List, label: 'Bulleted List', desc: 'Create a simple bulleted list.' },
        ]
      },
      {
        title: 'Media & Files',
        items: [
          { icon: ImageIcon, label: 'Image', desc: 'Upload or embed with a link.' },
          { icon: Music, label: 'Audio', desc: 'Upload an mp3 for inline listening.' },
          { icon: PlaySquare, label: 'Embedded Video', desc: 'Embed from YouTube or Bilibili.' },
          { icon: Film, label: 'Native Video', desc: 'Upload directly (Max 64MB).' },
          { icon: MapIcon, label: 'Interactive Map', desc: 'Embed a Google or Baidu Map.' },
          { icon: Paperclip, label: 'File Attachment', desc: 'Upload a PDF, ZIP, or Doc.' },
        ]
      }
    ];

    return (
      <div className="absolute top-10 left-0 w-72 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
        <div className="max-h-80 overflow-y-auto p-2 hide-scrollbar">
          {menuGroups.map((group, idx) => (
            <div key={idx} className="mb-2 last:mb-0">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">
                {group.title}
              </div>
              {group.items.map((item, i) => (
                <button 
                  key={i}
                  onClick={() => setSlashMenuOpenFor(null)} // In a real app, this changes the block type
                  className="w-full flex items-start text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors group/item"
                >
                  <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0 mr-3 group-hover/item:border-indigo-300 transition-colors">
                    <item.icon className="w-5 h-5 text-gray-600 group-hover/item:text-indigo-600 transition-colors" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{item.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderBlock = (block: any, lang: 'en' | 'zh') => {
    return (
      <div key={block.id} className="group/block relative flex items-start -ml-12 py-2">
        {/* Block Controls (Drag & Add) */}
        <div className="w-12 flex-shrink-0 flex items-center justify-end pr-2 opacity-0 group-hover/block:opacity-100 transition-opacity pt-1">
          <button 
            onClick={() => setSlashMenuOpenFor(slashMenuOpenFor === block.id ? null : block.id)}
            className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
            title="Click to add block below, or type '/' in empty text"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button className="p-1 text-gray-300 hover:text-gray-600 cursor-grab active:cursor-grabbing hover:bg-gray-100 rounded transition-colors">
            <GripVertical className="w-4 h-4" />
          </button>
        </div>

        {/* Block Content Canvas */}
        <div className="flex-1 pl-2 relative">
          {slashMenuOpenFor === block.id && <SlashMenu blockId={block.id} />}

          {/* Text Blocks */}
          {block.type === 'h2' && <h2 className="text-3xl font-bold text-gray-900 outline-none" contentEditable suppressContentEditableWarning>{block.content}</h2>}
          {block.type === 'h3' && <h3 className="text-xl font-semibold text-gray-800 outline-none mt-4" contentEditable suppressContentEditableWarning>{block.content}</h3>}
          {block.type === 'p' && <p className="text-gray-600 outline-none leading-relaxed min-h-[1.5em]" contentEditable suppressContentEditableWarning>{block.content}</p>}
          
          {/* Media Blocks (Admin Preview State) */}
          {block.type === 'attachment' && (
            <div className="flex items-center p-3 my-4 bg-gray-50 border border-gray-200 rounded-xl relative group-hover/block:border-indigo-300 transition-colors">
               <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center mr-4 shrink-0">
                  <FileText className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <input type="text" defaultValue={block.name} className="bg-transparent font-medium text-gray-900 w-full outline-none focus:border-b focus:border-indigo-400 truncate" />
                  <p className="text-xs text-gray-500 mt-0.5">{block.size} • PDF Document</p>
                </div>
                <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-4">
                  <Trash2 className="w-4 h-4" />
                </button>
            </div>
          )}

          {block.type === 'map' && (
            <div className="my-6 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 flex flex-col items-center justify-center text-center relative group-hover/block:border-indigo-300 transition-colors">
              <MapIcon className="w-8 h-8 text-gray-400 mb-2" />
              <input type="text" placeholder="Paste Map Embed Iframe Code Here..." className="w-full max-w-md px-3 py-2 border border-gray-200 rounded text-sm text-center focus:ring-2 focus:ring-indigo-500 outline-none bg-white" />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden relative">
      
      {/* EDITOR HEADER */}
      <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 shrink-0 z-10 bg-white">
        <div className="flex items-center">
          <a href="/admin/events" className="p-2 -ml-2 mr-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </a>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Editing {postType}
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
        <div className={`flex-1 flex flex-col overflow-y-auto border-r border-gray-200 transition-all pb-32 ${!isSplitView && activeLang === 'zh' ? 'hidden' : 'flex'}`}>
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
            <div className="space-y-1">
               {initialEnBlocks.map(block => renderBlock(block, 'en'))}
               
               {/* Empty trailing block to show the slash command hint */}
               <div className="group/block relative flex items-start -ml-12 py-2 mt-4">
                  <div className="w-12 flex-shrink-0 flex items-center justify-end pr-2 opacity-0 group-hover/block:opacity-100 transition-opacity pt-1">
                    <button onClick={() => setSlashMenuOpenFor('new')} className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"><Plus className="w-4 h-4" /></button>
                  </div>
                  <div className="flex-1 pl-2 relative">
                    {slashMenuOpenFor === 'new' && <SlashMenu blockId="new" />}
                    <p className="text-gray-300 outline-none leading-relaxed min-h-[1.5em] italic" contentEditable suppressContentEditableWarning>Type '/' for commands</p>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* CHINESE PANE (Simplified for brevity) */}
        <div className={`flex-1 flex flex-col overflow-y-auto transition-all pb-32 ${!isSplitView && activeLang === 'en' ? 'hidden' : 'flex'}`}>
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
            <div className="mb-12">
              <h1 className="text-4xl font-bold text-gray-900 outline-none" contentEditable suppressContentEditableWarning>
                道濟基金會計劃
              </h1>
            </div>
             <p className="text-gray-300 outline-none leading-relaxed min-h-[1.5em] italic">Type '/' for commands</p>
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
          
          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex space-x-2">
            {(['event', 'page', 'resource'] as const).map(t => (
              <button 
                key={t} onClick={() => setPostType(t)}
                className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors ${postType === t ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 border border-indigo-200'}`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* COMMON FIELDS */}
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-gray-900">Cover Image</label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer transition-colors">
              <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-indigo-600">Click to upload</span>
            </div>
          </div>

          {/* EVENT METADATA ONLY */}
          {postType === 'event' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <hr className="border-gray-100" />
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-900">Schedule & Location</label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input type="date" className="w-full pl-9 pr-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input type="date" className="w-full pl-9 pr-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
                </div>
                <div className="relative pt-2">
                  <MapPin className="absolute left-3 top-4 w-4 h-4 text-gray-400" />
                  <input type="text" placeholder="Location Name" className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
              </div>

              <hr className="border-gray-100" />
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-900">Application Form</label>
                <div className="relative">
                  <LayoutTemplate className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <select className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white">
                    <option>Standard Retreat Application</option>
                    <option>Weekly RSVP Form</option>
                    <option value="">None (Informational Only)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* PAGE METADATA ONLY */}
          {postType === 'page' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <hr className="border-gray-100" />
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-900">Routing</label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input type="text" placeholder="URL Slug (e.g., /about/team)" className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
              </div>
            </div>
          )}

          {/* Notice: Resource Metadata section was removed! */}
        </div>
      </div>
    </div>
  );
}