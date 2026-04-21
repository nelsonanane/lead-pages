# FB Marketplace Rental Arbitrage Scraper — Design Spec

**Date:** 2026-04-20
**Project:** Kwesi Holdings & Management — Lead Generation System
**Market:** Charlotte, NC (expandable)

---

## Overview

A daily automated pipeline that monitors Facebook Marketplace for rental listings in Charlotte, tracks how long each listing has been active, and generates personalized outreach messages for landlords whose properties have sat unseen for 30+ days. Nelson sends the messages manually via Facebook Messenger.

---

## Architecture

```
Apify (daily 7am EST)
  → scrapes Facebook Marketplace "Charlotte rentals"
  → POSTs results to Vercel webhook endpoint

/api/apify-webhook (Vercel)
  → deduplicates listings against Notion by URL
  → creates new entries: Status = Tracking, First Seen = today
  → updates existing entries: Last Seen = today

/api/daily-check (Vercel cron, daily 13:00 UTC / 8am EST)
  → queries Notion for Status = Tracking entries
  → for each where Days Active >= 30 and Pitch is empty:
      → calls Claude API to generate personalized pitch
      → saves pitch to Notion entry
      → flips Status to Ready to Pitch
```

Nelson opens Notion each morning, reviews the "Ready to Pitch" view, copies the pitch from each entry, and sends it via Facebook Messenger.

---

## Notion Database: "FB Rental Leads"

| Field | Type | Notes |
|---|---|---|
| Name | Title | Listing headline from Facebook |
| URL | URL | Facebook listing link (dedup key) |
| Price | Number | Monthly rent asking price |
| Bedrooms | Number | Bed count |
| Location | Text | Neighborhood or address |
| First Seen | Date | Set once on creation, never overwritten |
| Last Seen | Date | Updated on every daily scrape |
| Days Active | Formula | `dateBetween(now(), prop("First Seen"), "days")` |
| Status | Select | Tracking / Ready to Pitch / Contacted / Passed |
| Pitch | Text | Claude-generated message, populated at 30 days |
| Notes | Text | Nelson's personal notes after outreach |

**Notion views to create:**
- **Ready to Pitch** — Status = "Ready to Pitch", sorted by Days Active desc
- **Tracking** — Status = "Tracking", sorted by First Seen asc
- **Contacted** — Status = "Contacted"

---

## Apify Configuration

- **Actor:** `apify/facebook-marketplace-scraper`
- **Search queries:** "house for rent", "apartment for rent"
- **Location:** Charlotte, NC
- **Max results per run:** 200
- **Schedule:** Daily at 7:00am EST
- **Webhook:** POST to `https://nelsonkwesi.xyz/api/apify-webhook`
- **Auth:** Apify free tier (~$5/month compute, sufficient for daily Charlotte runs)

No Facebook account required — Apify manages authentication through their own proxy infrastructure.

**Webhook security:** Apify signs each webhook request with a secret token sent in the `X-Apify-Webhook-Secret` header. The `/api/apify-webhook` endpoint checks this header against `APIFY_WEBHOOK_SECRET` and returns 401 if it does not match, preventing unauthorized POSTs from triggering database writes.

---

## Processing Pipeline

### `/api/apify-webhook`

Receives the Apify payload after each run. For each listing in the JSON array:

1. Extract: title, URL, price, bedrooms, location
2. Query Notion: does an entry with this URL already exist?
3. If no: create new entry with First Seen = today, Status = Tracking
4. If yes: update Last Seen = today only

This endpoint is lightweight — one Notion read + one write per listing. No Claude calls here.

### `/api/daily-check`

Vercel cron triggers daily at 13:00 UTC (8:00am EST). Vercel crons use UTC — the vercel.json entry will be `"0 13 * * *"`. Steps:

1. Query Notion: all entries where Status = "Tracking"
2. Filter client-side: Days Active >= 30 AND Pitch field is empty
3. For each match: call Claude API with listing data, save pitch, set Status = "Ready to Pitch"
4. Claude is called once per qualifying listing — batched across the morning run

---

## Pitch Generation

Claude receives listing context and generates a personalized message following this structure:

```
Hi [landlord name or "there"], this is Nelson with Kwesi Holdings & Management.

I came across your [X-bed] in [neighborhood] and wanted to reach out directly.

We work with property owners by leasing homes long-term and providing guaranteed
rent each month. The home is used for vetted traveling professionals and
extended-stay occupants. We handle everything — furnishing if needed, utilities,
routine cleaning, guest communication, and upkeep. Simple for you, well-maintained
for us.

Your asking price of $[X]/month works well for what we do. If you're open to it,
I'd love a quick call or walkthrough.

— Nelson, Kwesi Holdings & Management
```

Variables substituted from Notion entry: bedrooms, neighborhood/location, price. Landlord name is not reliably available in scraped Marketplace data — when absent, the greeting defaults to "Hi there" and Claude omits any name reference rather than guessing.

---

## File Structure (in lead-pages)

```
src/pages/api/
  apify-webhook.ts     ← receives Apify POST, writes to Notion
  daily-check.ts       ← Vercel cron, generates pitches for 30+ day listings
```

```
vercel.json            ← add cron entry for daily-check
```

---

## Environment Variables Required

```
NOTION_API_KEY          ← existing
NOTION_FB_LEADS_DB_ID   ← new database ID once created
ANTHROPIC_API_KEY       ← for Claude pitch generation
APIFY_WEBHOOK_SECRET    ← to verify webhook authenticity
```

---

## Scaling to Other Cities

To expand beyond Charlotte:
1. Add a second Apify actor run with a different location
2. Add a "Market" field to the Notion database
3. No code changes required — the pipeline handles any city's listings identically

---

## Out of Scope

- Automating the Messenger outreach (high Facebook ban risk, Nelson sends manually)
- Listing quality scoring (price per bed, neighborhood ranking) — future iteration
- CRM features beyond Notion (follow-up reminders, deal tracking) — future iteration
