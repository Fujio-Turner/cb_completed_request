const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

/**
 * Server Edition E2E Tests - AI Analyzer Tab
 * 
 * Tests the AI-powered query analysis functionality
 * This is Server Edition specific - requires Flask backend
 */

test.describe('Server Edition - AI Analyzer Tab', () => {
  let sampleData;

  test.beforeAll(() => {
    sampleData = fs.readFileSync(
      path.join(__dirname, '../../sample/test_system_completed_requests.json'),
      'utf-8'
    );
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should display AI Analyzer tab', async ({ page }) => {
    const aiAnalyzerTab = page.locator('#tabs a[href="#ai-analyzer"]');
    await expect(aiAnalyzerTab).toBeVisible();
  });

  test('should navigate to AI Analyzer tab', async ({ page }) => {
    const aiAnalyzerTab = page.locator('#tabs a[href="#ai-analyzer"]');
    await aiAnalyzerTab.click();
    await page.waitForTimeout(500);
    
    const aiAnalyzerContent = page.locator('#ai-analyzer');
    await expect(aiAnalyzerContent).toBeVisible();
  });

  test('should have cluster name input field', async ({ page }) => {
    await page.locator('#tabs a[href="#ai-analyzer"]').click();
    await page.waitForTimeout(500);
    
    const clusterNameInput = page.locator('#ai-cluster-name');
    await expect(clusterNameInput).toBeVisible();
  });

  test('should have AI provider selection (jQuery UI selectmenu)', async ({ page }) => {
    await page.locator('#tabs a[href="#ai-analyzer"]').click();
    await page.waitForTimeout(500);
    
    // The native select is hidden, jQuery UI creates a button
    // Look for either the native select or the jQuery UI widget
    const providerSelect = page.locator('#ai-provider-select');
    const providerWidget = page.locator('#ai-provider-select-button, .ui-selectmenu-button');
    
    // At least one should exist (native or widget)
    const selectExists = await providerSelect.count() > 0;
    const widgetExists = await providerWidget.count() > 0;
    
    expect(selectExists || widgetExists).toBe(true);
  });

  test('should have data selection checkboxes', async ({ page }) => {
    await page.locator('#tabs a[href="#ai-analyzer"]').click();
    await page.waitForTimeout(500);
    
    // Check for data selection checkboxes
    const dashboardCheckbox = page.locator('#ai-include-dashboard');
    const insightsCheckbox = page.locator('#ai-include-insights');
    const queryGroupsCheckbox = page.locator('#ai-include-query-groups');
    
    await expect(dashboardCheckbox).toBeVisible();
    await expect(insightsCheckbox).toBeVisible();
    await expect(queryGroupsCheckbox).toBeVisible();
  });

  test('should have obfuscation option', async ({ page }) => {
    await page.locator('#tabs a[href="#ai-analyzer"]').click();
    await page.waitForTimeout(500);
    
    const obfuscateCheckbox = page.locator('#ai-obfuscate-data');
    await expect(obfuscateCheckbox).toBeVisible();
    
    // Default should be checked (obfuscation on)
    await expect(obfuscateCheckbox).toBeChecked();
  });

  test('should show obfuscation example on hover', async ({ page }) => {
    await page.locator('#tabs a[href="#ai-analyzer"]').click();
    await page.waitForTimeout(500);
    
    const toggleLink = page.locator('#obfuscation-toggle-link');
    await expect(toggleLink).toBeVisible();
    
    // Hover to show example (mouseenter event)
    await toggleLink.hover();
    await page.waitForTimeout(300);
    
    const example = page.locator('#obfuscation-example');
    await expect(example).toBeVisible({ timeout: 5000 });
  });

  test('should have required indicator on cluster name', async ({ page }) => {
    await page.locator('#tabs a[href="#ai-analyzer"]').click();
    await page.waitForTimeout(500);
    
    // The required indicator is a red asterisk in the label
    const requiredIndicator = page.locator('label:has-text("Cluster Name") span:has-text("*")');
    await expect(requiredIndicator).toBeVisible();
  });

  test('should toggle data selection checkboxes', async ({ page }) => {
    await page.locator('#tabs a[href="#ai-analyzer"]').click();
    await page.waitForTimeout(1000);
    
    const dashboardCheckbox = page.locator('#ai-include-dashboard');
    
    // Wait for jQuery UI to initialize
    await page.waitForTimeout(500);
    
    // Get initial state
    const initiallyChecked = await dashboardCheckbox.isChecked();
    
    // Toggle by clicking the label (jQuery UI checkboxradio)
    const dashboardLabel = page.locator('label[for="ai-include-dashboard"]');
    await dashboardLabel.click();
    await page.waitForTimeout(300);
    
    // State should have changed
    const afterClick = await dashboardCheckbox.isChecked();
    expect(afterClick).toBe(!initiallyChecked);
    
    // Toggle back
    await dashboardLabel.click();
    await page.waitForTimeout(300);
    
    const afterSecondClick = await dashboardCheckbox.isChecked();
    expect(afterSecondClick).toBe(initiallyChecked);
  });

  test('should have Analysis Source and AI Service Provider sections', async ({ page }) => {
    await page.locator('#tabs a[href="#ai-analyzer"]').click();
    await page.waitForTimeout(500);
    
    // Check for section headers
    const analysisSourceHeader = page.locator('h3:has-text("Analysis Source")');
    const aiServiceHeader = page.locator('h3:has-text("AI Service Provider")');
    
    await expect(analysisSourceHeader).toBeVisible();
    await expect(aiServiceHeader).toBeVisible();
  });

  test('should have Data to Analyze section', async ({ page }) => {
    await page.locator('#tabs a[href="#ai-analyzer"]').click();
    await page.waitForTimeout(500);
    
    const dataToAnalyzeHeader = page.locator('h3:has-text("Data to Analyze")');
    await expect(dataToAnalyzeHeader).toBeVisible();
  });
});


test.describe('Server Edition - AI Analyzer with Data', () => {
  let sampleData;

  test.beforeAll(() => {
    sampleData = fs.readFileSync(
      path.join(__dirname, '../../sample/test_system_completed_requests.json'),
      'utf-8'
    );
  });

  test('should enable data selections after parsing data', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Load and parse data
    const jsonInput = page.locator('#json-input');
    await jsonInput.evaluate((el, data) => el.value = data, sampleData);
    
    const parseComplete = page.waitForEvent('console', { 
      predicate: msg => msg.text().includes('Parse performance:'),
      timeout: 15000
    });
    await page.locator('#parse-json-btn').click();
    await parseComplete;
    await page.waitForTimeout(1000);
    
    // Navigate to AI Analyzer
    await page.locator('#tabs a[href="#ai-analyzer"]').click();
    await page.waitForTimeout(500);
    
    // Checkboxes should be visible and functional
    const dashboardCheckbox = page.locator('#ai-include-dashboard');
    await expect(dashboardCheckbox).toBeVisible();
  });
});
