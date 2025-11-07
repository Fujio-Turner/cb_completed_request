# Next Steps: Chart Extraction Testing & Phase 2

## Immediate Testing (Phase 1 Complete ✅)

### Step 1: Add Script Import
Add this line to `liquid_snake/index.html` in the `<head>` section BEFORE main-legacy.js:

```html
<!-- Chart management module -->
<script type="module" src="assets/js/charts.js"></script>

<!-- Main legacy code (to be refactored) -->
<script src="assets/js/main-legacy.js"></script>
```

### Step 2: Browser Console Test
1. Open liquid_snake/index.html in browser
2. Open Developer Console (F12)
3. Check for errors - should see: `✅ charts.js module loaded (Phase 1: Core infrastructure)`
4. Paste sample JSON and click "Parse JSON"
5. Run these commands in console:

```javascript
// Test 1: Chart destruction
window.destroyAllCharts();  // Should log: 🧹 Destroyed X chart instances

// Test 2: Check exports are available
console.log(typeof window.syncChartZoom);  // Should be "function"
console.log(typeof window.addVerticalStake);  // Should be "function"
console.log(typeof window.verticalLinePlugin);  // Should be "object"
```

### Step 3: Interactive Testing
1. **Double-click test:** Double-click on any timeline chart → Should add blue dotted stake line
2. **Crosshair sync:** Hover over one timeline chart → All charts should show synchronized vertical line
3. **Zoom sync:** Zoom into one timeline chart → All timeline charts should zoom together
4. **Unstake test:** Click "Unstake" button → Blue line should disappear from all charts

---

## Phase 2: Extract Chart Generation Functions

### Approach: Extract in 4 Batches

#### Batch 1: Dashboard Charts (Priority: HIGH)
**7 functions, ~2000 lines**

Extract these from main-legacy.js:

```javascript
// Line 13970-14172
function generateDashboardCharts(requests) { ... }

// Line 14174-14380
function generatePrimaryScanChart(requests) { ... }

// Line 14382-14516
function generateStateChart(requests) { ... }

// Line 14518-14612
function generateStatementTypeChart(requests) { ... }

// Line 14614-14747
function generateScanConsistencyChart(requests) { ... }

// Line 14749-14988
function generateElapsedTimeChart(requests) { ... }

// Line 14990-15139
function generateQueryPatternChart(requests) { ... }
```

**Testing after Batch 1:**
- Open Dashboard tab
- All 6 draggable charts should render
- No console errors

---

#### Batch 2: Timeline Charts (Priority: HIGH)
**18 functions, ~6000 lines**

Extract these chart generators:

```javascript
generateEnhancedOperationsChart (line 4990-5312)
generateFilterChart (line 5314-5603)
generateTimelineChart (line 5605-6014)
createQueryTypesChart (line 6016-6408)
createDurationBucketsChart (line 6410-6788)
createMemoryChart (line 6790-7115)
createCollectionQueriesChart (line 7117-7306)
createParseDurationChart (line 8843-9041)
createPlanDurationChart (line 9043-9241)
createResultCountChart (line 9243-9428)
createResultSizeChart (line 9430-9615)
createCpuTimeChart (line 10179-10437)
createIndexScanThroughputChart (line 10439-10769)
createDocFetchThroughputChart (line 10771-11102)
createDocumentSizeBubbleChart (line 11623-11840)
createExecVsKernelChart (line 11842-12217)
createExecVsServChart (line 12219-12560)
createExecVsElapsedChart (line 12931-13782)
createServiceTimeAnalysisLineChart (line 12562-12832)
```

**Testing after Batch 2:**
- Open Timeline tab
- All 18 charts should progressively load
- Scroll down to trigger lazy loading
- Test crosshair sync still works
- Test zoom sync still works

---

#### Batch 3: 3D/ECharts Visualizations (Priority: MEDIUM)
**8 functions, ~1500 lines**

Extract these ECharts functions:

```javascript
createECharts3DCollectionTimeline (line 7308-7462)
addCameraDebugDisplay (line 7464-7502)
expandECharts3DTimeline (line 7504-8104)
createECharts3DQueryTypes (line 8106-8326)
expandECharts3DQueryTypes (line 8328-8841)
createECharts3DAvgDocSize (line 9617-9758)
expandECharts3DAvgDocSize (line 9760-10177)
createECharts3DServiceTime (line 11104-11248)
expandECharts3DServiceTime (line 11250-11621)
generateECharts3DBar (line 15141-15235)
expandEChartsChart (line 15237-15343)
```

**Testing after Batch 3:**
- Click "3D" buttons on timeline charts
- 3D visualizations should open in fullscreen
- Camera controls should work
- Close buttons should work

---

#### Batch 4: Utility & Support Functions (Priority: LOW)
**5 functions, ~500 lines**

Extract these support functions:

```javascript
renderQueryGroupPhaseTimesChart (line 4297-4599)
setupChartDragAndDrop (line 12834-12929)
setupLazyChartLoading (line 18217-18464)
populateReportMakerTimelineCharts (line 23497-23803)
replaceChartsWithImages (line 23805-24021)
renderSchemaTypeChart (line 25009-25143)
```

**Testing after Batch 4:**
- Test Query Groups tab phase times chart
- Test Dashboard chart drag-and-drop
- Test Report Maker chart selection
- Test Report Maker image conversion

---

## Extraction Script Template

Use this Python script to extract each batch:

```python
#!/usr/bin/env python3
"""Extract chart functions from main-legacy.js to charts.js"""

def extract_function(filepath, start_line, end_line, function_name):
    """Extract lines from file"""
    with open(filepath, 'r') as f:
        lines = f.readlines()
    
    # Extract function (line numbers are 1-indexed)
    function_lines = lines[start_line-1:end_line]
    
    # Add export keyword
    function_code = ''.join(function_lines)
    if function_code.strip().startswith('function '):
        function_code = 'export ' + function_code
    elif function_code.strip().startswith('        function '):
        function_code = function_code.replace('        function ', 'export function ', 1)
    
    return function_code

# Example usage for Batch 1
functions_batch_1 = [
    (13970, 14172, 'generateDashboardCharts'),
    (14174, 14380, 'generatePrimaryScanChart'),
    (14382, 14516, 'generateStateChart'),
    (14518, 14612, 'generateStatementTypeChart'),
    (14614, 14747, 'generateScanConsistencyChart'),
    (14749, 14988, 'generateElapsedTimeChart'),
    (14990, 15139, 'generateQueryPatternChart'),
]

source_file = 'liquid_snake/assets/js/main-legacy.js'
output_file = 'liquid_snake/assets/js/charts.js'

# Extract each function
batch_code = "\n\n// ============================================================\n"
batch_code += "// DASHBOARD CHARTS (Batch 1)\n"
batch_code += "// ============================================================\n\n"

for start, end, name in functions_batch_1:
    print(f"Extracting {name} (lines {start}-{end})...")
    function_code = extract_function(source_file, start, end, name)
    batch_code += function_code + "\n\n"

# Append to charts.js
with open(output_file, 'a') as f:
    f.write(batch_code)

# Add window exports
exports_code = "\n// Expose Batch 1 to window\n"
for _, _, name in functions_batch_1:
    exports_code += f"window.{name} = {name};\n"

with open(output_file, 'a') as f:
    f.write(exports_code)

print(f"✅ Batch 1 extraction complete: {len(functions_batch_1)} functions")
```

---

## Dependencies to Resolve

Before extracting chart functions, these dependencies need to be available:

### From data-layer.js (TODO: Extract separately)
```javascript
- originalRequests
- parseTime()
- normalizeStatement()
- getOperators()
- deriveStatementType()
- getTimeGrouping()
- getOptimalTimeUnit()
- getTimeConfig()
- convertToTimezone()
- getChartDate()
```

### From ui-helpers.js (TODO: Extract separately)
```javascript
- formatNumber()
- formatBytes()
- formatDuration()
```

### Temporary Solution
For now, chart functions will reference these via `window` object until data-layer.js and ui-helpers.js are extracted.

---

## Verification After Full Extraction

### Functionality Checklist
- [ ] All Dashboard charts render
- [ ] All Timeline charts render
- [ ] All 3D charts open/close correctly
- [ ] Query Groups phase times chart renders
- [ ] Chart drag-and-drop works
- [ ] Report Maker chart selection works
- [ ] Crosshair synchronization works
- [ ] Zoom synchronization works
- [ ] Vertical stake line works
- [ ] Double-click on charts works
- [ ] Chart destruction works (no memory leaks)

### Code Quality Checklist
- [ ] No `console.log` (use `Logger.debug/info`)
- [ ] All functions exported
- [ ] All functions exposed to `window` for compatibility
- [ ] No hardcoded strings (use `TEXT_CONSTANTS`)
- [ ] Proper JSDoc comments
- [ ] No linting errors

### Performance Checklist
- [ ] Chart queue loads progressively
- [ ] No UI blocking during chart creation
- [ ] Lazy loading works (IntersectionObserver)
- [ ] Memory usage reasonable (<500MB for 2000 requests)
- [ ] No memory leaks (destroy old charts before creating new)

---

## Final Cleanup (After All Batches Complete)

1. **Remove duplicates from main-legacy.js**
   - Comment out extracted functions
   - Add redirect comments: `// MOVED TO: charts.js`

2. **Update imports**
   - Ensure charts.js loads before main-legacy.js
   - Test that order doesn't matter (all exports to window)

3. **Run diagnostics**
   ```bash
   npm run test:e2e  # Playwright tests
   ```

4. **Update documentation**
   - Update AGENT.md with new architecture
   - Update README.md with module structure
   - Create CHARTS.md API documentation

5. **Git commit**
   ```bash
   git add liquid_snake/assets/js/charts.js
   git add CHART_EXTRACTION_SUMMARY.md
   git add NEXT_STEPS_CHART_EXTRACTION.md
   git commit -m "feat: Extract chart module from main-legacy.js (Phase 1)"
   ```

---

## Success Criteria

✅ **Phase 1 Complete When:**
- charts.js loads without errors
- All 23 core functions work identically to main-legacy.js
- No regression in chart behavior
- Browser console shows no errors

✅ **Phase 2 Complete When:**
- All 38 chart generation functions extracted
- All charts render correctly in all tabs
- All interactive features work (zoom, crosshair, stake, drag)
- Performance is same or better than before

✅ **Final Success:**
- main-legacy.js reduced by ~11,000 lines
- charts.js is ~11,000 lines (well-organized, single-purpose module)
- All tests pass
- No user-facing changes (pure refactor)
- Clear API documentation for future development
