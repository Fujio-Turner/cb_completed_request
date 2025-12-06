const { test, expect } = require('@playwright/test');

/**
 * Server Edition E2E Tests - Settings Modal
 * 
 * Tests the Couchbase connection settings modal (Issue #231)
 * This is Server Edition specific functionality
 */

test.describe('Server Edition - Settings Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should open settings modal when clicking settings button', async ({ page }) => {
    const settingsBtn = page.locator('#settings-btn');
    await expect(settingsBtn).toBeVisible();
    
    await settingsBtn.click();
    await page.waitForTimeout(500);
    
    // Modal should be visible
    const modal = page.locator('#settings-modal');
    await expect(modal).toBeVisible({ timeout: 5000 });
  });

  test('should have settings tabs for Storage and AI', async ({ page }) => {
    const settingsBtn = page.locator('#settings-btn');
    await settingsBtn.click();
    await page.waitForTimeout(500);
    
    // Check for settings tabs
    const storageTab = page.locator('a[href="#settings-tab-storage"]');
    const aiApiTab = page.locator('a[href="#settings-tab-ai-api"]');
    
    await expect(storageTab).toBeVisible({ timeout: 5000 });
    await expect(aiApiTab).toBeVisible({ timeout: 5000 });
  });

  test('should have bucket configuration fields', async ({ page }) => {
    const settingsBtn = page.locator('#settings-btn');
    await settingsBtn.click();
    await page.waitForTimeout(500);
    
    // Look for bucket name input
    const bucketInput = page.locator('#bucket-name');
    await expect(bucketInput).toBeVisible({ timeout: 5000 });
  });

  test('should have AI API configuration tab', async ({ page }) => {
    const settingsBtn = page.locator('#settings-btn');
    await settingsBtn.click();
    await page.waitForTimeout(500);
    
    // Click AI API tab
    const aiApiTab = page.locator('a[href="#settings-tab-ai-api"]');
    await aiApiTab.click();
    await page.waitForTimeout(300);
    
    // AI API tab content should be visible
    const aiApiContent = page.locator('#settings-tab-ai-api');
    await expect(aiApiContent).toBeVisible({ timeout: 5000 });
  });

  test('should close settings modal when clicking Cancel button', async ({ page }) => {
    const settingsBtn = page.locator('#settings-btn');
    await settingsBtn.click();
    await page.waitForTimeout(500);
    
    const modal = page.locator('#settings-modal');
    await expect(modal).toBeVisible({ timeout: 5000 });
    
    // Cancel button in settings-actions section
    const cancelBtn = page.locator('#settings-modal .settings-actions button:has-text("Cancel")');
    await expect(cancelBtn).toBeVisible({ timeout: 5000 });
    await cancelBtn.click();
    await page.waitForTimeout(500);
    
    await expect(modal).not.toBeVisible();
  });

  test('should close settings modal when clicking X button', async ({ page }) => {
    const settingsBtn = page.locator('#settings-btn');
    await settingsBtn.click();
    await page.waitForTimeout(500);
    
    const modal = page.locator('#settings-modal');
    await expect(modal).toBeVisible({ timeout: 5000 });
    
    // Close X button
    const closeBtn = page.locator('#settings-modal .close');
    await closeBtn.click();
    await page.waitForTimeout(500);
    
    await expect(modal).not.toBeVisible();
  });

  test('should switch between settings tabs', async ({ page }) => {
    const settingsBtn = page.locator('#settings-btn');
    await settingsBtn.click();
    await page.waitForTimeout(500);
    
    // Default tab (Storage) should be visible
    const storageContent = page.locator('#settings-tab-storage');
    await expect(storageContent).toBeVisible();
    
    // Switch to AI API tab
    const aiApiTab = page.locator('a[href="#settings-tab-ai-api"]');
    await aiApiTab.click();
    await page.waitForTimeout(300);
    
    const aiApiContent = page.locator('#settings-tab-ai-api');
    await expect(aiApiContent).toBeVisible();
    
    // Switch to AI Admin tab
    const aiAdminTab = page.locator('a[href="#settings-tab-ai-admin"]');
    await aiAdminTab.click();
    await page.waitForTimeout(300);
    
    const aiAdminContent = page.locator('#settings-tab-ai-admin');
    await expect(aiAdminContent).toBeVisible();
  });
});
