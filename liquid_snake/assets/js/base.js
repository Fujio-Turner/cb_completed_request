// ============================================================
// BASE.JS - Core Utilities for Couchbase Query Analyzer
// ============================================================
// This module provides:
// - TEXT_CONSTANTS (i18n strings)
// - Logger (with URL flag support: ?debug=true, ?logLevel=)
// - URL parameter utilities (?dev=true for feature flags)
// ============================================================

// Global text constants - modify these for different languages
export const TEXT_CONSTANTS = {
    // Performance and logging messages
    PARSE_PERFORMANCE: "Parse performance:",
    PREPARED_TEXT: "Prepared:",
    CACHE_STATS: "Cache stats - parseTime:",
    ALL_CACHES_CLEARED: "All caches cleared for new JSON parse",
    LAZY_LOADED_TAB: "Lazy loaded",
    CHART_SAMPLING: "Chart sampling: Using",
    TIMELINE_CHARTS_USING: "Timeline charts: Using",
    REQUESTS_FOR_PERFORMANCE: "requests for performance",
    FILTERED_OUT_EARLY: "filtered out early",

    // Error messages
    JSON_PARSING_ERROR: "JSON parsing error:",
    ERROR_PROCESSING_REQUEST: "Error processing request",
    ERROR_GENERATING_UI: "Error generating UI:",
    ERROR_LAZY_LOADING: "Error lazy loading",

    // User messages and toasts
    PASTE_JSON_FIRST: "Please paste your JSON data first",
    INPUT_TOO_LARGE: "Input too large. Please use smaller datasets.",
    VALID_JSON_REQUIRED: "Please provide a valid JSON array or object with results.",
    NO_DATA_FOUND: "No data found in the JSON",
    UNEXPECTED_DATA_FORMAT: "Unexpected data format in JSON",
    ERROR_PARSING_JSON: "Error parsing JSON:",
    FILTERS_CHANGED_REMINDER: "⚠️ Filters changed. Click \"Parse JSON\" to apply changes.",

    // Chart and table captions
    SHOWING_TOP: "Showing top",
    OF_TOTAL: "of",
    USERS: "users",
    INDEXES: "indexes",
    REQUESTS: "requests",
    MS_FOR: "ms for",

    // Progress and status
    TAB_IN: "tab in",
    MS: "ms",

    // Operator modal and UI elements
    UNKNOWN: "Unknown",
    OPERATOR_LABEL: "Operator:",
    COPY_STATS: "Copy Stats",
    INDEX_USED: "Index Used:",
    COPY: "Copy",
    COPY_ALL: "Copy All",
    SHOW_MORE: "Show More",
    HIDE: "Hide",
    RESET_ZOOM: "Reset Zoom",

    // User interface messages
    COPIED_CLIPBOARD: "Copied to clipboard!",
    FAILED_COPY_CLIPBOARD: "Failed to copy to clipboard",
    COPIED: "Copied!",
    NO_EXECUTION_PLAN: "No execution plan available.",
    NO_OPERATORS_FOUND: "No operators found in the execution plan.",
    SELECT_QUERY_FLOW: "Select a query from the table to view the flow diagram.",
    STATEMENT_NOT_FOUND: "Statement not found",

    // Modal and plan display headers
    VIEW_DETAILED_PLAN: "View Detailed Execution Plan & Indexes/Keys Used",
    INDEXES_USED_HEADER: "📋 Indexes Used:",
    USE_KEYS_HEADER: "🔑 USE KEYS:",
    EXECUTION_PLAN_HEADER: "⚙️ Execution Plan:",
    KEYS_NOT_EXTRACTED: "Keys could not be extracted from the query",
    
    // Sample queries functionality
    SHOW_SAMPLE_QUERIES: "Show Sample Queries",
    HIDE_SAMPLE_QUERIES: "Hide Sample Queries",
    REQUEST_DATE: "Request Date",
    STATEMENT: "Statement",
    STATEMENT_UNIQUE: "Statement (unique)",

    // Console log messages
    COLLECTED_INDEX_DATA: "Collected index data for timing analysis:",
    INDEX_ANALYSIS_INITIALIZED: "✅ Index analysis initialized",
    INITIALIZING_ANALYZER: "🚀 Initializing Couchbase Query Analyzer...",
    FEATURES: "🔧 Features:",
    ANALYZER_INITIALIZED: "✅ Query Analyzer initialized successfully",
    TIP_ABOUT: "💡 Tip: Type QueryAnalyzer.about() for full app info",

    // Chart and table labels
    QUERY_DURATION_CHART_TITLE: "Query Duration by Statement Type (Bubble Size = Query Count)",
    USER_COUNT: "user: (count)",
    STATE_FATAL: "state\nfatal",
    COUNT_LABEL: "Count:",
    AVG_LABEL: "Avg:",
    MIN_LABEL: "Min:",
    MAX_LABEL: "Max:",
    FATAL_LABEL: "Fatal:",
    ELAPSED_LABEL: "Elapsed:",
    SWITCHED_TO: "Switched to",
    QUERY_GROUP_PHASE_TIMES_TITLE: "Phase Times by Query Group (avg)",
    PHASE_AUTHORIZE: "Authorize",
    PHASE_PARSE: "Parse",
    PHASE_PLAN: "Plan",
    PHASE_INDEX_SCAN: "Index Scan",
    PHASE_FETCH: "Doc Fetch",
    PHASE_FILTER: "Filter",
    PHASE_JOIN: "JOIN",
    PHASE_PROJECT: "Project",
    PHASE_DELETE_UPDATE: "DELETE / UPDATE",
    PHASE_DELETE: "DELETE",
    PHASE_UPDATE: "UPDATE",
    PHASE_INSERT: "INSERT",
    PHASE_STREAM: "Stream",
    PHASE_SORT: "ORDER BY",
    PHASE_GROUP_AGG: "GROUP BY",
    PHASE_LIMIT: "LIMIT",
    PHASE_NEST: "Nest/Unnest",
    AXIS_QUERY_PHASE: "Query Phase",
    AXIS_TIME_MS: "Time (ms)",

    // Phase timeline note (approximate)
    PHASE_TIMELINE_NOTE: "Approximate phase positions: many steps run concurrently and asynchronously; bars show average timing, not exact start times.",

    // Technical constants (DO NOT TRANSLATE - used in logic checks)
    N_A: "N/A",
    NO_DATA: "No data",
    LOADING: "Loading...",

    // Timezone selection
    TIMEZONE_LABEL: "Timezone:",
    TIMEZONE_DETECTED: "Detected:",
    TIMEZONE_UTC: "UTC",
    TIMEZONE_AUTO_DETECTED: "Auto-detected from data",

    // Input panel toggle
    SHOW_INPUT_PANEL: "Show",
    HIDE_INPUT_PANEL: "Hide",
    TOGGLE_INPUT_TOOLTIP: "← Click to Show/Hide Data & Filters",

    // Help badge
    HELP_DEBUG_TIPS: "NEED HELP? Debugging + Tool Tips — Click Here",

    // Bug report CTA
    BUG_REPORT_CTA: "Report a Bug Click Here",

    // File upload UI + messages
    UPLOAD_JSON: "Upload .json",
    INVALID_FILE_TYPE: "Please select a .json file",
    FILE_READ_ERROR: "Error reading file",
    PASTE_OVERRIDES_UPLOAD: "Pasted JSON overrides uploaded file; cleared file selection",
    OR_LABEL: "OR",

    // Input section headers
    COMPLETED_JSON_HEADER: "Completed Requests JSON (system:completed_requests)",
    INDEXES_JSON_HEADER: "Indexes JSON (system:indexes output)",

    // New features (v3.17.1+)
    WHOLE_RECORD: "Whole Record",
    REQUEST_ID: "Request ID",
    ENTER_REQUEST_ID: "Enter requestId",
    LOAD: "Load",
    RECORD_NOT_FOUND: "Request ID not found",
    VIEW_WHOLE_RECORD: "View Whole Record",
    COPY_REQUEST_ID: "Copy Request ID",

    // Report Maker strings
    REPORT_MAKER: "Report Maker",
    SELECT_SECTIONS: "Select sections",
    SELECT_TIMELINE_CHARTS: "Select Timeline charts",
    INCLUDE_HEADER_SUMMARY: "Include header summary",
    INCLUDE_FILTERS: "Include filters applied",
    FLATTEN_TABLES_FOR_PRINT: "Flatten scrollable tables for print",
    CONVERT_CHARTS_TO_IMAGES: "Convert charts to images for printing",
    PREVIEW_REPORT: "Preview Report",
    PRINT_SAVE_PDF: "Print / Save PDF",
    EXIT_REPORT_MODE: "Exit Report Mode",
    LOAD_TEST_SAMPLE: "Load test sample JSON",
    REPORT_GENERATED_AT: "Generated at",
    REPORT_TIME_RANGE: "Range",
    REPORT_FILTERS_APPLIED: "Filter",
    REPORT_OPTIONS: "Options",
    EXIT_REPORT_PREVIEW: "EXIT REPORT PREVIEW",
    COVER_TITLE: "Couchbase Query Analysis Report",
    COVER_SECTIONS_INCLUDED: "Sections included",
    COVER_TIMELINE_CHARTS: "Timeline charts",
    COVER_FILTERS_APPLIED: "Filters applied",
    COVER_TIME_RANGE: "Time range",
    COVER_DATA_COUNTS: "Data counts",
    COVER_NOTES: "Notes",
    COVER_BETA_NOTE: "Some charts marked Beta/Dev may display incomplete or placeholder content.",

    // Cover page rich content blocks (English)
    COVER_BLOCK_DASHBOARD_HTML: "<div class=\"section\"><h3>Dashboard</h3><p>High-level overview with draggable charts showing query duration distribution, index type usage, scan consistency patterns, result size analysis, and system health metrics. Perfect for at-a-glance performance monitoring.</p></div>",
    COVER_BLOCK_INSIGHTS_HTML: "<div class=\"section\"><h3>Insights Tab</h3><p>The Insights tab provides automated analysis organized into three main categories, each with expandable insights and live metrics based on your parsed query data:</p><h4> Analysis Categories</h4><div><h5> Index Performance Issues</h5><ul><li>Inefficient Index Scans - Identifies queries with poor selectivity ratios</li><li>Slow Index Scan Times - Flags indexes taking 2+ seconds to scan</li><li>Primary Index Over-Usage - Detects reliance on expensive primary indexes</li><li>ORDER BY / LIMIT / OFFSET Index Over-Scan - Highlights over-scanning due to pagination patterns (Beta)</li></ul><h5>⚡ Resource Utilization Issues</h5><ul><li>High Kernel Time in Queries - CPU scheduling overhead analysis</li><li>High Memory Usage Detected - Memory-intensive query identification</li><li>Slow USE KEY Queries - KV service bottleneck detection</li></ul><h5> Query Pattern Analysis</h5><ul><li>Missing WHERE Clauses - Identifies full collection scans</li><li>Inefficient LIKE Operations - Detects leading wildcard usage</li><li>SELECT * Usage - Finds queries returning entire documents (Live)</li></ul><h5>🚀 Performance Optimization Opportunities</h5><ul><li>Large Payload Streaming - Identifies queries with heavy network usage</li><li>Large Result Set Queries - Flags memory and bandwidth intensive operations</li><li>Timeout-Prone Queries - Detects queries approaching timeout limits</li></ul></div><p><strong>💡 Live Data:</strong> Insights marked with Live analyze your actual parsed data, while Beta insights are experimental and may show false positives.</p></div>",
    COVER_BLOCK_TIMELINE_DESC: "Chronological analysis with zoomable time-series charts. Track query patterns by time grouping (seconds to days), analyze duration buckets, operation types, result counts, and memory usage trends over time with dual Y-axis support.",
    COVER_BLOCK_QUERY_GROUPS_HTML: "<div class=\"section\"><h3>Query Groups</h3><p>Analyze similar queries grouped by normalized patterns. Compare aggregated statistics, identify frequently executed query types, and optimize query families that share similar execution characteristics and performance profiles.</p></div>",
    COVER_BLOCK_EVERY_QUERY_HTML: "<div class=\"section\"><h3>Every Query</h3><p>Detailed tabular view of individual query executions with sorting, filtering, and search capabilities. Drill down into specific query metrics, execution plans, and performance details for granular analysis and debugging.</p></div>",
    COVER_BLOCK_FLOW_HTML: "<div class=\"section\"><h3>Index/Query Flow</h3><p>Interactive visual flow diagram showing the relationship between indexes and queries. See which indexes are used by which queries, identify index usage patterns, and optimize index coverage with drag-and-pan visualization.</p></div>",
    COVER_BLOCK_INDEXES_HTML: "<div class=\"section\"><h3>Indexes</h3><p>Comprehensive index management with filtering by bucket/scope/collection. Analyze index performance metrics, memory residency, scan times, and usage patterns. Includes search and sorting capabilities for large index inventories.</p></div>"
};

// ============================================================
// LOGGER UTILITIES
// ============================================================

// Log level hierarchy (lower number = higher priority)
const LOG_LEVELS = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
    trace: 4
};

// Get current log level from URL parameter
// Supports: ?debug=true (legacy) or ?logLevel=error|warn|info|debug|trace
export function getLogLevel() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Backward compatibility: ?debug=true sets level to 'debug'
    if (urlParams.get('debug') === 'true') {
        return 'debug';
    }
    
    // New parameter: ?logLevel=trace|debug|info|warn|error
    const logLevel = urlParams.get('logLevel');
    if (logLevel && LOG_LEVELS.hasOwnProperty(logLevel)) {
        return logLevel;
    }
    
    // Default: info level (shows error, warn, info)
    return 'info';
}

// Check if a log message should be shown based on current log level
export function shouldLog(messageLevel) {
    const currentLevel = getLogLevel();
    return LOG_LEVELS[messageLevel] <= LOG_LEVELS[currentLevel];
}

// Legacy function for backward compatibility
export function isDebugMode() {
    const level = getLogLevel();
    return level === 'debug' || level === 'trace';
}

// Logging utility with granular levels
// Usage: ?logLevel=error|warn|info|debug|trace (or ?debug=true for backward compatibility)
export const Logger = {
    // [error] - Critical errors (always shown unless logLevel=none)
    error: function(...args) {
        if (shouldLog('error')) {
            console.error('[error]', ...args);
        }
    },
    
    // [warn] - Warnings (shown at warn level and above)
    warn: function(...args) {
        if (shouldLog('warn')) {
            console.warn('[warn]', ...args);
        }
    },
    
    // [info] - Important user-facing information (shown at info level and above - DEFAULT)
    info: function(...args) {
        if (shouldLog('info')) {
            console.log('[info]', ...args);
        }
    },
    
    // [debug] - Detailed technical information (shown at debug level and above)
    debug: function(...args) {
        if (shouldLog('debug')) {
            console.log('[debug]', ...args);
        }
    },
    
    // [trace] - Verbose execution tracking (shown only at trace level)
    trace: function(...args) {
        if (shouldLog('trace')) {
            console.log('[trace]', ...args);
        }
    }
};

// ============================================================
// URL PARAMETER UTILITIES
// ============================================================

// Check if dev mode is enabled (?dev=true)
// Used for experimental features like hierarchical flow diagrams
export function isDevMode() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('dev') === 'true';
}

// Check if redaction mode is enabled (?redact=true|false)
// Default is true (redact sensitive data in logs/debug output)
export function isRedactMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const redactParam = urlParams.get('redact');
    
    // Default to true if not specified
    if (redactParam === null) return true;
    
    // Explicit false disables redaction
    return redactParam !== 'false';
}

// Get URL parameter value
export function getUrlParam(paramName) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(paramName);
}

// ============================================================
// HASH UTILITIES (SHA-256 based redaction)
// ============================================================

// Global redaction utilities using SHA-256 for consistent hashing
export const DebugRedactor = {
    // SHA-256 hash function for redacting sensitive data
    // Respects ?redact=false URL flag to disable redaction
    hash: function(text) {
        if (!text) return 'NULL';
        
        // Check if redaction is disabled via URL flag
        if (!isRedactMode()) {
            return text; // Return original text unredacted
        }
        
        if (typeof sha256 !== 'undefined') {
            // Use js-sha256 library (synchronous)
            return sha256(text).substring(0, 8).toUpperCase();
        } else {
            // Fallback if library not loaded
            console.warn('SHA-256 library not loaded, using fallback');
            return `HASH_${text.length}`;
        }
    },
    
    // Redact bucket.scope.collection
    redactBSC: function(bsc) {
        if (!bsc) return 'NULL.NULL.NULL';
        const parts = bsc.split('.');
        return parts.map(p => this.hash(p)).join('.');
    },
    
    // Redact composite key (indexName::bucket.scope.collection)
    redactCompositeKey: function(key) {
        if (!key) return 'NULL';
        if (!key.includes('::')) return this.hash(key);
        const [indexName, bsc] = key.split('::');
        return `${this.hash(indexName)}::${this.redactBSC(bsc)}`;
    },
    
    // Redact query text (show structure but hide values)
    redactQuery: function(query) {
        if (!query) return 'NULL';
        return this.hash(query);
    },
    
    // Redact object properties
    redactObject: function(obj) {
        if (!obj || typeof obj !== 'object') return obj;
        
        // If redaction is disabled, return original object
        if (!isRedactMode()) {
            return obj;
        }
        
        const redacted = {};
        Object.keys(obj).forEach(key => {
            redacted[this.hash(key)] = '[REDACTED]';
        });
        return redacted;
    }
};

// Shorthand functions for convenience
export function hashName(name) { return DebugRedactor.hash(name); }
export function hashBSC(bsc) { return DebugRedactor.redactBSC(bsc); }
export function hashCompositeKey(key) { return DebugRedactor.redactCompositeKey(key); }
export function hashQuery(query) { return DebugRedactor.redactQuery(query); }

// ============================================================
// INITIALIZATION
// ============================================================

// Log initialization info
Logger.info(TEXT_CONSTANTS.INITIALIZING_ANALYZER);
Logger.info(`📦 Version: 3.28.2 (Updated: 2025-11-06)`);
Logger.info(`🔧 Features: Global system query exclusion, Enhanced accessibility (ARIA), Chart performance optimizations, Time range filtering with buffers, Index/Query Flow analysis, Toast notification system`);

// Log URL flags status
const urlParams = new URLSearchParams(window.location.search);
const flagsStatus = {
    dev: urlParams.get('dev') === 'true',
    debug: urlParams.get('debug') === 'true',
    logLevel: getLogLevel(),
    redact: isRedactMode()
};

Logger.info(`⚙️ URL Flags: dev=${flagsStatus.dev}, debug=${flagsStatus.debug}, logLevel=${flagsStatus.logLevel}, redact=${flagsStatus.redact}`);

// Expose DebugRedactor globally for backward compatibility
window.DebugRedactor = DebugRedactor;

Logger.info(TEXT_CONSTANTS.ANALYZER_INITIALIZED);
Logger.info(TEXT_CONSTANTS.TIP_ABOUT);
