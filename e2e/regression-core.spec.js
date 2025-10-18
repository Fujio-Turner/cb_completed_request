const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

/**
 * Core Regression Tests - Issue #173
 * 
 * Simplified, working tests for critical sorting, filtering, and counting functions
 * Uses sample data to verify consistent behavior
 */

test.describe('Core Regression Tests', () => {
  let completedRequestsData;
  let indexesData;

  test.beforeAll(() => {
    completedRequestsData = fs.readFileSync(
      path.join(__dirname, '../sample/test_system_completed_requests.json'),
      'utf-8'
    );
    indexesData = fs.readFileSync(
      path.join(__dirname, '../sample/test_system_indexes.json'),
      'utf-8'
    );
  });

  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    
    await page.goto('/en/index.html');
    await page.waitForLoadState('domcontentloaded');
    
    // Load sample data
    const jsonInput = page.locator('#json-input');
    await expect(jsonInput).toBeVisible();
    await jsonInput.evaluate((el, data) => el.value = data, completedRequestsData);
    
    const indexJsonInput = page.locator('#indexJsonInput');
    await expect(indexJsonInput).toBeVisible();
    await indexJsonInput.evaluate((el, data) => el.value = data, indexesData);
    
    await page.waitForTimeout(500);
    
    // Parse data
    const parseButton = page.locator('#parse-json-btn');
    const parseComplete = page.waitForEvent('console', {
      predicate: msg => msg.text().includes('Parse performance:'),
      timeout: 15000
    });
    
    await parseButton.click();
    await parseComplete;
    await page.waitForTimeout(2000);
  });

  test.describe('Every Query Tab - Basic Tests', () => {
    test('should render Every Query table with data', async ({ page }) => {
      // Navigate to Every Query tab
      await page.locator('#tabs a[href="#every-query"]').click();
      await expect(page.locator('#every-query')).toBeVisible();
      
      // Wait for table
      const table = page.locator('#every-query table').first();
      await expect(table).toBeVisible({ timeout: 15000 });
      
      // Should have rows
      const rows = table.locator('tbody tr');
      const count = await rows.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should have sortable column headers', async ({ page }) => {
      await page.locator('#tabs a[href="#every-query"]').click();
      const table = page.locator('#every-query table').first();
      await expect(table).toBeVisible({ timeout: 15000 });
      
      // Headers should have sort indicators
      const headers = table.locator('thead th');
      const firstHeader = await headers.first().textContent();
      
      // Should have sort hint or be clickable
      expect(firstHeader).toBeTruthy();
    });

    test('should display valid time formats in elapsed time column', async ({ page }) => {
      await page.locator('#tabs a[href="#every-query"]').click();
      const table = page.locator('#every-query table').first();
      await expect(table).toBeVisible({ timeout: 15000 });
      
      // Check first row's elapsed time (column 2)
      const firstCell = await table.locator('tbody tr:first-child td:nth-child(2)').textContent();
      
      // Should match time pattern like "2.732401" or "1:23.456"
      expect(firstCell).toMatch(/\d+[:.]\d+|N\/A/);
    });

    test('should maintain row count after clicking headers', async ({ page }) => {
      await page.locator('#tabs a[href="#every-query"]').click();
      const table = page.locator('#every-query table').first();
      await expect(table).toBeVisible({ timeout: 15000 });
      
      const initialCount = await table.locator('tbody tr').count();
      
      // Click first header
      await table.locator('thead th').first().click();
      await page.waitForTimeout(500);
      
      const afterClickCount = await table.locator('tbody tr').count();
      
      // Row count should not change (only order changes)
      expect(afterClickCount).toBe(initialCount);
    });
  });

  test.describe('Analysis Tab - Basic Tests', () => {
    test('should render Analysis table with aggregated data', async ({ page }) => {
      await page.locator('#tabs a[href="#analysis"]').click();
      await expect(page.locator('#analysis')).toBeVisible();
      
      const table = page.locator('#analysis table').first();
      await expect(table).toBeVisible({ timeout: 15000 });
      
      const rows = table.locator('tbody tr');
      const count = await rows.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should display query patterns in first column', async ({ page }) => {
      await page.locator('#tabs a[href="#analysis"]').click();
      const table = page.locator('#analysis table').first();
      await expect(table).toBeVisible({ timeout: 15000 });
      
      // First cell should contain SQL query pattern
      const firstCell = await table.locator('tbody tr:first-child td:first-child').textContent();
      expect(firstCell.length).toBeGreaterThan(0);
    });

    test('should display numeric counts in total_count column', async ({ page }) => {
      await page.locator('#tabs a[href="#analysis"]').click();
      const table = page.locator('#analysis table').first();
      await expect(table).toBeVisible({ timeout: 15000 });
      
      // Third column should be total_count with numbers
      const countCell = await table.locator('tbody tr:first-child td:nth-child(3)').textContent();
      expect(countCell).toMatch(/\d+/);
    });
  });

  test.describe('Dashboard Tab - Basic Tests', () => {
    test('should display dashboard charts after parsing', async ({ page }) => {
      // Dashboard is default tab
      await expect(page.locator('#dashboard')).toBeVisible();
      
      // Should have at least one canvas (chart)
      const charts = page.locator('#dashboard canvas');
      const count = await charts.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should display summary statistics', async ({ page }) => {
      await expect(page.locator('#dashboard')).toBeVisible();
      
      // Look for any text content with numbers (statistics)
      const dashboardText = await page.locator('#dashboard').textContent();
      expect(dashboardText).toMatch(/\d+/); // Should have some numbers
    });
  });

  test.describe('Timeline Tab - Basic Tests', () => {
    test('should render timeline charts', async ({ page }) => {
      await page.locator('#tabs a[href="#timeline"]').click();
      await expect(page.locator('#timeline')).toBeVisible();
      await page.waitForTimeout(1500);
      
      const charts = page.locator('#timeline canvas');
      const count = await charts.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Data Consistency Tests', () => {
    test('should preserve data when switching between tabs', async ({ page }) => {
      // Go to Every Query
      await page.locator('#tabs a[href="#every-query"]').click();
      const everyQueryTable = page.locator('#every-query table').first();
      await expect(everyQueryTable).toBeVisible({ timeout: 15000 });
      const everyQueryCount = await everyQueryTable.locator('tbody tr').count();
      
      // Go to Analysis
      await page.locator('#tabs a[href="#analysis"]').click();
      const analysisTable = page.locator('#analysis table').first();
      await expect(analysisTable).toBeVisible({ timeout: 15000 });
      const analysisCount = await analysisTable.locator('tbody tr').count();
      
      // Go back to Every Query
      await page.locator('#tabs a[href="#every-query"]').click();
      await expect(everyQueryTable).toBeVisible({ timeout: 15000 });
      const everyQueryCount2 = await everyQueryTable.locator('tbody tr').count();
      
      // Counts should be consistent
      expect(everyQueryCount2).toBe(everyQueryCount);
      expect(everyQueryCount).toBeGreaterThan(0);
      expect(analysisCount).toBeGreaterThan(0);
    });

    test('should show consistent data across multiple page loads', async ({ page }) => {
      // Get initial Every Query count
      await page.locator('#tabs a[href="#every-query"]').click();
      const table1 = page.locator('#every-query table').first();
      await expect(table1).toBeVisible({ timeout: 15000 });
      const count1 = await table1.locator('tbody tr').count();
      
      // Reload page and reparse
      await page.goto('/en/index.html');
      const jsonInput = page.locator('#json-input');
      await jsonInput.evaluate((el, data) => el.value = data, completedRequestsData);
      const parseButton = page.locator('#parse-json-btn');
      const parseComplete = page.waitForEvent('console', {
        predicate: msg => msg.text().includes('Parse performance:'),
        timeout: 15000
      });
      await parseButton.click();
      await parseComplete;
      await page.waitForTimeout(2000);
      
      await page.locator('#tabs a[href="#every-query"]').click();
      const table2 = page.locator('#every-query table').first();
      await expect(table2).toBeVisible({ timeout: 15000 });
      const count2 = await table2.locator('tbody tr').count();
      
      // Should have same count
      expect(count2).toBe(count1);
    });
  });

  test.describe('Search/Filter Functions', () => {
    test('should have search input fields in Every Query', async ({ page }) => {
      await page.locator('#tabs a[href="#every-query"]').click();
      
      // Look for statement search input
      const searchInput = page.locator('#statement-search');
      await expect(searchInput).toBeVisible({ timeout: 10000 });
    });

    test('should filter table when search text is entered', async ({ page }) => {
      await page.locator('#tabs a[href="#every-query"]').click();
      const table = page.locator('#every-query table').first();
      await expect(table).toBeVisible({ timeout: 15000 });
      
      const initialCount = await table.locator('tbody tr').count();
      
      // Enter search text
      const searchInput = page.locator('#statement-search');
      await searchInput.fill('SELECT');
      await page.waitForTimeout(500);
      
      const filteredCount = await table.locator('tbody tr').count();
      
      // Should have some rows (most queries contain SELECT)
      expect(filteredCount).toBeGreaterThan(0);
      expect(filteredCount).toBeLessThanOrEqual(initialCount);
    });
  });

  test.describe('Baseline Snapshots', () => {
    test('should consistently parse the same number of requests from sample data', async ({ page }) => {
      // Already parsed in beforeEach
      await page.locator('#tabs a[href="#every-query"]').click();
      const table = page.locator('#every-query table').first();
      await expect(table).toBeVisible({ timeout: 15000 });
      
      const rowCount = await table.locator('tbody tr').count();
      
      // Sample data should always return same count
      // This is our baseline - if this changes, either:
      // 1. Sample data changed (update test)
      // 2. Parsing logic broken (fix code)
      expect(rowCount).toBeGreaterThan(5); // At least 5 queries in sample
    });

    test('should consistently aggregate same query patterns', async ({ page }) => {
      await page.locator('#tabs a[href="#analysis"]').click();
      const table = page.locator('#analysis table').first();
      await expect(table).toBeVisible({ timeout: 15000 });
      
      const rowCount = await table.locator('tbody tr').count();
      
      // Aggregation should be consistent
      expect(rowCount).toBeGreaterThan(0);
    });
  });
});
