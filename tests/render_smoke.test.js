const { buildQueryGroupPhaseTimesConfig } = require('../en/core');

describe('Render smoke tests (Chart stub)', () => {
  test('buildQueryGroupPhaseTimesConfig produces bar chart config with expected labels/datasets', () => {
    const cfg = buildQueryGroupPhaseTimesConfig();
    expect(cfg.type).toBe('bar');
    expect(cfg.data.labels).toContain('Index Scan');
    expect(Array.isArray(cfg.data.datasets[0].data)).toBe(true);
  });
});
