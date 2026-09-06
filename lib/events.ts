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

export interface PublicEventDetail extends EventRecord {
  articles: PublicArticleItem[];
}

/**
 * Fetch all published events for the public calendar/list hub.
 * Excludes 'unlisted', 'draft', and 'archived' events.
 */
export async function getPublicEvents(): Promise<EventRecord[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('events')
    .select('*, venues(*), organizers(*), banner_asset:assets!banner_asset_id(file_url)')
    .eq('status', 'published')
    .order('start_date', { ascending: true });

  if (error) {
    console.error('Error fetching public events:', error);
    return [];
  }

  return (data as EventRecord[]) || [];
}

/**
 * Dual-lookup resolver: Resolves an event by permanent short_id OR vanity slug.
 * Allows access if status is 'published' OR 'unlisted'.
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

  // 2. Fetch attached article updates via N:N junction (event_articles)
  const { data: articleLinks } = await supabase
    .from('event_articles')
    .select('sort_order, article:content_pages(id, short_id, slug, title_zh, title_en, published_at)')
    .eq('event_id', event.id)
    .order('sort_order', { ascending: true });

  const articles: PublicArticleItem[] = (articleLinks || [])
    .map((item: any) => item.article)
    .filter(Boolean);

  return {
    ...(event as EventRecord),
    articles,
  };
}