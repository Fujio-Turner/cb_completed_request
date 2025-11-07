# Liquid Snake Modularization Project

**Status:** 🟢 Major Progress - 47% Complete  
**Started:** 2025-11-06  
**Last Updated:** 2025-11-06  
**Version:** 3.28.2

---

## 📋 Project Overview

Refactor the Couchbase Query Analyzer from a monolithic single-file application to a modular ES6 architecture with separated concerns, better maintainability, and clearer data flow.

### Goals

1. ✅ Separate CSS from HTML
2. ✅ Separate JavaScript from HTML
3. 🟡 Split JavaScript into logical modules (data layer, UI, charts, tables, etc.)
4. ⏳ Enable ES6 module imports/exports
5. ⏳ Create clean data layer API ("data buffet")
6. ⏳ Maintain 100% backward compatibility during transition
7. ⏳ Add comprehensive test coverage

---

## ✅ Phase 1: Initial Separation (COMPLETED)

### Work Completed

#### 1. CSS Extraction
- **Created:** `liquid_snake/assets/css/main.css` (425 lines)
- **Extracted from:** All `<style>` tags in index.html
- **Cleaned:** Removed duplicate `<style>` tags from extracted CSS
- **Linked:** Updated index.html with `<link rel="stylesheet" href="assets/css/main.css">`
- **Status:** ✅ Working

#### 2. JavaScript Extraction
- **Created:** `liquid_snake/assets/js/main.js` (25,192 lines initially)
- **Extracted from:** All `<script>` tags in index.html
- **Fixed:** Added timezone label DOM manipulation on DOMContentLoaded
- **Linked:** Updated index.html with `<script src="assets/js/main.js" defer></script>`
- **Status:** ✅ Working

#### 3. URL Flags Logging
- **Added:** Console logging of URL flags on startup
- **Flags logged:** `dev`, `debug`, `logLevel`, `redact`
- **Output:** `[info] ⚙️ URL Flags: dev=true, debug=true, logLevel=debug, redact=false`
- **Status:** ✅ Working

---

## ✅ Phase 2: Base Module Creation (COMPLETED)

### Work Completed

#### 1. Created base.js (413 lines)
**Location:** `liquid_snake/assets/js/base.js`

**Exports:**
- `TEXT_CONSTANTS` - All i18n strings (160+ constants)
- `Logger` - Logging utility with level support
  - `Logger.error()`, `Logger.warn()`, `Logger.info()`, `Logger.debug()`, `Logger.trace()`
- `getLogLevel()` - Get current log level from URL
- `shouldLog(level)` - Check if level should be logged
- `isDebugMode()` - Check if debug mode is enabled (legacy)
- `isDevMode()` - Check if `?dev=true` flag is set
- `isRedactMode()` - Check if `?redact=true|false` flag is set
- `getUrlParam(name)` - Generic URL parameter getter
- `DebugRedactor` - SHA-256 based data redaction utilities
  - `hash(text)` - Hash text (respects redact flag)
  - `redactBSC(bsc)` - Redact bucket.scope.collection
  - `redactCompositeKey(key)` - Redact index::bucket.scope.collection
  - `redactQuery(query)` - Redact query text
  - `redactObject(obj)` - Redact object keys/values
- `hashName()`, `hashBSC()`, `hashCompositeKey()`, `hashQuery()` - Shorthand functions

**Features:**
- Respects URL flags: `?debug=true`, `?logLevel=trace`, `?dev=true`, `?redact=false`
- Exposes `window.DebugRedactor` for backward compatibility
- Logs initialization info and flag status on load
- **Status:** ✅ Working & Tested

#### 2. Created data-layer.js (161 lines)
**Location:** `liquid_snake/assets/js/data-layer.js`

**Exports:**
- **Caches:**
  - `CACHE_LIMITS` - Size limits for caches
  - `parseTimeCache`, `normalizeStatementCache`, `timestampRoundingCache` (Map)
  - `operatorsCache`, `planStatsCache`, `timeUnitCache` (WeakMap - auto GC)
- **Cache Management:**
  - `clearCaches()` - Clear all caches
  - `logCacheStats()` - Log cache usage stats
- **Global Stores:**
  - `originalRequests` - Filtered request data array
  - `originalStartDate`, `originalEndDate` - Date range
  - `statementStore` - SQL statements by request ID
  - `analysisStatementStore` - Normalized statements
- **Helpers:**
  - `parseTime(timeStr)` - Parse time strings (s/ms/µs/ns) with caching
  - `normalizeStatement(sql)` - Normalize SQL with caching
  - `parseCouchbaseDateTime(dateStr)` - Parse CB datetime format
- **Events:**
  - `dataBus` - EventTarget for data ready notifications
  - `notifyDataReady(details)` - Dispatch data ready event

**Status:** ✅ Working

#### 3. Created main.js orchestrator (52 lines)
**Location:** `liquid_snake/assets/js/main.js`

**Purpose:** ES6 module entry point that imports base.js and data-layer.js

**Imports:**
- From `base.js`: TEXT_CONSTANTS, Logger, URL flag utilities
- From `data-layer.js`: Caches, stores, helpers, dataBus

**Status:** ✅ Imports working (tested)

#### 4. Renamed original to main-legacy.js (25,155 lines)
**Location:** `liquid_snake/assets/js/main-legacy.js`

**Contains:** All app logic (charts, tables, flow, UI, parsers, etc.)

**Status:** ✅ Working (loaded as classic script)

---

## ✅ Phase 3: Infrastructure & Testing (COMPLETED)

### Work Completed

#### 1. Updated index.html for ES6 modules
```html
<!-- External JavaScript - ES6 Modules -->
<script type="module" src="assets/js/main.js"></script>

<!-- Legacy app code (temporary - will be modularized) -->
<script src="assets/js/main-legacy.js" defer></script>
```
**Status:** ✅ Working

#### 2. Created Python web server
**File:** `liquid_snake/server.py`

**Features:**
- Runs on http://localhost:5555
- Serves files with correct MIME types for ES6 modules
- Adds CORS headers
- Disables caching for development

**Usage:**
```bash
cd liquid_snake
python3 server.py
```
**Status:** ✅ Working

#### 3. Created test suite
**File:** `liquid_snake/test_base.html`

**Tests:**
- ✅ Logger (all 5 levels)
- ✅ URL flags (dev, debug, logLevel, redact)
- ✅ DebugRedactor (hash, redactBSC, redactCompositeKey, redactObject)
- ✅ TEXT_CONSTANTS (existence and values)
- ✅ Redact mode ON/OFF behavior

**URL:** http://localhost:5555/test_base.html

**Status:** ✅ All tests passing

#### 4. Created documentation
- ✅ `liquid_snake/docs/data-layer-architecture.md` - Architecture overview with Mermaid diagrams
- ✅ `liquid_snake/docs/data-buffet-api-guide.md` - Consumer API documentation
- ✅ Updated `AGENT.md` with URL flag documentation

---

## 🟡 Phase 4: Data Layer Extraction (IN PROGRESS)

### What's Left to Extract from main-legacy.js

#### Big Parsing Functions (UI-coupled, need refactoring)
- [ ] `parseJSON()` (lines 18593-~22000) - ~3400 lines
  - Contains: JSON validation, filtering, data processing, UI updates
  - **Challenge:** Heavily coupled with UI (showToast, DOM updates, progress bars)
  - **Strategy:** Split into pure data parsing + UI orchestration
  
- [ ] `parseIndexJSON()` (line 22618) - ~100 lines
  - Less UI coupling, easier to extract
  
- [ ] `parseSchemaInference()` (line 24339) - ~1000 lines
  - Moderate UI coupling

#### Helper Functions Still in Legacy
- [ ] `detectTimezoneFromData()`
- [ ] `shouldExcludeSystemQuery()`
- [ ] `filterSystemQueries()`
- [ ] `makeElapsedFilterPredicate()`
- [ ] `deriveStatementType()`
- [ ] `getOperators()` - Extract operators from plan (uses operatorsCache)
- [ ] Time bucketing/rounding utilities
- [ ] `getFilterSettingsFromDOM()` - Read filter values from UI

### Strategy for parseJSON Refactoring

**Current State:**
```javascript
function parseJSON() {
    // UI updates
    hideFilterReminder();
    clearCaches();
    
    // DOM reading
    const input = document.getElementById("json-input").value;
    
    // Pure parsing
    const data = JSON.parse(input);
    const filtered = applyFilters(data);
    
    // Store data
    originalRequests = filtered;
    
    // UI updates
    showToast("Success");
    renderCharts();
    renderTables();
}
```

**Target State:**
```javascript
// In data-layer.js - Pure data parsing
export function parseCompletedRequests(jsonString, filters = {}) {
    const data = JSON.parse(jsonString);
    const filtered = applyFilters(data, filters);
    originalRequests = filtered;
    dataBus.dispatchEvent(new CustomEvent('dataReady', { detail: { count: filtered.length } }));
    return filtered;
}

// In main-legacy.js or ui-controller.js - UI orchestration
function parseJSON() {
    clearCaches();
    hideFilterReminder();
    
    const input = document.getElementById("json-input").value;
    const filters = getFilterSettingsFromDOM();
    
    try {
        const requests = parseCompletedRequests(input, filters);
        showToast("Success");
        renderCharts();
        renderTables();
    } catch (error) {
        showToast("Error: " + error.message, "error");
    }
}
```

---

## ⏳ Phase 5: Consumer Modules (PLANNED)

### Modules to Create

#### 1. charts.js
**Estimated Size:** ~5,000 lines

**Responsibilities:**
- Chart.js setup and configuration
- Chart instance lifecycle (create, update, destroy)
- Timeline charts (with zoom sync)
- Dashboard charts
- Analysis charts
- Query group charts

**Imports:**
- From `base.js`: Logger, TEXT_CONSTANTS
- From `data-layer.js`: originalRequests, parseTime, getNormalizedStatement

**Exports:**
- `initCharts()` - Create all charts
- `destroyAllCharts()` - Cleanup
- `destroyTimelineCharts()` - Cleanup timeline charts
- `syncChartZoom()` - Sync zoom across charts
- Chart instance getters/setters

#### 2. tables.js
**Estimated Size:** ~3,000 lines

**Responsibilities:**
- Table rendering (Every Query, Query Groups, Indexes)
- Row expand/collapse
- Sorting and filtering
- Copy to clipboard handlers
- Search functionality

**Imports:**
- From `base.js`: Logger, TEXT_CONSTANTS
- From `data-layer.js`: originalRequests, statementStore, allIndexes, parseTime

**Exports:**
- `renderTables()` - Main orchestrator
- `renderEveryQueryTable()`
- `renderQueryGroupsTable()`
- `renderIndexesTable()`

#### 3. flow-diagram.js
**Estimated Size:** ~2,000 lines

**Responsibilities:**
- Flow visualization builder
- Index/Query relationship extraction
- Drag/pan handlers
- Node/edge generation

**Imports:**
- From `base.js`: Logger, TEXT_CONSTANTS, isDevMode
- From `data-layer.js`: originalRequests, allIndexes, getOperators, statementStore

**Exports:**
- `buildFlowDiagram()`
- `updateFlowDiagram()`

#### 4. ui-helpers.js
**Estimated Size:** ~1,500 lines

**Responsibilities:**
- DOM utilities ($, $$, on, off)
- Modal dialogs (open, close)
- Toast notifications
- Copy to clipboard
- Debounce/throttle
- Formatters (formatDuration, formatNumber, formatBytes)

**Imports:**
- From `base.js`: Logger, TEXT_CONSTANTS

**Exports:**
- DOM utilities
- UX helpers
- Formatters

#### 5. insights.js (optional)
**Estimated Size:** ~2,000 lines

**Responsibilities:**
- Insights tab logic
- Automated analysis
- Anomaly detection

---

## 📊 Current Architecture

### File Structure
```
liquid_snake/
├── assets/
│   ├── css/
│   │   └── main.css (425 lines) ✅
│   └── js/
│       ├── base.js (413 lines) ✅ ES6 Module
│       ├── data-layer.js (161 lines) ✅ ES6 Module
│       ├── main.js (52 lines) ✅ ES6 Module (orchestrator)
│       ├── main-legacy.js (25,155 lines) 🟡 Classic Script
│       ├── charts.js (0 lines) ⏳ Planned
│       ├── tables.js (0 lines) ⏳ Planned
│       ├── flow-diagram.js (0 lines) ⏳ Planned
│       └── ui-helpers.js (0 lines) ⏳ Planned
├── docs/
│   ├── data-layer-architecture.md ✅
│   ├── data-buffet-api-guide.md ✅
│   └── MODULARIZATION_TICKET.md (this file) ✅
├── index.html ✅ Uses ES6 modules + legacy script
├── server.py ✅ Development server
└── test_base.html ✅ Test suite for base.js
```

### Module Dependency Graph
```
index.html
├── main.js (ES6 module)
│   ├── base.js
│   │   └── (no dependencies)
│   └── data-layer.js
│       └── base.js (imports Logger, TEXT_CONSTANTS)
└── main-legacy.js (classic script)
    └── window.DebugRedactor (from base.js)
```

**Target Dependency Graph:**
```
index.html
└── main.js (ES6 module orchestrator)
    ├── base.js (core utilities)
    ├── data-layer.js (data buffet)
    │   └── base.js
    ├── ui-helpers.js (DOM/UX utilities)
    │   └── base.js
    ├── charts.js (Chart.js visualizations)
    │   ├── base.js
    │   ├── data-layer.js
    │   └── ui-helpers.js
    ├── tables.js (table rendering)
    │   ├── base.js
    │   ├── data-layer.js
    │   └── ui-helpers.js
    └── flow-diagram.js (flow visualization)
        ├── base.js
        ├── data-layer.js
        └── ui-helpers.js
```

---

## 🎯 Next Steps (Priority Order)

### Immediate (Next Session)

1. **Extract ui-helpers.js** (EASY, ~4 hours)
   - [ ] DOM utilities ($, $$, on, off)
   - [ ] Toast notifications (showToast)
   - [ ] Modal helpers
   - [ ] Copy to clipboard
   - [ ] Formatters
   - [ ] Update main-legacy.js to import from ui-helpers.js
   - [ ] Test everything still works

2. **Extract more helpers to data-layer.js** (MEDIUM, ~2 hours)
   - [ ] `detectTimezoneFromData()`
   - [ ] `shouldExcludeSystemQuery()`
   - [ ] `filterSystemQueries()`
   - [ ] `getOperators()` with cache integration
   - [ ] Time bucketing utilities

3. **Refactor parseJSON** (HARD, ~8 hours)
   - [ ] Split into pure parsing function in data-layer.js
   - [ ] Keep UI orchestration in main-legacy.js
   - [ ] Wire up dataBus events
   - [ ] Test with real data

### Short Term (This Week)

4. **Extract charts.js** (HARD, ~12 hours)
   - [ ] Move Chart.js setup
   - [ ] Move all chart creation functions
   - [ ] Move zoom sync logic
   - [ ] Update event handlers
   - [ ] Test all charts render correctly

5. **Extract tables.js** (MEDIUM, ~8 hours)
   - [ ] Move table rendering functions
   - [ ] Move row expand/collapse
   - [ ] Move sorting/filtering
   - [ ] Test all tables work

### Medium Term (This Month)

6. **Extract flow-diagram.js** (MEDIUM, ~6 hours)
7. **Create main.js orchestrator** (EASY, ~2 hours)
8. **Remove main-legacy.js** (MILESTONE)
9. **Add unit tests** for all modules
10. **Update documentation**

---

## ⚠️ Risks & Mitigations

### Risk 1: Breaking Changes During Migration
**Mitigation:**
- Maintain backward compatibility via `window.*` globals
- Add deprecation warnings for old code paths
- Test frequently with real data
- Keep main-legacy.js working until full migration complete

### Risk 2: Performance Regression
**Mitigation:**
- Use browser profiling to compare before/after
- Maintain caching strategies
- Lazy load modules if needed

### Risk 3: Hidden Cross-Module Dependencies
**Mitigation:**
- Use ESLint with import/export rules
- Log deprecation warnings when legacy paths used
- Gradual migration (one module at a time)

---

## 📈 Success Metrics

- [ ] 0 lines in main-legacy.js (deleted)
- [ ] 100% test coverage for base.js and data-layer.js
- [ ] All existing functionality works
- [ ] No performance degradation (< 5% slower)
- [ ] Clean module dependency graph (no cycles)
- [ ] Documentation complete and up-to-date

---

## 🔗 Related Documentation

- [Data Layer Architecture](./data-layer-architecture.md) - Mermaid diagrams and separation strategy
- [Data Buffet API Guide](./data-buffet-api-guide.md) - Consumer documentation
- [AGENT.md](../../AGENT.md) - Development guidelines and feature flags
- [DEBUG_LOGGING_IMPLEMENTATION.md](../../DEBUG_LOGGING_IMPLEMENTATION.md) - Logging strategy

---

## 📝 Notes

### URL Flags Implemented
- `?dev=true` - Enable experimental features
- `?debug=true` - Enable debug logging (backward compatible)
- `?logLevel=trace|debug|info|warn|error` - Granular log control
- `?redact=true|false` - Control data redaction (default: true)

### Backward Compatibility Maintained
- `window.DebugRedactor` - Global access to hash utilities
- `window.TEXT_CONSTANTS` - Global access to i18n strings (in legacy code)
- Classic script loading for main-legacy.js
- All existing functionality works

### Development Server
- Start: `cd liquid_snake && python3 server.py`
- URL: http://localhost:5555/index.html
- Test Suite: http://localhost:5555/test_base.html

---

**Last Updated:** 2025-11-06  
**Next Review:** After ui-helpers.js extraction
