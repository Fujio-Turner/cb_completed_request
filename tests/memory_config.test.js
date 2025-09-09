const { buildMemoryUsageConfig, parseTime } = require('../en/core');

describe('Memory usage config', () => {
  test('produces bar and line datasets with MB conversion', () => {
    const cfg = buildMemoryUsageConfig([
      { requestId: 'a', usedMemory: 2048, serviceTime: '2ms' },
      { requestId: 'b', usedMemory: 1024, serviceTime: '4ms' },
    ]);
    expect(cfg.labels).toEqual(['a','b']);
    expect(cfg.datasets[0].type).toBe('bar');
    expect(cfg.datasets[1].type).toBe('line');
    // Our MB conversion is from KB to MB for these test values
    expect(cfg.datasets[0].data).toEqual([2,1]);
    expect(cfg.datasets[1].data[0]).toBeCloseTo(parseTime('2ms'));
  });
});
