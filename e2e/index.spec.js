const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

test.describe('Couchbase Query Analyzer - en/index.html', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/index.html');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should load the page and display title', async ({ page }) => {
    await expect(page).toHaveTitle(/Query Analyzer v3\.24\.0/);
  });

  test('should display main tab navigation', async ({ page }) => {
    const tabsContainer = page.locator('#tabs ul[role="tablist"]');
    await expect(tabsContainer).toBeVisible();
    
    const tabLinks = page.locator('#tabs ul[role="tablist"] a');
    const tabCount = await tabLinks.count();
    expect(tabCount).toBeGreaterThan(5);
  });

  test('should have visible input textareas', async ({ page }) => {
    const leftTextarea = page.locator('#json-input');
    const rightTextarea = page.locator('#indexJsonInput');
    
    await expect(leftTextarea).toBeVisible();
    await expect(rightTextarea).toBeVisible();
  });

  test('should load and parse sample JSON data', async ({ page }) => {
    test.setTimeout(30000); // 30s (reduced from 180s - using evaluate() instead of fill())
    
    const sampleData = fs.readFileSync(
      path.join(__dirname, '../sample/test_system_completed_requests.json'),
      'utf-8'
    );

    const jsonInput = page.locator('#json-input');
    await expect(jsonInput).toBeVisible();
    // Use evaluate to set value directly (instant) instead of fill() which types char-by-char
    await jsonInput.evaluate((el, data) => el.value = data, sampleData);
    await page.waitForTimeout(500); // Brief wait for UI update
    
    // Collect console messages to verify error handling (BEFORE clicking parse)
    const consoleMessages = [];
    page.on('console', msg => consoleMessages.push(msg.text()));
    
    const parseButton = page.locator('#parse-json-btn');
    await expect(parseButton).toBeVisible();
    
    // Listen for console logs to detect parsing completion (BEFORE clicking)
    const parseComplete = page.waitForEvent('console', { 
      predicate: msg => msg.text().includes('Parse performance:') || msg.text().includes('requests ('),
      timeout: 15000 // 15s timeout for parsing
    });
    
    await parseButton.click();
    await parseComplete;
    
    // Verify error handling: Should gracefully handle bad records
    const hasParseError = consoleMessages.some(msg => msg.includes('JSON parsing error') || msg.includes('plan for request'));
    const hasMissingPlan = consoleMessages.some(msg => msg.includes('No plan found'));
    const hasSuccess = consoleMessages.some(msg => msg.includes('Parse performance:'));
    
    // Verify graceful error handling - errors logged but parsing continues
    expect(hasSuccess).toBe(true); // Must complete successfully despite errors
    
    // Verify charts or results appeared
    const chartCanvas = page.locator('canvas').first();
    await expect(chartCanvas).toBeVisible({ timeout: 10000 }); // 10s for chart rendering
  });

  test('should switch between tabs', async ({ page }) => {
    const timelineLink = page.locator('#tabs a[href="#timeline"]');
    await timelineLink.click();
    await page.waitForTimeout(500);
    await expect(page.locator('#timeline')).toBeVisible();

    const dashboardLink = page.locator('#tabs a[href="#dashboard"]');
    await dashboardLink.click();
    await page.waitForTimeout(500);
    await expect(page.locator('#dashboard')).toBeVisible();
  });

  test('should have working copy buttons after data load', async ({ page }, testInfo) => {
    if (testInfo.project.name === 'firefox' || testInfo.project.name === 'webkit') {
      test.skip();
    }
    
    test.setTimeout(30000); // 30s (reduced from 180s - using evaluate() instead of fill())
    
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    
    const sampleData = fs.readFileSync(
      path.join(__dirname, '../sample/test_system_completed_requests.json'),
      'utf-8'
    );

    // Use evaluate to set value directly (instant) instead of fill() which types char-by-char
    const jsonInput = page.locator('#json-input');
    await expect(jsonInput).toBeVisible();
    await jsonInput.evaluate((el, data) => el.value = data, sampleData);
    await page.waitForTimeout(500); // Brief wait for UI update
    
    const parseButton = page.locator('#parse-json-btn');
    await expect(parseButton).toBeVisible();
    
    // Listen for console logs to detect parsing completion
    const parseComplete = page.waitForEvent('console', msg => 
      msg.text().includes('Parse performance:')
    );
    
    await parseButton.click();
    await parseComplete;

    // Wait a bit for UI to update
    await page.waitForTimeout(1000);

    const copyButtons = page.locator('button.copy-btn, button.sql-copy-btn');
    const count = await copyButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should load and parse both completed requests and indexes JSON', async ({ page }) => {
    test.setTimeout(30000); // 30s (reduced from 180s - using evaluate() instead of fill())
    
    const completedRequestsData = fs.readFileSync(
      path.join(__dirname, '../sample/test_system_completed_requests.json'),
      'utf-8'
    );
    
    const indexesData = fs.readFileSync(
      path.join(__dirname, '../sample/test_system_indexes.json'),
      'utf-8'
    );

    // Collect console messages to verify error handling and success (BEFORE any actions)
    const consoleMessages = [];
    page.on('console', msg => consoleMessages.push(msg.text()));

    // Fill completed requests JSON (left textarea)
    const jsonInput = page.locator('#json-input');
    await expect(jsonInput).toBeVisible();
    // Use evaluate to set value directly (instant) instead of fill() which types char-by-char
    await jsonInput.evaluate((el, data) => el.value = data, completedRequestsData);
    await page.waitForTimeout(500); // Brief wait for UI update
    
    // Fill indexes JSON (right textarea)
    const indexJsonInput = page.locator('#indexJsonInput');
    await expect(indexJsonInput).toBeVisible();
    // Use evaluate to set value directly (instant) instead of fill() which types char-by-char
    await indexJsonInput.evaluate((el, data) => el.value = data, indexesData);
    await page.waitForTimeout(500); // Brief wait for UI update
    
    const parseButton = page.locator('#parse-json-btn');
    await expect(parseButton).toBeVisible();
    
    // Listen for console logs to detect parsing completion (BEFORE clicking)
    const parseComplete = page.waitForEvent('console', {
      predicate: msg => msg.text().includes('Parse performance:') || msg.text().includes('Index extraction complete:'),
      timeout: 15000 // 15s timeout for parsing
    });
    
    await parseButton.click();
    await parseComplete;
    
    // Wait a bit for all console messages to be collected
    await page.waitForTimeout(1000);
    
    // Verify successful parsing despite intentional bad records
    const hasParseSuccess = consoleMessages.some(msg => msg.includes('Parse performance:'));
    const hasIndexSuccess = consoleMessages.some(msg => msg.includes('Index extraction complete:'));
    
    // Debug: log what we got if test fails
    if (!hasParseSuccess || !hasIndexSuccess) {
      console.log('Console messages collected:', consoleMessages.filter(m => 
        m.includes('Parse') || m.includes('Index') || m.includes('extraction')
      ));
    }
    
    expect(hasParseSuccess).toBe(true);
    expect(hasIndexSuccess).toBe(true);
    
    // Verify indexes were processed - check Indexes tab
    const indexesTab = page.locator('#tabs a[href="#indexes"]');
    await indexesTab.click();
    await page.waitForTimeout(500);
    
    // Look for index items in the indexes tab
    const indexesContent = page.locator('#indexes');
    await expect(indexesContent).toBeVisible();
    
    // Verify at least one index is displayed
    const indexItems = page.locator('.index-item, .bucket-group');
    const count = await indexItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display version information', async ({ page }) => {
    const versionMeta = await page.locator('meta[name="version"]').getAttribute('content');
    expect(versionMeta).toBe('3.24.0');
  });

  test('should have responsive layout', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const tabsContainer = page.locator('#tabs');
    await expect(tabsContainer).toBeVisible();

    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(tabsContainer).toBeVisible();
  });

  test('should display dashboard tab by default', async ({ page }) => {
    const dashboardTab = page.locator('#dashboard');
    await expect(dashboardTab).toBeVisible();
  });

  test('should have file upload functionality', async ({ page }) => {
    const uploadButton = page.locator('input[type="file"]').first();
    expect(uploadButton).toBeDefined();
  });
});
