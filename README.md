# Couchbase Slow Query Analysis Tool v3.23.0



🚀 **Hosted Tool:**
- English: https://cb.fuj.io/en/

If you don't want to download the index.html files, click the beta links above. Remember to still follow the steps in the `Quick Start` section below to complete `Steps 3:` and beyond to get the JSON data you need to debug and analyze.

## 📁 **Download Instructions:**
Alternatively, you can download the HTML file locally:
- **English**: Download [`index.html`](https://github.com/Fujio-Turner/cb_completed_request/raw/main/en/index.html?download=true)

---

A comprehensive web-based tool for analyzing Couchbase query performance and execution plans. Visualize query patterns, identify bottlenecks, and optimize database performance with advanced index usage tracking, execution plan analysis, and dedicated index management features.

#### (Capella Compatible)

## Quick Start

### Step 1: Download the Tool
- **English**: Download `index.html`

### Step 2: Open in Browser
Go to the folder where you downloaded the HTML file and open it directly in any modern web browser (Chrome, Firefox, Safari, Edge). _Firefox_ seems to be the faster

### Step 3: Extract Query Data
Run this query in Couchbase Query Workbench or cbq:

```sql
SELECT *, meta().plan FROM system:completed_requests ORDER BY requestId LIMIT 2000;
```

**Notes**: 
This could return back a JSON of about 36MB~ish. Anything bigger will probably crash the browser. _Firefox_ seems to be render the data faster.

**Browser is slow/crashes:**
If the browser slowes to a crawl reduce the data size via `LIMIT 2000`

[More Query Options](sql_queries.md)

### Step 4: Analyze
Select ALL & Copy the full JSON results and paste it into the tool's input area up top, then click **Parse JSON**

![Query input interface](img/copy_paste_side_by_side.png)

### Step 5a: Filter by Date Range (Optional)

- **Auto-population**: Date fields automatically populate with your data's full time range
- **Custom filtering**: Adjust "From" and "To" dates to focus on specific time periods
- **Re-analyze**: Click "Parse JSON" again to apply the date filter
- **Filter status**: See how many queries match your selected range

### Step 5b: Enhanced Index Analysis (Optional)

Run the query below to get the JSON result. Copy & Paste the results into the 2nd right text input box and click `Parse JSON` button.

```sql
SELECT 
 s.name,
 s.id,
 s.metadata,
 s.state,
 s.num_replica,
CONCAT("CREATE INDEX ", s.name, " ON ", k, ks, p, w, ";") AS indexString
FROM system:indexes AS s
LET bid = CONCAT("", s.bucket_id, ""),
    sid = CONCAT("", s.scope_id, ""),
    kid = CONCAT("", s.keyspace_id, ""),
    k = NVL2(bid, CONCAT2(".", bid, sid, kid), kid),
    ks = CASE WHEN s.is_primary THEN "" ELSE "(" || CONCAT2(",", s.index_key) || ")" END,
    w = CASE WHEN s.condition IS NOT NULL THEN " WHERE " || REPLACE(s.condition, '"', "'") ELSE "" END,
    p = CASE WHEN s.`partition` IS NOT NULL THEN " PARTITION BY " || s.`partition` ELSE "" END;
```

## Features

### **Eight Analysis Tabs**:

#### **1. Dashboard Tab**
- **Query Duration Distribution** bar chart showing performance patterns
- **Primary Indexes Used** donut chart with intelligent warning system
  - Conditional warning display (only appears when primary indexes detected)
  - Educational "Learn More" link to Couchbase primary index best practices
  - Enhanced visual distinction for production performance awareness
- **Query Pattern Features** analysis for performance insights
- **Users by Query Count** sortable table showing top query generators
- **Index Usage Count** sortable table tracking index utilization
- **Statement Type** pie chart (SELECT, INSERT, UPDATE, DELETE breakdown)
- **Query State** pie chart showing completion status

#### **2. Insights Tab**
- **Automated analysis** organized into categories with live metrics:
  - **Index Performance Issues**: Inefficient scans, slow index scans, primary index over-usage, ORDER BY/LIMIT/OFFSET over-scan (Beta)
  - **Resource Utilization Issues**: High kernel time, high memory usage, slow USE KEYS queries
  - **Query Pattern Analysis**: Missing WHERE clauses, inefficient LIKE (leading wildcard), SELECT * usage
- Items are marked Live/Beta where applicable; expand items for details and counts

#### **3. Timeline Tab**
- **Six Interactive Visualizations** in 2x3 grid layout:
  - **Duration Buckets Chart**: Query duration distribution over time
  - **Query Types Chart**: Query type breakdown by time periods
  - **Operations Chart**: Index scans vs document fetches comparison
  - **Filter Chart**: Filter operations efficiency (IN vs OUT ratios)
  - **Timeline Chart**: Kernel time percentage distribution over time
  - **Memory Chart**: Memory usage (MB) over time with query count tracking
- **Interactive Controls**:
  - Reset Zoom button for chart navigation
  - Y-axis scaling (Linear/Logarithmic) options
  - Time grouping options (By Optimizer/By Minute/By Second)
  - "Use Time Range" filtering button
  - Pan/zoom capabilities with drag-to-pan, scroll-to-zoom, drag-box selection

#### **4. Query Groups Tab** (Analysis)
- **Aggregated Query Analysis** with normalized statement grouping
- **Statistical Metrics**: total_count, min/max/avg/median duration
- **Performance Averages**: avg_fetch, avg_primaryScan, avg_indexScan
- **User Breakdown**: Shows execution count per user for each query pattern
- **Smart Normalization**: Replaces string literals and numbers with `?` placeholders
- **Filtered Results**: Excludes INFER, ADVISE, CREATE, ALTER INDEX, and SYSTEM queries

#### **5. Every Query Tab**
- **Comprehensive Query Table** with 17 columns
- **Interactive Flow Diagrams** with color-coded execution plan visualization
- **Enhanced Table Features** with full column sorting and statement management
- **Advanced Data Processing** with batch processing capabilities

#### **6. Index/Query Flow Tab**
- **Visual Index-Query Relationships** with interactive flow diagrams
- **Enhanced Primary Index Detection** with comprehensive coverage
- **Performance Insights** for optimization opportunities

#### **7. Indexes Tab**
- **Comprehensive Index Management** with complete index catalog
- **Advanced filtering options** and specialized filters
- **Smart Index Consolidation** and query-index matching

#### **8. Report Maker Tab** (Beta)
- **Select sections** (Dashboard, Timeline, Query Groups, Every Query, Index/Query Flow, Indexes)
- **Options**: Include header summary, include applied filters, flatten scrollable tables for print
- **Charts**: Convert charts to images for printing
- **Workflow**: Preview report → Print / Save PDF → Exit Report Mode

## Understanding the Analysis

- **Green bubbles**: < 25% of total query time
- **Yellow bubbles**: 25-50% of total query time
- **Orange bubbles**: 50-75% of total query time
- **Red bubbles**: > 75% of total query time
- **Primary Scan highlighted**: Queries using primary index scans (potential optimization candidates)

## Time Grouping Guidelines

When analyzing timeline charts, choose appropriate date ranges for each time grouping:

- **By Optimizer**: Automatically selects the best grouping based on your date range (recommended)
- **By Second**: Best for ranges ≤ 1 hour (detailed analysis)
- **By Minute**: Best for ranges ≤ 1 day (hourly patterns)
- **By Hour**: Best for ranges ≤ 1 month (daily patterns)
- **By Day**: Best for ranges > 1 month (long-term trends)

**⚠️ Warning**: Large date ranges with fine-grained groupings may cause chart rendering errors. The tool will alert you and suggest better combinations.

## Release Notes

See full Release Notes: [release_notes.md](release_notes.md)

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
