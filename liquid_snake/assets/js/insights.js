// ============================================================
// INSIGHTS.JS - Automated Analysis Module
// ============================================================
// This module handles the Insights tab logic and automated analysis.
// ============================================================

import { Logger, TEXT_CONSTANTS } from './base.js';
import { 
    originalRequests,
    parseTime,
    deriveStatementType
} from './data-layer.js';
import { 
    formatNumber,
    formatDuration,
    copyToClipboard
} from './ui-helpers.js';

// ============================================================
// INSIGHTS FUNCTIONS
// ============================================================


// ============================================================
// INSIGHT: updateInsights
// ============================================================

        function updateInsights(requests) {
            Logger.debug(`[updateInsights] Called with ${requests.length} requests, currentTimezone=${currentTimezone}`);
            
            // Reset metrics tracking
            window.inefficientScanMetrics = [];

            // Count queries with no WHERE clauses
            let noWhereCount = 0;
            let slowUseKeysCount = 0;
            let slowUseKeysTotalTime = 0;
            let largeResultsCount = 0;
            let largeResultsTotalMB = 0;
            let inefficientLikeCount = 0;
            let selectStarCount = 0;
            let inefficientIndexScansCount = 0;
            let paginationOverfetchCount = 0;
            let paginationOverfetchTotalScanned = 0;
            let highMemoryCount = 0;
            let highMemoryTotalGB = 0;
            let highKernelTimeQueriesCount = 0;
            let totalCoreKernelRatio = 0;
            let largePayloadStreamingCount = 0;
            let largePayloadTotalResultSize = 0;
            let largePayloadTotalStreamRatio = 0;
            let approachingTimeoutCount = 0;
            let actualTimeoutCount = 0;
            let slowParsePlanCount = 0;
            let slowParsePlanTotalParseTime = 0;
            let slowParsePlanTotalPlanTime = 0;
            
            // JOIN operations metrics
            let joinQueriesCount = 0;
            let joinQueriesWithIssuesCount = 0;
            let joinPhaseTotalTime = 0;

            // Concurrent Conflicts metrics
            let concurrentConflictsCount = 0;
            let concurrentConflictsSamples = [];
            const flagCounts = {
                A: { count: 0, name: 'Query Service Warning', queries: [] },
                B: { count: 0, name: 'Query Service Critical', queries: [] },
                C: { count: 0, name: 'Data Service Warning', queries: [] },
                D: { count: 0, name: 'Data Service Critical', queries: [] },
                E: { count: 0, name: 'Index Service Warning', queries: [] },
                F: { count: 0, name: 'Index Service Critical', queries: [] },
                G: { count: 0, name: 'CPU Contention', queries: [] },
                H: { count: 0, name: 'System-Wide Pressure', queries: [] }
            };
            const servicesUnderPressure = {
                'Query Service': 0,
                'Data Service': 0,
                'Index Service': 0,
                'CPU/OS': 0
            };

            // Sample queries arrays for insights
            let complexJoinOperationsSamples = [];
            let missingWhereClausesSamples = [];
            let slowUseKeyQueriesSamples = [];
            let largeResultSetQueriesSamples = [];
            let inefficientLikeOperationsSamples = [];
            let selectStarUsageSamples = [];
            let highMemoryUsageSamples = [];
            let highKernelTimeQueriesSamples = [];
            let largePayloadStreamingSamples = [];
            let actualTimeoutsSamples = [];
            let approachingTimeoutsSamples = [];
            let paginationOverfetchSamples = [];
            let slowParsePlanSamples = [];

            // Configurable threshold for kernel time detection
            const KERNEL_TIME_THRESHOLD_PERCENT = 20;
            const STREAM_KERNEL_THRESHOLD_PERCENT = 10;

            // Concurrent Conflicts thresholds (Service Pressure Detection)
            const CONCURRENT_CONFLICT_THRESHOLDS = {
                // Query Service (Parse + Plan) pressure
                PARSE_PLAN_WARNING_MS: 1,
                PARSE_PLAN_CRITICAL_MS: 10,
                
                // Data Service (Fetch) pressure - per-document timing
                FETCH_PER_DOC_WARNING_MS: 5,
                FETCH_PER_DOC_CRITICAL_MS: 10,
                MIN_FETCH_COUNT_FOR_ANALYSIS: 10,
                
                // Index Service pressure - throughput analysis
                INDEX_SCAN_WARNING_RATE: 5000,
                INDEX_SCAN_CRITICAL_RATE: 1000,
                MIN_INDEX_SCAN_FOR_ANALYSIS: 100,
                
                // CPU contention (Kernel time)
                KERNEL_TIME_WARNING_RATIO: 0.30,
                KERNEL_TIME_CRITICAL_RATIO: 0.50,
                
                // Multi-service pressure indicator
                MIN_SERVICES_UNDER_PRESSURE: 2,
                
                // Reporting
                TOP_AFFECTED_QUERIES: 10
            };

            requests.forEach((request) => {
                const statement = (request.statement || request.preparedText || "").toUpperCase();
                const elapsedTime = parseTime(request.elapsedTime);
                const elapsedTimeSeconds = elapsedTime / 1000; // Convert to seconds
                const state = (request.state || "").toLowerCase();

                // Count timeout-prone queries
                // Approaching timeout: 1 minute (60s) to 1m15s (75s) AND state is "completed"
                if (elapsedTimeSeconds >= 60 && elapsedTimeSeconds <= 75 && state === "completed") {
                    approachingTimeoutCount++;
                    if (approachingTimeoutsSamples.length < 5 && 
                        !approachingTimeoutsSamples.some(s => s.statement === (request.preparedText || request.statement))) {
                        approachingTimeoutsSamples.push({
                            requestTime: request.requestTime,
                            statement: request.preparedText || request.statement,
                            elapsedTime: request.elapsedTime
                        });
                    }
                }
                
                // Actual timeout: 1m14s (74s) to 1m16s (76s) AND state is "fatal"  
                if (elapsedTimeSeconds >= 74 && elapsedTimeSeconds <= 76 && state === "fatal") {
                    actualTimeoutCount++;
                    if (actualTimeoutsSamples.length < 5 && 
                        !actualTimeoutsSamples.some(s => s.statement === (request.preparedText || request.statement))) {
                        actualTimeoutsSamples.push({
                            requestTime: request.requestTime,
                            statement: request.preparedText || request.statement,
                            elapsedTime: request.elapsedTime
                        });
                    }
                }

                // Count missing WHERE clauses
                // Use consolidated function to check for filtering mechanisms (WHERE or USE KEYS)
                // If this is EXECUTE, evaluate WHERE on preparedText (actual statement) when present
                // Skip EXECUTE statements without preparedText (they reference prepared statements we can't analyze)
                const isExecuteStmt = (request.statement || '').toUpperCase().startsWith('EXECUTE');
                const stmtForWhere = (isExecuteStmt && request.preparedText)
                    ? request.preparedText
                    : (request.statement || request.preparedText);
                
                // Only check for missing WHERE if not an EXECUTE without preparedText
                if (!(isExecuteStmt && !request.preparedText) && !hasFilteringMechanism(stmtForWhere)) {
                    noWhereCount++;
                    if (missingWhereClausesSamples.length < 5 && 
                        !missingWhereClausesSamples.some(s => s.statement === (request.preparedText || request.statement))) {
                        missingWhereClausesSamples.push({
                            requestTime: request.requestTime,
                            statement: request.preparedText || request.statement
                        });
                    }
                }

                // Count slow USE KEYS queries (> 1 second)
                if (statement.includes("USE KEYS")) {
                    const elapsedTime = parseTime(request.elapsedTime);
                    if (elapsedTime > 1000) { // 1 second = 1000ms
                        slowUseKeysCount++;
                        slowUseKeysTotalTime += elapsedTime;
                        if (slowUseKeyQueriesSamples.length < 5 && 
                            !slowUseKeyQueriesSamples.some(s => s.statement === (request.preparedText || request.statement))) {
                            slowUseKeyQueriesSamples.push({
                                requestTime: request.requestTime,
                                statement: request.preparedText || request.statement
                            });
                        }
                    }
                }

                // Count large result size queries (> 5MB)
                const resultSize = request.resultSize || 0;
                const resultSizeMB = resultSize / (1024 * 1024); // Convert bytes to MB
                if (resultSizeMB > 5) {
                    largeResultsCount++;
                    largeResultsTotalMB += resultSizeMB;
                    if (largeResultSetQueriesSamples.length < 5 && 
                        !largeResultSetQueriesSamples.some(s => s.statement === (request.preparedText || request.statement))) {
                        largeResultSetQueriesSamples.push({
                            requestTime: request.requestTime,
                            statement: request.preparedText || request.statement
                        });
                    }
                }

                // Count inefficient LIKE operations with leading wildcards
                if (statement.toUpperCase().includes(" LIKE ")) {
                    // Look for patterns like LIKE '%text' or LIKE "%text"
                    const likeMatches = statement.match(/ LIKE\s+['"]%[^'"]*['"]?/gi);
                    if (likeMatches && likeMatches.length > 0) {
                        inefficientLikeCount++;
                        if (inefficientLikeOperationsSamples.length < 5 && 
                            !inefficientLikeOperationsSamples.some(s => s.statement === (request.preparedText || request.statement))) {
                            inefficientLikeOperationsSamples.push({
                                requestTime: request.requestTime,
                                statement: request.preparedText || request.statement
                            });
                        }
                    }
                }

                // Count SELECT * usage (matches SELECT * FROM or SELECT *, field FROM, not qualified wildcards like c.*)
                const selectStarMatch = statement.match(/SELECT\s+\*[\s,]/i);
                if (selectStarMatch) {
                    selectStarCount++;
                    if (selectStarUsageSamples.length < 5 &&
                        !selectStarUsageSamples.some(s => s.statement === (request.preparedText || request.statement))) {
                        selectStarUsageSamples.push({
                            requestTime: request.requestTime,
                            statement: request.preparedText || request.statement
                        });
                    }
                }

                // Count high memory usage queries (>= 1GB)
                const usedMemory = request.usedMemory || 0;
                const usedMemoryGB = usedMemory / (1024 * 1024 * 1024); // Convert bytes to GB
                if (usedMemoryGB >= 1) {
                    highMemoryCount++;
                    highMemoryTotalGB += usedMemoryGB;
                    if (highMemoryUsageSamples.length < 5 && 
                        !highMemoryUsageSamples.some(s => s.statement === (request.preparedText || request.statement))) {
                        highMemoryUsageSamples.push({
                            requestTime: request.requestTime,
                            statement: request.preparedText || request.statement
                        });
                    }
                }

                // Analyze core execTime vs kernel time (two-stage check)
                if (request.plan) {
                    try {
                        const planObj = typeof request.plan === "string" ? JSON.parse(request.plan) : request.plan;
                        const elapsedTimeMs = parseTime(request.elapsedTime);

                        // Stage 1: Check if kernTime is at least 50% of elapsedTime
                        const kernTimeAnalysis = calculateTotalKernTime(request.plan);
                        const kernToElapsedRatio = elapsedTimeMs > 0 ? (kernTimeAnalysis / elapsedTimeMs) * 100 : 0;

                        if (kernToElapsedRatio >= 50) {
                            // Stage 2: Analyze core execTime vs kernel time ratio
                            const coreKernelAnalysis = analyzeCoreExecToKernelRatio(planObj);

                            // If core execTime is 50%+ of kernel time, flag as high kernel time
                            if (coreKernelAnalysis.coreToKernelRatio >= 50) {
                                highKernelTimeQueriesCount++;
                                totalCoreKernelRatio += coreKernelAnalysis.coreToKernelRatio;
                                if (highKernelTimeQueriesSamples.length < 5 && 
                                    !highKernelTimeQueriesSamples.some(s => s.statement === (request.preparedText || request.statement))) {
                                    highKernelTimeQueriesSamples.push({
                                        requestTime: request.requestTime,
                                        statement: request.preparedText || request.statement
                                    });
                                }
                            }
                        }
                    } catch (e) {
                        console.error("Error parsing plan for kernel time analysis:", e);
                    }
                }
                
                // Detect JOIN operations (Beta - full flag detection A-H)
                const hasJoin = /\b(INNER\s+JOIN|LEFT\s+(OUTER\s+)?JOIN|RIGHT\s+(OUTER\s+)?JOIN|CROSS\s+JOIN|JOIN\b)/i.test(statement);
                if (hasJoin) {
                    joinQueriesCount++;
                    
                    // Get JOIN phase metrics
                    const joinPhaseTime = request.phaseTimes?.join || 0;
                    const joinPhaseTimeMs = parseTime(joinPhaseTime);
                    if (joinPhaseTimeMs > 0) {
                        joinPhaseTotalTime += joinPhaseTimeMs;
                    }
                    
                    const elapsedTimeMs = parseTime(request.elapsedTime);
                    const primaryScanCount = request.phaseCounts?.primaryScan || 0;
                    const joinCount = request.phaseCounts?.join || 0;
                    const indexScanCount = request.phaseCounts?.indexScan || 0;
                    const fetchCount = request.phaseCounts?.fetch || 0;
                    const unnestCount = request.phaseCounts?.unnest || 0;
                    const resultCount = request.resultCount || 0;
                    
                    // Calculate input docs (before JOIN)
                    const inputDocs = indexScanCount + fetchCount + primaryScanCount;
                    const explosionRatio = inputDocs > 0 ? resultCount / inputDocs : 0;
                    
                    // Count JOIN keywords in statement
                    const joinKeywordCount = (statement.match(/\bJOIN\b/gi) || []).length;
                    
                    // Calculate JOIN time ratio
                    const joinTimeRatio = elapsedTimeMs > 0 ? joinPhaseTimeMs / elapsedTimeMs : 0;
                    
                    // Detect complexity flags (A-H)
                    const flags = [];
                    const flagDetails = {};
                    
                    // FLAG A: Primary Scan in JOIN (Critical)
                    if (primaryScanCount > 0) {
                        flags.push('A');
                        flagDetails.A = `Primary Scan (${primaryScanCount.toLocaleString()} docs)`;
                    }
                    
                    // FLAG B: Cartesian Product (Critical)
                    if (/\bCROSS\s+JOIN\b/i.test(statement)) {
                        flags.push('B');
                        flagDetails.B = `CROSS JOIN detected`;
                    }
                    
                    // FLAG C: Data Explosion 2x-10x (High)
                    if (explosionRatio >= 2.0 && explosionRatio < 10.0) {
                        flags.push('C');
                        flagDetails.C = `${explosionRatio.toFixed(1)}x explosion (${inputDocs} → ${resultCount})`;
                    }
                    
                    // FLAG D: Severe Data Explosion 10x+ (Critical)
                    if (explosionRatio >= 10.0) {
                        flags.push('D');
                        flagDetails.D = `${explosionRatio.toFixed(1)}x explosion (${inputDocs} → ${resultCount})`;
                    }
                    
                    // FLAG E: Slow JOIN Phase ≥2s (High)
                    if (joinPhaseTimeMs >= 2000) {
                        flags.push('E');
                        flagDetails.E = `JOIN took ${(joinPhaseTimeMs / 1000).toFixed(2)}s`;
                    }
                    
                    // FLAG F: High Document Processing ≥100K (High)
                    if (joinCount >= 100000) {
                        flags.push('F');
                        flagDetails.F = `${joinCount.toLocaleString()} docs processed`;
                    }
                    
                    // FLAG G: Multiple JOINs ≥4 (Medium)
                    if (joinKeywordCount >= 4) {
                        flags.push('G');
                        flagDetails.G = `${joinKeywordCount} JOIN operations`;
                    }
                    
                    // FLAG H: JOIN Time Dominant ≥30% (High)
                    if (joinTimeRatio >= 0.30) {
                        flags.push('H');
                        flagDetails.H = `JOIN is ${(joinTimeRatio * 100).toFixed(1)}% of query time`;
                    }
                    
                    // If any flags detected, this is a complex JOIN
                    if (flags.length > 0) {
                        joinQueriesWithIssuesCount++;
                    }
                    
                    // Add to sample queries (up to 5 unique) - collect ALL JOIN queries regardless of flags
                    if (complexJoinOperationsSamples.length < 5 &&
                        !complexJoinOperationsSamples.some(s => s.statement === request.statement)) {
                        complexJoinOperationsSamples.push({
                            requestTime: request.requestTime,
                            statement: request.statement,  // Use original statement, not preparedText
                            flags: flags,
                            flagDetails: flagDetails,
                            joinTime: joinPhaseTimeMs
                        });
                    }
                }

                // Detect Concurrent Query Conflicts (Service Pressure Analysis)
                const conflictFlags = [];
                const conflictFlagDetails = {};
                const requestServicesUnderPressure = new Set();
                
                // Step 1: Detect Query Service Pressure (Parse + Plan Time)
                const parseTimeMs = parseTime(request.phaseTimes?.parse || '0');
                const planTimeMs = parseTime(request.phaseTimes?.plan || '0');
                const parsePlanTime = parseTimeMs + planTimeMs;
                
                if (parsePlanTime >= CONCURRENT_CONFLICT_THRESHOLDS.PARSE_PLAN_CRITICAL_MS) {
                    conflictFlags.push('B');
                    conflictFlagDetails.B = `Parse+Plan took ${parsePlanTime.toFixed(2)}ms (critically slow, should be <1ms)`;
                    requestServicesUnderPressure.add('Query Service');
                } else if (parsePlanTime >= CONCURRENT_CONFLICT_THRESHOLDS.PARSE_PLAN_WARNING_MS) {
                    conflictFlags.push('A');
                    conflictFlagDetails.A = `Parse+Plan took ${parsePlanTime.toFixed(2)}ms (should be <1ms)`;
                    requestServicesUnderPressure.add('Query Service');
                }
                
                // Step 2: Detect Data Service Pressure (Fetch Time per Document)
                const fetchTimeMs = parseTime(request.phaseTimes?.fetch || '0');
                const fetchCount = request.phaseCounts?.fetch || 0;
                
                if (fetchCount >= CONCURRENT_CONFLICT_THRESHOLDS.MIN_FETCH_COUNT_FOR_ANALYSIS) {
                    const fetchPerDoc = fetchTimeMs / fetchCount;
                    
                    if (fetchPerDoc >= CONCURRENT_CONFLICT_THRESHOLDS.FETCH_PER_DOC_CRITICAL_MS) {
                        conflictFlags.push('D');
                        conflictFlagDetails.D = `Fetch ${fetchPerDoc.toFixed(2)}ms per doc (${fetchTimeMs}ms for ${fetchCount} docs) - critically slow`;
                        requestServicesUnderPressure.add('Data Service');
                    } else if (fetchPerDoc >= CONCURRENT_CONFLICT_THRESHOLDS.FETCH_PER_DOC_WARNING_MS) {
                        conflictFlags.push('C');
                        conflictFlagDetails.C = `Fetch ${fetchPerDoc.toFixed(2)}ms per doc (${fetchTimeMs}ms for ${fetchCount} docs)`;
                        requestServicesUnderPressure.add('Data Service');
                    }
                }
                
                // Step 3: Detect Index Service Pressure (Scan Throughput)
                const indexScanTimeMs = parseTime(request.phaseTimes?.indexScan || '0');
                const indexScanCount = request.phaseCounts?.indexScan || 0;
                
                if (indexScanCount >= CONCURRENT_CONFLICT_THRESHOLDS.MIN_INDEX_SCAN_FOR_ANALYSIS && indexScanTimeMs > 0) {
                    const recordsPerSecond = (indexScanCount / indexScanTimeMs) * 1000;
                    
                    if (recordsPerSecond <= CONCURRENT_CONFLICT_THRESHOLDS.INDEX_SCAN_CRITICAL_RATE) {
                        conflictFlags.push('F');
                        conflictFlagDetails.F = `Index scan ${Math.round(recordsPerSecond).toLocaleString()} records/sec (${indexScanCount.toLocaleString()} in ${indexScanTimeMs}ms) - critically slow`;
                        requestServicesUnderPressure.add('Index Service');
                    } else if (recordsPerSecond <= CONCURRENT_CONFLICT_THRESHOLDS.INDEX_SCAN_WARNING_RATE) {
                        conflictFlags.push('E');
                        conflictFlagDetails.E = `Index scan ${Math.round(recordsPerSecond).toLocaleString()} records/sec (${indexScanCount.toLocaleString()} in ${indexScanTimeMs}ms)`;
                        requestServicesUnderPressure.add('Index Service');
                    }
                }
                
                // Step 4: Detect CPU Contention (Kernel Time)
                const kernTimeMs = parseTime(request.phaseTimes?.kernTime || '0');
                const conflictElapsedTimeMs = parseTime(request.elapsedTime);
                
                if (conflictElapsedTimeMs > 0 && kernTimeMs > 0) {
                    const kernelRatio = kernTimeMs / conflictElapsedTimeMs;
                    
                    if (kernelRatio >= CONCURRENT_CONFLICT_THRESHOLDS.KERNEL_TIME_WARNING_RATIO) {
                        conflictFlags.push('G');
                        conflictFlagDetails.G = `Kernel time ${(kernelRatio * 100).toFixed(1)}% (${kernTimeMs}ms / ${conflictElapsedTimeMs}ms)`;
                        requestServicesUnderPressure.add('CPU/OS');
                    }
                }
                
                // Step 5: Flag System-Wide Pressure (Multiple services affected)
                if (requestServicesUnderPressure.size >= CONCURRENT_CONFLICT_THRESHOLDS.MIN_SERVICES_UNDER_PRESSURE) {
                    conflictFlags.push('H');
                    conflictFlagDetails.H = `${requestServicesUnderPressure.size} services under pressure: ${Array.from(requestServicesUnderPressure).join(', ')}`;
                }
                
                // If any flags detected, count as concurrent conflict
                if (conflictFlags.length > 0) {
                    concurrentConflictsCount++;
                    
                    // Update flag counts
                    conflictFlags.forEach(flag => {
                        flagCounts[flag].count++;
                        if (flagCounts[flag].queries.length < 10) {
                            flagCounts[flag].queries.push(request);
                        }
                    });
                    
                    // Update service pressure counts
                    requestServicesUnderPressure.forEach(service => {
                        servicesUnderPressure[service]++;
                    });
                    
                    // Add to sample queries (up to 10)
                    if (concurrentConflictsSamples.length < CONCURRENT_CONFLICT_THRESHOLDS.TOP_AFFECTED_QUERIES) {
                        concurrentConflictsSamples.push({
                            requestTime: request.requestTime,
                            statement: request.preparedText || request.statement,
                            flags: conflictFlags,
                            flagDetails: conflictFlagDetails,
                            parsePlanTime: parsePlanTime,
                            fetchPerDoc: fetchCount >= CONCURRENT_CONFLICT_THRESHOLDS.MIN_FETCH_COUNT_FOR_ANALYSIS ? fetchTimeMs / fetchCount : null,
                            indexScanRate: (indexScanCount >= CONCURRENT_CONFLICT_THRESHOLDS.MIN_INDEX_SCAN_FOR_ANALYSIS && indexScanTimeMs > 0) ? (indexScanCount / indexScanTimeMs) * 1000 : null,
                            kernelPercent: conflictElapsedTimeMs > 0 && kernTimeMs > 0 ? (kernTimeMs / conflictElapsedTimeMs) * 100 : null
                        });
                    }
                }

                // Check for slow parse/plan times (> 1ms)
                if (request.phaseTimes) {
                    const parseTimeMs = parseTime(request.phaseTimes.parse || '0');
                    const planTimeMs = parseTime(request.phaseTimes.plan || '0');
                    
                    if (parseTimeMs > 1 || planTimeMs > 1) {
                        slowParsePlanCount++;
                        slowParsePlanTotalParseTime += parseTimeMs;
                        slowParsePlanTotalPlanTime += planTimeMs;
                        if (slowParsePlanSamples.length < 5 && 
                            !slowParsePlanSamples.some(s => s.statement === (request.preparedText || request.statement))) {
                            slowParsePlanSamples.push({
                                requestTime: request.requestTime,
                                statement: request.preparedText || request.statement
                            });
                        }
                    }
                }

                // Analyze large payload streaming
                const payloadSize = request.resultSize || 0;
                const payloadSizeMB = payloadSize / (1024 * 1024); // Convert to MB

                if (payloadSizeMB >= 1) { // Result size >= 1MB
                    if (request.plan) {
                        try {
                            const planObj = typeof request.plan === "string" ? JSON.parse(request.plan) : request.plan;
                            const elapsedTimeMs = parseTime(request.elapsedTime);
                            const streamAnalysis = analyzeStreamToElapsedRatio(planObj, elapsedTimeMs, STREAM_KERNEL_THRESHOLD_PERCENT);

                            if (streamAnalysis.qualifies) {
                                largePayloadStreamingCount++;
                                largePayloadTotalResultSize += payloadSizeMB;
                                largePayloadTotalStreamRatio += streamAnalysis.streamRatio;
                                if (largePayloadStreamingSamples.length < 5 && 
                                    !largePayloadStreamingSamples.some(s => s.statement === (request.statement || request.preparedText))) {
                                    largePayloadStreamingSamples.push({
                                        requestTime: request.requestTime,
                                        statement: request.preparedText || request.statement
                                    });
                                }
                            }
                        } catch (e) {
                            console.error("Error analyzing large payload streaming:", e);
                        }
                    }
                }

                // Count inefficient index scans
                // Exclude mutation statements (MERGE, DELETE, INSERT, UPDATE, UPSERT) which may return [] on success
                const stmtType = (request.statementType || deriveStatementType(request.statement || request.preparedText) || '').toUpperCase();
                const isMutationStatement = stmtType === 'MERGE' || stmtType === 'DELETE' || stmtType === 'INSERT' || stmtType === 'UPDATE' || stmtType === 'UPSERT';
                // Check if query has aggregate functions (exclude them)
                const hasAggregates = /\b(COUNT|AVG|MIN|MAX|SUM)\s*\(/i.test(statement);

                if (!isMutationStatement && !hasAggregates) {
                    const resultCount = request.resultCount || 0;
                    const phaseCounts = request.phaseCounts || {};

                    // Check various types of index scans
                    let totalScanned = 0;
                    if (phaseCounts.primaryScan) totalScanned += phaseCounts.primaryScan;
                    if (phaseCounts.indexScan) totalScanned += phaseCounts.indexScan;
                    if (phaseCounts['primaryScan.GSI']) totalScanned += phaseCounts['primaryScan.GSI'];
                    if (phaseCounts['indexScan.GSI']) totalScanned += phaseCounts['indexScan.GSI'];

                    // Check if scanned >= 50,000 and efficiency < 10%
                    if (totalScanned >= 50000) {
                        const efficiency = totalScanned > 0 ? (resultCount / totalScanned) * 100 : 0;
                        if (efficiency < 10) {
                            inefficientIndexScansCount++;
                            // Track metrics for average calculation
                            if (!window.inefficientScanMetrics) window.inefficientScanMetrics = [];
                            window.inefficientScanMetrics.push({
                                scanned: totalScanned,
                                resultCount: resultCount,
                                selectivity: efficiency
                            });
                        }
                    }
                }

                // Detect pagination index over-scan for ORDER BY + LIMIT + OFFSET
                const hasOrderBy = statement.includes(" ORDER BY ");
                const hasLimit = statement.includes(" LIMIT ");
                const hasOffset = statement.includes(" OFFSET ");
                if (hasOrderBy && hasLimit && hasOffset) {
                    const pc = request.phaseCounts || {};
                    const primaryCount = Math.max(pc.primaryScan || 0, pc['primaryScan.GSI'] || 0);
                    const indexCount = Math.max(pc.indexScan || 0, pc['indexScan.GSI'] || 0);
                    const scanned = Math.max(primaryCount, indexCount);
                    if (scanned >= 10000) {
                        paginationOverfetchCount++;
                        paginationOverfetchTotalScanned += scanned;
                        if (paginationOverfetchSamples.length < 5 &&
                            !paginationOverfetchSamples.some(s => s.statement === (request.preparedText || request.statement))) {
                            paginationOverfetchSamples.push({
                                requestTime: request.requestTime,
                                statement: request.preparedText || request.statement
                            });
                        }
                    }
                }
            });

            const totalQueries = requests.length;
            const noWherePercent = totalQueries > 0 ? ((noWhereCount / totalQueries) * 100).toFixed(1) : 0;

            // Update the missing WHERE clauses insight
            const missingWhereCountElement = document.getElementById("missing-where-count");
            const missingWherePercentElement = document.getElementById("missing-where-percent");

            if (missingWhereCountElement && missingWherePercentElement) {
                missingWhereCountElement.textContent = `${noWhereCount} queries`;
                missingWherePercentElement.textContent = `${noWherePercent}%`;

                // Only highlight if there are issues
                if (noWhereCount > 0) {
                    missingWhereCountElement.className = "highlight-number";
                    missingWherePercentElement.className = "highlight-number";
                } else {
                    missingWhereCountElement.className = "";
                    missingWherePercentElement.className = "";
                }
            }

            // Update the slow USE KEYS queries insight
            const slowUseKeysCountElement = document.getElementById("slow-use-keys-count");
            const avgUseKeysTimeElement = document.getElementById("avg-use-keys-time");

            if (slowUseKeysCount > 0) {
                const avgUseKeysTime = slowUseKeysTotalTime / slowUseKeysCount;

                if (slowUseKeysCountElement) {
                    slowUseKeysCountElement.textContent = `${slowUseKeysCount} USE KEY queries`;
                    slowUseKeysCountElement.className = "highlight-number";
                }
                if (avgUseKeysTimeElement) {
                    avgUseKeysTimeElement.textContent = formatTime(avgUseKeysTime);
                    avgUseKeysTimeElement.className = "highlight-number";
                }
                const slowUseKeysPercentElement = document.getElementById("slow-use-keys-percent");
                if (slowUseKeysPercentElement) {
                    const slowUseKeysPercent = totalQueries > 0 ? ((slowUseKeysCount / totalQueries) * 100).toFixed(1) : 0;
                    slowUseKeysPercentElement.textContent = `${slowUseKeysPercent}%`;
                    slowUseKeysPercentElement.className = "highlight-number";
                }
            } else {
                // Reset to defaults
                if (slowUseKeysCountElement) {
                    slowUseKeysCountElement.textContent = "0 USE KEY queries";
                    slowUseKeysCountElement.className = "";
                }
                if (avgUseKeysTimeElement) {
                    avgUseKeysTimeElement.textContent = "0ms";
                    avgUseKeysTimeElement.className = "";
                }
                const slowUseKeysPercentElement = document.getElementById("slow-use-keys-percent");
                if (slowUseKeysPercentElement) {
                    slowUseKeysPercentElement.textContent = "0%";
                    slowUseKeysPercentElement.className = "";
                }
            }

            // Update the large result sets insight
            const largeResultsCountElement = document.getElementById("large-results-count");
            const avgLargeResultSizeElement = document.getElementById("avg-large-result-size");

            if (largeResultsCount > 0) {
                const avgLargeResultSize = (largeResultsTotalMB / largeResultsCount).toFixed(1);

                if (largeResultsCountElement) {
                    largeResultsCountElement.textContent = `${largeResultsCount} queries`;
                    largeResultsCountElement.className = "highlight-number";
                }
                if (avgLargeResultSizeElement) {
                    avgLargeResultSizeElement.textContent = `${avgLargeResultSize}MB`;
                    avgLargeResultSizeElement.className = "highlight-number";
                }
                const largeResultsPercentElement = document.getElementById("large-results-percent");
                if (largeResultsPercentElement) {
                    const largeResultsPercent = totalQueries > 0 ? ((largeResultsCount / totalQueries) * 100).toFixed(1) : 0;
                    largeResultsPercentElement.textContent = `${largeResultsPercent}%`;
                    largeResultsPercentElement.className = "highlight-number";
                }
            } else {
                // Reset to defaults
                if (largeResultsCountElement) {
                    largeResultsCountElement.textContent = "0 queries";
                    largeResultsCountElement.className = "";
                }
                if (avgLargeResultSizeElement) {
                    avgLargeResultSizeElement.textContent = "0MB";
                    avgLargeResultSizeElement.className = "";
                }
                const largeResultsPercentElement = document.getElementById("large-results-percent");
                if (largeResultsPercentElement) {
                    largeResultsPercentElement.textContent = "0%";
                    largeResultsPercentElement.className = "";
                }
            }

            // Update the large payload streaming insight
            const largePayloadCountElement = document.getElementById("large-payload-count");
            const avgPayloadSizeElement = document.getElementById("avg-payload-size");
            const avgStreamRatioElement = document.getElementById("avg-stream-ratio");

            if (largePayloadStreamingCount > 0) {
                const avgPayloadSize = (largePayloadTotalResultSize / largePayloadStreamingCount).toFixed(1);
                const avgStreamRatio = (largePayloadTotalStreamRatio / largePayloadStreamingCount).toFixed(1);

                if (largePayloadCountElement) {
                    largePayloadCountElement.textContent = `${largePayloadStreamingCount} queries`;
                    largePayloadCountElement.className = "highlight-number";
                }
                if (avgPayloadSizeElement) {
                    avgPayloadSizeElement.textContent = `${avgPayloadSize}MB`;
                    avgPayloadSizeElement.className = "highlight-number";
                }
                if (avgStreamRatioElement) {
                    avgStreamRatioElement.textContent = `${avgStreamRatio}%`;
                    avgStreamRatioElement.className = "highlight-number";
                }
                const largePayloadPercentElement = document.getElementById("large-payload-percent");
                if (largePayloadPercentElement) {
                    const largePayloadPercent = totalQueries > 0 ? ((largePayloadStreamingCount / totalQueries) * 100).toFixed(1) : 0;
                    largePayloadPercentElement.textContent = `${largePayloadPercent}%`;
                    largePayloadPercentElement.className = "highlight-number";
                }
            } else {
                // Reset to defaults
                if (largePayloadCountElement) {
                    largePayloadCountElement.textContent = "0 queries";
                    largePayloadCountElement.className = "";
                }
                if (avgPayloadSizeElement) {
                    avgPayloadSizeElement.textContent = "0MB";
                    avgPayloadSizeElement.className = "";
                }
                if (avgStreamRatioElement) {
                    avgStreamRatioElement.textContent = "0%";
                    avgStreamRatioElement.className = "";
                }
                const largePayloadPercentElement = document.getElementById("large-payload-percent");
                if (largePayloadPercentElement) {
                    largePayloadPercentElement.textContent = "0%";
                    largePayloadPercentElement.className = "";
                }
            }

            // Update the inefficient LIKE operations insight
            const inefficientLikeCountElement = document.getElementById("inefficient-like-count");

            if (inefficientLikeCountElement) {
                inefficientLikeCountElement.textContent = `${inefficientLikeCount} queries`;
                inefficientLikeCountElement.className = inefficientLikeCount > 0 ? "highlight-number" : "";
                const inefficientLikePercentElement = document.getElementById("inefficient-like-percent");
                if (inefficientLikePercentElement) {
                    const inefficientLikePercent = totalQueries > 0 ? ((inefficientLikeCount / totalQueries) * 100).toFixed(1) : 0;
                    inefficientLikePercentElement.textContent = `${inefficientLikePercent}%`;
                    inefficientLikePercentElement.className = inefficientLikeCount > 0 ? "highlight-number" : "";
                }
            }

            // Update the SELECT * usage insight
            const selectStarCountElement = document.getElementById("select-star-count");
            if (selectStarCountElement) {
                selectStarCountElement.textContent = `${selectStarCount} queries`;
                selectStarCountElement.className = selectStarCount > 0 ? "highlight-number" : "";
                const selectStarPercentElement = document.getElementById("select-star-percent");
                if (selectStarPercentElement) {
                    const selectStarPercent = totalQueries > 0 ? ((selectStarCount / totalQueries) * 100).toFixed(1) : 0;
                    selectStarPercentElement.textContent = `${selectStarPercent}%`;
                    selectStarPercentElement.className = selectStarCount > 0 ? "highlight-number" : "";
                }
            }
            
            // Update the Complex JOIN Operations insight (Beta - basic version)
            const complexJoinCountElement = document.getElementById("complex-join-count");
            const complexJoinPercentElement = document.getElementById("complex-join-percent");
            const complexJoinFlaggedCountElement = document.getElementById("complex-join-flagged-count");
            const complexJoinFlaggedPercentElement = document.getElementById("complex-join-flagged-percent");
            const complexJoinAvgTimeElement = document.getElementById("complex-join-avg-time");
            
            if (joinQueriesCount > 0) {
                const joinPercent = totalQueries > 0 ? ((joinQueriesCount / totalQueries) * 100).toFixed(1) : 0;
                const flaggedPercent = joinQueriesCount > 0 ? ((joinQueriesWithIssuesCount / joinQueriesCount) * 100).toFixed(1) : 0;
                const avgJoinTime = joinQueriesCount > 0 ? (joinPhaseTotalTime / joinQueriesCount / 1000).toFixed(2) : 0;
                
                if (complexJoinCountElement) {
                    complexJoinCountElement.textContent = `${joinQueriesCount} queries`;
                    complexJoinCountElement.className = "highlight-number";
                }
                if (complexJoinPercentElement) {
                    complexJoinPercentElement.textContent = `${joinPercent}%`;
                    complexJoinPercentElement.className = "highlight-number";
                }
                if (complexJoinFlaggedCountElement) {
                    complexJoinFlaggedCountElement.textContent = `${joinQueriesWithIssuesCount}`;
                    complexJoinFlaggedCountElement.className = joinQueriesWithIssuesCount > 0 ? "highlight-number" : "";
                }
                if (complexJoinFlaggedPercentElement) {
                    complexJoinFlaggedPercentElement.textContent = `${flaggedPercent}%`;
                    complexJoinFlaggedPercentElement.className = joinQueriesWithIssuesCount > 0 ? "highlight-number" : "";
                }
                if (complexJoinAvgTimeElement) {
                    complexJoinAvgTimeElement.textContent = `${avgJoinTime}s`;
                    complexJoinAvgTimeElement.className = "highlight-number";
                }
                
                // Activate the insight item if there are JOIN queries with issues
                const complexJoinInsightItem = document.querySelector('#complex-join-operations-content').closest('.insight-item');
                const complexJoinTitle = complexJoinInsightItem?.querySelector('.insight-title');
                const complexJoinContent = document.getElementById('complex-join-operations-content');
                
                if (complexJoinInsightItem && joinQueriesWithIssuesCount > 0) {
                    complexJoinInsightItem.classList.add('active');
                    // Auto-expand the content when there are issues
                    if (complexJoinTitle) complexJoinTitle.classList.remove('collapsed');
                    if (complexJoinContent) complexJoinContent.classList.remove('collapsed');
                } else if (complexJoinInsightItem) {
                    complexJoinInsightItem.classList.remove('active');
                    // Keep collapsed when no data
                    if (complexJoinTitle) complexJoinTitle.classList.add('collapsed');
                    if (complexJoinContent) complexJoinContent.classList.add('collapsed');
                }
            } else {
                // Reset to defaults
                if (complexJoinCountElement) {
                    complexJoinCountElement.textContent = "0 queries";
                    complexJoinCountElement.className = "";
                }
                if (complexJoinPercentElement) {
                    complexJoinPercentElement.textContent = "0%";
                    complexJoinPercentElement.className = "";
                }
                if (complexJoinFlaggedCountElement) {
                    complexJoinFlaggedCountElement.textContent = "0";
                    complexJoinFlaggedCountElement.className = "";
                }
                if (complexJoinFlaggedPercentElement) {
                    complexJoinFlaggedPercentElement.textContent = "0%";
                    complexJoinFlaggedPercentElement.className = "";
                }
                if (complexJoinAvgTimeElement) {
                    complexJoinAvgTimeElement.textContent = "0s";
                    complexJoinAvgTimeElement.className = "";
                }
                
                // Deactivate the insight item
                const complexJoinInsightItem = document.querySelector('#complex-join-operations-content').closest('.insight-item');
                const complexJoinTitle = complexJoinInsightItem?.querySelector('.insight-title');
                const complexJoinContent = document.getElementById('complex-join-operations-content');
                
                if (complexJoinInsightItem) {
                    complexJoinInsightItem.classList.remove('active');
                    // Keep collapsed when no data
                    if (complexJoinTitle) complexJoinTitle.classList.add('collapsed');
                    if (complexJoinContent) complexJoinContent.classList.add('collapsed');
                }
            }

            // Update the Concurrent Query Conflicts insight (Beta)
            const concurrentConflictsCountElement = document.getElementById("concurrent-conflicts-count");
            const concurrentConflictsPercentElement = document.getElementById("concurrent-conflicts-percent");
            
            if (concurrentConflictsCount > 0) {
                const conflictsPercent = totalQueries > 0 ? ((concurrentConflictsCount / totalQueries) * 100).toFixed(1) : 0;
                
                if (concurrentConflictsCountElement) {
                    concurrentConflictsCountElement.textContent = `${concurrentConflictsCount} queries`;
                    concurrentConflictsCountElement.className = "highlight-number";
                }
                if (concurrentConflictsPercentElement) {
                    concurrentConflictsPercentElement.textContent = `${conflictsPercent}%`;
                    concurrentConflictsPercentElement.className = "highlight-number";
                }
                
                // Show service pressure summary
                const summaryDiv = document.getElementById("concurrent-conflicts-summary");
                const summaryText = document.getElementById("concurrent-conflicts-services-summary");
                if (summaryDiv && summaryText) {
                    const servicePressureSummary = Object.entries(servicesUnderPressure)
                        .filter(([, count]) => count > 0)
                        .map(([service, count]) => `• ${service}: ${count} queries affected`)
                        .join('<br>');
                    
                    summaryText.innerHTML = servicePressureSummary;
                    summaryDiv.style.display = 'block';
                }
                
                // Activate the insight item if there are conflicts
                const concurrentConflictsInsightItem = document.querySelector('#concurrent-query-conflicts-content').closest('.insight-item');
                const concurrentConflictsTitle = concurrentConflictsInsightItem?.querySelector('.insight-title');
                const concurrentConflictsContent = document.getElementById('concurrent-query-conflicts-content');
                
                if (concurrentConflictsInsightItem) {
                    concurrentConflictsInsightItem.classList.add('active');
                    // Auto-expand the content when there are conflicts
                    if (concurrentConflictsTitle) concurrentConflictsTitle.classList.remove('collapsed');
                    if (concurrentConflictsContent) concurrentConflictsContent.classList.remove('collapsed');
                }
            } else {
                // Reset to defaults
                if (concurrentConflictsCountElement) {
                    concurrentConflictsCountElement.textContent = "0 queries";
                    concurrentConflictsCountElement.className = "";
                }
                if (concurrentConflictsPercentElement) {
                    concurrentConflictsPercentElement.textContent = "0%";
                    concurrentConflictsPercentElement.className = "";
                }
                
                // Hide service pressure summary
                const summaryDiv = document.getElementById("concurrent-conflicts-summary");
                if (summaryDiv) {
                    summaryDiv.style.display = 'none';
                }
                
                // Deactivate the insight item
                const concurrentConflictsInsightItem = document.querySelector('#concurrent-query-conflicts-content').closest('.insight-item');
                const concurrentConflictsTitle = concurrentConflictsInsightItem?.querySelector('.insight-title');
                const concurrentConflictsContent = document.getElementById('concurrent-query-conflicts-content');
                
                if (concurrentConflictsInsightItem) {
                    concurrentConflictsInsightItem.classList.remove('active');
                    // Keep collapsed when no data
                    if (concurrentConflictsTitle) concurrentConflictsTitle.classList.add('collapsed');
                    if (concurrentConflictsContent) concurrentConflictsContent.classList.add('collapsed');
                }
            }

            // Update the high memory usage insight
            const highMemoryCountElement = document.getElementById("high-memory-count");
            const avgMemoryUsageElement = document.getElementById("avg-memory-usage");

            if (highMemoryCount > 0) {
                const avgMemoryGB = (highMemoryTotalGB / highMemoryCount).toFixed(1);

                if (highMemoryCountElement) {
                    highMemoryCountElement.textContent = `${highMemoryCount} queries`;
                    highMemoryCountElement.className = "highlight-number";
                }
                if (avgMemoryUsageElement) {
                    avgMemoryUsageElement.textContent = `${avgMemoryGB}GB`;
                    avgMemoryUsageElement.className = "highlight-number";
                }
                const highMemoryPercentElement = document.getElementById("high-memory-percent");
                if (highMemoryPercentElement) {
                    const highMemoryPercent = totalQueries > 0 ? ((highMemoryCount / totalQueries) * 100).toFixed(1) : 0;
                    highMemoryPercentElement.textContent = `${highMemoryPercent}%`;
                    highMemoryPercentElement.className = "highlight-number";
                }
            } else {
                // Reset to defaults
                if (highMemoryCountElement) {
                    highMemoryCountElement.textContent = "0 queries";
                    highMemoryCountElement.className = "";
                }
                if (avgMemoryUsageElement) {
                    avgMemoryUsageElement.textContent = "0GB";
                    avgMemoryUsageElement.className = "";
                }
                const highMemoryPercentElement = document.getElementById("high-memory-percent");
                if (highMemoryPercentElement) {
                    highMemoryPercentElement.textContent = "0%";
                    highMemoryPercentElement.className = "";
                }
            }

            // Update the high kernel time insight
            const highKernelTimeQueriesCountElement = document.getElementById("high-kernel-time-queries-count");
            const avgCoreKernelRatioElement = document.getElementById("avg-core-kernel-ratio");

            if (highKernelTimeQueriesCount > 0) {
                const avgCoreKernelRatio = (totalCoreKernelRatio / highKernelTimeQueriesCount).toFixed(1);

                if (highKernelTimeQueriesCountElement) {
                    highKernelTimeQueriesCountElement.textContent = `${highKernelTimeQueriesCount} queries`;
                    highKernelTimeQueriesCountElement.className = "highlight-number";
                }
                if (avgCoreKernelRatioElement) {
                    avgCoreKernelRatioElement.textContent = `${avgCoreKernelRatio}%`;
                    avgCoreKernelRatioElement.className = "highlight-number";
                }
                const highKernelTimePercentElement = document.getElementById("high-kernel-time-queries-percent");
                if (highKernelTimePercentElement) {
                    const highKernelPercent = totalQueries > 0 ? ((highKernelTimeQueriesCount / totalQueries) * 100).toFixed(1) : 0;
                    highKernelTimePercentElement.textContent = `${highKernelPercent}%`;
                    highKernelTimePercentElement.className = "highlight-number";
                }
            } else {
                // Reset to defaults
                if (highKernelTimeQueriesCountElement) {
                    highKernelTimeQueriesCountElement.textContent = "0 queries";
                    highKernelTimeQueriesCountElement.className = "";
                }
                if (avgCoreKernelRatioElement) {
                    avgCoreKernelRatioElement.textContent = "0%";
                    avgCoreKernelRatioElement.className = "";
                }
                const highKernelTimePercentElement = document.getElementById("high-kernel-time-queries-percent");
                if (highKernelTimePercentElement) {
                    highKernelTimePercentElement.textContent = "0%";
                    highKernelTimePercentElement.className = "";
                }
            }

            // Update the inefficient index scans insight
            const inefficientIndexScansCountElement = document.getElementById("inefficient-index-scans-count");
            const avgScanCountElement = document.getElementById("avg-scan-count");
            const avgResultCountElement = document.getElementById("avg-result-count");
            const avgSelectivityElement = document.getElementById("avg-selectivity");

            // Update pagination over-scan insight
            const paginationOverfetchCountElement = document.getElementById("pagination-overfetch-count");
            const paginationOverfetchAvgElement = document.getElementById("pagination-overfetch-avg-items");
            if (paginationOverfetchCountElement) {
                paginationOverfetchCountElement.textContent = `${paginationOverfetchCount} queries`;
                paginationOverfetchCountElement.className = paginationOverfetchCount > 0 ? "highlight-number" : "";
                const paginationOverfetchPercentElement = document.getElementById("pagination-overfetch-percent");
                if (paginationOverfetchPercentElement) {
                    const paginationOverfetchPercent = totalQueries > 0 ? ((paginationOverfetchCount / totalQueries) * 100).toFixed(1) : 0;
                    paginationOverfetchPercentElement.textContent = `${paginationOverfetchPercent}%`;
                    paginationOverfetchPercentElement.className = paginationOverfetchCount > 0 ? "highlight-number" : "";
                }
            }
            if (paginationOverfetchAvgElement) {
                const avgScanned = paginationOverfetchCount > 0 ? Math.round(paginationOverfetchTotalScanned / paginationOverfetchCount) : 0;
                paginationOverfetchAvgElement.textContent = avgScanned.toLocaleString();
                paginationOverfetchAvgElement.className = paginationOverfetchCount > 0 ? "highlight-number" : "";
            }

            if (inefficientIndexScansCountElement) {
                inefficientIndexScansCountElement.textContent = `${inefficientIndexScansCount} queries`;
                inefficientIndexScansCountElement.className = inefficientIndexScansCount > 0 ? "highlight-number" : "";
                const inefficientIndexScansPercentElement = document.getElementById("inefficient-index-scans-percent");
                if (inefficientIndexScansPercentElement) {
                    const inefficientIndexScansPercent = totalQueries > 0 ? ((inefficientIndexScansCount / totalQueries) * 100).toFixed(1) : 0;
                    inefficientIndexScansPercentElement.textContent = `${inefficientIndexScansPercent}%`;
                    inefficientIndexScansPercentElement.className = inefficientIndexScansCount > 0 ? "highlight-number" : "";
                }
            }

            // Calculate and display averages
            if (window.inefficientScanMetrics && window.inefficientScanMetrics.length > 0) {
                const totalScanned = window.inefficientScanMetrics.reduce((sum, metric) => sum + metric.scanned, 0);
                const totalResults = window.inefficientScanMetrics.reduce((sum, metric) => sum + metric.resultCount, 0);
                const totalSelectivity = window.inefficientScanMetrics.reduce((sum, metric) => sum + metric.selectivity, 0);

                const avgScanned = Math.round(totalScanned / window.inefficientScanMetrics.length);
                const avgResults = Math.round(totalResults / window.inefficientScanMetrics.length);
                const avgSelectivity = (totalSelectivity / window.inefficientScanMetrics.length).toFixed(2);

                if (avgScanCountElement) {
                    avgScanCountElement.textContent = avgScanned.toLocaleString();
                    avgScanCountElement.className = "highlight-number";
                }
                if (avgResultCountElement) {
                    avgResultCountElement.textContent = avgResults.toLocaleString();
                    avgResultCountElement.className = "highlight-number";
                }
                if (avgSelectivityElement) {
                    avgSelectivityElement.textContent = `${avgSelectivity}%`;
                    avgSelectivityElement.className = "highlight-number";
                }
            } else {
                // Reset to defaults when no inefficient queries
                if (avgScanCountElement) {
                    avgScanCountElement.textContent = "0";
                    avgScanCountElement.className = "";
                }
                if (avgResultCountElement) {
                    avgResultCountElement.textContent = "0";
                    avgResultCountElement.className = "";
                }
                if (avgSelectivityElement) {
                    avgSelectivityElement.textContent = "0%";
                    avgSelectivityElement.className = "";
                }
            }

            // Update the timeout-prone queries insight
            const timeoutProneContent = document.getElementById("timeout-prone-queries-content");
            if (timeoutProneContent) {
                const approachingHighlight = approachingTimeoutCount > 0 ? "highlight-number" : "";
                const actualHighlight = actualTimeoutCount > 0 ? "highlight-number" : "";
                const approachingTimeoutPercent = totalQueries > 0 ? ((approachingTimeoutCount / totalQueries) * 100).toFixed(1) : 0;
                const actualTimeoutPercent = totalQueries > 0 ? ((actualTimeoutCount / totalQueries) * 100).toFixed(1) : 0;
                
                timeoutProneContent.innerHTML = `
                    <p class=\"insight-description\">
                        <span id=\"approaching-timeout-count\" class=\"${approachingHighlight}\">${approachingTimeoutCount} queries</span> (<span id=\"approaching-timeout-percent\" class=\"${approachingHighlight}\">${approachingTimeoutPercent}%</span>) are consistently approaching timeout
                        thresholds, with <span id=\"actual-timeout-count\" class=\"${actualHighlight}\">${actualTimeoutCount} queries</span> (<span id=\"actual-timeout-percent\" class=\"${actualHighlight}\">${actualTimeoutPercent}%</span>) actually timing out
                        in the analyzed period. <em>(Default query timeout: 75 seconds / 1m15s)</em>
                    </p>

                    <button id=\"toggle-timeout-prone-queries-sample-queries-btn\" onclick=\"toggleTimeoutQueriesTable()\" class=\"btn-standard\" style=\"margin-top: 10px;\">
                        <span id=\"timeout-prone-queries-sample-queries-btn-text\">Show Sample Queries</span>
                    </button>
                    <div id=\"timeout-prone-queries-sample-queries-container\" style=\"display: none; margin-top: 10px;\">
                        <table class=\"sample-queries-table\">
                            <thead>
                                <tr>
                                    <th>Request Date</th>
                                    <th>Statement (unique)</th>
                                    <th>Elapsed Time</th>
                                </tr>
                            </thead>
                            <tbody id=\"timeout-prone-queries-sample-queries-tbody\">
                            </tbody>
                        </table>
                    </div>
                `;
            }

            // Reset metrics for next parse
            window.inefficientScanMetrics = [];

            // Update slow index scan times insight
            updateSlowIndexScanTimes(requests);

            // Update slow parse/plan times insight
            const slowParsePlanCountElement = document.getElementById("slow-parse-plan-count");
            const slowParsePlanPercentElement = document.getElementById("slow-parse-plan-percent");
            const avgParseTimeElement = document.getElementById("avg-parse-time");
            const avgPlanTimeElement = document.getElementById("avg-plan-time");
            
            if (slowParsePlanCountElement) {
                slowParsePlanCountElement.textContent = `${slowParsePlanCount} queries`;
                slowParsePlanCountElement.className = slowParsePlanCount > 0 ? "highlight-number" : "";
            }
            if (slowParsePlanPercentElement) {
                const slowParsePlanPercent = totalQueries > 0 ? ((slowParsePlanCount / totalQueries) * 100).toFixed(1) : 0;
                slowParsePlanPercentElement.textContent = `${slowParsePlanPercent}%`;
                slowParsePlanPercentElement.className = slowParsePlanCount > 0 ? "highlight-number" : "";
            }
            if (avgParseTimeElement) {
                const avgParseTime = slowParsePlanCount > 0 ? (slowParsePlanTotalParseTime / slowParsePlanCount).toFixed(3) : 0;
                avgParseTimeElement.textContent = `${avgParseTime}ms`;
                avgParseTimeElement.className = slowParsePlanCount > 0 ? "highlight-number" : "";
            }
            if (avgPlanTimeElement) {
                const avgPlanTime = slowParsePlanCount > 0 ? (slowParsePlanTotalPlanTime / slowParsePlanCount).toFixed(3) : 0;
                avgPlanTimeElement.textContent = `${avgPlanTime}ms`;
                avgPlanTimeElement.className = slowParsePlanCount > 0 ? "highlight-number" : "";
            }

            // Update sample queries for each insight
            Logger.debug(`[updateInsights] About to update insight sample queries, sampleQueries.length=${sampleQueries.length}`);
            
            updateInsightSampleQueries('missing-where-clauses', missingWhereClausesSamples);
            updateInsightSampleQueries('slow-use-key-queries', slowUseKeyQueriesSamples);
            updateInsightSampleQueries('large-result-set-queries', largeResultSetQueriesSamples);
            updateInsightSampleQueries('inefficient-like-operations', inefficientLikeOperationsSamples);
            updateInsightSampleQueries('select-star-usage', selectStarUsageSamples);
            updateInsightSampleQueries('pagination-index-overfetch', paginationOverfetchSamples);
            updateInsightSampleQueries('high-memory-usage', highMemoryUsageSamples);
            updateInsightSampleQueries('high-kernel-time-queries', highKernelTimeQueriesSamples);
            updateInsightSampleQueries('large-payload-streaming', largePayloadStreamingSamples);
            updateInsightSampleQueries('slow-parse-plan-times', slowParsePlanSamples);
            updateJoinSampleQueries(complexJoinOperationsSamples); // Custom function with flags column
            updateConcurrentConflictsSampleQueries(concurrentConflictsSamples, flagCounts); // Custom function with service pressure flags

            // Special handling for timeout queries (3-column table with 10 entries)
            updateTimeoutQueriesTable(actualTimeoutsSamples, approachingTimeoutsSamples);

            // Update navigation counts and accordion states
            updateInsightNavigation();
        }

// ============================================================
// INSIGHT: toggleInsight
// ============================================================

        function toggleInsight(insightId) {
            const title = document.querySelector(`[onclick="toggleInsight('${insightId}')"]`);
            const content = document.getElementById(`${insightId}-content`);

            if (title && content) {
                title.classList.toggle('collapsed');
                content.classList.toggle('collapsed');
            }
        }

// ============================================================
// INSIGHT: updateInsightNavigation
// ============================================================

        function updateInsightNavigation() {
            // Always show all categories and expand them
            const categories = ['index-issues', 'resource-issues', 'pattern-analysis', 'performance-opportunities'];

            categories.forEach(categoryId => {
                const categoryElement = document.getElementById(categoryId);
                const titleElement = categoryElement?.querySelector('.category-title');
                const contentElement = document.getElementById(`${categoryId}-content`);

                // Show category and expand accordion
                if (categoryElement) categoryElement.style.display = 'block';
                if (titleElement) titleElement.classList.remove('collapsed');
                if (contentElement) contentElement.classList.remove('collapsed');
            });

            // Auto-expand individual insights that have issues (non-zero values)
            const totalInsights = autoExpandInsightsWithIssues();
            
            // Update Insights tab badge (Issue #164)
            const badge = document.getElementById('insights-badge');
            if (badge) {
                if (totalInsights > 0) {
                    badge.textContent = totalInsights; // Simple count, not fraction
                    badge.style.display = 'inline-block';
                } else {
                    badge.style.display = 'none';
                }
            }
        }

// ============================================================
// INSIGHT: autoExpandInsightsWithIssues
// ============================================================

        function autoExpandInsightsWithIssues() {
            const insights = [
                { id: 'inefficient-index-scans', checkElement: 'inefficient-index-scans-count' },
                { id: 'slow-index-scan-times', checkElements: ['slow-indexes-2-10s', 'slow-indexes-10s-plus', 'slow-primary-indexes'] },
                { id: 'primary-index-over-usage', checkElement: 'primary-avg-items-scanned' },
                { id: 'high-kernel-time-queries', checkElement: 'high-kernel-time-queries-count' },
                { id: 'high-memory-usage', checkElement: 'high-memory-count' },
                { id: 'slow-parse-plan-times', checkElement: 'slow-parse-plan-count' },
                { id: 'slow-use-key-queries', checkElement: 'slow-use-keys-count' },
                { id: 'missing-where-clauses', checkElement: 'missing-where-count' },
                { id: 'complex-join-operations', checkElement: 'complex-join-count' },
                { id: 'inefficient-like-operations', checkElement: 'inefficient-like-count' },
                { id: 'select-star-usage', checkElement: 'select-star-count' },
                { id: 'pagination-index-overfetch', checkElement: 'pagination-overfetch-count' },
                { id: 'large-result-set-queries', checkElement: 'large-results-count' },
                { id: 'large-payload-streaming', checkElement: 'large-payload-count' },
                { id: 'timeout-prone-queries', checkElements: ['approaching-timeout-count', 'actual-timeout-count'] },
                { id: 'concurrent-query-conflicts', checkElement: 'concurrent-conflicts-count' }
            ];

            let totalInsightsWithIssues = 0;

            insights.forEach(insight => {
                const titleElement = document.querySelector(`[onclick="toggleInsight('${insight.id}')"]`);
                const contentElement = document.getElementById(`${insight.id}-content`);

                let hasIssues = false;

                // Check if insight has issues (non-zero values)
                if (insight.checkElement) {
                    const element = document.getElementById(insight.checkElement);
                    if (element && element.textContent) {
                        const value = element.textContent.match(/\d+/);
                        hasIssues = value && parseInt(value[0]) > 0;
                    }
                }

                if (insight.checkElements) {
                    hasIssues = insight.checkElements.some(elementId => {
                        const element = document.getElementById(elementId);
                        if (element && element.textContent) {
                            const value = element.textContent.match(/\d+/);
                            return value && parseInt(value[0]) > 0;
                        }
                        return false;
                    });
                }

                // Set accordion state based on whether issues were found
                if (hasIssues) {
                    totalInsightsWithIssues++; // Count insights with issues (Issue #164)
                    // Expand insight with issues
                    if (titleElement) titleElement.classList.remove('collapsed');
                    if (contentElement) contentElement.classList.remove('collapsed');
                } else {
                    // Collapse insight with no issues
                    if (titleElement) titleElement.classList.add('collapsed');
                    if (contentElement) contentElement.classList.add('collapsed');
                }

                // Toggle visual active state (blue edge when issues found)
                const card = titleElement ? titleElement.closest('.insight-item') : null;
                if (card) {
                    card.classList.toggle('active', !!hasIssues);
                }
            });

            // Handle dev insights - always collapsed and not active since they don't have real data
            const devInsights = document.querySelectorAll('.insight-item:has(.dev-badge)');
            devInsights.forEach(devInsight => {
                const titleElement = devInsight.querySelector('.insight-title');
                const contentElement = devInsight.querySelector('.insight-content');

                if (titleElement) titleElement.classList.add('collapsed');
                if (contentElement) contentElement.classList.add('collapsed');
                devInsight.classList.remove('active');
            });

            // Handle beta insights - collapsed by default, but can be expanded based on results
            // (Beta insights are included in the main insights array above)

            // Update category counters (Issue #161)
            updateCategoryCounters();
            
            // Return total count for badge update (Issue #164)
            return totalInsightsWithIssues;
        }

// ============================================================
// INSIGHT: toggleInsightSampleQueries
// ============================================================

        function toggleInsightSampleQueries(insightId) {
            const container = document.getElementById(`${insightId}-sample-queries-container`);
            const btnText = document.getElementById(`${insightId}-sample-queries-btn-text`);
            
            if (!container || !btnText) return;
            
            const isVisible = insightSampleQueriesVisible[insightId] || false;
            insightSampleQueriesVisible[insightId] = !isVisible;
            
            if (!isVisible) {
                container.style.display = 'block';
                btnText.textContent = TEXT_CONSTANTS.HIDE_SAMPLE_QUERIES;
            } else {
                container.style.display = 'none';
                btnText.textContent = TEXT_CONSTANTS.SHOW_SAMPLE_QUERIES;
            }
        }

// ============================================================
// INSIGHT: updateInsightSampleQueries
// ============================================================

        function updateInsightSampleQueries(insightId, queries) {
            const tbody = document.getElementById(`${insightId}-sample-queries-tbody`);
            if (!tbody) return;
            
            tbody.innerHTML = '';
            insightSampleQueries[insightId] = queries;
            
            Logger.debug(`[Insights] Updating ${insightId} with ${queries.length} queries, currentTimezone=${currentTimezone}`);
            
            queries.forEach((query, index) => {
                // Apply timezone conversion to requestTime
                const originalTime = query.requestTime || "";
                const convertedDate = getChartDate(originalTime);
                const formattedDate = convertedDate ? convertedDate.toISOString().replace('T', ' ').substring(0, 23) + 'Z' : originalTime;
                
                Logger.trace(`[Insights] Query ${index}: Original=${originalTime}, Converted=${formattedDate}`);
                
                const statementId = `${insightId}-statement-${index}`;
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
                            <button onclick="copyInsightStatement('${insightId}', ${index}, event)" 
                                    class="btn-standard" style="margin-top: 5px;">${TEXT_CONSTANTS.COPY}</button>
                        </div>
                        <div id="${statementId}-full" style="display: none;">
                            <span>${escapeHtml(query.statement)}</span>
                            <br>
                            <button onclick="toggleInsightStatement('${statementId}', false)" 
                                    class="btn-standard" style="margin-top: 5px; margin-right: 5px;">${TEXT_CONSTANTS.HIDE}</button>
                            <button onclick="copyInsightStatement('${insightId}', ${index}, event)" 
                                    class="btn-standard" style="margin-top: 5px;">${TEXT_CONSTANTS.COPY}</button>
                        </div>
                    `;
                } else {
                    statementCell.innerHTML = `
                        <div>
                            <span>${escapeHtml(query.statement)}</span>
                            <br>
                            <button onclick="copyInsightStatement('${insightId}', ${index}, event)" 
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
// INSIGHT: toggleInsightStatement
// ============================================================

        function toggleInsightStatement(statementId, showFull) {
            const truncatedDiv = document.getElementById(statementId + '-truncated');
            const fullDiv = document.getElementById(statementId + '-full');
            
            if (showFull) {
                truncatedDiv.style.display = 'none';
                fullDiv.style.display = 'block';
            } else {
                truncatedDiv.style.display = 'block';
                fullDiv.style.display = 'none';
            }
        }

// ============================================================
// INSIGHT: copyInsightStatement
// ============================================================

        function copyInsightStatement(insightId, index, event) {
            const statement = insightSampleQueries[insightId]?.[index]?.statement;
            
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

// ============================================================
// EXPORTS
// ============================================================

export {
    updateInsights,
    toggleInsight,
    updateInsightNavigation,
    autoExpandInsightsWithIssues,
    toggleInsightSampleQueries,
    updateInsightSampleQueries,
    toggleInsightStatement,
    copyInsightStatement
};

// Expose globally
window.updateInsights = updateInsights;
window.toggleInsight = toggleInsight;
window.updateInsightNavigation = updateInsightNavigation;
window.autoExpandInsightsWithIssues = autoExpandInsightsWithIssues;
window.toggleInsightSampleQueries = toggleInsightSampleQueries;
window.updateInsightSampleQueries = updateInsightSampleQueries;
window.toggleInsightStatement = toggleInsightStatement;
window.copyInsightStatement = copyInsightStatement;

console.log('✅ insights.js module loaded');
