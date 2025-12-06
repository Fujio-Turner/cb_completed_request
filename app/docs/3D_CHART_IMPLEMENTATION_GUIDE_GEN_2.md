# 3D Chart Implementation Guide - Gen 2 (Liquid Snake)

This guide documents the step-by-step process for creating 3D charts in the **Liquid Snake** application using the modular `/assets/js/*.js` file structure.

## Table of Contents
1. [Overview](#overview)
2. [File Structure](#file-structure)
3. [Step-by-Step Implementation](#step-by-step-implementation)
4. [Code Templates](#code-templates)
5. [Feature Flag (Dev Mode)](#feature-flag-dev-mode)
6. [Testing Checklist](#testing-checklist)

---

## Overview

The Liquid Snake app uses a split JavaScript architecture:
- **main-legacy.js** - Contains the primary chart generation functions (used at runtime)
- **charts.js** - ES Module version (used for exports/imports)
- **main.js** - Orchestrator that imports from other modules

**Important**: When adding new chart functionality, you must add it to **main-legacy.js** as this is what the browser loads via `<script defer>`.

### 3D Chart Types Supported
- **bar3D** - Stacked or grouped 3D bar charts
- **scatter3D** - Bubble charts with variable sizes
- **line3D** - 3D line/trend charts

---

## File Structure

```
/liquid_snake/
├── index.html                    # Add 3D button HTML here
├── assets/
│   └── js/
│       ├── main-legacy.js        # ✅ PRIMARY: Add 3D functions here
│       ├── charts.js             # ES Module version (keep in sync)
│       ├── echarts.min.js        # ECharts core library
│       └── echarts-gl.min.js     # ECharts GL (3D support)
└── docs/
    └── 3D_CHART_IMPLEMENTATION_GUIDE_GEN_2.md  # This file
```

---

## Step-by-Step Implementation

### Step 1: Add 3D Button to HTML

Add the button inside the chart container in `index.html`:

```html
<div class="flex-1-height-400 chart-container draggable-chart" 
     data-chart-id="your-chart" 
     data-position="timeline-X" 
     style="position: relative;">
    
    <!-- Expand button (adjust left position) -->
    <div class="chart-expand-btn" title="Expand chart" style="left: 5px;">⛶</div>
    
    <!-- 3D Button (dev mode only) -->
    <button id="open-3d-YOUR-CHART-btn" 
            style="position: absolute; top: 5px; left: 35px; width: 32px; height: 32px; 
                   background: #ff8c00; color: white; border: none; border-radius: 4px; 
                   cursor: pointer; font-weight: bold; font-size: 12px; z-index: 100; 
                   display: none; box-shadow: 0 2px 4px rgba(0,0,0,0.2);" 
            title="Open ECharts 3D YOUR CHART">3D</button>
    
    <div class="chart-drag-handle" title="Drag to reposition">⋮⋮</div>
    <canvas id="your-chart"></canvas>
</div>
```

### Step 2: Add Button Handler in Chart Function

At the end of your `generateYourChart(requests)` function in **main-legacy.js**:

```javascript
// Setup 3D button click handler (dev mode only)
const btn3D = document.getElementById('open-3d-YOUR-CHART-btn');
if (btn3D) {
    // Check if dev mode is enabled
    const urlParams = new URLSearchParams(window.location.search);
    const isDevMode = urlParams.get('dev') === 'true';
    
    // Remove old event listeners
    const newBtn = btn3D.cloneNode(true);
    btn3D.parentNode.replaceChild(newBtn, btn3D);
    
    // Show button only if we have data AND dev mode is enabled
    newBtn.style.display = (requests && requests.length > 0 && isDevMode) ? 'block' : 'none';
    
    // Add click handler
    newBtn.addEventListener('click', function() {
        // Always regenerate 3D data to respect current filters
        createECharts3DYourChart(requests, grouping);
        // Open fullscreen
        expandECharts3DYourChart();
    });
}
```

### Step 3: Create Data Preparation Function

Add this function in **main-legacy.js** (after the chart generation function):

```javascript
// ============================================================
// 3D CHART: createECharts3DYourChart
// ============================================================
function createECharts3DYourChart(requests, grouping) {
    if (!requests || requests.length === 0) {
        Logger.debug(TEXT_CONSTANTS.NO_DATA_AVAILABLE || "No data available");
        return;
    }

    // Get all timeline buckets
    const timeBuckets = getTimelineBucketsFromRequests(requests, grouping);
    const timeGroups = {};

    // Initialize time buckets
    timeBuckets.forEach(ts => {
        timeGroups[ts.toISOString()] = {};
    });

    // Group data by collection and time bucket
    requests.forEach((request) => {
        if (!request.requestTime) return;

        const sql = request.statement || request.preparedText || "";
        const collections = extractCollectionsFromSQL(sql);
        
        const requestDate = getChartDate(request.requestTime);
        const timeKey = roundTimestamp(requestDate, grouping, requests);
        const key = timeKey.toISOString();

        // Your data aggregation logic here
        collections.forEach(collection => {
            if (!timeGroups[key][collection]) {
                timeGroups[key][collection] = {
                    // Initialize your metrics
                    count: 0,
                    value: 0
                };
            }
            // Aggregate your data
            timeGroups[key][collection].count++;
        });
    });

    // Get all unique collections sorted by count
    const collectionCounts = {};
    Object.values(timeGroups).forEach(group => {
        Object.entries(group).forEach(([collection, data]) => {
            if (!collectionCounts[collection]) {
                collectionCounts[collection] = 0;
            }
            collectionCounts[collection] += data.count;
        });
    });

    const allCollections = Object.keys(collectionCounts).sort((a, b) => {
        return collectionCounts[a] - collectionCounts[b]; // Ascending
    });

    if (allCollections.length === 0) {
        Logger.info('No data available for ECharts 3D chart');
        return;
    }

    // Build data points for ECharts
    const data = [];
    const collectionToIndex = {};
    allCollections.forEach((collection, idx) => {
        collectionToIndex[collection] = idx;
    });

    timeBuckets.forEach((ts, timeIndex) => {
        const key = ts.toISOString();
        const formattedTime = ts.toLocaleString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        Object.entries(timeGroups[key]).forEach(([collection, metrics]) => {
            if (metrics.count > 0) {
                data.push({
                    value: [timeIndex, collectionToIndex[collection], metrics.count],
                    collection: collection,
                    time: formattedTime,
                    actualCount: metrics.count
                });
            }
        });
    });

    // Store data globally for fullscreen modal
    window.echarts3DYourChartData = {
        data,
        timeBuckets,
        allCollections,
        collectionCounts
    };

    Logger.info(`✅ ECharts 3D YourChart data prepared: ${data.length} data points, ${allCollections.length} collections`);
}
```

### Step 4: Create Modal/Render Function

Add this function in **main-legacy.js**:

```javascript
// ============================================================
// 3D CHART: expandECharts3DYourChart
// ============================================================
function expandECharts3DYourChart() {
    const { data, timeBuckets, allCollections, collectionCounts } = window.echarts3DYourChartData;
    if (!data) return;

    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'chart-fullscreen-overlay active';
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 10000; display: flex; align-items: center; justify-content: center;';

    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.style.cssText = 'width: 95%; height: 95%; background: white; border-radius: 8px; padding: 20px; position: relative;';

    // Create close button
    const closeBtn = document.createElement('div');
    closeBtn.className = 'chart-collapse-btn';
    closeBtn.title = 'Collapse chart';
    closeBtn.innerHTML = '✕';
    closeBtn.onclick = () => {
        document.body.removeChild(overlay);
        document.body.style.overflow = '';
    };

    // Create fullscreen chart container
    const fullscreenChartDiv = document.createElement('div');
    fullscreenChartDiv.id = 'echarts-3d-yourchart-fullscreen';
    fullscreenChartDiv.style.cssText = 'width: calc(100% - 420px); height: 100%;';

    // Create controls container (right side panel)
    const controlsContainer = document.createElement('div');
    controlsContainer.style.cssText = 'position: absolute; top: 50px; right: 20px; width: 400px; background: white; border: 1px solid #444; border-radius: 4px; padding: 10px; max-height: calc(100% - 60px); overflow-y: auto;';

    // Add log scale toggle
    const togglesDiv = document.createElement('div');
    togglesDiv.style.cssText = 'margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #ddd;';
    togglesDiv.innerHTML = `
        <div style="margin-bottom: 8px;">
            <label style="display: flex; align-items: center; cursor: pointer; font-size: 13px; font-weight: bold;">
                <input type="checkbox" id="echarts-yourchart-log-scale-toggle" style="margin-right: 8px;">
                Log Scale Z-Axis
            </label>
        </div>
    `;
    controlsContainer.appendChild(togglesDiv);

    // Add collections legend with Show/Hide All buttons
    const legendHeader = document.createElement('div');
    legendHeader.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;';
    legendHeader.innerHTML = `
        <strong style="font-size: 14px;">Collections:</strong>
        <div>
            <button id="echarts-yourchart-fs-show-all" style="padding: 4px 12px; background: #4CAF50; color: white; border: none; border-radius: 3px; cursor: pointer; margin-right: 5px; font-size: 11px;">Show All</button>
            <button id="echarts-yourchart-fs-hide-all" style="padding: 4px 12px; background: #f44336; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;">Hide All</button>
        </div>
    `;
    controlsContainer.appendChild(legendHeader);

    // Add search input
    const searchContainer = document.createElement('div');
    searchContainer.style.cssText = 'margin-bottom: 10px;';
    searchContainer.innerHTML = `
        <input type="text" id="echarts-yourchart-legend-search" placeholder="Search collections..." style="width: 100%; font-size: 11px; padding: 6px 8px; border: 1px solid #dee2e6; border-radius: 3px; box-sizing: border-box;">
    `;
    controlsContainer.appendChild(searchContainer);

    // Create legend items grid
    const itemsGrid = document.createElement('div');
    itemsGrid.style.cssText = 'display: grid; grid-template-columns: 1fr; gap: 6px;';
    itemsGrid.id = 'echarts-yourchart-legend-items-grid';
    
    // Sort collections by count (descending) for legend
    const sortedCollections = [...allCollections].sort((a, b) => {
        return collectionCounts[b] - collectionCounts[a];
    });

    const visibilityState = {};
    sortedCollections.forEach(collection => {
        visibilityState[collection] = true;
        
        const count = collectionCounts[collection];
        const legendItem = document.createElement('div');
        legendItem.style.cssText = 'display: flex; align-items: center; padding: 5px; cursor: pointer; border-radius: 3px; margin-bottom: 2px; border: 1px solid #e0e0e0;';
        legendItem.dataset.collection = collection;
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = true;
        checkbox.style.cssText = 'margin-right: 8px; cursor: pointer;';
        
        const label = document.createElement('span');
        label.style.cssText = 'font-size: 12px; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
        label.textContent = `[${count.toLocaleString()}] ${collection}`;
        
        legendItem.appendChild(checkbox);
        legendItem.appendChild(label);
        
        legendItem.onclick = (e) => {
            if (e.target !== checkbox) {
                checkbox.checked = !checkbox.checked;
            }
            visibilityState[collection] = checkbox.checked;
            legendItem.style.opacity = checkbox.checked ? '1' : '0.3';
            updateChart();
        };
        
        itemsGrid.appendChild(legendItem);
    });

    controlsContainer.appendChild(itemsGrid);

    // Assemble modal
    modalContent.appendChild(closeBtn);
    modalContent.appendChild(fullscreenChartDiv);
    modalContent.appendChild(controlsContainer);
    overlay.appendChild(modalContent);
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    // Initialize ECharts
    const myChart = echarts.init(fullscreenChartDiv);

    function updateChart() {
        const useLogScale = document.getElementById('echarts-yourchart-log-scale-toggle')?.checked || false;
        
        // Filter data based on visibility
        const filteredData = data
            .filter(d => visibilityState[d.collection])
            .map(d => ({
                ...d,
                value: [d.value[0], d.value[1], useLogScale ? Math.log10(d.actualCount + 1) : d.actualCount]
            }));

        const option = {
            title: {
                text: 'Your Chart Title by Collection',
                left: 'center',
                top: 10,
                textStyle: { fontSize: 18, fontWeight: 'bold' }
            },
            tooltip: {
                formatter: function(params) {
                    const d = params.data;
                    return `Collection: ${d.collection}<br/>Time: ${d.time}<br/>Count: ${d.actualCount.toLocaleString()}`;
                }
            },
            xAxis3D: {
                type: 'category',
                data: timeBuckets.map((ts, idx) => idx),
                name: 'Request Time',
                nameTextStyle: { fontSize: 14, fontWeight: 'bold' },
                axisLabel: {
                    interval: Math.max(0, Math.ceil(timeBuckets.length / 10) - 1),
                    formatter: function(value) {
                        return timeBuckets[value].toLocaleString('en-US', { month: 'short', day: 'numeric' });
                    },
                    fontSize: 10
                }
            },
            yAxis3D: {
                type: 'category',
                data: allCollections,
                name: 'Collection',
                nameTextStyle: { fontSize: 14, fontWeight: 'bold' },
                axisLabel: {
                    interval: Math.max(0, Math.ceil(allCollections.length / 10) - 1),
                    fontSize: 10
                }
            },
            zAxis3D: {
                type: useLogScale ? 'log' : 'value',
                name: 'Count',
                nameTextStyle: { fontSize: 14, fontWeight: 'bold' },
                min: useLogScale ? 0.001 : 0
            },
            grid3D: {
                boxWidth: 250,
                boxDepth: Math.min(250, allCollections.length * 7),
                boxHeight: 150,
                viewControl: {
                    alpha: 22.9,
                    beta: 44.6,
                    distance: 453.0,
                    minDistance: 100,
                    maxDistance: 600
                },
                light: {
                    main: { intensity: 1.2, shadow: true },
                    ambient: { intensity: 0.3 }
                }
            },
            series: [{
                type: 'bar3D',
                data: filteredData,
                shading: 'lambert',
                itemStyle: {
                    color: '#007bff',
                    opacity: 0.9
                },
                emphasis: {
                    itemStyle: { color: '#0056b3', opacity: 1 }
                },
                label: { show: false }
            }]
        };
        
        myChart.setOption(option);
    }

    // Initial render
    updateChart();

    // Event listeners
    document.getElementById('echarts-yourchart-log-scale-toggle').addEventListener('change', updateChart);

    document.getElementById('echarts-yourchart-fs-show-all').addEventListener('click', () => {
        Object.keys(visibilityState).forEach(c => {
            visibilityState[c] = true;
            const item = itemsGrid.querySelector(`[data-collection="${c}"]`);
            if (item) {
                item.querySelector('input').checked = true;
                item.style.opacity = '1';
            }
        });
        updateChart();
    });

    document.getElementById('echarts-yourchart-fs-hide-all').addEventListener('click', () => {
        Object.keys(visibilityState).forEach(c => {
            visibilityState[c] = false;
            const item = itemsGrid.querySelector(`[data-collection="${c}"]`);
            if (item) {
                item.querySelector('input').checked = false;
                item.style.opacity = '0.3';
            }
        });
        updateChart();
    });

    document.getElementById('echarts-yourchart-legend-search').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        itemsGrid.querySelectorAll('[data-collection]').forEach(item => {
            item.style.display = item.dataset.collection.toLowerCase().includes(searchTerm) ? 'flex' : 'none';
        });
    });

    // Camera debug display (debug mode only)
    const urlParams = new URLSearchParams(window.location.search);
    const debugMode = urlParams.get('debug') === 'true' || urlParams.get('logLevel') === 'debug';
    if (debugMode) {
        const debugDiv = document.createElement('div');
        debugDiv.style.cssText = 'position: absolute; top: 60px; left: 10px; background: rgba(0,0,0,0.9); color: #00ff00; padding: 12px; font-family: monospace; font-size: 13px; z-index: 10002; border-radius: 4px; border: 2px solid #00ff00;';
        debugDiv.innerHTML = '<strong style="color: #ffff00;">Camera Position:</strong><br/>Alpha: 22.9<br/>Beta: 44.6<br/>Distance: 453.0';
        fullscreenChartDiv.appendChild(debugDiv);
        
        const cameraInterval = setInterval(() => {
            try {
                const opt = myChart.getOption();
                if (opt?.grid3D?.[0]?.viewControl) {
                    const vc = opt.grid3D[0].viewControl;
                    debugDiv.innerHTML = `<strong style="color: #ffff00;">Camera Position:</strong><br/>Alpha: ${vc.alpha.toFixed(1)}<br/>Beta: ${vc.beta.toFixed(1)}<br/>Distance: ${vc.distance.toFixed(1)}`;
                }
            } catch (e) {}
        }, 100);
        
        const originalClose = closeBtn.onclick;
        closeBtn.onclick = () => { clearInterval(cameraInterval); originalClose(); };
    }

    // Handle resize
    window.addEventListener('resize', () => myChart.resize());
}
```

---

## Feature Flag (Dev Mode)

The 3D button is **only visible when `?dev=true`** is in the URL. This allows experimental features to be tested without affecting production users.

```javascript
const urlParams = new URLSearchParams(window.location.search);
const isDevMode = urlParams.get('dev') === 'true';

// Show button only if dev mode AND data exists
newBtn.style.display = (requests && requests.length > 0 && isDevMode) ? 'block' : 'none';
```

**To test:** `http://localhost:5000/?dev=true`

---

## Axis Mapping (2D to 3D)

| 2D Chart | 2D X-Axis | 2D Y-Axis | 3D X-Axis | 3D Y-Axis | 3D Z-Axis |
|----------|-----------|-----------|-----------|-----------|-----------|
| Timeline | Request Time | Metric Value | Request Time | Collection | Metric Value |
| Stacked Bar | Time | Stacked Values | Time | Collection | Individual Values |

---

## Color Palette

Match 2D chart colors in 3D:
```javascript
// Example: Blue for primary, Red for secondary
const colors = {
    primary: '#007bff',
    secondary: '#dc3545',
    tertiary: '#28a745'
};
```

---

## Testing Checklist

- [ ] Button appears only with `?dev=true`
- [ ] Button hidden when no data
- [ ] 3D chart renders correctly
- [ ] Log scale toggle works
- [ ] Collection legend filters correctly
- [ ] Show All / Hide All buttons work
- [ ] Search filter works
- [ ] Tooltip displays correct data
- [ ] Close button works
- [ ] Camera debug shows (with `?debug=true`)
- [ ] Window resize handled

---

## Helper Functions Available

These functions are available in `main-legacy.js`:

| Function | Purpose |
|----------|---------|
| `getTimelineBucketsFromRequests(requests, grouping)` | Get time buckets for x-axis |
| `extractCollectionsFromSQL(sql)` | Extract collection names from SQL |
| `getChartDate(requestTime)` | Convert to chart-ready date |
| `roundTimestamp(date, grouping, requests)` | Round timestamp to grouping |
| `getOperators(plan)` | Extract operators from query plan |
| `parseTime(timeString)` | Parse time string to milliseconds |

---

## Example: Filter Operations 3D Chart

See the implementation in `main-legacy.js`:
- `createECharts3DFilterOperations()` - Data preparation
- `expandECharts3DFilterOperations()` - Modal rendering

This chart uses stacked bar3D to show:
- Blue bars: Filters where IN = OUT (efficient)
- Red bars: Filters where IN ≠ OUT (filtering occurred)

---

**Last Updated**: 2025-12-05  
**Version**: 3.29.3  
**Author**: Generated for Liquid Snake  
