const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

/**
 * Regression Test for Issue #226
 * 
 * Problem: Changing time grouping in Timeline tab destroys Dashboard and Analysis charts
 * 
 * This test verifies that:
 * 1. Dashboard charts remain visible after changing Timeline time grouping
 * 2. Analysis (Query Groups) charts remain visible after changing Timeline time grouping
 * 3. Only Timeline charts are regenerated
 * 4. No duplicate chart creation occurs
 */

test.describe('Issue #226: Time Grouping Preserves Dashboard and Analysis Charts', () => {
  let completedRequestsData;

  test.beforeAll(() => {
    completedRequestsData = fs.readFileSync(
      path.join(__dirname, '../sample/test_system_completed_requests.json'),
      'utf-8'
    );
  });

  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    
    // Enable debug mode to capture console logs
    await page.goto('/en/index.html?debug=true');
    await page.waitForLoadState('domcontentloaded');
    
    // Load sample data
    const jsonInput = page.locator('#json-input');
    await expect(jsonInput).toBeVisible();
    await jsonInput.evaluate((el, data) => el.value = data, completedRequestsData);
    await page.waitForTimeout(500);
    
    // Parse data
    const parseButton = page.locator('#parse-json-btn');
    const parseComplete = page.waitForEvent('console', {
      predicate: msg => msg.text().includes('Parse performance:'),
      timeout: 15000
    });
    
    await parseButton.click({ force: true });
    await parseComplete;
    await page.waitForTimeout(2000);
  });

  test('should preserve Dashboard charts when changing Timeline time grouping', async ({ page }) => {
    // Step 1: Navigate to Dashboard tab and verify charts exist
    await page.locator('#tabs a[href="#dashboard"]').click({ force: true });
    await page.waitForTimeout(2000);
    
    // Dashboard chart canvas elements
    const primaryScanChart = page.locator('#primary-scan-chart');
    const stateChart = page.locator('#state-chart');
    const statementTypeChart = page.locator('#statement-type-chart');
    
    // Verify chart canvas elements exist in DOM and have dimensions
    const primaryScanWidthBefore = await primaryScanChart.evaluate(el => el.width);
    const stateWidthBefore = await stateChart.evaluate(el => el.width);
    
    expect(primaryScanWidthBefore).toBeGreaterThan(0);
    expect(stateWidthBefore).toBeGreaterThan(0);
    
    // Step 2: Navigate to Timeline tab
    await page.locator('#tabs a[href="#timeline"]').click({ force: true });
    await page.waitForTimeout(1000);
    
    // Step 3: Change time grouping
    const timeGroupingSelect = page.locator('#time-grouping-select');
    const currentValue = await timeGroupingSelect.inputValue();
    const newValue = currentValue === 'optimizer' ? '5min' : 'optimizer';
    await timeGroupingSelect.selectOption(newValue, { force: true }, { force: true });
    
    // Wait for charts to regenerate
    await page.waitForTimeout(2500);
    
    // Step 4: Verify Dashboard chart canvas elements STILL exist in DOM (not destroyed)
    // Note: We don't navigate back to Dashboard tab to avoid triggering lazy load
    const primaryScanWidthAfter = await primaryScanChart.evaluate(el => el.width);
    const stateWidthAfter = await stateChart.evaluate(el => el.width);
    
    // Charts should still have dimensions (not destroyed)
    expect(primaryScanWidthAfter).toBeGreaterThan(0);
    expect(stateWidthAfter).toBeGreaterThan(0);
    
    // Dimensions should be the same (charts weren't destroyed and recreated)
    expect(primaryScanWidthAfter).toBe(primaryScanWidthBefore);
    expect(stateWidthAfter).toBe(stateWidthBefore);
  });

  test('should preserve Analysis chart when changing Timeline time grouping', async ({ page }) => {
    // Step 1: Navigate to Analysis tab and verify chart exists
    await page.locator('#tabs a[href="#analysis"]').click({ force: true });
    await page.waitForTimeout(3000); // Wait for Analysis tab to lazy load
    
    // Analysis chart canvas element
    const queryGroupPhaseTimesChart = page.locator('#query-group-phase-times-chart');
    
    // Verify chart canvas exists and has dimensions
    const chartWidthBefore = await queryGroupPhaseTimesChart.evaluate(el => el.width);
    expect(chartWidthBefore).toBeGreaterThan(0);
    
    // Step 2: Navigate to Timeline tab
    await page.locator('#tabs a[href="#timeline"]').click({ force: true });
    await page.waitForTimeout(1000);
    
    // Step 3: Change time grouping
    const timeGroupingSelect = page.locator('#time-grouping-select');
    const currentValue = await timeGroupingSelect.inputValue();
    const newValue = currentValue === 'optimizer' ? 'hour' : 'optimizer';
    await timeGroupingSelect.selectOption(newValue, { force: true }, { force: true });
    await page.waitForTimeout(2500);
    
    // Step 4: Verify Analysis chart canvas STILL exists in DOM (not destroyed)
    // Note: We don't navigate back to avoid triggering lazy load
    const chartWidthAfter = await queryGroupPhaseTimesChart.evaluate(el => el.width);
    expect(chartWidthAfter).toBeGreaterThan(0);
    expect(chartWidthAfter).toBe(chartWidthBefore);
  });

  test('should only regenerate Timeline charts when time grouping changes', async ({ page }) => {
    // Capture console logs BEFORE navigation
    const consoleLogs = [];
    page.on('console', msg => {
      if (msg.text().includes('📊 Chart created') || msg.text().includes('🧹 Destroyed')) {
        consoleLogs.push(msg.text());
      }
    });
    
    // Navigate to Timeline tab
    await page.locator('#tabs a[href="#timeline"]').click({ force: true });
    await page.waitForTimeout(1000);
    
    // Clear logs from initial load
    consoleLogs.length = 0;
    
    // Change time grouping
    const timeGroupingSelect = page.locator('#time-grouping-select');
    await timeGroupingSelect.selectOption('day', { force: true });
    
    // Wait for regeneration
    await page.waitForTimeout(3000);
    
    // Verify destroy message shows only timeline charts destroyed
    const destroyMessages = consoleLogs.filter(log => log.includes('🧹 Destroyed'));
    expect(destroyMessages.length).toBeGreaterThan(0);
    
    // Verify the destroy count is reasonable (should be ~8-17 timeline charts, not 20+ all charts)
    const destroyMessage = destroyMessages[0];
    const destroyMatch = destroyMessage.match(/Destroyed (\d+)/);
    if (destroyMatch) {
      const destroyedCount = parseInt(destroyMatch[1]);
      // Should destroy timeline charts only (not all charts including Dashboard/Analysis)
      expect(destroyedCount).toBeLessThan(20);
      expect(destroyedCount).toBeGreaterThan(0);
    }
  });

  test('should not create duplicate charts when changing time grouping', async ({ page }) => {
    // Capture chart creation logs BEFORE navigation
    const chartCreationLogs = [];
    page.on('console', msg => {
      if (msg.text().includes('📊 Chart created')) {
        chartCreationLogs.push(msg.text());
      }
    });
    
    // Navigate to Timeline tab
    await page.locator('#tabs a[href="#timeline"]').click({ force: true });
    await page.waitForTimeout(1000);
    
    // Clear existing logs from initial load
    chartCreationLogs.length = 0;
    
    // Change time grouping
    const timeGroupingSelect = page.locator('#time-grouping-select');
    await timeGroupingSelect.selectOption('5min', { force: true });
    
    // Wait for regeneration to complete
    await page.waitForTimeout(3000);
    
    // Count how many times each chart type was created
    const queryTypesCreations = chartCreationLogs.filter(log => log.includes('Query Types')).length;
    const durationBucketsCreations = chartCreationLogs.filter(log => log.includes('Duration Buckets')).length;
    
    // Each chart should be created only ONCE per time grouping change
    // Allow up to 2 (one from each lazy load completion) but not 3+
    expect(queryTypesCreations).toBeLessThanOrEqual(2);
    expect(durationBucketsCreations).toBeLessThanOrEqual(2);
    
    // Verify charts were actually created (not 0)
    expect(queryTypesCreations).toBeGreaterThan(0);
    expect(durationBucketsCreations).toBeGreaterThan(0);
  });

  test('should handle rapid time grouping changes without errors', async ({ page }) => {
    // Navigate to Timeline tab
    await page.locator('#tabs a[href="#timeline"]').click({ force: true });
    await page.waitForTimeout(1000);
    
    // Track console errors
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Rapidly change time grouping multiple times
    const timeGroupingSelect = page.locator('#time-grouping-select');
    
    await timeGroupingSelect.selectOption('5min', { force: true });
    await page.waitForTimeout(300);
    
    await timeGroupingSelect.selectOption('hour', { force: true });
    await page.waitForTimeout(300);
    
    await timeGroupingSelect.selectOption('day', { force: true });
    await page.waitForTimeout(300);
    
    await timeGroupingSelect.selectOption('optimizer', { force: true });
    await page.waitForTimeout(2000);
    
    // Should not have race condition errors like "chartTasks.shift() is undefined"
    const raceConditionErrors = errors.filter(err => 
      err.includes('chartTasks.shift()') || 
      err.includes('undefined')
    );
    
    expect(raceConditionErrors.length).toBe(0);
    
    // Timeline charts should still be visible and functional
    const timelineChart = page.locator('#timeline-chart');
    await expect(timelineChart).toBeVisible({ timeout: 5000 });
  });
});
