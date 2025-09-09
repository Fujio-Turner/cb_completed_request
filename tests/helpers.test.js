const core = require('../en/core');

describe('HTML utils', () => {
  test('escapeHtml encodes special characters', () => {
    expect(core.escapeHtml("<div id=\"x\">&'</div>")).toBe('&lt;div id=&quot;x&quot;&gt;&amp;&#039;&lt;/div&gt;');
  });
});

describe('Time parsing/formatting', () => {
  test('parseTime handles ms/us/ns and complex h/m/s', () => {
    expect(core.parseTime('2.345ms')).toBeCloseTo(2.345, 3);
    expect(core.parseTime('123.456µs')).toBeCloseTo(0.123, 3);
    expect(core.parseTime('1.201234s')).toBeCloseTo(1201.234, 3);
    expect(core.parseTime('1h2m3s')).toBeCloseTo(3723000, 0);
  });
  test('formatTime produces mm:ss.sss', () => {
    expect(core.formatTime(65432)).toBe('01:05.432');
  });
  test('formatTimeTooltip shows Original for <1ms or differing text', () => {
    expect(core.formatTimeTooltip(0.5, '0.5µs')).toMatch(/Original/);
    expect(core.formatTimeTooltip(1234, '1.234s')).toMatch(/ms/);
  });
});

describe('Statement normalization and filtering', () => {
  test('normalizeStatement replaces strings and numbers with ?', () => {
    const sql = "SELECT * FROM b WHERE a = 'x' AND b = 123.45";
    expect(core.normalizeStatement(sql)).toBe('SELECT * FROM b WHERE a = ? AND b = ?');
  });
  test('hasFilteringMechanism detects WHERE and USE KEYS', () => {
    expect(core.hasFilteringMechanism("SELECT * FROM b WHERE a = 1")).toBe(true);
    expect(core.hasFilteringMechanism("SELECT * FROM b USE KEYS 'k'")).toBe(true);
    expect(core.hasFilteringMechanism("SELECT * FROM b")).toBe(false);
  });
});

describe('Color helpers', () => {
  test('getColorClass buckets correctly', () => {
    expect(core.getColorClass(50)).toBe('green');
    expect(core.getColorClass(200)).toBe('yellow');
    expect(core.getColorClass(600)).toBe('orange');
    expect(core.getColorClass(1500)).toBe('red');
  });
  test('getPercentageColor returns structured color', () => {
    expect(core.getPercentageColor(10).text).toBe('low');
    expect(core.getPercentageColor(40).text).toBe('medium');
    expect(core.getPercentageColor(60).text).toBe('high');
    expect(core.getPercentageColor(90).text).toBe('critical');
  });
});

describe('Time grouping helpers', () => {
  const now = new Date('2025-01-01T00:00:00Z');
  const later = new Date('2025-01-02T00:00:00Z');
  const requests = [
    { requestTime: now.toISOString() },
    { requestTime: later.toISOString() },
  ];
  test('getOptimalTimeUnit returns day/hour/week depending on span', () => {
    expect(core.getOptimalTimeUnit(requests)).toBe('day');
    expect(core.getOptimalTimeUnit([{ requestTime: now }, { requestTime: new Date(now.getTime()+3600000).toISOString() }])).toBe('hour');
  });
  test('roundTimestamp respects grouping minute', () => {
    const d = new Date('2025-01-01T00:05:30.123Z');
    const r = core.roundTimestamp(d, 'minute');
    expect(r.toISOString()).toBe('2025-01-01T00:05:00.000Z');
  });
  test('getTimeConfig returns matching unit object', () => {
    expect(core.getTimeConfig('day').unit).toBe('day');
  });
});

describe('Plan operator helpers', () => {
  const plan = { '#operator': 'Authorize', '~child': { '#operator': 'Sequence', '~children': [ { '#operator': 'IndexScan3' }, { '#operator': 'Fetch' } ] } };
  test('getOperators collects all operators recursively', () => {
    expect(core.getOperators(plan)).toEqual(['Authorize','Sequence','IndexScan3','Fetch']);
  });
  test('calculate totals and maxima', () => {
    const { totals, max } = core.calculateOperatorTotalsAndMax([{ a: 1, b: 2 }, { a: 3 }]);
    expect(totals.a).toBe(4);
    expect(max).toBe(4);
  });
});

describe('Statement type + system query filters', () => {
  test('deriveStatementType handles multi-word and single-word', () => {
    expect(core.deriveStatementType('SELECT * FROM x')).toBe('SELECT');
    expect(core.deriveStatementType('CREATE INDEX idx ON b(c)')).toBe('CREATE INDEX');
  });
  test('shouldExcludeSystemQuery toggled by checkbox and patterns', () => {
    expect(core.shouldExcludeSystemQuery('SELECT * FROM system:keyspaces')).toBe(true);
    expect(core.shouldExcludeSystemQuery('SELECT * FROM b', false)).toBe(false);
  });
  test('filterSystemQueries honors checkbox and SQL filter text', () => {
    const arr = ['SELECT * FROM b', 'INFER keyspace on x'];
    expect(core.filterSystemQueries(arr, true)).toEqual(['SELECT * FROM b']);
    expect(core.filterSystemQueries(arr, false, 'infer').length).toBe(1);
  });
});

describe('Cache helpers', () => {
  test('clearCaches empties internal caches and logs', () => {
    expect(core.clearCaches()).toBe(true);
  });
  test('logCacheStats prints sizes', () => {
    const stats = core.logCacheStats();
    expect(stats).toHaveProperty('A');
  });
});
