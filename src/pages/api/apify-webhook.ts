import type { APIRoute } from 'astro';
import { findListingByUrl, createListing, updateLastSeen } from '../../lib/fb-leads';

interface ApifyWebhookPayload {
  eventType: string;
  eventData: {
    actorRunId: string;
    defaultDatasetId: string;
  };
}

interface ApifyListing {
  title?: string;
  name?: string;
  price?: number | string;
  location?: string;
  url?: string;
  listingUrl?: string;
  bedrooms?: number | string;
}

async function fetchDatasetItems(datasetId: string, token: string): Promise<ApifyListing[]> {
  const res = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}&format=json`
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

export function parseBedrooms(val: number | string | undefined): number | null {
  if (val == null) return null;
  const n = parseInt(String(val), 10);
  return isNaN(n) ? null : n;
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

  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const item of listings) {
    const url = item.url ?? item.listingUrl;
    if (!url) continue;
    try {
      const existing = await findListingByUrl(url);
      if (existing) {
        await updateLastSeen(existing.id);
        updated++;
      } else {
        await createListing({
          title: item.title ?? item.name ?? 'Rental Listing',
          url,
          price: parsePrice(item.price),
          bedrooms: parseBedrooms(item.bedrooms),
          location: item.location ?? '',
        });
        created++;
      }
    } catch (err) {
      console.error('Error processing listing', url, err);
      errors++;
    }
  }

  return new Response(JSON.stringify({ created, updated, errors }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
