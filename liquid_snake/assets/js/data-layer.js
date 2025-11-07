// ===== TEXT_CONSTANTS =====
// Global text constants - modify these for different languages
        const TEXT_CONSTANTS = {
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
                COPY_REQUEST_ID: "Copy Request ID"
            };
// Extend TEXT_CONSTANTS with Report Maker strings (Phase 1)
if (window.TEXT_CONSTANTS) {
  Object.assign(TEXT_CONSTANTS, {
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

   });
}
      (function(){
        var setBugText = function(){
          var el = document.getElementById('bug-report-link');
          try {
            if (!el) return;
            if (typeof TEXT_CONSTANTS !== 'undefined' && TEXT_CONSTANTS.BUG_REPORT_CTA) {
              el.textContent = TEXT_CONSTANTS.BUG_REPORT_CTA;
            }
          }


// ===== Logger =====
function getLogLevel() {
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
        function shouldLog(messageLevel) {
            const currentLevel = getLogLevel();
            return LOG_LEVELS[messageLevel] <= LOG_LEVELS[currentLevel];
        }

        // Legacy function for backward compatibility
        function isDebugMode() {
            const level = getLogLevel();
            return level === 'debug' || level === 'trace';
        }

        // Logging utility with granular levels
        // Usage: ?logLevel=error|warn|info|debug|trace (or ?debug=true for backward compatibility)
        const Logger = {
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


// ===== Caches =====
const CACHE_LIMITS = {
            parseTime: 10000,           // Time string parsing results
            normalizeStatement: 5000,   // Normalized SQL statements
            timestampRounding: 5000,    // Rounded timestamp calculations
        };

        const operatorsCache = new WeakMap();       // Auto-cleaned by GC
        const parseTimeCache = new Map();
        const normalizeStatementCache = new Map();
        const planStatsCache = new WeakMap();       // Auto-cleaned by GC
        const timeUnitCache = new WeakMap();        // Auto-cleaned by GC
        const timestampRoundingCache = new Map();


function clearCaches() {
            // Destroy all Chart.js instances to prevent memory leaks
            destroyAllCharts();
            
            // Clear data caches
            parseTimeCache.clear();
            normalizeStatementCache.clear();
            timestampRoundingCache.clear(); // Critical for Timeline tab performance
            
            // WeakMaps (operatorsCache, planStatsCache, timeUnitCache) clean themselves automatically
            Logger.debug(TEXT_CONSTANTS.ALL_CACHES_CLEARED);
        }


// ===== Global Data Stores =====
// Global variable to store original unfiltered data
        let originalRequests = [];
        let originalStartDate = null;
        let originalEndDate = null;

        // Store statements for safe access without HTML escaping issues
        let statementStore = {};
        let analysisStatementStore = {};


// ===== Helper: parseTime =====
function parseTime(timeStr) {
            if (!timeStr) {
                return 0;
            }

            // Handle empty or invalid strings
            timeStr = timeStr.trim();
            if (!timeStr) {
                return 0;
            }

            // Check cache first
            if (parseTimeCache.has(timeStr)) {
                return parseTimeCache.get(timeStr);
            }

            // Try different regex patterns for different time formats

            // Pattern 1: Handle ms, ns, µs, us formats like "681.413039ms", "250ns", "146.266µs"
            const simplePattern = /^(\d+\.?\d*)(ms|ns|µs|us)$/;
            let simpleMatch = timeStr.match(simplePattern);

            if (simpleMatch) {
                const value = parseFloat(simpleMatch[1]);
                const unit = simpleMatch[2];

                let totalMs = 0;
                if (unit === "ms") {
                    totalMs = value;
                } else if (unit === "ns") {
                    totalMs = value / 1000000; // nanoseconds to milliseconds
                } else if (unit === "µs" || unit === "us") {
                    totalMs = value / 1000; // microseconds to milliseconds
                }

                return totalMs;
            }

            // Pattern 2: Handle complex formats like "1h4m17.8098098s" or "4m17.8098098s" or "1h"
            const complexPattern = /(?:(\d+)h)?(?:(\d+)m)?(?:(\d+\.?\d*)s)?/;
            const complexMatch = timeStr.match(complexPattern);

            if (
                !complexMatch ||
                (complexMatch[1] === undefined &&
                    complexMatch[2] === undefined &&
                    complexMatch[3] === undefined)
            ) {
                return 0;
            }

            let totalMs = 0;
            const hours = parseInt(complexMatch[1] || 0); // Hours (optional)
            const minutes = parseInt(complexMatch[2] || 0); // Minutes (optional)
            const seconds = parseFloat(complexMatch[3] || 0); // Seconds (optional, including decimals)

            // Convert to milliseconds
            totalMs += hours * 60 * 60 * 1000; // Hours to milliseconds
            totalMs += minutes * 60 * 1000; // Minutes to milliseconds
            totalMs += seconds * 1000; // Seconds to milliseconds

            // Cache the result with size limit (Step 9)
            if (parseTimeCache.size >= CACHE_LIMITS.parseTime) {
                // Clear oldest entries (first 20%) when limit reached
                const keysToDelete = Array.from(parseTimeCache.keys()).slice(0, Math.floor(CACHE_LIMITS.parseTime * 0.2));
                keysToDelete.forEach(key => parseTimeCache.delete(key));
            }
            parseTimeCache.set(timeStr, totalMs);
            return totalMs;
        }


// ===== Helper: normalizeStatement =====
function normalizeStatement(statement) {
            if (!statement) return "";

            // Check cache (Step 9 - unified cache)
            if (normalizeStatementCache.has(statement)) {
                return normalizeStatementCache.get(statement);
            }

            let normalized = statement
                .replace(/"(?:[^"\\]|\\.)*"/g, "?")
                .replace(/'(?:[^'\\]|\\.)*'/g, "?")
                .replace(/\b\d+\.?\d*\b/g, "?");

            // Cache with size limit (Step 9)
            if (normalizeStatementCache.size >= CACHE_LIMITS.normalizeStatement) {
                // Clear oldest 20% when limit reached
                const keysToDelete = Array.from(normalizeStatementCache.keys())
                    .slice(0, Math.floor(CACHE_LIMITS.normalizeStatement * 0.2));
                keysToDelete.forEach(key => normalizeStatementCache.delete(key));
            }
            normalizeStatementCache.set(statement, normalized);

            return normalized;
        }


// ===== Parser: parseIndexJSON =====
function parseIndexJSON() {
            // Prefer uploaded file content (in-memory) over textarea to avoid DOM bloat
            const uploadedIndexRaw = (window._uploadedIndexesJsonRaw && typeof window._uploadedIndexesJsonRaw === 'string') ? window._uploadedIndexesJsonRaw.trim() : "";
            const indexTextAreaVal = (document.getElementById("indexJsonInput")?.value || "").trim();
            const sourceJson = uploadedIndexRaw || indexTextAreaVal;

            if (!sourceJson) {
                indexData = [];
                displayIndexResults();
                return;
            }

            try {
                const parsedData = JSON.parse(sourceJson);
                indexData = Array.isArray(parsedData) ? parsedData : [parsedData];

                // Extract unique buckets, scopes, collections
                updateFilterDropdowns();

                // Apply current filters and display
                applyIndexFilters();
            } catch (error) {
                document.getElementById("indexResults").innerHTML = `
                    <div class="text-align-center" style="color: #dc3545; margin-top: 50px;">
                        <strong>Invalid JSON Format</strong><br>
                        Please check your JSON syntax: ${error.message}
                    </div>
                `;
            }
        }

        // Extract bucket, scope, collection from indexString
        function parseIndexTarget(indexString) {
            const match = indexString.match(/\bON\s+([^\s(;]+)/i);
            if (!match)
                return { bucket: "unknown", scope: "unknown", collection: "unknown" };

            // Clean up the target string - remove backticks, leading dots, trailing semicolons
            let target = match[1]
                .replace(/`/g, "")
                .replace(/^\.+/, "")
                .replace(/;+$/, "");
            const parts = target.split(".").filter((part) => part.length > 0);

            if (parts.length === 1) {
                return {
                    bucket: parts[0],
                    scope: "_default",
                    collection: "_default",
                };
            } else if (parts.length === 2) {
                return { bucket: parts[0], scope: parts[1], collection: "_default" };
            } else if (parts.length >= 3) {
                return { bucket: parts[0], scope: parts[1], collection: parts[2] };
            }

            return {
                bucket: parts[0] || "unknown",
                scope: parts[1] || "unknown",
                collection: parts[2] || "unknown",
            };
        }

        // Update filter dropdowns with available options
        function updateFilterDropdowns() {
            const buckets = new Set();

            indexData.forEach((index) => {
                if (index.indexString) {
                    const target = parseIndexTarget(index.indexString);
                    buckets.add(target.bucket);
                }
            });

            updateDropdown("bucketFilter", Array.from(buckets).sort());

            // Update scopes and collections based on selected filters
            updateCascadingDropdowns();
        }

        // Update scopes and collections based on selected bucket/scope
        function updateCascadingDropdowns() {
            const selectedBucket = document.getElementById("bucketFilter").value;
            const selectedScope = document.getElementById("scopeFilter").value;

            const scopes = new Set();
            const collections = new Set();

            indexData.forEach((index) => {
                if (index.indexString) {
                    const target = parseIndexTarget(index.indexString);

                    // If bucket is selected, only show scopes for that bucket
                    if (
                        selectedBucket === "(ALL)" ||
                        target.bucket === selectedBucket
                    ) {
                        scopes.add(target.scope);

                        // If scope is also selected, only show collections for that bucket.scope
                        if (selectedScope === "(ALL)" || target.scope === selectedScope) {
                            collections.add(target.collection);
                        }
                    }
                }
            });

            updateDropdown("scopeFilter", Array.from(scopes).sort());
            updateDropdown("collectionFilter", Array.from(collections).sort());
        }


// ===== Parser: parseSchemaInference =====
function parseSchemaInference() {
            const inputTextarea = document.getElementById('schemaJsonInput');
            const input = (inputTextarea ? inputTextarea.value.trim() : '') || window._uploadedSchemaJsonRaw || '';
            const treeContainer = document.getElementById('schema-tree-container');
            const detailPanel = document.getElementById('schema-detail-panel');
            
            if (!input) {
                treeContainer.innerHTML = '<p style="color: #dc3545; font-size: 12px;">Please paste INFER query results in the top Schema Inference input box first.</p>';
                return;
            }
            
            try {
                const data = JSON.parse(input);
                
                if (!Array.isArray(data) || data.length === 0) {
                    treeContainer.innerHTML = '<p style="color: #dc3545; font-size: 12px;">Invalid format. Expected an array of INFER query results.</p>';
                    return;
                }
                
                // Build hierarchical tree structure
                const tree = {};
                schemaDataStore = {};
                
                data.forEach((sequence, idx) => {
                    const query = sequence._sequence_query || '';
                    const status = sequence._sequence_query_status || 'unknown';
                    const results = sequence._sequence_result || [];
                    
                    // Parse bucket.scope.collection from query
                    // Example: "INFER `travel-sample`._default._default" or "INFER bucket.scope.collection"
                    const inferMatch = query.match(/INFER\s+`?([^`\s]+)`?\.([^.\s]+)\.([^.\s;]+)/i);
                    if (!inferMatch) {
                        Logger.warn('Could not parse bucket.scope.collection from query:', query);
                        return;
                    }
                    
                    const bucket = inferMatch[1].replace(/`/g, '');
                    const scope = inferMatch[2];
                    const collection = inferMatch[3];
                    
                    // Initialize tree structure
                    if (!tree[bucket]) tree[bucket] = {};
                    if (!tree[bucket][scope]) tree[bucket][scope] = {};
                    if (!tree[bucket][scope][collection]) tree[bucket][scope][collection] = [];
                    
                    // Store schemas for this collection
                    if (results.length > 0 && results[0].length > 0) {
                        results[0].forEach((schema, schemaIdx) => {
                            const schemaId = `${bucket}.${scope}.${collection}.schema${schemaIdx}`;
                            const docCount = schema['#docs'] || 0;
                            const properties = schema.properties || {};
                            
                            tree[bucket][scope][collection].push({
                                id: schemaId,
                                name: `Schema ${schemaIdx + 1}`,
                                docCount: docCount,
                                propCount: Object.keys(properties).length,
                                status: status
                            });
                            
                            // Store full schema data
                            schemaDataStore[schemaId] = {
                                schema: schema,
                                bucket: bucket,
                                scope: scope,
                                collection: collection,
                                query: query,
                                status: status
                            };
                        });
                    }
                });
                
                // Render tree
                renderSchemaTree(tree, treeContainer);
                
                // Auto-select the first bucket
                const firstBucket = Object.keys(tree).sort()[0];
                if (firstBucket) {
                    setTimeout(() => {
                        const bucketId = `bucket-${firstBucket.replace(/[^a-zA-Z0-9]/g, '-')}`;
                        selectBucket(firstBucket, bucketId);
                    }, 100);
                } else {
                    detailPanel.innerHTML = '<p style="color: #6c757d; text-align: center; margin-top: 50px;">Select a schema from the tree to view details</p>';
                }
                
                Logger.info(`Schema tree built: ${Object.keys(tree).length} buckets`);
                
            } catch (error) {
                treeContainer.innerHTML = `<p style="color: #dc3545; font-size: 12px;">Error parsing JSON: ${DOMPurify.sanitize(error.message)}</p>`;
                Logger.error('Schema inference parse error:', error);
            }
        }


// ===== ES6 Module Exports =====
export {
    TEXT_CONSTANTS,
    Logger,
    parseTimeCache,
    normalizeStatementCache,
    operatorsCache,
    planStatsCache,
    timeUnitCache,
    timestampRoundingCache,
    clearCaches,
    originalRequests,
    statementStore,
    analysisStatementStore,
    parseTime,
    normalizeStatement,
    parseJSON,
    parseIndexJSON,
    parseSchemaInference
};

// Event bus for data ready notifications
export const dataBus = new EventTarget();
