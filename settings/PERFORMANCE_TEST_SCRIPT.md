# Performance Testing Script - Step 1 Baseline

**Date**: 2025-10-16  
**Version**: 3.22.0-post  
**Purpose**: Establish baseline performance metrics before optimization

---

## 🧪 Testing Environment Setup

### Browser Information
- **Browser**: (Fill in: Chrome, Firefox, Safari, Edge)
- **Version**: 
- **OS**: macOS 15.4.1 arm64
- **CPU**: 
- **RAM**: 

---

## 📊 Test Procedure

### Test 1: JSON Parse Performance (1000 Requests)

**Steps**:
1. Open `en/index.html` in browser
2. Open Browser DevTools (F12 or Cmd+Option+I)
3. Go to **Console** tab
4. Paste the performance monitoring script (below)
5. Load `sample/test_system_completed_requests.json` into LEFT textarea
6. Click outside textarea to trigger parse
7. Record metrics from console

**Performance Monitor Script** (paste in console BEFORE loading JSON):
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
        // User manually switches tab, then calls measureTabSwitchEnd
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

**Expected Output**: Console will show parse time automatically

---

### Test 2: Memory Usage After JSON Load

**Steps**:
1. After JSON loaded, run in console:
   ```javascript
   takeMemorySnapshot();
   ```
2. Record "usedJSHeapSize" value

---

### Test 3: Tab Switch Performance

**For Each Tab: Dashboard, Timeline, Analysis, Every Query, Index/Query Flow, Indexes**

**Steps**:
1. In console, run:
   ```javascript
   measureTabSwitch("Dashboard");
   ```
2. Manually click the tab
3. Wait for content to fully load
4. In console, run:
   ```javascript
   measureTabSwitchEnd();
   ```
5. Repeat for each tab

---

### Test 4: Chart Rendering Performance (Timeline Tab)

**Steps**:
1. Switch to Timeline tab
2. Open DevTools **Performance** tab (not Console)
3. Click Record button (●)
4. Refresh page
5. Load JSON again
6. Switch to Timeline tab
7. Stop recording
8. Look for "Scripting" and "Rendering" time
9. Take screenshot or note timings

---

### Test 5: Memory Leak Test (Multi-Load)

**Steps**:
1. Load JSON first time
   ```javascript
   takeMemorySnapshot(); // Snapshot 1
   ```
2. Switch through all tabs
3. Load JSON second time
   ```javascript
   takeMemorySnapshot(); // Snapshot 2
   ```
4. Switch through all tabs again
5. Load JSON third time
   ```javascript
   takeMemorySnapshot(); // Snapshot 3
   ```
6. Compare memory growth between snapshots

---

## 📝 Results Template

### Test Environment
```
Browser: Chrome 131.x
OS: macOS 15.4.1 arm64
CPU: Apple M1/M2/M3
RAM: 16GB
Dataset: sample/test_system_completed_requests.json (~1000 requests)
```

### Metrics
```
✅ Parse Time: ___ ms
✅ Memory After Load: ___ MB

Tab Switch Times:
  - Dashboard: ___ ms
  - Timeline: ___ ms
  - Analysis: ___ ms
  - Every Query: ___ ms
  - Index/Query Flow: ___ ms
  - Indexes: ___ ms

Chart Rendering (Timeline):
  - Scripting: ___ ms
  - Rendering: ___ ms
  - Total: ___ ms

Memory Leak Test:
  - Snapshot 1: ___ MB
  - Snapshot 2: ___ MB
  - Snapshot 3: ___ MB
  - Growth Rate: ___% per load
```

---

## 🎯 Performance Targets (Goals for Optimization)

After optimization, we aim for:
- ✅ Parse time: <50ms for 1000 requests
- ✅ Memory after load: <30MB
- ✅ Tab switch: <200ms per tab
- ✅ Chart rendering: <500ms for Timeline
- ✅ Memory growth: <5% per reload

---

## 📋 Final Step

Once all tests complete, run:
```javascript
reportMetrics();
```

Copy the output and save to:
`logs/release/performance_baseline_v3.22.0-post.txt`

Then update `JS_OPTIMIZATION_GAME_PLAN.md` with results.

---

## 🔧 Troubleshooting

### "performance.memory is undefined"
**Solution**: Launch Chrome with flag:
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --enable-precise-memory-info
```

### Parse time not captured
**Solution**: Ensure script is pasted BEFORE loading JSON

### Tab switch time seems wrong
**Solution**: Make sure to call `measureTabSwitchEnd()` AFTER tab fully loads

---

## ✅ Checklist

- [ ] Performance script pasted in console
- [ ] JSON loaded successfully
- [ ] Parse time recorded
- [ ] Memory snapshot taken
- [ ] All 6 tabs measured
- [ ] Chart rendering profiled
- [ ] Memory leak test completed
- [ ] Full report generated with `reportMetrics()`
- [ ] Results saved to game plan
