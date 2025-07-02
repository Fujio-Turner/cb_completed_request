# Couchbase Slow Query Analysis Tool

A web-based tool for analyzing Couchbase query performance and execution plans. Visualize query patterns, identify bottlenecks, and optimize database performance.

### (Capella Compatible)

## Features

- **Three Analysis Views**:
  - **Timeline**: Query performance trends over time
  - **Analysis**: Aggregated query statistics grouped by normalized patterns
  - **Every Query**: Detailed view of individual query executions

- **Interactive Execution Plans**: 
  - Color-coded flow diagrams showing operator performance
  - Click operators for detailed statistics (execTime, itemsIn/Out, kernTime)
  - Visual percentage indicators relative to total query time

- **Query Pattern Analysis**:
  - Automatic query normalization (replaces literals with `?` for grouping)
  - Statistical aggregation: min/max/avg/median duration
  - User query count analysis per pattern

- **Performance Insights**:
  - Primary scan detection and highlighting
  - Index usage analysis (Primary vs Secondary)
  - Document fetch count tracking
  - Kernel time vs elapsed time comparison

- **Date Range Filtering**:
  - Auto-populated date fields with full data range
  - Custom date/time filtering (minute-level precision)
  - Smart validation for time grouping selections
  - Real-time filter status display

- **Interactive Features**:
  - Sortable tables with hover effects
  - Modal dialogs for detailed execution plans
  - Pan/zoom flow diagrams
  - Click-to-highlight query selection

## Quick Start

### Step 1: Download the Tool
Download or clone this repository to get `index.html`

### Step 2: Open in Browser
Open `index.html` directly in any modern web browser (Chrome, Firefox, Safari, Edge)

### Step 3: Extract Query Data
Run this query in Couchbase Query Workbench or cbq:

```sql
SELECT *, meta().plan FROM system:completed_requests WHERE node = NODE_NAME();
```

**Note**: `WHERE node = NODE_NAME()` gets queries from a single node. Remove it to analyze all nodes.

### Step 4: Analyze
Copy the JSON results and paste into the tool's input area, then click "Parse JSON".

![Query input interface](copy_paste_json.png)

### Step 5: Filter by Date Range (Optional)
- **Auto-population**: Date fields automatically populate with your data's full time range
- **Custom filtering**: Adjust "From" and "To" dates to focus on specific time periods
- **Re-analyze**: Click "Parse JSON" again to apply the date filter
- **Filter status**: See how many queries match your selected range

## Understanding the Analysis

- **Green bubbles**: < 25% of total query time
- **Yellow bubbles**: 25-50% of total query time  
- **Orange bubbles**: 50-75% of total query time
- **Red bubbles**: > 75% of total query time
- **Primary Scan highlighted**: Queries using primary index scans (potential optimization candidates)

## Time Grouping Guidelines

When analyzing timeline charts, choose appropriate date ranges for each time grouping:

- **By Second**: Best for ranges ≤ 1 hour (detailed analysis)
- **By Minute**: Best for ranges ≤ 1 day (hourly patterns)  
- **By Hour**: Best for ranges ≤ 1 month (daily patterns)
- **By Day**: Best for ranges > 1 month (long-term trends)
- **Optimizer**: Automatically selects the best grouping (recommended)

**⚠️ Warning**: Large date ranges with fine-grained groupings may cause chart rendering errors. The tool will alert you and suggest better combinations.

## Troubleshooting

- **Empty results**: Check if query logging is enabled in Couchbase
- **Browser errors**: Ensure JavaScript is enabled
- **Chart rendering errors**: Reduce the date range or use coarser time grouping (e.g., switch from "by Minute" to "by Hour")
- **"Too far apart" errors**: The selected time range is too large for the chosen grouping - follow the time grouping guidelines above
- **Canvas destruction warnings**: Normal behavior when switching between different time groupings or date ranges

## Requirements

- Modern web browser with JavaScript enabled
- Couchbase Server with query logging enabled
- Access to `system:completed_requests` (requires admin privileges)