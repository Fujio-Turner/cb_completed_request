# Regression Testing Guide

## Overview

This project uses Playwright for end-to-end regression testing to ensure that changes to sorting, filtering, and counting functions don't break existing functionality.

## Test Files

- **`e2e/regression.spec.js`** - Comprehensive regression tests for core functionality
- **`e2e/index.spec.js`** - General smoke tests

## What We Test

### 1. **Sorting Functions**
- Table sorting (ascending/descending)
- Column sort indicators
- Sort persistence across pages
- Time parsing and sorting
- Numeric sorting
- Chronological sorting

### 2. **Filtering Functions**
- System query filtering
- SQL text filtering
- Filter effects on table row counts
- Filter preservation across tabs

### 3. **Counting & Aggregation**
- Query pattern aggregation
- Total request counts
- Operation counts
- Duration statistics
- Percentile calculations

### 4. **Data Integrity**
- Consistent data after multiple sorts
- Data preservation when switching tabs
- Edge case handling in time parsing

### 5. **Baseline Snapshots**
- Consistent sort orders
- Expected aggregation outputs
- Known good outputs from sample data

## Sample Data

All tests use standardized sample data:
- **`sample/test_system_completed_requests.json`** - Completed requests data
- **`sample/test_system_indexes.json`** - Index data

These files provide consistent baseline for regression testing.

## Running Tests

```bash
# Run all regression tests
npm run test:e2e -- e2e/regression.spec.js

# Run with UI for debugging
npm run test:e2e:ui -- e2e/regression.spec.js

# Run in headed mode (see browser)
npm run test:e2e:headed -- e2e/regression.spec.js

# Run specific test
npm run test:e2e -- e2e/regression.spec.js -g "should sort by elapsed time"

# Run only chromium browser
npm run test:e2e -- e2e/regression.spec.js --project=chromium
```

## Test Structure

Each test follows this pattern:

```javascript
test('descriptive name', async ({ page }) => {
  // 1. Navigate to relevant tab
  await page.locator('#tabs a[href="#every-query"]').click();
  
  // 2. Wait for table to render
  await expect(page.locator('#every-query-table tbody tr').first()).toBeVisible();
  
  // 3. Perform action (sort, filter, etc.)
  await page.locator('#every-query-table-header th:nth-child(2)').click();
  
  // 4. Assert expected behavior
  const result = await page.locator('...').textContent();
  expect(result).toContain('expected value');
});
```

## When to Update Tests

### ✅ **Update tests when:**
- Adding new sorting/filtering functionality
- Changing how data is aggregated or counted
- Modifying table rendering logic
- Adding new columns to tables
- Changing default sort orders

### ⚠️ **Test failures may indicate:**
- Regression in existing functionality
- Breaking changes to core functions
- Changes to HTML structure (update selectors)
- Sample data has changed

### 🔧 **Fixing failing tests:**

1. **Verify the change is intentional**
   - Did you modify sorting/filtering/counting logic?
   - Is the new behavior correct?

2. **Run test locally to debug**
   ```bash
   npm run test:e2e:debug -- e2e/regression.spec.js -g "failing test name"
   ```

3. **Check HTML structure**
   - Did table IDs or classes change?
   - Update selectors in test if needed

4. **Update baseline snapshots**
   - If new behavior is correct, update assertions
   - Document why the baseline changed

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Push to main branch
- GitHub Actions workflow

See `.github/workflows/` for configuration.

## Best Practices

1. **Always use sample data** - Don't hardcode values
2. **Wait for elements** - Use `await expect().toBeVisible()` before interactions
3. **Test across browsers** - All tests run on Chromium, Firefox, and WebKit
4. **Keep tests fast** - Use `test.setTimeout()` only when needed
5. **Make tests resilient** - Don't rely on exact text matches for dynamic content
6. **Document changes** - Update this guide when adding new test categories

## Debugging Failed Tests

```bash
# View last test report
npm run test:e2e:report

# Run in debug mode
npm run test:e2e:debug -- e2e/regression.spec.js

# Take screenshots on failure (automatic)
# Check: test-results/[test-name]/test-failed-*.png
```

## Test Coverage

Current coverage includes:

- ✅ Every Query table sorting (6+ tests)
- ✅ Analysis table sorting (3+ tests)
- ✅ Filtering functions (3+ tests)
- ✅ Counting/aggregation (4+ tests)
- ✅ Data integrity (3+ tests)
- ✅ Baseline snapshots (2+ tests)

**Total: 25+ regression tests**

## Related Files

- [PLAYWRIGHT_TESTING.md](./PLAYWRIGHT_TESTING.md) - General Playwright documentation
- [settings/TESTING_WORKFLOW.md](../settings/TESTING_WORKFLOW.md) - Testing workflow guide
- [playwright.config.js](../playwright.config.js) - Playwright configuration
- [e2e/regression-core.spec.js](../e2e/regression-core.spec.js) - Main regression test file

## Issue Reference

This testing approach addresses:
- **Issue #173** - Regression Tests for Filter and Chart Functions

## Contributing

When adding new features:

1. Write regression tests FIRST (TDD approach)
2. Ensure tests fail without your changes
3. Implement feature
4. Verify tests pass
5. Update this documentation

---

**Last Updated:** 2025-10-18  
**Maintainer:** See AGENT.md for project details
