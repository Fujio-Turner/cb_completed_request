# Couchbase Slow Query Analysis Tool

A web-based tool for analyzing Couchbase query performance and execution plans. Visualize query patterns, identify bottlenecks, and optimize database performance.

### (Capella Compatible)

## Features

- **Interactive Query Analysis**: Aggregate and analyze queries by pattern
- **Execution Plan Visualization**: Flow diagrams showing operator performance  
- **Timeline View**: Query performance over time
- **Primary Scan Detection**: Identify inefficient queries
- **Export-ready Statistics**: Duration, fetch counts, and index usage metrics

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
Copy the JSON results and paste into the tool's input area.

![Query input interface](copy_paste_json.png)

## Troubleshooting

- **Empty results**: Check if query logging is enabled in Couchbase
- **Browser errors**: Ensure JavaScript is enabled
- **Large datasets**: Tool handles up to ~1000 queries efficiently

## Requirements

- Modern web browser with JavaScript enabled
- Couchbase Server with query logging enabled
- Access to `system:completed_requests` (requires admin privileges)