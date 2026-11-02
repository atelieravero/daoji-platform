// app/admin/(dashboard)/content/ContentClient.tsx
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  FileText,
  Layout,
  Eye,
  Trash2,
  Copy,
  Share2,
  Pin,
  CalendarDays,
} from 'lucide-react';
import {
  listContentPagesAction,
  deleteContentPageAction,
  saveContentPageAction,
  updateContentStatusAction,
  ContentPageRecord,
  ContentStatus,
  ContentPermissions,
} from './actions';
import AdminPageHeader from '@/components/admin/shared/AdminPageHeader';
import AdminTableToolbar from '@/components/admin/shared/AdminTableToolbar';
import AdminTableCard from '@/components/admin/shared/AdminTableCard';
import AdminStatusBanner from '@/components/admin/shared/AdminStatusBanner';
import StatusBadgeSelect from '@/components/admin/shared/StatusBadgeSelect';
import ShareQrModal from '@/components/admin/shared/ShareQrModal';

interface ContentClientProps {
  permissions: ContentPermissions;
  initialItems: ContentPageRecord[];
  initialTotal: number;
}

export default function ContentClient({
  permissions,
  initialItems,
  initialTotal,
}: ContentClientProps) {
  const router = useRouter();
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<ContentPageRecord[]>(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [shareItem, setShareItem] = useState<ContentPageRecord | null>(null);

  const fetchItems = useCallback(
    async (nextType = typeFilter, nextStatus = statusFilter, nextSearch = search) => {
      setIsLoading(true);
      try {
        const res = await listContentPagesAction({
          type: nextType,
          status: nextStatus,
          search: nextSearch,
          limit: 50,
        });
        setItems(res.data);
        setTotal(res.total);
      } catch (err) {
        console.error('Error loading content pages:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [typeFilter, statusFilter, search]
  );

  // Debounce search and filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchItems(typeFilter, statusFilter, search);
    }, 200);
    return () => clearTimeout(timer);
  }, [typeFilter, statusFilter, search, fetchItems]);

  const handleDelete = async (item: ContentPageRecord) => {
    if (!permissions.canDelete) return;
    if (!confirm(`Are you sure you want to delete "${item.title_zh}"?`)) return;

    try {
      const res = await deleteContentPageAction(item.id);
      if (res.success) {
        setStatusMessage({ type: 'success', text: 'Content deleted successfully.' });
        fetchItems();
      } else {
        setStatusMessage({ type: 'error', text: res.error || 'Failed to delete content.' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to delete content.' });
    }
  };

  const handleDuplicate = async (item: ContentPageRecord) => {
    if (!permissions.canCreate) return;
    try {
      const linkedEventIds = (item.event_articles || []).map((ea) => ea.event_id);
      const res = await saveContentPageAction(
        {
          type: item.type,
          title_zh: `${item.title_zh} (Copy)`,
          title_en: item.title_en ? `${item.title_en} (Copy)` : null,
          summary_zh: item.summary_zh,
          summary_en: item.summary_en,
          body_zh: item.body_zh,
          body_en: item.body_en,
          cover_asset_id: item.cover_asset_id,
          cover_original_asset_id: item.cover_original_asset_id,
          is_pinned_in_feed: false,
          is_standalone: item.is_standalone,
          status: 'draft',
          slug: null,
        },
        linkedEventIds
      );

      if (res.success && res.data) {
        router.push(`/admin/content/${res.data.id}`);
      } else {
        setStatusMessage({ type: 'error', text: res.error || 'Failed to duplicate content.' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to duplicate content.' });
    }
  };

  const handleStatusChange = async (item: ContentPageRecord, newStatus: string) => {
    if (!permissions.canPublish) return;
    try {
      const res = await updateContentStatusAction(item.id, newStatus as ContentStatus);
      if (res.success && res.data) {
        setItems((prev) => prev.map((p) => (p.id === item.id ? res.data! : p)));
      } else {
        setStatusMessage({ type: 'error', text: res.error || 'Failed to update status.' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update status.' });
    }
  };

  const getPublicPath = (item: ContentPageRecord) => {
    const identifier = item.slug || item.short_id;
    return item.type === 'page' ? `/zh/${identifier}` : `/zh/post/${identifier}`;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-8 h-full font-sans relative">
      <ShareQrModal
        isOpen={Boolean(shareItem)}
        onClose={() => setShareItem(null)}
        title={shareItem?.type === 'page' ? 'Share Static Page' : 'Share Post'}
        url={
          shareItem
            ? `${typeof window !== 'undefined' ? window.location.origin : ''}${getPublicPath(shareItem)}`
            : ''
        }
        filename={shareItem?.slug || shareItem?.short_id || 'content'}
      />

      <AdminPageHeader
        title="Pages & Posts"
        description="Create and manage editorial posts, event announcements, and static reference pages."
        actionButton={
          permissions.canCreate
            ? { label: 'Create Content', href: '/admin/content/new', icon: Plus }
            : undefined
        }
      />

      <AdminStatusBanner
        message={statusMessage}
        onDismiss={() => setStatusMessage(null)}
        className="mb-6 rounded-xl"
      />

      {/* CONTENT TYPE SEGMENTED FILTER */}
      <div className="flex items-center justify-between mb-4">
        <div className="inline-flex bg-gray-200/80 p-1 rounded-xl">
          {[
            { value: 'all', label: 'All Content' },
            { value: 'post', label: 'Posts (/post/...)' },
            { value: 'page', label: 'Static Pages (/...)' },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setTypeFilter(tab.value)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                typeFilter === tab.value
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-500 font-medium">
          Showing {items.length} of {total}
        </span>
      </div>

      <AdminTableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by Chinese/English title, vanity slug, or short ID..."
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        filterOptions={[
          { value: 'all', label: 'All' },
          { value: 'published', label: 'Published' },
          { value: 'unlisted', label: 'Unlisted' },
          { value: 'draft', label: 'Draft' },
          { value: 'archived', label: 'Archived' },
        ]}
      />

      <AdminTableCard
        isLoading={isLoading}
        loadingText="Loading pages and posts..."
        isEmpty={items.length === 0}
        emptyTitle="No pages or posts found"
        emptyDescription="Create a new post or static page, or adjust your filters."
      >
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50/50">
            <tr>
              <th
                scope="col"
                className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-2/5"
              >
                Title & Permalink
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                Type & Attached Events
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                Published Date
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item) => {
              const isPage = item.type === 'page';
              const attachedEvents = (item.event_articles || [])
                .map((ea) => ea.events)
                .filter(Boolean);
              const publicHref = getPublicPath(item);

              return (
                <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                  {/* 1. TITLE & PERMALINK */}
                  <td className="px-6 py-4">
                    <div className="flex items-start">
                      <div
                        className={`shrink-0 h-10 w-10 rounded-xl flex items-center justify-center border mt-0.5 ${
                          isPage
                            ? 'bg-amber-50 text-amber-600 border-amber-100'
                            : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                        }`}
                      >
                        {isPage ? (
                          <Layout className="h-5 w-5" />
                        ) : (
                          <FileText className="h-5 w-5" />
                        )}
                      </div>
                      <div className="ml-4 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/admin/content/${item.id}`}
                            className="text-sm font-bold text-gray-900 hover:text-indigo-600 transition-colors"
                          >
                            {item.title_zh}
                          </Link>
                          {item.is_pinned_in_feed && !isPage && (
                            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                              <Pin className="w-2.5 h-2.5" /> Pinned
                            </span>
                          )}
                          {item.is_standalone && (
                            <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded font-mono">
                              Standalone
                            </span>
                          )}
                        </div>

                        {item.title_en && (
                          <div className="text-xs text-gray-500">{item.title_en}</div>
                        )}

                        <div className="flex items-center gap-2 font-mono text-[11px] text-gray-400">
                          <span>id: {item.short_id}</span>
                          <span className="text-indigo-600 font-medium">
                            {isPage
                              ? `/${item.slug || item.short_id}`
                              : `/post/${item.slug || item.short_id}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* 2. TYPE & ATTACHED EVENTS */}
                  <td className="px-6 py-4">
                    <div className="space-y-1.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                          isPage
                            ? 'bg-amber-50 border-amber-200 text-amber-800'
                            : 'bg-sky-50 border-sky-200 text-sky-700'
                        }`}
                      >
                        {isPage ? 'Static Page' : 'Post'}
                      </span>

                      {!isPage && attachedEvents.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {attachedEvents.map((evt) => (
                            <span
                              key={evt!.id}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-700 bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200/60"
                            >
                              <CalendarDays className="w-3 h-3 text-indigo-600 shrink-0" />
                              {evt!.code && (
                                <span className="font-mono font-bold text-indigo-700">
                                  [{evt!.code}]
                                </span>
                              )}
                              <span className="truncate max-w-[140px]">{evt!.title_zh}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* 3. PUBLISHED DATE */}
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600 font-mono">
                    {item.published_at
                      ? new Date(item.published_at).toLocaleDateString('zh-HK', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                        })
                      : '—'}
                  </td>

                  {/* 4. STATUS */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <StatusBadgeSelect
                      value={item.status || 'draft'}
                      onChange={(newStatus) => handleStatusChange(item, newStatus)}
                      disabled={!permissions.canPublish}
                      options={[
                        { value: 'draft', label: 'Draft' },
                        { value: 'published', label: 'Published' },
                        { value: 'unlisted', label: 'Unlisted' },
                        { value: 'archived', label: 'Archived' },
                      ]}
                    />
                  </td>

                  {/* 5. ROW ACTIONS */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-1">
                      {permissions.canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      <a
                        href={publicHref}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        title="Preview Public Page"
                      >
                        <Eye className="w-4 h-4" />
                      </a>

                      <button
                        type="button"
                        onClick={() => setShareItem(item)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        title="Share & QR Code"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>

                      {permissions.canCreate && (
                        <button
                          type="button"
                          onClick={() => handleDuplicate(item)}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Duplicate"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </AdminTableCard>
    </div>
  );
}