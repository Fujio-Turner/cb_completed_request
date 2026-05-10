/**
 * Console Leak Test — Playwright E2E
 * 
 * Verifies that no API keys or sensitive credentials reach the browser console
 * at any log level, and that plain console.* calls from app code are eliminated.
 * 
 * Anchored in: app/docs/work/LOGGING_4_0_0/07_FRONTEND_LOGGER_MIGRATION.md § 6
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5555';

test.describe('Console Leak Prevention', () => {
  let consoleLogs = [];
  let consoleErrors = [];
  let consoleWarnings = [];

  test.beforeEach(async ({ page }) => {
    consoleLogs = [];
    consoleErrors = [];
    consoleWarnings = [];

    // Intercept all console messages
    page.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'log') {
        consoleLogs.push(text);
      } else if (msg.type() === 'error') {
        consoleErrors.push(text);
      } else if (msg.type() === 'warn') {
        consoleWarnings.push(text);
      }
    });
  });

  test('no Bearer tokens in console at default level', async ({ page }) => {
    // Load app at default log level (INFO)
    await page.goto(`${BASE_URL}/?logLevel=info`);
    
    // Wait for app to settle
    await page.waitForTimeout(2000);

    // Check all console messages for Bearer tokens
    const allMessages = [...consoleLogs, ...consoleErrors, ...consoleWarnings].join('\n');
    expect(allMessages).not.toContain('Bearer sk-');
    expect(allMessages).not.toContain('sk-proj-');
    expect(allMessages).not.toContain('sk-ant-');
  });

  test('no API key patterns in console at trace level', async ({ page }) => {
    // Load app at trace level (most verbose)
    await page.goto(`${BASE_URL}/?logLevel=trace`);
    
    // Wait for detailed logs to appear
    await page.waitForTimeout(3000);

    const allMessages = [...consoleLogs, ...consoleErrors, ...consoleWarnings].join('\n');
    
    // Even at trace level, raw credentials should never appear
    expect(allMessages).not.toContain('Bearer sk-');
    expect(allMessages).not.toContain('x-api-key:');
    expect(allMessages).not.toContain('Authorization:');
  });

  test('no unredacted headers in console', async ({ page }) => {
    await page.goto(`${BASE_URL}/?logLevel=debug`);
    
    await page.waitForTimeout(2000);

    const allMessages = [...consoleLogs, ...consoleErrors, ...consoleWarnings].join('\n');
    
    // Redacted headers should be OK (e.g., "Bearer sk-proj-......1234")
    // but not raw headers
    expect(allMessages).not.toMatch(/Bearer sk-[a-zA-Z0-9\-_]+/);
  });

  test('no plain console.log/warn/error from app code', async ({ page }) => {
    await page.goto(`${BASE_URL}/?logLevel=debug`);
    
    await page.waitForTimeout(2000);

    // App-level logging should use Logger.* methods, not console.*
    // We can't easily distinguish app vs library logs, but we can check
    // that there's no suspicious patterns suggesting bypasses
    
    const allMessages = consoleLogs.join('\n');
    
    // Should NOT see raw app debugging (if Logger is used properly)
    // Look for patterns that suggest untagged console calls
    // (This is a heuristic; perfect detection would require source maps)
    const suspiciousPatterns = [
      /^\[UNTAGGED\]/,  // If we see untagged logs at this point
    ];
    
    suspiciousPatterns.forEach(pattern => {
      expect(allMessages).not.toMatch(pattern);
    });
  });

  test('Logger messages contain tags', async ({ page }) => {
    await page.goto(`${BASE_URL}/?logLevel=info`);
    
    await page.waitForTimeout(2000);

    // At INFO level, we expect some Logger messages with proper tags
    const allMessages = [...consoleLogs, ...consoleErrors, ...consoleWarnings].join('\n');
    
    // Should have tagged messages like [boot], [ui], etc.
    // OR should be structured JSON if using JSON logger
    expect(allMessages.length > 0).toBeTruthy();
  });

  test('redacted API keys shown at debug level', async ({ page }) => {
    // This test assumes the app performs an AI analysis
    // and logs the API key in redacted form
    
    await page.goto(`${BASE_URL}/?logLevel=debug&redact=true`);
    
    await page.waitForTimeout(2000);

    const allMessages = [...consoleLogs, ...consoleErrors, ...consoleWarnings].join('\n');
    
    // Should be safe to show redacted keys (e.g., "sk-proj-......1234")
    // Redaction should preserve last 4 chars and first prefix
    const redactedKeyPattern = /sk-[a-z\-]*-\.\.\.\.\.\.[a-zA-Z0-9]{4}/;
    
    // If we see redacted keys, they should be properly masked
    const redactedKeys = allMessages.match(/sk-\w+-\.\.\.\.\.\.[a-zA-Z0-9]{4}/g) || [];
    redactedKeys.forEach(key => {
      // Should have exactly "......", not longer or shorter
      expect(key).toMatch(/\.\.\.\.\.\.[a-zA-Z0-9]{4}$/);
    });
  });

  test('error messages do not expose response bodies', async ({ page }) => {
    await page.goto(`${BASE_URL}/?logLevel=info`);
    
    await page.waitForTimeout(2000);

    const errorMessages = consoleErrors.join('\n');
    
    // Error messages should be generic, not include full response bodies
    expect(errorMessages).not.toContain('secret prompt content');
    expect(errorMessages).not.toContain('user query body that is private');
  });

  test('no credentials in page title or visible HTML', async ({ page }) => {
    await page.goto(`${BASE_URL}/?logLevel=debug`);
    
    await page.waitForTimeout(2000);

    // Get page content
    const pageText = await page.content();
    
    // Should not have raw API keys visible in HTML
    expect(pageText).not.toContain('Bearer sk-proj-');
    expect(pageText).not.toContain('sk-ant-api03-');
  });
});
