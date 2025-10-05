# Concurrent Query Conflicts Insight - Logic & Implementation Guide

## Overview
This insight identifies queries experiencing resource contention by analyzing **service-level performance degradation indicators**. Since system:completed_requests only captures slow queries (>1 second), we focus on detecting resource pressure through phase timing anomalies rather than peak vs off-peak comparisons.

---

## Key Insight: Service Pressure Indicators

**Important Limitation:** system:completed_requests only captures queries with elapsedTime > 1 second, which is the "tip of the iceberg." We can't compare against fast baseline queries, but we CAN detect when services are under pressure by analyzing phase timings.

### **Resource Pressure Signals**

When Couchbase services (Query, Index, Data) are overloaded, specific phase timings become anomalously slow:

| Service | Phase | Normal Timing | Pressure Indicator | Root Cause |
|---------|-------|---------------|-------------------|------------|
| **Query Service** | Parse + Plan | <1ms | >1ms | CPU contention on 8-core system running hundreds of queries/sec |
| **Data Service** | Fetch | <1ms per doc | >5ms per doc | KV service under pressure (e.g., 400ms for 40 docs = 10ms/doc) |
| **Index Service** | Index Scan | >10K records/sec | <5K records/sec | Index service slow (e.g., 10K records in 2s = 5K/sec) |
| **CPU (OS-level)** | Kernel Time | <10% of elapsed | >30% of elapsed | CPU scheduling overhead, processes fighting for cores |

---

## Recommended Implementation: Service Pressure Analysis ⭐

**Focus on anomalous phase timings as indicators of resource contention**

**Pros:**
- Works with slow-query-only data
- Directly measures service-level bottlenecks
- Identifies which service is under pressure
- Actionable (scale the bottleneck service)

**Cons:**
- Requires understanding of normal phase timings
- May need per-cluster baseline tuning

**How it works:**
1. Calculate per-document and per-record throughput ratios
2. Detect Parse/Plan time anomalies (>1ms)
3. Detect Fetch throughput degradation (>5ms per doc)
4. Detect Index Scan throughput degradation (<5K records/sec)
5. Detect CPU contention (kernel time >30%)
6. Flag queries showing multiple service pressure indicators

---

## Configurable Thresholds

```javascript
const CONCURRENT_CONFLICT_THRESHOLDS = {
  // Query Service (Parse + Plan) pressure
  PARSE_PLAN_WARNING_MS: 1,               // >1ms = warning (should be <1ms)
  PARSE_PLAN_CRITICAL_MS: 10,             // >10ms = critical
  
  // Data Service (Fetch) pressure - per-document timing
  FETCH_PER_DOC_WARNING_MS: 5,            // >5ms per doc = warning (should be <1ms)
  FETCH_PER_DOC_CRITICAL_MS: 10,          // >10ms per doc = critical
  MIN_FETCH_COUNT_FOR_ANALYSIS: 10,       // Need 10+ docs to be statistically valid
  
  // Index Service pressure - throughput analysis
  INDEX_SCAN_WARNING_RATE: 5000,          // <5K records/sec = warning (should be >10K)
  INDEX_SCAN_CRITICAL_RATE: 1000,         // <1K records/sec = critical
  MIN_INDEX_SCAN_FOR_ANALYSIS: 100,       // Need 100+ records to be valid
  
  // CPU contention (Kernel time)
  KERNEL_TIME_WARNING_RATIO: 0.30,        // >30% kernel time = warning
  KERNEL_TIME_CRITICAL_RATIO: 0.50,       // >50% kernel time = critical
  
  // Multi-service pressure indicator
  MIN_SERVICES_UNDER_PRESSURE: 2,         // 2+ services flagged = system-wide issue
  
  // Time-based clustering (optional)
  TIME_BUCKET_MINUTES: 5,                 // Group queries in 5-min buckets for trending
  HIGH_CONTENTION_BUCKET_THRESHOLD: 0.50, // >50% queries in bucket show pressure
  
  // Reporting
  TOP_AFFECTED_QUERIES: 10                // Show top 10 worst queries
};
```

---

## Complexity Flags (A-G)

Each query can trigger one or more service pressure flags:

| Flag | Service | Description | Severity |
|------|---------|-------------|----------|
| **A** | Query Service | Parse+Plan time >1ms (Query Service CPU pressure) | 🟡 High |
| **B** | Query Service | Parse+Plan time >10ms (Query Service critically overloaded) | 🔴 Critical |
| **C** | Data Service | Fetch >5ms per document (KV service under pressure) | 🟡 High |
| **D** | Data Service | Fetch >10ms per document (KV service critically slow) | 🔴 Critical |
| **E** | Index Service | Index scan <5K records/sec (Index service slow) | 🟡 High |
| **F** | Index Service | Index scan <1K records/sec (Index service critically slow) | 🔴 Critical |
| **G** | CPU/OS | Kernel time >30% (CPU contention across processes) | 🟡 High |
| **H** | System-Wide | Multiple services under pressure (2+ flags from different services) | 🔴 Critical |

---

## Step-by-Step Detection Logic

### **Step 1: Detect Query Service Pressure (Parse + Plan Time)**

```javascript
function detectQueryServicePressure(request) {
  const parseTime = request.phaseTimes?.parse || 0;
  const planTime = request.phaseTimes?.plan || 0;
  const parsePlanTime = parseTime + planTime;
  
  if (parsePlanTime === 0) return null;
  
  let flag = null;
  let severity = null;
  
  if (parsePlanTime >= CONCURRENT_CONFLICT_THRESHOLDS.PARSE_PLAN_CRITICAL_MS) {
    flag = 'B';
    severity = 'critical';
  } else if (parsePlanTime >= CONCURRENT_CONFLICT_THRESHOLDS.PARSE_PLAN_WARNING_MS) {
    flag = 'A';
    severity = 'high';
  }
  
  if (flag) {
    return {
      flag,
      severity,
      service: 'Query Service',
      metric: parsePlanTime,
      message: `Parse+Plan took ${parsePlanTime.toFixed(2)}ms (should be <1ms)`
    };
  }
  
  return null;
}
```

---

### **Step 2: Detect Data Service Pressure (Fetch Time per Document)**

```javascript
function detectDataServicePressure(request) {
  const fetchTime = request.phaseTimes?.fetch || 0;
  const fetchCount = request.phaseCounts?.fetch || 0;
  
  // Need minimum documents to be statistically valid
  if (fetchCount < CONCURRENT_CONFLICT_THRESHOLDS.MIN_FETCH_COUNT_FOR_ANALYSIS) {
    return null;
  }
  
  const fetchPerDoc = fetchTime / fetchCount;
  
  let flag = null;
  let severity = null;
  
  if (fetchPerDoc >= CONCURRENT_CONFLICT_THRESHOLDS.FETCH_PER_DOC_CRITICAL_MS) {
    flag = 'D';
    severity = 'critical';
  } else if (fetchPerDoc >= CONCURRENT_CONFLICT_THRESHOLDS.FETCH_PER_DOC_WARNING_MS) {
    flag = 'C';
    severity = 'high';
  }
  
  if (flag) {
    return {
      flag,
      severity,
      service: 'Data Service',
      metric: fetchPerDoc,
      fetchCount,
      fetchTime,
      message: `Fetch ${fetchPerDoc.toFixed(2)}ms per doc (${fetchTime}ms for ${fetchCount} docs)`
    };
  }
  
  return null;
}
```

---

### **Step 3: Detect Index Service Pressure (Scan Throughput)**

```javascript
function detectIndexServicePressure(request) {
  const indexScanTime = request.phaseTimes?.indexScan || 0;
  const indexScanCount = request.phaseCounts?.indexScan || 0;
  
  // Need minimum records to be statistically valid
  if (indexScanCount < CONCURRENT_CONFLICT_THRESHOLDS.MIN_INDEX_SCAN_FOR_ANALYSIS) {
    return null;
  }
  
  if (indexScanTime === 0) return null;
  
  // Calculate records per second
  const recordsPerSecond = (indexScanCount / indexScanTime) * 1000;
  
  let flag = null;
  let severity = null;
  
  if (recordsPerSecond <= CONCURRENT_CONFLICT_THRESHOLDS.INDEX_SCAN_CRITICAL_RATE) {
    flag = 'F';
    severity = 'critical';
  } else if (recordsPerSecond <= CONCURRENT_CONFLICT_THRESHOLDS.INDEX_SCAN_WARNING_RATE) {
    flag = 'E';
    severity = 'high';
  }
  
  if (flag) {
    return {
      flag,
      severity,
      service: 'Index Service',
      metric: recordsPerSecond,
      indexScanCount,
      indexScanTime,
      message: `Index scan ${Math.round(recordsPerSecond).toLocaleString()} records/sec (${indexScanCount.toLocaleString()} records in ${indexScanTime}ms)`
    };
  }
  
  return null;
}
```

---

### **Step 4: Detect CPU Contention (Kernel Time)**

```javascript
function detectCPUContention(request) {
  const kernTime = request.phaseTimes?.kernTime || 0;
  const elapsedTime = request.elapsedTime || 0;
  
  if (elapsedTime === 0 || kernTime === 0) return null;
  
  const kernelRatio = kernTime / elapsedTime;
  
  // Only flag if significant kernel time
  if (kernelRatio >= CONCURRENT_CONFLICT_THRESHOLDS.KERNEL_TIME_WARNING_RATIO) {
    return {
      flag: 'G',
      severity: kernelRatio >= CONCURRENT_CONFLICT_THRESHOLDS.KERNEL_TIME_CRITICAL_RATIO ? 'critical' : 'high',
      service: 'CPU/OS',
      metric: kernelRatio,
      kernTime,
      elapsedTime,
      message: `Kernel time ${(kernelRatio * 100).toFixed(1)}% (${kernTime}ms / ${elapsedTime}ms)`
    };
  }
  
  return null;
}
```

---

### **Step 5: Analyze All Service Pressures for Each Query**

```javascript
function analyzeServicePressures(request) {
  const flags = [];
  const flagDetails = {};
  const servicesUnderPressure = new Set();
  
  // Check Query Service pressure (Parse + Plan)
  const queryServicePressure = detectQueryServicePressure(request);
  if (queryServicePressure) {
    flags.push(queryServicePressure.flag);
    flagDetails[queryServicePressure.flag] = {
      name: `Query Service ${queryServicePressure.severity === 'critical' ? 'Critical' : 'Warning'}`,
      severity: queryServicePressure.severity,
      service: queryServicePressure.service,
      value: queryServicePressure.metric,
      message: queryServicePressure.message
    };
    servicesUnderPressure.add('Query Service');
  }
  
  // Check Data Service pressure (Fetch per doc)
  const dataServicePressure = detectDataServicePressure(request);
  if (dataServicePressure) {
    flags.push(dataServicePressure.flag);
    flagDetails[dataServicePressure.flag] = {
      name: `Data Service ${dataServicePressure.severity === 'critical' ? 'Critical' : 'Warning'}`,
      severity: dataServicePressure.severity,
      service: dataServicePressure.service,
      value: dataServicePressure.metric,
      message: dataServicePressure.message
    };
    servicesUnderPressure.add('Data Service');
  }
  
  // Check Index Service pressure (Scan throughput)
  const indexServicePressure = detectIndexServicePressure(request);
  if (indexServicePressure) {
    flags.push(indexServicePressure.flag);
    flagDetails[indexServicePressure.flag] = {
      name: `Index Service ${indexServicePressure.severity === 'critical' ? 'Critical' : 'Warning'}`,
      severity: indexServicePressure.severity,
      service: indexServicePressure.service,
      value: indexServicePressure.metric,
      message: indexServicePressure.message
    };
    servicesUnderPressure.add('Index Service');
  }
  
  // Check CPU contention (Kernel time)
  const cpuContention = detectCPUContention(request);
  if (cpuContention) {
    flags.push(cpuContention.flag);
    flagDetails[cpuContention.flag] = {
      name: 'CPU Contention',
      severity: cpuContention.severity,
      service: cpuContention.service,
      value: cpuContention.metric,
      message: cpuContention.message
    };
    servicesUnderPressure.add('CPU/OS');
  }
  
  // FLAG H: System-Wide Pressure (multiple services affected)
  if (servicesUnderPressure.size >= CONCURRENT_CONFLICT_THRESHOLDS.MIN_SERVICES_UNDER_PRESSURE) {
    flags.push('H');
    flagDetails.H = {
      name: 'System-Wide Pressure',
      severity: 'critical',
      service: 'Multiple',
      value: servicesUnderPressure.size,
      message: `${servicesUnderPressure.size} services under pressure: ${Array.from(servicesUnderPressure).join(', ')}`
    };
  }
  
  return {
    flags,           // Array: ['A', 'C', 'H']
    flagDetails,     // Object with details per flag
    hasConflict: flags.length > 0,
    servicesAffected: Array.from(servicesUnderPressure)
  };
}
```

---

### **Step 5: Calculate Aggregate Statistics**

```javascript
function calculateConcurrentConflictInsights(requests) {
  if (requests.length === 0) {
    return {
      totalQueriesAnalyzed: 0,
      affectedQueriesCount: 0,
      avgVariancePercent: 0,
      peakHourInfo: null,
      flagBreakdown: {},
      recommendations: [],
      sampleQueries: []
    };
  }
  
  // Step 1: Identify peak hours
  const peakAnalysis = identifyPeakHours(requests);
  
  // Step 2: Analyze variance
  const varianceData = analyzeQueryVariance(requests, peakAnalysis);
  
  // Step 3: Analyze kernel time
  const kernelData = analyzeKernelTimeContention(requests);
  
  // Step 4: Flag counting
  const flagCounts = {
    A: { count: 0, name: 'Peak Hour Slowdown', queries: [] },
    B: { count: 0, name: 'Severe Peak Slowdown', queries: [] },
    C: { count: 0, name: 'High Kernel Time', queries: [] },
    D: { count: 0, name: 'Critical Kernel Time', queries: [] },
    E: { count: 0, name: 'Concurrent Heavy Query', queries: [] },
    F: { count: 0, name: 'Consistent Contention', queries: [] }
  };
  
  const queriesWithFlags = [];
  const recommendations = new Set();
  let totalVariance = 0;
  
  requests.forEach(req => {
    const analysis = analyzeConflictComplexity(req, peakAnalysis, varianceData, kernelData);
    
    if (analysis.hasConflict) {
      queriesWithFlags.push({
        request: req,
        flags: analysis.flags,
        flagDetails: analysis.flagDetails
      });
      
      analysis.flags.forEach(flag => {
        flagCounts[flag].count++;
        flagCounts[flag].queries.push(req);
        
        // Recommendations
        if (flag === 'A' || flag === 'B') {
          recommendations.add('Schedule resource-intensive queries during off-peak hours');
          recommendations.add('Consider implementing query throttling during peak periods');
        }
        if (flag === 'C' || flag === 'D') {
          recommendations.add('Review CPU-intensive operations and optimize query logic');
          recommendations.add('Consider adding indexes to reduce CPU usage');
        }
        if (flag === 'E') {
          recommendations.add('Implement query queuing to prevent concurrent heavy queries');
        }
      });
    }
  });
  
  // Calculate average variance
  if (varianceData.length > 0) {
    totalVariance = varianceData.reduce((sum, v) => sum + v.variancePercent, 0);
  }
  const avgVariancePercent = varianceData.length > 0 
    ? totalVariance / varianceData.length 
    : 0;
  
  // Sort samples by severity
  const sortedSamples = queriesWithFlags
    .sort((a, b) => {
      const aCritical = a.flags.filter(f => ['B', 'D'].includes(f)).length;
      const bCritical = b.flags.filter(f => ['B', 'D'].includes(f)).length;
      if (aCritical !== bCritical) return bCritical - aCritical;
      return b.flags.length - a.flags.length;
    })
    .slice(0, CONCURRENT_CONFLICT_THRESHOLDS.TOP_AFFECTED_QUERIES);
  
  return {
    totalQueriesAnalyzed: requests.length,
    affectedQueriesCount: queriesWithFlags.length,
    avgVariancePercent: Math.round(avgVariancePercent),
    peakHourInfo: {
      threshold: peakAnalysis.peakThreshold.toFixed(1),
      peakBucketCount: peakAnalysis.peakBuckets.length,
      offPeakBucketCount: peakAnalysis.offPeakBuckets.length
    },
    flagBreakdown: flagCounts,
    recommendations: Array.from(recommendations),
    sampleQueries: sortedSamples,
    varianceData: varianceData.slice(0, 10) // Top 10 most variable queries
  };
}
```

---

## UI Display Logic

### **Insight Activation**
```javascript
function shouldActivateConcurrentConflictInsight(stats) {
  return stats.totalQueriesAnalyzed > 0 && stats.affectedQueriesCount > 0;
}
```

### **Main Insight Description**
```html
<p class="insight-description">
  <span class="highlight-number">{affectedQueriesCount} queries</span> 
  show evidence of resource contention, with execution times varying by 
  <span class="highlight-number">{avgVariancePercent}%</span> during peak hours.
  
  <br><br>
  📊 <strong>Peak Period Analysis:</strong> 
  Peak threshold: <span class="highlight-number">{peakHourInfo.threshold}</span> queries/min
  ({peakHourInfo.peakBucketCount} peak periods vs {peakHourInfo.offPeakBucketCount} off-peak)
</p>
```

### **Flag Breakdown Display**
```html
<div class="flag-breakdown-section">
  <h5>🔍 Contention Breakdown:</h5>
  <div class="flag-grid">
    {Object.keys(flagBreakdown).forEach(flagKey => {
      const flag = flagBreakdown[flagKey];
      if (flag.count > 0) {
        return `
          <div class="flag-item ${getSeverityClass(flagKey)}">
            <strong>${flagKey}:</strong>
            <span>${flag.name}</span>
            <span>(${flag.count})</span>
          </div>
        `;
      }
    })}
  </div>
</div>
```

### **Sample Queries Table**
```html
<table class="sample-queries-table">
  <thead>
    <tr>
      <th>Request Date</th>
      <th>Flags</th>
      <th>Peak Time</th>
      <th>Off-Peak Time</th>
      <th>Variance</th>
      <th>Statement</th>
    </tr>
  </thead>
  <tbody>
    {sampleQueries.map(sample => {
      const variance = varianceData.find(v => 
        v.normalized === normalizeStatement(sample.request.statement)
      );
      
      return `
        <tr>
          <td>${formatTimestamp(sample.request.requestTime)}</td>
          <td style="font-weight: bold;">${sample.flags.join(', ')}</td>
          <td>${variance ? (variance.peakMedian/1000).toFixed(2) + 's' : 'N/A'}</td>
          <td>${variance ? (variance.offPeakMedian/1000).toFixed(2) + 's' : 'N/A'}</td>
          <td style="color: #dc3545; font-weight: bold;">
            ${variance ? '+' + variance.variancePercent.toFixed(1) + '%' : 'N/A'}
          </td>
          <td style="font-family: monospace; font-size: 11px;">
            ${escapeHtml(sample.request.statement)}
          </td>
        </tr>
      `;
    })}
  </tbody>
</table>
```

---

## Implementation Checklist

### Phase 1: Peak Hour Detection
- [ ] Implement `identifyPeakHours()` with time bucketing
- [ ] Calculate queries per minute for each bucket
- [ ] Determine peak threshold (75th percentile)
- [ ] Tag each query as peak vs off-peak

### Phase 2: Variance Analysis
- [ ] Implement `analyzeQueryVariance()` 
- [ ] Group queries by normalized statement
- [ ] Calculate median execution times (peak vs off-peak)
- [ ] Calculate variance percentage

### Phase 3: Kernel Time Analysis
- [ ] Implement `analyzeKernelTimeContention()`
- [ ] Calculate kernel time ratio for each query
- [ ] Flag high and critical kernel time ratios

### Phase 4: Flag Detection
- [ ] Implement `analyzeConflictComplexity()` with 4 flags (A-D)
- [ ] Optionally implement concurrent overlap detection (E, F)
- [ ] Map flags to recommendations

### Phase 5: UI Integration
- [ ] Update main insight description
- [ ] Add flag breakdown display
- [ ] Create sample queries table with variance columns
- [ ] Add peak hour info display
- [ ] Implement insight activation logic

### Phase 6: Testing
- [ ] Test with 24-hour dataset
- [ ] Test with workload having clear peak/off-peak patterns
- [ ] Validate variance calculations
- [ ] Test edge cases (all peak, all off-peak, etc.)

---

## Example Scenarios

### **Scenario 1: Peak Hour Query Degradation**
**Data:**
- Query: `SELECT * FROM orders WHERE status = 'pending'`
- Off-peak median: 1.2s (30 samples)
- Peak median: 2.5s (25 samples)
- Variance: 108%

**Flags:** B (Severe Peak Slowdown)

**Recommendation:** Schedule this query during off-peak hours or add index on `status` field.

---

### **Scenario 2: CPU Contention**
**Data:**
- Query: Complex aggregation with GROUP BY
- Elapsed time: 8.5s
- Kernel time: 4.2s
- Kernel ratio: 49%

**Flags:** C (High Kernel Time)

**Recommendation:** Review aggregation logic, consider pre-aggregating data or adding covering index.

---

### **Scenario 3: Combined Peak + CPU Issue**
**Data:**
- Off-peak: 3.0s (kernTime: 0.5s, ratio: 16%)
- Peak: 7.5s (kernTime: 3.8s, ratio: 50%)
- Variance: 150%

**Flags:** B (Severe Peak Slowdown), D (Critical Kernel Time)

**Recommendation:** Critical - this query is both slow during peak AND CPU-bound. Optimize query logic and schedule during maintenance window.

---

## Future Enhancements

- **Concurrent overlap detection**: Identify specific queries competing for resources
- **Time-of-day heatmap**: Visualize contention across 24-hour period
- **Resource correlation**: Link contention to memory/CPU/disk metrics
- **Auto-scheduling suggestions**: Recommend specific off-peak time windows
- **Historical trending**: Track contention patterns over days/weeks

---

## Complete UI Mockup with Example Data

### Collapsed State (No Issues Detected)
```
┌──────────────────────────────────────────────────┐
│ ▶ Concurrent Query Conflicts       [Dev Badge]  │
└──────────────────────────────────────────────────┘
```

---

### Expanded State (Active - Issues Found)

```
┌────────────────────────────────────────────────────────────────────────┐
│ ▼ Concurrent Query Conflicts                            [Dev Badge]    │ ← Blue border (active)
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ 47 queries show evidence of resource contention, with execution       │
│ times varying by more than 0% during peak hours.                      │
│                                                                         │
│ 📊 Service Pressure Analysis:                                          │
│ • Query Service: 12 queries with Parse+Plan >1ms                      │
│ • Data Service: 8 queries with Fetch >5ms per doc                     │
│ • Index Service: 15 queries with scan <5K records/sec                 │
│ • CPU Contention: 18 queries with kernel time >30%                    │
│                                                                         │
│ ┌──────────────────────────────────────────────────────────────┐      │
│ │ 🔍 Service Pressure Breakdown:                               │      │
│ │                                                               │      │
│ │ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓           │      │
│ │ ┃ A: Query Service Warning          (12) 🟡    ┃           │      │
│ │ ┃    Parse+Plan >1ms                            ┃           │      │
│ │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛           │      │
│ │                                                               │      │
│ │ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓           │      │
│ │ ┃ B: Query Service Critical          (3) 🔴    ┃           │      │
│ │ ┃    Parse+Plan >10ms                           ┃           │      │
│ │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛           │      │
│ │                                                               │      │
│ │ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓           │      │
│ │ ┃ C: Data Service Warning             (8) 🟡   ┃           │      │
│ │ ┃    Fetch >5ms per doc                         ┃           │      │
│ │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛           │      │
│ │                                                               │      │
│ │ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓           │      │
│ │ ┃ E: Index Service Warning           (15) 🟡   ┃           │      │
│ │ ┃    Scan <5K records/sec                       ┃           │      │
│ │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛           │      │
│ │                                                               │      │
│ │ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓           │      │
│ │ ┃ G: CPU Contention                  (18) 🟡   ┃           │      │
│ │ ┃    Kernel time >30%                           ┃           │      │
│ │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛           │      │
│ │                                                               │      │
│ │ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓           │      │
│ │ ┃ H: System-Wide Pressure             (6) 🔴   ┃           │      │
│ │ ┃    Multiple services under pressure           ┃           │      │
│ │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛           │      │
│ └──────────────────────────────────────────────────────────────┘      │
│                                                                         │
│ [Show Sample Queries]                                                  │
│                                                                         │
│ 💡 Query Service CPU pressure detected - consider scaling Query nodes │
│ 💡 Data Service slow - review KV operations and memory/disk I/O       │
│ 💡 Index Service under load - add replicas or optimize indexes        │
│ 💡 High CPU contention - reduce concurrent query load or add cores    │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

### Expanded with Sample Queries Table

```
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│ [Hide Sample Queries]                                                                       │
│                                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────────────────────┐│
│ │ Request Date      │ Flags   │ Parse+Plan │ Fetch/Doc │ Scan Rate │ Kern% │ Statement ││
│ ├───────────────────┼─────────┼────────────┼───────────┼───────────┼───────┼───────────┤│
│ │ 2025-01-15 10:23  │ A,C,G,H │ 2.3ms      │ 8.2ms     │ N/A       │ 42%   │ SELECT *  ││
│ │                   │  ↑       │            │           │           │       │ FROM      ││
│ │                   │  └─ Hover shows:      │           │           │       │ orders    ││
│ │                   │     "Parse+Plan took  │           │           │       │ WHERE...  ││
│ │                   │      2.3ms (should    │           │           │       │           ││
│ │                   │      be <1ms)"        │           │           │       │           ││
│ ├───────────────────┼─────────┼────────────┼───────────┼───────────┼───────┼───────────┤│
│ │ 2025-01-15 10:22  │ B, D, H │ 12.5ms     │ 15.3ms    │ N/A       │ 28%   │ SELECT    ││
│ │                   │         │            │           │           │       │ COUNT(*)  ││
│ │                   │         │            │           │           │       │ FROM...   ││
│ ├───────────────────┼─────────┼────────────┼───────────┼───────────┼───────┼───────────┤│
│ │ 2025-01-15 10:20  │ E, G    │ 0.5ms      │ N/A       │ 2,345/sec │ 35%   │ SELECT p  ││
│ │                   │         │            │           │           │       │ FROM prod ││
│ │                   │         │            │           │           │       │ WHERE...  ││
│ ├───────────────────┼─────────┼────────────┼───────────┼───────────┼───────┼───────────┤│
│ │ 2025-01-15 10:18  │ A       │ 1.8ms      │ N/A       │ N/A       │ 12%   │ UPDATE    ││
│ │                   │         │            │           │           │       │ users...  ││
│ ├───────────────────┼─────────┼────────────┼───────────┼───────────┼───────┼───────────┤│
│ │ 2025-01-15 10:15  │ C, H    │ 0.3ms      │ 6.7ms     │ N/A       │ 18%   │ SELECT o  ││
│ │                   │         │            │           │           │       │ FROM ord  ││
│ │                   │         │            │           │           │       │ USE KEYS  ││
│ └───────────────────┴─────────┴────────────┴───────────┴───────────┴───────┴───────────┘│
│                                                                                             │
│ Flag Legend:                                                                                │
│ 🟡 Warning:  A (Query >1ms) · C (Fetch >5ms/doc) · E (Scan <5K/sec) · G (Kern >30%)      │
│ 🔴 Critical: B (Query >10ms) · D (Fetch >10ms/doc) · F (Scan <1K/sec) · H (Multi-service)│
│ Hover over flags for details                                                               │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Example Data Flow with Dummy Data

### Input: 3 Sample Queries from system:completed_requests

```json
[
  {
    "requestTime": "2025-01-15T10:23:45Z",
    "statement": "SELECT * FROM orders WHERE status = 'pending'",
    "elapsedTime": 3450,
    "phaseTimes": {
      "parse": 1.2,
      "plan": 1.1,
      "fetch": 820,
      "kernTime": 1449
    },
    "phaseCounts": {
      "fetch": 100,
      "indexScan": 0
    }
  },
  {
    "requestTime": "2025-01-15T10:22:10Z",
    "statement": "SELECT COUNT(*) FROM products WHERE category = 'electronics'",
    "elapsedTime": 5200,
    "phaseTimes": {
      "parse": 8.3,
      "plan": 4.2,
      "fetch": 612,
      "kernTime": 1456
    },
    "phaseCounts": {
      "fetch": 40,
      "indexScan": 0
    }
  },
  {
    "requestTime": "2025-01-15T10:20:33Z",
    "statement": "SELECT p.* FROM products p WHERE p.price > 100",
    "elapsedTime": 8500,
    "phaseTimes": {
      "parse": 0.3,
      "plan": 0.2,
      "indexScan": 4267,
      "kernTime": 2975
    },
    "phaseCounts": {
      "indexScan": 10000,
      "fetch": 0
    }
  }
]
```

---

### Processing: Detection Logic Applied

**Query 1 Analysis:**
```javascript
// Step 1: Query Service Pressure
parsePlanTime = 1.2 + 1.1 = 2.3ms
→ FLAG A (>1ms warning)

// Step 2: Data Service Pressure  
fetchPerDoc = 820ms / 100 docs = 8.2ms per doc
→ FLAG C (>5ms warning)

// Step 3: Index Service Pressure
indexScanCount = 0 (N/A - no index scan)
→ No flag

// Step 4: CPU Contention
kernelRatio = 1449ms / 3450ms = 42%
→ FLAG G (>30% warning)

// Step 5: System-Wide
servicesUnderPressure = ['Query Service', 'Data Service', 'CPU/OS'] = 3 services
→ FLAG H (≥2 services)

Result: flags = ['A', 'C', 'G', 'H']
```

**Query 2 Analysis:**
```javascript
// Step 1: Query Service Pressure
parsePlanTime = 8.3 + 4.2 = 12.5ms
→ FLAG B (>10ms CRITICAL)

// Step 2: Data Service Pressure
fetchPerDoc = 612ms / 40 docs = 15.3ms per doc
→ FLAG D (>10ms CRITICAL)

// Step 4: CPU Contention
kernelRatio = 1456ms / 5200ms = 28%
→ No flag (<30%)

// Step 5: System-Wide
servicesUnderPressure = ['Query Service', 'Data Service'] = 2 services
→ FLAG H (≥2 services)

Result: flags = ['B', 'D', 'H']
```

**Query 3 Analysis:**
```javascript
// Step 1: Query Service Pressure
parsePlanTime = 0.3 + 0.2 = 0.5ms
→ No flag (<1ms)

// Step 3: Index Service Pressure
recordsPerSecond = (10000 / 4267ms) * 1000 = 2,344 records/sec
→ FLAG E (<5K records/sec warning)

// Step 4: CPU Contention
kernelRatio = 2975ms / 8500ms = 35%
→ FLAG G (>30% warning)

// Step 5: System-Wide
servicesUnderPressure = ['Index Service', 'CPU/OS'] = 2 services
→ FLAG H (≥2 services)

Result: flags = ['E', 'G', 'H']
```

---

### Output: Aggregated Insight Statistics

```javascript
{
  totalQueriesAnalyzed: 3,
  affectedQueriesCount: 3,
  
  flagBreakdown: {
    A: { count: 1, name: 'Query Service Warning', queries: [query1] },
    B: { count: 1, name: 'Query Service Critical', queries: [query2] },
    C: { count: 1, name: 'Data Service Warning', queries: [query1] },
    D: { count: 1, name: 'Data Service Critical', queries: [query2] },
    E: { count: 1, name: 'Index Service Warning', queries: [query3] },
    F: { count: 0, name: 'Index Service Critical', queries: [] },
    G: { count: 2, name: 'CPU Contention', queries: [query1, query3] },
    H: { count: 3, name: 'System-Wide Pressure', queries: [query1, query2, query3] }
  },
  
  servicesSummary: {
    'Query Service': 2,    // 2 queries affected
    'Data Service': 2,     // 2 queries affected
    'Index Service': 1,    // 1 query affected
    'CPU/OS': 2           // 2 queries affected
  },
  
  recommendations: [
    'Query Service CPU pressure detected - consider scaling Query nodes',
    'Data Service slow - review KV operations and memory/disk I/O',
    'Index Service under load - add replicas or optimize indexes',
    'High CPU contention - reduce concurrent query load or add cores'
  ],
  
  sampleQueries: [
    { request: query2, flags: ['B','D','H'], flagDetails: {...} },  // Worst (2 critical)
    { request: query1, flags: ['A','C','G','H'], flagDetails: {...} },
    { request: query3, flags: ['E','G','H'], flagDetails: {...} }
  ]
}
```

---

### UI Rendering: Sample Table Row (Query 1)

```html
<tr>
  <td>2025-01-15 10:23:45</td>
  
  <td style="font-weight: bold;">
    <span title="Parse+Plan took 2.3ms (should be <1ms)" style="color: #fd7e14;">A</span>, 
    <span title="Fetch 8.2ms per doc (820ms for 100 docs)" style="color: #fd7e14;">C</span>, 
    <span title="Kernel time 42.0% (1449ms / 3450ms)" style="color: #fd7e14;">G</span>, 
    <span title="3 services under pressure: Query Service, Data Service, CPU/OS" style="color: #dc3545;">H</span>
  </td>
  
  <td>2.3ms</td>
  <td>8.2ms</td>
  <td>N/A</td>
  <td style="color: #dc3545; font-weight: bold;">42%</td>
  
  <td style="font-family: monospace; font-size: 11px;">
    SELECT * FROM orders WHERE status = 'pending'
  </td>
</tr>
```
