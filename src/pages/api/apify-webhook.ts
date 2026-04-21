import type { APIRoute } from 'astro';
import { getExistingUrlMap, createListing, updateLastSeen } from '../../lib/fb-leads';

interface ApifyWebhookPayload {
  eventType: string;
  eventData: {
    actorRunId: string;
    defaultDatasetId: string;
  };
}

interface ApifyListing {
  marketplace_listing_title?: string;
  custom_title?: string;
  listing_price?: { amount?: string; formatted_amount?: string };
  location?: unknown;
  url?: string;
  listingUrl?: string;
}

async function fetchDatasetItems(datasetId: string, token: string): Promise<ApifyListing[]> {
  const res = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}&format=json&limit=20`
  );
  if (!res.ok) throw new Error(`Apify dataset fetch failed: ${res.status}`);
  return res.json();
}

export function parsePrice(price: number | string | undefined): number | null {
  if (price == null) return null;
  if (typeof price === 'number') return price;
  const cleaned = String(price).replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

export function parseBedrooms(val: string | undefined): number | null {
  if (!val) return null;
  const match = val.match(/(\d+)\s*bed/i);
  if (!match) return null;
  const n = parseInt(match[1], 10);
  return isNaN(n) ? null : n;
}

export function parseLocation(val: unknown): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object' && val !== null) {
    const obj = val as Record<string, any>;
    const rg = obj.reverse_geocode ?? obj;
    const city = rg.city ?? '';
    const state = rg.state ?? '';
    return [city, state].filter(Boolean).join(', ');
  }
  return '';
}

export const POST: APIRoute = async ({ request }) => {
  const secret = import.meta.env.APIFY_WEBHOOK_SECRET;
  if (!secret) {
    return new Response(JSON.stringify({ error: 'Server misconfiguration: APIFY_WEBHOOK_SECRET not set' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (request.headers.get('x-apify-webhook-secret') !== secret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apifyToken = import.meta.env.APIFY_API_TOKEN;
  if (!apifyToken) {
    return new Response(JSON.stringify({ error: 'Server misconfiguration: APIFY_API_TOKEN not set' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let payload: ApifyWebhookPayload;
  try {
    payload = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const datasetId = payload?.eventData?.defaultDatasetId;
  if (!datasetId) {
    return new Response(JSON.stringify({ error: 'No datasetId in webhook payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let listings: ApifyListing[];
  try {
    listings = await fetchDatasetItems(datasetId, apifyToken);
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to fetch Apify dataset' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Deduplicate by URL before hitting Notion
  const seen = new Set<string>();
  const unique = listings.filter(item => {
    const url = item.url ?? item.listingUrl;
    if (!url || seen.has(url)) return false;
    seen.add(url);
    return true;
  });

  // One bulk query to get all existing URLs — avoids N per-listing lookups
  const existingMap = await getExistingUrlMap();

  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const item of unique) {
    const url = (item.url ?? item.listingUrl)!;
    try {
      const pageId = existingMap.get(url);
      if (pageId) {
        await updateLastSeen(pageId);
        updated++;
      } else {
        const titleStr = item.marketplace_listing_title ?? item.custom_title ?? 'Rental Listing';
        await createListing({
          title: titleStr,
          url,
          price: parsePrice(item.listing_price?.amount ?? item.listing_price?.formatted_amount),
          bedrooms: parseBedrooms(item.custom_title ?? item.marketplace_listing_title),
          location: parseLocation(item.location),
        });
        created++;
      }
    } catch (err) {
      console.error('Listing error:', url, err);
      errors++;
    }
  }

  return new Response(JSON.stringify({ created, updated, errors }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
