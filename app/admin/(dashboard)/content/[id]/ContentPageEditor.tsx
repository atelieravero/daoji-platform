// app/admin/(dashboard)/content/[id]/ContentPageEditor.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Settings2,
  CalendarDays,
  Plus,
  X,
  ArrowUp,
  ArrowDown,
  Lock,
  AlertTriangle,
  FileText,
  Layout,
} from 'lucide-react';
import MediaPicker from '@/components/admin/MediaPicker';
import { FormInput, FormToggle } from '@/components/ui/FormControls';
import { AssetRecord } from '@/app/admin/(dashboard)/assets/actions';
import { DEFAULT_TIMEZONE } from '@/lib/timezones';
import { toDateTimeLocalString, fromDateTimeLocalToUTC } from '@/lib/date';
import {
  saveContentPageAction,
  ContentPageRecord,
  ContentType,
  ContentStatus,
  ContentPermissions,
  AttachedEventSummary,
} from '../actions';
import { isReservedSlug } from '@/components/admin/editor/UrlSlugInspector';

import EditorLayout from '@/components/admin/editor/EditorLayout';
import EditorHeader from '@/components/admin/editor/EditorHeader';
import CoverBannerPicker from '@/components/admin/editor/CoverBannerPicker';
import UrlSlugInspector from '@/components/admin/editor/UrlSlugInspector';
import BilingualCanvas from '@/components/admin/editor/BilingualCanvas';
import EventPickerModal from '@/components/admin/forms/EventPickerModal';

export interface ContentPageEditorProps {
  initialItem?: Partial<ContentPageRecord>;
  initialEvents?: AttachedEventSummary[];
  isNew?: boolean;
  permissions?: ContentPermissions;
}

export default function ContentPageEditor({
  initialItem,
  initialEvents = [],
  isNew = false,
  permissions = {
    canView: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canPublish: true,
  },
}: ContentPageEditorProps) {
  const router = useRouter();
  const isReadOnly = isNew ? !permissions.canCreate : !permissions.canEdit;

  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Identity State
  const [itemId, setItemId] = useState<string | undefined>(initialItem?.id);
  const [shortId, setShortId] = useState<string | undefined>(initialItem?.short_id);

  // Canvas View Mode
  const [isSplitView, setIsSplitView] = useState(true);
  const [activeLang, setActiveLang] = useState<'zh' | 'en'>('zh');

  // Publication & Type State
  const [type, setType] = useState<ContentType>(initialItem?.type || 'post');
  const [status, setStatus] = useState<ContentStatus>(initialItem?.status || 'draft');
  const [publishedAt, setPublishedAt] = useState<string>(
    initialItem?.published_at
      ? toDateTimeLocalString(initialItem.published_at, DEFAULT_TIMEZONE)
      : ''
  );

  // Bilingual Content Fields
  const [titleZh, setTitleZh] = useState(initialItem?.title_zh || '');
  const [titleEn, setTitleEn] = useState(initialItem?.title_en || '');
  const [summaryZh, setSummaryZh] = useState(initialItem?.summary_zh || '');
  const [summaryEn, setSummaryEn] = useState(initialItem?.summary_en || '');
  const [bodyZh, setBodyZh] = useState(initialItem?.body_zh || '');
  const [bodyEn, setBodyEn] = useState(initialItem?.body_en || '');

  // URL & Display Controls
  const [slug, setSlug] = useState(initialItem?.slug || '');
  const [isPinnedInFeed, setIsPinnedInFeed] = useState<boolean>(
    initialItem?.is_pinned_in_feed || false
  );
  const [isStandalone, setIsStandalone] = useState<boolean>(
    initialItem?.is_standalone || false
  );

  // Cover Image & Original Master Retention
  const [coverAssetUrl, setCoverAssetUrl] = useState<string | null>(
    initialItem?.cover_asset?.file_url || null
  );
  const [coverAssetId, setCoverAssetId] = useState<string | null>(
    initialItem?.cover_asset_id || null
  );
  const [coverOriginalAssetUrl, setCoverOriginalAssetUrl] = useState<string | null>(
    initialItem?.cover_original_asset?.file_url ||
      initialItem?.cover_asset?.file_url ||
      null
  );
  const [coverOriginalAssetId, setCoverOriginalAssetId] = useState<string | null>(
    initialItem?.cover_original_asset_id || initialItem?.cover_asset_id || null
  );
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  // Attached Events (event_articles)
  const [linkedEvents, setLinkedEvents] = useState<AttachedEventSummary[]>(initialEvents);
  const [showEventPicker, setShowEventPicker] = useState(false);

  const handleStatusChange = (nextStatus: ContentStatus) => {
    setStatus(nextStatus);
    if (nextStatus === 'published' && !publishedAt) {
      setPublishedAt(toDateTimeLocalString(new Date().toISOString(), DEFAULT_TIMEZONE));
    }
  };

  const handleMediaSelect = (asset: AssetRecord) => {
    setCoverAssetUrl(asset.file_url);
    setCoverAssetId(asset.id);
    setCoverOriginalAssetUrl(asset.file_url);
    setCoverOriginalAssetId(asset.id);
  };

  const moveLinkedEvent = (index: number, direction: 'up' | 'down') => {
    if (isReadOnly) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === linkedEvents.length - 1) return;
    const next = [...linkedEvents];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    [next[index], next[targetIdx]] = [next[targetIdx], next[index]];
    setLinkedEvents(next);
  };

  const handleSave = async () => {
    if (isReadOnly) return;

    if (!titleZh.trim()) {
      setErrorMessage('Chinese title (中文標題) is required.');
      return;
    }

    if (slug && isReservedSlug(slug)) {
      setErrorMessage(
        `"${slug}" is a system-reserved path and cannot be used as a URL slug.`
      );
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    const formattedPublishedAt = publishedAt
      ? fromDateTimeLocalToUTC(publishedAt, DEFAULT_TIMEZONE)
      : status === 'published'
      ? new Date().toISOString()
      : null;

    const payload: Partial<ContentPageRecord> = {
      ...(itemId ? { id: itemId } : {}),
      type,
      status,
      published_at: formattedPublishedAt,
      title_zh: titleZh.trim(),
      title_en: titleEn.trim() || null,
      summary_zh: summaryZh.trim() || null,
      summary_en: summaryEn.trim() || null,
      body_zh: bodyZh,
      body_en: bodyEn || null,
      cover_asset_id: coverAssetId,
      cover_original_asset_id: coverOriginalAssetId || coverAssetId,
      is_pinned_in_feed: type === 'post' ? isPinnedInFeed : false,
      is_standalone: isStandalone,
      slug: slug.trim() || null,
    };

    const linkedEventIds = type === 'post' ? linkedEvents.map((e) => e.id) : [];

    try {
      const res = await saveContentPageAction(payload, linkedEventIds);
      if (res.success && res.data) {
        if (!itemId) {
          setItemId(res.data.id);
          window.history.replaceState(null, '', `/admin/content/${res.data.id}`);
        }
        if (res.data.short_id) {
          setShortId(res.data.short_id);
        }
        if (res.data.published_at) {
          setPublishedAt(
            toDateTimeLocalString(res.data.published_at, DEFAULT_TIMEZONE)
          );
        }
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 2500);
        router.refresh();
      } else {
        setErrorMessage(res.error || 'Failed to save content.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  const identifier = slug || shortId;
  const previewUrl = identifier
    ? type === 'page'
      ? `/zh/${identifier}`
      : `/zh/post/${identifier}`
    : undefined;

  return (
    <>
      <EditorLayout
        errorMessage={errorMessage}
        onDismissError={() => setErrorMessage(null)}
        header={
          <EditorHeader
            backHref="/admin/content"
            title={titleZh || titleEn || (type === 'page' ? 'Untitled Page' : 'Untitled Post')}
            codeBadge={type === 'page' ? 'PAGE' : 'POST'}
            isSplitView={isSplitView}
            onToggleSplitView={setIsSplitView}
            previewUrl={previewUrl}
            onSave={handleSave}
            disabled={isReadOnly}
            isSaving={isSaving}
            saveLabel={
              isReadOnly
                ? 'View Only'
                : isSaving
                ? 'Saving...'
                : justSaved
                ? 'Saved!'
                : 'Save Changes'
            }
          />
        }
        canvas={
          <div className="flex-1 flex flex-col overflow-hidden">
            {isReadOnly && (
              <div className="mx-8 mt-6 p-3.5 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-center gap-3 text-amber-900 shadow-xs shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <div className="text-xs leading-relaxed">
                  <span className="font-bold block">Read-Only Mode</span>
                  You have view-only access to this content item. Editing requires the Content Editor or Event Coordinator role.
                </div>
              </div>
            )}

            <div className="flex-1 flex overflow-hidden">
              <BilingualCanvas
                isSplitView={isSplitView}
                activeLang={activeLang}
                onSelectLang={setActiveLang}
                titleZh={titleZh}
                onTitleZhChange={setTitleZh}
                titleEn={titleEn}
                onTitleEnChange={setTitleEn}
                summaryZh={summaryZh}
                onSummaryZhChange={setSummaryZh}
                summaryEn={summaryEn}
                onSummaryEnChange={setSummaryEn}
                bodyZh={bodyZh}
                onBodyZhChange={setBodyZh}
                bodyEn={bodyEn}
                onBodyEnChange={setBodyEn}
                bodyRows={15}
                disabled={isReadOnly}
              />
            </div>
          </div>
        }
        inspector={
          <>
            {/* INSPECTOR TOP BAR */}
            <div className="h-14 border-b border-gray-100 flex items-center justify-between px-6 bg-gray-50/50 shrink-0">
              <div className="flex items-center">
                <Settings2 className="w-4 h-4 text-gray-500 mr-2" />
                <span className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  {type === 'page' ? 'Page Settings' : 'Post Settings'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {isReadOnly && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100/70 border border-amber-200 px-2 py-0.5 rounded-md">
                    <Lock className="w-3 h-3" /> Read Only
                  </span>
                )}
                <select
                  value={status}
                  disabled={isReadOnly || !permissions.canPublish}
                  onChange={(e) => handleStatusChange(e.target.value as ContentStatus)}
                  className="text-xs font-semibold rounded-lg px-2.5 py-1.5 bg-white text-gray-950 border border-gray-300 shadow-xs focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-500"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            {/* INSPECTOR SCROLLABLE BODY */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* 1. CONTENT TYPE & PUBLICATION DATE */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                  Classification & Date
                </h3>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={isReadOnly}
                    onClick={() => setType('post')}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 cursor-pointer disabled:cursor-not-allowed ${
                      type === 'post'
                        ? 'bg-indigo-50/80 border-indigo-300 text-indigo-950 ring-2 ring-indigo-500/20'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <FileText
                      className={`w-4 h-4 mt-0.5 shrink-0 ${
                        type === 'post' ? 'text-indigo-600' : 'text-gray-400'
                      }`}
                    />
                    <div>
                      <span className="text-xs font-bold block">Post</span>
                      <span className="text-[10px] text-gray-500 block mt-0.5 font-mono">
                        /[locale]/post/...
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={isReadOnly}
                    onClick={() => setType('page')}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 cursor-pointer disabled:cursor-not-allowed ${
                      type === 'page'
                        ? 'bg-indigo-50/80 border-indigo-300 text-indigo-950 ring-2 ring-indigo-500/20'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Layout
                      className={`w-4 h-4 mt-0.5 shrink-0 ${
                        type === 'page' ? 'text-indigo-600' : 'text-gray-400'
                      }`}
                    />
                    <div>
                      <span className="text-xs font-bold block">Static Page</span>
                      <span className="text-[10px] text-gray-500 block mt-0.5 font-mono">
                        /[locale]/...
                      </span>
                    </div>
                  </button>
                </div>

                <FormInput
                  label="Publication Date & Time (HKT)"
                  type="datetime-local"
                  value={publishedAt}
                  disabled={isReadOnly}
                  onChange={(e) => setPublishedAt(e.target.value)}
                  helperText="Auto-populated on first publish if left blank. Shown on both Posts and Static Pages."
                />
              </div>

              <hr className="border-gray-100" />

              {/* 2. COVER BANNER (1.91:1 WITH MASTER RETENTION) */}
              <CoverBannerPicker
                label="Cover Banner Image"
                bannerUrl={coverAssetUrl}
                originalBannerUrl={coverOriginalAssetUrl || coverAssetUrl}
                disabled={isReadOnly}
                onOpenPicker={() => setIsMediaPickerOpen(true)}
                onRemoveBanner={() => {
                  setCoverAssetUrl(null);
                  setCoverAssetId(null);
                  setCoverOriginalAssetUrl(null);
                  setCoverOriginalAssetId(null);
                }}
                onCropSuccess={(croppedAsset) => {
                  setCoverAssetUrl(croppedAsset.file_url);
                  setCoverAssetId(croppedAsset.id);
                }}
              />

              <hr className="border-gray-100" />

              {/* 3. RELATED EVENTS (POSTS ONLY) */}
              {type === 'post' && (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                          Related Events
                        </h3>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Surfaces this post on the event page and displays the event card alongside this post.
                        </p>
                      </div>
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={() => setShowEventPicker(true)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Attach</span>
                        </button>
                      )}
                    </div>

                    {linkedEvents.length === 0 ? (
                      <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center text-xs text-gray-400">
                        No operational events attached to this post.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {linkedEvents.map((evt, idx) => (
                          <div
                            key={evt.id}
                            className="p-3 bg-indigo-50/40 rounded-xl border border-indigo-200/70 flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <CalendarDays className="w-4 h-4 text-indigo-600 shrink-0" />
                              <div className="truncate">
                                <div className="flex items-center gap-1.5">
                                  {evt.code && (
                                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 bg-white text-indigo-700 border border-indigo-200 rounded">
                                      [{evt.code}]
                                    </span>
                                  )}
                                  <Link
                                    href={`/admin/events/${evt.id}`}
                                    className="text-xs font-bold text-gray-900 hover:text-indigo-600 truncate"
                                  >
                                    {evt.title_zh}
                                  </Link>
                                </div>
                                {evt.title_en && (
                                  <p className="text-[11px] text-gray-500 truncate">
                                    {evt.title_en}
                                  </p>
                                )}
                              </div>
                            </div>

                            {!isReadOnly && (
                              <div className="flex items-center gap-0.5 shrink-0">
                                {linkedEvents.length > 1 && (
                                  <>
                                    <button
                                      type="button"
                                      disabled={idx === 0}
                                      onClick={() => moveLinkedEvent(idx, 'up')}
                                      className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 cursor-pointer"
                                      title="Move Up"
                                    >
                                      <ArrowUp className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={idx === linkedEvents.length - 1}
                                      onClick={() => moveLinkedEvent(idx, 'down')}
                                      className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 cursor-pointer"
                                      title="Move Down"
                                    >
                                      <ArrowDown className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                                <button
                                  type="button"
                                  onClick={() =>
                                    setLinkedEvents(
                                      linkedEvents.filter((e) => e.id !== evt.id)
                                    )
                                  }
                                  className="p-1 text-gray-400 hover:text-red-600 rounded cursor-pointer"
                                  title="Detach Event"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <hr className="border-gray-100" />
                </>
              )}

              {/* 4. URL SLUG, PINNING & STANDALONE PRESENTATION */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                  URL & Presentation
                </h3>

                {shortId && (
                  <div className="flex items-center justify-between text-xs bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
                    <span className="text-gray-500 font-medium">Immutable Short ID</span>
                    <code className="font-mono font-bold text-indigo-700">{shortId}</code>
                  </div>
                )}

                <UrlSlugInspector
                  slug={slug}
                  disabled={isReadOnly}
                  onChange={setSlug}
                  pathPrefix={type === 'page' ? '/' : '/post/'}
                  placeholder={type === 'page' ? 'about-us' : 'autumn-retreat-guide'}
                />

                {type === 'post' && (
                  <FormToggle
                    label="Pin to Top of News Feed"
                    helperText="Highlights this post at the top of the public /news bulletin feed."
                    checked={isPinnedInFeed}
                    onChange={(val) => !isReadOnly && setIsPinnedInFeed(val)}
                  />
                )}

                <FormToggle
                  label="Standalone Mode"
                  helperText="Strictly hides the website header, navigation bar, and footer on the public view."
                  checked={isStandalone}
                  onChange={(val) => !isReadOnly && setIsStandalone(val)}
                />
              </div>
            </div>
          </>
        }
      />

      {/* MEDIA POOL PICKER */}
      <MediaPicker
        isOpen={isMediaPickerOpen && !isReadOnly}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={handleMediaSelect}
        allowedCategory="image"
        title="Select Cover Banner from Media Pool"
      />

      {/* MULTI-EVENT PICKER MODAL */}
      <EventPickerModal
        isOpen={showEventPicker && !isReadOnly}
        onClose={() => setShowEventPicker(false)}
        multiSelect
        selectedEventIds={linkedEvents.map((e) => e.id)}
        onToggleEvent={(evt) => {
          setLinkedEvents((prev) => {
            if (prev.some((e) => e.id === evt.id)) {
              return prev.filter((e) => e.id !== evt.id);
            }
            return [
              ...prev,
              {
                id: evt.id,
                short_id: evt.short_id,
                slug: null,
                code: evt.code,
                title_zh: evt.title_zh,
                title_en: evt.title_en,
                status: evt.status,
              },
            ];
          });
        }}
      />
    </>
  );
}