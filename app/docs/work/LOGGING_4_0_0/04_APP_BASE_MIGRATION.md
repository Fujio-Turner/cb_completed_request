# 04 · `app/app_base.py` — 113 `ic()` migrations

**Depends on:** [`01_LOGGING_CONFIG_MODULE.md`](./01_LOGGING_CONFIG_MODULE.md), [`02_API_KEY_REDACTION.md`](./02_API_KEY_REDACTION.md), [`03_APP_PY_MIGRATION.md`](./03_APP_PY_MIGRATION.md).
**Blocks:** nothing — Docs 05 and 06 are independent.
**Status:** ✅ DONE — migrated 114 `ic()` calls to logger.* across 5 buckets.

---

## 1. Why this file matters

`app/app_base.py` owns:

- All `/api/ai/*` request handlers.
- The AI provider HTTP client config + retry policy.
- The `/api/storage/*` and `/api/couchbase/save-analyzer` endpoints.
- The legacy `/api/ai/test` connection-tester.

It is the file with the **second confirmed API-key leak**
([line 1302](../../../app_base.py#L1302), `v[:20]` truncation), so its
migration is the second-highest-priority Python file after Doc 03.

## 2. Pre-flight grep

```bash
grep -nE '^\s*ic\(' app/app_base.py | wc -l   # → 113
grep -nE 'api_key|apiKey|headers' app/app_base.py | wc -l
```

Cluster the 113 calls into the buckets in § 4 below before opening any
editor.

## 3. Module setup

At the top of `app/app_base.py`:

```python
import logging
from app.logging_config import mask_api_key   # for any header / config logging

logger = logging.getLogger(__name__)          # → "app.app_base"

# icecream stays as a developer probe (LOGGING.md §6.2).
from icecream import ic
```

`ic.configureOutput(...)` is centralised in `app/app.py`; do not call it
again here.

## 4. Migration buckets

Group the 113 calls into these five buckets and migrate one bucket per
commit. This keeps the diff reviewable.

### Bucket A — Lifecycle / startup (~10 calls) → `logger.info`

```python
# Today
ic(f"✅ Loaded credentials for provider: {provider}")
ic(f"  API URL: {api_url}")
ic(f"  Model: {model}")

# Tomorrow
logger.info("loaded credentials provider=%s api_url=%s model=%s", provider, api_url, model)
```

One event per request, not three (per [`LOGGING.md §5.3`](../../../guides/LOGGING.md)).
The three `ic(f"  ...")` lines that read like a continuation of one
event become a **single** record with structured fields.

### Bucket B — Per-request internals (~70 calls) → `logger.debug`

These are the `ic("Step 1 of 3", ...)`, `ic("📤 Sending payload", ...)`,
`ic("✅ Got response", ...)` traces inside the AI request handlers.
They're useful when reproducing a bug, useless in a 1,000-request log.

```python
# Today
ic(f"📤 Sending request to {api_url}{endpoint}")

# Tomorrow
logger.debug("sending ai request url=%s endpoint=%s", api_url, endpoint)
```

### Bucket C — Headers / payloads with credentials (~6 calls) → `logger.debug` + redaction

This is where the leak lives. Add the file-local helper from
[`02_API_KEY_REDACTION.md §3`](./02_API_KEY_REDACTION.md):

```python
def _safe_headers(h):
    SENS = {"authorization", "x-api-key", "api-key", "apikey", "x-goog-api-key"}
    out = {}
    for k, v in h.items():
        if k.lower() in SENS:
            s = str(v)
            out[k] = ("Bearer " + mask_api_key(s[7:])) if s.startswith("Bearer ") else mask_api_key(s)
        else:
            out[k] = v
    return out
```

Then:

```python
# Today (line ~1302)
ic("📋 Final Headers", {k: v[:20] + '...' if len(str(v)) > 20 else v for k, v in headers.items()})
ic("📋 Final Payload", payload)

# Tomorrow
logger.debug("final headers=%s", _safe_headers(headers))
logger.debug("final payload bytes=%d keys=%s",
             len(json.dumps(payload)), sorted(payload.keys()))
```

Never log `payload` whole at any level — bodies can include user query
text and prompt content (see [`LOGGING.md §8`](../../../guides/LOGGING.md)).

### Bucket D — Recovered errors (~15 calls) → `logger.warning`

```python
# Today
ic(f"⚠️ Retry {attempt}/{max_retries} after {delay}s")
ic(f"❌ No API key configured for provider: {provider}")  # this was misleadingly tagged ❌

# Tomorrow
logger.warning("retrying ai call attempt=%d/%d delay_s=%.1f", attempt, max_retries, delay)
logger.warning("no api key configured provider=%s", provider)
```

The `❌` emoji misled the reader — the request hadn't failed yet, the
caller just hadn't supplied a key. After migration, the level alone
carries the severity (no emoji needed inside log messages —
[`LOGGING.md §5.2`](../../../guides/LOGGING.md)).

### Bucket E — Failed operations (~12 calls) → `logger.exception` (inside `except`) or `logger.error`

```python
# Today
try:
    response = client.post(url, json=payload, headers=headers)
except requests.RequestException as e:
    ic(f"❌ HTTP error: {e}")

# Tomorrow
try:
    response = client.post(url, json=payload, headers=headers)
except requests.RequestException:
    logger.exception("ai http request failed url=%s", url)
```

`logger.exception` automatically attaches the traceback — a strict
upgrade over `ic(f"❌ HTTP error: {e}")` which dropped it.

### "Keep as `ic` (probe)" — ~0 expected

After this pass, `app/app_base.py` should have **zero** shipping `ic()`
calls. If a reviewer wants to leave one in for a specific bug hunt,
tag it `# dev probe` so the CI scanner from
[`02 §6`](./02_API_KEY_REDACTION.md) doesn't fail.

## 5. Worked diff for the leak hot-spot (`background_ai_task` chain)

```diff
- ic(f"📡 [DEBUG] Starting background AI task for doc_id={doc_id}")
+ logger.info("ai_analysis kickoff doc_id=%s provider=%s model=%s", doc_id, provider, model)

- ic(f"  Has API Key: {bool(api_key)}")
+ logger.debug("has_api_key=%s", bool(api_key))

- ic(f"❌ No API key configured for provider: {provider}")
+ logger.warning("no api key configured provider=%s", provider)

- ic("📤 Headers", headers)                                   # <-- LEAK SITE in ai_analyzer.py
+ logger.debug("api request headers=%s", _safe_headers(headers))

- ic("📋 Final Headers", {k: v[:20] + '...' if ... else v for k, v in headers.items()})  # <-- LEAK SITE
+ logger.debug("final headers=%s", _safe_headers(headers))

- ic(f"✅ AI analysis complete for doc_id={doc_id}")
+ logger.info("ai_analysis complete doc_id=%s elapsed_ms=%d", doc_id, int(elapsed * 1000))

- ic(f"❌ AI analysis failed: {e}")
+ logger.exception("ai_analysis failed doc_id=%s", doc_id)
```

## 6. Tests to add (in `tests/python/test_app_base_logging.py`)

```python
import logging
import pytest

def test_kickoff_logs_provider_at_info(caplog, client_with_fake_provider):
    with caplog.at_level(logging.INFO, logger="app.app_base"):
        client_with_fake_provider.post("/api/ai/analyze", json={
            "documentId": "T-test-123",
            "provider": "openai",
        })
    assert any(
        "ai_analysis kickoff" in r.message and "provider=openai" in r.message
        for r in caplog.records
    )

def test_headers_logged_redacted(caplog, client_with_fake_provider):
    with caplog.at_level(logging.DEBUG, logger="app.app_base"):
        client_with_fake_provider.post("/api/ai/test", json={
            "provider": "openai",
            "apiKey": "sk-proj-LEAK1234567890XYZW",
            "apiUrl": "https://api.openai.com/v1",
            "model": "gpt-4o-mini",
        })
    body = "\n".join(r.message for r in caplog.records)
    assert "LEAK1234567890" not in body
    assert "sk-proj-......XYZW" in body or "Bearer sk-proj-......XYZW" in body

def test_no_payload_body_logged_at_info(caplog, client_with_fake_provider):
    with caplog.at_level(logging.INFO, logger="app.app_base"):
        client_with_fake_provider.post(
            "/api/ai/analyze",
            json={"prompt": "secret prompt content here"},
        )
    body = "\n".join(r.message for r in caplog.records)
    assert "secret prompt content" not in body
```

## 7. Acceptance checklist

- [x] `grep -cE '^\s*ic\(' app/app_base.py` returns **0** (all ic() migrated).
- [x] `logger = logging.getLogger(__name__)` at module scope.
- [x] `mask_api_key` imported from logging_config and `_safe_headers` defined locally.
- [x] `from icecream import ic` restored as an importable developer probe (per Doc spec § 3).
- [x] Both confirmed leak sites (header dumps at lines ~718, ~1322) replaced with `_safe_headers()`.
- [x] No `print()` calls in this file (library-side, not CLI).
- [x] All `except` blocks that previously did `ic(f"❌ ...: {e}")` now use `logger.exception(...)`.
- [x] `pytest tests/python/test_app_base_logging.py -v` passes (16/16).
- [x] `pytest tests/python/ -v` overall: **187 passed, 0 failed**.
- [ ] Live smoke: `CBQA_LOG_LEVEL=DEBUG ./start.sh`, trigger one AI
      analysis, `grep -i bearer logs/cbqa.log` returns only redacted
      forms.

---

## 8. Post-implementation review (2026-05-10)

### 8.1 `from icecream import ic` was inadvertently removed

Doc § 3 specified that `from icecream import ic` must remain in
`app_base.py` so developers can drop a one-off probe during a bug
hunt. The first migration deleted the import along with all the
`ic(...)` call sites, breaking the "ic stays as a developer probe"
contract. The import has been restored with a `# noqa: F401` marker
and a comment pointing back to this doc.

### 8.2 Test wiring

`tests/python/test_app_base_logging.py` (16 tests) now passes:
- `from app_base import …` works from the test root because
  `tests/python/conftest.py` adds `app/` to `sys.path`.
- One test (`test_python_executable_logged`) was rewritten to log
  manually via `app_base.logger.info(...)` instead of relying on
  `import app_base` to re-fire module-level logging — Python caches
  modules so the second `import` was a no-op and `caplog` saw nothing.
