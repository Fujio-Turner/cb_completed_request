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
          } catch (e) { /* no-op */ }
        };
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', setBugText);
        } else {
          setBugText();
        }
      })();
        // Disable Chart.js animations globally for better performance
        Chart.defaults.animation = false;
        Chart.defaults.animations = false;
        Chart.defaults.responsive = true;
        Chart.defaults.maintainAspectRatio = false;

        // Register the zoom plugin
        try {
            if (window.ChartZoom) {
                Chart.register(window.ChartZoom);
            } else if (window.chartjsPluginZoom) {
                Chart.register(window.chartjsPluginZoom);
            } else if (window.zoomPlugin) {
                Chart.register(window.zoomPlugin);
            }
        } catch (error) {
            // Silent fallback
        }

        // Global variables for time range tracking
        let originalTimeRange = { min: null, max: null };
        let currentTimeRange = { min: null, max: null };
        let isZoomSyncing = false;

        // Sync zoom across all timeline charts

        // Vertical stake line functions (Issue #148)



        // Toast notification system


        // Enhanced clipboard copy function


        // Keyboard navigation enhancement
        function enhanceKeyboardNavigation() {
            // Add keyboard support for tab elements
            document.addEventListener("keydown", function (e) {
                if (e.key === "Enter" || e.key === " ") {
                    const target = e.target;
                    if (
                        target.matches('a[href^="#"]') ||
                        target.matches(".step-bubble")
                    ) {
                        e.preventDefault();
                        target.click();
                    }
                }
            });
        }

        // Chart optimization utilities



        // ============================================================
        // DEBUG LOGGING UTILITY
        // ============================================================
        // Check if debug mode is enabled via URL parameter ?debug=true
        // Log level hierarchy (lower number = higher priority)
        const LOG_LEVELS = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3,
            trace: 4
        };

        // Get current log level from URL parameter
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

        // Memory cleanup for charts
        // ============================================================
        // DESTROY ALL CHARTS (Step 6 Enhancement)
        // Properly cleanup Chart.js instances and event listeners
        // ============================================================


        // Global system query filtering
        function shouldExcludeSystemQuery(request) {
            const excludeCheckbox = document.getElementById(
                "exclude-system-queries"
            );
            const isChecked = excludeCheckbox ? excludeCheckbox.checked : false;

            // If checkbox doesn't exist or is unchecked, don't exclude anything
            if (!excludeCheckbox || !excludeCheckbox.checked) {
                return false;
            }

            const stmt = request.statement || request.preparedText;
            if (!stmt) {
                return false;
            }

            const upperStmt = stmt.toUpperCase();

            // Apply same filtering logic as Query Groups tab
            // Get derived statement type and normalize underscores to spaces
            const statementType = request.statementType || deriveStatementType(request.statement || request.preparedText) || "";
            const normalizedType = statementType.replace(/_/g, " ").toUpperCase();

            // Define system query patterns (both with and without underscores)
            const systemPatterns = [
                "INFER", "ADVISE", "CREATE", "ALTER", "DROP", "BUILD", "EXPLAIN"
            ];

            const shouldExclude =
                upperStmt.startsWith("INFER ") ||
                upperStmt.startsWith("ADVISE ") ||
                upperStmt.startsWith("CREATE ") ||
                upperStmt.startsWith("ALTER ") ||
                upperStmt.startsWith("DROP ") ||
                upperStmt.startsWith("BUILD ") ||
                upperStmt.startsWith("EXPLAIN ") ||
                upperStmt.includes(" SYSTEM:") ||
                // Check normalized statement type for any system operation with underscores
                systemPatterns.some(pattern => normalizedType.startsWith(pattern + " "));

            return shouldExclude;
        }

        // Filter requests based on system query exclusion setting and SQL statement filter
        function filterSystemQueries(requests) {
            const excludeCheckbox = document.getElementById(
                "exclude-system-queries"
            );
            const isExcluding = excludeCheckbox && excludeCheckbox.checked;

            // Get SQL statement filter
            const sqlFilter = document.getElementById("sql-statement-filter");
            const sqlFilterText = sqlFilter ? sqlFilter.value.trim().toLowerCase() : "";

            // Get elapsed time filter predicate (if any)
            const elapsedFilterInput = document.getElementById("elapsed-time-filter");
            const elapsedFilterText = elapsedFilterInput ? elapsedFilterInput.value.trim() : "";
            const elapsedPredicate = makeElapsedFilterPredicate(elapsedFilterText);

            const filtered = requests.filter((request) => {
                // Apply system query exclusion first
                if (isExcluding && shouldExcludeSystemQuery(request)) {
                    return false;
                }

                // Apply SQL statement filtering only if filter text is not empty
                if (sqlFilterText && sqlFilterText.length > 0) {
                    const statement = (request.statement || request.preparedText || "").toLowerCase().replace(/\s+/g, ' ').trim();
                    const filterText = sqlFilterText.replace(/\s+/g, ' ').trim();
                    if (!statement.includes(filterText)) {
                        return false;
                    }
                }

                // Apply elapsedTime filter if provided
                if (elapsedPredicate) {
                    const ms = parseTime(request.elapsedTime || "");
                    if (!elapsedPredicate(ms)) {
                        return false;
                    }
                }

                return true;
            });


            return filtered;
        }

        // Parse time strings to milliseconds (with caching)
        // HTML escape utility function
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // Strip presentational tags that sometimes appear around preparedText
        function stripEmTags(text) {
            if (text == null) return "";
            return String(text)
                .replace(/<\/?em>/gi, "")
                .replace(/<\/?ud>/gi, "");
        }

        // Detect if this request executed a prepared statement
        function isPreparedExecution(request) {
            if (!request) return false;
            const hasPrepared = typeof request.preparedText === 'string' && request.preparedText.trim().length > 0;
            const type = (request.statementType || '').toUpperCase();
            const stmt = (request.statement || '').toUpperCase().trim();
            const hasExecute = type === 'EXECUTE' || stmt.startsWith('EXECUTE ');
            return hasPrepared && hasExecute;
        }

        // Get a cleaned prepared text sample when applicable
        function getPreparedSample(request) {
            if (!isPreparedExecution(request)) return "";
            const txt = stripEmTags(request.preparedText || "");
            return txt.trim();
        }

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

        // Format time in standardized mm:ss.sss format
        // ============================================================
        // FORMATTERS MODULE (Optimization Step 2b)
        // Consolidated formatting helper functions
        // ============================================================
        const Formatters = {
            // Format milliseconds to MM:SS.mmm
            formatTime(milliseconds) {
                if (!milliseconds || isNaN(milliseconds) || milliseconds <= 0) {
                    return "00:00.000";
                }

                // Handle very small values (less than 1ms) by rounding to nearest millisecond
                // but ensuring they show as at least 0.001 if they're greater than 0
                if (milliseconds < 1) {
                    milliseconds = Math.max(0.001, Math.round(milliseconds * 1000) / 1000);
                }

                const totalSeconds = Math.floor(milliseconds / 1000);
                const remainingMs = milliseconds % 1000;
                const minutes = Math.floor(totalSeconds / 60);
                const seconds = totalSeconds % 60;

                // Format with leading zeros
                const formattedMinutes = minutes.toString().padStart(2, "0");
                const formattedSeconds = seconds.toString().padStart(2, "0");

                // Format milliseconds as 3-digit integer (rounded)
                const formattedMs = Math.round(remainingMs).toString().padStart(3, "0");

                return `${formattedMinutes}:${formattedSeconds}.${formattedMs}`;
            },

            // Format original time value for tooltip display
            formatTimeTooltip(timeStr, milliseconds) {
                if (!timeStr || timeStr === "N/A") {
                    return "";
                }

                // If it's a very small value, show the original string for precision
                if (milliseconds < 1) {
                    return `Original: ${timeStr}`;
                }

                // For larger values, show both formatted time and original
                const formatted = this.formatTime(milliseconds);
                if (timeStr !== formatted) {
                    return `Original: ${timeStr}`;
                }

                return "";
            }
        };

        // Backward compatibility - keep original function names as aliases
        const formatTime = (milliseconds) => Formatters.formatTime(milliseconds);
        const formatTimeTooltip = (timeStr, milliseconds) => Formatters.formatTimeTooltip(timeStr, milliseconds);



        // Normalize statement by replacing literals and numbers with "?" (with improved caching)
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

        // Check if a query statement has filtering mechanism (WHERE clause or USE KEYS)
        function hasFilteringMechanism(statement) {
            if (!statement) return false;
            const upperStatement = statement.toUpperCase();
            // Check for WHERE clause or USE KEYS using word boundaries for precise matching
            return /\bWHERE\b/.test(upperStatement) || /\bUSE\s+KEYS\b/.test(upperStatement);
        }

        // Get color class based on percentage
        function getColorClass(percentage) {
            if (percentage === "N/A" || isNaN(percentage)) return "green";
            if (percentage < 25) return "green";
            if (percentage < 50) return "yellow";
            if (percentage < 75) return "orange";
            return "red";
        }

        // Get percentage-based background color for bubble
        function getPercentageColor(percentage) {
            if (percentage === "N/A" || isNaN(percentage)) {
                return { bg: "#d4edda", border: "#28a745" }; // Light green
            }

            const percent = parseFloat(percentage);

            if (percent <= 33) {
                // 0-33%: Light to darker green
                const intensity = Math.min(percent / 33, 1);
                // Start with very light green and go to medium green
                const red = Math.floor(212 - (84 * intensity)); // 212 to 128
                const green = Math.floor(237 - (18 * intensity)); // 237 to 219  
                const blue = Math.floor(218 - (90 * intensity)); // 218 to 128
                return {
                    bg: `rgb(${red}, ${green}, ${blue})`,
                    border: "#28a745"
                };
            } else if (percent <= 90) {
                // 33-90%: Light orange to hard orange
                const intensity = (percent - 33) / 57; // 0 to 1
                const red = Math.floor(255);
                const green = Math.floor(193 - (67 * intensity)); // 193 to 126
                const blue = Math.floor(7 + (93 * intensity)); // 7 to 100, then back to 7
                return {
                    bg: `rgb(${red}, ${green}, 7)`,
                    border: "#fd7e14"
                };
            } else {
                // 90-100%: Light red to darker red (less bright for readability)
                const intensity = (percent - 90) / 10; // 0 to 1
                const red = Math.floor(220 - (20 * intensity)); // 220 to 200 (less bright)
                const green = Math.floor(180 - (120 * intensity)); // 180 to 60
                const blue = Math.floor(180 - (120 * intensity)); // 180 to 60
                return {
                    bg: `rgb(${red}, ${green}, ${blue})`,
                    border: "#dc3545"
                };
            }
        }

        // Caches for performance optimization to avoid reprocessing
        // ============================================================
        // CACHING STRATEGY (Step 9)
        // All caches with size limits to prevent unbounded growth
        // ============================================================
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

        // Clear caches to prevent memory leaks and stale data between parses
        // ============================================================
        // MEMORY LEAK PREVENTION (Step 6)
        // Clear all caches and destroy charts on new parse
        // ============================================================
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

        // Performance benchmarking helper (Step 9 enhancement)
        function logCacheStats() {
            const parsePercent = ((parseTimeCache.size / CACHE_LIMITS.parseTime) * 100).toFixed(1);
            const normalizePercent = ((normalizeStatementCache.size / CACHE_LIMITS.normalizeStatement) * 100).toFixed(1);
            const timestampPercent = ((timestampRoundingCache.size / CACHE_LIMITS.timestampRounding) * 100).toFixed(1);
            
            Logger.debug(`Cache stats - parseTime: ${parseTimeCache.size}/${CACHE_LIMITS.parseTime} (${parsePercent}%), normalizeStatement: ${normalizeStatementCache.size}/${CACHE_LIMITS.normalizeStatement} (${normalizePercent}%), timestampRounding: ${timestampRoundingCache.size}/${CACHE_LIMITS.timestampRounding} (${timestampPercent}%)`);
        }

        // Recursively extract operators from the plan
        function getOperators(
            operator,
            operators = [],
            visited = new WeakSet(),
            depth = 0
        ) {
            if (!operator) return operators;

            // Check cache first for the root operator
            if (depth === 0 && operatorsCache.has(operator)) {
                return operatorsCache.get(operator);
            }

            // Prevent infinite recursion by tracking visited objects
            if (visited.has(operator)) {
                return operators;
            }
            visited.add(operator);

            // Add depth limit as additional safety
            if (depth > 50) {
                return operators;
            }

            if (operator["#operator"]) {
                operators.push(operator);
            }
            if (operator["~child"]) {
                getOperators(operator["~child"], operators, visited, depth + 1);
            } else if (operator["~children"]) {
                operator["~children"].forEach((child, i) => {
                    getOperators(child, operators, visited, depth + 1);
                });
            }
            // Check for input/inputs
            if (operator.input) {
                getOperators(operator.input, operators, visited, depth + 1);
            }
            if (operator.inputs && Array.isArray(operator.inputs)) {
                operator.inputs.forEach((input, i) => {
                    getOperators(input, operators, visited, depth + 1);
                });
            }
            // Check for left/right (binary operations)
            if (operator.left) {
                getOperators(operator.left, operators, visited, depth + 1);
            }
            if (operator.right) {
                getOperators(operator.right, operators, visited, depth + 1);
            }
            // Check for first and second properties (used in set operations like ExceptAll)
            if (operator.first) {
                getOperators(operator.first, operators, visited, depth + 1);
            }
            if (operator.second) {
                getOperators(operator.second, operators, visited, depth + 1);
            }
            // Check for scans array (used in UnionScan, IntersectScan, etc.)
            if (operator.scans && Array.isArray(operator.scans)) {
                operator.scans.forEach((scan, i) => {
                    getOperators(scan, operators, visited, depth + 1);
                });
            }
            // Check for scan property (used in DistinctScan)
            if (operator.scan) {
                getOperators(operator.scan, operators, visited, depth + 1);
            }
            // Check for subqueries array
            if (operator["~subqueries"] && Array.isArray(operator["~subqueries"])) {
                operator["~subqueries"].forEach((subquery, i) => {
                    if (subquery.executionTimings) {
                        getOperators(
                            subquery.executionTimings,
                            operators,
                            visited,
                            depth + 1
                        );
                    }
                });
            }

            // Cache the result for root operator
            if (depth === 0) {
                operatorsCache.set(operator, operators);
            }

            return operators;
        }

        // Calculate the maximum of all kernTimes (optimized with cache)
        function calculateTotalKernTime(plan) {
            // Try to get from cache first
            if (planStatsCache.has(plan)) {
                return planStatsCache.get(plan).maxKernTime;
            }

            // Fallback to original calculation if not cached
            const operators = getOperators(plan);
            let maxKernTime = 0;
            operators.forEach((operator, index) => {
                const stats = operator["#stats"] || {};
                const kernTime = parseTime(stats.kernTime);
                if (!isNaN(kernTime)) {
                    maxKernTime = Math.max(maxKernTime, kernTime);
                }
            });
            return maxKernTime;
        }



        // Calculate the total memory usage from all operators in the plan (optimized with cache)
        function calculateTotalMemoryUsage(plan) {
            // Try to get from cache first
            if (planStatsCache.has(plan)) {
                return planStatsCache.get(plan).totalMemoryUsage;
            }

            // Fallback to original calculation
            const operators = getOperators(plan);
            let totalMemory = 0;

            operators.forEach((operator, index) => {
                const stats = operator["#stats"] || {};
                const usedMemory = stats.usedMemory || 0;
                if (!isNaN(usedMemory)) {
                    totalMemory += usedMemory;
                }
            });
            return totalMemory;
        }

        // Calculate the sum of all execution times for percentage calculation (optimized with cache)
        function calculateTotalExecTime(plan) {
            // Try to get from cache first
            if (planStatsCache.has(plan)) {
                return planStatsCache.get(plan).totalExecTime;
            }

            // Fallback to original calculation if not cached
            const operators = getOperators(plan);
            let totalExecTime = 0;
            operators.forEach((operator, index) => {
                const stats = operator["#stats"] || {};
                const execTime = parseTime(stats.execTime);
                if (!isNaN(execTime)) {
                    totalExecTime += execTime;
                }
            });
            return totalExecTime;
        }

        // Calculate the sum of all service times from all operators in the plan (optimized with cache)
        function calculateTotalServiceTime(plan) {
            // Try to get from cache first
            if (planStatsCache.has(plan)) {
                return planStatsCache.get(plan).totalServiceTime;
            }

            // Fallback to original calculation if not cached
            const operators = getOperators(plan);
            let totalServiceTime = 0;
            operators.forEach((operator, index) => {
                const stats = operator["#stats"] || {};
                const servTime = parseTime(stats.servTime);
                if (!isNaN(servTime)) {
                    totalServiceTime += servTime;
                }
            });
            return totalServiceTime;
        }

        // Build operator stats for modal
        function buildOperatorStats(operator) {
            const operatorType = operator["#operator"] || TEXT_CONSTANTS.UNKNOWN;
            let html = `<h3>${TEXT_CONSTANTS.OPERATOR_LABEL} ${operatorType}</h3>`;

            // Add copy button
            html += `<button class="btn-standard" onclick="copyOperatorStats(this)">${TEXT_CONSTANTS.COPY_STATS}</button>`;

            // Show index name for specific operators
            if (
                (operatorType === "PrimaryScan3" ||
                    operatorType === "IndexFtsSearch" ||
                    operatorType === "IndexScan3") &&
                operator.index
            ) {
                html += `<p><strong>${TEXT_CONSTANTS.INDEX_USED} ${operator.index}</strong></p>`;
            }

            if (operator["#stats"]) {
                html += "<dl>";
                for (const [key, value] of Object.entries(operator["#stats"])) {
                    let formattedValue = value;
                    // Format time fields with tooltips
                    if (
                        key === "execTime" ||
                        key === "kernTime" ||
                        key === "servTime"
                    ) {
                        const timeMs = parseTime(value);
                        if (timeMs > 0) {
                            const tooltip = formatTimeTooltip(value, timeMs);
                            formattedValue = tooltip ?
                                `<span title="${tooltip}">${formatTime(timeMs)}</span>` :
                                formatTime(timeMs);
                        }
                    }
                    // Format number fields with commas
                    else if (typeof value === 'number' && value >= 1000) {
                        formattedValue = value.toLocaleString('en-US');
                    }
                    html += `<dt>${key}</dt><dd>${formattedValue}</dd>`;
                }
                html += "</dl>";
            } else {
                html += "<p>No stats available.</p>";
            }
            return html;
        }

        // Function to copy operator stats to clipboard
        // ============================================================
        // CLIPBOARD UTILITIES MODULE (Optimization Step 2c)
        // Consolidated clipboard copy functions with visual feedback
        // ============================================================
        const ClipboardUtils = {
            // Copy text to clipboard with button feedback
            copyToClipboard(text, button, options = {}) {
                const {
                    successText = TEXT_CONSTANTS.COPIED || "Copied!",
                    originalText = button.textContent,
                    successColor = "#4CAF50",
                    duration = 1000,
                    useToast = false
                } = options;

                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard
                        .writeText(text)
                        .then(() => {
                            this._showButtonFeedback(button, successText, originalText, successColor, duration);
                            if (useToast) showToast(TEXT_CONSTANTS.COPIED_CLIPBOARD);
                        })
                        .catch((err) => {
                            Logger.error("Failed to copy:", err);
                            this._fallbackCopy(text, button);
                        });
                } else {
                    this._fallbackCopy(text, button);
                }
            },

            // Show visual feedback on button
            _showButtonFeedback(button, successText, originalText, successColor, duration) {
                const originalBg = button.style.backgroundColor;
                button.textContent = successText;
                button.style.backgroundColor = successColor;
                setTimeout(() => {
                    button.textContent = originalText;
                    button.style.backgroundColor = originalBg;
                }, duration);
            },

            // Fallback copy for older browsers
            _fallbackCopy(text, button) {
                const textArea = document.createElement("textarea");
                textArea.value = text;
                textArea.style.position = "fixed";
                textArea.style.top = "-1000px";
                textArea.style.left = "-1000px";
                textArea.setAttribute("aria-hidden", "true");
                textArea.setAttribute("tabindex", "-1");

                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();

                try {
                    const successful = document.execCommand("copy");
                    if (successful) {
                        showToast(TEXT_CONSTANTS.COPIED_CLIPBOARD);
                    } else {
                        showToast(TEXT_CONSTANTS.FAILED_COPY_CLIPBOARD, "error");
                    }
                } catch (err) {
                    Logger.error("Fallback: Unable to copy", err);
                    showToast("Failed to copy to clipboard", "error");
                }

                document.body.removeChild(textArea);
            }
        };

        // Backward compatibility wrappers
        function copyOperatorStats(button) {
            const modalBody = document.getElementById("operator-modal-body");
            const text = modalBody.innerText || modalBody.textContent;
            ClipboardUtils.copyToClipboard(text, button, {
                successText: TEXT_CONSTANTS.COPIED,
                originalText: TEXT_CONSTANTS.COPY_STATS,
                duration: 2000
            });
        }

        function fallbackCopyTextToClipboard(text, button) {
            ClipboardUtils._fallbackCopy(text, button);
        }

        // Copy whole record JSON from the pre element
        function copyWholeRecordJson() {
            const preElement = document.getElementById('whole-record-json');
            const button = event.target; // Get the button that was clicked
            
            if (!preElement) {
                Logger.error('whole-record-json element not found');
                showToast("Failed to copy: JSON element not found", "error");
                return;
            }
            
            const jsonContent = preElement.textContent.trim();
            
            if (!jsonContent) {
                showToast("No JSON record loaded. Please load a request ID first.", "warning");
                return;
            }
            
            ClipboardUtils.copyToClipboard(jsonContent, button, {
                successText: "✅ Copied!",
                originalText: "📋 Copy JSON",
                successColor: "#4CAF50",
                duration: 2000,
                useToast: true
            });
        }

        // Generate flow diagram
        // =============================================================================
        // PlanNode Class - Couchbase-inspired execution plan tree structure
        // =============================================================================
        class PlanNode {
            constructor(op, predecessor = null, totalQueryTime = 0) {
                this.operator = op;               // Raw operator JSON
                this.predecessor = predecessor;   // Previous node in execution sequence
                this.subsequence = null;          // Next node in execution sequence
                this.children = [];               // Child nodes (for joins, unions, etc.)
                this.id = 'pn_' + Math.random().toString(36).slice(2);
                this.depthLen = 1;                // Depth of tree from this node
                this.branchHeight = 1;            // Height needed for branching
                this.totalQueryTime = totalQueryTime; // Total query elapsed time for % calculations
            }

            // Get operator type (normalized across different plan formats)
            type() {
                return this.operator?.['#operator'] || this.operator?.operator || 'Unknown';
            }

            // Get display name for operator
            getName() {
                const t = this.type();
                const nameMap = {
                    'PrimaryScan': 'Primary Scan',
                    'PrimaryScan3': 'Primary Scan',
                    'IndexScan': 'Index Scan',
                    'IndexScan2': 'Index Scan',
                    'IndexScan3': 'Index Scan',
                    'Fetch': 'Doc Fetch',
                    'Filter': 'Filter',
                    'InitialProject': 'Project',
                    'FinalProject': 'Project',
                    'Order': 'Order',
                    'Stream': 'Stream',
                    'Authorize': 'Authorize',
                    'Parallel': 'Parallel',
                    'NLJoin': 'Nested Loop Join',
                    'HashJoin': 'Hash Join',
                    'Join': 'Join',
                    'IndexJoin': 'Index Join',
                    'Nest': 'Nest',
                    'Unnest': 'Unnest',
                    'UnionAll': 'Union All',
                    'Union': 'Union',
                    'IntersectScan': 'Intersect Scan',
                    'ExceptAll': 'Except All',
                    'Distinct': 'Distinct',
                    'DistinctScan': 'Distinct Scan',
                    'Group': 'Group',
                    'InitialGroup': 'Group',
                    'IntermediateGroup': 'Group',
                    'FinalGroup': 'Group',
                    'Limit': 'Limit',
                    'Offset': 'Offset',
                    'Insert': 'Insert',
                    'Update': 'Update',
                    'Delete': 'Delete',
                    'Merge': 'Merge'
                };
                return nameMap[t] || t;
            }

            // ✅ PRESERVE: Extract timing information (execTime, servTime)
            getTimeInfo() {
                const op = this.operator;
                const stats = op['#stats'] || {};
                
                const execTime = stats.execTime || op['#time'] || '0s';
                const servTime = stats.servTime || '0s';
                const execMs = parseTime(execTime);
                const servMs = parseTime(servTime);
                
                // Use servTime if available (actual bottleneck), fallback to execTime
                const timeForPercentage = (!isNaN(servMs) && servMs > 0) ? servMs : execMs;
                const percentage = (this.totalQueryTime > 0 && !isNaN(timeForPercentage) && timeForPercentage > 0)
                    ? ((timeForPercentage / this.totalQueryTime) * 100).toFixed(2)
                    : 'N/A';
                
                return {
                    execTimeMs: execMs,
                    servTimeMs: servMs,
                    execTimeFormatted: formatTime(execMs),
                    servTimeFormatted: formatTime(servMs),
                    execTimeTooltip: formatTimeTooltip(execTime, execMs),
                    servTimeTooltip: formatTimeTooltip(servTime, servMs),
                    percentage: percentage,
                    hasServTime: servTime !== 'N/A' && !isNaN(servMs) && servMs > 0
                };
            }

            // ✅ PRESERVE: Extract items in/out (with comma formatting)
            getItemsInOut() {
                const stats = this.operator['#stats'] || {};
                const itemsIn = stats['#itemsIn'] !== undefined ? stats['#itemsIn'] : '-';
                const itemsOut = stats['#itemsOut'] !== undefined ? stats['#itemsOut'] : '-';
                
                // Format numbers with commas
                const formatNumber = (num) => {
                    if (num === '-' || num === undefined || num === null) return '-';
                    return num.toLocaleString('en-US');
                };
                
                return {
                    itemsIn: itemsIn,
                    itemsOut: itemsOut,
                    formatted: (itemsIn !== '-' && itemsOut !== '-') 
                        ? `${formatNumber(itemsIn)} in / ${formatNumber(itemsOut)} out` 
                        : null
                };
            }

            // ✅ PRESERVE: Color coding based on percentage
            getColor() {
                const timeInfo = this.getTimeInfo();
                const pct = parseFloat(timeInfo.percentage);
                
                if (isNaN(pct)) return { bg: '#E8F5E9', border: '#4CAF50' }; // Default green
                
                // Use existing getPercentageColor function
                return getPercentageColor(pct);
            }
        }

        // =============================================================================
        // Normalized Field Getters - Handle variations across plan versions
        // =============================================================================
        function getOpType(op) {
            return op?.['#operator'] || op?.operator || 'Unknown';
        }

        function getChildren(op) {
            return op?.['~children'] || op?.children || [];
        }

        function getChild(op) {
            return op?.['~child'] || op?.child;
        }

        function getOuter(op) {
            return op?.['~outer'] || op?.outer || op?.left;
        }

        function getInner(op) {
            return op?.['~inner'] || op?.inner || op?.right;
        }

        function getScans(op) {
            return op?.scans || [];
        }

        function getFirst(op) {
            return op?.first;
        }

        function getSecond(op) {
            return op?.second;
        }

        function getScan(op) {
            return op?.scan;
        }

        // =============================================================================
        // convertN1QLPlanToPlanNodes - Main conversion function following Couchbase logic
        // =============================================================================
        function convertN1QLPlanToPlanNodes(planRoot, predecessor = null, totalQueryTime = 0) {
            if (!planRoot) return null;

            // Handle prepared queries or wrapped plans
            if (planRoot.operator && !planRoot['#operator']) {
                return convertN1QLPlanToPlanNodes(planRoot.operator, predecessor, totalQueryTime);
            }
            if (planRoot.plan && !planRoot['#operator']) {
                return convertN1QLPlanToPlanNodes(planRoot.plan, predecessor, totalQueryTime);
            }

            const opType = getOpType(planRoot);
            
            // ✅ SEQUENCE: Flatten into linear chain (Couchbase pattern)
            if (opType === 'Sequence') {
                const children = getChildren(planRoot);
                let head = null;
                let prev = predecessor;
                
                for (const child of children) {
                    const node = convertN1QLPlanToPlanNodes(child, prev, totalQueryTime);
                    if (!head) head = node;
                    prev = tail(node);
                }
                
                return head;
            }

            // ✅ PARALLEL: Keep node with subsequence
            if (opType === 'Parallel') {
                const node = new PlanNode(planRoot, predecessor, totalQueryTime);
                const child = getChild(planRoot);
                if (child) {
                    node.subsequence = convertN1QLPlanToPlanNodes(child, node, totalQueryTime);
                }
                return node;
            }

            // ✅ UNION/INTERSECT/EXCEPT: Multiple children
            if (opType === 'UnionAll' || opType === 'Union' || opType === 'IntersectScan' || opType === 'ExceptAll') {
                const node = new PlanNode(planRoot, predecessor, totalQueryTime);
                const children = getChildren(planRoot) || getScans(planRoot);
                node.children = children.map(c => convertN1QLPlanToPlanNodes(c, null, totalQueryTime)).filter(Boolean);
                return node;
            }

            // ✅ JOINS: Outer + Inner children
            if (opType === 'NLJoin' || opType === 'HashJoin' || opType === 'Join' || 
                opType === 'IndexJoin' || opType === 'LookupJoin' || 
                opType === 'Nest' || opType === 'Unnest' || opType === 'HashNest' || opType === 'NestedLoopNest') {
                const node = new PlanNode(planRoot, predecessor, totalQueryTime);
                const outer = getOuter(planRoot);
                const inner = getInner(planRoot) || getChild(planRoot);
                
                if (outer) {
                    node.children.push(convertN1QLPlanToPlanNodes(outer, null, totalQueryTime));
                }
                if (inner) {
                    node.children.push(convertN1QLPlanToPlanNodes(inner, null, totalQueryTime));
                }
                
                node.children = node.children.filter(Boolean);
                return node;
            }

            // ✅ EXCEPT/INTERSECT with first/second
            if (opType === 'ExceptAll' || opType === 'IntersectAll') {
                const node = new PlanNode(planRoot, predecessor, totalQueryTime);
                const first = getFirst(planRoot);
                const second = getSecond(planRoot);
                
                if (first) {
                    node.children.push(convertN1QLPlanToPlanNodes(first, null, totalQueryTime));
                }
                if (second) {
                    node.children.push(convertN1QLPlanToPlanNodes(second, null, totalQueryTime));
                }
                
                node.children = node.children.filter(Boolean);
                return node;
            }

            // ✅ AUTHORIZE: Child comes after (Couchbase pattern)
            if (opType === 'Authorize') {
                const node = new PlanNode(planRoot, predecessor, totalQueryTime);
                const child = getChild(planRoot);
                if (child) {
                    node.subsequence = convertN1QLPlanToPlanNodes(child, node, totalQueryTime);
                }
                return node;
            }

            // ✅ DISTINCT SCAN: Single child
            if (opType === 'DistinctScan') {
                const scan = getScan(planRoot);
                if (scan) {
                    return convertN1QLPlanToPlanNodes(scan, predecessor, totalQueryTime);
                }
            }

            // ✅ MERGE: Has multiple operation children
            if (opType === 'Merge') {
                const node = new PlanNode(planRoot, predecessor, totalQueryTime);
                
                if (predecessor) node.children.push(predecessor);
                
                const insertOp = planRoot.insert;
                const deleteOp = planRoot.delete;
                const updateOp = planRoot.update;
                
                if (insertOp) node.children.push(convertN1QLPlanToPlanNodes(insertOp, null, totalQueryTime));
                if (deleteOp) node.children.push(convertN1QLPlanToPlanNodes(deleteOp, null, totalQueryTime));
                if (updateOp) node.children.push(convertN1QLPlanToPlanNodes(updateOp, null, totalQueryTime));
                
                node.children = node.children.filter(Boolean);
                return node;
            }

            // ✅ DEFAULT: Linear node (most operators)
            const node = new PlanNode(planRoot, predecessor, totalQueryTime);
            const child = getChild(planRoot);
            if (child) {
                node.subsequence = convertN1QLPlanToPlanNodes(child, node, totalQueryTime);
            }
            
            return node;
        }

        // Helper: Get tail of subsequence chain
        function tail(node) {
            if (!node) return null;
            let current = node;
            while (current.subsequence) {
                current = current.subsequence;
            }
            return current;
        }

        // =============================================================================
        // Enhanced Flow Diagram Renderer - Preserves all existing UI features
        // =============================================================================
        
        // Global panzoom instance for diagram controls
        let flowDiagramPanzoomInstance = null;
        
        // Feature flag: Check if ?dev=true in URL for new hierarchical flow diagram
        function isDevMode() {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get('dev') === 'true';
        }
        
        // ========== NEW HIERARCHICAL VERSION (dev mode only) ==========
        // Helper function to create a bubble element for an operator
        function createOperatorBubble(node, totalElapsedTimeMs, isNested = false) {
            const timeInfo = node.getTimeInfo();
            const itemsInfo = node.getItemsInOut();
            const colors = node.getColor();
            
            const bubble = document.createElement('div');
            bubble.className = 'step-bubble';
            if (isNested) bubble.classList.add('nested-operator');
            bubble.style.backgroundColor = colors.bg;
            bubble.style.borderColor = colors.border;
            bubble.style.borderWidth = '2px';
            
            let bubbleContent = `
                <h4>${node.getName()}</h4>
                <p><span title="${timeInfo.execTimeTooltip}">${timeInfo.execTimeFormatted}</span> (${timeInfo.percentage}%)</p>`;
            
            if (timeInfo.hasServTime) {
                bubbleContent += `<p><span title="${timeInfo.servTimeTooltip}">${timeInfo.servTimeFormatted}</span> servTime</p>`;
            }
            
            if (itemsInfo.formatted) {
                bubbleContent += `<p>${itemsInfo.formatted}</p>`;
            }
            
            bubble.innerHTML = bubbleContent;
            bubble.addEventListener('click', () => {
                const statsHtml = buildOperatorStats(node.operator);
                document.getElementById('operator-modal-body').innerHTML = statsHtml;
                document.getElementById('operator-modal').style.display = 'block';
            });
            
            return bubble;
        }

        // Helper function to render operator tree hierarchically
        function renderOperatorTree(operator, container, totalElapsedTimeMs, visited = new WeakSet(), skipSequence = true) {
            if (!operator || visited.has(operator)) return;
            visited.add(operator);

            const opType = operator['#operator'];
            
            // Skip Sequence operators by default
            if (skipSequence && opType === 'Sequence') {
                if (operator['~children']) {
                    operator['~children'].forEach(child => {
                        renderOperatorTree(child, container, totalElapsedTimeMs, visited, skipSequence);
                    });
                } else if (operator['~child']) {
                    renderOperatorTree(operator['~child'], container, totalElapsedTimeMs, visited, skipSequence);
                }
                return;
            }

            const node = new PlanNode(operator, null, totalElapsedTimeMs);
            
            // Special handling for operators with child operators that should be visualized nested
            if (opType === 'NestedLoopJoin' || opType === 'HashJoin' || opType === 'HashNest') {
                const joinContainer = document.createElement('div');
                joinContainer.className = 'join-container';
                joinContainer.style.cssText = 'display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 15px; border: 2px dashed #666; border-radius: 8px; background: rgba(255,255,255,0.05);';
                
                // Add join operator bubble
                const joinBubble = createOperatorBubble(node, totalElapsedTimeMs);
                joinContainer.appendChild(joinBubble);
                
                // Add label
                const label = document.createElement('div');
                label.textContent = '↓ Joins with ↓';
                label.style.cssText = 'font-size: 12px; color: #999;';
                joinContainer.appendChild(label);
                
                // Render child operator (e.g., ExpressionScan)
                if (operator['~child']) {
                    const childContainer = document.createElement('div');
                    childContainer.style.cssText = 'display: flex; flex-direction: row; align-items: center; gap: 10px;';
                    renderOperatorTree(operator['~child'], childContainer, totalElapsedTimeMs, visited, skipSequence);
                    joinContainer.appendChild(childContainer);
                }
                
                container.appendChild(joinContainer);
            } else if (opType === 'With') {
                // WITH operator - show info and continue with child (main query)
                const withBubble = createOperatorBubble(node, totalElapsedTimeMs);
                container.appendChild(withBubble);
                
                // Add connector
                const connector = document.createElement('div');
                connector.className = 'connector';
                container.appendChild(connector);
                
                // Continue with the main query portion
                if (operator['~child']) {
                    renderOperatorTree(operator['~child'], container, totalElapsedTimeMs, visited, skipSequence);
                }
            } else {
                // Regular operator
                const bubble = createOperatorBubble(node, totalElapsedTimeMs);
                container.appendChild(bubble);
                
                // Add connector if we'll have more children
                const hasChildren = operator['~child'] || (operator['~children'] && operator['~children'].length > 0);
                if (hasChildren) {
                    const connector = document.createElement('div');
                    connector.className = 'connector';
                    container.appendChild(connector);
                }
                
                // Render children
                if (operator['~children']) {
                    operator['~children'].forEach(child => {
                        renderOperatorTree(child, container, totalElapsedTimeMs, visited, skipSequence);
                    });
                } else if (operator['~child']) {
                    renderOperatorTree(operator['~child'], container, totalElapsedTimeMs, visited, skipSequence);
                }
            }
        }

        function generateFlowDiagram_New(request) {
            const flowDiagram = document.getElementById("flow-diagram");
            flowDiagram.innerHTML = "";
            
            const existingControls = document.getElementById('flow-diagram-controls');
            if (existingControls) {
                existingControls.remove();
            }
            
            if (!request || !request.plan) {
                flowDiagram.textContent = TEXT_CONSTANTS.NO_EXECUTION_PLAN;
                return;
            }

            const totalElapsedTimeMs = request.elapsedTimeMs || parseTime(request.elapsedTime) || 0;
            
            const controlsDiv = document.createElement('div');
            controlsDiv.id = 'flow-diagram-controls';
            controlsDiv.style.cssText = 'margin-bottom: 10px; display: flex; gap: 8px; align-items: center; justify-content: flex-end; position: relative; z-index: 10;';
            controlsDiv.innerHTML = `
                <button id="flow-zoom-in" class="btn-standard" style="padding: 6px 12px;" title="Zoom In">🔍+</button>
                <button id="flow-zoom-out" class="btn-standard" style="padding: 6px 12px;" title="Zoom Out">🔍−</button>
                <button id="flow-reset-zoom" class="btn-standard" style="padding: 6px 12px;" title="Reset Zoom">⌂ Reset</button>
                <button id="flow-flip" class="btn-standard" style="padding: 6px 12px;" title="Flip Direction">⇄ Flip</button>
            `;
            flowDiagram.parentElement.insertBefore(controlsDiv, flowDiagram);

            // Check if there are subqueries (WITH clauses) and render them first
            const subqueries = request.plan['~subqueries'] || [];
            if (subqueries.length > 0) {
                subqueries.forEach((subquery, index) => {
                    const subqueryLabel = document.createElement('div');
                    subqueryLabel.className = 'subquery-label';
                    subqueryLabel.textContent = `📦 WITH Subquery ${index + 1} (executed first)`;
                    subqueryLabel.style.cssText = 'font-weight: bold; margin-bottom: 10px; padding: 8px; background: #2a4a5a; border-radius: 4px; color: #fff;';
                    flowDiagram.appendChild(subqueryLabel);
                    
                    const subqueryContainer = document.createElement('div');
                    subqueryContainer.className = 'subquery-flow';
                    subqueryContainer.style.cssText = 'display: flex; flex-direction: row; align-items: center; gap: 10px; padding: 15px; border: 2px solid #4a7a9a; border-radius: 8px; background: rgba(74, 122, 154, 0.1); margin-bottom: 20px;';
                    
                    if (subquery.executionTimings) {
                        renderOperatorTree(subquery.executionTimings, subqueryContainer, totalElapsedTimeMs, new WeakSet(), true);
                    }
                    
                    flowDiagram.appendChild(subqueryContainer);
                });
                
                // Add main query separator
                const separator = document.createElement('div');
                separator.className = 'main-query-separator';
                separator.textContent = '↓ Main Query ↓';
                separator.style.cssText = 'font-weight: bold; margin: 20px 0; padding: 8px; background: #3a5a4a; border-radius: 4px; color: #fff; text-align: center;';
                flowDiagram.appendChild(separator);
            }

            // Render the operator tree hierarchically
            renderOperatorTree(request.plan, flowDiagram, totalElapsedTimeMs);

            const viewPlanButton = document.createElement('button');
            viewPlanButton.textContent = TEXT_CONSTANTS.VIEW_DETAILED_PLAN;
            viewPlanButton.style.marginTop = '10px';
            viewPlanButton.addEventListener('click', () => {
                const indexesAndKeys = extractIndexesAndKeys(request);
                const planTreeHtml = buildEnhancedPlanModal(request.plan, indexesAndKeys, request);
                document.getElementById('plan-modal-body').innerHTML = planTreeHtml;
                document.getElementById('plan-modal').style.display = 'block';
            });
            flowDiagram.appendChild(viewPlanButton);

            flowDiagramPanzoomInstance = panzoom(flowDiagram, { smoothScroll: false });

            document.getElementById('flow-zoom-in').addEventListener('click', () => {
                if (flowDiagramPanzoomInstance) {
                    const transform = flowDiagramPanzoomInstance.getTransform();
                    flowDiagramPanzoomInstance.zoomTo(transform.x + flowDiagram.offsetWidth / 2, transform.y + flowDiagram.offsetHeight / 2, 1.2);
                }
            });

            document.getElementById('flow-zoom-out').addEventListener('click', () => {
                if (flowDiagramPanzoomInstance) {
                    const transform = flowDiagramPanzoomInstance.getTransform();
                    flowDiagramPanzoomInstance.zoomTo(transform.x + flowDiagram.offsetWidth / 2, transform.y + flowDiagram.offsetHeight / 2, 0.8);
                }
            });

            document.getElementById('flow-reset-zoom').addEventListener('click', () => {
                if (flowDiagramPanzoomInstance) {
                    flowDiagramPanzoomInstance.moveTo(0, 0);
                    flowDiagramPanzoomInstance.zoomAbs(0, 0, 1);
                }
            });

            document.getElementById('flow-flip').addEventListener('click', () => {
                const currentDirection = flowDiagram.style.flexDirection;
                flowDiagram.style.flexDirection = (currentDirection === 'row-reverse') ? 'row' : 'row-reverse';
            });
        }
        
        // ========== ORIGINAL STABLE VERSION ==========
        function generateFlowDiagram_Original(request) {
            const flowDiagram = document.getElementById("flow-diagram");
            flowDiagram.innerHTML = "";
            if (!request || !request.plan) {
                flowDiagram.textContent = TEXT_CONSTANTS.NO_EXECUTION_PLAN;
                return;
            }

            const totalKernTime = calculateTotalKernTime(request.plan);
            const totalElapsedTimeMs = request.elapsedTimeMs || parseTime(request.elapsedTime) || 0;
            const allOperators = getOperators(request.plan);
            const operators = allOperators.filter(op => op["#operator"] !== "Sequence");

            if (operators.length === 0) {
                flowDiagram.textContent = TEXT_CONSTANTS.NO_OPERATORS_FOUND;
                return;
            }

            operators.forEach((operator, index) => {
                const operatorName = operator["#operator"] || "Unknown Operator";
                const stats = operator["#stats"] || {};
                const kernTime = stats.kernTime || "N/A";
                const execTime = stats.execTime || "N/A";
                const servTime = stats.servTime || "N/A";
                const itemsIn = stats["#itemsIn"] !== undefined ? stats["#itemsIn"] : "-";
                const itemsOut = stats["#itemsOut"] !== undefined ? stats["#itemsOut"] : "-";

                const kernTimeMs = parseTime(kernTime);
                const execTimeMs = parseTime(execTime);
                const servTimeMs = parseTime(servTime);

                const timeForPercentage = !isNaN(servTimeMs) && servTimeMs > 0 ? servTimeMs : execTimeMs;
                const percentage = totalElapsedTimeMs > 0 && !isNaN(timeForPercentage) && timeForPercentage > 0
                    ? ((timeForPercentage / totalElapsedTimeMs) * 100).toFixed(2)
                    : "N/A";

                const bubble = document.createElement("div");
                bubble.className = "step-bubble";

                const percentageColors = getPercentageColor(percentage);
                bubble.style.backgroundColor = percentageColors.bg;
                bubble.style.borderColor = percentageColors.border;
                bubble.style.borderWidth = "2px";

                const colorClass = getColorClass(parseFloat(percentage));
                bubble.classList.add(colorClass);

                const execTimeTooltip = formatTimeTooltip(execTime, execTimeMs);
                let bubbleContent = `
                    <h4>${operatorName}</h4>
                    <p><span title="${execTimeTooltip}">${formatTime(execTimeMs)}</span> (${percentage}%)</p>`;

                if (servTime !== "N/A" && !isNaN(servTimeMs) && servTimeMs > 0) {
                    const servTimeTooltip = formatTimeTooltip(servTime, servTimeMs);
                    bubbleContent += `<p><span title="${servTimeTooltip}">${formatTime(servTimeMs)}</span> servTime</p>`;
                }

                if (itemsIn !== "-" && itemsOut !== "-") {
                    bubbleContent += `<p>${itemsIn} in / ${itemsOut} out</p>`;
                }

                bubble.innerHTML = bubbleContent;
                bubble.addEventListener("click", () => {
                    const statsHtml = buildOperatorStats(operator);
                    document.getElementById("operator-modal-body").innerHTML = statsHtml;
                    document.getElementById("operator-modal").style.display = "block";
                });
                flowDiagram.appendChild(bubble);

                if (index < operators.length - 1) {
                    const connector = document.createElement("div");
                    connector.className = "connector";
                    flowDiagram.appendChild(connector);
                }
            });

            if (request.plan) {
                const viewPlanButton = document.createElement("button");
                viewPlanButton.textContent = TEXT_CONSTANTS.VIEW_DETAILED_PLAN;
                viewPlanButton.style.marginTop = "10px";
                viewPlanButton.addEventListener("click", () => {
                    const indexesAndKeys = extractIndexesAndKeys(request);
                    const planTreeHtml = buildEnhancedPlanModal(request.plan, indexesAndKeys, request);
                    document.getElementById("plan-modal-body").innerHTML = planTreeHtml;
                    document.getElementById("plan-modal").style.display = "block";
                });
                flowDiagram.appendChild(viewPlanButton);
            }

            panzoom(flowDiagram, { smoothScroll: false });
        }
        
        // ========== DISPATCHER FUNCTION ==========
        function generateFlowDiagram(request) {
            if (isDevMode()) {
                generateFlowDiagram_New(request);
            } else {
                generateFlowDiagram_Original(request);
            }
        }

        // Extract indexes and USE KEYS from request
        function extractIndexesAndKeys(request) {
            const indexes = new Set();
            const useKeys = [];
            let hasUseKeys = false;

            // Get bucket.scope.collection from the statement for primary index resolution
            const requestStatement =
                (request.statement || stripEmTags(request.preparedText || "") || "");
            let bucketScopeCollection = "unknown.unknown.unknown";

            const fromMatch = requestStatement.match(/FROM\s+([^\s\n\r\t]+)/i);
            if (fromMatch) {
                const target = fromMatch[1].replace(/`/g, "").replace(/;$/, "");
                const parts = target.split(".");
                if (parts.length === 1) {
                    bucketScopeCollection = `${parts[0]}._default._default`;
                } else if (parts.length === 2) {
                    bucketScopeCollection = `${parts[0]}.${parts[1]}._default`;
                } else if (parts.length >= 3) {
                    bucketScopeCollection = `${parts[0]}.${parts[1]}.${parts[2]}`;
                }
            }

            // Extract indexes from plan
            if (request.plan) {
                const operators = getOperators(request.plan);

                operators.forEach((operator, opIndex) => {
                    const opType = operator["#operator"];

                    if (
                        opType === "IndexScan" ||
                        opType === "IndexScan2" ||
                        opType === "IndexScan3"
                    ) {
                        if (operator.index) {
                            indexes.add(operator.index);
                        }
                    }

                    if (
                        opType === "PrimaryScan" ||
                        opType === "PrimaryScan2" ||
                        opType === "PrimaryScan3"
                    ) {
                        try {
                            // First try to resolve #primary to actual name
                            let resolvedName = resolvePrimaryIndexName(
                                bucketScopeCollection
                            );

                            // If we got a real index name (not #primary), use it
                            if (resolvedName && resolvedName !== "#primary") {
                                indexes.add(resolvedName);
                            }
                            // If operator has explicit index name, use that instead
                            else if (operator.index) {
                                indexes.add(operator.index);
                            }
                            // Fallback to #primary
                            else {
                                indexes.add("#primary");
                            }
                        } catch (error) {
                            // Fallback to operator.index if available
                            if (operator.index) {
                                indexes.add(operator.index);
                            } else {
                                indexes.add("#primary");
                            }
                        }
                    }
                });
            }

            // Extract USE KEYS from statement
            if (requestStatement.includes("USE KEYS")) {
                hasUseKeys = true;

                // Handle all USE KEYS formats:
                // USE KEYS(["key1","key2"]) or USE KEYS ["key1","key2"]
                // USE KEYS(['key1','key2']) or USE KEYS ['key1','key2']
                // USE KEYS("key1") or USE KEYS "key1"
                // USE KEYS('key1') or USE KEYS 'key1'

                let match;

                // Extract array format with double quotes: USE KEYS(?)["key1","key2"]
                const arrayDoubleQuotes = /USE\s+KEYS\s*\(?\s*\[(.*?)\]\s*\)?/gi;
                while ((match = arrayDoubleQuotes.exec(requestStatement)) !== null) {
                    // Split by comma and clean up each key, handle both single and double quotes
                    const keys = match[1]
                        .split(",")
                        .map((key) => {
                            return key.trim().replace(/^['"]|['"]$/g, ""); // Remove leading/trailing quotes
                        })
                        .filter((key) => key.length > 0);
                    useKeys.push(...keys);
                }

                // Reset regex for single key formats
                arrayDoubleQuotes.lastIndex = 0;

                // Extract single key format: USE KEYS(?) "key" or USE KEYS(?) 'key'
                // This should not match array formats, so we exclude those with brackets
                const singleKeyRegex =
                    /USE\s+KEYS\s*\(?\s*([^[\],]+?)\s*\)?(?:\s+WHERE|\s*$)/gi;
                while ((match = singleKeyRegex.exec(requestStatement)) !== null) {
                    const key = match[1].trim().replace(/^['"]|['"]$/g, ""); // Remove leading/trailing quotes
                    if (key && !key.includes("[") && !key.includes("]")) {
                        useKeys.push(key);
                    }
                }
            }

            return {
                indexes: Array.from(indexes),
                useKeys: [...new Set(useKeys)], // Remove duplicates
                hasUseKeys,
            };
        }

        // Build enhanced plan modal with indexes and keys

        // Get operator icon and color based on type
        function getOperatorStyle(operatorName) {
            const styles = {
                Authorize: { icon: "🔐", color: "#6f42c1", bg: "#f8f7ff" },
                Sequence: { icon: "📋", color: "#856404", bg: "#fff3cd" },
                IndexScan: { icon: "🔍", color: "#007bff", bg: "#e7f3ff" },
                IndexScan2: { icon: "🔍", color: "#007bff", bg: "#e7f3ff" },
                IndexScan3: { icon: "🔍", color: "#007bff", bg: "#e7f3ff" },
                PrimaryScan: { icon: "🔑", color: "#dc3545", bg: "#fff5f5" },
                PrimaryScan3: { icon: "🔑", color: "#dc3545", bg: "#fff5f5" },
                Fetch: { icon: "📥", color: "#28a745", bg: "#f1f8e9" },
                Filter: { icon: "🔧", color: "#fd7e14", bg: "#fff4e6" },
                InitialGroup: { icon: "📊", color: "#20c997", bg: "#e6fffa" },
                IntermediateGroup: { icon: "📈", color: "#20c997", bg: "#e6fffa" },
                FinalGroup: { icon: "🎯", color: "#20c997", bg: "#e6fffa" },
                InitialProject: { icon: "📋", color: "#6f42c1", bg: "#f8f7ff" },
                Stream: { icon: "🌊", color: "#17a2b8", bg: "#e2f7fa" },
                Sort: { icon: "🔄", color: "#ffc107", bg: "#fff8e1" },
                Limit: { icon: "✂️", color: "#e83e8c", bg: "#fce4ec" },
                Offset: { icon: "⏭️", color: "#6c757d", bg: "#f8f9fa" },
                Union: { icon: "🔗", color: "#795548", bg: "#f3e5f5" },
                Join: { icon: "🤝", color: "#9c27b0", bg: "#f3e5f5" },
            };

            return (
                styles[operatorName] || {
                    icon: "⚙️",
                    color: "#6c757d",
                    bg: "#f8f9fa",
                }
            );
        }

        // Format time values for better readability
        // Format time value with color coding for HTML display
        const formatTimeValue = (function() {
            return function(timeStr) {
                if (!timeStr || timeStr === "N/A")
                    return '<span style="color: #999;">N/A</span>';

                // Parse time and check if it's a high value (potential bottleneck)
                const timeMs = parseTime(timeStr);
                const isBottleneck = timeMs > 60000; // > 1 minute
                const isWarning = timeMs > 10000; // > 10 seconds

                let color = "#333";
                let bgColor = "transparent";
                let fontWeight = "normal";

                if (isBottleneck) {
                    color = "#dc3545";
                    bgColor = "#fff5f5";
                    fontWeight = "bold";
                } else if (isWarning) {
                    color = "#fd7e14";
                    bgColor = "#fff4e6";
                    fontWeight = "bold";
                }

                return `<span style="color: ${color}; background: ${bgColor}; font-weight: ${fontWeight}; padding: 1px 4px; border-radius: 3px;">${timeStr}</span>`;
            };
        })();

        // Format item count with color coding for HTML display
        const formatItemCount = (function() {
            return function(count) {
                if (count === undefined || count === null)
                    return '<span style="color: #999;">N/A</span>';

                const numCount = typeof count === "number" ? count : parseInt(count);
                let color = "#333";
                let icon = "";

                if (numCount > 1000000) {
                    color = "#dc3545";
                    icon = "⚠️ ";
                } else if (numCount > 100000) {
                    color = "#fd7e14";
                    icon = "⚡ ";
                } else if (numCount > 10000) {
                    color = "#ffc107";
                }

                return `<span style="color: ${color};">${icon}${numCount.toLocaleString()}</span>`;
            };
        })();

        // Build plan tree for modal with enhanced formatting
        function buildPlanTree(operator) {
            if (!operator) return "";

            const operatorName = operator["#operator"] || "Unknown Operator";
            const style = getOperatorStyle(operatorName);

            let html = `<li style="margin: 8px 0; padding: 12px; border-left: 4px solid ${style.color}; background: ${style.bg}; border-radius: 6px;">`;

            // Operator header with icon and name
            html += `<div style="display: flex; align-items: center; margin-bottom: 8px;">`;
            html += `<span style="font-size: 18px; margin-right: 8px;">${style.icon}</span>`;
            html += `<strong style="color: ${style.color}; font-size: 16px;">${operatorName}</strong>`;
            html += `</div>`;

            // Statistics section
            if (operator["#stats"]) {
                const stats = operator["#stats"];
                html += `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px; margin: 8px 0; font-size: 13px;">`;

                // Items In/Out
                html += `<div style="background: white; padding: 6px 10px; border-radius: 4px; border: 1px solid #e9ecef;">`;
                html += `<span style="color: #6c757d; font-weight: 500;">📥 Items In:</span> ${formatItemCount(
                    stats["#itemsIn"]
                )}`;
                html += `</div>`;

                html += `<div style="background: white; padding: 6px 10px; border-radius: 4px; border: 1px solid #e9ecef;">`;
                html += `<span style="color: #6c757d; font-weight: 500;">📤 Items Out:</span> ${formatItemCount(
                    stats["#itemsOut"]
                )}`;
                html += `</div>`;

                // Execution Time
                html += `<div style="background: white; padding: 6px 10px; border-radius: 4px; border: 1px solid #e9ecef;">`;
                html += `<span style="color: #6c757d; font-weight: 500;">⏱️ Exec Time:</span> ${formatTimeValue(
                    stats.execTime
                )}`;
                html += `</div>`;

                // Kernel Time
                html += `<div style="background: white; padding: 6px 10px; border-radius: 4px; border: 1px solid #e9ecef;">`;
                html += `<span style="color: #6c757d; font-weight: 500;">🔧 Kern Time:</span> ${formatTimeValue(
                    stats.kernTime
                )}`;
                html += `</div>`;

                html += `</div>`;

                // Efficiency indicator
                const itemsIn = stats["#itemsIn"];
                const itemsOut = stats["#itemsOut"];
                if (itemsIn !== undefined && itemsOut !== undefined && itemsIn > 0) {
                    const efficiency = (itemsOut / itemsIn) * 100;
                    let efficiencyColor = "#28a745";
                    let efficiencyIcon = "✅";

                    if (efficiency < 50) {
                        efficiencyColor = "#dc3545";
                        efficiencyIcon = "⚠️";
                    } else if (efficiency < 80) {
                        efficiencyColor = "#ffc107";
                        efficiencyIcon = "⚡";
                    }

                    html += `<div style="margin-top: 6px; font-size: 12px;">`;
                    html += `<span style="color: ${efficiencyColor};">${efficiencyIcon} Efficiency: ${efficiency.toFixed(
                        1
                    )}%</span>`;
                    html += `</div>`;
                }
            }

            // Child operations
            const childContainerStyle =
                "margin-top: 10px; margin-left: 20px; border-left: 2px dashed #dee2e6; padding-left: 15px;";

            if (operator["~child"]) {
                html +=
                    `<ul style="${childContainerStyle}">` +
                    buildPlanTree(operator["~child"]) +
                    "</ul>";
            } else if (operator["~children"]) {
                html += `<ul style="${childContainerStyle}">`;
                operator["~children"].forEach((child) => {
                    html += buildPlanTree(child);
                });
                html += "</ul>";
            }

            // Handle other child properties
            if (operator.input) {
                html +=
                    `<ul style="${childContainerStyle}">` +
                    buildPlanTree(operator.input) +
                    "</ul>";
            }
            if (operator.inputs && Array.isArray(operator.inputs)) {
                html += `<ul style="${childContainerStyle}">`;
                operator.inputs.forEach((input) => {
                    html += buildPlanTree(input);
                });
                html += "</ul>";
            }
            if (operator.left) {
                html +=
                    `<ul style="${childContainerStyle}">` +
                    buildPlanTree(operator.left) +
                    "</ul>";
            }
            if (operator.right) {
                html +=
                    `<ul style="${childContainerStyle}">` +
                    buildPlanTree(operator.right) +
                    "</ul>";
            }
            if (operator.first) {
                html +=
                    `<ul style="${childContainerStyle}">` +
                    buildPlanTree(operator.first) +
                    "</ul>";
            }
            if (operator.second) {
                html +=
                    `<ul style="${childContainerStyle}">` +
                    buildPlanTree(operator.second) +
                    "</ul>";
            }
            if (operator.scans && Array.isArray(operator.scans)) {
                html += `<ul style="${childContainerStyle}">`;
                operator.scans.forEach((scan) => {
                    html += buildPlanTree(scan);
                });
                html += "</ul>";
            }
            if (operator.scan) {
                html +=
                    `<ul style="${childContainerStyle}">` +
                    buildPlanTree(operator.scan) +
                    "</ul>";
            }
            if (operator["~subqueries"] && Array.isArray(operator["~subqueries"])) {
                html += `<ul style="${childContainerStyle}">`;
                operator["~subqueries"].forEach((subquery) => {
                    if (subquery.executionTimings) {
                        html += buildPlanTree(subquery.executionTimings);
                    }
                });
                html += "</ul>";
            }

            html += "</li>";
            return html;
        }

        // Sorting functionality
        let currentSortColumn = null;
        let currentSortDirection = "asc";
        let currentTableType = "every-query"; // 'every-query' or 'analysis'
        let everyQueryData = [];
        let analysisData = [];

        // Pagination variables
        let currentPage = 1;
        const pageSize = 50; // Records per page

        // Search/filter variables
        let filteredEveryQueryData = [];
        let currentStatementFilter = "";
        let currentUsernameFilter = "";

        // Analysis table search/filter variables
        let filteredAnalysisData = [];
        let currentAnalysisStatementFilter = "";
        let currentAnalysisUsernameFilter = "";

        // Enhanced time parsing for sorting (handles various units and mm:ss.sss format)
        function parseTimeForSorting(timeStr) {
            if (!timeStr || timeStr === "N/A" || timeStr === "-") return 0;

            // Check if it's in mm:ss.sss format
            const mmssMatch = timeStr.match(/^(\d+):(\d{2})\.(\d{3})$/);
            if (mmssMatch) {
                const minutes = parseInt(mmssMatch[1]);
                const seconds = parseInt(mmssMatch[2]);
                const milliseconds = parseInt(mmssMatch[3]);
                return minutes * 60000 + seconds * 1000 + milliseconds;
            }

            // Handle legacy formats
            const match = timeStr
                .replace(/(\d+\.?\d*)(\D+)/, "$1 $2")
                .match(/(\d+\.?\d*)\s*(\D+)/);
            if (!match) return 0;
            const value = parseFloat(match[1]);
            const unit = match[2].toLowerCase().trim();
            // Convert everything to milliseconds for consistent sorting
            if (unit === "h" || unit === "hour" || unit === "hours")
                return value * 3600000;
            if (
                unit === "m" ||
                unit === "min" ||
                unit === "minute" ||
                unit === "minutes"
            )
                return value * 60000;
            if (
                unit === "s" ||
                unit === "sec" ||
                unit === "second" ||
                unit === "seconds"
            )
                return value * 1000;
            if (unit === "ms" || unit === "millisecond" || unit === "milliseconds")
                return value;
            if (
                unit === "us" ||
                unit === "µs" ||
                unit === "microsecond" ||
                unit === "microseconds"
            )
                return value / 1000;
            if (unit === "ns" || unit === "nanosecond" || unit === "nanoseconds")
                return value / 1000000;
            return value;
        }

        // Get sortable value for a column
        function getSortableValue(item, columnId) {
            // Try to find column config in Every Query columns or Analysis columns
            let colConfig = EVERY_QUERY_COLUMNS.find(col => col.id === columnId);
            
            if (!colConfig) {
                colConfig = ANALYSIS_COLUMNS.find(col => col.id === columnId);
            }
            
            // If still not found, return default
            if (!colConfig) {
                // Default for unknown columns: string comparison
                return String(item[columnId] || "").toLowerCase();
            }

            const value = item[columnId];

            // Use custom sort function if defined
            if (colConfig.sortFn) {
                return colConfig.sortFn(value);
            }

            // Use sortType to determine how to sort
            switch (colConfig.sortType) {
                case 'numeric':
                    return parseFloat(value) || 0;
                case 'time':
                    return parseTimeForSorting(value);
                case 'date':
                    return new Date(value).getTime() || 0;
                case 'percent':
                    return parseFloat(String(value).replace('%', '')) || 0;
                case 'boolean':
                    return value === 'Yes' ? 1 : 0;
                case 'string':
                default:
                    return String(value || '').toLowerCase();
            }
        }

        // Sort data
        function sortData(data, column, direction) {
            return [...data].sort((a, b) => {
                const aVal = getSortableValue(a, column);
                const bVal = getSortableValue(b, column);

                let comparison = 0;
                if (aVal < bVal) comparison = -1;
                else if (aVal > bVal) comparison = 1;

                return direction === "asc" ? comparison : -comparison;
            });
        }

        // Update sort arrows in headers
        function updateSortArrows(tableHeaderId, column, direction) {
            const headers = document.querySelectorAll(`#${tableHeaderId} th`);
            headers.forEach((th) => {
                // Remove existing sort indicators
                const existingArrow = th.querySelector(".sort-arrow");
                const existingSortHint = th.querySelector(".sort-hint");
                if (existingArrow) existingArrow.remove();
                if (existingSortHint) existingSortHint.remove();

                // Handle multi-line headers by removing newlines for comparison
                const headerText = th.innerHTML
                    .replace(/<br>/g, " ")
                    .replace(/<[^>]*>/g, "")
                    .replace(/\s+/g, " ")
                    .trim();
                const columnText = column.replace(/\n/g, " ").trim();

                if (headerText === columnText) {
                    // Remove the old sort hint and add prominent arrow
                    const oldHint = th.querySelector("div");
                    if (oldHint && oldHint.textContent === "↕ Sort") {
                        oldHint.remove();
                    }

                    const arrow = document.createElement("div");
                    arrow.className = "sort-arrow";
                    arrow.style.fontSize = "14px";
                    arrow.style.color = "#0066cc";
                    arrow.style.fontWeight = "bold";
                    arrow.style.marginTop = "2px";

                    if (direction === "asc") {
                        arrow.textContent = "▲ ASC";
                        arrow.style.color = "#28a745";
                    } else {
                        arrow.textContent = "▼ DESC";
                        arrow.style.color = "#dc3545";
                    }

                    th.appendChild(arrow);
                } else {
                    // Add back the sort hint for non-active columns
                    const sortHint = document.createElement("div");
                    sortHint.className = "sort-hint";
                    sortHint.style.fontSize = "10px";
                    sortHint.style.color = "#6c757d";
                    sortHint.style.fontWeight = "normal";
                    sortHint.style.marginTop = "2px";
                    sortHint.textContent = "↕ Sort";
                    th.appendChild(sortHint);
                }
            });
        }

        // Map display column names to data field names
        function getDataFieldName(displayColumn) {
            // Map display names back to data field names (same logic as in populateEveryQueryTable)
            if (displayColumn === "request\nTime") return "requestTime";
            else if (displayColumn === "statement\nType") return "statementType";
            else if (displayColumn === "elapsed\nTime") return "elapsedTime";
            else if (displayColumn === "service\nTime") return "serviceTime";
            else if (displayColumn === "kern\nTime") return "kernTime";
            else if (displayColumn === "KernTime\n%") return "KernTime %";
            else if (displayColumn === "cpu\nTime") return "cpuTime";
            else if (displayColumn === "memory\n(MB)") return "memory (MB)";
            else if (displayColumn === "result\nCount") return "resultCount";
            else if (displayColumn === "result\nSize") return "resultSize";
            else if (displayColumn === "Items from\nIndex Scan")
                return "Items from Index Scan";
            else if (displayColumn === "Doc Fetch\nCount") return "Doc Fetch Count";
            else if (displayColumn === "Primary Scan\nUsed")
                return "Primary Scan Used";
            else if (displayColumn === "Scan\nConsistency")
                return "scanConsistency";
            else return displayColumn; // For columns without newlines like "#", "state", "statement", "users"
        }

        // Handle column sort click
        function handleColumnSort(column, tableType) {
            // Map display column to data field
            const dataField = getDataFieldName(column);

            if (currentSortColumn === column && currentTableType === tableType) {
                currentSortDirection =
                    currentSortDirection === "asc" ? "desc" : "asc";
            } else {
                currentSortColumn = column;
                currentSortDirection = "asc";
                currentTableType = tableType;
            }

            if (tableType === "every-query") {
                currentPage = 1; // Reset to first page after sorting

                // Sort using the data field name, not the display name
                const sortedData = sortData(
                    filteredEveryQueryData,
                    dataField,
                    currentSortDirection
                );

                filteredEveryQueryData = sortedData;
                populateEveryQueryTable(filteredEveryQueryData);
                updateSortArrows("table-header", column, currentSortDirection);
            } else if (tableType === "analysis") {
                // Sort the filtered analysis data
                const sortedData = sortData(
                    filteredAnalysisData,
                    column,
                    currentSortDirection
                );
                filteredAnalysisData = sortedData;
                populateAnalysisTable(filteredAnalysisData);
                updateSortArrows(
                    "analysis-table-header",
                    column,
                    currentSortDirection
                );
            }
        }

        // Create pagination controls
        function addPaginationControls(totalRecords) {
            const tableContainer = document.getElementById("table-container");
            let paginationDiv = document.getElementById("pagination");
            if (!paginationDiv) {
                paginationDiv = document.createElement("div");
                paginationDiv.id = "pagination";
                paginationDiv.style.textAlign = "center";
                paginationDiv.style.marginTop = "10px";
                paginationDiv.style.backgroundColor = "#f5f5f5";
                paginationDiv.style.padding = "10px";
                paginationDiv.style.borderTop = "1px solid #ddd";
                tableContainer.appendChild(paginationDiv);
            }
            paginationDiv.innerHTML = "";

            const totalPages = Math.ceil(totalRecords / pageSize);

            // Previous button
            const prevButton = createButton("◀ Prev", () => {
                if (currentPage > 1) {
                    currentPage--;
                    populateEveryQueryTable(filteredEveryQueryData);
                }
            });
            prevButton.disabled = currentPage === 1;

            // Next button
            const nextButton = createButton("Next ▶", () => {
                if (currentPage < totalPages) {
                    currentPage++;
                    populateEveryQueryTable(filteredEveryQueryData);
                }
            });
            nextButton.disabled = currentPage === totalPages;

            // Page info
            const pageInfo = document.createElement("span");
            pageInfo.textContent = ` Page ${currentPage} of ${totalPages} (${totalRecords} records) `;
            pageInfo.style.margin = "0 15px";
            pageInfo.style.fontWeight = "bold";

            // Page jump input
            const pageInput = document.createElement("input");
            pageInput.type = "number";
            pageInput.min = "1";
            pageInput.max = totalPages.toString();
            pageInput.value = currentPage.toString();
            pageInput.style.width = "60px";
            pageInput.style.margin = "0 5px";
            pageInput.addEventListener("keypress", (e) => {
                if (e.key === "Enter") {
                    const newPage = parseInt(pageInput.value);
                    if (newPage >= 1 && newPage <= totalPages) {
                        currentPage = newPage;
                        populateEveryQueryTable(filteredEveryQueryData);
                    }
                }
            });

            const jumpLabel = document.createElement("span");
            jumpLabel.textContent = "Go to page: ";
            jumpLabel.style.marginLeft = "20px";

            paginationDiv.appendChild(prevButton);
            paginationDiv.appendChild(pageInfo);
            paginationDiv.appendChild(nextButton);
            paginationDiv.appendChild(jumpLabel);
            paginationDiv.appendChild(pageInput);
        }

        function createButton(text, onClick) {
            const btn = document.createElement("button");
            btn.textContent = text;
            btn.style.margin = "0 5px";
            btn.style.padding = "5px 10px";
            btn.style.cursor = "pointer";
            btn.onclick = onClick;
            return btn;
        }

        // Filter data based on search criteria

        // Update search results info
        function updateSearchResultsInfo(filteredCount, totalCount) {
            const infoDiv = document.getElementById("search-results-info");
            if (filteredCount === totalCount) {
                infoDiv.textContent = `Showing all ${totalCount} records`;
            } else {
                infoDiv.textContent = `Showing ${filteredCount} of ${totalCount} records`;
            }
        }

        // Filter analysis data based on search criteria
        function filterAnalysisData(data) {
            return data.filter((rowData) => {
                // Filter by statement
                if (currentAnalysisStatementFilter) {
                    const combined = (
                        (rowData.statement || "") + " " + (rowData.preparedSample || "")
                    ).toLowerCase();
                    if (
                        !combined.includes(currentAnalysisStatementFilter.toLowerCase())
                    ) {
                        return false;
                    }
                }

                // Filter by username
                if (currentAnalysisUsernameFilter) {
                    const users = (rowData.users || "").toLowerCase();
                    if (!users.includes(currentAnalysisUsernameFilter.toLowerCase())) {
                        return false;
                    }
                }

                return true;
            });
        }

        // Update analysis search results info
        function updateAnalysisSearchResultsInfo(filteredCount, totalCount) {
            const infoDiv = document.getElementById("analysis-search-results-info");
            if (filteredCount === totalCount) {
                infoDiv.textContent = `Showing all ${totalCount} groups`;
            } else {
                infoDiv.textContent = `Showing ${filteredCount} of ${totalCount} groups`;
            }
        }

        // Setup analysis search event listeners
        function setupAnalysisSearchListeners() {
            const statementSearch = document.getElementById(
                "analysis-statement-search"
            );
            const usernameSearch = document.getElementById(
                "analysis-username-search"
            );
            const clearButton = document.getElementById("analysis-clear-search");

            function performAnalysisSearch() {
                currentAnalysisStatementFilter = statementSearch.value.trim();
                currentAnalysisUsernameFilter = usernameSearch.value.trim();

                // Filter the data
                filteredAnalysisData = filterAnalysisData(analysisData);

                // Update display
                populateAnalysisTable(filteredAnalysisData);
                updateAnalysisSearchResultsInfo(
                    filteredAnalysisData.length,
                    analysisData.length
                );
            }

            // Add debouncing to search inputs
            let analysisSearchTimeout;
            function debouncedAnalysisSearch() {
                clearTimeout(analysisSearchTimeout);
                analysisSearchTimeout = setTimeout(performAnalysisSearch, 300);
            }

            statementSearch.addEventListener("input", debouncedAnalysisSearch);
            usernameSearch.addEventListener("input", debouncedAnalysisSearch);

            clearButton.addEventListener("click", () => {
                statementSearch.value = "";
                usernameSearch.value = "";
                currentAnalysisStatementFilter = "";
                currentAnalysisUsernameFilter = "";
                filteredAnalysisData = [...analysisData];
                populateAnalysisTable(filteredAnalysisData);
                updateAnalysisSearchResultsInfo(
                    filteredAnalysisData.length,
                    analysisData.length
                );
            });
        }

        // Setup search event listeners
        function setupSearchListeners() {
            const statementSearch = document.getElementById("statement-search");
            const usernameSearch = document.getElementById("username-search");
            const clearButton = document.getElementById("clear-search");

            function performSearch() {
                currentStatementFilter = statementSearch.value.trim();
                currentUsernameFilter = usernameSearch.value.trim();

                // Filter the data
                filteredEveryQueryData = filterEveryQueryData(everyQueryData);

                // Reset to first page
                currentPage = 1;

                // Update display
                populateEveryQueryTable(filteredEveryQueryData);
                updateSearchResultsInfo(
                    filteredEveryQueryData.length,
                    everyQueryData.length
                );
            }

            // Add debouncing to search inputs
            let searchTimeout;
            function debouncedSearch() {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(performSearch, 300);
            }

            statementSearch.addEventListener("input", debouncedSearch);
            usernameSearch.addEventListener("input", debouncedSearch);

            clearButton.addEventListener("click", () => {
                statementSearch.value = "";
                usernameSearch.value = "";
                currentStatementFilter = "";
                currentUsernameFilter = "";
                filteredEveryQueryData = [...everyQueryData];
                currentPage = 1;
                populateEveryQueryTable(filteredEveryQueryData);
                updateSearchResultsInfo(
                    filteredEveryQueryData.length,
                    everyQueryData.length
                );
            });
        }

        // Column Configuration for Every Query Table
        const EVERY_QUERY_COLUMNS = [
            {
                id: 'rowNumber',
                header: '#',
                dataField: null,
                sortable: true,
                sortType: 'numeric',
                getValue: (request, index) => index + 1,
                render: (value) => value
            },
            {
                id: 'requestTime',
                header: 'request\nTime',
                dataField: 'requestTime',
                sortable: true,
                sortType: 'date',
                getValue: (request) => {
                    const originalTime = request.requestTime || 'N/A';
                    if (originalTime === 'N/A') return originalTime;
                    
                    // Apply timezone conversion
                    const convertedDate = getChartDate(originalTime);
                    return convertedDate ? convertedDate.toISOString().replace('T', ' ').substring(0, 23) + 'Z' : originalTime;
                },
                render: (value) => value
            },
            {
                id: 'statementType',
                header: 'statement\nType',
                dataField: 'statementType',
                sortable: true,
                sortType: 'string',
                getValue: (request) => request.statementType || 'N/A',
                render: (value) => value
            },
            {
                id: 'elapsedTime',
                header: 'elapsed\nTime',
                dataField: 'elapsedTime',
                sortable: true,
                sortType: 'time',
                getValue: (request) => formatTime(request.elapsedTimeMs || 0),
                render: (value) => value
            },
            {
                id: 'serviceTime',
                header: 'service\nTime',
                dataField: 'serviceTime',
                sortable: true,
                sortType: 'time',
                getValue: (request) => formatTime(request.serviceTimeMs || parseTime(request.serviceTime)),
                render: (value) => value
            },
            {
                id: 'kernTime',
                header: 'kern\nTime',
                dataField: 'kernTime',
                sortable: true,
                sortType: 'time',
                getValue: (request) => {
                    const ms = request.kernTimeMs || 0;
                    return ms > 0 ? formatTime(ms) : 'N/A';
                },
                render: (value) => value
            },
            {
                id: 'kernTimePercent',
                header: 'KernTime\n%',
                dataField: 'KernTime %',
                sortable: true,
                sortType: 'percent',
                getValue: (request) => {
                    const elapsed = request.elapsedTimeMs || 0;
                    const kern = request.kernTimeMs || 0;
                    return elapsed > 0 && kern > 0 
                        ? ((kern / elapsed) * 100).toFixed(2) + '%' 
                        : 'N/A';
                },
                render: (value) => value
            },
            {
                id: 'cpuTime',
                header: 'cpu\nTime',
                dataField: 'cpuTime',
                sortable: true,
                sortType: 'time',
                getValue: (request) => formatTime(parseTime(request.cpuTime)),
                render: (value) => value
            },
            {
                id: 'memory',
                header: 'memory\n(MB)',
                dataField: 'memory (MB)',
                sortable: true,
                sortType: 'numeric',
                getValue: (request) => {
                    return (request.memoryBytes == null)
                        ? 'N/A'
                        : (request.memoryBytes / 1024 / 1024).toFixed(2);
                },
                render: (value) => value
            },
            {
                id: 'resultCount',
                header: 'result\nCount',
                dataField: 'resultCount',
                sortable: true,
                sortType: 'numeric',
                getValue: (request) => request.resultCount || 'N/A',
                render: (value, td, rowData) => {
                    const num = Number(value);
                    const formattedValue = isNaN(num) ? value : num.toLocaleString();
                    
                    // Issue #236: Highlight discrepancies between resultCount and itemsFromIndexScan
                    const indexScanValue = rowData.itemsFromIndexScan;
                    const resultCountValue = value;
                    
                    // Check if we should apply highlighting
                    const shouldHighlight = (
                        // Both values must be numeric (not N/A)
                        indexScanValue !== 'N/A' && 
                        resultCountValue !== 'N/A' &&
                        !isNaN(Number(indexScanValue)) &&
                        !isNaN(Number(resultCountValue)) &&
                        // Values must be different
                        Number(indexScanValue) !== Number(resultCountValue)
                    );
                    
                    if (shouldHighlight) {
                        td.style.fontWeight = 'bold';
                        td.style.color = '#FF8C00'; // Burnt orange (distinct from red)
                    }
                    
                    return formattedValue;
                }
            },
            {
                id: 'resultSize',
                header: 'result\nSize',
                dataField: 'resultSize',
                sortable: true,
                sortType: 'numeric',
                getValue: (request) => request.resultSize || 'N/A',
                render: (value) => {
                    const num = Number(value);
                    return isNaN(num) ? value : num.toLocaleString();
                }
            },
            {
                id: 'docFetchCount',
                header: 'Doc Fetch\nCount',
                dataField: 'Doc Fetch Count',
                sortable: true,
                sortType: 'numeric',
                getValue: (request) => {
                    const fetchCount = request.phaseCounts?.fetch || 0;
                    return fetchCount > 0 ? fetchCount : 'N/A';
                },
                render: (value) => {
                    const num = Number(value);
                    return isNaN(num) ? value : num.toLocaleString();
                }
            },
            {
                id: 'itemsFromIndexScan',
                header: 'Items from\nIndex Scan',
                dataField: 'Items from Index Scan',
                sortable: true,
                sortType: 'numeric',
                getValue: (request) => {
                    const indexScanCount = request.phaseCounts?.indexScan ||
                        request.phaseCounts?.primaryScan || 0;
                    return indexScanCount > 0 ? indexScanCount : 'N/A';
                },
                render: (value) => {
                    const num = Number(value);
                    return isNaN(num) ? value : num.toLocaleString();
                }
            },
            {
                id: 'primaryScanUsed',
                header: 'Primary Scan\nUsed',
                dataField: 'Primary Scan Used',
                sortable: true,
                sortType: 'boolean',
                getValue: (request) => request.usesPrimary ? 'Yes' : 'No',
                render: (value, td) => {
                    if (value === 'Yes' || value === 'True' || value === true) {
                        td.classList.add('primary-scan-yes');
                    }
                    return value;
                }
            },
            {
                id: 'state',
                header: 'state',
                dataField: 'state',
                sortable: true,
                sortType: 'custom',
                getValue: (request) => request.state || 'N/A',
                sortFn: (value) => {
                    if (value === 'fatal') return 'aaa_fatal';
                    if (value === 'completed') return 'bbb_completed';
                    return String(value || 'zzz_unknown').toLowerCase();
                },
                render: (value, td) => {
                    if (value === 'fatal') {
                        td.classList.add('fatal-state');
                    }
                    return value;
                }
            },
            {
                id: 'statement',
                header: 'statement',
                dataField: 'statement',
                width: '300px',
                maxWidth: '300px',
                sortable: true,
                sortType: 'string',
                getValue: (request) => request.statement || request.preparedText || 'N/A',
                render: (value, td, rowData, globalIndex) => {
                    const statementId = `statement-${globalIndex}`;
                    statementStore[statementId] = value;
                    
                    if (value.length > 500) {
                        const truncated = value.substring(0, 500);
                        const preparedSample = (rowData.request && isPreparedExecution(rowData.request)) 
                            ? getPreparedSample(rowData.request) : "";
                        const preparedSnippet = preparedSample 
                            ? `<div style="margin-top:6px; color:#555; font-size:12px;"><strong>${TEXT_CONSTANTS.PREPARED_TEXT || 'Prepared:'}</strong> ${escapeHtml(preparedSample.substring(0, 300))}${preparedSample.length > 300 ? '...' : ''}</div>` 
                            : '';
                        
                        return `
                            <div id="${statementId}-truncated">
                                <span>${truncated}...</span>
                                ${preparedSnippet}
                                <br>
                                <button onclick="toggleStatement('${statementId}', true)" 
                                        class="btn-standard" style="margin-top: 5px; margin-right: 5px;">${TEXT_CONSTANTS.SHOW_MORE}</button>
                                <button onclick="copyStatement('${statementId}', event)" 
                                        class="btn-standard" style="margin-top: 5px;">${TEXT_CONSTANTS.COPY}</button>
                            </div>
                            <div id="${statementId}-full" style="display: none;">
                                <span>${value}</span>
                                ${preparedSnippet}
                                <br>
                                <button onclick="toggleStatement('${statementId}', false)" 
                                        class="btn-standard" style="margin-top: 5px; margin-right: 5px;">${TEXT_CONSTANTS.HIDE}</button>
                                <button onclick="copyStatement('${statementId}', event)" 
                                        class="btn-standard" style="margin-top: 5px;">${TEXT_CONSTANTS.COPY}</button>
                            </div>
                        `;
                    } else {
                        const preparedSample = (rowData.request && isPreparedExecution(rowData.request)) 
                            ? getPreparedSample(rowData.request) : "";
                        const preparedSnippet = preparedSample 
                            ? `<div style="margin-top:6px; color:#555; font-size:12px;"><strong>${TEXT_CONSTANTS.PREPARED_TEXT || 'Prepared:'}</strong> ${escapeHtml(preparedSample.substring(0, 300))}${preparedSample.length > 300 ? '...' : ''}</div>` 
                            : '';
                        return `
                            <div>
                                <span>${value}</span>
                                ${preparedSnippet}
                                <br>
                                <button onclick="copyStatement('${statementId}', event)" 
                                        class="btn-standard" style="margin-top: 5px;">${TEXT_CONSTANTS.COPY}</button>
                            </div>
                        `;
                    }
                }
            },
            {
                id: 'scanConsistency',
                header: 'Scan\nConsistency',
                dataField: 'scanConsistency',
                sortable: true,
                sortType: 'string',
                getValue: (request) => {
                    return request.request && request.request.scanConsistency 
                        ? request.request.scanConsistency 
                        : 'N/A';
                },
                render: (value) => value
            },
            {
                id: 'users',
                header: 'users',
                dataField: 'users',
                sortable: true,
                sortType: 'string',
                getValue: (request) => request.users || 'N/A',
                render: (value) => value
            },
            {
                id: 'requestId',
                header: 'requestId',
                dataField: 'requestId',
                sortable: true,
                sortType: 'string',
                getValue: (request) => {
                    return (request.request && request.request.requestId) 
                        || request.requestId 
                        || '';
                },
                render: (value) => {
                    const safeId = String(value);
                    return `
                        <code style="font-size:11px;">${escapeHtml(safeId)}</code>
                        <button data-id="${escapeHtml(safeId)}" 
                                onclick="copyRequestId(this.dataset.id, event)" 
                                class="btn-standard" 
                                style="margin-left:6px;">${TEXT_CONSTANTS.COPY}</button>
                    `;
                }
            }
        ];

        // Generate main table

        // Populate Every Query table body

        // Toggle statement display between truncated and full view

        // Copy statement to clipboard
        function copyStatement(statementId, event) {
            const statement = statementStore[statementId];
            if (!statement) {
                Logger.error("Statement not found in store:", statementId);
                alert(TEXT_CONSTANTS.STATEMENT_NOT_FOUND);
                return;
            }
            ClipboardUtils.copyToClipboard(statement, event.target, {
                successText: "copied!"
            });
        }

        // Toggle analysis statement display between truncated and full view

        // Copy analysis statement to clipboard
        function copyAnalysisStatement(statementId, event) {
            const statement = analysisStatementStore[statementId];
            if (!statement) {
                Logger.error("Statement not found in store:", statementId);
                alert(TEXT_CONSTANTS.STATEMENT_NOT_FOUND);
                return;
            }
            ClipboardUtils.copyToClipboard(statement, event.target, {
                successText: "copied!"
            });
        }

        // Calculate statistics for a group of requests based on SQL++ query logic
        function calculateGroupStats(normalized_statement, groupedRequests) {
            const users_agg = groupedRequests.map((r) => r.users).filter((u) => u);
            const durations = groupedRequests
                .map((r) => {
                    const ms = parseTime(r.serviceTime);
                    return isNaN(ms) ? NaN : ms / 1000; // Convert ms to seconds
                })
                .filter((d) => !isNaN(d));
            const total_count = durations.length;
            if (total_count === 0) return null;

            const min_duration = Math.min(...durations);
            const max_duration = Math.max(...durations);
            const avg_duration =
                durations.reduce((sum, d) => sum + d, 0) / total_count;
            const sorted_durations = [...durations].sort((a, b) => a - b);
            const midFloor = Math.floor(total_count / 2);
            const midCeil = Math.ceil(total_count / 2) - 1;
            const median_duration =
                (sorted_durations[midFloor] + sorted_durations[midCeil]) / 2;

            const fetchValues = groupedRequests.map(
                (r) => r.phaseCounts?.fetch || 0
            );
            const primaryScanValues = groupedRequests.map(
                (r) => r.phaseCounts?.primaryScan || 0
            );
            const indexScanValues = groupedRequests.map(
                (r) => r.phaseCounts?.indexScan || 0
            );
            const avg_fetch =
                fetchValues.reduce((sum, v) => sum + v, 0) / total_count;
            const avg_primaryScan =
                primaryScanValues.reduce((sum, v) => sum + v, 0) / total_count;
            const avg_indexScan =
                indexScanValues.reduce((sum, v) => sum + v, 0) / total_count;

            // Calculate resultCount and resultSize
            const resultCountValues = groupedRequests.map(
                (r) => r.resultCount || 0
            );
            const resultSizeValues = groupedRequests.map(
                (r) => r.resultSize || 0
            );
            const avg_resultCount =
                resultCountValues.reduce((sum, v) => sum + v, 0) / total_count;
            const avg_resultSize =
                resultSizeValues.reduce((sum, v) => sum + v, 0) / total_count;

            // Compute user_query_counts as an object: { user: count }
            const uniqueUsers = [...new Set(users_agg)];
            const user_query_counts = {};
            uniqueUsers.forEach((user) => {
                user_query_counts[user] = users_agg.filter((v) => v === user).length;
            });

            // Calculate status counts
            const status_counts = {
                completed: 0,
                fatal: 0,
                cancelled: 0,
                other: 0
            };

            groupedRequests.forEach((r) => {
                const state = r.state ? r.state.toLowerCase() : 'completed';
                if (state === 'completed') {
                    status_counts.completed++;
                } else if (state === 'fatal') {
                    status_counts.fatal++;
                } else if (state === 'cancelled') {
                    status_counts.cancelled++;
                } else {
                    status_counts.other++;
                }
            });

            // Build average/min/max phase times (ms) for timeline chart
            function phaseStats(keys) {
                const keysArr = Array.isArray(keys) ? keys : [keys];
                const values = groupedRequests.map(r => {
                    const pt = r.phaseTimes || {};
                    let v = 0;
                    keysArr.forEach((k) => { if (pt && pt[k]) v += parseTime(pt[k]) || 0; });
                    return v;
                });
                const valid = values.filter(v => typeof v === 'number');
                const cnt = valid.length;
                if (cnt === 0) return { avg: 0, min: 0, max: 0 };
                const sum = valid.reduce((a,b)=>a+b,0);
                return { avg: sum/cnt, min: Math.min(...valid), max: Math.max(...valid) };
            }

            const s_authorize = phaseStats('authorize');
            const s_parse = phaseStats('parse');
            const s_plan = phaseStats('plan');
            const s_index = phaseStats(['indexScan','primaryScan','primaryScan.GSI']);
            const s_fetch = phaseStats('fetch');
            const s_join = phaseStats(['hashJoin','nestedLoopJoin']);
            const s_nest = phaseStats(['nest','unnest']);
            const s_filter = phaseStats('filter');
            const s_group = phaseStats(['group','aggregate']);
            const s_sort = phaseStats('sort');
            const s_limit = phaseStats('limit');
            const s_project = phaseStats('project');
            const s_delete = phaseStats('delete');
            const s_update = phaseStats('update');
            const s_insert = phaseStats('insert');
            const s_stream = phaseStats('stream');

            const avgPhaseTimeline = [
                { id: 'authorize', label: TEXT_CONSTANTS.PHASE_AUTHORIZE || 'authorize', avgMs: s_authorize.avg, minMs: s_authorize.min, maxMs: s_authorize.max },
                { id: 'parse', label: TEXT_CONSTANTS.PHASE_PARSE, avgMs: s_parse.avg, minMs: s_parse.min, maxMs: s_parse.max },
                { id: 'plan', label: TEXT_CONSTANTS.PHASE_PLAN, avgMs: s_plan.avg, minMs: s_plan.min, maxMs: s_plan.max },
                { id: 'indexScan', label: TEXT_CONSTANTS.PHASE_INDEX_SCAN || 'index scan', avgMs: s_index.avg, minMs: s_index.min, maxMs: s_index.max },
                { id: 'fetch', label: TEXT_CONSTANTS.PHASE_FETCH || 'fetch data', avgMs: s_fetch.avg, minMs: s_fetch.min, maxMs: s_fetch.max },
                { id: 'join', label: TEXT_CONSTANTS.PHASE_JOIN || 'JOIN', avgMs: s_join.avg, minMs: s_join.min, maxMs: s_join.max },
                { id: 'nest', label: TEXT_CONSTANTS.PHASE_NEST || 'Nest/Unnest', avgMs: s_nest.avg, minMs: s_nest.min, maxMs: s_nest.max },
                { id: 'filter', label: TEXT_CONSTANTS.PHASE_FILTER, avgMs: s_filter.avg, minMs: s_filter.min, maxMs: s_filter.max },
                { id: 'groupAgg', label: TEXT_CONSTANTS.PHASE_GROUP_AGG, avgMs: s_group.avg, minMs: s_group.min, maxMs: s_group.max },
                { id: 'sort', label: TEXT_CONSTANTS.PHASE_SORT, avgMs: s_sort.avg, minMs: s_sort.min, maxMs: s_sort.max },
                { id: 'limit', label: TEXT_CONSTANTS.PHASE_LIMIT || 'limit', avgMs: s_limit.avg, minMs: s_limit.min, maxMs: s_limit.max },
                { id: 'project', label: TEXT_CONSTANTS.PHASE_PROJECT, avgMs: s_project.avg, minMs: s_project.min, maxMs: s_project.max },
                { id: 'delete', label: TEXT_CONSTANTS.PHASE_DELETE || 'DELETE', avgMs: s_delete.avg, minMs: s_delete.min, maxMs: s_delete.max },
                { id: 'update', label: TEXT_CONSTANTS.PHASE_UPDATE || 'UPDATE', avgMs: s_update.avg, minMs: s_update.min, maxMs: s_update.max },
                { id: 'insert', label: TEXT_CONSTANTS.PHASE_INSERT || 'INSERT', avgMs: s_insert.avg, minMs: s_insert.min, maxMs: s_insert.max },
                { id: 'stream', label: TEXT_CONSTANTS.PHASE_STREAM || 'return results', avgMs: s_stream.avg, minMs: s_stream.min, maxMs: s_stream.max },
            ].filter(p => p.avgMs > 0);

            return {
                normalized_statement,
                user_query_counts,
                total_count,
                min_duration_in_seconds: min_duration,
                max_duration_in_seconds: max_duration,
                avg_duration_in_seconds: avg_duration,
                median_duration_in_seconds: median_duration,
                avg_fetch: Math.round(avg_fetch),
                avg_primaryScan: Math.round(avg_primaryScan),
                avg_indexScan: Math.round(avg_indexScan),
                avg_resultCount: Math.round(avg_resultCount),
                avg_resultSize: Math.round(avg_resultSize),
                status_counts,
                // for chart rendering on row click
                avgPhaseTimeline
            };
        }

        // Column Configuration for Analysis (Query Groups) Table
        const ANALYSIS_COLUMNS = [
            {
                id: 'total_count',
                header: 'total count',
                dataField: 'total_count',
                sortable: true,
                sortType: 'numeric',
                getValue: (group) => group.total_count,
                render: (value) => {
                    const numValue = Number(value);
                    if (!isNaN(numValue)) {
                        if (numValue > 999999) {
                            return "999K+";
                        } else {
                            return numValue.toLocaleString();
                        }
                    }
                    return value;
                }
            },
            {
                id: 'min_duration_in_seconds',
                header: 'min duration (mm:ss.sss)',
                dataField: 'min_duration_in_seconds',
                sortable: true,
                sortType: 'time',
                getValue: (group) => {
                    return isNaN(group.min_duration_in_seconds)
                        ? "N/A"
                        : formatTime(Number(group.min_duration_in_seconds) * 1000);
                },
                render: (value) => value
            },
            {
                id: 'max_duration_in_seconds',
                header: 'max duration (mm:ss.sss)',
                dataField: 'max_duration_in_seconds',
                sortable: true,
                sortType: 'time',
                getValue: (group) => {
                    return isNaN(group.max_duration_in_seconds)
                        ? "N/A"
                        : formatTime(Number(group.max_duration_in_seconds) * 1000);
                },
                render: (value) => value
            },
            {
                id: 'avg_duration_in_seconds',
                header: 'avg duration (mm:ss.sss)',
                dataField: 'avg_duration_in_seconds',
                sortable: true,
                sortType: 'time',
                getValue: (group) => {
                    return isNaN(group.avg_duration_in_seconds)
                        ? "N/A"
                        : formatTime(Number(group.avg_duration_in_seconds) * 1000);
                },
                render: (value) => value
            },
            {
                id: 'median_duration_in_seconds',
                header: 'median duration (mm:ss.sss)',
                dataField: 'median_duration_in_seconds',
                sortable: true,
                sortType: 'time',
                getValue: (group) => {
                    return isNaN(group.median_duration_in_seconds)
                        ? "N/A"
                        : formatTime(Number(group.median_duration_in_seconds) * 1000);
                },
                render: (value) => value
            },
            {
                id: 'avg_resultCount',
                header: 'avg resultCount',
                dataField: 'avg_resultCount',
                sortable: true,
                sortType: 'numeric',
                getValue: (group) => {
                    return isNaN(group.avg_resultCount) ? "N/A" : Number(group.avg_resultCount).toLocaleString();
                },
                render: (value) => value
            },
            {
                id: 'avg_resultSize',
                header: 'avg resultSize',
                dataField: 'avg_resultSize',
                sortable: true,
                sortType: 'numeric',
                getValue: (group) => {
                    return isNaN(group.avg_resultSize) ? "N/A" : Number(group.avg_resultSize).toLocaleString();
                },
                render: (value) => value
            },
            {
                id: 'avg_fetch',
                header: 'avg docsFetch',
                dataField: 'avg_fetch',
                sortable: true,
                sortType: 'numeric',
                getValue: (group) => {
                    return isNaN(group.avg_fetch) ? "N/A" : Number(group.avg_fetch).toLocaleString();
                },
                render: (value) => value
            },
            {
                id: 'avg_primaryScan',
                header: 'avg primaryScan',
                dataField: 'avg_primaryScan',
                sortable: true,
                sortType: 'numeric',
                getValue: (group) => {
                    return isNaN(group.avg_primaryScan) ? "N/A" : Number(group.avg_primaryScan).toLocaleString();
                },
                render: (value, td) => {
                    const cleanValue = String(value).replace(/,/g, '');
                    const originalValue = Number(cleanValue);
                    if (!isNaN(originalValue) && originalValue > 0) {
                        td.classList.add("primary-scan-yes");
                    }
                    return value;
                }
            },
            {
                id: 'avg_indexScan',
                header: 'avg indexScan',
                dataField: 'avg_indexScan',
                sortable: true,
                sortType: 'numeric',
                getValue: (group) => {
                    return isNaN(group.avg_indexScan) ? "N/A" : Number(group.avg_indexScan).toLocaleString();
                },
                render: (value) => value
            },
            {
                id: 'status_counts',
                header: null, // Will be set dynamically from TEXT_CONSTANTS.STATE_FATAL
                dataField: 'status_counts',
                sortable: true,
                sortType: 'numeric',
                getValue: (group) => {
                    const counts = group.status_counts;
                    return counts.fatal;
                },
                render: (value) => {
                    if (value > 0) {
                        return `<span class="fatal-count">${value}</span>`;
                    }
                    return value;
                }
            },
            {
                id: 'normalized_statement',
                header: 'normalized statement',
                dataField: 'normalized_statement',
                width: '300px',
                sortable: true,
                sortType: 'string',
                getValue: (group) => group.normalized_statement || "N/A",
                render: (value, td, rowData, index) => {
                    const statement = value || "";
                    const statementId = `analysis-statement-${index}`;
                    const preparedSample = (rowData && rowData.preparedSample) ? String(rowData.preparedSample) : "";
                    const preparedSnippet = preparedSample 
                        ? `<div style="margin-top:6px; color:#555; font-size:12px;"><strong>${TEXT_CONSTANTS.PREPARED_TEXT || 'Prepared:'}</strong> ${escapeHtml(preparedSample.substring(0, 300))}${preparedSample.length > 300 ? '...' : ''}</div>` 
                        : '';

                    analysisStatementStore[statementId] = statement;

                    if (statement.length > 500) {
                        const truncated = statement.substring(0, 500);
                        return `
                            <div id="${statementId}-truncated">
                                <span>${truncated}...</span>
                                ${preparedSnippet}
                                <br>
                                <button onclick="toggleAnalysisStatement('${statementId}', true)" 
                                        class="btn-standard" style="margin-top: 5px; margin-right: 5px;">${TEXT_CONSTANTS.SHOW_MORE}</button>
                                <button onclick="copyAnalysisStatement('${statementId}', event)" 
                                        class="btn-standard" style="margin-top: 5px;">${TEXT_CONSTANTS.COPY}</button>
                            </div>
                            <div id="${statementId}-full" style="display: none;">
                                <span>${statement}</span>
                                ${preparedSnippet}
                                <br>
                                <button onclick="toggleAnalysisStatement('${statementId}', false)" 
                                        class="btn-standard" style="margin-top: 5px; margin-right: 5px;">${TEXT_CONSTANTS.HIDE}</button>
                                <button onclick="copyAnalysisStatement('${statementId}', event)" 
                                        class="btn-standard" style="margin-top: 5px;">${TEXT_CONSTANTS.COPY}</button>
                            </div>
                        `;
                    } else {
                        return `
                            <div>
                                <span>${statement}</span>
                                ${preparedSnippet}
                                <br>
                                <button onclick="copyAnalysisStatement('${statementId}', event)" 
                                        class="btn-standard" style="margin-top: 5px;">${TEXT_CONSTANTS.COPY}</button>
                            </div>
                        `;
                    }
                }
            },
            {
                id: 'user_query_counts',
                header: null, // Will be set dynamically from TEXT_CONSTANTS.USER_COUNT
                dataField: 'user_query_counts',
                sortable: true,
                sortType: 'string',
                getValue: (group) => {
                    return Object.entries(group.user_query_counts)
                        .map(([user, count]) => `${user}: (${count})`)
                        .join(", ");
                },
                render: (value) => {
                    // Bold the counts in parentheses
                    return value.replace(/\((\d+)\)/g, "<b>($1)</b>");
                }
            }
        ];

        // Generate analysis table based on SQL++ query logic

        // Populate Analysis table body
        function populateAnalysisTable(data) {
            const analysisTableBody = document.getElementById(
                "analysis-table-body"
            );
            analysisTableBody.innerHTML = "";

            // Clear statement store for new data
            analysisStatementStore = {};

            // Use DocumentFragment for smooth table rendering with batching
            const batchSize = 50; // Process rows in batches for large datasets
            const fragment = document.createDocumentFragment();


            // Start batch processing if we have data
            if (data.length > 0) {
                processBatch(0);
            }
        }

        // ============================================================
        // PERFORMANCE UTILITIES MODULE (Optimization Step 3)
        // Throttle and debounce functions for performance optimization
        // ============================================================
        const PerformanceUtils = {
            // Throttle: Limits function calls to once per wait period
            // Good for: scroll, resize, mousemove, pan/zoom handlers
            throttle(func, wait) {
                let inThrottle;
                return function(...args) {
                    if (!inThrottle) {
                        func.apply(this, args);
                        inThrottle = true;
                        setTimeout(() => inThrottle = false, wait);
                    }
                };
            },

            // Debounce: Delays function execution until wait period after last call
            // Good for: search input, form validation
            debounce(func, wait) {
                let timeout;
                return function(...args) {
                    clearTimeout(timeout);
                    timeout = setTimeout(() => func.apply(this, args), wait);
                };
            }
        };

        // ============================================================
        // CHART TIME UTILITIES MODULE (Optimization Step 2a)
        // Consolidated time-related chart helper functions
        // ============================================================
        const ChartTimeUtils = {
            // Get time grouping setting from dropdown
            getTimeGrouping() {
                const dropdown = document.getElementById('time-grouping-select');
                return dropdown ? dropdown.value : "optimizer";
            },

            // Automatically determine optimal time unit based on data span
            getOptimalTimeUnit(requests) {
                if (!requests || requests.length === 0) return "minute";

                const times = requests
                    .map((r) => getChartDate(r.requestTime))
                    .filter((t) => !isNaN(t));
                if (times.length === 0) return "minute";

                const minTime = Math.min(...times);
                const maxTime = Math.max(...times);
                const timeSpanMs = maxTime - minTime;
                const timeSpanHours = timeSpanMs / (1000 * 60 * 60);
                const timeSpanDays = timeSpanHours / 24;

                // Choose time unit based on span to keep Chart.js happy
                if (timeSpanDays > 365) return "year";
                if (timeSpanDays > 60) return "month";
                if (timeSpanDays > 14) return "week";
                if (timeSpanDays > 2) return "day";
                if (timeSpanHours > 2) return "hour";
                if (timeSpanHours > 0.1) return "minute";
                return "second";
            },

            // Round timestamp based on grouping and optimal unit
            roundTimestamp(timestamp, grouping, requests) {
                // Create cache key for this specific timestamp+grouping combination
                const cacheKey = `${timestamp.getTime()}-${grouping}`;
                if (timestampRoundingCache.has(cacheKey)) {
                    return timestampRoundingCache.get(cacheKey);
                }

                const date = new Date(timestamp);

                // Determine actual unit to use with caching
                let actualUnit;
                if (grouping === "optimizer") {
                    // Cache the optimal unit per request array to avoid repeated analysis
                    if (timeUnitCache.has(requests)) {
                        actualUnit = timeUnitCache.get(requests);
                    } else {
                        actualUnit = this.getOptimalTimeUnit(requests);
                        timeUnitCache.set(requests, actualUnit);
                    }
                } else {
                    // Use exactly what the user selected
                    actualUnit = grouping;
                }

                // Round based on actual unit
                switch (actualUnit) {
                    case "second":
                        date.setMilliseconds(0);
                        break;
                    case "5min":
                        const minutes5 = Math.floor(date.getMinutes() / 5) * 5;
                        date.setMinutes(minutes5, 0, 0);
                        break;
                    case "minute":
                        date.setSeconds(0, 0);
                        break;
                    case "hour":
                        date.setMinutes(0, 0, 0);
                        break;
                    case "day":
                        date.setHours(0, 0, 0, 0);
                        break;
                    case "week":
                        const dayOfWeek = date.getDay();
                        date.setDate(date.getDate() - dayOfWeek);
                        date.setHours(0, 0, 0, 0);
                        break;
                    case "month":
                        date.setDate(1);
                        date.setHours(0, 0, 0, 0);
                        break;
                    case "year":
                        date.setMonth(0, 1);
                        date.setHours(0, 0, 0, 0);
                        break;
                    default:
                        date.setSeconds(0, 0);
                }

                // Cache the result with size limit (Step 9)
                if (timestampRoundingCache.size >= CACHE_LIMITS.timestampRounding) {
                    // Clear oldest 20% when limit reached
                    const keysToDelete = Array.from(timestampRoundingCache.keys())
                        .slice(0, Math.floor(CACHE_LIMITS.timestampRounding * 0.2));
                    keysToDelete.forEach(key => timestampRoundingCache.delete(key));
                }
                timestampRoundingCache.set(cacheKey, date);
                return date;
            },

            // Get all timeline buckets from requests (Issue #148 - ensures charts share same x-axis)
            getTimelineBucketsFromRequests(requests, grouping) {
                const seen = new Set();
                for (const r of requests) {
                    const dt = this.roundTimestamp(getChartDate(r.requestTime), grouping, requests);
                    seen.add(dt.toISOString());
                }
                return Array.from(seen)
                    .map(s => new Date(s))
                    .sort((a, b) => a - b);
            }
        };

        // Backward compatibility - keep original function names as aliases
        const getTimeGrouping = () => ChartTimeUtils.getTimeGrouping();
        const getOptimalTimeUnit = (requests) => ChartTimeUtils.getOptimalTimeUnit(requests);
        const roundTimestamp = (timestamp, grouping, requests) => ChartTimeUtils.roundTimestamp(timestamp, grouping, requests);
        const getTimelineBucketsFromRequests = (requests, grouping) => ChartTimeUtils.getTimelineBucketsFromRequests(requests, grouping);

        // ============================================================
        // THROTTLED FUNCTION WRAPPERS (Optimization Step 3)
        // Created after PerformanceUtils is defined
        // ============================================================
        // Throttled version of syncChartZoom for onPan/onZoom handlers
        // Reduces calls from ~60/sec to ~10/sec during pan/zoom operations
        const syncChartZoomThrottled = PerformanceUtils.throttle(syncChartZoom, 100);

// Render horizontal bar chart for Query Groups using avgPhaseTimeline (with specific row ordering)
function renderQueryGroupPhaseTimesChart(group) {
            try {
                const titleEl = document.getElementById('query-group-phase-times-title');
                const subtitleEl = document.getElementById('query-group-phase-times-subtitle');
                const canvas = document.getElementById('query-group-phase-times-chart');
                const noteEl = document.getElementById('query-group-phase-times-note');
                if (!canvas) return;

                if (titleEl) titleEl.textContent = TEXT_CONSTANTS.QUERY_GROUP_PHASE_TIMES_TITLE || 'Phase Times by Query Group (avg)';
                if (subtitleEl && TEXT_CONSTANTS.PHASE_TIMELINE_NOTE) subtitleEl.textContent = TEXT_CONSTANTS.PHASE_TIMELINE_NOTE;
                if (noteEl && TEXT_CONSTANTS.PHASE_TIMELINE_NOTE) noteEl.textContent = TEXT_CONSTANTS.PHASE_TIMELINE_NOTE;

                const ctx = canvas.getContext('2d');
                if (window.queryGroupPhaseTimesChart) {
                    window.queryGroupPhaseTimesChart.destroy();
                }

                const phases = Array.isArray(group.avgPhaseTimeline) ? group.avgPhaseTimeline : [];
                const findStats = (id) => phases.find(p => p.id === id) || { avgMs: 0, minMs: 0, maxMs: 0 };

                // Stats per phase (avg/min/max in ms)
                const authStats    = findStats('authorize');
                const parseStats   = findStats('parse');
                const planStats    = findStats('plan');
                const indexStats   = findStats('indexScan');
                const fetchStats   = findStats('fetch');
                const joinStats    = findStats('join');
                const filterStats  = findStats('filter');
                const nestStats    = findStats('nest');
                const groupStats   = findStats('groupAgg');
                const sortStats    = findStats('sort');
                const limitStats   = findStats('limit');
                const projectStats = findStats('project');
                const deleteStats  = findStats('delete');
                const updateStats  = findStats('update');
                const insertStats  = findStats('insert');
                const streamStats  = findStats('stream');

                // Dynamically build rows (top-down order) and include only if data exists
                const rows = [
                    { key: 'authorize',    label: TEXT_CONSTANTS.PHASE_AUTHORIZE,                         include: !!authStats.avgMs },
                    { key: 'parsePlan',    label: `Parse & Plan`,                                       include: !!parseStats.avgMs || !!planStats.avgMs },
                    { key: 'scanFetch',    label: `Index Scan / Doc Fetch`,                             include: !!indexStats.avgMs || !!fetchStats.avgMs },
                    { key: 'join',         label: TEXT_CONSTANTS.PHASE_JOIN || 'JOIN',                  include: !!joinStats.avgMs },
                    { key: 'nest',         label: TEXT_CONSTANTS.PHASE_NEST || 'Nest/Unnest',           include: !!nestStats.avgMs },
                    { key: 'filter',       label: TEXT_CONSTANTS.PHASE_FILTER,                          include: !!filterStats.avgMs },
                    { key: 'groupAgg',     label: TEXT_CONSTANTS.PHASE_GROUP_AGG,                       include: !!groupStats.avgMs },
                    { key: 'sort',         label: TEXT_CONSTANTS.PHASE_SORT,                            include: !!sortStats.avgMs },
                    { key: 'limit',        label: TEXT_CONSTANTS.PHASE_LIMIT,                           include: !!limitStats.avgMs },
                    { key: 'project',      label: TEXT_CONSTANTS.PHASE_PROJECT,                         include: !!projectStats.avgMs },
                    { key: 'delete',       label: TEXT_CONSTANTS.PHASE_DELETE || 'DELETE',              include: !!deleteStats.avgMs },
                    { key: 'update',       label: TEXT_CONSTANTS.PHASE_UPDATE || 'UPDATE',              include: !!updateStats.avgMs },
                    { key: 'insert',       label: TEXT_CONSTANTS.PHASE_INSERT || 'INSERT',              include: !!insertStats.avgMs },
                    { key: 'stream',       label: TEXT_CONSTANTS.PHASE_STREAM,                          include: !!streamStats.avgMs },
                ];
                const activeRows = rows.filter(r => r.include);
                const labels = activeRows.map(r => r.label);
                const rowIndex = Object.fromEntries(activeRows.map((r, i) => [r.key, i]));

                // Dynamically size chart height based on row count and bar thickness (set parent height for Chart.js sizing)
                try {
                    const barPx = 26; // close to maxBarThickness used elsewhere
                    const rowPadding = 28; // tick + grid spacing
                    const base = 140; // extra space for axes/labels
                    const targetHeight = Math.max(base + labels.length * (barPx + rowPadding), 300);
                    const scaled = Math.max(280, Math.round(targetHeight * 0.75)); // reduce by ~25%
                    const parent = canvas.parentElement; // Chart.js reads parent container size
                    if (parent) parent.style.height = `${scaled}px`;
                    // Also set the canvas as a fallback
                    canvas.style.height = `${scaled}px`;
                } catch (e) { /* no-op */ }

                // Compute sequential offsets. Row 2: parse then plan (in series). Row 3: scan/fetch concurrent.
                let t = 0;
                const authBar    = authStats.avgMs   > 0 ? [t, (t += authStats.avgMs)]      : null;
                const row2Start  = t;
                const parseBar   = parseStats.avgMs  > 0 ? [t, (t += parseStats.avgMs)]     : null;
                const planBar    = planStats.avgMs   > 0 ? [t, (t += planStats.avgMs)]      : null;

                const row3Start  = t; // concurrency start for Index Scan / Fetch
                const scanBar    = indexStats.avgMs  > 0 ? [row3Start, row3Start + indexStats.avgMs] : null;
                // Adjust Doc Fetch to end no earlier than Index Scan if scan is longer.
                let fetchBar = null;
                if (fetchStats.avgMs > 0) {
                    const intrinsicEnd = row3Start + fetchStats.avgMs;
                    const scanEnd = scanBar ? scanBar[1] : intrinsicEnd;
                    const fetchEnd = Math.max(intrinsicEnd, scanEnd);
                    const fetchStart = Math.max(0, fetchEnd - fetchStats.avgMs);
                    fetchBar = [fetchStart, fetchEnd];
                }
                t = Math.max(scanBar ? scanBar[1] : row3Start, fetchBar ? fetchBar[1] : row3Start);

                const joinBar    = joinStats.avgMs   > 0 ? [t, (t += joinStats.avgMs)]      : null;
                // Nest/Unnest bar placement: same policy as Filter
                // - Preserve the average duration as the bar width.
                // - Align END to later of scan/fetch end or its own intrinsic end.
                // - START = end - avg.
                let nestBar = null;
                if (nestStats.avgMs > 0) {
                    const concurrentStart = row3Start;
                    const scanEnd = scanBar ? scanBar[1] : concurrentStart;
                    const fetchEnd = fetchBar ? fetchBar[1] : concurrentStart;
                    const concurrentEnd = Math.max(scanEnd, fetchEnd);
                    const intrinsicEnd = concurrentStart + nestStats.avgMs;
                    const end = Math.max(concurrentEnd, intrinsicEnd);
                    const start = Math.max(0, end - nestStats.avgMs);
                    nestBar = [start, end];
                }

                // Filter bar placement:
                // - Preserve the average duration as the bar width (visual focus on avg time).
                // - Align the bar END to the later of scan/fetch end or its own intrinsic end.
                // - The START is computed as end - avg (does not need to begin with scan/fetch).
                let filterBar = null;
                if (filterStats.avgMs > 0) {
                    const concurrentStart = row3Start;
                    const scanEnd = scanBar ? scanBar[1] : concurrentStart;
                    const fetchEnd = fetchBar ? fetchBar[1] : concurrentStart;
                    const concurrentEnd = Math.max(scanEnd, fetchEnd);
                    const intrinsicEnd = concurrentStart + filterStats.avgMs;
                    const filterEnd = Math.max(concurrentEnd, intrinsicEnd);
                    const filterStart = Math.max(0, filterEnd - filterStats.avgMs);
                    filterBar = [filterStart, filterEnd];
                }
                const groupBar   = groupStats.avgMs  > 0 ? [t, (t += groupStats.avgMs)]     : null;
                const sortBar    = sortStats.avgMs   > 0 ? [t, (t += sortStats.avgMs)]      : null;
                const limitBar   = limitStats.avgMs  > 0 ? [t, (t += limitStats.avgMs)]     : null;
                // Project must occur after Nest/Unnest and Filter (and sequential phases like Group/Sort/Limit).
                // Start Project at the later of: sequential time 't', Filter end, and Nest/Unnest end.
                let projectBar = null;
                if (projectStats.avgMs > 0) {
                    const prevEnd = Math.max(
                        t,
                        filterBar ? filterBar[1] : 0,
                        nestBar ? nestBar[1] : 0
                    );
                    const projectStart = prevEnd;
                    const projectEnd = projectStart + projectStats.avgMs;
                    projectBar = [projectStart, projectEnd];
                }
                const deleteBar  = deleteStats.avgMs > 0 ? [t, (t += deleteStats.avgMs)]     : null;
                const updateBar  = updateStats.avgMs > 0 ? [t, (t += updateStats.avgMs)]     : null;
                const insertBar  = insertStats.avgMs > 0 ? [t, (t += insertStats.avgMs)]     : null;
                // Stream should be the final step: start at the latest end among all other phases
                let streamBar = null;
                if (streamStats.avgMs > 0) {
                const otherEnds = [authBar, parseBar, planBar, scanBar, fetchBar, joinBar, nestBar, filterBar, groupBar, sortBar, limitBar, projectBar, deleteBar, updateBar, insertBar]
                .filter(Boolean)
                .map(b => b[1]);
                const streamStart = otherEnds.length ? Math.max(...otherEnds) : t;
                const streamEnd = streamStart + streamStats.avgMs;
                streamBar = [streamStart, streamEnd];
                }

                // Helper to place a bar on a specific row index
                function mkDataForRow(bar, rowIndex) {
                    return labels.map((_, i) => (i === rowIndex ? bar : null));
                }

                // Build datasets; one dataset per segment. Attach phaseId for tooltip stats.
                const datasets = [];
                if (authBar && rowIndex.authorize !== undefined)
                    datasets.push({ label: TEXT_CONSTANTS.PHASE_AUTHORIZE, phaseId: 'authorize', data: mkDataForRow(authBar, rowIndex.authorize), backgroundColor: 'rgba(102, 126, 234, 0.35)', borderColor: 'rgba(102, 126, 234, 0.9)', borderWidth: 1, borderRadius: 4, grouped: false });
                if (parseBar && rowIndex.parsePlan !== undefined)
                    datasets.push({ label: TEXT_CONSTANTS.PHASE_PARSE,     phaseId: 'parse',     data: mkDataForRow(parseBar, rowIndex.parsePlan), backgroundColor: 'rgba(66, 133, 244, 0.35)', borderColor: 'rgba(66, 133, 244, 0.9)', borderWidth: 1, borderRadius: 4, grouped: false });
                if (planBar && rowIndex.parsePlan !== undefined)
                    datasets.push({ label: TEXT_CONSTANTS.PHASE_PLAN,      phaseId: 'plan',      data: mkDataForRow(planBar,  rowIndex.parsePlan), backgroundColor: 'rgba(66, 133, 244, 0.25)', borderColor: 'rgba(66, 133, 244, 0.8)', borderWidth: 1, borderRadius: 4, grouped: false });
                if (scanBar && rowIndex.scanFetch !== undefined)
                    datasets.push({ label: TEXT_CONSTANTS.PHASE_INDEX_SCAN,phaseId: 'indexScan', data: mkDataForRow(scanBar,  rowIndex.scanFetch), backgroundColor: 'rgba(40, 167, 69, 0.35)',  borderColor: 'rgba(40, 167, 69, 0.9)',  borderWidth: 1, borderRadius: 4, barThickness: 10, categoryPercentage: 0.5, barPercentage: 0.5 });
                if (fetchBar && rowIndex.scanFetch !== undefined)
                    datasets.push({ label: TEXT_CONSTANTS.PHASE_FETCH,     phaseId: 'fetch',     data: mkDataForRow(fetchBar, rowIndex.scanFetch), backgroundColor: 'rgba(220, 53, 69, 0.30)',  borderColor: 'rgba(220, 53, 69, 0.9)',  borderWidth: 1, borderRadius: 4, barThickness: 10, categoryPercentage: 0.5, barPercentage: 0.5 });
                if (joinBar && rowIndex.join !== undefined)
                    datasets.push({ label: TEXT_CONSTANTS.PHASE_JOIN || 'JOIN', phaseId: 'join',  data: mkDataForRow(joinBar, rowIndex.join), backgroundColor: 'rgba(255, 159, 64, 0.35)', borderColor: 'rgba(255, 159, 64, 0.9)', borderWidth: 1, borderRadius: 4, grouped: false });
                if (nestBar && rowIndex.nest !== undefined)
                    datasets.push({ label: TEXT_CONSTANTS.PHASE_NEST || 'Nest/Unnest', phaseId: 'nest', data: mkDataForRow(nestBar,rowIndex.nest), backgroundColor: 'rgba(121, 85, 72, 0.35)',   borderColor: 'rgba(121, 85, 72, 0.9)',   borderWidth: 1, borderRadius: 4, grouped: false });
                if (filterBar && rowIndex.filter !== undefined)
                    datasets.push({ label: TEXT_CONSTANTS.PHASE_FILTER,    phaseId: 'filter',    data: mkDataForRow(filterBar,rowIndex.filter), backgroundColor: 'rgba(255, 193, 7, 0.30)',   borderColor: 'rgba(255, 193, 7, 0.9)',   borderWidth: 1, borderRadius: 4, grouped: false });
                if (groupBar && rowIndex.groupAgg !== undefined)
                    datasets.push({ label: TEXT_CONSTANTS.PHASE_GROUP_AGG, phaseId: 'groupAgg',  data: mkDataForRow(groupBar, rowIndex.groupAgg), backgroundColor: 'rgba(23, 162, 184, 0.30)',  borderColor: 'rgba(23, 162, 184, 0.9)', borderWidth: 1, borderRadius: 4, grouped: false });
                if (sortBar && rowIndex.sort !== undefined)
                    datasets.push({ label: TEXT_CONSTANTS.PHASE_SORT,      phaseId: 'sort',      data: mkDataForRow(sortBar,  rowIndex.sort), backgroundColor: 'rgba(108, 117, 125, 0.30)', borderColor: 'rgba(108, 117, 125, 0.9)', borderWidth: 1, borderRadius: 4, grouped: false });
                if (limitBar && rowIndex.limit !== undefined)
                    datasets.push({ label: TEXT_CONSTANTS.PHASE_LIMIT,     phaseId: 'limit',     data: mkDataForRow(limitBar, rowIndex.limit), backgroundColor: 'rgba(153, 102, 255, 0.30)', borderColor: 'rgba(153, 102, 255, 0.9)', borderWidth: 1, borderRadius: 4, grouped: false });
                if (projectBar && rowIndex.project !== undefined)
                    datasets.push({ label: TEXT_CONSTANTS.PHASE_PROJECT,   phaseId: 'project',   data: mkDataForRow(projectBar,rowIndex.project), backgroundColor: 'rgba(255, 99, 132, 0.25)', borderColor: 'rgba(255, 99, 132, 0.9)', borderWidth: 1, borderRadius: 4, grouped: false });
                if (deleteBar && rowIndex.delete !== undefined)
                    datasets.push({ label: TEXT_CONSTANTS.PHASE_DELETE || 'DELETE', phaseId: 'delete', data: mkDataForRow(deleteBar, rowIndex.delete), backgroundColor: 'rgba(200, 35, 51, 0.35)', borderColor: 'rgba(200, 35, 51, 0.9)', borderWidth: 1, borderRadius: 4, grouped: false });
                if (updateBar && rowIndex.update !== undefined)
                    datasets.push({ label: TEXT_CONSTANTS.PHASE_UPDATE || 'UPDATE', phaseId: 'update', data: mkDataForRow(updateBar, rowIndex.update), backgroundColor: 'rgba(0, 150, 136, 0.35)', borderColor: 'rgba(0, 150, 136, 0.9)', borderWidth: 1, borderRadius: 4, grouped: false });
                if (insertBar && rowIndex.insert !== undefined)
                    datasets.push({ label: TEXT_CONSTANTS.PHASE_INSERT || 'INSERT', phaseId: 'insert', data: mkDataForRow(insertBar, rowIndex.insert), backgroundColor: 'rgba(156, 39, 176, 0.35)', borderColor: 'rgba(156, 39, 176, 0.9)', borderWidth: 1, borderRadius: 4, grouped: false });
                if (streamBar && rowIndex.stream !== undefined)
                    datasets.push({ label: TEXT_CONSTANTS.PHASE_STREAM,    phaseId: 'stream',    data: mkDataForRow(streamBar,rowIndex.stream), backgroundColor: 'rgba(0, 123, 255, 0.20)',  borderColor: 'rgba(0, 123, 255, 0.8)',  borderWidth: 1, borderRadius: 4, grouped: false });

                // Inline plugin to draw avg time labels at end of each bar
                const valueLabelPlugin = {
                    id: 'queryGroupBarValueLabels',
                    afterDatasetsDraw(chart, args, plgOpts) {
                        const { ctx, chartArea } = chart;
                        ctx.save();
                        ctx.fillStyle = '#000';
                        ctx.font = 'bold 14px Arial';
                        ctx.textAlign = 'left';
                        ctx.textBaseline = 'middle';
                        chart.data.datasets.forEach((ds, di) => {
                            const meta = chart.getDatasetMeta(di);
                            if (!meta || meta.hidden) return;
                            const statsForDs = (phaseId) => findStats(phaseId || '');
                            meta.data.forEach((bar, i) => {
                                const raw = ds.data[i];
                                if (!raw || !Array.isArray(raw)) return;
                                const stats = statsForDs(ds.phaseId);
                                const avgMs = (stats && stats.avgMs) ? stats.avgMs : 0;
                                if (!avgMs) return;
                                const label = formatTime(avgMs);
                                const x = Math.max(bar.x, bar.base) + 6;
                                const y = bar.y;
                                const drawX = Math.min(x, chartArea.right - 4);
                                ctx.fillText(label, drawX, y);
                            });
                        });
                        ctx.restore();
                    }
                };

                window.queryGroupPhaseTimesChart = new Chart(ctx, {
                    type: 'bar',
                    data: { labels, datasets },
                    plugins: [valueLabelPlugin],
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        indexAxis: 'y',
                        layout: { padding: { bottom: 20, top: 0, left: 0, right: 10 } },
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                callbacks: {
                                    label: (ctx) => {
                                        const val = ctx.raw;
                                        const dur = (Array.isArray(val) ? (val[1] - val[0]) : 0);
                                        const ds = ctx.dataset || {};
                                        const phaseId = ds.phaseId || '';
                                        const stats = findStats(phaseId);
                                        const minStr = stats.minMs ? formatTime(stats.minMs) : '00:00.000';
                                        const avgStr = stats.avgMs ? formatTime(stats.avgMs) : '00:00.000';
                                        const maxStr = stats.maxMs ? formatTime(stats.maxMs) : '00:00.000';
                                        return `${ctx.dataset.label}: ${dur.toFixed(2)} ms (min ${minStr} | avg ${avgStr} | max ${maxStr})`;
                                    }
                                }
                            }
                        },
                        datasets: {
                            bar: {
                                barThickness: 20,
                                maxBarThickness: 26,
                                categoryPercentage: 0.9,
                                barPercentage: 0.9,
                            }
                        },
                        scales: {
                            x: {
                                stacked: false,
                                title: { display: true, text: TEXT_CONSTANTS.AXIS_TIME_MS },
                            },
                            y: {
                                stacked: false,
                                offset: true,
                                title: { display: false }
                            }
                        }
                    }
                });
            } catch (err) {
                Logger.error('Error rendering Query Group Phase Times chart:', err);
            }
        }
        
        // Helper function to get Chart.js time configuration with auto-adjustment
        function getTimeConfig(requestedGrouping, requests) {
            // Use exactly the unit that was requested
            let actualUnit = requestedGrouping;

            // For x-axis display, let Chart.js automatically determine the best format
            // Data is already bucketed by the requested grouping via roundTimestamp()
            // This prevents Chart.js errors when trying to display too many ticks
            return {
                displayFormats: {
                    millisecond: "HH:mm:ss.SSS",
                    second: "HH:mm:ss",
                    minute: "MMM dd HH:mm",
                    hour: "MMM dd HH:mm",
                    day: "MMM dd",
                    week: "MMM dd",
                    month: "MMM yyyy",
                    quarter: "MMM yyyy",
                    year: "yyyy"
                },
                // Don't force a specific unit - let Chart.js adapt based on zoom level
                // Data decimation will handle rendering performance
            };
        }

        // Helper function to get current time config with requests data

        // Helper function to update the optimizer label

        // Array to store all timeline charts for synchronization
        const timelineCharts = [];

        // Custom plugin to draw a vertical line on hover
        const verticalLinePlugin = {
            id: 'verticalLine',
            afterInit(chart) {
                chart.verticalLine = { draw: false, x: 0 };
            },
            afterEvent(chart, args) {
                const { inChartArea, event } = args;
                if (chart.verticalLine) {
                    chart.verticalLine.draw = inChartArea;
                    chart.verticalLine.x = event ? event.x : args.x;
                    // Let Chart.js handle the redraw naturally, don't force it
                }
            },
            afterDatasetsDraw(chart) {
                if (!chart.verticalLine || !chart.verticalLine.draw || !chart.verticalLine.x) return;

                const { ctx, chartArea: { top, bottom } } = chart;
                ctx.save();
                ctx.beginPath();
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#007bff';
                ctx.setLineDash([5, 5]);
                ctx.moveTo(chart.verticalLine.x, top);
                ctx.lineTo(chart.verticalLine.x, bottom);
                ctx.stroke();
                ctx.restore();
            }
        };

        // Function to sync crosshairs across all timeline charts

        // Clear crosshairs on all timeline charts

        // Helper function to register a chart for crosshair synchronization

        // [REMOVED] generateOperationsChart - Replaced by Enhanced Database Operations chart

        // ========== Progressive Chart Loading System ==========
        // Queue system for creating charts progressively to avoid UI blocking
        const chartTasks = [];
        let drainingCharts = false;
        let totalCharts = 0;
        let completedCharts = 0;

        // ============================================================
        // CHART QUEUE OPTIMIZATION (Step 4)
        // Enhanced queue with priority and performance tracking
        // ============================================================


        // Lazy chart creation with IntersectionObserver and priority

        // Attach double-click handler and other handlers to a chart after creation

        // Reset chart loading counters
        // ========== End Progressive Chart Loading System ==========

        // Generate enhanced operations chart with detailed In/Out tracking

        // Generate filter chart showing filter efficiency (IN vs OUT)

        // Generate timeline chart showing kernel time vs execution time performance

        // Attach double-click handlers to all timeline charts
        function attachTimelineDoubleClickHandlers() {
            const charts = [
                window.filterChart,
                window.timelineChart,
                window.queryTypesChart,
                window.durationBucketsChart,
                window.memoryChart,
                window.resultCountChart,
                window.resultSizeChart,
                window.cpuTimeChart,
                window.indexScanThroughputChart,
                window.docFetchThroughputChart,
                window.docSizeBubbleChart,
                window.execVsKernelChart,
                window.execVsServChart,
                window.execVsElapsedChart,
                window.serviceTimeAnalysisLineChart,
                window.enhancedOperationsChart,
                window.collectionQueriesChart,
                window.parseDurationChart,
                window.planDurationChart,
            ];

            charts.forEach((chart) => {
                if (chart) {
                    attachDoubleClickHandler(chart);
                }
            });
        }

        // Create Query Types Scatter Plot Chart

        // Create Duration Buckets Chart

        // Create Memory Usage Chart

        // Plugin to draw horizontal dotted line at 1ms threshold
        const horizontalLinePlugin = {
            id: 'horizontalLine',
            afterDatasetsDraw(chart) {
                const { ctx, chartArea: { left, right }, scales: { y } } = chart;
                
                if (!y) return;
                
                // Get the pixel position for 3.0 on the y-axis
                // This is between "666µs-1ms" (2.5) and "1-1.3ms" (3.5)
                const yPosition = y.getPixelForValue(3.0);
                
                // Only draw if the line is within the chart area
                if (yPosition < chart.chartArea.top || yPosition > chart.chartArea.bottom) {
                    return;
                }
                
                ctx.save();
                ctx.beginPath();
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.moveTo(left, yPosition);
                ctx.lineTo(right, yPosition);
                ctx.stroke();
                ctx.setLineDash([]);
                
                // Add label
                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.font = 'bold 11px Arial';
                ctx.textAlign = 'right';
                ctx.fillText('1ms threshold', right - 5, yPosition - 5);
                
                ctx.restore();
            }
        };

        // Extract bucket.scope.collection from SQL statement
        function extractCollectionsFromSQL(sql) {
            if (!sql) return [];
            
            const collections = new Set();
            
            // Match both quoted and unquoted identifiers
            // Patterns handle: FROM `bucket`.`scope`.`collection`, FROM `bucket`, FROM bucket, etc.
            const patterns = [
                // Quoted three-part: `bucket`.`scope`.`collection`
                /(?:FROM|JOIN)\s+`([^`]+)`\.`([^`]+)`\.`([^`]+)`/gi,
                // Unquoted three-part: bucket.scope.collection
                /(?:FROM|JOIN)\s+([a-zA-Z_][a-zA-Z0-9_]*)\.([a-zA-Z_][a-zA-Z0-9_]*)\.([a-zA-Z_][a-zA-Z0-9_]*)/gi,
                // Quoted single: `bucket`
                /(?:FROM|JOIN)\s+`([^`]+)`(?:\s+(?:AS\s+)?[a-zA-Z_]|\s|,|$|WHERE|GROUP|ORDER|LIMIT|UNNEST|JOIN)/gi,
                // Unquoted single: bucket
                /(?:FROM|JOIN)\s+([a-zA-Z_][a-zA-Z0-9_]*)(?:\s+(?:AS\s+)?[a-zA-Z_]|\s|,|$|WHERE|GROUP|ORDER|LIMIT|UNNEST|JOIN)/gi
            ];
            
            patterns.forEach((pattern, patternIndex) => {
                let match;
                while ((match = pattern.exec(sql)) !== null) {
                    if (match.length === 4) {
                        // Three-part: bucket.scope.collection
                        collections.add(`${match[1]}.${match[2]}.${match[3]}`);
                    } else if (match.length === 2) {
                        // Single part: bucket only - defaults to bucket._default._default
                        collections.add(`${match[1]}._default._default`);
                    }
                }
            });
            
            return Array.from(collections);
        }

        // Create Collection Queries Chart


        // Create ECharts 3D Collection Timeline Chart (dev feature)

        // Helper function: Add camera position debug display to 3D charts
        function addCameraDebugDisplay(myChart, fullscreenChartDiv, closeBtn, chartName) {
            const urlParams = new URLSearchParams(window.location.search);
            const debugMode = urlParams.get('debug') === 'true' || urlParams.get('logLevel') === 'debug';
            
            if (!debugMode) return;
            
            // Create debug DIV
            const debugDiv = document.createElement('div');
            debugDiv.id = `camera-debug-${chartName}`;
            debugDiv.style.cssText = 'position: absolute; top: 60px; left: 10px; background: rgba(0,0,0,0.9); color: #00ff00; padding: 12px; font-family: monospace; font-size: 13px; z-index: 10002; border-radius: 4px; border: 2px solid #00ff00; box-shadow: 0 0 10px rgba(0,255,0,0.5);';
            debugDiv.innerHTML = '<strong style="color: #ffff00;">Camera Position:</strong><br/>Alpha: 0.0<br/>Beta: 0.0<br/>Distance: 0.0';
            fullscreenChartDiv.appendChild(debugDiv);
            
            // Continuously poll camera position (updates every 100ms)
            const cameraUpdateInterval = setInterval(function() {
                try {
                    const option = myChart.getOption();
                    if (option && option.grid3D && option.grid3D[0] && option.grid3D[0].viewControl) {
                        const vc = option.grid3D[0].viewControl;
                        debugDiv.innerHTML = `
                            <strong style="color: #ffff00;">Camera Position:</strong><br/>
                            Alpha: ${vc.alpha.toFixed(1)}<br/>
                            Beta: ${vc.beta.toFixed(1)}<br/>
                            Distance: ${vc.distance.toFixed(1)}
                        `;
                    }
                } catch (e) {
                    // Silently fail
                }
            }, 100);
            
            // Clean up interval when modal closes
            const originalCloseHandler = closeBtn.onclick;
            closeBtn.onclick = function() {
                clearInterval(cameraUpdateInterval);
                if (originalCloseHandler) originalCloseHandler.call(this);
            };
        }

        // Expand ECharts 3D Timeline to fullscreen
        function expandECharts3DTimeline() {
            const { data, timeBuckets, allCollections, durationBucketDefinitions, durationColors, collectionQueryCounts } = window.echartsTimelineData;
            if (!data || !allCollections) return;

            // Create modal overlay
            const overlay = document.createElement('div');
            overlay.className = 'chart-fullscreen-overlay active';
            overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 10000; display: flex; align-items: center; justify-content: center;';

            // Create modal content
            const modalContent = document.createElement('div');
            modalContent.style.cssText = 'width: 95%; height: 95%; background: white; border-radius: 8px; padding: 20px; position: relative;';

            // Create close button
            const closeBtn = document.createElement('div');
            closeBtn.className = 'chart-collapse-btn';
            closeBtn.title = 'Collapse chart';
            closeBtn.innerHTML = '✕';
            closeBtn.onclick = () => {
                document.body.removeChild(overlay);
                document.body.style.overflow = '';
            };

            // Create fullscreen chart container
            const fullscreenChartDiv = document.createElement('div');
            fullscreenChartDiv.id = 'echarts-3d-timeline-fullscreen';
            fullscreenChartDiv.style.cssText = 'width: calc(100% - 420px); height: 100%;';

            // Create controls and legend container
            const controlsContainer = document.createElement('div');
            controlsContainer.style.cssText = 'position: absolute; top: 50px; right: 20px; width: 400px; background: white; border: 1px solid #444; border-radius: 4px; padding: 10px; max-height: calc(100% - 60px); overflow-y: auto;';

            // Add toggle controls
            const togglesDiv = document.createElement('div');
            togglesDiv.style.cssText = 'margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #ddd;';
            togglesDiv.innerHTML = `
                <div style="margin-bottom: 8px;">
                    <label style="display: flex; align-items: center; cursor: pointer; font-size: 13px; font-weight: bold;">
                        <input type="checkbox" id="echarts-timeline-log-scale-toggle" style="margin-right: 8px;">
                        Log Scale Bubble Size
                    </label>
                </div>
            `;
            controlsContainer.appendChild(togglesDiv);

            // Add Duration Range Legend Section
            const durationLegendHeader = document.createElement('div');
            durationLegendHeader.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;';
            durationLegendHeader.innerHTML = `
                <strong style="font-size: 14px;">Duration Ranges:</strong>
                <div>
                    <button id="echarts-timeline-fs-show-all-durations" style="padding: 4px 12px; background: #4CAF50; color: white; border: none; border-radius: 3px; cursor: pointer; margin-right: 5px; font-size: 11px;">Show All</button>
                    <button id="echarts-timeline-fs-hide-all-durations" style="padding: 4px 12px; background: #f44336; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;">Hide All</button>
                </div>
            `;
            controlsContainer.appendChild(durationLegendHeader);

            // Calculate counts for each duration range
            const durationRangeCounts = {};
            durationBucketDefinitions.forEach((bin, idx) => {
                durationRangeCounts[bin.label] = data.filter(d => d.value[2] === idx).reduce((sum, d) => sum + d.actualCount, 0);
            });

            const durationVisibilityState = {};

            // Create duration range legend items grid
            const durationItemsGrid = document.createElement('div');
            durationItemsGrid.style.cssText = 'display: grid; grid-template-columns: 1fr; gap: 6px; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #ddd;';
            durationItemsGrid.id = 'echarts-timeline-duration-legend-items-grid';

            durationBucketDefinitions.forEach((bin, idx) => {
                const count = durationRangeCounts[bin.label];
                durationVisibilityState[idx] = true;
                
                const legendItem = document.createElement('div');
                legendItem.style.cssText = 'display: flex; align-items: center; padding: 5px; cursor: pointer; border-radius: 3px; margin-bottom: 2px; border: 1px solid #e0e0e0;';
                legendItem.dataset.durationIndex = idx;
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = true;
                checkbox.style.cssText = 'margin-right: 8px; cursor: pointer;';
                
                const colorBox = document.createElement('span');
                colorBox.style.cssText = `display: inline-block; width: 16px; height: 16px; background: ${durationColors[idx]}; margin-right: 8px; border: 1px solid #333; border-radius: 2px;`;
                
                const label = document.createElement('span');
                label.style.cssText = 'font-size: 12px; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
                label.textContent = `${bin.label} (${count} total)`;
                
                legendItem.appendChild(checkbox);
                legendItem.appendChild(colorBox);
                legendItem.appendChild(label);
                
                legendItem.onclick = (e) => {
                    if (e.target !== checkbox) {
                        checkbox.checked = !checkbox.checked;
                    }
                    durationVisibilityState[idx] = checkbox.checked;
                    legendItem.style.opacity = checkbox.checked ? '1' : '0.3';
                    updateChart();
                };
                
                durationItemsGrid.appendChild(legendItem);
            });

            controlsContainer.appendChild(durationItemsGrid);

            // Add legend header
            const legendHeader = document.createElement('div');
            legendHeader.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;';
            legendHeader.innerHTML = `
                <strong style="font-size: 14px;">Collections:</strong>
                <div>
                    <button id="echarts-timeline-fs-show-all" style="padding: 4px 12px; background: #4CAF50; color: white; border: none; border-radius: 3px; cursor: pointer; margin-right: 5px; font-size: 11px;">Show All</button>
                    <button id="echarts-timeline-fs-hide-all" style="padding: 4px 12px; background: #f44336; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;">Hide All</button>
                </div>
            `;
            controlsContainer.appendChild(legendHeader);

            // Add search input
            const searchContainer = document.createElement('div');
            searchContainer.style.cssText = 'margin-bottom: 10px;';
            searchContainer.innerHTML = `
                <input type="text" id="echarts-timeline-legend-search" placeholder="Search collections..." style="width: 100%; font-size: 11px; padding: 6px 8px; border: 1px solid #dee2e6; border-radius: 3px; box-sizing: border-box;">
            `;
            controlsContainer.appendChild(searchContainer);

            // Create legend items grid
            const itemsGrid = document.createElement('div');
            itemsGrid.style.cssText = 'display: grid; grid-template-columns: 1fr; gap: 6px;';
            itemsGrid.id = 'echarts-timeline-legend-items-grid';
            
            // Sort collections by count (descending) for legend display
            const sortedCollections = [...allCollections].sort((a, b) => {
                return collectionQueryCounts[b] - collectionQueryCounts[a];
            });

            const visibilityState = {};
            sortedCollections.forEach(collection => {
                visibilityState[collection] = true;
            });

            sortedCollections.forEach(collection => {
                const count = collectionQueryCounts[collection];
                const legendItem = document.createElement('div');
                legendItem.style.cssText = 'display: flex; align-items: center; padding: 5px; cursor: pointer; border-radius: 3px; margin-bottom: 2px; border: 1px solid #e0e0e0;';
                legendItem.dataset.collection = collection;
                
                // Checkbox
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = true;
                checkbox.style.cssText = 'margin-right: 8px; cursor: pointer;';
                
                // Collection name with count
                const label = document.createElement('span');
                label.style.cssText = 'font-size: 12px; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
                label.textContent = `[${count}] ${collection}`;
                
                legendItem.appendChild(checkbox);
                legendItem.appendChild(label);
                
                // Toggle visibility on click
                legendItem.onclick = (e) => {
                    if (e.target !== checkbox) {
                        checkbox.checked = !checkbox.checked;
                    }
                    visibilityState[collection] = checkbox.checked;
                    legendItem.style.opacity = checkbox.checked ? '1' : '0.3';
                    updateChart();
                };
                
                itemsGrid.appendChild(legendItem);
            });

            controlsContainer.appendChild(itemsGrid);

            // Assemble modal
            modalContent.appendChild(closeBtn);
            modalContent.appendChild(fullscreenChartDiv);
            modalContent.appendChild(controlsContainer);
            overlay.appendChild(modalContent);
            document.body.appendChild(overlay);
            document.body.style.overflow = 'hidden';
            
            // Sync Y-axis scale from radio buttons to 3D chart checkbox (after DOM insertion)
            const selectedScale = document.querySelector('input[name="yScale"]:checked');
            const logScaleCheckbox = document.getElementById('echarts-timeline-log-scale-toggle');
            Logger.debug('3D Timeline - selectedScale.value:', selectedScale?.value);
            Logger.debug('3D Timeline - logScaleCheckbox:', logScaleCheckbox);
            if (selectedScale && logScaleCheckbox) {
                logScaleCheckbox.checked = selectedScale.value === 'logarithmic';
                Logger.debug('3D Timeline - Set checkbox to:', selectedScale.value === 'logarithmic');
            }

            // Calculate initial bubble sizes
            const allCounts = data.map(d => d.actualCount);
            const maxCount = Math.max(...allCounts);

            function calculateBubbleSizes(useLogScale) {
                return data.map(d => {
                    const durationIdx = d.value[2];
                    if (!visibilityState[d.collection] || !durationVisibilityState[durationIdx]) return null;
                    
                    let size;
                    if (useLogScale) {
                        size = Math.max(5, Math.log10(d.actualCount + 1) * 10);
                    } else {
                        size = Math.max(5, Math.min(30, (d.actualCount / maxCount) * 30));
                    }
                    
                    return {
                        value: d.value,
                        itemStyle: d.itemStyle,
                        actualCount: d.actualCount,
                        collection: d.collection,
                        time: d.time,
                        duration: d.duration,
                        symbolSize: size
                    };
                }).filter(d => d !== null);
            }

            // Initialize fullscreen chart
            const myChart = echarts.init(fullscreenChartDiv);
            
            function updateChart() {
                const useLogScale = document.getElementById('echarts-timeline-log-scale-toggle')?.checked || false;
                const chartData = calculateBubbleSizes(useLogScale);
                
                const option = {
                    title: {
                        text: 'Query Duration Groups by Collection',
                        left: 'center',
                        top: 10,
                        textStyle: {
                            fontSize: 18,
                            fontWeight: 'bold'
                        }
                    },
                    tooltip: {
                        formatter: function(params) {
                            const d = params.data;
                            return `${d.collection}<br/>Time: ${d.time}<br/>Duration: ${d.duration}<br/>Queries: ${d.actualCount}`;
                        }
                    },
                    xAxis3D: {
                        type: 'category',
                        data: timeBuckets.map((ts, idx) => idx),
                        name: 'Request Time',
                        nameTextStyle: {
                            fontSize: 14,
                            fontWeight: 'bold'
                        },
                        axisLabel: {
                            interval: Math.max(0, Math.ceil(timeBuckets.length / 10) - 1),
                            formatter: function(value) {
                                return timeBuckets[value].toLocaleString('en-US', { month: 'short', day: 'numeric' });
                            },
                            fontSize: 10
                        }
                    },
                    yAxis3D: {
                        type: 'category',
                        data: allCollections,
                        name: 'Collection',
                        nameTextStyle: {
                            fontSize: 14,
                            fontWeight: 'bold'
                        },
                        axisLabel: {
                            interval: Math.max(0, Math.ceil(allCollections.length / 10) - 1),
                            fontSize: 10
                        }
                    },
                    zAxis3D: {
                        type: 'category',
                        data: durationBucketDefinitions.map(b => b.label),
                        name: 'Duration Range',
                        nameTextStyle: {
                            fontSize: 14,
                            fontWeight: 'bold'
                        }
                    },
                    grid3D: {
                        boxWidth: 250,
                        boxDepth: Math.min(250, allCollections.length * 7),
                        boxHeight: 150,
                        viewControl: {
                            alpha: 22.9,
                            beta: 44.6,
                            distance: 453.0,
                            minDistance: 100,
                            maxDistance: 600
                        },
                        light: {
                            main: {
                                intensity: 1.2,
                                shadow: true
                            },
                            ambient: {
                                intensity: 0.5
                            }
                        }
                    },
                    series: [{
                        type: 'scatter3D',
                        data: chartData,
                        symbolSize: function(dataItem) {
                            return dataItem.symbolSize;
                        },
                        itemStyle: {
                            opacity: 0.85
                        },
                        emphasis: {
                            itemStyle: {
                                opacity: 1
                            }
                        }
                    }]
                };

                myChart.setOption(option);
            }

            // Initial render
            updateChart();

            // Add camera debug display
            addCameraDebugDisplay(myChart, fullscreenChartDiv, closeBtn, 'timeline');

            // Duration Range Show/Hide All handlers
            document.getElementById('echarts-timeline-fs-show-all-durations').addEventListener('click', () => {
                Object.keys(durationVisibilityState).forEach(key => {
                    durationVisibilityState[key] = true;
                    const item = durationItemsGrid.querySelector(`[data-duration-index="${key}"]`);
                    if (item) {
                        item.querySelector('input').checked = true;
                        item.style.opacity = '1';
                    }
                });
                updateChart();
            });

            document.getElementById('echarts-timeline-fs-hide-all-durations').addEventListener('click', () => {
                Object.keys(durationVisibilityState).forEach(key => {
                    durationVisibilityState[key] = false;
                    const item = durationItemsGrid.querySelector(`[data-duration-index="${key}"]`);
                    if (item) {
                        item.querySelector('input').checked = false;
                        item.style.opacity = '0.3';
                    }
                });
                updateChart();
            });

            // Collection Show All button functionality
            document.getElementById('echarts-timeline-fs-show-all').addEventListener('click', () => {
                sortedCollections.forEach(collection => {
                    visibilityState[collection] = true;
                    const item = itemsGrid.querySelector(`[data-collection="${collection}"]`);
                    if (item) {
                        item.querySelector('input').checked = true;
                        item.style.opacity = '1';
                    }
                });
                updateChart();
            });

            // Hide All button functionality
            document.getElementById('echarts-timeline-fs-hide-all').addEventListener('click', () => {
                sortedCollections.forEach(collection => {
                    visibilityState[collection] = false;
                    const item = itemsGrid.querySelector(`[data-collection="${collection}"]`);
                    if (item) {
                        item.querySelector('input').checked = false;
                        item.style.opacity = '0.3';
                    }
                });
                updateChart();
            });

            // Log Scale checkbox functionality
            document.getElementById('echarts-timeline-log-scale-toggle').addEventListener('change', updateChart);

            // Search input filtering
            document.getElementById('echarts-timeline-legend-search').addEventListener('input', (e) => {
                const searchText = e.target.value.toLowerCase().trim();
                const legendItems = itemsGrid.querySelectorAll('div[data-collection]');
                
                legendItems.forEach(item => {
                    const label = item.querySelector('span');
                    const collectionText = label.textContent.toLowerCase();
                    
                    if (searchText === '' || collectionText.includes(searchText)) {
                        item.style.display = 'flex';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });

            // Close on ESC key
            const escHandler = (e) => {
                if (e.key === 'Escape') {
                    closeBtn.click();
                    document.removeEventListener('keydown', escHandler);
                }
            };
            document.addEventListener('keydown', escHandler);

            // Close on overlay click
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    closeBtn.click();
                }
            });
        }

        // Render collection legend with specified sort order
        function renderCollectionLegend(sortBy = 'queries') {
            const legendContainer = document.getElementById("collection-queries-legend-container");
            if (!legendContainer || !window.collectionDatasetsForLegend) return;
            
            const datasets = window.collectionDatasetsForLegend;
            
            // Create sticky header with show/hide buttons and sort dropdown
            let legendHTML = `
                <div style="position: sticky; top: 0; background-color: #fff; z-index: 10; padding-bottom: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #dee2e6;">
                        <div style="font-weight: bold; font-size: 14px; color: #495057;">Collections Legend</div>
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <input type="text" id="collection-search-input" placeholder="Search collections..." style="font-size: 11px; padding: 3px 8px; border: 1px solid #dee2e6; border-radius: 3px; width: 150px;" oninput="filterCollectionLegend(this.value)">
                            <button onclick="showAllCollections()" style="font-size: 11px; padding: 4px 10px; border: 1px solid #28a745; background: #28a745; color: #fff; border-radius: 3px; cursor: pointer; font-weight: 600; transition: background 0.2s;" onmouseover="this.style.background='#218838'" onmouseout="this.style.background='#28a745'">Show All</button>
                            <button onclick="hideAllCollections()" style="font-size: 11px; padding: 4px 10px; border: 1px solid #dc3545; background: #dc3545; color: #fff; border-radius: 3px; cursor: pointer; font-weight: 600; transition: background 0.2s;" onmouseover="this.style.background='#c82333'" onmouseout="this.style.background='#dc3545'">Hide All</button>
                        </div>
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <label for="collection-sort-select" style="font-size: 11px; color: #6c757d; font-weight: 600;">Sort By:</label>
                            <select id="collection-sort-select" onchange="renderCollectionLegend(this.value)" style="font-size: 11px; padding: 3px 6px; border: 1px solid #dee2e6; border-radius: 3px; background: #fff; cursor: pointer;">
                                <option value="queries" ${sortBy === 'queries' ? 'selected' : ''}>Queries</option>
                                <option value="name" ${sortBy === 'name' ? 'selected' : ''}>Name</option>
                                <option value="bucket" ${sortBy === 'bucket' ? 'selected' : ''}>Bucket</option>
                            </select>
                        </div>
                    </div>
                </div>
            `;
            
            // Sort datasets based on selection
            let sortedDatasets = [...datasets];
            if (sortBy === 'queries') {
                // Sort by total queries (descending)
                sortedDatasets.sort((a, b) => b.total - a.total);
            } else if (sortBy === 'name') {
                // Sort alphabetically by collection name
                sortedDatasets.sort((a, b) => a.label.localeCompare(b.label));
            } else if (sortBy === 'bucket') {
                // Sort by bucket.scope.collection
                sortedDatasets.sort((a, b) => {
                    const aParts = a.label.split('.');
                    const bParts = b.label.split('.');
                    
                    // Compare bucket
                    if (aParts[0] !== bParts[0]) return aParts[0].localeCompare(bParts[0]);
                    // Compare scope
                    if (aParts[1] !== bParts[1]) return aParts[1].localeCompare(bParts[1]);
                    // Compare collection
                    return aParts[2].localeCompare(bParts[2]);
                });
            }
            
            legendHTML += '<div style="display: flex; flex-direction: column; gap: 6px;">';
            
            sortedDatasets.forEach((dataset) => {
                // Find original index
                const originalIndex = datasets.indexOf(dataset);
                const color = dataset.borderColor;
                
                // Check if dataset is currently hidden
                const chart = window.collectionQueriesChart;
                const isHidden = chart && chart.getDatasetMeta(originalIndex).hidden;
                const opacity = isHidden ? '0.5' : '1';
                const textDecoration = isHidden ? 'line-through' : 'none';
                
                legendHTML += `
                    <div id="collection-legend-item-${originalIndex}" class="legend-item" data-collection-name="${dataset.label}" style="display: flex; align-items: center; cursor: pointer; padding: 6px 8px; border-radius: 4px; transition: all 0.2s; border: 1px solid transparent; opacity: ${opacity};"
                         onmouseover="this.style.backgroundColor='#f8f9fa'; this.style.borderColor='#dee2e6';"
                         onmouseout="this.style.backgroundColor='transparent'; this.style.borderColor='transparent';"
                         onclick="toggleCollectionDataset(${originalIndex})">
                        <div style="width: 24px; height: 3px; background-color: ${color}; margin-right: 10px; border-radius: 2px; flex-shrink: 0;"></div>
                        <div style="flex: 1; line-height: 1.4;">
                            <div id="collection-legend-label-${originalIndex}" style="font-weight: 600; color: #343a40; font-size: 16px; transition: text-decoration 0.2s; text-decoration: ${textDecoration};">${dataset.label}</div>
                            <div id="collection-legend-count-${originalIndex}" style="color: #6c757d; font-size: 14px; margin-top: 2px; transition: text-decoration 0.2s; text-decoration: ${textDecoration};">${dataset.total} queries</div>
                        </div>
                    </div>
                `;
            });
            
            legendHTML += '</div>';
            legendContainer.innerHTML = legendHTML;
        }

        // Toggle dataset visibility for collection queries chart

        // Show all collection datasets

        // Hide all collection datasets

        // Filter collection legend by search string
        function filterCollectionLegend(searchText) {
            const legendItems = document.querySelectorAll('#collection-queries-legend-container .legend-item');
            const searchLower = searchText.toLowerCase().trim();
            
            legendItems.forEach(item => {
                const collectionName = item.getAttribute('data-collection-name');
                if (!collectionName) return;
                
                if (searchLower === '' || collectionName.toLowerCase().includes(searchLower)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        }

        // ========================================
        // 3D Query Types Chart Functions (Issue #214)
        // ========================================

        // Create ECharts 3D Query Types Data (Scatter3D with Bubbles + Fatal X markers)
        // X-axis: Time, Y-axis: Collection, Z-axis: Avg Duration
        // Color: Statement Type, Size: Query Count

        // Expand ECharts 3D Query Types to Fullscreen Modal
        function expandECharts3DQueryTypes() {
            const { bubbleData, fatalData, timeBuckets, sortedStatementTypes, sortedCollections, colorMap, statementTypeCounts, collectionCounts } = window.echartsQueryTypesData;
            if (!bubbleData || !sortedCollections) return;
        
            // Create modal overlay
            const overlay = document.createElement('div');
            overlay.className = 'chart-fullscreen-overlay active';
            overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 10000; display: flex; align-items: center; justify-content: center;';
        
            // Create modal content
            const modalContent = document.createElement('div');
            modalContent.style.cssText = 'width: 95%; height: 95%; background: white; border-radius: 8px; padding: 20px; position: relative;';
        
            // Create close button
            const closeBtn = document.createElement('div');
            closeBtn.className = 'chart-collapse-btn';
            closeBtn.title = 'Collapse chart';
            closeBtn.innerHTML = '✕';
            closeBtn.onclick = () => {
                document.body.removeChild(overlay);
                document.body.style.overflow = '';
            };
        
            // Create fullscreen chart container
            const fullscreenChartDiv = document.createElement('div');
            fullscreenChartDiv.id = 'echarts-3d-query-types-fullscreen';
            fullscreenChartDiv.style.cssText = 'width: calc(100% - 420px); height: 100%;';
        
            // Create controls and legend container
            const controlsContainer = document.createElement('div');
            controlsContainer.style.cssText = 'position: absolute; top: 50px; right: 20px; width: 400px; background: white; border: 1px solid #444; border-radius: 4px; padding: 10px; max-height: calc(100% - 60px); overflow-y: auto;';
        
            // Add Log Scale toggle
            const togglesDiv = document.createElement('div');
            togglesDiv.style.cssText = 'margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #ddd;';
            togglesDiv.innerHTML = `
                <div style="margin-bottom: 8px;">
                    <label style="display: flex; align-items: center; cursor: pointer; font-size: 13px; font-weight: bold;">
                        <input type="checkbox" id="echarts-query-types-log-scale-toggle" style="margin-right: 8px;">
                        Log Scale Z-Axis (Avg Duration)
                    </label>
                </div>
            `;
            controlsContainer.appendChild(togglesDiv);
            
            // Add Statement Type Legend Section (from 2D chart)
            const statementTypeLegendHeader = document.createElement('div');
            statementTypeLegendHeader.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;';
            statementTypeLegendHeader.innerHTML = `
                <strong style="font-size: 14px;">Statement Types:</strong>
                <div>
                    <button id="echarts-query-types-fs-show-all-statements" style="padding: 4px 12px; background: #4CAF50; color: white; border: none; border-radius: 3px; cursor: pointer; margin-right: 5px; font-size: 11px;">Show All</button>
                    <button id="echarts-query-types-fs-hide-all-statements" style="padding: 4px 12px; background: #f44336; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;">Hide All</button>
                </div>
            `;
            controlsContainer.appendChild(statementTypeLegendHeader);
        
            const statementTypeVisibilityState = {};
        
            // Create statement type legend items grid
            const statementTypeItemsGrid = document.createElement('div');
            statementTypeItemsGrid.style.cssText = 'display: grid; grid-template-columns: 1fr; gap: 6px; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #ddd;';
            statementTypeItemsGrid.id = 'echarts-query-types-statement-legend-items-grid';
        
            // Add Fatal Queries first (if any) - Special styling to stand out
            const totalFatalCount = fatalData.reduce((sum, d) => sum + d.actualCount, 0);
            if (totalFatalCount > 0) {
                statementTypeVisibilityState['FATAL_QUERIES'] = true;
                
                const fatalLegendItem = document.createElement('div');
                fatalLegendItem.style.cssText = 'display: flex; align-items: center; padding: 8px; cursor: pointer; border-radius: 4px; margin-bottom: 8px; border: 3px solid #FF0000; background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%); box-shadow: 0 2px 8px rgba(255, 0, 0, 0.3);';
                fatalLegendItem.dataset.statementType = 'FATAL_QUERIES';
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = true;
                checkbox.style.cssText = 'margin-right: 8px; cursor: pointer; width: 16px; height: 16px;';
                
                const colorBox = document.createElement('span');
                colorBox.style.cssText = `display: inline-block; width: 18px; height: 18px; background: #FF0000; margin-right: 8px; border: 2px solid #8B0000; border-radius: 2px; box-shadow: 0 0 4px rgba(255, 0, 0, 0.5);`;
                
                const label = document.createElement('span');
                label.style.cssText = 'font-size: 13px; flex: 1; font-weight: bold; color: #C62828; text-shadow: 0 1px 2px rgba(0,0,0,0.1);';
                label.innerHTML = `⚠️ Fatal Queries (${totalFatalCount} total)`;
                
                fatalLegendItem.appendChild(checkbox);
                fatalLegendItem.appendChild(colorBox);
                fatalLegendItem.appendChild(label);
                
                fatalLegendItem.onclick = (e) => {
                    if (e.target !== checkbox) {
                        checkbox.checked = !checkbox.checked;
                    }
                    statementTypeVisibilityState['FATAL_QUERIES'] = checkbox.checked;
                    fatalLegendItem.style.opacity = checkbox.checked ? '1' : '0.3';
                    updateChart();
                };
                
                statementTypeItemsGrid.appendChild(fatalLegendItem);
            }
        
            // Sort statement types by count (descending) for legend display
            const displayStatementTypes = [...sortedStatementTypes].sort((a, b) => {
                return (statementTypeCounts[b] || 0) - (statementTypeCounts[a] || 0);
            });
        
            displayStatementTypes.forEach(statementType => {
                statementTypeVisibilityState[statementType] = true;
                
                const count = statementTypeCounts[statementType];
                const legendItem = document.createElement('div');
                legendItem.style.cssText = 'display: flex; align-items: center; padding: 5px; cursor: pointer; border-radius: 3px; margin-bottom: 2px; border: 1px solid #e0e0e0;';
                legendItem.dataset.statementType = statementType;
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = true;
                checkbox.style.cssText = 'margin-right: 8px; cursor: pointer;';
                
                const colorBox = document.createElement('span');
                colorBox.style.cssText = `display: inline-block; width: 16px; height: 16px; background: ${colorMap[statementType] || '#868e96'}; margin-right: 8px; border: 1px solid #333; border-radius: 2px;`;
                
                const label = document.createElement('span');
                label.style.cssText = 'font-size: 12px; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
                label.textContent = `${statementType} (${count} total)`;
                
                legendItem.appendChild(checkbox);
                legendItem.appendChild(colorBox);
                legendItem.appendChild(label);
                
                legendItem.onclick = (e) => {
                    if (e.target !== checkbox) {
                        checkbox.checked = !checkbox.checked;
                    }
                    statementTypeVisibilityState[statementType] = checkbox.checked;
                    legendItem.style.opacity = checkbox.checked ? '1' : '0.3';
                    updateChart();
                };
                
                statementTypeItemsGrid.appendChild(legendItem);
            });
        
            controlsContainer.appendChild(statementTypeItemsGrid);
        
            // Add legend header with Show/Hide All buttons
            const legendHeader = document.createElement('div');
            legendHeader.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;';
            legendHeader.innerHTML = `
                <strong style="font-size: 14px;">Collections:</strong>
                <div>
                    <button id="echarts-query-types-fs-show-all" style="padding: 4px 12px; background: #4CAF50; color: white; border: none; border-radius: 3px; cursor: pointer; margin-right: 5px; font-size: 11px;">Show All</button>
                    <button id="echarts-query-types-fs-hide-all" style="padding: 4px 12px; background: #f44336; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;">Hide All</button>
                </div>
            `;
            controlsContainer.appendChild(legendHeader);
        
            // Add search input
            const searchContainer = document.createElement('div');
            searchContainer.style.cssText = 'margin-bottom: 10px;';
            searchContainer.innerHTML = `
                <input type="text" id="echarts-query-types-legend-search" placeholder="Search collections..." style="width: 100%; font-size: 11px; padding: 6px 8px; border: 1px solid #dee2e6; border-radius: 3px; box-sizing: border-box;">
            `;
            controlsContainer.appendChild(searchContainer);
        
            // Create legend items grid
            const itemsGrid = document.createElement('div');
            itemsGrid.style.cssText = 'display: grid; grid-template-columns: 1fr; gap: 6px;';
            itemsGrid.id = 'echarts-query-types-legend-items-grid';
        
            const visibilityState = {};
        
            // Sort collections by count (descending) for legend display
            const displayCollections = [...sortedCollections].sort((a, b) => {
                return (collectionCounts[b] || 0) - (collectionCounts[a] || 0);
            });
        
            displayCollections.forEach(collection => {
                visibilityState[collection] = true;
                
                const count = collectionCounts[collection];
                const legendItem = document.createElement('div');
                legendItem.style.cssText = 'display: flex; align-items: center; padding: 5px; cursor: pointer; border-radius: 3px; margin-bottom: 2px; border: 1px solid #e0e0e0;';
                legendItem.dataset.collection = collection;
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = true;
                checkbox.style.cssText = 'margin-right: 8px; cursor: pointer;';
                
                const label = document.createElement('span');
                label.style.cssText = 'font-size: 12px; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
                label.textContent = `[${count}] ${collection}`;
                
                legendItem.appendChild(checkbox);
                legendItem.appendChild(label);
                
                legendItem.onclick = (e) => {
                    if (e.target !== checkbox) {
                        checkbox.checked = !checkbox.checked;
                    }
                    visibilityState[collection] = checkbox.checked;
                    legendItem.style.opacity = checkbox.checked ? '1' : '0.3';
                    updateChart();
                };
                
                itemsGrid.appendChild(legendItem);
            });
        
            controlsContainer.appendChild(itemsGrid);
        
            // Assemble modal
            modalContent.appendChild(closeBtn);
            modalContent.appendChild(fullscreenChartDiv);
            modalContent.appendChild(controlsContainer);
            overlay.appendChild(modalContent);
            document.body.appendChild(overlay);
            document.body.style.overflow = 'hidden';
            
            // Sync Y-axis scale from radio buttons to 3D chart checkbox (after DOM insertion)
            const selectedScale = document.querySelector('input[name="yScale"]:checked');
            const logScaleCheckbox = document.getElementById('echarts-query-types-log-scale-toggle');
            if (selectedScale && logScaleCheckbox) {
                logScaleCheckbox.checked = selectedScale.value === 'logarithmic';
                Logger.debug('3D Query Types - Set checkbox to:', selectedScale.value === 'logarithmic');
            }
        
            // Initialize ECharts
            const myChart = echarts.init(fullscreenChartDiv);
        
            // Calculate bubble sizes (fixed size based on count, not affected by Z-axis scale)
            function calculateBubbleSizes() {
                const allCounts = bubbleData
                    .filter(d => visibilityState[d.collection] && statementTypeVisibilityState[d.statementType])
                    .map(d => d.actualCount);
                const maxCount = Math.max(...allCounts, 1);
                
                return bubbleData
                    .filter(d => visibilityState[d.collection] && statementTypeVisibilityState[d.statementType])
                    .map(d => {
                        // Fixed bubble size based on count
                        const size = Math.max(5, Math.min(30, (d.actualCount / maxCount) * 30));
                        return {
                            value: d.value,
                            itemStyle: d.itemStyle,
                            actualCount: d.actualCount,
                            statementType: d.statementType,
                            collection: d.collection,
                            time: d.time,
                            avgDuration: d.avgDuration,
                            maxDuration: d.maxDuration,
                            minDuration: d.minDuration,
                            symbolSize: size
                        };
                    });
            }
        
            function updateChart() {
                const useLogScale = document.getElementById('echarts-query-types-log-scale-toggle')?.checked || false; // Default to false
                const chartData = calculateBubbleSizes();
        
                // Build series array
                const series = [];
        
                // Regular bubbles (grouped by statement type for coloring)
                const bubbleSeriesData = chartData.map(d => ({
                    value: d.value,
                    itemStyle: d.itemStyle,
                    actualCount: d.actualCount,
                    statementType: d.statementType,
                    collection: d.collection,
                    time: d.time,
                    avgDuration: d.avgDuration,
                    maxDuration: d.maxDuration,
                    minDuration: d.minDuration,
                    symbolSize: d.symbolSize
                }));
        
                if (bubbleSeriesData.length > 0) {
                    series.push({
                        type: 'scatter3D',
                        data: bubbleSeriesData,
                        symbol: 'circle',
                        symbolSize: function(dataItem) {
                            return dataItem.symbolSize;
                        },
                        itemStyle: {
                            opacity: 0.85
                        },
                        emphasis: {
                            itemStyle: {
                                opacity: 1
                            }
                        }
                    });
                }
        
                // Fatal queries (diamonds)
                if (statementTypeVisibilityState['FATAL_QUERIES'] && fatalData && fatalData.length > 0) {
                const fatalSeriesData = fatalData
                .filter(d => visibilityState[d.collection])
                .map(d => {
                            // Fixed fatal marker size based on count
                            const size = Math.max(15, Math.min(40, d.actualCount * 8));
                            return {
                                value: d.value,
                                itemStyle: { color: '#FF0000' },
                                actualCount: d.actualCount,
                                statementType: d.statementType,
                                collection: d.collection,
                                time: d.time,
                                avgDuration: d.avgDuration,
                                maxDuration: d.maxDuration,
                                minDuration: d.minDuration,
                                symbolSize: size
                            };
                        });
        
                    if (fatalSeriesData.length > 0) {
                        series.push({
                            type: 'scatter3D',
                            data: fatalSeriesData,
                            symbol: 'diamond',
                            symbolSize: function(dataItem) {
                                return dataItem.symbolSize;
                            },
                            itemStyle: {
                                opacity: 1,
                                color: '#FF0000'
                            },
                            emphasis: {
                                itemStyle: {
                                    opacity: 1,
                                    color: '#FF3333'
                                }
                            }
                        });
                    }
                }
        
                const option = {
                    title: {
                        text: 'Query Duration By Statement Type By Collection',
                        left: 'center',
                        top: 10,
                        textStyle: {
                            fontSize: 18,
                            fontWeight: 'bold'
                        }
                    },
                    tooltip: {
                        formatter: function(params) {
                            const d = params.data;
                            return `<strong>${d.statementType}</strong><br/>Collection: ${d.collection}<br/>Time: ${d.time}<br/>Avg Duration: ${d.avgDuration.toFixed(3)}s<br/>Count: ${d.actualCount}<br/>Min: ${d.minDuration.toFixed(3)}s<br/>Max: ${d.maxDuration.toFixed(3)}s`;
                        }
                    },
                    grid3D: {
                        boxWidth: 200,
                        boxHeight: Math.min(300, sortedCollections.length * 20),
                        boxDepth: 200,
                        viewControl: {
                            alpha: 9,
                            beta: 44.4,
                            distance: 589.1,
                            minDistance: 100,
                            maxDistance: 600
                        },
                        light: {
                            main: {
                                intensity: 1.2,
                                shadow: true
                            },
                            ambient: {
                                intensity: 0.5
                            }
                        }
                    },
                    xAxis3D: {
                        type: 'value',
                        name: 'Time',
                        min: 0,
                        max: timeBuckets.length - 1,
                        nameTextStyle: {
                            fontSize: 14,
                            fontWeight: 'bold'
                        },
                        axisLabel: {
                            interval: Math.max(0, Math.ceil(timeBuckets.length / 10) - 1),
                            formatter: function(value) {
                                const idx = Math.round(value);
                                if (idx >= 0 && idx < timeBuckets.length) {
                                    return timeBuckets[idx].toLocaleString('en-US', { month: 'short', day: 'numeric' });
                                }
                                return '';
                            },
                            fontSize: 10
                        }
                    },
                    yAxis3D: {
                        type: 'value',
                        name: 'Collection',
                        min: 0,
                        max: sortedCollections.length - 1,
                        nameTextStyle: {
                            fontSize: 14,
                            fontWeight: 'bold'
                        },
                        axisLabel: {
                            interval: Math.max(0, Math.ceil(sortedCollections.length / 10) - 1),
                            formatter: function(value) {
                                const idx = Math.round(value);
                                if (idx >= 0 && idx < sortedCollections.length) {
                                    const collection = sortedCollections[idx];
                                    return collection.length > 15 ? collection.substring(0, 15) + '...' : collection;
                                }
                                return '';
                            },
                            fontSize: 10
                        }
                    },
                    zAxis3D: {
                        type: useLogScale ? 'log' : 'value',
                        name: 'Avg Duration (s)',
                        min: useLogScale ? 0.001 : 0,
                        nameTextStyle: {
                            fontSize: 14,
                            fontWeight: 'bold'
                        },
                        axisLabel: {
                            formatter: function(value) {
                                return value.toFixed(3) + 's';
                            }
                        }
                    },
                    series: series
                };
        
                myChart.setOption(option, true);
            }
        
            // Initial render
            updateChart();

            // Add camera debug display
            addCameraDebugDisplay(myChart, fullscreenChartDiv, closeBtn, 'query-types');
        
            // Log scale toggle handler
            document.getElementById('echarts-query-types-log-scale-toggle').addEventListener('change', updateChart);
        
            // Statement Type Show/Hide All handlers
            document.getElementById('echarts-query-types-fs-show-all-statements').addEventListener('click', () => {
                Object.keys(statementTypeVisibilityState).forEach(key => {
                    statementTypeVisibilityState[key] = true;
                    const item = statementTypeItemsGrid.querySelector(`[data-statement-type="${key}"]`);
                    if (item) {
                        item.querySelector('input').checked = true;
                        item.style.opacity = '1';
                    }
                });
                updateChart();
            });
        
            document.getElementById('echarts-query-types-fs-hide-all-statements').addEventListener('click', () => {
                Object.keys(statementTypeVisibilityState).forEach(key => {
                    statementTypeVisibilityState[key] = false;
                    const item = statementTypeItemsGrid.querySelector(`[data-statement-type="${key}"]`);
                    if (item) {
                        item.querySelector('input').checked = false;
                        item.style.opacity = '0.3';
                    }
                });
                updateChart();
            });
        
            // Collection Show/Hide All handlers
            document.getElementById('echarts-query-types-fs-show-all').addEventListener('click', () => {
                Object.keys(visibilityState).forEach(key => {
                    visibilityState[key] = true;
                    const item = itemsGrid.querySelector(`[data-collection="${key}"]`);
                    if (item) {
                        item.querySelector('input').checked = true;
                        item.style.opacity = '1';
                    }
                });
                updateChart();
            });
        
            document.getElementById('echarts-query-types-fs-hide-all').addEventListener('click', () => {
                Object.keys(visibilityState).forEach(key => {
                    visibilityState[key] = false;
                    const item = itemsGrid.querySelector(`[data-collection="${key}"]`);
                    if (item) {
                        item.querySelector('input').checked = false;
                        item.style.opacity = '0.3';
                    }
                });
                updateChart();
            });
        
            // Search handler
            const searchInput = document.getElementById('echarts-query-types-legend-search');
            searchInput.addEventListener('input', function() {
                const searchLower = this.value.toLowerCase();
                itemsGrid.querySelectorAll('[data-collection]').forEach(item => {
                    const collection = item.dataset.collection;
                    if (!collection) return;
                    
                    if (searchLower === '' || collection.toLowerCase().includes(searchLower)) {
                        item.style.display = 'flex';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        }
        // Create Parse Duration Distribution Chart

        // Create Plan Duration Distribution Chart

        // Create Result Count Chart (light green bar + orange line for resultCount/query)

        // Create Result Size Chart (dark green bar + orange line for resultSize/query)

        // Create ECharts 3D Avg Doc Size Data

        // Expand ECharts 3D Avg Doc Size to fullscreen
        function expandECharts3DAvgDocSize() {
            const { data, timeBuckets, allCollections, resultSizeBucketDefinitions, resultSizeColors, collectionQueryCounts } = window.echartsAvgDocSizeData;
            if (!data || !allCollections) return;

            // Create modal overlay
            const overlay = document.createElement('div');
            overlay.className = 'chart-fullscreen-overlay active';
            overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 10000; display: flex; align-items: center; justify-content: center;';

            // Create modal content
            const modalContent = document.createElement('div');
            modalContent.style.cssText = 'width: 95%; height: 95%; background: white; border-radius: 8px; padding: 20px; position: relative;';

            // Create close button
            const closeBtn = document.createElement('div');
            closeBtn.className = 'chart-collapse-btn';
            closeBtn.title = 'Collapse chart';
            closeBtn.innerHTML = '✕';
            closeBtn.onclick = () => {
                document.body.removeChild(overlay);
                document.body.style.overflow = '';
            };

            // Create fullscreen chart container
            const fullscreenChartDiv = document.createElement('div');
            fullscreenChartDiv.id = 'echarts-3d-avg-doc-size-fullscreen';
            fullscreenChartDiv.style.cssText = 'width: calc(100% - 420px); height: 100%;';

            // Create controls and legend container
            const controlsContainer = document.createElement('div');
            controlsContainer.style.cssText = 'position: absolute; top: 50px; right: 20px; width: 400px; background: white; border: 1px solid #444; border-radius: 4px; padding: 10px; max-height: calc(100% - 60px); overflow-y: auto;';

            // Add toggle controls
            const togglesDiv = document.createElement('div');
            togglesDiv.style.cssText = 'margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #ddd;';
            togglesDiv.innerHTML = `
                <div style="margin-bottom: 8px;">
                    <label style="display: flex; align-items: center; cursor: pointer; font-size: 13px; font-weight: bold;">
                        <input type="checkbox" id="echarts-avg-doc-size-log-scale-toggle" style="margin-right: 8px;">
                        Log Scale Z-Axis (Avg Doc Size)
                    </label>
                </div>
            `;
            controlsContainer.appendChild(togglesDiv);

            // Add Document Size Range Legend Section
            const sizeLegendHeader = document.createElement('div');
            sizeLegendHeader.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;';
            sizeLegendHeader.innerHTML = `
                <strong style="font-size: 14px;">Document Sizes:</strong>
                <div>
                    <button id="echarts-avg-doc-size-fs-show-all-sizes" style="padding: 4px 12px; background: #4CAF50; color: white; border: none; border-radius: 3px; cursor: pointer; margin-right: 5px; font-size: 11px;">Show All</button>
                    <button id="echarts-avg-doc-size-fs-hide-all-sizes" style="padding: 4px 12px; background: #f44336; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;">Hide All</button>
                </div>
            `;
            controlsContainer.appendChild(sizeLegendHeader);

            // Calculate counts for each size range
            const sizeRangeCounts = {};
            resultSizeBucketDefinitions.forEach((bin, idx) => {
                sizeRangeCounts[bin.label] = data.filter(d => d.value[2] === idx).reduce((sum, d) => sum + d.actualCount, 0);
            });

            const sizeVisibilityState = {};

            // Create size range legend items grid
            const sizeItemsGrid = document.createElement('div');
            sizeItemsGrid.style.cssText = 'display: grid; grid-template-columns: 1fr; gap: 6px; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #ddd;';
            sizeItemsGrid.id = 'echarts-avg-doc-size-size-legend-items-grid';

            resultSizeBucketDefinitions.forEach((bin, idx) => {
                const count = sizeRangeCounts[bin.label];
                sizeVisibilityState[idx] = true;
                
                const legendItem = document.createElement('div');
                legendItem.style.cssText = 'display: flex; align-items: center; padding: 5px; cursor: pointer; border-radius: 3px; margin-bottom: 2px; border: 1px solid #e0e0e0;';
                legendItem.dataset.sizeIndex = idx;
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = true;
                checkbox.style.cssText = 'margin-right: 8px; cursor: pointer;';
                
                const colorBox = document.createElement('span');
                colorBox.style.cssText = `display: inline-block; width: 16px; height: 16px; background: ${resultSizeColors[idx]}; margin-right: 8px; border: 1px solid #333; border-radius: 2px;`;
                
                const label = document.createElement('span');
                label.style.cssText = 'font-size: 12px; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
                label.textContent = `${bin.label} (${count} total)`;
                
                legendItem.appendChild(checkbox);
                legendItem.appendChild(colorBox);
                legendItem.appendChild(label);
                
                legendItem.onclick = (e) => {
                    if (e.target !== checkbox) {
                        checkbox.checked = !checkbox.checked;
                    }
                    sizeVisibilityState[idx] = checkbox.checked;
                    legendItem.style.opacity = checkbox.checked ? '1' : '0.3';
                    updateChart();
                };
                
                sizeItemsGrid.appendChild(legendItem);
            });

            controlsContainer.appendChild(sizeItemsGrid);

            // Add legend header
            const legendHeader = document.createElement('div');
            legendHeader.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;';
            legendHeader.innerHTML = `
                <strong style="font-size: 14px;">Collections:</strong>
                <div>
                    <button id="echarts-avg-doc-size-fs-show-all" style="padding: 4px 12px; background: #4CAF50; color: white; border: none; border-radius: 3px; cursor: pointer; margin-right: 5px; font-size: 11px;">Show All</button>
                    <button id="echarts-avg-doc-size-fs-hide-all" style="padding: 4px 12px; background: #f44336; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;">Hide All</button>
                </div>
            `;
            controlsContainer.appendChild(legendHeader);

            // Add search input
            const searchContainer = document.createElement('div');
            searchContainer.style.cssText = 'margin-bottom: 10px;';
            searchContainer.innerHTML = `
                <input type="text" id="echarts-avg-doc-size-legend-search" placeholder="Search collections..." style="width: 100%; font-size: 11px; padding: 6px 8px; border: 1px solid #dee2e6; border-radius: 3px; box-sizing: border-box;">
            `;
            controlsContainer.appendChild(searchContainer);

            // Create legend items grid
            const itemsGrid = document.createElement('div');
            itemsGrid.style.cssText = 'display: grid; grid-template-columns: 1fr; gap: 6px;';
            itemsGrid.id = 'echarts-avg-doc-size-legend-items-grid';
            
            // Sort collections by count (descending) for legend display
            const sortedCollections = [...allCollections].sort((a, b) => {
                return collectionQueryCounts[b] - collectionQueryCounts[a];
            });

            const visibilityState = {};
            sortedCollections.forEach(collection => {
                visibilityState[collection] = true;
            });

            sortedCollections.forEach(collection => {
                const count = collectionQueryCounts[collection];
                const legendItem = document.createElement('div');
                legendItem.style.cssText = 'display: flex; align-items: center; padding: 5px; cursor: pointer; border-radius: 3px; margin-bottom: 2px; border: 1px solid #e0e0e0;';
                legendItem.dataset.collection = collection;
                
                // Checkbox
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = true;
                checkbox.style.cssText = 'margin-right: 8px; cursor: pointer;';
                
                // Collection name with count
                const label = document.createElement('span');
                label.style.cssText = 'font-size: 12px; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
                label.textContent = `[${count}] ${collection}`;
                
                legendItem.appendChild(checkbox);
                legendItem.appendChild(label);
                
                // Toggle visibility on click
                legendItem.onclick = (e) => {
                    if (e.target !== checkbox) {
                        checkbox.checked = !checkbox.checked;
                    }
                    visibilityState[collection] = checkbox.checked;
                    legendItem.style.opacity = checkbox.checked ? '1' : '0.3';
                    updateChart();
                };
                
                itemsGrid.appendChild(legendItem);
            });

            controlsContainer.appendChild(itemsGrid);

            // Assemble modal
            modalContent.appendChild(closeBtn);
            modalContent.appendChild(fullscreenChartDiv);
            modalContent.appendChild(controlsContainer);
            overlay.appendChild(modalContent);
            document.body.appendChild(overlay);
            document.body.style.overflow = 'hidden';
            
            // Sync Y-axis scale from radio buttons to 3D chart checkbox (after DOM insertion)
            const selectedScale = document.querySelector('input[name="yScale"]:checked');
            const logScaleCheckbox = document.getElementById('echarts-avg-doc-size-log-scale-toggle');
            if (selectedScale && logScaleCheckbox) {
                logScaleCheckbox.checked = selectedScale.value === 'logarithmic';
                Logger.debug('3D Avg Doc Size - Set checkbox to:', selectedScale.value === 'logarithmic');
            }

            // Calculate bubble sizes using same method as 2D chart
            function calculateBubbleSize(count) {
                if (count === 0) return 0;
                // Logarithmic scale: log10(count + 1) * 8 (same as 2D chart)
                return Math.log10(count + 1) * 8;
            }

            function prepareChartData(useLogScale) {
                return data.map(d => {
                    const sizeIdx = d.value[2];
                    if (!visibilityState[d.collection] || !sizeVisibilityState[sizeIdx]) return null;
                    
                    // Use same bubble sizing as 2D chart
                    const bubbleSize = calculateBubbleSize(d.actualCount);
                    
                    // For log scale, map bucket index to log10 scale
                    let zValue = d.value[2]; // Original bucket index
                    if (useLogScale) {
                        // Convert bucket index to actual bytes value for log scale
                        const bucketDef = resultSizeBucketDefinitions[d.value[2]];
                        const avgBytes = bucketDef.max === 0 ? 0 : (bucketDef.min + Math.min(bucketDef.max, 20000000)) / 2; // Use midpoint
                        zValue = avgBytes === 0 ? 0 : Math.log10(avgBytes);
                    }
                    
                    return {
                        value: [d.value[0], d.value[1], zValue],
                        itemStyle: d.itemStyle,
                        actualCount: d.actualCount,
                        collection: d.collection,
                        time: d.time,
                        sizeRange: d.sizeRange,
                        symbolSize: bubbleSize
                    };
                }).filter(d => d !== null);
            }

            // Initialize fullscreen chart
            const myChart = echarts.init(fullscreenChartDiv);
            
            function updateChart() {
                const useLogScale = document.getElementById('echarts-avg-doc-size-log-scale-toggle')?.checked || false;
                const chartData = prepareChartData(useLogScale);
                
                const option = {
                    title: {
                        text: "Query's Avg Returned Document Size By Collection",
                        left: 'center',
                        top: 10,
                        textStyle: {
                            fontSize: 18,
                            fontWeight: 'bold'
                        }
                    },
                    tooltip: {
                        formatter: function(params) {
                            const d = params.data;
                            return `${d.collection}<br/>Time: ${d.time}<br/>Size Range: ${d.sizeRange}<br/>Queries: ${d.actualCount}`;
                        }
                    },
                    xAxis3D: {
                        type: 'category',
                        data: timeBuckets.map((ts, idx) => idx),
                        name: 'Request Time',
                        nameTextStyle: {
                            fontSize: 14,
                            fontWeight: 'bold'
                        },
                        axisLabel: {
                            interval: Math.max(0, Math.ceil(timeBuckets.length / 10) - 1),
                            formatter: function(value) {
                                return timeBuckets[value].toLocaleString('en-US', { month: 'short', day: 'numeric' });
                            },
                            fontSize: 10
                        }
                    },
                    yAxis3D: {
                        type: 'category',
                        data: allCollections,
                        name: 'Collection',
                        nameTextStyle: {
                            fontSize: 14,
                            fontWeight: 'bold'
                        },
                        axisLabel: {
                            interval: Math.max(0, Math.ceil(allCollections.length / 10) - 1),
                            fontSize: 10
                        }
                    },
                    zAxis3D: {
                        type: useLogScale ? 'value' : 'category',
                        data: useLogScale ? null : resultSizeBucketDefinitions.map(b => b.label),
                        name: useLogScale ? 'Avg Doc Size (bytes) - Log Scale' : 'Avg Doc Size Range',
                        nameTextStyle: {
                            fontSize: 14,
                            fontWeight: 'bold'
                        },
                        min: useLogScale ? 0 : undefined,
                        axisLabel: {
                            formatter: useLogScale ? function(value) {
                                // Convert log value back to bytes for display
                                const bytes = Math.pow(10, value);
                                if (bytes < 1000) return bytes.toFixed(0);
                                else if (bytes < 1000000) return (bytes/1000).toFixed(0) + 'K';
                                else return (bytes/1000000).toFixed(0) + 'M';
                            } : undefined
                        }
                    },
                    grid3D: {
                        boxWidth: 250,
                        boxDepth: Math.min(250, allCollections.length * 7),
                        boxHeight: 150,
                        viewControl: {
                            alpha: 22.9,
                            beta: 44.6,
                            distance: 453.0,
                            minDistance: 100,
                            maxDistance: 600
                        },
                        light: {
                            main: {
                                intensity: 1.2,
                                shadow: true
                            },
                            ambient: {
                                intensity: 0.5
                            }
                        }
                    },
                    series: [{
                        type: 'scatter3D',
                        data: chartData,
                        symbolSize: function(dataItem) {
                            return dataItem.symbolSize;
                        },
                        itemStyle: {
                            opacity: 0.85
                        },
                        emphasis: {
                            itemStyle: {
                                opacity: 1
                            }
                        }
                    }]
                };

                myChart.setOption(option);
            }

            // Initial render
            updateChart();

            // Add camera debug display
            addCameraDebugDisplay(myChart, fullscreenChartDiv, closeBtn, 'avg-doc-size');

            // Document Size Range Show/Hide All handlers
            document.getElementById('echarts-avg-doc-size-fs-show-all-sizes').addEventListener('click', () => {
                Object.keys(sizeVisibilityState).forEach(key => {
                    sizeVisibilityState[key] = true;
                    const item = sizeItemsGrid.querySelector(`[data-size-index="${key}"]`);
                    if (item) {
                        item.querySelector('input').checked = true;
                        item.style.opacity = '1';
                    }
                });
                updateChart();
            });

            document.getElementById('echarts-avg-doc-size-fs-hide-all-sizes').addEventListener('click', () => {
                Object.keys(sizeVisibilityState).forEach(key => {
                    sizeVisibilityState[key] = false;
                    const item = sizeItemsGrid.querySelector(`[data-size-index="${key}"]`);
                    if (item) {
                        item.querySelector('input').checked = false;
                        item.style.opacity = '0.3';
                    }
                });
                updateChart();
            });

            // Collection Show All button functionality
            document.getElementById('echarts-avg-doc-size-fs-show-all').addEventListener('click', () => {
                sortedCollections.forEach(collection => {
                    visibilityState[collection] = true;
                    const item = itemsGrid.querySelector(`[data-collection="${CSS.escape(collection)}"]`);
                    if (item) {
                        item.querySelector('input').checked = true;
                        item.style.opacity = '1';
                    }
                });
                updateChart();
            });

            // Hide All button functionality
            document.getElementById('echarts-avg-doc-size-fs-hide-all').addEventListener('click', () => {
                sortedCollections.forEach(collection => {
                    visibilityState[collection] = false;
                    const item = itemsGrid.querySelector(`[data-collection="${CSS.escape(collection)}"]`);
                    if (item) {
                        item.querySelector('input').checked = false;
                        item.style.opacity = '0.3';
                    }
                });
                updateChart();
            });

            // Log Scale checkbox functionality
            document.getElementById('echarts-avg-doc-size-log-scale-toggle').addEventListener('change', updateChart);

            // Search input filtering
            document.getElementById('echarts-avg-doc-size-legend-search').addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                sortedCollections.forEach(collection => {
                    const item = itemsGrid.querySelector(`[data-collection="${CSS.escape(collection)}"]`);
                    if (item) {
                        const matches = collection.toLowerCase().includes(searchTerm);
                        item.style.display = matches ? 'flex' : 'none';
                    }
                });
            });

            // Window resize handler
            window.addEventListener('resize', () => myChart.resize());
        }

        // Create CPU/Kernel/Elapsed Time Analysis Chart

        // Create Index Scan Throughput Chart with Average Count on 2nd Y-axis

        // Create Doc Fetch Throughput Chart with Average Count on 2nd Y-axis

        // ===== 3D Service Time Analysis Chart (Issue #217) =====
        // Create 3D ribbon chart showing Service Time metrics by collection over time

        // Expand 3D Service Time modal
        function expandECharts3DServiceTime() {
            const data = window.echartsServiceTimeData;
            if (!data) {
                Logger.warn("No 3D Service Time data available");
                return;
            }

            Logger.info("Opening 3D Service Time modal...");

            // Create fullscreen modal
            const fullscreenChartDiv = document.createElement('div');
            fullscreenChartDiv.id = 'echarts-3d-service-time-fullscreen';
            fullscreenChartDiv.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.95); z-index: 20000; display: flex; align-items: center; justify-content: center;';
            
            const modalContent = document.createElement('div');
            modalContent.style.cssText = 'width: 95%; height: 90%; background: white; border-radius: 8px; padding: 20px; position: relative;';
            
            // Close button
            const closeBtn = document.createElement('button');
            closeBtn.textContent = '✕';
            closeBtn.style.cssText = 'position: absolute; top: 10px; right: 10px; width: 32px; height: 32px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 18px; font-weight: bold; z-index: 20001;';
            closeBtn.addEventListener('click', function() {
                document.body.removeChild(fullscreenChartDiv);
            });

            // Title
            const title = document.createElement('h2');
            title.textContent = 'Service Time Analysis By Collection (3D Ribbons)';
            title.style.cssText = 'margin: 0 0 10px 0; font-size: 18px;';

            // Controls container
            const controlsDiv = document.createElement('div');
            controlsDiv.style.cssText = 'display: flex; gap: 20px; align-items: center; margin-bottom: 10px; flex-wrap: wrap;';

            // Log scale toggle
            const logScaleDiv = document.createElement('div');
            logScaleDiv.innerHTML = `
                <input type="checkbox" id="echarts-service-time-log-scale-toggle" style="margin-right: 8px;">
                <label for="echarts-service-time-log-scale-toggle" style="font-size: 14px; cursor: pointer;">Log Scale Z-Axis (Time ms)</label>
            `;
            controlsDiv.appendChild(logScaleDiv);

            // Main content layout (chart + legend side by side)
            const contentLayout = document.createElement('div');
            contentLayout.style.cssText = 'display: flex; gap: 15px; height: calc(100% - 80px);';

            // Chart container (left side)
            const chartDiv = document.createElement('div');
            chartDiv.id = 'echarts-3d-service-time-chart';
            chartDiv.style.cssText = 'flex: 1; min-width: 0;';

            // Legend container (right side)
            const legendDiv = document.createElement('div');
            legendDiv.style.cssText = 'width: 280px; padding: 10px; background: #f8f9fa; border-radius: 4px; overflow-y: auto; display: flex; flex-direction: column; gap: 15px;';
            
            // Metrics legend section (top)
            const metricsLegendDiv = document.createElement('div');
            metricsLegendDiv.innerHTML = `
                <div style="margin-bottom: 8px;">
                    <strong style="font-size: 14px;">Metrics (5 Planes)</strong>
                </div>
                <div id="service-time-metrics-items" style="display: flex; flex-direction: column; gap: 6px;"></div>
            `;
            
            // Collections legend section (bottom)
            const collectionsLegendDiv = document.createElement('div');
            collectionsLegendDiv.innerHTML = `
                <div style="margin-bottom: 8px;">
                    <strong style="font-size: 14px;">Collections (${data.collections.length})</strong>
                </div>
                <div style="display: flex; gap: 6px; margin-bottom: 8px;">
                    <input type="text" id="service-time-legend-search" placeholder="Search..." style="flex: 1; padding: 4px 8px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px;">
                    <button id="service-time-show-all" style="padding: 4px 8px; background: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;">All</button>
                    <button id="service-time-hide-all" style="padding: 4px 8px; background: #6c757d; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;">None</button>
                </div>
                <div id="service-time-legend-items" style="display: flex; flex-wrap: wrap; gap: 6px; max-height: 300px; overflow-y: auto;"></div>
            `;
            
            legendDiv.appendChild(metricsLegendDiv);
            legendDiv.appendChild(collectionsLegendDiv);

            // Assemble layout
            contentLayout.appendChild(chartDiv);
            contentLayout.appendChild(legendDiv);

            // Assemble modal
            modalContent.appendChild(closeBtn);
            modalContent.appendChild(title);
            modalContent.appendChild(controlsDiv);
            modalContent.appendChild(contentLayout);
            fullscreenChartDiv.appendChild(modalContent);
            document.body.appendChild(fullscreenChartDiv);

            // Populate metrics legend (top section)
            const metricsItemsDiv = document.getElementById('service-time-metrics-items');
            const metricsConfig = [
                { name: "Avg Elapsed Time", color: "rgba(75, 192, 192, 0.8)" },
                { name: "Avg Kernel Time", color: "rgba(255, 0, 0, 0.8)" },
                { name: "Authorize ServTime", color: "rgba(54, 162, 235, 0.8)" },
                { name: "IndexScan ServTime", color: "rgba(255, 206, 86, 0.8)" },
                { name: "Fetch ServTime", color: "rgba(153, 102, 255, 0.8)" }
            ];
            
            metricsConfig.forEach(metric => {
                const metricItem = document.createElement('label');
                metricItem.style.cssText = 'display: flex; align-items: center; padding: 4px 8px; background: white; border: 1px solid #dee2e6; border-radius: 3px; cursor: pointer; font-size: 12px;';
                metricItem.dataset.metric = metric.name;
                metricItem.innerHTML = `
                    <input type="checkbox" checked data-metric="${metric.name}" style="margin-right: 8px;">
                    <span style="width: 12px; height: 12px; background: ${metric.color}; display: inline-block; margin-right: 6px; border-radius: 2px;"></span>
                    <span>${metric.name}</span>
                `;
                metricsItemsDiv.appendChild(metricItem);
            });

            // Populate collections legend (bottom section)
            const legendItemsDiv = document.getElementById('service-time-legend-items');
            const displayCollections = [...data.collections].sort((a, b) => {
                return (data.collectionCounts[b] || 0) - (data.collectionCounts[a] || 0);
            });

            displayCollections.forEach(collection => {
                const count = data.collectionCounts[collection] || 0;
                const legendItem = document.createElement('label');
                legendItem.style.cssText = 'display: flex; align-items: center; padding: 4px 8px; background: white; border: 1px solid #dee2e6; border-radius: 3px; cursor: pointer; font-size: 12px;';
                legendItem.dataset.collection = collection;
                legendItem.innerHTML = `
                    <input type="checkbox" checked data-collection="${collection}" style="margin-right: 6px;">
                    <span>[${count}] ${collection}</span>
                `;
                legendItemsDiv.appendChild(legendItem);
            });

            // Initialize ECharts
            const myChart = echarts.init(chartDiv);
            
            // Render function
            function renderChart() {
                const useLogScale = document.getElementById('echarts-service-time-log-scale-toggle').checked;
                
                // Get visible metrics
                const visibleMetrics = new Set();
                document.querySelectorAll('#service-time-metrics-items input[type="checkbox"]:checked').forEach(cb => {
                    visibleMetrics.add(cb.dataset.metric);
                });
                
                // Get visible collections
                const visibleCollections = new Set();
                document.querySelectorAll('#service-time-legend-items input[type="checkbox"]:checked').forEach(cb => {
                    visibleCollections.add(cb.dataset.collection);
                });

                // Create stacked 3D bars showing component time breakdown
                const filteredSeries = [];
                
                // Component order (bottom to top): Auth, IndexScan, Fetch, Kernel
                // Each creates a separate bar3D series with stack offsets
                const componentLayers = [
                    { name: 'Authorize ServTime', dataKey: 'authSum', color: 'rgba(54, 162, 235, 0.85)', base: 0 },
                    { name: 'IndexScan ServTime', dataKey: 'indexSum', color: 'rgba(255, 206, 86, 0.85)', base: 1 },
                    { name: 'Fetch ServTime', dataKey: 'fetchSum', color: 'rgba(153, 102, 255, 0.85)', base: 2 },
                    { name: 'Avg Kernel Time', dataKey: 'kernSum', color: 'rgba(255, 0, 0, 0.85)', base: 3 }
                ];
                
                // Build stacked bar data: need to track cumulative height for each bar
                const barDataByLayer = componentLayers.map(() => []);
                const heightTracker = {}; // Track cumulative height per [time, collection]
                
                // Collect all data points with all component values
                const allPoints = [];
                data.timeBuckets.forEach((timestamp) => {
                    data.collections.forEach((collection, collIdx) => {
                        if (!visibleCollections.has(collection)) return;
                        
                        const timeKey = timestamp.toISOString();
                        const timeMs = timestamp.getTime();
                        
                        // Aggregate all metrics for this time+collection
                        const point = {
                            time: timeMs,
                            collIdx: collIdx,
                            authSum: 0,
                            indexSum: 0,
                            fetchSum: 0,
                            kernSum: 0,
                            elapsedSum: 0,
                            count: 0
                        };
                        
                        // Gather data from each metric's data
                        data.seriesData.forEach(metric => {
                            const metricPoint = metric.data.find(p => 
                                p.value[0] === timeMs && p.collection === collection
                            );
                            if (metricPoint) {
                                if (metric.name === 'Avg Elapsed Time') point.elapsedSum += metricPoint.actualValue;
                                if (metric.name === 'Avg Kernel Time') point.kernSum += metricPoint.actualValue;
                                if (metric.name === 'Authorize ServTime') point.authSum += metricPoint.actualValue;
                                if (metric.name === 'IndexScan ServTime') point.indexSum += metricPoint.actualValue;
                                if (metric.name === 'Fetch ServTime') point.fetchSum += metricPoint.actualValue;
                                point.count = Math.max(point.count, metricPoint.count);
                            }
                        });
                        
                        if (point.count > 0) {
                            allPoints.push(point);
                        }
                    });
                });
                
                // Create stacked layers
                componentLayers.forEach((layer, layerIdx) => {
                    // Skip if metric is not visible
                    if (!visibleMetrics.has(layer.name)) return;
                    
                    const layerData = allPoints.map(point => {
                        const key = `${point.time}_${point.collIdx}`;
                        
                        // Calculate cumulative base height (sum of all previous layers)
                        let baseHeight = 0;
                        for (let i = 0; i < layerIdx; i++) {
                            const prevLayer = componentLayers[i];
                            if (visibleMetrics.has(prevLayer.name)) {
                                baseHeight += point[prevLayer.dataKey] || 0;
                            }
                        }
                        
                        const segmentHeight = point[layer.dataKey] || 0;
                        
                        // Store in heightTracker
                        if (!heightTracker[key]) heightTracker[key] = 0;
                        heightTracker[key] += segmentHeight;
                        
                        // Return [x, y, z, value] where z is the segment height, and we'll use stack
                        return {
                            value: [point.time, point.collIdx, baseHeight + segmentHeight],
                            baseHeight: baseHeight,
                            segmentHeight: segmentHeight,
                            itemStyle: {
                                color: layer.color
                            }
                        };
                    }).filter(d => d.segmentHeight > 0);
                    
                    if (layerData.length === 0) return;
                    
                    filteredSeries.push({
                        type: 'bar3D',
                        name: layer.name,
                        data: layerData,
                        shading: 'color',
                        stack: 'total',
                        itemStyle: {
                            opacity: 0.85
                        },
                        emphasis: {
                            itemStyle: {
                                opacity: 1.0
                            }
                        }
                    });
                });

                const option = {
                    tooltip: {
                        formatter: function(params) {
                            const d = params.data;
                            if (!d.value) return '';
                            const timestamp = new Date(d.value[0]);
                            const timeStr = timestamp.toISOString().substring(0, 19).replace('T', ' ');
                            const collectionIdx = d.value[1];
                            const collection = data.collections[collectionIdx];
                            const timeValue = d.value[2];
                            return `<strong>${params.seriesName}</strong><br/>Collection: ${collection}<br/>Time: ${timeStr}<br/>Value: ${timeValue.toFixed(2)} ms`;
                        }
                    },
                    grid3D: {
                        boxWidth: 200,
                        boxHeight: Math.min(200, data.collections.length * 15),
                        boxDepth: 200,
                        axisPointer: {
                            show: true,
                            lineStyle: { color: '#ffaa00', width: 2 }
                        },
                        viewControl: {
                            alpha: 25,
                            beta: 45,
                            distance: 280,
                            minDistance: 100,
                            maxDistance: 500
                        }
                    },
                    // Bar sizing for stacked bars
                    barSize: [15, 15],
                    xAxis3D: {
                        type: 'time',
                        name: 'Request Time'
                    },
                    yAxis3D: {
                        type: 'category',
                        name: 'Collection',
                        data: data.collections
                    },
                    zAxis3D: {
                        type: useLogScale ? 'log' : 'value',
                        name: 'Time (ms)',
                        min: useLogScale ? 0.001 : 0
                    },
                    series: filteredSeries
                };

                myChart.setOption(option, true);
            }

            // Event listeners
            document.getElementById('echarts-service-time-log-scale-toggle').addEventListener('change', renderChart);
            document.getElementById('service-time-show-all').addEventListener('click', function() {
                document.querySelectorAll('#service-time-legend-items input[type="checkbox"]').forEach(cb => cb.checked = true);
                renderChart();
            });
            document.getElementById('service-time-hide-all').addEventListener('click', function() {
                document.querySelectorAll('#service-time-legend-items input[type="checkbox"]').forEach(cb => cb.checked = false);
                renderChart();
            });
            document.getElementById('service-time-legend-search').addEventListener('input', function(e) {
                const query = e.target.value.toLowerCase();
                document.querySelectorAll('#service-time-legend-items label').forEach(label => {
                    const collection = label.dataset.collection.toLowerCase();
                    label.style.display = collection.includes(query) ? 'flex' : 'none';
                });
            });
            legendItemsDiv.addEventListener('change', renderChart);
            metricsItemsDiv.addEventListener('change', renderChart);

            // Debug mode camera display
            const urlParams = new URLSearchParams(window.location.search);
            const debugMode = urlParams.get('debug') === 'true' || urlParams.get('logLevel') === 'debug';
            
            if (debugMode) {
                const debugDiv = document.createElement('div');
                debugDiv.id = 'camera-debug-service-time';
                debugDiv.style.cssText = 'position: absolute; top: 60px; left: 10px; background: rgba(0,0,0,0.9); color: #00ff00; padding: 12px; font-family: monospace; font-size: 13px; z-index: 10002; border-radius: 4px; border: 2px solid #00ff00; box-shadow: 0 0 10px rgba(0,255,0,0.5);';
                debugDiv.innerHTML = '<strong style="color: #ffff00;">Camera Position:</strong><br/>Alpha: 25.0<br/>Beta: 45.0<br/>Distance: 280.0';
                modalContent.appendChild(debugDiv);
                
                const cameraUpdateInterval = setInterval(function() {
                    try {
                        const option = myChart.getOption();
                        if (option && option.grid3D && option.grid3D[0] && option.grid3D[0].viewControl) {
                            const vc = option.grid3D[0].viewControl;
                            debugDiv.innerHTML = `
                                <strong style="color: #ffff00;">Camera Position:</strong><br/>
                                Alpha: ${vc.alpha.toFixed(1)}<br/>
                                Beta: ${vc.beta.toFixed(1)}<br/>
                                Distance: ${vc.distance.toFixed(1)}
                            `;
                        }
                    } catch (e) {
                        // Silently fail
                    }
                }, 100);
                
                closeBtn.addEventListener('click', function() {
                    clearInterval(cameraUpdateInterval);
                }, { once: true });
            }

            // Initial render
            renderChart();
            
            Logger.info("✅ 3D Service Time modal opened");
        }


        // Create Execution Analysis Chart (ExecTime vs ServTime/KernTime percentages)

        // Create ExecTime vs ServTime Chart (operators with servTime)

        // Create Service Time Analysis Line Chart (5 lines: ElapsedTime, KernTime, Auth, Index, Fetch service times)

        // Setup chart drag and drop functionality
        function setupChartDragAndDrop() {
            // Chart mapping for swapping - all charts
            const chartMapping = {
                'elapsed-time': () => window.elapsedTimeChart,
                'primary-scan': () => window.primaryScanChart,
                'query-pattern': () => window.queryPatternChart,
                'duration-buckets': () => window.durationBucketsChart,
                'query-types': () => window.queryTypesChart,
                'operations': () => window.operationsChart,
                'filter': () => window.filterChart,
                'result-count': () => window.resultCountChart,
                'result-size': () => window.resultSizeChart,
                'timeline': () => window.timelineChart,
                'memory': () => window.memoryChart,
                'exec-vs-kernel': () => window.execVsKernelChart,
                'exec-vs-serv': () => window.execVsServChart,
                'cpu-time': () => window.cpuTimeChart,
                'exec-vs-elapsed': () => window.execVsElapsedChart,
                'service-time-analysis': () => window.serviceTimeAnalysisLineChart,
                'enhanced-operations': () => window.enhancedOperationsChart
            };

            // Make charts draggable (excluding dashboard charts)
            $('.draggable-chart').not('[data-position^="dashboard"]').draggable({
                handle: '.chart-drag-handle',
                revert: 'invalid',
                helper: 'clone',
                opacity: 0.7,
                zIndex: 1000,
                start: function(event, ui) {
                    $(this).addClass('ui-draggable-dragging');
                },
                stop: function(event, ui) {
                    $(this).removeClass('ui-draggable-dragging');
                }
            });

            // Make charts droppable
            $('.draggable-chart').droppable({
                accept: '.draggable-chart',
                hoverClass: 'chart-drop-zone',
                drop: function(event, ui) {
                    const draggedChart = ui.draggable;
                    const targetChart = $(this);
                    
                    // Don't drop on itself
                    if (draggedChart[0] === targetChart[0]) return;

                    // Get chart IDs
                    const draggedId = draggedChart.data('chart-id');
                    const targetId = targetChart.data('chart-id');

                    // Swap positions
                    const draggedPosition = draggedChart.data('position');
                    const targetPosition = targetChart.data('position');

                    // Update data attributes
                    draggedChart.data('position', targetPosition);
                    targetChart.data('position', draggedPosition);

                    // Swap canvas IDs to maintain chart references
                    const draggedCanvas = draggedChart.find('canvas');
                    const targetCanvas = targetChart.find('canvas');
                    
                    const tempId = 'temp-canvas-id';
                    const draggedCanvasId = draggedCanvas.attr('id');
                    const targetCanvasId = targetCanvas.attr('id');
                    
                    draggedCanvas.attr('id', tempId);
                    targetCanvas.attr('id', draggedCanvasId);
                    draggedCanvas.attr('id', targetCanvasId);

                    // Swap the DOM elements
                    const draggedParent = draggedChart.parent();
                    const targetParent = targetChart.parent();
                    
                    // Use jQuery to swap elements
                    const temp = $('<div>');
                    draggedChart.before(temp);
                    targetChart.before(draggedChart);
                    temp.before(targetChart);
                    temp.remove();

                    // Refresh chart sizes after DOM manipulation
                    setTimeout(() => {
                        Object.values(chartMapping).forEach(getChart => {
                            const chart = getChart();
                            if (chart && chart.resize) {
                                chart.resize();
                            }
                        });
                    }, 100);
                }
            });
        }

        // Create ExecTime vs Elapsed Time Chart (copy of ExecVsKernel but vs elapsed time)

        // Reset timeline chart zoom
        function resetTimelineZoom() {
            if (window.timelineChart) {
                window.timelineChart.resetZoom();
            }
            if (window.filterChart) {
                window.filterChart.resetZoom();
            }
            if (window.queryTypesChart) {
                window.queryTypesChart.resetZoom();
            }
            if (window.durationBucketsChart) {
                window.durationBucketsChart.resetZoom();
            }
            if (window.memoryChart) {
                window.memoryChart.resetZoom();
            }
            if (window.resultCountChart) {
                window.resultCountChart.resetZoom();
            }
            if (window.resultSizeChart) {
                window.resultSizeChart.resetZoom();
            }
            if (window.cpuTimeChart) {
            window.cpuTimeChart.resetZoom();
            }
        if (window.indexScanThroughputChart) {
          window.indexScanThroughputChart.resetZoom();
        }
        if (window.docFetchThroughputChart) {
          window.docFetchThroughputChart.resetZoom();
        }
        if (window.docSizeBubbleChart) {
          window.docSizeBubbleChart.resetZoom();
        }
        if (window.execVsKernelChart) {
          window.execVsKernelChart.resetZoom();
        }
        if (window.execVsServChart) {
          window.execVsServChart.resetZoom();
        }
        if (window.execVsElapsedChart) {
          window.execVsElapsedChart.resetZoom();
        }
        if (window.enhancedOperationsChart) {
          window.enhancedOperationsChart.resetZoom();
        }
        if (window.collectionQueriesChart) {
          window.collectionQueriesChart.resetZoom();
        }
        if (window.parseDurationChart) {
          window.parseDurationChart.resetZoom();
        }
        if (window.planDurationChart) {
          window.planDurationChart.resetZoom();
        }
        if (window.serviceTimeAnalysisLineChart) {
          window.serviceTimeAnalysisLineChart.resetZoom();
        }

            // Reset to original time range
            currentTimeRange = { ...originalTimeRange };
            updateTimeRangeDisplay();
        }

        // Format date to datetime-local format
        function formatDateForInput(date) {
            if (!date) return "";
            const d = new Date(date);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, "0");
            const day = String(d.getDate()).padStart(2, "0");
            const hours = String(d.getHours()).padStart(2, "0");
            const minutes = String(d.getMinutes()).padStart(2, "0");
            return `${year}-${month}-${day}T${hours}:${minutes}`;
        }

        // Update the time range display
        function updateTimeRangeDisplay() {
            // Function kept for compatibility but display removed
        }

        // Use current time range in the date pickers
        function useCurrentTimeRange() {
            // Get current x-axis range from 2D timeline charts
            // Priority: durationBucketsChart (first 2D chart) > queryTypesChart > timelineChart (fallback)
            const chart = 
                (window.durationBucketsChart && window.durationBucketsChart.scales?.x && window.durationBucketsChart) ||
                (window.queryTypesChart && window.queryTypesChart.scales?.x && window.queryTypesChart) ||
                (window.timelineChart && window.timelineChart.scales?.x && window.timelineChart) ||
                null;

            if (chart) {
                const xScale = chart.scales.x;
                const currentMin = new Date(xScale.min);
                const currentMax = new Date(xScale.max);

                const startValue = formatDateForInput(currentMin);
                const endValue = formatDateForInput(currentMax);

                const startInput = document.getElementById("start-date");
                const endInput = document.getElementById("end-date");
                startInput.value = startValue;
                endInput.value = endValue;

                // Auto-show Data/Filter section so user can see the updated date range
                showInputSection();

                // Always show the filter reminder banner after updating the pickers
                // Consistent with setTimeRange and manual input changes
                showFilterReminder();
            }
        }

        // Change Y-axis scale for both charts
        function changeYAxisScale() {
            const selectedScale = document.querySelector(
                'input[name="yScale"]:checked'
            ).value;
            const scaleType =
                selectedScale === "logarithmic" ? "logarithmic" : "linear";

            // Update filter chart Y-axis scale (both y and y1)
            if (window.filterChart) {
                window.filterChart.options.scales.y.type = scaleType;
                window.filterChart.options.scales.y1.type = scaleType;
                if (scaleType === "logarithmic") {
                    window.filterChart.options.scales.y.beginAtZero = false;
                    window.filterChart.options.scales.y.min = 1; // Avoid log(0)
                    window.filterChart.options.scales.y1.beginAtZero = false;
                    window.filterChart.options.scales.y1.min = 0.001; // Efficiency % can be very small
                } else {
                    window.filterChart.options.scales.y.beginAtZero = true;
                    window.filterChart.options.scales.y1.beginAtZero = true;
                    delete window.filterChart.options.scales.y.min;
                    delete window.filterChart.options.scales.y1.min;
                }
                window.filterChart.update();
            }

            // Update timeline chart Y-axis scale
            if (window.timelineChart) {
                window.timelineChart.options.scales.y.type = scaleType;
                if (scaleType === "logarithmic") {
                    window.timelineChart.options.scales.y.beginAtZero = false;
                    window.timelineChart.options.scales.y.min = 1; // Avoid log(0)
                } else {
                    window.timelineChart.options.scales.y.beginAtZero = true;
                    delete window.timelineChart.options.scales.y.min;
                }
                window.timelineChart.update();
            }

            // Update query types chart Y-axis scale
            if (window.queryTypesChart) {
                window.queryTypesChart.options.scales.y.type = scaleType;
                if (scaleType === "logarithmic") {
                    window.queryTypesChart.options.scales.y.beginAtZero = false;
                    window.queryTypesChart.options.scales.y.min = 0.001; // Avoid log(0) for very small durations
                } else {
                    window.queryTypesChart.options.scales.y.beginAtZero = true;
                    delete window.queryTypesChart.options.scales.y.min;
                }
                window.queryTypesChart.update();
            }

            // Update memory chart Y-axis scale (both y and y1)
            if (window.memoryChart) {
                window.memoryChart.options.scales.y.type = scaleType;
                window.memoryChart.options.scales.y1.type = scaleType;
                if (scaleType === "logarithmic") {
                    window.memoryChart.options.scales.y.beginAtZero = false;
                    window.memoryChart.options.scales.y.min = 0.001; // Avoid log(0) for small memory values
                    window.memoryChart.options.scales.y1.beginAtZero = false;
                    window.memoryChart.options.scales.y1.min = 0.001; // Avoid log(0) for service time
                } else {
                    window.memoryChart.options.scales.y.beginAtZero = true;
                    window.memoryChart.options.scales.y1.beginAtZero = true;
                    delete window.memoryChart.options.scales.y.min;
                    delete window.memoryChart.options.scales.y1.min;
                }
                window.memoryChart.update();
            }



            // Update result count chart Y-axis scale (both y and y1)
            if (window.resultCountChart) {
                window.resultCountChart.options.scales.y.type = scaleType;
                window.resultCountChart.options.scales.y1.type = scaleType;
                if (scaleType === "logarithmic") {
                    window.resultCountChart.options.scales.y.beginAtZero = false;
                    window.resultCountChart.options.scales.y.min = 1; // Avoid log(0)
                    window.resultCountChart.options.scales.y1.beginAtZero = false;
                    window.resultCountChart.options.scales.y1.min = 1; // Avoid log(0)
                } else {
                    window.resultCountChart.options.scales.y.beginAtZero = true;
                    window.resultCountChart.options.scales.y1.beginAtZero = true;
                    delete window.resultCountChart.options.scales.y.min;
                    delete window.resultCountChart.options.scales.y1.min;
                }
                window.resultCountChart.update();
            }

            // Update result size chart Y-axis scale (both y and y1)
            if (window.resultSizeChart) {
                window.resultSizeChart.options.scales.y.type = scaleType;
                window.resultSizeChart.options.scales.y1.type = scaleType;
                if (scaleType === "logarithmic") {
                    window.resultSizeChart.options.scales.y.beginAtZero = false;
                    window.resultSizeChart.options.scales.y.min = 0.001; // Avoid log(0) for small sizes
                    window.resultSizeChart.options.scales.y1.beginAtZero = false;
                    window.resultSizeChart.options.scales.y1.min = 0.001; // Avoid log(0) for small sizes
                } else {
                    window.resultSizeChart.options.scales.y.beginAtZero = true;
                    window.resultSizeChart.options.scales.y1.beginAtZero = true;
                    delete window.resultSizeChart.options.scales.y.min;
                    delete window.resultSizeChart.options.scales.y1.min;
                }
                window.resultSizeChart.update();
            }

            // Update CPU time chart Y-axis scale
            if (window.cpuTimeChart) {
                window.cpuTimeChart.options.scales.y.type = scaleType;
                window.cpuTimeChart.options.scales.y1.type = scaleType;
                if (scaleType === "logarithmic") {
                    window.cpuTimeChart.options.scales.y.beginAtZero = false;
                    window.cpuTimeChart.options.scales.y.min = 0.001; // Avoid log(0) for small times
                    window.cpuTimeChart.options.scales.y1.beginAtZero = false;
                    window.cpuTimeChart.options.scales.y1.min = 0.001; // Avoid log(0) for percentages
                } else {
                    window.cpuTimeChart.options.scales.y.beginAtZero = true;
                    window.cpuTimeChart.options.scales.y1.beginAtZero = true;
                    delete window.cpuTimeChart.options.scales.y.min;
                    delete window.cpuTimeChart.options.scales.y1.min;
                }
                window.cpuTimeChart.update();
            }

            // Update index scan throughput chart Y-axis scale (both y and y1)
            if (window.indexScanThroughputChart) {
                window.indexScanThroughputChart.options.scales.y.type = scaleType;
                window.indexScanThroughputChart.options.scales.y1.type = scaleType;
                if (scaleType === "logarithmic") {
                    window.indexScanThroughputChart.options.scales.y.beginAtZero = false;
                    window.indexScanThroughputChart.options.scales.y.min = 0.001;
                    window.indexScanThroughputChart.options.scales.y1.beginAtZero = false;
                    window.indexScanThroughputChart.options.scales.y1.min = 1; // Avg record count
                } else {
                    window.indexScanThroughputChart.options.scales.y.beginAtZero = true;
                    window.indexScanThroughputChart.options.scales.y1.beginAtZero = true;
                    delete window.indexScanThroughputChart.options.scales.y.min;
                    delete window.indexScanThroughputChart.options.scales.y1.min;
                }
                window.indexScanThroughputChart.update();
            }

            // Update doc fetch throughput chart Y-axis scale (both y and y1)
            if (window.docFetchThroughputChart) {
                window.docFetchThroughputChart.options.scales.y.type = scaleType;
                window.docFetchThroughputChart.options.scales.y1.type = scaleType;
                if (scaleType === "logarithmic") {
                    window.docFetchThroughputChart.options.scales.y.beginAtZero = false;
                    window.docFetchThroughputChart.options.scales.y.min = 0.001;
                    window.docFetchThroughputChart.options.scales.y1.beginAtZero = false;
                    window.docFetchThroughputChart.options.scales.y1.min = 1; // Avg docs fetched
                } else {
                    window.docFetchThroughputChart.options.scales.y.beginAtZero = true;
                    window.docFetchThroughputChart.options.scales.y1.beginAtZero = true;
                    delete window.docFetchThroughputChart.options.scales.y.min;
                    delete window.docFetchThroughputChart.options.scales.y1.min;
                }
                window.docFetchThroughputChart.update();
            }

            // Update document size bubble chart Y-axis scale
            if (window.docSizeBubbleChart) {
                window.docSizeBubbleChart.options.scales.y.type = scaleType;
                if (scaleType === "logarithmic") {
                    window.docSizeBubbleChart.options.scales.y.beginAtZero = false;
                    window.docSizeBubbleChart.options.scales.y.min = 1;
                } else {
                    window.docSizeBubbleChart.options.scales.y.beginAtZero = true;
                    delete window.docSizeBubbleChart.options.scales.y.min;
                }
                window.docSizeBubbleChart.update();
            }

            // Update execution vs kernel chart Y-axis scale
            if (window.execVsKernelChart) {
                window.execVsKernelChart.options.scales.y.type = scaleType;
                if (scaleType === "logarithmic") {
                    window.execVsKernelChart.options.scales.y.beginAtZero = false;
                    window.execVsKernelChart.options.scales.y.min = 0.001; // Avoid log(0) for small percentages
                } else {
                    window.execVsKernelChart.options.scales.y.beginAtZero = true;
                    delete window.execVsKernelChart.options.scales.y.min;
                }
                window.execVsKernelChart.update();
            }

            // Update execution vs service chart Y-axis scale (both y and y1)
            if (window.execVsServChart) {
                window.execVsServChart.options.scales.y.type = scaleType;
                window.execVsServChart.options.scales.y1.type = scaleType;
                if (scaleType === "logarithmic") {
                    window.execVsServChart.options.scales.y.beginAtZero = false;
                    window.execVsServChart.options.scales.y.min = 0.001; // Avoid log(0) for small percentages
                    window.execVsServChart.options.scales.y1.beginAtZero = false;
                    window.execVsServChart.options.scales.y1.min = 0.001; // Avoid log(0) for servTime
                } else {
                    window.execVsServChart.options.scales.y.beginAtZero = true;
                    window.execVsServChart.options.scales.y1.beginAtZero = true;
                    delete window.execVsServChart.options.scales.y.min;
                    delete window.execVsServChart.options.scales.y1.min;
                }
                window.execVsServChart.update();
            }

            // Update execution vs elapsed chart Y-axis scale
            if (window.execVsElapsedChart) {
                window.execVsElapsedChart.options.scales.y.type = scaleType;
                if (scaleType === "logarithmic") {
                    window.execVsElapsedChart.options.scales.y.beginAtZero = false;
                    window.execVsElapsedChart.options.scales.y.min = 0.001; // Avoid log(0) for small percentages
                } else {
                    window.execVsElapsedChart.options.scales.y.beginAtZero = true;
                    delete window.execVsElapsedChart.options.scales.y.min;
                }
                window.execVsElapsedChart.update();
            }

            // Update enhanced operations chart Y-axis scale (both y and y1)
            if (window.enhancedOperationsChart) {
                window.enhancedOperationsChart.options.scales.y.type = scaleType;
                window.enhancedOperationsChart.options.scales.y1.type = scaleType;
                if (scaleType === "logarithmic") {
                    window.enhancedOperationsChart.options.scales.y.beginAtZero = false;
                    window.enhancedOperationsChart.options.scales.y.min = 1; // Avoid log(0)
                    window.enhancedOperationsChart.options.scales.y1.beginAtZero = false;
                    window.enhancedOperationsChart.options.scales.y1.min = 1; // Avoid log(0)
                } else {
                    window.enhancedOperationsChart.options.scales.y.beginAtZero = true;
                    window.enhancedOperationsChart.options.scales.y1.beginAtZero = true;
                    delete window.enhancedOperationsChart.options.scales.y.min;
                    delete window.enhancedOperationsChart.options.scales.y1.min;
                }
                window.enhancedOperationsChart.update();
            }

            // Update collection queries chart Y-axis scale
            if (window.collectionQueriesChart) {
                window.collectionQueriesChart.options.scales.y.type = scaleType;
                if (scaleType === "logarithmic") {
                    window.collectionQueriesChart.options.scales.y.beginAtZero = false;
                    window.collectionQueriesChart.options.scales.y.min = 1; // Avoid log(0)
                } else {
                    window.collectionQueriesChart.options.scales.y.beginAtZero = true;
                    delete window.collectionQueriesChart.options.scales.y.min;
                }
                window.collectionQueriesChart.update();
            }

            // Update service time analysis line chart Y-axis scale
            if (window.serviceTimeAnalysisLineChart) {
                window.serviceTimeAnalysisLineChart.options.scales.y.type = scaleType;
                if (scaleType === "logarithmic") {
                    window.serviceTimeAnalysisLineChart.options.scales.y.beginAtZero = false;
                    window.serviceTimeAnalysisLineChart.options.scales.y.min = 0.001; // Avoid log(0) for small times
                } else {
                    window.serviceTimeAnalysisLineChart.options.scales.y.beginAtZero = true;
                    delete window.serviceTimeAnalysisLineChart.options.scales.y.min;
                }
                window.serviceTimeAnalysisLineChart.update();
            }

            // Note: parseDurationChart and planDurationChart use fixed y-axis positions
            // and do not respond to the scale toggle, similar to durationBucketsChart

        }

        // Flag to prevent lazy tab loading during time grouping changes
        let isChangingTimeGrouping = false;
        
        // Change time grouping for all charts
        function changeTimeGrouping() {
            Logger.trace(`🔍 changeTimeGrouping() called`);
            
            // Set flag to prevent lazy tab loading
            isChangingTimeGrouping = true;
            
            // Use the currently filtered data from the last parse
            let requests = [];
            
            // First try to use window.currentFilteredRequests (already filtered)
            if (window.currentFilteredRequests && window.currentFilteredRequests.length > 0) {
                requests = window.currentFilteredRequests;
                Logger.debug(`Time grouping change: Using current filtered data: ${requests.length} requests`);
            } else if (originalRequests.length > 0) {
                // Fallback: re-apply filters to original data
                const startDateInput = document.getElementById("start-date");
                const endDateInput = document.getElementById("end-date");
                const startDate = startDateInput.value
                    ? new Date(startDateInput.value)
                    : null;
                const endDate = endDateInput.value
                    ? new Date(endDateInput.value)
                    : null;
                
                Logger.debug(`Time grouping change: Original requests: ${originalRequests.length}, Date range: ${startDate} to ${endDate}`);
                
                requests = filterRequestsByDateRange(
                    originalRequests,
                    startDate,
                    endDate
                );
                
                Logger.debug(`After date filtering: ${requests.length} requests`);

                // Apply SQL filter and system query exclusion
                requests = filterSystemQueries(requests);
                
                Logger.debug(`After SQL/system filtering: ${requests.length} requests`);
            } else {
                // Fallback to parsing JSON if no original data
                const jsonInput = document.getElementById("json-input").value;
                if (!jsonInput.trim()) return;

                try {
                    const data = JSON.parse(jsonInput);
                    if (Array.isArray(data)) {
                        requests = data.map((item) => ({
                            ...item.completed_requests,
                            plan: item.plan
                                ? typeof item.plan === "string"
                                    ? JSON.parse(item.plan)
                                    : item.plan
                                : null,
                        }));
                    }

                    // Apply SQL filter and system query exclusion to parsed data
                    requests = filterSystemQueries(requests);
                } catch (e) {
                    console.error("Error parsing JSON for time grouping change:", e);
                    return;
                }
            }

            try {
                // Update the optimizer label to show current optimization
                updateOptimizerLabel(requests);

                // Clear any pending chart tasks from previous lazy loading
                resetChartLoadingCounters();

                // Destroy only Timeline tab charts before regenerating
                destroyTimelineCharts();

                // Clear vertical line state from all destroyed charts to prevent stake misalignment (Issue #234)
                timelineCharts.length = 0;

                // Regenerate all charts with new time grouping
                generateFilterChart(requests);
                generateTimelineChart(requests);
                
                // Clear flag after async chart creation completes
                setTimeout(() => {
                    isChangingTimeGrouping = false;
                    Logger.trace(`🔍 Time grouping change complete - flag cleared`);
                }, 1000);
            } catch (e) {
                console.error("Error regenerating charts:", e);
                isChangingTimeGrouping = false;
            }
        }

        // Global data stores now imported from data-layer.js via window
        // Access via: window.originalRequests, window.statementStore, window.analysisStatementStore

        // Parse Couchbase datetime to JavaScript Date
        function parseCouchbaseDateTime(dateTimeStr) {
            if (!dateTimeStr) return null;
            // Handle various Couchbase datetime formats
            const isoString = dateTimeStr.replace(" ", "T");
            return new Date(isoString);
        }

        // Convert requestTime string to Date in selected timezone for chart display

        // Convert Date to specified timezone and return Date object
        function convertToTimezone(date, timezone) {
            if (!date || isNaN(date.getTime())) return null;
            
            // If timezone is UTC or not specified, return original date
            if (!timezone || timezone === "UTC") {
                return date;
            }
            
            try {
                // Convert to target timezone string, then parse back to Date
                const options = {
                    timeZone: timezone,
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                };
                
                const formatter = new Intl.DateTimeFormat('en-US', options);
                const parts = formatter.formatToParts(date);
                
                const getValue = (type) => parts.find(p => p.type === type)?.value;
                const year = getValue('year');
                const month = getValue('month');
                const day = getValue('day');
                const hour = getValue('hour');
                const minute = getValue('minute');
                const second = getValue('second');
                
                // Create new date in local time zone with the converted values
                return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
            } catch (e) {
                console.error("Error converting timezone:", e);
                return date; // Return original date on error
            }
        }

        // Convert Date to datetime-local input format in selected timezone
        // Update the timezone label next to date pickers
        function updateDatePickerTimezoneLabel() {
            const label = document.getElementById("date-picker-timezone-label");
            if (label) {
                const tz = currentTimezone || "UTC";
                // Get abbreviated timezone name (e.g., "PST", "EDT", "UTC")
                try {
                    const formatter = new Intl.DateTimeFormat('en-US', {
                        timeZone: tz,
                        timeZoneName: 'short'
                    });
                    const parts = formatter.formatToParts(new Date());
                    const tzAbbr = parts.find(part => part.type === 'timeZoneName')?.value || tz;
                    label.textContent = `(${tzAbbr})`;
                } catch (e) {
                    // Fallback to full timezone name if abbreviation fails
                    label.textContent = `(${tz})`;
                }
            }
        }
        
        function toDateTimeLocal(date, timezone) {
            if (!date || isNaN(date.getTime())) return "";
            
            // Use currentTimezone if timezone not specified, default to UTC if still undefined
            const tz = timezone || currentTimezone || "UTC";
            
            try {
                // Convert to target timezone (or return original if UTC)
                const convertedDate = convertToTimezone(date, tz);
                if (!convertedDate || isNaN(convertedDate.getTime())) {
                    // Fallback to original date if conversion fails
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, "0");
                    const day = String(date.getDate()).padStart(2, "0");
                    const hours = String(date.getHours()).padStart(2, "0");
                    const minutes = String(date.getMinutes()).padStart(2, "0");
                    const seconds = String(date.getSeconds()).padStart(2, "0");
                    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
                }
                
                const year = convertedDate.getFullYear();
                const month = String(convertedDate.getMonth() + 1).padStart(2, "0");
                const day = String(convertedDate.getDate()).padStart(2, "0");
                const hours = String(convertedDate.getHours()).padStart(2, "0");
                const minutes = String(convertedDate.getMinutes()).padStart(2, "0");
                const seconds = String(convertedDate.getSeconds()).padStart(2, "0");
                return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
            } catch (e) {
                console.error("Error in toDateTimeLocal:", e);
                // Fallback to simple formatting without timezone conversion
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, "0");
                const day = String(date.getDate()).padStart(2, "0");
                const hours = String(date.getHours()).padStart(2, "0");
                const minutes = String(date.getMinutes()).padStart(2, "0");
                const seconds = String(date.getSeconds()).padStart(2, "0");
                return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
            }
        }

        // Filter requests by date range
        function filterRequestsByDateRange(requests, startDate, endDate) {
            if (!startDate && !endDate) return requests;

            return requests.filter((request) => {
                const requestDate = parseCouchbaseDateTime(request.requestTime);
                if (!requestDate) return true; // Include requests with invalid dates

                if (startDate && requestDate < startDate) return false;
                if (endDate && requestDate > endDate) return false;
                return true;
            });
        }

        // Calculate timespan string from requests
        function calculateTimespan(requests) {
            if (!requests || requests.length === 0) return "";
            
            const times = requests
                .map(r => new Date(r.requestTime))
                .filter(d => !isNaN(d.getTime()));
            
            if (times.length === 0) return "";
            
            const minTime = Math.min(...times.map(d => d.getTime()));
            const maxTime = Math.max(...times.map(d => d.getTime()));
            const spanMs = maxTime - minTime;
            
            if (spanMs === 0) return "over 0 seconds";
            
            const seconds = Math.floor(spanMs / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);
            const weeks = Math.floor(days / 7);
            const months = Math.floor(days / 30);
            
            if (months > 0) return `over ${months} ${months === 1 ? 'month' : 'months'}`;
            if (weeks > 0) return `over ${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
            if (days > 0) return `over ${days} ${days === 1 ? 'day' : 'days'}`;
            if (hours > 0) return `over ${hours} ${hours === 1 ? 'hour' : 'hours'}`;
            if (minutes > 0) return `over ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
            return `over ${seconds} ${seconds === 1 ? 'second' : 'seconds'}`;
        }

        // Update filter info display
        function updateFilterInfo(originalCount, filteredCount, requests = null) {
            const filterInfo = document.getElementById("filter-info");
            const queriesBadge = document.getElementById("queries-fixed-badge");
            const timespan = requests ? calculateTimespan(requests) : "";
            const timespanText = timespan ? `, ${timespan}` : "";
            
            if (originalCount === filteredCount) {
                const html = `Showing all <strong>${originalCount}</strong> queries${timespanText}`;
                if (filterInfo) filterInfo.innerHTML = html;
                if (queriesBadge) queriesBadge.innerHTML = html;
            } else {
                const html = `Showing <strong>${filteredCount}</strong> of <strong>${originalCount}</strong> queries${timespanText}`;
                if (filterInfo) filterInfo.innerHTML = html;
                if (queriesBadge) queriesBadge.innerHTML = html;
            }
        }

        // Generate Dashboard Charts

        // Check if a query uses primary index by analyzing the plan (optimized with cache)
        function usesPrimaryIndex(request) {
            if (!request.plan) return false;

            // Check if we have cached metadata first
            if (request._planMetadata) {
                return request._planMetadata.usesPrimary;
            }

            try {
                const planObj =
                    typeof request.plan === "string"
                        ? JSON.parse(request.plan)
                        : request.plan;

                // Check plan cache
                if (planStatsCache.has(planObj)) {
                    return planStatsCache.get(planObj).usesPrimary;
                }

                return checkOperatorForPrimary(planObj);
            } catch (e) {
                return false;
            }
        }

        // Determine the index type used: 'Primary', 'Sequential Scan', or 'GSI'
        function getIndexType(request) {
            if (!request.plan) return 'GSI';

            try {
                const planObj =
                    typeof request.plan === "string"
                        ? JSON.parse(request.plan)
                        : request.plan;
                return checkOperatorForIndexType(planObj);
            } catch (e) {
                return 'GSI';
            }
        }

        // Recursively check operators to determine index type
        function checkOperatorForIndexType(operator) {
            if (!operator) return 'GSI';

            // Check for sequential scan first (most specific)
            if (operator.using === "sequentialscan") {
                return 'Sequential Scan';
            }

            // Check for primary index indicators
            if (
                operator["#operator"] === "PrimaryScan" ||
                operator["#operator"] === "PrimaryScan3" ||
                operator.index === "#primary" ||
                (operator.spans && operator.spans.length === 0)
            ) {
                return 'Primary';
            }

            // Recursively check child operators
            if (operator["~child"]) {
                const childType = checkOperatorForIndexType(operator["~child"]);
                if (childType !== 'GSI') return childType;
            }
            if (operator["~children"] && Array.isArray(operator["~children"])) {
                for (const child of operator["~children"]) {
                    const childType = checkOperatorForIndexType(child);
                    if (childType !== 'GSI') return childType;
                }
            }
            if (operator.input) {
                const inputType = checkOperatorForIndexType(operator.input);
                if (inputType !== 'GSI') return inputType;
            }
            if (operator.inputs && Array.isArray(operator.inputs)) {
                for (const input of operator.inputs) {
                    const inputType = checkOperatorForIndexType(input);
                    if (inputType !== 'GSI') return inputType;
                }
            }
            if (operator.left) {
                const leftType = checkOperatorForIndexType(operator.left);
                if (leftType !== 'GSI') return leftType;
            }
            if (operator.right) {
                const rightType = checkOperatorForIndexType(operator.right);
                if (rightType !== 'GSI') return rightType;
            }
            // Check for first and second properties (used in set operations like ExceptAll)
            if (operator.first) {
                const firstType = checkOperatorForIndexType(operator.first);
                if (firstType !== 'GSI') return firstType;
            }
            if (operator.second) {
                const secondType = checkOperatorForIndexType(operator.second);
                if (secondType !== 'GSI') return secondType;
            }
            // Check for scans array (used in UnionScan, IntersectScan, etc.)
            if (operator.scans && Array.isArray(operator.scans)) {
                for (const scan of operator.scans) {
                    const scanType = checkOperatorForIndexType(scan);
                    if (scanType !== 'GSI') return scanType;
                }
            }
            // Check for scan property (used in DistinctScan)
            if (operator.scan) {
                const scanType = checkOperatorForIndexType(operator.scan);
                if (scanType !== 'GSI') return scanType;
            }
            // Check for subqueries array
            if (operator["~subqueries"] && Array.isArray(operator["~subqueries"])) {
                for (const subquery of operator["~subqueries"]) {
                    if (subquery.executionTimings) {
                        const subType = checkOperatorForIndexType(subquery.executionTimings);
                        if (subType !== 'GSI') return subType;
                    }
                }
            }

            return 'GSI';
        }

        // Recursively check operators for primary index usage
        function checkOperatorForPrimary(operator) {
            if (!operator) return false;

            // Check for primary index indicators
            if (
                operator["#operator"] === "PrimaryScan" ||
                operator["#operator"] === "PrimaryScan3" ||
                operator.index === "#primary" ||
                operator.using === "sequentialscan" ||
                (operator.spans && operator.spans.length === 0)
            ) {
                return true;
            }

            // Recursively check child operators
            if (operator["~child"] && checkOperatorForPrimary(operator["~child"]))
                return true;
            if (operator["~children"] && Array.isArray(operator["~children"])) {
                for (const child of operator["~children"]) {
                    if (checkOperatorForPrimary(child)) return true;
                }
            }
            if (operator.input && checkOperatorForPrimary(operator.input))
                return true;
            if (operator.inputs && Array.isArray(operator.inputs)) {
                for (const input of operator.inputs) {
                    if (checkOperatorForPrimary(input)) return true;
                }
            }
            if (operator.left && checkOperatorForPrimary(operator.left))
                return true;
            if (operator.right && checkOperatorForPrimary(operator.right))
                return true;
            // Check for first and second properties (used in set operations like ExceptAll)
            if (operator.first && checkOperatorForPrimary(operator.first))
                return true;
            if (operator.second && checkOperatorForPrimary(operator.second))
                return true;
            // Check for scans array (used in UnionScan, IntersectScan, etc.)
            if (operator.scans && Array.isArray(operator.scans)) {
                for (const scan of operator.scans) {
                    if (checkOperatorForPrimary(scan)) return true;
                }
            }
            // Check for scan property (used in DistinctScan)
            if (operator.scan && checkOperatorForPrimary(operator.scan))
                return true;
            // Check for subqueries array
            if (operator["~subqueries"] && Array.isArray(operator["~subqueries"])) {
                for (const subquery of operator["~subqueries"]) {
                    if (
                        subquery.executionTimings &&
                        checkOperatorForPrimary(subquery.executionTimings)
                    )
                        return true;
                }
            }

            return false;
        }

        // Primary Scan Used Donut Chart

        // Query State Pie Chart
        function drawPieLabelsWithLeaders(chart, total, options) {
    const ctx = chart.ctx;
    const dataset = chart.data.datasets[0];
    const meta = chart.getDatasetMeta(0);
    const opts = Object.assign({
        insideThreshold: 10,
        font: 'bold 14px Arial',
        textColor: '#111', // outside label color
        leaderLineLength: 12,
        labelPadding: 4,
        percentDecimals: 1,
        insideTextColor: null, // string or (index, bgColor) => string
    }, options || {});

    function parseRGB(colorStr) {
        if (!colorStr || typeof colorStr !== 'string') return null;
        if (colorStr[0] === '#') {
            let r, g, b;
            if (colorStr.length === 4) {
                r = parseInt(colorStr[1] + colorStr[1], 16);
                g = parseInt(colorStr[2] + colorStr[2], 16);
                b = parseInt(colorStr[3] + colorStr[3], 16);
                return { r, g, b };
            }
            if (colorStr.length === 7) {
                r = parseInt(colorStr.slice(1, 3), 16);
                g = parseInt(colorStr.slice(3, 5), 16);
                b = parseInt(colorStr.slice(5, 7), 16);
                return { r, g, b };
            }
            return null;
        }
        const m = colorStr.match(/rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
        if (m) return { r: +m[1], g: +m[2], b: +m[3] };
        return null;
    }

    function getContrastText(bgColor, fallback) {
        const rgb = parseRGB(bgColor);
        if (!rgb) return fallback || '#fff';
        const brightness = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b; // 0..255
        return brightness > 180 ? '#111' : '#fff';
    }

    ctx.save();
    ctx.font = opts.font;

    dataset.data.forEach((value, index) => {
        if (!value || total <= 0) return;
        const percent = (value / total) * 100;
        const metaEntry = meta.data[index];
        if (!metaEntry || typeof metaEntry.getProps !== 'function') return;

        const p = metaEntry.getProps(['x','y','startAngle','endAngle','outerRadius','innerRadius'], true);
        const angle = (p.startAngle + p.endAngle) / 2;
        const midRadius = (p.innerRadius + p.outerRadius) / 2;
        const label = percent.toFixed(opts.percentDecimals) + '%';

        // Resolve slice color for contrast and leader stroke
        const bgColor = Array.isArray(dataset.backgroundColor)
            ? dataset.backgroundColor[index]
            : dataset.backgroundColor;

        if (percent >= opts.insideThreshold) {
            const x = p.x + Math.cos(angle) * midRadius;
            const y = p.y + Math.sin(angle) * midRadius;
            const insideColor = typeof opts.insideTextColor === 'function'
                ? opts.insideTextColor(index, bgColor)
                : (opts.insideTextColor || getContrastText(bgColor, '#fff'));
            ctx.fillStyle = insideColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, x, y);
        } else {
            const r = p.outerRadius;
            const x0 = p.x + Math.cos(angle) * r;
            const y0 = p.y + Math.sin(angle) * r;
            const x1 = p.x + Math.cos(angle) * (r + opts.leaderLineLength);
            const y1 = p.y + Math.sin(angle) * (r + opts.leaderLineLength);
            const alignRight = Math.cos(angle) >= 0;
            const x2 = x1 + (alignRight ? 16 : -16);
            const y2 = y1;

            const strokeStyle = bgColor || '#666';
            ctx.strokeStyle = strokeStyle;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x0, y0);
            ctx.lineTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();

            ctx.fillStyle = opts.textColor;
            ctx.textAlign = alignRight ? 'left' : 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, x2 + (alignRight ? opts.labelPadding : -opts.labelPadding), y2);
        }
    });

    ctx.restore();
}


        // Derive statement type from SQL statement text
        function deriveStatementType(statement) {
            if (!statement || typeof statement !== "string") {
                return "UNKNOWN";
            }

            // Decode any HTML entities and strip any HTML-like tags (e.g., <ud>...)</ud>)
            try {
                const tmp = document.createElement('div');
                tmp.innerHTML = statement;
                statement = (tmp.textContent || tmp.innerText || "");
            } catch (e) { /* no-op */ }
            // Remove any residual tags and collapse whitespace
            const cleaned = statement.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

            const trimmed = cleaned.trim().toUpperCase();
            if (!trimmed) {
                return "UNKNOWN";
            }

            // Handle common multi-word statement types first
            if (trimmed.startsWith("CREATE INDEX")) return "CREATE_INDEX";
            if (trimmed.startsWith("DROP INDEX")) return "DROP_INDEX";
            if (trimmed.startsWith("ALTER INDEX")) return "ALTER_INDEX";
            if (trimmed.startsWith("BUILD INDEX")) return "BUILD_INDEX";

            // Get first word for other statement types
            const firstWord = trimmed.split(/\s+/)[0];
            return firstWord;
        }

        // Statement Type Pie Chart

        // Scan Consistency Pie Chart

        // Elapsed Time Distribution Bar Chart
        function drawBarValueLabels(chart, options) {
    const ctx = chart.ctx;
    const dataset = chart.data.datasets[0];
    const meta = chart.getDatasetMeta(0);
    const opts = Object.assign({
        font: 'bold 14px Arial',
        color: '#111',
        yOffset: 4,
        formatter: (v) => (typeof v === 'number' ? v.toLocaleString() : v),
    }, options || {});

    if (!dataset || !meta) return;

    ctx.save();
    ctx.font = opts.font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = opts.color;

    meta.data.forEach((barEl, i) => {
        if (!barEl) return;
        const v = dataset.data[i];
        if (v == null || v === 0) return;
        const p = typeof barEl.getProps === 'function'
            ? barEl.getProps(['x','y','base'], true)
            : { x: barEl.x, y: barEl.y, base: barEl.base };
        const x = p.x;
        const y = Math.min(p.y, p.base) - opts.yOffset; // place above the bar
        const text = opts.formatter(v);
        ctx.fillText(text, x, y);
    });

    ctx.restore();
}

 
        // Helper: Detect query patterns for a single request (Issue #202 - single source of truth)
        function detectQueryPatterns(request) {
            const statement = request.statement || request.preparedText || "";
            const upperStatement = statement.toUpperCase();
            const detectedPatterns = [];

            // No WHERE: if this is an EXECUTE, check the preparedText (actual statement) for WHERE/filters
            const stmtForFilter = (upperStatement.startsWith("EXECUTE") && request.preparedText)
                ? request.preparedText
                : statement;
            if (!hasFilteringMechanism(stmtForFilter)) {
                detectedPatterns.push("No WHERE");
            }

            // GROUP BY
            if (upperStatement.includes(" GROUP BY ")) {
                detectedPatterns.push("GROUP BY");
            }

            // ORDER BY
            if (upperStatement.includes(" ORDER BY ")) {
                detectedPatterns.push("ORDER BY");
            }

            // USE INDEX
            if (upperStatement.includes("USE INDEX")) {
                detectedPatterns.push("USE INDEX");
            }

            // USE KEYS
            if (upperStatement.includes("USE KEYS")) {
                detectedPatterns.push("USE KEYS");
            }

            // JOIN
            if (upperStatement.includes(" JOIN ")) {
                detectedPatterns.push("JOIN");
            }

            // NEST
            if (upperStatement.includes(" NEST ")) {
                detectedPatterns.push("NEST");
            }

            // UNNEST
            if (upperStatement.includes(" UNNEST ")) {
                detectedPatterns.push("UNNEST");
            }

            // OFFSET
            if (upperStatement.includes(" OFFSET ")) {
                detectedPatterns.push("OFFSET");
            }

            // SEARCH
            if (upperStatement.includes(" SEARCH(")) {
                detectedPatterns.push("SEARCH");
            }

            // WITH (ensure it's a SQL clause, not a backticked field name)
            if ((upperStatement.startsWith("WITH ") || upperStatement.includes(" WITH ")) && !upperStatement.includes("`WITH`")) {
                detectedPatterns.push("WITH");
            }

            // LET
            if (upperStatement.includes(" LET ")) {
                detectedPatterns.push("LET");
            }

            // ARRAY QUERY - detects array query patterns with ANY/EVERY operators per Couchbase docs:
            // 1. ANY + IN/WITHIN + SATISFIES + END pattern
            // 2. EVERY + IN/WITHIN + SATISFIES + END pattern
            // 3. ANY AND EVERY + IN/WITHIN + SATISFIES + END pattern
            // Note: UNNEST is counted separately above
            const hasAnySatisfies = (
                upperStatement.includes(" ANY ") &&
                upperStatement.includes(" SATISFIES ") &&
                (upperStatement.includes(" END ") || upperStatement.endsWith(" END"))
            );
            const hasEverySatisfies = (
                upperStatement.includes(" EVERY ") &&
                !upperStatement.includes("ANY AND EVERY") &&
                upperStatement.includes(" SATISFIES ") &&
                (upperStatement.includes(" END ") || upperStatement.endsWith(" END"))
            );
            const hasAnyAndEvery = (
                upperStatement.includes("ANY AND EVERY") &&
                upperStatement.includes(" SATISFIES ") &&
                (upperStatement.includes(" END ") || upperStatement.endsWith(" END"))
            );
            
            if (hasAnySatisfies || hasEverySatisfies || hasAnyAndEvery) {
                detectedPatterns.push("ARRAY QUERY");
            }

            // SELECT * (matches SELECT * FROM or SELECT *, field FROM, but not qualified wildcards like c.*)
            const selectStarMatch = upperStatement.match(/SELECT\s+\*[\s,]/);
            if (selectStarMatch) {
                detectedPatterns.push("SELECT *");
            }

            // LIKE (ensure it's an operator, not a backticked field name)
            if (upperStatement.includes(" LIKE ") && !upperStatement.includes("`LIKE`")) {
                detectedPatterns.push("LIKE");
            }

            // COUNT
            if (upperStatement.includes(" COUNT(")) {
                detectedPatterns.push("COUNT");
            }

            // DISTINCT
            if (upperStatement.includes(" DISTINCT ")) {
                detectedPatterns.push("DISTINCT");
            }

            // REGEX
            if (upperStatement.includes("REGEXP_") || /REGEX\s*\(/i.test(statement)) {
                detectedPatterns.push("REGEX");
            }

            // EXECUTE
            if (upperStatement.startsWith("EXECUTE")) {
                detectedPatterns.push("EXECUTE");
            }

            // LIMIT
            if (upperStatement.includes(" LIMIT ")) {
                detectedPatterns.push("LIMIT");
            }

            // UNION
            if (upperStatement.includes(" UNION ")) {
                detectedPatterns.push("UNION");
            }

            return detectedPatterns;
        }
 
        // Generate Query Pattern Chart

        // Generate 3D Pattern-Collection Surface Chart (Dev Feature)
        // Generate ECharts 3D Bar Chart (Dev Feature)

        // Expand ECharts 3D Bar Chart to fullscreen
        function expandEChartsChart() {
            const option = {
                title: {
                    text: 'Query Pattern By Collection',
                    left: 'center',
                    top: 10,
                    textStyle: {
                        fontSize: 16,
                        fontWeight: 'bold'
                    }
                },
                tooltip: {
                    formatter: function(params) {
                        const pIdx = params.value[0];
                        const cIdx = params.value[1];
                        const logCount = params.value[2];
                        const actualCount = params.data.actualCount;
                        return `${patterns[pIdx]}<br/>${collections[cIdx]}<br/>Log Count: ${logCount.toFixed(2)}<br/>Actual Count: ${actualCount}`;
                    }
                },
                xAxis3D: {
                    type: 'category',
                    data: patterns,
                    name: 'Query Pattern',
                    nameTextStyle: {
                        fontSize: 14,
                        fontWeight: 'bold'
                    },
                    axisLabel: {
                        interval: 0,
                        rotate: 45,
                        fontSize: 10
                    }
                },
                yAxis3D: {
                    type: 'category',
                    data: collections,
                    name: 'Collection',
                    nameTextStyle: {
                        fontSize: 14,
                        fontWeight: 'bold'
                    },
                    axisLabel: {
                        interval: Math.max(0, Math.ceil(collections.length / 10) - 1),
                        fontSize: 10
                    }
                },
                zAxis3D: {
                    type: 'value',
                    name: 'Usage Count (log₁₀)',
                    nameTextStyle: {
                        fontSize: 14,
                        fontWeight: 'bold'
                    }
                },
                grid3D: {
                    boxWidth: 200,
                    boxDepth: Math.min(200, collections.length * 5),
                    boxHeight: 100,
                    viewControl: {
                        alpha: 19.3,
                        beta: 41.1,
                        distance: 362.6,
                        minDistance: 100,
                        maxDistance: 500
                    },
                    light: {
                        main: {
                            intensity: 1.2,
                            shadow: true
                        },
                        ambient: {
                            intensity: 0.3
                        }
                    }
                },
                series: [{
                    type: 'bar3D',
                    data: data.map(d => ({
                        value: [d[0], d[1], d[2]],
                        itemStyle: { color: d[4] },
                        actualCount: d[3]
                    })),
                    shading: 'lambert',
                    label: {
                        show: false
                    },
                    itemStyle: {
                        opacity: 0.95
                    },
                    emphasis: {
                        label: {
                            show: false
                        },
                        itemStyle: {
                            opacity: 1,
                            color: '#900'
                        }
                    }
                }]
            };

            myChart.setOption(option);

            Logger.info(`✅ ECharts 3D Bar created: ${collections.length} collections x ${patterns.length} patterns (${data.length} bars)`);
        }

        // Expand ECharts 3D Bar Chart to fullscreen
        function expandEChartsChart() {
            const { collections, patterns, collectionPatternCounts, data, maxCount } = window.echartsData;
            if (!collections || !patterns) return;

            // Create modal overlay
            const overlay = document.createElement('div');
            overlay.className = 'chart-fullscreen-overlay active';
            overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 10000; display: flex; align-items: center; justify-content: center;';

            // Create modal content
            const modalContent = document.createElement('div');
            modalContent.style.cssText = 'width: 95%; height: 95%; background: white; border-radius: 8px; padding: 20px; position: relative;';

            // Create close button
            const closeBtn = document.createElement('div');
            closeBtn.className = 'chart-collapse-btn';
            closeBtn.title = 'Collapse chart';
            closeBtn.innerHTML = '✕';
            closeBtn.onclick = () => {
                document.body.removeChild(overlay);
                document.body.style.overflow = '';
            };

            // Create fullscreen chart container
            const fullscreenChartDiv = document.createElement('div');
            fullscreenChartDiv.id = 'echarts-fullscreen';
            fullscreenChartDiv.style.cssText = 'width: calc(100% - 420px); height: 100%;';

            // Create controls and legend container
            const controlsContainer = document.createElement('div');
            controlsContainer.style.cssText = 'position: absolute; top: 50px; right: 20px; width: 400px; background: white; border: 1px solid #444; border-radius: 4px; padding: 10px; max-height: calc(100% - 60px); overflow-y: auto;';

            // Add toggle controls
            const togglesDiv = document.createElement('div');
            togglesDiv.style.cssText = 'margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #ddd;';
            togglesDiv.innerHTML = `
                <div style="margin-bottom: 8px;">
                    <label style="display: flex; align-items: center; cursor: pointer; font-size: 13px; font-weight: bold;">
                        <input type="checkbox" id="echarts-log-scale-toggle" checked style="margin-right: 8px;">
                        Log Scale (log₁₀)
                    </label>
                </div>
                <div>
                    <label style="display: flex; align-items: center; cursor: pointer; font-size: 13px; font-weight: bold;">
                        <input type="checkbox" id="echarts-aggregation-toggle" style="margin-right: 8px;">
                        Aggregation Mode
                    </label>
                    <div style="font-size: 10px; color: #666; margin-left: 24px; margin-top: 2px;">Sum all collections per pattern</div>
                </div>
            `;
            controlsContainer.appendChild(togglesDiv);

            // Add legend header
            const legendHeader = document.createElement('div');
            legendHeader.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;';
            legendHeader.innerHTML = `
                <strong style="font-size: 14px;">Collections:</strong>
                <div>
                    <button id="echarts-fs-show-all" style="padding: 4px 12px; background: #4CAF50; color: white; border: none; border-radius: 3px; cursor: pointer; margin-right: 5px; font-size: 11px;">Show All</button>
                    <button id="echarts-fs-hide-all" style="padding: 4px 12px; background: #f44336; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;">Hide All</button>
                </div>
            `;
            controlsContainer.appendChild(legendHeader);

            // Add search input
            const searchContainer = document.createElement('div');
            searchContainer.style.cssText = 'margin-bottom: 10px;';
            searchContainer.innerHTML = `
                <input type="text" id="echarts-legend-search" placeholder="Search collections..." style="width: 100%; font-size: 11px; padding: 6px 8px; border: 1px solid #dee2e6; border-radius: 3px; box-sizing: border-box;">
            `;
            controlsContainer.appendChild(searchContainer);

            // Create legend items grid
            const itemsGrid = document.createElement('div');
            itemsGrid.style.cssText = 'display: grid; grid-template-columns: 1fr; gap: 6px;';
            itemsGrid.id = 'echarts-legend-items-grid';
            controlsContainer.appendChild(itemsGrid);

            // Assemble modal
            modalContent.appendChild(closeBtn);
            modalContent.appendChild(fullscreenChartDiv);
            modalContent.appendChild(controlsContainer);
            overlay.appendChild(modalContent);
            document.body.appendChild(overlay);
            document.body.style.overflow = 'hidden';

            // State management
            let useLogScale = true;
            let useAggregation = false;
            let visibleCollections = new Set(collections.map((_, idx) => idx));

            // Initialize chart
            const fullscreenChart = echarts.init(fullscreenChartDiv);

            // Helper function to get color

            // Render chart
            function renderChart() {
                let chartData;
                let zAxisTitle;

                if (useAggregation) {
                    // Aggregate: sum all collections per pattern
                    chartData = [];
                    patterns.forEach((pattern, pIdx) => {
                        let totalCount = 0;
                        
                        // Sum across all visible collections for this pattern
                        collections.forEach((collection, cIdx) => {
                            if (!visibleCollections.has(cIdx)) return;
                            totalCount += collectionPatternCounts[collection][pattern] || 0;
                        });
                        
                        if (totalCount > 0) {
                            const value = useLogScale ? Math.log10(totalCount + 1) : totalCount;
                            const color = getColorForCount(totalCount, maxCount);
                            
                            chartData.push({
                                value: [pIdx, 0, value],
                                itemStyle: { color },
                                actualCount: totalCount,
                                patternName: pattern
                            });
                        }
                    });
                    zAxisTitle = useLogScale ? 'Total Count (log₁₀)' : 'Total Count';
                } else {
                    // Individual bars
                    chartData = data
                        .filter(d => visibleCollections.has(d[1]))
                        .map(d => {
                            const value = useLogScale ? d[2] : d[3];
                            return {
                                value: [d[0], d[1], value],
                                itemStyle: { color: d[4] },
                                actualCount: d[3]
                            };
                        });
                    zAxisTitle = useLogScale ? 'Usage Count (log₁₀)' : 'Usage Count';
                }

                const option = {
                    title: {
                        text: 'Query Pattern By Collection',
                        left: 'center',
                        top: 10,
                        textStyle: {
                            fontSize: 18,
                            fontWeight: 'bold'
                        }
                    },
                    tooltip: {
                        formatter: function(params) {
                            if (useAggregation) {
                                const patternName = params.data.patternName;
                                const actualCount = params.data.actualCount;
                                if (useLogScale) {
                                    const displayValue = Math.log10(actualCount + 1).toFixed(2);
                                    return `${patternName}<br/>Log Count: ${displayValue}<br/>Actual: ${actualCount}`;
                                } else {
                                    return `${patternName}<br/>Count: ${actualCount}`;
                                }
                            } else {
                                const pIdx = params.value[0];
                                const cIdx = params.value[1];
                                const actualCount = params.data.actualCount;
                                if (useLogScale) {
                                    const displayValue = Math.log10(actualCount + 1).toFixed(2);
                                    return `${patterns[pIdx]}<br/>${collections[cIdx]}<br/>Log Count: ${displayValue}<br/>Actual: ${actualCount}`;
                                } else {
                                    return `${patterns[pIdx]}<br/>${collections[cIdx]}<br/>Count: ${actualCount}`;
                                }
                            }
                        }
                    },
                    xAxis3D: {
                        type: 'category',
                        data: patterns,
                        name: 'Query Pattern',
                        nameTextStyle: { fontSize: 14, fontWeight: 'bold' },
                        axisLabel: { interval: 0, rotate: 45, fontSize: 10 }
                    },
                    yAxis3D: {
                        type: 'category',
                        data: useAggregation ? ['Total'] : collections,
                        name: useAggregation ? '' : 'Collection',
                        nameTextStyle: { fontSize: 14, fontWeight: 'bold' },
                        axisLabel: { interval: Math.max(0, Math.ceil(collections.length / 10) - 1), fontSize: 10 }
                    },
                    zAxis3D: {
                        type: 'value',
                        name: zAxisTitle,
                        nameTextStyle: { fontSize: 14, fontWeight: 'bold' }
                    },
                    grid3D: {
                        boxWidth: 200,
                        boxDepth: useAggregation ? 50 : Math.min(200, collections.length * 5),
                        boxHeight: 120,
                        viewControl: {
                            alpha: 19.3,
                            beta: 41.1,
                            distance: 362.6,
                            minDistance: 100,
                            maxDistance: 500
                        },
                        light: {
                            main: { intensity: 1.2, shadow: true },
                            ambient: { intensity: 0.3 }
                        }
                    },
                    series: [{
                        type: 'bar3D',
                        data: chartData,
                        shading: 'lambert',
                        label: { show: false },
                        itemStyle: { opacity: 0.95 },
                        emphasis: {
                            label: { show: false },
                            itemStyle: { 
                                opacity: 1,
                                color: '#900'
                            }
                        }
                    }]
                };

                fullscreenChart.setOption(option, true);
            }

            // Populate legend
            function updateLegend() {
                itemsGrid.innerHTML = '';
                
                // Create array of collections with their counts and original index
                const collectionsWithCounts = collections.map((collection, cIdx) => ({
                    collection,
                    cIdx,
                    totalCount: Object.values(collectionPatternCounts[collection]).reduce((sum, v) => sum + v, 0)
                }))
                .filter(item => item.totalCount > 0); // Only show collections with data
                
                // Sort by count descending (highest to lowest)
                collectionsWithCounts.sort((a, b) => b.totalCount - a.totalCount);
                
                // Create legend items in sorted order
                collectionsWithCounts.forEach(({ collection, cIdx, totalCount }) => {
                    const item = document.createElement('div');
                    item.dataset.collectionIndex = cIdx;
                    item.style.cssText = 'display: flex; align-items: center; padding: 6px; background: white; border: 1px solid #ccc; border-radius: 3px; cursor: pointer; font-size: 11px;';
                    if (!visibleCollections.has(cIdx)) item.style.opacity = '0.5';
                    
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.checked = visibleCollections.has(cIdx);
                    checkbox.style.marginRight = '8px';
                    
                    const label = document.createElement('span');
                    label.textContent = `(${totalCount}) ${collection}`;
                    label.style.flex = '1';
                    
                    item.appendChild(checkbox);
                    item.appendChild(label);
                    
                    const toggleVis = () => {
                        if (visibleCollections.has(cIdx)) {
                            visibleCollections.delete(cIdx);
                            checkbox.checked = false;
                            item.style.opacity = '0.5';
                        } else {
                            visibleCollections.add(cIdx);
                            checkbox.checked = true;
                            item.style.opacity = '1';
                        }
                        renderChart();
                    };
                    
                    item.addEventListener('click', (e) => {
                        if (e.target !== checkbox) toggleVis();
                    });
                    checkbox.addEventListener('change', toggleVis);
                    
                    itemsGrid.appendChild(item);
                });
            }

            // Event listeners
            document.getElementById('echarts-log-scale-toggle').addEventListener('change', (e) => {
                useLogScale = e.target.checked;
                renderChart();
            });

            document.getElementById('echarts-aggregation-toggle').addEventListener('change', (e) => {
                useAggregation = e.target.checked;
                renderChart();
            });

            document.getElementById('echarts-fs-show-all').addEventListener('click', () => {
                visibleCollections = new Set(collections.map((_, idx) => idx));
                updateLegend();
                renderChart();
            });

            document.getElementById('echarts-fs-hide-all').addEventListener('click', () => {
                visibleCollections.clear();
                updateLegend();
                renderChart();
            });

            // Search input filtering
            document.getElementById('echarts-legend-search').addEventListener('input', (e) => {
                const searchText = e.target.value.toLowerCase().trim();
                const legendItems = itemsGrid.querySelectorAll('div[data-collection-index]');
                
                legendItems.forEach(item => {
                    const label = item.querySelector('span');
                    const collectionText = label.textContent.toLowerCase();
                    
                    if (searchText === '' || collectionText.includes(searchText)) {
                        item.style.display = 'flex';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });

            // ESC key to close
            document.addEventListener('keydown', function escHandler(e) {
                if (e.key === 'Escape') {
                    closeBtn.click();
                    document.removeEventListener('keydown', escHandler);
                }
            });

            // Initial render
            updateLegend();
            renderChart();

            // Add camera debug display
            addCameraDebugDisplay(fullscreenChart, fullscreenChartDiv, closeBtn, 'pattern-collection');
        }
  
        // Generate User Count Table
        // Helper function to get user list with counts (sorted by count descending)
        function getUserListWithCounts(requests) {
            const userCounts = {};

            requests.forEach((request) => {
                const user = request.users || "Unknown";
                userCounts[user] = (userCounts[user] || 0) + 1;
            });

            const sortedUsers = Object.entries(userCounts).sort(
                ([, a], [, b]) => b - a
            );

            return sortedUsers;
        }

        // Initialize jQuery UI autocomplete for username search inputs
        function initializeUsernameAutocomplete(requests) {
            const sortedUsers = getUserListWithCounts(requests);
            
            // Format data for autocomplete: "username (count)" sorted alphabetically by username
            const autocompleteData = sortedUsers
                .map(([user, count]) => ({
                    label: `${user} (${count})`,
                    value: user
                }))
                .sort((a, b) => a.value.localeCompare(b.value));

            // Destroy existing autocomplete instances before reinitializing
            const analysisUsernameInput = $("#analysis-username-search");
            const everyQueryUsernameInput = $("#username-search");
            
            if (analysisUsernameInput.hasClass("ui-autocomplete-input")) {
                analysisUsernameInput.autocomplete("destroy");
            }
            if (everyQueryUsernameInput.hasClass("ui-autocomplete-input")) {
                everyQueryUsernameInput.autocomplete("destroy");
            }

            // Track if we just selected an item to prevent double trigger
            let justSelected = false;

            // Initialize autocomplete for Analysis tab username search
            analysisUsernameInput.autocomplete({
                source: autocompleteData,
                minLength: 0,
                select: function(event, ui) {
                    justSelected = true;
                    $(this).val(ui.item.value);
                    // Trigger native input event to fire the debounced search
                    this.dispatchEvent(new Event('input', { bubbles: true }));
                    // Reset flag after a short delay
                    setTimeout(() => { justSelected = false; }, 100);
                    return false;
                }
            }).focus(function() {
                if (!justSelected) {
                    $(this).autocomplete("search", $(this).val());
                }
            });

            // Initialize autocomplete for Every Query tab username search
            everyQueryUsernameInput.autocomplete({
                source: autocompleteData,
                minLength: 0,
                select: function(event, ui) {
                    justSelected = true;
                    $(this).val(ui.item.value);
                    // Trigger native input event to fire the debounced search
                    this.dispatchEvent(new Event('input', { bubbles: true }));
                    // Reset flag after a short delay
                    setTimeout(() => { justSelected = false; }, 100);
                    return false;
                }
            }).focus(function() {
                if (!justSelected) {
                    $(this).autocomplete("search", $(this).val());
                }
            });
        }


        // Parse FROM clause to extract bucket.scope.collection
        // Enhanced to support all DML statements based on official Couchbase N1QL documentation:
        // - MERGE INTO target_keyspace USING source_keyspace
        // - UPDATE target_keyspace USE KEYS ... SET ...
        // - UPSERT INTO target_keyspace (KEY, VALUE) ...
        // - INSERT INTO target_keyspace (KEY, VALUE) ...
        // - DELETE FROM target_keyspace
        function parseFromClause(statement) {
            if (!statement) return "_default._default._default";

            try {
                // Remove comments and normalize whitespace
                let cleanStatement = statement
                    .replace(/--.*$/gm, "") // Remove line comments
                    .replace(/\/\*[\s\S]*?\*\//g, "") // Remove block comments
                    .replace(/\s+/g, " ") // Normalize whitespace
                    .trim();
                
                // If statement becomes empty after cleaning, return default
                if (!cleanStatement) {
                    console.warn("Empty statement after comment removal:", statement?.substring(0, 100));
                    return "_default._default._default";
                }

                // Handle PREPARE statements:
                // Pattern 1: PREPARE name FROM actual_statement
                // Pattern 2: PREPARE actual_statement (no name)
                if (cleanStatement.match(/^PREPARE\s+/i)) {
                    // Try pattern with name: PREPARE name FROM statement
                    const namedPrepareMatch = cleanStatement.match(/^PREPARE\s+[a-zA-Z0-9_-]+\s+FROM\s+(.+)$/i);
                    if (namedPrepareMatch) {
                        cleanStatement = namedPrepareMatch[1].trim();
                    } else {
                        // Simple pattern: PREPARE statement (just strip PREPARE keyword)
                        cleanStatement = cleanStatement.replace(/^PREPARE\s+/i, '').trim();
                    }
                }

                let target = null;
                let hasBackticks = false;
                
                // Define all DML/DQL statement keywords that precede the target keyspace
                // MERGE INTO, UPSERT INTO, INSERT INTO, UPDATE, DELETE FROM, FROM
                const statementKeyword = '(?:MERGE\\s+INTO|UPSERT\\s+INTO|INSERT\\s+INTO|UPDATE|DELETE\\s+FROM|FROM)';
                
                // Check for subqueries: FROM ( SELECT ... ) or INSERT INTO x (KEY, VALUE) (SELECT ...)
                const subqueryCheck = cleanStatement.match(new RegExp(statementKeyword + '\\s*\\(', 'i'));
                if (subqueryCheck) {
                    // Find all keyspace references that are NOT followed by (
                    const allTargets = [];
                    const regex = new RegExp(statementKeyword + '\\s+([^\\s(][^\\s]*)', 'gi');
                    let match;
                    while ((match = regex.exec(cleanStatement)) !== null) {
                        const possibleTarget = match[1].trim();
                        if (!possibleTarget.startsWith('(')) {
                            allTargets.push(possibleTarget);
                        }
                    }
                    if (allTargets.length > 0) {
                        target = allTargets[0].replace(/`/g, '');
                        hasBackticks = allTargets[0].includes('`');
                    }
                }
                
                // If not subquery or couldn't extract, try normal patterns
                if (!target) {
                    // Pattern 1: Mixed backticks - bucket.`scope`.`collection` (bucket not backticked)
                    const mixedBacktickMatch = cleanStatement.match(new RegExp(statementKeyword + '\\s+([a-zA-Z0-9_-]+)\\.`([^`]+)`\\.`([^`]+)`', 'i'));
                    if (mixedBacktickMatch) {
                        target = `${mixedBacktickMatch[1]}.${mixedBacktickMatch[2]}.${mixedBacktickMatch[3]}`;
                        hasBackticks = true;
                    } else {
                        // Pattern 2: Fully backticked - `bucket`.`scope`.`collection`
                        const fullBacktickMatch = cleanStatement.match(new RegExp(statementKeyword + '\\s+`([^`]+)`\\.`([^`]+)`\\.`([^`]+)`', 'i'));
                        if (fullBacktickMatch) {
                            target = `${fullBacktickMatch[1]}.${fullBacktickMatch[2]}.${fullBacktickMatch[3]}`;
                            hasBackticks = true;
                        } else {
                            // Pattern 3: Two-part backticked - `bucket`.`scope`
                            const twoPartBacktickMatch = cleanStatement.match(new RegExp(statementKeyword + '\\s+`([^`]+)`\\.`([^`]+)`', 'i'));
                            if (twoPartBacktickMatch) {
                                target = `${twoPartBacktickMatch[1]}.${twoPartBacktickMatch[2]}`;
                                hasBackticks = true;
                            } else {
                                // Pattern 4: Single backticked - `bucket.scope.collection` or `bucket`
                                const singleBacktickMatch = cleanStatement.match(new RegExp(statementKeyword + '\\s+`([^`]+)`', 'i'));
                                if (singleBacktickMatch) {
                                    target = singleBacktickMatch[1].trim();
                                    hasBackticks = true;
                                } else {
                                    // Pattern 5: No backticks - bucket.scope.collection or bucket
                                    // Must account for optional aliases: UPDATE hotel h, MERGE INTO airport t
                                    // Syntax: keyspace-ref ( AS? alias )?
                                    // Stop keywords cover SELECT, DML, and JOIN/WHERE clauses:
                                    // - WHERE, JOIN, LET, NEST, UNNEST, GROUP, ORDER, LIMIT (SELECT clauses)
                                    // - USE KEYS (UPDATE with specific keys)
                                    // - USING (MERGE source clause)
                                    // - SET (UPDATE assignments)
                                    // - VALUES (INSERT/UPSERT values)
                                    // - KEY (INSERT/UPSERT key specification)
                                    // - ON (JOIN/MERGE conditions)
                                    // - AS (aliases)
                                    // - RETURNING (DML output)
                                    // - WHEN (MERGE conditions)
                                    const stopKeywords = '(?:WHERE|JOIN|USE\\s+(?:KEYS|INDEX)|USING|LET|NEST|UNNEST|GROUP|ORDER|LIMIT|ON|AS|SET|VALUES|KEY|RETURNING|WHEN)';
                                    // Optional alias pattern: (?:\s+(?:AS\s+)?[a-zA-Z0-9_-]+)?
                                    // This allows: keyspace, keyspace AS alias, or keyspace alias
                                    const multiPartMatch = cleanStatement.match(new RegExp(statementKeyword + '\\s+([a-zA-Z0-9_-]+(?:\\.[a-zA-Z0-9_-]+)*)(?:\\s+(?:AS\\s+)?[a-zA-Z0-9_-]+)?(?:\\s+' + stopKeywords + '|;|\\s*$|\\s*\\()', 'i'));
                                    if (multiPartMatch) {
                                        target = multiPartMatch[1].trim();
                                    }
                                }
                            }
                        }
                    }
                }
                
                // If no valid target found, return default
                if (!target) {
                    Logger.debug("[parseFromClause] No target found in cleaned statement:", cleanStatement.substring(0, 200));
                    return "_default._default._default";
                }
                
                // Split by dots and filter out empty parts
                const parts = target.split(".").filter(p => p.length > 0);
                
                // Validate that parts look like real bucket/scope/collection names
                const isValid = parts.every(p => /^[a-zA-Z0-9_-]+$/.test(p));
                if (!isValid) return "_default._default._default";

                // Parse based on number of parts
                if (parts.length === 1) {
                    // Single word bucket name (with or without backticks)
                    return `${parts[0]}._default._default`;
                } else if (parts.length === 2) {
                    // bucket.scope format
                    return `${parts[0]}.${parts[1]}._default`;
                } else if (parts.length >= 3) {
                    // bucket.scope.collection format
                    return `${parts[0]}.${parts[1]}.${parts[2]}`;
                }

                return "_default._default._default";
            } catch (error) {
                console.warn("Error parsing FROM clause:", error, statement);
                return "_default._default._default";
            }
        }

        // Hash utilities now imported from base.js (window.DebugRedactor)
        // Shorthand functions for backward compatibility
        function hashName(name) { return window.DebugRedactor.hash(name); }
        function hashBSC(bsc) { return window.DebugRedactor.redactBSC(bsc); }
        function hashCompositeKey(key) { return window.DebugRedactor.redactCompositeKey(key); }
        function hashQuery(query) { return window.DebugRedactor.redactQuery(query); }

        // Generate Index Count Table

        // Recursively extract index names from plan operators with improved error handling
        function extractIndexNames(
            operator,
            indexData,
            bucketScopeCollection,
            depth = 0
        ) {
            if (!operator || !indexData) return;

            // Prevent infinite recursion
            if (depth > 50) {
                console.warn("Maximum recursion depth reached in extractIndexNames");
                return;
            }

            try {
                // Helper function to add index to data using composite key
                function addIndexToData(indexName) {
                    let resolvedName = indexName;

                    // If this is #primary, try to resolve to actual primary index name
                    if (indexName === "#primary") {
                        const actualPrimary = resolvePrimaryIndexName(
                            bucketScopeCollection || "unknown.unknown.unknown"
                        );
                        if (actualPrimary && actualPrimary !== "#primary") {
                            resolvedName = actualPrimary;
                        }
                    }

                    // Use composite key: indexName::bucket.scope.collection
                    const compositeKey = `${resolvedName}::${bucketScopeCollection || "unknown.unknown.unknown"}`;
                    
                    if (!indexData[compositeKey]) {
                        indexData[compositeKey] = {
                            indexName: resolvedName,
                            count: 0,
                            bucketScopeCollection: bucketScopeCollection || "unknown",
                        };
                    }
                    indexData[compositeKey].count++;
                }

                // Check for index name in various operator properties
                if (operator.index && typeof operator.index === "string") {
                    addIndexToData(operator.index);
                }
                if (operator.indexName && typeof operator.indexName === "string") {
                    addIndexToData(operator.indexName);
                }

                // Check for primary scan operators (align with usesPrimaryIndex logic)
                if (
                    operator["#operator"] === "PrimaryScan" ||
                    operator["#operator"] === "PrimaryScan3" ||
                    operator.index === "#primary" ||
                    operator.using === "sequentialscan" ||
                    (operator.spans &&
                        Array.isArray(operator.spans) &&
                        operator.spans.length === 0)
                ) {
                    // Only add #primary if we don't already have the actual index name
                    if (!operator.index || operator.index === "#primary") {
                        addIndexToData("#primary");
                    }
                    // If operator.index exists and is not #primary, it was already added above
                }

                // Recursively check child operators
                if (operator["~child"]) {
                    extractIndexNames(
                        operator["~child"],
                        indexData,
                        bucketScopeCollection,
                        depth + 1
                    );
                }
                if (operator["~children"] && Array.isArray(operator["~children"])) {
                    operator["~children"].forEach((child) =>
                        extractIndexNames(
                            child,
                            indexData,
                            bucketScopeCollection,
                            depth + 1
                        )
                    );
                }
            } catch (e) {
                console.warn("Error in extractIndexNames:", e);
            }
            if (operator.input) {
                extractIndexNames(operator.input, indexData, bucketScopeCollection);
            }
            if (operator.inputs && Array.isArray(operator.inputs)) {
                operator.inputs.forEach((input) =>
                    extractIndexNames(input, indexData, bucketScopeCollection)
                );
            }
            if (operator.left) {
                extractIndexNames(operator.left, indexData, bucketScopeCollection);
            }
            if (operator.right) {
                extractIndexNames(operator.right, indexData, bucketScopeCollection);
            }
            // Check for first and second properties (used in set operations like ExceptAll)
            if (operator.first) {
                extractIndexNames(operator.first, indexData, bucketScopeCollection);
            }
            if (operator.second) {
                extractIndexNames(operator.second, indexData, bucketScopeCollection);
            }
            // Check for scans array (used in UnionScan, IntersectScan, etc.)
            if (operator.scans && Array.isArray(operator.scans)) {
                operator.scans.forEach((scan) =>
                    extractIndexNames(scan, indexData, bucketScopeCollection)
                );
            }
            // Check for scan property (used in DistinctScan)
            if (operator.scan) {
                extractIndexNames(operator.scan, indexData, bucketScopeCollection);
            }
            // Check for subqueries array
            if (operator["~subqueries"] && Array.isArray(operator["~subqueries"])) {
                operator["~subqueries"].forEach((subquery) => {
                    if (subquery.executionTimings) {
                        extractIndexNames(
                            subquery.executionTimings,
                            indexData,
                            bucketScopeCollection
                        );
                    }
                });
            }
        }

        // Update Insights tab with live data

        // Analyze core execTime vs kernel time ratio
        function analyzeCoreExecToKernelRatio(operator) {
            if (!operator) return { coreToKernelRatio: 0 };

            let totalExecTime = 0;
            let streamExecTime = 0;
            let highestKernelTime = 0;

            function sumExecAndKernelTimes(op) {
                if (!op) return;

                if (op["#stats"]) {
                    const stats = op["#stats"];

                    // Sum all execTime
                    if (stats["execTime"]) {
                        const execTime = parseTime(stats["execTime"]);
                        if (!isNaN(execTime)) {
                            totalExecTime += execTime;

                            // Track stream execTime separately
                            if (op["#operator"] === "Stream") {
                                streamExecTime += execTime;
                            }
                        }
                    }

                    // Track highest kernel time
                    if (stats["kernTime"]) {
                        const kernTime = parseTime(stats["kernTime"]);
                        if (!isNaN(kernTime)) {
                            highestKernelTime = Math.max(highestKernelTime, kernTime);
                        }
                    }
                }

                // Recursively check child operators
                if (op["~child"]) {
                    sumExecAndKernelTimes(op["~child"]);
                }
                if (op["~children"]) {
                    for (const child of op["~children"]) {
                        sumExecAndKernelTimes(child);
                    }
                }
            }

            sumExecAndKernelTimes(operator);

            // Calculate core execTime (total minus stream) vs kernel time ratio
            const coreExecTime = totalExecTime - streamExecTime;
            const coreToKernelRatio = highestKernelTime > 0 ? (coreExecTime / highestKernelTime) * 100 : 0;



            return {
                coreToKernelRatio: coreToKernelRatio
            };
        }

        // Analyze stream execution time vs elapsed time
        function analyzeStreamToElapsedRatio(operator, elapsedTimeMs, thresholdPercent) {
            if (!operator) return { qualifies: false, streamRatio: 0 };

            let streamExecTime = 0;

            function findStreamTimes(op) {
                if (!op) return;

                if (op["#stats"]) {
                    const stats = op["#stats"];

                    // Find Stream operations
                    if (op["#operator"] === "Stream" && stats["execTime"]) {
                        const execTime = parseTime(stats["execTime"]);
                        if (!isNaN(execTime)) {
                            streamExecTime += execTime;
                        }
                    }
                }

                // Recursively check child operators
                if (op["~child"]) {
                    findStreamTimes(op["~child"]);
                }
                if (op["~children"]) {
                    for (const child of op["~children"]) {
                        findStreamTimes(child);
                    }
                }
            }

            findStreamTimes(operator);

            // Calculate stream to elapsed time ratio
            const streamRatio = elapsedTimeMs > 0 ? (streamExecTime / elapsedTimeMs) * 100 : 0;
            const qualifies = streamRatio >= thresholdPercent;



            return {
                qualifies: qualifies,
                streamRatio: streamRatio
            };
        }

        // Toggle accordion category

        // Toggle individual insight

        // Update insight accordion states

        // Auto-expand insights with actual issues found (returns total count - Issue #164)

        // Update insight indicators (Issue #183 - moved from category to insight level with numbering)
        function updateCategoryCounters() {
            const categories = {
                'index-issues': ['inefficient-index-scans', 'slow-index-scan-times', 'primary-index-over-usage', 'pagination-index-overfetch'],
                'resource-issues': ['high-kernel-time-queries', 'high-memory-usage', 'slow-parse-plan-times', 'slow-use-key-queries'],
                'pattern-analysis': ['missing-where-clauses', 'complex-join-operations', 'inefficient-like-operations', 'select-star-usage'],
                'performance-opportunities': ['large-payload-streaming', 'large-result-set-queries', 'timeout-prone-queries', 'concurrent-query-conflicts']
            };

            const allInsights = Object.values(categories).flat();
            let activeInsightNumber = 1;

            // Update insight indicators
            allInsights.forEach(insightId => {
                const contentElement = document.getElementById(`${insightId}-content`);
                const card = contentElement?.closest('.insight-item');
                const indicatorElement = document.getElementById(`${insightId}-indicator`);
                
                if (indicatorElement) {
                    // Show indicator with sequential number only if insight is active (has issues)
                    if (card && card.classList.contains('active')) {
                        indicatorElement.textContent = `#${activeInsightNumber}`;
                        indicatorElement.classList.add('active');
                        activeInsightNumber++;
                    } else {
                        indicatorElement.textContent = '';
                        indicatorElement.classList.remove('active');
                    }
                }
            });

            // Auto-expand categories that contain active insights (Issue #183)
            Object.keys(categories).forEach(categoryId => {
                const insightIds = categories[categoryId];
                const hasActiveInsight = insightIds.some(insightId => {
                    const contentElement = document.getElementById(`${insightId}-content`);
                    const card = contentElement?.closest('.insight-item');
                    return card && card.classList.contains('active');
                });

                const categoryTitle = document.querySelector(`#${categoryId} .category-title`);
                const categoryContent = document.getElementById(`${categoryId}-content`);
                
                if (categoryTitle && categoryContent) {
                    if (hasActiveInsight) {
                        // Expand category if it has active insights
                        categoryTitle.classList.remove('collapsed');
                        categoryContent.classList.remove('collapsed');
                    } else {
                        // Keep category collapsed if no active insights
                        categoryTitle.classList.add('collapsed');
                        categoryContent.classList.add('collapsed');
                    }
                }
            });
        }

        // Update slow index scan times insight
        function updateSlowIndexScanTimes(requests) {
            const indexData = {};
            let totalIndexes = 0;
            let slowIndexes2to10s = 0;
            let slowIndexes10sPlus = 0;
            let slowPrimaryIndexes = 0;

            // Collect index data using same logic as Index/Query Flow
            requests.forEach((request) => {
                if (request.plan) {
                    try {
                        const planObj = typeof request.plan === "string" ? JSON.parse(request.plan) : request.plan;

                        // Extract index names and collect timing data
                        extractIndexNamesAndData(planObj, (indexName) => {
                            if (!indexData[indexName]) {
                                indexData[indexName] = {
                                    name: indexName,
                                    scanTimes: [],
                                    totalUsage: 0
                                };
                            }

                            const indexScanData = extractIndexScanDataFromPlan(request.plan, indexName);
                            if (indexScanData.scanTime > 0) {
                                indexData[indexName].scanTimes.push(indexScanData.scanTime);
                                indexData[indexName].totalUsage++;
                            }
                        });
                    } catch (e) {
                        console.error("Error parsing plan for index timing:", e);
                    }
                }
            });

            // Helper function to extract index names
            function extractIndexNamesAndData(operator, callback) {
                if (!operator) return;

                const opType = operator["#operator"];

                if ((opType === "IndexScan3" || opType === "PrimaryScan3" || opType === "KeyScan") && operator.index) {
                    callback(operator.index);
                }

                // Recursively search child operators
                if (operator["~child"]) {
                    extractIndexNamesAndData(operator["~child"], callback);
                }
                if (operator["~children"]) {
                    for (const child of operator["~children"]) {
                        extractIndexNamesAndData(child, callback);
                    }
                }
            }

            // Use the same aggregated index data as Index/Query Flow
            updatePrimaryIndexOverUsageFromAggregatedData(requests);

            // Debug: Log the collected index data
            Logger.debug(`${TEXT_CONSTANTS.COLLECTED_INDEX_DATA}`, window.DebugRedactor ? window.DebugRedactor.redactObject(indexData) : '[REDACTED]');

            // Analyze timing data for each index
            Object.values(indexData).forEach((index) => {
                totalIndexes++;

                if (index.scanTimes && index.scanTimes.length > 0) {
                    const avgScanTimeMs = index.scanTimes.reduce((a, b) => a + b, 0) / index.scanTimes.length;
                    const avgScanTimeSeconds = avgScanTimeMs / 1000;

                    if (avgScanTimeSeconds >= 10) {
                        slowIndexes10sPlus++;
                        Logger.debug(`${window.DebugRedactor ? window.DebugRedactor.hash(index.name) : index.name} is 10+ seconds`);
                    } else if (avgScanTimeSeconds >= 2) {
                        slowIndexes2to10s++;
                        Logger.debug(`${window.DebugRedactor ? window.DebugRedactor.hash(index.name) : index.name} is 2-10 seconds`);
                    }

                    // Check if it's a primary index with 2+ seconds
                    if ((index.name.includes("primary") || index.name === "#primary" || index.name === "def_primary") && avgScanTimeSeconds >= 2) {
                        slowPrimaryIndexes++;
                        Logger.debug(`${index.name} is a slow primary index`);
                    }
                }
            });



            // Update display elements for slow index scan times
            const totalIndexesElement = document.getElementById("total-indexes-count");
            const slowIndexes2to10sElement = document.getElementById("slow-indexes-2-10s");
            const slowIndexes10sPlusElement = document.getElementById("slow-indexes-10s-plus");
            const slowPrimaryIndexesElement = document.getElementById("slow-primary-indexes");

            if (totalIndexesElement) totalIndexesElement.textContent = totalIndexes;
            if (slowIndexes2to10sElement) slowIndexes2to10sElement.textContent = slowIndexes2to10s;
            if (slowIndexes10sPlusElement) slowIndexes10sPlusElement.textContent = slowIndexes10sPlus;
            if (slowPrimaryIndexesElement) slowPrimaryIndexesElement.textContent = slowPrimaryIndexes;
        }

        // Update Primary Index Over-Usage using same aggregated data as Index/Query Flow
        function updatePrimaryIndexOverUsageFromAggregatedData(requests) {
            const allIndexes = new Map();

            // Use the exact same logic as Index/Query Flow to build aggregated index data
            requests.forEach((request) => {
                if (request.plan) {
                    try {
                        const planObj = typeof request.plan === "string" ? JSON.parse(request.plan) : request.plan;
                        extractIndexNamesForFlow(planObj, allIndexes, request);
                    } catch (e) {
                        console.error("Error parsing plan for aggregated index data:", e);
                    }
                }
            });

            // Helper function (simplified version of existing Index/Query Flow logic)
            function extractIndexNamesForFlow(operator, allIndexes, request) {
                if (!operator) return;

                const opType = operator["#operator"];

                if ((opType === "IndexScan3" || opType === "PrimaryScan3" || opType === "KeyScan") && operator.index) {
                    const indexName = operator.index;

                    if (!allIndexes.has(indexName)) {
                        allIndexes.set(indexName, {
                            name: indexName,
                            totalUsage: 0,
                            scanTimes: [],
                            itemsScanned: [],
                            itemsFetched: []
                        });
                    }

                    const indexObj = allIndexes.get(indexName);
                    indexObj.totalUsage++;

                    // Extract data using same function as Index/Query Flow
                    const indexData = extractIndexScanDataFromPlan(request.plan, indexName);
                    if (indexData.scanTime > 0) {
                        indexObj.scanTimes.push(indexData.scanTime);
                    }
                    if (indexData.itemsScanned > 0) {
                        indexObj.itemsScanned.push(indexData.itemsScanned);
                    }
                    if (indexData.itemsFetched > 0) {
                        indexObj.itemsFetched.push(indexData.itemsFetched);
                    }
                }

                // Recursively search child operators (same as existing logic)
                if (operator["~child"]) {
                    extractIndexNamesForFlow(operator["~child"], allIndexes, request);
                }
                if (operator["~children"]) {
                    for (const child of operator["~children"]) {
                        extractIndexNamesForFlow(child, allIndexes, request);
                    }
                }
            }

            // Now analyze primary indexes using aggregated data
            let totalPrimaryItemsScanned = 0;
            let totalPrimaryScanTime = 0;
            let primaryIndexCount = 0;

            allIndexes.forEach((index) => {
                const isPrimary = index.name.includes("primary") || index.name === "#primary" || index.name === "def_primary";

                if (isPrimary && index.itemsScanned.length > 0) {
                    // Calculate aggregated stats using same logic as Index/Query Flow
                    const avgItemsScanned = Math.round(
                        index.itemsScanned.reduce((a, b) => a + b, 0) / index.itemsScanned.length
                    );
                    const avgScanTime = index.scanTimes.length > 0
                        ? Math.round(index.scanTimes.reduce((a, b) => a + b, 0) / index.scanTimes.length)
                        : 0;

                    if (avgItemsScanned > 10000) {
                        totalPrimaryItemsScanned += avgItemsScanned;
                        totalPrimaryScanTime += avgScanTime;
                        primaryIndexCount++;
                    }
                }
            });

            // Update primary index over-usage insight display
            const primaryAvgItemsScannedElement = document.getElementById("primary-avg-items-scanned");
            const primaryAvgScanTimeElement = document.getElementById("primary-avg-scan-time");

            if (primaryIndexCount > 0) {
                const avgItemsScanned = Math.round(totalPrimaryItemsScanned / primaryIndexCount);
                const avgScanTime = Math.round(totalPrimaryScanTime / primaryIndexCount);

                if (primaryAvgItemsScannedElement) {
                    primaryAvgItemsScannedElement.textContent = avgItemsScanned.toLocaleString();
                    primaryAvgItemsScannedElement.className = "highlight-number";
                }
                if (primaryAvgScanTimeElement) {
                    primaryAvgScanTimeElement.textContent = `${avgScanTime}ms`;
                    primaryAvgScanTimeElement.className = "highlight-number";
                }
            } else {
                // Reset to defaults
                if (primaryAvgItemsScannedElement) {
                    primaryAvgItemsScannedElement.textContent = "0";
                    primaryAvgItemsScannedElement.className = "";
                }
                if (primaryAvgScanTimeElement) {
                    primaryAvgScanTimeElement.textContent = "0ms";
                    primaryAvgScanTimeElement.className = "";
                }
            }
        }

        // Extract index data for timing analysis (simplified version of existing logic)
        function extractIndexDataForTiming(operator, indexData) {
            if (!operator) return;

            const opType = operator["#operator"];

            if ((opType === "IndexScan3" || opType === "PrimaryScan3" || opType === "KeyScan") && operator.index) {
                const indexName = operator.index;

                if (!indexData[indexName]) {
                    indexData[indexName] = {
                        name: indexName,
                        scanTimes: [],
                        totalUsage: 0
                    };
                }

                if (operator["#stats"] && operator["#stats"]["servTime"]) {
                    const scanTime = parseTime(operator["#stats"]["servTime"]);
                    indexData[indexName].scanTimes.push(scanTime);
                    indexData[indexName].totalUsage++;
                }
            }

            // Recursively search child operators
            if (operator["~child"]) {
                extractIndexDataForTiming(operator["~child"], indexData);
            }
            if (operator["~children"]) {
                for (const child of operator["~children"]) {
                    extractIndexDataForTiming(child, indexData);
                }
            }
        }



        // Validate date range for time grouping
        function validateDateRangeForGrouping(startDate, endDate, grouping) {
            if (!startDate || !endDate || grouping === "optimizer" || grouping === "day")
                return { valid: true };

            const diffMs = endDate.getTime() - startDate.getTime();
            const diffHours = diffMs / (1000 * 60 * 60);
            const diffDays = diffMs / (1000 * 60 * 60 * 24);

            switch (grouping) {
                case "second":
                    if (diffHours > 1) {
                        return {
                            valid: false,
                            message:
                                'For "by Second" grouping, please restrict the date range to 1 hour or less to avoid chart rendering issues.',
                        };
                    }
                    break;
                case "minute":
                    if (diffDays > 1) {
                        return {
                            valid: false,
                            message:
                                'For "by Minute" grouping, please restrict the date range to 1 day or less to avoid chart rendering issues.',
                        };
                    }
                    break;
                case "5min":
                    const diffWeeks5min = diffDays / 7;
                    if (diffWeeks5min > 1) {
                        return {
                            valid: false,
                            message:
                                'For "by 5min" grouping, please restrict the date range to 1 week or less to avoid chart rendering issues.',
                        };
                    }
                    break;
                case "hour":
                    const diffWeeks = diffDays / 7;
                    if (diffWeeks > 1) {
                        return {
                            valid: false,
                            message:
                                'For "by Hour" grouping, please restrict the date range to 1 week or less to avoid chart rendering issues.',
                        };
                    }
                    break;
            }

            return { valid: true };
        }

        // Centralized request data processor with single-pass optimization

        // Fast index information extraction (optimized with cache)
        function extractIndexInfo(plan) {
            // Check plan cache first
            if (planStatsCache.has(plan)) {
                return planStatsCache.get(plan).indexInfo;
            }

            // Fallback to original calculation
            const operators = getOperators(plan);
            const indexes = [];
            const stats = { primaryScan: 0, indexScan: 0, fetch: 0 };

            operators.forEach((operator) => {
                const operatorType = operator["#operator"];
                const operatorStats = operator["#stats"] || {};

                // Extract index names
                if (operator.index) {
                    indexes.push(operator.index);
                }

                // Aggregate stats
                if (
                    operatorType === "PrimaryScan" ||
                    operatorType === "PrimaryScan3"
                ) {
                    stats.primaryScan += operatorStats["#itemsOut"] || 0;
                } else if (
                    operatorType === "IndexScan" ||
                    operatorType === "IndexScan3"
                ) {
                    stats.indexScan += operatorStats["#itemsOut"] || 0;
                } else if (operatorType === "Fetch") {
                    stats.fetch += operatorStats["#itemsOut"] || 0;
                }
            });

            return { indexes, stats };
        }

        // Fast plan stats extraction
        function extractPlanStats(plan) {
            // Check cache first
            if (planStatsCache.has(plan)) {
                const metadata = planStatsCache.get(plan);
                return { totalItemsIn: metadata.totalItemsIn || 0, totalItemsOut: metadata.totalItemsOut || 0 };
            }

            // Fallback calculation
            const operators = getOperators(plan);
            let totalItemsIn = 0;
            let totalItemsOut = 0;

            operators.forEach((operator) => {
                const stats = operator["#stats"] || {};
                totalItemsIn += stats["#itemsIn"] || 0;
                totalItemsOut += stats["#itemsOut"] || 0;
            });

            return { totalItemsIn, totalItemsOut };
        }



        // Track which tabs have been loaded (global for reset on new parse)
        let loadedTabs = new Set();

        // Lazy chart loading setup - generate charts only when tabs are activated
        function setupLazyChartLoading(filteredRequests, fullDataset) {
            // Clear loaded tabs to force regeneration with new data (Step 5 fix)
            loadedTabs.clear();

            // Check currently active tab BEFORE marking dashboard as loaded (Issue #141 fix)
            // This ensures Dashboard refreshes properly when it's already the active tab
            try {
                const $tabs = $('#tabs');
                if ($tabs && $tabs.length) {
                    const activeIndex = $tabs.tabs('option', 'active');
                    const panels = $tabs.find('.ui-tabs-panel');
                    const activePanel = panels && panels.eq ? panels.eq(activeIndex) : null;
                    const activeId = activePanel && activePanel.attr ? activePanel.attr('id') : null;
                    
                    // Generate charts for currently active tab if it's not dashboard
                    // Dashboard will be generated below regardless
                    // Always regenerate active tab on new parse (removed loadedTabs check - Step 5 fix)
                    if (activeId && activeId !== 'dashboard') {
                        const loadStart = performance.now();
                        switch (activeId) {
                            case 'timeline': {
                                const sampleSize = Math.min(500, filteredRequests.length);
                                const sampleStep = Math.max(1, Math.floor(filteredRequests.length / sampleSize));
                                const timelineSample = filteredRequests.filter((_, i) => i % sampleStep === 0);
                                console.log(`${TEXT_CONSTANTS.TIMELINE_CHARTS_USING} ${timelineSample.length} ${TEXT_CONSTANTS.OF_TOTAL} ${filteredRequests.length} ${TEXT_CONSTANTS.REQUESTS_FOR_PERFORMANCE}`);
                                generateFilterChart(filteredRequests);
                                generateTimelineChart(timelineSample);
                                setTimeout(() => setupChartDragAndDrop(), 100);
                                break;
                            }
                            case 'index-query-flow':
                                // Use current filtered data from global variables (Step 5 fix)
                                buildIndexQueryFlow(window.filteredRequests || window.currentFilteredRequests || filteredRequests);
                                break;
                            case 'insights':
                                // nothing
                                break;
                        }
                        loadedTabs.add(activeId);
                        const loadEnd = performance.now();
                        console.log(`${TEXT_CONSTANTS.LAZY_LOADED_TAB} ${activeId} ${TEXT_CONSTANTS.TAB_IN} ${Math.round(loadEnd - loadStart)}${TEXT_CONSTANTS.MS}`);
                    }
                }
            } catch (e) {
                console.error(`${TEXT_CONSTANTS.ERROR_LAZY_LOADING} active-tab`, e);
            }

            // ALWAYS generate dashboard charts immediately after parsing (not lazy)
            // This ensures fresh data every time, regardless of which tab is active
            generateDashboardCharts(fullDataset || filteredRequests);
            loadedTabs.add('dashboard');
            // Initialize drag and drop for dashboard charts
            setTimeout(() => setupChartDragAndDrop(), 100);
            
            // Initialize drag and drop for all charts
            setTimeout(() => setupChartDragAndDrop(), 100);

            // Set up lazy loading for other tabs
            $('#tabs').on('tabsactivate', function (event, ui) {
                const tabId = ui.newPanel.attr('id');

                if (!loadedTabs.has(tabId)) {
                    const loadStart = performance.now();

                    try {
                        switch (tabId) {
                            case 'dashboard':
                                // Dashboard charts are now always generated immediately after parsing
                                // No need to regenerate when switching tabs
                                break;
                            case 'timeline':
                                // Use current filtered data from global variables (Step 5 fix)
                                const currentData = window.filteredRequests || window.currentFilteredRequests || filteredRequests;
                                
                                // For aggregation-based charts (operations, filter), use full data
                                // For timeline chart (individual request visualization), use sampling for performance
                                const sampleSize = Math.min(500, currentData.length);
                                const sampleStep = Math.max(1, Math.floor(currentData.length / sampleSize));
                                const timelineSample = currentData.filter((_, i) => i % sampleStep === 0);

                                console.log(`${TEXT_CONSTANTS.TIMELINE_CHARTS_USING} ${timelineSample.length} ${TEXT_CONSTANTS.OF_TOTAL} ${currentData.length} ${TEXT_CONSTANTS.REQUESTS_FOR_PERFORMANCE}`);

                                // Use full data for aggregation charts that sum/count data
                                generateFilterChart(currentData);
                                // Use sampled data only for individual request timeline
                                generateTimelineChart(timelineSample);
                                
                                // Re-initialize drag and drop for timeline charts
                                setTimeout(() => setupChartDragAndDrop(), 100);
                                
                                // Show timeline-specific feature notifications (Issue #151)
                                showTimelineFeatureNotifications();
                                break;
                            case 'index-query-flow':
                                // Use current filtered data from global variables (Step 5 fix)
                                buildIndexQueryFlow(window.filteredRequests || window.currentFilteredRequests || filteredRequests);
                                break;
                            case 'insights':
                                // Insights don't need chart generation, they use cached data
                                break;
                        }

                        loadedTabs.add(tabId);
                        const loadEnd = performance.now();
                        console.log(`${TEXT_CONSTANTS.LAZY_LOADED_TAB} ${tabId} ${TEXT_CONSTANTS.TAB_IN} ${Math.round(loadEnd - loadStart)}${TEXT_CONSTANTS.MS}`);
                    } catch (e) {
                        console.error(`${TEXT_CONSTANTS.ERROR_LAZY_LOADING} ${tabId} ${TEXT_CONSTANTS.TAB_IN}`, e);
                    }
                }
            });
        }

        // Feature Notification System (Issue #151)
        // Manages new feature tips and announcements with version tracking
        const FEATURE_NOTIFICATIONS = {
            'stake-line-tip': {
                message: "💡 NEW: Double Click on any chart to place a vertical Stake line that syncs across all timeline charts. Click 'Remove Stake' button, on the side, to remove it.",
                type: "info",
                duration: 15000,
                version: "3.27.0",
                trigger: "timeline-tab"  // When to show: "timeline-tab", "startup", "onclick"
            }
            // Add more feature notifications here as needed
            // Example:
            // 'collection-chart-tip': {
            //     message: "🎯 New: Collection queries chart now shows query distribution across buckets!",
            //     type: "success",
            //     duration: 12000,
            //     version: "3.27.0",
            //     trigger: "timeline-tab"
            // }
        };

        // Track which notifications have been shown (in-memory only, resets on page load)
        const shownFeatureNotifications = new Set();

        /**
         * Show notification for a new feature
         * @param {string} featureKey - Key from FEATURE_NOTIFICATIONS
         * @param {boolean} forceShow - Force show even if already seen (for onclick events)
         */
        function newFeatureNotification(featureKey, forceShow = false) {
            const feature = FEATURE_NOTIFICATIONS[featureKey];
            if (!feature) {
                console.warn(`Feature notification '${featureKey}' not found`);
                return;
            }

            // Check if already shown this page load
            if (shownFeatureNotifications.has(featureKey) && !forceShow) {
                return; // Already shown
            }

            // Mark as shown
            shownFeatureNotifications.add(featureKey);

            // Show notification
            setTimeout(() => {
                showToast(feature.message, feature.type, feature.duration);
            }, 800);
        }

        /**
         * Show all startup feature notifications
         * Call this after data is parsed and app is ready
         */
        function showStartupFeatureNotifications() {
            Object.keys(FEATURE_NOTIFICATIONS).forEach(featureKey => {
                const feature = FEATURE_NOTIFICATIONS[featureKey];
                if (feature.trigger === "startup") {
                    newFeatureNotification(featureKey);
                }
            });
        }

        /**
         * Show timeline-specific feature notifications
         * Call this when Timeline tab is activated
         */
        function showTimelineFeatureNotifications() {
            Object.keys(FEATURE_NOTIFICATIONS).forEach(featureKey => {
                const feature = FEATURE_NOTIFICATIONS[featureKey];
                if (feature.trigger === "timeline-tab") {
                    newFeatureNotification(featureKey);
                }
            });
        }

        // Filter reminder toast notification
        let filterReminderTimeout = null;



        // Build an elapsedTime filter predicate from user input
        function makeElapsedFilterPredicate(input) {
            try {
                if (!input || !(input = String(input).trim())) return null;
                const s = input.toLowerCase();

                const toMs = (num, unit) => {
                    const v = parseFloat(num);
                    const u = (unit || 'ms').toLowerCase();
                    if (u === 'ms') return v;
                    if (u === 's') return v * 1000;
                    if (u === 'µs' || u === 'us') return v / 1000;
                    // Fallback: attempt parseTime on composed string
                    const ms = parseTime(`${v}${u}`);
                    return isNaN(ms) ? NaN : ms;
                };

                // e.g., "100ms-500ms" or "0.5s - 2s" (inclusive)
                const range = s.match(/^(\d*\.?\d+)\s*(µs|us|ms|s)?\s*-\s*(\d*\.?\d+)\s*(µs|us|ms|s)?$/);
                if (range) {
                    // If only one side has a unit, apply it to both sides for user-friendly behavior (e.g., "3-15s")
                    const inferredUnit = range[2] || range[4] || 'ms';
                    const leftMs = toMs(range[1], range[2] || inferredUnit);
                    const rightMs = toMs(range[3], range[4] || inferredUnit);
                    if (isNaN(leftMs) || isNaN(rightMs)) return null;
                    const min = Math.min(leftMs, rightMs);
                    const max = Math.max(leftMs, rightMs);
                    return (x) => typeof x === 'number' && !isNaN(x) && x >= min && x <= max;
                }

                // e.g., ">=500ms", "<2s", "=150ms"
                const comp = s.match(/^(<=|>=|<|>|=)\s*(\d*\.?\d+)\s*(µs|us|ms|s)?$/);
                if (comp) {
                    const op = comp[1];
                    const valMs = toMs(comp[2], comp[3] || 'ms');
                    if (isNaN(valMs)) return null;
                    return (x) => {
                        if (typeof x !== 'number' || isNaN(x)) return false;
                        if (op === '<') return x < valMs;
                        if (op === '<=') return x <= valMs;
                        if (op === '>') return x > valMs;
                        if (op === '>=') return x >= valMs;
                        return x === valMs; // '='
                    };
                }

                // e.g., "500ms+" (>=)
                const plus = s.match(/^(\d*\.?\d+)\s*(µs|us|ms|s)\s*\+$/);
                if (plus) {
                    const valMs = toMs(plus[1], plus[2]);
                    if (isNaN(valMs)) return null;
                    return (x) => typeof x === 'number' && !isNaN(x) && x >= valMs;
                }

                // Bare number: assume ms and '>=' semantics
                const bare = s.match(/^(\d*\.?\d+)$/);
                if (bare) {
                    const valMs = toMs(bare[1], 'ms');
                    if (isNaN(valMs)) return null;
                    return (x) => typeof x === 'number' && !isNaN(x) && x >= valMs;
                }

                return null;
            } catch (e) { return null; }
        }

        // Parse JSON input - Optimized

        // Toast notification system - slides down from top-left corner for 10 seconds
        function showToast(message, type = "info", durationMs = 10000) {
            // Remove any existing toasts
            const existingToasts = document.querySelectorAll(".toast, .sliding-toast");
            existingToasts.forEach((toast) => toast.remove());

            const toast = document.createElement("div");
            toast.className = "sliding-toast";
            toast.style.cssText = `
          position: fixed;
          top: -50px;
          left: 20px;
          padding: 12px 40px 12px 20px;
          border-radius: 6px;
          background: #e3f2fd;
          border: 1px solid #bbdefb;
          color: #0d47a1;
          font-size: 13px;
          font-weight: 600;
          z-index: 10001;
          max-width: 360px;
          word-wrap: break-word;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          transition: all 0.35s ease-out;
          transform: translateY(0px);
        `;

            // Add message text
            const messageSpan = document.createElement("span");
            messageSpan.textContent = message;
            toast.appendChild(messageSpan);

            // Add close button
            const closeBtn = document.createElement("button");
            closeBtn.innerHTML = "×";
            closeBtn.style.cssText = `
          position: absolute;
          top: 8px;
          right: 8px;
          background: transparent;
          border: none;
          color: inherit;
          font-size: 20px;
          font-weight: bold;
          cursor: pointer;
          padding: 0;
          width: 20px;
          height: 20px;
          line-height: 20px;
          text-align: center;
          opacity: 0.6;
          transition: opacity 0.2s;
        `;
            closeBtn.onmouseover = () => closeBtn.style.opacity = "1";
            closeBtn.onmouseout = () => closeBtn.style.opacity = "0.6";
            closeBtn.onclick = () => {
                toast.style.opacity = "0";
                toast.style.transform = "translateY(-10px)";
                setTimeout(() => {
                    if (toast.parentNode) {
                        document.body.removeChild(toast);
                    }
                }, 400);
            };
            toast.appendChild(closeBtn);

            // Color scheme by type
            if (type === "error") {
                toast.style.background = "#f8d7da";
                toast.style.border = "1px solid #f5c2c7";
                toast.style.color = "#842029";
            } else if (type === "warning") {
                toast.style.background = "#fff3cd";
                toast.style.border = "1px solid #ffeaa7";
                toast.style.color = "#856404";
            } else if (type === "success") {
                toast.style.background = "#d1e7dd";
                toast.style.border = "1px solid #badbcc";
                toast.style.color = "#0f5132";
            }

            document.body.appendChild(toast);

            // Slide down
            setTimeout(() => {
                toast.style.top = "20px";
                toast.style.transform = "translateY(0px)";
            }, 10);

            // Auto-hide
            setTimeout(() => {
                toast.style.opacity = "0";
                toast.style.transform = "translateY(-10px)";
                setTimeout(() => {
                    if (toast.parentNode) {
                        document.body.removeChild(toast);
                    }
                }, 400);
            }, durationMs);
            }

            // Redirect to showToast for consistency
            function showSlidingNotification(message, type = "info", durationMs = 8000) {
                showToast(message, type, durationMs);
            }

            // Input panel auto-hide helpers (Issue #88)
            let _inputHideTimer = null;
            let _inputAutoHideDisabled = false;
            function hideInputSection() {
                const input = document.getElementById('input-section');
                const tab = document.getElementById('toggle-input-tab');
                if (!input) return;
                try {
                    const $input = window.jQuery ? jQuery(input) : null;
                    if ($input && $input.hide && jQuery.effects && jQuery.effects.effect && jQuery.effects.effect.blind) {
                        $input.stop(true, true).hide('blind', {}, 600, () => {
                            if (tab) {
                                tab.setAttribute('aria-expanded', 'false');
                                const label = (window.TEXT_CONSTANTS && TEXT_CONSTANTS.SHOW_INPUT_PANEL) || 'Show Data & Filters';
                                tab.textContent = '▼ ' + label;
                                tab.title = label;
                                tab.classList.remove('showing');
                                tab.classList.add('hidden');
                            }
                        });
                    } else {
                        // Fallback if jQuery UI effects missing
                        input.style.display = 'none';
                        if (tab) {
                            tab.setAttribute('aria-expanded', 'false');
                            const label = (window.TEXT_CONSTANTS && TEXT_CONSTANTS.SHOW_INPUT_PANEL) || 'Show Data & Filters';
                            tab.textContent = '▼ ' + label;
                            tab.title = label;
                            tab.classList.remove('showing');
                            tab.classList.add('hidden');
                        }
                    }
                } catch (e) { /* no-op */ }
            }
            function showInputSection() {
                const input = document.getElementById('input-section');
                const tab = document.getElementById('toggle-input-tab');
                if (!input) return;
                try {
                    const $input = window.jQuery ? jQuery(input) : null;
                    if ($input && $input.show && jQuery.effects && jQuery.effects.effect && jQuery.effects.effect.blind) {
                        $input.stop(true, true).show('blind', {}, 600, () => {
                            if (tab) {
                                tab.setAttribute('aria-expanded', 'true');
                                const label = (window.TEXT_CONSTANTS && TEXT_CONSTANTS.HIDE_INPUT_PANEL) || 'Hide Data & Filters';
                                tab.textContent = '▲ ' + label;
                                tab.title = (window.TEXT_CONSTANTS && TEXT_CONSTANTS.TOGGLE_INPUT_TOOLTIP) || 'Click to Show/Hide Data & Filters';
                                tab.classList.remove('hidden');
                                tab.classList.add('showing');
                            }
                        });
                    } else {
                        input.style.display = '';
                        if (tab) {
                            tab.setAttribute('aria-expanded', 'true');
                            const label = (window.TEXT_CONSTANTS && TEXT_CONSTANTS.HIDE_INPUT_PANEL) || 'Hide Data & Filters';
                            tab.textContent = '▲ ' + label;
                            tab.title = (window.TEXT_CONSTANTS && TEXT_CONSTANTS.TOGGLE_INPUT_TOOLTIP) || 'Click to Show/Hide Data & Filters';
                            tab.classList.remove('hidden');
                            tab.classList.add('showing');
                        }
                    }
                } catch (e) { /* no-op */ }
            }
            function scheduleInputAutoHide(delayMs = 3000) {
                if (_inputAutoHideDisabled) return; // respect user preference
                if (_inputHideTimer) {
                    clearTimeout(_inputHideTimer);
                    _inputHideTimer = null;
                }
                _inputHideTimer = setTimeout(() => {
                    const input = document.getElementById('input-section');
                    if (_inputAutoHideDisabled) return;
                    if (input && input.style.visibility !== 'collapse') {
                        hideInputSection();
                    }
                }, delayMs);
            }

            // Finish processing after all batches are done

        // Populate collection filter dropdown with all unique collections
        function populateCollectionFilter(requests) {
            const collectionFilter = document.getElementById("collection-filter");
            if (!collectionFilter) return;

            // Collect all unique collections from requests
            const collectionsSet = new Set();
            requests.forEach(request => {
                const sql = request.statement || request.preparedText || "";
                const collections = extractCollectionsFromSQL(sql);
                collections.forEach(collection => collectionsSet.add(collection));
            });

            // Sort collections alphabetically
            const sortedCollections = Array.from(collectionsSet).sort();

            // Preserve current selection if it exists
            const currentSelection = collectionFilter.value;

            // Clear and repopulate dropdown
            collectionFilter.innerHTML = '<option value="">(All)</option>';
            sortedCollections.forEach(collection => {
                const option = document.createElement('option');
                option.value = collection;
                option.textContent = collection;
                collectionFilter.appendChild(option);
            });

            // Restore selection if still valid
            if (currentSelection && sortedCollections.includes(currentSelection)) {
                collectionFilter.value = currentSelection;
            }

            Logger.info(`Collection filter populated with ${sortedCollections.length} unique collections`);
        }

        // Modal event listeners
        const planModal = document.getElementById("plan-modal");
        const planCloseBtn = planModal.querySelector(".close");
        planCloseBtn.addEventListener("click", () => {
            planModal.style.display = "none";
        });
        planModal.addEventListener("click", (event) => {
            if (event.target === planModal) {
                planModal.style.display = "none";
            }
        });

        const operatorModal = document.getElementById("operator-modal");
        const operatorCloseBtn = operatorModal.querySelector(".close");
        operatorCloseBtn.addEventListener("click", () => {
            operatorModal.style.display = "none";
        });
        operatorModal.addEventListener("click", (event) => {
            if (event.target === operatorModal) {
                operatorModal.style.display = "none";
            }
        });

        // Function to set time range based on button selection
        function setTimeRange(type) {
            const startDateInput = document.getElementById("start-date");
            const endDateInput = document.getElementById("end-date");

            if (type === "original") {
                if (originalStartDate && originalEndDate) {
                    // Use selected timezone for datepickers (Issue #203)
                    const timezoneForPicker = currentTimezone || "UTC";
                    startDateInput.value = toDateTimeLocal(originalStartDate, timezoneForPicker);
                    endDateInput.value = toDateTimeLocal(originalEndDate, timezoneForPicker);
                    updateDatePickerTimezoneLabel(); // Update timezone label
                }
            } else if (type === "1day" || type === "1hour" || type === "1week") {
                const endDate = endDateInput.value
                    ? new Date(endDateInput.value)
                    : new Date();
                const startDate = new Date(endDate);

                if (type === "1day") {
                    startDate.setDate(startDate.getDate() - 1);
                } else if (type === "1hour") {
                    startDate.setHours(startDate.getHours() - 1);
                } else if (type === "1week") {
                    startDate.setDate(startDate.getDate() - 7);
                }

                // Use selected timezone for datepickers (Issue #203)
                const timezoneForPicker = currentTimezone || "UTC";
                startDateInput.value = toDateTimeLocal(startDate, timezoneForPicker);
                updateDatePickerTimezoneLabel(); // Update timezone label
            }

            // Show reminder to click Parse JSON
            if (originalRequests.length > 0) {
                showFilterReminder();
            }
        }

        // Sample queries storage
        let sampleQueries = [];
        let sampleQueriesVisible = false;

        // Extract sample queries from requests for display - only inefficient index scan queries
        function extractSampleQueries(requests) {
            sampleQueries = [];
            const seenStatements = new Set();
            
            for (const request of requests) {
                if (sampleQueries.length >= 5) break;
                
                const statement = request.statement || request.preparedText || '';
                if (!statement || seenStatements.has(statement)) continue;
                
                // Apply the same inefficient index scan criteria as the counter
                const hasAggregates = /\b(COUNT|AVG|MIN|MAX|SUM)\s*\(/i.test(statement);
                
                if (!hasAggregates) {
                    const resultCount = request.resultCount || 0;
                    const phaseCounts = request.phaseCounts || {};

                    // Check various types of index scans (same logic as counter)
                    let totalScanned = 0;
                    if (phaseCounts.primaryScan) totalScanned += phaseCounts.primaryScan;
                    if (phaseCounts.indexScan) totalScanned += phaseCounts.indexScan;
                    if (phaseCounts['primaryScan.GSI']) totalScanned += phaseCounts['primaryScan.GSI'];
                    if (phaseCounts['indexScan.GSI']) totalScanned += phaseCounts['indexScan.GSI'];

                    // Only include if scanned >= 50,000 and efficiency < 10%
                    if (totalScanned >= 50000) {
                        const efficiency = totalScanned > 0 ? (resultCount / totalScanned) * 100 : 0;
                        if (efficiency < 10) {
                            seenStatements.add(statement);
                            sampleQueries.push({
                                requestTime: request.requestTime,
                                statement: statement,
                                requestId: request.requestId
                            });
                        }
                    }
                }
            }
            
            // Update the sample queries table
            updateSampleQueriesTable();
        }

        // Toggle sample queries visibility

        // Update sample queries table content

        // Toggle between truncated and full statement view

        // Copy sample statement to clipboard
        function copySampleStatement(statementId, event) {
            const index = parseInt(statementId.replace('sample-statement-', ''));
            const statement = sampleQueries[index]?.statement;
            
            if (!statement) {
                console.error(TEXT_CONSTANTS.STATEMENT_NOT_FOUND, statementId);
                showToast(TEXT_CONSTANTS.STATEMENT_NOT_FOUND, "error");
                return;
            }
            
            navigator.clipboard.writeText(statement)
                .then(() => {
                    const button = event.target;
                    const originalText = button.textContent;
                    button.textContent = TEXT_CONSTANTS.COPIED;
                    button.style.backgroundColor = '#4CAF50';
                    setTimeout(() => {
                        button.textContent = originalText;
                        button.style.backgroundColor = '';
                    }, 1000);
                })
                .catch((err) => {
                    console.error(TEXT_CONSTANTS.FAILED_COPY_CLIPBOARD, err);
                    showToast(TEXT_CONSTANTS.FAILED_COPY_CLIPBOARD, "error");
                });
        }

        // Storage for insight-specific sample queries
        let insightSampleQueries = {};
        let insightSampleQueriesVisible = {};

        // Toggle insight-specific sample queries visibility

        // Update insight-specific sample queries table

        // Update JOIN sample queries with flags and JOIN time columns
        function updateJoinSampleQueries(queries) {
            const tbody = document.getElementById('complex-join-operations-sample-queries-tbody');
            if (!tbody) return;
            
            tbody.innerHTML = '';
            insightSampleQueries['complex-join-operations'] = queries;
            
            Logger.debug(`[Insights] Updating JOIN queries with ${queries.length} queries, currentTimezone=${currentTimezone}`);
            
            queries.forEach((query, index) => {
                // Apply timezone conversion to requestTime
                const originalTime = query.requestTime || "";
                const convertedDate = getChartDate(originalTime);
                const formattedDate = convertedDate ? convertedDate.toISOString().replace('T', ' ').substring(0, 23) + 'Z' : originalTime;
                
                Logger.trace(`[Insights] JOIN Query ${index}: Original=${originalTime}, Converted=${formattedDate}`);
                const flags = query.flags || [];
                const flagDetails = query.flagDetails || {};
                const joinTime = query.joinTime || 0;
                
                const statementId = `complex-join-operations-statement-${index}`;
                const isLongStatement = query.statement.length > 500;
                
                const row = document.createElement('tr');
                
                // Create date cell
                const dateCell = document.createElement('td');
                dateCell.style.whiteSpace = 'nowrap';
                dateCell.style.textAlign = 'center';
                dateCell.style.fontSize = '11px';
                dateCell.textContent = formattedDate;
                
                // Create flags cell with tooltips
                const flagsCell = document.createElement('td');
                flagsCell.style.fontWeight = 'bold';
                flagsCell.style.textAlign = 'center';
                flagsCell.style.fontSize = '12px';
                
                if (flags.length > 0) {
                    // Create each flag span separately with custom large tooltips
                    flagsCell.innerHTML = '';
                    flags.forEach((flag, idx) => {
                        const detail = flagDetails[flag] || '';
                        const color = ['A', 'B', 'D'].includes(flag) ? '#dc3545' : 
                                     ['C', 'E', 'F', 'H'].includes(flag) ? '#fd7e14' : '#ffc107';
                        
                        const flagSpan = document.createElement('span');
                        flagSpan.textContent = flag;
                        flagSpan.style.color = color;
                        flagSpan.className = 'join-flag-tooltip';
                        flagSpan.setAttribute('data-tooltip', detail);
                        
                        flagsCell.appendChild(flagSpan);
                        
                        // Add comma separator if not last flag
                        if (idx < flags.length - 1) {
                            const comma = document.createTextNode(', ');
                            flagsCell.appendChild(comma);
                        }
                    });
                } else {
                    flagsCell.textContent = '-';
                }
                
                // Create JOIN time cell
                const joinTimeCell = document.createElement('td');
                joinTimeCell.style.textAlign = 'center';
                joinTimeCell.style.fontSize = '11px';
                joinTimeCell.textContent = joinTime > 0 ? `${(joinTime / 1000).toFixed(2)}s` : 'N/A';
                
                // Create statement cell
                const statementCell = document.createElement('td');
                statementCell.className = 'statement-cell';
                statementCell.style.fontFamily = 'monospace';
                statementCell.style.fontSize = '11px';
                
                if (isLongStatement) {
                    const truncated = query.statement.substring(0, 500);
                    statementCell.innerHTML = `
                        <div id="${statementId}-truncated">
                            <span>${escapeHtml(truncated)}...</span>
                            <br>
                            <button onclick="toggleInsightStatement('${statementId}', true)" 
                                    class="btn-standard" style="margin-top: 5px; margin-right: 5px;">${TEXT_CONSTANTS.SHOW_MORE}</button>
                            <button onclick="copyInsightStatement('complex-join-operations', ${index}, event)" 
                                    class="btn-standard" style="margin-top: 5px;">${TEXT_CONSTANTS.COPY}</button>
                        </div>
                        <div id="${statementId}-full" style="display: none;">
                            <span>${escapeHtml(query.statement)}</span>
                            <br>
                            <button onclick="toggleInsightStatement('${statementId}', false)" 
                                    class="btn-standard" style="margin-top: 5px; margin-right: 5px;">${TEXT_CONSTANTS.HIDE}</button>
                            <button onclick="copyInsightStatement('complex-join-operations', ${index}, event)" 
                                    class="btn-standard" style="margin-top: 5px;">${TEXT_CONSTANTS.COPY}</button>
                        </div>
                    `;
                } else {
                    statementCell.innerHTML = `
                        <div>
                            <span>${escapeHtml(query.statement)}</span>
                            <br>
                            <button onclick="copyInsightStatement('complex-join-operations', ${index}, event)" 
                                    class="btn-standard" style="margin-top: 5px;">${TEXT_CONSTANTS.COPY}</button>
                        </div>
                    `;
                }
                
                row.appendChild(dateCell);
                row.appendChild(flagsCell);
                row.appendChild(joinTimeCell);
                row.appendChild(statementCell);
                tbody.appendChild(row);
            });
        }

        // Update Concurrent Conflicts sample queries table
        function updateConcurrentConflictsSampleQueries(queries, flagCountsData) {
            const tbody = document.getElementById('concurrent-query-conflicts-sample-queries-tbody');
            if (!tbody) return;
            
            tbody.innerHTML = '';
            insightSampleQueries['concurrent-query-conflicts'] = queries;
            
            // Update flag breakdown
            const flagGrid = document.getElementById('concurrent-conflicts-flag-grid');
            if (flagGrid && flagCountsData) {
                flagGrid.innerHTML = '';
                
                Object.entries(flagCountsData).forEach(([flag, data]) => {
                    if (data.count > 0) {
                        const color = ['B', 'D', 'F', 'H'].includes(flag) ? '#dc3545' : '#fd7e14';
                        const severity = ['B', 'D', 'F', 'H'].includes(flag) ? '🔴 Critical' : '🟡 High';
                        
                        const flagDiv = document.createElement('div');
                        flagDiv.style.padding = '8px';
                        flagDiv.style.marginBottom = '6px';
                        flagDiv.style.backgroundColor = '#fff';
                        flagDiv.style.border = `2px solid ${color}`;
                        flagDiv.style.borderRadius = '4px';
                        flagDiv.style.fontSize = '11px';
                        flagDiv.innerHTML = `
                            <strong style="color: ${color};">${flag}:</strong> 
                            <span style="color: #495057;">${data.name}</span>
                            <span style="float: right; font-weight: bold; color: ${color};">(${data.count}) ${severity}</span>
                        `;
                        flagGrid.appendChild(flagDiv);
                    }
                });
            }
            
            // Populate table rows
            queries.forEach((query, index) => {
                const formattedDate = query.requestTime || "";
                const flags = query.flags || [];
                const flagDetails = query.flagDetails || {};
                
                const statementId = `concurrent-query-conflicts-statement-${index}`;
                const isLongStatement = query.statement.length > 500;
                
                const row = document.createElement('tr');
                
                // Create date cell
                const dateCell = document.createElement('td');
                dateCell.style.whiteSpace = 'nowrap';
                dateCell.style.textAlign = 'center';
                dateCell.style.fontSize = '11px';
                dateCell.textContent = formattedDate;
                
                // Create flags cell with tooltips
                const flagsCell = document.createElement('td');
                flagsCell.style.fontWeight = 'bold';
                flagsCell.style.textAlign = 'center';
                flagsCell.style.fontSize = '12px';
                
                if (flags.length > 0) {
                    flagsCell.innerHTML = '';
                    flags.forEach((flag, idx) => {
                        const detail = flagDetails[flag] || '';
                        const color = ['B', 'D', 'F', 'H'].includes(flag) ? '#dc3545' : '#fd7e14';
                        
                        const flagSpan = document.createElement('span');
                        flagSpan.textContent = flag;
                        flagSpan.style.color = color;
                        flagSpan.className = 'join-flag-tooltip';  // Reuse same tooltip class
                        flagSpan.setAttribute('data-tooltip', detail);
                        
                        flagsCell.appendChild(flagSpan);
                        
                        if (idx < flags.length - 1) {
                            flagsCell.appendChild(document.createTextNode(', '));
                        }
                    });
                } else {
                    flagsCell.textContent = '-';
                }
                
                // Create Parse+Plan cell
                const parsePlanCell = document.createElement('td');
                parsePlanCell.style.textAlign = 'center';
                parsePlanCell.style.fontSize = '11px';
                parsePlanCell.textContent = query.parsePlanTime !== undefined ? `${query.parsePlanTime.toFixed(2)}ms` : 'N/A';
                
                // Create Fetch/Doc cell
                const fetchPerDocCell = document.createElement('td');
                fetchPerDocCell.style.textAlign = 'center';
                fetchPerDocCell.style.fontSize = '11px';
                fetchPerDocCell.textContent = query.fetchPerDoc !== null ? `${query.fetchPerDoc.toFixed(2)}ms` : 'N/A';
                
                // Create Scan Rate cell
                const scanRateCell = document.createElement('td');
                scanRateCell.style.textAlign = 'center';
                scanRateCell.style.fontSize = '11px';
                scanRateCell.textContent = query.indexScanRate !== null ? `${Math.round(query.indexScanRate).toLocaleString()}/sec` : 'N/A';
                
                // Create Kernel% cell
                const kernelCell = document.createElement('td');
                kernelCell.style.textAlign = 'center';
                kernelCell.style.fontSize = '11px';
                kernelCell.style.fontWeight = query.kernelPercent !== null && query.kernelPercent >= 30 ? 'bold' : 'normal';
                kernelCell.style.color = query.kernelPercent !== null && query.kernelPercent >= 30 ? '#dc3545' : '#495057';
                kernelCell.textContent = query.kernelPercent !== null ? `${query.kernelPercent.toFixed(1)}%` : 'N/A';
                
                // Create statement cell
                const statementCell = document.createElement('td');
                statementCell.className = 'statement-cell';
                statementCell.style.fontFamily = 'monospace';
                statementCell.style.fontSize = '11px';
                
                if (isLongStatement) {
                    const truncated = query.statement.substring(0, 500);
                    statementCell.innerHTML = `
                        <div id="${statementId}-truncated">
                            <span>${escapeHtml(truncated)}...</span>
                            <br>
                            <button onclick="toggleInsightStatement('${statementId}', true)" 
                                    class="btn-standard" style="margin-top: 5px; margin-right: 5px;">${TEXT_CONSTANTS.SHOW_MORE}</button>
                            <button onclick="copyInsightStatement('concurrent-query-conflicts', ${index}, event)" 
                                    class="btn-standard" style="margin-top: 5px;">${TEXT_CONSTANTS.COPY}</button>
                        </div>
                        <div id="${statementId}-full" style="display: none;">
                            <span>${escapeHtml(query.statement)}</span>
                            <br>
                            <button onclick="toggleInsightStatement('${statementId}', false)" 
                                    class="btn-standard" style="margin-top: 5px; margin-right: 5px;">${TEXT_CONSTANTS.HIDE}</button>
                            <button onclick="copyInsightStatement('concurrent-query-conflicts', ${index}, event)" 
                                    class="btn-standard" style="margin-top: 5px;">${TEXT_CONSTANTS.COPY}</button>
                        </div>
                    `;
                } else {
                    statementCell.innerHTML = `
                        <div>
                            <span>${escapeHtml(query.statement)}</span>
                            <br>
                            <button onclick="copyInsightStatement('concurrent-query-conflicts', ${index}, event)" 
                                    class="btn-standard" style="margin-top: 5px;">${TEXT_CONSTANTS.COPY}</button>
                        </div>
                    `;
                }
                
                row.appendChild(dateCell);
                row.appendChild(flagsCell);
                row.appendChild(parsePlanCell);
                row.appendChild(fetchPerDocCell);
                row.appendChild(scanRateCell);
                row.appendChild(kernelCell);
                row.appendChild(statementCell);
                tbody.appendChild(row);
            });
        }

        // Toggle insight statement truncation

        // Copy insight statement to clipboard

        // Storage for timeout queries
        let timeoutQueriesData = {
            actualTimeouts: [],
            approachingTimeouts: []
        };
        let timeoutQueriesVisible = false;

        // Toggle timeout queries table visibility

        // Update timeout queries table with special 3-column format

        // Create a timeout query table row
        function createTimeoutQueryRow(query, index, type) {
            const formattedDate = query.requestTime || "";
            
            const statementId = `timeout-${type}-statement-${index}`;
            const isLongStatement = query.statement.length > 500;
            
            const row = document.createElement('tr');
            
            // Create date cell
            const dateCell = document.createElement('td');
            dateCell.style.whiteSpace = 'nowrap';
            dateCell.style.textAlign = 'center';
            dateCell.style.fontSize = '11px';
            dateCell.textContent = formattedDate;
            
            // Create statement cell
            const statementCell = document.createElement('td');
            statementCell.className = 'statement-cell';
            
            if (isLongStatement) {
                const truncated = query.statement.substring(0, 500);
                statementCell.innerHTML = `
                    <div id="${statementId}-truncated">
                        <span>${escapeHtml(truncated)}...</span>
                        <br>
                        <button onclick="toggleInsightStatement('${statementId}', true)" 
                                class="btn-standard" style="margin-top: 5px; margin-right: 5px;">${TEXT_CONSTANTS.SHOW_MORE}</button>
                        <button onclick="copyTimeoutStatement('${type}', ${index}, event)" 
                                class="btn-standard" style="margin-top: 5px;">${TEXT_CONSTANTS.COPY}</button>
                    </div>
                    <div id="${statementId}-full" style="display: none;">
                        <span>${escapeHtml(query.statement)}</span>
                        <br>
                        <button onclick="toggleInsightStatement('${statementId}', false)" 
                                class="btn-standard" style="margin-top: 5px; margin-right: 5px;">${TEXT_CONSTANTS.HIDE}</button>
                        <button onclick="copyTimeoutStatement('${type}', ${index}, event)" 
                                class="btn-standard" style="margin-top: 5px;">${TEXT_CONSTANTS.COPY}</button>
                    </div>
                `;
            } else {
                statementCell.innerHTML = `
                    <div>
                        <span>${escapeHtml(query.statement)}</span>
                        <br>
                        <button onclick="copyTimeoutStatement('${type}', ${index}, event)" 
                                class="btn-standard" style="margin-top: 5px;">${TEXT_CONSTANTS.COPY}</button>
                    </div>
                `;
            }
            
            // Create elapsed time cell
            const elapsedTimeCell = document.createElement('td');
            elapsedTimeCell.style.whiteSpace = 'nowrap';
            elapsedTimeCell.style.textAlign = 'center';
            elapsedTimeCell.style.fontSize = '11px';
            elapsedTimeCell.textContent = query.elapsedTime || 'N/A';
            if (type === 'actual') {
                elapsedTimeCell.style.fontWeight = 'bold';
                elapsedTimeCell.style.color = '#d32f2f'; // Red for timeouts
            } else {
                elapsedTimeCell.style.color = '#f57c00'; // Orange for approaching
            }
            
            row.appendChild(dateCell);
            row.appendChild(statementCell);
            row.appendChild(elapsedTimeCell);
            
            return row;
        }

        // Copy timeout statement to clipboard
        function copyTimeoutStatement(type, index, event) {
            const statement = type === 'actual' ? 
                timeoutQueriesData.actualTimeouts[index]?.statement : 
                timeoutQueriesData.approachingTimeouts[index - timeoutQueriesData.actualTimeouts.length]?.statement;
            
            if (!statement) {
                console.error(TEXT_CONSTANTS.STATEMENT_NOT_FOUND);
                showToast(TEXT_CONSTANTS.STATEMENT_NOT_FOUND, "error");
                return;
            }
            
            navigator.clipboard.writeText(statement)
                .then(() => {
                    const button = event.target;
                    const originalText = button.textContent;
                    button.textContent = TEXT_CONSTANTS.COPIED;
                    button.style.backgroundColor = '#4CAF50';
                    setTimeout(() => {
                        button.textContent = originalText;
                        button.style.backgroundColor = '';
                    }, 1000);
                })
                .catch((err) => {
                    console.error(TEXT_CONSTANTS.FAILED_COPY_CLIPBOARD, err);
                    showToast(TEXT_CONSTANTS.FAILED_COPY_CLIPBOARD, "error");
                });
        }

        // Use global loadedTabs from above (removed duplicate declaration - Step 5 fix)

        // Initialize jQuery UI Tabs with lazy loading
        $(function () {
            // Initialize jQuery UI tooltips (Issue #186)
            $(".help-icon").tooltip({
                position: {
                    my: "center bottom-10",
                    at: "center top"
                },
                show: {
                    effect: "fadeIn",
                    duration: 200
                },
                hide: {
                    effect: "fadeOut",
                    duration: 200
                }
            });

            $("#tabs").tabs({
                activate: function (event, ui) {
                    const tabId = ui.newPanel.attr("id");

                    // Skip lazy loading if we're just changing time grouping
                    if (isChangingTimeGrouping) {
                        Logger.trace(`Skipping lazy load for ${tabId} - time grouping change in progress`);
                        return;
                    }

                    // Lazy load charts when tabs are first activated
                    if (!loadedTabs.has(tabId)) {
                        loadedTabs.add(tabId);

                        if (tabId === "timeline") {
                            // Use current filtered requests, not cached data (Step 5 fix)
                            const currentFilteredRequests = window.filteredRequests || window.currentFilteredRequests || originalRequests;
                            if (currentFilteredRequests.length > 0) {
                                // Sample for performance with large datasets
                                const sampleSize = Math.min(500, currentFilteredRequests.length);
                                const sampleStep = Math.max(1, Math.floor(currentFilteredRequests.length / sampleSize));
                                const timelineSample = currentFilteredRequests.filter((_, i) => i % sampleStep === 0);
                                console.log(`${TEXT_CONSTANTS.TIMELINE_CHARTS_USING} ${timelineSample.length} ${TEXT_CONSTANTS.OF_TOTAL} ${currentFilteredRequests.length} ${TEXT_CONSTANTS.REQUESTS_FOR_PERFORMANCE}`);
                                generateFilterChart(currentFilteredRequests);
                                generateTimelineChart(timelineSample);
                            }
                        } else if (tabId === "dashboard") {
                            // Use current filtered requests, not cached data (Step 5 fix)
                            const currentFilteredRequests = window.filteredRequests || window.currentFilteredRequests || originalRequests;
                            if (currentFilteredRequests.length > 0) {
                                generateDashboardCharts(currentFilteredRequests);
                            }
                        }
                    }

                    // Always check Index/Query Flow tab (not just first time)
                    if (tabId === "index-query-flow" && originalRequests.length > 0) {
                        // Use current filtered requests, not cached data
                        const currentFilteredRequests = window.filteredRequests || window.currentFilteredRequests || originalRequests;
                        
                        // Rebuild Index/Query Flow with current filtered data
                        buildIndexQueryFlow(currentFilteredRequests);
                    }
                },
            });
        });

        // Whole Record feature (Issue #110)
        function setWholeRecordTexts() {
            try {
                var loadBtn = document.getElementById('whole-record-load-btn');
                if (loadBtn && window.TEXT_CONSTANTS) {
                    loadBtn.textContent = TEXT_CONSTANTS.LOAD || 'Load';
                }
                var label = document.querySelector('label[for="whole-record-request-id-input"]');
                if (label && window.TEXT_CONSTANTS) {
                    label.textContent = TEXT_CONSTANTS.REQUEST_ID || 'Request ID';
                }
                var input = document.getElementById('whole-record-request-id-input');
                if (input && window.TEXT_CONSTANTS) {
                    input.placeholder = TEXT_CONSTANTS.ENTER_REQUEST_ID || 'Enter requestId';
                }
            } catch (e) { /* no-op */ }
        }

        function copyRequestId(reqId, event) {
            if (!reqId) return;
            navigator.clipboard.writeText(String(reqId)).then(() => {
                if (event && event.target) {
                    const btn = event.target;
                    const original = btn.textContent;
                    btn.textContent = TEXT_CONSTANTS.COPIED || 'Copied!';
                    btn.style.backgroundColor = '#4CAF50';
                    setTimeout(() => { btn.textContent = TEXT_CONSTANTS.COPY || 'Copy'; btn.style.backgroundColor=''; }, 1000);
                } else {
                    showToast(TEXT_CONSTANTS.COPIED_CLIPBOARD || 'Copied to clipboard!', 'success');
                }
            }).catch((err) => {
                console.error(err);
                showToast(TEXT_CONSTANTS.FAILED_COPY_CLIPBOARD || 'Failed to copy to clipboard', 'error');
            });
            if (event && event.stopPropagation) event.stopPropagation();
        }

        function findRequestById(requestId) {
            if (!requestId) return null;
            const idStr = String(requestId);
            const pools = [window.filteredRequests, window.currentFilteredRequests, window.originalRequests];
            for (const pool of pools) {
                if (Array.isArray(pool)) {
                    const found = pool.find(r => (r && (r.requestId === idStr || r.requestID === idStr)));
                    if (found) return found;
                }
            }
            return null;
        }

        function renderWholeRecord(record) {
            const pre = document.getElementById('whole-record-json');
            if (!pre) return;
            if (!record) {
                pre.textContent = (window.TEXT_CONSTANTS && TEXT_CONSTANTS.RECORD_NOT_FOUND) || 'Request ID not found';
                return;
            }
            try {
                const out = Object.assign({}, record);
                if (out.request && typeof out.request === 'object') out.request = Object.assign({}, out.request);
                if (out.plan && typeof out.plan === 'string') { try { out.plan = JSON.parse(out.plan); } catch(_){} }
                if (out.request && out.request.plan && typeof out.request.plan === 'string') { try { out.request.plan = JSON.parse(out.request.plan); } catch(_){} }
                pre.textContent = JSON.stringify(out, null, 2);
            } catch (e) {
                pre.textContent = ((window.TEXT_CONSTANTS && TEXT_CONSTANTS.ERROR_PARSING_JSON) || 'Error parsing JSON:') + ' ' + (e && e.message ? e.message : e);
            }
        }

        function loadWholeRecordById(requestId) {
            const rec = findRequestById(requestId);
            try { const link = document.querySelector('a[href="#whole-record"]'); if (link && link.click) link.click(); } catch (_) {}
            renderWholeRecord(rec);
        }

        function loadWholeRecordFromInput() {
            const input = document.getElementById('whole-record-request-id-input');
            if (!input) return;
            const val = (input.value || '').trim();
            if (!val) return;
            loadWholeRecordById(val);
        }

        function handleWholeRecordHash() {
            try {
                const hash = window.location.hash || '';
                const m = hash.match(/requestId=([^&]+)/i);
                if (m && m[1]) {
                    const id = decodeURIComponent(m[1]);
                    const input = document.getElementById('whole-record-request-id-input');
                    if (input) input.value = id;
                    loadWholeRecordById(id);
                }
            } catch (e) { /* no-op */ }
        }

        (function(){
            function initWholeRecord() {
                setWholeRecordTexts();
                handleWholeRecordHash();
                try { window.addEventListener('hashchange', handleWholeRecordHash); } catch(_) {}
                try {
                  var inp = document.getElementById('whole-record-request-id-input');
                  if (inp) {
                    inp.addEventListener('paste', function(){
                      setTimeout(function(){
                        var v = (inp.value||'').trim();
                        if (v) loadWholeRecordById(v);
                      }, 0);
                    });
                    // Also auto-load when user types/pastes and pauses
                    var t;
                    inp.addEventListener('input', function(){
                      clearTimeout(t);
                      t = setTimeout(function(){
                        var v = (inp.value||'').trim();
                        if (v) loadWholeRecordById(v);
                      }, 300);
                    });
                  }
                } catch(_) {}
            }
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initWholeRecord);
            } else {
                initWholeRecord();
            }
        })();

        // Index/Query Flow functionality
        let indexQueryFlowData = {
            indexes: new Map(),
            queries: new Map(),
            connections: new Map(),
        };

        // Clear all Index/Query Flow content
        function clearIndexQueryFlow() {
            // Clear the flow elements container
            const flowElements = document.getElementById("flow-elements");
            if (flowElements) {
                flowElements.innerHTML = "";
            }

            // Clear the SVG connections
            const svg = document.getElementById("flow-svg");
            if (svg) {
                svg.innerHTML = "";
            }

            // Clear data structures
            if (indexQueryFlowData) {
                indexQueryFlowData.indexes.clear();
                indexQueryFlowData.queries.clear();
                indexQueryFlowData.connections.clear();
            }
        }

        // Process Index/Query data without DOM rendering (for hidden tabs)
        function processIndexQueryData(requests) {


            // Clear and rebuild data structures
            indexQueryFlowData.indexes.clear();
            indexQueryFlowData.queries.clear();
            indexQueryFlowData.connections.clear();

            // Copy exact logic from buildIndexQueryFlow but skip DOM rendering
            const requestIndexMap = new Map();
            const allIndexes = new Map();
            const queryGroups = new Map();

            let requestsWithPlans = 0;
            let requestsWithOperators = 0;

            requests.forEach((request, requestIndex) => {
                requestIndexMap.set(requestIndex, new Set());
                if (request.plan) {
                    requestsWithPlans++;
                    const planObj = typeof request.plan === "string" ? JSON.parse(request.plan) : request.plan;

                    if (planObj && planObj["#operator"]) {
                        requestsWithOperators++;
                        const statement = request.preparedText || request.statement || "";
                        
                        // Use parseFromClause() for consistent BSC extraction across all statement types
                        const bucketScopeCollection = parseFromClause(statement);
                        
                        // Log BSC extraction for debugging
                        console.log(`[BSC EXTRACTION] Query (SHA-256):`, hashQuery(statement));
                        console.log(`[BSC EXTRACTION] Extracted BSC:`, hashBSC(bucketScopeCollection), `(${bucketScopeCollection})`);

                        extractIndexUsage(planObj, requestIndex, requestIndexMap, bucketScopeCollection);
                    }
                }

                // Group queries by normalized statement  
                const stmt = request.preparedText || request.statement;
                if (stmt) {
                    const normalized = normalizeStatement(stmt);
                    if (!queryGroups.has(normalized)) {
                        queryGroups.set(normalized, {
                            normalizedStatement: normalized,
                            statement: stmt, // Add original statement for createQueryDiv
                            count: 0,
                            totalDuration: 0, // Add totalDuration calculation
                            requests: [],
                            scanConsistencies: [] // non-unbounded values only
                        });
                    }
                    const group = queryGroups.get(normalized);
                    group.count++;
                    // Use same logic as Analysis tab: serviceTime converted to ms
                    const durationMs = parseTime(request.serviceTime);
                    group.totalDuration += isNaN(durationMs) ? 0 : durationMs;
                    // Track non-unbounded scan consistency for this group
                    try {
                        const sc = ((request.scanConsistency) || (request.request && request.request.scanConsistency) || 'unbounded').toLowerCase();
                        if (sc && sc !== 'unbounded' && !group.scanConsistencies.includes(sc)) {
                            group.scanConsistencies.push(sc);
                        }
                    } catch(_) {}
                    group.requests.push(request);
                }
            });

            // Build allIndexes from requestIndexMap (same as main function)
            requestIndexMap.forEach((indexSet, requestIndex) => {
                indexSet.forEach((indexName) => {
                    if (!allIndexes.has(indexName)) {
                        const isPrimaryCheck = indexName === "#primary" ||
                            indexName.includes("#primary") ||
                            indexName.includes("primary") ||
                            indexName.endsWith("_primary");



                        allIndexes.set(indexName, {
                            name: indexName,
                            requests: [],
                            totalUsage: 0,
                            isPrimary: isPrimaryCheck,
                            scanTimes: [],
                            itemsScanned: [],
                            itemsFetched: []
                        });
                    }
                    const indexObj = allIndexes.get(indexName);
                    indexObj.requests.push(requests[requestIndex]);
                    indexObj.totalUsage++;

                    // Collect statistics from the request
                    const request = requests[requestIndex];
                    if (request) {

                        // Extract actual index scan service time and items data from plan data  
                        const indexData = extractIndexScanDataFromPlan(request.plan, indexName);
                        if (indexData.scanTime > 0) {
                            indexObj.scanTimes.push(indexData.scanTime);
                        }
                        if (indexData.itemsScanned > 0) {
                            indexObj.itemsScanned.push(indexData.itemsScanned);
                        }
                        if (indexData.itemsFetched > 0) {
                            indexObj.itemsFetched.push(indexData.itemsFetched);
                        }
                    }
                });
            });

            // CRITICAL: Populate indexQueryFlowData with processed data for SVG rendering
            // Sort indexes by totalUsage (descending) - show all indexes, even without stats
            const sortedIndexes = Array.from(allIndexes.values())
                .sort((a, b) => b.totalUsage - a.totalUsage);
            const sortedQueries = Array.from(queryGroups.values()).sort((a, b) => b.count - a.count);

            indexQueryFlowData.indexes = new Map(sortedIndexes.map(idx => [idx.name, idx]));
            indexQueryFlowData.queries = new Map(sortedQueries.map(q => [q.normalizedStatement, q]));



            // Rebuild connections data
            requestIndexMap.forEach((indexSet, requestIndex) => {
                const request = requests[requestIndex];
                const stmt = request.preparedText || request.statement;
                if (stmt) {
                    const normalized = normalizeStatement(stmt);
                    const bucketScopeCollection = parseFromClause(stmt);
                    
                    indexSet.forEach((indexName) => {
                        const compositeKey = `${indexName}::${bucketScopeCollection}`;
                        const connectionKey = `${normalized}::${compositeKey}`;
                        if (!indexQueryFlowData.connections.has(connectionKey)) {
                            indexQueryFlowData.connections.set(connectionKey, {
                                queryStatement: normalized,
                                indexName: indexName,
                                indexKey: compositeKey,
                                bucketScopeCollection: bucketScopeCollection,
                                count: 0,
                            });
                        }
                        indexQueryFlowData.connections.get(connectionKey).count++;
                    });
                }
            });

            // Update counts with correct data
            // Count unique index NAMES (not composite keys like "indexName::bucket.scope.collection")
            const uniqueIndexNames = new Set();
            allIndexes.forEach((value, key) => {
                // Extract index name from composite key or use key directly
                const indexName = key.includes("::") ? key.split("::")[0] : key;
                uniqueIndexNames.add(indexName);
            });
            const indexCountEl = document.getElementById("index-count");
            const queryCountEl = document.getElementById("query-count");
            if (indexCountEl) indexCountEl.textContent = uniqueIndexNames.size;
            if (queryCountEl) queryCountEl.textContent = queryGroups.size;


        }

        // Helper function to resolve #primary to actual primary index name
        function resolvePrimaryIndexName(bucketScopeCollection) {
            // Look through indexData to find the actual primary index for this collection
            for (const index of indexData) {
                if (index.indexString) {
                    const target = parseIndexTarget(index.indexString);
                    const targetString = `${target.bucket}.${target.scope}.${target.collection}`;
                    const isPrimary =
                        index.name.includes("primary") ||
                        index.name.includes("#primary") ||
                        index.name.endsWith("_primary");

                    if (isPrimary && targetString === bucketScopeCollection) {
                        return index.name;
                    }
                }
            }
            // If no actual primary index found, keep #primary
            return "#primary";
        }


        // Extract the actual service time and items data for a specific index from the plan JSON
        function extractIndexScanDataFromPlan(planString, indexName) {
            if (!planString || !indexName) return { scanTime: 0, itemsScanned: 0, itemsFetched: 0 };

            try {
                // Handle both cases: plan as string (needs parsing) or plan as object (already parsed)
                let plan;
                if (typeof planString === 'string') {
                    plan = JSON.parse(planString);
                } else if (typeof planString === 'object' && planString !== null) {
                    plan = planString; // Already parsed
                } else {
                    return { scanTime: 0, itemsScanned: 0, itemsFetched: 0 };
                }

                let result = { scanTime: 0, itemsScanned: 0, itemsFetched: 0 };

                function searchOperatorForIndex(operator) {
                    if (!operator) return;

                    const opType = operator["#operator"];

                    // Check if this operator uses the target index
                    const operatorIndex = operator.index || operator.indexName;

                    if (operatorIndex === indexName ||
                        (indexName.includes("primary") && operatorIndex === "#primary") ||
                        (indexName === "def_primary" && operatorIndex === "#primary")) {

                        // Extract servTime and items data from this operator's stats
                        if (operator["#stats"]) {
                            const stats = operator["#stats"];

                            if (stats["servTime"]) {
                                result.scanTime = parseTime(stats["servTime"]);
                            }
                            
                            // Handle itemsOut - use value if present, otherwise keep as 0 (scan returned no docs)
                            if (stats["#itemsOut"] !== undefined) {
                                result.itemsScanned = stats["#itemsOut"];
                            }
                            // else: keep default 0 value from initialization
                            
                            // Handle itemsIn - use value if present, otherwise keep as 0
                            if (stats["#itemsIn"] !== undefined) {
                                result.itemsFetched = stats["#itemsIn"];
                            }
                            // else: keep default 0 value from initialization
                        }
                    }
                    
                    // For UnionScan, IntersectScan, etc., check scans array FIRST before other traversals
                    // This ensures we find indexes inside UnionScan > DistinctScan > scan structures
                    if (operator["scans"] && Array.isArray(operator["scans"])) {
                        for (const scan of operator["scans"]) {
                            searchOperatorForIndex(scan);
                        }
                    }
                    
                    // For DistinctScan, check the nested scan property
                    if (operator["scan"]) {
                        searchOperatorForIndex(operator["scan"]);
                    }

                    // Recursively search child operators
                    if (operator["~child"]) {
                        searchOperatorForIndex(operator["~child"]);
                    }

                    if (operator["~children"]) {
                        for (const child of operator["~children"]) {
                            searchOperatorForIndex(child);
                        }
                    }

                    // Search other nested operator properties
                    if (operator["input"]) {
                        searchOperatorForIndex(operator["input"]);
                    }

                    if (operator["inputs"] && Array.isArray(operator["inputs"])) {
                        for (const input of operator["inputs"]) {
                            searchOperatorForIndex(input);
                        }
                    }

                    if (operator["left"]) {
                        searchOperatorForIndex(operator["left"]);
                    }

                    if (operator["right"]) {
                        searchOperatorForIndex(operator["right"]);
                    }

                    if (operator["first"]) {
                        searchOperatorForIndex(operator["first"]);
                    }

                    if (operator["second"]) {
                        searchOperatorForIndex(operator["second"]);
                    }
                    
                    // Search subqueries
                    if (operator["~subqueries"] && Array.isArray(operator["~subqueries"])) {
                        for (const subquery of operator["~subqueries"]) {
                            if (subquery.executionTimings) {
                                searchOperatorForIndex(subquery.executionTimings);
                            }
                        }
                    }
                }

                searchOperatorForIndex(plan);
                return result;
            } catch (e) {
                console.warn("Failed to process plan data:", e);
                console.warn("Plan type:", typeof planString);
                console.warn("Plan is null:", planString === null);
                return { scanTime: 0, itemsScanned: 0, itemsFetched: 0 };
            }
        }

        // Helper function to extract BSC from an operator
        function extractBSCFromOperator(operator) {
            if (!operator) return "unknown.unknown.unknown";
            
            // Handle both old and new Couchbase formats:
            // NEW format: has bucket, scope, keyspace fields
            // OLD format: only has keyspace (which is the bucket name), assumes _default._default
            if (operator.bucket) {
                // New format with explicit bucket/scope/keyspace
                const bucket = operator.bucket;
                const scope = operator.scope || "_default";
                const keyspace = operator.keyspace || "_default";
                return `${bucket}.${scope}.${keyspace}`;
            } else if (operator.keyspace) {
                // Old format: keyspace IS the bucket name, default scope/collection
                return `${operator.keyspace}._default._default`;
            } else {
                return "unknown.unknown.unknown";
            }
        }

        // Special handling for subqueries - extract BSC from each operator dynamically
        function extractIndexUsageFromSubquery(
            operator,
            requestIndex,
            requestIndexMap,
            visited = new WeakSet()
        ) {
            if (!operator) return;
            
            // Prevent infinite recursion
            if (visited.has(operator)) return;
            visited.add(operator);
            
            const opType = operator["#operator"];
            
            // Extract BSC from this operator if it has index/keyspace info
            let bucketScopeCollection = extractBSCFromOperator(operator);
            
            // Record index usage if this is a scan operator
            if (opType === "IndexScan" || opType === "IndexScan2" || opType === "IndexScan3") {
                if (operator.index) {
                    const compositeKey = `${operator.index}::${bucketScopeCollection}`;
                    requestIndexMap.get(requestIndex).add(compositeKey);
                }
                if (operator.indexName) {
                    const compositeKey = `${operator.indexName}::${bucketScopeCollection}`;
                    requestIndexMap.get(requestIndex).add(compositeKey);
                }
            }
            
            if (opType === "PrimaryScan" || opType === "PrimaryScan2" || opType === "PrimaryScan3") {
                let indexName = "#primary";
                const resolvedName = resolvePrimaryIndexName(bucketScopeCollection);
                if (resolvedName && resolvedName !== "#primary") {
                    indexName = resolvedName;
                } else if (operator.index) {
                    indexName = operator.index;
                }
                const compositeKey = `${indexName}::${bucketScopeCollection}`;
                requestIndexMap.get(requestIndex).add(compositeKey);
            }
            
            // Recursively traverse all child operators
            if (operator["~child"]) {
                extractIndexUsageFromSubquery(operator["~child"], requestIndex, requestIndexMap, visited);
            }
            if (operator["~children"] && Array.isArray(operator["~children"])) {
                operator["~children"].forEach((child) =>
                    extractIndexUsageFromSubquery(child, requestIndex, requestIndexMap, visited)
                );
            }
            if (operator.input) {
                extractIndexUsageFromSubquery(operator.input, requestIndex, requestIndexMap, visited);
            }
            if (operator.inputs && Array.isArray(operator.inputs)) {
                operator.inputs.forEach((input) =>
                    extractIndexUsageFromSubquery(input, requestIndex, requestIndexMap, visited)
                );
            }
            if (operator.left) {
                extractIndexUsageFromSubquery(operator.left, requestIndex, requestIndexMap, visited);
            }
            if (operator.right) {
                extractIndexUsageFromSubquery(operator.right, requestIndex, requestIndexMap, visited);
            }
            if (operator.first) {
                extractIndexUsageFromSubquery(operator.first, requestIndex, requestIndexMap, visited);
            }
            if (operator.second) {
                extractIndexUsageFromSubquery(operator.second, requestIndex, requestIndexMap, visited);
            }
            if (operator.scans && Array.isArray(operator.scans)) {
                operator.scans.forEach((scan) =>
                    extractIndexUsageFromSubquery(scan, requestIndex, requestIndexMap, visited)
                );
            }
            if (operator.scan) {
                extractIndexUsageFromSubquery(operator.scan, requestIndex, requestIndexMap, visited);
            }
            // Nested subqueries
            if (operator["~subqueries"] && Array.isArray(operator["~subqueries"])) {
                operator["~subqueries"].forEach((subquery) => {
                    if (subquery.executionTimings) {
                        extractIndexUsageFromSubquery(subquery.executionTimings, requestIndex, requestIndexMap, visited);
                    }
                });
            }
        }

        function extractIndexUsage(
            operator,
            requestIndex,
            requestIndexMap,
            bucketScopeCollection = "unknown.unknown.unknown"
        ) {
            if (!operator) {
                return;
            }

            // Function to record index usage for this request with BSC
            function recordIndexUsage(indexName) {
                // If this is #primary, try to resolve to actual primary index name
                if (indexName === "#primary") {
                    const resolved = resolvePrimaryIndexName(bucketScopeCollection);
                    indexName = resolved;
                }
                // Store as composite key: indexName::bucket.scope.collection
                const compositeKey = `${indexName}::${bucketScopeCollection}`;
                
                // Debug JOINs: only log if operator is a JOIN type
                if (opType && (opType === "Join" || opType === "Nest" || opType === "HashJoin" || opType === "NLJoin")) {
                    console.log(`[JOIN DEBUG] Recording index for ${opType}: ${hashCompositeKey(compositeKey)}`);
                }
                
                requestIndexMap.get(requestIndex).add(compositeKey);
            }

            const opType = operator["#operator"];
            
            // Extract BSC from operator if available (overrides parent BSC for accuracy)
            // This handles both old format (keyspace only) and new format (bucket/scope/keyspace)
            let operatorBSC = bucketScopeCollection;
            if (operator.keyspace || operator.bucket) {
                operatorBSC = extractBSCFromOperator(operator);
            }

            // Update recordIndexUsage to use operator-specific BSC
            function recordIndexUsageWithBSC(indexName) {
                if (indexName === "#primary") {
                    const resolved = resolvePrimaryIndexName(operatorBSC);
                    indexName = resolved;
                }
                const compositeKey = `${indexName}::${operatorBSC}`;
                
                if (opType && (opType === "Join" || opType === "Nest" || opType === "HashJoin" || opType === "NLJoin")) {
                    console.log(`[JOIN DEBUG] Recording index for ${opType}: ${hashCompositeKey(compositeKey)}`);
                }
                
                requestIndexMap.get(requestIndex).add(compositeKey);
            }

            // Check for IndexScan operators
            if (
                opType === "IndexScan" ||
                opType === "IndexScan2" ||
                opType === "IndexScan3"
            ) {
                if (operator.index) {
                    recordIndexUsageWithBSC(operator.index);
                }
                if (operator.indexName) {
                    recordIndexUsageWithBSC(operator.indexName);
                }
            }

            // Check for PrimaryScan operators
            if (
                opType === "PrimaryScan" ||
                opType === "PrimaryScan2" ||
                opType === "PrimaryScan3"
            ) {
                // For primary scans, prefer resolved name over operator.index to avoid duplicates
                let resolvedName = resolvePrimaryIndexName(operatorBSC);
                if (resolvedName && resolvedName !== "#primary") {
                    recordIndexUsageWithBSC(resolvedName);
                } else if (operator.index) {
                    recordIndexUsageWithBSC(operator.index);
                } else {
                    recordIndexUsageWithBSC("#primary");
                }
            }

            // Check for sequential scan
            if (operator.using === "sequentialscan") {
                recordIndexUsage("#sequentialscan");
            }

            // Recursively check child operators (same as Dashboard logic)
            if (operator["~child"]) {
                extractIndexUsage(
                    operator["~child"],
                    requestIndex,
                    requestIndexMap,
                    bucketScopeCollection
                );
            }
            if (operator["~children"] && Array.isArray(operator["~children"])) {
                operator["~children"].forEach((child) =>
                    extractIndexUsage(
                        child,
                        requestIndex,
                        requestIndexMap,
                        bucketScopeCollection
                    )
                );
            }
            if (operator.input) {
                extractIndexUsage(
                    operator.input,
                    requestIndex,
                    requestIndexMap,
                    bucketScopeCollection
                );
            }
            if (operator.inputs && Array.isArray(operator.inputs)) {
                operator.inputs.forEach((input) =>
                    extractIndexUsage(
                        input,
                        requestIndex,
                        requestIndexMap,
                        bucketScopeCollection
                    )
                );
            }
            if (operator.left) {
                extractIndexUsage(
                    operator.left,
                    requestIndex,
                    requestIndexMap,
                    bucketScopeCollection
                );
            }
            if (operator.right) {
                // For JOIN/NEST operators, the right side might have its own keyspace
                let rightBSC = bucketScopeCollection;
                if ((opType === "Join" || opType === "Nest" || opType === "HashJoin" || opType === "NLJoin") && operator.keyspace) {
                    console.log(`[JOIN DEBUG] Detected ${opType} operator with keyspace: ${operator.keyspace}`);
                    console.log(`[JOIN DEBUG] Left BSC: ${hashBSC(bucketScopeCollection)}`);
                    
                    // Extract BSC from keyspace field: "bucket:scope.collection" or "bucket"
                    const keyspace = operator.keyspace;
                    const colonIndex = keyspace.indexOf(':');
                    if (colonIndex > 0) {
                        const bucket = keyspace.substring(0, colonIndex);
                        const scopeCollection = keyspace.substring(colonIndex + 1);
                        const parts = scopeCollection.split('.');
                        if (parts.length === 2) {
                            rightBSC = `${bucket}.${parts[0]}.${parts[1]}`;
                        } else if (parts.length === 1) {
                            rightBSC = `${bucket}.${parts[0]}._default`;
                        }
                    } else {
                        // No colon, just bucket name
                        rightBSC = `${keyspace}._default._default`;
                    }
                    
                    console.log(`[JOIN DEBUG] Right BSC: ${hashBSC(rightBSC)}`);
                }
                extractIndexUsage(
                    operator.right,
                    requestIndex,
                    requestIndexMap,
                    rightBSC
                );
            }
            // Check for first and second properties (used in set operations like ExceptAll)
            if (operator.first) {
                extractIndexUsage(
                    operator.first,
                    requestIndex,
                    requestIndexMap,
                    bucketScopeCollection
                );
            }
            if (operator.second) {
                extractIndexUsage(
                    operator.second,
                    requestIndex,
                    requestIndexMap,
                    bucketScopeCollection
                );
            }
            // Check for scans array (used in UnionScan, IntersectScan, etc.)
            if (operator.scans && Array.isArray(operator.scans)) {
                operator.scans.forEach((scan) =>
                    extractIndexUsage(
                        scan,
                        requestIndex,
                        requestIndexMap,
                        bucketScopeCollection
                    )
                );
            }
            // Check for scan property (used in DistinctScan)
            if (operator.scan) {
                extractIndexUsage(
                    operator.scan,
                    requestIndex,
                    requestIndexMap,
                    bucketScopeCollection
                );
            }
            // Check for subqueries array
            if (operator["~subqueries"] && Array.isArray(operator["~subqueries"])) {
                operator["~subqueries"].forEach((subquery) => {
                    if (subquery.executionTimings) {
                        // For subqueries, we need to extract BSC from the subquery operators themselves
                        // since subqueries often access different keyspaces than the parent query
                        extractIndexUsageFromSubquery(
                            subquery.executionTimings,
                            requestIndex,
                            requestIndexMap
                        );
                    }
                });
            }
        }

        function renderIndexQueryFlow(indexes, queries, selectedIndex = "All", selectedBucket = "All", selectedScope = "All", selectedCollection = "All") {

            const flowElements = document.getElementById("flow-elements");

            if (!flowElements) {
                console.error("flow-elements container not found");
                return;
            }

            // Issue #178: Populate filter dropdowns with cascading logic
            const indexDropdown = document.getElementById("index-filter-dropdown");
            const bucketDropdown = document.getElementById("bucket-filter-dropdown");
            const scopeDropdown = document.getElementById("scope-filter-dropdown");
            const collectionDropdown = document.getElementById("collection-filter-dropdown");
            
            // Store original data if not already stored
            if (!window.flowOriginalIndexes) {
                window.flowOriginalIndexes = indexes;
                window.flowOriginalQueries = queries;
            }
            
            // Use original data for building dropdowns
            const originalIndexes = window.flowOriginalIndexes;
            const originalQueries = window.flowOriginalQueries;
            
            // Extract all bucket/scope/collection combinations from connection data (execution plans)
            // This ensures we capture ALL collections used, including JOINs and subqueries
            const queriesData = [];
            
            // Build map of queries to their BSC combinations based on which indexes they use
            const queryToBSCs = new Map(); // normalizedStatement -> Set of "bucket.scope.collection"
            
            if (indexQueryFlowData.connections) {
                indexQueryFlowData.connections.forEach((connection) => {
                    const queryStatement = connection.queryStatement;
                    const indexKey = connection.indexKey || connection.indexName;
                    
                    // Extract BSC from composite key: indexName::bucket.scope.collection
                    if (indexKey && indexKey.includes("::")) {
                        const bsc = indexKey.split("::")[1];
                        if (!queryToBSCs.has(queryStatement)) {
                            queryToBSCs.set(queryStatement, new Set());
                        }
                        queryToBSCs.get(queryStatement).add(bsc);
                    }
                });
            }
            
            // Now build queriesData from the connection-derived BSCs
            originalQueries.forEach(query => {
                const bscSet = queryToBSCs.get(query.normalizedStatement);
                
                // Debug JOINs
                const isJoin = query.statement && query.statement.toUpperCase().includes('JOIN');
                if (isJoin) {
                    const queryHash = hashQuery(query.statement);
                    console.log(`[JOIN DEBUG] Processing ${queryHash}`);
                    console.log(`[JOIN DEBUG] ${queryHash} found ${bscSet ? bscSet.size : 0} BSCs from connections:`, bscSet ? Array.from(bscSet).map(b => hashBSC(b)) : 'none');
                }
                
                if (!bscSet || bscSet.size === 0) {
                // Fallback: try to parse FROM clause if no connection data
                let statement = query.statement;
                if (!statement) return;
                   
                    // Remove comments and normalize whitespace
                    statement = statement
                        .replace(/--.*$/gm, "") // Remove line comments
                        .replace(/\/\*[\s\S]*?\*\//g, "") // Remove block comments
                        .replace(/\s+/g, " ") // Normalize whitespace
                        .trim();

                    // Handle PREPARE statements:
                    // Pattern 1: PREPARE name FROM actual_statement
                    // Pattern 2: PREPARE actual_statement (no name)
                    if (statement.match(/^PREPARE\s+/i)) {
                        // Try pattern with name: PREPARE name FROM statement
                        const namedPrepareMatch = statement.match(/^PREPARE\s+[a-zA-Z0-9_-]+\s+FROM\s+(.+)$/i);
                        if (namedPrepareMatch) {
                            statement = namedPrepareMatch[1].trim();
                        } else {
                            // Simple pattern: PREPARE statement (just strip PREPARE keyword)
                            statement = statement.replace(/^PREPARE\s+/i, '').trim();
                        }
                    }

                    let target = null;
                    let hasBackticks = false;
                    
                    // Define all DML/DQL statement keywords that precede the target keyspace
                    // MERGE INTO, UPSERT INTO, INSERT INTO, UPDATE, DELETE FROM, FROM
                    const statementKeyword = '(?:MERGE\\s+INTO|UPSERT\\s+INTO|INSERT\\s+INTO|UPDATE|DELETE\\s+FROM|FROM)';
                    
                    // Check for subqueries: FROM ( SELECT ... ) or INSERT INTO x (KEY, VALUE) (SELECT ...)
                    const subqueryCheck = statement.match(new RegExp(statementKeyword + '\\s*\\(', 'i'));
                    if (subqueryCheck) {
                        // Find all keyspace references that are NOT followed by (
                        const allTargets = [];
                        const regex = new RegExp(statementKeyword + '\\s+([^\\s(][^\\s]*)', 'gi');
                        let match;
                    while ((match = regex.exec(statement)) !== null) {
                        const possibleTarget = match[1].trim();
                        if (!possibleTarget.startsWith('(')) {
                                allTargets.push(possibleTarget);
                            }
                        }
                        if (allTargets.length > 0) {
                            target = allTargets[0].replace(/`/g, '');
                            hasBackticks = allTargets[0].includes('`');
                        }
                    }
                    
                    // If not subquery or couldn't extract, try normal patterns
                    if (!target) {
                        // Pattern 1: Mixed backticks - bucket.`scope`.`collection` (bucket not backticked)
                        const mixedBacktickMatch = statement.match(new RegExp(statementKeyword + '\\s+([a-zA-Z0-9_-]+)\\.`([^`]+)`\\.`([^`]+)`', 'i'));
                        if (mixedBacktickMatch) {
                            target = `${mixedBacktickMatch[1]}.${mixedBacktickMatch[2]}.${mixedBacktickMatch[3]}`;
                            hasBackticks = true;
                        } else {
                            // Pattern 2: Fully backticked - `bucket`.`scope`.`collection`
                            const fullBacktickMatch = statement.match(new RegExp(statementKeyword + '\\s+`([^`]+)`\\.`([^`]+)`\\.`([^`]+)`', 'i'));
                            if (fullBacktickMatch) {
                                target = `${fullBacktickMatch[1]}.${fullBacktickMatch[2]}.${fullBacktickMatch[3]}`;
                                hasBackticks = true;
                            } else {
                                // Pattern 3: Two-part backticked - `bucket`.`scope`
                                const twoPartBacktickMatch = statement.match(new RegExp(statementKeyword + '\\s+`([^`]+)`\\.`([^`]+)`', 'i'));
                                if (twoPartBacktickMatch) {
                                    target = `${twoPartBacktickMatch[1]}.${twoPartBacktickMatch[2]}`;
                                    hasBackticks = true;
                                } else {
                                    // Pattern 4: Single backticked - `bucket.scope.collection` or `bucket`
                                    const singleBacktickMatch = statement.match(new RegExp(statementKeyword + '\\s+`([^`]+)`', 'i'));
                                    if (singleBacktickMatch) {
                                        target = singleBacktickMatch[1].trim();
                                        hasBackticks = true;
                                    } else {
                                        // Pattern 5: No backticks - bucket.scope.collection or bucket
                                        // Must account for optional aliases: UPDATE hotel h, MERGE INTO airport t
                                        // Syntax: keyspace-ref ( AS? alias )?
                                        // Stop keywords cover SELECT, DML, and JOIN/WHERE clauses:
                                        // - WHERE, JOIN, LET, NEST, UNNEST, GROUP, ORDER, LIMIT (SELECT clauses)
                                        // - USE KEYS (UPDATE with specific keys)
                                        // - USING (MERGE source clause)
                                        // - SET (UPDATE assignments)
                                        // - VALUES (INSERT/UPSERT values)
                                        // - KEY (INSERT/UPSERT key specification)
                                        // - ON (JOIN/MERGE conditions)
                                        // - AS (aliases)
                                        // - RETURNING (DML output)
                                        // - WHEN (MERGE conditions)
                                        const stopKeywords = '(?:WHERE|JOIN|USE\\s+(?:KEYS|INDEX)|USING|LET|NEST|UNNEST|GROUP|ORDER|LIMIT|ON|AS|SET|VALUES|KEY|RETURNING|WHEN)';
                                        // Optional alias pattern: (?:\s+(?:AS\s+)?[a-zA-Z0-9_-]+)?
                                        // This allows: keyspace, keyspace AS alias, or keyspace alias
                                        const multiPartMatch = statement.match(new RegExp(statementKeyword + '\\s+([a-zA-Z0-9_-]+(?:\\.[a-zA-Z0-9_-]+)*)(?:\\s+(?:AS\\s+)?[a-zA-Z0-9_-]+)?(?:\\s+' + stopKeywords + '|;|\\s*$|\\s*\\()', 'i'));
                                        if (multiPartMatch) {
                                            target = multiPartMatch[1].trim();
                                        }
                                    }
                                }
                            }
                        }
                    }
                    
                    // If we have no valid target, log for debugging and skip
                    if (!target) {
                        console.warn(`[PARSE FAILED] Could not extract keyspace from query`);
                        console.warn(`[PARSE FAILED] Statement (SHA-256):`, hashQuery(statement));
                        console.warn(`[PARSE FAILED] Full statement:`, statement);
                        return;
                    }
                    
                    const parts = target.split(".").filter(p => p.length > 0);
                    let bucket, scope, collection;
                    
                    // Validate that parts look like real bucket names (not aliases)
                    const isValid = parts.every(p => /^[a-zA-Z0-9_-]+$/.test(p));
                    if (!isValid) {
                        console.warn(`[PARSE FAILED] Invalid keyspace parts (possible alias captured)`);
                        console.warn(`[PARSE FAILED] Extracted target:`, target);
                        console.warn(`[PARSE FAILED] Parts:`, parts);
                        console.warn(`[PARSE FAILED] Statement (SHA-256):`, hashQuery(statement));
                        console.warn(`[PARSE FAILED] Full statement:`, statement);
                        return;
                    }
                    
                    // Parse based on number of parts
                    if (parts.length === 1) {
                        // Single word bucket name (with or without backticks)
                        bucket = parts[0];
                        scope = "_default";
                        collection = "_default";
                    } else if (parts.length === 2) {
                        bucket = parts[0];
                        scope = parts[1];
                        collection = "_default";
                    } else if (parts.length >= 3) {
                        bucket = parts[0];
                        scope = parts[1];
                        collection = parts[2];
                    }
                    
                    // Log successful parsing
                    const parsedBSC = `${bucket}.${scope}.${collection}`;
                    console.log(`[PARSE SUCCESS] Extracted BSC: ${hashBSC(parsedBSC)} (${parsedBSC})`);
                    console.log(`[PARSE SUCCESS] From statement (SHA-256):`, hashQuery(statement));
                    
                    if (bucket && bucket.length > 0) {
                        queriesData.push({ bucket, scope, collection, query });
                    }
                } else {
                    // Use BSCs from connection data (covers JOINs, subqueries, etc.)
                    if (isJoin) {
                        console.log(`[JOIN DEBUG] ${hashQuery(query.statement)} using connection data`);
                    }
                    
                    bscSet.forEach(bscString => {
                        const parts = bscString.split(".");
                        if (parts.length === 3) {
                            if (isJoin) {
                                console.log(`[JOIN DEBUG] ${hashQuery(query.statement)} adding BSC to dropdown: ${hashBSC(bscString)}`);
                            }
                            queriesData.push({
                                bucket: parts[0],
                                scope: parts[1],
                                collection: parts[2],
                                query: query
                            });
                        }
                    });
                }
            });
            
            // Build cascading dropdown options based on current selections
            // Track counts for each bucket/scope/collection
            const bucketIndexCounts = new Map(); // bucket -> Set of index names
            const scopeIndexCounts = new Map(); // "bucket.scope" -> Set of index names
            const collectionIndexCounts = new Map(); // "bucket.scope.collection" -> Set of index names
            const relevantIndexes = new Set();
            
            // Build counts directly from originalIndexes to ensure all visible indexes are counted
            // Use composite keys to count each unique index+BSC combination
            originalIndexes.forEach(index => {
                const bsc = index.bucketScopeCollection || "unknown.unknown.unknown";
                const parts = bsc.split(".");
                const bucket = parts[0] || "unknown";
                const scope = parts[1] || "unknown";
                const collection = parts[2] || "unknown";
                
                // Use composite key to ensure each index+BSC combination is counted separately
                const compositeKey = `${index.name}::${bsc}`;
                
                // Count for bucket
                if (!bucketIndexCounts.has(bucket)) {
                    bucketIndexCounts.set(bucket, new Set());
                }
                bucketIndexCounts.get(bucket).add(compositeKey);
                
                // Count for scope
                const scopeKey = `${bucket}.${scope}`;
                if (!scopeIndexCounts.has(scopeKey)) {
                    scopeIndexCounts.set(scopeKey, new Set());
                }
                scopeIndexCounts.get(scopeKey).add(compositeKey);
                
                // Count for collection
                const collectionKey = `${bucket}.${scope}.${collection}`;
                if (!collectionIndexCounts.has(collectionKey)) {
                    collectionIndexCounts.set(collectionKey, new Set());
                }
                collectionIndexCounts.get(collectionKey).add(compositeKey);
            });
            
            // Build a map of which indexes are used by which queries
            const queryIndexMap = new Map(); // normalizedStatement -> Set of indexKeys
            if (indexQueryFlowData.connections) {
                indexQueryFlowData.connections.forEach((connection) => {
                    if (!queryIndexMap.has(connection.queryStatement)) {
                        queryIndexMap.set(connection.queryStatement, new Set());
                    }
                    queryIndexMap.get(connection.queryStatement).add(connection.indexKey || connection.indexName);
                });
            }
            
            queriesData.forEach(data => {
                // Get indexes for this query (contains composite keys like "indexName::bucket.scope.collection")
                const queryIndexes = queryIndexMap.get(data.query.normalizedStatement) || new Set();
                
                // Debug JOINs
                const isJoin = data.query.statement && data.query.statement.toUpperCase().includes('JOIN');
                if (isJoin && queryIndexes.size > 0) {
                    const currentBSC = `${data.bucket}.${data.scope}.${data.collection}`;
                    console.log(`[JOIN DEBUG] ${hashQuery(data.query.statement)} building counts for BSC: ${hashBSC(currentBSC)}`);
                    console.log(`[JOIN DEBUG] ${hashQuery(data.query.statement)} has ${queryIndexes.size} indexes:`, Array.from(queryIndexes).map(idx => hashCompositeKey(idx)));
                }
                
                // Add to relevant indexes based on current filter level
                if ((selectedBucket === "All" || data.bucket === selectedBucket) &&
                    (selectedScope === "All" || data.scope === selectedScope) &&
                    (selectedCollection === "All" || data.collection === selectedCollection)) {
                    queryIndexes.forEach(idx => {
                        const indexName = idx.includes("::") ? idx.split("::")[0] : idx;
                        relevantIndexes.add(indexName);
                    });
                }
            });
            
            // Extract unique values from the Maps
            const buckets = new Set(bucketIndexCounts.keys());
            const scopes = new Set();
            const collections = new Set();
            
            scopeIndexCounts.forEach((indexes, key) => {
                const parts = key.split(".");
                scopes.add(parts[1]); // Extract scope name
            });
            
            collectionIndexCounts.forEach((indexes, key) => {
                const parts = key.split(".");
                collections.add(parts[2]); // Extract collection name
            });
            
            // Calculate total indexes for "All" option - use un-deduped count (composite keys)
            // This counts index usage across all BSCs, not unique index names
            const totalIndexCount = originalIndexes.length;
            
            // Populate/rebuild bucket dropdown
            const currentBucketValue = bucketDropdown.value;
            bucketDropdown.innerHTML = `<option value="All">(All) (${totalIndexCount})</option>`;
            Array.from(buckets).sort().forEach(bucket => {
                // Get count from bucketIndexCounts (already contains unique index names)
                const count = (bucketIndexCounts.get(bucket) || new Set()).size;
                // Only show buckets that have at least one index
                if (count > 0) {
                    const option = document.createElement("option");
                    option.value = bucket;
                    option.textContent = `${bucket} (${count})`;
                    bucketDropdown.appendChild(option);
                }
            });
            bucketDropdown.value = selectedBucket;
            
            // Populate/rebuild scope dropdown (cascading from bucket)
            // Calculate total for scopes under current bucket
            let scopeAllCount;
            if (selectedBucket === "All") {
                // Show total indexes when no bucket filter
                scopeAllCount = totalIndexCount;
            } else {
                // Show indexes for selected bucket
                scopeAllCount = bucketIndexCounts.get(selectedBucket)?.size || 0;
            }
            scopeDropdown.innerHTML = `<option value="All">(All) (${scopeAllCount})</option>`;
            Array.from(scopes).sort().forEach(scope => {
                // Find the count for this scope under the selected bucket
                let count = 0;
                if (selectedBucket === "All") {
                    // Sum across all buckets for this scope
                    scopeIndexCounts.forEach((indexes, key) => {
                        if (key.endsWith("." + scope)) {
                            indexes.forEach(idx => count++);
                        }
                    });
                    // Deduplicate
                    const scopeSet = new Set();
                    scopeIndexCounts.forEach((indexes, key) => {
                        if (key.endsWith("." + scope)) {
                            indexes.forEach(idx => scopeSet.add(idx));
                        }
                    });
                    count = scopeSet.size;
                } else {
                    const scopeKey = `${selectedBucket}.${scope}`;
                    count = scopeIndexCounts.get(scopeKey)?.size || 0;
                }
                const option = document.createElement("option");
                option.value = scope;
                option.textContent = `${scope} (${count})`;
                scopeDropdown.appendChild(option);
            });
            // Reset scope to "All" if current selection is not available
            if (!scopes.has(selectedScope) && selectedScope !== "All") {
                selectedScope = "All";
            }
            scopeDropdown.value = selectedScope;
            
            // Populate/rebuild collection dropdown (cascading from bucket+scope)
            // Calculate total for collections under current bucket.scope
            let collectionAllCount;
            if (selectedBucket === "All" && selectedScope === "All") {
                // Show total indexes when no filters
                collectionAllCount = totalIndexCount;
            } else if (selectedBucket !== "All" && selectedScope === "All") {
                // Show indexes for selected bucket
                collectionAllCount = bucketIndexCounts.get(selectedBucket)?.size || 0;
            } else {
                // Show indexes for selected bucket.scope
                const scopeKey = `${selectedBucket}.${selectedScope}`;
                collectionAllCount = scopeIndexCounts.get(scopeKey)?.size || 0;
            }
            collectionDropdown.innerHTML = `<option value="All">(All) (${collectionAllCount})</option>`;
            Array.from(collections).sort().forEach(collection => {
                // Find the count for this collection under the selected bucket.scope
                let count = 0;
                const collectionSet = new Set();
                collectionIndexCounts.forEach((indexes, key) => {
                    const parts = key.split(".");
                    const keyBucket = parts[0];
                    const keyScope = parts[1];
                    const keyCollection = parts[2];
                    if ((selectedBucket === "All" || keyBucket === selectedBucket) &&
                        (selectedScope === "All" || keyScope === selectedScope) &&
                        keyCollection === collection) {
                        indexes.forEach(idx => collectionSet.add(idx));
                    }
                });
                count = collectionSet.size;
                const option = document.createElement("option");
                option.value = collection;
                option.textContent = `${collection} (${count})`;
                collectionDropdown.appendChild(option);
            });
            // Reset collection to "All" if current selection is not available
            if (!collections.has(selectedCollection) && selectedCollection !== "All") {
                selectedCollection = "All";
            }
            collectionDropdown.value = selectedCollection;
            
            // Populate/rebuild index dropdown (cascading from bucket+scope+collection)
            const indexesToShow = selectedBucket === "All" && selectedScope === "All" && selectedCollection === "All" 
                ? originalIndexes 
                : originalIndexes.filter(idx => {
                    // Check if index name is in relevant set
                    if (!relevantIndexes.has(idx.name)) return false;
                    
                    // Also check if the index's BSC matches the selected filters
                    if (!idx.bucketScopeCollection) return false;
                    const parts = idx.bucketScopeCollection.split(".");
                    if (parts.length !== 3) return false;
                    
                    const [bucket, scope, collection] = parts;
                    const bucketMatch = selectedBucket === "All" || bucket === selectedBucket;
                    const scopeMatch = selectedScope === "All" || scope === selectedScope;
                    const collectionMatch = selectedCollection === "All" || collection === selectedCollection;
                    
                    return bucketMatch && scopeMatch && collectionMatch;
                });
            
            // Sort indexes alphabetically by name
            const sortedIndexes = indexesToShow.slice().sort((a, b) => a.name.localeCompare(b.name));
            
            indexDropdown.innerHTML = `<option value="All">(All)</option>`;
            sortedIndexes.forEach(index => {
                const option = document.createElement("option");
                option.value = index.name;
                // Show index name with total usage (scanned count) using [] brackets
                option.textContent = `${index.name} [${index.totalUsage}]`;
                indexDropdown.appendChild(option);
            });
            // Reset index to "All" if current selection is not available
            if (selectedIndex !== "All" && !sortedIndexes.find(idx => idx.name === selectedIndex)) {
                selectedIndex = "All";
            }
            indexDropdown.value = selectedIndex;
            
            // Set up event listeners (use removeEventListener first to avoid duplicates)
            const bucketChangeHandler = function() {
                const newScope = scopeDropdown.value;
                const newCollection = collectionDropdown.value;
                renderIndexQueryFlow(originalIndexes, originalQueries, "All", this.value, "All", "All");
            };
            const scopeChangeHandler = function() {
                const newCollection = collectionDropdown.value;
                renderIndexQueryFlow(originalIndexes, originalQueries, "All", selectedBucket, this.value, "All");
            };
            const collectionChangeHandler = function() {
                renderIndexQueryFlow(originalIndexes, originalQueries, "All", selectedBucket, selectedScope, this.value);
            };
            const indexChangeHandler = function() {
                renderIndexQueryFlow(originalIndexes, originalQueries, this.value, selectedBucket, selectedScope, selectedCollection);
            };
            
            // Remove old listeners and add new ones
            bucketDropdown.removeEventListener("change", bucketDropdown._changeHandler);
            scopeDropdown.removeEventListener("change", scopeDropdown._changeHandler);
            collectionDropdown.removeEventListener("change", collectionDropdown._changeHandler);
            indexDropdown.removeEventListener("change", indexDropdown._changeHandler);
            
            bucketDropdown._changeHandler = bucketChangeHandler;
            scopeDropdown._changeHandler = scopeChangeHandler;
            collectionDropdown._changeHandler = collectionChangeHandler;
            indexDropdown._changeHandler = indexChangeHandler;
            
            bucketDropdown.addEventListener("change", bucketChangeHandler);
            scopeDropdown.addEventListener("change", scopeChangeHandler);
            collectionDropdown.addEventListener("change", collectionChangeHandler);
            indexDropdown.addEventListener("change", indexChangeHandler);
            
            // Issue #178: Filter indexes and queries based on selection
            let filteredIndexes = indexes;
            let filteredQueries = queries;
            
            // Filter by bucket/scope/collection
            if (selectedBucket !== "All" || selectedScope !== "All" || selectedCollection !== "All") {
                filteredQueries = queries.filter(query => {
                    let statement = query.statement;
                    if (!statement) return false;
                    
                    let target = null;
                    let hasBackticks = false;
                    
                    // Support both SELECT (FROM) and DML statements (DELETE, UPDATE, INSERT INTO, MERGE INTO, UPSERT INTO)
                    const statementKeyword = '(?:FROM|DELETE|UPDATE|INSERT\\s+INTO|MERGE\\s+INTO|UPSERT\\s+INTO)';
                    
                    // Try to match with individually backticked components: `bucket`.`scope`.`collection`
                    const individualBacktickMatch = statement.match(new RegExp(statementKeyword + '\\s+`([^`]+)`\\.`([^`]+)`\\.`([^`]+)`', 'i'));
                    if (individualBacktickMatch) {
                        target = `${individualBacktickMatch[1]}.${individualBacktickMatch[2]}.${individualBacktickMatch[3]}`;
                        hasBackticks = true;
                    } else {
                        // Try two-part backticked: `bucket`.`scope`
                        const twoPartBacktickMatch = statement.match(new RegExp(statementKeyword + '\\s+`([^`]+)`\\.`([^`]+)`', 'i'));
                        if (twoPartBacktickMatch) {
                            target = `${twoPartBacktickMatch[1]}.${twoPartBacktickMatch[2]}`;
                            hasBackticks = true;
                        } else {
                            // Try single backticked identifier: `bucket.scope.collection` or `bucket`
                            const singleBacktickMatch = statement.match(new RegExp(statementKeyword + '\\s+`([^`]+)`', 'i'));
                            if (singleBacktickMatch) {
                                target = singleBacktickMatch[1].trim();
                                hasBackticks = true;
                            } else {
                                // Try to match without backticks - can be multi-part OR single word if followed by keyword/end
                                // Added USING (for MERGE) and SET (for UPDATE) as stop keywords
                                const multiPartMatch = statement.match(new RegExp(statementKeyword + '\\s+([a-zA-Z0-9_-]+(?:\\.[a-zA-Z0-9_-]+)*)(?:\\s+(?:WHERE|JOIN|USE|USING|LET|NEST|UNNEST|GROUP|ORDER|LIMIT|ON|AS|SET|VALUES|KEY)|;|\\s*$)', 'i'));
                                if (multiPartMatch) {
                                    target = multiPartMatch[1].trim();
                                }
                            }
                        }
                    }
                    
                    if (!target) return false;
                    
                    const parts = target.split(".").filter(p => p.length > 0);
                    
                    const isValid = parts.every(p => /^[a-zA-Z0-9_-]+$/.test(p));
                    if (!isValid) return false;
                    
                    let bucket, scope, collection;
                    
                    if (parts.length === 1) {
                        // Single word bucket name (with or without backticks)
                        bucket = parts[0];
                        scope = "_default";
                        collection = "_default";
                    } else if (parts.length === 2) {
                        bucket = parts[0];
                        scope = parts[1];
                        collection = "_default";
                    } else if (parts.length >= 3) {
                        bucket = parts[0];
                        scope = parts[1];
                        collection = parts[2];
                    } else {
                        return false;
                    }
                    
                    const bucketMatch = selectedBucket === "All" || bucket === selectedBucket;
                    const scopeMatch = selectedScope === "All" || scope === selectedScope;
                    const collectionMatch = selectedCollection === "All" || collection === selectedCollection;
                    
                    return bucketMatch && scopeMatch && collectionMatch;
                });
                
                // Filter indexes to only show those connected to filtered queries
                const connectedIndexKeys = new Set();
                
                console.log(`[FILTER DEBUG] Number of filtered queries: ${filteredQueries.length}`);
                console.log(`[FILTER DEBUG] Total connections: ${indexQueryFlowData.connections ? indexQueryFlowData.connections.size : 0}`);
                
                filteredQueries.forEach(query => {
                    const isJoin = query.statement && query.statement.toUpperCase().includes('JOIN');
                    
                    if (indexQueryFlowData.connections) {
                        let connectionCount = 0;
                        let primaryConnectionFound = false;
                        indexQueryFlowData.connections.forEach((connection) => {
                            if (connection.queryStatement === query.normalizedStatement) {
                                const indexKey = connection.indexKey || `${connection.indexName}::${connection.bucketScopeCollection}`;
                                connectedIndexKeys.add(indexKey);
                                connectionCount++;
                                if (indexKey.includes("#primary")) {
                                    primaryConnectionFound = true;
                                }
                                
                                if (isJoin) {
                                    console.log(`[JOIN DEBUG] ${hashQuery(query.statement)} adding connected index to LEFT side: ${hashCompositeKey(indexKey)}`);
                                }
                            }
                        });
                        
                        if (isJoin) {
                            console.log(`[JOIN DEBUG] ${hashQuery(query.statement)} added ${connectionCount} indexes to connectedIndexKeys`);
                        }
                        if (primaryConnectionFound) {
                            console.log(`[FILTER DEBUG] Found #primary connection for query:`, query.statement.substring(0, 100));
                        }
                    }
                });
                
                console.log(`[FILTER DEBUG] Total connectedIndexKeys: ${connectedIndexKeys.size}`);
                
                filteredIndexes = indexes.filter(idx => {
                    const key = `${idx.name}::${idx.bucketScopeCollection}`;
                    const included = connectedIndexKeys.has(key);
                    
                    if (!included && idx.name === "#primary") {
                        console.warn(`[FILTER DEBUG] #primary excluded - key: ${key}, has BSC: ${idx.bucketScopeCollection}, connectedKeys:`, Array.from(connectedIndexKeys).filter(k => k.includes("#primary")));
                    }
                    
                    const isJoinIndex = Array.from(connectedIndexKeys).some(ck => {
                        const stmt = [...filteredQueries].find(q => {
                            return indexQueryFlowData.connections && Array.from(indexQueryFlowData.connections.values()).some(conn => 
                                conn.queryStatement === q.normalizedStatement && (conn.indexKey === ck || `${conn.indexName}::${conn.bucketScopeCollection}` === ck)
                            );
                        });
                        return stmt && stmt.statement && stmt.statement.toUpperCase().includes('JOIN');
                    });
                    
                    if (isJoinIndex && !included) {
                        console.log(`[JOIN DEBUG] FILTERED OUT index: ${hashCompositeKey(key)} (not in connectedIndexKeys)`);
                    }
                    
                    return included;
                });
                
                // Also filter queries to only show those that have connections to indexes
                filteredQueries = filteredQueries.filter(query => {
                    if (!indexQueryFlowData.connections) return false;
                    let hasConnection = false;
                    indexQueryFlowData.connections.forEach((connection) => {
                        const key = connection.indexKey || `${connection.indexName}::${connection.bucketScopeCollection}`;
                        if (connection.queryStatement === query.normalizedStatement && connectedIndexKeys.has(key)) {
                            hasConnection = true;
                        }
                    });
                    return hasConnection;
                });
            }
            
            // Filter by index name
            if (selectedIndex !== "All") {
                // Filter to show only selected index
                filteredIndexes = filteredIndexes.filter(idx => idx.name === selectedIndex);
                
                // Filter queries to show only those connected to this index
                filteredQueries = filteredQueries.filter(query => {
                    if (!indexQueryFlowData.connections) return false;
                    let hasConnection = false;
                    indexQueryFlowData.connections.forEach((connection) => {
                        if (connection.queryStatement === query.normalizedStatement && connection.indexName === selectedIndex) {
                            hasConnection = true;
                        }
                    });
                    return hasConnection;
                });
            }
            
            // Set dropdown values
            if (indexDropdown) indexDropdown.value = selectedIndex;
            if (bucketDropdown) bucketDropdown.value = selectedBucket;
            if (scopeDropdown) scopeDropdown.value = selectedScope;
            if (collectionDropdown) collectionDropdown.value = selectedCollection;

            // Update counts in summary
            const indexCountEl = document.getElementById("index-count");
            const queryCountEl = document.getElementById("query-count");
            if (indexCountEl) indexCountEl.textContent = filteredIndexes.length;
            if (queryCountEl) queryCountEl.textContent = filteredQueries.length;
            
            // Debug: Show final filtered indexes for JOINs
            const joinFilteredIndexes = filteredIndexes.filter(idx => {
                // Check if this index is used by any JOIN query
                if (!indexQueryFlowData.connections) return false;
                return Array.from(indexQueryFlowData.connections.values()).some(conn => {
                    const indexKey = conn.indexKey || `${conn.indexName}::${conn.bucketScopeCollection}`;
                    const idxKey = `${idx.name}::${idx.bucketScopeCollection}`;
                    if (indexKey === idxKey) {
                        const query = filteredQueries.find(q => q.normalizedStatement === conn.queryStatement);
                        return query && query.statement && query.statement.toUpperCase().includes('JOIN');
                    }
                    return false;
                });
            });
            console.log(`[FLOW DEBUG] Total indexes on LEFT side: ${filteredIndexes.length}`);
            console.log(`[FLOW DEBUG] JOIN-related indexes on LEFT (first 10):`, 
                joinFilteredIndexes.slice(0, 10).map(idx => `${hashCompositeKey(idx.name + '::' + idx.bucketScopeCollection)} (scanned: ${idx.totalUsage})`));

            // Clear container
            flowElements.innerHTML = "";

            if (filteredIndexes.length === 0) {
                flowElements.innerHTML =
                    '<div style="padding: 20px; text-align: center; color: #666; font-style: italic;">No index usage found in the queries.<br><br>This could mean:<br>• Queries use sequential scans<br>• Index information not in execution plans<br>• All queries are prepared statements without index details</div>';
                return;
            }

            // Generate colors for indexes
            const colors = generateColors(filteredIndexes.length);

            // Calculate layout - indexes on left, queries on right
            const canvasWidth = flowElements.offsetWidth || 1200;
            const indexItemHeight = 164; // Issue #178: Index spacing (144 + 20px gap)
            const queryItemHeight = 193; // Issue #178: Query spacing (173 + 20px gap)
            const canvasHeight = Math.max(
                filteredIndexes.length * indexItemHeight,
                filteredQueries.length * queryItemHeight,
                400
            );

            // Set container height
            flowElements.style.height = canvasHeight + "px";

            // Position indexes on the left
            const indexPositions = [];
            filteredIndexes.forEach((index, i) => {
                const x = 50;
                const y = 20 + i * indexItemHeight; // Issue #178: 20px top padding
                // Pass current filter selections to createIndexDiv
                const indexDiv = createIndexDiv(index, colors[i], x, y, selectedBucket, selectedScope, selectedCollection);
                flowElements.appendChild(indexDiv);
                indexPositions.push({
                    element: indexDiv,
                    x: x + 150,
                    y: y + 40,
                    index: index,
                }); // right edge + center
            });

            // Position queries on the right
            const queryPositions = [];
            filteredQueries.forEach((query, queryIndex) => {
                const x = canvasWidth - 380;
                const y = 20 + queryIndex * queryItemHeight; // Issue #178: 20px top padding
                const queryDiv = createQueryDiv(query, queryIndex, x, y);
                flowElements.appendChild(queryDiv);
                queryPositions.push({
                    element: queryDiv,
                    x: x,
                    y: y + 40,
                    query: query,
                }); // left edge + center
            });

            // Draw connections after elements are positioned
            // Use multiple attempts with increasing delays to ensure layout is complete
            setTimeout(() => {
                drawSimpleConnections(indexPositions, queryPositions, colors);
            }, 100);

            // Additional redraw after longer delay to ensure correct positioning
            setTimeout(() => {
                redrawConnectionsAfterDrag();
            }, 300);
        }

        function createIndexDiv(index, color, x, y, selectedBucket = "All", selectedScope = "All", selectedCollection = "All") {
            const div = document.createElement("div");
            let className = "index-item";
            if (index.isPrimary) className += " primary";
            if (index.name === "#sequentialscan") className += " sequential-scan";

            div.className = className;
            div.style.borderColor = color;
            div.style.position = "absolute";
            div.style.left = x + "px";
            div.style.top = y + "px";
            div.style.width = "280px";
            div.style.margin = "0 0 20px 0"; // Issue #178: Keep bottom margin for spacing

            // Add orange background for sequential scan
            if (index.name === "#sequentialscan") {
                div.style.backgroundColor = "#fff3cd";
                div.style.borderColor = "#ff9800";
            }

            div.draggable = true;
            div.dataset.indexName = index.name;
            div.dataset.bsc = index.bucketScopeCollection || '';

            const stats = calculateIndexStats(index);

            // Check avg scan time for styling:
            // 2-10 seconds: USE KEYS color (orange) and bold
            // 10+ seconds: Red and bold
            const scanTimes = index.scanTimes || [];
            const avgScanTimeMs = scanTimes.length
                ? scanTimes.reduce((a, b) => a + b, 0) / scanTimes.length
                : 0;
            const avgScanTimeSeconds = avgScanTimeMs / 1000;
            let avgScanTimeStyle = "";
            if (avgScanTimeSeconds >= 10) {
                avgScanTimeStyle = "font-weight: bold; color: red;";
            } else if (avgScanTimeSeconds >= 2) {
                avgScanTimeStyle = "font-weight: bold; color: #ff9800;";
            }

            // Display bucket.scope.collection info (now each index is unique per BSC)
            const bscDisplay = index.bucketScopeCollection || '';
            
            div.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight: bold; font-size: 14px; color: #333;">${index.name} | Scanned: ${index.totalUsage}</div>
              <div style="font-style: italic; font-size: 11px; color: #666; margin-top: 2px;">${bscDisplay}</div>
            </div>
            <button onclick="copyIndexName('${index.name.replace(
                    /'/g,
                    "\\'"
                )}', event)" class="btn-standard" style="font-size: 11px;">Copy</button>
          </div>
          <div class="index-stats" style="font-size: 13px; margin-top: 8px;">
            Avg Scan Time: <span style="${avgScanTimeStyle}">${stats.avgScanTime
                }</span><br>
            Avg Items Scanned: ${stats.avgItemsScanned}<br>
            Avg Items Fetched: ${stats.avgItemsFetched}<br>
            Min/Max Scan Time: ${stats.minScanTime} / ${stats.maxScanTime}<br>
            Min/Max Items: ${stats.minItems} / ${stats.maxItems}
          </div>
        `;

            makeDraggable(div);
            return div;
        }

        function createQueryDiv(query, queryIndex, x, y) {
            const div = document.createElement("div");
            div.className = "query-item";
            div.style.position = "absolute";
            div.style.left = x + "px";
            div.style.top = y + "px";
            div.style.width = "320px";
            div.style.minHeight = "160px"; // Issue #178: Fixed min height for uniform spacing
            div.style.margin = "0 0 20px 0"; // Issue #178: Keep bottom margin for spacing
            div.draggable = true;
            div.dataset.queryId = `query-${queryIndex}`;
            div.dataset.queryStatement = query.normalizedStatement;

            const avgDuration = query.totalDuration / query.count;
            const avgDurationSeconds = avgDuration / 1000;

            // Check for USE KEYS in the statement (excluding SQL comments)
            // Remove SQL line comments (-- ...) and block comments (/* ... */)
            const statementWithoutComments = query.statement
                .replace(/--[^\n]*/g, '') // Remove line comments
                .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove block comments
            const hasUseKeys = statementWithoutComments.includes("USE KEYS");
            const useKeysIndicator = hasUseKeys
                ? ' <span style="color: orange; font-weight: bold;">(USE KEYS)</span>'
                : "";

            // Check if avg duration >= 60 seconds for red/bold styling
            const avgDurationStyle =
                avgDurationSeconds >= 60 ? "font-weight: bold; color: red;" : "";

            const badgesHTML = (Array.isArray(query.scanConsistencies) && query.scanConsistencies.length > 0)
                ? query.scanConsistencies.map((c) => {
                    const lc = String(c).toLowerCase();
                    let bg = '#6c757d';
                    if (lc === 'scan_plus') bg = '#28a745';
                    else if (lc === 'request_plus') bg = '#fd7e14';
                    return `<span class="consistency-badge" style="display:inline-block;margin-left:6px;background:${bg};color:#fff;padding:2px 6px;border-radius:8px;font-size:10px;font-weight:700;">${lc}</span>`;
                }).join('')
                : '';

            div.innerHTML = `
          <div style="font-weight: bold; font-size: 14px; color: #333;">Executions: ${query.count
                }${useKeysIndicator}${badgesHTML}</div>
          <div style="font-size: 12px; color: #666; margin: 4px 0;">Avg Duration: <span style="${avgDurationStyle}">${formatTime(
                    avgDuration
                )}</span></div>
          <div class="query-text" id="query-text-${query.normalizedStatement.replace(
                    /[^a-zA-Z0-9]/g,
                    ""
                )}">
            ${query.statement}
          </div>
          <div class="query-controls">
            <button onclick="toggleQueryText('${query.normalizedStatement.replace(
                    /[^a-zA-Z0-9]/g,
                    ""
                )}')" class="btn-standard">Show More</button>
            <button class="btn-standard query-copy-btn" data-query-statement="${encodeURIComponent(
                    query.statement
                )}">Copy</button>
          </div>
        `;

            // Add event listener for copy button
            const copyBtn = div.querySelector(".query-copy-btn");
            if (copyBtn) {
                copyBtn.addEventListener("click", function (e) {
                    e.stopPropagation(); // Prevent drag from starting
                    const statement = decodeURIComponent(this.dataset.queryStatement);
                    copyQueryText(statement, e);
                });
            }

            makeDraggable(div);
            return div;
        }

        function calculateIndexStats(index) {
            const scanTimes = index.scanTimes || [];
            const itemsScanned = index.itemsScanned || [];
            const itemsFetched = index.itemsFetched || [];

            return {
                avgScanTime: scanTimes.length
                    ? formatTime(
                        scanTimes.reduce((a, b) => a + b, 0) / scanTimes.length
                    )
                    : "N/A",
                minScanTime: scanTimes.length
                    ? formatTime(Math.min(...scanTimes))
                    : "N/A",
                maxScanTime: scanTimes.length
                    ? formatTime(Math.max(...scanTimes))
                    : "N/A",
                avgItemsScanned: itemsScanned.length
                    ? Math.round(
                        itemsScanned.reduce((a, b) => a + b, 0) / itemsScanned.length
                    ).toLocaleString()
                    : "N/A",
                avgItemsFetched: itemsFetched.length
                    ? Math.round(
                        itemsFetched.reduce((a, b) => a + b, 0) / itemsFetched.length
                    ).toLocaleString()
                    : "N/A",
                minItems: itemsScanned.length ? Math.min(...itemsScanned).toLocaleString() : "N/A",
                maxItems: itemsScanned.length ? Math.max(...itemsScanned).toLocaleString() : "N/A",
            };
        }

        function generateColors(count) {
            const colors = [];
            for (let i = 0; i < count; i++) {
                const hue = ((i * 360) / count) % 360;
                colors.push(`hsl(${hue}, 70%, 50%)`);
            }
            return colors;
        }

        function drawSimpleConnections(indexPositions, queryPositions, colors) {
            const svg = document.getElementById("flow-svg");
            if (!svg) {
                console.error("SVG element not found");
                return;
            }

            svg.innerHTML = "";

            // Create maps for easy lookup using composite keys
            const indexMap = new Map();
            indexPositions.forEach((pos, i) => {
                const key = `${pos.index.name}::${pos.index.bucketScopeCollection}`;
                indexMap.set(key, { ...pos, color: colors[i] });
            });

            const queryMap = new Map();
            queryPositions.forEach((pos) => {
                queryMap.set(pos.query.normalizedStatement, pos);
            });

            let connectionsDrawn = 0;

            indexQueryFlowData.connections.forEach((connection) => {
                const indexKey = connection.indexKey || `${connection.indexName}::${connection.bucketScopeCollection}`;
                const indexPos = indexMap.get(indexKey);
                const queryPos = queryMap.get(connection.queryStatement);

                if (indexPos && queryPos) {
                    drawSimpleConnection(svg, indexPos, queryPos, connection.count);
                    connectionsDrawn++;
                }
            });
        }

        function drawSimpleConnection(svg, indexPos, queryPos, count) {
            const startX = indexPos.x;
            const startY = indexPos.y;
            const endX = queryPos.x;
            const endY = queryPos.y;

            // Calculate line thickness (scale between 2 and 12 pixels)
            const maxCount = Math.max(
                ...Array.from(indexQueryFlowData.connections.values()).map(
                    (c) => c.count
                )
            );
            const thickness = Math.max(
                2,
                Math.min(12, (count / maxCount) * 10 + 2)
            );

            // Create curved path instead of straight line
            const path = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "path"
            );

            // Calculate control points for the curve
            const curveAmount = Math.abs(endX - startX) * 0.4; // Curve intensity based on distance

            // Create a smooth S-curve
            const d = `M ${startX} ${startY} C ${startX + curveAmount} ${startY}, ${endX - curveAmount
                } ${endY}, ${endX} ${endY}`;

            path.setAttribute("d", d);
            path.setAttribute("stroke", indexPos.color);
            path.setAttribute("stroke-width", thickness);
            path.setAttribute("opacity", "0.7");
            path.setAttribute("fill", "none");

            // Create usage count label
            const midX = (startX + endX) / 2;
            const midY = (startY + endY) / 2;

            const rect = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "rect"
            );
            const text = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "text"
            );

            text.setAttribute("x", midX);
            text.setAttribute("y", midY + 6);
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("font-size", "17");
            text.setAttribute("font-weight", "bold");
            text.setAttribute("fill", "#333");
            text.textContent = count;

            // Estimate text dimensions (1.5x larger than original)
            const textWidth = count.toString().length * 11;
            rect.setAttribute("x", midX - textWidth / 2 - 5);
            rect.setAttribute("y", midY - 11);
            rect.setAttribute("width", textWidth + 10);
            rect.setAttribute("height", 22);
            rect.setAttribute("fill", "white");
            rect.setAttribute("stroke", "#333");
            rect.setAttribute("stroke-width", "1.5");
            rect.setAttribute("rx", "3");

            svg.appendChild(path);
            svg.appendChild(rect);
            svg.appendChild(text);
        }

        function makeDraggable(element) {
            let isDragging = false;
            let startX, startY, startLeft, startTop;

            element.addEventListener("mousedown", function (e) {
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;

                // Get current position relative to the container, not viewport
                const container = document.getElementById("flow-elements");
                const containerRect = container.getBoundingClientRect();
                const elementRect = element.getBoundingClientRect();

                startLeft = elementRect.left - containerRect.left;
                startTop = elementRect.top - containerRect.top;

                element.style.position = "absolute";
                element.style.zIndex = "1000";
                e.preventDefault();
            });

            document.addEventListener("mousemove", function (e) {
                if (!isDragging) return;
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;
                element.style.left = startLeft + deltaX + "px";
                element.style.top = startTop + deltaY + "px";

                // Redraw connections during drag for smooth following
                if (
                    document.getElementById("index-query-flow").style.display !== "none"
                ) {
                    redrawConnectionsAfterDrag();
                }
            });

            document.addEventListener("mouseup", function () {
                if (isDragging) {
                    isDragging = false;
                    element.style.zIndex = "";
                    // Redraw connections after drag
                    setTimeout(() => {
                        if (
                            document.getElementById("index-query-flow").style.display !==
                            "none"
                        ) {
                            redrawConnectionsAfterDrag();
                        }
                    }, 50);
                }
            });
        }

        function redrawConnectionsAfterDrag() {
            // Get current positions of all elements
            const indexElements = document.querySelectorAll("[data-index-name]");
            const queryElements = document.querySelectorAll("[data-query-id]");

            const indexPositions = [];
            const queryPositions = [];
            const colors = generateColors(indexElements.length);

            // Build current index positions
            indexElements.forEach((element, i) => {
                const rect = element.getBoundingClientRect();
                const containerRect = document
                    .getElementById("flow-elements")
                    .getBoundingClientRect();
                const indexName = element.dataset.indexName;
                const bucketScopeCollection = element.dataset.bsc || '';

                // Create a minimal index object with name and BSC for composite key
                const indexObj = { 
                    name: indexName,
                    bucketScopeCollection: bucketScopeCollection
                };

                indexPositions.push({
                    element: element,
                    x: rect.right - containerRect.left, // right edge
                    y: rect.top - containerRect.top + rect.height / 2, // center
                    index: indexObj,
                });
            });

            // Build current query positions
            queryElements.forEach((element) => {
                const rect = element.getBoundingClientRect();
                const containerRect = document
                    .getElementById("flow-elements")
                    .getBoundingClientRect();
                const queryStatement = element.dataset.queryStatement;

                // Create a minimal query object with just the normalized statement
                const queryObj = { normalizedStatement: queryStatement };

                queryPositions.push({
                    element: element,
                    x: rect.left - containerRect.left, // left edge
                    y: rect.top - containerRect.top + rect.height / 2, // center
                    query: queryObj,
                });
            });

            // Redraw connections with current positions
            drawSimpleConnections(indexPositions, queryPositions, colors);
        }


        function copyQueryText(text, event) {
            const button = event ? event.target : window.event.target;
            ClipboardUtils.copyToClipboard(text, button);
        }

        function copyIndexName(indexName, event) {
            ClipboardUtils.copyToClipboard(indexName, event.target);
        }

        // Copy to clipboard function for indexes and keys
        function copyToClipboard(text, event) {
            ClipboardUtils.copyToClipboard(text, event.target, {
                successColor: "#28a745"
            });
        }

        // Toggle USE KEYS visibility

        // Hook removed - buildIndexQueryFlow will be called directly after data processing

        // Version management
        const APP_VERSION = "4.0.0-dev";
const LAST_UPDATED = "2025-11-06";

        // Timezone management - initialize early to avoid undefined errors
        let detectedTimezone = "UTC"; // Timezone detected from data
        let currentTimezone = "UTC"; // Currently selected timezone (default to UTC)
        let timeZoneUserPicked = false; // Track if user manually selected a timezone

        // Vertical stake line for timeline charts (Issue #148)
        let verticalStakePosition = null; // Timestamp where the blue dotted line is staked

        // Detect timezone from requestTime string
        function detectTimezoneFromData(processData) {
            if (!processData || processData.length === 0) return "UTC";
            
            // Get first requestTime that exists
            for (let i = 0; i < Math.min(processData.length, 10); i++) {
                const item = processData[i];
                const request = item.completed_requests || item;
                if (request.requestTime) {
                    const requestTime = request.requestTime;
                    // Check for timezone offset (e.g., "2025-01-15T10:30:00-05:00" or "2025-01-15T10:30:00+00:00")
                    const offsetMatch = requestTime.match(/([+-]\d{2}:\d{2})$/);
                    if (offsetMatch) {
                        const offset = offsetMatch[1];
                        if (offset === "+00:00" || offset === "-00:00") {
                            return "UTC";
                        }
                        // Map common offsets to timezone names
                        const offsetToTimezone = {
                            "-10:00": "America/Honolulu",
                            "-09:00": "America/Anchorage",
                            "-08:00": "America/Los_Angeles",
                            "-07:00": "America/Denver",
                            "-06:00": "America/Chicago",
                            "-05:00": "America/New_York",
                            "-03:00": "America/Sao_Paulo",
                            "+00:00": "UTC",
                            "+01:00": "Europe/Paris",
                            "+02:00": "Europe/Athens",
                            "+03:00": "Europe/Moscow",
                            "+04:00": "Asia/Dubai",
                            "+05:30": "Asia/Kolkata",
                            "+06:00": "Asia/Dhaka",
                            "+07:00": "Asia/Bangkok",
                            "+08:00": "Asia/Shanghai",
                            "+09:00": "Asia/Tokyo",
                            "+09:30": "Australia/Adelaide",
                            "+10:00": "Australia/Sydney",
                            "+11:00": "Pacific/Guam",
                            "+12:00": "Pacific/Auckland"
                        };
                        return offsetToTimezone[offset] || "UTC";
                    }
                    // If no offset, assume UTC
                    return "UTC";
                }
            }
            return "UTC";
        }

        // Handle timezone change - called when user manually changes dropdown
        function handleTimezoneChange() {
            const timezoneSelector = document.getElementById("timezone-selector");
            if (!timezoneSelector) return;
            
            const oldTimezone = currentTimezone;
            currentTimezone = timezoneSelector.value;
            timeZoneUserPicked = true; // User manually picked a timezone
            
            Logger.info(`[handleTimezoneChange] Timezone changed from ${oldTimezone} to ${currentTimezone}`);
            
            // Clear timestamp rounding cache since timezone affects all date calculations
            timestampRoundingCache.clear();
            
            // Show reminder to re-parse data (timezone is a filter setting)
            if (originalRequests && originalRequests.length > 0) {
                showToast(TEXT_CONSTANTS.FILTERS_CHANGED_REMINDER, "warning");
            }
        }


        // Initialize the application
        // Index Analysis Variables
        let indexData = [];
        let filteredIndexData = [];
        let usedIndexes = new Set(); // Store indexes found in query data

        // Calculate human-readable time difference
        function getTimeSince(dateString) {
            if (!dateString || dateString === "Never") return "";

            const now = new Date();
            const past = new Date(dateString);
            const diffMs = now - past;

            const minutes = Math.floor(diffMs / 60000);
            const hours = Math.floor(diffMs / 3600000);
            const days = Math.floor(diffMs / 86400000);
            const weeks = Math.floor(days / 7);
            const months = Math.floor(days / 30);
            const years = Math.floor(days / 365);

            if (years > 0) return `(${years} year${years > 1 ? "s" : ""} ago)`;
            if (months > 0) return `(${months} month${months > 1 ? "s" : ""} ago)`;
            if (weeks > 0) return `(${weeks} week${weeks > 1 ? "s" : ""} ago)`;
            if (days > 0) return `(${days} day${days > 1 ? "s" : ""} ago)`;
            if (hours > 0) return `(${hours} hour${hours > 1 ? "s" : ""} ago)`;
            if (minutes > 0)
                return `(${minutes} minute${minutes > 1 ? "s" : ""} ago)`;
            return "(just now)";
        }

        // Create state badge HTML
        function createStateBadge(state) {
            const stateClass =
                state === "online"
                    ? "state-online"
                    : state === "offline"
                        ? "state-offline"
                        : state === "building"
                            ? "state-building"
                            : "state-offline";
            return `<span class="state-badge ${stateClass}">${state || "unknown"
                }</span>`;
        }

        // Extract and store all indexes used in queries
        function extractUsedIndexes(requests) {
            usedIndexes.clear();

            let totalIndexReferences = 0;

            requests.forEach((request, index) => {
                // Handle different JSON structures
                let actualRequest = request;
                if (request.completed_requests) {
                    // User's format: { completed_requests: {...}, plan: "..." }
                    actualRequest = {
                        ...request.completed_requests,
                        plan: request.plan,
                    };
                } else {
                }

                if (actualRequest.plan) {
                }

                // Create a copy of the request with parsed plan
                const processedRequest = { ...actualRequest };

                // Parse the plan if it's a string
                if (typeof processedRequest.plan === "string") {
                    try {
                        processedRequest.plan = JSON.parse(processedRequest.plan);
                    } catch (e) {
                        console.warn(
                            `⚠️ Failed to parse plan JSON for request: ${processedRequest.clientContextID ||
                            processedRequest.requestId ||
                            "unknown"
                            }`,
                            e
                        );
                        return; // Skip this request if plan can't be parsed
                    }
                } else if (processedRequest.plan) {
                } else {
                    Logger.warn(`⚠️ No plan found in request`);
                    return;
                }

                const indexesAndKeys = extractIndexesAndKeys(processedRequest);

                // Get bucket.scope.collection from the statement
                const statement =
                    actualRequest.preparedText || actualRequest.statement || "";

                let bucketScopeCollection = "unknown.unknown.unknown";

                // Try to extract FROM clause to get bucket.scope.collection
                const fromMatch = statement.match(/FROM\s+([^\s\n\r\t]+)/i);
                if (fromMatch) {
                    const target = fromMatch[1].replace(/`/g, "").replace(/;$/, "");
                    const parts = target.split(".");
                    if (parts.length === 1) {
                        bucketScopeCollection = `${parts[0]}._default._default`;
                    } else if (parts.length === 2) {
                        bucketScopeCollection = `${parts[0]}.${parts[1]}._default`;
                    } else if (parts.length >= 3) {
                        bucketScopeCollection = `${parts[0]}.${parts[1]}.${parts[2]}`;
                    }
                }

                // Add each index with its bucket.scope.collection
                indexesAndKeys.indexes.forEach((indexName) => {
                    const indexKey = `${indexName}|${bucketScopeCollection}`;
                    usedIndexes.add(indexKey);
                    totalIndexReferences++;
                });
            });

            Logger.info(
                `✅ Index extraction complete: ${usedIndexes.size} unique indexes, ${totalIndexReferences} total references`
            );
        }

        // Calculate and update index statistics
        function updateIndexStats() {
            const buckets = new Set();
            const scopes = new Set();
            const collections = new Set();
            let primaryCount = 0;
            let withReplicasCount = 0;
            let noReplicasCount = 0;
            let neverScannedCount = 0;
            let usedCount = 0;
            let mobileIndexCount = 0;

            filteredIndexData.forEach((index) => {
                if (index.indexString) {
                    const target = parseIndexTarget(index.indexString);
                    buckets.add(target.bucket);
                    scopes.add(target.scope);
                    collections.add(target.collection);
                }

                // Check if primary
                if (
                    index.name.includes("primary") ||
                    index.name.includes("#primary")
                ) {
                    primaryCount++;
                }

                // Check replicas (skip FTS indexes)
                const idxType = ((index.indexType || index.metadata?.using || '').toString().toLowerCase());
                if (idxType !== 'fts') {
                    const replica = index.metadata?.num_replica || 0;
                    if (replica > 0) {
                        withReplicasCount++;
                    } else {
                        noReplicasCount++;
                    }
                }

                // Check if never scanned (skip FTS indexes)
                const lastScan = index.metadata?.last_scan_time;
                const idxTypeForNever = ((index.indexType || index.metadata?.using || '').toString().toLowerCase());
                if (idxTypeForNever !== 'fts') {
                    if (!lastScan || lastScan === "Never") {
                        neverScannedCount++;
                    }
                }

                // Check if used in queries
                const target = parseIndexTarget(index.indexString);
                const targetString = `${target.bucket}.${target.scope}.${target.collection}`;
                const isPrimary =
                    index.name.includes("primary") || index.name.includes("#primary");

                const exactKey = `${index.name}|${targetString}`;
                const primaryKey = `#primary|${targetString}`;

                if (
                    usedIndexes.has(exactKey) ||
                    (isPrimary && usedIndexes.has(primaryKey))
                ) {
                    usedCount++;
                }

                // Check if mobile/sync gateway index
                if (index.name.startsWith("sg_")) {
                    mobileIndexCount++;
                }
            });

            // Update stats display
            document.getElementById("stat-indexes").textContent =
                filteredIndexData.length;
            document.getElementById("stat-buckets").textContent = buckets.size;
            document.getElementById("stat-scopes").textContent = scopes.size;
            document.getElementById("stat-collections").textContent =
                collections.size;

            const primaryElement = document.getElementById("stat-primary");
            primaryElement.textContent = primaryCount;
            primaryElement.className = primaryCount > 0 ? "primary-warning" : "";

            const replicaInfoElement = document.getElementById("stat-replica-info");
            replicaInfoElement.innerHTML = `<span class="${noReplicasCount > 0 ? "replica-zero" : ""
                }">${noReplicasCount}</span>/${withReplicasCount}`;

            document.getElementById("stat-never-scanned").textContent =
                neverScannedCount;
            document.getElementById(
                "stat-used-total"
            ).textContent = `${usedCount}/${filteredIndexData.length}`;
            document.getElementById("stat-mobile-indexes").textContent =
                mobileIndexCount;
        }

        // Parse and process index JSON data

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

        function updateDropdown(selectId, options) {
            const select = document.getElementById(selectId);
            const currentValue = select.value;

            // Clear existing options except (ALL)
            select.innerHTML = '<option value="(ALL)">(ALL)</option>';

            // Add new options
            options.forEach((option) => {
                const optionElement = document.createElement("option");
                optionElement.value = option;
                optionElement.textContent = option;
                select.appendChild(optionElement);
            });

            // Restore previous selection if it still exists
            if (options.includes(currentValue)) {
                select.value = currentValue;
            }
        }

        // Apply current filter settings
        function applyIndexFilters() {
            const bucketFilter = document.getElementById("bucketFilter").value;
            const scopeFilter = document.getElementById("scopeFilter").value;
            const collectionFilter =
                document.getElementById("collectionFilter").value;
            const searchTerm =
                document.getElementById("indexSearch")?.value.toLowerCase().trim() ||
                "";
            const typeFilter = document.querySelector('input[name="indexTypeFilter"]:checked')?.value || 'all';

            // Get checkbox filter states
            const filterPrimary =
                document.getElementById("filter-primary")?.checked || false;
            const filterUsed =
                document.getElementById("filter-used")?.checked || false;
            const filterNoReplica =
                document.getElementById("filter-no-replica")?.checked || false;
            const filterNeverScanned =
                document.getElementById("filter-never-scanned")?.checked || false;
            const filterExcludeMobile =
                document.getElementById("filter-exclude-mobile")?.checked || false;

            filteredIndexData = indexData.filter((index) => {
                if (!index.indexString) return false;

                const target = parseIndexTarget(index.indexString);

                // Basic dropdown filters
                const passesDropdownFilters =
                    (bucketFilter === "(ALL)" || target.bucket === bucketFilter) &&
                    (scopeFilter === "(ALL)" || target.scope === scopeFilter) &&
                    (collectionFilter === "(ALL)" ||
                        target.collection === collectionFilter);

                if (!passesDropdownFilters) return false;

                // Search filter
                if (searchTerm) {
                    const indexName = index.name.toLowerCase();
                    const indexString = index.indexString?.toLowerCase() || "";
                    const matchesSearch =
                        indexName.includes(searchTerm) ||
                        indexString.includes(searchTerm);
                    if (!matchesSearch) return false;
                }

                // Type radio filter (All, GSI, FTS)
                if (typeFilter !== 'all') {
                    const idxType = ((index.indexType || index.metadata?.using || '').toString().toLowerCase()) || 'gsi';
                    if (typeFilter === 'gsi' && idxType !== 'gsi') return false;
                    if (typeFilter === 'fts' && idxType !== 'fts') return false;
                }

                // Checkbox filters
                const isPrimary =
                    index.name.includes("primary") || index.name.includes("#primary");
                if (filterPrimary && !isPrimary) return false;

                // Check if used in queries
                if (filterUsed) {
                    const targetString = `${target.bucket}.${target.scope}.${target.collection}`;
                    const exactKey = `${index.name}|${targetString}`;
                    const primaryKey = `#primary|${targetString}`;
                    const isUsed =
                        usedIndexes.has(exactKey) ||
                        (isPrimary && usedIndexes.has(primaryKey));
                    if (!isUsed) return false;
                }

                // Check replicas (skip FTS indexes when filtering by no replica)
                if (filterNoReplica) {
                    const idxType = ((index.indexType || index.metadata?.using || '').toString().toLowerCase());
                    if (idxType === 'fts') return false;
                    const replica = index.metadata?.num_replica || 0;
                    if (replica !== 0) return false;
                }

                // Check never scanned (skip FTS indexes)
                if (filterNeverScanned) {
                    const idxTypeNs = ((index.indexType || index.metadata?.using || '').toString().toLowerCase());
                    if (idxTypeNs === 'fts') return false;
                    const lastScan = index.metadata?.last_scan_time;
                    if (lastScan && lastScan !== "Never") return false;
                }

                // Exclude Sync Gateway/Mobile indexes (sg_ prefixed)
                if (filterExcludeMobile) {
                    if (index.name.startsWith("sg_")) return false;
                }

                return true;
            });

            updateIndexStats();
            displayIndexResults();

            // Count and log matches
            let matchedCount = 0;
            filteredIndexData.forEach((index) => {
                const target = parseIndexTarget(index.indexString);
                const targetString = `${target.bucket}.${target.scope}.${target.collection}`;
                const isPrimary =
                    index.name.includes("primary") || index.name.includes("#primary");

                const exactKey = `${index.name}|${targetString}`;
                const primaryKey = `#primary|${targetString}`;

                if (
                    usedIndexes.has(exactKey) ||
                    (isPrimary && usedIndexes.has(primaryKey))
                ) {
                    matchedCount++;
                }
            });

            console.log(
                `📊 Matching summary: ${matchedCount}/${filteredIndexData.length} indexes found in query data`
            );
        }

        // Display filtered index results
        function displayIndexResults() {
            const resultsContainer = document.getElementById("indexResults");
            const sortBy = document.getElementById("sortBy").value;

            if (filteredIndexData.length === 0) {
                if (indexData.length === 0) {
                    // No index data loaded - show instructions
                    resultsContainer.innerHTML = `
                        <div class="text-align-center" style="margin-top: 30px;">
                            <h4 style="color: #495057; margin-bottom: 20px;">No Index Data Loaded</h4>
                            <p style="color: #666; margin-bottom: 20px;">
                                To analyze indexes, run this query in your Couchbase Query Workbench and paste the results in the second textarea above:
                            </p>
                            <div style="display: flex; justify-content: center;">
                                <div class="sql-query-box" style="text-align: left; max-width: fit-content;">
                                    <button class="btn-standard sql-copy-btn" onclick="copyIndexQuery(event)">Copy Query</button>
                                    <pre>SELECT 
    s.name,
    s.id,
    s.metadata,
    s.state,
    s.num_replica,
    s.\`using\` AS indexType,
    CONCAT("CREATE INDEX ", s.name, " ON ", k, ks, p, w, ";") AS indexString
FROM system:indexes AS s
LET bid = CONCAT("", s.bucket_id, ""),
    sid = CONCAT("", s.scope_id, ""),
    kid = CONCAT("", s.keyspace_id, ""),
    k = NVL2(bid, CONCAT2(".", bid, sid, kid), kid),
    ks = CASE WHEN s.is_primary THEN "" ELSE "(" || CONCAT2(",", s.index_key) || ")" END,
    w = CASE WHEN s.condition IS NOT NULL THEN " WHERE " || REPLACE(s.condition, '"', "'") ELSE "" END,
    p = CASE WHEN s.\`partition\` IS NOT NULL THEN " PARTITION BY " || s.\`partition\` ELSE "" END;</pre>
                                </div>
                            </div>
                            <p style="color: #666; font-size: 13px; margin-top: 15px;">
                                <strong>Steps:</strong><br>
                                1. Copy the query above<br>
                                2. Run it in Couchbase Query Workbench<br>
                                3. Copy the JSON results<br>
                                4. Paste into the second textarea at the top<br>
                                5. Click "Parse JSON" again
                            </p>
                        </div>
                    `;
                } else {
                    // Index data loaded but filtered out
                    resultsContainer.innerHTML = `
                        <p style="color: #666; text-align: center; margin-top: 50px;">
                            No indexes match the current filters.
                        </p>
                    `;
                }
                return;
            }

            console.log(
                `🔄 Displaying ${filteredIndexData.length} indexes and checking for query matches...`
            );

            let html = "";

            if (sortBy === "Bucket") {
                // Group by bucket
                const grouped = {};
                filteredIndexData.forEach((index) => {
                    const target = parseIndexTarget(index.indexString);
                    if (!grouped[target.bucket]) grouped[target.bucket] = [];
                    grouped[target.bucket].push(index);
                });

                Object.keys(grouped)
                    .sort()
                    .forEach((bucket) => {
                        html += `<div class="bucket-group">`;
                        html += `<h3 style="font-size: 24px;">${bucket}</h3>`;
                        grouped[bucket]
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .forEach((index) => {
                                html += createIndexHTML(index);
                            });
                        html += `</div>`;
                    });
            } else if (sortBy === "LastScanned") {
                // Sort by last scanned time (newest first)
                const sorted = [...filteredIndexData].sort((a, b) => {
                    const aLastScan = a.metadata?.last_scan_time || 0;
                    const bLastScan = b.metadata?.last_scan_time || 0;

                    // Handle 'Never' scanned cases (put them at the end)
                    if (aLastScan === 0 && bLastScan === 0)
                        return a.name.localeCompare(b.name);
                    if (aLastScan === 0) return 1;
                    if (bLastScan === 0) return -1;

                    // Sort by timestamp (newest first)
                    return new Date(bLastScan) - new Date(aLastScan);
                });
                sorted.forEach((index) => {
                    html += createIndexHTML(index);
                });
            } else if (sortBy === "OldestScanned") {
                // Sort by oldest scanned time (oldest first, exclude never scanned)
                const sorted = [...filteredIndexData]
                    .filter((index) => {
                        const lastScan = index.metadata?.last_scan_time || 0;
                        return lastScan !== 0; // Exclude never scanned indexes
                    })
                    .sort((a, b) => {
                        const aLastScan = a.metadata?.last_scan_time;
                        const bLastScan = b.metadata?.last_scan_time;
                        // Sort by timestamp (oldest first)
                        return new Date(aLastScan) - new Date(bLastScan);
                    });
                sorted.forEach((index) => {
                    html += createIndexHTML(index);
                });
            } else {
                // Sort by name (default)
                const sorted = [...filteredIndexData].sort((a, b) =>
                    a.name.localeCompare(b.name)
                );
                sorted.forEach((index) => {
                    html += createIndexHTML(index);
                });
            }

            resultsContainer.innerHTML = html;
        }

        function createIndexHTML(index) {
            const target = parseIndexTarget(index.indexString);
            const isPrimary =
                index.name.includes("primary") || index.name.includes("#primary");
            const lastScan = index.metadata?.last_scan_time || "Never";
            const rawReplica = index.metadata?.num_replica;
            const state = index.state || "unknown";
            
            // Apply timezone conversion to lastScan
            let lastScanFormatted = "Never";
            if (lastScan !== "Never") {
                const convertedDate = getChartDate(lastScan);
                lastScanFormatted = convertedDate ? convertedDate.toLocaleString() : new Date(lastScan).toLocaleString();
            }
            
            const timeSince = getTimeSince(lastScan);
            const idxType = ((index.indexType || index.metadata?.using || '').toString().toLowerCase()) || 'gsi';
            const isFtsIndex = idxType === 'fts';
            const idxTypeLabel = isFtsIndex ? 'FTS' : 'GSI';
            const computedReplica = (rawReplica ?? 0);
            const replicaDisplay = isFtsIndex ? TEXT_CONSTANTS.N_A : computedReplica;
            const replicaClass = (!isFtsIndex && computedReplica === 0) ? "replica-zero" : "";
            const lastScanDisplay = isFtsIndex ? TEXT_CONSTANTS.N_A : lastScanFormatted;
            const timeSinceDisplay = isFtsIndex ? "" : timeSince;

            // Check if this index is used in the parsed query data
            const targetString = `${target.bucket}.${target.scope}.${target.collection}`;
            let isUsed = false;

            // First try exact match
            const exactKey = `${index.name}|${targetString}`;
            if (usedIndexes.has(exactKey)) {
                isUsed = true;
                console.log(
                    `✅ Exact match found: "${index.name}" on ${targetString}`
                );
            }

            // If not found and this is a primary index, also check for #primary match
            if (!isUsed && isPrimary) {
                const primaryKey = `#primary|${targetString}`;
                if (usedIndexes.has(primaryKey)) {
                    isUsed = true;
                    console.log(
                        `✅ Primary match found: "${index.name}" matches "#primary" on ${targetString}`
                    );
                }
            }

            const usedBadge = isUsed ? '<span class="used-badge">Used</span>' : "";

            return `
                <div class="index-item ${isPrimary ? "primary" : ""}">
                    <h4>${index.name} ${usedBadge}</h4>
                    <div class="index-details">
                        <strong>Target:</strong> ${target.bucket}.${target.scope
                }.${target.collection}<br>
                        <strong>State:</strong> ${createStateBadge(
                    state
                )} | <strong>Type:</strong> ${idxTypeLabel} | <strong>Replicas:</strong> <span class="${replicaClass}">${replicaDisplay}</span> | <strong>Last Scan:</strong> ${lastScanDisplay} ${timeSinceDisplay}
                    </div>
                    <div class="index-statement">
                        ${index.indexString}
                        <button class="btn-standard copy-btn" onclick="copyIndexDefinition(this, event)" data-index-string="${index.indexString.replace(/"/g, '&quot;')}">Copy</button>
                    </div>
                </div>
            `;
        }

        // Copy index definition to clipboard
        function copyIndexDefinition(button, event) {
            const indexString = button.getAttribute('data-index-string');
            navigator.clipboard
                .writeText(indexString)
                .then(() => {
                    const originalText = button.textContent;
                    button.textContent = "Copied!";
                    button.style.backgroundColor = "#28a745";
                    setTimeout(() => {
                        button.textContent = originalText;
                        button.style.backgroundColor = "#007bff";
                    }, 1000);
                })
                .catch((err) => {
                    console.error("Failed to copy: ", err);
                });
        }

        // Copy index query to clipboard
        function copyIndexQuery(event) {
            const query = `SELECT 
            s.name,
            s.id,
            s.metadata,
            s.state,
            s.num_replica,
            s.\`using\` AS indexType,
            CONCAT("CREATE INDEX ", s.name, " ON ", k, ks, p, w, ";") AS indexString
            FROM system:indexes AS s
            LET bid = CONCAT("", s.bucket_id, ""),
            sid = CONCAT("", s.scope_id, ""),
            kid = CONCAT("", s.keyspace_id, ""),
            k = NVL2(bid, CONCAT2(".", bid, sid, kid), kid),
            ks = CASE WHEN s.is_primary THEN "" ELSE "(" || CONCAT2(",", s.index_key) || ")" END,
            w = CASE WHEN s.condition IS NOT NULL THEN " WHERE " || REPLACE(s.condition, '"', "'") ELSE "" END,
                p = CASE WHEN s.\`partition\` IS NOT NULL THEN " PARTITION BY " || s.\`partition\` ELSE "" END
 ;`;

            navigator.clipboard
                .writeText(query)
                .then(() => {
                    const button = event.target;
                    const originalText = button.textContent;
                    button.textContent = "Copied!";
                    button.style.backgroundColor = "#28a745";
                    setTimeout(() => {
                        button.textContent = originalText;
                        button.style.backgroundColor = "#007bff";
                    }, 1000);
                })
                .catch((err) => {
                    console.error("Failed to copy query: ", err);
                });
        }

        // Initialize index analysis functionality
        function initializeIndexAnalysis() {
            const indexJsonInput = document.getElementById("indexJsonInput");
            const bucketFilter = document.getElementById("bucketFilter");
            const scopeFilter = document.getElementById("scopeFilter");
            const collectionFilter = document.getElementById("collectionFilter");
            const sortBy = document.getElementById("sortBy");

            // Add event listeners
            if (indexJsonInput)
                indexJsonInput.addEventListener("input", parseIndexJSON);
            if (bucketFilter) {
                bucketFilter.addEventListener("change", () => {
                    // Reset scope and collection when bucket changes
                    document.getElementById("scopeFilter").value = "(ALL)";
                    document.getElementById("collectionFilter").value = "(ALL)";
                    updateCascadingDropdowns();
                    applyIndexFilters();
                });
            }
            if (scopeFilter) {
                scopeFilter.addEventListener("change", () => {
                    // Reset collection when scope changes
                    document.getElementById("collectionFilter").value = "(ALL)";
                    updateCascadingDropdowns();
                    applyIndexFilters();
                });
            }
            if (collectionFilter)
                collectionFilter.addEventListener("change", applyIndexFilters);
            if (sortBy) sortBy.addEventListener("change", applyIndexFilters);

            // Add search input event listener with debouncing
            const indexSearch = document.getElementById("indexSearch");
            if (indexSearch) {
                let searchTimeout;
                indexSearch.addEventListener("input", () => {
                    clearTimeout(searchTimeout);
                    searchTimeout = setTimeout(applyIndexFilters, 300); // 300ms debounce
                });
            }

            // Add checkbox event listeners
            const filterCheckboxes = [
                "filter-primary",
                "filter-used",
                "filter-no-replica",
                "filter-never-scanned",
                "filter-exclude-mobile",
            ];

            // Radio buttons for type filter
            const typeRadios = [
                "filter-type-all",
                "filter-type-gsi",
                "filter-type-fts",
            ];
            typeRadios.forEach((id) => {
                const radio = document.getElementById(id);
                if (radio) {
                    radio.addEventListener("change", applyIndexFilters);
                }
            });

            filterCheckboxes.forEach((id) => {
                const checkbox = document.getElementById(id);
                if (checkbox) {
                    checkbox.addEventListener("change", applyIndexFilters);
                }
            });

            Logger.info(TEXT_CONSTANTS.INDEX_ANALYSIS_INITIALIZED);
        }

        document.addEventListener("DOMContentLoaded", function () {
            Logger.info(TEXT_CONSTANTS.INITIALIZING_ANALYZER);
            Logger.info(`📦 Version: ${APP_VERSION} (Updated: ${LAST_UPDATED})`);
            Logger.info(`${TEXT_CONSTANTS.FEATURES}`, getVersionInfo().features.join(", "));

            // Log URL flags status
            const urlParams = new URLSearchParams(window.location.search);
            const flagsStatus = {
                dev: urlParams.get('dev') === 'true',
                debug: urlParams.get('debug') === 'true',
                logLevel: getLogLevel()
            };
            Logger.info(`⚙️ URL Flags: dev=${flagsStatus.dev}, debug=${flagsStatus.debug}, logLevel=${flagsStatus.logLevel}`);

            // Initialize theme from localStorage
            
            // Show Schema Inference feature if dev mode is enabled
            if (isDevMode()) {
                const schemaTab = document.getElementById('schema-inference-tab');
                const schemaInput = document.getElementById('schema-input-section');
                if (schemaTab) schemaTab.style.display = '';
                if (schemaInput) schemaInput.style.display = '';
                Logger.info('🔬 Schema Inference feature enabled (dev mode)');
            }

            // Defer keyboard navigation enhancement (Step 8 - not critical for initial load)
            setTimeout(() => enhanceKeyboardNavigation(), 1000);

            // Initialize tabs with enhanced accessibility
            $("#tabs").tabs({
                activate: function (event, ui) {
                    // Announce tab change to screen readers
                    const tabName = ui.newTab.find("a").text();
                    showToast(`${TEXT_CONSTANTS.SWITCHED_TO} ${tabName}`, "info");
                },
            });

            // Add event listener for system query exclusion checkbox
            const excludeCheckbox = document.getElementById(
                "exclude-system-queries"
            );
            if (excludeCheckbox) {
                excludeCheckbox.addEventListener("change", function () {
                    console.log(`System query exclusion changed to: ${this.checked}`);
                    const jsonInput = document.getElementById("json-input").value;
                    if (jsonInput.trim()) {
                        showFilterReminder();
                    }
                });
            }

            // Add event listeners for date/time filter controls
            const startDateInput = document.getElementById("start-date");
            const endDateInput = document.getElementById("end-date");
            const sqlFilterInput = document.getElementById("sql-statement-filter");
            const elapsedFilterInput = document.getElementById("elapsed-time-filter");

            if (startDateInput) {
                startDateInput.addEventListener("change", function () {
                    console.log(`Start date changed to: ${this.value}`);
                    showFilterReminder();
                });
            }

            if (endDateInput) {
                endDateInput.addEventListener("change", function () {
                    console.log(`End date changed to: ${this.value}`);
                    showFilterReminder();
                });
            }

            if (sqlFilterInput) {
                sqlFilterInput.addEventListener("input", function () {
                    console.log(`SQL filter changed to: ${this.value}`);
                    showFilterReminder();
                });
            }

            const collectionFilterInput = document.getElementById("collection-filter");
            if (collectionFilterInput) {
                collectionFilterInput.addEventListener("change", function () {
                    console.log(`Collection filter changed to: ${this.value}`);
                    showFilterReminder();
                });
            }

            if (elapsedFilterInput) {
                elapsedFilterInput.addEventListener("input", function () {
                    console.log(`Elapsed filter changed to: ${this.value}`);
                    showFilterReminder();
                });
            }

            Logger.info(TEXT_CONSTANTS.ANALYZER_INITIALIZED);

            // Setup JSON file upload handlers
            (function setupUploadInputs() {
                try {
                    const setButtonLabels = () => {
                        const btn1 = document.getElementById('upload-completed-btn');
                        const btn2 = document.getElementById('upload-indexes-btn');
                        const btn3 = document.getElementById('upload-schema-btn');
                        if (btn1) btn1.textContent = (window.TEXT_CONSTANTS && TEXT_CONSTANTS.UPLOAD_JSON) || 'Upload .json';
                        if (btn2) btn2.textContent = (window.TEXT_CONSTANTS && TEXT_CONSTANTS.UPLOAD_JSON) || 'Upload .json';
                        if (btn3) btn3.textContent = (window.TEXT_CONSTANTS && TEXT_CONSTANTS.UPLOAD_JSON) || 'Upload .json';
                        const orTxt = (window.TEXT_CONSTANTS && (TEXT_CONSTANTS.OR_LABEL || 'OR')) || 'OR';
                        const or1 = document.getElementById('or-label-1');
                        const or2 = document.getElementById('or-label-2');
                        const or3 = document.getElementById('or-label-3');
                        if (or1) or1.textContent = orTxt;
                        if (or2) or2.textContent = orTxt;
                        if (or3) or3.textContent = orTxt;
                        const completedHeader = document.getElementById('completed-section-title');
                        const indexesHeader = document.getElementById('indexes-section-title');
                        if (completedHeader) completedHeader.textContent = (window.TEXT_CONSTANTS && TEXT_CONSTANTS.COMPLETED_JSON_HEADER) || 'Completed Requests JSON (system:completed_requests)';
                        if (indexesHeader) indexesHeader.textContent = (window.TEXT_CONSTANTS && TEXT_CONSTANTS.INDEXES_JSON_HEADER) || 'Indexes JSON (system:indexes output)';
                    };
                    setButtonLabels();

                    const jsonTextarea = document.getElementById('json-input');
                    const indexTextarea = document.getElementById('indexJsonInput');
                    const schemaTextarea = document.getElementById('schemaJsonInput');

                    const completedInput = document.getElementById('completed-requests-file');
                    const completedBtn = document.getElementById('upload-completed-btn');
                    const completedName = document.getElementById('completed-file-name');

                    const indexesInput = document.getElementById('indexes-file');
                    const indexesBtn = document.getElementById('upload-indexes-btn');
                    const indexesName = document.getElementById('indexes-file-name');

                    const schemaInput = document.getElementById('schema-file');
                    const schemaBtn = document.getElementById('upload-schema-btn');
                    const schemaName = document.getElementById('schema-file-name');

                    // In-memory upload buffers to avoid populating textareas
                    window._uploadedCompletedJsonRaw = window._uploadedCompletedJsonRaw || '';
                    window._uploadedIndexesJsonRaw = window._uploadedIndexesJsonRaw || '';
                    window._uploadedSchemaJsonRaw = window._uploadedSchemaJsonRaw || '';

                    const readJsonFile = (file, onLoad, onError) => {
                        if (!file) return;
                        const name = file.name || '';
                        if (!/\.json$/i.test(name)) {
                            showToast((window.TEXT_CONSTANTS && TEXT_CONSTANTS.INVALID_FILE_TYPE) || 'Please select a .json file', 'warning');
                            return;
                        }
                        const reader = new FileReader();
                        reader.onload = () => { try { onLoad(reader.result); } catch (e) { /* no-op */ } };
                        reader.onerror = () => {
                            showToast((window.TEXT_CONSTANTS && TEXT_CONSTANTS.FILE_READ_ERROR) || 'Error reading file', 'error');
                            if (typeof onError === 'function') onError();
                        };
                        reader.readAsText(file);
                    };

                    if (completedBtn && completedInput) {
                        completedBtn.addEventListener('click', () => completedInput.click());
                        completedInput.addEventListener('change', function () {
                            const file = this.files && this.files[0];
                            if (!file) return;
                            readJsonFile(
                                file,
                                (text) => {
                                    // Store uploaded JSON in memory; do NOT populate textarea to keep DOM light
                                    window._uploadedCompletedJsonRaw = text || '';
                                    if (completedName) completedName.textContent = file.name || '';
                                    // Auto-run parse on successful upload
                                    if (typeof parseJSON === 'function') {
                                        try { setTimeout(() => parseJSON(), 0); } catch (e) { /* no-op */ }
                                    }
                                },
                                () => {
                                    this.value = '';
                                    if (completedName) completedName.textContent = '';
                                }
                            );
                        });
                    }

                    if (indexesBtn && indexesInput) {
                        indexesBtn.addEventListener('click', () => indexesInput.click());
                        indexesInput.addEventListener('change', function () {
                            const file = this.files && this.files[0];
                            if (!file) return;
                            readJsonFile(
                                file,
                                (text) => {
                                    // Store uploaded JSON in memory; do NOT populate textarea to keep DOM light
                                    window._uploadedIndexesJsonRaw = text || '';
                                    // Parse immediately using in-memory data
                                    if (typeof parseIndexJSON === 'function') {
                                        try { parseIndexJSON(); } catch (e) { /* no-op */ }
                                    }
                                    if (indexesName) indexesName.textContent = file.name || '';
                                },
                                () => {
                                    this.value = '';
                                    if (indexesName) indexesName.textContent = '';
                                }
                            );
                        });
                    }

                    if (schemaBtn && schemaInput) {
                        schemaBtn.addEventListener('click', () => schemaInput.click());
                        schemaInput.addEventListener('change', function () {
                            const file = this.files && this.files[0];
                            if (!file) return;
                            readJsonFile(
                                file,
                                (text) => {
                                    // Store uploaded JSON in memory
                                    window._uploadedSchemaJsonRaw = text || '';
                                    // Auto-parse the schema
                                    if (typeof parseSchemaInference === 'function') {
                                        try { parseSchemaInference(); } catch (e) { /* no-op */ }
                                    }
                                    if (schemaName) schemaName.textContent = file.name || '';
                                    // Switch to Schema Inference tab
                                    const tabs = $('#tabs');
                                    if (tabs && tabs.tabs) {
                                        try { tabs.tabs('option', 'active', 6); } catch (e) { /* no-op */ }
                                    }
                                },
                                () => {
                                    this.value = '';
                                    if (schemaName) schemaName.textContent = '';
                                }
                            );
                        });
                    }

                    if (jsonTextarea) {
                        jsonTextarea.addEventListener('paste', () => {
                            const fi = completedInput;
                            if (fi && fi.value) {
                                fi.value = '';
                                if (completedName) completedName.textContent = '';
                            }
                            // Clear in-memory upload to give paste precedence
                            if (window._uploadedCompletedJsonRaw) {
                                window._uploadedCompletedJsonRaw = '';
                                showToast((window.TEXT_CONSTANTS && TEXT_CONSTANTS.PASTE_OVERRIDES_UPLOAD) || 'Pasted JSON overrides uploaded file; cleared file selection', 'info');
                            }
                            // Auto-run parse after paste completes
                            if (typeof parseJSON === 'function') {
                                try { setTimeout(() => parseJSON(), 0); } catch (e) { /* no-op */ }
                            }
                        });
                    }
                    if (indexTextarea) {
                        indexTextarea.addEventListener('paste', () => {
                            const fi = indexesInput;
                            if (fi && fi.value) {
                                fi.value = '';
                                if (indexesName) indexesName.textContent = '';
                            }
                            // Clear in-memory upload to give paste precedence
                            if (window._uploadedIndexesJsonRaw) {
                                window._uploadedIndexesJsonRaw = '';
                                showToast((window.TEXT_CONSTANTS && TEXT_CONSTANTS.PASTE_OVERRIDES_UPLOAD) || 'Pasted JSON overrides uploaded file; cleared file selection', 'info');
                            }
                            // Auto-run index parse after paste completes
                            if (typeof parseIndexJSON === 'function') {
                                try { setTimeout(() => parseIndexJSON(), 0); } catch (e) { /* no-op */ }
                            }
                        });
                    }
                    if (schemaTextarea) {
                        schemaTextarea.addEventListener('paste', () => {
                            const fi = schemaInput;
                            if (fi && fi.value) {
                                fi.value = '';
                                if (schemaName) schemaName.textContent = '';
                            }
                            // Clear in-memory upload to give paste precedence
                            if (window._uploadedSchemaJsonRaw) {
                                window._uploadedSchemaJsonRaw = '';
                                showToast((window.TEXT_CONSTANTS && TEXT_CONSTANTS.PASTE_OVERRIDES_UPLOAD) || 'Pasted JSON overrides uploaded file; cleared file selection', 'info');
                            }
                            // Auto-parse after paste
                            setTimeout(() => {
                                if (typeof parseSchemaInference === 'function') {
                                    try { parseSchemaInference(); } catch (e) { /* no-op */ }
                                }
                            }, 50);
                        });
                    }
                } catch (e) { /* no-op */ }
            })();

            // Initialize index analysis
            initializeIndexAnalysis();

            // Make version info globally accessible
            window.QueryAnalyzer = {
                version: getVersionInfo,
                about: () => {
                    const info = getVersionInfo();
                    console.log(`
🔍 Couchbase Query Analyzer v${info.version}
📅 Last Updated: 2025-10-20${info.lastUpdated}
🎯 Purpose: Analyze Couchbase N1QL query performance from system:completed_requests
                    
🚀 Features:
${info.features.map((f) => `   • ${f}`).join("\n")}

💡 Usage: Type QueryAnalyzer.version() for version info
                    `);
                },
            };

            Logger.info(TEXT_CONSTANTS.TIP_ABOUT);
        });

        // =====================
        // Report Maker (Phase 1)
        // =====================
        let reportModeActive = false;
        let savedTimelineDisplay = null; // Map<Element, string> original inline display values



        function buildTabHighlights(selections) {
            const bullets = [];
            const t = (k, d) => (window.TEXT_CONSTANTS && TEXT_CONSTANTS[k]) ? TEXT_CONSTANTS[k] : d;

            // Dashboard
            if (selections.sections && selections.sections.dashboard) {
                try {
                    const list = Array.isArray(window.everyQueryData) ? window.everyQueryData : [];
                    const total = list.length;
                    const prim = list.filter(r => r["Primary Scan Used"] === 'Yes').length;
                    const fatal = list.filter(r => (r.state || '').toLowerCase() === 'fatal').length;
                    const stCounts = {};
                    list.forEach(r => { const k = (r.statementType || '').toString(); stCounts[k] = (stCounts[k]||0)+1; });
                    const topTypes = Object.entries(stCounts).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k,v])=>`${k} (${v})`).join(', ');
                    bullets.push(`<h4>Dashboard</h4><ul>
                        <li>Primary index usage: ${total?Math.round((prim/total)*100):0}% (${prim}/${total})</li>
                        <li>Fatal rate: ${total?Math.round((fatal/total)*100):0}% (${fatal}/${total})</li>
                        <li>Top statement types: ${topTypes || '-'}</li>
                    </ul>`);
                } catch(e){}
            }

            // Timeline
            if (selections.sections && selections.sections.timeline) {
                try {
                    const reqs = Array.isArray(window.originalRequests) ? window.originalRequests : [];
                    let minT, maxT; 
                    reqs.forEach(r => { const d = new Date(r.requestTime); if (!isNaN(d)) { if (!minT||d<minT) minT=d; if (!maxT||d>maxT) maxT=d; }});
                    const spanHrs = (minT&&maxT)? Math.round((maxT-minT)/(1000*60*60)) : 0;
                    const unit = reqs.length ? getOptimalTimeUnit(reqs) : 'minute';
                    bullets.push(`<h4>Timeline</h4><ul>
                        <li>Span: ${spanHrs} hours${spanHrs>=24?` (~${Math.round(spanHrs/24)} days)`:''}</li>
                        <li>Grouping: ${unit}</li>
                    </ul>`);
                } catch(e){}
            }

            // Query Groups
            if (selections.sections && selections.sections.analysis) {
                try {
                    const groups = Array.isArray(window.analysisData) ? window.analysisData : [];
                    const count = groups.length;
                    let slow = null;
                    groups.forEach(g => { const ref = g.groupRef; if (ref && !isNaN(ref.avg_duration_in_seconds)) { if (!slow || ref.avg_duration_in_seconds > slow.avg) slow = { avg: ref.avg_duration_in_seconds, stmt: ref.normalized_statement }; }});
                    bullets.push(`<h4>Query Groups</h4><ul>
                        <li>Total groups: ${count}</li>
                        <li>Slowest avg duration: ${slow ? formatTime(slow.avg*1000) : 'N/A'}</li>
                    </ul>`);
                } catch(e){}
            }

            // Every Query
            if (selections.sections && selections.sections["every-query"]) {
                try {
                    const list = Array.isArray(window.everyQueryData) ? window.everyQueryData : [];
                    let longest = null;
                    list.forEach(r => { const ms = parseTime(r.request?.elapsedTime || r.elapsedTime); if (!isNaN(ms)) { if (!longest || ms > longest.ms) longest = { ms, stmt: r.request?.statement || r.statement }; }});
                    bullets.push(`<h4>Every Query</h4><ul>
                        <li>Longest elapsed: ${longest ? formatTime(longest.ms) : 'N/A'}</li>
                    </ul>`);
                } catch(e){}
            }

            // Index/Query Flow
            if (selections.sections && selections.sections["index-query-flow"]) {
                bullets.push(`<h4>Index/Query Flow</h4><ul>
                    <li>Visual map of queries and indexes. Use this to spot overused primary scans and heavy fetch paths.</li>
                </ul>`);
            }

            // Indexes
            if (selections.sections && selections.sections.indexes) {
                try {
                    const ix = (document.getElementById('stat-indexes')||{}).textContent || '0';
                    const prim = (document.getElementById('stat-primary')||{}).textContent || '0';
                    const never = (document.getElementById('stat-never-scanned')||{}).textContent || '0';
                    bullets.push(`<h4>Indexes</h4><ul>
                        <li>Total indexes: ${ix}</li>
                        <li>Primary indexes: ${prim}</li>
                        <li>Never scanned: ${never}</li>
                    </ul>`);
                } catch(e){}
            }

            return bullets.join('');
        }

        function buildCoverDetailedSections(selections) {
            const t = (k, d) => (window.TEXT_CONSTANTS && TEXT_CONSTANTS[k]) ? TEXT_CONSTANTS[k] : d;
            let html = '';
            try {
                if (selections.sections && selections.sections.dashboard) {
                    html += `
                    <div class="section cover-card">
                      <h3 class="emoji-title">📊 <span>Dashboard</span></h3>
                      <p class="muted">High-level overview with draggable charts showing query duration distribution, index type usage, scan consistency patterns, result size analysis, and system health metrics. Perfect for at-a-glance performance monitoring.</p>
                    </div>`;
                }
                if (selections.sections && selections.sections.insights) {
                    html += `
                    <div class="section cover-card">
                      <h3 class="emoji-title">💡 <span>Insights Tab</span></h3>
                      <p class="muted">The Insights tab provides automated analysis organized into three main categories, each with expandable insights and live metrics based on your parsed query data:</p>
                      <div class="cover-grid">
                        <div>
                          <h4>📊 Analysis Categories</h4>
                          <h5>🔍 Index Performance Issues</h5>
                          <ul class="list-tight">
                            <li>Inefficient Index Scans - Identifies queries with poor selectivity ratios</li>
                            <li>Slow Index Scan Times - Flags indexes taking 2+ seconds to scan</li>
                            <li>Primary Index Over-Usage - Detects reliance on expensive primary indexes</li>
                            <li>ORDER BY / LIMIT / OFFSET Index Over-Scan - Highlights over-scanning due to pagination patterns <span class="badge beta">BETA</span></li>
                          </ul>
                          <h5>⚡ Resource Utilization Issues</h5>
                          <ul class="list-tight">
                            <li>High Kernel Time in Queries - CPU scheduling overhead analysis</li>
                            <li>High Memory Usage Detected - Memory-intensive query identification</li>
                            <li>Slow Parse/Plan Times - Detects queries with parse/plan times > 1ms <span class="badge beta">BETA</span></li>
                            <li>Slow USE KEY Queries - KV service bottleneck detection</li>
                          </ul>
                        </div>
                        <div>
                          <h5>🔄 Query Pattern Analysis</h5>
                          <ul class="list-tight">
                            <li>Missing WHERE Clauses - Identifies full collection scans</li>
                            <li>Inefficient LIKE Operations - Detects leading wildcard usage</li>
                            <li>SELECT * Usage - Finds queries returning entire documents <span class="badge live">LIVE</span></li>
                          </ul>
                          <h5>🚀 Performance Optimization Opportunities</h5>
                          <ul class="list-tight">
                            <li>Large Payload Streaming - Identifies queries with heavy network usage</li>
                            <li>Large Result Set Queries - Flags memory and bandwidth intensive operations</li>
                            <li>Timeout-Prone Queries - Detects queries approaching timeout limits</li>
                          </ul>
                        </div>
                      </div>
                      <div class="callout" style="margin-top:10px;">
                        <strong>Live Data:</strong> Insights marked with <span class="badge live">LIVE</span> analyze your actual parsed data, while <span class="badge beta">BETA</span> insights are experimental and may show false positives.
                      </div>
                    </div>`;
                }
                if (selections.sections && selections.sections.timeline) {
                    // Build selected timeline charts list
                    const selectedCharts = Object.entries(selections.timelineCharts || {})
                        .filter(([, v]) => v)
                        .map(([k]) => k);
                    let chartsHtml = '<li>-</li>';
                    try {
                        if (selectedCharts.length) {
                            const container = document.getElementById('report-timeline-charts');
                            const items = [];
                            selectedCharts.forEach(id => {
                                let labelText = id;
                                const input = container ? container.querySelector(`input[data-chart-id="${id}"]`) : null;
                                const label = input ? input.closest('label') : null;
                                if (label) labelText = label.textContent.trim();
                                items.push(`<li>${labelText}</li>`);
                            });
                            chartsHtml = items.join('');
                        }
                    } catch (e) {}
                    html += `
                        <div class="section cover-card">
                          <h3 class="emoji-title">⏰ <span>Timeline</span></h3>
                          <p class="muted">Chronological analysis with zoomable time-series charts. Track query patterns by time grouping (seconds to days), analyze duration buckets, operation types, result counts, and memory usage trends over time with dual Y-axis support.</p>
                          <h4 style="margin-top:10px;">Timeline charts</h4>
                          <ul>${chartsHtml}</ul>
                        </div>
                    `;
                }
                if (selections.sections && selections.sections.analysis) {
                    html += `
                    <div class="section cover-card">
                      <h3 class="emoji-title">🔍 <span>Query Groups</span></h3>
                      <p class="muted">Analyze similar queries grouped by normalized patterns. Compare aggregated statistics, identify frequently executed query types, and optimize query families that share similar execution characteristics and performance profiles.</p>
                    </div>`;
                }
                if (selections.sections && selections.sections['every-query']) {
                    html += `
                    <div class="section cover-card">
                      <h3 class="emoji-title">📋 <span>Every Query</span></h3>
                      <p class="muted">Detailed tabular view of individual query executions with sorting, filtering, and search capabilities. Drill down into specific query metrics, execution plans, and performance details for granular analysis and debugging.</p>
                    </div>`;
                }
                if (selections.sections && selections.sections['index-query-flow']) {
                    html += `
                    <div class="section cover-card">
                      <h3 class="emoji-title">🌊 <span>Index/Query Flow</span></h3>
                      <p class="muted">Interactive visual flow diagram showing the relationship between indexes and queries. See which indexes are used by which queries, identify index usage patterns, and optimize index coverage with drag-and-pan visualization.</p>
                    </div>`;
                }
                if (selections.sections && selections.sections.indexes) {
                    html += `
                    <div class="section cover-card">
                      <h3 class="emoji-title">🗂️ <span>Indexes</span></h3>
                      <p class="muted">Comprehensive index management with filtering by bucket/scope/collection. Analyze index performance metrics, memory residency, scan times, and usage patterns. Includes search and sorting capabilities for large index inventories.</p>
                    </div>`;
                }
            } catch (e) { /* ignore */ }
            return html;
        }



        function flattenScrollableAreas(enable) {
            const selectors = [
                '#table-section', '#analysis-table-section', '#table-container', '#analysis-table-container', '.table-scroll', '.overflow-auto'
            ];
            selectors.forEach(sel => {
                document.querySelectorAll(sel).forEach(el => {
                    if (enable) el.classList.add('print-unclamp'); else el.classList.remove('print-unclamp');
                });
            });
        }

        function replaceChartsWithImages(enable) {
            const selectedPanels = document.querySelectorAll('.report-visible');
            const canvases = [];
            selectedPanels.forEach(panel => {
                panel.querySelectorAll('canvas').forEach(cv => canvases.push(cv));
            });

            if (enable) {
                canvases.forEach(canvas => {
                    // Skip if already replaced
                    if (canvas.dataset.replaced === '1') return;
                    try {
                        const ratio = window.devicePixelRatio || 1;
                        const url = canvas.toDataURL('image/png');
                        const img = document.createElement('img');
                        img.className = 'chart-print-img';
                        img.src = url;
                        img.dataset.replaceId = canvas.id || '';
                        canvas.style.display = 'none';
                        canvas.dataset.replaced = '1';
                        canvas.parentElement.insertBefore(img, canvas.nextSibling);
                    } catch (e) { /* ignore */ }
                });
            } else {
                document.querySelectorAll('.chart-print-img').forEach(img => {
                    const canvasId = img.dataset.replaceId;
                    const canvas = canvasId ? document.getElementById(canvasId) : null;
                    if (canvas) {
                        canvas.style.display = '';
                        delete canvas.dataset.replaced;
                    }
                    img.remove();
                });
            }
        }





        function setSearchControlsVisibility(hide) {
            ['analysis-search-controls', 'search-controls'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.display = hide ? 'none' : '';
            });
        }

        function addPageBreaksForSelectedPanels() {
            // Remove existing auto breaks (keep cover break)
            document.querySelectorAll('.page-break.auto').forEach(el => el.remove());
            const panels = Array.from(document.querySelectorAll('[data-report-section].report-visible'));
            panels.forEach((panel, idx) => {
                if (idx === 0) return;
                const br = document.createElement('div');
                br.className = 'page-break auto';
                panel.insertAdjacentElement('beforebegin', br);
            });
        }



        async function loadTestSample() {
            try {
                const res = await fetch('sample/test_system_completed_requests.json');
                const json = await res.text();
                const textarea = document.getElementById('json-input');
                textarea.value = json;
                parseJSON();
                showToast(TEXT_CONSTANTS.COPIED_CLIPBOARD || 'Loaded');
            } catch (e) {
                console.error('Failed to load sample JSON', e);
                showToast('Failed to load sample JSON', 'error');
            }
        }

        // Wire up Report Maker buttons on DOMContentLoaded
        // ============================================================
        // LAZY REPORT MAKER INITIALIZATION (Step 8)
        // Only initialize Report Maker when tab is first accessed
        // ============================================================
        let reportMakerInitialized = false;


        // Initialize essential UI on page load (Step 8)
        document.addEventListener('DOMContentLoaded', () => {
            // No dev-only charts to hide (all removed)
            
            // Setup lazy Report Maker initialization
            $('#tabs').on('tabsactivate', function(event, ui) {
                const tabId = ui.newPanel.attr('id');
                if (tabId === 'report-maker') {
                    initializeReportMaker();
                }
            });

            // Initialize input toggle tab (must run immediately, not deferred)
            const t = (k, d) => (window.TEXT_CONSTANTS && TEXT_CONSTANTS[k]) ? TEXT_CONSTANTS[k] : d;
            
            try {
                // Inject minimal CSS for the toggle tab
                const css = `
                .toggle-input-tab { position: fixed; left: 2px; top: 2px; z-index: 10001; color: #fff; border: 1px solid rgba(255,255,255,0.9); border-radius: 4px; width: auto; min-width: 165px; height: 32px; padding: 6px 12px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; line-height: 1; letter-spacing: 0; gap: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.2); cursor: pointer; white-space: nowrap; }
                .toggle-input-tab::before { content: ''; position: absolute; top: -10px; left: -10px; right: -10px; bottom: -10px; }
                .toggle-input-tab.showing { background: #007bff; }
                .toggle-input-tab.showing:hover { background: #0056b3; }
                .toggle-input-tab.hidden { background: #28a745; }
                .toggle-input-tab.hidden:hover { background: #1e7e34; }
                #input-section { padding-top: 30px; }
                .toggle-input-tooltip { position: fixed; left: 35px; top: 5px; z-index: 10002; background: #343a40; color: #fff; padding: 8px 12px; border-radius: 6px; font-size: 13px; font-weight: 600; white-space: nowrap; box-shadow: 0 4px 12px rgba(0,0,0,0.3); opacity: 0; pointer-events: none; transition: opacity 0.2s ease-in-out; display: none; }
                .toggle-input-tooltip.visible { opacity: 0; display: none; }
                .toggle-input-tooltip::before { content: ''; position: absolute; left: -6px; top: 50%; transform: translateY(-50%); border: 6px solid transparent; border-right-color: #343a40; }
                .help-fixed-badge { position: fixed; right: 6px; top: 6px; z-index: 9998; background: #f1f3f5; color: #343a40; border: 1px solid #dee2e6; border-radius: 14px; padding: 4px 10px; font-size: 11px; font-weight: 700; box-shadow: 0 1px 6px rgba(0,0,0,0.12); }
                .help-fixed-badge a { color: #007bff; text-decoration: none; }
                .help-fixed-badge a:hover { text-decoration: underline; }
                .queries-fixed-badge { position: fixed; top: 6px; left: 50%; transform: translateX(-50%); z-index: 9997; background: #f8f9fa; color: #343a40; border: 1px solid #dee2e6; border-radius: 14px; padding: 4px 12px; font-size: 11px; font-weight: 600; box-shadow: 0 1px 6px rgba(0,0,0,0.08); pointer-events: none; }
                @media print { .toggle-input-tab, .toggle-input-tooltip { display: none !important; } .help-fixed-badge, .queries-fixed-badge { display: none !important; } }
                /* Fade-up animation helpers for input panel */
                #input-section.input-anim { transition: opacity 320ms cubic-bezier(0.22, 1, 0.36, 1), transform 320ms cubic-bezier(0.22, 1, 0.36, 1); will-change: opacity, transform; }
                #input-section.fade-up-hidden { opacity: 0; transform: translateY(-12px); }
                `;
                const styleEl = document.createElement('style');
                styleEl.textContent = css;
                document.head.appendChild(styleEl);

                // Create the toggle tab if not present
                let tab = document.getElementById('toggle-input-tab');
                if (!tab) {
                    tab = document.createElement('button');
                    tab.id = 'toggle-input-tab';
                    tab.type = 'button';
                    tab.className = 'toggle-input-tab';
                    tab.setAttribute('aria-controls', 'input-section');
                    tab.setAttribute('aria-expanded', 'false');
                    tab.title = t('TOGGLE_INPUT_TOOLTIP', 'Click to Show/Hide Data & Filters');
                    tab.textContent = '▼ ' + t('SHOW_INPUT_PANEL', 'Show Data & Filters');
                    tab.addEventListener('click', toggleInputSection);
                    document.body.appendChild(tab);
                }
                
                // Create custom tooltip for toggle button
                let tooltip = document.getElementById('toggle-input-tooltip');
                if (!tooltip) {
                    tooltip = document.createElement('div');
                    tooltip.id = 'toggle-input-tooltip';
                    tooltip.className = 'toggle-input-tooltip';
                    tooltip.textContent = t('TOGGLE_INPUT_TOOLTIP', 'Click to Show/Hide Data & Filters');
                    document.body.appendChild(tooltip);
                }
                
                // Add hover handlers to show/hide custom tooltip
                tab.addEventListener('mouseenter', () => {
                    const tooltip = document.getElementById('toggle-input-tooltip');
                    if (tooltip) tooltip.classList.add('visible');
                });
                tab.addEventListener('mouseleave', () => {
                    const tooltip = document.getElementById('toggle-input-tooltip');
                    if (tooltip) tooltip.classList.remove('visible');
                });
                
                // Ensure initial label matches current state (input is visible at load)
                const hideLabel = t('HIDE_INPUT_PANEL', 'Hide Data & Filters');
                tab.textContent = '▲ ' + hideLabel;
                tab.title = t('TOGGLE_INPUT_TOOLTIP', 'Click to Show/Hide Data & Filters');
                tab.setAttribute('aria-expanded', 'true');
                tab.classList.remove('hidden');
                tab.classList.add('showing');

                // Create fixed help badge (always visible top-right)
                let help = document.getElementById('help-fixed-badge');
                if (!help) {
                    help = document.createElement('div');
                    help.id = 'help-fixed-badge';
                    help.className = 'help-fixed-badge';
                    const helpText = t('HELP_DEBUG_TIPS', 'NEED HELP? Debugging + Tool Tips — Click Here');
                    help.innerHTML = `<a href="https://cb.fuj.io/analysis_hub#introduction" target="_blank" rel="noopener">${helpText}</a>`;
                    document.body.appendChild(help);
                }

                // Create fixed queries count badge (center top)
                let qbadge = document.getElementById('queries-fixed-badge');
                if (!qbadge) {
                    qbadge = document.createElement('div');
                    qbadge.id = 'queries-fixed-badge';
                    qbadge.className = 'queries-fixed-badge';
                    qbadge.innerHTML = 'Showing all <strong>0</strong> queries';
                    document.body.appendChild(qbadge);
                }
            } catch (e) {
                console.warn('Failed to initialize input toggle tab', e);
            }
        });
        // Chart Expand/Collapse Functionality (Issue #139)
        (function() {
            const overlay = document.getElementById('chart-fullscreen-overlay');
            const fullscreenCanvas = document.getElementById('fullscreen-chart-canvas');
            const collapseBtn = overlay.querySelector('.chart-collapse-btn');
            const resetZoomBtn = overlay.querySelector('.chart-reset-zoom-btn');
            let fullscreenChart = null;
            let originalChart = null;

            // Function to expand chart
            function expandChart(chartContainer) {
                const canvas = chartContainer.querySelector('canvas');
                if (!canvas || !canvas.id) return;

                // Get the original Chart.js instance
                originalChart = Chart.getChart(canvas);
                if (!originalChart) return;

                // Show overlay
                overlay.classList.add('active');
                document.body.style.overflow = 'hidden';

                // Clone chart configuration
                const config = {
                    type: originalChart.config.type,
                    data: JSON.parse(JSON.stringify(originalChart.config.data)),
                    options: JSON.parse(JSON.stringify(originalChart.config.options)),
                    plugins: originalChart.config.plugins || []
                };
                
                // Preserve tooltip callbacks (they don't survive JSON serialization)
                if (originalChart.config.options?.plugins?.tooltip?.callbacks) {
                    if (!config.options.plugins) config.options.plugins = {};
                    if (!config.options.plugins.tooltip) config.options.plugins.tooltip = {};
                    config.options.plugins.tooltip.callbacks = originalChart.config.options.plugins.tooltip.callbacks;
                }

                // Create fullscreen chart
                setTimeout(() => {
                    fullscreenChart = new Chart(fullscreenCanvas, config);
                }, 100);
            }

            // Function to collapse chart
            function collapseChart() {
                // Destroy fullscreen chart
                if (fullscreenChart) {
                    fullscreenChart.destroy();
                    fullscreenChart = null;
                }

                // Hide overlay
                overlay.classList.remove('active');
                document.body.style.overflow = '';
                originalChart = null;
            }

            // Function to reset zoom on fullscreen chart
            function resetZoom() {
                if (fullscreenChart) {
                    fullscreenChart.resetZoom();
                }
            }

            // Attach expand listeners to all expand buttons
            document.addEventListener('click', function(e) {
                if (e.target.classList.contains('chart-expand-btn')) {
                    const chartContainer = e.target.closest('.chart-container');
                    if (chartContainer) {
                        expandChart(chartContainer);
                    }
                }
            });

            // Collapse button click
            collapseBtn.addEventListener('click', collapseChart);

            // Reset zoom button click
            resetZoomBtn.addEventListener('click', resetZoom);

            // Close on overlay background click
            overlay.addEventListener('click', function(e) {
                if (e.target === overlay) {
                    collapseChart();
                }
            });

            // Close on Escape key
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && overlay.classList.contains('active')) {
                    collapseChart();
                }
            });
        })();

        // Schema Inference Tab Functions (Issue #212)
        let schemaDataStore = {}; // Store schema data by path for detail view
        
        
        function renderSchemaTree(tree, container) {
            let html = '';
            
            Object.keys(tree).sort().forEach(bucket => {
            const bucketId = `bucket-${bucket.replace(/[^a-zA-Z0-9]/g, '-')}`;
            const scopes = tree[bucket];
            const scopeCount = Object.keys(scopes).length;
            
            html += `<div class="schema-tree-node">`;
            html += `<div class="schema-tree-item" onclick="event.stopPropagation(); toggleSchemaNode('${bucketId}')">`;
            html += `<span class="schema-tree-toggle" id="${bucketId}-toggle">▶</span>`;
            html += `<span class="schema-tree-icon" onclick="event.stopPropagation(); selectBucket('${DOMPurify.sanitize(bucket)}', '${bucketId}')" style="cursor: pointer;" title="Click to view aggregate analysis">📦</span>`;
            html += `<span onclick="event.stopPropagation(); selectBucket('${DOMPurify.sanitize(bucket)}', '${bucketId}')" style="cursor: pointer;">${DOMPurify.sanitize(bucket)}</span>`;
            html += `<span class="schema-badge">${scopeCount} scope${scopeCount !== 1 ? 's' : ''}</span>`;
            html += `</div>`;
                html += `<div class="schema-tree-children collapsed" id="${bucketId}-children">`;
                
                Object.keys(scopes).sort().forEach(scope => {
                    const scopeId = `scope-${bucket}-${scope}`.replace(/[^a-zA-Z0-9-]/g, '-');
                    const collections = scopes[scope];
                    const collCount = Object.keys(collections).length;
                    
                    html += `<div class="schema-tree-node">`;
                    html += `<div class="schema-tree-item" onclick="event.stopPropagation(); toggleSchemaNode('${scopeId}')">`;
                    html += `<span class="schema-tree-toggle" id="${scopeId}-toggle">▶</span>`;
                    html += `<span class="schema-tree-icon" onclick="event.stopPropagation(); selectScope('${DOMPurify.sanitize(bucket)}', '${DOMPurify.sanitize(scope)}', '${scopeId}')" style="cursor: pointer;" title="Click to view aggregate analysis">📁</span>`;
                    html += `<span onclick="event.stopPropagation(); selectScope('${DOMPurify.sanitize(bucket)}', '${DOMPurify.sanitize(scope)}', '${scopeId}')" style="cursor: pointer;">${DOMPurify.sanitize(scope)}</span>`;
                    html += `<span class="schema-badge">${collCount} coll${collCount !== 1 ? 's' : ''}</span>`;
                    html += `</div>`;
                    html += `<div class="schema-tree-children collapsed" id="${scopeId}-children">`;
                    
                    Object.keys(collections).sort().forEach(collection => {
                        const collId = `coll-${bucket}-${scope}-${collection}`.replace(/[^a-zA-Z0-9-]/g, '-');
                        const schemas = collections[collection];
                        
                        html += `<div class="schema-tree-node">`;
                        html += `<div class="schema-tree-item" onclick="event.stopPropagation(); toggleSchemaNode('${collId}')">`;
                        html += `<span class="schema-tree-toggle" id="${collId}-toggle">▶</span>`;
                        html += `<span class="schema-tree-icon" onclick="event.stopPropagation(); selectCollection('${DOMPurify.sanitize(bucket)}', '${DOMPurify.sanitize(scope)}', '${DOMPurify.sanitize(collection)}', '${collId}')" style="cursor: pointer;" title="Click to view aggregate analysis">📄</span>`;
                        html += `<span onclick="event.stopPropagation(); selectCollection('${DOMPurify.sanitize(bucket)}', '${DOMPurify.sanitize(scope)}', '${DOMPurify.sanitize(collection)}', '${collId}')" style="cursor: pointer;">${DOMPurify.sanitize(collection)}</span>`;
                        html += `<span class="schema-badge">${schemas.length} schema${schemas.length !== 1 ? 's' : ''}</span>`;
                        html += `</div>`;
                        html += `<div class="schema-tree-children collapsed" id="${collId}-children">`;
                        
                        schemas.forEach(schema => {
                            const schemaEscId = schema.id.replace(/[^a-zA-Z0-9-]/g, '-');
                            html += `<div class="schema-tree-item" onclick="selectSchema('${DOMPurify.sanitize(schema.id)}', '${schemaEscId}')" id="item-${schemaEscId}">`;
                            html += `<span class="schema-tree-icon">🔷</span>`;
                            html += `<span>${DOMPurify.sanitize(schema.name)}</span>`;
                            html += `<span class="schema-badge">${schema.docCount} docs</span>`;
                            html += `</div>`;
                        });
                        
                        html += `</div></div>`;
                    });
                    
                    html += `</div></div>`;
                });
                
                html += `</div></div>`;
            });
            
            container.innerHTML = html || '<p style="color: #6c757d; font-size: 12px;">No schema data available</p>';
        }
        
        function toggleSchemaNode(nodeId) {
            const children = document.getElementById(`${nodeId}-children`);
            const toggle = document.getElementById(`${nodeId}-toggle`);
            if (children && toggle) {
                if (children.classList.contains('collapsed')) {
                    children.classList.remove('collapsed');
                    toggle.textContent = '▼';
                } else {
                    children.classList.add('collapsed');
                    toggle.textContent = '▶';
                }
            }
        }
        
        function selectBucket(bucket, bucketId) {
            // Remove previous selection
            document.querySelectorAll('.schema-tree-item.selected').forEach(el => el.classList.remove('selected'));
            
            // Get all schemas in this bucket
            const schemas = [];
            Object.keys(schemaDataStore).forEach(schemaId => {
                const data = schemaDataStore[schemaId];
                if (data.bucket === bucket) {
                    schemas.push(data);
                }
            });
            
            displayAggregateAnalysis('Bucket', bucket, schemas, bucketId);
        }
        
        function selectScope(bucket, scope, scopeId) {
            // Remove previous selection
            document.querySelectorAll('.schema-tree-item.selected').forEach(el => el.classList.remove('selected'));
            
            // Get all schemas in this scope
            const schemas = [];
            Object.keys(schemaDataStore).forEach(schemaId => {
                const data = schemaDataStore[schemaId];
                if (data.bucket === bucket && data.scope === scope) {
                    schemas.push(data);
                }
            });
            
            displayAggregateAnalysis('Scope', `${bucket}.${scope}`, schemas, scopeId);
        }
        
        function selectCollection(bucket, scope, collection, collId) {
            // Remove previous selection
            document.querySelectorAll('.schema-tree-item.selected').forEach(el => el.classList.remove('selected'));
            
            // Get all schemas in this collection
            const schemas = [];
            Object.keys(schemaDataStore).forEach(schemaId => {
                const data = schemaDataStore[schemaId];
                if (data.bucket === bucket && data.scope === scope && data.collection === collection) {
                    schemas.push(data);
                }
            });
            
            displayAggregateAnalysis('Collection', `${bucket}.${scope}.${collection}`, schemas, collId);
        }
        
        function displayAggregateAnalysis(level, name, schemas, escapedId) {
            const detailPanel = document.getElementById('schema-detail-panel');
            
            if (schemas.length === 0) {
                detailPanel.innerHTML = '<p style="color: #6c757d; text-align: center; margin-top: 50px;">No schemas found</p>';
                return;
            }
            
            // Aggregate all properties from all schemas
            const aggregatedProperties = {};
            let totalDocs = 0;
            
            schemas.forEach(schemaData => {
                const schema = schemaData.schema;
                const properties = schema.properties || {};
                totalDocs += schema['#docs'] || 0;
                
                Object.entries(properties).forEach(([propName, propData]) => {
                    if (!aggregatedProperties[propName]) {
                        aggregatedProperties[propName] = {
                            types: new Set(),
                            docCounts: [],
                            docPercents: [],
                            allData: []
                        };
                    }
                    
                    const types = Array.isArray(propData.type) ? propData.type : [propData.type];
                    types.forEach(t => aggregatedProperties[propName].types.add(t));
                    aggregatedProperties[propName].allData.push(propData);
                });
            });
            
            // Convert aggregated data to property format
            const properties = {};
            Object.entries(aggregatedProperties).forEach(([propName, data]) => {
                properties[propName] = {
                    type: Array.from(data.types),
                    '#docs': data.allData.map(d => Array.isArray(d['#docs']) ? d['#docs'] : [d['#docs']]).flat(),
                    '%docs': data.allData.map(d => Array.isArray(d['%docs']) ? d['%docs'] : [d['%docs']]).flat()
                };
            });
            
            // Analyze types
            const typeAnalysis = analyzeSchemaTypes(properties);
            
            let html = '';
            html += `<h3 style="margin-top: 0; color: #333; border-bottom: 2px solid #007bff; padding-bottom: 8px;">
                      ${level}: ${DOMPurify.sanitize(name)}
                      <span style="font-size: 12px; color: #0066cc; background: #e7f3ff; 
                                   padding: 2px 8px; border-radius: 4px; font-weight: bold; margin-left: 8px;">
                        AGGREGATE VIEW
                      </span>
                    </h3>`;
            
            html += `<div style="background: #e7f3ff; padding: 12px; border-radius: 4px; margin-bottom: 15px; display: flex; gap: 20px;">`;
            html += `<div><strong>Total Documents:</strong> ${totalDocs}</div>`;
            html += `<div><strong>Schemas:</strong> ${schemas.length}</div>`;
            html += `<div><strong>Unique Properties:</strong> ${Object.keys(properties).length}</div>`;
            html += `</div>`;
            
            // Type Distribution and Inconsistencies Section
            html += `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">`;
            
            // Pie Chart
            html += `<div style="background: white; border: 1px solid #ddd; border-radius: 6px; padding: 15px;">`;
            html += `<h4 style="margin: 0 0 10px 0; color: #495057; font-size: 14px;">Type Distribution</h4>`;
            html += `<div style="height: 250px; position: relative;">`;
            html += `<canvas id="schema-type-chart-${escapedId}"></canvas>`;
            html += `</div>`;
            html += `</div>`;
            
            // Inconsistencies
            html += `<div style="background: white; border: 1px solid #ddd; border-radius: 6px; padding: 15px;">`;
            html += `<h4 style="margin: 0 0 10px 0; color: #495057; font-size: 14px;">Type Consistency</h4>`;
            if (typeAnalysis.inconsistentFields.length > 0) {
                html += `<div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; border-radius: 4px; margin-bottom: 10px;">`;
                html += `<strong style="color: #856404;">⚠️ ${typeAnalysis.inconsistentFields.length} field(s) with mixed types</strong>`;
                html += `</div>`;
                html += `<div style="max-height: 200px; overflow-y: auto; font-size: 12px;">`;
                typeAnalysis.inconsistentFields.forEach(field => {
                    html += `<div style="padding: 6px; margin: 4px 0; background: #ffe6e6; border-radius: 4px; border-left: 3px solid #dc3545;">`;
                    html += `<strong style="color: #dc3545; font-family: monospace;">${DOMPurify.sanitize(field.name)}</strong><br>`;
                    html += `<span style="color: #666; font-size: 11px;">Types: ${field.types.join(' | ')}</span><br>`;
                    html += `<span style="color: #666; font-size: 11px;">Coverage: ${field.coverage}</span>`;
                    if (field.isPotentialDate) {
                        html += `<br><span style="color: #0066cc; font-size: 11px;">📅 Possible date field</span>`;
                    }
                    html += `</div>`;
                });
                html += `</div>`;
            } else {
                html += `<div style="background: #d4edda; border-left: 4px solid #28a745; padding: 10px; border-radius: 4px;">`;
                html += `<strong style="color: #155724;">✓ All fields have consistent types</strong>`;
                html += `</div>`;
            }
            html += `</div>`;
            html += `</div>`;
            
            // Property summary table
            html += '<h4 style="margin-top: 20px; margin-bottom: 10px; color: #495057;">Aggregated Properties</h4>';
            html += '<p style="font-size: 12px; color: #666; margin-bottom: 10px;">Showing all unique properties across ' + schemas.length + ' schema(s)</p>';
            html += '<table style="width: 100%; border-collapse: collapse; font-size: 12px;">';
            html += '<thead><tr style="background: #f8f9fa; border-bottom: 2px solid #dee2e6;">';
            html += '<th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Property</th>';
            html += '<th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Types Found</th>';
            html += '<th style="padding: 8px; text-align: center; border: 1px solid #ddd;">Schemas</th>';
            html += '</tr></thead><tbody>';
            
            Object.entries(properties).sort((a, b) => a[0].localeCompare(b[0])).forEach(([propName, propData]) => {
                const types = Array.isArray(propData.type) ? propData.type : [propData.type];
                const isInconsistent = types.length > 1;
                const dateFieldNames = /date|time|timestamp|created|updated|modified|expires|born|anniversary/i;
                const isPotentialDate = dateFieldNames.test(propName);
                
                const rowStyle = isInconsistent ? 'border-bottom: 1px solid #ddd; background: #ffe6e6;' : 'border-bottom: 1px solid #ddd;';
                const nameColor = isInconsistent ? '#dc3545' : '#0056b3';
                const typeColor = isInconsistent ? '#dc3545' : '#6c757d';
                const warningIcon = isInconsistent ? '⚠️ ' : '';
                const dateIcon = isPotentialDate ? '📅 ' : '';
                
                html += `<tr style="${rowStyle}">`;
                html += `<td style="padding: 8px; border: 1px solid #ddd; font-family: monospace; font-weight: bold; color: ${nameColor};">${warningIcon}${dateIcon}${DOMPurify.sanitize(propName)}</td>`;
                html += `<td style="padding: 8px; border: 1px solid #ddd; font-family: monospace; color: ${typeColor}; font-weight: ${isInconsistent ? 'bold' : 'normal'};">${types.join(' | ')}</td>`;
                html += `<td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${schemas.length}</td>`;
                html += '</tr>';
            });
            
            html += '</tbody></table>';
            
            detailPanel.innerHTML = html;
            
            // Render pie chart
            setTimeout(() => {
                renderSchemaTypeChart(`schema-type-chart-${escapedId}`, typeAnalysis.typeCounts);
            }, 100);
        }
        
        function selectSchema(schemaId, escapedId) {
            // Remove previous selection
            document.querySelectorAll('.schema-tree-item.selected').forEach(el => el.classList.remove('selected'));
            // Add selection to clicked item
            const item = document.getElementById(`item-${escapedId}`);
            if (item) item.classList.add('selected');
            
            // Display schema details
            const data = schemaDataStore[schemaId];
            if (!data) return;
            
            const detailPanel = document.getElementById('schema-detail-panel');
            const schema = data.schema;
            const properties = schema.properties || {};
            const docCount = schema['#docs'] || 0;
            
            let html = '';
            html += `<h3 style="margin-top: 0; color: #333; border-bottom: 2px solid #007bff; padding-bottom: 8px;">
                      ${DOMPurify.sanitize(data.bucket)}.${DOMPurify.sanitize(data.scope)}.${DOMPurify.sanitize(data.collection)}
                      <span style="font-size: 12px; color: ${data.status === 'success' ? '#28a745' : '#dc3545'}; 
                                   background: ${data.status === 'success' ? '#d4edda' : '#f8d7da'}; 
                                   padding: 2px 8px; border-radius: 4px; font-weight: bold; margin-left: 8px;">
                        ${data.status.toUpperCase()}
                      </span>
                    </h3>`;
            
            html += `<div style="background: #f8f9fa; padding: 10px; border-radius: 4px; margin-bottom: 15px; font-size: 12px;">`;
            html += `<strong>Query:</strong> <code style="background: #fff; padding: 2px 6px; border-radius: 3px;">${DOMPurify.sanitize(data.query)}</code>`;
            html += `</div>`;
            
            html += `<div style="background: #e7f3ff; padding: 12px; border-radius: 4px; margin-bottom: 15px; display: flex; gap: 20px;">`;
            html += `<div><strong>Documents:</strong> ${docCount}</div>`;
            html += `<div><strong>Properties:</strong> ${Object.keys(properties).length}</div>`;
            html += `</div>`;
            
            // Analyze data types and inconsistencies
            const typeAnalysis = analyzeSchemaTypes(properties);
            
            // Type Distribution and Inconsistencies Section
            html += `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">`;
            
            // Pie Chart for Type Distribution
            html += `<div style="background: white; border: 1px solid #ddd; border-radius: 6px; padding: 15px;">`;
            html += `<h4 style="margin: 0 0 10px 0; color: #495057; font-size: 14px;">Type Distribution</h4>`;
            html += `<div style="height: 250px; position: relative;">`;
            html += `<canvas id="schema-type-chart-${escapedId}"></canvas>`;
            html += `</div>`;
            html += `</div>`;
            
            // Inconsistent Types Warning Box
            html += `<div style="background: white; border: 1px solid #ddd; border-radius: 6px; padding: 15px;">`;
            html += `<h4 style="margin: 0 0 10px 0; color: #495057; font-size: 14px;">Type Consistency</h4>`;
            if (typeAnalysis.inconsistentFields.length > 0) {
                html += `<div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; border-radius: 4px; margin-bottom: 10px;">`;
                html += `<strong style="color: #856404;">⚠️ ${typeAnalysis.inconsistentFields.length} field(s) with mixed types</strong>`;
                html += `</div>`;
                html += `<div style="max-height: 200px; overflow-y: auto; font-size: 12px;">`;
                typeAnalysis.inconsistentFields.forEach(field => {
                    html += `<div style="padding: 6px; margin: 4px 0; background: #ffe6e6; border-radius: 4px; border-left: 3px solid #dc3545;">`;
                    html += `<strong style="color: #dc3545; font-family: monospace;">${DOMPurify.sanitize(field.name)}</strong><br>`;
                    html += `<span style="color: #666; font-size: 11px;">Types: ${field.types.join(' | ')}</span><br>`;
                    html += `<span style="color: #666; font-size: 11px;">Coverage: ${field.coverage}</span>`;
                    if (field.isPotentialDate) {
                        html += `<br><span style="color: #0066cc; font-size: 11px;">📅 Possible date field</span>`;
                    }
                    html += `</div>`;
                });
                html += `</div>`;
            } else {
                html += `<div style="background: #d4edda; border-left: 4px solid #28a745; padding: 10px; border-radius: 4px;">`;
                html += `<strong style="color: #155724;">✓ All fields have consistent types</strong>`;
                html += `</div>`;
            }
            html += `</div>`;
            
            html += `</div>`;
            
            // Generate and display sample document
            const sampleDoc = generateSampleDocument(properties);
            const sampleDocId = `sample-doc-${escapedId}`;
            html += '<h4 style="margin-top: 20px; margin-bottom: 10px; color: #495057;">Mock Data from Schema</h4>';
            html += '<div style="background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px; padding: 15px; padding-top: 45px; margin-bottom: 20px; position: relative;">';
            html += '<div style="position: absolute; top: 10px; right: 10px; display: flex; gap: 5px;">';
            html += '<button onclick="copySampleDocument(this)" style="background: #007bff; color: white; border: none; border-radius: 4px; padding: 6px 12px; font-size: 11px; cursor: pointer;">📋 Copy JSON</button>';
            html += `<button onclick="toggleSampleDocument('${sampleDocId}', this)" style="background: #6c757d; color: white; border: none; border-radius: 4px; padding: 6px 12px; font-size: 11px; cursor: pointer;">▼ Show Less</button>`;
            html += '</div>';
            html += `<div id="${sampleDocId}" style="max-height: 200px; overflow-y: auto; transition: max-height 0.3s ease;">`;
            html += '<pre style="margin: 0; font-family: monospace; font-size: 12px; overflow-x: auto; white-space: pre-wrap; word-break: break-word;">';
            html += DOMPurify.sanitize(JSON.stringify(sampleDoc, null, 2));
            html += '</pre>';
            html += '</div>';
            html += '</div>';
            
            if (Object.keys(properties).length > 0) {
                html += '<h4 style="margin-top: 20px; margin-bottom: 10px; color: #495057;">Schema Properties</h4>';
                html += '<table style="width: 100%; border-collapse: collapse; font-size: 12px;">';
                html += '<thead><tr style="background: #f8f9fa; border-bottom: 2px solid #dee2e6;">';
                html += '<th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Property</th>';
                html += '<th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Type</th>';
                html += '<th style="padding: 8px; text-align: center; border: 1px solid #ddd;">Doc Count</th>';
                html += '<th style="padding: 8px; text-align: center; border: 1px solid #ddd;">% Coverage</th>';
                html += '<th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Details</th>';
                html += '</tr></thead><tbody>';
                
                Object.entries(properties).sort((a, b) => a[0].localeCompare(b[0])).forEach(([propName, propData]) => {
                    const type = Array.isArray(propData.type) ? propData.type.join(' | ') : propData.type;
                    const propDocCount = Array.isArray(propData['#docs']) ? propData['#docs'].join(', ') : propData['#docs'];
                    const propDocPercent = Array.isArray(propData['%docs']) ? propData['%docs'].join(', ') : propData['%docs'];
                    
                    // Check if this field is inconsistent
                    const types = Array.isArray(propData.type) ? propData.type : [propData.type];
                    const docPercents = Array.isArray(propData['%docs']) ? propData['%docs'] : [propData['%docs']];
                    const isInconsistent = types.length > 1 || (Array.isArray(docPercents) && docPercents.some(p => p < 100));
                    const dateFieldNames = /date|time|timestamp|created|updated|modified|expires|born|anniversary/i;
                    const isPotentialDate = dateFieldNames.test(propName);
                    
                    let details = '';
                    if (propData.items) {
                        const itemType = propData.items.type || 'unknown';
                        details += `<strong>Array of:</strong> ${itemType}`;
                        if (propData.minItems !== undefined || propData.maxItems !== undefined) {
                            details += ` (${propData.minItems || 0}-${propData.maxItems || '∞'} items)`;
                        }
                    }
                    if (propData.properties) {
                        const nestedPropCount = Object.keys(propData.properties).length;
                        details += `<strong>Object:</strong> ${nestedPropCount} nested properties`;
                    }
                    if (isPotentialDate) {
                        details += details ? '<br>' : '';
                        details += `<span style="color: #0066cc;">📅 Possible date field</span>`;
                    }
                    
                    // Highlight inconsistent fields in red
                    const rowStyle = isInconsistent ? 'border-bottom: 1px solid #ddd; background: #ffe6e6;' : 'border-bottom: 1px solid #ddd;';
                    const nameColor = isInconsistent ? '#dc3545' : '#0056b3';
                    const typeColor = isInconsistent ? '#dc3545' : '#6c757d';
                    const warningIcon = isInconsistent ? '⚠️ ' : '';
                    
                    html += `<tr style="${rowStyle}">`;
                    html += `<td style="padding: 8px; border: 1px solid #ddd; font-family: monospace; font-weight: bold; color: ${nameColor};">${warningIcon}${DOMPurify.sanitize(propName)}</td>`;
                    html += `<td style="padding: 8px; border: 1px solid #ddd; font-family: monospace; color: ${typeColor}; font-weight: ${isInconsistent ? 'bold' : 'normal'};">${DOMPurify.sanitize(type)}</td>`;
                    html += `<td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${propDocCount}</td>`;
                    html += `<td style="padding: 8px; border: 1px solid #ddd; text-align: center; color: ${isInconsistent ? '#dc3545' : 'inherit'}; font-weight: ${isInconsistent ? 'bold' : 'normal'};">${propDocPercent}%</td>`;
                    html += `<td style="padding: 8px; border: 1px solid #ddd; font-size: 11px; color: #666;">${details || '-'}</td>`;
                    html += '</tr>';
                });
                
                html += '</tbody></table>';
            }
            
            detailPanel.innerHTML = html;
            
            // Render pie chart after DOM update
            setTimeout(() => {
                renderSchemaTypeChart(`schema-type-chart-${escapedId}`, typeAnalysis.typeCounts);
            }, 100);
        }
        
        function analyzeSampleValues(samples) {
            if (!samples || !Array.isArray(samples) || samples.length === 0) {
                return { dateFormat: null, isUnique: false };
            }
            
            const flatSamples = samples.flat().filter(s => s !== null && s !== undefined);
            if (flatSamples.length === 0) return { dateFormat: null, isUnique: false };
            
            const sample = flatSamples[0];
            let dateFormat = null;
            
            // Check for ISO-8601 date strings
            if (typeof sample === 'string') {
                if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(sample)) {
                    dateFormat = 'ISO-8601';
                } else if (/^\d{4}-\d{2}-\d{2}$/.test(sample)) {
                    dateFormat = 'Date (YYYY-MM-DD)';
                } else if (/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/i.test(sample)) {
                    dateFormat = 'Day of Week';
                } else if (/^\d{4}-\d{2}$/.test(sample)) {
                    dateFormat = 'Month/Year (YYYY-MM)';
                }
            } else if (typeof sample === 'number') {
                // Check for Unix timestamps
                if (sample > 1000000000 && sample < 10000000000) {
                    dateFormat = 'Unix Time (seconds)';
                } else if (sample > 1000000000000 && sample < 10000000000000) {
                    dateFormat = 'Unix Time (milliseconds)';
                }
            }
            
            return { dateFormat, isUnique: flatSamples.length === new Set(flatSamples).size };
        }
        
        function generateSampleDocument(properties) {
            const doc = {};
            
            Object.entries(properties).forEach(([propName, propData]) => {
                const samples = propData.samples || [];
                const types = Array.isArray(propData.type) ? propData.type : [propData.type];
                const primaryType = types[0];
                
                // Get a sample value
                const flatSamples = samples.flat().filter(s => s !== null && s !== undefined);
                
                if (flatSamples.length > 0) {
                    // Use first sample value
                    doc[propName] = flatSamples[0];
                } else if (primaryType === 'string') {
                    doc[propName] = '<string>';
                } else if (primaryType === 'number') {
                    doc[propName] = 0;
                } else if (primaryType === 'boolean') {
                    doc[propName] = true;
                } else if (primaryType === 'array') {
                    if (propData.items && propData.items.samples) {
                        // Use sample from items
                        const itemSamples = propData.items.samples;
                        const flatItemSamples = Array.isArray(itemSamples) ? itemSamples.flat() : [];
                        if (flatItemSamples.length > 0) {
                            doc[propName] = [flatItemSamples[0]];
                        } else {
                            doc[propName] = [];
                        }
                    } else {
                        doc[propName] = [];
                    }
                } else if (primaryType === 'object') {
                    if (propData.samples && Array.isArray(propData.samples) && propData.samples.length > 0) {
                        // Use sample object
                        const objSample = propData.samples.find(s => s && typeof s === 'object');
                        if (objSample) {
                            doc[propName] = objSample;
                        } else if (propData.properties) {
                            // Recursively generate nested object
                            doc[propName] = generateSampleDocument(propData.properties);
                        } else {
                            doc[propName] = {};
                        }
                    } else if (propData.properties) {
                        // Recursively generate nested object
                        doc[propName] = generateSampleDocument(propData.properties);
                    } else {
                        doc[propName] = {};
                    }
                } else if (primaryType === 'null') {
                    doc[propName] = null;
                } else {
                    doc[propName] = null;
                }
            });
            
            return doc;
        }
        
        function analyzeSchemaTypes(properties) {
            const typeCounts = {
                string: 0,
                number: 0,
                boolean: 0,
                array: 0,
                object: 0,
                null: 0,
                mixed: 0
            };
            
            const inconsistentFields = [];
            const typeDiscriminators = [];
            const uniqueIdentifiers = [];
            const dateTimeFields = [];
            
            const dateFieldNames = /date|time|timestamp|created|updated|modified|expires|born|anniversary/i;
            const typeFieldNames = /^(type|docType|class|_class|_type|kind|category)$/i;
            const idFieldNames = /^(id|_id|ID|uuid|guid|key|record|recordId|recordKey)$/i;
            
            Object.entries(properties).forEach(([propName, propData]) => {
                const types = Array.isArray(propData.type) ? propData.type : [propData.type];
                const docCounts = Array.isArray(propData['#docs']) ? propData['#docs'] : [propData['#docs']];
                const docPercents = Array.isArray(propData['%docs']) ? propData['%docs'] : [propData['%docs']];
                const samples = propData.samples || [];
                
                // Analyze sample values
                const sampleAnalysis = analyzeSampleValues(samples);
                
                // Check for type discriminator fields
                if (typeFieldNames.test(propName)) {
                    const sampleValues = samples.flat().filter(s => s !== null && s !== undefined);
                    typeDiscriminators.push({
                        name: propName,
                        values: [...new Set(sampleValues)].slice(0, 10)
                    });
                }
                
                // Check for unique identifier fields
                if (idFieldNames.test(propName) && sampleAnalysis.isUnique) {
                    uniqueIdentifiers.push({
                        name: propName,
                        type: types.join(' | ')
                    });
                }
                
                // Check for date/time fields
                if (sampleAnalysis.dateFormat || dateFieldNames.test(propName)) {
                    dateTimeFields.push({
                        name: propName,
                        type: types.join(' | '),
                        format: sampleAnalysis.dateFormat || 'Inferred from name',
                        samples: samples.flat().filter(s => s !== null).slice(0, 3)
                    });
                }
                
                // Check if field has mixed types (not 100% consistent)
                const isMixed = types.length > 1 || (Array.isArray(docPercents) && docPercents.some(p => p < 100));
                
                if (isMixed) {
                    typeCounts.mixed++;
                    
                    const coverageStr = Array.isArray(docPercents) 
                        ? types.map((t, i) => `${t}: ${docPercents[i]}%`).join(', ')
                        : `${types[0]}: ${docPercents}%`;
                    
                    inconsistentFields.push({
                        name: propName,
                        types: types,
                        coverage: coverageStr,
                        isPotentialDate: dateFieldNames.test(propName) || sampleAnalysis.dateFormat
                    });
                } else {
                    // Consistent type - count it
                    const primaryType = types[0];
                    if (primaryType === 'string') typeCounts.string++;
                    else if (primaryType === 'number') typeCounts.number++;
                    else if (primaryType === 'boolean') typeCounts.boolean++;
                    else if (primaryType === 'array') typeCounts.array++;
                    else if (primaryType === 'object') typeCounts.object++;
                    else if (primaryType === 'null') typeCounts.null++;
                }
            });
            
            return { 
                typeCounts, 
                inconsistentFields, 
                typeDiscriminators, 
                uniqueIdentifiers, 
                dateTimeFields 
            };
        }
        
        function renderSchemaTypeChart(canvasId, typeCounts) {
            const canvas = document.getElementById(canvasId);
            if (!canvas) return;
            
            const labels = [];
            const data = [];
            const colors = [];
            
            const typeColorMap = {
                string: '#36a2eb',
                number: '#ff6384',
                boolean: '#4bc0c0',
                array: '#ff9f40',
                object: '#9966ff',
                null: '#c9cbcf',
                mixed: '#ffcd56'
            };
            
            Object.entries(typeCounts).forEach(([type, count]) => {
                if (count > 0) {
                    labels.push(type.charAt(0).toUpperCase() + type.slice(1));
                    data.push(count);
                    colors.push(typeColorMap[type] || '#999');
                }
            });
            
            if (data.length === 0) {
                // No data to display
                return;
            }
            
            const total = data.reduce((a, b) => a + b, 0);
            
            new Chart(canvas, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: colors,
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                boxWidth: 12,
                                font: { size: 11 },
                                generateLabels: function(chart) {
                                    const data = chart.data;
                                    return data.labels.map((label, index) => ({
                                        text: label + ' (' + (typeof data.datasets[0].data[index] === 'number' ? data.datasets[0].data[index].toLocaleString() : data.datasets[0].data[index]) + ')',
                                        fillStyle: data.datasets[0].backgroundColor[index],
                                        strokeStyle: data.datasets[0].backgroundColor[index],
                                        lineWidth: 1,
                                        hidden: false,
                                        index: index
                                    }));
                                }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.parsed || 0;
                                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                    return `${label}: ${value} (${percentage}%)`;
                                }
                            }
                        }
                    }
                },
                plugins: [{
                    afterDatasetsDraw: function(chart) {
                        drawPieLabelsWithLeaders(chart, total, { insideThreshold: 10 });
                    }
                }]
            });
        }
        
        function expandAllSchemaTree() {
            document.querySelectorAll('.schema-tree-children').forEach(el => {
                el.classList.remove('collapsed');
            });
            document.querySelectorAll('.schema-tree-toggle').forEach(el => {
                el.textContent = '▼';
            });
        }
        
        function collapseAllSchemaTree() {
            document.querySelectorAll('.schema-tree-children').forEach(el => {
                el.classList.add('collapsed');
            });
            document.querySelectorAll('.schema-tree-toggle').forEach(el => {
                el.textContent = '▶';
            });
        }
        
        function copySampleDocument(button) {
            // Find the pre element - it's in the parent's parent's child div
            const container = button.closest('div[style*="background"]');
            const pre = container ? container.querySelector('pre') : null;
            if (pre) {
                const text = pre.textContent;
                navigator.clipboard.writeText(text).then(() => {
                    const originalText = button.textContent;
                    button.textContent = '✓ Copied!';
                    button.style.background = '#28a745';
                    setTimeout(() => {
                        button.textContent = originalText;
                        button.style.background = '#007bff';
                    }, 2000);
                }).catch(err => {
                    Logger.error('Failed to copy:', err);
                    showToast('Failed to copy to clipboard', 'error');
                });
            }
        }
        
        function toggleSampleDocument(divId, button) {
            const div = document.getElementById(divId);
            if (div) {
                if (div.style.maxHeight === 'none' || div.style.maxHeight === '') {
                    // Collapse
                    div.style.maxHeight = '200px';
                    button.textContent = '▼ Show Less';
                } else {
                    // Expand
                    div.style.maxHeight = 'none';
                    button.textContent = '▲ Show More';
                }
            }
        }

        // Set timezone label text when DOM loads
        document.addEventListener('DOMContentLoaded', function() {
            const label = document.getElementById('timezone-selector-label');
            if (label) {
                label.textContent = TEXT_CONSTANTS.TIMEZONE_LABEL;
            }
        });
