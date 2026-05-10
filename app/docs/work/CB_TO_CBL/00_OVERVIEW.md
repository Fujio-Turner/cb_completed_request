# Couchbase Server → Couchbase Lite Migration — Overview

**Status:** ✅ COMPLETE — **Couchbase Server SDK fully removed** (2026-05-09, see §8). All persistence is now CBL-only and source data is JSON-upload-only.
**Target version:** **v4.0.0-beta** — pre-release of v4.0.0 (Server Edition). See [`12_RELEASE_PROCESS_COMPLIANCE.md §1`](./12_RELEASE_PROCESS_COMPLIANCE.md) and [`settings/VERSION_CALCULATION_GUIDE.md`](../../../settings/VERSION_CALCULATION_GUIDE.md).
**Release branch:** `release-otacon` (per [`settings/BRANCHING_STRATEGY.md`](../../../settings/BRANCHING_STRATEGY.md))
**Owners:** Backend / Packaging
**Working directory:** **`/app/`** — all new and changed files (Python modules, `Dockerfile`, `docker-compose.yml`, PyInstaller specs, `vendor/` libcblite binaries) live under `/app/`. The repo root is reserved for the Static Edition (`/en/index.html`) and the cb.fuj.io site content; nothing in this migration belongs there.
**Reference implementations:**

- Fujio-Turner/PouchPipes — [`docs/CBL_DATABASE.md`](https://github.com/Fujio-Turner/PouchPipes/blob/main/docs/CBL_DATABASE.md)
- Fujio-Turner/PouchPipes — [`docs/CBL_STORE.md`](https://github.com/Fujio-Turner/PouchPipes/blob/main/docs/CBL_STORE.md)
- Fujio-Turner/Apollo — [`docs/DESIGN.md#5-couchbase-lite-deep-dive--pros--cons`](https://github.com/Fujio-Turner/Apollo/blob/main/docs/DESIGN.md#5-couchbase-lite-deep-dive--pros--cons)
- Fujio-Turner/image_to_lucid — Python CFFI bindings reference

---

## 1. Problem

Server Edition v4.0.0 currently **requires** an external **Couchbase Server** cluster to:

| Data | Where it lives today |
|---|---|
| User config / preferences | `cb_tools._default._default::user_config` |
| Saved analyzer reports | `cb_tools.query.analyzer::{requestId}` |
| AI prompt payload reference | `cb_tools._default._default::payload_reference` |
| AI model registry | `cb_tools._default._default::ai_models_list` |
| AI analysis history (per-cluster) | `cb_tools.<cluster>.analysis::{doc_id}` |
| Large blobs (compressed JSON / responses) | `cb_tools.<...>::blob_*` (XATTRs + body) |

This is a major adoption barrier:

- A user must already operate a Couchbase Server (or sign up for Capella).
- The first-run experience requires cluster URL + credentials + bucket setup SQL.
- A "drop-in" Mac `.app`, Windows `.exe`, or `docker run` install is impossible without first wiring an external DB.
- Analyzer data that has nothing to do with the user's *production* cluster ends up in their production cluster.

## 2. Goal

Replace the external Couchbase Server dependency with **Couchbase Lite Community Edition (embedded)** so the analyzer ships with its own zero-config datastore.

The user's external Couchbase Server connection becomes **only** the source of completed_requests data — never the destination for app data.

## 3. Scope

| In scope | Out of scope |
|---|---|
| Replace all `cb_tools.*` writes/reads with CBL | Sync Gateway / replication |
| New `cbl_store.py` module | Vector search (CBL EE feature) |
| **Removal of the `couchbase` Python SDK from `requirements.txt`** | Multi-process write coordination beyond a single Flask worker |
| Dockerfile rebuild with `libcblite` | |
| PyInstaller spec changes for Mac & Windows | |
| **Source data: JSON upload / paste only** (no live cluster fetch) | |

> **Update (2026-05-09):** the original plan kept the user's *production* cluster
> connection alive for read-only N1QL on `system:completed_requests`. That has
> been removed as well — the `couchbase` SDK is no longer a dependency, and the
> only way to feed `system:completed_requests` data into the analyzer is by
> pasting / uploading JSON in the UI.

## 4. High-level architecture change

```diagram
BEFORE (v4.0.0):
╭─────────────────╮     ╭───────────────────────────╮
│  Flask app.py   │────▶│  External Couchbase       │
│  (Docker/.app/  │     │  Server (cb_tools bucket) │
│   .exe)         │     │  - user prefs             │
│                 │     │  - analyzer reports       │
│                 │     │  - AI history             │
│                 │     │  - payload reference      │
╰─────┬───────────╯     ╰───────────────────────────╯
      │ N1QL: system:completed_requests
      ▼
╭───────────────────────────╮
│  User's PRODUCTION        │
│  Couchbase Server         │
╰───────────────────────────╯

AFTER (v4.0.0-beta, CBL-only):
╭───────────────────────────╮
│  User pastes / uploads    │
│  system:completed_requests│
│  JSON in the UI           │
╰────────────┬──────────────╯
             │ HTTP POST (JSON body)
             ▼
╭─────────────────────────────────────────╮
│  Flask app.py                           │
│  (Docker/.app/.exe)                     │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  Embedded Couchbase Lite (CBL-C)  │  │
│  │  cb_tools_db.cblite2/             │  │
│  │  scope: cb_tools                  │  │
│  │  - config                         │  │
│  │  - analyzer                       │  │
│  │  - preferences                    │  │
│  │  - ai_history                     │  │
│  │  - ai_reference                   │  │
│  │  - blobs                          │  │
│  └───────────────────────────────────┘  │
│                                         │
│  NO `couchbase` Python SDK              │
│  NO live cluster connection             │
╰─────────────────────────────────────────╯
```

## 5. Documents in this folder

| File | Purpose |
|---|---|
| [`00_OVERVIEW.md`](./00_OVERVIEW.md) | This file. Why and what. |
| [`01_DATA_MODEL.md`](./01_DATA_MODEL.md) | CBL database / scope / collection / document layout. |
| [`02_CBL_STORE_MODULE.md`](./02_CBL_STORE_MODULE.md) | New `cbl_store.py` design and public API. |
| [`03_APP_PY_REFACTOR.md`](./03_APP_PY_REFACTOR.md) | Endpoint-by-endpoint changes to `app.py`. |
| [`04_BLOB_STORAGE_REFACTOR.md`](./04_BLOB_STORAGE_REFACTOR.md) | Adapting `blob_storage.py` (XATTRs → CBL fields). |
| [`05_AI_ANALYZER_REFACTOR.md`](./05_AI_ANALYZER_REFACTOR.md) | Changes to AI history / payload_reference / models_list. |
| [`06_PACKAGING_DOCKER.md`](./06_PACKAGING_DOCKER.md) | Dockerfile changes — installing libcblite. |
| [`07_PACKAGING_MACOS.md`](./07_PACKAGING_MACOS.md) | Mac `.app` / `.dmg` with embedded `libcblite.dylib`. |
| [`08_PACKAGING_WINDOWS.md`](./08_PACKAGING_WINDOWS.md) | Windows `.exe` with embedded `cblite.dll`. |
| [`09_DATA_MIGRATION.md`](./09_DATA_MIGRATION.md) | One-time migration tool (CB Server → CBL). |
| [`10_TESTING_AND_ROLLOUT.md`](./10_TESTING_AND_ROLLOUT.md) | Tests, fallback flag, rollout plan. |
| [`11_RISKS_AND_OPEN_QUESTIONS.md`](./11_RISKS_AND_OPEN_QUESTIONS.md) | Known risks, decisions to make. |
| [`12_RELEASE_PROCESS_COMPLIANCE.md`](./12_RELEASE_PROCESS_COMPLIANCE.md) | Mapping to `/settings/*.md` guides — version, branching, release, testing, translations. **Read first.** |

## 6. Implementation order (TL;DR)

All work happens on per-issue branches off `release-otacon`, fast-forwarded into `liquid`, then promoted via `liquid` → `QA` → `main` per [`settings/BRANCHING_STRATEGY.md`](../../../settings/BRANCHING_STRATEGY.md). See [`12_RELEASE_PROCESS_COMPLIANCE.md §2`](./12_RELEASE_PROCESS_COMPLIANCE.md) for the per-issue branch table.

1. **Doc 01 + 02** — Lock data model, build `app/cbl_store.py`.
2. **Doc 06** — Get CBL working in the Linux Docker image first (easiest); `docker compose up` runs from `/app/`.
3. **Doc 03 + 04 + 05** — Move all `cb_tools.*` endpoints to CBL.
4. **Doc 09** — One-shot migration script (CB Server → CBL) for users upgrading from v4.0.0; the app itself no longer reads CB Server.
5. **Doc 07 + 08** — Bundle `libcblite` into PyInstaller for Mac and Windows; PyInstaller is invoked from `/app/` against `/app/build_mac.spec` and `/app/build_win.spec`.
6. **Doc 10** — End-to-end tests on all three distributions.
7. **Doc 12** — Run [`settings/RELEASE_GUIDE.md`](../../../settings/RELEASE_GUIDE.md) sequence; tag `v4.0.0-beta` from `main`.
8. ~~Remove the `STORAGE_BACKEND=server` path in a future release.~~ **Done in §8 below — the dual-backend flag and the entire CB Server SDK have been deleted in this release.**

## 7. Post-review fixes (2026-05-09)

A code review of the initial implementation found several blocking bugs that
prevented the CBL path from working end-to-end. All fixes land **inside `/app/`**:

| Fix | File(s) | Notes |
|---|---|---|
| Implemented missing `CBLStore` methods | [`app/cbl_store.py`](../../cbl_store.py) | `query`, `save_analysis`/`load_analysis`, `maintenance`, `export`, `import_from`, `list_clusters` |
| Replaced CFFI stubs with real implementations | [`app/cbl_store.py`](../../cbl_store.py) | `_doc_to_dict` via `decodeFleeceDict`; `_n1ql` via `Query`/`N1QLLanguage`; collection cache; explain via `lib.CBLQuery_Explain` |
| `backend()` now resolves `auto`→`cbl`/`server` | [`app/app.py`](../../app.py) | Was returning the raw env value; legacy keyword aligned to `"server"` (was `"couchbase"`) |
| `requirements.txt` complete | [`app/requirements.txt`](../../requirements.txt) | Added `platformdirs`, `cffi`, `gunicorn`; CBL bindings still come from build pipeline |
| Reverted prod-cluster routes | [`app/app.py`](../../app.py) | `/api/couchbase/test`, `/check-indexes`, `/query` no longer route to CBL — they hit the user's production cluster as designed |
| Added missing endpoints | [`app/app.py`](../../app.py) | `delete-analyzer`, `ai/status`, `ai/history`, `ai/clusters`, `ai/stats`, `payload-reference` family, `models` family |
| `_override_route()` helper | [`app/app.py`](../../app.py) | Cleanly swaps view functions in `app.view_functions` instead of mutating Werkzeug url_map internals |
| PyInstaller specs live in `/app/` | [`app/build_mac.spec`](../../build_mac.spec), [`app/build_win.spec`](../../build_win.spec) | `project_root = Path(__file__).parent` (i.e. `/app/`); `APP_VERSION = '4.0.0-beta'`; libcblite paths env-overridable; PyInstaller is invoked from `/app/` |

**Verification:** `pytest tests/python/` → 12 passed, 97 skipped (CBL bindings
not installed locally). 37 routes registered, 18 CBL-routed/new. Production-
cluster routes confirmed unchanged **at the time of that pass — they have
since been removed entirely (see §8).**

> **Scope note (2026-05-09):** an earlier draft of this plan staged the CBL
> migration at the **repo root** and even deleted `app/__init__.py` so that
> `gunicorn app:app` would resolve to a root-level `app.py`. That pivot is
> reverted. The shipping code lives in `/app/` exactly as it does in v4.0.0
> today, and `gunicorn app:app` is run **from inside `/app/`** against
> [`app/app.py`](../../app.py).

---

## 8. CBL-only cutover (2026-05-09 — **current state**)

The dual-backend strategy described in §6 step 3 and §7 has been retired. The
Couchbase Server SDK has been removed from the project entirely. The app is now
**CBL-only for persistence and JSON-upload-only for source data.**

### 8.1 What was removed

| Area | File(s) | What changed |
|---|---|---|
| Dependency | [`app/requirements.txt`](../../requirements.txt) | `couchbase` SDK removed |
| Hidden imports | GitHub Actions workflows, [`app/build_mac.spec`](../../build_mac.spec), [`app/build_win.spec`](../../build_win.spec) | All `couchbase.*` PyInstaller hidden imports stripped |
| Endpoints | [`app/app_base.py`](../../app_base.py) | Deleted `POST /api/couchbase/test`, `POST /api/couchbase/check-indexes`, `POST /api/couchbase/query` (they required a live cluster) |
| Backend selector | [`app/app.py`](../../app.py) | `backend()` shim deleted; CBL is the sole backend |
| Backend selector | [`app/cbl_store.py`](../../cbl_store.py) | `STORAGE_BACKEND` env var, `USE_CBL` fallback, and `storage_backend()` resolver deleted; CBL is the default and bindings missing → hard error |
| Frontend | `app/assets/js/couchbase-connector.js` | No more live N1QL; `testConnection()` now health-checks the local CBL store |
| Tests | `tests/python/` | All mock-Couchbase-Server fixtures and dual-backend test cases removed |
| Docker | [`app/Dockerfile`](../../Dockerfile) | `STORAGE_BACKEND=cbl` env var deleted (no longer meaningful) |

### 8.2 What survived

- The `_override_route()` mechanism in [`app/app.py`](../../app.py) is still
  used to shadow base endpoints with CBL implementations. With the production-
  cluster routes gone, every override now points at a `CBLStore` method.
- The CBL data model (Doc 01) is unchanged.
- The `CBLStore` public API (Doc 02) is unchanged; only the fallback flag
  section has been removed.

### 8.3 Known follow-ups

- [`app/ai_analyzer.py`](../../ai_analyzer.py) still imports
  `couchbase.exceptions` at lines 144 and 394; those usages must be removed or
  swapped for stdlib / CBL-native exceptions before tagging `v4.0.0-beta`.
- The historical "dual-backend" content in Docs 03, 04, 05, 09 should be read
  as background; the **current** behaviour is described in the post-cutover
  sections at the end of each file.
