const core = require('../en/core');

describe('Timeline bucket generation', () => {
  // Helper to create timeline buckets similar to getTimelineBucketsFromRequests
  function getTimelineBuckets(requests, grouping) {
    const seen = new Set();
    for (const r of requests) {
      const dt = core.roundTimestamp(new Date(r.requestTime), grouping, requests);
      seen.add(dt.toISOString());
    }
    return Array.from(seen)
      .map(s => new Date(s))
      .sort((a, b) => a - b);
  }

  test('creates unique buckets for each time period', () => {
    const requests = [
      { requestTime: '2025-01-01T10:15:00Z' },
      { requestTime: '2025-01-01T10:30:00Z' },
      { requestTime: '2025-01-01T11:00:00Z' },
    ];
    
    const buckets = getTimelineBuckets(requests, 'hour');
    
    // Should have 2 hourly buckets: 10:00 and 11:00
    expect(buckets.length).toBe(2);
    expect(buckets[0].toISOString()).toBe('2025-01-01T10:00:00.000Z');
    expect(buckets[1].toISOString()).toBe('2025-01-01T11:00:00.000Z');
  });

  test('handles minute grouping correctly', () => {
    const requests = [
      { requestTime: '2025-01-01T10:15:30Z' },
      { requestTime: '2025-01-01T10:15:45Z' },
      { requestTime: '2025-01-01T10:16:10Z' },
    ];
    
    const buckets = getTimelineBuckets(requests, 'minute');
    
    // Should have 2 minute buckets: 10:15 and 10:16
    expect(buckets.length).toBe(2);
    expect(buckets[0].toISOString()).toBe('2025-01-01T10:15:00.000Z');
    expect(buckets[1].toISOString()).toBe('2025-01-01T10:16:00.000Z');
  });

  test('handles day grouping correctly', () => {
    const requests = [
      { requestTime: '2025-01-01T10:00:00Z' },
      { requestTime: '2025-01-01T15:00:00Z' },
      { requestTime: '2025-01-02T08:00:00Z' },
      { requestTime: '2025-01-02T20:00:00Z' },
    ];
    
    const buckets = getTimelineBuckets(requests, 'day');
    
    // Should have 2 daily buckets: Jan 1 and Jan 2
    expect(buckets.length).toBe(2);
    expect(buckets[0].toISOString()).toBe('2025-01-01T00:00:00.000Z');
    expect(buckets[1].toISOString()).toBe('2025-01-02T00:00:00.000Z');
  });

  test('returns buckets in chronological order', () => {
    const requests = [
      { requestTime: '2025-01-03T10:00:00Z' },
      { requestTime: '2025-01-01T10:00:00Z' },
      { requestTime: '2025-01-02T10:00:00Z' },
    ];
    
    const buckets = getTimelineBuckets(requests, 'day');
    
    // Should be sorted: Jan 1, Jan 2, Jan 3
    expect(buckets.length).toBe(3);
    expect(buckets[0].toISOString()).toBe('2025-01-01T00:00:00.000Z');
    expect(buckets[1].toISOString()).toBe('2025-01-02T00:00:00.000Z');
    expect(buckets[2].toISOString()).toBe('2025-01-03T00:00:00.000Z');
  });

  test('deduplicates requests in same bucket', () => {
    const requests = [
      { requestTime: '2025-01-01T10:15:00Z' },
      { requestTime: '2025-01-01T10:15:30Z' },
      { requestTime: '2025-01-01T10:15:45Z' },
    ];
    
    const buckets = getTimelineBuckets(requests, 'minute');
    
    // All 3 requests are in the same minute bucket
    expect(buckets.length).toBe(1);
    expect(buckets[0].toISOString()).toBe('2025-01-01T10:15:00.000Z');
  });

  test('handles week grouping (rounds to Monday)', () => {
    const requests = [
      { requestTime: '2025-01-01T10:00:00Z' }, // Wednesday
      { requestTime: '2025-01-08T10:00:00Z' }, // Next Wednesday
    ];
    
    const buckets = getTimelineBuckets(requests, 'week');
    
    // Should have 2 weekly buckets, both rounded to their respective Mondays
    expect(buckets.length).toBe(2);
    // 2025-01-01 is a Wednesday, so it should round back to Monday 2024-12-30
    expect(buckets[0].toISOString()).toBe('2024-12-30T00:00:00.000Z');
    // 2025-01-08 is a Wednesday, so it should round back to Monday 2025-01-06
    expect(buckets[1].toISOString()).toBe('2025-01-06T00:00:00.000Z');
  });

  test('handles optimizer grouping by auto-detecting unit', () => {
    const requests = [
      { requestTime: '2025-01-01T00:00:00Z' },
      { requestTime: '2025-01-05T00:00:00Z' },
    ];
    
    const buckets = getTimelineBuckets(requests, 'optimizer');
    
    // Should auto-detect 'day' grouping for 4-day span
    expect(buckets.length).toBeGreaterThanOrEqual(2);
    // First bucket should be rounded to day
    expect(buckets[0].getUTCHours()).toBe(0);
    expect(buckets[0].getUTCMinutes()).toBe(0);
  });

  test('handles single request', () => {
    const requests = [
      { requestTime: '2025-01-01T10:15:30Z' },
    ];
    
    const buckets = getTimelineBuckets(requests, 'hour');
    
    expect(buckets.length).toBe(1);
    expect(buckets[0].toISOString()).toBe('2025-01-01T10:00:00.000Z');
  });

  test('handles empty requests array', () => {
    const buckets = getTimelineBuckets([], 'hour');
    
    expect(buckets.length).toBe(0);
  });
});
