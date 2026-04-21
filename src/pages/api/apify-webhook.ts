import type { APIRoute } from 'astro';
import { findListingByUrl, createListing, updateLastSeen } from '../../lib/fb-leads';

interface ApifyListing {
  title?: string;
  name?: string;
  price?: number | string;
  location?: string;
  url: string;
  bedrooms?: number | string;
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

  let listings: ApifyListing[];
  try {
    listings = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!Array.isArray(listings)) {
    return new Response(JSON.stringify({ error: 'Expected array' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const item of listings) {
    if (!item.url) continue;
    try {
      const existing = await findListingByUrl(item.url);
      if (existing) {
        await updateLastSeen(existing.id);
        updated++;
      } else {
        await createListing({
          title: item.title ?? item.name ?? 'Rental Listing',
          url: item.url,
          price: parsePrice(item.price),
          bedrooms: parseBedrooms(item.bedrooms),
          location: item.location ?? '',
        });
        created++;
      }
    } catch (err) {
      console.error('Error processing listing', item.url, err);
      errors++;
    }
  }

  return new Response(JSON.stringify({ created, updated, errors }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
