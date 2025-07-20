# Couchbase Slow Query Analysis Tool v3.0.1

A comprehensive web-based tool for analyzing Couchbase query performance and execution plans. Visualize query patterns, identify bottlenecks, and optimize database performance with advanced index usage tracking, execution plan analysis, and dedicated index management features.

##### (Capella Compatible)

## Quick Start

### Step 1: Download the Tool
Download or clone the whole repository OR just download the `index.html`

### Step 2: Open in Browser
Go to the folder where you downloaded the `index.html` and open it directly in any modern web browser (Chrome, Firefox, Safari, Edge). <i>Firefox</i> seems to be the faster

### Step 3: Extract Query Data
Run this query in Couchbase Query Workbench or cbq:

```sql
SELECT *, meta().plan FROM system:completed_requests LIMIT 4000;
```
[More Query Options](sql_queries.md)

**Optional - For Enhanced Index Analysis:**
To use the new Indexes tab features, also collect index metadata:

```sql
SELECT 
 s.name,
 s.id,
 s.metadata,
 s.state,
 s.num_replica,
 s.datastore_id,
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

**Notes**: 
This could return back a JSON of about 36MB~ish. Anything bigger will probably crash the browser. <i>Firefox</i> seems to be the faster browser.

**Browser is slow/crashes:**
If the browser slowes to a crawl reduce the data size via `LIMIT 2000`


### Step 4: Analyze
Select ALL & Copy the full JSON results and paste it into the tool's input area up top, then click <button>Parse JSON</button> 

![Query input interface](copy_paste_json.png)

### Step 5: Filter by Date Range (Optional)
- **Auto-population**: Date fields automatically populate with your data's full time range
- **Custom filtering**: Adjust "From" and "To" dates to focus on specific time periods
- **Re-analyze**: Click "Parse JSON" again to apply the date filter
- **Filter status**: See how many queries match your selected range

## Features

### **Six Analysis Tabs**:

#### **1. Dashboard Tab**
- **Query Duration Distribution** bar chart showing performance patterns
- **Primary Scan Usage** pie chart identifying optimization opportunities
- **Query Pattern Features** analysis for performance insights
- **Users by Query Count** sortable table showing top query generators
- **Index Usage Count** sortable table tracking index utilization
- **Statement Type** pie chart (SELECT, INSERT, UPDATE, DELETE breakdown)
- **Query State** pie chart showing completion status

#### **2. Timeline Tab**
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

#### **3. Query Groups Tab** (Analysis)
- **Aggregated Query Analysis** with normalized statement grouping
- **Statistical Metrics**: total_count, min/max/avg/median duration
- **Performance Averages**: avg_fetch, avg_primaryScan, avg_indexScan
- **User Breakdown**: Shows execution count per user for each query pattern
- **Smart Normalization**: Replaces string literals and numbers with `?` placeholders
- **Filtered Results**: Excludes INFER, ADVISE, CREATE, ALTER INDEX, and SYSTEM queries

#### **4. Every Query Tab**
- **Comprehensive Query Table** with 17 columns:
  - Row #, request Time, statement Type, elapsed Time, service Time
  - kern Time, KernTime %, cpu Time, memory (MB)
  - result Count, result Size, Items from Index Scan
  - Doc Fetch Count, Primary Scan Used, state, statement, users
- **Interactive Flow Diagrams**:
  - Color-coded execution plan visualization
  - Operator bubbles showing execTime, servTime, kernTime percentages
  - Click operators for detailed statistics modal
  - Visual performance indicators (Green < 25%, Yellow 25-50%, Orange 50-75%, Red > 75%)
  - **Enhanced execution plan parsing** with support for complex nested operators:
    - UnionScan and IntersectScan with nested scans arrays
    - DistinctScan with embedded IndexScan3 operators
    - ExceptAll with first/second properties for set operations
    - Subquery execution timings with complete operator trees
- **Enhanced Table Features**:
  - Full column sorting (click headers)
  - Fixed 300px width for statement column with auto-truncation
  - Statement truncation at 500 characters with "show more/hide" toggles
  - Copy button for each statement
  - Row highlighting with click-to-select
- **Advanced Data Processing**:
  - Batch processing of large datasets (1000 queries per batch)
  - Real-time progress indicators
  - Memory usage tracking from root `usedMemory` field
  - CPU time extraction from root `cpuTime` field

#### **5. Index Query Flow Tab**
- **Visual Index-Query Relationships**:
  - Interactive flow diagram connecting indexes to queries that use them
  - Index usage statistics with scan counts and execution timings
  - Query pattern analysis with normalized statement grouping
  - Color-coded connections showing usage frequency
- **Comprehensive Index Detection**:
  - Captures indexes from all operator types (IndexScan3, PrimaryScan3, etc.)
  - Handles complex nested structures in execution plans
  - Tracks primary index usage and sequential scans
  - Supports all Couchbase query execution patterns
- **Performance Insights**:
  - Index scan timing analysis (min/max/average execution times)
  - Query pattern optimization opportunities
  - Index usage frequency tracking
  - Cross-query index sharing analysis

#### **6. Indexes Tab** (NEW in v3.0.0)
- **Comprehensive Index Management**:
  - Complete index catalog with metadata (bucket, scope, collection, state, replicas)
  - Real-time index usage tracking with "Used" badges for indexes found in query data
  - Advanced filtering options: bucket, scope, collection dropdown filters
  - Specialized filters: Primary Only, Used Only, No Replicas Only, Never Scanned Only
  - Dynamic statistics panel showing index counts and distribution
- **Index Data Input**:
  - Dedicated input area for index JSON data from `system:indexes`
  - Automatic parsing and validation of index metadata
  - Cascading dropdown filters that update based on available data
  - Instructions and SQL query helper for easy data collection
- **Smart Index Consolidation**:
  - Automatic consolidation of `#primary` references with actual primary index names
  - Eliminates duplicate entries in index usage counts
  - Unified display showing only actual index names (e.g., `def_primary` instead of both `#primary` and `def_primary`)
- **Enhanced Query-Index Matching**:
  - Cross-references query execution plans with index catalog
  - Identifies which indexes are actively used vs. never scanned
  - Performance correlation between index design and query execution
  - Primary index usage optimization recommendations

### **Core Performance Features**:

- **Memory Analysis**: Accurate memory usage tracking from Couchbase `usedMemory` field
- **CPU Time Tracking**: Precise CPU time measurement from `cpuTime` field  
- **Service Time Analysis**: Service time display in flow diagrams when available
- **Primary Scan Detection**: Automatic identification of primary index usage
- **Advanced Index Usage Analysis**: 
  - Comprehensive primary vs secondary index tracking
  - Support for complex execution plans with nested operators
  - Handles all Couchbase operator types (UnionScan, IntersectScan, DistinctScan, ExceptAll)
  - Tracks index usage across subqueries and complex query structures
- **Kernel Time Comparison**: Kernel time vs elapsed time performance analysis

### **Data Processing & Filtering**:

- **Batch Processing**: Handles large datasets (4000+ queries) with progress indicators
- **Date Range Filtering**: Auto-populated date fields with custom filtering
- **Smart Normalization**: Intelligent query pattern recognition and grouping
- **Real-time Validation**: Time grouping validation with user-friendly error messages

### **User Interface Features**:

- **Responsive Design**: Optimized for various screen sizes
- **Interactive Controls**: Pan/zoom, modal dialogs, sortable tables
- **Visual Feedback**: Color-coded performance indicators and hover effects
- **Accessibility**: Clear column headers with line breaks for compact display


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