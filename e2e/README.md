# Playwright E2E Tests

End-to-end tests for the Couchbase Query Analyzer using Playwright.

## Running Tests

```bash
# Run all tests
npm run test:e2e

# Run tests in UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug tests
npm run test:e2e:debug

# View HTML report
npm run test:e2e:report
```

## Test Coverage

### index.spec.js
Tests for `en/index.html` covering:
- Page loading and title display
- Tab visibility and navigation
- Initial state before data load
- JSON data parsing with sample completed_requests data
- Index JSON upload and parsing (both textareas)
- Copy button functionality
- Version information
- Responsive layout
- Dashboard display
- File upload functionality

## Adding New Tests

1. Create a new `.spec.js` file in the `e2e/` directory
2. Import test utilities: `const { test, expect } = require('@playwright/test');`
3. Use `test.describe()` to group related tests
4. Use `test.beforeEach()` for common setup
5. Write assertions using `expect()`

## Sample Data

Tests use sample JSON files from the `sample/` directory:
- `test_system_completed_requests.json` - Sample query data
- `test_system_indexes.json` - Sample index data

## CI/CD

Tests run automatically on:
- Push to main/master branch
- Pull requests to main/master branch

See `.github/workflows/playwright.yml` for configuration.
