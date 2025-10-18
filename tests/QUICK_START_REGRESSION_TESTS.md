# Quick Start - Regression Tests

## Run Tests

```bash
# All tests (recommended)
npm run test:e2e -- e2e/regression-core.spec.js

# Interactive UI mode
npm run test:e2e:ui -- e2e/regression-core.spec.js

# Debug specific test
npm run test:e2e:debug -- e2e/regression-core.spec.js -g "should render Every Query"
```

## What's Tested

✅ **Every Query** - Table rendering, sorting, time formats  
✅ **Analysis** - Aggregation, query patterns, counts  
✅ **Dashboard** - Charts, statistics  
✅ **Timeline** - Chart rendering  
✅ **Data Consistency** - Tab switching, reloads  
✅ **Search/Filter** - Input fields, filtering  
✅ **Baselines** - Consistent parsing from sample data

## Status

**16 core tests × 3 browsers = 48 total tests**  
✅ **100% passing** (execution time: ~60 seconds)

## Sample Data

Tests use:
- `sample/test_system_completed_requests.json`
- `sample/test_system_indexes.json`

## When Tests Fail

1. **Run in debug mode**: `npm run test:e2e:debug -- e2e/regression-core.spec.js`
2. **Check what changed**: Did you modify sorting/filtering/counting?
3. **Fix or update**: Fix bug OR update test if behavior intentionally changed
4. **Document**: Commit message should explain why test changed

## Adding New Tests

```javascript
test('my new test', async ({ page }) => {
  // 1. Navigate to tab
  await page.locator('#tabs a[href="#every-query"]').click();
  
  // 2. Wait for content
  const table = page.locator('#every-query table').first();
  await expect(table).toBeVisible({ timeout: 15000 });
  
  // 3. Perform action & assert
  const rowCount = await table.locator('tbody tr').count();
  expect(rowCount).toBeGreaterThan(0);
});
```

## Documentation

- **Quick Start**: You're reading it!
- **Full details**: [ISSUE_173_COMPLETE.md](./ISSUE_173_COMPLETE.md)
- **Implementation**: [REGRESSION_TESTING_SUMMARY.md](./REGRESSION_TESTING_SUMMARY.md)
- **Testing guide**: [REGRESSION_TESTING.md](./REGRESSION_TESTING.md)
- **Main test file**: [e2e/regression-core.spec.js](../e2e/regression-core.spec.js)

## Issue

Addresses: https://github.com/Fujio-Turner/cb_completed_request/issues/173
