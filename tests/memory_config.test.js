const { buildMemoryUsageConfig, parseTime } = require('../en/core');

describe('Memory usage config', () => {
  test('produces bar and line datasets with MB conversion (bytes -> MB)', () => {
    const cfg = buildMemoryUsageConfig([
      { requestId: 'a', usedMemory: 2097152, serviceTime: '2ms' }, // 2 MB in bytes
      { requestId: 'b', usedMemory: 1048576, serviceTime: '4ms' }, // 1 MB in bytes
    ]);
    expect(cfg.labels).toEqual(['a','b']);
    expect(cfg.datasets[0].type).toBe('bar');
    expect(cfg.datasets[1].type).toBe('line');
    // Expect bytes to be converted to MB
    expect(cfg.datasets[0].data).toEqual([2,1]);
    expect(cfg.datasets[1].data[0]).toBeCloseTo(parseTime('2ms'));
  });
});
