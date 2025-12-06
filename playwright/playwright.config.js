const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright E2E Test Configuration
 * 
 * Supports two editions:
 * - Static Edition (v3.29.3): /en/index.html - served via http-server on port 8080
 * - Server Edition (v4.0.0): /app/ - Flask server on port 5555
 * 
 * Usage:
 *   npm run test:e2e              # Run all tests (static edition, all browsers)
 *   npm run test:e2e:static       # Run static edition tests only
 *   npm run test:e2e:server       # Run server edition tests only
 *   npm run test:e2e -- --project=server-chromium  # Run server tests on Chromium only
 */

module.exports = defineConfig({
  testDir: './e2e',
  timeout: 60000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 10000,
  },
  
  projects: [
    // =========================================================================
    // Static Edition Tests (v3.29.3) - /en/index.html
    // Tests in: e2e/*.spec.js (excludes e2e/server/)
    // =========================================================================
    {
      name: 'static-chromium',
      testMatch: /^(?!.*\/server\/).*\.spec\.js$/,
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:8080',
      },
    },
    {
      name: 'static-firefox',
      testMatch: /^(?!.*\/server\/).*\.spec\.js$/,
      use: { 
        ...devices['Desktop Firefox'],
        baseURL: 'http://localhost:8080',
      },
    },
    {
      name: 'static-webkit',
      testMatch: /^(?!.*\/server\/).*\.spec\.js$/,
      use: { 
        ...devices['Desktop Safari'],
        baseURL: 'http://localhost:8080',
      },
    },
    
    // =========================================================================
    // Server Edition Tests (v4.0.0) - /app/ via Flask
    // Tests in: e2e/server/*.spec.js
    // =========================================================================
    {
      name: 'server-chromium',
      testDir: './e2e/server',
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:5555',
      },
    },
    {
      name: 'server-firefox',
      testDir: './e2e/server',
      use: { 
        ...devices['Desktop Firefox'],
        baseURL: 'http://localhost:5555',
      },
    },
    {
      name: 'server-webkit',
      testDir: './e2e/server',
      use: { 
        ...devices['Desktop Safari'],
        baseURL: 'http://localhost:5555',
      },
    },
  ],
  
  webServer: [
    // Static Edition: http-server on port 8080 (serve from project root)
    {
      command: 'npx http-server .. -p 8080 --silent',
      port: 8080,
      reuseExistingServer: !process.env.CI,
      stdout: 'ignore',
      stderr: 'pipe',
    },
    // Server Edition: Flask on port 5555 (separate from dev server on 5000)
    // Note: Requires Python venv to be set up. See app/setup_venv.sh
    {
      command: 'cd ../app && source venv/bin/activate && PORT=5555 python app.py',
      port: 5555,
      reuseExistingServer: !process.env.CI,
      stdout: 'pipe',
      stderr: 'pipe',
      timeout: 30000,
    },
  ],
});
