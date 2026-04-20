# nelsonkwesi.xyz Revamp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild nelsonkwesi.xyz with a retro CRT design system, new homepage (case studies + AI Audit CTA), moved free resources, rebuilt ai-audit page, and new about page.

**Architecture:** Introduce a shared `SiteLayout.astro` that owns the design system CSS, boot bar, nav, and footer — all 4 rebuilt pages use it. Each page is a thin Astro file that passes its content into the layout. This avoids repeating ~150 lines of CSS across every page.

**Tech Stack:** Astro, Kode Mono (Google Fonts), inline `<style>` in layout, no JS framework, Calendly embed on ai-audit.

**Spec:** `docs/superpowers/specs/2026-04-20-nelsonkwesi-site-revamp-design.md`

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| **Create** | `src/layouts/SiteLayout.astro` | Design system CSS, boot bar, nav, footer, `<head>` |
| **Modify** | `src/pages/index.astro` | Full rebuild — homepage |
| **Create** | `src/pages/free-resources.astro` | Move current index content here |
| **Modify** | `src/pages/ai-audit.astro` | Rebuild to match design system |
| **Create** | `src/pages/about.astro` | New about page |
| **No change** | `src/pages/[resource].astro` | Individual resource pages |
| **No change** | `src/layouts/ResourceLayout.astro` | Resource page layout |
| **No change** | `src/content/resources/` | All resource markdown files |

---

## Task 1: Create SiteLayout.astro — shared design system

**Files:**
- Create: `src/layouts/SiteLayout.astro`

This layout owns all shared chrome: CSS variables, CRT effects, Kode Mono font, boot bar, nav, footer. Every rebuilt page uses it.

- [ ] **Step 1: Create the layout file**

```astro
---
interface Props {
  title: string;
  description?: string;
  activeNav?: 'home' | 'free-resources' | 'ai-audit' | 'about';
}

const {
  title,
  description = 'Building AI-operated businesses live, in public.',
  activeNav,
} = Astro.props;

const today = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '-');
---

<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content={description} />
  <title>{title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Kode+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg:         #080A06;
      --amber:      #F0C030;
      --amber-dim:  rgba(240,192,48,0.55);
      --amber-glow: rgba(240,192,48,0.12);
      --ink:        #EDE8C8;
      --ink-dim:    rgba(237,232,200,0.52);
      --ink-faint:  rgba(237,232,200,0.2);
      --border:     rgba(240,192,48,0.25);
      --scanline:   rgba(0,0,0,0.16);
      --font:       'Kode Mono', 'Courier New', monospace;
    }

    html { scroll-behavior: smooth; }

    body {
      background: var(--bg);
      color: var(--ink);
      font-family: var(--font);
      font-size: 13px;
      line-height: 1.6;
      overflow-x: hidden;
    }

    /* CRT scanlines */
    body::before {
      content: '';
      position: fixed;
      inset: 0;
      background: repeating-linear-gradient(
        0deg,
        transparent, transparent 2px,
        var(--scanline) 2px, var(--scanline) 4px
      );
      pointer-events: none;
      z-index: 9999;
    }

    /* Phosphor glow */
    body::after {
      content: '';
      position: fixed;
      inset: 0;
      background: radial-gradient(ellipse 80% 70% at 50% 50%, rgba(240,192,48,0.035) 0%, transparent 70%);
      pointer-events: none;
      z-index: 0;
    }

    .page { max-width: 900px; margin: 0 auto; padding: 0 28px; position: relative; z-index: 1; }

    /* Boot bar */
    .boot-bar {
      font-size: 0.6rem;
      letter-spacing: 0.12em;
      color: var(--amber-dim);
      border-bottom: 1px solid var(--border);
      padding: 8px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      text-transform: uppercase;
    }
    .blink { animation: blink 1.1s step-end infinite; }
    @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

    /* Nav */
    nav { border-bottom: 1px solid var(--border); padding: 16px 0; }
    nav .inner { display: flex; justify-content: space-between; align-items: center; }
    .nav-brand {
      color: var(--amber);
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      text-decoration: none;
      text-shadow: 0 0 14px rgba(240,192,48,0.55);
    }
    .nav-links { display: flex; gap: 24px; }
    .nav-link {
      color: var(--ink-dim);
      font-size: 0.6rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      text-decoration: none;
      transition: color 0.15s;
    }
    .nav-link:hover, .nav-link.active { color: var(--amber); }

    /* Hamburger — mobile only */
    .nav-toggle {
      display: none;
      background: none;
      border: 1px solid var(--border);
      color: var(--amber);
      font-family: var(--font);
      font-size: 0.6rem;
      letter-spacing: 0.1em;
      padding: 5px 10px;
      cursor: pointer;
    }

    /* Footer */
    .site-footer {
      border-top: 1px solid var(--border);
      padding: 16px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
    }
    .footer-copy { font-size: 0.55rem; color: rgba(237,232,200,0.15); }
    .footer-links { display: flex; gap: 14px; }
    .footer-link {
      font-size: 0.55rem;
      color: var(--amber-dim);
      letter-spacing: 0.1em;
      text-transform: uppercase;
      text-decoration: none;
    }
    .footer-link:hover { color: var(--amber); }

    /* Shared utility classes */
    .section { padding: 40px 0; border-bottom: 1px solid var(--border); }
    .sec-label {
      font-size: 0.52rem;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--amber);
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .sec-label::before { content: '──'; color: rgba(240,192,48,0.25); }
    .section h2 { font-size: 1.2rem; font-weight: 700; color: var(--ink); margin-bottom: 10px; line-height: 1.2; }
    .section-sub { font-size: 0.68rem; color: var(--ink-dim); line-height: 1.78; max-width: 580px; margin-bottom: 24px; }

    .box { border: 1px solid var(--border); position: relative; }
    .box-label {
      position: absolute;
      top: -9px; left: 16px;
      background: var(--bg);
      padding: 0 8px;
      font-size: 0.52rem;
      letter-spacing: 0.16em;
      color: var(--amber);
      text-transform: uppercase;
    }

    .btn {
      display: inline-block;
      background: var(--amber);
      color: var(--bg);
      font-family: var(--font);
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      padding: 11px 24px;
      text-decoration: none;
      box-shadow: 0 0 16px rgba(240,192,48,0.28);
      transition: box-shadow 0.2s;
    }
    .btn:hover { box-shadow: 0 0 26px rgba(240,192,48,0.5); }

    .tags { display: flex; flex-wrap: wrap; gap: 6px; }
    .tag {
      font-size: 0.58rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--ink-dim);
      border: 1px solid var(--border);
      padding: 5px 12px;
    }

    .socials { display: flex; gap: 10px; margin-top: 20px; flex-wrap: wrap; }
    .social {
      font-size: 0.58rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--amber-dim);
      border: 1px solid var(--border);
      padding: 5px 12px;
      text-decoration: none;
    }
    .social:hover { color: var(--amber); border-color: var(--amber); }

    /* Mobile */
    @media (max-width: 640px) {
      .page { padding: 0 18px; }
      .nav-links { display: none; flex-direction: column; gap: 12px; padding: 14px 0; }
      .nav-links.open { display: flex; }
      .nav-toggle { display: block; }
      nav .inner { flex-wrap: wrap; gap: 10px; }
    }
  </style>
</head>
<body>
<div class="page">

  <div class="boot-bar">
    <span>NELSONKWESI.XYZ // SYS:READY</span>
    <span>REC <span class="blink">●</span> &nbsp;{today}</span>
  </div>

  <nav>
    <div class="inner">
      <a href="/" class="nav-brand">nelsonkwesi.xyz</a>
      <button class="nav-toggle" onclick="this.nextElementSibling.classList.toggle('open')">MENU</button>
      <div class="nav-links">
        <a href="/" class:list={['nav-link', { active: activeNav === 'home' }]}>Home</a>
        <a href="/free-resources" class:list={['nav-link', { active: activeNav === 'free-resources' }]}>Free Resources</a>
        <a href="/ai-audit" class:list={['nav-link', { active: activeNav === 'ai-audit' }]}>AI Audit</a>
        <a href="/about" class:list={['nav-link', { active: activeNav === 'about' }]}>About</a>
      </div>
    </div>
  </nav>

  <slot />

  <footer class="site-footer">
    <span class="footer-copy">&copy; {new Date().getFullYear()} nelsonkwesi.xyz</span>
    <div class="footer-links">
      <a href="/free-resources" class="footer-link">Resources</a>
      <a href="/ai-audit" class="footer-link">Audit</a>
      <a href="/about" class="footer-link">About</a>
    </div>
  </footer>

</div>
</body>
</html>
```

- [ ] **Step 2: Verify Astro dev server still starts**

```bash
cd /Users/nelsonkwesi/ai-content-system/lead-pages && npm run dev
```

Expected: server starts on localhost (usually port 4321), no errors in terminal.

- [ ] **Step 3: Commit**

```bash
git add src/layouts/SiteLayout.astro
git commit -m "feat: add SiteLayout with CRT design system, nav, footer"
```

---

## Task 2: Create /free-resources page (move current homepage)

**Files:**
- Create: `src/pages/free-resources.astro`

Move the current `index.astro` content into this new page, using SiteLayout.

- [ ] **Step 1: Create free-resources.astro**

```astro
---
import SiteLayout from '../layouts/SiteLayout.astro';
import { getCollection } from 'astro:content';

const allResources = await getCollection('resources');
const resources = allResources.sort((a, b) => (a.data.order ?? 999) - (b.data.order ?? 999));
---

<SiteLayout title="Free Resources — nelsonkwesi.xyz" activeNav="free-resources">
  <style>
    .page-header {
      padding: 56px 0 44px;
      border-bottom: 1px solid var(--border);
      position: relative;
      overflow: hidden;
    }
    .page-header::before {
      content: '';
      position: absolute;
      top: 0; left: 0;
      width: 400px; height: 260px;
      background: radial-gradient(ellipse at top left, rgba(240,192,48,0.05) 0%, transparent 70%);
      pointer-events: none;
    }
    .eyebrow {
      font-size: 0.55rem;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--amber);
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 18px;
    }
    .eyebrow::before { content: ''; display: block; width: 16px; height: 1px; background: var(--amber); flex-shrink: 0; }
    .page-header h1 {
      font-size: clamp(1.6rem, 3.5vw, 2.4rem);
      font-weight: 700;
      line-height: 1.1;
      margin-bottom: 10px;
      text-shadow: 2px 3px 0 rgba(0,0,0,0.5);
    }
    .page-header p { font-size: 0.72rem; color: var(--ink-dim); line-height: 1.75; }

    .resources-list { padding: 40px 0 80px; }
    .empty { font-size: 0.72rem; color: var(--ink-dim); padding: 40px 0; }

    .resource-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 24px;
      padding: 24px 0;
      border-top: 1px solid var(--border);
      text-decoration: none;
      color: inherit;
    }
    .resource-item:last-child { border-bottom: 1px solid var(--border); }
    .resource-item:hover .resource-title { color: var(--amber); }
    .resource-item:hover .resource-arrow { color: var(--amber); transform: translateX(4px); }

    .resource-title { font-size: 0.92rem; font-weight: 700; margin-bottom: 5px; transition: color 0.2s; }
    .resource-desc { font-size: 0.65rem; color: var(--ink-dim); line-height: 1.65; max-width: 520px; }
    .resource-meta {
      font-size: 0.6rem;
      color: var(--amber);
      white-space: nowrap;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .resource-arrow { display: inline-block; transition: transform 0.2s, color 0.2s; }

    @media (max-width: 600px) {
      .resource-item { flex-direction: column; align-items: flex-start; gap: 10px; }
    }
  </style>

  <div class="page-header">
    <p class="eyebrow">Free Resources</p>
    <h1>Guides, cheatsheets,<br/>and checklists.</h1>
    <p>Practical tools to help you use AI to build income and save time — no fluff.</p>
  </div>

  <div class="resources-list">
    {resources.length === 0 ? (
      <p class="empty">No resources yet. Check back soon.</p>
    ) : (
      resources.map((r) => (
        <a href={`/${r.id.replace(/\.md$/, '')}`} class="resource-item">
          <div>
            <h2 class="resource-title">{r.data.title}</h2>
            <p class="resource-desc">{r.data.previewDescription}</p>
          </div>
          <span class="resource-meta">
            {r.data.pages}p {r.data.type}
            <span class="resource-arrow">&rarr;</span>
          </span>
        </a>
      ))
    )}
  </div>
</SiteLayout>
```

- [ ] **Step 2: Check page loads correctly in browser**

Visit `http://localhost:4321/free-resources` — should show the resources list with dark CRT theme, amber accents, Kode Mono font. All resource links should work.

- [ ] **Step 3: Commit**

```bash
git add src/pages/free-resources.astro
git commit -m "feat: add /free-resources page with CRT design system"
```

---

## Task 3: Rebuild homepage (index.astro)

**Files:**
- Modify: `src/pages/index.astro`

Full rebuild. Replaces the free resources listing with hero, what we build, case studies, AI audit CTA, about teaser.

- [ ] **Step 1: Replace index.astro entirely**

```astro
---
import SiteLayout from '../layouts/SiteLayout.astro';
---

<SiteLayout
  title="nelsonkwesi.xyz — Building businesses that run on AI"
  description="Nine years writing code. Now building AI-operated businesses — live, in public, start to finish."
  activeNav="home"
>
  <style>
    /* Hero */
    .hero { padding: 52px 0 44px; border-bottom: 1px solid var(--border); position: relative; }
    .hero::after {
      content: '';
      position: absolute; left: 0; right: 0; top: 28%; height: 2px;
      background: linear-gradient(90deg, transparent, rgba(240,192,48,0.07) 30%, rgba(240,192,48,0.14) 50%, rgba(240,192,48,0.07) 70%, transparent);
      pointer-events: none;
    }
    .hero-inner { padding: 28px 28px 24px; }
    .sys-line {
      font-size: 0.58rem; color: var(--amber-dim); letter-spacing: 0.14em;
      text-transform: uppercase; margin-bottom: 20px;
      display: flex; align-items: center; gap: 10px;
    }
    .sys-line::before { content: '>'; color: var(--amber); }
    .hero h1 {
      font-size: clamp(1.8rem, 4.5vw, 3.1rem); font-weight: 700; line-height: 1.06;
      color: var(--ink); margin-bottom: 16px;
      text-shadow: 0 0 28px rgba(240,192,48,0.12);
    }
    .hero h1 em { font-style: normal; color: var(--amber); text-shadow: 0 0 18px rgba(240,192,48,0.45); }
    .hero-desc { font-size: 0.72rem; color: var(--ink-dim); line-height: 1.82; max-width: 560px; margin-bottom: 28px; }
    .hero-note { display: block; font-size: 0.56rem; color: var(--ink-faint); margin-top: 10px; letter-spacing: 0.06em; }
    .vhs-stamp { position: absolute; bottom: 14px; right: 18px; font-size: 0.52rem; color: var(--amber-dim); letter-spacing: 0.08em; opacity: 0.55; }

    /* Case studies */
    .case-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: var(--border); margin-top: 24px; }
    .case-card { background: var(--bg); padding: 24px; }
    .status-badge { display: inline-flex; align-items: center; gap: 6px; font-size: 0.52rem; letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 14px; }
    .status-badge.live { color: var(--amber); }
    .status-badge.live::before { content: '●'; animation: blink 1.4s step-end infinite; color: var(--amber); }
    .status-badge.done { color: rgba(100,230,100,0.85); }
    .status-badge.done::before { content: '■'; color: rgba(100,230,100,0.85); }
    .case-card h3 { font-size: 0.92rem; font-weight: 700; color: var(--ink); margin-bottom: 8px; line-height: 1.2; }
    .case-card p { font-size: 0.63rem; color: var(--ink-dim); line-height: 1.72; margin-bottom: 14px; }
    .case-items-label { font-size: 0.5rem; letter-spacing: 0.15em; text-transform: uppercase; color: var(--amber-dim); margin-bottom: 6px; }
    .case-items { list-style: none; }
    .case-items li { font-size: 0.6rem; color: var(--ink-dim); padding: 4px 0; border-top: 1px solid rgba(240,192,48,0.07); display: flex; gap: 8px; }
    .case-items li::before { content: '>'; color: var(--amber); flex-shrink: 0; }

    /* Audit CTA */
    .audit-box { border: 1px solid var(--amber); position: relative; }
    .audit-box-label { position: absolute; top: -9px; left: 16px; background: var(--bg); padding: 0 8px; font-size: 0.52rem; letter-spacing: 0.16em; color: var(--amber); text-transform: uppercase; }
    .audit-inner { padding: 28px; display: grid; grid-template-columns: 1fr auto; gap: 28px; align-items: center; }
    .audit-inner h2 { font-size: 1.2rem; font-weight: 700; line-height: 1.15; margin-bottom: 8px; }
    .audit-inner h2 em { font-style: normal; color: var(--amber); }
    .audit-desc { font-size: 0.65rem; color: var(--ink-dim); line-height: 1.78; margin-bottom: 16px; }
    .chips { display: flex; flex-wrap: wrap; gap: 5px; }
    .chip { font-size: 0.55rem; letter-spacing: 0.07em; color: var(--ink-faint); border: 1px solid rgba(240,192,48,0.12); padding: 3px 10px; }
    .price-block { text-align: center; flex-shrink: 0; }
    .price { font-size: 2.2rem; font-weight: 700; color: var(--amber); text-shadow: 0 0 18px rgba(240,192,48,0.38); line-height: 1; }
    .price-sub { font-size: 0.52rem; color: var(--ink-faint); letter-spacing: 0.1em; margin-bottom: 14px; display: block; }

    /* About teaser */
    .about-inner { max-width: 600px; }
    .about-inner p { font-size: 0.7rem; color: var(--ink-dim); line-height: 1.85; margin-bottom: 12px; }
    .about-inner p:last-of-type { margin-bottom: 0; }

    @media (max-width: 640px) {
      .case-grid { grid-template-columns: 1fr; }
      .audit-inner { grid-template-columns: 1fr; }
    }
  </style>

  <!-- Hero -->
  <div class="hero">
    <div class="box">
      <span class="box-label">INIT //</span>
      <div class="hero-inner">
        <p class="sys-line">Software Engineer &middot; AI Systems Builder</p>
        <h1>Building businesses<br/>that <em>run on AI.</em></h1>
        <p class="hero-desc">
          Nine years writing code. Backends, frontends, banking infrastructure.<br/>
          Now building AI-operated businesses &mdash; live, in public, start to finish.<br/>
          Come build with us.
        </p>
        <a class="btn" href="/ai-audit">Book an AI Audit &mdash; $500</a>
        <span class="hero-note">30-min session &middot; live automation build &middot; one-page report</span>
      </div>
      <span class="vhs-stamp">CH:01 &nbsp;&#9654; PLAY</span>
    </div>
  </div>

  <!-- What We Build -->
  <div class="section">
    <p class="sec-label">SYSTEM LOG // WHAT WE BUILD</p>
    <h2>Real businesses. Real AI. In public.</h2>
    <p class="section-sub">
      We build AI-operated businesses from scratch and document everything &mdash; the systems,
      the failures, the setups that actually work. Tutorials and demos included.
      The difference is these systems have to pay rent.
    </p>
    <div class="tags">
      <span class="tag">AI Agent Pipelines</span>
      <span class="tag">Content Distribution</span>
      <span class="tag">Short-Term Rental Ops</span>
      <span class="tag">Workflow Automation</span>
      <span class="tag">AI Audits</span>
    </div>
  </div>

  <!-- Case Studies -->
  <div class="section">
    <p class="sec-label">CASE STUDIES // LIVE BUILDS</p>
    <h2>Currently in the lab.</h2>
    <p class="section-sub">Real systems. Real businesses. Not finished &mdash; but running.</p>
    <div class="case-grid">
      <div class="case-card">
        <span class="status-badge live">IN PROGRESS</span>
        <h3>AI-Operated<br/>Airbnb Business</h3>
        <p>A short-term rental with no manual management per turnover. Guest comms, cleaner coordination, pricing, reviews &mdash; all handled by agents built and wired together from scratch.</p>
        <p class="case-items-label">WHAT'S BEING BUILT</p>
        <ul class="case-items">
          <li>Guest messaging agent &mdash; check-in, checkout, FAQs</li>
          <li>Cleaner hiring + scheduling via Upwork</li>
          <li>Pricing pipeline that adjusts to demand</li>
          <li>Review responses written + posted automatically</li>
        </ul>
      </div>
      <div class="case-card">
        <span class="status-badge done">LIVE SYSTEM</span>
        <h3>Content Distribution<br/>System</h3>
        <p>52 AI skills. One topic goes in. Pain points pulled from Reddit and X, scripts written against proven hook frameworks, lead magnets generated, everything tracked in Notion. Research to post-production. One system.</p>
        <p class="case-items-label">HOW IT RUNS</p>
        <ul class="case-items">
          <li>Pain point research &mdash; Reddit, X, web (last 30 days)</li>
          <li>Scripts with 3 hook variations + outlier scoring</li>
          <li>PDF lead magnets from high-performing scripts</li>
          <li>Notion pipeline: Ideas &rarr; Filming &rarr; Editing &rarr; Posted</li>
          <li>3x median views &rarr; auto-saved to Inspiration Library</li>
          <li>Blog, carousel, and repurposed format output</li>
        </ul>
      </div>
    </div>
  </div>

  <!-- AI Audit CTA -->
  <div class="section">
    <div class="audit-box">
      <span class="audit-box-label">// AI AUDIT</span>
      <div class="audit-inner">
        <div>
          <h2>One session.<br/>Your whole workflow, <em>automated.</em></h2>
          <p class="audit-desc">
            We map your operations, build a live automation on the call, and hand you a
            one-page report before we hang up. Thirty minutes. No technical background required.
          </p>
          <div class="chips">
            <span class="chip">30-MIN ZOOM</span>
            <span class="chip">LIVE BUILD</span>
            <span class="chip">AUDIT REPORT PDF</span>
            <span class="chip">3 NEXT STEPS</span>
          </div>
        </div>
        <div class="price-block">
          <div class="price">$500</div>
          <span class="price-sub">FOUNDING RATE</span>
          <a class="btn" href="/ai-audit">Book Now &rarr;</a>
        </div>
      </div>
    </div>
  </div>

  <!-- About Teaser -->
  <div class="section">
    <p class="sec-label">// ABOUT</p>
    <div class="about-inner">
      <p>Born in Ghana. Moved to the US for college. Spent close to a decade building software &mdash; JavaScript, TypeScript, backend systems, banking platforms.</p>
      <p>Then got serious about what AI could actually do in production. Not prototypes. Real systems, running real businesses. Started building two of them &mdash; and documenting the whole thing publicly.</p>
      <p>Steve Jobs didn&apos;t just make the thing &mdash; he made people understand why it mattered. That&apos;s the idea here. We build, we share, we figure it out together.</p>
      <div class="socials">
        <a class="social" href="https://x.com/nelsonkwesix">X: @nelsonkwesix</a>
        <a class="social" href="https://youtube.com/@nelsonkwesi" target="_blank" rel="noopener">YouTube: Nelson Kwesi</a>
        <a class="social" href="https://instagram.com/nelsonkwesi.xyz" target="_blank" rel="noopener">@nelsonkwesi.xyz</a>
      </div>
    </div>
  </div>
</SiteLayout>
```

- [ ] **Step 2: Check homepage in browser**

Visit `http://localhost:4321` — verify:
- CRT scanlines visible
- Boot bar shows at top
- Nav has 4 links, Home is active/amber
- Hero box with `INIT //` label
- Case studies grid (2-col desktop, 1-col mobile at 640px)
- Audit CTA box with full amber border
- About teaser with social links
- Footer present

- [ ] **Step 3: Check mobile**

Resize browser to 375px wide. Verify:
- Case grid stacks to 1 column
- Audit CTA stacks to 1 column
- Nav shows MENU button, links toggle on click
- No horizontal overflow

- [ ] **Step 4: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: rebuild homepage with case studies and AI audit CTA"
```

---

## Task 4: Create /about page

**Files:**
- Create: `src/pages/about.astro`

- [ ] **Step 1: Create about.astro**

```astro
---
import SiteLayout from '../layouts/SiteLayout.astro';
---

<SiteLayout
  title="About — nelsonkwesi.xyz"
  description="Software engineer. AI systems builder. Born in Ghana. Building in public."
  activeNav="about"
>
  <style>
    .about-hero { padding: 52px 0 44px; border-bottom: 1px solid var(--border); }
    .about-inner { padding: 28px; }
    .sys-line {
      font-size: 0.58rem; color: var(--amber-dim); letter-spacing: 0.14em;
      text-transform: uppercase; margin-bottom: 20px;
      display: flex; align-items: center; gap: 10px;
    }
    .sys-line::before { content: '>'; color: var(--amber); }
    .about-hero h1 {
      font-size: clamp(1.6rem, 4vw, 2.6rem); font-weight: 700; line-height: 1.08;
      color: var(--ink); margin-bottom: 28px;
      text-shadow: 0 0 24px rgba(240,192,48,0.1);
    }
    .about-hero h1 em { font-style: normal; color: var(--amber); }

    .about-body { max-width: 620px; }
    .about-body p { font-size: 0.72rem; color: var(--ink-dim); line-height: 1.88; margin-bottom: 18px; }
    .about-body p:last-of-type { margin-bottom: 0; }

    .stack-section { padding: 36px 0; border-bottom: 1px solid var(--border); }
    .stack-grid { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 16px; }
    .stack-item { font-size: 0.58rem; letter-spacing: 0.08em; color: var(--ink-dim); border: 1px solid var(--border); padding: 5px 12px; }
  </style>

  <div class="about-hero">
    <div class="box">
      <span class="box-label">// ABOUT</span>
      <div class="about-inner">
        <p class="sys-line">Nelson Kwesi &mdash; Software Engineer &middot; AI Systems Builder</p>
        <h1>Building systems<br/>that <em>mean something.</em></h1>
        <div class="about-body">
          <p>Born in Ghana. Moved to the US for college. Spent close to a decade building software &mdash; JavaScript, TypeScript, backend systems, banking platforms.</p>
          <p>Then got serious about what AI could actually do in production. Not prototypes. Not proof-of-concepts. Real systems, running real businesses. Started building two of them &mdash; and documenting the whole thing publicly.</p>
          <p>Steve Jobs didn&apos;t just make the thing &mdash; he made people understand why it mattered. That&apos;s the idea here. We build, we share, we figure it out together.</p>
        </div>
        <div class="socials" style="margin-top:28px;">
          <a class="social" href="https://x.com/nelsonkwesix" target="_blank" rel="noopener">X: @nelsonkwesix</a>
          <a class="social" href="https://youtube.com/@nelsonkwesi" target="_blank" rel="noopener">YouTube: Nelson Kwesi</a>
          <a class="social" href="https://instagram.com/nelsonkwesi.xyz" target="_blank" rel="noopener">@nelsonkwesi.xyz</a>
        </div>
      </div>
    </div>
  </div>

  <div class="stack-section">
    <p class="sec-label">TECH STACK</p>
    <h2>What gets used to build.</h2>
    <div class="stack-grid">
      <span class="stack-item">JavaScript</span>
      <span class="stack-item">TypeScript</span>
      <span class="stack-item">Node.js</span>
      <span class="stack-item">React</span>
      <span class="stack-item">Astro</span>
      <span class="stack-item">Claude API</span>
      <span class="stack-item">Notion API</span>
      <span class="stack-item">Upwork API</span>
    </div>
  </div>
</SiteLayout>
```

- [ ] **Step 2: Check /about in browser**

Visit `http://localhost:4321/about` — verify:
- About nav link is amber/active
- Box border with `// ABOUT` label
- All 3 paragraphs render correctly
- Social links present and styled
- Tech stack tags render

- [ ] **Step 3: Commit**

```bash
git add src/pages/about.astro
git commit -m "feat: add /about page"
```

---

## Task 5: Rebuild /ai-audit page

**Files:**
- Modify: `src/pages/ai-audit.astro`

Rebuild the existing white/green page to match the CRT design system. Keep all content and Calendly embed.

- [ ] **Step 1: Replace ai-audit.astro entirely**

```astro
---
import SiteLayout from '../layouts/SiteLayout.astro';
---

<SiteLayout
  title="Book an AI Audit — nelsonkwesi.xyz"
  description="I map your workflow, build a live automation on the call, and hand you a one-page report. Thirty minutes. $500."
  activeNav="ai-audit"
>
  <style>
    /* Hero */
    .audit-hero { padding: 52px 0 44px; border-bottom: 1px solid var(--border); }
    .audit-hero-inner { padding: 28px; }
    .sys-line { font-size: 0.58rem; color: var(--amber-dim); letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
    .sys-line::before { content: '>'; color: var(--amber); }
    .strip { display: flex; align-items: center; flex-wrap: wrap; gap: 0; margin-bottom: 32px; border: 1px solid var(--border); }
    .strip-item { font-size: 0.6rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink-dim); padding: 10px 16px; border-right: 1px solid var(--border); }
    .strip-item:last-child { border-right: none; }
    .strip-item.hi { color: var(--amber); }
    .audit-hero h1 { font-size: clamp(2rem, 5vw, 3.8rem); font-weight: 700; line-height: 0.96; letter-spacing: -0.02em; margin-bottom: 36px; text-shadow: 0 0 28px rgba(240,192,48,0.1); }
    .audit-hero h1 em { font-style: italic; color: var(--amber); }
    .hero-grid { display: grid; grid-template-columns: 1fr auto; gap: 36px; align-items: end; }
    .hero-desc { font-size: 0.72rem; color: var(--ink-dim); line-height: 1.82; max-width: 460px; }
    .hero-action { display: flex; flex-direction: column; align-items: flex-start; gap: 10px; flex-shrink: 0; }
    .hero-note { font-size: 0.58rem; color: var(--ink-faint); letter-spacing: 0.04em; }

    /* Deliverables */
    .deliverable { display: grid; grid-template-columns: 52px 1fr; gap: 0 20px; padding: 28px 0; border-top: 1px solid var(--border); }
    .deliverable:last-child { border-bottom: 1px solid var(--border); }
    .del-num { font-size: 0.52rem; letter-spacing: 0.1em; color: var(--amber); padding-top: 3px; }
    .del-title { font-size: 0.95rem; font-weight: 700; margin-bottom: 7px; }
    .del-desc { font-size: 0.68rem; color: var(--ink-dim); line-height: 1.75; }

    /* Who it's for */
    .biz-grid { display: flex; flex-wrap: wrap; gap: 0; margin-top: 20px; }
    .biz-tag { font-size: 0.65rem; letter-spacing: 0.04em; color: var(--ink-dim); border: 1px solid var(--border); padding: 9px 16px; margin: -1px 0 0 -1px; transition: background 0.15s, color 0.15s; }
    .biz-tag:hover { background: var(--amber); color: var(--bg); border-color: var(--amber); }
    .for-note { font-size: 0.65rem; color: var(--amber); margin-top: 24px; letter-spacing: 0.03em; }

    /* Stats */
    .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); background: var(--border); gap: 1px; margin-top: 20px; max-width: 680px; }
    .stat-cell { background: var(--bg); padding: 32px 28px; }
    .stat-num { font-size: clamp(2rem, 4vw, 3rem); font-weight: 700; color: var(--amber); text-shadow: 0 0 16px rgba(240,192,48,0.35); line-height: 1; margin-bottom: 8px; }
    .stat-label { font-size: 0.65rem; color: var(--ink-dim); line-height: 1.55; }

    /* Pricing */
    .pricing-grid { display: grid; grid-template-columns: 1fr 360px; gap: 52px; align-items: start; }
    .pricing-note { font-size: 0.72rem; color: var(--ink-dim); line-height: 1.75; margin-top: 12px; }
    .pricing-card { border: 1px solid var(--amber); padding: 36px; }
    .price-label { font-size: 0.52rem; letter-spacing: 0.18em; text-transform: uppercase; color: var(--amber); margin-bottom: 12px; }
    .price-amount { font-size: 3.4rem; font-weight: 700; color: var(--amber); text-shadow: 0 0 20px rgba(240,192,48,0.4); line-height: 1; margin-bottom: 4px; }
    .price-meta { font-size: 0.6rem; color: var(--ink-faint); letter-spacing: 0.04em; margin-bottom: 28px; }
    .price-list { list-style: none; margin-bottom: 28px; }
    .price-item { display: flex; gap: 10px; padding: 9px 0; border-top: 1px solid rgba(240,192,48,0.1); font-size: 0.7rem; color: var(--ink-dim); line-height: 1.5; }
    .price-item::before { content: '+'; color: var(--amber); font-weight: 700; flex-shrink: 0; }
    .price-footnote { font-size: 0.58rem; color: var(--ink-faint); margin-top: 10px; text-align: center; }

    /* Calendly */
    .calendly-wrap { border: 1px solid var(--border); overflow: hidden; max-width: 680px; }
    .calendly-inline-widget { min-width: 320px; height: 700px; }
    .book-contact { font-size: 0.65rem; color: var(--ink-dim); margin-top: 20px; }
    .book-contact a { color: var(--amber); text-decoration: none; font-weight: 700; }
    .book-contact a:hover { text-decoration: underline; }

    @media (max-width: 640px) {
      .hero-grid { grid-template-columns: 1fr; }
      .deliverable { grid-template-columns: 1fr; }
      .del-num { margin-bottom: 4px; }
      .stats-grid { grid-template-columns: 1fr; }
      .pricing-grid { grid-template-columns: 1fr; }
      .strip { overflow-x: auto; }
    }
  </style>

  <!-- Hero -->
  <div class="audit-hero">
    <div class="box">
      <span class="box-label">// AI AUDIT</span>
      <div class="audit-hero-inner">
        <div class="strip">
          <span class="strip-item">AI Audit</span>
          <span class="strip-item">Done-For-You</span>
          <span class="strip-item hi">$500 Founding Rate</span>
          <span class="strip-item">First 5 Clients</span>
        </div>
        <h1>Your Business.<br/><em>Automated.</em><br/>In One Session.</h1>
        <div class="hero-grid">
          <p class="hero-desc">
            We map your workflow, build a live AI automation on the spot, and deliver
            a one-page report showing exactly what it saves you &mdash; time, money, and headaches.
            Done in 30 minutes. No tech skills needed.
          </p>
          <div class="hero-action">
            <a href="#book" class="btn">Book your AI Audit &mdash; $500</a>
            <span class="hero-note">Price increases to $1,000 after 5 clients</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- What You Get -->
  <div class="section">
    <p class="sec-label">WHAT YOU GET</p>
    <h2>Everything in one 30-minute session.</h2>
    <p class="section-sub">No follow-up calls. No waiting. No surprises.</p>
    <div>
      {[
        { num: "01", title: "Workflow Mapping", desc: "We find the one task your team does every day that's eating your time. Booking confirmations, client emails, quote follow-ups — whatever's most painful." },
        { num: "02", title: "Live Automation Build", desc: "We build the automation while you watch — using tools you already use. You see it work in real time before the call ends." },
        { num: "03", title: "AI Audit Report", desc: "A one-page PDF: what was built, how many hours per week it saves, the dollar value of that time, and 3 more automations you could add next." },
        { num: "04", title: "Expansion Roadmap", desc: "A clear picture of what else is possible — so you know exactly what your next step looks like if you want to keep going." },
      ].map(({ num, title, desc }) => (
        <div class="deliverable">
          <span class="del-num">{num}</span>
          <div>
            <h3 class="del-title">{title}</h3>
            <p class="del-desc">{desc}</p>
          </div>
        </div>
      ))}
    </div>
  </div>

  <!-- Who It's For -->
  <div class="section">
    <p class="sec-label">WHO THIS IS FOR</p>
    <h2>You don&apos;t need to know anything about AI.</h2>
    <p class="section-sub">You just need a business that does repetitive work.</p>
    <div class="biz-grid">
      {["Hair & beauty salons","Real estate agents","Law offices","Dental & medical clinics","Restaurants & cafes","Contractors & tradespeople","Fitness studios","Property managers"].map((biz) => (
        <span class="biz-tag">{biz}</span>
      ))}
    </div>
    <p class="for-note">If your team does the same tasks every day, there&apos;s something to automate.</p>
  </div>

  <!-- Stats -->
  <div class="section">
    <p class="sec-label">THE NUMBERS</p>
    <h2>What one automation actually looks like.</h2>
    <p class="section-sub">Based on the Bella&apos;s Beauty Studio audit &mdash; results vary by business.</p>
    <div class="stats-grid">
      {[
        { stat: "6 hrs",  label: "Average time saved per week from one automation" },
        { stat: "$480",   label: "Monthly labor value recovered at $20/hr" },
        { stat: "15 min", label: "Customer response time vs 2–4 hours before" },
        { stat: "30 min", label: "That's all the session takes" },
      ].map(({ stat, label }) => (
        <div class="stat-cell">
          <div class="stat-num">{stat}</div>
          <div class="stat-label">{label}</div>
        </div>
      ))}
    </div>
  </div>

  <!-- Pricing -->
  <div class="section">
    <p class="sec-label">PRICING</p>
    <div class="pricing-grid">
      <div>
        <h2>No retainer.<br/>No surprise fees.</h2>
        <p class="pricing-note">
          One session, one price. You see the automation working before the call ends &mdash;
          or we don&apos;t stop until it does.
        </p>
      </div>
      <div class="pricing-card">
        <p class="price-label">AI Audit &mdash; Founding Rate</p>
        <div class="price-amount">$500</div>
        <p class="price-meta">flat fee &nbsp;&middot;&nbsp; first 5 clients only</p>
        <ul class="price-list">
          {[
            "30-minute session via Zoom",
            "Live automation built while you watch",
            "One-page AI Audit Report PDF",
            "3 expansion automation ideas",
            "Retainer proposal if you want to keep going",
          ].map((item) => (
            <li class="price-item">{item}</li>
          ))}
        </ul>
        <a href="#book" class="btn" style="display:block;text-align:center;">Book Now &mdash; $500</a>
        <p class="price-footnote">Price increases to $1,000 after 5 clients.</p>
      </div>
    </div>
  </div>

  <!-- Book -->
  <div id="book" class="section">
    <p class="sec-label">BOOK</p>
    <h2>Ready to book?</h2>
    <p class="section-sub">Pick a time that works for you. 30 minutes, live automation, done.</p>
    <div class="calendly-wrap">
      <div
        class="calendly-inline-widget"
        data-url="https://calendly.com/nelson-kwesiholdings/ai-audit"
        style="min-width:320px;height:700px;"
      ></div>
      <script type="text/javascript" src="https://assets.calendly.com/assets/external/widget.js" async></script>
    </div>
    <p class="book-contact" style="margin-top:20px;">
      Questions first? DM on
      <a href="https://x.com/nelsonkwesix">X (@nelsonkwesix)</a>
      or
      <a href="https://instagram.com/nelsonkwesi.xyz">Instagram</a>.
    </p>
  </div>
</SiteLayout>
```

- [ ] **Step 2: Check /ai-audit in browser**

Visit `http://localhost:4321/ai-audit` — verify:
- CRT theme applied (no white background)
- Strip bar renders at top of hero
- All 4 deliverable rows render
- Stats grid is 2-col desktop, 1-col mobile
- Pricing card has amber border
- Calendly widget loads
- AI Audit nav link is active/amber

- [ ] **Step 3: Check mobile at 375px**

Verify hero grid stacks, pricing grid stacks, no horizontal overflow.

- [ ] **Step 4: Commit**

```bash
git add src/pages/ai-audit.astro
git commit -m "feat: rebuild ai-audit page with CRT design system"
```

---

## Task 6: Final check — all routes and nav links

- [ ] **Step 1: Verify all routes load without errors**

Visit each:
- `http://localhost:4321/` — homepage
- `http://localhost:4321/free-resources` — resources list
- `http://localhost:4321/ai-audit` — audit page
- `http://localhost:4321/about` — about page
- `http://localhost:4321/claude-code-setup-guide` (any resource) — still works

- [ ] **Step 2: Verify nav active state on each page**

On each page, confirm the correct nav link is amber. Check that clicking all nav links navigates correctly.

- [ ] **Step 3: Verify old `/` redirect is not needed**

The old homepage content is now at `/free-resources`. If any resource pages or the ai-audit page linked back to `/` expecting resources, update those links. Check:

```bash
grep -r 'href="/"' /Users/nelsonkwesi/ai-content-system/lead-pages/src/
```

If any non-brand links point to `/` expecting the resources list, update them to `/free-resources`.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: final link audit and nav verification"
```

---

## Self-Review Notes

- All 4 pages use `SiteLayout` — DRY on CSS/boot bar/nav/footer ✓
- `@thenelsonkwesi` does not appear in any file ✓
- Mobile responsive breakpoints defined for all grids ✓
- Calendly embed kept exactly as original ✓
- Resource collection and `[resource].astro` untouched ✓
- `activeNav` prop correctly passed on all 4 pages ✓
- No TypeScript types to drift — Astro props interface only in SiteLayout ✓
