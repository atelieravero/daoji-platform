// app/admin/(dashboard)/content/actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { hasPermission, Role } from '@/lib/permissions';
import { revalidatePath } from 'next/cache';
import { isReservedSlug, sanitizeSlug } from '@/lib/slug';

export type ContentType = 'post' | 'page';
export type ContentStatus = 'draft' | 'published' | 'unlisted' | 'archived';

export interface AttachedEventSummary {
  id: string;
  short_id: string;
  slug: string | null;
  code: string | null;
  title_zh: string;
  title_en: string | null;
  status: string;
}

export interface ContentPageRecord {
  id: string;
  short_id: string;
  slug: string | null;
  type: ContentType;
  title_zh: string;
  title_en: string | null;
  summary_zh: string | null;
  summary_en: string | null;
  body_zh: string;
  body_en: string | null;
  cover_asset_id: string | null;
  cover_original_asset_id: string | null;
  is_pinned_in_feed: boolean;
  is_standalone: boolean;
  status: ContentStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined relations
  cover_asset?: { file_url: string } | null;
  cover_original_asset?: { file_url: string } | null;
  event_articles?: {
    event_id: string;
    sort_order: number;
    events: AttachedEventSummary | null;
  }[];
}

export interface ContentPermissions {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canPublish: boolean;
}

async function getAuthenticatedUserAndRoles() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { user: null, roles: [] as Role[], supabase };
  }

  const { data: member } = await supabase
    .from('team_members')
    .select('roles, status')
    .eq('id', user.id)
    .single();

  if (!member || member.status !== 'active') {
    return { user: null, roles: [] as Role[], supabase };
  }

  return { user, roles: (member.roles || []) as Role[], supabase };
}

export async function getContentPermissionsAction(): Promise<ContentPermissions> {
  const { user, roles } = await getAuthenticatedUserAndRoles();
  if (!user) {
    return { canView: false, canCreate: false, canEdit: false, canDelete: false, canPublish: false };
  }

  return {
    canView: hasPermission(roles, 'articles:view'),
    canCreate: hasPermission(roles, 'articles:create'),
    canEdit: hasPermission(roles, 'articles:edit'),
    canDelete: hasPermission(roles, 'articles:delete'),
    canPublish: hasPermission(roles, 'articles:publish'),
  };
}

export async function listContentPagesAction(params?: {
  type?: string;
  status?: string;
  search?: string;
  offset?: number;
  limit?: number;
}): Promise<{ data: ContentPageRecord[]; total: number; error?: string }> {
  const { user, roles, supabase } = await getAuthenticatedUserAndRoles();
  if (!user || !hasPermission(roles, 'articles:view')) {
    return { data: [], total: 0, error: 'Permission denied.' };
  }

  const { type = 'all', status = 'all', search = '', offset = 0, limit = 50 } = params || {};

  let query = supabase
    .from('content_pages')
    .select(
      `
      *,
      cover_asset:assets!cover_asset_id(file_url),
      cover_original_asset:assets!cover_original_asset_id(file_url),
      event_articles(event_id, sort_order, events(id, short_id, slug, code, title_zh, title_en, status))
    `,
      { count: 'exact' }
    );

  if (type !== 'all') {
    query = query.eq('type', type);
  }

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  if (search.trim()) {
    const q = search.trim();
    query = query.or(
      `title_zh.ilike.%${q}%,title_en.ilike.%${q}%,slug.ilike.%${q}%,short_id.ilike.%${q}%`
    );
  }

  query = query
    .order('is_pinned_in_feed', { ascending: false })
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, count, error } = await query;
  if (error) return { data: [], total: 0, error: error.message };

  return { data: (data as ContentPageRecord[]) || [], total: count || 0 };
}

export async function getContentPageAction(
  id: string
): Promise<{ data?: ContentPageRecord; error?: string }> {
  const { user, roles, supabase } = await getAuthenticatedUserAndRoles();
  if (!user || !hasPermission(roles, 'articles:view')) {
    return { error: 'Permission denied.' };
  }

  const { data, error } = await supabase
    .from('content_pages')
    .select(
      `
      *,
      cover_asset:assets!cover_asset_id(file_url),
      cover_original_asset:assets!cover_original_asset_id(file_url),
      event_articles(event_id, sort_order, events(id, short_id, slug, code, title_zh, title_en, status))
    `
    )
    .eq('id', id)
    .single();

  if (error || !data) return { error: error?.message || 'Content record not found.' };
  return { data: data as ContentPageRecord };
}

function revalidateContentRoutes(
  record?: { short_id?: string | null; slug?: string | null } | null
) {
  revalidatePath('/admin/content');
  revalidatePath('/[locale]/news', 'page');
  revalidatePath('/[locale]/events', 'page');
  if (record?.short_id) {
    revalidatePath(`/zh/post/${record.short_id}`);
    revalidatePath(`/en/post/${record.short_id}`);
    revalidatePath(`/zh/${record.short_id}`);
    revalidatePath(`/en/${record.short_id}`);
  }
  if (record?.slug) {
    revalidatePath(`/zh/post/${record.slug}`);
    revalidatePath(`/en/post/${record.slug}`);
    revalidatePath(`/zh/${record.slug}`);
    revalidatePath(`/en/${record.slug}`);
  }
}

export async function saveContentPageAction(
  pageData: Partial<ContentPageRecord>,
  linkedEventIds?: string[]
): Promise<{ success: boolean; data?: ContentPageRecord; error?: string }> {
  const { user, roles, supabase } = await getAuthenticatedUserAndRoles();
  const isUpdate = Boolean(pageData.id);
  const requiredPerm = isUpdate ? 'articles:edit' : 'articles:create';

  if (!user || !hasPermission(roles, requiredPerm)) {
    return { success: false, error: 'Permission denied to save content.' };
  }

  if (!pageData.title_zh?.trim()) {
    return { success: false, error: 'Chinese title (中文標題) is required.' };
  }

  let slug = pageData.slug?.trim() ? sanitizeSlug(pageData.slug.trim()).replace(/^-|-$/g, '') : null;
  if (slug && isReservedSlug(slug)) {
    return {
      success: false,
      error: `"${slug}" is a system-reserved path and cannot be used as a URL slug.`,
    };
  }

  const contentType: ContentType = pageData.type === 'page' ? 'page' : 'post';
  let desiredStatus: ContentStatus = pageData.status || 'draft';

  // Enforce publish permission if changing status away from draft
  const canPublish = hasPermission(roles, 'articles:publish');
  if (!canPublish && desiredStatus !== 'draft') {
    if (isUpdate && pageData.id) {
      const { data: existing } = await supabase
        .from('content_pages')
        .select('status')
        .eq('id', pageData.id)
        .single();
      desiredStatus = (existing?.status as ContentStatus) || 'draft';
    } else {
      desiredStatus = 'draft';
    }
  }

  // Auto-populate published_at on first publish if blank
  const publishedAt =
    pageData.published_at !== undefined && pageData.published_at !== null && pageData.published_at !== ''
      ? pageData.published_at
      : desiredStatus === 'published'
      ? new Date().toISOString()
      : null;

  try {
    const payload = {
      type: contentType,
      title_zh: pageData.title_zh.trim(),
      title_en: pageData.title_en?.trim() || null,
      summary_zh: pageData.summary_zh?.trim() || null,
      summary_en: pageData.summary_en?.trim() || null,
      body_zh: pageData.body_zh || '',
      body_en: pageData.body_en || null,
      cover_asset_id: pageData.cover_asset_id || null,
      cover_original_asset_id: pageData.cover_original_asset_id || pageData.cover_asset_id || null,
      is_pinned_in_feed: contentType === 'post' ? Boolean(pageData.is_pinned_in_feed) : false,
      is_standalone: Boolean(pageData.is_standalone),
      status: desiredStatus,
      published_at: publishedAt,
      slug: slug || null,
      updated_at: new Date().toISOString(),
    };

    let res;
    if (isUpdate && pageData.id) {
      res = await supabase
        .from('content_pages')
        .update(payload)
        .eq('id', pageData.id)
        .select()
        .single();
    } else {
      res = await supabase
        .from('content_pages')
        .insert(payload)
        .select()
        .single();
    }

    if (res.error) {
      if (res.error.code === '23505' && res.error.message.includes('slug')) {
        return {
          success: false,
          error: 'This URL slug is already in use by another page or post.',
        };
      }
      throw res.error;
    }

    const savedId = res.data.id as string;

    // Only sync event_articles when linkedEventIds is explicitly provided
    // (or clear them if switching type to 'page')
    if (contentType === 'page') {
      await supabase.from('event_articles').delete().eq('article_id', savedId);
    } else if (Array.isArray(linkedEventIds)) {
      await supabase.from('event_articles').delete().eq('article_id', savedId);
      const uniqueIds = Array.from(new Set(linkedEventIds.filter(Boolean)));
      if (uniqueIds.length > 0) {
        const junctionRows = uniqueIds.map((eventId, idx) => ({
          event_id: eventId,
          article_id: savedId,
          sort_order: idx,
        }));
        const { error: junctionErr } = await supabase.from('event_articles').insert(junctionRows);
        if (junctionErr) throw junctionErr;
      }
    }

    const fullRecord = await getContentPageAction(savedId);
    revalidateContentRoutes(fullRecord.data || res.data);

    return { success: true, data: fullRecord.data || (res.data as ContentPageRecord) };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to save content.' };
  }
}

export async function updateContentStatusAction(
  id: string,
  newStatus: ContentStatus
): Promise<{ success: boolean; data?: ContentPageRecord; error?: string }> {
  const { user, roles, supabase } = await getAuthenticatedUserAndRoles();
  if (!user || !hasPermission(roles, 'articles:publish')) {
    return { success: false, error: 'Permission denied to change publication status.' };
  }

  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('content_pages')
      .select('published_at, short_id, slug')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) {
      return { success: false, error: 'Content record not found.' };
    }

    const publishedAt =
      newStatus === 'published' && !existing.published_at
        ? new Date().toISOString()
        : existing.published_at;

    const { error } = await supabase
      .from('content_pages')
      .update({
        status: newStatus,
        published_at: publishedAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;

    const updated = await getContentPageAction(id);
    revalidateContentRoutes(updated.data || existing);
    return { success: true, data: updated.data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update status.' };
  }
}

export async function deleteContentPageAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const { user, roles, supabase } = await getAuthenticatedUserAndRoles();
  if (!user || !hasPermission(roles, 'articles:delete')) {
    return { success: false, error: 'Permission denied: You cannot delete pages or posts.' };
  }

  try {
    const { error } = await supabase.from('content_pages').delete().eq('id', id);
    if (error) throw error;

    revalidateContentRoutes();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete content.' };
  }
}