# Complex JOIN Operations Insight - Logic & Implementation Guide

## Overview
This insight identifies problematic JOIN queries in Couchbase N1QL/SQL++ that exhibit performance issues, inefficient patterns, or unexpected data explosion. Each query is analyzed against multiple detection flags (A-H) and tagged accordingly.

---

## Complexity Flags (A-H)

Each JOIN query can trigger one or more of these flags:

| Flag | Name | Description | Severity |
|------|------|-------------|----------|
| **A** | Primary Scan in JOIN | Using primary index instead of secondary index during JOIN phase | 🔴 Critical |
| **B** | Cartesian Product | CROSS JOIN or missing/poor ON clause causing exponential results | 🔴 Critical |
| **C** | Data Explosion (UNNEST+JOIN) | Result set 2x-10x larger than input (often UNNEST followed by JOIN) | 🟡 High |
| **D** | Severe Data Explosion | Result set 10x+ larger than input | 🔴 Critical |
| **E** | Slow JOIN Phase | JOIN phase time ≥ 2 seconds | 🟡 High |
| **F** | High Document Processing | JOIN processed 100K+ documents | 🟡 High |
| **G** | Multiple JOINs | Query contains 4+ JOIN keywords (complex multi-table joins) | 🟠 Medium |
| **H** | JOIN Time Dominant | JOIN phase consumes ≥30% of total query time | 🟡 High |

---

## Detection Patterns

### 1. **JOIN Query Detection**
Identify queries containing JOIN operations:
- `INNER JOIN`
- `LEFT JOIN` / `LEFT OUTER JOIN`
- `RIGHT JOIN` / `RIGHT OUTER JOIN`
- `CROSS JOIN` (potential cartesian product)
- `ANSI JOIN` with ON clause
- Legacy `USE KEYS` in JOIN context
- Nested JOINs (JOINs within subqueries)

**Detection Method:**
```javascript
function hasJoin(statement) {
  const normalized = statement.toUpperCase();
  return /\b(INNER\s+JOIN|LEFT\s+(OUTER\s+)?JOIN|RIGHT\s+(OUTER\s+)?JOIN|CROSS\s+JOIN|JOIN\b)/i.test(normalized);
}
```

---

## Configurable Thresholds (Knobs to Tune)

These values should be adjustable constants at the top of the insight logic:

```javascript
const JOIN_THRESHOLDS = {
  // Data explosion detection
  MIN_EXPLOSION_RATIO: 2.0,          // Flag if result set is 2x+ input docs
  SEVERE_EXPLOSION_RATIO: 10.0,      // Critical threshold for UNNEST+JOIN
  
  // Performance thresholds
  SLOW_JOIN_MS: 2000,                // Join phase time > 2 seconds
  HIGH_JOIN_COUNT: 100000,           // Documents processed in join > 100K
  
  // Pattern detection
  MAX_ACCEPTABLE_JOINS: 3,           // More than 3 JOINs = complex
  MIN_JOIN_SELECTIVITY: 0.1,         // < 10% selectivity = poor join
  
  // Index usage
  PRIMARY_SCAN_IN_JOIN_THRESHOLD: 1, // Any primary scan in JOIN = bad
  
  // Result set analysis
  LARGE_RESULT_SET: 10000,           // Result count > 10K rows
  
  // Time ratios
  JOIN_TIME_RATIO_THRESHOLD: 0.30,   // Join time > 30% of total elapsed time
};
```

---

## Metrics to Capture from system:completed_requests

For each query identified as having JOIN:

### A. **Basic JOIN Metrics**
```javascript
{
  statement: string,              // Original query
  normalizedStatement: string,    // Normalized for grouping
  requestTime: timestamp,
  elapsedTime: number,           // Total query duration (ms)
  
  // JOIN-specific phase data
  joinPhaseTime: number,         // phaseTimes.join (ms)
  joinPhaseCount: number,        // phaseCounts.join (docs processed)
  
  // Pre-JOIN data
  scanCount: number,             // phaseCounts.indexScan OR phaseCounts.primaryScan
  fetchCount: number,            // phaseCounts.fetch
  
  // UNNEST detection
  unnestCount: number,           // phaseCounts.unnest (if exists)
  
  // Result metrics
  resultCount: number,           // Final result set size
  resultSize: number,            // usedMemory or resultSize in bytes
  
  // Index usage in JOIN
  primaryScanInJoin: boolean,    // Detect if primary scan used during join
  indexesUsed: array,            // List of indexes from execution plan
}
```

### B. **Calculated Metrics**
```javascript
{
  // Data explosion ratio
  explosionRatio: resultCount / (scanCount + fetchCount),
  
  // UNNEST explosion multiplier
  unnestMultiplier: unnestCount > 0 ? (joinPhaseCount / unnestCount) : 1,
  
  // JOIN time percentage
  joinTimePercent: (joinPhaseTime / elapsedTime) * 100,
  
  // JOIN count (number of JOIN keywords)
  joinCount: countJoinsInStatement(statement),
  
  // Selectivity (how much JOIN reduced data)
  joinSelectivity: resultCount / joinPhaseCount,
}
```

---

## Step-by-Step Detection Logic

### **Step 1: Identify JOIN Queries**
```javascript
function analyzeJoinQueries(requests) {
  const joinQueries = requests.filter(req => {
    const stmt = req.statement || req.preparedText || '';
    return hasJoin(stmt);
  });
  
  return joinQueries;
}
```

### **Step 2: Detect Data Explosion**
Check if result set is significantly larger than input (UNNEST + JOIN explosion):

```javascript
function detectDataExplosion(request) {
  const inputDocs = (request.phaseCounts?.indexScan || 0) + 
                    (request.phaseCounts?.fetch || 0) +
                    (request.phaseCounts?.primaryScan || 0);
  
  const outputDocs = request.resultCount || 0;
  
  if (inputDocs === 0) return { hasExplosion: false, ratio: 0 };
  
  const explosionRatio = outputDocs / inputDocs;
  
  return {
    hasExplosion: explosionRatio >= JOIN_THRESHOLDS.MIN_EXPLOSION_RATIO,
    isSevere: explosionRatio >= JOIN_THRESHOLDS.SEVERE_EXPLOSION_RATIO,
    ratio: explosionRatio,
    inputDocs,
    outputDocs
  };
}
```

### **Step 3: Detect UNNEST + JOIN Pattern**
Specific detection for UNNEST followed by JOIN (your insight):

```javascript
function hasUnnestJoinExplosion(request) {
  const stmt = (request.statement || request.preparedText || '').toUpperCase();
  const hasUnnest = /\bUNNEST\b/i.test(stmt);
  const hasJoin = /\bJOIN\b/i.test(stmt);
  
  if (!hasUnnest || !hasJoin) return false;
  
  const unnestCount = request.phaseCounts?.unnest || 0;
  const joinCount = request.phaseCounts?.join || 0;
  
  // Check if JOIN processed significantly more docs than UNNEST output
  if (unnestCount > 0 && joinCount > 0) {
    const multiplier = joinCount / unnestCount;
    return multiplier >= JOIN_THRESHOLDS.MIN_EXPLOSION_RATIO;
  }
  
  return false;
}
```

### **Step 4: Detect Complexity Flags for Each Query**

```javascript
function analyzeJoinComplexity(request) {
  const flags = [];
  const flagDetails = {};
  const stmt = (request.statement || request.preparedText || '').toUpperCase();
  
  // Get metrics
  const primaryScanCount = request.phaseCounts?.primaryScan || 0;
  const joinTime = request.phaseTimes?.join || 0;
  const joinCount = request.phaseCounts?.join || 0;
  const joinKeywordCount = (stmt.match(/\bJOIN\b/g) || []).length;
  const joinTimeRatio = joinTime / (request.elapsedTime || 1);
  const resultCount = request.resultCount || 0;
  
  // Calculate explosion ratio
  const inputDocs = (request.phaseCounts?.indexScan || 0) + 
                    (request.phaseCounts?.fetch || 0) +
                    (request.phaseCounts?.primaryScan || 0);
  const explosionRatio = inputDocs > 0 ? resultCount / inputDocs : 0;
  
  // FLAG A: Primary Scan in JOIN
  if (primaryScanCount > JOIN_THRESHOLDS.PRIMARY_SCAN_IN_JOIN_THRESHOLD) {
    flags.push('A');
    flagDetails.A = {
      name: 'Primary Scan in JOIN',
      severity: 'critical',
      value: primaryScanCount,
      message: `${primaryScanCount.toLocaleString()} docs scanned via primary index`
    };
  }
  
  // FLAG B: Cartesian Product
  if (/\bCROSS\s+JOIN\b/i.test(stmt)) {
    flags.push('B');
    flagDetails.B = {
      name: 'Cartesian Product',
      severity: 'critical',
      value: resultCount,
      message: `CROSS JOIN detected, produced ${resultCount.toLocaleString()} rows`
    };
  }
  
  // FLAG C: Data Explosion (2x-10x)
  if (explosionRatio >= JOIN_THRESHOLDS.MIN_EXPLOSION_RATIO && 
      explosionRatio < JOIN_THRESHOLDS.SEVERE_EXPLOSION_RATIO) {
    flags.push('C');
    flagDetails.C = {
      name: 'Data Explosion',
      severity: 'high',
      value: explosionRatio.toFixed(1),
      message: `Result set ${explosionRatio.toFixed(1)}x larger than input (${inputDocs} → ${resultCount})`
    };
  }
  
  // FLAG D: Severe Data Explosion (10x+)
  if (explosionRatio >= JOIN_THRESHOLDS.SEVERE_EXPLOSION_RATIO) {
    flags.push('D');
    flagDetails.D = {
      name: 'Severe Data Explosion',
      severity: 'critical',
      value: explosionRatio.toFixed(1),
      message: `Result set ${explosionRatio.toFixed(1)}x larger than input (${inputDocs} → ${resultCount})`
    };
  }
  
  // FLAG E: Slow JOIN Phase
  if (joinTime >= JOIN_THRESHOLDS.SLOW_JOIN_MS) {
    flags.push('E');
    flagDetails.E = {
      name: 'Slow JOIN Phase',
      severity: 'high',
      value: joinTime,
      message: `JOIN phase took ${(joinTime / 1000).toFixed(2)}s`
    };
  }
  
  // FLAG F: High Document Processing
  if (joinCount >= JOIN_THRESHOLDS.HIGH_JOIN_COUNT) {
    flags.push('F');
    flagDetails.F = {
      name: 'High Document Processing',
      severity: 'high',
      value: joinCount,
      message: `JOIN processed ${joinCount.toLocaleString()} documents`
    };
  }
  
  // FLAG G: Multiple JOINs
  if (joinKeywordCount > JOIN_THRESHOLDS.MAX_ACCEPTABLE_JOINS) {
    flags.push('G');
    flagDetails.G = {
      name: 'Multiple JOINs',
      severity: 'medium',
      value: joinKeywordCount,
      message: `Query contains ${joinKeywordCount} JOIN operations`
    };
  }
  
  // FLAG H: JOIN Time Dominant
  if (joinTimeRatio >= JOIN_THRESHOLDS.JOIN_TIME_RATIO_THRESHOLD) {
    flags.push('H');
    flagDetails.H = {
      name: 'JOIN Time Dominant',
      severity: 'high',
      value: (joinTimeRatio * 100).toFixed(1),
      message: `JOIN consumes ${(joinTimeRatio * 100).toFixed(1)}% of total query time`
    };
  }
  
  return {
    flags,           // Array of flag letters: ['A', 'C', 'E']
    flagDetails,     // Object with details for each flag
    hasIssues: flags.length > 0
  };
}
```

### **Step 5: Calculate Aggregate Statistics with Flag Breakdown**

```javascript
function calculateJoinInsights(joinQueries) {
  if (joinQueries.length === 0) {
    return {
      totalJoinQueries: 0,
      avgJoinTime: 0,
      complexQueriesCount: 0,
      complexQueriesPercent: 0,
      flagBreakdown: {},
      recommendations: [],
      sampleQueries: []
    };
  }
  
  // Initialize flag counters
  const flagCounts = {
    A: { count: 0, name: 'Primary Scan in JOIN', queries: [] },
    B: { count: 0, name: 'Cartesian Product', queries: [] },
    C: { count: 0, name: 'Data Explosion (2x-10x)', queries: [] },
    D: { count: 0, name: 'Severe Explosion (10x+)', queries: [] },
    E: { count: 0, name: 'Slow JOIN Phase', queries: [] },
    F: { count: 0, name: 'High Doc Processing', queries: [] },
    G: { count: 0, name: 'Multiple JOINs', queries: [] },
    H: { count: 0, name: 'JOIN Time Dominant', queries: [] }
  };
  
  let totalJoinTime = 0;
  let complexQueriesCount = 0;
  const recommendations = new Set();
  const queriesWithFlags = [];
  
  joinQueries.forEach(req => {
    // Calculate JOIN time
    const joinTime = req.phaseTimes?.join || 0;
    totalJoinTime += joinTime;
    
    // Analyze complexity flags
    const analysis = analyzeJoinComplexity(req);
    
    if (analysis.hasIssues) {
      complexQueriesCount++;
      
      // Store query with its flags for sample table
      queriesWithFlags.push({
        request: req,
        flags: analysis.flags,
        flagDetails: analysis.flagDetails
      });
      
      // Count each flag
      analysis.flags.forEach(flag => {
        flagCounts[flag].count++;
        flagCounts[flag].queries.push(req);
        
        // Add recommendations based on flags
        if (flag === 'A') {
          recommendations.add('Create secondary indexes on JOIN keys to eliminate primary scans');
        }
        if (flag === 'B') {
          recommendations.add('Review CROSS JOIN usage and ensure proper ON conditions');
        }
        if (flag === 'C' || flag === 'D') {
          recommendations.add('Analyze UNNEST + JOIN patterns causing data explosion');
        }
        if (flag === 'E') {
          recommendations.add('Optimize JOIN predicates and ensure proper index coverage');
        }
        if (flag === 'F') {
          recommendations.add('Consider adding WHERE filters before JOIN to reduce document processing');
        }
        if (flag === 'G') {
          recommendations.add('Consider denormalizing data to reduce multi-table JOINs');
        }
        if (flag === 'H') {
          recommendations.add('JOIN is the bottleneck - review join strategy and index usage');
        }
      });
    }
  });
  
  const avgJoinTime = totalJoinTime / joinQueries.length;
  const complexQueriesPercent = (complexQueriesCount / joinQueries.length) * 100;
  
  // Sort sample queries by severity (most flags first, then by critical flags)
  const sortedSamples = queriesWithFlags
    .sort((a, b) => {
      // Prioritize critical flags (A, B, D)
      const aCritical = a.flags.filter(f => ['A', 'B', 'D'].includes(f)).length;
      const bCritical = b.flags.filter(f => ['A', 'B', 'D'].includes(f)).length;
      if (aCritical !== bCritical) return bCritical - aCritical;
      
      // Then by total flag count
      return b.flags.length - a.flags.length;
    })
    .slice(0, 10); // Top 10 worst queries
  
  return {
    totalJoinQueries: joinQueries.length,
    avgJoinTime: Math.round(avgJoinTime),
    complexQueriesCount,
    complexQueriesPercent: Math.round(complexQueriesPercent),
    flagBreakdown: flagCounts,
    recommendations: Array.from(recommendations),
    sampleQueries: sortedSamples
  };
}
```

---

## UI Display Logic

### **Insight Activation**
The insight should become "active" (blue border) when:
```javascript
function shouldActivateJoinInsight(stats) {
  return stats.totalJoinQueries > 0 && stats.complexQueriesCount > 0;
}
```

### **Main Insight Description Template**
```html
<p class="insight-description">
  <span class="highlight-number">{totalJoinQueries} JOIN queries</span> detected, 
  with <span class="highlight-number">{complexQueriesCount}</span> 
  (<span class="highlight-number">{complexQueriesPercent}%</span>) 
  flagged as complex. Average JOIN phase time: 
  <span class="highlight-number">{avgJoinTime/1000}s</span>.
</p>
```

### **Flag Breakdown Display**

Show detailed breakdown of complexity flags with counts:

```html
<div class="flag-breakdown-section" style="margin: 15px 0; background: #f8f9fa; padding: 12px; border-radius: 6px;">
  <h5 style="margin: 0 0 10px 0; font-size: 13px; color: #495057;">🔍 Complexity Breakdown:</h5>
  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px;">
    
    {Object.keys(flagBreakdown).forEach(flagKey => {
      const flag = flagBreakdown[flagKey];
      if (flag.count > 0) {
        const severity = getSeverityClass(flagKey); // 'critical', 'high', 'medium'
        return `
          <div class="flag-item ${severity}" style="display: flex; align-items: center; gap: 6px; padding: 6px 8px; background: white; border-radius: 4px; border-left: 3px solid ${getSeverityColor(severity)};">
            <strong style="font-size: 14px; min-width: 20px;">${flagKey}:</strong>
            <span style="flex: 1; font-size: 12px; color: #666;">${flag.name}</span>
            <span style="font-weight: bold; color: ${getSeverityColor(severity)};">(${flag.count})</span>
          </div>
        `;
      }
    })}
    
  </div>
</div>

<!-- Helper functions -->
<script>
function getSeverityClass(flag) {
  if (['A', 'B', 'D'].includes(flag)) return 'critical';
  if (['C', 'E', 'F', 'H'].includes(flag)) return 'high';
  return 'medium';
}

function getSeverityColor(severity) {
  if (severity === 'critical') return '#dc3545';
  if (severity === 'high') return '#fd7e14';
  return '#ffc107';
}
</script>
```

**Example Output:**
```
🔍 Complexity Breakdown:
┌─────────────────────────────────────────┐
│ A: Primary Scan in JOIN          (5)   │ 🔴
│ C: Data Explosion (2x-10x)       (3)   │ 🟡
│ E: Slow JOIN Phase               (7)   │ 🟡
│ G: Multiple JOINs                (2)   │ 🟠
└─────────────────────────────────────────┘
```

### **Sample Queries Table with Flags Column**

```html
<button onclick="toggleInsightSampleQueries('complex-join-operations')" class="btn-standard">
  Show Sample Queries
</button>

<div id="complex-join-operations-sample-queries-container" style="display: none; margin-top: 10px;">
  <table class="sample-queries-table">
    <thead>
      <tr>
        <th style="width: 120px;">Request Date</th>
        <th style="width: 80px;">Flags</th>
        <th style="width: 100px;">JOIN Time</th>
        <th>Statement (unique)</th>
      </tr>
    </thead>
    <tbody id="complex-join-operations-sample-queries-tbody">
      {sampleQueries.map(sample => {
        const req = sample.request;
        const flags = sample.flags.join(', ');
        const flagsWithTooltip = sample.flags.map(f => {
          const detail = sample.flagDetails[f];
          return `<span title="${detail.message}">${f}</span>`;
        }).join(', ');
        
        return `
          <tr>
            <td>${formatTimestamp(req.requestTime)}</td>
            <td style="font-weight: bold; color: #dc3545;">${flagsWithTooltip}</td>
            <td>${(req.phaseTimes?.join / 1000).toFixed(2)}s</td>
            <td style="font-family: monospace; font-size: 11px; max-width: 500px; overflow: hidden; text-overflow: ellipsis;">
              ${escapeHtml(req.statement || req.preparedText)}
            </td>
          </tr>
        `;
      })}
    </tbody>
  </table>
  
  <!-- Flag Legend below table -->
  <div style="margin-top: 10px; padding: 8px; background: #fff3cd; border-radius: 4px; font-size: 11px;">
    <strong>Flag Legend:</strong>
    <span style="margin-left: 10px;">🔴 Critical: A, B, D</span>
    <span style="margin-left: 10px;">🟡 High: C, E, F, H</span>
    <span style="margin-left: 10px;">🟠 Medium: G</span>
    <br>
    <em>Hover over flags for details</em>
  </div>
</div>
```

**Example Table Output:**
```
┌──────────────────────┬────────┬────────────┬─────────────────────────────┐
│ Request Date         │ Flags  │ JOIN Time  │ Statement (unique)          │
├──────────────────────┼────────┼────────────┼─────────────────────────────┤
│ 2025-01-15 10:23:45  │ A, D, E│ 5.23s      │ SELECT * FROM orders o...   │
│ 2025-01-15 10:22:10  │ A, C   │ 2.45s      │ SELECT p.* FROM products... │
│ 2025-01-15 10:20:33  │ E, H   │ 3.12s      │ SELECT o.*, c.* FROM...     │
└──────────────────────┴────────┴────────────┴─────────────────────────────┘
```

### **Recommendations Section**
Display dynamic recommendations based on detected flags:
```html
<div class="learn-more-section">
  {recommendations.map(rec => 
    <div class="learn-more-item">
      <span class="learn-more-icon">💡</span>
      {rec}
    </div>
  )}
</div>
```

---

## Example Scenarios

### **Scenario 1: UNNEST + JOIN Explosion**
**Query:**
```sql
SELECT o.*, p.*
FROM orders o
UNNEST o.items AS item
JOIN products p ON KEYS item.productId
```

**Data:**
- Input: 10,000 orders
- UNNEST produces: 50,000 items (avg 5 items/order)
- JOIN matches: 50,000 products
- Result: 50,000 rows

**Detection:**
- `explosionRatio = 50000 / 10000 = 5.0` ✅ Triggered (> 2.0)
- `unnestMultiplier = 50000 / 50000 = 1.0` (JOIN didn't multiply further)

---

### **Scenario 2: Cartesian Product (Bad JOIN)**
**Query:**
```sql
SELECT a.*, b.*
FROM bucket1 a
JOIN bucket2 b ON a.status = b.status
```

**Data:**
- bucket1: 1,000 docs (500 with status='active')
- bucket2: 10,000 docs (5,000 with status='active')
- Result: 2,500,000 rows (500 × 5,000)

**Detection:**
- `explosionRatio = 2500000 / 11000 = 227.3` ✅ Critical (> 10.0)
- `joinSelectivity = 2500000 / 2500000 = 1.0` (poor selectivity)
- Issue: Low-cardinality join key causing explosion

---

### **Scenario 3: Primary Scan in JOIN**
**Query:**
```sql
SELECT o.*, c.*
FROM orders o
JOIN customers c ON o.customerId = c.id
```

**Data:**
- `phaseCounts.primaryScan = 50000` (customers has no index on `id`)
- `phaseTimes.join = 5000ms`

**Detection:**
- `primaryScanInJoin = true` ✅ Critical issue
- Recommendation: "Create index on customers(id)"

---

## Implementation Checklist

### Phase 1: Core Detection Logic
- [ ] Add `JOIN_THRESHOLDS` configuration object with all 8 threshold constants
- [ ] Implement `hasJoin()` detection function
- [ ] Implement `detectDataExplosion()` calculation
- [ ] Implement `hasUnnestJoinExplosion()` pattern detection
- [ ] Implement `analyzeJoinComplexity()` with all 8 flags (A-H)

### Phase 2: Aggregation & Analysis
- [ ] Implement `calculateJoinInsights()` with flag counting
- [ ] Implement flag breakdown aggregation
- [ ] Implement sample query sorting by severity
- [ ] Implement recommendations mapping from flags

### Phase 3: UI Integration
- [ ] Update main insight description with dynamic values
- [ ] Add flag breakdown display section
- [ ] Add "Show Sample Queries" button
- [ ] Create sample query table with Flags column
- [ ] Add flag legend and tooltips
- [ ] Add severity color coding (red/orange/yellow)
- [ ] Implement insight activation logic

### Phase 4: Testing & Refinement
- [ ] Test with real data containing various JOIN patterns
- [ ] Test edge cases (no JOINs, all flags triggered, etc.)
- [ ] Verify flag counts match sample query flags
- [ ] Validate threshold values with real workloads
- [ ] Document threshold tuning in AGENTS.md

### Phase 5: Enhancement
- [ ] Add filtering by specific flags
- [ ] Add click-to-drill-down on flag breakdown items
- [ ] Add chart showing flag distribution over time
- [ ] Add flag correlation analysis (which flags appear together)

---

## Questions for Broad Analysis

1. **Are we using the right JOIN strategy?**
   - Detection: Compare ANSI JOIN vs USE KEYS performance
   
2. **Do we have proper indexes on both sides?**
   - Detection: Check for primary scans in JOIN phase
   
3. **Are JOIN keys selective enough?**
   - Detection: Calculate `joinSelectivity` ratio
   
4. **Should this be denormalized instead?**
   - Detection: Frequent JOINs on same tables with high explosion ratios
   
5. **Are we joining too many collections?**
   - Detection: Count JOIN keywords > threshold
   
6. **Is the JOIN order optimal?**
   - Detection: Large left keyspace with small result set
   
7. **Are we doing JOINs in application vs database?**
   - Context: If JOIN time > 50% of total, consider app-side joining
   
8. **Is UNNEST causing unexpected multiplication?**
   - Detection: Your insight - UNNEST followed by JOIN with high multiplier

---

## Future Enhancements

- **Index recommendation engine**: Suggest missing indexes based on JOIN predicates
- **Query rewrite suggestions**: Propose alternative JOIN syntax
- **Historical trending**: Track JOIN performance over time
- **Cost estimation**: Predict JOIN cost based on keyspace sizes
- **Execution plan visualization**: Show JOIN strategy in flow diagram

---

## Complete UI Mockup

### Collapsed State (No Issues)
```
┌─────────────────────────────────────────────────┐
│ ▶ Complex JOIN Operations          [Dev Badge] │
└─────────────────────────────────────────────────┘
```

### Expanded State (Active - Issues Found)
```
┌─────────────────────────────────────────────────────────────────┐
│ ▼ Complex JOIN Operations                        [Dev Badge]    │ ← Blue border (active)
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ 47 JOIN queries detected, with 12 (25%) flagged as complex.    │
│ Average JOIN phase time: 1.8s.                                  │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ 🔍 Complexity Breakdown:                                 │   │
│ │                                                           │   │
│ │ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓             │   │
│ │ ┃ A: Primary Scan in JOIN          (5) 🔴 ┃             │   │
│ │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛             │   │
│ │                                                           │   │
│ │ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓             │   │
│ │ ┃ C: Data Explosion (2x-10x)       (3) 🟡 ┃             │   │
│ │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛             │   │
│ │                                                           │   │
│ │ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓             │   │
│ │ ┃ E: Slow JOIN Phase               (7) 🟡 ┃             │   │
│ │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛             │   │
│ │                                                           │   │
│ │ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓             │   │
│ │ ┃ G: Multiple JOINs                (2) 🟠 ┃             │   │
│ │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛             │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│ [Show Sample Queries]                                           │
│                                                                  │
│ 💡 Create secondary indexes on JOIN keys to eliminate primary  │
│    scans                                                         │
│ 💡 Analyze UNNEST + JOIN patterns causing data explosion       │
│ 💡 Optimize JOIN predicates and ensure proper index coverage   │
│ 💡 Consider denormalizing data to reduce multi-table JOINs     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Expanded with Sample Queries Table
```
┌─────────────────────────────────────────────────────────────────┐
│ [Hide Sample Queries]                                            │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ Request Date      │ Flags │ JOIN Time │ Statement          ││
│ ├───────────────────┼───────┼───────────┼────────────────────┤│
│ │ 2025-01-15 10:23  │ A,D,E │ 5.23s     │ SELECT * FROM...  ││
│ │                   │  ↑     │           │ orders o UNNEST   ││
│ │                   │  └─ Hover shows:  │ o.items JOIN...   ││
│ │                   │     "Using primary│                    ││
│ │                   │      index (50K)" │                    ││
│ ├───────────────────┼───────┼───────────┼────────────────────┤│
│ │ 2025-01-15 10:22  │ A, C  │ 2.45s     │ SELECT p.* FROM   ││
│ │                   │       │           │ products p JOIN...││
│ ├───────────────────┼───────┼───────────┼────────────────────┤│
│ │ 2025-01-15 10:20  │ E, H  │ 3.12s     │ SELECT o.*, c.*   ││
│ │                   │       │           │ FROM orders o...  ││
│ └───────────────────┴───────┴───────────┴────────────────────┘│
│                                                                  │
│ Flag Legend: 🔴 Critical: A, B, D  🟡 High: C, E, F, H         │
│              🟠 Medium: G                                       │
│ Hover over flags for details                                    │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow Summary
```
parseJSON()
    ↓
Filter for JOIN queries (hasJoin)
    ↓
For each JOIN query:
    analyzeJoinComplexity() → { flags: ['A','C'], flagDetails: {...} }
    ↓
calculateJoinInsights()
    ↓
    ├─ Count each flag occurrence
    ├─ Sort queries by severity
    ├─ Generate recommendations
    └─ Return { totalJoinQueries, complexQueriesCount, flagBreakdown, sampleQueries }
    ↓
Update UI:
    ├─ Main description
    ├─ Flag breakdown grid
    ├─ Sample queries table (with Flags column)
    └─ Recommendations list
```
