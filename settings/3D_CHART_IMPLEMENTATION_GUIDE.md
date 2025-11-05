# 3D Chart Implementation Guide

This guide documents the complete step-by-step process for creating 3D charts using **ECharts GL**, based on the implementation in issues #195, #196, and #214.

## Table of Contents
1. [Overview](#overview) - Chart types and features
2. [Standard 3D Chart Pattern](#standard-3d-chart-pattern) - **IMPORTANT: Follow this pattern**
3. [Adding 2D Chart Legends to 3D Modals](#adding-2d-chart-legends-to-3d-modals-issue-221) - Dual legend system
4. [Camera Position Tuning](#camera-position-tuning) - Debug display for fine-tuning
5. [Implementation Steps](#implementation-steps) - Complete walkthrough
6. [Pattern 3D Chart](#pattern-3d-chart-implementation-dashboard) - Bar3D example
7. [Tooltip Design](#tooltip-design-guidelines) - Match 2D tooltips
8. [Color Palette](#color-palette-inheritance) - Inherit 2D chart colors
9. [Line3D Charts](#line3d-charts-future-enhancement) - Future line chart support
10. [Testing](#testing-checklist) - Verification steps
11. [Troubleshooting](#common-issues--solutions) - Common problems

## Overview

The final implementation adds a **"3D" button** to 2D Chart.js charts that opens a fullscreen ECharts GL 3D visualization. This guide covers three types of 3D charts:

1. **Timeline 3D Chart** (scatter3D with bubbles) - Duration Buckets → Collections × Time × Duration
2. **Pattern 3D Chart** (bar3D with bars) - Query Patterns → Collections × Patterns × Count
3. **Query Types 3D Chart** (scatter3D with bubbles + diamonds) - Statement Types → Time × Collections × Avg Duration

### Universal 3D Chart Features:
- **Interactive Legend**: Show/hide items, search filtering
- **Log Scale Toggle**: Switch between linear and logarithmic Z-axis scaling
- **Color Matching**: Uses same color palette as 2D chart
- **Tooltip Mirroring**: Based on 2D chart tooltip content
- **Camera Position Tuning**: Fine-tuned alpha, beta, distance values
- **Debug Mode**: Camera position display with `?debug=true`
- **Collection-Based Filtering**: Toggle collections on/off

---

## Standard 3D Chart Pattern

**IMPORTANT**: When creating a new 3D chart from a 2D chart, follow this standard pattern established in issue #214.

### Axis Mapping Rules

Map 2D chart axes to 3D chart axes as follows:

```
2D Chart               →  3D Chart
─────────────────────     ─────────────────────
X-Axis: Request Time   →  X-Axis: Request Time
Y-Axis: [Metric]       →  Z-Axis: [Metric]
[No Y-axis in 2D]      →  Y-Axis: Collection
```

**Example Mappings:**

| 2D Chart | 2D X-Axis | 2D Y-Axis | 3D X-Axis | 3D Y-Axis | 3D Z-Axis |
|----------|-----------|-----------|-----------|-----------|-----------|
| Query Duration by Statement Type | Request Time | Avg Duration | Request Time | Collection | Avg Duration |
| Duration Buckets | Request Time | Query Count | Request Time | Collection | Duration Range |
| Query Patterns | Request Time | Pattern Count | Request Time | Collection | Pattern Count |

### Title Format

Create a title that extends the 2D chart title with collection dimension:

```
2D Title: "Query Duration by Statement Type (Bubble Size = Query Count)"
3D Title: "Query Duration By Statement Type By Collection"

Pattern: [Shortened 2D Title] + " By Collection"
```

### Legend Configuration

**3D charts should include BOTH the 2D chart's original legend AND the Z-axis (Collection) legend** (Issue #221):

#### Pattern: Dual Legend System

```
┌─────────────────────────────┐
│ Log Scale Toggle            │
├─────────────────────────────┤
│ 2D Chart Legend (Original)  │ ← Duration Ranges / Statement Types / Size Ranges
│ - Show All / Hide All       │
│ - Checkbox items with color │
│ - Count per item            │
├─────────────────────────────┤
│ Collections (Z-Axis)        │ ← Always present
│ - Show All / Hide All       │
│ - Search input              │
│ - Checkbox items            │
└─────────────────────────────┘
```

#### Static 2D Legends (Fixed Ranges)

For charts with predefined buckets (Duration, Document Size):

```javascript
// Duration Range bins (from 2D chart)
const durationRangeBins = [
    { range: "0-1s", min: 0, max: 1, color: "#28a745", label: "0-1s" },
    { range: "1-2s", min: 1, max: 2, color: "#6cb2eb", label: "1-2s" },
    // ... all buckets from 2D chart
];

// Calculate counts for each range
const durationRangeCounts = {};
durationRangeBins.forEach((bin, idx) => {
    durationRangeCounts[bin.label] = data.filter(d => d.value[2] === idx).reduce((sum, d) => sum + d.actualCount, 0);
});

const durationVisibilityState = {};

// Create legend items with color boxes
durationRangeBins.forEach((bin, idx) => {
    durationVisibilityState[idx] = true;
    
    const legendItem = document.createElement('div');
    legendItem.dataset.durationIndex = idx;
    
    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = true;
    
    // Color box matching 2D chart
    const colorBox = document.createElement('span');
    colorBox.style.cssText = `display: inline-block; width: 16px; height: 16px; background: ${bin.color}; margin-right: 8px; border: 1px solid #333; border-radius: 2px;`;
    
    // Label with count
    const label = document.createElement('span');
    label.textContent = `${bin.label} (${durationRangeCounts[bin.label]} total)`;
    
    // Click handler
    legendItem.onclick = (e) => {
        durationVisibilityState[idx] = checkbox.checked;
        updateChart();
    };
});

// Filter data by both collection AND range
function calculateBubbleSizes() {
    return data
        .filter(d => visibilityState[d.collection] && durationVisibilityState[d.value[2]])
        .map(d => { /* ... */ });
}
```

**Examples:**
- Duration Buckets 3D: Uses duration range legend (0-1s, 1-2s, etc.)
- Avg Doc Size 3D: Uses document size legend (0 bytes, 1-10 bytes, etc.)

#### Dynamic 2D Legends (Data-Driven)

For charts with variable categories (Statement Types, Query Patterns):

```javascript
// Statement types come from actual data (not hardcoded)
const displayStatementTypes = [...sortedStatementTypes].sort((a, b) => {
    return (statementTypeCounts[b] || 0) - (statementTypeCounts[a] || 0);
});

const statementTypeVisibilityState = {};

// Add Fatal Queries if present
const totalFatalCount = fatalData.reduce((sum, d) => sum + d.actualCount, 0);
if (totalFatalCount > 0) {
    statementTypeVisibilityState['FATAL_QUERIES'] = true;
    // Create legend item for Fatal Queries
}

// Create legend items for each statement type in the data
displayStatementTypes.forEach(statementType => {
    statementTypeVisibilityState[statementType] = true;
    
    const count = statementTypeCounts[statementType];
    const colorBox = document.createElement('span');
    colorBox.style.cssText = `background: ${colorMap[statementType] || '#868e96'}; /* ... */`;
    
    const label = document.createElement('span');
    label.textContent = `${statementType} (${count} total)`; // Dynamic name and count
});

// Filter by statement type
function calculateBubbleSizes() {
    return bubbleData
        .filter(d => visibilityState[d.collection] && statementTypeVisibilityState[d.statementType])
        .map(d => { /* ... */ });
}
```

**Examples:**
- Query Types 3D: Uses statement type legend (SELECT, UPDATE, EXECUTE, etc.) - fully dynamic
- Pattern 3D: Uses query pattern legend (WITH, LIMIT, JOIN, etc.) - depends on queries

#### Collections Legend (Always Present)

```javascript
// Sort collections by count (descending) for legend display
const displayCollections = [...sortedCollections].sort((a, b) => {
    return (collectionCounts[b] || 0) - (collectionCounts[a] || 0);
});

// Legend items show: [count] collection_name
label.textContent = `[${count}] ${collection}`;
```

**Legend Features:**
- Checkbox for each collection
- Search/filter input
- Show All / Hide All buttons
- Count displayed in brackets
- Sorted by count (highest first)

### Log Scale Toggle

**Controls Z-Axis Scale** (not bubble size):

```javascript
// Checkbox HTML (unchecked by default)
<input type="checkbox" id="echarts-[chartname]-log-scale-toggle" style="margin-right: 8px;">
Log Scale Z-Axis ([Metric Name])

// Usage in chart options
zAxis3D: {
    type: useLogScale ? 'log' : 'value',
    name: '[Metric Name]',
    min: useLogScale ? 0.001 : 0,
    // ...
}
```

**Default State:** Unchecked (linear scale)

### Debug Mode Camera Display

When `?debug=true` is in URL, show live camera position:

```javascript
// Add camera position debug display
const urlParams = new URLSearchParams(window.location.search);
const debugMode = urlParams.get('debug') === 'true' || urlParams.get('logLevel') === 'debug';

if (debugMode) {
    const debugDiv = document.createElement('div');
    debugDiv.id = 'camera-debug-[chartname]';
    debugDiv.style.cssText = 'position: absolute; top: 60px; left: 10px; background: rgba(0,0,0,0.9); color: #00ff00; padding: 12px; font-family: monospace; font-size: 13px; z-index: 10002; border-radius: 4px; border: 2px solid #00ff00; box-shadow: 0 0 10px rgba(0,255,0,0.5);';
    debugDiv.innerHTML = '<strong style="color: #ffff00;">Camera Position:</strong><br/>Alpha: 25.0<br/>Beta: 45.0<br/>Distance: 350.0';
    fullscreenChartDiv.appendChild(debugDiv);
    
    // Continuously poll camera position (updates every 100ms)
    const cameraUpdateInterval = setInterval(function() {
        try {
            const option = myChart.getOption();
            if (option && option.grid3D && option.grid3D[0] && option.grid3D[0].viewControl) {
                const vc = option.grid3D[0].viewControl;
                debugDiv.innerHTML = `
                    <strong style="color: #ffff00;">Camera Position:</strong><br/>
                    Alpha: ${vc.alpha.toFixed(1)}<br/>
                    Beta: ${vc.beta.toFixed(1)}<br/>
                    Distance: ${vc.distance.toFixed(1)}
                `;
            }
        } catch (e) {
            // Silently fail
        }
    }, 100);
    
    // Clean up interval when modal closes
    closeBtn.addEventListener('click', function() {
        clearInterval(cameraUpdateInterval);
    });
}
```

**Why polling instead of events?**
- ECharts `viewControlchanged` event doesn't always fire reliably
- Polling every 100ms provides smooth real-time updates
- Low performance impact (simple read operation)

### Tooltip Style

Match the 2D chart tooltip format, adapted for 3D context:

```javascript
tooltip: {
    formatter: function(params) {
        const d = params.data;
        // Include: Statement Type, Collection, Time, Metrics
        return `<strong>${d.statementType}</strong><br/>Collection: ${d.collection}<br/>Time: ${d.time}<br/>Avg Duration: ${d.avgDuration.toFixed(3)}s<br/>Count: ${d.actualCount}<br/>Min: ${d.minDuration.toFixed(3)}s<br/>Max: ${d.maxDuration.toFixed(3)}s`;
    }
}
```

**Tooltip Content Guidelines:**
1. **First line**: Primary category (bold) - e.g., Statement Type
2. **Second line**: Collection name
3. **Third line**: Time bucket
4. **Remaining lines**: Metrics from 2D chart (Avg, Count, Min, Max)
5. **Formatting**: Use `.toFixed(3)` for durations, `.toLocaleString()` for large counts

### Complete Example: Query Types 3D Chart

See implementation in issue #214 for a complete reference example that follows all these patterns.

**Key Files:**
- Data preparation: `createECharts3DQueryTypes()`
- Modal/rendering: `expandECharts3DQueryTypes()`
- Button handler: Added to `createQueryTypesChart()`

---

## Chart Type Support

### Scatter3D Charts (Bubbles)
Used for: Timeline charts with continuous data points
- Variable bubble sizes based on query count
- Color-coded by category (duration bucket, status, etc.)
- X/Y/Z axes map to 3 dimensions of data

### Bar3D Charts (3D Bars)
Used for: Categorical comparisons (patterns, collections)
- Fixed bar width/depth
- Height represents value (count, duration, etc.)
- Color gradient based on intensity

### Line3D Charts (Lines - Future)
Used for: Trend analysis over time
- Connect data points in sequence
- Show progression along time axis
- Multiple lines for different categories

---

## Adding 2D Chart Legends to 3D Modals (Issue #221)

### Overview

Each 3D modal should display **two legends**:
1. **Original 2D Legend** - The legend from the corresponding 2D chart (duration ranges, statement types, etc.)
2. **Collections Legend** - The Z-axis dimension added in 3D view

This provides users with familiar filtering from the 2D chart plus the new collection dimension.

### Complete Implementation Pattern

#### Step 1: Identify 2D Legend Type

Determine if your 2D chart uses:
- **Static Legend**: Fixed buckets (duration ranges: 0-1s, 1-2s, etc.)
- **Dynamic Legend**: Data-driven categories (statement types: SELECT, UPDATE, etc.)

#### Step 2: Add Legend Section Before Collections

Insert the 2D legend **above** the Collections legend and **below** the Log Scale toggle:

```javascript
controlsContainer.appendChild(togglesDiv); // Log scale toggle

// ✅ ADD 2D LEGEND HERE (Duration/Statement/Size)
const originalLegendHeader = document.createElement('div');
originalLegendHeader.innerHTML = `
    <strong style="font-size: 14px;">[Legend Name]:</strong>
    <div>
        <button id="[chart-id]-show-all-[type]">Show All</button>
        <button id="[chart-id]-hide-all-[type]">Hide All</button>
    </div>
`;
controlsContainer.appendChild(originalLegendHeader);

// Create legend items grid
// ... (see examples below)

// ✅ Collections legend comes after
const collectionsHeader = document.createElement('div');
// ...
```

#### Step 3A: Static Legend Implementation Example

**Duration Buckets 3D Chart:**

```javascript
// Calculate counts per duration range
const durationRangeCounts = {};
durationBucketDefinitions.forEach((bin, idx) => {
    durationRangeCounts[bin.label] = data.filter(d => d.value[2] === idx)
        .reduce((sum, d) => sum + d.actualCount, 0);
});

const durationVisibilityState = {};

durationBucketDefinitions.forEach((bin, idx) => {
    durationVisibilityState[idx] = true;
    
    const legendItem = document.createElement('div');
    legendItem.dataset.durationIndex = idx; // Use index for Z-axis filtering
    
    const colorBox = document.createElement('span');
    colorBox.style.cssText = `background: ${durationColors[idx]}; /* ... */`;
    
    const label = document.createElement('span');
    label.textContent = `${bin.label} (${durationRangeCounts[bin.label]} total)`;
    
    legendItem.onclick = (e) => {
        durationVisibilityState[idx] = checkbox.checked;
        updateChart(); // Triggers chart re-render
    };
});

// Filtering: Check Z-axis index matches visible range
function calculateBubbleSizes() {
    const durationIdx = d.value[2]; // Z-axis is bucket index
    if (!visibilityState[d.collection] || !durationVisibilityState[durationIdx]) return null;
    // ...
}
```

#### Step 3B: Dynamic Legend Implementation Example

**Query Types 3D Chart:**

```javascript
const statementTypeVisibilityState = {};

// Add Fatal Queries if present (special category)
const totalFatalCount = fatalData.reduce((sum, d) => sum + d.actualCount, 0);
if (totalFatalCount > 0) {
    statementTypeVisibilityState['FATAL_QUERIES'] = true;
    // Create Fatal Queries legend item with red styling
}

// Loop through actual statement types from data
const displayStatementTypes = [...sortedStatementTypes].sort((a, b) => {
    return (statementTypeCounts[b] || 0) - (statementTypeCounts[a] || 0);
});

displayStatementTypes.forEach(statementType => {
    statementTypeVisibilityState[statementType] = true;
    
    const count = statementTypeCounts[statementType]; // Count from data
    const color = colorMap[statementType] || '#868e96'; // Color from map
    
    const colorBox = document.createElement('span');
    colorBox.style.cssText = `background: ${color}; /* ... */`;
    
    const label = document.createElement('span');
    label.textContent = `${statementType} (${count} total)`; // Name from data
});

// Filtering: Check statement type matches data property
function calculateBubbleSizes() {
    if (!statementTypeVisibilityState[d.statementType]) return null; // d.statementType is from data
    // ...
}
```

#### Step 4: Add Show/Hide All Handlers

```javascript
// Duration/Statement/Size Range handlers
document.getElementById('[chart-id]-show-all-[type]').addEventListener('click', () => {
    Object.keys([type]VisibilityState).forEach(key => {
        [type]VisibilityState[key] = true;
        const item = [type]ItemsGrid.querySelector(`[data-[type]-index="${key}"]`);
        if (item) {
            item.querySelector('input').checked = true;
            item.style.opacity = '1';
        }
    });
    updateChart();
});

document.getElementById('[chart-id]-hide-all-[type]').addEventListener('click', () => {
    // Same pattern but set to false
});

// Collection handlers (same pattern)
document.getElementById('[chart-id]-show-all').addEventListener('click', () => {
    // ...
});
```

### Current Implementation Status

| 3D Chart | 2D Legend Type | Legend Content | Status |
|----------|---------------|----------------|--------|
| Duration Buckets 3D | Static | Duration Ranges (0-1s, 1-2s, ..., 900s+) | ✅ Implemented |
| Query Types 3D | Dynamic | Statement Types (SELECT, UPDATE, EXECUTE, Fatal) | ✅ Implemented |
| Avg Doc Size 3D | Static | Document Sizes (0 bytes, 1-10 bytes, ..., 15MB-20MB) | ✅ Implemented |
| Pattern 3D | Dynamic | Query Patterns (WITH, LIMIT, JOIN, etc.) | ⏳ Not yet implemented |

---

## Camera Position Tuning

### Debug Display for Camera Values

When developing 3D charts, add a temporary debug display to show current camera position:

```javascript
// Inside grid3D configuration
grid3D: {
    // ... other config
    viewControl: {
        alpha: 22.9,
        beta: 44.6,
        distance: 453.0,
        minDistance: 100,
        maxDistance: 600
    }
},

// Add after chart initialization
myChart.on('viewControlchanged', function(params) {
    // Create/update debug div
    let debugDiv = document.getElementById('camera-debug');
    if (!debugDiv) {
        debugDiv = document.createElement('div');
        debugDiv.id = 'camera-debug';
        debugDiv.style.cssText = 'position: fixed; top: 10px; left: 10px; background: rgba(0,0,0,0.8); color: white; padding: 10px; font-family: monospace; font-size: 12px; z-index: 10001; border-radius: 4px;';
        document.body.appendChild(debugDiv);
    }
    
    const vc = myChart.getOption().grid3D[0].viewControl;
    debugDiv.innerHTML = `
        <strong>Camera Position:</strong><br/>
        Alpha: ${vc.alpha.toFixed(1)}<br/>
        Beta: ${vc.beta.toFixed(1)}<br/>
        Distance: ${vc.distance.toFixed(1)}
    `;
});
```

**To use**:
1. Add this code temporarily when developing a new 3D chart
2. Rotate/zoom the chart to find optimal viewing angle
3. Note the alpha, beta, distance values
4. Update `grid3D.viewControl` with these values
5. Remove the debug div code before committing

### Current Camera Positions

#### Timeline 3D Chart (Scatter3D - Bubbles)
```javascript
viewControl: {
    alpha: 22.9,    // Vertical rotation (0-90°, higher = more top-down)
    beta: 44.6,     // Horizontal rotation (0-360°)
    distance: 453.0, // Zoom level (higher = zoomed out)
    minDistance: 100,
    maxDistance: 600
}
```

**Rationale**: Slightly elevated view to see bubbles along time axis without occlusion

#### Pattern 3D Chart (Bar3D - Bars)
```javascript
viewControl: {
    alpha: 19.3,     // Lower angle to see bar heights
    beta: 41.1,      // Similar horizontal rotation
    distance: 362.6, // Closer zoom for bar details
    minDistance: 100,
    maxDistance: 500
}
```

**Rationale**: Lower angle emphasizes bar heights, closer zoom for readability

---

## Implementation Steps

### Step 1: Add ECharts GL Libraries

Add the ECharts and ECharts GL CDN scripts to the `<head>` section of `index.html`:

```html
<!-- Include ECharts for alternative 3D visualization -->
<script src="https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/echarts-gl@2.0.9/dist/echarts-gl.min.js"></script>
```

**Location**: In the `<head>` section, after Chart.js and before other script tags

**Reference**: Commit `af9122f` (2025-10-27)

---

### Step 2: Add 3D Button to Duration Buckets Chart

Add a "3D" button to the existing Chart.js Duration Buckets chart container:

```html
<!-- Row 2: Duration Buckets & Query Types -->
<div class="display-flex gap-20 margin-bottom-20">
    <div class="flex-1-height-400 chart-container draggable-chart" data-chart-id="duration-buckets" data-position="timeline-1">
        <div class="chart-expand-btn" title="Expand chart" style="left: 5px;">⛶</div>
        
        <!-- 3D Button -->
        <button id="open-3d-timeline-chart-btn" 
                style="position: absolute; top: 5px; left: 35px; width: 32px; height: 32px; 
                       background: #ff8c00; color: white; border: none; border-radius: 4px; 
                       cursor: pointer; font-weight: bold; font-size: 12px; z-index: 100; 
                       display: none; box-shadow: 0 2px 4px rgba(0,0,0,0.2);" 
                title="Open ECharts 3D Timeline">3D</button>
        
        <div class="chart-drag-handle" title="Drag to reposition">⋮⋮</div>
        <canvas id="duration-buckets-chart"></canvas>
    </div>
    <!-- ... Query Types chart ... -->
</div>
```

**Key Styling**:
- Position: `absolute; top: 5px; left: 35px` (next to expand button)
- Color: `#ff8c00` (orange) to stand out
- Initially hidden: `display: none` (shown only when data is available)
- Z-index: `100` to stay on top

---

### Step 3: Setup Button Click Handler

In the `createDurationBucketsChart()` function, add event listener for the 3D button:

```javascript
// After creating the Chart.js chart...

// Setup 3D button click handler
const btn3D = document.getElementById('open-3d-timeline-chart-btn');
if (btn3D) {
    // Show button only if we have data
    btn3D.style.display = (requests && requests.length > 0) ? 'block' : 'none';
    
    // Remove old event listeners (prevents duplicate handlers)
    const newBtn = btn3D.cloneNode(true);
    btn3D.parentNode.replaceChild(newBtn, btn3D);
    
    // Add click handler
    newBtn.addEventListener('click', function() {
        // Generate ECharts data if not already available
        if (!window.echartsTimelineData) {
            createECharts3DCollectionTimeline(requests, grouping);
        }
        // Open fullscreen modal
        expandECharts3DTimeline();
    });
}
```

**Key Points**:
- Only shows button when `requests.length > 0`
- Clones button to remove old listeners (prevents memory leaks)
- Lazy-generates 3D data only when first clicked
- Opens fullscreen modal with ECharts 3D visualization

**Location**: Inside `createDurationBucketsChart()` function, after Chart.js initialization

---

### Step 4: Create Data Preparation Function

Implement `createECharts3DCollectionTimeline()` to aggregate and prepare data for ECharts GL:

#### 4.1 Duration Bucket Definitions

Define 13 duration buckets (same as 2D charts):

```javascript
function createECharts3DCollectionTimeline(requests, grouping) {
    if (!requests || requests.length === 0) {
        Logger.debug(TEXT_CONSTANTS.NO_DATA_AVAILABLE || "No data available");
        return;
    }

    // Duration buckets and their numeric values for Z-axis (in seconds)
    const durationBucketDefinitions = [
        { label: "0-1s", min: 0, max: 1, value: 0 },
        { label: "1-2s", min: 1, max: 2, value: 1 },
        { label: "2-3s", min: 2, max: 3, value: 2 },
        { label: "3-4s", min: 3, max: 4, value: 3 },
        { label: "4-5s", min: 4, max: 5, value: 4 },
        { label: "5-10s", min: 5, max: 10, value: 5 },
        { label: "10-30s", min: 10, max: 30, value: 6 },
        { label: "30-60s", min: 30, max: 60, value: 7 },
        { label: "60-120s", min: 60, max: 120, value: 8 },
        { label: "120-240s", min: 120, max: 240, value: 9 },
        { label: "240-500s", min: 240, max: 500, value: 10 },
        { label: "500-900s", min: 500, max: 900, value: 11 },
        { label: "900s+", min: 900, max: Infinity, value: 12 }
    ];
```

#### 4.2 Duration Colors

Define color palette matching Timeline tab charts:

```javascript
    // Color palette for duration buckets (matching timeline charts)
    const durationColors = [
        'rgba(76, 175, 80, 0.7)',    // 0-1s: Green
        'rgba(33, 150, 243, 0.7)',   // 1-2s: Blue
        'rgba(255, 193, 7, 0.7)',    // 2-3s: Amber/Yellow
        'rgba(255, 152, 0, 0.7)',    // 3-4s: Orange
        'rgba(244, 67, 54, 0.7)',    // 4-5s: Red
        'rgba(156, 39, 176, 0.7)',   // 5-10s: Purple
        'rgba(96, 125, 139, 0.7)',   // 10-30s: Blue Grey
        'rgba(0, 0, 0, 0.7)',        // 30-60s: Black
        'rgba(121, 85, 72, 0.7)',    // 60-120s: Brown
        'rgba(139, 0, 0, 0.7)',      // 120-240s: Dark Red
        'rgba(75, 0, 130, 0.7)',     // 240-500s: Indigo
        'rgba(0, 0, 0, 0.8)',        // 500-900s: Black
        'rgba(0, 0, 0, 0.9)'         // 900s+: Black
    ];
```

#### 4.3 Duration Bucket Helper Function

```javascript
    // Get duration bucket index from elapsed time in seconds
    function getDurationBucketIndex(durationSeconds) {
        if (durationSeconds < 1) return 0;
        else if (durationSeconds < 2) return 1;
        else if (durationSeconds < 3) return 2;
        else if (durationSeconds < 4) return 3;
        else if (durationSeconds < 5) return 4;
        else if (durationSeconds < 10) return 5;
        else if (durationSeconds < 30) return 6;
        else if (durationSeconds < 60) return 7;
        else if (durationSeconds < 120) return 8;
        else if (durationSeconds < 240) return 9;
        else if (durationSeconds < 500) return 10;
        else if (durationSeconds < 900) return 11;
        else return 12; // 900s+
    }
```

#### 4.4 Data Aggregation

Group queries by collection, time bucket, and duration bucket:

```javascript
    // Get all timeline buckets
    const timeBuckets = getTimelineBucketsFromRequests(requests, grouping);
    const timeGroups = {};

    // Initialize time buckets with collection -> duration bucket -> count
    timeBuckets.forEach(ts => {
        timeGroups[ts.toISOString()] = {};
    });

    // Group queries by collection, time bucket, and duration bucket
    requests.forEach((request) => {
        const sql = request.statement || request.preparedText || "";
        const collections = extractCollectionsFromSQL(sql);
        
        const requestDate = getChartDate(request.requestTime);
        const timeKey = roundTimestamp(requestDate, grouping, requests);
        const key = timeKey.toISOString();

        const elapsedMs = request.elapsedTime ? parseTime(request.elapsedTime) : 0;
        const durationSeconds = elapsedMs / 1000;  // Convert ms to seconds
        const durationBucketIdx = getDurationBucketIndex(durationSeconds);

        collections.forEach(collection => {
            if (!timeGroups[key][collection]) {
                timeGroups[key][collection] = {};
            }
            if (!timeGroups[key][collection][durationBucketIdx]) {
                timeGroups[key][collection][durationBucketIdx] = 0;
            }
            timeGroups[key][collection][durationBucketIdx]++;
        });
    });
```

#### 4.5 Collection Sorting

Sort collections by total query count:

```javascript
    // Get all unique collections and count total queries per collection
    const collectionQueryCounts = {};
    Object.values(timeGroups).forEach(group => {
        Object.entries(group).forEach(([collection, durationBuckets]) => {
            if (!collectionQueryCounts[collection]) {
                collectionQueryCounts[collection] = 0;
            }
            Object.values(durationBuckets).forEach(count => {
                collectionQueryCounts[collection] += count;
            });
        });
    });

    // Sort collections by query count (ascending) - fewest queries in front, most in back
    const allCollections = Object.keys(collectionQueryCounts).sort((a, b) => {
        return collectionQueryCounts[a] - collectionQueryCounts[b];
    });

    // Create a mapping of collection to index for y-axis
    const collectionToIndex = {};
    allCollections.forEach((collection, idx) => {
        collectionToIndex[collection] = idx;
    });
```

#### 4.6 Build ECharts Data Array

```javascript
    // Build data points for ECharts scatter3D
    const data = [];
    timeBuckets.forEach((ts, timeIndex) => {
        const key = ts.toISOString();
        Object.entries(timeGroups[key]).forEach(([collection, durationBuckets]) => {
            Object.entries(durationBuckets).forEach(([bucketIdx, count]) => {
                if (count > 0) {
                    const formattedTime = ts.toLocaleString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    });
                    const bucketLabel = durationBucketDefinitions[parseInt(bucketIdx)].label;
                    
                    data.push({
                        value: [timeIndex, collectionToIndex[collection], parseInt(bucketIdx)],
                        itemStyle: { color: durationColors[parseInt(bucketIdx)] },
                        actualCount: count,
                        collection: collection,
                        time: formattedTime,
                        duration: bucketLabel
                    });
                }
            });
        });
    });
```

**ECharts Data Format**:
- `value: [x, y, z]` - Position in 3D space (time index, collection index, duration index)
- `itemStyle: { color }` - Bubble color from duration palette
- `actualCount` - Query count (used for bubble sizing)
- Additional metadata for tooltips

#### 4.7 Store Data Globally

```javascript
    // Store data globally for fullscreen
    window.echartsTimelineData = {
        data,
        timeBuckets,
        allCollections,
        durationBucketDefinitions,
        durationColors,
        collectionQueryCounts
    };

    Logger.info(`✅ ECharts 3D Timeline data prepared: ${data.length} data points, ${allCollections.length} collections`);
}
```

**Why Global Storage?**
- Button click only generates data once (performance)
- Subsequent clicks reuse cached data
- Data persists until page refresh or new JSON parse

---

### Step 5: Create Fullscreen Modal Function

Implement `expandECharts3DTimeline()` to display the 3D chart:

#### 5.1 Modal Structure

```javascript
function expandECharts3DTimeline() {
    const { data, timeBuckets, allCollections, durationBucketDefinitions, durationColors, collectionQueryCounts } = window.echartsTimelineData;
    if (!data || !allCollections) return;

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
    fullscreenChartDiv.id = 'echarts-3d-timeline-fullscreen';
    fullscreenChartDiv.style.cssText = 'width: calc(100% - 420px); height: 100%;';
```

#### 5.2 Controls and Legend Panel

```javascript
    // Create controls and legend container (right sidebar)
    const controlsContainer = document.createElement('div');
    controlsContainer.style.cssText = 'position: absolute; top: 50px; right: 20px; width: 400px; background: white; border: 1px solid #444; border-radius: 4px; padding: 10px; max-height: calc(100% - 60px); overflow-y: auto;';

    // Add Log Scale toggle
    const togglesDiv = document.createElement('div');
    togglesDiv.style.cssText = 'margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #ddd;';
    togglesDiv.innerHTML = `
        <div style="margin-bottom: 8px;">
            <label style="display: flex; align-items: center; cursor: pointer; font-size: 13px; font-weight: bold;">
                <input type="checkbox" id="echarts-timeline-log-scale-toggle" style="margin-right: 8px;">
                Log Scale Bubble Size
            </label>
        </div>
    `;
    controlsContainer.appendChild(togglesDiv);

    // Add legend header with Show/Hide All buttons
    const legendHeader = document.createElement('div');
    legendHeader.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;';
    legendHeader.innerHTML = `
        <strong style="font-size: 14px;">Collections:</strong>
        <div>
            <button id="echarts-timeline-fs-show-all" style="padding: 4px 12px; background: #4CAF50; color: white; border: none; border-radius: 3px; cursor: pointer; margin-right: 5px; font-size: 11px;">Show All</button>
            <button id="echarts-timeline-fs-hide-all" style="padding: 4px 12px; background: #f44336; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;">Hide All</button>
        </div>
    `;
    controlsContainer.appendChild(legendHeader);

    // Add search input
    const searchContainer = document.createElement('div');
    searchContainer.style.cssText = 'margin-bottom: 10px;';
    searchContainer.innerHTML = `
        <input type="text" id="echarts-timeline-legend-search" placeholder="Search collections..." style="width: 100%; font-size: 11px; padding: 6px 8px; border: 1px solid #dee2e6; border-radius: 3px; box-sizing: border-box;">
    `;
    controlsContainer.appendChild(searchContainer);
```

#### 5.3 Legend Items with Checkboxes

```javascript
    // Create legend items grid
    const itemsGrid = document.createElement('div');
    itemsGrid.style.cssText = 'display: grid; grid-template-columns: 1fr; gap: 6px;';
    itemsGrid.id = 'echarts-timeline-legend-items-grid';
    
    // Sort collections by count (descending) for legend display
    const sortedCollections = [...allCollections].sort((a, b) => {
        return collectionQueryCounts[b] - collectionQueryCounts[a];
    });

    const visibilityState = {};
    sortedCollections.forEach(collection => {
        visibilityState[collection] = true;
    });

    sortedCollections.forEach(collection => {
        const count = collectionQueryCounts[collection];
        const legendItem = document.createElement('div');
        legendItem.style.cssText = 'display: flex; align-items: center; padding: 5px; cursor: pointer; border-radius: 3px; margin-bottom: 2px; border: 1px solid #e0e0e0;';
        legendItem.dataset.collection = collection;
        
        // Checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = true;
        checkbox.style.cssText = 'margin-right: 8px; cursor: pointer;';
        
        // Collection name with count
        const label = document.createElement('span');
        label.style.cssText = 'font-size: 12px; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
        label.textContent = `[${count}] ${collection}`;
        
        legendItem.appendChild(checkbox);
        legendItem.appendChild(label);
        
        // Toggle visibility on click
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
```

**Legend Features**:
- Sorted by query count (descending) - busiest collections at top
- Shows `[count] collection_name` format
- Checkbox for show/hide
- Click anywhere on item to toggle
- Grayed out when hidden

#### 5.4 Assemble Modal

```javascript
    // Assemble modal
    modalContent.appendChild(closeBtn);
    modalContent.appendChild(fullscreenChartDiv);
    modalContent.appendChild(controlsContainer);
    overlay.appendChild(modalContent);
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
```

#### 5.5 Bubble Size Calculation

```javascript
    // Calculate initial bubble sizes
    const allCounts = data.map(d => d.actualCount);
    const maxCount = Math.max(...allCounts);

    function calculateBubbleSizes(useLogScale) {
        return data.map(d => {
            if (!visibilityState[d.collection]) return null; // Hidden collection
            
            let size;
            if (useLogScale) {
                // Logarithmic scale: log10(count + 1) * 10
                size = Math.max(5, Math.log10(d.actualCount + 1) * 10);
            } else {
                // Linear scale: normalized to max 30px
                size = Math.max(5, Math.min(30, (d.actualCount / maxCount) * 30));
            }
            
            return {
                value: d.value,
                itemStyle: d.itemStyle,
                actualCount: d.actualCount,
                collection: d.collection,
                time: d.time,
                duration: d.duration,
                symbolSize: size
            };
        }).filter(d => d !== null);
    }
```

**Bubble Sizing**:
- **Linear**: Scales 5-30px based on query count
- **Log Scale**: `log10(count + 1) * 10` - better for large count variations
- Minimum size: 5px (prevents invisible bubbles)
- Filters out hidden collections

#### 5.6 ECharts Configuration

```javascript
    // Initialize fullscreen chart
    const myChart = echarts.init(fullscreenChartDiv);
    
    function updateChart() {
        const useLogScale = document.getElementById('echarts-timeline-log-scale-toggle')?.checked || false;
        const chartData = calculateBubbleSizes(useLogScale);
        
        const option = {
            title: {
                text: 'Query Duration Groups by Collection',
                left: 'center',
                top: 10,
                textStyle: {
                    fontSize: 18,
                    fontWeight: 'bold'
                }
            },
            tooltip: {
                formatter: function(params) {
                    const d = params.data;
                    return `${d.collection}<br/>Time: ${d.time}<br/>Duration: ${d.duration}<br/>Queries: ${d.actualCount}`;
                }
            },
            xAxis3D: {
                type: 'category',
                data: timeBuckets.map((ts, idx) => idx),
                name: 'Request Time',
                nameTextStyle: {
                    fontSize: 14,
                    fontWeight: 'bold'
                },
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
                nameTextStyle: {
                    fontSize: 14,
                    fontWeight: 'bold'
                },
                axisLabel: {
                    interval: Math.max(0, Math.ceil(allCollections.length / 10) - 1),
                    fontSize: 10
                }
            },
            zAxis3D: {
                type: 'category',
                data: durationBucketDefinitions.map(b => b.label),
                name: 'Duration Range',
                nameTextStyle: {
                    fontSize: 14,
                    fontWeight: 'bold'
                }
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
                    main: {
                        intensity: 1.2,
                        shadow: true
                    },
                    ambient: {
                        intensity: 0.5
                    }
                }
            },
            series: [{
                type: 'scatter3D',
                data: chartData,
                symbolSize: function(dataItem) {
                    return dataItem.symbolSize;
                },
                itemStyle: {
                    opacity: 0.85
                },
                emphasis: {
                    itemStyle: {
                        opacity: 1
                    }
                }
            }]
        };

        myChart.setOption(option);
    }

    // Initial render
    updateChart();
```

**ECharts Configuration Highlights**:
- `grid3D.boxDepth`: Dynamically sized based on collection count
- `viewControl`: Optimal camera angle (alpha: 22.9°, beta: 44.6°, distance: 453)
- `light.main.shadow`: Adds depth with shadows
- `itemStyle.opacity`: 0.85 for semi-transparency (see overlapping bubbles)
- `emphasis.opacity`: 1.0 on hover

#### 5.7 Control Event Handlers

```javascript
    // Log Scale toggle
    document.getElementById('echarts-timeline-log-scale-toggle').addEventListener('change', updateChart);

    // Show All button
    document.getElementById('echarts-timeline-fs-show-all').addEventListener('click', () => {
        sortedCollections.forEach(collection => {
            visibilityState[collection] = true;
        });
        itemsGrid.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.checked = true;
            cb.parentElement.style.opacity = '1';
        });
        updateChart();
    });

    // Hide All button
    document.getElementById('echarts-timeline-fs-hide-all').addEventListener('click', () => {
        sortedCollections.forEach(collection => {
            visibilityState[collection] = false;
        });
        itemsGrid.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
            cb.parentElement.style.opacity = '0.3';
        });
        updateChart();
    });

    // Search functionality
    document.getElementById('echarts-timeline-legend-search').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        itemsGrid.querySelectorAll('div[data-collection]').forEach(item => {
            const collection = item.dataset.collection.toLowerCase();
            item.style.display = collection.includes(searchTerm) ? 'flex' : 'none';
        });
    });
}
```

---

## Testing Checklist

- [ ] Click "3D" button on Duration Buckets chart
- [ ] Verify fullscreen modal opens with 3D chart
- [ ] Test chart rotation (click and drag on chart)
- [ ] Test zoom (scroll wheel on chart)
- [ ] Hover over bubbles to see query details
- [ ] Toggle "Log Scale Bubble Size" checkbox
- [ ] Click "Show All" / "Hide All" buttons in legend
- [ ] Click individual legend items to toggle collections
- [ ] Type in search box to filter collections
- [ ] Verify bubble colors match duration buckets
- [ ] Verify bubble sizes correlate to query counts
- [ ] Close modal with X button
- [ ] Test with different timeline groupings (hourly, daily)
- [ ] Test with large datasets (100k+ queries)

---

## Common Issues & Solutions

### Issue: 3D Button Not Showing
**Solutions**:
1. Verify `requests.length > 0` after parsing JSON
2. Check that `createDurationBucketsChart()` is called
3. Inspect button element in browser DevTools (should have `display: block`)

### Issue: Bubbles Too Large/Small
**Solution**: Adjust bubble size calculation in `calculateBubbleSizes()`:
```javascript
// Linear scale
size = Math.max(5, Math.min(30, (d.actualCount / maxCount) * 50)); // Change 30 to 50

// Log scale
size = Math.max(5, Math.log10(d.actualCount + 1) * 15); // Change 10 to 15
```

### Issue: Chart Too Cramped with Many Collections
**Solution**: Adjust `grid3D.boxDepth`:
```javascript
grid3D: {
    boxDepth: Math.min(300, allCollections.length * 10), // Increase multiplier
    // ...
}
```

### Issue: Poor Camera Angle
**Solution**: Adjust `viewControl` parameters:
```javascript
viewControl: {
    alpha: 30,      // Vertical rotation (0-90)
    beta: 45,       // Horizontal rotation (0-360)
    distance: 400,  // Zoom level (100-600)
    // ...
}
```

### Issue: ECharts GL Not Loading
**Solutions**:
1. Check browser console for CDN errors
2. Verify both echarts.min.js AND echarts-gl.min.js are loaded
3. Test CDN URL directly in browser
4. Consider using alternative CDN (unpkg, cdnjs)

### Issue: Legend Search Not Working
**Solution**: Verify `data-collection` attribute is set:
```javascript
legendItem.dataset.collection = collection; // Must be set
```

---

## Performance Considerations

### Large Datasets (100k+ queries)
- ECharts GL handles up to ~10k data points smoothly
- For larger datasets, consider:
  - Aggregating by larger time buckets (daily instead of hourly)
  - Filtering to top N collections only
  - Sampling data points

### Memory Usage
- `window.echartsTimelineData` persists until page refresh
- Click "Parse JSON" again to regenerate fresh data
- Modal DOM elements are removed on close (garbage collected)

### Rendering Performance
- Initial render: ~500ms for 5k data points
- Chart rotation: 60 FPS on modern hardware
- Legend toggle: Instant re-render (<100ms)

---

## Pattern 3D Chart Implementation (Dashboard)

### Overview
Second 3D chart example showing **Query Patterns by Collection** using **bar3D** type.

### Data Structure
```javascript
{
    collections: ['collection1', 'collection2', ...],
    patterns: ['WITH', 'EXECUTE', 'SELECT *', 'COUNT', ...],
    collectionPatternCounts: {
        'collection1': { 'WITH': 5, 'EXECUTE': 10, ... },
        'collection2': { 'WITH': 2, 'EXECUTE': 8, ... }
    }
}
```

### Key Differences from Timeline Chart

| Feature | Timeline Chart (Scatter3D) | Pattern Chart (Bar3D) |
|---------|---------------------------|---------------------|
| Series Type | `scatter3D` | `bar3D` |
| Visual | Variable-sized bubbles | Fixed-width bars |
| Size Logic | Based on query count | Height = log₁₀(count) |
| Color | Duration bucket color | Intensity-based gradient |
| Z-Axis | Duration categories | Numeric count (log scale) |
| Aggregation | Time buckets | Pattern categories |

### Bar3D Configuration

```javascript
series: [{
    type: 'bar3D',
    data: data.map(d => ({
        value: [d[0], d[1], d[2]], // [patternIdx, collectionIdx, logCount]
        itemStyle: { color: d[4] }, // Color by intensity
        actualCount: d[3]           // Raw count for tooltip
    })),
    shading: 'lambert', // Realistic lighting
    label: {
        show: false // Hide labels (too cluttered)
    },
    itemStyle: {
        opacity: 0.95
    },
    emphasis: {
        itemStyle: {
            opacity: 1,
            color: '#900' // Highlight color on hover
        }
    }
}]
```

### Color Gradient (Intensity-Based)

```javascript
function getColorForCount(count, max) {
    const intensity = count / max;
    // Red (highest) → Orange → Yellow → Green → Cyan → Blue (lowest)
    if (intensity > 0.83) return '#dc143c'; // Crimson red
    if (intensity > 0.67) return '#ff4500'; // Orange-red
    if (intensity > 0.50) return '#ffa500'; // Orange
    if (intensity > 0.33) return '#ffd700'; // Gold
    if (intensity > 0.17) return '#32cd32'; // Lime green
    return '#1e90ff'; // Dodger blue
}
```

**Why this palette?**
- Heat map style: hot colors = high usage, cool colors = low usage
- Clear visual distinction across 6 intensity tiers
- Accessible for colorblind users (varies both hue and brightness)

---

## Tooltip Design Guidelines

### Principle: Mirror 2D Chart Tooltip

The 3D tooltip should show **the same information** as the 2D chart's tooltip, adapted for 3D context.

### Timeline Chart Example

**2D Tooltip** (Duration Buckets chart):
```javascript
tooltip: {
    callbacks: {
        label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value} queries`;
        },
        afterBody: function(tooltipItems) {
            const dataIndex = tooltipItems[0].dataIndex;
            return [`Time: ${timestamps[dataIndex].toLocaleString()}`];
        }
    }
}
```

**3D Tooltip** (matching format):
```javascript
tooltip: {
    formatter: function(params) {
        const d = params.data;
        return `${d.collection}<br/>Time: ${d.time}<br/>Duration: ${d.duration}<br/>Queries: ${d.actualCount}`;
    }
}
```

**Matching Elements**:
- ✅ Collection name (dataset label equivalent)
- ✅ Time (x-axis value)
- ✅ Duration range (z-axis value)
- ✅ Query count (y-axis value)

### Pattern Chart Example

**2D Tooltip** (Query Pattern chart):
```javascript
tooltip: {
    callbacks: {
        label: function(context) {
            return `${context.label}: ${context.parsed.y} queries`;
        }
    }
}
```

**3D Tooltip** (matching format):
```javascript
tooltip: {
    formatter: function(params) {
        const pIdx = params.value[0];
        const cIdx = params.value[1];
        const logCount = params.value[2];
        const actualCount = params.data.actualCount;
        return `${patterns[pIdx]}<br/>${collections[cIdx]}<br/>Log Count: ${logCount.toFixed(2)}<br/>Actual Count: ${actualCount}`;
    }
}
```

### External Tooltip DIV (for Complex Tooltips)

When 2D tooltip contains too much information (e.g., multiple metrics, nested details):

```javascript
// Create external tooltip container
const tooltipDiv = document.createElement('div');
tooltipDiv.id = 'echarts-external-tooltip';
tooltipDiv.style.cssText = 'position: absolute; background: rgba(0,0,0,0.8); color: white; padding: 10px; border-radius: 4px; font-size: 12px; pointer-events: none; display: none; z-index: 10002;';
modalContent.appendChild(tooltipDiv);

// Configure ECharts tooltip
tooltip: {
    trigger: 'item',
    triggerOn: 'mousemove',
    formatter: function(params) {
        // Return simple text for built-in tooltip
        return params.data.collection;
    },
    position: function(point, params, dom, rect, size) {
        // Update external div with full details
        const d = params.data;
        tooltipDiv.innerHTML = `
            <strong>${d.collection}</strong><br/>
            Time: ${d.time}<br/>
            Duration: ${d.duration}<br/>
            Queries: ${d.actualCount.toLocaleString()}<br/>
            <hr style="margin: 5px 0; border-color: rgba(255,255,255,0.3);">
            Avg Duration: ${d.avgDuration}ms<br/>
            Total Time: ${d.totalTime}s
        `;
        tooltipDiv.style.display = 'block';
        tooltipDiv.style.left = (point[0] + 15) + 'px';
        tooltipDiv.style.top = (point[1] + 15) + 'px';
        
        // Position built-in tooltip off-screen (still required for hover state)
        return [-9999, -9999];
    }
}

// Hide external tooltip when not hovering
myChart.on('mouseout', function() {
    tooltipDiv.style.display = 'none';
});
```

**When to use external tooltip**:
- 2D tooltip shows >5 lines of information
- Nested/hierarchical data (e.g., operator breakdown)
- Custom formatting (tables, charts, images)
- Interactive elements (copy buttons, links)

---

## Color Palette Inheritance

### Rule: Always Match 2D Chart Colors

When creating a 3D chart from a 2D chart, **reuse the exact color palette**.

#### Example: Duration Buckets

**2D Chart datasets**:
```javascript
datasets: [
    {
        label: "0-1s",
        backgroundColor: "rgba(76, 175, 80, 0.7)", // Green
        // ...
    },
    {
        label: "1-2s",
        backgroundColor: "rgba(33, 150, 243, 0.7)", // Blue
        // ...
    },
    // ... 13 total duration buckets
]
```

**3D Chart - Copy Exact Colors**:
```javascript
const durationColors = [
    'rgba(76, 175, 80, 0.7)',    // 0-1s: Green (matches 2D)
    'rgba(33, 150, 243, 0.7)',   // 1-2s: Blue (matches 2D)
    // ... same 13 colors in same order
];
```

#### How to Extract Colors from 2D Chart

```javascript
// Inside the 2D chart creation function
const chartColors = window.durationBucketsChart.data.datasets.map(ds => ds.backgroundColor);

// Use these colors for 3D chart
const durationColors = chartColors;
```

#### Why This Matters
- **User Consistency**: Same color = same meaning across views
- **Cognitive Load**: Don't make users re-learn color mappings
- **Accessibility**: Preserve colorblind-safe choices from 2D chart

### Special Case: Derived Colors

If 3D chart needs more granularity than 2D (e.g., sub-categories):

```javascript
// 2D chart has 3 colors for query types
const baseColors = ['#007bff', '#28a745', '#dc3545']; // SELECT, INSERT, DELETE

// 3D chart needs shades for each type + collection
function getShade(baseColor, intensity) {
    // Convert rgba to lighter/darker shade
    const match = baseColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    const [r, g, b] = match.slice(1).map(Number);
    const factor = 0.5 + (intensity * 0.5); // 50% to 100% brightness
    return `rgba(${r*factor}, ${g*factor}, ${b*factor}, 0.7)`;
}
```

---

## Key Dependencies

- **ECharts**: v5.5.0 (Core library)
- **ECharts GL**: v2.0.9 (3D scatter3D support)
- **Existing Functions**:
  - `getTimelineBucketsFromRequests(requests, grouping)` - Timeline bucket generation
  - `extractCollectionsFromSQL(sql)` - Collection name extraction
  - `getChartDate(requestTime)` - Timezone conversion
  - `roundTimestamp(date, grouping, requests)` - Time bucket rounding
  - `parseTime(timeString)` - Time string parsing to milliseconds

---

## Line3D Charts (Future Enhancement)

### Use Cases for Line Charts
- Timeline trends (query count over time per collection)
- Performance degradation tracking (avg duration over time)
- Comparative analysis (multiple collections' trends side-by-side)

### Implementation Pattern

```javascript
series: [{
    type: 'line3D',
    data: lineData, // Array of [x, y, z] coordinates
    lineStyle: {
        width: 2,
        color: collectionColor
    },
    itemStyle: {
        color: collectionColor
    }
}]
```

### Challenges with Line3D
1. **Overlapping Lines**: Hard to distinguish in 3D space
   - Solution: Offset lines slightly along one axis
2. **Color Palette**: Need distinct colors for each line
   - Solution: Reuse 2D chart's line colors (see Color Palette Inheritance)
3. **Tooltip**: Lines don't have "hover area" like bubbles/bars
   - Solution: Use external tooltip div with nearest-point detection

### Example: Query Count Trend Lines

```javascript
// Group data by collection (one line per collection)
const collections = [...new Set(requests.map(r => r.collection))];
const series = collections.map((collection, idx) => {
    // Get trend data for this collection
    const trendData = timeBuckets.map((ts, timeIdx) => {
        const count = getCountForCollectionAtTime(collection, ts);
        return [timeIdx, idx, count]; // x=time, y=collection, z=count
    });
    
    return {
        type: 'line3D',
        name: collection,
        data: trendData,
        lineStyle: {
            width: 3,
            color: collectionColors[idx % collectionColors.length]
        }
    };
});
```

### Camera Position for Line Charts
```javascript
viewControl: {
    alpha: 30,       // Higher angle to see line progression
    beta: 0,         // Straight-on view (no rotation)
    distance: 400,   // Medium zoom
    // ...
}
```

---

## Commit History

### Timeline 3D Chart (Scatter3D)
| Commit | Date | Description |
|--------|------|-------------|
| `af9122f` | 2025-10-27 | 3D chart timeline EChart done (final implementation) |
| `8b9fe1d` | 2025-10-27 | EChart working prototype |
| `8e88ccd` | 2025-10-29 | 3D chart timeline cleanup |

### Pattern 3D Chart (Bar3D)
| Commit | Date | Description |
|--------|------|-------------|
| `30d3401` | 2025-10-27 | 3D button pattern done |
| `b9d309e` | 2025-10-28 | Dashboard 3D chart cleanup |

---

## Related Issues

- **Issue #195**: Prototype in Timeline 3D chart for collections and slow queries
- **Issue #196**: Prototype Dashboard 3D chart for query pattern
- **Issue #213**: Create markdown about making 3D charts in Timeline (this document)

---

## Example Use Cases

### Timeline 3D Chart (Scatter3D)
1. **Identify Slow Query Patterns**: Look for bubbles at high Z-values (slow duration ranges)
2. **Collection Performance Comparison**: Compare bubble heights (Z) across Y-axis (collections)
3. **Time-Based Trends**: Observe bubble progression along X-axis (time)
4. **Query Volume Analysis**: Larger bubbles indicate more queries in that bucket
5. **Hotspot Detection**: Dense clusters show heavy usage periods
6. **Outlier Analysis**: Use log scale to spot rare slow queries
7. **Collection Focus**: Hide high-volume collections to analyze low-volume ones

### Pattern 3D Chart (Bar3D)
1. **Pattern Adoption Analysis**: See which patterns are most/least used across collections
2. **Collection Complexity**: Taller bars = more pattern usage (higher complexity)
3. **Best Practice Compliance**: Spot collections missing important patterns (e.g., USE INDEX)
4. **Anti-Pattern Detection**: Find collections with high "No WHERE" or "SELECT *" usage
5. **Comparative Analysis**: Hide/show collections to compare pattern usage
6. **Optimization Opportunities**: Low pattern counts may indicate missing indexes or inefficient queries

---

## Quick Reference: Chart Type Selection

| 2D Chart Type | Data Characteristics | Recommended 3D Type |
|--------------|---------------------|-------------------|
| **Stacked Bar** (Timeline) | Categorical buckets over time | `scatter3D` (bubbles) |
| **Bar** (Dashboard) | Categorical comparisons | `bar3D` (bars) |
| **Line** (Trends) | Continuous time series | `line3D` (lines) |
| **Scatter** (Correlations) | Continuous X/Y relationship | `scatter3D` (no Z-encoding) |
| **Heatmap** | 2D matrix of values | `surface` (3D surface) |

---

## Future Enhancements

- [ ] Add animation slider for time progression
- [ ] Export 3D chart as interactive HTML
- [ ] Add performance threshold highlighting (e.g., red box for >10s queries)
- [ ] Implement cluster analysis visualization
- [ ] Add camera angle presets (top view, side view, front view)
- [ ] Support custom color schemes (colorblind-safe, high-contrast)
- [ ] Add regression line/surface for trend analysis
- [ ] Implement 3D surface charts for heatmap data
- [ ] Add VR/AR support for immersive data exploration
- [ ] Create 3D chart templates for common patterns

---

**Last Updated**: 2025-11-04  
**Version**: 3.27.0-post  
**Author**: Fujio Turner  
**Issue #221**: Added dual legend system (2D + Collections) to all 3D charts
