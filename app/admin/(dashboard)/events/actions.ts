'use server';

import { createClient } from '@/lib/supabase/server';
import { hasPermission, Role } from '@/lib/permissions';
import { revalidatePath } from 'next/cache';
import { DEFAULT_TIMEZONE } from '@/lib/timezones';
import { Json } from '@/lib/supabase/types';

export type EventStatus = 'draft' | 'published' | 'unlisted' | 'archived';
export type RegistrationStatus = 'upcoming' | 'open' | 'closed';
export type RegistrationMode = 'internal_form' | 'external_url' | 'not_required';
export type EventLanguage = 'cantonese' | 'mandarin' | 'english' | 'thai';

export interface LivestreamConfig {
  mode?: 'auto' | 'manual';
  zoom_url?: string | null;
  zoom_meeting_id?: string | null;
  zoom_passcode?: string | null;
  youtube_url?: string | null;
  facebook_url?: string | null;
  open_minutes_before?: number;
  [key: string]: Json | undefined;
}

export interface OrganizerRecord {
  id: string;
  name_en: string;
  name_zh: string | null;
  url: string | null;
  description_zh: string | null;
  description_en: string | null;
  created_at: string;
}

export interface VenueRecord {
  id: string;
  name_zh: string;
  name_en: string | null;
  address_zh: string | null;
  address_en: string | null;
  google_maps_url: string | null;
  amap_url: string | null;
  transport_guide_zh: string | null;
  transport_guide_en: string | null;
  timezone?: string | null;
  created_at: string;
}

export interface LinkedFormSummary {
  id: string;
  slug: string | null;
  status: string;
}

export interface EventRecord {
  id: string;
  short_id: string;
  code: string | null;
  slug: string | null;
  organizer_id: string | null;
  title_zh: string;
  title_en: string | null;
  summary_zh: string | null;
  summary_en: string | null;
  body_zh: string;
  body_en: string | null;
  languages: EventLanguage[];
  start_date: string;
  end_date: string;
  timezone: string;
  is_all_day: boolean;
  recurrence_rule: any | null;
  blackout_dates: string[];
  is_in_person: boolean;
  venue_id: string | null;
  venue_override_zh: string | null;
  venue_override_en: string | null;
  is_livestream: boolean;
  is_livestream_live: boolean;
  livestream_config: LivestreamConfig | null;
  registration_mode: RegistrationMode;
  linked_form_id: string | null;
  external_url: string | null;
  registration_status: RegistrationStatus;
  cta_label_zh: string | null;
  cta_label_en: string | null;
  banner_asset_id: string | null;
  banner_original_asset_id: string | null;
  status: EventStatus;
  is_featured: boolean;
  is_standalone: boolean;
  created_at: string;
  updated_at: string;
  // Joined & resolved relations
  venues?: VenueRecord | null;
  organizers?: OrganizerRecord | null;
  banner_asset?: { file_url: string } | null;
  banner_original_asset?: { file_url: string } | null;
  linked_form?: LinkedFormSummary | null;
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

export async function getEventPermissionsAction(): Promise<{
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canPublish: boolean;
}> {
  const { user, roles } = await getAuthenticatedUserAndRoles();
  if (!user) {
    return { canView: false, canCreate: false, canEdit: false, canDelete: false, canPublish: false };
  }

  return {
    canView: hasPermission(roles, 'events:view'),
    canCreate: hasPermission(roles, 'events:create'),
    canEdit: hasPermission(roles, 'events:edit'),
    canDelete: hasPermission(roles, 'events:delete'),
    canPublish: hasPermission(roles, 'events:publish'),
  };
}

export async function toggleLivestreamLiveAction(
  eventId: string,
  isLive: boolean
): Promise<{ success: boolean; error?: string }> {
  const { user, roles, supabase } = await getAuthenticatedUserAndRoles();
  if (!user || !hasPermission(roles, 'events:edit')) {
    return { success: false, error: 'Permission denied to toggle livestream.' };
  }

  try {
    const { error } = await supabase
      .from('events')
      .update({ is_livestream_live: isLive, updated_at: new Date().toISOString() })
      .eq('id', eventId);

    if (error) throw error;

    revalidatePath('/admin/events');
    revalidatePath('/[locale]/events', 'page');
    revalidatePath('/zh/events');
    revalidatePath('/en/events');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to toggle live state.' };
  }
}

export async function listOrganizersAction(): Promise<{ data: OrganizerRecord[]; error?: string }> {
  const { user, roles, supabase } = await getAuthenticatedUserAndRoles();
  if (!user || !hasPermission(roles, 'events:view')) {
    return { data: [], error: 'Permission denied.' };
  }

  const { data, error } = await supabase.from('organizers').select('*').order('name_en', { ascending: true });
  if (error) return { data: [], error: error.message };
  return { data: (data as OrganizerRecord[]) || [] };
}

export async function upsertOrganizerAction(
  organizer: Partial<OrganizerRecord>
): Promise<{ success: boolean; data?: OrganizerRecord; error?: string }> {
  const { user, roles, supabase } = await getAuthenticatedUserAndRoles();
  const isUpdate = Boolean(organizer.id);
  const requiredPerm = isUpdate ? 'events:edit' : 'events:create';

  if (!user || !hasPermission(roles, requiredPerm)) {
    return { success: false, error: 'Permission denied to save organizer.' };
  }

  if (!organizer.name_en?.trim()) {
    return { success: false, error: 'Organizer English name is mandatory.' };
  }

  try {
    const payload = {
      name_en: organizer.name_en.trim(),
      name_zh: organizer.name_zh?.trim() || null,
      url: organizer.url?.trim() || null,
      description_zh: organizer.description_zh?.trim() || null,
      description_en: organizer.description_en?.trim() || null,
    };

    let res;
    if (isUpdate && organizer.id) {
      res = await supabase.from('organizers').update(payload).eq('id', organizer.id).select().single();
    } else {
      res = await supabase.from('organizers').insert(payload).select().single();
    }

    if (res.error) throw res.error;

    revalidatePath('/admin/events');
    return { success: true, data: res.data as OrganizerRecord };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to save organizer.' };
  }
}

export async function deleteOrganizerAction(id: string): Promise<{ success: boolean; error?: string }> {
  const { user, roles, supabase } = await getAuthenticatedUserAndRoles();
  if (!user || !hasPermission(roles, 'events:delete')) {
    return { success: false, error: 'Permission denied to delete organizer.' };
  }

  try {
    const { error } = await supabase.from('organizers').delete().eq('id', id);
    if (error) throw error;

    revalidatePath('/admin/events');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete organizer.' };
  }
}

export async function listVenuesAction(): Promise<{ data: VenueRecord[]; error?: string }> {
  const { user, roles, supabase } = await getAuthenticatedUserAndRoles();
  if (!user || !hasPermission(roles, 'events:view')) {
    return { data: [], error: 'Permission denied.' };
  }

  const { data, error } = await supabase.from('venues').select('*').order('name_zh', { ascending: true });
  if (error) return { data: [], error: error.message };
  return { data: (data as VenueRecord[]) || [] };
}

export async function upsertVenueAction(venue: Partial<VenueRecord>): Promise<{ success: boolean; data?: VenueRecord; error?: string }> {
  const { user, roles, supabase } = await getAuthenticatedUserAndRoles();
  const isUpdate = Boolean(venue.id);
  const requiredPerm = isUpdate ? 'events:edit' : 'events:create';

  if (!user || !hasPermission(roles, requiredPerm)) {
    return { success: false, error: 'Permission denied to save venue.' };
  }

  if (!venue.name_zh?.trim()) {
    return { success: false, error: 'Venue Chinese name is required.' };
  }

  try {
    const payload = {
      name_zh: venue.name_zh.trim(),
      name_en: venue.name_en?.trim() || null,
      address_zh: venue.address_zh?.trim() || null,
      address_en: venue.address_en?.trim() || null,
      google_maps_url: venue.google_maps_url?.trim() || null,
      amap_url: venue.amap_url?.trim() || null,
      transport_guide_zh: venue.transport_guide_zh?.trim() || null,
      transport_guide_en: venue.transport_guide_en?.trim() || null,
      timezone: venue.timezone || DEFAULT_TIMEZONE,
    };

    let res;
    if (isUpdate && venue.id) {
      res = await supabase.from('venues').update(payload).eq('id', venue.id).select().single();
    } else {
      res = await supabase.from('venues').insert(payload).select().single();
    }

    if (res.error) throw res.error;

    revalidatePath('/admin/events');
    return { success: true, data: res.data as VenueRecord };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to save venue.' };
  }
}

export async function listEventsAction(params: {
  status?: string;
  search?: string;
  offset?: number;
  limit?: number;
}): Promise<{ data: EventRecord[]; total: number; error?: string }> {
  const { user, roles, supabase } = await getAuthenticatedUserAndRoles();
  if (!user || !hasPermission(roles, 'events:view')) {
    return { data: [], total: 0, error: 'Permission denied.' };
  }

  const { status = 'all', search = '', offset = 0, limit = 20 } = params;

  let query = supabase
    .from('events')
    .select('*, venues(*), organizers(*), banner_asset:assets!banner_asset_id(file_url), banner_original_asset:assets!banner_original_asset_id(file_url)', { count: 'exact' });

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  if (search.trim()) {
    query = query.or(`title_zh.ilike.%${search}%,title_en.ilike.%${search}%,code.ilike.%${search}%,slug.ilike.%${search}%`);
  }

  query = query.order('start_date', { ascending: false }).range(offset, offset + limit - 1);

  const { data, count, error } = await query;
  if (error) return { data: [], total: 0, error: error.message };

  return { data: (data as EventRecord[]) || [], total: count || 0 };
}

export async function getEventAction(id: string): Promise<{ data?: EventRecord; error?: string }> {
  const { user, roles, supabase } = await getAuthenticatedUserAndRoles();
  if (!user || !hasPermission(roles, 'events:view')) {
    return { error: 'Permission denied.' };
  }

  const { data, error } = await supabase
    .from('events')
    .select('*, venues(*), organizers(*), banner_asset:assets!banner_asset_id(file_url), banner_original_asset:assets!banner_original_asset_id(file_url)')
    .eq('id', id)
    .single();

  if (error || !data) return { error: error?.message || 'Event not found.' };
  return { data: data as EventRecord };
}

export async function saveEventAction(eventData: Partial<EventRecord>): Promise<{ success: boolean; data?: EventRecord; error?: string }> {
  const { user, roles, supabase } = await getAuthenticatedUserAndRoles();
  const isUpdate = Boolean(eventData.id);
  const requiredPerm = isUpdate ? 'events:edit' : 'events:create';

  if (!user || !hasPermission(roles, requiredPerm)) {
    return { success: false, error: 'Permission denied to save event.' };
  }

  if (!eventData.title_zh?.trim()) {
    return { success: false, error: 'Event title (Chinese) is required.' };
  }

  if (!eventData.start_date || !eventData.end_date) {
    return { success: false, error: 'Start and end dates are required.' };
  }

  const registrationMode: RegistrationMode = eventData.registration_mode || 'internal_form';

  let code = eventData.code?.trim().toUpperCase() || null;
  if (registrationMode === 'internal_form') {
    if (!code) {
      return { success: false, error: 'Event code is required when registering through internal forms.' };
    }
    if (!/^[A-Z0-9]{1,8}$/.test(code)) {
      return { success: false, error: 'Event code must be 1 to 8 uppercase alphanumeric characters.' };
    }
  } else {
    code = null;
  }

  let slug = eventData.slug?.trim() || null;
  if (slug) {
    slug = slug
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-_.~+%]/g, '')
      .replace(/^-|-$/g, '');
  }

  try {
    const payload = {
      title_zh: eventData.title_zh.trim(),
      title_en: eventData.title_en?.trim() || null,
      summary_zh: eventData.summary_zh?.trim() || null,
      summary_en: eventData.summary_en?.trim() || null,
      body_zh: eventData.body_zh || '',
      body_en: eventData.body_en || null,
      languages: eventData.languages && eventData.languages.length > 0 ? eventData.languages : ['cantonese'],
      organizer_id: eventData.organizer_id || null,
      start_date: eventData.start_date,
      end_date: eventData.end_date,
      timezone: eventData.timezone || DEFAULT_TIMEZONE,
      is_all_day: Boolean(eventData.is_all_day),
      recurrence_rule: (eventData.recurrence_rule || null) as Json | null,
      blackout_dates: eventData.blackout_dates || [],
      is_in_person: Boolean(eventData.is_in_person),
      venue_id: eventData.is_in_person ? (eventData.venue_id || null) : null,
      venue_override_zh: eventData.is_in_person ? (eventData.venue_override_zh?.trim() || null) : null,
      venue_override_en: eventData.is_in_person ? (eventData.venue_override_en?.trim() || null) : null,
      is_livestream: Boolean(eventData.is_livestream),
      is_livestream_live: Boolean(eventData.is_livestream_live),
      livestream_config: (eventData.is_livestream ? eventData.livestream_config : null) as Json | null,
      registration_mode: registrationMode,
      code,
      linked_form_id: registrationMode === 'internal_form' ? (eventData.linked_form_id || null) : null,
      external_url: registrationMode === 'external_url' ? (eventData.external_url?.trim() || null) : null,
      registration_status: eventData.registration_status || 'upcoming',
      cta_label_zh: eventData.cta_label_zh?.trim() || null,
      cta_label_en: eventData.cta_label_en?.trim() || null,
      banner_asset_id: eventData.banner_asset_id || null,
      banner_original_asset_id: eventData.banner_original_asset_id || null,
      status: eventData.status || 'draft',
      is_featured: Boolean(eventData.is_featured),
      is_standalone: Boolean(eventData.is_standalone),
      slug: slug || null,
      updated_at: new Date().toISOString(),
    };

    let res;
    if (isUpdate && eventData.id) {
      res = await supabase
        .from('events')
        .update(payload)
        .eq('id', eventData.id)
        .select('*, venues(*), organizers(*), banner_asset:assets!banner_asset_id(file_url), banner_original_asset:assets!banner_original_asset_id(file_url)')
        .single();
    } else {
      res = await supabase
        .from('events')
        .insert(payload)
        .select('*, venues(*), organizers(*), banner_asset:assets!banner_asset_id(file_url), banner_original_asset:assets!banner_original_asset_id(file_url)')
        .single();
    }

    if (res.error) {
      if (res.error.code === '23505' && res.error.message.includes('slug')) {
        return { success: false, error: 'This URL slug is already in use by another event.' };
      }
      throw res.error;
    }

    revalidatePath('/admin/events');
    revalidatePath('/[locale]/events', 'page');
    revalidatePath('/zh/events');
    revalidatePath('/en/events');
    return { success: true, data: res.data as EventRecord };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to save event.' };
  }
}

export async function deleteEventAction(eventId: string): Promise<{ success: boolean; error?: string }> {
  const { user, roles, supabase } = await getAuthenticatedUserAndRoles();
  if (!user || !hasPermission(roles, 'events:delete')) {
    return { success: false, error: 'Permission denied: You cannot delete events.' };
  }

  try {
    const { error } = await supabase.from('events').delete().eq('id', eventId);
    if (error) throw error;

    revalidatePath('/admin/events');
    revalidatePath('/[locale]/events', 'page');
    revalidatePath('/zh/events');
    revalidatePath('/en/events');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete event.' };
  }
}