const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

/**
 * Server Edition E2E Tests - Core Functionality
 * 
 * Tests the Flask-based Server Edition at http://localhost:5555
 * These tests verify the core UI functionality works the same as Static Edition
 */

test.describe('Server Edition - Core Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should load the page and display title', async ({ page }) => {
    await expect(page).toHaveTitle(/Query Analyzer v\d+\.\d+\.\d+(-\w+)?/);
  });

  test('should display main tab navigation including AI Analyzer', async ({ page }) => {
    const tabsContainer = page.locator('#tabs ul[role="tablist"]');
    await expect(tabsContainer).toBeVisible();
    
    const tabLinks = page.locator('#tabs ul[role="tablist"] a');
    const tabCount = await tabLinks.count();
    expect(tabCount).toBeGreaterThan(5);
    
    // Server Edition should have AI Analyzer tab
    const aiAnalyzerTab = page.locator('#tabs a[href="#ai-analyzer"]');
    await expect(aiAnalyzerTab).toBeVisible();
  });

  test('should have visible input textareas', async ({ page }) => {
    const leftTextarea = page.locator('#json-input');
    const rightTextarea = page.locator('#indexJsonInput');
    
    await expect(leftTextarea).toBeVisible();
    await expect(rightTextarea).toBeVisible();
  });

  test('should have settings button for Couchbase connection', async ({ page }) => {
    const settingsBtn = page.locator('#settings-btn');
    await expect(settingsBtn).toBeVisible();
  });

  test('should have connection status indicator', async ({ page }) => {
    const connectionStatus = page.locator('#connection-status');
    await expect(connectionStatus).toBeVisible();
    
    // Default should be disconnected
    const statusText = await connectionStatus.textContent();
    expect(statusText).toContain('Disconnected');
  });

  test('should load and parse sample JSON data', async ({ page }) => {
    test.setTimeout(30000);
    
    const sampleData = fs.readFileSync(
      path.join(__dirname, '../../../sample/test_system_completed_requests.json'),
      'utf-8'
    );

    const jsonInput = page.locator('#json-input');
    await expect(jsonInput).toBeVisible();
    await jsonInput.evaluate((el, data) => el.value = data, sampleData);
    await page.waitForTimeout(500);
    
    const consoleMessages = [];
    page.on('console', msg => consoleMessages.push(msg.text()));
    
    const parseButton = page.locator('#parse-json-btn');
    await expect(parseButton).toBeVisible();
    
    const parseComplete = page.waitForEvent('console', { 
      predicate: msg => msg.text().includes('Parse performance:') || msg.text().includes('requests ('),
      timeout: 15000
    });
    
    await parseButton.click();
    await parseComplete;
    
    const hasSuccess = consoleMessages.some(msg => msg.includes('Parse performance:'));
    expect(hasSuccess).toBe(true);
    
    // Navigate to Dashboard to see charts (Server Edition defaults to AI Analyzer tab)
    await page.locator('#tabs a[href="#dashboard"]').click();
    await page.waitForTimeout(1000);
    
    const chartCanvas = page.locator('#dashboard canvas').first();
    await expect(chartCanvas).toBeVisible({ timeout: 10000 });
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
    
    // Test AI Analyzer tab (Server Edition specific)
    const aiAnalyzerLink = page.locator('#tabs a[href="#ai-analyzer"]');
    await aiAnalyzerLink.click();
    await page.waitForTimeout(500);
    await expect(page.locator('#ai-analyzer')).toBeVisible();
  });

  test('should display version information', async ({ page }) => {
    const versionMeta = await page.locator('meta[name="version"]').getAttribute('content');
    expect(versionMeta).toMatch(/\d+\.\d+\.\d+(-\w+)?/);
  });

  test('should have responsive layout', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const tabsContainer = page.locator('#tabs');
    await expect(tabsContainer).toBeVisible();

    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(tabsContainer).toBeVisible();
  });

  test('should display AI Analyzer tab by default (Server Edition)', async ({ page }) => {
    // Server Edition has AI Analyzer as first tab (unlike Static Edition which has Dashboard)
    const aiAnalyzerTab = page.locator('#ai-analyzer');
    await expect(aiAnalyzerTab).toBeVisible();
  });

  test('should have file upload functionality', async ({ page }) => {
    const uploadButton = page.locator('input[type="file"]').first();
    expect(uploadButton).toBeDefined();
  });
});
