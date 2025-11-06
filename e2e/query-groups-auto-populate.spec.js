// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

test.describe('Query Groups Auto-Populate Chart (Issue #225)', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the English version
        await page.goto('/en/index.html');
        await page.waitForLoadState('domcontentloaded');
        
        // Load sample data
        const sampleData = fs.readFileSync(
            path.join(__dirname, '../sample/test_system_completed_requests.json'),
            'utf-8'
        );
        
        // Paste JSON data into left input box using evaluate (faster than fill)
        const jsonInput = page.locator('#json-input');
        await expect(jsonInput).toBeVisible();
        await jsonInput.evaluate((el, data) => el.value = data, sampleData);
        await page.waitForTimeout(500);
        
        // Click Parse JSON button
        const parseButton = page.locator('#parse-json-btn');
        await expect(parseButton).toBeVisible();
        
        // Wait for parsing to complete by listening for console log
        const parseComplete = page.waitForEvent('console', { 
            predicate: msg => msg.text().includes('Parse performance:') || msg.text().includes('requests ('),
            timeout: 15000
        });
        
        await parseButton.click();
        await parseComplete;
    });

    test('should auto-populate chart when Analysis tab is first loaded', async ({ page }) => {
        // Click on Query Groups (Analysis) tab
        const analysisLink = page.locator('#tabs a[href="#analysis"]');
        await analysisLink.click();
        
        // Wait for table to populate
        await page.waitForSelector('#analysis-table-body tr', { timeout: 3000 });
        
        // Wait for chart to render
        await page.waitForFunction(() => {
            return window.queryGroupPhaseTimesChart !== undefined;
        }, { timeout: 5000 });
        
        // Verify chart canvas exists and is visible
        const chartCanvas = page.locator('#query-group-phase-times-chart');
        await expect(chartCanvas).toBeVisible();
        
        // Verify chart has been rendered with data
        const hasChartData = await page.evaluate(() => {
            return window.queryGroupPhaseTimesChart?.data?.labels?.length > 0;
        });
        expect(hasChartData).toBeTruthy();
    });

    test('should auto-populate chart after sorting by different column', async ({ page }) => {
        // Click on Query Groups (Analysis) tab
        const analysisLink = page.locator('#tabs a[href="#analysis"]');
        await analysisLink.click();
        
        // Wait for table to populate
        await page.waitForSelector('#analysis-table-body tr', { timeout: 3000 });
        
        // Wait for initial chart render
        await page.waitForFunction(() => window.queryGroupPhaseTimesChart !== undefined, { timeout: 5000 });
        
        // Click on a sortable column header (e.g., "Avg Duration")
        await page.locator('#analysis-table-header th').filter({ hasText: /avg/i }).first().click();
        
        // Wait for re-sort and chart update
        await page.waitForTimeout(500);
        
        // Verify chart is still populated after sort
        const hasChartData = await page.evaluate(() => {
            return window.queryGroupPhaseTimesChart?.data?.labels?.length > 0;
        });
        expect(hasChartData).toBeTruthy();
    });

    test('should auto-populate chart after filtering', async ({ page }) => {
        // Click on Query Groups (Analysis) tab
        const analysisLink = page.locator('#tabs a[href="#analysis"]');
        await analysisLink.click();
        
        // Wait for table to populate
        await page.waitForSelector('#analysis-table-body tr', { timeout: 3000 });
        
        // Wait for initial chart render
        await page.waitForFunction(() => window.queryGroupPhaseTimesChart !== undefined, { timeout: 5000 });
        
        // Enter text in search box
        const searchBox = page.locator('#analysis-statement-search');
        await searchBox.fill('SELECT');
        
        // Wait for filter to apply and chart update
        await page.waitForTimeout(500);
        
        // Verify chart is still populated after filter
        const hasChartData = await page.evaluate(() => {
            return window.queryGroupPhaseTimesChart?.data?.labels?.length > 0;
        });
        expect(hasChartData).toBeTruthy();
    });

    test('should update chart when clicking on a different row', async ({ page }) => {
        // Click on Query Groups (Analysis) tab
        const analysisLink = page.locator('#tabs a[href="#analysis"]');
        await analysisLink.click();
        
        // Wait for table to populate
        await page.waitForSelector('#analysis-table-body tr', { timeout: 3000 });
        
        // Wait for initial chart render
        await page.waitForFunction(() => window.queryGroupPhaseTimesChart !== undefined, { timeout: 5000 });
        
        // Click on second row
        await page.locator('#analysis-table-body tr').nth(1).click();
        
        // Wait for chart to update
        await page.waitForTimeout(500);
        
        // Verify chart was updated (it should have data)
        const hasChartData = await page.evaluate(() => {
            return window.queryGroupPhaseTimesChart?.data?.labels?.length > 0;
        });
        expect(hasChartData).toBeTruthy();
    });
});
