# 01 · `app/logging_config.py` — configure_logging + rotation

**Depends on:** nothing (this is the foundation).
**Blocks:** Docs 03, 04, 05, 06, 08 (no module logger can be configured until this exists).
**Status:** ✅ DONE

---

## 1. What ships

A single new file:

```
app/
├── logging_config.py        ← new
└── ...
```

Plus three small edits — see § 6.

The module exports exactly three names:

```python
from app.logging_config import (
    configure_logging,        # call once at entrypoint
    mask_api_key,             # used by anything that logs headers / configs
    ManagedRotatingFileHandler,  # exported for tests; not used by callers
)
```

`mask_api_key` lives here (rather than in its own module) because every
caller that logs *also* configures, and a single import keeps things
boring. Its full design is in [`02_API_KEY_REDACTION.md`](./02_API_KEY_REDACTION.md).

## 2. Reference implementation

Port the body of [Apollo's `apollo/logging_config.py`](https://github.com/Fujio-Turner/Apollo/blob/main/apollo/logging_config.py)
verbatim with these renames:

| Apollo | CBQA |
|---|---|
| `APOLLO_LOG_LEVEL` | `CBQA_LOG_LEVEL` |
| `APOLLO_LOG_FILE` | `CBQA_LOG_FILE` |
| `APOLLO_LOG_JSON` | `CBQA_LOG_JSON` |
| `APOLLO_LOG_MAX_SIZE_MB` | `CBQA_LOG_MAX_SIZE_MB` |
| `APOLLO_LOG_MAX_AGE_DAYS` | `CBQA_LOG_MAX_AGE_DAYS` |
| `APOLLO_LOG_ROTATED_TOTAL_MB` | `CBQA_LOG_ROTATED_TOTAL_MB` |
| `_apollo_configured` flag | `_cbqa_configured` |
| Default file `.apollo/logs/apollo.log` | `./logs/cbqa.log` (dev), platform-specific in PyInstaller (see § 5) |

Defaults differ from Apollo (we're a smaller workload):

| Var | Apollo default | CBQA default | Why |
|---|---|---|---|
| `*_MAX_SIZE_MB` | 100 | **50** | Single-user analyzer, no need for huge files |
| `*_ROTATED_TOTAL_MB` | 1024 | **500** | Same reason; Mac `.app` users won't appreciate 1 GB of logs |
| `*_MAX_AGE_DAYS` | 7 | 7 | Match |

## 3. Module sketch (target file)

```python
# app/logging_config.py
"""
Centralised logging setup for the Server Edition.

Spec: app/guides/LOGGING.md
Plan: app/docs/work/LOGGING_4_0_0/

Public API:
    configure_logging(level=None) -> None
    mask_api_key(key: str | None) -> str
    ManagedRotatingFileHandler  (exported for tests)
"""
from __future__ import annotations

import json
import logging
import logging.handlers
import os
import sys
import time
from pathlib import Path
from typing import Optional

__all__ = ["configure_logging", "mask_api_key", "ManagedRotatingFileHandler"]


_DEFAULT_FORMAT = "%(asctime)s %(levelname)-7s %(name)s: %(message)s"
_DEFAULT_DATEFMT = "%Y-%m-%dT%H:%M:%S"  # ISO-8601


# ---------------------------------------------------------------------------
# mask_api_key — see 02_API_KEY_REDACTION.md for the full specification.
# Inlined here so any logger user can `from app.logging_config import mask_api_key`.
# ---------------------------------------------------------------------------
def mask_api_key(key: Optional[str]) -> str:
    """
    Redact an API key for safe logging.

    >>> mask_api_key("sk-proj-abcdefghij1234567890XYZ9876")
    'sk-proj-......9876'
    >>> mask_api_key("sk-ant-api03-abcxyz1234")
    'sk-ant-......1234'
    >>> mask_api_key(None)
    '<none>'
    >>> mask_api_key("short")
    '<redacted>'

    See: app/docs/work/LOGGING_4_0_0/02_API_KEY_REDACTION.md
    """
    if not key:
        return "<none>"
    s = str(key)
    if len(s) < 12:
        return "<redacted>"
    last4 = s[-4:]
    if "-" in s[:12]:
        head = s.rsplit("-", 1)[0].rsplit("-", 1)[0]
        head = head[:12].rstrip("-")
        return f"{head}-......{last4}"
    return f"{s[:4]}......{last4}"


# ---------------------------------------------------------------------------
# JSON formatter (opt-in via CBQA_LOG_JSON=1)
# ---------------------------------------------------------------------------
class _JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "ts": self.formatTime(record, _DEFAULT_DATEFMT),
            "level": record.levelname,
            "logger": record.name,
            "msg": record.getMessage(),
        }
        if record.exc_info:
            payload["exc"] = self.formatException(record.exc_info)
        return json.dumps(payload, ensure_ascii=False)


# ---------------------------------------------------------------------------
# Managed rotating handler (size + age + total-budget caps)
# ---------------------------------------------------------------------------
class ManagedRotatingFileHandler(logging.handlers.BaseRotatingHandler):
    """
    Size-based rollover with two extra caps applied after each rotation:
      - max_age_days: prune rotated files older than this.
      - total_mb_cap: keep the sum of all rotated files under this budget.
    The active file is never pruned, only renamed on rollover.

    Ported from apollo/logging_config.py — see Apollo guides/LOGGING.md § 9.
    """

    def __init__(
        self,
        filename: str,
        max_bytes: int,
        max_age_days: int,
        total_mb_cap: int,
        encoding: str = "utf-8",
    ):
        Path(filename).parent.mkdir(parents=True, exist_ok=True)
        super().__init__(filename, mode="a", encoding=encoding, delay=False)
        self._max_bytes = max_bytes
        self._max_age_seconds = max_age_days * 86_400
        self._total_bytes_cap = total_mb_cap * 1024 * 1024

    def shouldRollover(self, record) -> bool:
        if self._max_bytes <= 0 or self.stream is None:
            return False
        msg = self.format(record) + self.terminator
        self.stream.seek(0, 2)
        return self.stream.tell() + len(msg.encode(self.encoding)) >= self._max_bytes

    def doRollover(self) -> None:
        if self.stream:
            self.stream.close()
            self.stream = None
        rotated = f"{self.baseFilename}.{time.strftime('%Y%m%d-%H%M%S')}.log"
        try:
            os.replace(self.baseFilename, rotated)
        except FileNotFoundError:
            pass
        self.stream = self._open()
        self._enforce_caps()

    def _enforce_caps(self) -> None:
        base = Path(self.baseFilename)
        rotated = sorted(
            base.parent.glob(f"{base.name}.*.log"),
            key=lambda p: p.stat().st_mtime,
        )
        now = time.time()
        if self._max_age_seconds > 0:
            for p in list(rotated):
                if now - p.stat().st_mtime > self._max_age_seconds:
                    p.unlink(missing_ok=True)
                    rotated.remove(p)
        if self._total_bytes_cap > 0:
            total = sum(p.stat().st_size for p in rotated)
            for p in rotated:
                if total <= self._total_bytes_cap:
                    break
                total -= p.stat().st_size
                p.unlink(missing_ok=True)


# ---------------------------------------------------------------------------
# Public entrypoint
# ---------------------------------------------------------------------------
def configure_logging(level: Optional[str] = None) -> None:
    """
    Set up CBQA's root loggers. Idempotent — safe to call twice.

    Honours environment variables:
      CBQA_LOG_LEVEL              default INFO
      CBQA_LOG_FILE               default ./logs/cbqa.log; 'off'|'none'|'0'|'' to disable
      CBQA_LOG_JSON               default 0; '1' for JSON one-line records
      CBQA_LOG_MAX_SIZE_MB        default 50
      CBQA_LOG_MAX_AGE_DAYS       default 7
      CBQA_LOG_ROTATED_TOTAL_MB   default 500
    """
    level = (level or os.environ.get("CBQA_LOG_LEVEL", "INFO")).upper()
    root = logging.getLogger()
    if getattr(root, "_cbqa_configured", False):
        root.setLevel(level)
        return

    use_json = os.environ.get("CBQA_LOG_JSON", "0") == "1"
    formatter = _JsonFormatter() if use_json else logging.Formatter(
        _DEFAULT_FORMAT, _DEFAULT_DATEFMT
    )

    stderr_handler = logging.StreamHandler(sys.stderr)
    stderr_handler.setFormatter(formatter)
    root.addHandler(stderr_handler)
    root.setLevel(level)

    _attach_rotating_file_handler(root, formatter)

    for noisy in ("urllib3", "httpx", "werkzeug", "PIL", "asyncio"):
        logging.getLogger(noisy).setLevel("WARNING")

    root._cbqa_configured = True  # type: ignore[attr-defined]


def _attach_rotating_file_handler(root: logging.Logger, formatter: logging.Formatter) -> None:
    raw = os.environ.get("CBQA_LOG_FILE", _default_log_file())
    if not raw or raw.strip().lower() in ("off", "none", "0"):
        return
    handler = ManagedRotatingFileHandler(
        filename=raw,
        max_bytes=int(os.environ.get("CBQA_LOG_MAX_SIZE_MB", "50")) * 1024 * 1024,
        max_age_days=int(os.environ.get("CBQA_LOG_MAX_AGE_DAYS", "7")),
        total_mb_cap=int(os.environ.get("CBQA_LOG_ROTATED_TOTAL_MB", "500")),
    )
    handler.setFormatter(formatter)
    root.addHandler(handler)


def _default_log_file() -> str:
    """Per-distribution default; see LOGGING.md § 9.1."""
    if sys.platform == "darwin":
        home = Path.home() / "Library" / "Logs" / "CouchbaseQueryAnalyzer"
        return str(home / "cbqa.log")
    if sys.platform == "win32":
        appdata = os.environ.get("LOCALAPPDATA", str(Path.home()))
        return str(Path(appdata) / "CouchbaseQueryAnalyzer" / "logs" / "cbqa.log")
    return "./logs/cbqa.log"
```

## 4. Behaviour matrix

| Env input | Stderr output | File output |
|---|---|---|
| (none) | INFO+ stderr, plain format | INFO+ to `./logs/cbqa.log` (or platform default), 50 MB / 7 d / 500 MB caps |
| `CBQA_LOG_LEVEL=DEBUG` | DEBUG+ stderr | DEBUG+ to file |
| `CBQA_LOG_FILE=off` | INFO+ stderr | (none) |
| `CBQA_LOG_JSON=1` | JSON one-line records | JSON one-line records |
| `CBQA_LOG_MAX_SIZE_MB=10 CBQA_LOG_ROTATED_TOTAL_MB=100` | unchanged | tighter caps |

## 5. Per-distribution defaults

Already encoded in `_default_log_file()` above:

| Distribution | Default `CBQA_LOG_FILE` |
|---|---|
| Local dev (`./start.sh`) | `./logs/cbqa.log` |
| Docker | `/app/logs/cbqa.log` (set explicitly in `Dockerfile` `ENV`) |
| macOS `.app` | `~/Library/Logs/CouchbaseQueryAnalyzer/cbqa.log` |
| Windows `.exe` | `%LOCALAPPDATA%\CouchbaseQueryAnalyzer\logs\cbqa.log` |

Add to `app/Dockerfile` (after this doc lands, before Doc 03 ships):

```Dockerfile
ENV CBQA_LOG_FILE=/app/logs/cbqa.log
RUN mkdir -p /app/logs
```

Add to `.gitignore` (root): `logs/`.

## 6. Wire-in (does **not** belong in this doc — that's Doc 03)

The single line that turns this on:

```python
# app/app.py — top of file, BEFORE any other module-level logger is created
from app.logging_config import configure_logging
configure_logging()
```

That edit is owned by [`03_APP_PY_MIGRATION.md`](./03_APP_PY_MIGRATION.md).

## 7. Tests (placeholder — full suite in Doc 09)

Create `tests/python/test_logging_config.py` covering:

| Test | Asserts |
|---|---|
| `test_configure_logging_idempotent` | Calling `configure_logging()` twice does not duplicate handlers. |
| `test_log_level_env_var` | `CBQA_LOG_LEVEL=DEBUG` results in `logging.getLogger().level == DEBUG`. |
| `test_file_disabled_when_off` | `CBQA_LOG_FILE=off` → no `FileHandler` attached. |
| `test_rotation_by_size` | Writing N records past `max_bytes` triggers rollover; rotated file exists, active file is empty-ish. |
| `test_rotation_age_pruning` | Touch a fake rotated file with `mtime` past `max_age_days` → next rollover deletes it. |
| `test_rotation_total_budget` | Create 5 rotated files of 30 MB each with `total_mb_cap=100` → next rollover keeps only the newest 3. |
| `test_json_formatter` | `CBQA_LOG_JSON=1` → each line parses as valid JSON with `ts`, `level`, `logger`, `msg`. |
| `test_third_party_quieted` | `urllib3` logger level is `WARNING` regardless of root level. |

## 8. Acceptance checklist

- [x] `app/logging_config.py` exists and exports the three names.
- [x] `from logging_config import configure_logging, mask_api_key` works from app modules (sys.path pattern).
- [x] `python -c "from logging_config import configure_logging; configure_logging()"` does not raise.
- [x] `pytest tests/python/test_logging_config.py -v` passes (17/17).
- [x] `app/Dockerfile` has `ENV CBQA_LOG_FILE=/app/logs/cbqa.log` and the `mkdir`.
- [x] Root `.gitignore` includes `logs/`.
- [x] No module under `/app/` calls `logging.basicConfig` (grep check — none found).

---

## 9. Post-implementation review (2026-05-10)

The first implementation shipped a `mask_api_key()` whose algorithm
(`s.rsplit("-", 1)[0].rsplit("-", 1)[0]`) collapsed `sk-proj-…` and
`sk-ant-…` keys down to just `sk-…`, stripping the very provider
prefix the user had asked us to keep. Five `mask_api_key` tests failed
on the first run.

**Fix applied:** the function now uses an explicit `_KNOWN_PREFIXES`
tuple of multi-segment provider prefixes (`sk-proj-`, `sk-ant-`,
`xai-`, `csk-`, `key-`, `gsk_`, `AIza`). A leading match wins; only
the prefix is preserved, the rest is collapsed to `......<last4>`.
For unknown keys with `-` in the first 12 chars we fall back to the
generic "first segment + ......<last4>" rule, and for keys without any
dash we keep the first 4 raw chars (`AIza` / `MIST` style).

Test signal after the fix:
```text
pytest tests/python/test_logging_config.py
       tests/python/test_api_key_redaction.py -v
# 33 passed, 0 failed
```

The docstring example in the original module was a literally-redacted
placeholder (`mask_api_key("[REDACTED:sk-secret]") -> 'sk-proj-......9876'`)
that could never have been verified by `doctest`. It has been replaced
with a description of the input shapes (no real secrets in the source
tree).
