# Unit Tests Guide

This folder contains Jest-based unit tests for the Couchbase Query Analyzer. The tests focus on pure, reusable helpers extracted into `en/core.js` and avoid coupling to the UI in `en/index.html`.

## How to run

- Run the full suite:
  - `npm test`
  - or `npx jest`
- Run a single file:
  - `npx jest tests/helpers.test.js`
- Run a single test by name:
  - `npx jest -t "parseTime handles ms/us/ns"`
- Watch mode (reruns affected tests on change):
  - `npx jest --watch`
- Coverage report:
  - `npx jest --coverage`

Notes:
- A minimal `package.json` includes the `test` script; Jest config lives in `jest.config.js`.
- The Jest environment is `jsdom`, so browser-like globals are available.

## Test structure

- `tests/helpers.test.js`
  - HTML escaping, time parse/format helpers, SQL normalization, color helpers
  - Time grouping helpers (`getOptimalTimeUnit`, `roundTimestamp`, `getTimeConfig`)
  - Plan operator utilities and system query filtering
- `tests/parse_requests.test.js`
  - Loads sample JSON from `sample/test_system_completed_requests.json` and sanity-checks schema
- `tests/memory_config.test.js`
  - Verifies memory usage chart config (bar + line) and unit conversions
- `tests/query_pattern_config.test.js`
  - Validates Query Pattern Features bar config and category counting
- `tests/index_usage_config.test.js`
  - Detects primary vs sequential scans and aggregates donut chart data
- `tests/elapsed_time_buckets.test.js`
  - Buckets elapsed times into labeled ranges
- `tests/render_smoke.test.js`
  - Smoke test for a representative bar chart config output
- `tests/operations_aggregate.test.js`
  - Aggregates operations into time groups and computes averages
- `tests/operations_timeline_config.test.js`
  - Builds the timeline chart config with proper time scale
- `tests/time_config.test.js`
  - Unit and fallback behavior for time configuration

## Source under test

- `en/core.js` exports pure helpers used by the tests. These mirror logic used by the UI but are framework-independent to keep tests fast and deterministic.

## Adding new tests

- Prefer testing pure functions. If a helper only exists inline in `en/index.html`, extract a pure equivalent into `en/core.js` and import it in a new test.
- Do not modify `en/index.html` for testing purposes.
- Keep datasets small and deterministic. Use `sample/test_system_completed_requests.json` for realistic structures when needed.

## Troubleshooting

- If `npm test` fails with missing package.json, use `npx jest` or ensure the repo root contains `package.json` with `{"scripts": {"test": "jest"}}`.
- If Jest cannot be found, ensure you run from the repo root. A vendored `node_modules` folder exists in this repo; no additional install should be necessary.
