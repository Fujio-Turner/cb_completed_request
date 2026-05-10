# 09 · Testing — pytest, Playwright, and the leak-scan CI gate

**Depends on:** every other doc (this is the cross-cutting test plan).
**Blocks:** Doc 10 — release cannot ship until this gate is green.
**Status:** ✅ DONE (Python layer) — 187 pytest cases pass, scanner gate green, ESLint green. Playwright e2e specs exist but require a running server to verify.

---

## 1. The three layers

| Layer | Tool | What it proves |
|---|---|---|
| Backend unit | `pytest` + `caplog` | Each module emits the right level for the right event; redaction works; rotation works. |
| Frontend e2e | `playwright` + `page.on('console', …)` | No `console.*` bypass; no API key reaches the DevTools console. |
| Source scanner | `pytest` regex over `app/*.py` and `app/assets/js/**.js` | Make accidental regressions impossible. |

## 2. Backend tests (per module)

Each migration doc already lists the tests for that module:

| Module | Test file | Anchored in |
|---|---|---|
| `app/logging_config.py` | `tests/python/test_logging_config.py` | [`01 §7`](./01_LOGGING_CONFIG_MODULE.md) |
| `mask_api_key` + leak scan | `tests/python/test_api_key_redaction.py` | [`02 §6`](./02_API_KEY_REDACTION.md) |
| `app/app_base.py` | `tests/python/test_app_base_logging.py` | [`04 §6`](./04_APP_BASE_MIGRATION.md) |
| `app/ai_analyzer.py` | `tests/python/test_ai_analyzer_logging.py` | [`05 §7`](./05_AI_ANALYZER_MIGRATION.md) |
| `app/cbl_store.py` + `app/blob_storage.py` | `tests/python/test_cbl_store_logging.py`, `test_blob_storage_logging.py` | [`06 §6`](./06_CBL_STORE_BLOB_MIGRATION.md) |
| `/api/logging/*` | `tests/python/test_logging_api.py` | [`08 §6`](./08_LOGGING_API_AND_UI.md) |

Total backend: ~25 tests across 7 files.

### Shared `caplog` recipe

```python
import logging
import pytest

@pytest.fixture(autouse=True)
def configure_logging_for_tests(monkeypatch):
    """Ensure tests run with a known logging baseline."""
    monkeypatch.setenv("CBQA_LOG_FILE", "off")     # never spam disk during tests
    monkeypatch.setenv("CBQA_LOG_LEVEL", "DEBUG")  # let caplog filter, not the root
    from app.logging_config import configure_logging
    configure_logging()
    yield
```

Add this to `tests/python/conftest.py` so every test file inherits a
clean baseline. `caplog` itself decides what each individual test
captures.

### The "no payload body" assertion (reusable)

```python
# tests/python/_log_helpers.py
SECRET_TOKENS = (
    "secret prompt content",
    "user query body that is private",
    "Bearer sk-",
    "x-api-key: sk-",
    "LEAK0123456789",   # canary planted in test fixtures
)

def assert_no_secrets(records):
    body = "\n".join(r.message for r in records)
    for s in SECRET_TOKENS:
        assert s not in body, f"secret token {s!r} leaked into log body"
```

Every "happy path" test ends with `assert_no_secrets(caplog.records)`.

## 3. Frontend e2e tests

Two new specs, both under `playwright/e2e/server/`:

| Spec | Anchored in | Asserts |
|---|---|---|
| `console-leak.spec.js` | [`07 §6`](./07_FRONTEND_LOGGER_MIGRATION.md) | (1) No raw `Bearer sk-…` / `x-api-key …` in the console under `?logLevel=trace`. (2) No plain `console.*` from app modules at default level. |
| `logging-panel.spec.js` | [`08 §6`](./08_LOGGING_API_AND_UI.md) | Settings → Logging panel reads `/api/logging/info`, shows path and size, "Download active log" link works. |

Run with the existing
`npm run test:e2e:server:chromium` per [`AGENT.md`](../../../../AGENT.md).

## 4. The CI scanner gate (the most important test)

`tests/python/test_no_unredacted_logging.py`:

```python
"""
Source-tree scanner. Walks the codebase and fails if any logging line
touches a credential without going through the documented helpers.

This is the *primary* defence against regression — unit tests can be
forgotten, this scanner cannot.
"""
import pathlib
import re

# Patterns that suggest a credential is about to be logged.
PYTHON_PATTERNS = [
    re.compile(r"(ic|logger\.\w+|print)\([^)]*\bheaders\b"),
    re.compile(r"(ic|logger\.\w+|print)\([^)]*\bapi_key\b"),
    re.compile(r"(ic|logger\.\w+|print)\([^)]*\bapiKey\b"),
    re.compile(r"(ic|logger\.\w+|print)\([^)]*\bAuthorization\b"),
]

JS_PATTERNS = [
    re.compile(r"(console|Logger)\.\w+\([^)]*\bheaders\b"),
    re.compile(r"(console|Logger)\.\w+\([^)]*\bapiKey\b"),
    re.compile(r"(console|Logger)\.\w+\([^)]*\bAuthorization\b"),
    re.compile(r"\bconsole\.(log|warn|error)\("),     # any plain console.*
]

# Lines explicitly allowed (file:line format). Each must justify itself
# in a comment within four lines of context.
ALLOWED_PY = {
    "app/app_base.py:692",   # ic(f"  Has API Key: {bool(api_key)}") — bool only
    "app/app_base.py:695",   # provider name only
}
ALLOWED_JS_FILES = {
    "app/assets/js/base.js",  # Logger implementation uses console.* internally
}

REPO_ROOT = pathlib.Path(__file__).resolve().parents[2]

def _scan(root: pathlib.Path, glob: str, patterns, allowed_lines, allowed_files):
    fails = []
    for path in root.glob(glob):
        rel = str(path.relative_to(REPO_ROOT))
        if rel in allowed_files:
            continue
        for i, line in enumerate(path.read_text().splitlines(), 1):
            tag = f"{rel}:{i}"
            if tag in allowed_lines:
                continue
            for pat in patterns:
                if pat.search(line):
                    if "mask_api_key" in line or "_safe_headers" in line or "safeHeaders" in line:
                        continue
                    if "# dev probe" in line or "// dev probe" in line:
                        continue
                    fails.append(f"{tag}  {line.strip()}")
    return fails


def test_no_unredacted_python_logging():
    fails = _scan(REPO_ROOT / "app", "*.py", PYTHON_PATTERNS, ALLOWED_PY, set())
    assert not fails, "Unredacted Python logging:\n" + "\n".join(fails)


def test_no_unredacted_js_logging():
    fails = _scan(REPO_ROOT / "app" / "assets" / "js", "**/*.js",
                  JS_PATTERNS, set(), ALLOWED_JS_FILES)
    assert not fails, "Unredacted JS logging:\n" + "\n".join(fails)
```

This single file is the **gate**. If it fails, the migration is
incomplete. The allow-list is intentionally tiny — every entry must be
justified by a code comment within four lines of context.

## 5. CI wiring

In `.github/workflows/test.yml` (or whichever workflow runs tests):

```yaml
- name: Backend tests
  run: |
    cd app
    source venv/bin/activate
    pytest ../tests/python/ -v
    # The scanner is part of the suite — no extra step needed.

- name: Frontend lint (no console.*)
  run: npx eslint app/assets/js/

- name: E2E (server, chromium) including console-leak spec
  run: npm run test:e2e:server:chromium
```

If you don't already have a `test.yml`, add one as part of this work
set — but **do not** block the migration on it; the scanner can run
locally via `pytest tests/python/test_no_unredacted_logging.py -v`.

## 6. Manual verification matrix (pre-release)

Before flipping the version banner from `4.0.0-beta` to a tagged
release, run the scenarios in the user's original complaint:

| Scenario | Command | Expected |
|---|---|---|
| Idle UI, default log level | `./start.sh` then open `http://localhost:5000/` | DevTools console: 1–2 boot messages; `tail -f logs/cbqa.log`: 3 startup `INFO` records, then quiet. |
| AI analysis, default log level | Same as above + click "Analyze with AI" | DevTools: 3–5 `Logger.info` records (`[boot]`, `[ai-client] kickoff`, `[ai-client] complete`); log file: matching `ai_analysis kickoff` / `ai_analysis complete` records. **No** poll-tick spam. **No** `Bearer sk-…` strings anywhere. |
| AI analysis, debug log level | `?logLevel=debug` URL flag, `CBQA_LOG_LEVEL=DEBUG ./start.sh` | Full poll trace returns. Headers logged but redacted (`Bearer sk-proj-......XYZW`). |
| Production reproducer with redaction off | `?logLevel=trace&redact=false` (dev machine only) | Full firehose; **still** no raw API keys (redaction is independent of `?redact=`). |
| Logging disabled | `CBQA_LOG_FILE=off ./start.sh` | `./logs/` does not exist; stderr still receives records; `/api/logging/info` returns `active_file: null`. |

Each row corresponds to one bullet in [`LOGGING.md §10`](../../../guides/LOGGING.md).

## 7. Acceptance checklist

- [x] `pytest tests/python/ -v` passes — **187 passed, 81 skipped, 0 failed**.
- [x] `tests/python/test_no_unredacted_logging.py` is **the** gate — passes 2/2.
- [ ] `npm run test:e2e:server:chromium` passes including the new
      `console-leak.spec.js` and `logging-panel.spec.js`. *(specs exist; need running server)*
- [x] `npx eslint app/assets/js/` exits 0.
- [ ] Manual matrix in §6 verified by hand at least once on the user's
      development machine before release.
- [x] [`AGENT.md §Testing`](../../../../AGENT.md) updated to mention
      the new `test_no_unredacted_logging.py` gate.

---

## 8. Post-implementation review (2026-05-10)

### 8.1 Test import-path setup

`tests/python/conftest.py` now adds **both** `app/` (so bare imports
like `from logging_config import …` and `from app_base import …` work
— matching the way the shipping app modules import each other) **and**
the repo root (so `app.foo` namespace-package style still resolves).
The first iteration only added the repo root, which broke 16 tests
that did `from app.app import _human_bytes` (because `app.py` shadows
the `app` namespace package in that style).

Test files that used `from app.X import …` were rewritten to bare
`from X import …` to match the shipping app's import style.

### 8.2 Scanner exemption marker

The Python scanner now recognises three reviewable opt-outs:

1. `mask_api_key` / `_safe_headers` / `safeHeaders` in the line — the
   call goes through a documented redactor.
2. `# dev probe` (Python) or `// dev probe` (JS) — left in place
   intentionally.
3. `// eslint-disable-line no-console` — used inside Logger
   implementations (e.g. `main-legacy.js` lines 553–568) where the
   bound `console.*` method *is* the implementation.

Marker (3) was added in this round — without it, removing
`main-legacy.js` from `ALLOWED_JS_FILES` would have flagged the
file's own Logger internals as leaks.

### 8.3 Allowed-line drift

The `ALLOWED_PY` entry for the bool-only `Has API Key` log was tagged
`app/app_base.py:712` but the line had drifted to 718 by the time the
scanner ran. The allow-list now uses 718. (A more durable allow-list
mechanism — e.g. line-content fingerprint instead of line number — is
out of scope for this work.)
