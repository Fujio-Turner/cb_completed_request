const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

/**
 * Server Edition - Core Regression Tests
 * 
 * Adapted from static edition regression tests
 * Tests critical sorting, filtering, and counting functions
 */

test.describe('Server Edition - Core Regression Tests', () => {
  let completedRequestsData;
  let indexesData;

  test.beforeAll(() => {
    completedRequestsData = fs.readFileSync(
      path.join(__dirname, '../../../sample/test_system_completed_requests.json'),
      'utf-8'
    );
    indexesData = fs.readFileSync(
      path.join(__dirname, '../../../sample/test_system_indexes.json'),
      'utf-8'
    );
  });

  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    
    await page.goto('/');
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

  test.describe('Every Query Tab', () => {
    test('should render Every Query table with data', async ({ page }) => {
      await page.locator('#tabs a[href="#every-query"]').click();
      await expect(page.locator('#every-query')).toBeVisible();
      
      const table = page.locator('#every-query table').first();
      await expect(table).toBeVisible({ timeout: 15000 });
      
      const rows = table.locator('tbody tr');
      const count = await rows.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should have sortable column headers', async ({ page }) => {
      await page.locator('#tabs a[href="#every-query"]').click();
      const table = page.locator('#every-query table').first();
      await expect(table).toBeVisible({ timeout: 15000 });
      
      const headers = table.locator('thead th');
      const firstHeader = await headers.first().textContent();
      expect(firstHeader).toBeTruthy();
    });

    test('should maintain row count after clicking headers', async ({ page }) => {
      await page.locator('#tabs a[href="#every-query"]').click();
      const table = page.locator('#every-query table').first();
      await expect(table).toBeVisible({ timeout: 15000 });
      
      const initialCount = await table.locator('tbody tr').count();
      
      await table.locator('thead th').first().click();
      await page.waitForTimeout(500);
      
      const afterClickCount = await table.locator('tbody tr').count();
      expect(afterClickCount).toBe(initialCount);
    });
  });

  test.describe('Analysis Tab', () => {
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
      
      const firstCell = await table.locator('tbody tr:first-child td:first-child').textContent();
      expect(firstCell.length).toBeGreaterThan(0);
    });
  });

  test.describe('Dashboard Tab', () => {
    test('should display dashboard charts after parsing', async ({ page }) => {
      // Server Edition has AI Analyzer as default tab, need to navigate to Dashboard
      await page.locator('#tabs a[href="#dashboard"]').click();
      await page.waitForTimeout(1000);
      
      await expect(page.locator('#dashboard')).toBeVisible();
      
      const charts = page.locator('#dashboard canvas');
      const count = await charts.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should display summary statistics', async ({ page }) => {
      // Server Edition has AI Analyzer as default tab, need to navigate to Dashboard
      await page.locator('#tabs a[href="#dashboard"]').click();
      await page.waitForTimeout(1000);
      
      await expect(page.locator('#dashboard')).toBeVisible();
      
      const dashboardText = await page.locator('#dashboard').textContent();
      expect(dashboardText).toMatch(/\d+/);
    });
  });

  test.describe('Timeline Tab', () => {
    test('should render timeline charts', async ({ page }) => {
      await page.locator('#tabs a[href="#timeline"]').click();
      await expect(page.locator('#timeline')).toBeVisible();
      await page.waitForTimeout(1500);
      
      const charts = page.locator('#timeline canvas');
      const count = await charts.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Data Consistency', () => {
    test('should preserve data when switching between tabs', async ({ page }) => {
      await page.locator('#tabs a[href="#every-query"]').click();
      const everyQueryTable = page.locator('#every-query table').first();
      await expect(everyQueryTable).toBeVisible({ timeout: 15000 });
      const everyQueryCount = await everyQueryTable.locator('tbody tr').count();
      
      await page.locator('#tabs a[href="#analysis"]').click();
      const analysisTable = page.locator('#analysis table').first();
      await expect(analysisTable).toBeVisible({ timeout: 15000 });
      const analysisCount = await analysisTable.locator('tbody tr').count();
      
      await page.locator('#tabs a[href="#every-query"]').click();
      await expect(everyQueryTable).toBeVisible({ timeout: 15000 });
      const everyQueryCount2 = await everyQueryTable.locator('tbody tr').count();
      
      expect(everyQueryCount2).toBe(everyQueryCount);
      expect(everyQueryCount).toBeGreaterThan(0);
      expect(analysisCount).toBeGreaterThan(0);
    });
  });

  test.describe('Search/Filter Functions', () => {
    test('should have search input fields in Every Query', async ({ page }) => {
      await page.locator('#tabs a[href="#every-query"]').click();
      
      const searchInput = page.locator('#statement-search');
      await expect(searchInput).toBeVisible({ timeout: 10000 });
    });

    test('should filter table when search text is entered', async ({ page }) => {
      await page.locator('#tabs a[href="#every-query"]').click();
      const table = page.locator('#every-query table').first();
      await expect(table).toBeVisible({ timeout: 15000 });
      
      const initialCount = await table.locator('tbody tr').count();
      
      const searchInput = page.locator('#statement-search');
      await searchInput.fill('SELECT');
      await page.waitForTimeout(500);
      
      const filteredCount = await table.locator('tbody tr').count();
      
      expect(filteredCount).toBeGreaterThan(0);
      expect(filteredCount).toBeLessThanOrEqual(initialCount);
    });
  });
});
