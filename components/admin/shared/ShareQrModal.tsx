'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Download, Loader2 } from 'lucide-react';

interface ShareQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
  filename: string;
}

export default function ShareQrModal({
  isOpen,
  onClose,
  title,
  url,
  filename,
}: ShareQrModalProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&margin=50&data=${encodeURIComponent(url)}`;
      const response = await fetch(qrApiUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${filename}-QR.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      alert('Failed to download QR code. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-6 space-y-6">
          {/* Public Link Copy */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Public Link</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={url}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono text-gray-600 outline-none select-all"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center justify-center px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* QR Code */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">QR Code (1000x1000)</label>
            <div className="flex items-center gap-6 p-4 border border-gray-100 rounded-xl bg-gray-50/50">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=10&data=${encodeURIComponent(url)}`}
                alt="QR Code Preview"
                className="w-24 h-24 rounded-lg bg-white p-2 shadow-xs border border-gray-200 object-contain"
              />
              <button
                type="button"
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex-1 flex items-center justify-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDownloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                Download PNG
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}