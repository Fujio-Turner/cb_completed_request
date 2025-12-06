# Playwright E2E Tests

End-to-end tests for the Couchbase Query Analyzer using Playwright.

## Test Structure

The tests are organized by edition:

```
e2e/
├── *.spec.js           # Static Edition tests (v3.29.3) - /en/index.html
├── server/             # Server Edition tests (v4.0.0) - /app/
│   ├── index.spec.js           # Core UI tests
│   ├── regression-core.spec.js # Regression tests
│   ├── settings-modal.spec.js  # Couchbase settings modal
│   ├── ai-analyzer.spec.js     # AI Analyzer tab
│   ├── api-endpoints.spec.js   # Flask REST API tests
│   └── README.md               # Server edition test docs
└── README.md           # This file
```

## Running Tests

```bash
# Run ALL tests (both editions, all browsers)
npm run test:e2e

# Run Static Edition only (v3.29.3)
npm run test:e2e:static              # All browsers
npm run test:e2e:static:chromium     # Chromium only

# Run Server Edition only (v4.0.0)
npm run test:e2e:server              # All browsers
npm run test:e2e:server:chromium     # Chromium only

# Interactive/Debug modes
npm run test:e2e:ui                  # Interactive UI mode
npm run test:e2e:headed              # See browser while testing
npm run test:e2e:debug               # Debug mode

# View HTML report
npm run test:e2e:report
```

## Edition Comparison

| Feature | Static Edition | Server Edition |
|---------|---------------|----------------|
| Location | `/en/index.html` | `/app/` |
| Port | 8080 (http-server) | 5555 (Flask) |
| Settings Modal | ❌ | ✅ |
| AI Analyzer Tab | ❌ | ✅ |
| Couchbase Integration | ❌ | ✅ |
| REST API | ❌ | ✅ |
| Default Tab | Dashboard | AI Analyzer |

## Static Edition Tests

Tests for `/en/index.html`:
- **index.spec.js** - Page loading, tabs, JSON parsing
- **regression-core.spec.js** - Sorting, filtering, counting
- **query-groups-auto-populate.spec.js** - Query groups chart
- **issue-226-time-grouping-preserves-charts.spec.js** - Timeline/chart regression

## Server Edition Tests

Tests for Flask server at `http://localhost:5555`:
- **index.spec.js** - Core UI functionality
- **regression-core.spec.js** - Same regression tests adapted
- **settings-modal.spec.js** - Couchbase connection settings
- **ai-analyzer.spec.js** - AI-powered analysis tab
- **api-endpoints.spec.js** - REST API endpoint testing

## Prerequisites

### Static Edition
No prerequisites - uses `http-server` to serve static files.

### Server Edition
Requires Python virtual environment:
```bash
cd app
./setup_venv.sh
```

Playwright will start the Flask server automatically when running tests.

## Sample Data

Tests use sample JSON files from the `sample/` directory:
- `test_system_completed_requests.json` - Sample query data
- `test_system_indexes.json` - Sample index data

## Adding New Tests

1. For Static Edition: Create `.spec.js` in `e2e/`
2. For Server Edition: Create `.spec.js` in `e2e/server/`
3. Import test utilities: `const { test, expect } = require('@playwright/test');`
4. Use `test.describe()` to group related tests
5. Use `test.beforeEach()` for common setup

## CI/CD

Tests run automatically on:
- Push to main/master branch
- Pull requests to main/master branch

The CI pipeline runs both Static and Server Edition tests.
