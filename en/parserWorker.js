// Couchbase Query Analysis Tool - Web Worker for Heavy Processing
// Version 3.6.2

// Cache for normalized queries and operators
const normalizeCache = new Map();
const operatorsCache = new WeakMap();

// Parse time duration to milliseconds - optimized version
function parseTime(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return 0;

  // Cache for performance
  if (normalizeCache.has(timeStr)) {
    return normalizeCache.get(timeStr);
  }

  let totalMs = 0;
  const regex = /(\d+(?:\.\d+)?)\s*([a-zA-Z]+)/g;
  let match;

  while ((match = regex.exec(timeStr)) !== null) {
    const value = parseFloat(match[1]);
    const unit = match[2].toLowerCase();

    switch (unit) {
      case "ns":
      case "nanosecond":
      case "nanoseconds":
        totalMs += value / 1000000;
        break;
      case "µs":
      case "us":
      case "microsecond":
      case "microseconds":
        totalMs += value / 1000;
        break;
      case "ms":
      case "millisecond":
      case "milliseconds":
        totalMs += value;
        break;
      case "s":
      case "second":
      case "seconds":
        totalMs += value * 1000;
        break;
      case "m":
      case "minute":
      case "minutes":
        totalMs += value * 60000;
        break;
      case "h":
      case "hour":
      case "hours":
        totalMs += value * 3600000;
        break;
    }
  }

  normalizeCache.set(timeStr, totalMs);
  return totalMs;
}

// Iterative getOperators function - converted from recursive
function getOperators(operator, operators = [], visited = new WeakSet()) {
  if (!operator) return operators;

  // Check cache first for the root operator
  if (operatorsCache.has(operator)) {
    return operatorsCache.get(operator);
  }

  const stack = [operator];
  const localVisited = new WeakSet(visited);

  while (stack.length > 0) {
    const current = stack.pop();
    if (localVisited.has(current)) continue;
    localVisited.add(current);

    if (current["#operator"]) {
      operators.push(current);
    }

    // Push children to stack in reverse order to maintain processing order
    if (current["~subqueries"] && Array.isArray(current["~subqueries"])) {
      for (let i = current["~subqueries"].length - 1; i >= 0; i--) {
        const subquery = current["~subqueries"][i];
        if (subquery.executionTimings) stack.push(subquery.executionTimings);
      }
    }
    if (current.scan) stack.push(current.scan);
    if (current.scans && Array.isArray(current.scans)) {
      for (let i = current.scans.length - 1; i >= 0; i--) {
        stack.push(current.scans[i]);
      }
    }
    if (current.second) stack.push(current.second);
    if (current.first) stack.push(current.first);
    if (current.right) stack.push(current.right);
    if (current.left) stack.push(current.left);
    if (current.inputs && Array.isArray(current.inputs)) {
      for (let i = current.inputs.length - 1; i >= 0; i--) {
        stack.push(current.inputs[i]);
      }
    }
    if (current.input) stack.push(current.input);
    if (current["~children"] && Array.isArray(current["~children"])) {
      for (let i = current["~children"].length - 1; i >= 0; i--) {
        stack.push(current["~children"][i]);
      }
    }
    if (current["~child"]) stack.push(current["~child"]);
  }

  // Cache the result for root operator
  operatorsCache.set(operator, operators);
  return operators;
}

// Calculate total kernel time from plan
function calculateTotalKernTime(plan) {
  if (!plan) return 0;
  
  const operators = getOperators(plan);
  let totalKernTime = 0;
  
  operators.forEach(operator => {
    const kernTime = operator.kernTime || operator["#kernTime"];
    if (kernTime) {
      totalKernTime += parseTime(kernTime);
    }
  });
  
  return totalKernTime;
}

// Check if query uses primary index
function usesPrimaryIndex(requestData) {
  if (!requestData || !requestData.plan) return false;
  
  const operators = getOperators(requestData.plan);
  return operators.some(op => {
    const operatorType = op["#operator"];
    return operatorType === "PrimaryScan" || operatorType === "PrimaryScan3";
  });
}

// Extract index information from plan
function extractIndexInfo(plan) {
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
    if (operatorType === "PrimaryScan" || operatorType === "PrimaryScan3") {
      stats.primaryScan += operatorStats["#itemsOut"] || 0;
    } else if (operatorType === "IndexScan" || operatorType === "IndexScan3") {
      stats.indexScan += operatorStats["#itemsOut"] || 0;
    } else if (operatorType === "Fetch") {
      stats.fetch += operatorStats["#itemsOut"] || 0;
    }
  });

  return { indexes, stats };
}

// Extract plan statistics
function extractPlanStats(plan) {
  const operators = getOperators(plan);
  let totalItemsIn = 0;
  let totalItemsOut = 0;
  
  operators.forEach(operator => {
    const stats = operator["#stats"] || {};
    totalItemsIn += stats["#itemsIn"] || 0;
    totalItemsOut += stats["#itemsOut"] || 0;
  });
  
  return { totalItemsIn, totalItemsOut, operatorCount: operators.length };
}

// Derive statement type from SQL statement
function deriveStatementType(statement) {
  if (!statement || typeof statement !== "string") return "UNKNOWN";
  
  const trimmed = statement.trim().toUpperCase();
  if (trimmed.startsWith("SELECT")) return "SELECT";
  if (trimmed.startsWith("INSERT")) return "INSERT";
  if (trimmed.startsWith("UPDATE")) return "UPDATE";
  if (trimmed.startsWith("DELETE")) return "DELETE";
  if (trimmed.startsWith("UPSERT")) return "UPSERT";
  if (trimmed.startsWith("MERGE")) return "MERGE";
  
  return "OTHER";
}

// Process individual request data
function processRequestData(item) {
  const request = item.completed_requests || item;

  // Parse and cache plan data immediately
  let plan = null;
  if (item.plan) {
    if (typeof item.plan === "string") {
      try {
        plan = JSON.parse(item.plan);
      } catch (e) {
        console.warn(`Failed to parse plan JSON for request:`, e.message);
        plan = null;
      }
    } else {
      plan = item.plan;
    }
  }

  // Pre-calculate commonly used values
  const processedRequest = {
    ...request,
    plan: plan,
    // Pre-calculate time values
    elapsedTimeMs: parseTime(request.elapsedTime),
    kernTimeMs: plan ? calculateTotalKernTime(plan) : 0,
    memoryBytes: request.usedMemory || 0,
    // Pre-calculate boolean flags
    usesPrimary: plan ? usesPrimaryIndex({ plan: plan }) : false,
    // Pre-extract index information
    indexInfo: plan ? extractIndexInfo(plan) : null,
    // Pre-calculate aggregations
    planStats: plan ? extractPlanStats(plan) : null,
    // Ensure we have a statement type (derive if not present)
    statementType: request.statementType || deriveStatementType(request.statement),
  };

  return processedRequest;
}

// Web Worker message handler
self.onmessage = function(e) {
  const { batch, startIndex, endIndex, workerId } = e.data;
  const processed = [];
  
  try {
    for (let i = 0; i < batch.length; i++) {
      try {
        processed.push(processRequestData(batch[i]));
      } catch (error) {
        console.warn(`Error processing request ${startIndex + i}:`, error.message || error);
        // Continue processing other requests
      }
    }
    
    self.postMessage({ 
      processed, 
      startIndex, 
      endIndex: startIndex + batch.length,
      workerId,
      success: true 
    });
  } catch (error) {
    self.postMessage({ 
      error: error.message,
      startIndex,
      workerId,
      success: false 
    });
  }
};
