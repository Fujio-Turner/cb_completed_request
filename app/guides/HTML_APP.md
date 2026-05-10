# HTML & CSS Style Guide — Flask App (`/app/index.html`)

This guide covers the **Server Edition** analyzer UI: the single
[`app/index.html`](../index.html) page served by the Flask app
([`app/app.py`](../app.py)) plus its assets under
[`app/assets/`](../assets/).

If you are styling a public marketing / docs page on cb.fuj.io, see
[`HTML_WEBSITE.md`](./HTML_WEBSITE.md) instead.

---

## 1. Scope

### In scope (this guide)

| Path | Purpose |
|---|---|
| [`app/index.html`](../index.html) | The full analyzer UI — tabs, charts, modals, AI panel, settings. Single \~2,650-line file. |
| [`app/assets/css/main.css`](../assets/css/main.css) | Shared analyzer stylesheet |
| [`app/assets/js/`](../assets/js/) | All analyzer JavaScript modules |
| [`app/assets/img/`](../assets/img/) | Icons, logos, screenshots used by the app |

### Out of scope

- Public website pages at the repo root — see
  [`HTML_WEBSITE.md`](./HTML_WEBSITE.md).
- The Static Edition at `/en/index.html` — also covered by
  [`HTML_WEBSITE.md`](./HTML_WEBSITE.md).

---

## 2. The Stack (no build step)

The app is intentionally **plain HTML + jQuery + vendored libraries**. There
is no Webpack, no Vite, no Tailwind, no DaisyUI. The Flask backend serves
[`app/index.html`](../index.html) as-is and the browser loads everything
from `app/assets/`.

| Layer | Library | Where it's loaded |
|---|---|---|
| DOM / events | jQuery 3.x + jQuery UI | [`app/assets/js/jquery.min.js`](../assets/js/jquery.min.js), [`jquery-ui.min.js`](../assets/js/jquery-ui.min.js) |
| Charts | Chart.js 4 + adapters + plugins | [`app/assets/js/chart.umd.js`](../assets/js/chart.umd.js), `chartjs-*` |
| 3D charts | ECharts + ECharts-GL | [`app/assets/js/echarts.min.js`](../assets/js/echarts.min.js), [`echarts-gl.min.js`](../assets/js/echarts-gl.min.js) |
| Timeline | vis-timeline | [`app/assets/js/vis-timeline-graph2d.min.js`](../assets/js/vis-timeline-graph2d.min.js) |
| App logic (modules) | Vanilla ES6 modules | [`app/assets/js/charts.js`](../assets/js/charts.js), [`base.js`](../assets/js/base.js), [`data-layer.js`](../assets/js/data-layer.js), etc. |
| App logic (legacy) | Vanilla JS | [`app/assets/js/main-legacy-cleaned.js`](../assets/js/main-legacy-cleaned.js) |

**All libraries are vendored** into [`app/assets/js/`](../assets/js/). No CDN
loads at runtime — the app must work in air-gapped Docker / PyInstaller
deployments.

---

## 3. File Structure

```
app/
├── index.html                     ← single-page analyzer UI (~2,650 lines)
├── app.py                         ← Flask entrypoint
├── assets/
│   ├── css/
│   │   ├── main.css               ← shared analyzer styles
│   │   ├── jquery-ui.min.css      ← vendored
│   │   ├── vis-timeline-*.css     ← vendored
│   │   └── images/                ← jQuery UI sprites
│   ├── js/
│   │   ├── ai-client.js           ← AI provider abstraction
│   │   ├── ai-providers/          ← per-provider implementations
│   │   ├── base.js                ← shared utilities, Logger
│   │   ├── chart.umd.js           ← Chart.js (vendored)
│   │   ├── charts.js              ← analyzer chart definitions (ES6 module)
│   │   ├── couchbase-connector.js ← CBL health check / storage info
│   │   ├── data-layer.js          ← parse + transform completed_requests JSON
│   │   ├── echarts*.min.js        ← ECharts (vendored)
│   │   ├── flow-diagram*.js       ← index-flow Sankey
│   │   ├── insights.js            ← analysis insights
│   │   ├── jquery*.js             ← jQuery + jQuery UI (vendored)
│   │   ├── main-legacy-cleaned.js ← legacy app logic
│   │   └── vis-timeline-*.js      ← timeline (vendored)
│   └── img/                       ← logos, favicons, AI provider marks
└── guides/                        ← this folder
```

### Rules

- **Single HTML page.** All views live in [`app/index.html`](../index.html);
  tabs are toggled with `display:none`, not separate URLs.
- **New JS goes into ES6 modules** under [`app/assets/js/`](../assets/js/),
  loaded with `<script type="module">`. Legacy code is not refactored
  pre-emptively — touch it only when you need to.
- **CSS for a new feature** goes into the inline `<style>` block in
  [`app/index.html`](../index.html) if it's < ~50 lines, otherwise into
  [`app/assets/css/main.css`](../assets/css/main.css) under a section header
  comment.
- **Never add a runtime CDN dependency.** Vendor the file into
  `app/assets/js/` and check it in.

---

## 4. Mandatory `<head>` Boilerplate

```html
<!DOCTYPE html>
<html lang="en">
<!--
    Couchbase Query Analyzer
    Version: x.x.x
    Last Updated: YYYY-MM-DD

    🤖 AI AGENT NOTE: When updating versions, follow the detailed guide in
    settings/VERSION_UPDATE_GUIDE.md and app/guides/RELEASE.md.
-->
<!-- 🐍 "Not yet, Snake! It's not over yet!" - Liquid Snake -->

<head>
    <meta charset="UTF-8" />
    <meta name="version" content="x.x.x" />
    <meta name="last-updated" content="YYYY-MM-DD" />
    <title>Query Analyzer vx.x.x</title>

    <link rel="stylesheet" href="assets/css/jquery-ui.min.css">
    <link rel="stylesheet" href="assets/css/vis-timeline-graph2d.min.css">
    <link rel="stylesheet" href="assets/css/main.css">

    <style>
        /* Page-specific styles — keep concise; promote to main.css if > ~50 lines */
        ...
    </style>
</head>
```

The `version` meta and the `<title>` `vx.x.x` are bumped by every release —
see [`RELEASE.md §2`](./RELEASE.md#2-bump-version-strings).

The Liquid Snake comment is an intentional easter egg. Leave it in.

---

## 5. Script Loading Order

The vendored libraries must be loaded in this exact order at the bottom of
`<body>` (jQuery before jQuery UI before Chart.js before app modules):

```html
<!-- Vendored libraries (order matters) -->
<script src="assets/js/jquery.min.js"></script>
<script src="assets/js/jquery-ui.min.js"></script>
<script src="assets/js/hammer.min.js"></script>
<script src="assets/js/chart.umd.js"></script>
<script src="assets/js/chartjs-adapter-date-fns.bundle.min.js"></script>
<script src="assets/js/chartjs-plugin-zoom.min.js"></script>
<script src="assets/js/chartjs-plugin-annotation.min.js"></script>
<script src="assets/js/echarts.min.js"></script>
<script src="assets/js/echarts-gl.min.js"></script>
<script src="assets/js/vis-timeline-graph2d.min.js"></script>

<!-- App logic -->
<script src="assets/js/main-legacy-cleaned.js"></script>
<script type="module" src="assets/js/charts.js"></script>
<script type="module" src="assets/js/data-layer.js"></script>
<script type="module" src="assets/js/insights.js"></script>
<script type="module" src="assets/js/couchbase-connector.js"></script>
<script type="module" src="assets/js/ai-client.js"></script>
```

- Scripts that other modules depend on (`base.js`, `Logger`) load first.
- ES6 modules (`type="module"`) are deferred by default — fine for everything
  app-level.

---

## 6. Style Conventions

### Colors

The app currently uses a **light-mode palette** consistent with the public
website. Stick to these tokens:

| Use | Value |
|---|---|
| Primary action / link | `#007acc` |
| Highlight / "new" | `#ff8c00` |
| Page background | `#f5f7fa` |
| Card / surface | `#fff` |
| Body text | `#1a1a1a` |
| Muted text | `#666` |
| Border | `#d0d0d0` |
| Success | `#28a745` |
| Warning | `#ffc107` |
| Error / danger | `#dc3545` |

Dark mode is not currently shipped. If/when added, use a `data-theme="dark"`
attribute on `<html>` and CSS variables in
[`app/assets/css/main.css`](../assets/css/main.css) — do not invert colors
inline.

### Typography

- System font stack (defined in [`main.css`](../assets/css/main.css)).
- Code: `'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace`.
- Tab labels and section headers default to ~12–14px; chart axis labels
  10–11px.

### Class naming (BEM-ish)

Custom CSS classes use a kebab-case BEM-ish style already established in
the codebase:

```
.step-bubble                ← block
.step-bubble--active        ← modifier
.step-bubble__label         ← element
.modal-content
.tab-btn / .tab-btn.active
.ai-panel / .ai-panel-row
```

Keep it consistent. Don't introduce a new naming scheme for one feature.

### IDs

Reserve `id="…"` for elements addressed from JS (`getElementById`,
`document.querySelector('#…')`). Don't use IDs for styling — use a class.

---

## 7. UI Patterns

### Tabs

```html
<div class="tabs-container">
    <div class="tab-buttons">
        <button class="tab-btn active" onclick="switchTab('overview', event)">Overview</button>
        <button class="tab-btn"        onclick="switchTab('queries',  event)">Queries</button>
    </div>

    <div id="tab-overview" class="tab-content active">…</div>
    <div id="tab-queries"  class="tab-content">…</div>
</div>
```

The `switchTab(name, event)` function in
[`main-legacy-cleaned.js`](../assets/js/main-legacy-cleaned.js) toggles the
`active` class. Tabs hide via `display:none`, not by removing from DOM.

### Modals

Use the existing `.modal-overlay` + `.modal-content` pair. There is no jQuery
UI dialog convention — the project's hand-rolled modal predates it and is
preferred for consistency.

### AI Panel jQuery UI checkbox/radio

The AI panel uses jQuery UI `checkboxradio` widgets styled as pill buttons
(see the inline `<style>` block at the top of
[`app/index.html`](../index.html#L29-L60)). When adding new options to the
panel, follow the same `#ai-analysis-panel .ui-checkboxradio-label` rules.

### Settings tabs

Settings live under a multi-tab modal. New settings categories add a new tab
button and a new `.settings-tab-content` block. The first tab visible on
open is **App Data Storage** (CBL info), then **AI**, then **Cluster
Source** (deprecated; will be removed in v5.x).

### Charts

- Chart.js for 2D bar / line / scatter (see
  [`charts.js`](../assets/js/charts.js)).
- ECharts for 3D and word clouds.
- vis-timeline for the timeline tab.
- Always wrap a `<canvas>` in a `<div class="chart-container">` with explicit
  height — Chart.js needs a sized parent.

### Logging

Use the `Logger` global from [`base.js`](../assets/js/base.js):

```js
Logger.info("Always visible");
Logger.debug("Only with ?debug=true");
Logger.trace("Verbose, only with ?debug=true&logLevel=trace");
Logger.warn("Always visible");
Logger.error("Always visible");
```

Don't use raw `console.log` in shipping code — it bypasses the redact /
log-level controls.

---

## 8. Emoji Usage

Like the public website, **emoji are encouraged here** in UI labels, status
strings, and icons. Examples already in the codebase:

- `🚀 Starting Couchbase Query Analyzer v4.0.0-Beta` (server startup banner)
- `📊 Backend: cbl (embedded Couchbase Lite)`
- `🐍 "Not yet, Snake! It's not over yet!"` (Liquid Snake easter egg)
- `📦 No external database setup required.` (settings callout)

**Don't** put emoji in:

- The `<title>` tag (taskbar/tab rendering inconsistency)
- ARIA `aria-label` values (screen readers re-read them oddly)
- Endpoint names or URLs

For provider logos (OpenAI, Anthropic, Grok), use the SVG/PNG marks already
in [`app/assets/img/`](../assets/img/). Don't substitute a robot emoji.

---

## 9. Connecting to the Backend

All API calls use `fetch()` from a JS module. The base URL is **relative**
(the page is served from the same Flask process):

```js
const res = await fetch('/api/storage/info');
const json = await res.json();
```

The full API surface lives in
[`app/docs/work/03_APP_PY_REFACTOR.md §6.2`](../docs/work/03_APP_PY_REFACTOR.md#62-endpoint-table-current).
Notable endpoints:

| Endpoint | Use |
|---|---|
| `POST /api/couchbase/save-analyzer` | Persist an analyzer report to CBL |
| `POST /api/couchbase/load-analyzer/<id>` | Load a saved report |
| `GET  /api/storage/info` | DB path, size, doc counts |
| `POST /api/ai/analyze` | Run AI analysis (streams via polling) |
| `POST /api/ai/test` | Test an AI provider key |
| `POST /api/ai/history` | Paginated AI history per cluster |

There is **no** `POST /api/couchbase/test` or `POST /api/couchbase/query` —
those were removed when the Couchbase Server SDK was dropped (see
[`app/docs/work/00_OVERVIEW.md §8`](../docs/work/00_OVERVIEW.md#8-cbl-only-cutover-2026-05-09--current-state)).
Source data arrives via JSON paste / upload only.

---

## 10. Timezone Handling

**Always** use the project's `getChartDate()` helper for timestamp display:

```js
const convertedDate = getChartDate(request.requestTime);
const displayTime = convertedDate.toISOString()
                                 .replace('T', ' ')
                                 .substring(0, 23) + 'Z';
```

This respects the user's "show as UTC vs local" preference. Raw `new
Date(...)` calls bypass it and show the wrong timezone.

---

## 11. Feature Flags (URL Params)

The app honors several URL flags (parsed in
[`base.js`](../assets/js/base.js)):

| Flag | Effect |
|---|---|
| `?dev=true` | Enable experimental features |
| `?debug=true` | Enable verbose console logging |
| `?logLevel=trace\|debug\|info` | Granular log control |
| `?redact=true\|false` | Control sensitive-data redaction (default `true`) |

When adding a new experimental feature, gate it behind `?dev=true` rather
than shipping it on by default.

---

## 12. Versioning the UI

Every release bumps:

- The HTML comment header in [`app/index.html`](../index.html) (line ~5).
- The `<meta name="version">` tag (line ~22).
- The `<title>` (line ~24).
- The footer `.version-info` badge (line ~158).
- The "v4.0.0-Beta CBL migration" inline comments (search for the prior
  version string and replace).

The full checklist is in [`RELEASE.md §2`](./RELEASE.md#2-bump-version-strings).

The Flask app's `__version__` constant in [`app/app.py`](../app.py) must
match the HTML — it is the single source of truth for the startup banner
and any future `GET /api/version` endpoint.

---

## 13. Accessibility (Baseline)

- All `<input>` elements need an associated `<label>` or a `placeholder`.
- All `<button>` elements need either visible text or an
  `aria-label="..."`.
- Color is never the only signal — pair red/green status with a
  ✓ / ✗ / ⚠️ glyph or text.
- Charts include a `<table>` "view as data" fallback when feasible (Chart.js
  doesn't ship one — implement per-chart on demand).
- Keyboard: every modal must be dismissible with `Escape`, every tab
  navigable with `←`/`→`.

---

## 14. Don'ts

| Don't | Do instead |
|-------|------------|
| Add a build step (Webpack, Vite, Tailwind JIT) | Plain HTML + vendored JS is the architecture |
| Pull a library from a runtime CDN | Vendor it under `app/assets/js/` and load locally |
| Use `console.log` in shipping code | Use `Logger.info / .debug / .trace` |
| Use raw `new Date(...)` for display | Use `getChartDate()` |
| Refactor `main-legacy-cleaned.js` "for cleanliness" | Touch it only when fixing a bug or adding a feature in that area |
| Add a new top-level HTML file under `app/` | Add a tab to `app/index.html` |
| Re-introduce the `couchbase` Python SDK or a `/api/couchbase/test` route | They're gone on purpose — see [`00_OVERVIEW.md §8`](../docs/work/00_OVERVIEW.md#8-cbl-only-cutover-2026-05-09--current-state) |
| Hardcode `http://localhost:8888` in a `fetch()` | Use a relative path; the page is same-origin |
| Bump the `<meta name="version">` without bumping `__version__` in `app.py` | They must stay in lockstep — see [`RELEASE.md`](./RELEASE.md) |
| Strip the Liquid Snake comment | It stays. 🐍 |
