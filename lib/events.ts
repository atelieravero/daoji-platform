import { createClient } from '@/lib/supabase/server';
import { EventRecord } from '@/app/admin/(dashboard)/events/actions';

export interface PublicArticleItem {
  id: string;
  short_id: string;
  slug: string | null;
  title_zh: string;
  title_en: string | null;
  summary_zh?: string | null;
  published_at: string | null;
}

export interface LinkedFormSummary {
  id: string;
  slug: string | null;
  status: string;
}

export interface PublicEventDetail extends EventRecord {
  articles: PublicArticleItem[];
  linked_form?: LinkedFormSummary | null;
}

/**
 * Helper to compute effective registration status from the linked form when in internal_form mode.
 */
function resolveEffectiveRegistrationStatus(event: any, linkedForm?: LinkedFormSummary | null) {
  if (event.registration_mode === 'internal_form') {
    if (linkedForm?.status === 'open') return 'open';
    if (linkedForm?.status === 'closed') return 'closed';
    return 'upcoming'; // draft or unlinked
  }
  return event.registration_status;
}

/**
 * Fetch all published events for the public calendar/list hub.
 */
export async function getPublicEvents(): Promise<EventRecord[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('events')
    .select('*, venues(*), organizers(*), banner_asset:assets!banner_asset_id(file_url)')
    .eq('status', 'published')
    .order('start_date', { ascending: true });

  if (error || !data) {
    console.error('Error fetching public events:', error);
    return [];
  }

  // Fetch linked forms for internal_form events to resolve real-time status
  const formIds = data
    .filter((e: any) => e.registration_mode === 'internal_form' && e.linked_form_id)
    .map((e: any) => e.linked_form_id);

  let formsMap: Record<string, LinkedFormSummary> = {};
  if (formIds.length > 0) {
    const { data: formsList } = await supabase
      .from('forms')
      .select('id, slug, status')
      .in('id', formIds);

    (formsList || []).forEach((f: any) => {
      formsMap[f.id] = f as LinkedFormSummary;
    });
  }

  return data.map((event: any) => {
    const linkedForm = event.linked_form_id ? formsMap[event.linked_form_id] || null : null;
    return {
      ...event,
      linked_form: linkedForm,
      registration_status: resolveEffectiveRegistrationStatus(event, linkedForm),
    } as EventRecord;
  });
}

/**
 * Dual-lookup resolver: Resolves an event by permanent short_id OR vanity slug.
 */
export async function getPublicEventByIdOrSlug(idOrSlug: string): Promise<PublicEventDetail | null> {
  const supabase = await createClient();

  // 1. Fetch Event by short_id OR slug
  const { data: event, error } = await supabase
    .from('events')
    .select('*, venues(*), organizers(*), banner_asset:assets!banner_asset_id(file_url)')
    .or(`short_id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
    .in('status', ['published', 'unlisted'])
    .single();

  if (error || !event) {
    return null;
  }

  // 2. Resolve linked form status and slug if mode is internal_form
  let linkedForm: LinkedFormSummary | null = null;
  if (event.registration_mode === 'internal_form' && event.linked_form_id) {
    const { data: formData } = await supabase
      .from('forms')
      .select('id, slug, status')
      .eq('id', event.linked_form_id)
      .single();

    linkedForm = (formData as LinkedFormSummary) || null;
  }

  // 3. Fetch attached article updates via N:N junction
  const { data: articleLinks } = await supabase
    .from('event_articles')
    .select('sort_order, article:content_pages(id, short_id, slug, title_zh, title_en, published_at)')
    .eq('event_id', event.id)
    .order('sort_order', { ascending: true });

  const articles: PublicArticleItem[] = (articleLinks || [])
    .map((item: any) => item.article)
    .filter(Boolean);

  const effectiveRegistrationStatus = resolveEffectiveRegistrationStatus(event, linkedForm);

  return {
    ...(event as EventRecord),
    linked_form: linkedForm,
    registration_status: effectiveRegistrationStatus,
    articles,
  };
}