import type { APIRoute } from 'astro';
import { Client } from '@notionhq/client';

async function subscribeToBeehiiv(
  name: string,
  email: string,
  resource: string,
  publicationId: string,
  apiKey: string
): Promise<boolean> {
  const res = await fetch(
    `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        email,
        utm_source: 'lead-page',
        utm_medium: 'hand-raiser',
        utm_campaign: resource,
        reactivate_existing: true,
        send_welcome_email: true,
        custom_fields: [{ name: 'first_name', value: name }],
        tags: [resource, 'hand-raiser'],
      }),
    }
  );
  return res.ok;
}

async function saveToNotion(
  name: string,
  email: string,
  resource: string,
  apiKey: string,
  dbId: string
): Promise<void> {
  const notion = new Client({ auth: apiKey });
  await notion.pages.create({
    parent: { database_id: dbId },
    properties: {
      Name: { title: [{ text: { content: name } }] },
      Email: { email },
      Resource: { select: { name: resource } },
    },
  });
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const { name, email, resource } = await request.json();

    if (!name || !email || !resource) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!email.includes('@') || !email.includes('.')) {
      return new Response(JSON.stringify({ error: 'Invalid email' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const env = globalThis.process?.env ?? {};

    const beehiivKey = env['BEEHIIV_API_KEY'] || import.meta.env.BEEHIIV_API_KEY;
    const beehiivPubId = env['BEEHIIV_PUBLICATION_ID'] || import.meta.env.BEEHIIV_PUBLICATION_ID;

    const notionKey = env['NOTION_API_KEY'] || import.meta.env.NOTION_API_KEY;
    const notionDbId = env['NOTION_LEADS_DB_ID'] || import.meta.env.NOTION_LEADS_DB_ID;

    let beehiivOk = false;
    let notionOk = false;

    // Subscribe to Beehiiv (primary — this is the business)
    if (beehiivKey && beehiivPubId) {
      beehiivOk = await subscribeToBeehiiv(name, email, resource, beehiivPubId, beehiivKey);
      if (!beehiivOk) console.warn('Beehiiv subscription failed for', email);
    } else {
      console.warn('Beehiiv not configured — set BEEHIIV_API_KEY and BEEHIIV_PUBLICATION_ID');
    }

    // Also save to Notion leads DB (backup)
    if (notionKey && notionDbId && notionKey !== 'your_notion_api_key_here') {
      try {
        await saveToNotion(name, email, resource, notionKey, notionDbId);
        notionOk = true;
      } catch (err) {
        console.warn('Notion save failed:', err);
      }
    }

    return new Response(
      JSON.stringify({ success: true, beehiiv: beehiivOk, notion: notionOk }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Lead capture error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
