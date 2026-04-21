# FB Marketplace Rental Arbitrage Scraper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a daily pipeline that scrapes Charlotte Facebook Marketplace rentals, tracks listings in Notion, and auto-generates a personalized Kwesi Holdings pitch for any listing that hits 30+ days active.

**Architecture:** Apify scrapes daily and POSTs results to `/api/apify-webhook`, which deduplicates against a Notion database by URL. A Vercel cron hits `/api/daily-check` each morning, finds listings aged 30+ days, calls Claude to generate pitches, and flips their Notion status to "Ready to Pitch."

**Tech Stack:** Astro API routes, `@notionhq/client` (already installed), `@anthropic-ai/sdk` (new), Vitest (new), Apify Facebook Marketplace actor, Vercel cron

---

## File Map

| File | Role |
|---|---|
| `src/lib/fb-leads.ts` | All Notion read/write operations for the FB Rental Leads database |
| `src/lib/pitch.ts` | Claude API call — generates personalized pitch from listing data |
| `src/pages/api/apify-webhook.ts` | POST endpoint — receives Apify payload, deduplicates, writes to Notion |
| `src/pages/api/daily-check.ts` | GET endpoint — Vercel cron target, finds stale listings, generates pitches |
| `vercel.json` | Add cron schedule for daily-check |
| `.env` | Add 3 new env vars |
| `src/lib/fb-leads.test.ts` | Tests for pure helpers in fb-leads |
| `src/lib/pitch.test.ts` | Tests for pitch generation (mocked Anthropic) |
| `src/pages/api/apify-webhook.test.ts` | Tests for webhook parsing and secret validation |
| `src/pages/api/daily-check.test.ts` | Tests for stale-listing filter and orchestration |

---

## Task 1: Install Dependencies + Add Env Vars

**Files:**
- Modify: `package.json` (via npm install)
- Modify: `.env`

- [ ] **Step 1: Install Anthropic SDK and Vitest**

```bash
cd /Users/nelsonkwesi/ai-content-system/lead-pages
npm install @anthropic-ai/sdk
npm install --save-dev vitest
```

Expected output: both packages added to package.json with no errors.

- [ ] **Step 2: Add vitest script to package.json**

Open `package.json` and add `"test": "vitest run"` to the `scripts` block:

```json
{
  "name": "lead-pages",
  "type": "module",
  "version": "1.0.0",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "astro": "astro",
    "test": "vitest run"
  }
}
```

- [ ] **Step 3: Add env vars to .env**

Append to `.env`:

```
NOTION_FB_LEADS_DB_ID=PASTE_DB_ID_AFTER_CREATING_IN_TASK_2
ANTHROPIC_API_KEY=your_anthropic_api_key_here
APIFY_WEBHOOK_SECRET=your_random_secret_here
CRON_SECRET=your_random_cron_secret_here
```

Generate random secrets with: `openssl rand -hex 32`

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json .env
git commit -m "feat: install anthropic sdk and vitest, add env var stubs"
```

---

## Task 2: Create the Notion Database

**Files:** None — manual setup in Notion UI, then capture the DB ID.

- [ ] **Step 1: Create the database in Notion**

In Notion, create a new full-page database called **"FB Rental Leads"**. Add these properties (delete the default ones first):

| Property Name | Type | Notes |
|---|---|---|
| Name | Title | Default — keep it |
| URL | URL | |
| Price | Number | Format: Number |
| Bedrooms | Number | Format: Number |
| Location | Text | |
| First Seen | Date | |
| Last Seen | Date | |
| Days Active | Formula | Formula: `dateBetween(now(), prop("First Seen"), "days")` |
| Status | Select | Options: Tracking, Ready to Pitch, Contacted, Passed |
| Pitch | Text | |
| Notes | Text | |

- [ ] **Step 2: Get the database ID**

Open the database as a full page. The URL looks like:
`https://www.notion.so/YOUR-WORKSPACE/XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX?v=...`

The 32-character hex string is the database ID. Copy it and paste it as `NOTION_FB_LEADS_DB_ID` in `.env`.

- [ ] **Step 3: Create Notion views**

In the database, create these filtered views:
- **Ready to Pitch** — filter: Status = "Ready to Pitch", sort: Days Active descending
- **Tracking** — filter: Status = "Tracking", sort: First Seen ascending
- **Contacted** — filter: Status = "Contacted"

- [ ] **Step 4: Commit .env with real DB ID**

```bash
git add .env
git commit -m "feat: add notion fb leads database id"
```

---

## Task 3: Build fb-leads.ts (Notion Helpers)

**Files:**
- Create: `src/lib/fb-leads.ts`
- Create: `src/lib/fb-leads.test.ts`

- [ ] **Step 1: Write failing tests for the pure helper `daysAgo`**

Create `src/lib/fb-leads.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { daysAgo } from './fb-leads';

describe('daysAgo', () => {
  it('returns 0 for today', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(daysAgo(today)).toBe(0);
  });

  it('returns correct days for a past date', () => {
    const past = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];
    expect(daysAgo(past)).toBe(35);
  });

  it('returns 30 for exactly 30 days ago', () => {
    const past = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];
    expect(daysAgo(past)).toBe(30);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test
```

Expected: FAIL — `daysAgo` is not exported from `./fb-leads`.

- [ ] **Step 3: Implement fb-leads.ts**

Create `src/lib/fb-leads.ts`:

```typescript
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
      Name: { title: [{ text: { content: listing.title } }] },
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
  const response = await notion.databases.query({
    database_id: getDbId(),
    filter: { property: 'Status', select: { equals: 'Tracking' } },
  });
  return (response.results as any[]).map(pageToLead);
}

export async function savePitchAndFlip(pageId: string, pitch: string): Promise<void> {
  const notion = getClient();
  await notion.pages.update({
    page_id: pageId,
    properties: {
      Pitch: { rich_text: [{ text: { content: pitch } }] },
      Status: { select: { name: 'Ready to Pitch' } },
    },
  });
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test
```

Expected: PASS — all 3 `daysAgo` tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/fb-leads.ts src/lib/fb-leads.test.ts
git commit -m "feat: add fb-leads notion helpers with daysAgo utility"
```

---

## Task 4: Build pitch.ts (Claude Pitch Generator)

**Files:**
- Create: `src/lib/pitch.ts`
- Create: `src/lib/pitch.test.ts`

- [ ] **Step 1: Write failing test**

Create `src/lib/pitch.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'Hi there, this is Nelson with Kwesi Holdings.' }],
        }),
      },
    })),
  };
});

// Mock import.meta.env
vi.stubGlobal('import', {
  meta: { env: { ANTHROPIC_API_KEY: 'test-key' } },
});

describe('generatePitch', () => {
  it('returns a non-empty string', async () => {
    const { generatePitch } = await import('./pitch');
    const result = await generatePitch({
      price: 1800,
      bedrooms: 3,
      location: 'South End, Charlotte',
    });
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('throws when ANTHROPIC_API_KEY is missing', async () => {
    vi.stubGlobal('import', { meta: { env: {} } });
    const { generatePitch } = await import('./pitch');
    await expect(generatePitch({ price: null, bedrooms: null, location: '' }))
      .rejects.toThrow('ANTHROPIC_API_KEY not set');
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test
```

Expected: FAIL — `./pitch` module does not exist.

- [ ] **Step 3: Implement pitch.ts**

Create `src/lib/pitch.ts`:

```typescript
import Anthropic from '@anthropic-ai/sdk';

interface ListingContext {
  price: number | null;
  bedrooms: number | null;
  location: string;
}

export async function generatePitch(listing: ListingContext): Promise<string> {
  const apiKey = import.meta.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const client = new Anthropic({ apiKey });

  const bedroomStr = listing.bedrooms ? `${listing.bedrooms}-bedroom` : 'your';
  const locationStr = listing.location || 'Charlotte';
  const priceStr = listing.price
    ? `$${listing.price.toLocaleString()}/month`
    : 'your asking price';

  const prompt = `Write a short, professional Facebook Messenger outreach message from Nelson at Kwesi Holdings & Management to a landlord whose rental listing has been up for 30+ days.

Property details:
- Bedrooms: ${listing.bedrooms ?? 'not specified'}
- Location: ${locationStr}
- Asking price: ${priceStr}

The message must:
1. Open with "Hi there" (no name available)
2. Identify as Nelson with Kwesi Holdings & Management
3. Reference the specific property (${bedroomStr} in ${locationStr})
4. Explain the model: long-term lease, guaranteed rent each month, used for vetted traveling professionals and extended-stay occupants
5. List what Kwesi handles: furnishing if needed, utilities, routine cleaning, guest communication, upkeep
6. Reference ${priceStr} to show it works for the model
7. End with a call to action for a quick call or walkthrough
8. Sign off as: Nelson, Kwesi Holdings & Management

No em dashes. Under 200 words. Direct and warm.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 400,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== 'text') throw new Error('Unexpected Claude response type');
  return content.text.trim();
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/pitch.ts src/lib/pitch.test.ts
git commit -m "feat: add claude pitch generator"
```

---

## Task 5: Build /api/apify-webhook.ts

**Files:**
- Create: `src/pages/api/apify-webhook.ts`
- Create: `src/pages/api/apify-webhook.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/pages/api/apify-webhook.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { parsePrice, parseBedrooms } from './apify-webhook';

describe('parsePrice', () => {
  it('returns a number when given a number', () => {
    expect(parsePrice(1800)).toBe(1800);
  });

  it('strips currency symbols and commas from strings', () => {
    expect(parsePrice('$1,800/month')).toBe(1800);
  });

  it('returns null for undefined', () => {
    expect(parsePrice(undefined)).toBeNull();
  });

  it('returns null for unparseable strings', () => {
    expect(parsePrice('contact for price')).toBeNull();
  });
});

describe('parseBedrooms', () => {
  it('returns a number from a number', () => {
    expect(parseBedrooms(3)).toBe(3);
  });

  it('parses integer from string', () => {
    expect(parseBedrooms('3 bd')).toBe(3);
  });

  it('returns null for undefined', () => {
    expect(parseBedrooms(undefined)).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test
```

Expected: FAIL — `parsePrice` and `parseBedrooms` not exported.

- [ ] **Step 3: Implement apify-webhook.ts**

Create `src/pages/api/apify-webhook.ts`:

```typescript
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
  const incoming = request.headers.get('x-apify-webhook-secret');

  if (secret && incoming !== secret) {
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
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/api/apify-webhook.ts src/pages/api/apify-webhook.test.ts
git commit -m "feat: add apify webhook endpoint with listing dedup"
```

---

## Task 6: Build /api/daily-check.ts

**Files:**
- Create: `src/pages/api/daily-check.ts`
- Create: `src/pages/api/daily-check.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/pages/api/daily-check.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { isStale } from './daily-check';

describe('isStale', () => {
  it('returns true for a listing 30 days old with no pitch', () => {
    const firstSeen = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];
    expect(isStale({ firstSeen, pitch: '' })).toBe(true);
  });

  it('returns false for a listing 29 days old', () => {
    const firstSeen = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];
    expect(isStale({ firstSeen, pitch: '' })).toBe(false);
  });

  it('returns false when pitch already exists', () => {
    const firstSeen = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];
    expect(isStale({ firstSeen, pitch: 'Hi there...' })).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test
```

Expected: FAIL — `isStale` not exported.

- [ ] **Step 3: Implement daily-check.ts**

Create `src/pages/api/daily-check.ts`:

```typescript
import type { APIRoute } from 'astro';
import { getTrackingListings, savePitchAndFlip, daysAgo } from '../../lib/fb-leads';
import { generatePitch } from '../../lib/pitch';

export function isStale({ firstSeen, pitch }: { firstSeen: string; pitch: string }): boolean {
  return pitch === '' && daysAgo(firstSeen) >= 30;
}

export const GET: APIRoute = async ({ request }) => {
  const cronSecret = import.meta.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${cronSecret}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
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
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test
```

Expected: PASS — all tests green.

- [ ] **Step 5: Commit**

```bash
git add src/pages/api/daily-check.ts src/pages/api/daily-check.test.ts
git commit -m "feat: add daily-check cron endpoint for pitch generation"
```

---

## Task 7: Configure Vercel Cron

**Files:**
- Modify: `vercel.json`

- [ ] **Step 1: Update vercel.json**

Replace the contents of `vercel.json` with:

```json
{
  "framework": "astro",
  "crons": [
    {
      "path": "/api/daily-check",
      "schedule": "0 13 * * *"
    }
  ]
}
```

`0 13 * * *` = 13:00 UTC = 8:00am EST. Vercel crons always use UTC.

- [ ] **Step 2: Add CRON_SECRET to Vercel env**

Go to Vercel dashboard > your project > Settings > Environment Variables. Add:
- `CRON_SECRET` = same value as in `.env`
- `NOTION_API_KEY` = same as `.env`
- `NOTION_FB_LEADS_DB_ID` = same as `.env`
- `ANTHROPIC_API_KEY` = same as `.env`
- `APIFY_WEBHOOK_SECRET` = same as `.env`

- [ ] **Step 3: Commit**

```bash
git add vercel.json
git commit -m "feat: add vercel cron for daily-check at 8am EST"
```

---

## Task 8: Deploy + Apify Setup

**Files:** None — deployment and external config.

- [ ] **Step 1: Deploy to Vercel**

```bash
npx vercel --prod
```

Confirm the deploy succeeds and note the production URL (should be `nelsonkwesi.xyz`).

- [ ] **Step 2: Test the webhook endpoint manually**

```bash
curl -X POST https://nelsonkwesi.xyz/api/apify-webhook \
  -H "Content-Type: application/json" \
  -H "x-apify-webhook-secret: YOUR_SECRET_HERE" \
  -d '[{"title":"Test 3BR House","url":"https://www.facebook.com/marketplace/item/test123","price":1800,"bedrooms":3,"location":"South End, Charlotte, NC"}]'
```

Expected response: `{"created":1,"updated":0,"errors":0}`

Verify the entry appears in the Notion "FB Rental Leads" database with Status = "Tracking".

- [ ] **Step 3: Set up Apify actor**

1. Go to [apify.com](https://apify.com) and create a free account
2. Search for **"Facebook Marketplace Scraper"** in the Store
3. Click **Try for free**
4. Configure the input:
   ```json
   {
     "searchQuery": "house for rent",
     "location": "Charlotte, NC",
     "maxItems": 200
   }
   ```
5. Run it once manually to verify it returns listings

- [ ] **Step 4: Configure Apify webhook**

In the actor's Settings > Integrations > Webhooks:
- Event: `ACTOR.RUN.SUCCEEDED`
- URL: `https://nelsonkwesi.xyz/api/apify-webhook`
- Headers: `x-apify-webhook-secret: YOUR_APIFY_WEBHOOK_SECRET`
- Payload template: Use default (sends the dataset items)

- [ ] **Step 5: Set up Apify schedule**

In the actor's Settings > Schedules:
- Add schedule: `0 12 * * *` (12:00 UTC = 7:00am EST — runs one hour before the daily-check cron)
- Enable the schedule

- [ ] **Step 6: Run a second search query for apartments**

Duplicate the actor run configuration for `"apartment for rent"` in Charlotte. Both searches feed the same webhook endpoint and Notion database.

- [ ] **Step 7: Verify end-to-end after first real run**

After the next scheduled Apify run:
1. Check Notion "Tracking" view for new entries
2. Confirm Last Seen dates are today
3. After 30 days, confirm "Ready to Pitch" entries appear with pitch text

---

## Self-Review Checklist (for the implementer)

After completing all tasks, verify:

- [ ] `npm test` passes with no failures
- [ ] `npm run build` succeeds with no TypeScript errors
- [ ] A manual webhook POST creates a Notion entry correctly
- [ ] A second POST with the same URL updates `Last Seen` without creating a duplicate
- [ ] The daily-check endpoint returns 401 without the correct `Authorization` header
- [ ] The apify-webhook returns 401 without the correct secret header
- [ ] Vercel cron is visible in the Vercel dashboard under the project's Cron Jobs tab
