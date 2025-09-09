const core = require('../en/core');

describe('Time configuration helpers', () => {
  const mkReqs = (startISO, endISO) => [{ requestTime: startISO }, { requestTime: endISO }];
  test('getOptimalTimeUnit picks sensible unit for sample data', () => {
    const unit = core.getOptimalTimeUnit(mkReqs('2025-01-01T00:00:00Z','2025-01-04T00:00:00Z'));
    expect(['day','week']).toContain(unit);
  });
  test('getTimeConfig returns config matching requested unit', () => {
    const cfg = core.getTimeConfig('hour');
    expect(cfg.unit).toBe('hour');
  });
  test('getTimeConfig defaults to minute when unknown requested unit', () => {
    const cfg = core.getTimeConfig('unknown');
    expect(cfg.unit).toBe('minute');
  });
});
