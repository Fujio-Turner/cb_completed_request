# Couchbase Query Analyzer v4.0.0

## Project Overview

The Couchbase Query Analyzer is a tool for analyzing N1QL query performance from `system:completed_requests`. It exists in two editions:

### Static Edition (v3.29.3) - `/en/index.html`
- **Frontend-only** - no build process, just open in browser
- Hosted on Cloudflare Pages at https://cb.fuj.io
- Single-page HTML application with embedded CSS/JS
- Input: JSON from `SELECT *, meta().plan FROM system:completed_requests`

### Server Edition (v4.0.0) - `/app/*`
- **Flask web server** with Couchbase integration
- Stores analysis data, user preferences, and AI analysis results in Couchbase Server
- AI-powered query analysis via OpenAI, Anthropic Claude, or Grok APIs
- Distributed as: **Docker Image**, **macOS App**, **Windows Executable**

---

## Project Structure (Post 4.0.0 Migration)

```
/cb_completed_request/
├── app/                        # 🆕 Server Edition (Flask backend) - SHIPPING CODE ONLY
│   ├── assets/                 # Server-side JS/CSS modules
│   │   ├── css/
│   │   ├── img/
│   │   └── js/
│   ├── docs/                   # Server documentation
│   ├── app.py                  # Flask application entry point
│   ├── ai_analyzer.py          # AI provider integration module
│   ├── blob_storage.py         # Blob storage handler
│   ├── config.json             # Runtime configuration
│   ├── requirements.txt        # Python dependencies
│   ├── start.sh                # Server start script
│   ├── setup_venv.sh           # Virtual environment setup
│   ├── setup_couchbase.sql     # Database setup script
│   └── index.html              # Enhanced analyzer UI
│
├── assets/                     # 🆕 Public static assets
│   ├── css/
│   ├── img/
│   └── js/
│
├── en/                         # Static Edition (v3.29.3)
│   └── index.html              # Standalone analyzer (Cloudflare hosted)
│
├── old_pre_4_0/                # 🆕 Archived pre-4.0 files
│   ├── de/, es/, pt/           # Old language versions
│   ├── docs/, img/
│   └── *.html                  # Old HTML files
│
├── playwright/                 # Playwright E2E tests
│   ├── playwright.config.js    # Playwright configuration
│   └── e2e/                    # Test spec files
│       ├── *.spec.js           # Static Edition tests
│       └── server/             # Server Edition tests
│
├── tests/                      # All tests (not shipped with release)
│   ├── python/                 # Python unit tests for /app/
│   │   ├── test_ai_analyzer.py # AI analyzer tests
│   │   └── test_*.html         # HTML test pages
│   └── *.test.js               # Jest unit tests
├── sample/                     # Test JSON data files
├── settings/                   # Configuration guides
├── python/                     # Utility scripts
├── scripts/                    # Build/deployment scripts
├── logs/                       # Release logs
│
├── index.html                  # 🆕 Main entry (redirects or v4.0 landing)
├── 404.html                    # Custom 404 page with Liquid Snake easter egg
├── analysis_hub.html           # Analysis documentation hub
├── getting_started.html        # Getting started guide
├── user_guide.html             # User documentation
├── sql_queries.html            # SQL query reference
│
├── Dockerfile                  # Docker build configuration (Static Edition)
├── wrangler.toml               # Cloudflare Workers config
├── package.json                # Node.js dependencies
├── requirements.txt            # Root Python dependencies
└── README.md                   # Project documentation
```

---

## Distribution Formats (v4.0.0)

### 1. Docker Image
```bash
# Build
docker build -t couchbase-query-analyzer:4.0.0 .

# Run
docker run -p 5000:5000 -v ./config:/app/config couchbase-query-analyzer:4.0.0
```

### 2. macOS Application
- Built via GitHub Actions using PyInstaller
- Distributed as `.app` bundle or `.dmg` installer
- Requires code signing for distribution

### 3. Windows Executable
- Built via GitHub Actions using PyInstaller
- Distributed as `.exe` installer
- May require code signing for Windows SmartScreen

---

## GitHub Actions Workflows (TODO)

### Required Workflows

```yaml
# .github/workflows/build-docker.yml
# Builds and pushes Docker image to registry

# .github/workflows/build-macos.yml
# Builds macOS .app using PyInstaller

# .github/workflows/build-windows.yml
# Builds Windows .exe using PyInstaller

# .github/workflows/release.yml
# Creates release with all artifacts
```

### Build Matrix
| Platform | Tool | Output | Signing |
|----------|------|--------|---------|
| Docker | Dockerfile | Image | N/A |
| macOS | PyInstaller | .app/.dmg | Apple Developer |
| Windows | PyInstaller | .exe | Code signing cert |

---

## Cloudflare Deployment Restrictions

### Files to HIDE/RESTRICT on Cloudflare Pages

The following paths should be blocked or restricted via `_headers` or `_redirects`:

```
# _headers (Cloudflare Pages)

/app/*
  X-Robots-Tag: noindex
  Access-Control-Allow-Origin: deny

/tests/*
  X-Robots-Tag: noindex
  
/e2e/*
  X-Robots-Tag: noindex

/node_modules/*
  X-Robots-Tag: noindex

/python/*
  X-Robots-Tag: noindex

/*.config.js
  X-Robots-Tag: noindex

/package*.json
  X-Robots-Tag: noindex
```

### Recommended `_redirects` Rules
```
# Block access to server-side code
/app/*  /404.html  404
/tests/*  /404.html  404
/e2e/*  /404.html  404
/node_modules/*  /404.html  404

# Optional: Redirect old paths
/liquid_snake/*  /app/:splat  301
/liquid_snake_public/*  /:splat  301
```

### Public Paths (Keep Accessible)
- `/en/index.html` - Static analyzer (v3.29.3)
- `/index.html` - Main landing page
- `/assets/*` - Public static assets
- `/sample/*` - Sample data for testing
- `/analysis_hub.html`, `/getting_started.html`, `/user_guide.html`

---

## Setup and Installation

### Static Edition (v3.29.3)
No installation needed - just open `/en/index.html` in browser.

### Server Edition (v4.0.0)

#### Option A: Docker
```bash
docker run -p 5000:5000 couchbase-query-analyzer:4.0.0
# Open http://localhost:5000
```

#### Option B: Local Development
```bash
cd app
./setup_venv.sh
source venv/bin/activate
pip install -r requirements.txt
python app.py
# Open http://localhost:5000
```

#### Option C: Standalone Executables
Download from GitHub Releases:
- `QueryAnalyzer-4.0.0.dmg` (macOS)
- `QueryAnalyzer-4.0.0-Setup.exe` (Windows)

---

## Testing

### Quick Reference
```bash
# All tests
npm run test:e2e                    # E2E: All (both editions, all browsers)
npm test                            # Jest: Unit tests (40 tests)
cd app && source venv/bin/activate && pytest ../tests/python/ -v  # Python: ~100 tests (logging 4.0.0 phase 9)

# Fast E2E (Chromium only)
npm run test:e2e:static:chromium    # Static Edition (36 tests)
npm run test:e2e:server:chromium    # Server Edition + logging specs (55+ tests)

# Critical CI gate (scanner — must pass for release)
pytest tests/python/test_no_unredacted_logging.py -v  # Credential leak prevention gate
```

### Playwright E2E Tests
```bash
npm install
npx playwright install

# By Edition
npm run test:e2e                    # All tests (both editions, all browsers)
npm run test:e2e:static             # Static Edition only (v3.29.3 - /en/index.html)
npm run test:e2e:server             # Server Edition only (v4.0.0 - /app/)

# Fast (Chromium only)
npm run test:e2e:static:chromium    # Static + Chromium only
npm run test:e2e:server:chromium    # Server + Chromium only

# Debug/Interactive
npm run test:e2e:ui                 # Interactive UI mode
npm run test:e2e:headed             # See browser while testing
npm run test:e2e:debug              # Debug mode
npm run test:e2e:report             # View last test report
```

**Test Locations:**
- Static Edition: `playwright/e2e/*.spec.js` (tests /en/index.html)
- Server Edition: `playwright/e2e/server/*.spec.js` (tests Flask at localhost:5555)
  - `console-leak.spec.js` — Verifies no API keys leak to browser console
  - `logging-panel.spec.js` — Tests `/api/logging/*` endpoints and UI

### Python Unit Tests (Server Edition)

**Phase 9: Logging 4.0.0 Migration Tests** (~100 tests total across 7 files + scanner)

Comprehensive testing for credential redaction and logging:
- `tests/python/test_logging_config.py` — Core logging setup (17 tests)
- `tests/python/test_api_key_redaction.py` — API key masking and leak detection (18 tests)
- `tests/python/test_logging_api.py` — `/api/logging/*` endpoints (25 tests)
- `tests/python/test_app_base_logging.py` — Flask app initialization logging (~15 tests)
- `tests/python/test_ai_analyzer_logging.py` — AI analyzer logging (~15 tests)
- `tests/python/test_cbl_store_blob_logging.py` — Storage logging (~15 tests)
- **`tests/python/test_no_unredacted_logging.py` — CRITICAL CI GATE** (2 tests, must pass)

```bash
cd app && source venv/bin/activate

# All logging tests
pytest ../tests/python/ -v

# Just the scanner gate (prevents credential leaks)
pytest ../tests/python/test_no_unredacted_logging.py -v

# Specific module tests
pytest ../tests/python/test_logging_config.py -v
pytest ../tests/python/test_api_key_redaction.py::TestLeakScanCanary -v
```

**Shared Helpers:**
- `tests/python/conftest.py` — Autouse fixture setting `CBQA_LOG_FILE=off`, `CBQA_LOG_LEVEL=DEBUG`
- `tests/python/_log_helpers.py` — `assert_no_secrets()` canary detector with `SECRET_TOKENS`

### Jest Unit Tests
```bash
npm test                            # Run all 40 tests
npm test -- --watch                 # Watch mode
```

---

## Version Management

### Current Versions
| Edition | Version | Location |
|---------|---------|----------|
| Static | 3.29.3 | `/en/index.html` |
| Server | 4.0.0-Beta.2 | `/app/` |

### Version Update Locations (Server Edition)
- `app/app.py`: `__version__` constant (single source of truth — startup banner reads from this)
- `app/index.html`: HTML comment, `<meta name="version">`, `<title>`, footer `.version-info` badge
- `app/build_mac.spec` and `app/build_win.spec`: `APP_VERSION`
- `app/docs/openapi.yaml`: `info.version`
- `index.html` (root): `<meta name="version">`, `<title>`, OG tags
- `README.md`: editions table + prose
- `release_notes.md`: new section at the top
- `AGENT.md`: this file's "Current Versions" table

### Workflow Order for Updates
1. **Cutting a release** → Follow [`app/guides/RELEASE.md`](app/guides/RELEASE.md) (the **canonical** release checklist; supersedes `settings/RELEASE_GUIDE.md`)
2. **After Release** → Follow `settings/POST_RELEASE_GUIDE.md`
3. **Detailed version-bump locations** → see `settings/VERSION_UPDATE_GUIDE.md` and `app/guides/RELEASE.md §2`

---

## Server Edition Architecture

### Flask Endpoints (`app/app.py`)

> **Source of truth:** [`app/docs/openapi.yaml`](app/docs/openapi.yaml).
> Human-readable reference: [`app/docs/API.md`](app/docs/API.md).
> Live interactive explorer: **http://localhost:8888/api-docs/**.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Serve `app/index.html` |
| `/openapi.yaml` | GET | Download the OpenAPI 3.1 spec |
| `/api-docs/` | GET | Vendored Swagger UI (no CDN) |
| `/api/version` | GET | Return `__version__` and backend |
| `/api/couchbase/save-analyzer` | POST | Save analyzer report to CBL |
| `/api/couchbase/load-analyzer/<id>` | POST | Load analyzer report from CBL |
| `/api/couchbase/delete-analyzer` | POST | Delete a saved report |
| `/api/couchbase/save-preferences` | POST | Save per-user UI preferences |
| `/api/couchbase/load-preferences/<id>` | POST | Load per-user UI preferences |
| `/api/ai/analyze` | POST | Kick off AI analysis (returns `document_id`) |
| `/api/ai/status/<document_id>` | POST | Poll AI analysis status |
| `/api/ai/cancel` | POST | Cancel a running AI analysis |
| `/api/ai/preview` | POST | Preview AI payload (no provider call) |
| `/api/ai/test` | POST | Test AI provider connection |
| `/api/ai/history` | POST | Paginated AI history |
| `/api/ai/clusters` | POST | Distinct cluster names in AI history |
| `/api/ai/stats` | GET | Aggregate AI usage stats |
| `/api/ai/payload-reference` | GET | Read payload-reference doc |
| `/api/ai/payload-reference/{load,seed,save,invalidate-cache}` | POST | Manage payload-reference doc |
| `/api/ai/models` | GET | Read AI provider/model registry |
| `/api/ai/models/{load,seed,save,invalidate-cache}` | POST | Manage AI models registry |
| `/api/ai/{cache,debug,call}` | POST | Session cache, debug toggle, generic AI proxy |
| `/api/storage/info` | GET | Embedded CBL info (path, size, doc counts) |
| `/api/storage/maintenance` | POST | Run `compact / reindex / optimize / integrity / gc_blobs` |
| `/api/storage/export` | GET | Stream `tar.gz` backup of CBL |
| `/api/storage/import` | POST | Replace CBL from uploaded backup |
| `/api/logging/info` | GET | Read active log configuration and rotated-file inventory |
| `/api/logging/active-log` | GET | Download the active log file |

> **Removed in v4.0.0-Beta** (do not re-add): `POST /api/couchbase/test`,
> `POST /api/couchbase/check-indexes`, `POST /api/couchbase/query`. The
> Couchbase Server SDK has been removed; source data arrives via JSON
> upload only. See [`app/docs/work/00_OVERVIEW.md §8`](app/docs/work/00_OVERVIEW.md).

### AI Provider Support
- **OpenAI**: GPT-4o, GPT-4o-mini, o3, o4-mini
- **Anthropic Claude**: Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 4
- **xAI Grok**: Grok-3, Grok-4
- **Custom**: User-defined API endpoints

### Couchbase Integration
- **Bucket**: `cb_tools` (configurable)
- **Scope/Collections**: 
  - `query.analyzer` - Analysis results
  - `config.preferences` - User preferences
  - `_default._default` - System config (payload_reference, ai_models_list)

---

## Feature Flags

### URL Parameters
| Flag | Description |
|------|-------------|
| `?dev=true` | Enable experimental features |
| `?debug=true` | Enable verbose console logging |
| `?logLevel=trace\|debug\|info` | Granular log control |
| `?redact=true\|false` | Control sensitive data redaction |

### Debug Logging
```javascript
Logger.info("Always visible");
Logger.debug("Only with ?debug=true");
Logger.trace("Verbose, only with ?debug=true");
Logger.warn("Always visible");
Logger.error("Always visible");
```

---

## Code Style

### JavaScript
- Vanilla JavaScript with jQuery for DOM manipulation
- ES6 modules in `/app/assets/js/`
- Function names: camelCase
- CSS: BEM-like naming (.step-bubble, .modal-content)

### Python (Server Edition)
- Follow PEP 8
- Use type hints
- Use `icecream` for debug logging
- Use `pytest` for testing

### Timezone Handling
**ALWAYS** use `getChartDate()` for timestamp display:
```javascript
const convertedDate = getChartDate(request.requestTime);
const displayTime = convertedDate.toISOString().replace('T', ' ').substring(0, 23) + 'Z';
```

---

## Security Notes

### Never Commit
- API keys or secrets
- `config.json` with real credentials
- Production database connection strings

### Cloudflare Restrictions
- Block `/app/*` from public access
- Block `/tests/*`, `/e2e/*`, `/node_modules/*`
- Block config files (`*.config.js`, `package*.json`)

### Data Redaction
- Use `?redact=true` (default) in production
- Never share logs with `?redact=false` containing production data

---

## Documentation Files

### Server Edition guides — `/app/guides/` 🆕

These are the **canonical** guides for working on the Server Edition. Read
the relevant one before touching the area it covers.

| File | When to read it |
|------|-----------------|
| [`app/guides/RELEASE.md`](app/guides/RELEASE.md) | Cutting any new release. 11-step checklist + Best Practices. **Supersedes `settings/RELEASE_GUIDE.md` for the Server Edition.** |
| [`app/guides/API_OPENAPI.md`](app/guides/API_OPENAPI.md) | Adding, updating, deleting, or documenting any `/api/*` endpoint. Defines the error envelope, tag taxonomy, and the openapi.yaml + API.md update flow. |
| [`app/guides/HTML_APP.md`](app/guides/HTML_APP.md) | Editing [`app/index.html`](app/index.html) or anything under [`app/assets/`](app/assets/). Documents the no-build-step / no-CDN / vendored-jQuery+Chart.js stack. |
| [`app/guides/HTML_WEBSITE.md`](app/guides/HTML_WEBSITE.md) | Editing the public cb.fuj.io pages at the repo root (`index.html`, `getting_started.html`, `user_guide.html`, etc.) and `/en/index.html`. Covers Cloudflare Pages constraints. |

### API spec & reference — `/app/docs/`

| File | Description |
|------|-------------|
| [`app/docs/openapi.yaml`](app/docs/openapi.yaml) | **Source of truth** OpenAPI 3.1 spec — every endpoint, every schema, every error response |
| [`app/docs/API.md`](app/docs/API.md) | Markdown quick reference derived from the spec |
| [`app/docs/work/`](app/docs/work/) | Migration / refactor design docs (CB Server → CBL, packaging, etc.) |

### General project docs

| File | Description |
|------|-------------|
| [`README.md`](README.md) | Project overview and quick start |
| [`release_notes.md`](release_notes.md) | Per-version changelog (Static + Server Editions) |
| [`app/README_SERVER.md`](app/README_SERVER.md) | Server edition documentation |
| [`app/QUICKSTART.md`](app/QUICKSTART.md) | Quick start for server edition |
| [`getting_started.md`](getting_started.md) / [`getting_started.html`](getting_started.html) | Public-facing onboarding (cb.fuj.io) |
| [`settings/RELEASE_GUIDE.md`](settings/RELEASE_GUIDE.md) | Legacy release process (use `app/guides/RELEASE.md` instead for Server Edition) |
| [`settings/VERSION_UPDATE_GUIDE.md`](settings/VERSION_UPDATE_GUIDE.md) | Detailed version-bump locations (still useful) |
| [`settings/POST_RELEASE_GUIDE.md`](settings/POST_RELEASE_GUIDE.md) | Post-release housekeeping |
| [`settings/LOCALIZATION_GUIDE.md`](settings/LOCALIZATION_GUIDE.md) | Translation guidelines |
| [`settings/BRANCHING_STRATEGY.md`](settings/BRANCHING_STRATEGY.md) | `feature → liquid → QA → main` workflow |
| [`BIG_MOVE_4_0_0.md`](BIG_MOVE_4_0_0.md) | v4.0.0 migration documentation |

---

## Utility Scripts

### Python (`/python/`)
- `analyze_dead_code.py` - Dead code detection
- `optimize_css.py` - CSS optimization
- `find_hardcoded_strings.py` - Find untranslated strings

### Shell (`/scripts/`)
- Build and deployment scripts

### App Scripts (`/app/`)
- `start.sh` - Start Flask server
- `setup_venv.sh` - Setup Python virtual environment
- `download-logos.sh` - Download AI provider logos
