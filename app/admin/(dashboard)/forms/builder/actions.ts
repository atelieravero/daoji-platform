'use server';

import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth-guards';
import { hasPermission, Role } from '@/lib/permissions';
import { revalidatePath } from 'next/cache';

export interface FormEventOption {
  id: string;
  title_zh: string;
  title_en: string | null;
  code: string | null;
  short_id: string;
  status: string;
}

/**
 * Resolves current user permissions for the Form Builder.
 */
export async function getFormBuilderPermissionsAction(): Promise<{
  canEdit: boolean;
  canCreate: boolean;
}> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return { canEdit: false, canCreate: false };
  }

  const { data: member } = await supabase
    .from('team_members')
    .select('roles, status')
    .eq('id', user.id)
    .single();

  if (!member || member.status !== 'active') {
    return { canEdit: false, canCreate: false };
  }

  const roles = (member.roles || []) as Role[];
  return {
    canEdit: hasPermission(roles, 'forms:edit'),
    canCreate: hasPermission(roles, 'forms:create'),
  };
}

/**
 * Fetch real events list for Form Builder linkage (requires view_schema).
 */
export async function getEventsForFormBuilder(): Promise<FormEventOption[]> {
  await requirePermission('forms:view_schema');
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('events')
    .select('id, title_zh, title_en, code, short_id, status')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching events for form builder:', error);
    return [];
  }

  return (data as FormEventOption[]) || [];
}

/**
 * Fetches form schema by ID (requires view_schema).
 */
export async function getFormSchema(id: string) {
  await requirePermission('forms:view_schema');
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('forms')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching form schema:', error);
    return null;
  }

  return data;
}

/**
 * Saves or updates form schema (strictly requires forms:edit & draft status).
 */
export async function saveFormSchema(payload: {
  event_id?: string | null;
  slug: string; 
  title: string;
  is_followup: boolean;
  schema: any;
}, id?: string | null) {
  await requirePermission('forms:edit');
  const supabase = await createClient();

  const eventId = payload.event_id?.trim();
  if (!eventId || eventId === 'none') {
    throw new Error('Validation Error: A linked event is required for every form.');
  }

  // Removed updated_at to match the live forms table schema
  const cleanPayload: Record<string, any> = {
    title: payload.title,
    slug: payload.slug,
    is_followup: Boolean(payload.is_followup),
    schema: payload.schema,
    event_id: eventId,
  };

  let error;
  let savedId = id;

  if (id) {
    const { data: existingForm, error: fetchError } = await supabase
      .from('forms')
      .select('status, slug')
      .eq('id', id)
      .single();

    if (fetchError || !existingForm) {
      throw new Error('Failed to verify form status before saving.');
    }

    if (existingForm.status !== 'draft') {
      throw new Error('Action blocked: Form schema cannot be modified while open or closed. Please revert to draft status first.');
    }

    const res = await (supabase.from('forms') as any)
      .update(cleanPayload)
      .eq('id', id);
    error = res.error;

    // Invalidate old slug paths if slug changed
    if (existingForm.slug && existingForm.slug !== cleanPayload.slug) {
      revalidatePath(`/zh/form/${existingForm.slug}`);
      revalidatePath(`/en/form/${existingForm.slug}`);
    }
  } else {
    await requirePermission('forms:create');
    const res = await (supabase.from('forms') as any)
      .insert([cleanPayload])
      .select('id')
      .single();
    
    error = res.error;
    if (res.data) {
      savedId = res.data.id;
    }
  }

  if (error) {
    console.error('Supabase Error saving form schema:', error);
    throw new Error(error.message || 'Failed to save form schema.');
  }

  // Revalidate admin views and public edge caches
  revalidatePath('/admin/forms');
  revalidatePath('/admin/logs');
  revalidatePath(`/[locale]/form/${cleanPayload.slug}`, 'page');
  revalidatePath(`/zh/form/${cleanPayload.slug}`);
  revalidatePath(`/en/form/${cleanPayload.slug}`);

  return savedId;
}