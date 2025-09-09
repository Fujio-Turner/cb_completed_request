const { aggregateOperationsTimeline } = require('../en/core');

describe('aggregateOperationsTimeline', () => {
  const requests = [
    { requestTime: '2025-01-01T00:00:12Z', indexInfo: { stats: { primaryScan: 2, indexScan: 3, fetch: 10 } } },
    { requestTime: '2025-01-01T00:00:45Z', indexInfo: { stats: { primaryScan: 0, indexScan: 5, fetch: 5 } } },
    { requestTime: '2025-01-01T00:02:00Z', indexInfo: { stats: { primaryScan: 1, indexScan: 0, fetch: 3 } } },
  ];

  test('groups by requested unit and computes sums and averages', () => {
    const agg = aggregateOperationsTimeline(requests, 'minute');
    expect(agg.actualUnit).toBe('minute');
    expect(agg.data.length).toBeGreaterThan(0);
    expect(agg.avgIndex.some(v => v !== null)).toBe(true);
  });

  test('optimizer grouping chooses unit based on span', () => {
    const agg = aggregateOperationsTimeline(requests, 'optimizer');
    expect(['minute','hour','day','week']).toContain(agg.actualUnit);
  });
});
