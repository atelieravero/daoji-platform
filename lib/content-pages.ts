// lib/content-pages.ts
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { ContentPageRecord, ContentType } from '@/app/admin/(dashboard)/content/actions';

export interface PublicRelatedEventItem {
  id: string;
  short_id: string;
  slug: string | null;
  code: string | null;
  title_zh: string;
  title_en: string | null;
  summary_zh: string | null;
  summary_en: string | null;
  start_date: string;
  end_date: string;
  timezone: string;
  is_all_day: boolean;
  recurrence_rule: any | null;
  is_in_person: boolean;
  venue_override_zh: string | null;
  venue_override_en: string | null;
  venues?: {
    name_zh: string;
    name_en: string | null;
  } | null;
  banner_asset?: {
    file_url: string;
  } | null;
}

export interface PublicContentDetail extends ContentPageRecord {
  related_events: PublicRelatedEventItem[];
}

/**
 * Dual-lookup resolver: Resolves a published or unlisted post/page by short_id OR vanity slug.
 */
export async function getPublicContentByIdOrSlug(
  idOrSlug: string,
  expectedType?: ContentType
): Promise<PublicContentDetail | null> {
  const supabase = getSupabaseAdmin();
  const decoded = decodeURIComponent(idOrSlug).trim().replace(/"/g, '');

  if (!decoded) return null;

  let query = supabase
    .from('content_pages')
    .select(
      `
      *,
      cover_asset:assets!cover_asset_id(file_url)
    `
    )
    .or(`short_id.eq."${decoded}",slug.eq."${decoded}"`)
    .in('status', ['published', 'unlisted']);

  if (expectedType) {
    query = query.eq('type', expectedType);
  }

  const { data: page, error } = await query.maybeSingle();

  if (error) {
    console.error('[getPublicContentByIdOrSlug] Supabase error:', error);
    return null;
  }

  if (!page) {
    console.warn(
      `[getPublicContentByIdOrSlug] No matching record for "${decoded}" (expectedType=${expectedType || 'any'})`
    );
    return null;
  }

  let relatedEvents: PublicRelatedEventItem[] = [];
  if (page.type === 'post') {
    const { data: eventLinks, error: eventLinksError } = await supabase
      .from('event_articles')
      .select(
        `
        sort_order,
        event:events(
          id,
          short_id,
          slug,
          code,
          title_zh,
          title_en,
          summary_zh,
          summary_en,
          start_date,
          end_date,
          timezone,
          is_all_day,
          recurrence_rule,
          is_in_person,
          venue_override_zh,
          venue_override_en,
          status,
          venues(name_zh, name_en),
          banner_asset:assets!banner_asset_id(file_url)
        )
      `
      )
      .eq('article_id', page.id)
      .order('sort_order', { ascending: true });

    if (eventLinksError) {
      console.error('[getPublicContentByIdOrSlug] event_articles error:', eventLinksError);
    }

    relatedEvents = (eventLinks || [])
      .map((item: any) => item.event)
      .filter((evt: any) => evt && evt.status === 'published')
      .map(({ status, ...rest }: any) => rest as PublicRelatedEventItem);
  }

  return {
    ...(page as ContentPageRecord),
    related_events: relatedEvents,
  };
}