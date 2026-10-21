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
 * Normalizes a PostgREST joined relation that may be returned as a single object or single-element array.
 */
function unwrapRelation<T>(rel: T | T[] | null | undefined): T | null {
  if (!rel) return null;
  return Array.isArray(rel) ? rel[0] || null : rel;
}

/**
 * Fetch all published events for the public calendar/list hub in a single query.
 */
export async function getPublicEvents(): Promise<EventRecord[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      venues(*),
      organizers(*),
      banner_asset:assets!banner_asset_id(file_url),
      linked_form:forms!linked_form_id(id, slug, status)
    `)
    .eq('status', 'published')
    .order('start_date', { ascending: true });

  if (error || !data) {
    console.error('Error fetching public events:', error);
    return [];
  }

  return data.map((event: any) => {
    const linkedForm =
      event.registration_mode === 'internal_form'
        ? unwrapRelation<LinkedFormSummary>(event.linked_form)
        : null;

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
  const decoded = decodeURIComponent(idOrSlug).trim().replace(/"/g, '');

  if (!decoded) return null;

  // 1. Fetch Event by short_id OR slug, joining venue, organizer, banner, and linked form in one round-trip
  const { data: event, error } = await supabase
    .from('events')
    .select(`
      *,
      venues(*),
      organizers(*),
      banner_asset:assets!banner_asset_id(file_url),
      linked_form:forms!linked_form_id(id, slug, status)
    `)
    .or(`short_id.eq."${decoded}",slug.eq."${decoded}"`)
    .in('status', ['published', 'unlisted'])
    .single();

  if (error || !event) {
    return null;
  }

  const linkedForm =
    event.registration_mode === 'internal_form'
      ? unwrapRelation<LinkedFormSummary>((event as any).linked_form)
      : null;

  // 2. Fetch attached article updates via N:N junction (explicitly filtering for published status
  //    so signed-in admins and anonymous visitors see the exact same public article list)
  const { data: articleLinks } = await supabase
    .from('event_articles')
    .select('sort_order, article:content_pages(id, short_id, slug, title_zh, title_en, published_at, status)')
    .eq('event_id', event.id)
    .order('sort_order', { ascending: true });

  const articles: PublicArticleItem[] = (articleLinks || [])
    .map((item: any) => unwrapRelation<any>(item.article))
    .filter((art: any) => art && art.status === 'published')
    .map(({ status, ...rest }: any) => rest as PublicArticleItem);

  const effectiveRegistrationStatus = resolveEffectiveRegistrationStatus(event, linkedForm);

  return {
    ...(event as EventRecord),
    linked_form: linkedForm,
    registration_status: effectiveRegistrationStatus,
    articles,
  };
}