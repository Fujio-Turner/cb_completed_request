const { checkOperatorForIndexType, buildPrimaryScanDonutConfig } = require('../en/core');

describe('Index type usage config', () => {
  test('checkOperatorForIndexType detects primary and sequential scans', () => {
    expect(checkOperatorForIndexType({ '#operator': 'PrimaryScan3' })).toEqual({ primary: 1, sequential: 0 });
    expect(checkOperatorForIndexType({ '#operator': 'PrimaryScan3', using: 'sequentialscan' })).toEqual({ primary: 1, sequential: 1 });
    expect(checkOperatorForIndexType({ '#operator': 'Fetch' })).toEqual({ primary: 0, sequential: 0 });
  });

  test('buildPrimaryScanDonutConfig aggregates counts correctly', () => {
    const plans = [
      { '#operator': 'Authorize', '~child': { '#operator': 'Sequence', '~children': [ { '#operator': 'PrimaryScan3' }, { '#operator': 'Fetch' } ] } },
      { '#operator': 'Authorize', '~child': { '#operator': 'Sequence', '~children': [ { '#operator': 'PrimaryScan3', using: 'sequentialscan' } ] } }
    ];
    const cfg = buildPrimaryScanDonutConfig(plans);
    expect(cfg.datasets[0].data).toEqual([2,1]);
  });
});
