# HTML & CSS Style Guide — cb.fuj.io Website

This guide covers the **public website** hosted at https://cb.fuj.io —
i.e. the static HTML pages at the **repo root** and under `/en/`. These are
served by Cloudflare Pages with **no build step**: every page is plain HTML
that opens correctly when double-clicked locally.

If you are styling the Flask app's analyzer UI (`/app/index.html`), see
[`HTML_APP.md`](./HTML_APP.md) instead.

---

## 1. Scope

### In scope (this guide)

| Path | Purpose |
|---|---|
| [`/index.html`](../../index.html) | Marketing landing page for cb.fuj.io |
| [`/getting_started.html`](../../getting_started.html) | Install / onboarding guide |
| [`/user_guide.html`](../../user_guide.html) | Feature documentation |
| [`/analysis_hub.html`](../../analysis_hub.html) | Analysis pattern catalog |
| [`/sql_queries.html`](../../sql_queries.html) | SQL++ recipe reference |
| [`/404.html`](../../404.html) | Custom 404 (Liquid Snake easter egg) |
| [`/en/index.html`](../../en/index.html) | **Static Edition** v3.29.x — single-file analyzer hosted on Cloudflare Pages |

### Out of scope

- `app/index.html` — see [`HTML_APP.md`](./HTML_APP.md).
- Any file under `app/assets/` — see [`HTML_APP.md`](./HTML_APP.md).
- Files under `old_pre_4_0/` — frozen, do not edit.

---

## 2. File Structure

```
/                                  ← repo root = website root
├── index.html                     ← landing page
├── 404.html                       ← custom 404
├── getting_started.html           ← onboarding
├── getting_started.md             ← canonical text source (keep in sync with .html)
├── user_guide.html                ← features
├── analysis_hub.html              ← analysis catalog
├── sql_queries.html               ← SQL recipes
├── _headers                       ← Cloudflare Pages headers
├── _redirects                     ← Cloudflare Pages redirects
├── assets/
│   ├── css/main.css               ← shared website stylesheet
│   ├── img/                       ← logos, screenshots, favicons
│   └── js/                        ← shared website JS (none required for static pages)
└── en/
    └── index.html                 ← Static Edition analyzer (v3.x, self-contained)
```

### Rules

- **One HTML file per page.** No SPA, no client-side router, no build step.
- The shared stylesheet is [`/assets/css/main.css`](../../assets/css/main.css).
  Page-wide rules live there.
- **Page-specific styles** belong in an inline `<style>` block in the `<head>`.
  This is intentional — it keeps each page self-contained and easy to ship as
  a Cloudflare Pages static asset.
- **Images** go in [`/assets/img/`](../../assets/img/). Use SVG for logos and
  icons, PNG/WebP for screenshots.

---

## 3. Mandatory `<head>` Boilerplate

Every website page must include the following in this order:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="version" content="x.x.x" />
    <meta name="last-updated" content="YYYY-MM-DD" />
    <title>Page Title — Couchbase Query Analyzer vx.x.x</title>
    <meta name="description" content="One-sentence summary that shows up in Google.">
    <meta name="keywords" content="comma, separated, terms">
    <link rel="canonical" href="https://cb.fuj.io/path">

    <!-- Open Graph / social cards -->
    <meta property="og:title"       content="…">
    <meta property="og:description" content="…">
    <meta property="og:url"         content="https://cb.fuj.io/path">
    <meta property="og:type"        content="website">
    <meta name="twitter:card"       content="summary_large_image">

    <!-- Favicon (SVG preferred) -->
    <link rel="icon" type="image/svg+xml" href="assets/img/favicon.svg">

    <!-- Shared stylesheet -->
    <link rel="stylesheet" href="assets/css/main.css">

    <!-- Page-specific styles -->
    <style>
        /* Page-specific styles for <page>.html */
        ...
    </style>
</head>
```

The `version` meta and the title's `vx.x.x` suffix are bumped by every release
(see [`RELEASE.md §2`](./RELEASE.md#2-bump-version-strings)).

---

## 4. Style Conventions

### Colors

The site uses a fixed light-mode palette. Stick to these CSS variables /
hex values:

| Use | Value | Notes |
|---|---|---|
| Primary brand blue | `#007acc` | Headings, accents, links |
| Highlight orange | `#ff8c00` | "New" version callouts only |
| Body background | `#fff` | |
| Page background tint | `#f5f7fa` | Sections / cards |
| Body text | `#1a1a1a` | |
| Muted text | `#666` | Captions, helper text |
| Success green | `#28a745` | Big CTA buttons |
| Border / divider | `rgba(0,0,0,0.08)` | |

There is **no dark mode** for the public website (the Flask app may have its
own, see [`HTML_APP.md`](./HTML_APP.md)). Don't add `prefers-color-scheme`
rules without team discussion.

### Typography

- Use the system font stack (defined in [`main.css`](../../assets/css/main.css)
  as `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, ...`). Do not
  load Google Fonts on these pages — it slows first paint.
- Code / monospace: `'SFMono-Regular', Consolas, 'Liberation Mono', Menlo,
  monospace`.
- Sizes are written in `em` or `px` — **be consistent within a page**, not
  necessarily across pages.

### Layout

- Pages are **single-column**, max-width \~1200 px, centered.
- Use semantic HTML (`<header>`, `<main>`, `<section>`, `<aside>`,
  `<footer>`) wherever it fits.
- The "progress sidebar" pattern in [`getting_started.html`](../../getting_started.html)
  is an `<aside class="progress-sidebar">` next to a `<main class="content">`,
  both inside `<div class="layout">`. Reuse this pattern when a page has more
  than \~3 numbered steps.

### Buttons & CTAs

```html
<a href="..." class="btn-primary">→ Try it now</a>
```

Inline-styled CTAs (used on landing pages) follow the green-pill pattern:

```html
<a href="https://cb.fuj.io/en/" target="_blank"
   style="font-size:1.2em; font-weight:600; background:#28a745; color:white;
          padding:10px 20px; border-radius:6px; text-decoration:none;
          display:inline-block">→ Open cb.fuj.io/en/</a>
```

Inline styles are acceptable on these marketing pages — keep the page
self-contained and easy to copy/paste.

### Callouts

```html
<div class="callout"
     style="background:#e8f4fd; border-left:4px solid #007acc;
            padding:10px 14px; margin:0 0 14px; border-radius:4px;
            font-size:0.92em">
    <strong>📦 Heading.</strong> Body text.
</div>
```

Use the blue callout for informational notes, an orange one (`#fff5e6` /
`#ff8c00`) for "new in this version", a yellow one (`#fffbe6` / `#ffd24d`)
for warnings.

### Tables

Use plain `<table>`. The shared stylesheet handles zebra rows and borders.
For comparison tables (e.g., Static vs Server Edition), keep columns to ≤ 5.

---

## 5. Emoji Usage

Unlike Apollo's style guide, **emoji are encouraged here** — they are part of
the cb.fuj.io brand voice. Use them in:

- Section headers (`## 🎉 Ready to Analyze!`)
- Tab labels (`🐳 Docker`, `🍎 macOS`, `🪟 Windows`, `🌐 Browser Only`)
- Callout headings (`📦 No external database setup required.`)
- The Liquid Snake easter egg in [`404.html`](../../404.html) and inline
  HTML comments (`<!-- 🐍 "Not yet, Snake! It's not over yet!" -->`)

**Don't** use emoji in:

- `<title>` tags (hurts SEO + breaks tabs in some browsers)
- `<meta name="description">` and `<meta name="keywords">`
- Filenames or URLs

For flag / language icons, prefer the SVGs in `assets/img/` over Unicode flag
emoji (Windows ships no flag glyphs).

---

## 6. Images

| Asset type | Format | Where |
|---|---|---|
| Logos (Couchbase, AI providers) | SVG | [`/assets/img/`](../../assets/img/) |
| Favicons | SVG (with `.ico` fallback for legacy browsers) | [`/assets/img/`](../../assets/img/) |
| Screenshots | WebP (PNG fallback) | [`/assets/img/`](../../assets/img/) |
| Diagrams | SVG | [`/assets/img/`](../../assets/img/) |
| Photos / hero shots | WebP | [`/assets/img/`](../../assets/img/) |

- **Always include `alt=""` text.** For decorative images, `alt=""` is
  acceptable.
- Specify `width` and `height` (or aspect-ratio CSS) to avoid layout shift.
- Lazy-load below-the-fold images: `loading="lazy"`.

---

## 7. Links

- **Internal links**: relative paths (`href="user_guide.html"`,
  `href="en/index.html"`). Do not hardcode `https://cb.fuj.io/...` for same-site
  links — it breaks local preview.
- **External links**: always include `target="_blank"
  rel="noopener noreferrer"`.
- **GitHub link**: every page should link back to the repo
  (`https://github.com/Fujio-Turner/cb_completed_request`). The
  `.floating-github` widget in the footer/corner is the standard placement.

---

## 8. Cloudflare Pages Constraints

The website is hosted on Cloudflare Pages. Keep these in mind:

- **Static only.** No server-side execution. If you need a backend, it lives
  in `/app/` (which is **not** deployed to Cloudflare — see
  [`AGENT.md` Cloudflare Restrictions](../../AGENT.md)).
- **`_headers`** controls cache + CSP headers per path
  ([`/_headers`](../../_headers)).
- **`_redirects`** controls 301/302 redirects and the SPA-style 404 fallback
  ([`/_redirects`](../../_redirects)).
- **Block list**: `/app/*`, `/tests/*`, `/playwright/*`, `/node_modules/*`,
  `/python/*`, `/*.config.js`, `/package*.json` are not served. Don't link
  to them from public pages.

---

## 9. The Static Edition (`/en/index.html`)

The Static Edition is a **single self-contained HTML file** (~1.3 MB) that
embeds all CSS, JS, jQuery, Chart.js, and analyzer logic inline. It is its
own beast and follows different rules:

- **Edit in place.** No build step, no module imports.
- **Inline everything.** External `<script src>` is allowed only for libraries
  that must be loaded from a CDN (rare).
- **Version is independent** — Static Edition cadence (currently 3.29.x) is
  decoupled from Server Edition (4.0.0-Beta). See
  [`AGENT.md`](../../AGENT.md) "Current Versions" table.
- The Static Edition and the Server Edition share many feature ideas but
  **do not share code**. Don't try to refactor `/en/index.html` to import from
  `/app/assets/`.

For Static Edition release process, see
[`settings/RELEASE_GUIDE.md`](../../settings/RELEASE_GUIDE.md).

---

## 10. Localized Pages

Translated pages (formerly `/de/`, `/es/`, `/pt/`) have been moved to
[`old_pre_4_0/`](../../old_pre_4_0/) and are no longer maintained. If you
intend to ship a translated public page in v4.x, follow
[`settings/LOCALIZATION_GUIDE.md`](../../settings/LOCALIZATION_GUIDE.md) and
mirror the English page structure exactly.

---

## 11. SEO Checklist (per page)

Before merging a new or substantially-changed website page:

- [ ] `<title>` is unique across the site, ≤ 60 chars
- [ ] `<meta name="description">` is set, 120–160 chars, no emoji
- [ ] `<link rel="canonical">` matches the production URL
- [ ] `og:title`, `og:description`, `og:url`, `og:type`, `twitter:card` are
      filled in
- [ ] At least one `<h1>` per page; `<h2>`/`<h3>` form a logical outline
- [ ] All images have `alt` text
- [ ] All external links have `rel="noopener noreferrer"`
- [ ] Page renders without console errors when opened locally
      (`open index.html` / `start index.html`)

---

## 12. Don'ts

| Don't | Do instead |
|-------|------------|
| Add a build step (Webpack, Vite, etc.) | Keep pages as plain HTML; it's a feature |
| Load Google Fonts | Use the system font stack |
| Inline `<script>` blocks for behavior | Extract to `assets/js/<page>.js` if more than \~20 lines |
| Hardcode `https://cb.fuj.io/...` for same-site links | Use relative paths |
| Use emoji in `<title>` or `<meta description>` | Use plain text — emoji break SEO snippets |
| Add a CDN dependency for one tiny utility | Vendor it into `assets/js/` instead |
| Create a SPA / client-side router | Multi-page is the architecture |
| Edit files under `old_pre_4_0/` | They are frozen; create new files in `/` |
| Reference `/app/*` paths from public pages | They are blocked by Cloudflare |
| Forget to bump `<meta name="version">` in a release | See [`RELEASE.md §2`](./RELEASE.md#2-bump-version-strings) |
