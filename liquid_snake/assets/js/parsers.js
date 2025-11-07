// ============================================================
// PARSERS.JS - Data Parsing Module
// ============================================================
// This module handles parsing of JSON data from Couchbase.
// Contains the main parseJSON function and related parsers.
// 
// WARNING: parseJSON is heavily UI-coupled (~4000 lines)
// Future refactor: Split into pure parsing + UI orchestration
// ============================================================

import { Logger, TEXT_CONSTANTS, isDevMode } from './base.js';
import { 
    originalRequests,
    statementStore,
    analysisStatementStore,
    clearCaches,
    parseTime,
    normalizeStatement,
    deriveStatementType,
    detectTimezoneFromData,
    getOperators,
    stripEmTags,
    isPreparedExecution,
    getPreparedSample,
    makeElapsedFilterPredicate,
    dataBus,
    notifyDataReady
} from './data-layer.js';
import { 
    showToast,
    formatNumber,
    formatDuration
} from './ui-helpers.js';

// Import chart and table generators
// (parseJSON calls these after parsing)
const generateDashboardCharts = window.generateDashboardCharts;
const generateTable = window.generateTable;
const generateAnalysisTable = window.generateAnalysisTable;
const buildIndexQueryFlow = window.buildIndexQueryFlow;
const updateInsights = window.updateInsights;

// ============================================================
// PARSER FUNCTIONS
// ============================================================


// ============================================================
// PARSER: processRequestData
// ============================================================

        function processRequestData(item) {
            const request = item.completed_requests || item;

            // Parse and cache plan data immediately
            let plan = null;
            if (item.plan) {
                if (typeof item.plan === "string") {
                    try {
                        plan = JSON.parse(item.plan);
                    } catch (e) {
                        Logger.error(`${TEXT_CONSTANTS.JSON_PARSING_ERROR} plan for request:`, e.message);
                        showToast(`${TEXT_CONSTANTS.ERROR_PARSING_JSON} ${e.message}`, "warning");
                        plan = null;
                    }
                } else {
                    plan = item.plan;
                }
            }

            // Get operators once and cache all derived values
            let operators = [];
            let planMetadata = null;

            if (plan) {
                // Check if we already cached the plan stats
                if (planStatsCache.has(plan)) {
                    planMetadata = planStatsCache.get(plan);
                    operators = planMetadata.operators;
                } else {
                    // Single pass through operators to extract all needed data
                    operators = getOperators(plan);

                    // Calculate all time values in one pass
                    let maxKernTime = 0;
                    let totalExecTime = 0;
                    let totalServiceTime = 0;
                    let totalMemoryUsage = 0;
                    let totalItemsIn = 0;
                    let totalItemsOut = 0;
                    let streamTime = 0;
                    let fetchTime = 0;
                    let sortTime = 0;
                    const indexes = [];
                    const stats = { primaryScan: 0, indexScan: 0, fetch: 0 };
                    let usesPrimaryFlag = false;

                    operators.forEach((operator) => {
                        const operatorStats = operator["#stats"] || {};
                        const operatorType = operator["#operator"];

                        // Parse times once
                        const kernTime = parseTime(operatorStats.kernTime);
                        const execTime = parseTime(operatorStats.execTime);
                        const servTime = parseTime(operatorStats.servTime);
                        const usedMemory = operatorStats.usedMemory || 0;

                        // Aggregate times and stats
                        if (!isNaN(kernTime)) maxKernTime = Math.max(maxKernTime, kernTime);
                        if (!isNaN(execTime)) totalExecTime += execTime;
                        if (!isNaN(servTime)) totalServiceTime += servTime;
                        if (!isNaN(usedMemory)) totalMemoryUsage += usedMemory;

                        // Aggregate items in/out
                        totalItemsIn += operatorStats["#itemsIn"] || 0;
                        totalItemsOut += operatorStats["#itemsOut"] || 0;

                        // Extract index information
                        if (operator.index) {
                            indexes.push(operator.index);
                        }

                        // Check for primary index usage
                        if (operatorType === "PrimaryScan" ||
                            operatorType === "PrimaryScan3" ||
                            operator.index === "#primary" ||
                            (operator.spans && operator.spans.length === 0)) {
                            usesPrimaryFlag = true;
                        }

                        // Update stats counters with actual items and extract phase times
                        if (operatorType === "PrimaryScan" || operatorType === "PrimaryScan3") {
                            stats.primaryScan += operatorStats["#itemsOut"] || 0;
                        } else if (operatorType === "IndexScan" || operatorType === "IndexScan3") {
                            stats.indexScan += operatorStats["#itemsOut"] || 0;
                        } else if (operatorType === "Fetch") {
                            stats.fetch += operatorStats["#itemsOut"] || 0;
                            fetchTime += execTime;
                        } else if (operatorType === "Stream") {
                            streamTime += execTime;
                        } else if (operatorType === "Order" || operatorType === "Sort") {
                            sortTime += execTime;
                        }
                    });

                    // Cache all computed values including performance ratios
                    const elapsedTimeMs = parseTime(request.elapsedTime);
                    const streamRatio = elapsedTimeMs > 0 ? (streamTime / elapsedTimeMs) * 100 : 0;
                    const fetchRatio = elapsedTimeMs > 0 ? (fetchTime / elapsedTimeMs) * 100 : 0;

                    planMetadata = {
                        operators: operators,
                        maxKernTime: maxKernTime,
                        totalExecTime: totalExecTime,
                        totalServiceTime: totalServiceTime,
                        totalMemoryUsage: totalMemoryUsage,
                        totalItemsIn: totalItemsIn,
                        totalItemsOut: totalItemsOut,
                        streamTime: streamTime,
                        fetchTime: fetchTime,
                        sortTime: sortTime,
                        streamRatio: streamRatio,
                        fetchRatio: fetchRatio,
                        indexes: indexes,
                        stats: stats,
                        usesPrimary: usesPrimaryFlag,
                        indexInfo: { indexes: indexes, stats: stats }
                    };

                    planStatsCache.set(plan, planMetadata);
                }
            }

            // Pre-calculate commonly used values using cached data
            const elapsedTimeMs = parseTime(request.elapsedTime);
            
            // DO NOT convert requestTime here - keep it in original UTC/ISO format
            // Timezone conversion should only happen in display layer (tables, charts)
            // to avoid breaking date filtering and comparisons
            
            const processedRequest = {
                ...request,
                plan: plan,
                // Use cached time values or fallback to direct parsing
                elapsedTimeMs: elapsedTimeMs,
                serviceTimeMs: planMetadata ? planMetadata.totalServiceTime : parseTime(request.serviceTime || '0ms'),
                kernTimeMs: planMetadata ? planMetadata.maxKernTime : 0,
                memoryBytes: (typeof request.usedMemory === 'number') ? request.usedMemory : null,
                // Use cached boolean flags
                usesPrimary: planMetadata ? planMetadata.usesPrimary : false,
                // Use cached index information
                indexInfo: planMetadata ? planMetadata.indexInfo : null,
                // Store performance insights
                streamRatio: planMetadata ? planMetadata.streamRatio : 0,
                fetchRatio: planMetadata ? planMetadata.fetchRatio : 0,
                isStreamHeavy: planMetadata ? planMetadata.streamRatio > 50 : false,
                isLargePayload: (request.resultSize || 0) > 50000000 || (request.resultCount || 0) > 10000,
                // Store metadata for quick access
                _planMetadata: planMetadata,
                // Normalize prepared queries: prefer raw statement; fallback to preparedText, and clean for display
                statement: (function(){
                    const raw = request.statement || request.preparedText || '';
                    try {
                        const tmp = document.createElement('div');
                        tmp.innerHTML = raw; // decode entities
                        let txt = (tmp.textContent || tmp.innerText || '');
                        txt = txt.replace(/<[^>]*>/g, ' '); // strip any tags like <ud>
                        return txt.replace(/\s+/g, ' ').trim();
                    } catch (e) { return raw; }
                })(),
                // Ensure we have a statement type (derive if not present)
                statementType: request.statementType || deriveStatementType(request.statement || request.preparedText),
            };

            return processedRequest;
        }

// ============================================================
// PARSER: finishProcessing
// ============================================================

        function finishProcessing(allRequests) {
            const startDateInput = document.getElementById("start-date");
            const endDateInput = document.getElementById("end-date");

            // Hide progress bar and reset placeholder
            document.getElementById("progress-container").style.display = "none";
            document.getElementById("progress-bar").style.width = "0%";
            document.getElementById("progress-text").textContent = "0%";
            document.getElementById("json-input").placeholder =
                "Paste your JSON output from: SELECT * , meta().plan FROM system:completed_requests;";

            // Cache management now handled automatically by size limits (Step 9)
            // No manual clearing needed - cache evicts oldest 20% when limit reached

            // Filtering now happens during parsing, so we can use requests directly
            const filteredAllRequests = allRequests;

            // If this is the first parse (no date filters set), populate date range
            if (
                !startDateInput.value &&
                !endDateInput.value &&
                filteredAllRequests.length > 0
            ) {
                originalRequests = filteredAllRequests;
                const dates = filteredAllRequests
                    .map((r) => parseCouchbaseDateTime(r.requestTime))
                    .filter((d) => d && !isNaN(d.getTime()))
                    .sort((a, b) => a - b);

                if (dates.length > 0) {
                    const minDate = dates[0];
                    const maxDate = dates[dates.length - 1];

                    // Add 1-minute buffer to ensure edge records aren't excluded by minute rounding
                    const startWithBuffer = new Date(minDate.getTime() - 60000); // -1 minute
                    const endWithBuffer = new Date(maxDate.getTime() + 60000); // +1 minute

                    originalStartDate = minDate;
                    originalEndDate = maxDate;
                    
                    // Apply timezone conversion to date pickers (Issue #203)
                    // Use selected timezone so user sees dates in their chosen timezone
                    const timezoneForPicker = currentTimezone || "UTC";
                    startDateInput.value = toDateTimeLocal(startWithBuffer, timezoneForPicker);
                    endDateInput.value = toDateTimeLocal(endWithBuffer, timezoneForPicker);
                    updateDatePickerTimezoneLabel(); // Show timezone info next to date pickers
                    
                    Logger.debug(`[parseJSON] Set date pickers to ${timezoneForPicker}: ${startDateInput.value} to ${endDateInput.value}`);
                }
            } else {
                // Use existing originalRequests if available, otherwise use current data
                if (originalRequests.length === 0) {
                    originalRequests = filteredAllRequests;
                }
            }

            // Apply date filtering
            const startDate = startDateInput.value
                ? new Date(startDateInput.value)
                : null;
            const endDate = endDateInput.value
                ? new Date(endDateInput.value)
                : null;

            const filteredRequests = filterRequestsByDateRange(
                filteredAllRequests,
                startDate,
                endDate
            );
            
            // Debug logging for filtering
            Logger.debug(`Date filtering: ${filteredAllRequests.length} requests -> ${filteredRequests.length} after date range filter`);
            if (filteredRequests.length === 0 && filteredAllRequests.length > 0) {
                console.warn("⚠️ All requests filtered out by date range!");
                console.log("Start date:", startDate);
                console.log("End date:", endDate);
                if (filteredAllRequests.length > 0) {
                    console.log("First request time:", filteredAllRequests[0].requestTime);
                }
            }

            // Store filtered requests globally for Index/Query Flow tab activation
            window.filteredRequests = filteredRequests;

            // Store filtered data globally for lazy loading
            window.currentFilteredRequests = filteredRequests;

            // Update UI with filtered data
            updateFilterInfo(filteredAllRequests.length, filteredRequests.length, filteredRequests);
            try {
                // Only generate essential tables immediately - defer charts until tab activation
                generateTable(filteredRequests);
                generateAnalysisTable(filteredRequests);
                updateOptimizerLabel(filteredRequests);

                // Extract used indexes from the query data
                extractUsedIndexes(filteredRequests);

                // Extract sample queries for display
                extractSampleQueries(filteredRequests);

                // Initialize username autocomplete with current filtered requests
                initializeUsernameAutocomplete(filteredRequests);

                // Also parse index data if available
                parseIndexJSON();

                // Set up lazy loading for charts with sampling for large datasets
                const sampleRequests = filteredRequests.length > 1000 ?
                    filteredRequests.filter((_, i) => i % Math.ceil(filteredRequests.length / 1000) === 0) :
                    filteredRequests;

                // Show sampling notice if data was sampled for charts
                if (filteredRequests.length > 1000) {
                    console.log(`${TEXT_CONSTANTS.CHART_SAMPLING} ${sampleRequests.length} ${TEXT_CONSTANTS.OF_TOTAL} ${filteredRequests.length} ${TEXT_CONSTANTS.REQUESTS_FOR_PERFORMANCE}`);
                }

                setupLazyChartLoading(sampleRequests, filteredRequests);
            } catch (e) {
                console.error(`${TEXT_CONSTANTS.ERROR_GENERATING_UI}`, e);
                alert(`${TEXT_CONSTANTS.ERROR_GENERATING_UI} Try reducing the date range or selecting a coarser time grouping.`);
            }
            // Only reset flow diagram if no query was previously selected
            const flowDiagram = document.getElementById("flow-diagram");
            if (!flowDiagram.hasChildNodes() || flowDiagram.children.length === 0) {
                flowDiagram.innerHTML = TEXT_CONSTANTS.SELECT_QUERY_FLOW;
            }

            // Populate collection filter dropdown
            populateCollectionFilter(filteredRequests);

            // Schedule auto-hide of input panel after successful processing
            scheduleInputAutoHide(3000);
        }

// ============================================================
// PARSER: parseJSON
// ============================================================

        function parseJSON() {
            // Hide filter reminder when parsing
            hideFilterReminder();
            
            // Clear caches at start of new parse to prevent memory leaks
            clearCaches();

            // Start performance timing
            const parseStartTime = performance.now();

            // Prefer uploaded file content (in-memory) over textarea to avoid DOM bloat
            const uploadedRaw = (window._uploadedCompletedJsonRaw && typeof window._uploadedCompletedJsonRaw === 'string') ? window._uploadedCompletedJsonRaw : '';
            const taVal = document.getElementById("json-input").value;
            const jsonInput = (uploadedRaw ? uploadedRaw : taVal).trim();
            const startDateInput = document.getElementById("start-date");
            const endDateInput = document.getElementById("end-date");

            // Reset time grouping to default (By Optimizer) to prevent fine-grain errors
            const timeGroupingSelect = document.getElementById('time-grouping-select');
            if (timeGroupingSelect) {
                timeGroupingSelect.value = 'optimizer';
                // Trigger the change event to update any dependent UI
                changeTimeGrouping();
            }

            // Input validation
            if (!jsonInput) {
                showToast(TEXT_CONSTANTS.PASTE_JSON_FIRST, "warning");
                return;
            }

            // if (jsonInput.length > 50 * 1024 * 1024) {
            //     // 50MB limit
            //     showToast(TEXT_CONSTANTS.INPUT_TOO_LARGE, "error");
            //     return;
            // }

            try {
                const data = JSON.parse(jsonInput);
                let processData = [];

                if (Array.isArray(data)) {
                    processData = data;
                } else if (data && data.results && Array.isArray(data.results)) {
                    processData = data.results;
                } else {
                    showToast(TEXT_CONSTANTS.VALID_JSON_REQUIRED, "error");
                    return;
                }

                if (processData.length === 0) {
                    showToast(TEXT_CONSTANTS.NO_DATA_FOUND, "warning");
                    return;
                }

                // Detect timezone from the data
                detectedTimezone = detectTimezoneFromData(processData);
                const timezoneSelector = document.getElementById("timezone-selector");
                
                Logger.debug(`[parseJSON] Detected timezone: ${detectedTimezone}, User picked: ${timeZoneUserPicked}`);
                
                // Only auto-set timezone if user hasn't manually picked one
                if (timezoneSelector && !timeZoneUserPicked) {
                    // Set the dropdown to detected timezone if available in options
                    const options = Array.from(timezoneSelector.options).map(opt => opt.value);
                    if (options.includes(detectedTimezone)) {
                        timezoneSelector.value = detectedTimezone;
                    } else {
                        timezoneSelector.value = "UTC";
                    }
                    currentTimezone = timezoneSelector.value;
                    Logger.debug(`[parseJSON] Auto-set timezone to: ${currentTimezone}`);
                } else if (timezoneSelector) {
                    // Preserve user's timezone selection
                    currentTimezone = timezoneSelector.value;
                    Logger.debug(`[parseJSON] Preserving user's timezone: ${currentTimezone}`);
                }
                
                // Update the date picker timezone label to match current selection
                updateDatePickerTimezoneLabel();
                
                // Update timezone info display
                const timezoneInfo = document.getElementById("timezone-info");
                if (timezoneInfo) {
                    timezoneInfo.textContent = `${TEXT_CONSTANTS.TIMEZONE_DETECTED} ${detectedTimezone}`;
                }

                if (Array.isArray(processData)) {
                    // Process data in smaller batches for maximum UI responsiveness
                    const batchSize = 75; // Further reduced for smoother progress updates
                    const processedRequests = [];
                    let skippedCount = 0; // Track filtered out requests

                    // Show progress bar
                    document.getElementById("progress-container").style.display =
                        "block";

                    // Get filter settings once outside the loop for performance
                    const excludeCheckbox = document.getElementById("exclude-system-queries");
                    const isExcluding = excludeCheckbox && excludeCheckbox.checked;
                    const sqlFilter = document.getElementById("sql-statement-filter");
                    const sqlFilterText = sqlFilter ? sqlFilter.value.trim().toLowerCase() : "";
                    const collectionFilter = document.getElementById("collection-filter");
                    const collectionFilterValue = collectionFilter ? collectionFilter.value.trim() : "";

                    // Get date filter settings
                    const startDateInput = document.getElementById("start-date");
                    const endDateInput = document.getElementById("end-date");
                    const startDate = startDateInput.value ? new Date(startDateInput.value) : null;
                    const endDate = endDateInput.value ? new Date(endDateInput.value) : null;

                    // Get elapsedTime filter predicate
                    const elapsedFilterInput = document.getElementById("elapsed-time-filter");
                    const elapsedFilterText = elapsedFilterInput ? elapsedFilterInput.value.trim() : "";
                    const elapsedPredicate = makeElapsedFilterPredicate(elapsedFilterText);

                    // ============================================================
                    // DATA PROCESSING OPTIMIZATION (Step 5)
                    // Combined filter function to reduce redundant checks
                    // ============================================================
                    function shouldProcessRequest(request) {
                        // Early exit for system query filtering
                        if (isExcluding && shouldExcludeSystemQuery(request)) {
                            return false;
                        }

                        // SQL statement filtering
                        if (sqlFilterText && sqlFilterText.length > 0) {
                            const statement = (request.statement || request.preparedText || "")
                                .toLowerCase()
                                .replace(/\s+/g, ' ')
                                .trim();
                            const filterText = sqlFilterText.replace(/\s+/g, ' ').trim();
                            if (!statement.includes(filterText)) {
                                return false;
                            }
                        }

                        // Collection filtering (AND condition)
                        if (collectionFilterValue && collectionFilterValue.length > 0) {
                            const sql = request.statement || request.preparedText || "";
                            const collections = extractCollectionsFromSQL(sql);
                            if (!collections.includes(collectionFilterValue)) {
                                return false;
                            }
                        }

                        // Date range filtering
                        if (startDate || endDate) {
                            const requestDate = parseCouchbaseDateTime(request.requestTime);
                            if (requestDate) {
                                if (startDate && requestDate < startDate) return false;
                                if (endDate && requestDate > endDate) return false;
                            }
                        }

                        // Elapsed time filtering
                        if (elapsedPredicate) {
                            const elapsedMs = parseTime(request.elapsedTime || "");
                            if (!elapsedPredicate(elapsedMs)) {
                                return false;
                            }
                        }

                        return true; // Passed all filters
                    }

                    function processBatch(startIndex) {
                        const endIndex = Math.min(
                            startIndex + batchSize,
                            processData.length
                        );

                        for (let i = startIndex; i < endIndex; i++) {
                            try {
                                const item = processData[i];
                                const request = item.completed_requests || item;

                                // Combined filter check (Step 5 optimization)
                                if (!shouldProcessRequest(request)) {
                                    skippedCount++;
                                    continue;
                                }

                                // Only process requests that pass all filters
                                processedRequests.push(processRequestData(item));

                                // Yield every 25 processed items within batch for ultra-smooth progress
                                if ((i - startIndex) % 25 === 24 && i < endIndex - 1) {
                                    // Update progress more frequently for smoother bar
                                    const currentProgress = Math.round(
                                        ((i + 1) / processData.length) * 100
                                    );
                                    document.getElementById("progress-bar").style.width = `${currentProgress}%`;
                                    document.getElementById("progress-text").textContent = `${currentProgress}%`;
                                }
                            } catch (e) {
                                console.warn(`${TEXT_CONSTANTS.ERROR_PROCESSING_REQUEST} ${i}:`, e.message || e);
                                // Continue processing other requests
                            }
                        }

                        // Update progress bar
                        const progress = Math.round(
                            (endIndex / processData.length) * 100
                        );
                        document.getElementById(
                            "progress-bar"
                        ).style.width = `${progress}%`;
                        document.getElementById(
                            "progress-text"
                        ).textContent = `${progress}%`;

                        if (endIndex < processData.length) {
                            // Process next batch with dual yielding for maximum responsiveness
                            requestAnimationFrame(() => {
                                setTimeout(() => processBatch(endIndex), 5); // Reduced delay for faster processing
                            });
                        } else {
                            // All batches processed
                            const parseEndTime = performance.now();
                            Logger.info(`${TEXT_CONSTANTS.PARSE_PERFORMANCE} ${Math.round(parseEndTime - parseStartTime)}${TEXT_CONSTANTS.MS_FOR} ${processedRequests.length} ${TEXT_CONSTANTS.REQUESTS} (${skippedCount} ${TEXT_CONSTANTS.FILTERED_OUT_EARLY})`);
                            logCacheStats();
                            finishProcessing(processedRequests);
                        }
                    }

                    // Start processing
                    processBatch(0);
                } else {
                    showToast(TEXT_CONSTANTS.UNEXPECTED_DATA_FORMAT, "error");
                }
            } catch (e) {
                console.error(`${TEXT_CONSTANTS.JSON_PARSING_ERROR}`, e);
                console.log(`${TEXT_CONSTANTS.JSON_PARSING_ERROR}`, e);
                showToast(`${TEXT_CONSTANTS.ERROR_PARSING_JSON} ${e.message}`, "error");
                document.getElementById("progress-container").style.display = "none";
            }
        }

// ============================================================
// PARSER: parseIndexJSON
// ============================================================

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

// ============================================================
// PARSER: parseSchemaInference
// ============================================================

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

// ============================================================
// EXPORTS
// ============================================================

export {
    processRequestData,
    finishProcessing,
    parseJSON,
    parseIndexJSON,
    parseSchemaInference
};

// Expose globally for backward compatibility
window.processRequestData = processRequestData;
window.finishProcessing = finishProcessing;
window.parseJSON = parseJSON;
window.parseIndexJSON = parseIndexJSON;
window.parseSchemaInference = parseSchemaInference;

console.log('✅ parsers.js module loaded');
console.log('⚠️ Note: parseJSON is UI-coupled and will need refactoring in future');
