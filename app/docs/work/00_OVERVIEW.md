# Couchbase Server → Couchbase Lite Migration — Overview

**Status:** Proposed
**Target version:** **v5.0.0** — MAJOR bump per [`settings/VERSION_CALCULATION_GUIDE.md`](../../../settings/VERSION_CALCULATION_GUIDE.md) (architecture overhaul + changed data formats + removed major feature). See [`12_RELEASE_PROCESS_COMPLIANCE.md §1`](./12_RELEASE_PROCESS_COMPLIANCE.md).
**Release branch:** `release-otacon` (per [`settings/BRANCHING_STRATEGY.md`](../../../settings/BRANCHING_STRATEGY.md))
**Owners:** Backend / Packaging
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

AFTER (v5.0.0):
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

1. **Doc 01 + 02** — Lock data model, build `cbl_store.py` with `USE_CBL` fallback.
2. **Doc 06** — Get CBL working in the Linux Docker image first (easiest).
3. **Doc 03 + 04 + 05** — Migrate endpoints behind a `STORAGE_BACKEND=cbl|server` flag.
4. **Doc 09** — Ship a one-shot migration script (`python -m app.migrate_to_cbl`).
5. **Doc 07 + 08** — Bundle `libcblite` into PyInstaller for Mac and Windows.
6. **Doc 10** — End-to-end tests on all three distributions, then flip default to `cbl`.
7. **Doc 12** — Run [`settings/RELEASE_GUIDE.md`](../../../settings/RELEASE_GUIDE.md) sequence; tag `v5.0.0` from `main`.
8. Remove the `STORAGE_BACKEND=server` path in v5.1.0.
