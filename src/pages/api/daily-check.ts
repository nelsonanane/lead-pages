import type { APIRoute } from 'astro';
import { getTrackingListings, savePitchAndFlip, daysAgo } from '../../lib/fb-leads';
import { generatePitch } from '../../lib/pitch';

export function isStale({ firstSeen, pitch }: { firstSeen: string; pitch: string }): boolean {
  return pitch === '' && daysAgo(firstSeen) >= 30;
}

export const GET: APIRoute = async ({ request }) => {
  const cronSecret = import.meta.env.CRON_SECRET;
  if (!cronSecret) {
    return new Response(JSON.stringify({ error: 'Server misconfiguration: CRON_SECRET not set' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const tracking = await getTrackingListings();
  const stale = tracking.filter(isStale);

  let pitched = 0;
  let errors = 0;

  for (const lead of stale) {
    try {
      const pitch = await generatePitch(lead);
      await savePitchAndFlip(lead.id, pitch);
      pitched++;
    } catch (err) {
      console.error('Pitch error for lead', lead.id, err);
      errors++;
    }
  }

  return new Response(
    JSON.stringify({ checked: tracking.length, stale: stale.length, pitched, errors }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
