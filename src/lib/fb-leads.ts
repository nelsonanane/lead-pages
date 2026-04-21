const NOTION_BASE = 'https://api.notion.com/v1';

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

function getApiKey(): string {
  const apiKey = import.meta.env.NOTION_API_KEY;
  if (!apiKey) throw new Error('NOTION_API_KEY not set');
  return apiKey;
}

function getDbId(): string {
  const dbId = import.meta.env.NOTION_FB_LEADS_DB_ID;
  if (!dbId) throw new Error('NOTION_FB_LEADS_DB_ID not set');
  return dbId;
}

function notionHeaders(apiKey: string) {
  return {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Notion-Version': '2022-06-28',
  };
}

async function notionFetch(path: string, method: string, body?: unknown): Promise<any> {
  const apiKey = getApiKey();
  const res = await fetch(`${NOTION_BASE}${path}`, {
    method,
    headers: notionHeaders(apiKey),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Notion API error ${res.status}: ${text}`);
  }
  return res.json();
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

export async function getExistingUrlMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  let cursor: string | undefined;
  do {
    const response = await notionFetch(`/databases/${getDbId()}/query`, 'POST', {
      page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {}),
    });
    for (const page of response.results) {
      const url = page.properties.URL?.url;
      if (url) map.set(url, page.id);
    }
    cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
  } while (cursor);
  return map;
}

export async function createListing(listing: FbListing): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  await notionFetch('/pages', 'POST', {
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
  const today = new Date().toISOString().split('T')[0];
  await notionFetch(`/pages/${pageId}`, 'PATCH', {
    properties: { 'Last Seen': { date: { start: today } } },
  });
}

export async function getTrackingListings(): Promise<NotionLead[]> {
  const results: any[] = [];
  let cursor: string | undefined;
  do {
    const response = await notionFetch(`/databases/${getDbId()}/query`, 'POST', {
      filter: { property: 'Status', select: { equals: 'Tracking' } },
      ...(cursor ? { start_cursor: cursor } : {}),
    });
    results.push(...response.results);
    cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
  } while (cursor);
  return results.map(pageToLead);
}

export async function savePitchAndFlip(pageId: string, pitch: string): Promise<void> {
  await notionFetch(`/pages/${pageId}`, 'PATCH', {
    properties: {
      Pitch: { rich_text: [{ text: { content: pitch.slice(0, 1990) } }] },
      Status: { select: { name: 'Ready to Pitch' } },
    },
  });
}
