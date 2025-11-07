// ============================================================
// TABLES.JS - Table Rendering Module
// ============================================================
// This module handles all table generation and rendering.
// 
// Dependencies:
// - base.js (Logger, TEXT_CONSTANTS)
// - data-layer.js (data access)
// - ui-helpers.js (formatting, clipboard)
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import { Logger, TEXT_CONSTANTS } from './base.js';
import { 
    originalRequests,
    statementStore,
    analysisStatementStore,
    parseTime,
    normalizeStatement,
    deriveStatementType,
    stripEmTags,
    isPreparedExecution,
    getPreparedSample
} from './data-layer.js';
import { 
    formatNumber, 
    formatBytes, 
    formatDuration,
    escapeHtml,
    ClipboardUtils,
    copyToClipboard
} from './ui-helpers.js';

// ============================================================
// TABLE GENERATION FUNCTIONS
// ============================================================


// ============================================================
// TABLE: generateTable
// ============================================================

        function generateTable(requests) {
            const tableHeader = document.getElementById("table-header");
            const tableBody = document.getElementById("table-body");
            tableHeader.innerHTML = "";
            tableBody.innerHTML = "";

            const headerRow = document.createElement("tr");
            EVERY_QUERY_COLUMNS.forEach((colConfig) => {
                const th = document.createElement("th");
                th.innerHTML = colConfig.header.replace(/\n/g, "<br>");
                th.style.textAlign = "center";
                th.style.whiteSpace = "nowrap";
                th.style.cursor = "pointer";
                th.style.userSelect = "none";
                th.style.padding = "8px";
                th.style.backgroundColor = "#f8f9fa";
                th.style.border = "1px solid #dee2e6";
                th.style.fontWeight = "bold";
                th.style.position = "relative";

                // Apply column-specific width if defined
                if (colConfig.width) th.style.width = colConfig.width;
                if (colConfig.maxWidth) th.style.maxWidth = colConfig.maxWidth;

                // Add hover effect
                th.addEventListener("mouseenter", () => {
                    th.style.backgroundColor = "#e9ecef";
                });
                th.addEventListener("mouseleave", () => {
                    th.style.backgroundColor = "#f8f9fa";
                });

                // Add sorting indicator text
                if (colConfig.sortable) {
                    const sortHint = document.createElement("div");
                    sortHint.className = "sort-hint";
                    sortHint.style.fontSize = "10px";
                    sortHint.style.color = "#6c757d";
                    sortHint.style.fontWeight = "normal";
                    sortHint.style.marginTop = "2px";
                    sortHint.textContent = "↕ Sort";
                    th.appendChild(sortHint);

                    th.addEventListener("click", () => {
                        handleColumnSort(colConfig.id, "every-query");
                    });
                }
                headerRow.appendChild(th);
            });
            tableHeader.appendChild(headerRow);

            // Prepare data with pre-calculated values using column config
            const tableData = requests.map((request, index) => {
                const rowData = {
                    rowIndex: index + 1,
                    request: request, // Keep original request for click handler
                };

                EVERY_QUERY_COLUMNS.forEach((colConfig) => {
                    let value;
                    if (colConfig.getValue) {
                        value = colConfig.getValue(request, index);
                    } else if (colConfig.dataField) {
                        value = request[colConfig.dataField] || 'N/A';
                    }
                    rowData[colConfig.id] = value;
                });

                return rowData;
            });

            // Sort by elapsedTime by default
            const sortedData = sortData(tableData, "elapsedTime", "desc");
            everyQueryData = sortedData;
            filteredEveryQueryData = [...sortedData]; // Initialize filtered data
            currentSortColumn = "elapsedTime";
            currentSortDirection = "desc";
            currentTableType = "every-query";

            // Reset pagination when new data is loaded
            currentPage = 1;

            // Setup search listeners (only once)
            if (
                !document
                    .getElementById("statement-search")
                    .hasAttribute("data-listeners-added")
            ) {
                setupSearchListeners();
                document
                    .getElementById("statement-search")
                    .setAttribute("data-listeners-added", "true");
            }

            populateEveryQueryTable(filteredEveryQueryData);
            updateSortArrows("table-header", "elapsedTime", "desc");
            updateSearchResultsInfo(
                filteredEveryQueryData.length,
                everyQueryData.length
            );
        }

// ============================================================
// TABLE: generateAnalysisTable
// ============================================================

        function generateAnalysisTable(requests) {
            const analysisTableHeader = document.getElementById(
                "analysis-table-header"
            );
            const analysisTableBody = document.getElementById(
                "analysis-table-body"
            );
            analysisTableHeader.innerHTML = "";
            analysisTableBody.innerHTML = "";

            // Group requests by normalized_statement
            const groups = {};
            requests.forEach((request) => {
                const stmt = request.statement || request.preparedText;
                if (!stmt) return;
                // Note: System query filtering is now handled globally in parseJSON()
                const normalized = normalizeStatement(stmt);
                if (!groups[normalized]) {
                    groups[normalized] = [];
                }
                groups[normalized].push(request);
            });

            // Calculate stats for each group
            const groupData = Object.keys(groups)
                .map((key) => calculateGroupStats(key, groups[key]))
                .filter((data) => data !== null);
            groupData.sort((a, b) => b.total_count - a.total_count);

            // Initialize phase times chart with the first group (if present)
            if (groupData.length > 0) {
                renderQueryGroupPhaseTimesChart(groupData[0]);
            }

            // Create header row using column config
            const headerRow = document.createElement("tr");
            ANALYSIS_COLUMNS.forEach((colConfig) => {
                const th = document.createElement("th");
                
                // Use header from config, or TEXT_CONSTANTS for special columns
                let displayName = colConfig.header;
                if (colConfig.id === "user_query_counts") {
                    displayName = TEXT_CONSTANTS.USER_COUNT;
                } else if (colConfig.id === "status_counts") {
                    displayName = TEXT_CONSTANTS.STATE_FATAL;
                }
                
                th.textContent = displayName;
                th.style.textAlign = "center";
                
                if (colConfig.sortable) {
                    th.addEventListener("click", () => handleColumnSort(colConfig.id, "analysis"));
                }
                headerRow.appendChild(th);
            });
            analysisTableHeader.appendChild(headerRow);

            // Prepare table data using column config
            const analysisTableData = groupData.map((group) => {
                const rowData = {};
                
                ANALYSIS_COLUMNS.forEach((colConfig) => {
                    let value;
                    if (colConfig.getValue) {
                        value = colConfig.getValue(group);
                    } else if (colConfig.dataField) {
                        value = group[colConfig.dataField] || 'N/A';
                    }
                    rowData[colConfig.id] = value;
                });

                // Add fields for search filtering and prepared sample
                rowData.statement = group.normalized_statement || "";
                // Use first request of this group to derive a prepared statement sample
                try {
                const sampleList = groups && groups[group.normalized_statement];
                if (Array.isArray(sampleList) && sampleList.length > 0) {
                const sampleReq = sampleList[0] || {};
                rowData.preparedSample = isPreparedExecution(sampleReq) ? getPreparedSample(sampleReq) : "";
                } else {
                rowData.preparedSample = "";
                }
                } catch (e) { rowData.preparedSample = ""; }
                rowData.users = Object.keys(group.user_query_counts || {}).join(", ");
                // Attach original group for chart rendering on row click
                rowData.groupRef = group;

                return rowData;
            });

            // Sort by total_count by default
            const sortedData = sortData(analysisTableData, "total_count", "desc");
            analysisData = sortedData;
            filteredAnalysisData = [...sortedData]; // Initialize filtered data
            currentSortColumn = "total_count";
            currentSortDirection = "desc";
            currentTableType = "analysis";

            // Setup search listeners (only once)
            if (
                !document
                    .getElementById("analysis-statement-search")
                    .hasAttribute("data-listeners-added")
            ) {
                setupAnalysisSearchListeners();
                document
                    .getElementById("analysis-statement-search")
                    .setAttribute("data-listeners-added", "true");
            }

            populateAnalysisTable(filteredAnalysisData);
            updateSortArrows("analysis-table-header", "total_count", "desc");
            updateAnalysisSearchResultsInfo(
                filteredAnalysisData.length,
                analysisData.length
            );
        }

// ============================================================
// TABLE: generateUserCountTable
// ============================================================

        function generateUserCountTable(requests) {
            const sortedUsers = getUserListWithCounts(requests);

            const tbody = document.getElementById("user-count-body");
            tbody.innerHTML = "";

            // Use DocumentFragment for smooth rendering with caps
            const fragment = document.createDocumentFragment();
            const maxDisplayUsers = 500; // Cap for performance
            const usersToShow = sortedUsers.slice(0, maxDisplayUsers);

            usersToShow.forEach(([user, count]) => {
                const row = document.createElement("tr");
                row.style.borderBottom = "1px solid #eee";

                // Apply count thresholding
                const displayCount = count > 99999 ? "99K+" : count;

                row.innerHTML = `
              <td class="padding-8 text-align-center" style="font-weight: bold;">${displayCount}</td>
              <td class="padding-8" style="word-break: break-word;">
                ${user}
                <button onclick="copyToClipboard('${user.replace(
                    /'/g,
                    "\\'"
                )}', event)" 
                        class="btn-standard" style="margin-left: 8px;">
                  Copy
                </button>
              </td>
            `;
                fragment.appendChild(row);
            });

            tbody.appendChild(fragment);

            // Add notice if users were capped
            if (sortedUsers.length > maxDisplayUsers) {
                const noticeRow = document.createElement("tr");
                noticeRow.innerHTML = `<td colspan="2" style="text-align: center; color: #666; font-style: italic; padding: 10px;">${TEXT_CONSTANTS.SHOWING_TOP} ${maxDisplayUsers} ${TEXT_CONSTANTS.OF_TOTAL} ${sortedUsers.length} ${TEXT_CONSTANTS.USERS}</td>`;
                tbody.appendChild(noticeRow);
            }
        }

// ============================================================
// TABLE: generateIndexCountTable
// ============================================================

        function generateIndexCountTable(requests) {
            const indexData = {};

            requests.forEach((request) => {
                const bucketScopeCollection = parseFromClause(request.statement || request.preparedText);

                // Debug problematic parsing
                if (
                    bucketScopeCollection.includes("SELECT") ||
                    bucketScopeCollection.includes("(")
                ) {
                    console.warn("Potentially incorrect bucket parsing:", {
                        statement: (request.statement || request.preparedText)?.substring(0, 100) + "...",
                        parsed: bucketScopeCollection,
                    });
                    // Use default for obviously wrong parsing
                    const correctedBSC = "_default._default._default";

                    if (request.plan) {
                        try {
                            // Parse the plan JSON string
                            const planObj =
                                typeof request.plan === "string"
                                    ? JSON.parse(request.plan)
                                    : request.plan;

                            if (planObj && planObj["#operator"]) {
                                extractIndexNames(planObj, indexData, correctedBSC);
                            }
                        } catch (e) {
                            console.error("Error parsing plan JSON:", e, request.plan);
                        }
                    }
                } else {
                    if (request.plan) {
                        try {
                            // Parse the plan JSON string
                            const planObj =
                                typeof request.plan === "string"
                                    ? JSON.parse(request.plan)
                                    : request.plan;

                            if (planObj && planObj["#operator"]) {
                                extractIndexNames(planObj, indexData, bucketScopeCollection);
                            }
                        } catch (e) {
                            console.error("Error parsing plan JSON:", e, request.plan);
                        }
                    }
                }
            });

            const sortedIndexes = Object.entries(indexData).sort(
                ([, a], [, b]) => b.count - a.count
            );
            
            // Debug: Log Dashboard indexes for JOIN queries
            Logger.debug(`[DASHBOARD DEBUG] Total indexes found in Dashboard table: ${sortedIndexes.length}`);
            const joinIndexes = sortedIndexes.filter(([key, data]) => {
                // Check if any request using this index is a JOIN
                return requests.some(req => {
                    const stmt = req.statement || req.preparedText || '';
                    return stmt.toUpperCase().includes('JOIN');
                });
            });
            Logger.debug(`[DASHBOARD DEBUG] Indexes from JOIN queries (first 10):`, 
                joinIndexes.slice(0, 10).map(([key, data]) => `${hashCompositeKey(key)} (count: ${data.count})`));

            const tbody = document.getElementById("index-count-body");
            tbody.innerHTML = "";

            // Use DocumentFragment for smooth rendering with caps
            const fragment = document.createDocumentFragment();
            const maxDisplayIndexes = 200; // Cap for performance
            const indexesToShow = sortedIndexes.slice(0, maxDisplayIndexes);

            indexesToShow.forEach(([compositeKey, data]) => {
                const row = document.createElement("tr");
                row.style.borderBottom = "1px solid #eee";

                // Apply count thresholding
                const displayCount = data.count > 99999 ? "99K+" : data.count;
                
                // Extract index name from composite key or use indexName property
                const indexName = data.indexName || compositeKey.split('::')[0];

                row.innerHTML = `
              <td class="padding-8 text-align-center" style="font-weight: bold;">${displayCount}</td>
              <td class="padding-8" style="word-break: break-word;">
                ${indexName}
                <button onclick="copyToClipboard('${indexName.replace(
                    /'/g,
                    "\\'"
                )}', event)" 
                        class="btn-standard" style="margin-left: 8px;">
                  Copy
                </button>
              </td>
              <td class="padding-8 font-size-12" style="word-break: break-word; font-family: monospace;">
                ${data.bucketScopeCollection}
              </td>
            `;
                fragment.appendChild(row);
            });

            tbody.appendChild(fragment);

            // Add notice if indexes were capped
            if (sortedIndexes.length > maxDisplayIndexes) {
                const noticeRow = document.createElement("tr");
                noticeRow.innerHTML = `<td colspan="3" style="text-align: center; color: #666; font-style: italic; padding: 10px;">${TEXT_CONSTANTS.SHOWING_TOP} ${maxDisplayIndexes} ${TEXT_CONSTANTS.OF_TOTAL} ${sortedIndexes.length} ${TEXT_CONSTANTS.INDEXES}</td>`;
                tbody.appendChild(noticeRow);
            }
        }

// ============================================================
// TABLE: filterEveryQueryData
// ============================================================

        function filterEveryQueryData(data) {
            return data.filter((rowData) => {
                // Filter by statement
                if (currentStatementFilter) {
                const combined = (
                    ((rowData.request && rowData.request.statement) || "") +
                " " +
                    ((rowData.request && rowData.request.preparedText) || "")
                    ).toLowerCase();
                    if (!combined.includes(currentStatementFilter.toLowerCase())) {
                        return false;
                    }
                }

                // Filter by username
                if (currentUsernameFilter) {
                    const users = (rowData.users || "").toLowerCase();
                    if (!users.includes(currentUsernameFilter.toLowerCase())) {
                        return false;
                    }
                }

                return true;
            });
        }

// ============================================================
// TABLE: populateEveryQueryTable
// ============================================================

        function populateEveryQueryTable(data) {
            const tableBody = document.getElementById("table-body");
            tableBody.innerHTML = "";

            // Clear statement store for new data (only for current page)
            statementStore = {};

            // Pagination: get only the current page data
            const start = (currentPage - 1) * pageSize;
            const end = Math.min(start + pageSize, data.length);
            const pageData = data.slice(start, end);

            // Use DocumentFragment for batch DOM insertion
            const fragment = document.createDocumentFragment();

            pageData.forEach((rowData, pageIndex) => {
                const globalIndex = start + pageIndex;
                const row = document.createElement("tr");

                EVERY_QUERY_COLUMNS.forEach((colConfig) => {
                    const td = document.createElement("td");
                    const value = rowData[colConfig.id];

                    // Apply custom rendering if defined
                    if (colConfig.render) {
                        const rendered = colConfig.render(value, td, rowData, globalIndex);
                        if (typeof rendered === 'string') {
                            td.innerHTML = rendered;
                        } else {
                            td.textContent = rendered;
                        }
                    } else {
                        td.textContent = value;
                    }

                    // Apply special CSS classes based on column ID
                    if (colConfig.id === 'requestTime') {
                        td.className = 'td-request-time';
                    } else if (colConfig.id === 'requestId') {
                        td.className = 'td-request-id';
                    } else if (colConfig.id === 'statement') {
                        td.className = 'td-statement';
                    }

                    row.appendChild(td);
                });

                row.addEventListener("click", (event) => {
                    // Allow text selection - only handle clicks, not text selection
                    if (window.getSelection().toString().length > 0) {
                        return;
                    }

                    document
                        .querySelectorAll("tr")
                        .forEach((r) => (r.style.backgroundColor = ""));
                    row.style.backgroundColor = "#e0e0e0";
                    generateFlowDiagram(rowData.request);
                });
                fragment.appendChild(row);
            });

            // Batch insert all rows at once
            tableBody.appendChild(fragment);

            // Auto-render the first row's flow diagram once (initial load or when diagram is empty)
            try {
                const flowEl = document.getElementById("flow-diagram");
                const shouldAuto = flowEl && (!flowEl.hasChildNodes() || flowEl.children.length === 0 || (flowEl.textContent || "").trim() === (TEXT_CONSTANTS.SELECT_QUERY_FLOW || ""));
                if (shouldAuto && pageData.length > 0) {
                    generateFlowDiagram(pageData[0].request);
                    if (tableBody.firstElementChild) {
                        tableBody.firstElementChild.style.backgroundColor = "#e0e0e0";
                    }
                }
            } catch (e) { /* no-op */ }

            // Add pagination controls
            addPaginationControls(data.length);
        }

// ============================================================
// TABLE: updateSampleQueriesTable
// ============================================================

        function updateSampleQueriesTable() {
            const tbody = document.getElementById('sample-queries-tbody');
            if (!tbody) return;
            
            tbody.innerHTML = '';
            
            Logger.debug(`[updateSampleQueriesTable] Updating inefficient-index-scans with ${sampleQueries.length} queries, currentTimezone=${currentTimezone}`);
            
            sampleQueries.forEach((query, index) => {
                // Apply timezone conversion to requestTime
                const originalTime = query.requestTime || "";
                const convertedDate = getChartDate(originalTime);
                const formattedDate = convertedDate ? convertedDate.toISOString().replace('T', ' ').substring(0, 23) + 'Z' : originalTime;
                
                Logger.trace(`[updateSampleQueriesTable] Query ${index}: Original=${originalTime}, Converted=${formattedDate}`);
                
                const statementId = `sample-statement-${index}`;
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
                            <button onclick="toggleSampleStatement('${statementId}', true)" 
                                    class="btn-standard" style="margin-top: 5px; margin-right: 5px;">${TEXT_CONSTANTS.SHOW_MORE}</button>
                            <button onclick="copySampleStatement('${statementId}', event)" 
                                    class="btn-standard" style="margin-top: 5px;">${TEXT_CONSTANTS.COPY}</button>
                        </div>
                        <div id="${statementId}-full" style="display: none;">
                            <span>${escapeHtml(query.statement)}</span>
                            <br>
                            <button onclick="toggleSampleStatement('${statementId}', false)" 
                                    class="btn-standard" style="margin-top: 5px; margin-right: 5px;">${TEXT_CONSTANTS.HIDE}</button>
                            <button onclick="copySampleStatement('${statementId}', event)" 
                                    class="btn-standard" style="margin-top: 5px;">${TEXT_CONSTANTS.COPY}</button>
                        </div>
                    `;
                } else {
                    statementCell.innerHTML = `
                        <div>
                            <span>${escapeHtml(query.statement)}</span>
                            <br>
                            <button onclick="copySampleStatement('${statementId}', event)" 
                                    class="btn-standard" style="margin-top: 5px;">${TEXT_CONSTANTS.COPY}</button>
                        </div>
                    `;
                }
                
                row.appendChild(dateCell);
                row.appendChild(statementCell);
                tbody.appendChild(row);
            });
        }

// ============================================================
// TABLE: updateTimeoutQueriesTable
// ============================================================

        function updateTimeoutQueriesTable(actualTimeouts, approachingTimeouts) {
            const tbody = document.getElementById('timeout-prone-queries-sample-queries-tbody');
            if (!tbody) return;
            
            tbody.innerHTML = '';
            timeoutQueriesData.actualTimeouts = actualTimeouts;
            timeoutQueriesData.approachingTimeouts = approachingTimeouts;
            
            // First add actual timeouts (up to 5)
            actualTimeouts.forEach((query, index) => {
                const row = createTimeoutQueryRow(query, index, 'actual');
                row.style.backgroundColor = '#ffebee'; // Light red background for timeouts
                tbody.appendChild(row);
            });
            
            // Then add approaching timeouts (up to 5)
            approachingTimeouts.forEach((query, index) => {
                const row = createTimeoutQueryRow(query, index + actualTimeouts.length, 'approaching');
                row.style.backgroundColor = '#fff3e0'; // Light orange background for approaching
                tbody.appendChild(row);
            });
        }

// ============================================================
// EXPORTS
// ============================================================

export {
    generateTable,
    generateAnalysisTable,
    generateUserCountTable,
    generateIndexCountTable,
    filterEveryQueryData,
    populateEveryQueryTable,
    updateSampleQueriesTable,
    updateTimeoutQueriesTable
};

// Expose globally for backward compatibility
window.generateTable = generateTable;
window.generateAnalysisTable = generateAnalysisTable;
window.generateUserCountTable = generateUserCountTable;
window.generateIndexCountTable = generateIndexCountTable;
window.filterEveryQueryData = filterEveryQueryData;
window.populateEveryQueryTable = populateEveryQueryTable;
window.updateSampleQueriesTable = updateSampleQueriesTable;
window.updateTimeoutQueriesTable = updateTimeoutQueriesTable;

console.log('✅ tables.js module loaded');
