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
docker run -p 5555:5555 -v ./config:/app/config couchbase-query-analyzer:4.0.0
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
docker run -p 5555:5555 couchbase-query-analyzer:4.0.0
# Open http://localhost:5555
```

#### Option B: Local Development
```bash
cd app
./setup_venv.sh
source venv/bin/activate
pip install -r requirements.txt
python app.py
# Open http://localhost:5555
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
cd app && source venv/bin/activate && pytest ../tests/python/ -v  # Python: 76 tests

# Fast E2E (Chromium only)
npm run test:e2e:static:chromium    # Static Edition (36 tests)
npm run test:e2e:server:chromium    # Server Edition (53 tests)
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

### Python Unit Tests (Server Edition)
```bash
cd app
source venv/bin/activate
pytest ../tests/python/ -v          # Run all 76 tests
pytest ../tests/python/test_ai_analyzer.py -v  # Specific file
```

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
| Server | 4.0.0 | `/app/` |

### Version Update Locations (Server Edition)
- `app/index.html`: `<title>`, `<meta name="version">`, `APP_VERSION`
- `app/app.py`: User-Agent header
- `AGENT.md`: This file header
- `README.md`: Release notes

### Workflow Order for Updates
1. **After Release** → Follow `settings/POST_RELEASE_GUIDE.md`
2. **Before Release** → Follow `settings/RELEASE_GUIDE.md`
3. **Update Version** → Follow `settings/VERSION_UPDATE_GUIDE.md`

---

## Server Edition Architecture

### Flask Endpoints (`app/app.py`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Serve index.html |
| `/api/couchbase/test` | POST | Test Couchbase connection |
| `/api/couchbase/query` | POST | Execute N1QL query |
| `/api/couchbase/save-analyzer` | POST | Save analyzer data |
| `/api/couchbase/load-analyzer/<id>` | POST | Load analyzer data |
| `/api/couchbase/save-preferences` | POST | Save user preferences |
| `/api/couchbase/load-preferences/<id>` | POST | Load user preferences |
| `/api/ai/analyze` | POST | Run AI analysis |
| `/api/ai/preview` | POST | Preview AI payload |
| `/api/ai/test` | POST | Test AI API connection |
| `/api/ai/history` | POST | Get analysis history |
| `/api/ai/models/<provider>` | POST | Get AI models list |

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

| File | Description |
|------|-------------|
| `README.md` | Project overview and quick start |
| `app/README_SERVER.md` | Server edition documentation |
| `app/QUICKSTART.md` | Quick start for server edition |
| `settings/RELEASE_GUIDE.md` | Release process |
| `settings/VERSION_UPDATE_GUIDE.md` | Version update checklist |
| `settings/LOCALIZATION_GUIDE.md` | Translation guidelines |
| `BIG_MOVE_4_0_0.md` | Migration documentation |

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
