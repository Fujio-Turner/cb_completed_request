# Couchbase Slow Query Analysis Tool v3.29.3

## Setup and Installation

### First-Time Setup
When cloning this repository, install required dependencies:

```bash
# Install Node.js dependencies (for Playwright tests)
npm install

# Install Playwright browsers (required for E2E tests)
npx playwright install

# Python dependencies (for utility scripts in /python/)
# Most Python scripts use standard library only
# If needed: pip3 install <package-name>
```

### Testing
```bash
# Run Playwright E2E tests
npm run test:e2e              # Full test suite (all browsers)
npm run test:e2e:ui           # Interactive UI mode
npm run test:e2e:headed       # See browser while testing
npm run test:e2e:debug        # Debug mode
npm run test:e2e:report       # View last test report

# Run Jest unit tests (if available)
npm test
```

See [PLAYWRIGHT_TESTING.md](./PLAYWRIGHT_TESTING.md) and [settings/TESTING_WORKFLOW.md](./settings/TESTING_WORKFLOW.md) for details.

## Version Management
- **Current Version**: 3.29.3 (Last Updated: 2025-12-02)

### Workflow Order for Updates
When making changes, follow this order:
1. **After Release (on non-main branch)** → Follow settings/POST_RELEASE_GUIDE.md to add "-post" suffix and dev banner
2. **Before Release** → Follow settings/RELEASE_GUIDE.md (includes removing dev banner)
3. **Update Version** → Follow settings/VERSION_UPDATE_GUIDE.md
4. **Update README Release Notes** → Add release notes as needed

Note: Only update the English UI (en/index.html) by default. Do not update other language files unless explicitly requested.

### Version Update Process
- **Title Updates**: When updating versions, remember to update:
  - `<title>Query Analyzer vX.X.X</title>` in index.html header
- `<meta name="version" content="X.X.X" />` in index.html meta tags
- `APP_VERSION = 'X.X.X';` in JavaScript constants
  - Version number in this AGENT.md file header

## Architecture

- Single-page HTML application for analyzing Couchbase query performance
- Frontend-only tool with no build process - just open `index.html` in browser
- Uses jQuery UI for tabs, Chart.js for visualizations, and Panzoom for flow diagrams
- Six main sections: Dashboard, Timeline, Analysis (query aggregation), Every Query (detailed view), Index/Query Flow, and Indexes (index management)

## Feature Flags

- **Flow Diagram Hierarchy** (`?dev=true` in URL): Enable experimental hierarchical query flow visualization
  - Default: Linear flow diagram (stable, proven)
  - With `?dev=true`: Hierarchical tree with subquery separation and nested operator containers
  - Documentation: See [FLOW_DIAGRAM_FEATURE_FLAG.md](./FLOW_DIAGRAM_FEATURE_FLAG.md)

- **Debug Logging** (`?debug=true` or `?logLevel=debug|trace` in URL): Enable verbose console logging for debugging
  - Default: Only `[info]`, `[warn]`, `[error]` logs shown
  - With `?debug=true`: Additional `[debug]` and `[trace]` logs shown
  - With `?logLevel=trace|debug|info|warn|error`: Granular control over log levels
  - Combine flags: `?dev=true&debug=true&logLevel=trace`
  - Documentation: See [DEBUG_LOGGING_IMPLEMENTATION.md](./DEBUG_LOGGING_IMPLEMENTATION.md)

- **Data Redaction** (`?redact=true|false` in URL): Control redaction of sensitive data in logs and debug output
  - Default: `true` (sensitive data is hashed using SHA-256)
  - With `?redact=false`: Show original bucket names, index names, collection names, and query text
  - With `?redact=true`: Hash sensitive data (e.g., `idx_users` becomes `3E417C7C`)
  - Use case: Disable redaction when debugging locally with non-sensitive data
  - Security: **Never share logs with `?redact=false` if they contain production data**
  - Example: `?debug=true&redact=false` for local debugging with full visibility
  - Implementation: See `DebugRedactor` in `liquid_snake/assets/js/base.js`

## How to Run

- No build commands - static HTML file
- Open `index.html` directly in web browser
- Input: JSON from `SELECT *, meta().plan FROM system:completed_requests WHERE node = NODE_NAME();`

## File Organization

### Directory Structure
- **`/python/`** - Python utility scripts for development and maintenance
- **`/logs/release/`** - Release reports and verification documentation
- **`/sample/`** - Test JSON files for development and testing
- **`/settings/`** - Configuration files and guides

### Sample Data
The `sample/` folder contains test JSON files for development and testing:
- **test_system_completed_requests.json**: Sample completed request query output for LEFT TOP input box
- **test_system_indexes.json**: Sample system:indexes query output for RIGHT TOP input box
- Use these files for testing functionality or as reference for expected schema/data format

### Python Scripts Location
All Python utility scripts are located in the **`/python/`** folder:
- **Translation scripts**: apply_*.py files for localization
- **Development tools**: analyze_*, optimize_*, validate_* scripts
- **Maintenance utilities**: fix_*, find_*, convert_* scripts

When creating new Python scripts, place them in `/python/` folder

## Code Style

- Vanilla JavaScript with jQuery for DOM manipulation
- CSS embedded in `<style>` tags using BEM-like naming (.step-bubble, .modal-content)
- Function names use camelCase (parseTime, generateFlowDiagram, calculateTotalKernTime)
- Event handlers attached via addEventListener, not inline
- Modular functions for parsing, analysis, and UI generation
- Comments explain complex logic (especially time parsing and SQL++ filtering)

### Timezone Conversion (Issue #203)

**IMPORTANT**: Whenever JavaScript code needs to display `requestTime` or any timestamp from data:

1. **ALWAYS use `getChartDate()` for timezone conversion**
2. **NEVER display raw `request.requestTime` directly**
3. **Apply to ALL tables, charts, and UI elements showing timestamps**

**Correct pattern**:
```javascript
// ✅ CORRECT - Apply timezone conversion
const originalTime = request.requestTime;
const convertedDate = getChartDate(originalTime);
const displayTime = convertedDate ? convertedDate.toISOString().replace('T', ' ').substring(0, 23) + 'Z' : originalTime;
```

**Incorrect pattern**:
```javascript
// ❌ WRONG - Raw timestamp ignores user's timezone selection
const displayTime = request.requestTime;
```

**Locations that apply timezone conversion**:
- Timeline charts x-axis: Uses `getChartDate()` via `getCurrentTimeConfig()`
- Insights tab sample queries: `updateInsightSampleQueries()` and `updateSampleQueriesTable()`
- Every Query tab: `EVERY_QUERY_COLUMNS` requestTime column `getValue()` function
- Indexes tab: `createIndexHTML()` for Last Scan timestamps
- Analysis/Query Groups: Does not show requestTime (aggregated data only)

**How it works**:
- User selects timezone from dropdown (stored in `currentTimezone` global variable)
- `getChartDate(requestTime)` converts UTC timestamp to selected timezone
- `convertToTimezone(date, timezone)` handles the actual conversion using `Intl.DateTimeFormat`
- Timezone changes trigger filter reminder (user must click "Parse JSON" to regenerate data)

## Logging and Debugging Strategy

### Debug Mode URL Parameter

Enable verbose logging with `?debug=true` in the URL:
```
http://localhost:8000/en/index.html?debug=true
```

### Logger Utility

All logging should use the `Logger` utility (not raw `console.log`):

```javascript
Logger.info("Function completed");     // Always visible
Logger.debug("Processing step X");     // Only with ?debug=true
Logger.trace("Loop iteration N");      // Only with ?debug=true (verbose)
Logger.warn("Potential issue");        // Always visible
Logger.error("Error occurred", err);   // Always visible
```

### Logging Levels Philosophy

#### `[info]` - Function Status & Results
**Purpose**: High-level function completion and operational status

**Use for**:
- Function completion messages
- Record counts processed (e.g., "Parsed 2000 requests")
- Execution timing (e.g., "Parse performance: 375ms")
- Important state changes
- User-facing notifications

**Examples**:
```javascript
Logger.info('Parse JSON completed: processed 2000 requests');
Logger.info(`Parse performance: ${timing}ms for ${count} requests`);
Logger.info('✅ Index extraction complete: 9 unique indexes, 2562 total references');
```

**When to use**:
- Function entry/exit for major operations
- Summary of what the function accomplished
- How long it took
- How many items were processed

#### `[debug]` - Function Operations & Details
**Purpose**: Detailed information about function internals and operations

**Use for**:
- Internal state changes
- Cache operations and statistics
- Step-by-step operation details
- Intermediate calculations
- Data transformations

**Examples**:
```javascript
Logger.debug('🧹 Destroyed 20 chart instances');
Logger.debug(`Cache stats - parseTime: ${size}/${limit} (${percent}%)`);
Logger.debug(`Date filtering: ${before} requests -> ${after} after date range filter`);
Logger.debug('Collected index data for timing analysis:', indexData);
```

**When to use**:
- Inside functions to show what's happening
- Before/after data transformations
- Cache hit/miss information
- Memory operations

#### `[trace]` - Loop Iterations & Detailed Flow
**Purpose**: Verbose execution tracking for loops, iterations, and regex operations

**Use for**:
- Each iteration of a loop
- Regex match results
- Individual record processing
- Detailed execution path

**Examples**:
```javascript
// Loop iteration logging
requests.forEach((req, index) => {
    Logger.trace(`Processing request ${index + 1}/${total}: ${req.requestId}`);
    // ... process request
});

// Regex operation logging
const matches = text.match(/pattern/g);
Logger.trace(`Regex matches found: ${matches?.length || 0}`, matches);

// Detailed flow
Logger.trace(`Lazy loaded ${tabName} tab in ${ms}ms`);
```

**When to use**:
- Inside forEach, for, while loops
- Regex operations that might match multiple items
- Detailed step-by-step execution flow
- Performance-critical sections (to measure each step)

### Data Redaction Flag (✅ IMPLEMENTED)

**Control sensitive data visibility in logs:**
```
?debug=true&redact=false   # Show full data in trace logs
?debug=true&redact=true    # Hide sensitive data (default)
```

**Implementation:**
```javascript
import { isRedactMode, DebugRedactor } from './base.js';

// Check if redaction is enabled
if (isRedactMode()) {
    Logger.debug('Index:', DebugRedactor.hash(indexName));  // Shows: "3E417C7C"
} else {
    Logger.debug('Index:', indexName);  // Shows: "idx_users"
}

// Redact composite keys (indexName::bucket.scope.collection)
Logger.debug('Key:', DebugRedactor.redactCompositeKey(key));
// With redact=true: "3E417C7C::7DFB4CF6.3BF30573.3BF30573"
// With redact=false: "idx_users::travel-sample._default._default"

// Redact objects
Logger.debug('Index data:', DebugRedactor.redactObject(indexData));
// With redact=true: { "3E417C7C": "[REDACTED]", "7DFB4CF6": "[REDACTED]" }
// With redact=false: { "idx_users": {...}, "idx_orders": {...} }
```

**Usage Notes:**
- Default is `true` (redacts by default for security)
- Use `?redact=false` only when debugging locally with non-production data
- Never share screenshots/logs with `?redact=false` if they contain production data
- Hashing uses SHA-256 (first 8 characters uppercase)

### Best Practices for Adding Logging

#### 1. Function Entry/Exit Pattern
```javascript
function parseJSON(data) {
    Logger.info(`Starting JSON parse: ${data.length} characters`);
    
    try {
        // ... parsing logic
        Logger.debug(`Parsed ${results.length} records`);
        
        Logger.info(`✅ Parse complete: ${results.length} records in ${timing}ms`);
        return results;
    } catch (error) {
        Logger.error('JSON parse failed:', error);
        throw error;
    }
}
```

#### 2. Loop Processing Pattern
```javascript
function processRequests(requests) {
    Logger.info(`Processing ${requests.length} requests`);
    
    requests.forEach((req, index) => {
        Logger.trace(`[${index + 1}/${requests.length}] Processing: ${req.requestId}`);
        
        // ... process request
        Logger.debug(`Request ${req.requestId} processed: ${result.status}`);
    });
    
    Logger.info(`✅ All requests processed`);
}
```

#### 3. Cache Operations Pattern
```javascript
function getCachedValue(key) {
    if (cache.has(key)) {
        Logger.debug(`Cache HIT: ${key}`);
        return cache.get(key);
    }
    
    Logger.debug(`Cache MISS: ${key}, computing value`);
    const value = computeExpensiveValue(key);
    cache.set(key, value);
    return value;
}
```

### What NOT to Log

❌ **Don't use raw console methods**:
```javascript
// BAD
console.log("Processing...");

// GOOD
Logger.info("Processing...");
```

❌ **Don't log in tight loops without trace**:
```javascript
// BAD - pollutes console even in normal mode
for (let i = 0; i < 10000; i++) {
    Logger.debug(`Item ${i}`);  // Too verbose!
}

// GOOD - only when debugging
for (let i = 0; i < 10000; i++) {
    Logger.trace(`Processing item ${i}: ${items[i]}`);
}
```

❌ **Don't log sensitive data**:
```javascript
// BAD
Logger.info(`User password: ${password}`);

// GOOD
Logger.info(`User authenticated: ${username}`);
```

### Testing Your Logging

**Normal Mode** (default):
```bash
# Open browser console
# Should see only [info], [warn], [error]
# Should NOT see [debug] or [trace]
```

**Debug Mode** (`?debug=true`):
```bash
# Open with ?debug=true
# Should see [info], [debug], [trace], [warn], [error]
# Verify trace logs only appear in loops/iterations
```

### Documentation

See [DEBUG_LOGGING_IMPLEMENTATION.md](./DEBUG_LOGGING_IMPLEMENTATION.md) for complete implementation details.

## Internationalization Guidelines (v3.10.0+)
- **ALWAYS use TEXT_CONSTANTS** for user-facing strings in JavaScript
- **NEVER hardcode English text** in console.log, showToast, alert, or template literals
- **DO NOT translate** technical constants like "N/A" used in logic checks
- **Use descriptive constant names** (e.g., COPY_STATS not CS)

### ✅ Correct Internationalization Pattern:
```javascript
// GOOD: Translation-safe
console.log(`${TEXT_CONSTANTS.PARSE_PERFORMANCE} ${timing}ms`);
showToast(TEXT_CONSTANTS.PASTE_JSON_FIRST, "warning");
html += `<button onclick="copy()">${TEXT_CONSTANTS.COPY}</button>`;

// BAD: Will break during translation  
console.log("Parse performance: " + timing + "ms");
showToast("Please paste your JSON data first", "warning");
html += '<button onclick="copy()">Copy</button>';
```

### Adding New Translatable Text:
1. **Add to TEXT_CONSTANTS** with descriptive key name
2. **Replace hardcoded string** with `TEXT_CONSTANTS.KEY_NAME`
3. **Update settings/LOCALIZATION_GUIDE.md** translation template
4. **Test in browser** to ensure no JavaScript errors

## Key Components
- JSON parser for Couchbase completed_requests data
- Query normalization (replaces literals with ? for grouping)
- Interactive flow diagrams showing execution plan operators
- Statistical analysis with duration calculations and aggregation
- Enhanced modal dialogs with indexes/keys extraction and visual execution plans
- Timeline charts with dual y-axis and performance indicators
- Index/Query Flow visualization with performance highlighting

## Timeline Charts - X-Axis Consistency (Issue #148)
**IMPORTANT**: All charts in the Timeline tab MUST use `getCurrentTimeConfig(requests)` for x-axis time configuration to ensure consistent date formatting and alignment across all charts.

### Correct X-Axis Configuration:
```javascript
scales: {
    x: {
        type: "time",
        time: getCurrentTimeConfig(requests),  // ✅ Ensures consistent formatting
        title: {
            display: true,
            text: "Request Time"
        }
    },
    // ... other scale configs
}
```

### Universal Time Bucket Alignment:
For charts that aggregate data into time buckets, use `getTimelineBucketsFromRequests()` to ensure all charts share identical x-axis ranges:

```javascript
// Get all timeline buckets to ensure charts share same x-axis
const buckets = getTimelineBucketsFromRequests(requests, grouping);

// Map data to all buckets (use null for missing data points)
const sortedData = buckets.map(ts => {
    const key = ts.toISOString();
    const group = timeGroups[key] || { /* default empty data */ };
    // ... process data, return null if no data for this bucket
});
```

### Why This Matters:
- Consistent date format (e.g., "Jul 16", "Aug 05" instead of "07/16", "08/05")
- Aligned x-axis ranges across all timeline charts
- Synchronized zoom and pan behavior
- Proper vertical stake line alignment (Issue #148)

## Documentation and Workflow Tools

### Process Visualization
- **Use https://mermaid.live/** for creating graphs and flowcharts of JavaScript processes
- Create diagrams for complex workflows like JSON parsing, chart generation, or data processing flows
- Document function call relationships and data transformation pipelines
- Visualize caching strategies and optimization workflows

### Markdown Documentation
- **README files**: Use clear structure with Quick Start sections at top, Release Notes at bottom
- **Technical guides**: Include code examples with proper syntax highlighting
- **Workflow documentation**: Use numbered steps and checkboxes for processes
- **Cross-references**: Link between related files (LOCALIZATION_GUIDE.md, VERSION_UPDATE_GUIDE.md)
- **Language navigation**: Include 🌍 language links in all README files

### Code Analysis and Optimization Workflows
- **Performance optimization**: Use browser dev tools profiling with sample data multiplied x1000
- **Dead code detection**: Use `python/analyze_dead_code.py` and `python/quick_dead_code_cleanup.py` scripts
- **CSS optimization**: Use `python/optimize_css.py` for minification and deduplication
- **Translation safety**: Use `python/find_hardcoded_strings.py` to identify text needing TEXT_CONSTANTS


