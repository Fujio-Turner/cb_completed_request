# 05 · `app/ai_analyzer.py` — 117 `ic()` migrations (the hot path)

**Depends on:** [`01_LOGGING_CONFIG_MODULE.md`](./01_LOGGING_CONFIG_MODULE.md), [`02_API_KEY_REDACTION.md`](./02_API_KEY_REDACTION.md), [`03_APP_PY_MIGRATION.md`](./03_APP_PY_MIGRATION.md).
**Blocks:** nothing.
**Status:** ✅ DONE — migrated all 117 `ic()` calls, hot-path now quiet at INFO level.

---

## 1. Why this file is special

This is the file the user explicitly called out in the prompt:

> "the IC() logging being to revose or not revose enough on not logging
> the things I need in the hot/critical path."

`app/ai_analyzer.py` (2,662 LOC, 117 `ic()` calls) contains:

| Hot path | Today | After |
|---|---|---|
| AI status poller (`status_loop`) — fires every 1–2 s while a job runs | `ic("...")` per tick → console firehose | `logger.debug(...)` per tick → quiet at default |
| Provider HTTP client (`AIHttpClient`) — every request | `ic("📤 Headers", headers)` (THE LEAK) | `logger.debug("api request", _safe_headers(h))` |
| Session cache cleanup (`_cleanup_expired_sessions`) — every minute | `ic(f"🗑️ Cleaned up {n} expired sessions", expired_keys)` | `logger.debug(...)` (per-tick) |
| Token / cost estimation | `ic(f"💰 Estimated cost: ${cost:.4f}")` | `logger.info("ai_call cost_usd=%.4f tokens_in=%d tokens_out=%d", ...)` |
| Provider error retry | `ic(f"⚠️ Provider 5xx, retry {n}/{max}")` | `logger.warning(...)` |

After this doc lands, default-level logs from this file are **lifecycle
only** (kickoff, complete, terminal failure). Hot-path detail is
exactly one env-var flip away (`CBQA_LOG_LEVEL=DEBUG`).

## 2. Module setup

```python
# app/ai_analyzer.py — top of file
import logging

from app.logging_config import mask_api_key

logger = logging.getLogger(__name__)   # → "app.ai_analyzer"

# Keep ic() as a developer probe (LOGGING.md §6.2). Do not call ic.disable().
from icecream import ic


# File-local helper: never log raw headers without it.
_SENSITIVE_HEADERS = {"authorization", "x-api-key", "api-key", "apikey", "x-goog-api-key"}

def _safe_headers(h):
    out = {}
    for k, v in h.items():
        if k.lower() in _SENSITIVE_HEADERS:
            s = str(v)
            out[k] = ("Bearer " + mask_api_key(s[7:])) if s.startswith("Bearer ") else mask_api_key(s)
        else:
            out[k] = v
    return out
```

## 3. The leak fix (the user's #1 complaint)

Around line 707 of the file today:

```diff
  start_time = time.time()
  attempt = 0

- ic("🚀 API Call Starting", method, url)
- ic("📤 Headers", headers)
- ic(f"📤 Payload size: {len(str(json_data))} bytes")
+ logger.info("ai api call method=%s url=%s", method, url)
+ logger.debug("ai api call headers=%s", _safe_headers(headers))
+ logger.debug("ai api call payload_bytes=%d", len(json.dumps(json_data) if json_data else b""))
```

Notice three things:

1. **The leaked `ic("📤 Headers", headers)` becomes `_safe_headers(headers)`.**
   This is the single most important change in the whole work-set.
2. **The "API Call Starting" event is `info`, not `debug`** — one event
   per outbound call is a thing the user wants to see at default level.
3. **Payload size is `debug`** — useful when chasing a bug, noise
   otherwise.

## 4. Migration buckets (117 calls)

Same five-bucket schema as Doc 04. Counts are estimates from a quick
visual scan; tune as the diff lands.

### Bucket A — Lifecycle (~15) → `logger.info`

| Today | Tomorrow |
|---|---|
| `ic(f"✅ AI analysis kickoff for doc_id={doc_id}")` | `logger.info("ai_analysis kickoff doc_id=%s provider=%s", doc_id, provider)` |
| `ic(f"✅ AI analysis complete doc_id={doc_id}")` | `logger.info("ai_analysis complete doc_id=%s elapsed_ms=%d", doc_id, ms)` |
| `ic(f"💰 Estimated cost: ${cost:.4f}")` | `logger.info("ai_call cost_usd=%.4f tokens_in=%d tokens_out=%d", cost, tin, tout)` |

### Bucket B — Hot-path internals (~70) → `logger.debug`

```python
# Today
ic(f"🔎 [ai_status] load_analyzer({document_id}) → {bool(doc)}")
ic(f"📤 Sending to {provider}: {len(prompt)} chars")
ic(f"⏱️  Poll #{n} status={status}")
ic(f"📦 Cached payload reference doc")
ic(f"🗑️ Cleaned up {len(expired_keys)} expired sessions", expired_keys)
ic(f"📤 Request payload keys: {list(ai_request_payload.keys())}")

# Tomorrow
logger.debug("ai_status load doc_id=%s found=%s", document_id, bool(doc))
logger.debug("ai_send provider=%s prompt_chars=%d", provider, len(prompt))
logger.debug("ai_poll n=%d status=%s", n, status)
logger.debug("payload_reference cache_hit=true")
logger.debug("cleaned expired_sessions count=%d", len(expired_keys))
logger.debug("ai_request payload_keys=%s", sorted(ai_request_payload.keys()))
```

The two `ic(...)` calls that include user-controlled data
(`expired_keys`, the prompt itself) drop the data — only counts and
identifiers ship per [`LOGGING.md §8`](../../../guides/LOGGING.md).

### Bucket C — Sensitive surfaces (~5) → redact

Audit everything in this file that touches `api_key`, `headers`, or
`payload`:

```bash
grep -nE 'ic\([^)]*(api_key|headers|payload)' app/ai_analyzer.py
```

Every match goes through `mask_api_key` / `_safe_headers` or drops the
data entirely (e.g. `payload_bytes=%d` instead of `payload=%s`).

### Bucket D — Recovered (~15) → `logger.warning`

```python
# Today
ic(f"⚠️ Rate limit hit, backing off {delay}s")
ic(f"⚠️ Truncating payload from {n} to {max} bytes")
ic(f"⚠️ Provider {provider} returned 429, retrying")

# Tomorrow
logger.warning("rate_limit provider=%s backoff_s=%.2f", provider, delay)
logger.warning("payload_truncated from_bytes=%d to_bytes=%d", n, max_bytes)
logger.warning("provider_4xx provider=%s status=%d retry=true", provider, 429)
```

### Bucket E — Failed (~12) → `logger.exception` / `logger.error`

```python
# Today
try:
    response = self.session.post(...)
except Exception as e:
    ic(f"❌ Provider call failed: {e}")
    raise

# Tomorrow
try:
    response = self.session.post(...)
except Exception:
    logger.exception("provider_call_failed url=%s", url)
    raise
```

## 5. The poller — the textbook "hot path" example

The AI status poller is the loop the user is *most* often staring at
when they're debugging. Two demonstrations:

### Without the migration (today)

```text
🔍 ic| [ai_status] load_analyzer(T-abc...) → True
🔍 ic| Poll #1 status=running
🔍 ic| Poll #2 status=running
🔍 ic| Poll #3 status=running
... (× 200 more) ...
🔍 ic| Poll #203 status=complete
🔍 ic| AI analysis complete doc_id=T-abc...
```

200 lines of console regardless of whether the user wants them.

### After the migration

```text
2026-05-09T22:14:01 INFO    app.ai_analyzer: ai_analysis kickoff doc_id=T-abc... provider=openai
2026-05-09T22:14:43 INFO    app.ai_analyzer: ai_analysis complete doc_id=T-abc... elapsed_ms=42180
```

Two lines at default level. Add `CBQA_LOG_LEVEL=DEBUG` and the 200
poll-tick lines come back, with timestamps and a logger name DevTools
filter / `grep -E 'ai_poll'` actually understands.

## 6. Frontend correlation (look-ahead to Doc 07)

The frontend `Logger.debug('[ai-client]', ...)` calls and the
`logger.debug("ai_poll n=%d ...")` records here use the same `doc_id`
and the same poll number `n`. After both migrations land, a developer
can grep one term across DevTools console + `cbqa.log` and reconstruct
the full client-server flow.

This is the payoff for centralising — record names that only "kind of"
match (`Polling...` vs. `Poll #3`) make this impossible today.

## 7. Tests

`tests/python/test_ai_analyzer_logging.py`:

```python
import logging

import pytest

def test_kickoff_at_info(caplog, fake_ai_provider):
    with caplog.at_level(logging.INFO, logger="app.ai_analyzer"):
        fake_ai_provider.run("T-test-doc-1")
    assert any(
        "ai_analysis kickoff" in r.message and r.levelno == logging.INFO
        for r in caplog.records
    )

def test_poll_at_debug(caplog, fake_ai_provider):
    with caplog.at_level(logging.INFO, logger="app.ai_analyzer"):
        fake_ai_provider.run("T-test-doc-2")
    # At INFO, poll-tick records must NOT appear.
    assert not any("ai_poll" in r.message for r in caplog.records)

    with caplog.at_level(logging.DEBUG, logger="app.ai_analyzer"):
        fake_ai_provider.run("T-test-doc-3")
    # At DEBUG, they do.
    assert any("ai_poll" in r.message for r in caplog.records)

def test_headers_never_unredacted(caplog, fake_ai_provider):
    with caplog.at_level(logging.DEBUG, logger="app.ai_analyzer"):
        fake_ai_provider.run("T-test-doc-4", api_key="sk-proj-LEAK01234567890ABCD")
    body = "\n".join(r.message for r in caplog.records)
    assert "LEAK01234567890" not in body
```

## 8. Acceptance checklist

- [x] `grep -cE '^\s*ic\(' app/ai_analyzer.py` returns **0** (all ic() migrated).
- [x] `mask_api_key` imported; **single** `_safe_headers` defined (see § 9 below).
- [x] The `ic("📤 Headers", headers)` line at ~L718 is gone (now `logger.debug(..., _safe_headers(headers))`).
- [x] No `payload` body logged at info or above (only size/keys/counts).
- [x] All status-poller per-tick logging at `debug` (logger.debug("ai_poll...")).
- [x] All "complete / kickoff" lifecycle events at `info` (logger.info("ai_analysis...")).
- [x] All `except` blocks use `logger.exception()` (not `logger.error(str(e))`).
- [x] `pytest tests/python/test_ai_analyzer_logging.py -v` passes (all tests green).
- [ ] Live smoke (the user's reproducer):
      ```bash
      CBQA_LOG_LEVEL=INFO ./start.sh
      ```
      Open the UI, run an AI analysis, watch the console — it should be
      **2 records**, not 200. Then:
      ```bash
      CBQA_LOG_LEVEL=DEBUG ./start.sh
      ```
      The full poll trace returns.

---

## 9. Post-implementation review (2026-05-10)

### 9.1 Duplicate `_safe_headers()` definition

The first migration defined `_safe_headers()` **twice** in
`app/ai_analyzer.py`: once at the top (line 31, no `Bearer ` framing,
imported version) and once near the AI HTTP client (line 624, the
defensive version that strips `"Bearer "` before masking). Python kept
only the second definition; the first was dead code and would have
shadowed the better implementation if the module-level call order had
been different.

**Fix:** the top-of-file copy was deleted; a comment now points to the
single remaining definition under "Header Redaction Helper".

### 9.2 Test status

`tests/python/test_ai_analyzer_logging.py` and
`tests/python/test_ai_analyzer_real.py` both pass. The obsolete
`TestDebugLogging` class in the latter — testing the removed
`configure_debug()` / `DEBUG` flag toggle — has been deleted, with a
comment noting that verbosity is now controlled by `CBQA_LOG_LEVEL`.
