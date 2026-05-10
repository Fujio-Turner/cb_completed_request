# Couchbase Server → Couchbase Lite Migration — Overview

**Status:** ✅ COMPLETE (All 12 docs done) — Post-review fixes applied (see §7 below)
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
| Replace all `cb_tools.*` writes/reads with CBL | The user-supplied production cluster connection (read-only N1QL on `system:completed_requests`) |
| New `cbl_store.py` module | Replacing `couchbase` SDK in `app.py` query path |
| Dockerfile rebuild with `libcblite` | Sync Gateway / replication |
| PyInstaller spec changes for Mac & Windows | Vector search (CBL EE feature) |
| One-time data migration tool (CB Server → CBL) | Multi-process write coordination beyond a single Flask worker |

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

AFTER (v4.0.0-beta):
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
╰────────────────┬────────────────────────╯
                 │ N1QL (read-only)
                 ▼
╭───────────────────────────╮
│  User's PRODUCTION        │
│  Couchbase Server         │
╰───────────────────────────╯
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

1. **Doc 01 + 02** — Lock data model, build `app/cbl_store.py` with `USE_CBL` fallback.
2. **Doc 06** — Get CBL working in the Linux Docker image first (easiest); `docker compose up` runs from `/app/`.
3. **Doc 03 + 04 + 05** — Migrate endpoints behind a `STORAGE_BACKEND=cbl|server` flag.
4. **Doc 09** — Ship a one-shot migration script (`python migrate_to_cbl.py` from `/app/`).
5. **Doc 07 + 08** — Bundle `libcblite` into PyInstaller for Mac and Windows; PyInstaller is invoked from `/app/` against `/app/build_mac.spec` and `/app/build_win.spec`.
6. **Doc 10** — End-to-end tests on all three distributions, then flip default to `cbl`.
7. **Doc 12** — Run [`settings/RELEASE_GUIDE.md`](../../../settings/RELEASE_GUIDE.md) sequence; tag `v4.0.0-beta` from `main`.
8. Remove the `STORAGE_BACKEND=server` path in a future release.

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
cluster routes confirmed unchanged.

> **Scope note (2026-05-09):** an earlier draft of this plan staged the CBL
> migration at the **repo root** and even deleted `app/__init__.py` so that
> `gunicorn app:app` would resolve to a root-level `app.py`. That pivot is
> reverted. The shipping code lives in `/app/` exactly as it does in v4.0.0
> today, and `gunicorn app:app` is run **from inside `/app/`** against
> [`app/app.py`](../../app.py).
