const { parseAIJsonContent, overviewTextToHtml } = require('../app/assets/js/ai-json-parse.js');

const VALID = {
  analysis_summary: {
    overview_html: '<h3>Overall Health</h3><p>Cluster is healthy.</p>',
  },
  critical_issues: [],
  recommendations: [],
};

describe('parseAIJsonContent', () => {
  test('valid JSON passes through', () => {
    const parsed = parseAIJsonContent(JSON.stringify(VALID));
    expect(parsed.analysis_summary.overview_html).toBe(VALID.analysis_summary.overview_html);
  });

  test('strips markdown fences', () => {
    const parsed = parseAIJsonContent('```json\n' + JSON.stringify(VALID) + '\n```');
    expect(parsed.analysis_summary.overview_html).toContain('<h3>Overall Health</h3>');
  });

  test('strips think tags so example JSON inside reasoning is ignored', () => {
    const wrapped =
      '<think>I will emit JSON like {"analysis_summary": {"overview_html": "nope"}}</think>\n' +
      JSON.stringify(VALID);
    const parsed = parseAIJsonContent(wrapped);
    expect(parsed.analysis_summary.overview_html).toContain('Cluster is healthy');
    expect(parsed.analysis_summary.overview_html).not.toContain('nope');
  });

  test('repairs unescaped newlines in overview_html (Qwen / Firefox JSON.parse error)', () => {
    const raw = `{
  "analysis_summary": {
    "overview_html": "
Overall Health

Critical performance crisis detected. All 99 queries (100%) fall in the 5-10 second duration range.

Key Bottlenecks

    Systemic ~9s latency floor: All query groups show identical ~9s durations.
    100% concurrent query conflicts: All 99 queries show resource contention.

Main Findings
"
  },
  "critical_issues": [],
  "recommendations": []
}`;
    expect(() => JSON.parse(raw)).toThrow();
    const parsed = parseAIJsonContent(raw);
    const html = parsed.analysis_summary.overview_html;
    expect(html).toContain('<h3>Overall Health</h3>');
    expect(html).toContain('<h3>Key Bottlenecks</h3>');
    expect(html).toContain('<h3>Main Findings</h3>');
    expect(html.toLowerCase()).toContain('systemic ~9s latency floor');
    expect(parsed.critical_issues).toEqual([]);
  });

  test('recovers truncated Qwen JSON that never closed the object', () => {
    const raw = `{
  "analysis_summary": {
    "overview_html": "
Overall Health

Critical performance crisis detected.

Key Bottlenecks

    Systemic ~9s latency floor: Doc Fetch phase consumes 8,388-9,017ms.

Main Findings
`;
    const parsed = parseAIJsonContent(raw);
    expect(parsed.analysis_summary.overview_html).toContain('<h3>Overall Health</h3>');
    expect(parsed.analysis_summary.overview_html).toContain('8,388-9,017ms');
  });

  test('repairs HTML class attributes that use double quotes', () => {
    const raw = `{
  "analysis_summary": {
    "overview_html": "<h3>Overall Health</h3><p><span class="severity-critical">9s floor</span></p>"
  }
}`;
    expect(() => JSON.parse(raw)).toThrow();
    const parsed = parseAIJsonContent(raw);
    expect(parsed.analysis_summary.overview_html).toContain('severity-critical');
    expect(parsed.analysis_summary.overview_html).toContain('9s floor');
  });

  test('strips trailing commas', () => {
    const parsed = parseAIJsonContent('{"analysis_summary": {"overview_html": "<p>ok</p>"}, "critical_issues": [],}');
    expect(parsed.analysis_summary.overview_html).toBe('<p>ok</p>');
  });

  test('quotes unquoted keys', () => {
    const parsed = parseAIJsonContent('{analysis_summary: {overview_html: "<p>ok</p>"}, critical_issues: []}');
    expect(parsed.analysis_summary.overview_html).toBe('<p>ok</p>');
  });

  test('salvages non-JSON prose as overview HTML', () => {
    const parsed = parseAIJsonContent('Overall Health\n\nThe cluster is saturated.');
    expect(parsed.analysis_summary.overview_html).toContain('<h3>Overall Health</h3>');
    expect(parsed.analysis_summary.overview_html).toContain('saturated');
  });

  test('empty input returns null', () => {
    expect(parseAIJsonContent(null)).toBeNull();
    expect(parseAIJsonContent('')).toBeNull();
  });
});

describe('overviewTextToHtml', () => {
  test('leaves existing block HTML unchanged', () => {
    const src = '<h3>Overall Health</h3><p>Already HTML.</p>';
    expect(overviewTextToHtml(src)).toBe(src);
  });

  test('leaves inline span HTML unchanged', () => {
    const src = "<span class='severity-critical'>9s floor</span> across all groups.";
    expect(overviewTextToHtml(src)).toBe(src);
  });
});
