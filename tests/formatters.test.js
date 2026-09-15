/**
 * Issue #228 — duration and timestamp display contract.
 *
 * formatTime / formatTimeTooltip live in app/assets/js/time-format.js
 * and are re-exported from ui-helpers.js. formatTimestamp lives in base.js.
 */
const { formatTime, formatTimeTooltip } = require('../app/assets/js/time-format.js');

describe('formatTime (MM:SS.mmm)', () => {
  test('zero and invalid values are 00:00.000', () => {
    expect(formatTime(0)).toBe('00:00.000');
    expect(formatTime(null)).toBe('00:00.000');
    expect(formatTime(NaN)).toBe('00:00.000');
    expect(formatTime(-5)).toBe('00:00.000');
  });

  test('issue #228 examples', () => {
    expect(formatTime(1500)).toBe('00:01.500');
    expect(formatTime(65000)).toBe('01:05.000');
  });

  test('values in [0.5, 1) ms round to 00:00.001', () => {
    expect(formatTime(0.6)).toBe('00:00.001');
  });
});

describe('formatTimeTooltip', () => {
  test('empty / N/A returns empty string', () => {
    expect(formatTimeTooltip('', 10)).toBe('');
    expect(formatTimeTooltip('N/A', 10)).toBe('');
  });

  test('sub-millisecond shows original string', () => {
    expect(formatTimeTooltip('146.266µs', 0.146)).toMatch(/Original: 146.266µs/);
  });

  test('values that differ from MM:SS.mmm show original', () => {
    expect(formatTimeTooltip('1.5s', 1500)).toMatch(/Original: 1.5s/);
  });
});
