# 01 — CBL Data Model

This file freezes the on-disk Couchbase Lite layout so every other doc (`cbl_store.py`, endpoint refactor, migration tool) can refer back to it.

The model is intentionally a near-1:1 mapping of the existing Couchbase Server layout (`cb_tools` bucket, `query.analyzer` collection, etc.) so we can move endpoints one at a time, and so the data migration script (Doc 09) is a straight document copy.

---

## 1. Database

| Property | Value |
|---|---|
| **Database name** | `cb_tools_db` (override: `CBL_DB_NAME`) |
| **Storage directory** | `<user_data_dir>/CouchbaseQueryAnalyzer/data` (override: `CBL_DB_DIR`) |
| **On-disk path** | `.../data/cb_tools_db.cblite2/` |
| **Engine** | Couchbase Lite C 3.2.1 (Community) via Python CFFI bindings |
| **Concurrency model** | **Single writer** — Flask is run as a single process (Docker `gunicorn -w 1`, native apps default). No multi-process write coordination required. |

### Storage directory by platform

`CBL_DB_DIR` defaults are computed via [`platformdirs.user_data_dir("CouchbaseQueryAnalyzer", "Couchbase")`](https://pypi.org/project/platformdirs/):

| Platform | Path |
|---|---|
| Linux / Docker | `/app/data` (override in Dockerfile) |
| macOS | `~/Library/Application Support/CouchbaseQueryAnalyzer/data` |
| Windows | `%LOCALAPPDATA%\Couchbase\CouchbaseQueryAnalyzer\data` |

This keeps the database **outside** the read-only PyInstaller bundle so the user's data survives app upgrades.

---

## 2. Scope

All app data lives in a single scope: **`cb_tools`** (matches the existing bucket name from CB Server, eases mental model).

CBL has a `_default` scope by default; we explicitly create the named scope on first run via the CFFI helper `lib.CBLDatabase_CreateCollection(db, "<name>", "cb_tools", ...)`.

---

## 3. Collections

| Collection | Doc IDs | Replaces (CB Server) |
|---|---|---|
| `config` | `user_config`, `app_config` | `cb_tools._default._default::user_config` |
| `analyzer` | `{requestId}` (UUID from query analyzer save) | `cb_tools.query.analyzer::{requestId}` |
| `preferences` | `{userId}` | `cb_tools._default._default::pref_{userId}` |
| `ai_history` | `{document_id}` (timestamp + sha) | `cb_tools.<cluster_name>.analysis::{doc_id}` |
| `ai_reference` | `payload_reference`, `models_list` | `cb_tools._default._default::payload_reference`, `ai_models_list` |
| `blobs` | `blob:{sha256}` | XATTR-decorated docs in CB Server |

> **Note:** the per-cluster analysis scope from CB Server (`cb_tools.<cluster>.analysis`) collapses into a single `ai_history` collection. The cluster name moves into a `cluster_name` field on each document and is the leading column of an index (see §6).

---

## 4. Document Schemas

All schemas follow PouchPipes' rule:

- **Scalars** (`str`, `int`, `float`, `bool`) → native CBL fields
- **Dicts / lists** → `json.dumps()` into a string field (CBL stores them, but JSON-string keeps schema migration trivial and avoids `Fleece` array parsing in indexes)

### 4.1 `config.user_config`

```json
{
  "type": "user_config",
  "data": "{ ... full user config JSON ... }",
  "updated_at": 1762560000
}
```

`data` is the **same JSON blob** that today lives at `cb_tools._default._default::user_config` (cluster URLs, ai provider keys (encrypted client-side), bucket names from the user's *production* cluster, UI prefs, etc.).

### 4.2 `analyzer.{requestId}`

```json
{
  "type": "analyzer_report",
  "request_id": "f5b1...",
  "saved_at": 1762560000,
  "name": "Slow JOIN on travel-sample",
  "blob_ref": "blob:9e3a...",       // pointer into `blobs` collection
  "size_bytes": 2143008,
  "preview": { "queryCount": 412, "topNode": "..." }
}
```

The bulky JSON (the original `system:completed_requests` dump + analyzer state) lives in the `blobs` collection so the index/list views stay tiny.

### 4.3 `preferences.{userId}`

```json
{
  "type": "preferences",
  "user_id": "default",
  "data": "{ ...prefs JSON... }",
  "updated_at": 1762560000
}
```

### 4.4 `ai_history.{document_id}`

```json
{
  "type": "ai_history",
  "document_id": "20260508T1015Z-7c1f...",
  "cluster_name": "prod-east",
  "provider": "anthropic",
  "model": "claude-3-5-sonnet",
  "request_id_ref": "f5b1...",
  "created_at": 1762560000,
  "tokens_in": 8421,
  "tokens_out": 2103,
  "status": "completed",
  "prompt_blob_ref": "blob:aaaa...",
  "response_blob_ref": "blob:bbbb..."
}
```

### 4.5 `ai_reference.payload_reference` / `ai_reference.models_list`

Two well-known doc IDs. The body is the full JSON (today these load from `payload_reference.json.template` / `ai_models_list.json.template` on first run).

```json
{
  "type": "payload_reference",
  "version": "1.0",
  "data": "{ ...big JSON template... }",
  "updated_at": 1762560000
}
```

### 4.6 `blobs.blob:{sha256}`

```json
{
  "type": "blob",
  "sha256": "9e3a...",
  "compression": "gzip",
  "content_type": "application/json",
  "original_size": 4_201_117,
  "stored_size": 412_993,
  "created_at": 1762560000,
  "data_b64": "H4sIA..."        // base64-encoded gzipped bytes
}
```

#### Why base64 instead of CBL Blob API?

CBL has a native `Blob` API (separate file inside `.cblite2/`), but the Python CFFI bindings expose it incompletely. Base64 in a string field is portable, deduplicatable (key is `sha256`), and matches what `blob_storage.py` already does logically.

> Files larger than ~16 MB stored this way are noticeably slow on read. See [`04_BLOB_STORAGE_REFACTOR.md`](./04_BLOB_STORAGE_REFACTOR.md) for size limits and the optional CBL-native Blob path.

---

## 5. Manifests vs N1QL

Following PouchPipes:

| Collection | Listing strategy | Why |
|---|---|---|
| `config` | Direct `getDocument("user_config")` | One doc only |
| `analyzer` | **N1QL** with `idx_analyzer_saved_at` | Can grow into thousands |
| `preferences` | Direct `getDocument({userId})` | Per user, K/V access |
| `ai_history` | **N1QL** with `idx_ai_history_cluster_created` | High-volume, paginated |
| `ai_reference` | Direct `getDocument("payload_reference")` | Two well-known docs |
| `blobs` | Direct `getDocument("blob:{sha}")` | Always accessed by ref |

No "manifest doc" pattern is needed for our small collections.

---

## 6. Indexes

Created idempotently at startup via `lib.CBLCollection_CreateValueIndex` (CFFI):

| Collection | Index name | Columns | Purpose |
|---|---|---|---|
| `analyzer` | `idx_analyzer_saved_at` | `type, saved_at DESC` | List recent reports |
| `analyzer` | `idx_analyzer_request_id` | `type, request_id` | Lookup by request id |
| `ai_history` | `idx_ai_history_cluster_created` | `type, cluster_name, created_at DESC` | Per-cluster history listing |
| `ai_history` | `idx_ai_history_doc_id` | `type, document_id` | Status polling endpoint |
| `blobs` | `idx_blobs_sha` | `type, sha256` | Dedup lookup |

Verify at runtime via a debug endpoint that wraps `CBLQuery_Explain()` (good = `SEARCH ... USING INDEX idx_*`, bad = `SCAN`).

---

## 7. Document expiration / TTL

Optional, off by default. If `CBL_AI_HISTORY_TTL_DAYS` is set we set per-doc expiration on `ai_history` writes via `lib.CBLCollection_SetDocumentExpiration` so old AI runs auto-purge.

---

## 8. Backups

Backing up the data is just:

```sh
tar czf cb_tools_db.tar.gz <CBL_DB_DIR>/cb_tools_db.cblite2
```

The Admin UI exposes:

- **Export** — zips the `.cblite2` directory and serves it as a download.
- **Import** — accepts an uploaded zip, replaces the live DB after stopping accepts.

(Implementation is in [`03_APP_PY_REFACTOR.md`](./03_APP_PY_REFACTOR.md) under "New endpoints".)
