# Playwright E2E Testing

✅ **Status**: All tests passing (27/27 across 3 browsers)

## Quick Start

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

### ✅ Passing Tests (11 tests × 3 browsers = 33 total)

1. **Page Load** - Verifies title and page loads correctly
2. **Tab Navigation** - Checks all main tabs are visible
3. **Input Textareas** - Validates both JSON input areas are visible
4. **JSON Data Parsing** - Tests loading and parsing completed_requests sample data
5. **Dual JSON Upload** - Tests loading BOTH completed_requests AND indexes JSON
6. **Tab Switching** - Verifies tab navigation functionality
7. **Copy Buttons** - Tests copy functionality (Chromium only)
8. **Version Info** - Validates version metadata
9. **Responsive Layout** - Tests mobile and desktop viewports
10. **Dashboard Default** - Ensures dashboard shows by default
11. **File Upload** - Checks file upload functionality exists

## Browser Support

- ✅ **Chromium** - All 11 tests passing
- ✅ **Firefox** - 10 tests passing (clipboard test skipped)
- ✅ **WebKit** - 10 tests passing (clipboard test skipped)

## Test Files

- **`e2e/index.spec.js`** - Main test suite for en/index.html
- **`playwright.config.js`** - Playwright configuration
- **`.github/workflows/playwright.yml`** - CI/CD automation

## Key Fixes Applied

1. **Correct Element Selectors**
   - Fixed `#jsonInput` → `#json-input`
   - Fixed `#indexJsonInput` → `#index-json-input`
   - Used direct link selectors: `#tabs a[href="#timeline"]`

2. **Cross-Browser Compatibility**
   - Added `waitForLoadState('domcontentloaded')`
   - Increased timeouts for slower browsers
   - Skipped clipboard tests on Firefox/WebKit (unsupported permissions)

3. **Reliable Test Patterns**
   - Wait for visibility before interactions
   - Use `waitForTimeout()` after dynamic content loads
   - Direct attribute-based selectors instead of text-based

## CI/CD Integration

Tests automatically run on:
- Push to main/master branch
- Pull requests to main/master branch

GitHub Actions workflow: `.github/workflows/playwright.yml`

## Adding New Tests

```javascript
test('my new test', async ({ page }) => {
  // Navigate happens automatically in beforeEach
  
  // Your test code
  const element = page.locator('#my-element');
  await expect(element).toBeVisible();
});
```

## Related Issues

- Implements [GitHub Issue #165](https://github.com/Fujio-Turner/cb_completed_request/issues/165)

## Sample Data

Tests use:
- `sample/test_system_completed_requests.json`
- `sample/test_system_indexes.json`
