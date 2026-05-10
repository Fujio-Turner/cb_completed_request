# Couchbase Query Analyzer Logging Standard

This guide is the single source of truth for **how the Server Edition
emits diagnostic output** — across the Flask backend (`app/app.py`,
`app/app_base.py`, `app/ai_analyzer.py`, `app/cbl_store.py`,
`app/blob_storage.py`) and the browser frontend
(`app/assets/js/**/*.js`, `app/index.html`).

The goal is simple: **one consistent way to log, everywhere.** No more
hand-tuning whether `ic()` is too noisy, no more "did `?debug=true`
turn this on or not?", no more `console.log` calls that ship to
production. Hot paths are debuggable on demand without firehosing the
console the rest of the time.

---

## TL;DR

1. **Five levels, used as documented in [§ 4](#4-log-levels).** Same
   names, same semantics on both sides:
   `error · warn · info · debug · trace`.
2. **Default level is `info`.** `debug` and `trace` are off in
   production, opt-in via a URL flag (frontend) or env var (backend).
3. **Frontend:** never call `console.log` / `console.warn` / `console.error`
   directly. Always go through `Logger` from
   [`app/assets/js/base.js`](../assets/js/base.js).
4. **Backend:** never call bare `print()` or top-level `ic(...)` for
   diagnostic output. Use a module-scoped `logger =
   logging.getLogger(__name__)` (see [§ 6](#6-backend-python-pattern)).
   `ic()` stays as a *developer-only* probe, never in shipping hot paths.
5. **Lazy formatting in Python:**
   `logger.info("indexed %d files in %.2fs", n, dt)` — **not**
   `logger.info(f"indexed {n} files in {dt:.2f}s")`. f-strings are fine
   in JS (cost is the same as `+`).
6. **Use `logger.exception()` inside `except` blocks** to include the
   traceback automatically. On the frontend, pass the `Error` object as
   a trailing argument: `Logger.error("save failed", err)`.
7. **No secrets in logs.** API keys, raw query bodies, full document
   contents, and user PII are never logged at `info` or above. See
   [§ 8](#8-what-never-to-log).
8. **Configure once at the entrypoint** (Flask `app.py` startup; the
   bootstrap block at the bottom of `base.js`). Library / module code
   never reconfigures the logger.

---

## 1. Why a project-wide standard?

Today the analyzer has four styles co-existing:

- **Frontend `console.log` / `console.warn`** scattered through
  `assets/js/*.js` — fires in production, can't be filtered, and
  swamps the DevTools console while you're trying to find the *one*
  message you care about.
- **Frontend `Logger.info` / `Logger.debug`** in newer modules
  ([`app/assets/js/base.js`](../assets/js/base.js)) — already
  conformant; this is the target.
- **Backend `ic(...)`** sprinkled through `app.py`, `app_base.py`,
  `cbl_store.py`, `blob_storage.py`, `ai_analyzer.py` — useful while
  iterating, but `icecream` has no severity levels, so a chatty
  `ic()` in a hot poll loop drowns out the one error you need.
- **Backend `print(...)`** in a few startup paths — invisible inside
  Docker / PyInstaller bundles unless someone is tailing stdout.

Standardising lets us:

- Filter by severity (`?logLevel=debug` in the browser,
  `CBQA_LOG_LEVEL=DEBUG` for the server) **without code changes**.
- Filter by subsystem (`Logger` is one namespace; Python loggers are
  named `app.ai_analyzer`, `app.cbl_store`, `app.blob_storage`, …).
- Re-route output (file rotation for the Flask process, structured
  JSON for log shippers, a copy of the browser console into the AI
  payload) without touching call-sites.
- Capture / assert log messages in tests (`pytest`'s `caplog`,
  Playwright's `page.on('console', …)`).
- Stop shipping noisy `console.log` lines that would trip Lighthouse
  / a11y reviewers.

---

## 2. Module setup (the only line you ever copy)

### Backend

At the top of **every Python module that needs to emit diagnostics**:

```python
import logging

logger = logging.getLogger(__name__)
```

`__name__` resolves to the dotted module path (`app.ai_analyzer`,
`app.cbl_store`, `app.blob_storage`, `app.app_base`, …). The
configurator relies on this naming so users can filter whole subtrees:

```bash
CBQA_LOG_LEVEL=DEBUG CBQA_LOG_FILTER='app.ai_*' ./start.sh
```

> **Do not** write `logging.getLogger("ai")`,
> `logging.getLogger("server")`, `logging.warning(...)` (root logger),
> etc. Those bypass the module hierarchy and break filtering.

### Frontend

Every JS module imports `Logger` from `base.js`:

```javascript
import { Logger } from './base.js';
```

There is no per-module logger object on the frontend — `Logger` is a
singleton whose level is set by the URL flag at page load. If you need
a subsystem prefix, pass it as the first argument:

```javascript
Logger.debug('[ai-client]', 'preview payload size', bytes);
```

---

## 3. CLI / startup vs. library output

| Caller                                       | Mechanism                                                      | Stream            |
| -------------------------------------------- | -------------------------------------------------------------- | ----------------- |
| **Server startup banner** in `app.py` `__main__` | `print(...)` for the user-facing "v4.0.0 listening on …" lines, **and** a matching `logger.info(...)` for the file/JSON sink | stdout + handlers |
| **Library / Flask handlers / AI provider / CBL** | `logger.<level>(...)`                                          | configured handlers (stderr by default, optionally a rotating file) |
| **Long-running progress** (AI polling, CBL maintenance) | `logger.info(...)` only — no per-tick spam at `info`; use `logger.debug(...)` for per-iteration lines | configured handlers |
| **Frontend module code**                     | `Logger.<level>(...)`                                          | DevTools console  |
| **Frontend bootstrap banner** in `base.js`   | `Logger.info(...)` — never bare `console.log`                  | DevTools console  |

The simple rule: **if the user is looking at a terminal at startup,
the banner can also `print`; everything else is a log record.** Inside
a Flask request handler, never `print`.

### `app.py` `__main__` example

```python
def _startup_banner() -> None:
    msg_version = f"🚀 Starting Couchbase Query Analyzer v{__version__}"
    msg_backend = "📊 Backend: cbl (embedded Couchbase Lite)"
    msg_listen  = f"🔌 Listening on http://localhost:{PORT}"

    # User-facing banner (always visible on the controlling terminal).
    print(msg_version)
    print(msg_backend)
    print(msg_listen)

    # Same events into the structured log (file/JSON shipper).
    logger.info("starting cbqa version=%s", __version__)
    logger.info("backend=%s", "cbl")
    logger.info("listening port=%d", PORT)
```

The emoji-prefixed status lines (`🚀`, `📊`, `🔌`) that show up in
the macOS app / Windows console / Docker logs are **CLI surface, not
log records.** They stay as `print()` in the `__main__` block.
Internally, the same code paths emit matching `logger.info()` records
so headless runs (PyInstaller bundle, container, log shipper) still
see the events.

---

## 4. Log levels

Both Python and JavaScript use the same five names, with these
semantics:

| Level      | When to use                                                               | Examples                                                                                         |
| ---------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `trace`    | Per-iteration / per-tick verbose tracing. **Off by default.**             | `Logger.trace('row', i, row)`, `logger.debug("poll tick %d for %s", n, doc_id)` (Python uses DEBUG; reserve TRACE numerically below DEBUG if needed) |
| `debug`    | One-off internals a developer would want during a bug hunt. Off by default.| `parsed %d ast nodes from %s`, `cache hit for %s`, `Logger.debug('payload bytes', n)`           |
| `info`     | Normal lifecycle events a user would want at default verbosity.            | `indexed 137 requests in 4.2s`, `AI analysis kicked off doc=%s provider=%s`, `Flask app listening on :5000` |
| `warn`     | Something is wrong but the analyzer recovered. The user might want to act. | `payload truncated to %d bytes`, `falling back to plain JSON parser`, `AI provider rate-limit hit; retrying` |
| `error`    | An operation failed. The request / job / file did not complete.            | `failed to parse JSON: %s`, `AI provider %s returned 500`, `CBL save failed for doc=%s`         |

> The Python `logging` module does not ship a `TRACE` level out of the
> box. We map "trace" semantics onto `DEBUG` for Python, with a
> dedicated `logger.debug("trace: ...")` prefix when needed. The
> frontend has a real `trace` channel (see
> [`Logger.trace`](../assets/js/base.js#L282-L286)).

Default level: **`info`** (so users see lifecycle events but not
internals).

### "Should this be `warn` or `error`?"

Ask: *did the user's request still succeed?* If yes → `warn` (or
`info`). If no → `error`.

### "Should this be `info` or `debug`?"

Ask: *would I want this line in a 1,000-request production log?* If
yes → `info`. If no → `debug`.

This is the rule that fixes the "ic() is too verbose" problem. Hot
paths (AI status polling, every saved document, every chart redraw)
**must** be `debug` or lower.

---

## 5. Formatting rules

### 5.1 Lazy `%`-formatting in Python (mandatory)

```python
# ✅ Good — args evaluated only if the level is enabled.
logger.debug("found %d candidates for %s", len(matches), query_id)

# ❌ Bad — f-string interpolates every time, even at INFO+.
logger.debug(f"found {len(matches)} candidates for {query_id}")
```

This matters most for `debug` calls inside hot loops (AI status
polling, CBL `get_all_documents`, chart aggregation).

f-strings remain fine for the user-facing `print(...)` banner and for
`logger.exception("...")` messages whose formatting cost is dwarfed by
the traceback render.

### 5.2 No newlines, no ANSI colour codes, no emoji-as-severity

The handler chain decides the output format. Don't bake `\n`, ANSI
escape codes, or terminal box-drawing into the message string — they
break log shippers, JSON output, and CI consoles.

Emojis (`✅`, `❌`, `🚀`) are allowed for the **startup banner** only.
Inside `logger.<level>(...)` calls, the level *is* the severity
indicator — don't double-encode it with `❌ save failed`. Just
`logger.error("save failed: %s", e)`.

### 5.3 One event per call

```python
# ✅ Good
logger.info("ai_analysis started doc_id=%s", doc_id)

# ❌ Bad — multiple loosely-related facts in one record.
logger.info("ai started doc=%s provider=%s model=%s tokens=%d cluster=%s",
            doc_id, provider, model, tokens, cluster)
```

Either split into multiple records or use the `extra={...}` kwarg for
structured fields when JSON output is enabled.

### 5.4 Tracebacks come for free

```python
try:
    cbl.save_analyzer(doc)
except Exception:
    # logger.exception() == logger.error() + automatic traceback.
    logger.exception("cbl save failed doc_id=%s", doc.get("id"))
```

Never `f"{e}"` an exception by hand and then drop the traceback. This
is the single biggest improvement over today's
`ic("❌ save_analyzer", e)` pattern, which logs the exception's
`__str__` only.

On the frontend, pass the error object as a trailing argument so
DevTools can render the stack:

```javascript
try {
  await fetch(url, opts);
} catch (err) {
  Logger.error('[ai-client] fetch failed', err);
}
```

---

## 6. Backend (Python) pattern

### 6.1 Module loggers

```python
# app/ai_analyzer.py
import logging

logger = logging.getLogger(__name__)   # → "app.ai_analyzer"


def kick_off_analysis(doc_id: str, provider: str) -> str:
    logger.info("ai_analysis kickoff doc_id=%s provider=%s", doc_id, provider)
    try:
        ...
    except ProviderTimeout:
        logger.warning("provider timeout doc_id=%s; will retry", doc_id)
        ...
    except Exception:
        logger.exception("ai_analysis kickoff failed doc_id=%s", doc_id)
        raise
```

### 6.2 What to do with existing `ic(...)` calls

`icecream` is great as a **developer probe** ("dump this expression,
labelled, with file/line/function context") but a poor logging
framework: no severity, no filtering, no off switch in production
without a global `ic.disable()`.

Migration policy:

| Today                                            | Tomorrow                                                  |
| ------------------------------------------------ | --------------------------------------------------------- |
| `ic("✅ CBL storage initialized")`              | `logger.info("cbl storage initialized")`                  |
| `ic(f"⚙️ Loaded server config from {path}")`    | `logger.info("loaded server config path=%s", path)`       |
| `ic("❌ save_analyzer", e)`                     | `logger.exception("save_analyzer failed")` (inside `except`) |
| `ic(f"🔎 [ai_status] load_analyzer({document_id}) → {bool(doc)}")` | `logger.debug("ai_status load doc_id=%s found=%s", document_id, bool(doc))` |
| `ic(some_local_var)` while debugging a bug      | **Keep `ic` for this** — it's a probe, not a log line.    |

The litmus test: if the line is meant to ship, it's a `logger` call.
If you'd `git rm` it before merging the bug fix, leave it as `ic`.

### 6.3 Configuration

The Flask entrypoint configures logging exactly once. A new helper
`app/logging_config.py` exists for this — all entrypoints
(`app.py` `__main__`, the PyInstaller `build_*.spec` bootstraps, and
any future CLI tooling) call it before any logger is used:

```python
# app/logging_config.py  (sketch — implement when migration starts)
import logging
import logging.handlers
import os
import sys
from pathlib import Path


_DEFAULT_FORMAT = "%(asctime)s %(levelname)-7s %(name)s: %(message)s"
_DEFAULT_DATEFMT = "%Y-%m-%dT%H:%M:%S"  # ISO-8601


def configure_logging(level: str | None = None) -> None:
    """Set up CBQA's root loggers. Idempotent — safe to call twice."""
    level = (level or os.environ.get("CBQA_LOG_LEVEL", "INFO")).upper()
    root = logging.getLogger()
    if getattr(root, "_cbqa_configured", False):
        root.setLevel(level)
        return

    handler = logging.StreamHandler(sys.stderr)
    handler.setFormatter(logging.Formatter(_DEFAULT_FORMAT, _DEFAULT_DATEFMT))
    root.addHandler(handler)
    root.setLevel(level)

    # Optional rotating file sink — see § 9.
    _attach_rotating_file_handler(root, handler.formatter)

    # Quiet noisy third-party loggers we don't own.
    for noisy in ("urllib3", "httpx", "werkzeug", "PIL"):
        logging.getLogger(noisy).setLevel("WARNING")

    root._cbqa_configured = True
```

Call sites:

```python
# app/app.py (Flask entry)
from app.logging_config import configure_logging
configure_logging()                       # honours CBQA_LOG_LEVEL
```

Library code (`ai_analyzer.py`, `cbl_store.py`, `blob_storage.py`,
`app_base.py`) **never** calls `logging.basicConfig` and **never**
reads `CBQA_LOG_*` environment variables directly — those belong to
the configurator only.

---

## 7. Frontend (JavaScript) pattern

The frontend already has a working implementation in
[`app/assets/js/base.js`](../assets/js/base.js#L209-L287). The rules
codify what's there:

```javascript
import { Logger } from './base.js';

Logger.error('save failed', err);                  // request failed
Logger.warn('payload truncated', bytes);           // recovered
Logger.info('analyzer initialized v=%s', VERSION); // lifecycle
Logger.debug('chart redraw rows=%d ms=%d', n, dt); // bug hunt
Logger.trace('row', i, row);                       // per-iteration
```

### 7.1 URL flags

| Flag                            | Effect                                                         |
| ------------------------------- | -------------------------------------------------------------- |
| (none)                          | Default level `info`. Shows `error`, `warn`, `info`.           |
| `?debug=true`                   | Legacy alias for `?logLevel=debug`. Still supported.           |
| `?logLevel=error`               | Errors only.                                                   |
| `?logLevel=warn`                | Errors + warnings.                                             |
| `?logLevel=info`                | Default.                                                       |
| `?logLevel=debug`               | + module internals.                                            |
| `?logLevel=trace`               | + per-iteration / hot-path firehose.                           |

These are read **once at page load** by `getLogLevel()` in
`base.js` (lines 218-236). Changing the URL requires a reload — this
is intentional: switching levels mid-session would skew before/after
comparisons.

### 7.2 Subsystem prefixes

Until we split `Logger` into per-module instances, prefix the message
with a `[subsystem]` tag so DevTools' filter box is useful:

```javascript
Logger.debug('[ai-client]', 'request', { provider, model, bytes });
Logger.debug('[charts]',    'redraw', { panel, rows, ms });
Logger.debug('[cbl]',       'save analyzer', { id, bytes });
```

The conventional tags (one per JS module) are:

| Tag             | Module                                                    |
| --------------- | --------------------------------------------------------- |
| `[ai-client]`   | [`ai-client.js`](../assets/js/ai-client.js)              |
| `[ai-openai]`   | [`ai-providers/openai.js`](../assets/js/ai-providers/openai.js) |
| `[ai-claude]`   | [`ai-providers/claude.js`](../assets/js/ai-providers/claude.js) |
| `[ai-grok]`     | [`ai-providers/grok.js`](../assets/js/ai-providers/grok.js) |
| `[charts]`      | [`charts.js`](../assets/js/charts.js)                     |
| `[tables]`      | [`tables.js`](../assets/js/tables.js)                     |
| `[insights]`    | [`insights.js`](../assets/js/insights.js)                 |
| `[flow]`        | [`flow-diagram.js`](../assets/js/flow-diagram.js), [`flow-diagram-v2.js`](../assets/js/flow-diagram-v2.js) |
| `[parsers]`     | [`parsers.js`](../assets/js/parsers.js)                   |
| `[data]`        | [`data-layer.js`](../assets/js/data-layer.js)             |
| `[cbl]`         | [`couchbase-connector.js`](../assets/js/couchbase-connector.js) |
| `[settings]`    | [`settings.js`](../assets/js/settings.js)                 |
| `[ui]`          | [`ui-helpers.js`](../assets/js/ui-helpers.js)             |
| `[boot]`        | [`base.js`](../assets/js/base.js) startup banner          |

### 7.3 Forbidden in the frontend

- `console.log(...)` / `console.warn(...)` / `console.error(...)` in
  module code. (DevTools "preserve log" + the `Logger` filter is the
  supported workflow.) The lone exception is the very first lines of
  `base.js` *before* `Logger` is defined, if any.
- `alert(...)` for diagnostic output. Use the toast notification
  system instead and back it with a `Logger.warn` / `Logger.error`.
- Ship a `Logger.trace(...)` call inside `requestAnimationFrame` /
  scroll handlers without first measuring its cost at default level
  (it should be ~0; `shouldLog('trace')` short-circuits before
  formatting).

---

## 8. What never to log

Hard rules, both sides:

- **No API keys, OAuth tokens, or other credentials.** The AI client
  must mask them before logging — there is already a `_mask_key`
  helper pattern; use it. `?redact=true` (the default — see
  `isRedactMode()` in [`base.js`](../assets/js/base.js#L302-L311))
  must be honoured by every log line that touches user data.
- **No full N1QL query bodies at `info` or above.** They can be
  hundreds of KB. Log a SHA-1 prefix + length instead. Bodies may be
  logged at `debug` only, and only with `?redact=false` explicitly set.
- **No full AI prompt / response content at `info` or above.** Same
  rule. Token counts, model id, provider — yes. Body — no.
- **No raw stack traces in `warn`.** If you have a traceback you want
  to capture, it's an `error` (and use `logger.exception()`).
- **No per-row chart data at `info` or above.** Aggregates only.
  Per-row goes to `trace`.

If you're unsure, log a short identifier (document id, request id,
model id, file path) instead of the data itself.

---

## 9. Configuration & environment variables (backend)

| Variable                          | Default                       | Effect                                                   |
| --------------------------------- | ----------------------------- | -------------------------------------------------------- |
| `CBQA_LOG_LEVEL`                  | `INFO`                        | Root level. One of `DEBUG INFO WARNING ERROR CRITICAL`.  |
| `CBQA_LOG_FILE`                   | `./logs/cbqa.log`             | Path of the rotating log file. Set to `off` / `none` / `0` (or empty) to disable file logging entirely. |
| `CBQA_LOG_JSON`                   | `0`                           | If `1`, switch the formatter to JSON (one record/line) for log shippers. |
| `CBQA_LOG_MAX_SIZE_MB`            | `50`                          | Max size (MB) of an individual log file before rollover. |
| `CBQA_LOG_MAX_AGE_DAYS`           | `7`                           | Days to retain rotated log files. Older files pruned.    |
| `CBQA_LOG_ROTATED_TOTAL_MB`       | `500`                         | Total size cap (MB) for *all* rotated files combined.    |

Library code **never** reads these directly — they belong to the
configurator only.

### 9.1 Defaults per distribution

| Distribution                | Default `CBQA_LOG_FILE`                              | Notes |
| --------------------------- | ---------------------------------------------------- | ----- |
| Local dev (`./start.sh`)    | `./logs/cbqa.log`                                    | Add `logs/` to `.gitignore`. |
| Docker image                | `/app/logs/cbqa.log` (mount as volume)               | Containers should also rely on stderr → `docker logs`. |
| macOS `.app` bundle         | `~/Library/Logs/CouchbaseQueryAnalyzer/cbqa.log`     | Standard macOS log location. |
| Windows `.exe`              | `%LOCALAPPDATA%\\CouchbaseQueryAnalyzer\\logs\\cbqa.log` | Standard Windows log location. |

### 9.2 Rotation

Three independent caps, evaluated after every rollover:

1. Active file reaches `CBQA_LOG_MAX_SIZE_MB` → renamed to
   `cbqa.log.YYYYMMDD-HHMMSS.log`, fresh active file opened.
2. Any rotated file older than `CBQA_LOG_MAX_AGE_DAYS` → deleted.
3. If sum of all rotated files still exceeds
   `CBQA_LOG_ROTATED_TOTAL_MB`, the **oldest** rotated files are
   deleted until the budget is satisfied.

The active log file itself is never deleted — only rotated copies.
See the Apollo reference implementation for a known-good
`ManagedRotatingFileHandler`; we'll port that file verbatim into
`app/logging_config.py` when the migration starts.

### 9.3 Inspecting logs from the UI

Once `app/logging_config.py` lands, expose:

- `GET /api/logging/info` — resolved active path, file size, rotated
  files (path + size + mtime).
- **Settings → Logging** panel in `app/index.html` — same data,
  human-readable, with a "download active log" button.

Both belong in `app/docs/openapi.yaml` per
[`app/guides/API_OPENAPI.md`](API_OPENAPI.md).

---

## 10. Recipes

### 10.1 "I can't tell what the AI poller is doing"

```bash
# Server: see every poll iteration with timestamps.
CBQA_LOG_LEVEL=DEBUG ./start.sh

# Or just one subsystem (once the filter env var is wired up):
CBQA_LOG_LEVEL=INFO CBQA_LOG_FILTER='app.ai_analyzer' ./start.sh
```

```text
# Browser
http://localhost:5000/?logLevel=debug
```

### 10.2 "Production firehose for one user reproducing a bug"

```bash
# Server side, JSON for the log shipper.
CBQA_LOG_LEVEL=DEBUG CBQA_LOG_JSON=1 \
CBQA_LOG_FILE=/var/log/cbqa/debug-session.log \
./start.sh
```

```text
# Browser side, with redaction off (only on the user's own machine!)
http://localhost:5000/?logLevel=trace&redact=false
```

### 10.3 "Quiet, please"

```bash
CBQA_LOG_LEVEL=WARNING ./start.sh
```

```text
http://localhost:5000/?logLevel=warn
```

---

## 11. Tests

### Python (pytest)

Use the built-in `caplog` fixture. Don't capture stdout for log
assertions — that only works while we still have stray `print()`s.

```python
def test_save_analyzer_logs_failure(caplog):
    with caplog.at_level("ERROR", logger="app.cbl_store"):
        with pytest.raises(StorageError):
            cbl.save_analyzer({"bad": "doc"})
    assert any("save_analyzer failed" in r.message
               for r in caplog.records)
```

### Frontend (Playwright)

```javascript
test('AI client logs error on 500', async ({ page }) => {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error' && msg.text().includes('[ai-client]')) {
      errors.push(msg.text());
    }
  });
  await page.goto('/?logLevel=error');
  // ... trigger the failure ...
  expect(errors.some(t => t.includes('fetch failed'))).toBe(true);
});
```

---

## 12. Migration plan

The codebase is mid-migration. New code MUST follow this guide; existing
code is converted incrementally. Suggested order, smallest first:

1. ✅ `app/assets/js/base.js` — `Logger` already conformant; keep as-is.
2. ⚠️ Add `app/logging_config.py` with `configure_logging()` + the
   `ManagedRotatingFileHandler` ported from Apollo.
3. ⚠️ `app/app.py` — call `configure_logging()` at top of file before
   any other import that might log; add module logger; keep the
   `__main__` `print()` banner but pair every line with `logger.info`.
4. ⚠️ `app/app_base.py` — add module logger; convert `ic("...")` lines
   that ship to `logger.<level>(...)`. Leave `ic.configureOutput(...)`
   in place — `ic` remains a *developer probe*.
5. ⚠️ `app/ai_analyzer.py` — biggest win, since this is the hot path
   the user complains about. Convert every `ic(...)` to `logger.<level>(...)`
   with the right severity. Specifically:
   - `kickoff` / `cancel` / `complete` → `info`
   - per-poll status → `debug`
   - provider 4xx/5xx → `error`, with `logger.exception` if there's a stack.
6. ⚠️ `app/cbl_store.py`, `app/blob_storage.py` — same drill.
7. ⚠️ Frontend modules — grep for `console\.(log|warn|error)` and
   replace with `Logger.<level>` + a subsystem prefix per §7.2.
8. Plain-text `print()` left in `__main__`, build specs, and
   `_dev_only/` helpers is fine.

Track progress as commits with a `log:` prefix:

```
log: add app/logging_config.py with configure_logging + rotation
log: app/ai_analyzer.py – convert ic() to module logger
log: assets/js/charts.js – replace console.log with Logger.debug
log: app/cbl_store.py – use logger.exception in save/load except blocks
```

### Rule of thumb during migration

If a file you're touching has even one `ic(...)` or `console.log(...)`
that ships, take five minutes and convert that file. Don't try to do
the whole codebase in one commit.

---

## 13. Cheat sheet

### Python

```python
import logging
logger = logging.getLogger(__name__)

logger.debug("loop %d/%d", i, n)                          # dev tracing
logger.info("ai_analysis kickoff doc_id=%s", doc_id)      # lifecycle
logger.warning("payload truncated bytes=%d", n)           # recovered
logger.error("provider %s returned 500", provider)        # request failed
try:
    risky()
except Exception:
    logger.exception("risky() failed for %s", item)       # ERROR + traceback
```

```bash
# Run with verbose output
CBQA_LOG_LEVEL=DEBUG ./start.sh

# JSON logs to a file for shippers
CBQA_LOG_LEVEL=INFO CBQA_LOG_JSON=1 \
CBQA_LOG_FILE=/var/log/cbqa.log \
./start.sh
```

### JavaScript

```javascript
import { Logger } from './base.js';

Logger.error('[ai-client]', 'fetch failed', err);
Logger.warn ('[ai-client]', 'rate limited; backing off ms=%d', delay);
Logger.info ('[boot]',      'analyzer initialized v=%s', VERSION);
Logger.debug('[charts]',    'redraw rows=%d ms=%d', n, dt);
Logger.trace('[parsers]',   'row', i, row);
```

```text
# URL flags
?logLevel=debug         # one user, one session
?logLevel=trace&redact=false  # full firehose, dev machine only
?debug=true             # legacy alias for ?logLevel=debug
```

That's the entire standard. Anything not covered here, default to
"behave like `app/assets/js/base.js`'s `Logger` on the frontend, and
a module-scoped `logger = logging.getLogger(__name__)` on the backend."
