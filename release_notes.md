### Version 3.21.0 (October 12, 2025)
- **New: Timeline first-time tooltip** - Big tooltip guide for creating stakes when clicking Timeline tab, shown only once (closes #151)
- **Enhancement: Timeline charts design** - Improved visual design and layout for better user experience (closes #152)
- **Fix: Timeline chart legends** - Now displays all query bucket names correctly (closes #153)
- **Enhancement: Threshold lines** - Added 100/ms threshold to Index Scan chart and 10/ms to Doc Fetch chart (closes #154)
- **Enhancement: Timeline Queries Legend search** - Added search bar to filter and find queries in legend (closes #155)

### Version 3.20.0 (October 11, 2025)
- **New: Timeline Buckets chart** - Line chart visualization for time-bucketed query analysis (closes #150)
- **New: Service TimeThroughput split** - Split into Doc and Index metrics with Avg Count Line on 2nd y-axis (closes #147)
- **New: Vertical stake line** - Blue dotted vertical line across all Timeline charts via double-click (closes #148)
- **Enhancement: Timeline UI cleanup** - Consistent date formats, unified font sizes, removed "Timeline" and "(Beta)" from titles, minified tooltips (closes #149)
- **Enhancement: X-axis consistency** - All Timeline charts now use consistent time configuration and universal bucket alignment

### Version 3.19.0 (October 9, 2025)
- **New: Dashboard enhancements** - Log scale checkbox for better data visualization (closes #146)
- **New: Bubble chart** - Advanced visualization for query performance analysis (closes #145)
- **Enhancement: Code organization** - Moved dashboard code for better maintainability (closes #144)
- **Enhancement: Analysis Hub** - Updated analysis hub with improved features (closes #143)
- **Enhancement: Parse and Plan** - Enhanced parse and plan visualization (closes #142)
- **Enhancement: Chart styling** - Updated line colors for better readability (closes #141)
- **Enhancement: UI improvements** - Full screen expand capability and color improvements (closes #139)

### Version 3.18.0 (October 8, 2025)
- **New: Insights (Beta)** - Advanced query insights and analysis capabilities (closes #138)
- **New: Enhanced Chart** - Improved visualization features (closes #137)
- **New: Timezone Awareness** - Full timezone support for global users (closes #136)
- Enhancement: Additional performance improvements (closes #134, #133)

### Version 3.17.1 (October 5, 2025)
- Fix: Timeline control order reorganized for better user experience (closes #132)
- Fix: analysis_hub.html reference links now navigate to exact sections (closes #131)

### Version 3.17.0 (October 5, 2025)
- **New: Parse and Plan charts in Timeline** - Major debugging feature for analyzing query parsing and planning phases (closes #130, #129)
- Enhancement: Timeline visualization improvements for slow query debugging (closes #128, #127)

### Version 3.16.4 (October 3, 2025)
- Bug fixes and quality improvements
- Closes: #125, #124, #63

### Version 3.16.3 (September 29, 2025)
- Bug fixes and quality improvements
- Closes: #120, #119, #118

### Version 3.16.2 (September 28, 2025)
- Fix: Query Groups phase timeline now aligns Doc Fetch to end no earlier than Index Scan; Project occurs after Filter/Group/Sort/Limit (closes #115, #114)
- Fix: Insights “Missing WHERE” detection now checks preparedText for EXECUTE statements (closes #113)
- Docs/SEO: Added SEO keywords to landing page for better discoverability (closes #116)

### Version 3.16.1 (September 25, 2025)
- Bug fixes and quality improvements
- Closes: #112, #111, #110, #109

### Version 3.16.0 (September 25, 2025)
- New: Insights shows query count and % of total queries (closes #107)
- Docs: Improved kernTime explanations in Insights and Analysis Hub (closes #106, #108)
- Fix: Parse JSON statement parsing error and better debugging on failed JSON (closes #104, #105)

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