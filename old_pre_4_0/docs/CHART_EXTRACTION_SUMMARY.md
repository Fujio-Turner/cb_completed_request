# Chart Module Extraction Summary

## Phase 1: Core Infrastructure ✅ COMPLETE

### What Was Extracted from main-legacy.js → charts.js

#### 1. Chart.js Setup (4 functions, ~20 lines)
- Global Chart.js configuration
- Animation disabling for performance
- Zoom plugin registration

#### 2. State Variables (5 variables)
- `originalTimeRange` - Track original time bounds
- `currentTimeRange` - Track current zoomed time bounds  
- `isZoomSyncing` - Prevent zoom feedback loops
- `verticalStakePosition` - Timestamp for blue dotted stake line
- `timelineCharts` - Array of all timeline charts for sync

#### 3. Chart Management Functions (3 functions, ~150 lines)
- `syncChartZoom()` - Sync zoom across 19 timeline charts
- `destroyAllCharts()` - Clean destroy of all 26 chart instances
- `destroyTimelineCharts()` - Destroy only timeline-specific charts (17 instances)

#### 4. Vertical Stake Line Functions (3 functions, ~180 lines)
**Issue #148 - Double-click to add reference line**
- `addVerticalStake(timestamp)` - Add blue dotted line to all charts
- `removeVerticalStake()` - Remove stake line from all charts
- `attachDoubleClickHandler(chartInstance)` - Enable double-click on charts

#### 5. Crosshair Synchronization (4 functions + plugin, ~200 lines)
**Issue #148 - Synchronized vertical crosshairs**
- `verticalLinePlugin` - Custom Chart.js plugin for crosshair rendering
- `syncTimelineCharts(sourceEvent, activeChart)` - Sync crosshair across charts
- `clearTimelineCrosshairs()` - Clear all crosshairs on mouse leave
- `registerTimelineChart(chart, ctx)` - Register chart for crosshair sync with throttling

#### 6. Progressive Chart Loading System (5 functions, ~150 lines)
**Performance optimization for 38+ charts**
- `enqueueChartTask(name, fn, priority)` - Queue chart creation with priority
- `drainChartQueue()` - Process queue using requestAnimationFrame
- `lazyCreateChart(canvasId, chartName, createFn, priority)` - IntersectionObserver lazy loading
- `attachHandlersToChart(canvasId)` - Attach event handlers after chart creation
- `resetChartLoadingCounters()` - Clear queue state

#### 7. Helper Functions (3 functions, ~40 lines)
- `getCurrentTimeConfig(requests)` - Get Chart.js time axis config (Issue #148)
- `updateOptimizerLabel(requests)` - Update time grouping dropdown
- `getChartDate(requestTime)` - Timezone conversion (Issue #203)

### Total Extraction Stats (Phase 1)
- **Functions extracted:** 23 core infrastructure functions
- **Lines of code:** ~740 lines
- **Dependencies:** Minimal (Logger, TEXT_CONSTANTS, window references)
- **Backward compatibility:** All functions exposed to `window` object

---

## Phase 2: Chart Generation Functions (TODO)

### Chart Functions NOT YET Extracted (~38 functions, ~10,000+ lines)

#### Dashboard Charts (7 functions)
```
Line 13970: generateDashboardCharts(requests)
Line 14174: generatePrimaryScanChart(requests)
Line 14382: generateStateChart(requests)
Line 14518: generateStatementTypeChart(requests)
Line 14614: generateScanConsistencyChart(requests)
Line 14749: generateElapsedTimeChart(requests)
Line 14990: generateQueryPatternChart(requests)
```

#### Timeline Charts - Main (18 functions)
```
Line 4990:  generateEnhancedOperationsChart(requests)
Line 5314:  generateFilterChart(requests)
Line 5605:  generateTimelineChart(requests)
Line 6016:  createQueryTypesChart(requests, grouping)
Line 6410:  createDurationBucketsChart(requests, grouping)
Line 6790:  createMemoryChart(requests, grouping)
Line 7117:  createCollectionQueriesChart(requests, grouping)
Line 8843:  createParseDurationChart(requests, grouping)
Line 9043:  createPlanDurationChart(requests, grouping)
Line 9243:  createResultCountChart(requests, grouping)
Line 9430:  createResultSizeChart(requests, grouping)
Line 10179: createCpuTimeChart(requests, grouping)
Line 10439: createIndexScanThroughputChart(requests, grouping)
Line 10771: createDocFetchThroughputChart(requests, grouping)
Line 11623: createDocumentSizeBubbleChart(requests, grouping)
Line 11842: createExecVsKernelChart(requests, grouping)
Line 12219: createExecVsServChart(requests, grouping)
Line 12931: createExecVsElapsedChart(requests, grouping)
Line 12562: createServiceTimeAnalysisLineChart(requests, grouping)
```

#### 3D/ECharts Visualizations (8 functions)
```
Line 7308:  createECharts3DCollectionTimeline(requests, grouping)
Line 7464:  addCameraDebugDisplay(myChart, fullscreenChartDiv, closeBtn, chartName)
Line 7504:  expandECharts3DTimeline()
Line 8106:  createECharts3DQueryTypes(requests, grouping)
Line 8328:  expandECharts3DQueryTypes()
Line 9617:  createECharts3DAvgDocSize(requests, grouping)
Line 9760:  expandECharts3DAvgDocSize()
Line 11104: createECharts3DServiceTime(requests, grouping)
Line 11250: expandECharts3DServiceTime()
Line 15141: generateECharts3DBar(requests)
Line 15237: expandEChartsChart() (first instance)
Line 15345: expandEChartsChart() (second instance - duplicate?)
```

#### Other Chart-Related Functions (5 functions)
```
Line 4297:  renderQueryGroupPhaseTimesChart(group)
Line 12834: setupChartDragAndDrop()
Line 18217: setupLazyChartLoading(filteredRequests, fullDataset)
Line 23497: populateReportMakerTimelineCharts()
Line 23805: replaceChartsWithImages(enable)
Line 25009: renderSchemaTypeChart(canvasId, typeCounts)
```

### Why Phase 2 is Separate
1. **Size:** These functions total ~10,000+ lines of code
2. **Dependencies:** Heavily depend on data-layer.js functions (not yet extracted)
3. **Complexity:** Each chart has unique data processing, aggregation, and visualization logic
4. **Testing:** Need to test Phase 1 infrastructure first before adding chart generators

---

## Dependencies & Integration

### Current Dependencies (Phase 1)
```javascript
// External Libraries
- Chart.js (global)
- Chart Zoom Plugin (global)

// Internal Modules
- base.js → Logger
- window.TEXT_CONSTANTS → Localization

// Window References (to be replaced with data-layer.js imports)
- window.getTimeGrouping()
- window.getOptimalTimeUnit()
- window.getTimeConfig()
- window.getChartDate()
```

### Planned Dependencies (Phase 2)
```javascript
// Data layer imports (once data-layer.js is complete)
import { 
    originalRequests,
    parseTime,
    normalizeStatement,
    getOperators,
    deriveStatementType,
    getTimeGrouping,
    getOptimalTimeUnit,
    getTimeConfig,
    convertToTimezone
} from './data-layer.js';

// UI helpers (once ui-helpers.js is complete)
import { 
    formatNumber, 
    formatBytes, 
    formatDuration 
} from './ui-helpers.js';
```

---

## Next Steps

### Before Testing charts.js
1. ✅ Create charts.js with core infrastructure (DONE)
2. ⏳ Add import to liquid_snake/index.html: `<script type="module" src="assets/js/charts.js"></script>`
3. ⏳ Test that chart destruction works
4. ⏳ Test that zoom sync works
5. ⏳ Test that vertical stake line works

### Phase 2 Extraction Plan
1. Extract chart generation functions in batches:
   - Batch 1: Dashboard charts (7 functions)
   - Batch 2: Timeline charts (18 functions)
   - Batch 3: 3D/ECharts (8 functions)
   - Batch 4: Utility functions (5 functions)

2. For each batch:
   - Extract function code
   - Add to charts.js
   - Add `export` keyword
   - Expose to `window` for backward compatibility
   - Test in browser

### Phase 3: Cleanup
1. Remove extracted functions from main-legacy.js
2. Update all imports in liquid_snake/index.html
3. Run diagnostics to ensure no errors
4. Update AGENT.md with new architecture

---

## Testing Checklist

### Phase 1 Testing
- [ ] Import charts.js in index.html
- [ ] Open browser console - no errors
- [ ] Click "Parse JSON" with sample data
- [ ] Test `window.destroyAllCharts()` in console
- [ ] Test double-click on timeline chart (should add blue stake line)
- [ ] Test hover over multiple timeline charts (crosshair should sync)
- [ ] Test zoom on one chart (all timeline charts should sync zoom)

### Phase 2 Testing (Per Batch)
- [ ] Each chart function generates correctly
- [ ] Charts appear in correct tabs
- [ ] No console errors during chart creation
- [ ] Charts are interactive (hover, click, zoom)
- [ ] Data displays correctly in tooltips

---

## File Structure

```
liquid_snake/assets/js/
├── base.js              ✅ Logger, TEXT_CONSTANTS, utilities
├── charts.js            ✅ Phase 1: Core infrastructure (THIS FILE)
│                        ⏳ Phase 2: Chart generation functions
├── data-layer.js        ⏳ TODO: Data parsing, caching, filtering
├── ui-helpers.js        ⏳ TODO: formatNumber, formatBytes, formatDuration
├── main.js              ⏳ TODO: New clean main module
└── main-legacy.js       📦 Original monolithic file (25K+ lines)
```

---

## Breaking Change Risk: LOW ✅

### Why Low Risk?
1. **Backward compatibility:** All functions exposed to `window` object
2. **No logic changes:** Pure extraction, no refactoring
3. **Incremental approach:** Phase 1 only core functions, tested before Phase 2
4. **Fallback:** Original main-legacy.js remains untouched until testing complete

### Rollback Plan
If charts.js causes issues:
1. Remove `<script src="charts.js">` from index.html
2. Original functionality remains in main-legacy.js
3. Zero data loss or functionality loss
