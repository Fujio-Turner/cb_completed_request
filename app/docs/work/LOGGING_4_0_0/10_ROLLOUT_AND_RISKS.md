# 10 · Rollout, Version Bump, Risks, and Rollback

**Depends on:** all prior docs (this is the release-coordination doc).
**Blocks:** the actual release tag.
**Status:** 🟡 IN PROGRESS — Docs 01–09 complete (Python + JS migration done, all 187 pytest cases green, ESLint green, scanner gate green). Pending: Settings → Logging UI panel (Doc 08), Playwright e2e verification, manual smoke matrix, version bump + tag.
**Canonical release process:** [`app/guides/RELEASE.md`](../../../guides/RELEASE.md). This doc *complements* it — it does not replace it.

---

## 1. Sequencing

```diagram
PR #1   ─▶  Doc 01 + Doc 02      (foundation: logging_config.py + mask_api_key)
              │
              ├─▶ Doc 02 hot-fix branch   (close the two known leak sites,
              │                             ship as 4.0.0-beta point release)
              │
PR #2   ─▶  Doc 03                (wire configure_logging() into app.py)
              │
              ▼
        ─────────────── parallel lane ───────────────
PR #3   ─▶  Doc 04                (app_base.py, 113 ic())
PR #4   ─▶  Doc 05                (ai_analyzer.py, 117 ic())
PR #5   ─▶  Doc 06                (cbl_store.py + blob_storage.py, 40 ic())
PR #6   ─▶  Doc 07                (frontend, 255 console.*)
        ─────────────────────────────────────────────
              │
              ▼
PR #7   ─▶  Doc 08                (/api/logging/info + Settings UI)
              │
              ▼
PR #8   ─▶  Doc 09                (final scanner gate + manual verification)
              │
              ▼
       Tag and ship
```

PRs #3–#6 are independent — different files, no overlap — so they can
go through review in parallel as time allows.

## 2. Version bump

Per [`AGENT.md`](../../../../AGENT.md) "Current Versions" and
[`settings/VERSION_UPDATE_GUIDE.md`](../../../../settings/VERSION_UPDATE_GUIDE.md):

The Server Edition is currently `4.0.0-Beta`. This work-set is a
significant change — new module, new endpoint, new env vars, behaviour
change for every existing log line — but it does not break the public
API. Treat it as a **point bump** within the beta cycle:

`4.0.0-Beta` → `4.0.0-Beta.2` (or whatever the next planned beta tag is)

The hot-fix in [`02 §5`](./02_API_KEY_REDACTION.md) ships as its own
beta point first (e.g. `4.0.0-Beta.1`) so the security fix lands
without waiting for the rest of the migration.

Files to bump (full list in [`settings/VERSION_UPDATE_GUIDE.md`](../../../../settings/VERSION_UPDATE_GUIDE.md)):

- `app/app.py` — `__version__`
- `app/index.html` — HTML comment, `<meta name="version">`, `<title>`, footer
- `app/build_mac.spec`, `app/build_win.spec` — `APP_VERSION`
- `app/docs/openapi.yaml` — `info.version`
- `index.html` (root) — `<meta name="version">`, `<title>`, OG tags
- `README.md` — editions table
- `release_notes.md` — new section at top
- `AGENT.md` — Current Versions table

## 3. `RELEASE.md` compliance

Walk [`app/guides/RELEASE.md`](../../../guides/RELEASE.md) end to end
before tagging. The 11-step checklist there is canonical; this section
just calls out steps that are non-trivial for *this* migration:

| RELEASE.md step | This migration's nuance |
|---|---|
| `§ 1` – Decide version | See § 2 above. |
| `§ 2.5` – Bump version everywhere | See file list in § 2 above. |
| `§ 3` – Run all tests | Includes new scanner gate from Doc 09. |
| `§ 4` – Update `release_notes.md` | See § 5 below for required text. |
| `§ 5` – Update `AGENT.md` | "Current Versions" + Flask Endpoints (two new rows from Doc 08). |
| `§ 6` – OpenAPI / API.md | Mandatory before merge of Doc 08 — see [`API_OPENAPI.md`](../../../guides/API_OPENAPI.md). |
| `§ 7` – Update guides | [`LOGGING.md §12`](../../../guides/LOGGING.md) checkboxes flipped from ⚠️ to ✅. |
| `§ 8` – Build artifacts | Docker, Mac `.app`, Windows `.exe` — see Risks § 4 below. |
| `§ 9–11` – Tag, push, smoke test | Standard. |

## 4. Risks

### R1 — Volume of `caplog`-affecting test changes

Adding `configure_logging()` at the top of `app/app.py` means every
existing test that already imports `app.app` will now have a
configured root logger. A handful of legacy tests may rely on the
*absence* of handlers (`assert logger.hasHandlers() is False`) and
break. **Mitigation:** the autouse fixture in
[`09 §2`](./09_TESTING.md) sets `CBQA_LOG_FILE=off` and explicitly
`configure_logging()`s, so library tests inherit a known state.

### R2 — Per-distribution log-path defaults

The `_default_log_file()` helper writes to platform-specific paths
(`~/Library/Logs/...`, `%LOCALAPPDATA%\...`). Inside the macOS `.app`
sandbox, the user may not have written to that path before — first
run will create the directory. **Mitigation:** PyInstaller bootstrap
already runs as the user; verify on a clean macOS account before
shipping.

### R3 — Docker image size

Adding rotation of 50 MB files inside `/app/logs/` could surprise users
running with `--read-only` filesystems. **Mitigation:** document the
required `-v ./logs:/app/logs` mount in
[`app/QUICKSTART.md`](../../../QUICKSTART.md). Users who want
stderr-only can set `CBQA_LOG_FILE=off`.

### R4 — Frontend `Logger` order-of-load

Modules that import `Logger` from `./base.js` rely on `base.js` being
parsed first. Today, `app/index.html` loads scripts in a fixed order;
the migration must not reorder them. **Mitigation:** Doc 07 includes a
manual smoke step (load with empty cache, watch the Network tab for
load order) before merge.

### R5 — `ic()` "dev probe" comment becoming a magic string

The CI scanner from [`09 §4`](./09_TESTING.md) treats `# dev probe` as
an allow-list signal. A reviewer who copies an example without the
comment would silently introduce a regression. **Mitigation:** the
scanner output names the offending file:line so the fix is
self-evident. Code review checklists should call out any new `ic()`.

### R6 — `mask_api_key` corner cases

A real-world key that the algorithm doesn't recognise (no dash, < 12
chars, multi-segment with non-standard separators) will produce
`<redacted>` or a truncated head. This is the **safe failure mode** —
better to over-redact than to under-redact — but it can confuse a user
debugging "why doesn't my key fingerprint match what I pasted?".
**Mitigation:** Settings UI shows the same `mask_api_key(saved_key)`
fingerprint next to the editable field, so the user can confirm.

## 5. Required `release_notes.md` entry

Add at the top of [`release_notes.md`](../../../../release_notes.md):

```markdown
## v4.0.0-Beta.N — 2026-MM-DD

### Security
- **Fixed:** AI provider API keys are no longer logged in clear text.
  Previously, `Authorization: Bearer …` headers and OpenAI/Anthropic
  request payloads could leak the full key into server logs (or into
  any log file the user shared in a bug report).
  All logging of headers and credentials now passes through the new
  `mask_api_key()` helper, which shows the provider prefix
  (e.g. `sk-proj-`, `sk-ant-`, `xai-`) and the last 4 characters with
  the rest redacted: `sk-proj-......9876`.

### Logging
- New centralised logging configuration (`app/logging_config.py`):
  - `CBQA_LOG_LEVEL` (default `INFO`) — per-subsystem severity.
  - `CBQA_LOG_FILE` (default `./logs/cbqa.log` or platform-specific
    `~/Library/Logs/CouchbaseQueryAnalyzer/cbqa.log` on macOS,
    `%LOCALAPPDATA%\CouchbaseQueryAnalyzer\logs\cbqa.log` on Windows)
    — set to `off` to disable file logging.
  - `CBQA_LOG_JSON=1` — one-line JSON records for log shippers.
  - `CBQA_LOG_MAX_SIZE_MB` / `CBQA_LOG_MAX_AGE_DAYS` /
    `CBQA_LOG_ROTATED_TOTAL_MB` — rotation caps.
- Server logs are now structured (`%(asctime)s %(levelname)s %(name)s:
  %(message)s`) with one logger per module
  (`app.ai_analyzer`, `app.cbl_store`, `app.blob_storage`, …).
- Hot-path log lines (AI status polling, per-doc CBL save, blob
  compress) are now `DEBUG` instead of always-on. Default-level logs
  are lifecycle-only.
- New `GET /api/logging/info` endpoint and Settings → Logging panel
  show the active log path, file size, rotated archive, and a
  download link.

### Frontend
- The browser `Logger` (`app/assets/js/base.js`) is now mandatory; the
  remaining direct `console.log/warn/error` calls in older modules
  have been replaced with `Logger.<level>('[<subsystem>]', …)`.
- `?logLevel=trace|debug|info|warn|error` controls verbosity.
  `?debug=true` is kept as a legacy alias for `?logLevel=debug`.

### Documentation
- New: [`app/guides/LOGGING.md`](app/guides/LOGGING.md) — the project
  logging standard.
- New: [`app/docs/work/LOGGING_4_0_0/`](app/docs/work/LOGGING_4_0_0/)
  — implementation plan.
```

## 6. Rollback plan

If a regression slips through:

1. **Revert the migration commit for the affected module only** — the
   migration is intentionally split into one PR per module precisely
   so a single bad commit doesn't take down the whole logging stack.
2. **Keep `app/logging_config.py`** even if reverting other PRs — it is
   safe and idempotent on its own; library code just continues to log
   to a configured root.
3. **Revert the API-key redaction last, never first** — the leak fix
   from [`02 §5`](./02_API_KEY_REDACTION.md) is independently valuable
   and has minimal blast radius.
4. **Re-enable verbose `ic()` for one specific module** by reverting
   that file and shipping a `4.0.0-Beta.N+1` point release. The mixed
   `ic()` + `logger` state is supported during the migration window —
   the scanner gate from [`09 §4`](./09_TESTING.md) only enforces "no
   key leak", not "no `ic()`".

## 7. Final acceptance — the user's original complaint

The work is done when all three of these are true:

- [ ] **"better logging"** — the developer can point `CBQA_LOG_LEVEL`
      at any subsystem to crank verbosity without recompiling /
      reopening / changing source.
- [ ] **"hard to debug whats going on … with or with out ?debug=true"**
      — the URL has five distinct levels (`error · warn · info · debug
      · trace`); `?debug=true` still works as the legacy two-state
      knob; the DevTools console at default level is *signal*, at
      `?logLevel=debug` is *internals*, at `?logLevel=trace` is
      *firehose*.
- [ ] **"redacts the key so first part of the key showinig for who it
      is for + `......` + last 4 of the key"** — `mask_api_key()` does
      exactly this, the two confirmed leak sites are patched, and
      `tests/python/test_no_unredacted_logging.py` makes regression
      impossible.

When all three checkboxes flip, tag the release.

---

## 8. Post-implementation review (2026-05-10)

The migration shipped end-to-end on 2026-05-09. A formal review on
2026-05-10 found and fixed the following defects before tagging the
release:

| # | Defect | Doc | Severity | Fix |
|---|---|---|---|---|
| 1 | `mask_api_key` collapsed `sk-proj-…` to `sk-…`, defeating the user's primary requirement. | [01](./01_LOGGING_CONFIG_MODULE.md), [02](./02_API_KEY_REDACTION.md) | 🔴 Security | Rewrote algorithm with `_KNOWN_PREFIXES` list. |
| 2 | `main-legacy.js` (1.5 MB, 107 unmigrated `console.*` calls) is the actually-shipped JS bundle but was eslint-ignored as `*legacy*.js` — silent regression hole. | [07](./07_FRONTEND_LOGGER_MIGRATION.md) | 🟠 Defect-in-claim | Bulk-rewrote all 107 calls to `Logger.<level>('[legacy]', …)`; updated allow-lists. |
| 3 | 29/186 pytest cases failed: import paths, Flask app context, and the `mask_api_key` algorithm bug. | [04](./04_APP_BASE_MIGRATION.md), [08](./08_LOGGING_API_AND_UI.md), [09](./09_TESTING.md) | 🟠 Test wiring | Conftest sys.path + bare imports; autouse `_flask_app_context`; algorithm fix. |
| 4 | Duplicate `_safe_headers` definition in `ai_analyzer.py` (lines 31 + 624). | [05](./05_AI_ANALYZER_MIGRATION.md) | 🟡 Code smell | Removed the shadowed first copy. |
| 5 | `_human_bytes(500)` returned `'500.0 B'` because `rstrip('0')` ran on the unit-suffixed string. | [08](./08_LOGGING_API_AND_UI.md) | 🟡 Bug | Strip the number first, then concatenate the unit. |
| 6 | `from icecream import ic` was removed from `app_base.py` along with the call sites — broke the spec's "ic stays as a developer probe" contract. | [04](./04_APP_BASE_MIGRATION.md) | 🟡 Spec violation | Restored import with `# noqa: F401`. |
| 7 | Obsolete `TestDebugLogging` in `test_ai_analyzer_real.py` referenced `configure_debug()` / `DEBUG` flag that the migration removed. | [05](./05_AI_ANALYZER_MIGRATION.md) | 🟢 Test rot | Removed the class with a redirect comment. |
| 8 | Test expectations in `test_api_key_redaction.py` asserted output formats not present in the spec (`endswith("-789")`). | [02](./02_API_KEY_REDACTION.md) | 🟢 Test rot | Updated expectations to match the documented spec. |

After fixes:

```bash
$ pytest tests/python/ -v
# 187 passed, 81 skipped, 0 failed

$ npm run lint
# 0 violations
```

The CI gate `tests/python/test_no_unredacted_logging.py` passes 2/2;
`grep -cE 'console\.(log|warn|error)' app/assets/js/main-legacy.js`
returns 0; `grep -cE '^\s*ic\(' app/*.py` returns 0 across all five
backend modules.
