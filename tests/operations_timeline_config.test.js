const { aggregateOperationsTimeline, buildOperationsTimelineConfig } = require('../en/core');

describe('Operations timeline config', () => {
  test('produces datasets and time scale', () => {
    const requests = [
      { requestTime: '2025-01-01T00:00:00Z', indexInfo: { stats: { primaryScan: 2, indexScan: 1, fetch: 5 } } },
      { requestTime: '2025-01-01T00:05:00Z', indexInfo: { stats: { primaryScan: 0, indexScan: 0, fetch: 2 } } },
    ];
    const agg = aggregateOperationsTimeline(requests, 'minute');
    const cfg = buildOperationsTimelineConfig(agg, requests);
    expect(cfg.data.labels.length).toBeGreaterThan(0);
    expect(cfg.data.datasets[0].label).toBe('Index Scan Items');
    expect(cfg.options.scales.x.type).toBe('time');
  });
});
