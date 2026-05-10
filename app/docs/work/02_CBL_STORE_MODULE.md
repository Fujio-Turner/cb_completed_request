# 02 — `cbl_store.py` Module Design

**Status:** ✅ COMPLETE (post-review fixes 2026-05-09 — see end of file)

A single new module inside `/app/` at [`app/cbl_store.py`](../../cbl_store.py) that wraps every CBL operation. Every other change in this plan imports from here.

Pattern is taken directly from PouchPipes' [`cbl_store.py`](https://github.com/Fujio-Turner/PouchPipes/blob/main/docs/CBL_STORE.md) and adapted for the analyzer's data model.

---

## 1. Module-level setup

```python
# app/cbl_store.py
"""
Couchbase Lite CE storage layer for the Query Analyzer.

Replaces the external Couchbase Server cb_tools bucket with an embedded
CBL database. All persistent app data flows through CBLStore.
"""

import os
import json
import time
import base64
import gzip
import hashlib
import threading
from pathlib import Path
from typing import Any, Dict, List, Optional
from icecream import ic
from platformdirs import user_data_dir

# ---- CBL availability ----
try:
    from CouchbaseLite.Database import Database, DatabaseConfiguration
    from CouchbaseLite.Document import MutableDocument
    from CouchbaseLite._PyCBL import ffi, lib
    from CouchbaseLite.common import stringParam, sliceToString
    USE_CBL = True
except ImportError as e:
    USE_CBL = False
    ic(f"⚠️ Couchbase Lite bindings not available: {e}")

# ---- Constants ----
CBL_DB_NAME = os.environ.get(
    "CBL_DB_NAME", "cb_tools_db"
)
CBL_DB_DIR = os.environ.get(
    "CBL_DB_DIR",
    str(Path(user_data_dir("CouchbaseQueryAnalyzer", "Couchbase")) / "data")
)

SCOPE = "cb_tools"

COLL_CONFIG       = "config"
COLL_ANALYZER     = "analyzer"
COLL_PREFERENCES  = "preferences"
COLL_AI_HISTORY   = "ai_history"
COLL_AI_REFERENCE = "ai_reference"
COLL_BLOBS        = "blobs"

ALL_COLLECTIONS = [
    COLL_CONFIG, COLL_ANALYZER, COLL_PREFERENCES,
    COLL_AI_HISTORY, COLL_AI_REFERENCE, COLL_BLOBS,
]

# ---- Singleton ----
_db_lock = threading.Lock()
_db: Optional["Database"] = None
```

---

## 2. Singleton database opener

```python
def get_db() -> "Database":
    """Open (or reuse) the singleton CBL database handle."""
    global _db
    if _db is not None:
        return _db
    with _db_lock:
        if _db is not None:
            return _db
        Path(CBL_DB_DIR).mkdir(parents=True, exist_ok=True)
        cfg = DatabaseConfiguration(directory=CBL_DB_DIR)
        _db = Database(CBL_DB_NAME, cfg)
        _ensure_collections(_db)
        _ensure_indexes(_db)
        ic(f"✅ CBL opened: {CBL_DB_DIR}/{CBL_DB_NAME}.cblite2")
    return _db


def close_db() -> None:
    global _db
    with _db_lock:
        if _db is not None:
            _db.close()
            _db = None
```

---

## 3. Collection / index bootstrap

```python
def _ensure_collections(db: "Database") -> None:
    """Create the cb_tools scope and all collections if missing (CFFI)."""
    err = ffi.new("CBLError*")
    scope_name = stringParam(SCOPE)
    for coll_name in ALL_COLLECTIONS:
        c_name = stringParam(coll_name)
        coll = lib.CBLDatabase_CreateCollection(db._ref, c_name, scope_name, err)
        if coll == ffi.NULL:
            raise RuntimeError(f"failed to create collection {coll_name}")


def _ensure_indexes(db: "Database") -> None:
    """Create all value indexes (idempotent)."""
    indexes = [
        (COLL_ANALYZER,   "idx_analyzer_saved_at",
            ["type", "saved_at"]),
        (COLL_ANALYZER,   "idx_analyzer_request_id",
            ["type", "request_id"]),
        (COLL_AI_HISTORY, "idx_ai_history_cluster_created",
            ["type", "cluster_name", "created_at"]),
        (COLL_AI_HISTORY, "idx_ai_history_doc_id",
            ["type", "document_id"]),
        (COLL_BLOBS,      "idx_blobs_sha",
            ["type", "sha256"]),
    ]
    for coll, name, cols in indexes:
        _create_value_index(db, coll, name, cols)
```

`_create_value_index` is a thin CFFI wrapper around `lib.CBLCollection_CreateValueIndex` that builds the JSON expression list (`[".type", ".saved_at"]`) and calls the C function.

---

## 4. Public API

```python
class CBLStore:
    """High-level API for all CBL storage operations."""

    def __init__(self) -> None:
        self.db = get_db()

    # ── Config ────────────────────────────────────────────────
    def load_user_config(self) -> Dict[str, Any]: ...
    def save_user_config(self, cfg: Dict[str, Any]) -> None: ...

    # ── Analyzer reports ──────────────────────────────────────
    def save_analyzer(self, request_id: str, name: str,
                      analyzer_data: dict) -> None: ...
    def load_analyzer(self, request_id: str) -> Optional[dict]: ...
    def delete_analyzer(self, request_id: str) -> None: ...
    def list_analyzers(self, limit: int = 50,
                       offset: int = 0) -> Dict[str, Any]: ...

    # ── Preferences ───────────────────────────────────────────
    def load_preferences(self, user_id: str) -> Optional[dict]: ...
    def save_preferences(self, user_id: str, prefs: dict) -> None: ...

    # ── AI history ────────────────────────────────────────────
    def add_ai_history(self, document_id: str, cluster_name: str,
                       provider: str, model: str,
                       request_id_ref: str,
                       prompt: dict, response: dict,
                       tokens_in: int, tokens_out: int,
                       status: str = "completed") -> None: ...
    def get_ai_history(self, document_id: str) -> Optional[dict]: ...
    def list_ai_history(self, cluster_name: Optional[str] = None,
                        limit: int = 50, offset: int = 0) -> Dict[str, Any]: ...
    def delete_ai_history(self, document_id: str) -> None: ...

    # ── AI reference (payload_reference, models_list) ─────────
    def get_payload_reference(self) -> Optional[dict]: ...
    def save_payload_reference(self, data: dict) -> None: ...
    def get_models_list(self) -> Optional[dict]: ...
    def save_models_list(self, data: dict) -> None: ...
    def seed_from_template(self, doc_id: str, template_path: str) -> bool: ...

    # ── Blobs ─────────────────────────────────────────────────
    def put_blob(self, data: bytes,
                 content_type: str = "application/octet-stream",
                 compression: str = "gzip") -> str:
        """Store bytes; return blob_ref string ('blob:<sha256>'). Dedup'd."""

    def get_blob(self, blob_ref: str) -> Optional[bytes]: ...
    def delete_blob(self, blob_ref: str) -> None: ...
    def gc_orphan_blobs(self) -> int: ...

    # ── Maintenance ───────────────────────────────────────────
    def compact(self) -> bool: ...        # kCBLMaintenanceTypeCompact
    def reindex(self) -> bool: ...        # kCBLMaintenanceTypeReindex
    def optimize(self) -> bool: ...       # kCBLMaintenanceTypeOptimize
    def integrity_check(self) -> bool: ...

    # ── Diagnostics ───────────────────────────────────────────
    def explain(self, n1ql: str) -> str: ...
    def stats(self) -> Dict[str, Any]:
        """{ 'collections': { 'analyzer': 412, ... }, 'db_size_bytes': ... }"""
```

---

## 5. Internal helpers (CFFI)

```python
def _coll(db, name: str):
    """Get a collection handle (raw CBLCollection*) by name in the cb_tools scope."""

def _coll_get_doc(db, coll_name: str, doc_id: str):
    """Read a doc; return dict|None."""

def _coll_get_mutable_doc(db, coll_name: str, doc_id: str):
    """For upserts."""

def _coll_save_doc(db, coll_name: str, doc) -> None: ...

def _coll_delete_doc(db, coll_name: str, doc_id: str) -> None: ...

def _n1ql(db, sql: str, params: Optional[dict] = None) -> List[dict]: ...
```

All upserts follow the PouchPipes pattern:

```python
def save_user_config(self, cfg: dict) -> None:
    doc = _coll_get_mutable_doc(self.db, COLL_CONFIG, "user_config")
    if not doc:
        doc = MutableDocument("user_config")
    doc["type"] = "user_config"
    doc["data"] = json.dumps(cfg)
    doc["updated_at"] = int(time.time())
    _coll_save_doc(self.db, COLL_CONFIG, doc)
```

---

## 6. Blob storage details

```python
def put_blob(self, data, content_type="application/octet-stream",
             compression="gzip") -> str:
    if compression == "gzip":
        body = gzip.compress(data if isinstance(data, bytes) else data.encode())
    else:
        body = data if isinstance(data, bytes) else data.encode()
    sha = hashlib.sha256(body).hexdigest()
    blob_id = f"blob:{sha}"

    # Dedup
    existing = _coll_get_doc(self.db, COLL_BLOBS, blob_id)
    if existing:
        return blob_id

    doc = MutableDocument(blob_id)
    doc["type"] = "blob"
    doc["sha256"] = sha
    doc["compression"] = compression
    doc["content_type"] = content_type
    doc["original_size"] = len(data)
    doc["stored_size"] = len(body)
    doc["created_at"] = int(time.time())
    doc["data_b64"] = base64.b64encode(body).decode("ascii")
    _coll_save_doc(self.db, COLL_BLOBS, doc)
    return blob_id


def get_blob(self, blob_ref: str) -> Optional[bytes]:
    d = _coll_get_doc(self.db, COLL_BLOBS, blob_ref)
    if not d:
        return None
    raw = base64.b64decode(d["data_b64"])
    if d.get("compression") == "gzip":
        raw = gzip.decompress(raw)
    return raw
```

The 20 MB Couchbase Server K/V limit no longer applies (CBL is local), but we still **warn at >16 MB** because base64 expansion + gzip decompression on read becomes slow.

---

## 7. Fallback flag

```python
STORAGE_BACKEND = os.environ.get("STORAGE_BACKEND", "auto")
# auto -> cbl if USE_CBL else server
# cbl  -> force CBL (raise if bindings missing)
# server -> force the existing external Couchbase Server path
```

`app.py` uses this flag:

```python
def storage_backend() -> str:
    if STORAGE_BACKEND == "cbl":
        if not USE_CBL:
            raise RuntimeError("STORAGE_BACKEND=cbl but CBL bindings missing")
        return "cbl"
    if STORAGE_BACKEND == "server":
        return "server"
    return "cbl" if USE_CBL else "server"
```

This lets us ship v4.0.0-beta with **`auto`** as the default and merge the migration in stages — Doc 03 wraps every CB Server endpoint with an `if storage_backend() == 'cbl': ...`.

---

## 8. Tests

`tests/python/test_cbl_store.py`:

| Test | Asserts |
|---|---|
| `test_open_create_close` | Database directory created, `cb_tools` scope + 6 collections present |
| `test_save_load_user_config` | Round-trip JSON config |
| `test_save_load_analyzer_with_blob` | Big report saved, blob deduped on second call |
| `test_list_analyzers_pagination` | N1QL pagination order/limit |
| `test_blob_dedup` | Same bytes → same `blob:<sha>` ref |
| `test_orphan_gc` | `gc_orphan_blobs` removes blobs with no `blob_ref` references |
| `test_indexes_used` | `EXPLAIN` of list query contains `USING INDEX idx_analyzer_saved_at` |

Run with:

```sh
pytest ../tests/python/test_cbl_store.py -v
```

These tests **only** run when `USE_CBL` is true; otherwise they are skipped via `pytestmark = pytest.mark.skipif(not USE_CBL, reason="CBL bindings missing")`.

---

## 9. Post-review fixes (2026-05-09)

The first pass of [`app/cbl_store.py`](../../cbl_store.py) used CFFI stubs that
returned `{}` / `[]` regardless of the underlying database state and was
missing several public methods that [`app/app.py`](../../app.py) called. The
file has been rewritten with real CFFI implementations:

| Helper | Implementation |
|---|---|
| `_doc_to_dict(doc_ref)` | `decodeFleeceDict(lib.CBLDocument_Properties(doc_ref))` (zero-copy, recursive). Falls back to `lib.CBLDocument_CreateJSON` + `json.loads` on error. |
| `_coll_get_doc` | `lib.CBLCollection_GetDocument` + `_doc_to_dict`; releases the doc ref on exit. |
| `_coll_save_dict` | `MutableDocument(doc_id).setProperties(data); doc._prepareToSave(); lib.CBLCollection_SaveDocumentWithConcurrencyControl(...)`; retries with `LastWriteWins=0` on conflict. |
| `_coll_delete_doc` | `lib.CBLCollection_DeleteDocumentWithConcurrencyControl`. |
| `_n1ql(db, sql, params)` | `Query(db, sql, N1QLLanguage)` + `q.setParameters(dict)` + iterate `q.execute()` and call `row.asDictionary()` per row (safe before next `_Next`). |
| `_get_coll(db, name)` | Caches the raw `CBLCollection*` per scope+collection; creates the collection on first call if missing. |
| `explain(sql)` | `lib.CBLQuery_Explain(q._ref)` → `sliceResultToString`. |

New / fixed public methods on `CBLStore`:

- `query(sql, params)` — generic SQL++ executor used by `/api/couchbase/query`'s CBL branch (currently routed only when explicitly opted-in; the production-cluster path stays the default).
- `save_analysis` / `load_analysis` — aliases for `save_analyzer` / `load_analyzer` so the existing `app.py` call sites keep working.
- `maintenance(operation)` — dispatches `compact` / `reindex` / `optimize` / `integrity_check` / `gc_blobs` by name.
- `export()` — packs the live `.cblite2` directory into a `.tar.gz` under the OS temp dir; returns the path so the Flask handler can stream it.
- `import_from(file_obj)` — accepts a Werkzeug `FileStorage` or any file-like object, validates the tar, closes the live DB, replaces the data dir (with a path-traversal check), and reopens.
- `list_clusters()` — `SELECT DISTINCT cluster_name FROM cb_tools.ai_history` for the `/api/ai/clusters` endpoint.

Backend selector: `storage_backend()` (function, not raw env value) resolves `auto`→`cbl`/`server`. `STORAGE_BACKEND=cbl` raises a clear `RuntimeError` if the bindings are missing instead of silently falling back.
