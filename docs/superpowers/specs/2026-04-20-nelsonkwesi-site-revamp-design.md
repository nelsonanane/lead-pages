# nelsonkwesi.xyz Revamp — Design Spec
**Date:** 2026-04-20
**Project:** ai-content-system/lead-pages (Astro)
**Status:** Approved

---

## Overview

Revamp nelsonkwesi.xyz from a free resources index page into a homepage that establishes Nelson as an AI systems builder, presents two real case studies, and converts visitors to AI Audit bookings. Free resources move to `/free-resources`. The AI Audit page gets redesigned to match the brand. An About page is added.

**Primary conversion goal:** Book an AI Audit ($500)

---

## Site Structure

| Route | Status | Purpose |
|---|---|---|
| `/` | Rebuild | New homepage — what we build, case studies, audit CTA |
| `/free-resources` | New (move from `/`) | Current homepage content relocated here |
| `/[resource]` | No change | Individual resource pages |
| `/ai-audit` | Rebuild | Redesign to match brand system |
| `/about` | New | About Nelson + socials |

---

## Design System

### Identity
- **Site handle:** nelsonkwesi.xyz
- **X:** @nelsonkwesix
- **YouTube:** Nelson Kwesi
- **All other platforms:** @nelsonkwesi.xyz

### Visual Language
- **Aesthetic:** Retro CRT / Steve Jobs Apple 80s / VHS terminal
- **Background:** `#080A06` (near-black with green undertone)
- **Primary accent:** `#F0C030` (amber/yellow)
- **Text:** `#EDE8C8` (warm cream)
- **Text dim:** `rgba(237,232,200,0.52)`
- **Text faint:** `rgba(237,232,200,0.2)`
- **Border:** `rgba(240,192,48,0.25)`
- **Active border (CTA box):** `rgba(240,192,48,1)` full amber

### Typography
- **Font:** Kode Mono (Google Fonts) — weights 400, 500, 600, 700
- **Fallback:** `'Courier New', monospace`
- **Body text:** 0.68–0.72rem
- **Labels/eyebrows:** 0.52–0.6rem, letter-spacing 0.15–0.2em, uppercase
- **Headlines:** `clamp(1.8rem, 4.5vw, 3.1rem)`, weight 700

### CRT Effects
- **Scanlines:** `repeating-linear-gradient` overlay, fixed, z-index 9999, 2px/4px repeat, opacity 0.16
- **Phosphor glow:** radial gradient overlay `rgba(240,192,48,0.035)` centered, fixed
- **Amber text glow:** `text-shadow: 0 0 14px rgba(240,192,48,0.55)` on brand name
- **Button glow:** `box-shadow: 0 0 16px rgba(240,192,48,0.28)`
- **VHS tracking line:** pseudo-element on hero, 2px horizontal gradient band
- **Blinking cursor:** CSS `animation: blink 1.1s step-end infinite` on `●`

### UI Patterns
- **Box-drawing borders:** `border: 1px solid var(--border)` with absolute `.box-label` (top: -9px, background: var(--bg), padding: 0 8px)
- **Section labels:** `sec-label` class — `──` prefix in faint amber, text in amber, uppercase, 0.52rem
- **Sys-line:** `>` prefix in amber, text in amber-dim, uppercase
- **Dividers:** `border-bottom: 1px solid var(--border)` between sections
- **Grid separator:** `gap: 1px; background: var(--border)` — creates 1px amber rule between cards
- **Boot bar:** top of every page — `SITE // SYS:READY` left, `REC ● DATE` right
- **VHS stamp:** `▶ PLAY` bottom-right of hero box

### Buttons
- Background: `var(--amber)`, color: `var(--bg)`, font-family: Kode Mono
- 0.65rem, weight 700, letter-spacing 0.14em, uppercase
- Padding: 11px 24px, no border-radius
- Hover: increase box-shadow glow

---

## Page Specs

### `/` — Homepage

**Sections (top to bottom):**

1. **Boot bar** — `NELSONKWESI.XYZ // SYS:READY` | `REC ● DATE`
2. **Nav** — `nelsonkwesi.xyz` brand | Home · Free Resources · AI Audit · About
3. **Hero** (box-border with `INIT //` label)
   - Sys-line: `> Software Engineer · AI Systems Builder`
   - H1: `Building businesses that run on AI.` (em: "run on AI." in amber)
   - Subtext: `Nine years writing code. Backends, frontends, banking infrastructure. Now building AI-operated businesses — live, in public, start to finish. Come build with us.`
   - CTA: `Book an AI Audit — $500` → `/ai-audit`
   - Note: `30-min session · live automation build · one-page report`
   - VHS stamp: `CH:01 ▶ PLAY`
4. **What We Build**
   - Sec-label: `SYSTEM LOG // WHAT WE BUILD`
   - H2: `Real businesses. Real AI. In public.`
   - Body: `We build AI-operated businesses from scratch and document everything — the systems, the failures, the setups that actually work. Tutorials and demos included. The difference is these systems have to pay rent.`
   - Tags: AI Agent Pipelines · Content Distribution · Short-Term Rental Ops · Workflow Automation · AI Audits
5. **Case Studies** — 2-column grid (1-col on mobile)
   - **Left — In Progress:** AI-Operated Airbnb Business
     - Status badge: `● IN PROGRESS` (amber, blinking)
     - Bullets: Guest messaging agent / Cleaner hiring via Upwork / Demand-adjusted pricing pipeline / Auto review responses
   - **Right — Live:** Content Distribution System
     - Status badge: `■ LIVE SYSTEM` (green)
     - Bullets: Pain point research (Reddit, X, web) / Scripts + 3 hook variations + outlier scoring / PDF lead magnets / Notion pipeline / Outlier detection 3x → Inspiration Library / Blog + carousel output
6. **AI Audit CTA** (full-amber border box with `// AI AUDIT` label)
   - H2: `One session. Your whole workflow, automated.` (em: "automated." in amber)
   - Body: `We map your operations, build a live automation on the call, and hand you a one-page report before we hang up. Thirty minutes. No technical background required.`
   - Chips: 30-MIN ZOOM · LIVE BUILD · AUDIT REPORT PDF · 3 NEXT STEPS
   - Price: `$500` (amber glow) + `FOUNDING RATE` label + `Book Now →` button
7. **About teaser**
   - 3 short paragraphs (see copy below)
   - Social links: X @nelsonkwesix · YouTube: Nelson Kwesi · @nelsonkwesi.xyz
8. **Footer** — `© 2026 nelsonkwesi.xyz` | Resources · Audit · About

---

### `/free-resources` — Free Resources

Move current `index.astro` content here verbatim. Update nav link and internal links. Nav should now show 4 items.

---

### `/ai-audit` — AI Audit (Rebuild)

Rebuild the existing page (`ai-audit.astro`) to match the design system above. Currently uses a white/green theme (off-brand, not mobile friendly). Rebuild with:
- Same dark CRT aesthetic
- Same Kode Mono font
- Boot bar + nav consistent with homepage
- Keep all existing content sections (What You Get, Who It's For, Stats, Pricing, Booking)
- Keep Calendly embed
- Make fully mobile responsive

---

### `/about` — About (New Page)

- Boot bar + nav
- Hero with box border, `// ABOUT` label
- Full about copy:
  > Born in Ghana. Moved to the US for college. Spent close to a decade building software — JavaScript, TypeScript, backend systems, banking platforms.
  >
  > Then got serious about what AI could actually do in production. Not prototypes. Real systems, running real businesses. Started building two of them — and documenting the whole thing publicly.
  >
  > Steve Jobs didn't just make the thing — he made people understand why it mattered. That's the idea here. We build, we share, we figure it out together.
- Social links: X @nelsonkwesix · YouTube: Nelson Kwesi · @nelsonkwesi.xyz
- Footer

---

## Copy Reference

### Handles
- Web/socials: `nelsonkwesi.xyz`
- X: `@nelsonkwesix`
- YouTube: `Nelson Kwesi`
- All others: `@nelsonkwesi.xyz`
- Do NOT use `@thenelsonkwesi` anywhere

### Tone Rules
- "We" not "I" — community, not solo
- Short sentences. One idea per line.
- No AI filler phrases ("dive into", "seamlessly", "leverage", "unlock")
- Monospace aesthetic in copy: lowercase section labels, `>` prompts, `·` separators

---

## Technical Notes

- **Framework:** Astro (existing project at `ai-content-system/lead-pages`)
- **Styling:** Inline `<style>` per page (current pattern) — do not introduce Tailwind or CSS files
- **Font loading:** Google Fonts via `<link>` in `<head>` (existing pattern)
- **Content:** Astro Content Collections for resources (unchanged)
- **Routing:** Astro file-based routing — new pages = new `.astro` files in `src/pages/`
- **No JS frameworks** — plain HTML/CSS, minimal JS only where needed (Calendly embed)
- **Mobile:** All pages must be responsive. Nav collapses on small screens (hamburger or stacked)

---

## Files to Create / Modify

| Action | File |
|---|---|
| Modify | `src/pages/index.astro` — full rebuild |
| Create | `src/pages/free-resources.astro` — move current index content |
| Modify | `src/pages/ai-audit.astro` — full rebuild to match design system |
| Create | `src/pages/about.astro` — new about page |
| No change | `src/pages/[resource].astro` |
| No change | `src/layouts/ResourceLayout.astro` |
| No change | `src/content/resources/` |

---

## Out of Scope

- No backend changes
- No new content collections
- No new integrations
- No changes to resource layout or individual resource pages
- No analytics or tracking changes
