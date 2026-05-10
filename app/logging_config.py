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
# mask_api_key - see 02_API_KEY_REDACTION.md for the full specification.
# Inlined here so any logger user can `from logging_config import mask_api_key`.
# ---------------------------------------------------------------------------

# Known multi-segment provider prefixes (longest first so the longer
# match wins - e.g. "sk-ant-api03-" before "sk-ant-").
_KNOWN_PREFIXES = (
    "sk-proj-",
    "sk-ant-",
    "xai-",
    "csk-",
    "key-",
    "gsk_",
    "AIza",
)


def mask_api_key(key):
    """
    Redact an API key for safe logging.

    Keeps the provider prefix (so support can identify which provider's
    key it is) and the last 4 characters (fingerprint). Everything in
    between is replaced with ``......``.

    Examples:
        sk-proj-<random>9876   -> sk-proj-......9876
        sk-ant-api03-<random>  -> sk-ant-......<last4>
        xai-<random>3210       -> xai-......3210
        csk-cohere-<random>    -> csk-......<last4>
        AIzaSy_<random>qwert   -> AIza......qwert (no dash before tail)
        None / "" / < 12 chars -> <none> / <none> / <redacted>

    See: app/docs/work/LOGGING_4_0_0/02_API_KEY_REDACTION.md
    """
    if not key:
        return "<none>"
    s = str(key)
    if len(s) < 12:
        return "<redacted>"
    last4 = s[-4:]

    # Multi-segment well-known prefix.
    for prefix in _KNOWN_PREFIXES:
        if s.startswith(prefix):
            sep = prefix[-1] if prefix[-1] in "-_" else ""
            head = prefix.rstrip("-_")
            if sep:
                return f"{head}{sep}......{last4}"
            return f"{head}......{last4}"

    # Generic: keep first segment up to the first dash (provider tag).
    if "-" in s[:12]:
        head = s.split("-", 1)[0][:12]
        return f"{head}-......{last4}"

    # No dash -> keep first 4 raw chars (e.g. "MIST......456J").
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
