# Logging Standard Migration — Overview

**Status:** 🟡 IMPLEMENTED & REVIEWED — code shipped 2026-05-09; defects found in 2026-05-10 review have been fixed (see [`10_ROLLOUT_AND_RISKS.md § 8`](./10_ROLLOUT_AND_RISKS.md)). Pending: Settings → Logging UI panel (Doc 08), Playwright e2e verification, version bump + tag.
**Target version:** **v4.0.0-Beta.2** (Server Edition). Bump per [`settings/VERSION_UPDATE_GUIDE.md`](../../../../settings/VERSION_UPDATE_GUIDE.md) when work begins.
**Owners:** Backend / Frontend
**Working directory:** `/app/` (no changes outside `/app/` and `/tests/python/`).
**Authoritative spec:** [`app/guides/LOGGING.md`](../../../guides/LOGGING.md). This work-set is the *implementation plan* for that spec.
**Reference implementation:** [Fujio-Turner/Apollo `guides/LOGGING.md`](https://github.com/Fujio-Turner/Apollo/blob/main/guides/LOGGING.md) and `apollo/logging_config.py`.

---

## 1. Problem

The Server Edition is hard to debug:

1. **Frontend `?debug=true` is binary and noisy.** Either nothing useful, or
   the DevTools console is firehosed with hundreds of messages on every chart
   redraw, AI poll, or table sort. There is no per-subsystem filter.
2. **Backend `ic(...)` has no severity.** `app/ai_analyzer.py` (117 calls),
   `app/app_base.py` (113), `app/app.py` (19), `app/blob_storage.py` (28),
   `app/cbl_store.py` (12) — **289 `ic()` calls total**, all the same
   "always on" priority. Hot paths (per-poll AI status, per-doc CBL save)
   bury the one error you actually need.
3. **API keys leak into logs in clear text.** Two confirmed leak sites:
   - [`app/ai_analyzer.py:707`](../../../ai_analyzer.py#L707) —
     `ic("📤 Headers", headers)` dumps the full `Authorization: Bearer sk-…`.
   - [`app/app_base.py:1302`](../../../app_base.py#L1302) — truncates with
     `v[:20]` which still leaks the first **20 characters** of every key
     (e.g. `sk-proj-abc1234567890def…` for OpenAI project keys).
   This is unacceptable for any user pasting a log into a GitHub issue or
   our `/api/ai/debug` capture.
4. **Frontend `console.log` calls ship to production.** 255 `console.*`
   calls in `app/assets/js/**.js` that fire regardless of `?debug` state.

## 2. Goal

Adopt the standard documented in [`app/guides/LOGGING.md`](../../../guides/LOGGING.md):

- **One `Logger`** on the frontend (already exists in
  [`app/assets/js/base.js`](../../../assets/js/base.js)) — every JS module
  routes through it. Five levels (`error · warn · info · debug · trace`),
  controlled by `?logLevel=` (with `?debug=true` kept as legacy alias).
- **One `logging.getLogger(__name__)` per Python module**, configured once
  at the Flask entrypoint by a new `app/logging_config.py` ported from
  Apollo. Honours `CBQA_LOG_LEVEL`, `CBQA_LOG_FILE`, `CBQA_LOG_JSON`,
  rotates files with size + age + total-disk caps.
- **Zero credentials in logs.** A single `mask_api_key()` helper that turns
  `sk-proj-abc1234…XYZ9876` into `sk-proj-...9876` and is the **only**
  way headers, configs, or AI payloads get logged. Audit + scanner test
  enforce it.

## 3. Scope

| In scope | Out of scope |
|---|---|
| New `app/logging_config.py` (configure_logging, ManagedRotatingFileHandler, mask_api_key) | Replacing `icecream` entirely — `ic()` stays as a *developer probe* |
| Migrate every shipping `ic(...)` to a `logger.<level>(...)` call | Restructuring the AI analyzer's polling architecture |
| Migrate every shipping `console.<x>(...)` to `Logger.<level>(...)` | Server-side log shipping (Datadog, Splunk) — JSON output is enough |
| New `GET /api/logging/info` endpoint + Settings → Logging UI panel | Per-request log correlation (request-id middleware) — separate work |
| `tests/python/test_logging.py` + `test_api_key_redaction.py` + Playwright console-leak scan | Editing `/en/index.html` (Static Edition is frozen at v3.29.3) |
| OpenAPI updates for the new endpoint per [`API_OPENAPI.md`](../../../guides/API_OPENAPI.md) | |

## 4. Architecture change

```diagram
BEFORE (today):
╭─────────────────────────╮       ╭─────────────────────────╮
│  Backend (Flask)        │       │  Frontend (browser)     │
│                         │       │                         │
│  print(...)             │──┐    │  console.log(...)       │──┐
│  ic("📤 Headers", h)    │  │    │  console.warn(...)      │  │
│  ic(f"saved {doc}")     │  │    │  console.error(...)     │  │
│  logger.warning("...")  │  │    │  Logger.info("...")     │  │
│   (rare, inconsistent)  │  │    │   (newer modules only)  │  │
╰─────────────────────────╯  │    ╰─────────────────────────╯  │
                             ▼                                 ▼
                       stderr (mixed,             DevTools console (firehose,
                       no levels, leaks keys)     no level filter, ships)

AFTER (v4.0.0-beta):
╭─────────────────────────╮       ╭─────────────────────────╮
│  Backend (Flask)        │       │  Frontend (browser)     │
│                         │       │                         │
│  configure_logging()    │       │  Logger (base.js)       │
│   ├─ stderr handler     │       │   reads ?logLevel= once │
│   ├─ rotating file      │       │                         │
│   └─ JSON if shipper    │       │  Every module:          │
│                         │       │   Logger.<lvl>('[tag]', │
│  Per module:            │       │                  ...)   │
│    logger = getLogger(  │       │                         │
│             __name__)   │       │  console.* → forbidden  │
│                         │       │   (lint + test enforces)│
│  ic() = dev probe only  │       │                         │
│  mask_api_key() before  │       │                         │
│   anything sensitive    │       │                         │
╰─────────────────────────╯       ╰─────────────────────────╯
         │                                    │
         ▼                                    ▼
  CBQA_LOG_LEVEL / FILE / JSON      ?logLevel=trace|debug|info|warn|error
  CBQA_LOG_MAX_SIZE_MB / AGE        (DevTools filter "[ai-client]" works)
```

## 5. Deliverables

| # | File | Purpose |
|---|------|---------|
| 01 | [`01_LOGGING_CONFIG_MODULE.md`](./01_LOGGING_CONFIG_MODULE.md) | New `app/logging_config.py` — `configure_logging()`, `ManagedRotatingFileHandler`, env vars |
| 02 | [`02_API_KEY_REDACTION.md`](./02_API_KEY_REDACTION.md) | `mask_api_key()` helper, audit of leak sites, scanner test |
| 03 | [`03_APP_PY_MIGRATION.md`](./03_APP_PY_MIGRATION.md) | Wire `configure_logging()` at entry; migrate 19 `ic()` in `app/app.py` |
| 04 | [`04_APP_BASE_MIGRATION.md`](./04_APP_BASE_MIGRATION.md) | Migrate 113 `ic()` in `app/app_base.py` (largest surface, all AI HTTP plumbing) |
| 05 | [`05_AI_ANALYZER_MIGRATION.md`](./05_AI_ANALYZER_MIGRATION.md) | Migrate 117 `ic()` in `app/ai_analyzer.py` (hottest path, biggest debuggability win) |
| 06 | [`06_CBL_STORE_BLOB_MIGRATION.md`](./06_CBL_STORE_BLOB_MIGRATION.md) | Migrate 12 + 28 `ic()` in `app/cbl_store.py` and `app/blob_storage.py` |
| 07 | [`07_FRONTEND_LOGGER_MIGRATION.md`](./07_FRONTEND_LOGGER_MIGRATION.md) | Replace 255 `console.*` calls with `Logger` calls + subsystem prefixes |
| 08 | [`08_LOGGING_API_AND_UI.md`](./08_LOGGING_API_AND_UI.md) | `GET /api/logging/info` + Settings → Logging panel (read path/size, download active log) |
| 09 | [`09_TESTING.md`](./09_TESTING.md) | `caplog` tests, Playwright console listeners, leak scanner CI gate |
| 10 | [`10_ROLLOUT_AND_RISKS.md`](./10_ROLLOUT_AND_RISKS.md) | Order of operations, version bump, `RELEASE.md` compliance, rollback plan |

## 6. Order of operations (suggested)

1. **Doc 01** lands first — without `app/logging_config.py` and a working
   `mask_api_key()`, every other migration would need to copy-paste them.
2. **Doc 02** lands immediately after, even before any `ic()` migration —
   the API-key leak is a *security* fix, not a refactor. Patch the two
   confirmed leak sites in-place using the new helper, ship a v4.0.0-beta
   point release, then continue.
3. **Doc 03** wires `configure_logging()` into `app/app.py.__main__` and
   converts that file's 19 `ic()` calls.
4. **Docs 04 → 06** can run in parallel between contributors (different
   files, no overlap). Each ships independently.
5. **Doc 07** is the largest pure-mechanical pass and is least risky — can
   run alongside backend work.
6. **Doc 08** lands once the file handler is producing output users want
   to inspect.
7. **Doc 09** runs continuously — every PR in the migration must add at
   least one `caplog` assertion or extend the leak scanner.
8. **Doc 10** governs the version bump, release-notes entries, and the
   `app/guides/RELEASE.md` checklist.

## 7. Non-goals (explicit)

- **Do not delete `icecream`.** It stays in `requirements.txt` as a
  developer probe. Per [`LOGGING.md §6.2`](../../../guides/LOGGING.md):
  *if you'd `git rm` the line before merging the bug fix, leave it as `ic`.*
- **Do not split `Logger` into per-module instances on the frontend.**
  The `[tag]` prefix convention is enough; per-module loggers can come
  later.
- **Do not add a server-side `?logLevel=` query parameter.** Use
  `CBQA_LOG_LEVEL` env var + the future `POST /api/logging/level`
  (out of scope here).
- **Do not introduce a new logging library** (no `loguru`, no `structlog`).
  Stdlib `logging` only — Apollo already proved this is enough.

## 8. Success criteria

- [ ] `grep -nE 'ic\(' app/*.py` matches **only** lines tagged
      `# dev probe` (CI-enforceable comment marker).
- [ ] `grep -rE 'console\.(log|warn|error)' app/assets/js/` matches **zero**
      shipping lines (allow list: `base.js` Logger internals).
- [ ] `tests/python/test_api_key_redaction.py` passes a fixture set
      of 12 known key formats (OpenAI legacy, OpenAI project, Anthropic,
      xAI, Google PaLM, Cohere, Azure, Mistral, custom-prefix) and rejects
      a payload that contains an unredacted prefix anywhere in any record.
- [ ] `pytest tests/python/test_logging.py -v` proves levels, file
      rotation, and JSON output all work.
- [ ] `npm run test:e2e:server:chromium` includes a console-leak spec
      that fails on any `console.error/warn/log` matching `Bearer sk-`,
      `x-api-key`, or `apiKey`.
- [ ] [`app/guides/LOGGING.md`](../../../guides/LOGGING.md) `§ 12 Migration plan`
      checklist all flipped from ⚠️ to ✅.

## 9. Linked guides

- [`app/guides/LOGGING.md`](../../../guides/LOGGING.md) — the spec
- [`app/guides/RELEASE.md`](../../../guides/RELEASE.md) — release checklist
  (this work triggers a version bump per `§ 2.5`)
- [`app/guides/API_OPENAPI.md`](../../../guides/API_OPENAPI.md) — required
  before merging Doc 08
- [`settings/VERSION_UPDATE_GUIDE.md`](../../../../settings/VERSION_UPDATE_GUIDE.md)
- [`AGENT.md`](../../../../AGENT.md) — must update *Current Versions* table
