'use client';

import React, { useState, useEffect } from 'react';
import { Video, ExternalLink, Copy, Check, X, Radio } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { LivestreamConfig } from '@/app/admin/(dashboard)/events/actions';

function YoutubeIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <polygon points="10 15 15 12 10 9 10 15" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

export interface LivestreamGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  streamConfig: LivestreamConfig;
}

export function LivestreamGatewayModal({
  isOpen,
  onClose,
  streamConfig,
}: LivestreamGatewayModalProps) {
  const t = useTranslations('EventDetail');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-stone-100 space-y-5 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-rose-600 animate-pulse" />
            <h3 className="text-sm font-bold text-stone-900">
              {t('liveGateways')}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* CHANNEL ENTRIES */}
        <div className="space-y-3">
          {/* ZOOM CHANNEL */}
          {streamConfig.zoom_url && (
            <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-stone-900">{t('zoomMeeting')}</span>
                </div>
                <a
                  href={streamConfig.zoom_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
                >
                  {t('directJoin')}
                </a>
              </div>

              {(streamConfig.zoom_meeting_id || streamConfig.zoom_passcode) && (
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-blue-200/50 text-xs">
                  {streamConfig.zoom_meeting_id && (
                    <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-blue-200/60">
                      <div>
                        <span className="text-[10px] text-stone-400 block uppercase">{t('meetingId')}</span>
                        <span className="font-mono font-bold text-stone-800">{streamConfig.zoom_meeting_id}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(streamConfig.zoom_meeting_id!, 'id')}
                        className="text-stone-400 hover:text-blue-600 transition-colors p-1"
                        title={t('copyId')}
                      >
                        {copiedField === 'id' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}

                  {streamConfig.zoom_passcode && (
                    <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-blue-200/60">
                      <div>
                        <span className="text-[10px] text-stone-400 block uppercase">{t('passcode')}</span>
                        <span className="font-mono font-bold text-stone-800">{streamConfig.zoom_passcode}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(streamConfig.zoom_passcode!, 'pwd')}
                        className="text-stone-400 hover:text-blue-600 transition-colors p-1"
                        title={t('copyPasscode')}
                      >
                        {copiedField === 'pwd' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* YOUTUBE CHANNEL */}
          {streamConfig.youtube_url && (
            <a
              href={streamConfig.youtube_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3.5 bg-red-50/60 hover:bg-red-50 text-red-900 rounded-2xl border border-red-100 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <YoutubeIcon className="w-4 h-4 text-red-600" />
                <span className="text-xs font-bold">{t('youtubeLive')}</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-red-400" />
            </a>
          )}

          {/* FACEBOOK CHANNEL */}
          {streamConfig.facebook_url && (
            <a
              href={streamConfig.facebook_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3.5 bg-indigo-50/60 hover:bg-indigo-50 text-indigo-900 rounded-2xl border border-indigo-100 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <FacebookIcon className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold">{t('facebookLive')}</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default LivestreamGatewayModal;