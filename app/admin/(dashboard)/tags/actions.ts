'use server';

import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth-guards';
import { revalidatePath } from 'next/cache';

export interface TagRecord {
  id: string;
  short_id: string;
  slug: string | null;
  name_zh: string;
  name_en: string | null;
  is_pillar: boolean;
  color: string;
  created_at: string;
  usage_count?: number;
}

/**
 * List all tags with usage counts.
 * Guarded by 'tags:view'.
 */
export async function listTagsAction(): Promise<{ data: TagRecord[]; error?: string }> {
  await requirePermission('tags:view');
  const supabase = await createClient();

  const { data: tags, error: tagsError } = await supabase
    .from('tags')
    .select('*')
    .order('is_pillar', { ascending: false })
    .order('created_at', { ascending: false });

  if (tagsError) {
    console.error('Error fetching tags:', tagsError);
    return { data: [], error: tagsError.message };
  }

  // Aggregate usage counts from taggables
  const { data: taggables, error: taggablesError } = await supabase
    .from('taggables')
    .select('tag_id');

  const countMap: Record<string, number> = {};
  if (taggables && !taggablesError) {
    taggables.forEach((item) => {
      countMap[item.tag_id] = (countMap[item.tag_id] || 0) + 1;
    });
  }

  const result: TagRecord[] = (tags || []).map((t) => ({
    ...t,
    usage_count: countMap[t.id] || 0,
  }));

  return { data: result };
}

/**
 * Create a new tag.
 * Guarded by 'tags:create'.
 */
export async function createTagAction(payload: {
  name_zh: string;
  name_en?: string | null;
  slug?: string | null;
  is_pillar?: boolean;
  color?: string;
}): Promise<{ success: boolean; data?: TagRecord; error?: string }> {
  await requirePermission('tags:create');
  const supabase = await createClient();

  const cleanSlug = payload.slug?.trim() ? payload.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-') : null;

  const { data, error } = await supabase
    .from('tags')
    .insert({
      name_zh: payload.name_zh.trim(),
      name_en: payload.name_en?.trim() || null,
      slug: cleanSlug,
      is_pillar: payload.is_pillar ?? false,
      color: payload.color || '#4F46E5',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating tag:', error);
    if (error.code === '23505') {
      return { success: false, error: 'A tag with this vanity slug already exists.' };
    }
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/tags');
  revalidatePath('/admin/logs');
  return { success: true, data: data as TagRecord };
}

/**
 * Update an existing tag.
 * Guarded by 'tags:edit'.
 */
export async function updateTagAction(
  id: string,
  payload: {
    name_zh: string;
    name_en?: string | null;
    slug?: string | null;
    is_pillar?: boolean;
    color?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  await requirePermission('tags:edit');
  const supabase = await createClient();

  const cleanSlug = payload.slug?.trim() ? payload.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-') : null;

  const { error } = await supabase
    .from('tags')
    .update({
      name_zh: payload.name_zh.trim(),
      name_en: payload.name_en?.trim() || null,
      slug: cleanSlug,
      is_pillar: payload.is_pillar ?? false,
      color: payload.color || '#4F46E5',
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating tag:', error);
    if (error.code === '23505') {
      return { success: false, error: 'A tag with this vanity slug already exists.' };
    }
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/tags');
  revalidatePath('/admin/logs');
  return { success: true };
}

/**
 * Delete a tag.
 * Guarded by 'tags:delete'.
 */
export async function deleteTagAction(id: string): Promise<{ success: boolean; error?: string }> {
  await requirePermission('tags:delete');
  const supabase = await createClient();

  const { error } = await supabase
    .from('tags')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting tag:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/tags');
  revalidatePath('/admin/logs');
  return { success: true };
}