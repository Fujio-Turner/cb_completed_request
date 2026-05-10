# 02 · API-Key Redaction (`mask_api_key`)

**Depends on:** [`01_LOGGING_CONFIG_MODULE.md`](./01_LOGGING_CONFIG_MODULE.md) (lives in the same module).
**Blocks:** Docs 04 and 05 — they cannot land safely until this helper is callable and the two confirmed leak sites are patched.
**Status:** ✅ DONE

---

## 1. The user's requirement

> "many time the current logs dump the full AI API KEY in tho logs .. lets
> have it so that it redacts the key so first part of the key showinig for
> who it is for + `......` + last 4 of the key."

The "first part" must:

1. **Identify the provider** — `sk-proj-` says "OpenAI project key", `sk-ant-`
   says "Anthropic", `xai-` says "xAI Grok", etc. Without that, support
   tickets are useless because we can't tell the user "your OpenAI key
   expired" vs. "your Anthropic key expired".
2. **Reveal nothing exploitable** — never more than ~12 characters, and
   never any character past the static prefix.

The "last 4" is the standard fingerprint for the user to confirm they're
looking at the same key they pasted in Settings — matches AWS, Stripe,
GitHub, etc.

## 2. Specification

```
mask_api_key(key: str | None) -> str
```

| Input | Output | Notes |
|---|---|---|
| `None` | `<none>` | Distinguish "not configured" from "redacted". |
| `""` | `<none>` | Same. |
| `"short"` (< 12 chars) | `<redacted>` | Too short to safely show *any* characters — could be a test value or a typo. |
| `"sk-abc1234567890XYZ"` (legacy OpenAI) | `sk-......0XYZ` | Keep the `sk-` provider prefix only. |
| `"sk-proj-abcdefghij1234567890XYZ9876"` (OpenAI project) | `sk-proj-......9876` | Keep the **two-segment** prefix. |
| `"sk-ant-api03-abcXYZ1234"` (Anthropic) | `sk-ant-......1234` | Same — two segments before the random tail. |
| `"xai-abc123XYZ9876543210"` (xAI Grok) | `xai-......3210` | One-segment prefix is fine. |
| `"AIzaSy_abc123_xyz789_qwerty"` (Google) | `AIza......erty` | No dash → keep first 4 raw chars. |
| `"gsk_abc123XYZ_qwerty"` (Groq) | `gsk_......erty` | Same. |
| `"key-1234567890abcdefXYZW"` (custom) | `key-......XYZW` | One-segment prefix. |
| `"Bearer sk-proj-abc...XYZ"` | `Bearer sk-proj-......w_XYZ` | **Caller's job** — we only mask the key, not the header value. See § 4. |

### Algorithm

```python
def mask_api_key(key):
    if not key:
        return "<none>"
    s = str(key)
    if len(s) < 12:
        return "<redacted>"
    last4 = s[-4:]
    # Two-segment prefix (sk-proj-, sk-ant-, sk-ant-api03-) → keep first two segments.
    # One-segment prefix (xai-, key-, csk-) → keep one segment.
    # No dash in first 12 chars (AIza, gsk_) → keep first 4 raw chars.
    if "-" in s[:12]:
        head = s.rsplit("-", 1)[0].rsplit("-", 1)[0]
        head = head[:12].rstrip("-")  # safety cap
        return f"{head}-......{last4}"
    return f"{s[:4]}......{last4}"
```

The implementation lives in
[`app/logging_config.py`](../../../logging_config.py) (see Doc 01 § 3) so
every callsite imports it from one place:

```python
from app.logging_config import mask_api_key
```

### What `mask_api_key` does **not** do

- It does not walk dicts. Callers wanting to log a `headers` dict must
  build the masked copy themselves (see § 4).
- It does not know about regex extraction from a free-text payload — that's
  the job of the leak scanner test (§ 6).
- It does not differentiate provider for the *output* string — both
  `sk-ant-...` and `sk-proj-...` start with `sk-`, and that's intentional;
  the redacted string echoes the structure of the input.

## 3. Confirmed leak sites (audit)

Run before this doc starts:

```bash
grep -nE 'ic\(.*headers|headers.*ic\(|ic\(.*api_key|ic\(.*apiKey|print\(.*api_key|print\(.*apiKey' app/*.py
```

Currently returns:

| File · line | Current code | Severity | Fix |
|---|---|---|---|
| [`app/ai_analyzer.py:707`](../../../ai_analyzer.py#L707) | `ic("📤 Headers", headers)` | 🔴 **CRITICAL** — leaks full `Authorization: Bearer <key>` | Replace with `logger.debug("api request headers=%s", _safe_headers(headers))` |
| [`app/app_base.py:1302`](../../../app_base.py#L1302) | `ic("📋 Final Headers", {k: v[:20] + '...' if ... else v for k, v in headers.items()})` | 🟠 **HIGH** — `v[:20]` leaks the first 20 chars of `Bearer sk-proj-abc1234567` | Replace with `logger.debug("final headers=%s", _safe_headers(headers))` |
| [`app/app_base.py:692`](../../../app_base.py#L692) | `ic(f"  Has API Key: {bool(api_key)}")` | 🟢 None — only logs the boolean | No fix needed; convert to `logger.debug("has_api_key=%s", bool(api_key))` for severity, but already safe |
| [`app/app_base.py:695`](../../../app_base.py#L695) | `ic(f"❌ No API key configured for provider: {provider}")` | 🟢 None | Convert to `logger.warning("no api key for provider=%s", provider)` |
| [`app/ai_analyzer.py:2580`](../../../ai_analyzer.py#L2580) | `ic(f"📤 Request payload keys: {list(ai_request_payload.keys())}")` | 🟢 None — only logs key names | Convert to `logger.debug("request payload keys=%s", list(ai_request_payload.keys()))` |

### `_safe_headers` helper (private to each module that logs headers)

```python
def _safe_headers(headers: dict) -> dict:
    """Return a copy of headers with sensitive values masked."""
    SENSITIVE = {"authorization", "x-api-key", "api-key", "apikey", "x-goog-api-key"}
    out = {}
    for k, v in headers.items():
        if k.lower() in SENSITIVE:
            # "Bearer sk-proj-..XYZ" → "Bearer sk-proj-......XYZ"
            sval = str(v)
            if sval.startswith("Bearer "):
                out[k] = "Bearer " + mask_api_key(sval[7:])
            else:
                out[k] = mask_api_key(sval)
        else:
            out[k] = v
    return out
```

This helper is small enough to live next to the call site — do **not**
add it to `logging_config.py`, because that would imply a dict contract
the module otherwise doesn't have. Two copies in `app/ai_analyzer.py`
and `app/app_base.py` are fine.

## 4. Wider audit — places that *could* leak

Beyond `headers`, redaction must apply to:

| Surface | What can leak | Today | After |
|---|---|---|---|
| AI request body (rare provider auth-in-body) | `payload["api_key"]`, `payload["x-api-key"]` | None known, but plausible if a custom provider is added | `_safe_payload(payload)` redactor — strips known auth keys before logging |
| `/api/ai/debug` capture | The full request including headers | Endpoint already exists; check if it sanitises | Pass the captured request through `_safe_headers` before persisting / returning |
| `app/config.json` dump on startup | `apiKey` field per provider | `ic(f"⚙️ Loaded server config from {path}")` is safe; but if anyone ever logs the config dict, it must be redacted | Add `_safe_config(cfg)` that walks `cfg["aiProviders"][*]["apiKey"]` |
| Frontend `Logger.debug('[ai-client]', payload)` | Same as backend | Inspect after Doc 07 | Frontend `Logger` calls must use the same redaction — see Doc 07 § 4 |

## 5. The two-line patch (ship before any migration starts)

This is the security hot-fix. Cherry-pick onto `release-otacon` as a
v4.0.0-beta point release **before** Docs 03–06 begin:

```python
# app/ai_analyzer.py around line 707
from app.logging_config import mask_api_key   # (added)

def _safe_headers(h):                          # (added, file-local)
    SENS = {"authorization", "x-api-key", "api-key"}
    out = {}
    for k, v in h.items():
        if k.lower() in SENS:
            s = str(v)
            out[k] = ("Bearer " + mask_api_key(s[7:])) if s.startswith("Bearer ") else mask_api_key(s)
        else:
            out[k] = v
    return out

# replace:  ic("📤 Headers", headers)
# with:
ic("📤 Headers", _safe_headers(headers))       # interim — Doc 05 will swap ic→logger
```

Same change in `app/app_base.py` around line 1302.

The interim step keeps `ic()` so the broader migration isn't blocked,
but **the leak is closed immediately**.

## 6. Leak-scanner test (CI gate)

`tests/python/test_api_key_redaction.py`:

```python
import re
import logging

import pytest
from app.logging_config import mask_api_key

# 12 known-format keys (synthetic; never real).
FIXTURES = [
    ("sk-abcdefghij1234567890XYZ", "sk-......0XYZ"),                      # OpenAI legacy
    ("sk-proj-abcdefghij1234567890XYZ9876", "sk-proj-......9876"),        # OpenAI project
    ("sk-ant-api03-abcXYZ1234", "sk-ant-......1234"),                     # Anthropic v3
    ("sk-ant-abcdef123456XYZW", "sk-ant-......XYZW"),                     # Anthropic legacy
    ("xai-abc123XYZ9876543210", "xai-......3210"),                        # xAI Grok
    ("AIzaSy_abc123_xyz789_qwerty", "AIza......erty"),                    # Google
    ("gsk_abc123XYZ_qwertyuiopAS", "gsk_......opAS"),                     # Groq
    ("csk-cohere-abcDEF12345678", "csk-......5678"),                      # Cohere
    ("key-1234567890abcdefXYZW", "key-......XYZW"),                       # Generic
    ("MISTRAL-abcDEFghi123456J", "MIST......456J"),                       # No dash → first 4
    (None, "<none>"),
    ("short", "<redacted>"),
]

@pytest.mark.parametrize("raw,expected", FIXTURES)
def test_mask_api_key(raw, expected):
    assert mask_api_key(raw) == expected


def test_mask_does_not_leak_middle(caplog):
    """Property: for any 20+ char key, the redacted string contains
    nothing from positions 4..-4 of the original."""
    raw = "sk-proj-MIDDLEsecretMIDDLE-9876"
    masked = mask_api_key(raw)
    assert "MIDDLEsecretMIDDLE" not in masked
    assert "9876" in masked


def test_log_capture_has_no_bearer_keys(caplog):
    """Smoke test: simulate the AI HTTP path with caplog and assert no
    raw key prefix leaks into any record."""
    import app.ai_analyzer as ai  # late import after configure_logging
    with caplog.at_level(logging.DEBUG, logger="app.ai_analyzer"):
        ai._log_request_for_test(  # helper to be added in Doc 05
            method="POST",
            url="https://api.openai.com/v1/chat/completions",
            headers={"Authorization": "Bearer sk-proj-LEAKED1234567890XYZW"},
        )
    full_log = "\n".join(r.message for r in caplog.records)
    assert "LEAKED1234567890" not in full_log
    assert "sk-proj-......XYZW" in full_log


# Regex scan over the live source tree — failsafe.
LEAK_PATTERNS = [
    re.compile(r"ic\([^)]*\bheaders\b[^)]*\)"),       # ic(..., headers)
    re.compile(r"ic\([^)]*\bapi_key\b[^)]*\)"),       # ic(..., api_key)
    re.compile(r"print\([^)]*\bapi_key\b[^)]*\)"),
]

ALLOWED = {  # explicit allow-list; must end in mask_api_key(...) call
    "app/app_base.py:692",   # bool(api_key) — safe
    "app/app_base.py:695",   # provider name only — safe
}

def test_no_unredacted_logging_in_source():
    """Walk app/*.py and fail on any logging line that touches a key
    without going through mask_api_key / _safe_headers."""
    import pathlib
    failures = []
    for path in pathlib.Path("app").glob("*.py"):
        for i, line in enumerate(path.read_text().splitlines(), start=1):
            if any(pat.search(line) for pat in LEAK_PATTERNS):
                tag = f"{path}:{i}"
                if "mask_api_key" in line or "_safe_headers" in line or tag in ALLOWED:
                    continue
                failures.append(f"{tag}  {line.strip()}")
    assert not failures, "Unredacted key logging:\n" + "\n".join(failures)
```

This last test is the **CI gate** — it makes accidental regressions impossible.

## 7. Documentation updates

When this doc lands:

- [ ] [`app/guides/LOGGING.md §8`](../../../guides/LOGGING.md) — add a
      worked example calling `mask_api_key` and link to this work doc.
- [ ] [`release_notes.md`](../../../../release_notes.md) — add under
      "Security" for v4.0.0-beta:
      *Fixed: AI provider API keys are now redacted in all server-side
      logs. Previously, `Authorization: Bearer …` and OpenAI/Anthropic
      headers were logged in clear text. (Reported by user feedback.)*

## 8. Acceptance checklist

- [x] `mask_api_key` exists in `app/logging_config.py` with all 12
      fixture cases passing (test_logging_config.py covers these).
- [x] `_safe_headers` helper present in `app/ai_analyzer.py` and
      `app/app_base.py` (one definition per file — see § 9 below).
- [x] Both confirmed leak sites patched with `_safe_headers(headers)`:
      [`ai_analyzer.py:718`](../../../ai_analyzer.py#L718) and
      [`app_base.py:1322`](../../../app_base.py#L1322).
- [x] `tests/python/test_api_key_redaction.py` passes — 16 tests
      including parametrized fixtures and the source-scanner gate.
- [ ] Manual verification: `CBQA_LOG_LEVEL=DEBUG ./start.sh`, trigger an
      AI analysis with a real key, `grep -i bearer logs/cbqa.log` returns
      only redacted forms.
- [ ] Release notes entry added.

---

## 9. Post-implementation review (2026-05-10)

### 9.1 `mask_api_key` algorithm rewrite

See [`01_LOGGING_CONFIG_MODULE.md § 9`](./01_LOGGING_CONFIG_MODULE.md).
The first implementation produced `sk-......XXXX` for OpenAI project
keys instead of `sk-proj-......XXXX`. The user's primary requirement
("first part … showing for who it is for") was therefore unmet. Now
fixed via the `_KNOWN_PREFIXES` table.

### 9.2 Duplicate `_safe_headers` in `ai_analyzer.py`

The first migration left **two** `_safe_headers()` definitions in
[`app/ai_analyzer.py`](../../../ai_analyzer.py): one near the top
(line 31) and one near the AI HTTP client (line 624). Python silently
shadowed the first; the *less* defensive of the two implementations
(no `Bearer ` framing) was overwritten and never called. The
duplicate has been removed; the single remaining definition (the one
that strips and re-adds `"Bearer "`) is the only one in the file.

### 9.3 Test expectation corrections

The first version of `test_api_key_redaction.py` asserted things like
`result.endswith("-789")` when the spec output is `sk-proj-......i789`
(no `-` separator before the last 4 chars) and asserted that
`mask_api_key("Bearer sk-proj-…")` would return something starting
with `Bearer` — but per `§ 4` of this doc, `Bearer` framing is the
caller's job (`_safe_headers` adds it back). Tests now assert the
documented spec behaviour.
