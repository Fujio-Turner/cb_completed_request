# Couchbase Slow Query Analysis Tool v3.15.0



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

### Version 3.15.0 (September 16, 2025)
- New: Upload .json file option in Parse JSON (closes #99)
- New: Elapsed time range filter in Parse JSON (closes #23)
- Enhancement: Timeline charts for execTime vs comparative metrics and Group By execTime (closes #64)
- Enhancement: Insights now counts 75-second default timeout queries (closes #61)
- Enhancement: Date range optimizer improvements in Timeline (closes #93)
- Enhancement: Show Scan Consistency on Index/Query Flow query cards (closes #101)
- New: Bug finder link added to UI (closes #102)
- Fix: Timeline charts now re-process after Parse JSON with new dataset (closes #103)
- Milestone: All issues in Milestone 1 (“release-solidus”) resolved

### Version 3.14.1 (September 10, 2025)
- Bug fixes and quality improvements
- Closes: #98, #97, #96

### Version 3.14.0 (September 10, 2025)
- Process: Discontinued multi-language HTML builds; English-only shipping (index.html and en/index.html)
- Docs/Verification: Simplified release and verification guides to English-only
- Hub page: Updated copy, schema, and links for English-only
- Enforced version/date header comment updates in en/index.html
- CI: Updated Docker tags to 3.14.0/v3.14.0
- Closes: #95, #94, #92, #91, #90, #88, #85, #81, #73, #11

### Version 3.13.0 (September 9, 2025)
- New: Parse JSON date range control replaced with compact dropdown (closes #84)
- New: Query Groups phaseTimes chart for aggregated operator timings (closes #83)
- New: Dashboard charts show values directly on the charts (closes #87)
- UX/Docs: Converted “Advanced Query Options” to an HTML page and linked from the tool (closes #86)
- Insights: Added “Learn more” link to Analysis Hub and HTML touchups (closes #74)
- Process: Discontinued multi-language HTML builds; English-only shipping (index.html and en/index.html).
### Version 3.12.x (September 2025)
- Bug fixes and quality improvements across the analyzer UI and documentation
- Closes #84, #82, #79, #78, #75, #58


### Version 3.12.x (September 2025)
#### 🔧 Performance & Optimization
- **CSS Minification**: Optimized CSS for improved load times and performance
- **Code Enhancements**: Various code improvements and optimizations
- **Translation System Fix**: Fixed critical JavaScript syntax preservation issues in localization

#### 🛡️ Bug Fixes
- **Issue #61**: Resolved (details in commit 1a49dd0)
- **Issue #32**: Merged feature improvements (commit 267a48b)  
- **Issue #35**: Localization updates (commit 241d3a6)

#### 🌍 Localization Updates
- **Translation Protection**: Improved JavaScript keyword protection during translation
- **Syntax Validation**: Enhanced validation scripts to prevent JavaScript breakage
- **Language Files**: Updated all language versions with proper syntax preservation

### Version 3.12.x (September 2025)
#### 🚀 New Features
- **Timeout-Prone Queries Analysis**: Added comprehensive timeout detection and analysis for queries approaching or exceeding the 75-second threshold
- **Enhanced Insights Dashboard**: New insight tracking queries that consistently approach timeout limits with detailed categorization
- **Advanced Query Classification**: Sophisticated analysis distinguishing between approaching timeouts (60-75s completed) and actual timeouts (74-76s fatal)

#### 🔧 Performance Improvements
- **Optimized Query Processing**: Improved caching and deduplication of SQL statements for faster analysis
- **Enhanced Data Parsing**: Streamlined processing pipeline with performance optimizations
- **Memory Management**: Better handling of large datasets with improved memory utilization

#### 📊 Sample Data Enhancement
- **Comprehensive Test Data**: Added extensive timeout scenario test data for development and testing
- **Real-world Examples**: Enhanced sample data with authentic timeout patterns and edge cases
- **Testing Coverage**: Improved test coverage for timeout detection algorithms

#### 🛡️ Code Quality Improvements
- **JavaScript Housekeeping**: Code cleanup and optimization for better maintainability
- **Enhanced Validation**: Improved error handling and data validation processes
- **Performance Monitoring**: Better tracking and logging of analysis performance metrics
### Version 3.11 (September 1, 2025)
#### 🚀 New Features
- **Enhanced Timeline Visualization**: Added new index/doc chart functionality for comprehensive performance analysis
- **KernTime Analysis**: Implemented kernTime vs ElapsedTime comparison charts for CPU utilization insights
- **Multi-Chart Enhancements**: Added multiple new chart types with synchronized zoom and drag functionality
- **Interactive Chart Features**: Enhanced all charts with draggable interfaces and synchronized navigation
- **Performance Optimizations**: Implemented 10x speed improvements with parsing optimization and caching

#### 🔧 Technical Improvements
- **Chart Synchronization**: All charts now sync zoom and date range filtering across Timeline tab
- **Drag-to-Zoom**: Interactive box selection for zooming chart areas
- **Chart Reordering**: Improved dataset organization for better visual analysis
- **Fill Between Lines**: Enhanced chart visualization with area filling for better trend analysis

### Version 3.10.0 (August 30, 2025)
#### 🚀 New Features
- **Enhanced Insights Dashboard**: Expanded the Insights tab with comprehensive performance analysis and automated query optimization recommendations
- **Improved User Interface**: Added rocket emoji to main title and gradient banner highlighting the new Insights capabilities
- **Enhanced Documentation**: Updated Step 4 guide to prominently feature the new Insights dashboard with detailed feature descriptions

#### 🛡️ Translation & Localization Improvements
- **Protected Translation System**: Implemented comprehensive translation protection to prevent JavaScript syntax errors and HTML attribute corruption
- **Dual Validation System**: Added both JavaScript syntax validation and HTML attribute validation to ensure translation quality
- **Complete Insights Localization**: All Insights content now fully translated across German, Spanish, and Portuguese versions

#### 🔧 Technical Improvements
- **JavaScript Syntax Protection**: Created validation tools to prevent translation-induced JavaScript errors
- **HTML Attribute Protection**: Implemented safeguards to prevent translation of critical HTML IDs and classes
- **Step-Numbered Process Guides**: Added numbered steps to all guide documents for easier partial re-runs ("redo step X only")

#### 📚 Developer Experience
- **Enhanced Release Process**: Created comprehensive release workflow with detailed validation steps
- **Translation Protection Rules**: Documented what should never be translated to prevent future issues
- **Automated Validation Tools**: Built tools to catch translation issues before deployment

### Version 3.9.0 (August 28, 2025)
#### 🔧 Bug Fixes
- **Fixed Tab Functionality**: Resolved critical issue where tabs in non-English versions (German, Spanish, Portuguese) were displaying as hyperlinks instead of interactive tabs due to JavaScript syntax errors in translated string literals
- **Fixed Stream Percentage Display**: Fixed issue [#35](https://github.com/Fujio-Turner/cb_completed_request/issues/35) where Stream execution time showed as 00:00.000 but incorrectly displayed two-digit percentage values in bubble flow diagrams
- **Enhanced JavaScript Localization**: Improved translation process to prevent string literal syntax errors across language versions

#### 🚀 New Features  
- **Enhanced Documentation**: Improved release notes organization with GitHub issue integration and version management guidelines
- **Improved Localization Process**: Updated LOCALIZATION_GUIDE.md with mandatory JavaScript syntax validation to prevent translation-induced syntax errors

#### 🎯 Technical Improvements
- **Comprehensive Release Verification**: Added RELEASE_WORK_CHECK.md tool for independent verification of release work completion
- **Prevented Future Issues**: Updated localization guides with detection commands and fix instructions for JavaScript syntax preservation

### Version 3.8.0 (August 27, 2025)
#### 🚀 New Features
- **Added Insights Tab**: Implemented new Insights tab ([#32](https://github.com/Fujio-Turner/cb_completed_request/issues/32)) with comprehensive slow query analysis including high kernel time detection, inefficient index scans, delayed index responses, slow USE KEY queries, and large payload streaming analysis
- **Enhanced Navigation**: Updated tab system with improved user interface for better analysis workflow
- **Performance Intelligence**: Advanced query pattern recognition with specific metrics for optimization recommendations

### Version 3.7.2 (August 27, 2025)
#### 🔧 Bug Fixes
- **Fixed ServiceTime Calculation**: Fixed serviceTime calculation in Every Query table to properly sum all operator service times from execution plan instead of displaying the same value as elapsedTime
- **Enhanced Data Accuracy**: ServiceTime column now shows accurate sum of all servTime values from plan operators, providing better query performance insights

#### 🎯 Technical Improvements
- **Improved Query Analysis**: Added `calculateTotalServiceTime()` function to sum all servTime values from plan operators
- **Better Data Processing**: Updated `processRequestData()` to calculate serviceTimeMs from plan data instead of using raw serviceTime value
- **Enhanced Table Display**: Updated table display logic to use calculated serviceTimeMs value for accurate performance metrics

### Version 3.7.0 (August 25, 2025)
#### 🚀 New Features
- **Scan Consistency Column**: Added new "Scan Consistency" column in Every Query table between statement and users columns, displaying values like "unbounded" and "request_plus"
- **Sync Gateway Index Filtering**: Added "Exclude Mobile Indexes" checkbox in Indexes tab to filter out Sync Gateway mobile indexes
- **Enhanced Index Statistics**: Fixed Index/Query Flow tab statistics display - index DIVs now show proper avg/min/max scan times and item counts instead of "N/A"

#### 🔧 Bug Fixes
- **Fixed Index Statistics Bug**: Resolved issue where all index statistics showed "N/A" in Index/Query Flow tab by correcting request data access in `buildIndexQueryFlow()` function
- **Improved Statistics Collection**: Added missing statistics collection in `processIndexQueryData()` function for consistent behavior when tab is hidden
- **Corrected Array Index Access**: Fixed `originalRequests[requestIndex]` to `requestsToUse[requestIndex]` to prevent mismatched data access

#### 🌍 Localization Updates
- **Complete Multi-language Support**: All new features fully translated to Spanish, Portuguese, and German
- **Updated Translations**: Added translations for "Scan Consistency", "Sync Gateway Indexes", and "Exclude Mobile Indexes"
- **Version Synchronization**: Updated all language versions to v3.7.0 with consistent functionality

#### 🎯 Technical Improvements
- **Enhanced Table Functionality**: Improved table overflow handling for wider tables with new Scan Consistency column
- **Better Data Processing**: Streamlined index statistics calculation and display logic
- **Consistent Feature Parity**: All localized versions now include identical functionality and bug fixes

### Version 3.6.2 (August 23, 2025)
#### 🔧 Bug Fixes
- **Fixed Index/Query Flow Tab Sync Issues**: Resolved stale data display when using SQL string filters with hidden tabs
- **Enhanced Tab Activation Logic**: Index/Query Flow now always rebuilds from current filtered data when tab is activated
- **Improved Data Structure Compatibility**: Fixed query object structure to prevent `undefined` property errors during rendering
- **Eliminated Complex Deferred Rendering**: Simplified tab visibility handling to remove timing issues and cache invalidation problems

#### 🎯 Technical Improvements
- **Proper Hidden Tab Processing**: Index/Query Flow now processes data structures correctly even when tab is not visible
- **Reliable SVG Connection Rendering**: Fixed SVG connection positioning issues with jQuery UI tab visibility detection
- **Enhanced Debugging**: Added comprehensive console logging for Index/Query Flow data processing and rendering
- **Consistent Cross-Tab Behavior**: Index/Query Flow now behaves consistently with other tabs regarding data processing

### Version 3.6.1 (August 23, 2025)
#### 🚀 New Features
- **EXECUTE Statement Support**: Added full support for EXECUTE statement recognition and categorization
- **Enhanced Query State Colors**: Semantic color scheme for Query State chart (green=completed, red=fatal, orange=timeout, gray=stopped/cancelled, blue=running)
- **Improved Number Formatting**: Added comma separators and rounding to all numeric columns for better readability
- **Enhanced Primary Scan Warnings**: Red/bold styling for primary scan usage indicators in both Query Groups and Every Query tables

#### ✨ User Experience Improvements  
- **Fixed Text Selection**: Resolved table cell text selection issues - users can now highlight and copy data from table cells
- **Better Performance**: Optimized query limit from 4000 to 2000 records (8-10MB vs 36MB) for improved browser performance
- **CDN Cache Busting**: Added version parameters to all external library imports for better cache management
- **Enhanced German Localization**: Fixed missing translations for "Indexes Used" and "Queries Executed" in German version

#### 🔧 Technical Improvements
- **Consistent Statement Type Parsing**: Added `deriveStatementType()` function for reliable statement type detection across all charts
- **Smart Click Handling**: Table row clicks now intelligently detect text selection vs row selection
- **Improved Flow Diagram**: Enhanced Index/Query Flow connection positioning with multiple redraw attempts
- **Better Error Handling**: Fixed JavaScript reference errors in analysis table generation

#### 🌍 Localization
- **Complete Multi-language Support**: All new features fully translated to Spanish, Portuguese, and German
- **Consistent Number Formatting**: Locale-aware number formatting across all language versions

### Version 3.5.2 (August 21, 2025)
#### 🚀 New Features
- **Enhanced Timeline Controls**: Converted radio buttons to dropdown for better UX
- **By Hour Grouping**: Added new "By Hour" time grouping option for timeline analysis
- **1 Week Time Range**: Added "1 Week" button for quick time range selection
- **Improved UI Labels**: Added clear labels for "Time Grouping" and "Y-Axis Scale" controls
- **Visual Grouping**: Added styled container for Y-Axis Scale controls with improved visual hierarchy

#### ✨ Improvements
- **Better Time Range Validation**: Added validation for "By Hour" grouping with 1-week limit
- **Enhanced Button Text**: Updated "Use Time Range" to "Use Charts Current X-Axis Date Range" for clarity
- **Simplified Zoom Instructions**: Streamlined zoom help text to "Drag box to zoom area"
- **Dynamic Time Unit Translation**: Optimizer labels now show translated time units (e.g., "Por Optimizador (hora)" in Spanish)
- **Improved Button Ordering**: Reordered time range buttons for logical flow (Original → 1 Week → 1 Day → 1 Hour)

#### 🌍 Localization
- **Complete Multi-language Support**: All new features fully translated to Spanish, Portuguese, and German
- **Dynamic Time Unit Translations**: Time units in optimizer labels now translate properly in all languages
- **Updated Translation Keys**: Added new translation keys for all new UI elements

#### 🔧 Technical Improvements
- **Modernized JavaScript**: Updated functions to work with dropdown controls instead of radio buttons
- **Better Error Handling**: Enhanced validation with language-specific error messages
- **Consistent UI Architecture**: Improved CSS class structure for better maintainability

### Version 3.5.1 (August 20, 2025)
- **Bug Fixes**: Fixed regex parsing bug in Index tab bucket dropdown that showed "ON" instead of actual bucket names
- **Improvements**: Improved parsing to handle complex CREATE INDEX statements with words containing "on" (like "accommodation")

### Version 3.5.0 (August 15, 2025)
- **New Features**: Added SQL++ statement pre-filtering during JSON parsing for better performance, reorganized date picker layout with vertical stacking and improved label alignment.
- **Technical Improvements**: Enhanced filterSystemQueries() function, improved UI layout and space management, reduced parse time for large datasets, and fixed data caching issue where SQL filters weren't clearing properly on re-parse.
- **Localization**: Updated all language versions (Spanish, Portuguese, German) with new features and added translations for new UI elements.

### Version 3.4.2 (August 15, 2025)
- **UI Enhancements**: Improved Timeline chart interactions and button styling consistency - disabled mouse wheel zoom, enhanced selection box visibility, auto-reset radio buttons on parse, enlarged Parse JSON button, and applied consistent styling to time range and control buttons.

### Version 3.4.1 (August 15, 2025)
- **Bug Fixes**: Fixed JavaScript copy button functionality across all language versions - resolved event parameter handling in copyStatement, copyAnalysisStatement, and copyToClipboard functions.

### Version 3.4.0 (2025-08-13)
- **Enhanced Database Operations Timeline Chart**: Added average index scans per query metric and curved line visualization for better performance insights.

### Version 3.3.1 (2025-08-10)
- **Bug Fixes**: Fixed crosshair synchronization issues in localized versions and corrected y-axis scaling behavior for timeline charts.

### Version 3.3.0 (2025-08-09)
- **Synchronized Timeline Crosshairs**: All timeline charts now feature synchronized crosshairs that move together when hovering over any chart, making it easier to correlate data across different metrics at the same time point.

### Version 3.2.0 (2025-08-08)
**Major Architecture & Localization Enhancements:**
- **CSS Architecture Refactoring**:
  - Moved from 208 inline styles to centralized CSS classes (44% reduction)
  - Implemented comprehensive utility class system for maintainability
  - Minimized CSS for improved performance and file size reduction
  - Enhanced visual consistency across all components
- **Multilingual Support**:
  - Added German localization (de_index.html)
  - Completed Spanish localization (es_index.html)
  - Completed Portuguese localization (pt_index.html)
  - Synchronized CSS architecture across all language versions
- **Developer Experience**:
  - Created comprehensive LOCALIZATION_GUIDE.md for future maintenance
  - Established translations.json system for consistent translations
  - Simplified localization sync process with centralized styling
  - Enhanced code maintainability and reduced inline style dependencies

### Version 3.1.0 (2025-08-07)
**New Features & Enhancements:**
- **Dashboard Tab Improvements**:
  - Converted "Primary Scan Usage" pie chart to "Primary Indexes Used" donut chart
  - Added intelligent warning system that only appears when primary indexes are detected
  - Integrated "Learn More" link to Couchbase best practices documentation
  - Enhanced visual design with better color contrast and readability
- **Index Query Flow Tab Enhancements**:
  - Improved primary index detection to include indexes ending with `*_primary`
  - Enhanced visual highlighting for all primary index variants
  - Better coverage of primary index naming patterns (`#primary`, `bucket_primary`, etc.)
- **User Experience**:
  - Cleaner interface with conditional warnings only when relevant
  - Educational resources directly integrated into the tool
  - More intuitive visual feedback for performance optimization opportunities

### Version 3.0.1 & Earlier
See git history for previous version changes

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
