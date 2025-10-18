# Couchbase Slow Query Analysis Tool v3.23.0-post-post

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
- **Current Version**: 3.23.0-post (Last Updated: 2025-10-17)

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


