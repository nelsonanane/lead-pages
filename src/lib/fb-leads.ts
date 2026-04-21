import { Client } from '@notionhq/client';

export interface FbListing {
  title: string;
  url: string;
  price: number | null;
  bedrooms: number | null;
  location: string;
}

export interface NotionLead {
  id: string;
  url: string;
  firstSeen: string;
  lastSeen: string;
  status: 'Tracking' | 'Ready to Pitch' | 'Contacted' | 'Passed';
  pitch: string;
  price: number | null;
  bedrooms: number | null;
  location: string;
}

export function daysAgo(dateStr: string): number {
  const then = new Date(dateStr).getTime();
  const now = Date.now();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

function getClient(): Client {
  const apiKey = import.meta.env.NOTION_API_KEY;
  if (!apiKey) throw new Error('NOTION_API_KEY not set');
  return new Client({ auth: apiKey });
}

function getDbId(): string {
  const dbId = import.meta.env.NOTION_FB_LEADS_DB_ID;
  if (!dbId) throw new Error('NOTION_FB_LEADS_DB_ID not set');
  return dbId;
}

function pageToLead(page: any): NotionLead {
  return {
    id: page.id,
    url: page.properties.URL?.url ?? '',
    firstSeen: page.properties['First Seen']?.date?.start ?? '',
    lastSeen: page.properties['Last Seen']?.date?.start ?? '',
    status: page.properties.Status?.select?.name ?? 'Tracking',
    pitch: page.properties.Pitch?.rich_text?.[0]?.plain_text ?? '',
    price: page.properties.Price?.number ?? null,
    bedrooms: page.properties.Bedrooms?.number ?? null,
    location: page.properties.Location?.rich_text?.[0]?.plain_text ?? '',
  };
}

export async function findListingByUrl(url: string): Promise<NotionLead | null> {
  const notion = getClient();
  const response = await notion.databases.query({
    database_id: getDbId(),
    filter: { property: 'URL', url: { equals: url } },
  });
  if (response.results.length === 0) return null;
  return pageToLead(response.results[0]);
}

export async function createListing(listing: FbListing): Promise<void> {
  const notion = getClient();
  const today = new Date().toISOString().split('T')[0];
  await notion.pages.create({
    parent: { database_id: getDbId() },
    properties: {
      Title: { title: [{ text: { content: listing.title } }] },
      URL: { url: listing.url },
      ...(listing.price != null ? { Price: { number: listing.price } } : {}),
      ...(listing.bedrooms != null ? { Bedrooms: { number: listing.bedrooms } } : {}),
      Location: { rich_text: [{ text: { content: listing.location } }] },
      'First Seen': { date: { start: today } },
      'Last Seen': { date: { start: today } },
      Status: { select: { name: 'Tracking' } },
    },
  });
}

export async function updateLastSeen(pageId: string): Promise<void> {
  const notion = getClient();
  const today = new Date().toISOString().split('T')[0];
  await notion.pages.update({
    page_id: pageId,
    properties: { 'Last Seen': { date: { start: today } } },
  });
}

export async function getTrackingListings(): Promise<NotionLead[]> {
  const notion = getClient();
  const results: any[] = [];
  let cursor: string | undefined;
  do {
    const response = await notion.databases.query({
      database_id: getDbId(),
      filter: { property: 'Status', select: { equals: 'Tracking' } },
      start_cursor: cursor,
    });
    results.push(...response.results);
    cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
  } while (cursor);
  return results.map(pageToLead);
}

export async function savePitchAndFlip(pageId: string, pitch: string): Promise<void> {
  const notion = getClient();
  await notion.pages.update({
    page_id: pageId,
    properties: {
      Pitch: { rich_text: [{ text: { content: pitch.slice(0, 1990) } }] },
      Status: { select: { name: 'Ready to Pitch' } },
    },
  });
}
