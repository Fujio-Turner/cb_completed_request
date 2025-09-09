const { buildElapsedTimeBucketsConfig } = require('../en/core');

describe('Elapsed time buckets config', () => {
  test('bucketization of elapsedTimeMs', () => {
    const cfg = buildElapsedTimeBucketsConfig([
      { elapsedTime: '5ms' },
      { elapsedTime: '25ms' },
      { elapsedTime: '75ms' },
      { elapsedTime: '250ms' },
      { elapsedTime: '750ms' },
    ]);
    expect(cfg.labels).toEqual(['<10ms','10-50ms','50-100ms','100-500ms','>500ms']);
    expect(cfg.datasets[0].data).toEqual([1,1,1,1,1]);
  });
});
