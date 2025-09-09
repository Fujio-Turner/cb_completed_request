// Core utility functions extracted for testing

// HTML utils
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Time parsing/formatting
function parseTime(str) {
  if (!str) return 0;
  if (typeof str === 'number') return str;
  // handle complex like 1h2m3.456s or 1.201234s
  let totalMs = 0;
  const sMatch = str.match(/([0-9]+(?:\.[0-9]+)?)s/);
  if (sMatch) totalMs += parseFloat(sMatch[1]) * 1000;
  const msMatch = str.match(/([0-9]+(?:\.[0-9]+)?)ms/);
  if (msMatch) totalMs += parseFloat(msMatch[1]);
  const usMatch = str.match(/([0-9]+(?:\.[0-9]+)?)(?:µs|us)/);
  if (usMatch) totalMs += parseFloat(usMatch[1]) / 1000;
  const nsMatch = str.match(/([0-9]+)ns/);
  if (nsMatch) totalMs += parseInt(nsMatch[1], 10) / 1e6;
  const hMatch = str.match(/([0-9]+)h/);
  if (hMatch) totalMs += parseInt(hMatch[1], 10) * 3600000;
  const mMatch = str.match(/([0-9]+)m(?!s)/);
  if (mMatch) totalMs += parseInt(mMatch[1], 10) * 60000;
  return Math.round(totalMs * 1000) / 1000; // keep ms precision
}

function formatTime(ms) {
  if (!ms || ms < 0) return '00:00.000';
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const millis = Math.floor(ms % 1000);
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  const sss = String(millis).padStart(3, '0');
  return `${mm}:${ss}.${sss}`;
}

function formatTimeTooltip(ms, originalText) {
  if (ms < 1) return `Original: ${originalText}`;
  return `${formatTime(ms)} (ms)`;
}

// SQL normalization and filters
function normalizeStatement(sql) {
  if (!sql) return '';
  let out = sql;
  // replace string literals
  out = out.replace(/'[^']*'/g, '?');
  out = out.replace(/"[^"]*"/g, '?');
  // replace numbers (keep decimals)
  out = out.replace(/\b\d+(?:\.\d+)?\b/g, '?');
  return out;
}

function hasFilteringMechanism(sql) {
  if (!sql) return false;
  return /\bWHERE\b|\bUSE\s+KEYS\b/i.test(sql);
}

// Colors
function getColorClass(value) {
  if (value == null) return 'green';
  if (value < 100) return 'green';
  if (value < 500) return 'yellow';
  if (value < 1000) return 'orange';
  return 'red';
}

function getPercentageColor(pct) {
  if (pct == null) return { color: '#6c757d', bg: '#e9ecef', text: 'N/A' };
  if (pct < 25) return { color: '#28a745', bg: '#d4edda', text: 'low' };
  if (pct < 50) return { color: '#ffc107', bg: '#fff3cd', text: 'medium' };
  if (pct < 75) return { color: '#fd7e14', bg: '#ffe5d0', text: 'high' };
  return { color: '#dc3545', bg: '#f8d7da', text: 'critical' };
}

// Time grouping
function getOptimalTimeUnit(requests) {
  if (!Array.isArray(requests) || requests.length < 2) return 'minute';
  const times = requests
    .map(r => new Date(r.requestTime).getTime())
    .filter(v => !isNaN(v));
  if (times.length < 2) return 'minute';
  const span = Math.max(...times) - Math.min(...times);
  const oneHour = 3600000;
  const oneDay = 24 * oneHour;
  const oneWeek = 7 * oneDay;
  if (span >= oneWeek * 2) return 'week';
  if (span >= oneDay) return 'day';
  if (span >= oneHour) return 'hour';
  return 'minute';
}

function roundTimestamp(date, unit, requests) {
  const d = new Date(date);
  const u = unit === 'optimizer' ? getOptimalTimeUnit(requests || []) : unit;
  if (u === 'week') {
    const day = d.getUTCDay();
    const diff = (day + 6) % 7; // make Monday=0
    d.setUTCDate(d.getUTCDate() - diff);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }
  if (u === 'day') { d.setUTCHours(0,0,0,0); return d; }
  if (u === 'hour') { d.setUTCMinutes(0,0,0); return d; }
  if (u === 'minute') { d.setUTCSeconds(0,0); return d; }
  return d;
}

function getTimeConfig(requestedUnit, requests) {
  const stepSize = 1;
  const unit = requestedUnit === 'optimizer' ? getOptimalTimeUnit(requests || []) : requestedUnit;
  const configs = {
    second: { unit: 'second', stepSize, displayFormats: { second: 'HH:mm:ss' } },
    minute: { unit: 'minute', stepSize, displayFormats: { minute: 'MMM dd HH:mm' } },
    hour: { unit: 'hour', stepSize, displayFormats: { hour: 'MMM dd HH:mm' } },
    day: { unit: 'day', stepSize, displayFormats: { day: 'MMM dd' } },
    week: { unit: 'week', stepSize, displayFormats: { week: 'MMM dd' } },
    month: { unit: 'month', stepSize, displayFormats: { month: 'MMM yyyy' } },
    year: { unit: 'year', stepSize, displayFormats: { year: 'yyyy' } },
  };
  return configs[unit] || configs['minute'];
}

// Plan operator helpers
function getOperators(plan) {
  const ops = [];
  function walk(node) {
    if (!node || typeof node !== 'object') return;
    if (node['#operator']) ops.push(node['#operator']);
    if (node['~child']) walk(node['~child']);
    if (Array.isArray(node['~children'])) node['~children'].forEach(walk);
  }
  walk(plan);
  return ops;
}

function calculateOperatorTotalsAndMax(statsArray) {
  const totals = {};
  let max = 0;
  statsArray.forEach((s) => {
    Object.keys(s).forEach((k) => {
      totals[k] = (totals[k] || 0) + s[k];
      if (totals[k] > max) max = totals[k];
    });
  });
  return { totals, max };
}

// Statement type + system query filters
function deriveStatementType(statement) {
  if (!statement) return 'UNKNOWN';
  const s = statement.trim().toUpperCase();
  const types = ['SELECT','INSERT','UPDATE','DELETE','MERGE','CREATE INDEX','ALTER INDEX','DROP INDEX','INFER','ADVISE'];
  for (const t of types) {
    if (s.startsWith(t)) return t;
  }
  return s.split(/\s+/)[0];
}

function shouldExcludeSystemQuery(statement, exclude = true, patterns = [/\bsystem:/i, /\bINFER\b/i, /\bADVISE\b/i, /\bCREATE\s+INDEX\b/i, /\bALTER\s+INDEX\b/i, /\bDROP\s+INDEX\b/i]) {
  if (!exclude) return false;
  if (!statement) return false;
  return patterns.some((re) => re.test(statement));
}

function filterSystemQueries(statements, exclude = true, textFilter = '') {
  const lower = (textFilter || '').toLowerCase();
  return statements.filter((s) => {
    if (exclude && shouldExcludeSystemQuery(s)) return false;
    if (lower && !s.toLowerCase().includes(lower)) return false;
    return true;
  });
}

// Cache helpers (simple in-memory caches for tests)
const _caches = { A: new Map(), B: new Map() };
function clearCaches() { _caches.A.clear(); _caches.B.clear(); return true; }
function logCacheStats() { return { A: _caches.A.size, B: _caches.B.size }; }

// Memory usage config
function buildMemoryUsageConfig(requests) {
  const labels = [];
  const usedMB = [];
  const serviceMs = [];
  requests.forEach(r => {
    labels.push(r.requestId || r.clientContextID || '');
    usedMB.push(Math.round(((r.usedMemory || 0) / (1024)) * 100) / 100); // KB -> MB if input is KB; if bytes, adjust in tests
    serviceMs.push(parseTime(r.serviceTime));
  });
  return {
    labels,
    datasets: [
      { type: 'bar', label: 'Used Memory (MB)', data: usedMB },
      { type: 'line', label: 'Service Time (ms)', data: serviceMs },
    ],
  };
}

// Query Pattern Features config (very small demo: count WHERE, JOIN, GROUP BY)
function buildQueryPatternFeaturesConfig(statements) {
  const categories = ['WHERE', 'JOIN', 'GROUP BY'];
  const counts = categories.map(cat => 0);
  statements.forEach(s => {
    const u = (s || '').toUpperCase();
    if (/\bWHERE\b/.test(u)) counts[0]++;
    if (/\bJOIN\b/.test(u)) counts[1]++;
    if (/\bGROUP\s+BY\b/.test(u)) counts[2]++;
  });
  const colors = ['#007bff', '#28a745', '#ffc107'];
  return { labels: categories, datasets: [{ data: counts, backgroundColor: colors }] };
}

// Index usage donut
function checkOperatorForIndexType(op) {
  if (!op || typeof op !== 'object') return { primary: 0, sequential: 0 };
  const name = op['#operator'] || '';
  const isPrimary = /PrimaryScan/i.test(name);
  const isSequential = op.using === 'sequentialscan' || /sequentialscan/i.test(name);
  return { primary: isPrimary ? 1 : 0, sequential: isSequential ? 1 : 0 };
}

function buildPrimaryScanDonutConfig(plans) {
  let primary = 0, sequential = 0;
  plans.forEach(p => {
    function walk(node) {
      if (!node || typeof node !== 'object') return;
      const res = checkOperatorForIndexType(node);
      primary += res.primary; sequential += res.sequential;
      if (node['~child']) walk(node['~child']);
      if (Array.isArray(node['~children'])) node['~children'].forEach(walk);
    }
    walk(p);
  });
  return {
    labels: ['Primary Index Scans', 'Sequential Scans'],
    datasets: [{ data: [primary, sequential], backgroundColor: ['#ff6384', '#ff9f40'] }]
  };
}

// Elapsed time buckets
function buildElapsedTimeBucketsConfig(requests) {
  const buckets = ['<10ms','10-50ms','50-100ms','100-500ms','>500ms'];
  const counts = [0,0,0,0,0];
  requests.forEach(r => {
    const ms = parseTime(r.elapsedTime);
    if (ms < 10) counts[0]++;
    else if (ms < 50) counts[1]++;
    else if (ms < 100) counts[2]++;
    else if (ms < 500) counts[3]++;
    else counts[4]++;
  });
  return { labels: buckets, datasets: [{ data: counts }] };
}

// Operations timeline aggregation
function aggregateOperationsTimeline(requests, unit = 'optimizer') {
  const actualUnit = unit === 'optimizer' ? getOptimalTimeUnit(requests) : unit;
  const groups = new Map();
  requests.forEach(r => {
    if (!r.requestTime) return;
    const ts = roundTimestamp(new Date(r.requestTime), actualUnit, requests).toISOString();
    const idx = (r.indexInfo && (r.indexInfo.stats.primaryScan + r.indexInfo.stats.indexScan)) || 0;
    const fetch = (r.indexInfo && r.indexInfo.stats.fetch) || 0;
    const g = groups.get(ts) || { timestamp: new Date(ts), totalIndexScan: 0, totalFetch: 0, indexScanQueryCount: 0 };
    g.totalIndexScan += idx;
    g.totalFetch += fetch;
    if (idx > 0) g.indexScanQueryCount += 1;
    groups.set(ts, g);
  });
  const sorted = Array.from(groups.values()).sort((a,b) => a.timestamp - b.timestamp);
  const avgIndex = sorted.map(it => it.indexScanQueryCount ? Math.round(it.totalIndexScan / it.indexScanQueryCount) : null);
  return { actualUnit, data: sorted, avgIndex };
}

function buildOperationsTimelineConfig(agg, requests) {
  const labels = agg.data.map(d => d.timestamp);
  return {
    data: {
      labels,
      datasets: [
        { label: 'Index Scan Items', data: agg.data.map(d => d.totalIndexScan), type: 'bar', yAxisID: 'y' },
        { label: 'Fetch Documents', data: agg.data.map(d => d.totalFetch), type: 'bar', yAxisID: 'y' },
        { label: 'Avg Index Scans per Query', data: agg.avgIndex, type: 'line', yAxisID: 'y1' },
      ]
    },
    options: { scales: { x: { type: 'time', time: getTimeConfig(agg.actualUnit, requests) } } }
  };
}

// Render smoke for group phase times
function buildQueryGroupPhaseTimesConfig() {
  return { type: 'bar', data: { labels: ['Authorize','Parse','Plan','Index Scan','Doc Fetch','Filter','Project','Stream'], datasets: [{ label: 'avg', data: [1,2,3,4,5,6,7,8] }] } };
}

module.exports = {
  // html
  escapeHtml,
  // time
  parseTime, formatTime, formatTimeTooltip,
  // sql
  normalizeStatement, hasFilteringMechanism,
  // colors
  getColorClass, getPercentageColor,
  // time grouping
  getOptimalTimeUnit, roundTimestamp, getTimeConfig,
  // plan
  getOperators, calculateOperatorTotalsAndMax,
  // statements
  deriveStatementType, shouldExcludeSystemQuery, filterSystemQueries,
  // caches
  clearCaches, logCacheStats,
  // configs
  buildMemoryUsageConfig, buildQueryPatternFeaturesConfig,
  checkOperatorForIndexType, buildPrimaryScanDonutConfig,
  buildElapsedTimeBucketsConfig,
  aggregateOperationsTimeline, buildOperationsTimelineConfig,
  buildQueryGroupPhaseTimesConfig,
};
