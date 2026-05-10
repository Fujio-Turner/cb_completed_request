# 03 · `app/app.py` — wire up + 19 `ic()` migrations

**Depends on:** [`01_LOGGING_CONFIG_MODULE.md`](./01_LOGGING_CONFIG_MODULE.md), [`02_API_KEY_REDACTION.md`](./02_API_KEY_REDACTION.md).
**Blocks:** Docs 04, 05, 06 (other modules log into the root logger this file configures).
**Status:** ✅ DONE

---

## 1. Goal

Two jobs in one PR:

1. **Wire `configure_logging()` into the Flask entrypoint** so every
   import below it inherits a configured root logger. Without this,
   modules emit `WARNING` "no handlers could be found" on first call
   under `pytest`.
2. **Migrate the 19 `ic(...)` calls in `app/app.py`** to module-scoped
   logger calls at the right severity, while keeping the user-facing
   startup banner as `print()`.

## 2. Current state

```
$ grep -cE '^\s*ic\(' app/app.py
19
```

These calls are concentrated in the startup path (banner, config load,
backend selection) and the few request handlers that haven't already
been moved into [`app/app_base.py`](../../../app_base.py).

## 3. Wire-in (the only line that matters)

`app/app.py` currently looks roughly like:

```python
# Existing top of file
from icecream import ic
ic.configureOutput(prefix="🔍 ")
import os
import json
from flask import Flask, ...
from app import app_base
...
__version__ = "4.0.0-Beta"
```

Change to:

```python
# NEW: must be the first non-stdlib import so every later import inherits config.
from app.logging_config import configure_logging
configure_logging()                  # honours CBQA_LOG_LEVEL etc.

import logging
logger = logging.getLogger(__name__)  # → "app.app"

# icecream stays — but only as a developer probe (see LOGGING.md §6.2).
from icecream import ic
ic.configureOutput(prefix="🔍 ")

import os
import json
from flask import Flask, ...
from app import app_base
...
__version__ = "4.0.0-Beta"
```

The order matters: `configure_logging()` must run **before** the `from
app import app_base` line, otherwise `app_base`'s module-level loggers
(once Doc 04 lands) will be created against an unconfigured root.

## 4. Migration table

The exact line numbers will drift; this table is a *pattern guide*, not
a prescriptive line-by-line list. For every `ic(...)` left in the file,
ask:

1. **Is it the startup banner the user reads on the terminal?** → keep as
   `print(...)` (CLI surface), and add a paired `logger.info(...)`.
2. **Is it a one-shot lifecycle event?** → `logger.info(...)`.
3. **Is it a per-request internal?** → `logger.debug(...)`.
4. **Is it inside an `except`?** → `logger.exception(...)` (auto-traceback).
5. **Is it a developer probe you'd `git rm` before merging?** → leave as
   `ic(...)` and add a trailing `# dev probe` comment so the
   leak-scanner CI doesn't flag it.

Worked examples (illustrative — real lines come from the file at PR time):

| Today | Tomorrow | Reason |
|---|---|---|
| `ic("🚀 Starting Couchbase Query Analyzer v" + __version__)` (in `__main__`) | `print("🚀 Starting Couchbase Query Analyzer v" + __version__)` **plus** `logger.info("starting cbqa version=%s", __version__)` | Banner stays for terminal users; `logger.info` lets headless containers / log shippers see the same event. See [`LOGGING.md §3`](../../../guides/LOGGING.md). |
| `ic(f"📊 Backend: {backend_name}")` | `logger.info("backend=%s", backend_name)` | Lifecycle. |
| `ic(f"⚙️ Loaded server config from {path}")` | `logger.info("loaded server config path=%s", path)` | Lifecycle. |
| `ic(f"🔌 Listening on http://localhost:{PORT}")` (in `__main__`) | `print(...)` + `logger.info("listening port=%d", PORT)` | Banner. |
| `ic(f"⚠️ Config file missing: {path}")` | `logger.warning("config file missing path=%s", path)` | Recovered. |
| `ic("❌ Failed to load config", e)` (inside `except`) | `logger.exception("failed to load config path=%s", path)` | Error + traceback for free. |
| `ic("Request body", request.get_json(silent=True))` (in a handler) | `logger.debug("request body bytes=%d", len(request.get_data()))` | Hot path; never log full body at INFO. |

## 5. Startup banner (the canonical pattern)

Keep this exact shape — it shows up in [`LOGGING.md §3`](../../../guides/LOGGING.md):

```python
def _startup_banner() -> None:
    msg_version = f"🚀 Starting Couchbase Query Analyzer v{__version__}"
    msg_backend = f"📊 Backend: {backend_name}"
    msg_listen  = f"🔌 Listening on http://localhost:{PORT}"

    # User-facing banner (always visible on the controlling terminal).
    print(msg_version)
    print(msg_backend)
    print(msg_listen)

    # Same events into the structured log (file/JSON shipper).
    logger.info("starting cbqa version=%s", __version__)
    logger.info("backend=%s", backend_name)
    logger.info("listening port=%d", PORT)


if __name__ == "__main__":
    _startup_banner()
    app.run(host="0.0.0.0", port=PORT, debug=False)
```

The `logger.info("starting cbqa version=%s", __version__)` line is also
the "single source of truth" line that the
[`/api/version`](../../../docs/openapi.yaml) endpoint logs the first
time it's hit, so log-grep "what version is running" gives the same
answer as the banner.

## 6. `ic.configureOutput` policy

Keep `ic.configureOutput(prefix="🔍 ")` — it makes surviving `# dev probe`
lines visually obvious in the console. Do **not** call `ic.disable()`
in production: a developer who left a probe in place wants it to fire
during their bug hunt regardless of `CBQA_LOG_LEVEL`. The CI scanner
in Doc 02 § 6 prevents probes from shipping accidentally.

## 7. Acceptance checklist

- [x] `from logging_config import configure_logging` is the first
      non-stdlib import in `app/app.py`.
- [x] `configure_logging()` is called exactly once, before any `from app_base
      import …` line.
- [x] `logger = logging.getLogger(__name__)` exists at module scope.
- [x] `grep -cE '^\s*ic\(' app/app.py` returns **0** (no ic() calls remain).
- [x] `grep -nE '^\s*print\(' app/app.py` returns only 4 lines inside
      `_startup_banner()`.
- [ ] `./start.sh` shows the banner unchanged on stdout **and** writes
      matching `logger.info` records to `./logs/cbqa.log`.
- [x] `pytest tests/python/ -v` passes (29 tests, logging enabled).
- [x] No new `urllib3` / `werkzeug` noise in test output (the
      `configure_logging` quieting list handles this).
- [ ] Add a one-line entry to [`release_notes.md`](../../../../release_notes.md):
      *Logging — Server Edition now writes structured logs to
      `./logs/cbqa.log` (configurable via `CBQA_LOG_FILE` /
      `CBQA_LOG_LEVEL`).*
