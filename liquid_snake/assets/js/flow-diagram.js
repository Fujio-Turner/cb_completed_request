// ============================================================
// FLOW-DIAGRAM.JS - Flow Visualization Module
// ============================================================
// This module handles Index/Query flow diagram generation.
// 
// Dependencies:
// - base.js (Logger, TEXT_CONSTANTS)
// - data-layer.js (data access)
// - ui-helpers.js (formatting)
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import { Logger, TEXT_CONSTANTS, isDevMode } from './base.js';
import { 
    originalRequests,
    statementStore,
    parseTime,
    normalizeStatement,
    getOperators,
    deriveStatementType
} from './data-layer.js';
import { 
    formatNumber,
    escapeHtml
} from './ui-helpers.js';

// ============================================================
// FLOW DIAGRAM FUNCTIONS
// ============================================================


// ============================================================
// FLOW: buildIndexQueryFlow
// ============================================================

        function buildIndexQueryFlow(requests = null) {
            // Use provided requests or fall back to original requests
            const requestsToUse = requests || originalRequests;



            if (!requestsToUse || requestsToUse.length === 0) {

                return;
            }

            // Check if Index/Query Flow tab is currently visible using jQuery UI tabs
            const activeTabIndex = $("#tabs").tabs("option", "active");
            const indexQueryFlowTabIndex = 5; // Index/Query Flow is the 6th tab (0-indexed)



            // Always clear first to ensure clean state
            clearIndexQueryFlow();

            // Process data but skip DOM rendering when tab is hidden
            if (activeTabIndex !== indexQueryFlowTabIndex) {

                processIndexQueryData(requestsToUse);
                return;
            }



            // Step 1: Track which indexes each request uses (by request index)
            const requestIndexMap = new Map(); // requestIndex -> Set of index names

            let requestsWithPlans = 0;
            let requestsWithOperators = 0;
            requestsToUse.forEach((request, requestIndex) => {
                requestIndexMap.set(requestIndex, new Set());
                if (request.plan) {
                    requestsWithPlans++;

                    // Debug: Show the actual plan structure
                    if (requestIndex < 3) {
                        if (typeof request.plan === "string") {
                            try {
                                const parsedPlan = JSON.parse(request.plan);
                            } catch (e) { }
                        }
                    }

                    // Parse the plan JSON string if needed (same as Dashboard logic)
                    const planObj =
                        typeof request.plan === "string"
                            ? JSON.parse(request.plan)
                            : request.plan;

                    if (planObj && planObj["#operator"]) {
                        requestsWithOperators++;

                        // Get bucket.scope.collection from the statement for primary index resolution
                        const statement = request.preparedText || request.statement || "";
                        // Use parseFromClause to properly handle UPDATE, INSERT, DELETE, etc.
                        let bucketScopeCollection = parseFromClause(statement);
                        
                        // Debug: log when BSC is default
                        if (bucketScopeCollection === "_default._default._default" && statement.includes("conversations")) {
                            console.warn("[BSC DEBUG] Failed to parse BSC from statement containing 'conversations':", statement.substring(0, 200));
                        }

                        extractIndexUsage(
                            planObj,
                            requestIndex,
                            requestIndexMap,
                            bucketScopeCollection
                        );
                    }
                }
            });

            // Step 2: Build query groups and track which request indices belong to each group
            const queryGroups = new Map();
            requestsToUse.forEach((request, requestIndex) => {
                const stmt = request.preparedText || request.statement;
                const normalizedStatement = normalizeStatement(stmt);
                if (!queryGroups.has(normalizedStatement)) {
                    queryGroups.set(normalizedStatement, {
                        statement: stmt,
                        normalizedStatement,
                        count: 0,
                        totalDuration: 0,
                        requestIndices: [],
                        scanConsistencies: [] // non-unbounded values only
                    });
                }
                const group = queryGroups.get(normalizedStatement);
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
                group.requestIndices.push(requestIndex);
            });

            // Step 3: Build final index data and connections using request indices
            const allIndexes = new Map();
            let connectionCount = 0;

            queryGroups.forEach((queryGroup, queryKey) => {
                queryGroup.requestIndices.forEach((requestIndex) => {
                    const indexesForRequest = requestIndexMap.get(requestIndex);

                    if (indexesForRequest && indexesForRequest.size > 0) {
                        indexesForRequest.forEach((compositeKey) => {
                            // compositeKey is already "indexName::bucket.scope.collection" from recordIndexUsage
                            const indexKey = compositeKey;
                            const [indexName, currentBSC] = compositeKey.split("::");
                            
                            if (!indexName || !currentBSC) return; // Skip malformed keys
                            
                            // Track index usage per bucket.scope.collection combination
                            if (!allIndexes.has(indexKey)) {
                                const isPrimaryCheck = indexName === "#primary" ||
                                    indexName.includes("#primary") ||
                                    indexName.includes("primary") ||
                                    indexName.endsWith("_primary");

                                allIndexes.set(indexKey, {
                                    name: indexName,
                                    totalUsage: 0,
                                    isPrimary: isPrimaryCheck,
                                    scanTimes: [],
                                    itemsScanned: [],
                                    itemsFetched: [],
                                    bucketScopeCollection: currentBSC,
                                });
                            }

                            const indexObj = allIndexes.get(indexKey);
                            indexObj.totalUsage++;

                            // Collect statistics from the request
                            const request = requestsToUse[requestIndex];
                            if (request) {
                                // Extract actual index scan service time and items data from plan data
                                const indexData = extractIndexScanDataFromPlan(request.plan, indexName);
                                if (indexData.scanTime > 0) {
                                    indexObj.scanTimes.push(indexData.scanTime);
                                }
                                // Push 0 values instead of skipping them - important for indexes that return no documents
                                if (indexData.itemsScanned !== undefined) {
                                    indexObj.itemsScanned.push(indexData.itemsScanned);
                                }
                                if (indexData.itemsFetched !== undefined) {
                                    indexObj.itemsFetched.push(indexData.itemsFetched);
                                }
                            }

                            // Track connection (use composite indexKey for bucket-specific connections)
                            const connectionKey = `${queryGroup.normalizedStatement}::${indexKey}`;
                            if (!indexQueryFlowData.connections.has(connectionKey)) {
                                indexQueryFlowData.connections.set(connectionKey, {
                                    queryStatement: queryGroup.normalizedStatement,
                                    indexKey: indexKey, // Store composite key
                                    indexName: indexName,
                                    bucketScopeCollection: currentBSC,
                                    count: 0,
                                });
                            }
                            indexQueryFlowData.connections.get(connectionKey).count++;
                            connectionCount++;
                        });
                    }
                });
            });

            // Convert to sorted arrays and filter out indexes with no real usage data
            const allIndexesArray = Array.from(allIndexes.values());
            console.log(`[BUILD DEBUG] Total indexes before filter: ${allIndexesArray.length}`);
            
            const sortedIndexes = allIndexesArray
                .filter(index => {
                    // Show indexes that have usage count OR performance data
                    // Removed strict stats requirement to handle JOINs where extractIndexScanDataFromPlan may not find all index details
                    const hasUsage = index.totalUsage > 0;
                    const hasStats = index.scanTimes.length > 0 || index.itemsScanned.length > 0 || index.itemsFetched.length > 0;
                    
                    if (!hasUsage && !hasStats) {
                        console.log(`[BUILD DEBUG] Filtered OUT ${hashCompositeKey(index.name + '::' + index.bucketScopeCollection)}: no usage or stats`);
                    }
                    
                    return hasUsage || hasStats;
                })
                .sort((a, b) => b.totalUsage - a.totalUsage);
            const sortedQueries = Array.from(queryGroups.values()).sort(
                (a, b) => b.count - a.count
            );
            
            // Debug: Show all indexes passed to renderIndexQueryFlow
            console.log(`[BUILD DEBUG] Total sortedIndexes passed to renderIndexQueryFlow: ${sortedIndexes.length}`);
            const joinRelatedIndexes = sortedIndexes.filter(idx => 
                idx.bucketScopeCollection && idx.bucketScopeCollection.split('.')[0] === 'HASH6'
            );
            console.log(`[BUILD DEBUG] Indexes for HASH6 bucket:`, joinRelatedIndexes.map(idx => 
                `${hashCompositeKey(idx.name + '::' + idx.bucketScopeCollection)} (scanned: ${idx.totalUsage})`
            ));



            indexQueryFlowData.queries = new Map(
                sortedQueries.map((q) => [q.normalizedStatement, q])
            );


            renderIndexQueryFlow(sortedIndexes, sortedQueries);
        }

// ============================================================
// EXPORTS
// ============================================================

export {
    buildIndexQueryFlow
};

// Expose globally for backward compatibility
window.buildIndexQueryFlow = buildIndexQueryFlow;

console.log('✅ flow-diagram.js module loaded');

// Note: Additional flow diagram generation functions:
// - generateFlowDiagram (line 2020)
// - generateFlowDiagram_New (line 1827) 
// - generateFlowDiagram_Original (line 1927)
// These are called from modal dialogs and will be extracted in next iteration
