# Couchbase Slow Query Analysis Tool v3.10.0

## Version Management
- **Current Version**: 3.10.0 (Last Updated: 2025-08-30)

### Workflow Order for Updates
When making changes, follow this order:
1. **Update Version** → Follow settings/VERSION_UPDATE_GUIDE.md
2. **Update Localization** → Follow settings/LOCALIZATION_GUIDE.md  
3. **Update README Release Notes** → Add release notes to all README files

### Version Update Process
- **Title Updates**: When updating versions, remember to update:
  - `<title>Query Analyzer v3.10.0</title>` in index.html header
  - `<meta name="version" content="3.10.0" />` in index.html meta tags
  - `APP_VERSION = '3.10.0';` in JavaScript constants
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

## Sample Data
The `sample/` folder contains test JSON files for development and testing:
- **test_system_completed_requests.json**: Sample completed request query output for LEFT TOP input box
- **test_system_indexes.json**: Sample system:indexes query output for RIGHT TOP input box
- Use these files for testing functionality or as reference for expected schema/data format

## Code Style
- Vanilla JavaScript with jQuery for DOM manipulation
- CSS embedded in `<style>` tags using BEM-like naming (.step-bubble, .modal-content)
- Function names use camelCase (parseTime, generateFlowDiagram, calculateTotalKernTime)
- Event handlers attached via addEventListener, not inline
- Modular functions for parsing, analysis, and UI generation
- Comments explain complex logic (especially time parsing and SQL++ filtering)

## Key Components
- JSON parser for Couchbase completed_requests data
- Query normalization (replaces literals with ? for grouping)
- Interactive flow diagrams showing execution plan operators
- Statistical analysis with duration calculations and aggregation
- Enhanced modal dialogs with indexes/keys extraction and visual execution plans
- Timeline charts with dual y-axis and performance indicators
- Index/Query Flow visualization with performance highlighting


