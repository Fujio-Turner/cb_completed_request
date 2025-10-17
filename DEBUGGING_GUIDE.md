# Debugging & Performance Testing Guide

**Version**: 3.22.0-post  
**Last Updated**: 2025-10-16  
**Purpose**: Comprehensive guide for debugging and performance testing the Couchbase Query Analyzer

---

## 📚 Table of Contents

1. [Overview](#overview)
2. [Performance Monitoring System](#performance-monitoring-system)
3. [How It Works](#how-it-works)
4. [Step-by-Step Testing Procedure](#step-by-step-testing-procedure)
5. [Understanding the Metrics](#understanding-the-metrics)
6. [Troubleshooting](#troubleshooting)
7. [Advanced Debugging Techniques](#advanced-debugging-techniques)

---

## Overview

### What This Guide Covers

This guide provides tools and procedures for:
- **Performance baseline testing** - Measure current performance before optimization
- **Memory leak detection** - Identify memory issues over multiple loads
- **Tab switching performance** - Measure lazy loading efficiency
- **Chart rendering analysis** - Profile Chart.js rendering bottlenecks
- **JSON parsing speed** - Track data processing performance

### When to Use This Guide

- Before starting optimization work (establish baseline)
- After making performance changes (verify improvements)
- When investigating reported slowness
- During code reviews for performance-critical changes
- For regression testing after major refactors

---

## Performance Monitoring System

### Architecture

The performance monitoring system works by:

1. **Intercepting console.log** - Captures existing performance logs without modifying source code
2. **Using Performance API** - Leverages browser's `performance.now()` for high-precision timing
3. **Memory profiling** - Uses Chrome's `performance.memory` API to track heap usage
4. **Manual instrumentation** - Provides helper functions for measuring specific operations

### Why This Approach?

**Non-invasive**: The script doesn't require modifying the application code. It wraps existing functionality to capture metrics.

**Accurate**: Uses `performance.now()` which provides microsecond precision, far better than `Date.now()`.

**Comprehensive**: Captures multiple dimensions of performance (time, memory, rendering).

**Reusable**: Once pasted into console, can be used for multiple test runs.

---

## How It Works

### Component Breakdown

#### 1. Performance Metrics Object

```javascript
window.performanceMetrics = {
    parseStart: 0,
    parseEnd: 0,
    tabSwitchTimes: {},      // Stores tab switch durations
    chartRenderTimes: {},    // Future: chart rendering times
    memorySnapshots: []      // Array of memory usage snapshots
};
```

**Why**: Creates a global object to store all metrics so they persist between function calls and can be accessed from console.

**How**: Attached to `window` object so it's accessible from anywhere in the application.

---

#### 2. Console.log Interception

```javascript
const originalLog = console.log;
console.log = function(...args) {
    const msg = args[0];
    if (typeof msg === 'string' && msg.includes('Parse performance:')) {
        const timeMatch = msg.match(/(\d+(\.\d+)?)ms/);
        if (timeMatch) {
            window.performanceMetrics.parseTime = parseFloat(timeMatch[1]);
            console.info('✅ Captured Parse Time:', timeMatch[1] + 'ms');
        }
    }
    originalLog.apply(console, args);
};
```

**Why**: The application already logs parse time to console. Instead of modifying the source, we intercept the log to capture the value.

**How**: 
- Saves the original `console.log` function
- Replaces it with our wrapper that inspects messages
- Looks for "Parse performance:" string
- Extracts the millisecond value using regex
- Stores it in our metrics object
- Calls original `console.log` so normal logging continues

**Regex Explained**: `(\d+(\.\d+)?)ms`
- `\d+` - Matches one or more digits (integer part)
- `(\.\d+)?` - Optionally matches decimal point and digits (decimal part)
- `ms` - Matches literal "ms" string
- Captures: "8ms", "123.45ms", "1000ms"

---

#### 3. Memory Snapshot Function

```javascript
window.takeMemorySnapshot = function() {
    if (performance.memory) {
        const snap = {
            timestamp: new Date().toISOString(),
            usedJSHeapSize: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
            totalJSHeapSize: (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
            jsHeapSizeLimit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB'
        };
        window.performanceMetrics.memorySnapshots.push(snap);
        console.info('📊 Memory Snapshot:', snap);
        return snap;
    } else {
        console.warn('⚠️ performance.memory not available');
    }
};
```

**Why**: Memory leaks are a common performance issue. Tracking memory over time helps identify if objects aren't being garbage collected.

**How**:
- Checks if `performance.memory` API is available (Chrome-only)
- Reads three memory metrics:
  - `usedJSHeapSize`: Currently used JavaScript heap memory
  - `totalJSHeapSize`: Total allocated heap (may be larger than used)
  - `jsHeapSizeLimit`: Maximum heap size allowed by browser
- Converts bytes to megabytes by dividing by 1048576 (1024 × 1024)
- Stores snapshot in array for comparison
- Returns snapshot for immediate inspection

**Memory Metrics Explained**:
- **usedJSHeapSize**: The actual memory your app is using right now
- **totalJSHeapSize**: Memory reserved by browser (includes unused allocated space)
- **jsHeapSizeLimit**: Browser's maximum memory limit (~2-4GB typically)

**Why Division by 1048576?**: Converts bytes to mebibytes (MiB). 1 MiB = 1024 × 1024 bytes = 1,048,576 bytes.

---

#### 4. Tab Switch Measurement

```javascript
window.measureTabSwitch = function(tabName) {
    const start = performance.now();
    window.performanceMetrics.tabSwitchStart = start;
    window.performanceMetrics.currentTab = tabName;
    console.info('⏱️ Started measuring tab switch to:', tabName);
};

window.measureTabSwitchEnd = function() {
    const end = performance.now();
    const duration = (end - window.performanceMetrics.tabSwitchStart).toFixed(2);
    const tabName = window.performanceMetrics.currentTab;
    window.performanceMetrics.tabSwitchTimes[tabName] = duration + 'ms';
    console.info('✅ Tab Switch Time (' + tabName + '):', duration + 'ms');
};
```

**Why**: Tab switching triggers lazy loading and chart rendering. Slow tabs indicate performance bottlenecks.

**How**:
- **measureTabSwitch**: Captures start time using `performance.now()` and stores tab name
- **measureTabSwitchEnd**: Captures end time, calculates duration, stores result

**Why Two Functions?**: User must manually click the tab between calls. This measures the real user-perceived performance including rendering, layout, and JavaScript execution.

**performance.now() vs Date.now()**:
- `performance.now()`: Microsecond precision, monotonic (doesn't change with system clock)
- `Date.now()`: Millisecond precision, can be affected by system clock changes
- Example: `performance.now()` might return `1234.567890`, `Date.now()` returns `1697456789000`

---

#### 5. Report Generation

```javascript
window.reportMetrics = function() {
    console.log('\n═══════════════════════════════════════');
    console.log('📊 PERFORMANCE BASELINE REPORT');
    console.log('═══════════════════════════════════════\n');
    
    console.log('⏱️ Parse Time:', window.performanceMetrics.parseTime || 'Not captured');
    console.log('\n📑 Tab Switch Times:');
    Object.entries(window.performanceMetrics.tabSwitchTimes).forEach(([tab, time]) => {
        console.log('  - ' + tab + ':', time);
    });
    
    console.log('\n💾 Memory Snapshots:');
    window.performanceMetrics.memorySnapshots.forEach((snap, i) => {
        console.log('  Snapshot ' + (i+1) + ':', snap.usedJSHeapSize + ' used');
    });
    
    console.log('\n═══════════════════════════════════════\n');
    
    return window.performanceMetrics;
};
```

**Why**: Consolidates all collected metrics into a single readable report.

**How**:
- Formats metrics into sections (Parse, Tabs, Memory)
- Uses `Object.entries()` to iterate over tab switch times
- Returns the raw metrics object for programmatic access
- Can be copy-pasted into documentation

---

## Step-by-Step Testing Procedure

### Prerequisites

**Browser**: Chrome (recommended for `performance.memory` support)  
**Dataset**: `sample/test_system_completed_requests.json`  
**Time**: ~10-15 minutes for full baseline

---

### Phase 1: Initial Setup

**Step 1.1: Open Application**
```bash
# Navigate to project directory
cd /Users/fujioturner/Documents/git_folders/fujio-turner/cb_completed_request

# Open in browser
open en/index.html
```

**Step 1.2: Open DevTools Console**
- Press `Cmd + Option + I` (Mac) or `F12` (Windows/Linux)
- Click **Console** tab
- Clear any existing messages (optional)

**Step 1.3: Install Performance Monitor**

Paste the following script into the console and press Enter:

```javascript
// Performance monitoring wrapper
(function() {
    window.performanceMetrics = {
        parseStart: 0,
        parseEnd: 0,
        tabSwitchTimes: {},
        chartRenderTimes: {},
        memorySnapshots: []
    };
    
    // Override console.log to capture parse timing
    const originalLog = console.log;
    console.log = function(...args) {
        const msg = args[0];
        if (typeof msg === 'string' && msg.includes('Parse performance:')) {
            const timeMatch = msg.match(/(\d+(\.\d+)?)ms/);
            if (timeMatch) {
                window.performanceMetrics.parseTime = parseFloat(timeMatch[1]);
                console.info('✅ Captured Parse Time:', timeMatch[1] + 'ms');
            }
        }
        originalLog.apply(console, args);
    };
    
    // Memory snapshot function
    window.takeMemorySnapshot = function() {
        if (performance.memory) {
            const snap = {
                timestamp: new Date().toISOString(),
                usedJSHeapSize: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
                totalJSHeapSize: (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
                jsHeapSizeLimit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB'
            };
            window.performanceMetrics.memorySnapshots.push(snap);
            console.info('📊 Memory Snapshot:', snap);
            return snap;
        } else {
            console.warn('⚠️ performance.memory not available (use Chrome with --enable-precise-memory-info)');
        }
    };
    
    // Tab switch timing
    window.measureTabSwitch = function(tabName) {
        const start = performance.now();
        window.performanceMetrics.tabSwitchStart = start;
        window.performanceMetrics.currentTab = tabName;
        console.info('⏱️ Started measuring tab switch to:', tabName);
    };
    
    window.measureTabSwitchEnd = function() {
        const end = performance.now();
        const duration = (end - window.performanceMetrics.tabSwitchStart).toFixed(2);
        const tabName = window.performanceMetrics.currentTab;
        window.performanceMetrics.tabSwitchTimes[tabName] = duration + 'ms';
        console.info('✅ Tab Switch Time (' + tabName + '):', duration + 'ms');
    };
    
    // Report all metrics
    window.reportMetrics = function() {
        console.log('\n═══════════════════════════════════════');
        console.log('📊 PERFORMANCE BASELINE REPORT');
        console.log('═══════════════════════════════════════\n');
        
        console.log('⏱️ Parse Time:', window.performanceMetrics.parseTime || 'Not captured');
        console.log('\n📑 Tab Switch Times:');
        Object.entries(window.performanceMetrics.tabSwitchTimes).forEach(([tab, time]) => {
            console.log('  - ' + tab + ':', time);
        });
        
        console.log('\n💾 Memory Snapshots:');
        window.performanceMetrics.memorySnapshots.forEach((snap, i) => {
            console.log('  Snapshot ' + (i+1) + ':', snap.usedJSHeapSize + ' used');
        });
        
        console.log('\n═══════════════════════════════════════\n');
        
        return window.performanceMetrics;
    };
    
    console.info('✅ Performance monitoring initialized!');
    console.info('📝 Available commands:');
    console.info('  - takeMemorySnapshot() - Take memory snapshot');
    console.info('  - measureTabSwitch("TabName") - Start tab switch measurement');
    console.info('  - measureTabSwitchEnd() - End tab switch measurement');
    console.info('  - reportMetrics() - Print full report');
})();
```

**Expected Output**:
```
✅ Performance monitoring initialized!
📝 Available commands:
  - takeMemorySnapshot() - Take memory snapshot
  - measureTabSwitch("TabName") - Start tab switch measurement
  - measureTabSwitchEnd() - End tab switch measurement
  - reportMetrics() - Print full report
```

---

### Phase 2: JSON Parse Performance Test

**What This Measures**: Time to parse JSON and process requests

**Step 2.1: Load Sample Data**
1. Copy contents of `sample/test_system_completed_requests.json`
2. Paste into **LEFT TOP** textarea in the application
3. Click outside the textarea to trigger parsing

**Step 2.2: Verify Capture**

Look for console output:
```
Parse performance: 8ms for 74 requests (0 filtered out early)
✅ Captured Parse Time: 8ms
```

**Why This Matters**: Parse time increases linearly with request count. Baseline helps identify if parsing becomes a bottleneck with large datasets.

---

### Phase 3: Memory Usage Test

**What This Measures**: JavaScript heap memory after data load

**Step 3.1: Take Initial Snapshot**

In console, run:
```javascript
takeMemorySnapshot();
```

**Expected Output**:
```
📊 Memory Snapshot: {
    timestamp: "2025-10-16T10:30:00.000Z",
    usedJSHeapSize: "15.42 MB",
    totalJSHeapSize: "20.10 MB",
    jsHeapSizeLimit: "2048.00 MB"
}
```

**Step 3.2: Interpret Results**

- **usedJSHeapSize**: Current memory usage (watch this value)
- **totalJSHeapSize**: Allocated memory (usually higher due to pre-allocation)
- **jsHeapSizeLimit**: Browser's max (typically 2-4GB)

**Healthy Range**: 10-30 MB for 1000 requests

**Warning Signs**:
- Used > 50 MB for small datasets (possible memory leak)
- Total grows much faster than used (fragmentation)
- Approaching limit (>1GB used)

---

### Phase 4: Tab Switch Performance Test

**What This Measures**: Lazy loading and rendering time for each tab

**Why 6 Tabs?**: Each tab lazy-loads different content:
- **Dashboard**: Chart grid with multiple Chart.js instances
- **Timeline**: Complex time-series charts with zoom/pan
- **Analysis**: Aggregated data table with batch rendering
- **Every Query**: Full query list with search/filter
- **Index/Query Flow**: SVG diagram with draggable elements
- **Indexes**: Index management interface

---

#### Test Dashboard Tab

**Step 4.1: Start Measurement**
```javascript
measureTabSwitch("Dashboard");
```

**Step 4.2: Click Dashboard Tab**
- Click the "Dashboard" tab in the UI
- Wait for all charts to render
- Observe any loading indicators

**Step 4.3: End Measurement**
```javascript
measureTabSwitchEnd();
```

**Expected Output**:
```
⏱️ Started measuring tab switch to: Dashboard
✅ Tab Switch Time (Dashboard): 456.78ms
```

---

#### Test Timeline Tab

**Repeat the process**:
```javascript
measureTabSwitch("Timeline");
// Click Timeline tab, wait for charts to load
measureTabSwitchEnd();
```

**Why This Tab Is Important**: Timeline tab creates multiple synchronized Chart.js instances with zoom/pan handlers. Often the slowest tab.

---

#### Test Analysis Tab

```javascript
measureTabSwitch("Analysis");
// Click Analysis tab, wait for table to render
measureTabSwitchEnd();
```

**What Happens Here**: Aggregates queries by normalized statement, calculates statistics, renders large table with batch processing.

---

#### Test Every Query Tab

```javascript
measureTabSwitch("Every Query");
// Click Every Query tab, wait for table to populate
measureTabSwitchEnd();
```

**Performance Note**: Should be fast due to pagination. Slow times indicate table rendering issues.

---

#### Test Index/Query Flow Tab

```javascript
measureTabSwitch("Index/Query Flow");
// Click Index/Query Flow tab, wait for diagram to render
measureTabSwitchEnd();
```

**What Happens Here**: Generates SVG diagram with connections, makes elements draggable, calculates positions.

---

#### Test Indexes Tab

```javascript
measureTabSwitch("Indexes");
// Click Indexes tab, wait for content to load
measureTabSwitchEnd();
```

**Note**: May show "No index data" if right textarea is empty. Time measures UI rendering, not data processing.

---

### Phase 5: Memory Leak Detection Test

**What This Measures**: Memory growth over multiple JSON loads

**Why Important**: Memory leaks cause gradual slowdown and eventual crashes in production.

**Step 5.1: Second Load - Snapshot 2**

1. Reload the JSON (paste again into left textarea)
2. Wait for parsing to complete
3. Click through all 6 tabs once
4. Take snapshot:
   ```javascript
   takeMemorySnapshot();
   ```

**Step 5.2: Third Load - Snapshot 3**

1. Reload the JSON again
2. Click through all 6 tabs once
3. Take snapshot:
   ```javascript
   takeMemorySnapshot();
   ```

**Step 5.3: Analyze Growth**

**Healthy Pattern**:
```
Snapshot 1: 15.42 MB
Snapshot 2: 16.10 MB  (+0.68 MB, +4.4%)
Snapshot 3: 16.35 MB  (+0.25 MB, +1.5%)
```
Memory increase slows down (garbage collector working).

**Memory Leak Pattern**:
```
Snapshot 1: 15.42 MB
Snapshot 2: 24.80 MB  (+9.38 MB, +60.8%)
Snapshot 3: 34.15 MB  (+9.35 MB, +37.7%)
```
Memory increases linearly with each load (leak detected).

**What Causes Leaks?**:
- Chart.js instances not destroyed
- Event listeners not removed
- Cached data not cleared
- Global variables accumulating

---

### Phase 6: Generate Final Report

**Step 6.1: Generate Report**

In console:
```javascript
reportMetrics();
```

**Expected Output**:
```
═══════════════════════════════════════
📊 PERFORMANCE BASELINE REPORT
═══════════════════════════════════════

⏱️ Parse Time: 8ms

📑 Tab Switch Times:
  - Dashboard: 456.78ms
  - Timeline: 823.45ms
  - Analysis: 234.12ms
  - Every Query: 89.34ms
  - Index/Query Flow: 567.89ms
  - Indexes: 12.45ms

💾 Memory Snapshots:
  Snapshot 1: 15.42 MB used
  Snapshot 2: 16.10 MB used
  Snapshot 3: 16.35 MB used

═══════════════════════════════════════
```

**Step 6.2: Save Results**

1. Copy the console output
2. Create file: `logs/release/performance_baseline_v3.22.0-post.txt`
3. Paste the results
4. Add environment details:
   ```
   Test Environment:
   - Browser: Chrome 131.0.6778.86
   - OS: macOS 15.4.1 arm64
   - CPU: Apple M1 Pro
   - RAM: 16GB
   - Dataset: 74 requests from test_system_completed_requests.json
   ```

**Step 6.3: Update Game Plan**

Open `settings/JS_OPTIMIZATION_GAME_PLAN.md` and fill in the baseline metrics section.

---

## Understanding the Metrics

### Parse Time

**What**: Time to parse JSON and process requests  
**Formula**: `JSON.parse()` + filtering + normalization  
**Good**: <50ms for 1000 requests  
**Warning**: >100ms for 1000 requests  
**Critical**: >500ms for 1000 requests

**Factors Affecting Parse Time**:
- Request count (linear relationship)
- JSON complexity (nested objects)
- Filter processing (system query exclusion)
- Statement normalization (regex operations)

---

### Tab Switch Time

**What**: Time from tab click to content fully rendered  
**Formula**: Click event → Lazy load check → Data processing → DOM rendering → Chart creation → Handler attachment

**Target Times**:
- **Dashboard**: <500ms (multiple charts)
- **Timeline**: <800ms (complex charts with zoom/pan)
- **Analysis**: <300ms (table with batch processing)
- **Every Query**: <200ms (simple table)
- **Index/Query Flow**: <600ms (SVG diagram)
- **Indexes**: <100ms (static content)

**Why Timeline Is Slowest**:
1. Creates 4+ Chart.js instances
2. Attaches zoom/pan handlers
3. Registers crosshair synchronization
4. Processes time-series data aggregation

---

### Memory Usage

**What**: JavaScript heap memory consumption  
**Healthy Range**: 10-30 MB for 1000 requests  
**Warning**: 50-100 MB  
**Critical**: >100 MB

**Memory Breakdown** (typical):
- Parsed JSON data: ~5-10 MB
- Chart.js instances: ~3-5 MB per chart
- DOM elements: ~2-5 MB
- Caches: ~2-3 MB
- Event handlers: ~1 MB

**Memory Leak Indicators**:
- Linear growth per reload
- Memory doesn't stabilize
- Used approaches total
- Garbage collection not helping

---

### Memory Leak Growth Rate

**Calculation**:
```javascript
Growth Rate = ((Snapshot2 - Snapshot1) / Snapshot1) * 100
```

**Acceptable**: <5% per reload  
**Concerning**: 5-20% per reload  
**Critical**: >20% per reload (active leak)

**Example**:
```
Snapshot 1: 15 MB
Snapshot 2: 16 MB
Growth: (16 - 15) / 15 * 100 = 6.67%  ← Slightly concerning
```

---

## Troubleshooting

### Issue: "performance.memory is undefined"

**Cause**: Chrome's memory API is disabled by default for security.

**Solution 1: Enable in Running Chrome**
1. Close Chrome completely
2. Open Terminal
3. Run:
   ```bash
   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --enable-precise-memory-info
   ```
4. Re-open the application

**Solution 2: Use Chrome Canary**
Chrome Canary often has fewer restrictions:
```bash
/Applications/Google\ Chrome\ Canary.app/Contents/MacOS/Google\ Chrome\ Canary --enable-precise-memory-info
```

**Alternative**: Use DevTools Memory Profiler (manual process):
1. Open DevTools → Memory tab
2. Take "Heap snapshot"
3. Compare snapshots manually

---

### Issue: Parse time not captured

**Symptom**: `reportMetrics()` shows "Parse Time: Not captured"

**Causes**:
1. Script pasted after JSON already loaded
2. Console.log interceptor not working
3. Application error prevented logging

**Solution**:
1. Refresh page
2. Paste monitoring script FIRST
3. THEN load JSON
4. Check for JavaScript errors in console

**Verification**:
Look for this message after loading JSON:
```
✅ Captured Parse Time: Xms
```

---

### Issue: Tab switch time seems incorrect

**Symptom**: Dashboard shows 5ms (too fast) or 50000ms (too slow)

**Causes**:
1. Forgot to call `measureTabSwitchEnd()`
2. Called end before tab finished loading
3. Measured wrong tab

**Solution**:
1. Always call `measureTabSwitch()` BEFORE clicking tab
2. Wait for content to fully load (watch for loading spinners)
3. THEN call `measureTabSwitchEnd()`

**Visual Cues Tab is Ready**:
- Dashboard: All chart squares visible
- Timeline: Both charts rendered
- Analysis: Table populated
- Every Query: Table shows data
- Index/Query Flow: Diagram visible
- Indexes: Content appears

---

### Issue: Memory growing unusually fast

**Symptom**: Snapshot 2 is 2x-3x Snapshot 1

**Possible Causes**:
1. Charts not being destroyed (`destroyAllCharts()` not called)
2. Event listeners accumulating
3. Cache not cleared before reload
4. Global arrays growing unbounded

**Investigation Steps**:

**Step 1: Check if charts destroyed**
```javascript
// In console
Object.keys(window).filter(k => k.includes('chart') || k.includes('Chart'));
```
Should see Chart.js globals only, not chart instance references.

**Step 2: Check cache sizes**
```javascript
// In console (after JSON load)
console.log('parseTimeCache size:', parseTimeCache?.size || 'not accessible');
console.log('normalizeStatementCache size:', normalizeStatementCache?.size || 'not accessible');
```

**Step 3: Take heap snapshot**
1. DevTools → Memory tab
2. Take Heap Snapshot
3. Look for "Detached DOM nodes" (memory leak indicator)
4. Search for "Chart" in snapshot (should be minimal)

---

### Issue: Timeline tab takes 5+ seconds

**Symptom**: `measureTabSwitchEnd()` shows >5000ms for Timeline

**Causes**:
1. Too many data points (no sampling)
2. Chart queue not processing efficiently
3. Browser extensions interfering
4. Hardware limitations

**Solutions**:

**Verify sampling is working**:
Look for console message:
```
Chart sampling: Using 1000 requests for performance
```

**Disable browser extensions**:
Open incognito mode to test without extensions:
```bash
# Mac
Cmd + Shift + N

# Windows
Ctrl + Shift + N
```

**Check CPU usage**:
1. Open Activity Monitor (Mac) / Task Manager (Windows)
2. Load Timeline tab
3. Watch Chrome CPU usage
4. Should spike then drop (normal)
5. Stays at 100% (problem)

---

## Advanced Debugging Techniques

### Using Chrome DevTools Performance Profiler

**When to Use**: Timeline tab slow, need to identify specific bottleneck

**Steps**:

1. **Open Performance Tab**
   - DevTools → Performance tab
   - Click record button (●)

2. **Perform Action**
   - Switch to Timeline tab
   - Wait for content to load
   - Stop recording (●)

3. **Analyze Timeline**
   - Look for long yellow bars (JavaScript execution)
   - Look for purple bars (Layout/Reflow)
   - Look for green bars (Rendering/Paint)

4. **Identify Bottleneck**
   - Click on long bar
   - Bottom panel shows function call stack
   - Find which function takes longest

**What to Look For**:

**Good Pattern**:
```
■■■ Script (200ms)
  ■ generateTimelineCharts (150ms)
  ■ Chart.js render (50ms)
■ Layout (30ms)
■ Paint (20ms)
```

**Bad Pattern**:
```
■■■■■■■■■ Script (2000ms)
  ■■■■ generateTimelineCharts (1500ms)
    ■■■■ Loop iteration (1200ms) ← BOTTLENECK
  ■■ Chart.js render (500ms)
■■■ Layout (300ms) ← Multiple reflows
■■ Paint (200ms)
```

---

### Memory Leak Deep Dive

**Scenario**: Memory grows 50MB per reload

**Step 1: Compare Heap Snapshots**

1. Take snapshot before first JSON load (Baseline)
2. Load JSON
3. Take snapshot (Snapshot 1)
4. Load JSON again
5. Take snapshot (Snapshot 2)
6. Compare Snapshot 2 vs Snapshot 1

**Step 2: Find Leaked Objects**

1. In comparison view, sort by "Size Delta"
2. Look for large positive deltas (memory increased)
3. Common culprits:
   - `(array)` - Growing arrays not cleared
   - `Chart` - Chart.js instances not destroyed
   - `EventListener` - Attached but not removed
   - `Detached DOM` - Elements removed from DOM but still in memory

**Step 3: Trace Retention Path**

1. Click on leaked object
2. Bottom panel shows "Retainers" (what's holding references)
3. Follow chain to find root cause

**Example Retainer Chain**:
```
Chart instance (10MB)
  ↑ held by
allCharts array (global variable)
  ↑ held by
Window object
```

**Fix**: Clear `allCharts` array before new parse.

---

### Throttle vs Debounce Testing

**When**: Search feels laggy or chart sync fires too often

**Throttle Test**:
```javascript
// In console
let callCount = 0;
const originalSync = syncTimelineCharts;
syncTimelineCharts = function(...args) {
    callCount++;
    console.log('Sync called:', callCount);
    return originalSync.apply(this, args);
};
// Now zoom/pan a chart and watch console
```

**Expected**: <10 calls per zoom action  
**Problem**: >50 calls per zoom action → Need throttle

**Debounce Test**:
```javascript
// Monitor search input
document.querySelector('#sql-filter-input').addEventListener('input', function() {
    console.log('Search triggered at:', Date.now());
});
// Type quickly and watch console
```

**Expected**: Delays until you stop typing  
**Problem**: Fires on every keystroke → Debounce not working

---

### Chart Rendering Bottleneck Analysis

**Symptom**: Dashboard loads slowly despite small dataset

**Test Individual Chart Creation**:

```javascript
// In console, test creating one chart
const start = performance.now();
const canvas = document.createElement('canvas');
canvas.width = 400;
canvas.height = 300;
document.body.appendChild(canvas);

new Chart(canvas, {
    type: 'bar',
    data: {
        labels: ['A', 'B', 'C'],
        datasets: [{
            data: [10, 20, 30]
        }]
    }
});

const duration = performance.now() - start;
console.log('Single chart creation:', duration.toFixed(2) + 'ms');
```

**Expected**: <50ms  
**Problem**: >200ms → Chart.js configuration issue or browser performance

---

### Lazy Loading Verification

**Check if tabs are truly lazy-loaded**:

```javascript
// Before clicking any tab
console.log('Dashboard loaded?', document.querySelector('#dashboard-content')?.children.length > 0);
console.log('Timeline loaded?', document.querySelector('#timeline-content')?.children.length > 0);

// Click Timeline tab

console.log('Timeline loaded now?', document.querySelector('#timeline-content')?.children.length > 0);
```

**Expected**:
```
Dashboard loaded? false
Timeline loaded? false
[Click Timeline tab]
Timeline loaded now? true
```

**Problem**: Both true before clicking → Lazy loading not working

---

## Performance Targets Summary

### Target Metrics (After Optimization)

| Metric | Current (Baseline) | Target | Method |
|--------|-------------------|--------|--------|
| Parse Time (1000 req) | ___ms | <50ms | Optimize filtering |
| Memory After Load | ___MB | <30MB | Clear caches |
| Dashboard Tab | ___ms | <500ms | Chart queue |
| Timeline Tab | ___ms | <800ms | Sampling + throttle |
| Analysis Tab | ___ms | <300ms | Batch processing |
| Every Query Tab | ___ms | <200ms | Virtual scrolling |
| Index/Query Flow | ___ms | <600ms | SVG optimization |
| Indexes Tab | ___ms | <100ms | DOM optimization |
| Memory Growth Rate | ___%  | <5% | Fix leaks |

---

## Quick Reference Commands

```javascript
// Initialize monitoring (paste first)
// [Paste full monitoring script from Phase 1]

// Take memory snapshot
takeMemorySnapshot();

// Measure tab switch
measureTabSwitch("TabName");
// [Click tab, wait for load]
measureTabSwitchEnd();

// Generate full report
reportMetrics();

// Check memory manually (if performance.memory unavailable)
console.log(performance.memory);

// List all global Chart instances
Object.keys(window).filter(k => k.includes('Chart'));
```

---

## Related Files

- [JS_OPTIMIZATION_GAME_PLAN.md](settings/JS_OPTIMIZATION_GAME_PLAN.md) - Step-by-step optimization plan
- [PERFORMANCE_TEST_SCRIPT.md](settings/PERFORMANCE_TEST_SCRIPT.md) - Condensed testing guide
- [AGENT.md](AGENT.md) - General development guide
- [logs/release/](logs/release/) - Performance baseline reports

---

## Changelog

**2025-10-16**: Initial creation for v3.22.0-post optimization (Issue #135)

---

## Contributing

When adding new performance tests:
1. Document the metric being measured
2. Explain why it matters
3. Provide interpretation guidance
4. Set realistic targets
5. Include troubleshooting steps
