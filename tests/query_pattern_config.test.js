const { buildQueryPatternFeaturesConfig } = require('../en/core');

describe('Query Pattern Features config', () => {
  test('counts patterns and assigns colors', () => {
    const cfg = buildQueryPatternFeaturesConfig([
      'SELECT * FROM a WHERE x = 1',
      'SELECT * FROM a JOIN b ON KEYS a.k',
      'SELECT COUNT(*) FROM a GROUP BY type',
      'SELECT * FROM z'
    ]);
    expect(cfg.labels).toEqual(['WHERE','JOIN','GROUP BY']);
    expect(cfg.datasets[0].data).toEqual([1,1,1]);
    expect(cfg.datasets[0].backgroundColor.length).toBe(3);
  });
});
