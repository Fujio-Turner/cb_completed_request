# Server Edition E2E Tests

End-to-end tests for the **Server Edition (v4.0.0)** of Couchbase Query Analyzer.

## Overview

These tests run against the Flask server at `http://localhost:5555` and test:
- Core UI functionality (shared with Static Edition)
- Settings modal and Couchbase connection
- AI Analyzer tab
- REST API endpoints
- Server-specific features

## Prerequisites

1. **Python virtual environment** set up in `/app`:
   ```bash
   cd app
   ./setup_venv.sh
   ```

2. **Flask server running** (or let Playwright start it):
   ```bash
   cd app && source venv/bin/activate && python app.py
   ```

## Running Tests

```bash
# Run all server edition tests (all browsers)
npm run test:e2e:server

# Run server tests on Chromium only
npm run test:e2e -- --project=server-chromium

# Run specific test file
npm run test:e2e -- --project=server-chromium e2e/server/ai-analyzer.spec.js

# Run in headed mode (see browser)
npm run test:e2e:server -- --headed

# Run in debug mode
npm run test:e2e:server -- --debug
```

## Test Files

| File | Description |
|------|-------------|
| `index.spec.js` | Core UI tests (adapted from static edition) |
| `regression-core.spec.js` | Regression tests for sorting, filtering, counting |
| `settings-modal.spec.js` | Couchbase connection settings modal |
| `ai-analyzer.spec.js` | AI Analyzer tab functionality |
| `api-endpoints.spec.js` | Flask REST API endpoint tests |

## Notes

- **Couchbase Connection**: Most API tests expect Couchbase to NOT be connected (testing error handling)
- **AI API Tests**: Test validation and error handling without actual API keys
- **Flask Server**: Playwright will start the Flask server automatically if not running

## Comparison with Static Edition

| Feature | Static Edition | Server Edition |
|---------|---------------|----------------|
| Location | `/en/index.html` | `/app/` |
| Port | 8080 (http-server) | 5555 (Flask) |
| Settings Modal | ❌ | ✅ |
| AI Analyzer | ❌ | ✅ |
| Couchbase Integration | ❌ | ✅ |
| Core Parsing/Charts | ✅ | ✅ |
