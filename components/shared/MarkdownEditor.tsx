'use client';

import React, { useRef, useState } from 'react';
import { ImageIcon, Loader2 } from 'lucide-react';
import { getPublicPresignedUploadUrl } from '@/app/admin/forms/builder/actions';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

export default function MarkdownEditor({ value, onChange, placeholder, rows = 3, className = '' }: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Helper to inject text exactly where the cursor is positioned
  const insertTextAtCursor = (textToInsert: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = value.substring(0, start) + textToInsert + value.substring(end);
    
    onChange(newValue);

    // Reset cursor position after React re-renders so the user doesn't lose their place
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + textToInsert.length;
      textarea.focus();
    }, 0);
  };

  const handleImageUpload = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    
    setIsUploading(true);
    try {
      const res = await getPublicPresignedUploadUrl(file.name, file.type);
      if (!res.success || !res.signedUrl || !res.finalUrl) {
        throw new Error('Failed to get upload URL');
      }

      // Upload directly to the new public R2 bucket
      const uploadRes = await fetch(res.signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadRes.ok) throw new Error('Upload failed');

      // Inject the markdown image syntax at the cursor
      insertTextAtCursor(`\n![${file.name}](${res.finalUrl})\n`);
    } catch (error) {
      console.error('Image upload error:', error);
      alert('Failed to upload image.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={`relative border border-gray-300 rounded-lg overflow-hidden bg-white focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-shadow ${className}`}>
      <textarea
        ref={textareaRef}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm text-gray-900 placeholder-gray-400 bg-transparent outline-none resize-y min-h-[80px]"
        disabled={isUploading}
      />
      
      {/* Formatting Toolbar / Footer */}
      <div className="flex items-center justify-between px-2 py-1.5 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center space-x-1">
          <label className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded cursor-pointer transition-colors" title="Upload Image">
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              disabled={isUploading}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleImageUpload(e.target.files[0]);
                  e.target.value = ''; // Reset input to allow uploading the same file again if needed
                }
              }} 
            />
          </label>
        </div>
        <span className="text-[10px] text-gray-400 font-medium tracking-wide">MARKDOWN SUPPORTED</span>
      </div>
    </div>
  );
}