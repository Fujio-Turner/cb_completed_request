const fs = require('fs');
const path = require('path');

describe('Parse Requests from sample JSON', () => {
  test('parses sample/test_system_completed_requests.json and processes requests', () => {
    const file = path.join(__dirname, '..', 'sample', 'test_system_completed_requests.json');
    const text = fs.readFileSync(file, 'utf8');
    const data = JSON.parse(text);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    const first = data[0];
    expect(first).toHaveProperty('completed_requests');
    expect(first.completed_requests).toHaveProperty('statement');
  });
});
