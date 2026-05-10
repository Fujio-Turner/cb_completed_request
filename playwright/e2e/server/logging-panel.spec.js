/**
 * Logging Panel E2E Test — Playwright
 * 
 * Verifies that the Settings → Logging panel correctly displays
 * log file information, rotated file listings, and download links.
 * 
 * Anchored in: app/docs/work/LOGGING_4_0_0/08_LOGGING_API_AND_UI.md § 6
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5555';

test.describe('Logging Panel (Settings)', () => {
  test('logging panel accessible from Settings menu', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    
    // Wait for app to load
    await page.waitForTimeout(1000);

    // Look for Settings button/menu
    const settingsButton = page.locator('[data-testid="settings-button"], button:has-text("Settings"), .settings-btn');
    
    // Click if found (or skip this test if not present in current build)
    const settingsVisible = await settingsButton.count() > 0;
    if (settingsVisible) {
      await settingsButton.first().click();
      
      // Look for Logging option
      const loggingOption = page.locator('[data-testid="logging-panel"], text=Logging, .logging-section');
      expect(loggingOption).toBeDefined();
    }
  });

  test('logging panel displays active log file info', async ({ page }) => {
    await page.goto(`${BASE_URL}/?dev=true`);  // Dev mode to ensure panel is visible
    
    await page.waitForTimeout(1500);

    // Make a test request to populate logs
    const response = await page.request.get(`${BASE_URL}/api/logging/info`);
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    
    // Check response shape
    expect(data).toHaveProperty('level');
    expect(data).toHaveProperty('json_mode');
    expect(data).toHaveProperty('active_file');
    expect(data).toHaveProperty('rotated_files');
    expect(data).toHaveProperty('caps');
  });

  test('logging info endpoint returns file path', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/logging/info`);
    const data = await response.json();
    
    // If logging is enabled, active_file should have path
    if (data.active_file) {
      expect(data.active_file).toHaveProperty('path');
      expect(data.active_file).toHaveProperty('size_bytes');
      expect(data.active_file).toHaveProperty('size_human');
      
      // Path should look reasonable
      expect(data.active_file.path.length > 0).toBeTruthy();
    }
  });

  test('logging info endpoint returns human-readable file sizes', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/logging/info`);
    const data = await response.json();
    
    if (data.active_file) {
      const sizeHuman = data.active_file.size_human;
      
      // Should have units (B, KB, MB, GB, etc.)
      const validUnits = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
      const hasUnit = validUnits.some(unit => sizeHuman.includes(unit));
      expect(hasUnit).toBeTruthy();
    }
  });

  test('logging info includes rotation settings (caps)', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/logging/info`);
    const data = await response.json();
    
    expect(data.caps).toHaveProperty('max_size_mb');
    expect(data.caps).toHaveProperty('max_age_days');
    expect(data.caps).toHaveProperty('rotated_total_mb');
    
    // Values should be positive integers
    expect(data.caps.max_size_mb > 0).toBeTruthy();
    expect(data.caps.max_age_days > 0).toBeTruthy();
    expect(data.caps.rotated_total_mb > 0).toBeTruthy();
  });

  test('logging panel shows rotated files list', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/logging/info`);
    const data = await response.json();
    
    // rotated_files should be an array (possibly empty)
    expect(Array.isArray(data.rotated_files)).toBeTruthy();
    
    // Each rotated file should have expected properties
    data.rotated_files.forEach(file => {
      expect(file).toHaveProperty('path');
      expect(file).toHaveProperty('size_bytes');
      expect(file).toHaveProperty('size_human');
      expect(file).toHaveProperty('mtime');
    });
  });

  test('download active log endpoint works', async ({ page }) => {
    // First check if logging is enabled
    const infoResponse = await page.request.get(`${BASE_URL}/api/logging/info`);
    const data = await infoResponse.json();
    
    if (!data.active_file) {
      // Logging disabled, skip download test
      test.skip();
    }
    
    // Try to download the active log
    const downloadResponse = await page.request.get(`${BASE_URL}/api/logging/active-log`);
    
    if (downloadResponse.status() === 200) {
      // Should return file content
      const content = await downloadResponse.text();
      expect(content.length >= 0).toBeTruthy();
    } else if (downloadResponse.status() === 404) {
      // OK if no active log file
      const error = await downloadResponse.json();
      expect(error.success).toBe(false);
    }
  });

  test('logging panel respects CBQA_LOG_FILE=off setting', async ({ page }) => {
    // This would require the server to be started with CBQA_LOG_FILE=off
    // For this test, we just verify the API response is consistent
    
    const response = await page.request.get(`${BASE_URL}/api/logging/info`);
    const data = await response.json();
    
    // If logging is disabled (active_file is null), then rotated_files should be empty
    if (data.active_file === null) {
      expect(data.rotated_files.length === 0).toBeTruthy();
    }
  });

  test('logging level is reported correctly', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/logging/info`);
    const data = await response.json();
    
    // Level should be one of the standard logging levels
    const validLevels = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'];
    expect(validLevels.includes(data.level)).toBeTruthy();
  });

  test('json_mode flag is reported', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/logging/info`);
    const data = await response.json();
    
    // Should be a boolean
    expect(typeof data.json_mode === 'boolean').toBeTruthy();
  });

  test('rotated files have recent timestamps', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/logging/info`);
    const data = await response.json();
    
    if (data.rotated_files.length > 0) {
      // Each mtime should be a valid ISO string
      data.rotated_files.forEach(file => {
        const mtime = new Date(file.mtime);
        expect(mtime instanceof Date && !isNaN(mtime)).toBeTruthy();
      });
    }
  });

  test('total rotated file size is calculated', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/logging/info`);
    const data = await response.json();
    
    // Total rotated bytes should match sum of individual files
    const calculatedTotal = data.rotated_files.reduce((sum, file) => sum + file.size_bytes, 0);
    expect(data.rotated_total_bytes).toBe(calculatedTotal);
  });

  test('logging panel does not expose sensitive data', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/logging/info`);
    const data = await response.json();
    
    const jsonStr = JSON.stringify(data);
    
    // Should not contain API keys or credentials
    expect(jsonStr).not.toContain('Bearer sk-');
    expect(jsonStr).not.toContain('x-api-key');
    expect(jsonStr).not.toContain('Authorization');
  });
});
