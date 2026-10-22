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

function resolveEffectiveRegistrationStatus(event: any, linkedForm?: LinkedFormSummary | null) {
  if (event.registration_mode === 'internal_form') {
    if (linkedForm?.status === 'open') return 'open';
    if (linkedForm?.status === 'closed') return 'closed';
    return 'upcoming';
  }
  return event.registration_status;
}

function unwrapRelation<T>(rel: T | T[] | null | undefined): T | null {
  if (!rel) return null;
  return Array.isArray(rel) ? rel[0] || null : rel;
}

export async function getPublicEvents(): Promise<EventRecord[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      venues(*),
      organizers(*),
      banner_asset:assets!banner_asset_id(file_url),
      banner_original_asset:assets!banner_original_asset_id(file_url),
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
    const bannerAsset =
      unwrapRelation<{ file_url: string }>(event.banner_asset) ||
      unwrapRelation<{ file_url: string }>(event.banner_original_asset);

    return {
      ...event,
      venues: unwrapRelation(event.venues),
      organizers: unwrapRelation(event.organizers),
      banner_asset: bannerAsset,
      linked_form: linkedForm,
      registration_status: resolveEffectiveRegistrationStatus(event, linkedForm),
    } as EventRecord;
  });
}

export async function getPublicEventByIdOrSlug(idOrSlug: string): Promise<PublicEventDetail | null> {
  const supabase = await createClient();
  const decoded = decodeURIComponent(idOrSlug).trim().replace(/"/g, '');

  if (!decoded) return null;

  const { data: event, error } = await supabase
    .from('events')
    .select(`
      *,
      venues(*),
      organizers(*),
      banner_asset:assets!banner_asset_id(file_url),
      banner_original_asset:assets!banner_original_asset_id(file_url),
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

  const bannerAsset =
    unwrapRelation<{ file_url: string }>((event as any).banner_asset) ||
    unwrapRelation<{ file_url: string }>((event as any).banner_original_asset);

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
    venues: unwrapRelation((event as any).venues) as any,
    organizers: unwrapRelation((event as any).organizers) as any,
    banner_asset: bannerAsset as any,
    linked_form: linkedForm,
    registration_status: effectiveRegistrationStatus,
    articles,
  };
}