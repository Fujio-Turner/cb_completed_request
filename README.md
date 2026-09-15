# Couchbase Query Analyzer v4.0.0-Beta

A web-based tool for analyzing Couchbase N1QL query performance and execution plans from `system:completed_requests`. Visualize query patterns, identify bottlenecks, and optimize database performance with advanced index usage tracking, execution-plan analysis, and AI-powered insights.

#### (Capella Compatible)

---

## Two Editions

| Edition | Version | Best For | How to Run |
|---|---|---|---|
| **Static** | 3.29.3 | Quick one-off analysis, no install | Open [`en/index.html`](en/index.html) in a browser |
| **Server** | 4.0.0-Beta | Persistent analyses, AI insights, team use, **zero-config storage** | Docker / macOS app / Windows exe |

🚀 **Hosted Static Edition:** https://cb.fuj.io/en/

> **What's new in v4.0.0-Beta:** the Server Edition no longer requires an external Couchbase Server for app persistence. It ships with an **embedded Couchbase Lite (CE)** datastore — the user's external Couchbase Server is now used **only** for read-only N1QL on `system:completed_requests`. See [`app/docs/work/00_OVERVIEW.md`](app/docs/work/00_OVERVIEW.md) for the migration design.

---

## Server Edition (v4.0.0-Beta.2) — Quick Start

The Server Edition is a Flask backend with **embedded Couchbase Lite** persistence and AI-powered query analysis (OpenAI / Anthropic Claude / xAI Grok / Google Gemini). No external Couchbase Server is needed for the app's own data. **Couchbase Lite is the only storage backend** — the Couchbase Server SDK has been removed.

Docker, local Python, and the desktop builds all listen on **http://localhost:8080** by default (`PORT` env var overrides).

### Option A — Docker (recommended)

From `app/` (compose + Dockerfile live there):

```bash
cd app
docker compose up --build      # build & run (foreground)
docker compose up -d           # detached
docker compose logs -f         # tail logs
docker compose down            # stop
```

Open **http://localhost:8080**.

The compose stack runs `gunicorn -w 1` inside the container (single worker is **required** — embedded Couchbase Lite is single-writer per process). The CBL database lives in the named volume `cbl-data` and persists across container rebuilds.

Environment knobs (defaults shown, overridable in [`app/docker-compose.yml`](app/docker-compose.yml)):

| Var | Default | Purpose |
|---|---|---|
| `CBL_DB_DIR` | `/app/data` | Where the `.cblite2` directory lives |
| `CBL_DB_NAME` | `cb_tools_db` | Database name |
| `PORT` | `8080` | Container listen port (map host with `HOST_PORT`) |

> **Note for macOS/Windows users:** if your **production** Couchbase Server (the one holding `system:completed_requests`) runs on the host machine, use `host.docker.internal` instead of `localhost` in the connection URL. The Server Edition itself no longer needs an external Couchbase Server.

### Option B — Local Python (development)

```bash
cd app
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# CBL bindings are not on PyPI — without them the app starts but
# persistence endpoints return 503. Use Docker for a batteries-included run.
python app.py   # http://localhost:8080
```

The CBL database is created on first run under your OS's user-data directory (`~/Library/Application Support/CouchbaseQueryAnalyzer/data/cb_tools_db.cblite2/` on macOS, `%LOCALAPPDATA%\Couchbase\CouchbaseQueryAnalyzer\data\` on Windows, `~/.local/share/CouchbaseQueryAnalyzer/data/` on Linux). Override with `CBL_DB_DIR`.

> **CBL bindings:** the [`CouchbaseLite`](https://github.com/couchbaselabs/couchbase-lite-python) Python package is **not** on PyPI. The Dockerfile and PyInstaller specs build it from source against `libcblite`. There is no fallback to an external Couchbase Server.

See [`app/docs/work/CB_TO_CBL/02_CBL_STORE_MODULE.md`](app/docs/work/CB_TO_CBL/02_CBL_STORE_MODULE.md) for the storage layer design.

### Option C — Native macOS / Windows binary

Built via GitHub Actions with PyInstaller (specs in `app/`: [`app/build_mac.spec`](app/build_mac.spec), [`app/build_win.spec`](app/build_win.spec)). Download from the **Releases** page:

- `QueryAnalyzer-4.0.0-beta-UNSIGNED-arm64.dmg` (macOS, Apple Silicon, **unsigned**)
- `QueryAnalyzer-4.0.0-beta-UNSIGNED-x64.zip` (Windows onedir zip, **unsigned** — not an MSI installer)

Both bundle `libcblite.dylib` / `cblite.dll` — no external Couchbase Server is needed. They run as a tray/menu-bar app and open the analyzer at **http://localhost:8080**.

**macOS first launch:** Gatekeeper blocks unsigned apps. After dragging into `/Applications`:

```bash
xattr -dr com.apple.quarantine /Applications/QueryAnalyzer.app
```

The same command is in `README.txt` inside the DMG.

### Server Edition AI Provider Support

| Provider | Models |
|---|---|
| OpenAI | GPT-4o, GPT-4o-mini, o3, o4-mini |
| Anthropic Claude | Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 4 |
| xAI Grok | Grok-3, Grok-4 |
| Google Gemini | Gemini 2.5 / 2.0 / 1.5 |
| Custom | Any OpenAI-compatible endpoint |

---

## Static Edition (v3.29.3) — Quick Start

Single-file HTML — no install, no server.

### Step 1: Get the Tool
- Open the hosted version: https://cb.fuj.io/en/
- Or download [`en/index.html`](https://github.com/Fujio-Turner/cb_completed_request/raw/main/en/index.html?download=true) and open it in any modern browser (Firefox tends to render the largest payloads fastest).

### Step 2: Extract Query Data

Run in Couchbase Query Workbench or `cbq`:

```sql
SELECT *, meta().plan FROM system:completed_requests ORDER BY requestId LIMIT 2000;
```

> Returns ~36 MB of JSON for 2 000 rows. Anything bigger may crash the browser — drop the `LIMIT` if you hit performance issues. See [`sql_queries.html`](sql_queries.html) for more query options.

### Step 3: Analyze

Copy the full JSON result and paste it into the tool's input area, then click **Parse JSON**.

![Query input interface](old_pre_4_0/img/copy_paste_side_by_side.png)

### Step 4: (Optional) Filter by Date Range

Date fields auto-populate with the data's full time range. Adjust **From**/**To** and click **Parse JSON** again.

### Step 5: (Optional) Enhanced Index Analysis

Run the index query, paste the result into the second input box, and click **Parse JSON**:

```sql
SELECT *, meta() FROM system:indexes;
```

---

## Features (Both Editions)

### Eight Analysis Tabs

#### 1. Dashboard
- Query Duration Distribution bar chart
- Primary Indexes Used donut with warning system + "Learn More" link
- Query Pattern Features
- Users by Query Count (sortable)
- Index Usage Count (sortable)
- Statement Type pie (SELECT / INSERT / UPDATE / DELETE)
- Query State pie

#### 2. Insights
- **Index Performance Issues** — inefficient scans, slow index scans, primary index over-usage, ORDER BY/LIMIT/OFFSET over-scan (Beta)
- **Resource Utilization** — high kernel time, high memory usage, slow USE KEYS queries
- **Query Pattern Analysis** — missing WHERE clauses, leading-wildcard LIKE, SELECT *

#### 3. Timeline
Six interactive charts in a 2×3 grid (Duration Buckets, Query Types, Operations, Filter, Timeline, Memory) with Reset Zoom, Linear/Log Y-axis, time-grouping by Optimizer / Minute / Second, and pan/zoom/box-select.

#### 4. Query Groups
Aggregated, normalized analysis (literals → `?`) with total_count, min/max/avg/median duration, avg fetch / primaryScan / indexScan, and per-user breakdowns. Excludes INFER / ADVISE / CREATE / ALTER INDEX / SYSTEM queries.

#### 5. Every Query
17-column sortable table with interactive flow diagrams and color-coded execution plans. Batch processing for large datasets.

#### 6. Index/Query Flow
Visual index ↔ query relationships with enhanced primary-index detection.

#### 7. Indexes
Complete index catalog with advanced filtering, smart consolidation, and query-index matching.

#### 8. Report Maker (Beta)
Pick sections (Dashboard, Timeline, Query Groups, etc.), include filters/header summary, flatten scrollable tables, convert charts to images, then **Preview → Print / Save PDF**.

### Server-Edition–Only Features
- AI-powered query analysis (OpenAI, Claude, Grok, custom)
- **Embedded** persistent storage of analyses, user preferences, and AI history in Couchbase Lite (zero external DB required)
- Backup / restore of the local DB via `/api/storage/export` and `/api/storage/import`
- Multi-user / team-shareable analyzer sessions
- Reusable connection profiles

---

## Understanding the Visualizations

| Bubble Color | Meaning |
|---|---|
| 🟢 Green | < 25 % of total query time |
| 🟡 Yellow | 25 – 50 % |
| 🟠 Orange | 50 – 75 % |
| 🔴 Red | > 75 % |
| **Highlighted** | Query uses a primary scan (optimization candidate) |

### Time Grouping Guidelines

| Grouping | Best Range |
|---|---|
| **By Optimizer** | Auto-selects best (recommended) |
| **By Second** | ≤ 1 hour |
| **By Minute** | ≤ 1 day |
| **By Hour** | ≤ 1 month |
| **By Day** | > 1 month |

⚠️ Large date ranges with fine-grained groupings can cause chart-rendering errors — the tool will warn you.

---

## Project Layout

```
cb_completed_request/
├── app/                          # Server Edition v4.0.0-Beta.2
│   ├── app.py                    # Flask entry (CBL-backed routes)
│   ├── app_base.py               # Flask app object + non-storage endpoints
│   ├── cbl_store.py              # Embedded Couchbase Lite storage layer
│   ├── ai_analyzer.py            # AI provider integrations
│   ├── Dockerfile                # libcblite + CBL Python bindings + Flask
│   ├── docker-compose.yml        # `cd app && docker compose up --build`
│   ├── build_mac.spec            # PyInstaller spec — macOS .app
│   ├── build_win.spec            # PyInstaller spec — Windows onedir
│   └── requirements.txt          # Python deps (CBL bindings from the build)
├── en/                           # Static Edition v3.29.3 (single-file HTML)
├── old_pre_4_0/                  # Archived pre-4.0 files
├── playwright/                   # E2E tests (both editions)
├── tests/                        # Python unit tests + Jest specs
├── sample/                       # Sample JSON data
└── README.md                     # You are here
```

See [`AGENT.md`](AGENT.md) for the full architecture overview, [`BIG_MOVE_4_0_0.md`](BIG_MOVE_4_0_0.md) for the v3 → v4 migration history, and [`app/docs/work/`](app/docs/work/) (12 numbered docs) for the v4 → v5 CBL migration design and post-review fixes.

---

## Testing

From the project root, with the venv active and `pip install -r requirements.txt` done:

```bash
# Python unit tests
pytest tests/python/ -v
# - 12 ai_analyzer tests always run
# - 97 cbl_store / blob_storage / migration tests skip unless CBL bindings are installed

# Jest unit tests
npm test                                                            # 40 tests

# Playwright E2E
npm run test:e2e                       # all (both editions, all browsers)
npm run test:e2e:static:chromium       # static edition, fast
npm run test:e2e:server:chromium       # server edition, fast
```

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Empty results from `system:completed_requests` | Enable query logging in Couchbase |
| Browser slow / crashes on large JSON | Reduce `LIMIT` (try 500), or use the Server Edition |
| Chart rendering error | Use a coarser time grouping (e.g. **By Hour** instead of **By Minute**) |
| "Too far apart" error | Time range is too wide for the chosen grouping — see table above |
| Docker: connection refused to host Couchbase | Use `host.docker.internal` (Mac/Windows) instead of `localhost` |
| Docker logs show `toon-python` install error | Suppressed by `SKIP_TOON_INSTALL=1` in compose; harmless if you see it |

---

## Release Notes

See [`release_notes.md`](release_notes.md).

## Requirements

- Modern web browser with JavaScript enabled
- A Couchbase Server cluster (any recent version) **with query logging enabled** — this is the source of `system:completed_requests` data; the analyzer queries it read-only
- Read access to `system:completed_requests` (admin privileges)
- For Server Edition v4.0.0-Beta: Docker, **or** Python 3.12+, **or** the unsigned macOS/Windows desktop build
  - **No external Couchbase Server is needed for app persistence** — the Server Edition embeds Couchbase Lite (CE)
