# Analysis Hub → Minimalist Conversion Plan (to analysis_hub_new_2.html)

## Objective
- Convert the existing analysis guide into a cleaner, minimalist page styled like `index.html` while preserving depth and clarity.
- Restructure content into 4 main parts:
  - Part 1: How to process data and generate charts/stats
  - Part 2: What the stats and tables mean
  - Part 3: Crawl → Walk → Run optimization journey
  - Part 4: Glossary of terms used in Parts 1–3

## Inputs reviewed
- Source content: `analysis_hub.html` (current comprehensive guide with fixed left sidebar, numerous inline-styled panels, metric deep-dives, code copy blocks, diagrams)
- Target style reference: `index.html` (gradient header, centered container, card/grid sections, accordions, minimal palette, consistent copy button)

## High-level content inventory from analysis_hub.html
- Intro and purpose, last-updated info, back link
- How to: Parse JSON (date/time filtering, preset ranges, SQL++ text filter, elapsedTime filter, exclude system queries) with image hovers
- Analyzer tabs overview: Dashboard, Insights, Timeline, Query Groups, Every Query, Index/Query Flow, Indexes (+ indexes SQL with Copy button)
- Understanding the stats:
  - Timing overview diagrams (query_times, serviceTime)
  - System & node impact (resultCount, resultSize, usedMemory etc.)
  - Query execution phases (phaseCounts/Operators/Times; profile="timings")
  - Connecting stats to Crawl/Walk/Run levels (performance-level blocks)
  - Practical analysis: tips and success metrics
- Optimization guide: Crawl, Walk, Run, with expectations and metrics
- Metric deep-dives (glossary style): scanConsistency, serviceTime, elapsedTime, cpuTime, state, usedMemory (each with examples, analysis patterns, and diagrams)
- Utility: SQL copy button behavior and sidebar toggle logic

## UI/UX principles to adopt from index.html
- Gradient header hero with title + short subtitle
- Single centered column (max-width ~1000px), generous whitespace, neutral background `#f5f7fa`
- Section titles with accent underline (`h2::after`)
- Content as cards/tiles (white bg, soft border, subtle drop shadow, lift on hover when appropriate)
- Accordions for dense details/FAQs
- Consistent "SQL copy" UI (absolute positioned button, success green flash)
- Mini gallery/thumbnail pattern with zoom-on-hover where helpful
- Accessible focus styles and mobile responsiveness
- Floating GitHub + version badge patterns

## Proposed information architecture for analysis_hub_new_2.html
- Header (gradient): "Couchbase Query Analysis Hub" with brief value prop
- Quick intro panel: what this page is, who it’s for, how it connects to the Analyzer
- Navigation: simple inline contents at top (no fixed sidebar). Optional sticky mini-TOC on wide screens if needed later
- Part 1: Process → "How to generate charts & stats"
  - Step cards for: Obtain JSON, Paste/Upload, Parse JSON, Apply filters (Date/Time presets, SQL++ contains, Elapsed Time, Exclude system)
  - Link-cards to each Analyzer tab with one-liner purpose + screenshot trio (like index gallery)
- Part 2: Interpret → "What the stats & tables mean"
  - Timing relationship diagram callout
  - Accordions per metric grouping: Timing, System/Result, Phases
  - Short, scannable bullets; keep deeper explanations behind accordions
- Part 3: Improve → "Crawl → Walk → Run"
  - Three compact cards with expectations, key metrics to watch, and success thresholds
  - Cross-links back to Part 2 metric accordions
- Part 4: Glossary
  - Accordion per term (scanConsistency, serviceTime, elapsedTime, cpuTime, state, usedMemory)
  - Keep examples and patterns here to shrink Parts 1–3
- Footer: version badge + copyright

## Visual and component mapping
- Replace fixed sidebar with a top Contents list:
  - Contents: [Part 1] · [Part 2] · [Part 3] · [Part 4] · [SQL filters]
- Convert inline-styled color panels into unified card components (`.feature/.step` look)
- Use `sql-query-box` + `sql-copy-btn` for all code snippets
- Use gallery hover-zoom for select diagrams (timing relationships, serviceTime breakdown, node diagram)
- Reuse accordion pattern for FAQs, metric groups, and glossary terms

## Content reductions and consolidation
- Move detailed examples from Parts 1–3 into Part 4 (Glossary) to reduce cognitive load
- Collapse long tip lists into 4–6 bullet highlights per section; push full rationales into accordion bodies
- Unify repeated explanations (e.g., timing relationships) with a single reusable callout + anchors

## Phased plan (chunked work)
1) Shell & Style Baseline
- Create `analysis_hub_new_2.html` with:
  - Head/meta parity (charset, viewport, title, description, canonical)
  - Inline `<style>` block: copy minimal subset from `index.html` needed for layout, header, cards, accordions, copy button, gallery, version badge, footer
  - Gradient header + intro paragraph
  - Contents nav (anchors to Parts 1–4)

2) Part 1: Processing workflow
- Create 4–6 step cards for: Extract data, Paste/Upload, Parse JSON, Filters overview, Tabs overview, Indexes JSON (with SQL block)
- Convert existing images (datepicker, presets, filters) to compact gallery
- Migrate copy-button script

3) Part 2: Interpreting stats
- Insert timing relationship diagram callout
- Add three accordions: Timing metrics, System/Result metrics, Phase metrics
- Shorten prose; link to Glossary terms

4) Part 3: Crawl → Walk → Run
- Three side-by-side cards (stack on mobile) with expectations, watch metrics, success goals
- Relink to metric anchors and Tabs

5) Part 4: Glossary
- One accordion per term (scanConsistency, serviceTime, elapsedTime, cpuTime, state, usedMemory)
- Move detailed examples/patterns here; keep concise summaries in Part 2

6) Navigation & Anchors
- Add back-to-top links and within-page anchors
- Optional: a small sticky mini-TOC for wide screens (defer if not needed)

7) Scripts & Accessibility
- Copy-button behavior (success state)
- Accordion toggle (ARIA-friendly)
- Focus-visible outlines retained; test keyboard navigation

8) Visual polish
- Consistent spacing, neutral palette, minimal emoji
- Replace heavy inline colors with unified theme tokens
- Ensure images are lazy-loaded and sized

9) QA pass
- Validate anchors, copy buttons, and accordions
- Mobile viewport checks
- Spelling/terminology consistency with Analyzer UI

10) Finalize
- Update title/description; add version badge footer
- Confirm internal/external links; ensure relative paths for repo references

## Wireframe skeleton (structure sketch)
```html
<body>
  <header>…gradient…</header>
  <main>
    <section class="intro">…purpose + link to Analyzer…</section>
    <nav class="contents">Part 1 · Part 2 · Part 3 · Part 4</nav>

    <section id="part-1">…cards + gallery + sql-query-box…</section>
    <section id="part-2">…timing callout + accordions…</section>
    <section id="part-3">…crawl/walk/run cards…</section>
    <section id="part-4">…glossary accordions…</section>
  </main>
  <div class="version-info">…</div>
  <footer>…</footer>
  <script>…accordion + copy button…</script>
</body>
```

## Acceptance criteria
- Visual parity with `index.html` header, cards, accordions, copy buttons, and spacing
- Clear 4-part structure; each section scannable in ≤ 30 seconds
- Heavy detail moved into Glossary accordions; Parts 1–3 remain concise
- No fixed sidebar; page is readable on mobile with anchors

## Risks and mitigations
- Page length: mitigate with accordions and gallery thumbnails
- Image weight: lazy-load and limit enlargement scale; reuse existing assets
- Link drift: keep anchors stable and cross-link sparingly

## Open questions
- Keep any emoji for scannability, or remove for a stricter minimalist tone?
- Add a small sticky TOC for large screens, or rely on top Contents only?

## Next step
- Implement Phase 1 (Shell & Style Baseline) for `analysis_hub_new_2.html`, then proceed part-by-part.
