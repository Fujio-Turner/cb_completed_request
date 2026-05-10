"""
Couchbase Lite CE storage layer for the Query Analyzer.

Replaces the external Couchbase Server cb_tools bucket with an embedded
CBL database. All persistent app data flows through CBLStore.

Implements the design in app/docs/work/01_DATA_MODEL.md and
app/docs/work/02_CBL_STORE_MODULE.md.
"""

import os
import json
import time
import base64
import gzip
import hashlib
import shutil
import tarfile
import tempfile
import threading
from pathlib import Path
from typing import Any, Dict, List, Optional
from icecream import ic
from platformdirs import user_data_dir

# ---- CBL availability ----
USE_CBL = False
_IMPORT_ERR: Optional[str] = None
try:
    from CouchbaseLite.Database import Database, DatabaseConfiguration
    from CouchbaseLite.Document import MutableDocument, FailOnConflict
    from CouchbaseLite._PyCBL import ffi, lib
    from CouchbaseLite.common import (
        gError, CBLException, stringParam, sliceToString, sliceResultToString
    )
    from CouchbaseLite.Collections import decodeFleeceDict
    from CouchbaseLite.Query import Query, N1QLLanguage
    USE_CBL = True
except ImportError as e:
    _IMPORT_ERR = str(e)
    ic(f"⚠️ Couchbase Lite bindings not available: {e}")

# ---- Constants ----
CBL_DB_NAME = os.environ.get("CBL_DB_NAME", "cb_tools_db")
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

# Soft size warnings for blobs
WARN_BYTES = 16 * 1024 * 1024
HARD_BYTES = 64 * 1024 * 1024

# ---- Singleton + caches ----
_db_lock = threading.Lock()
_db: Optional["Database"] = None
_coll_cache: Dict[str, Any] = {}  # name -> raw CBLCollection*


# ============================================================================
# Backend selection
# ============================================================================

def storage_backend() -> str:
    """
    Return the active storage backend.

    Couchbase Lite is now the only supported backend. This always returns
    'cbl' (and raises if the CBL bindings are missing).
    """
    if not USE_CBL:
        raise RuntimeError(
            f"Couchbase Lite bindings missing: {_IMPORT_ERR}"
        )
    return "cbl"


# ============================================================================
# Database lifecycle
# ============================================================================

def get_db() -> "Database":
    """Open (or reuse) the singleton CBL database handle."""
    global _db
    if _db is not None:
        return _db
    with _db_lock:
        if _db is not None:
            return _db
        if not USE_CBL:
            raise RuntimeError(
                f"get_db() called but CBL bindings not available: {_IMPORT_ERR}"
            )
        Path(CBL_DB_DIR).mkdir(parents=True, exist_ok=True)
        cfg = DatabaseConfiguration(directory=CBL_DB_DIR)
        _db = Database(CBL_DB_NAME, cfg)
        _ensure_collections(_db)
        _ensure_indexes(_db)
        ic(f"✅ CBL opened: {CBL_DB_DIR}/{CBL_DB_NAME}.cblite2")
    return _db


def close_db() -> None:
    """Close the singleton database and clear caches."""
    global _db
    with _db_lock:
        _coll_cache.clear()
        if _db is not None:
            try:
                _db.close()
            except Exception as e:
                ic(f"⚠️ close_db: {e}")
            _db = None


# ============================================================================
# Collection / index bootstrap
# ============================================================================

def _ensure_collections(db: "Database") -> None:
    """Create the cb_tools scope and all collections if missing."""
    for coll_name in ALL_COLLECTIONS:
        _get_coll(db, coll_name)  # creates if missing


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
        try:
            _create_value_index(db, coll, name, cols)
        except Exception as e:
            ic(f"⚠️ Index {name} creation skipped: {e}")


def _create_value_index(db: "Database", coll_name: str, index_name: str,
                        columns: List[str]) -> None:
    """Create a value index using the libcblite C API."""
    coll = _get_coll(db, coll_name)
    if coll == ffi.NULL:
        raise RuntimeError(f"collection {coll_name} not found")

    # Build JSON expression array: [[".col1"], [".col2"], ...]
    expr_list = json.dumps([[f".{col}"] for col in columns])

    # CBLValueIndexConfiguration { kCBLN1QLLanguage(=0)? actually JSON.
    # We use kCBLJSONLanguage (1 in some versions). Most libcblite headers
    # define: kCBLJSONLanguage=0, kCBLN1QLLanguage=1. We use JSON for index expressions.
    config = ffi.new("CBLValueIndexConfiguration*")
    # 0 = JSON, 1 = N1QL — see CBLQueryTypes.h
    config.expressionLanguage = 0
    enc_expr = expr_list.encode("utf-8")
    expr_buf = ffi.new("char[]", enc_expr)
    config.expressions.buf = expr_buf
    config.expressions.size = len(enc_expr)

    enc_name = index_name.encode("utf-8")
    name_buf = ffi.new("char[]", enc_name)
    name_slice = ffi.new("FLString*")
    name_slice.buf = name_buf
    name_slice.size = len(enc_name)

    err = ffi.new("CBLError*")
    ok = lib.CBLCollection_CreateValueIndex(
        coll,
        name_slice[0],
        config[0],
        err,
    )
    if not ok and err.code != 0:
        ic(f"⚠️ Index {index_name} create result: code={err.code}")


# ============================================================================
# Low-level collection / document helpers (CFFI)
# ============================================================================

def _get_coll(db: "Database", coll_name: str):
    """
    Return a cached raw CBLCollection* for cb_tools.<coll_name>.
    Creates the collection if it doesn't exist.
    """
    cached = _coll_cache.get(coll_name)
    if cached is not None:
        return cached

    err = ffi.new("CBLError*")
    coll = lib.CBLDatabase_Collection(
        db._ref, stringParam(coll_name), stringParam(SCOPE), err
    )
    if coll == ffi.NULL:
        # Doesn't exist yet → create
        coll = lib.CBLDatabase_CreateCollection(
            db._ref, stringParam(coll_name), stringParam(SCOPE), err
        )
        if coll == ffi.NULL:
            raise RuntimeError(
                f"Couldn't create collection {SCOPE}.{coll_name} (code={err.code})"
            )

    _coll_cache[coll_name] = coll
    return coll


def _doc_to_dict(doc_ref) -> Dict[str, Any]:
    """Convert a raw CBLDocument* body to a Python dict via Fleece decoder."""
    if not doc_ref or doc_ref == ffi.NULL:
        return {}
    fl_dict = lib.CBLDocument_Properties(doc_ref)
    if not fl_dict or fl_dict == ffi.NULL:
        return {}
    try:
        return decodeFleeceDict(fl_dict)
    except Exception as e:
        ic(f"⚠️ _doc_to_dict failed, falling back to JSON: {e}")
        try:
            json_slice = lib.CBLDocument_CreateJSON(doc_ref)
            json_str = sliceResultToString(json_slice)
            return json.loads(json_str) if json_str else {}
        except Exception as e2:
            ic(f"⚠️ JSON fallback failed: {e2}")
            return {}


def _coll_get_doc(db: "Database", coll_name: str, doc_id: str) -> Optional[Dict[str, Any]]:
    """Read a document; return dict or None."""
    coll = _get_coll(db, coll_name)
    err = ffi.new("CBLError*")
    doc_ref = lib.CBLCollection_GetDocument(coll, stringParam(doc_id), err)
    if doc_ref == ffi.NULL:
        return None
    try:
        return _doc_to_dict(doc_ref)
    finally:
        lib.CBL_Release(doc_ref)


def _coll_save_dict(db: "Database", coll_name: str, doc_id: str, data: Dict[str, Any]) -> None:
    """Upsert a document by id with the given data dict."""
    coll = _get_coll(db, coll_name)
    doc = MutableDocument(doc_id)
    doc.setProperties(data)
    doc._prepareToSave()
    err = ffi.new("CBLError*")
    ok = lib.CBLCollection_SaveDocumentWithConcurrencyControl(
        coll, doc._ref, FailOnConflict, err
    )
    if not ok:
        # Retry once with last-write-wins on conflict
        err2 = ffi.new("CBLError*")
        ok2 = lib.CBLCollection_SaveDocumentWithConcurrencyControl(
            coll, doc._ref, 0, err2  # 0 = LastWriteWins
        )
        if not ok2:
            raise RuntimeError(f"Couldn't save {coll_name}.{doc_id}: code={err2.code}")


def _coll_delete_doc(db: "Database", coll_name: str, doc_id: str) -> bool:
    """Delete a document. Returns True if it existed."""
    coll = _get_coll(db, coll_name)
    err = ffi.new("CBLError*")
    doc_ref = lib.CBLCollection_GetDocument(coll, stringParam(doc_id), err)
    if doc_ref == ffi.NULL:
        return False
    try:
        err2 = ffi.new("CBLError*")
        ok = lib.CBLCollection_DeleteDocumentWithConcurrencyControl(
            coll, doc_ref, 0, err2  # 0 = LastWriteWins
        )
        return bool(ok)
    finally:
        lib.CBL_Release(doc_ref)


def _n1ql(db: "Database", sql: str, params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """Execute a SQL++/N1QL query and return list of result dicts."""
    if not USE_CBL:
        return []
    try:
        q = Query(db, sql, N1QLLanguage)
        if params:
            q.setParameters(params)
        rows: List[Dict[str, Any]] = []
        for row in q.execute():
            rows.append(row.asDictionary())
        return rows
    except Exception as e:
        ic(f"⚠️ _n1ql failed: {e} sql={sql}")
        return []


# ============================================================================
# Public API
# ============================================================================

class CBLStore:
    """High-level API for all CBL storage operations."""

    def __init__(self) -> None:
        if not USE_CBL:
            raise RuntimeError(
                f"CBLStore requires CBL bindings (import error: {_IMPORT_ERR})"
            )
        self.db = get_db()

    # ── Generic / pass-through query (used by /api/couchbase/query CBL branch) ─
    def query(self, sql: str, params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Execute an arbitrary SQL++ query against the embedded DB."""
        return _n1ql(self.db, sql, params)

    # ── Config ────────────────────────────────────────────────
    def load_user_config(self) -> Dict[str, Any]:
        doc = _coll_get_doc(self.db, COLL_CONFIG, "user_config")
        if not doc:
            return {}
        try:
            return json.loads(doc.get("data", "{}"))
        except (json.JSONDecodeError, TypeError):
            return {}

    def save_user_config(self, cfg: Dict[str, Any]) -> None:
        _coll_save_dict(self.db, COLL_CONFIG, "user_config", {
            "type": "user_config",
            "data": json.dumps(cfg),
            "updated_at": int(time.time()),
        })

    # ── Analyzer reports ──────────────────────────────────────
    def save_analyzer(self, request_id: str, name: str,
                      analyzer_data: dict) -> str:
        """Save analyzer report; return request_id."""
        payload = json.dumps(analyzer_data).encode()
        if len(payload) > HARD_BYTES:
            raise RuntimeError(
                f"analyzer payload {len(payload)} bytes exceeds hard limit {HARD_BYTES}"
            )
        if len(payload) > WARN_BYTES:
            ic(f"⚠️ analyzer payload {len(payload)} bytes exceeds warn limit {WARN_BYTES}")

        blob_ref = self.put_blob(payload, content_type="application/json")

        # Tiny preview so list views don't pull the blob
        try:
            queries = analyzer_data.get("queries") or analyzer_data.get("requests") or []
            preview = {"queryCount": len(queries) if isinstance(queries, list) else 0}
        except Exception:
            preview = {}

        _coll_save_dict(self.db, COLL_ANALYZER, request_id, {
            "type": "analyzer_report",
            "request_id": request_id,
            "saved_at": int(time.time()),
            "name": name or "Untitled",
            "blob_ref": blob_ref,
            "size_bytes": len(payload),
            "preview": json.dumps(preview),
        })
        return request_id

    # Aliases used by app.py for backwards-compatible naming
    def save_analysis(self, request_id: str, analysis_data: dict, name: str = "Untitled") -> str:
        return self.save_analyzer(request_id, name, analysis_data)

    def load_analyzer(self, request_id: str) -> Optional[dict]:
        doc = _coll_get_doc(self.db, COLL_ANALYZER, request_id)
        if not doc:
            return None
        blob_ref = doc.get("blob_ref")
        if not blob_ref:
            return None
        blob_data = self.get_blob(blob_ref)
        if not blob_data:
            return None
        try:
            return json.loads(blob_data.decode())
        except (json.JSONDecodeError, UnicodeDecodeError):
            return None

    def load_analysis(self, request_id: str) -> Optional[dict]:
        return self.load_analyzer(request_id)

    def delete_analyzer(self, request_id: str) -> bool:
        return _coll_delete_doc(self.db, COLL_ANALYZER, request_id)

    def list_analyzers(self, limit: int = 50, offset: int = 0) -> Dict[str, Any]:
        sql = (
            f"SELECT meta().id AS id, type, saved_at, name, size_bytes, preview "
            f"FROM {SCOPE}.{COLL_ANALYZER} "
            f"WHERE type = 'analyzer_report' "
            f"ORDER BY saved_at DESC "
            f"LIMIT {int(limit)} OFFSET {int(offset)}"
        )
        rows = _n1ql(self.db, sql)
        return {
            "limit": limit,
            "offset": offset,
            "rows": rows,
            "count": len(rows),
        }

    # ── Preferences ───────────────────────────────────────────
    def load_preferences(self, user_id: str) -> Optional[dict]:
        doc = _coll_get_doc(self.db, COLL_PREFERENCES, user_id)
        if not doc:
            return None
        try:
            return json.loads(doc.get("data", "{}"))
        except (json.JSONDecodeError, TypeError):
            return None

    def save_preferences(self, user_id: str, prefs: dict) -> None:
        _coll_save_dict(self.db, COLL_PREFERENCES, user_id, {
            "type": "preferences",
            "user_id": user_id,
            "data": json.dumps(prefs),
            "updated_at": int(time.time()),
        })

    # ── AI history ────────────────────────────────────────────
    def add_ai_history(self, document_id: str, cluster_name: str,
                       provider: str, model: str,
                       request_id_ref: str,
                       prompt: dict, response: dict,
                       tokens_in: int, tokens_out: int,
                       status: str = "completed") -> None:
        prompt_ref = self.put_blob(json.dumps(prompt).encode(),
                                   content_type="application/json")
        response_ref = self.put_blob(json.dumps(response).encode(),
                                     content_type="application/json")
        _coll_save_dict(self.db, COLL_AI_HISTORY, document_id, {
            "type": "ai_history",
            "document_id": document_id,
            "cluster_name": cluster_name,
            "provider": provider,
            "model": model,
            "request_id_ref": request_id_ref,
            "created_at": int(time.time()),
            "tokens_in": tokens_in,
            "tokens_out": tokens_out,
            "status": status,
            "prompt_blob_ref": prompt_ref,
            "response_blob_ref": response_ref,
        })

    def get_ai_history(self, document_id: str) -> Optional[dict]:
        return _coll_get_doc(self.db, COLL_AI_HISTORY, document_id)

    def list_ai_history(self, cluster_name: Optional[str] = None,
                        limit: int = 50, offset: int = 0) -> Dict[str, Any]:
        if cluster_name:
            sql = (
                f"SELECT meta().id AS id, type, cluster_name, created_at, "
                f"provider, model, status, tokens_in, tokens_out "
                f"FROM {SCOPE}.{COLL_AI_HISTORY} "
                f"WHERE type = 'ai_history' AND cluster_name = $cluster "
                f"ORDER BY created_at DESC "
                f"LIMIT {int(limit)} OFFSET {int(offset)}"
            )
            rows = _n1ql(self.db, sql, {"cluster": cluster_name})
        else:
            sql = (
                f"SELECT meta().id AS id, type, cluster_name, created_at, "
                f"provider, model, status, tokens_in, tokens_out "
                f"FROM {SCOPE}.{COLL_AI_HISTORY} "
                f"WHERE type = 'ai_history' "
                f"ORDER BY created_at DESC "
                f"LIMIT {int(limit)} OFFSET {int(offset)}"
            )
            rows = _n1ql(self.db, sql)
        return {"limit": limit, "offset": offset, "rows": rows, "count": len(rows)}

    def list_clusters(self) -> List[str]:
        """Return distinct cluster_name values from ai_history."""
        sql = (
            f"SELECT DISTINCT cluster_name "
            f"FROM {SCOPE}.{COLL_AI_HISTORY} "
            f"WHERE type = 'ai_history' AND cluster_name IS NOT NULL"
        )
        rows = _n1ql(self.db, sql)
        return [r["cluster_name"] for r in rows if r.get("cluster_name")]

    def delete_ai_history(self, document_id: str) -> bool:
        return _coll_delete_doc(self.db, COLL_AI_HISTORY, document_id)

    # ── AI reference (payload_reference, models_list) ─────────
    def get_payload_reference(self) -> Optional[dict]:
        doc = _coll_get_doc(self.db, COLL_AI_REFERENCE, "payload_reference")
        if not doc:
            return None
        try:
            return json.loads(doc.get("data", "{}"))
        except (json.JSONDecodeError, TypeError):
            return None

    def save_payload_reference(self, data: dict) -> None:
        _coll_save_dict(self.db, COLL_AI_REFERENCE, "payload_reference", {
            "type": "payload_reference",
            "version": "1.0",
            "data": json.dumps(data),
            "updated_at": int(time.time()),
        })

    def get_models_list(self) -> Optional[dict]:
        doc = _coll_get_doc(self.db, COLL_AI_REFERENCE, "models_list")
        if not doc:
            return None
        try:
            return json.loads(doc.get("data", "{}"))
        except (json.JSONDecodeError, TypeError):
            return None

    def save_models_list(self, data: dict) -> None:
        _coll_save_dict(self.db, COLL_AI_REFERENCE, "models_list", {
            "type": "models_list",
            "version": "1.0",
            "data": json.dumps(data),
            "updated_at": int(time.time()),
        })

    def seed_from_template(self, doc_id: str, template_path: str) -> bool:
        """Load template file and seed into ai_reference. Returns True on success."""
        try:
            with open(template_path, "r") as f:
                data = json.load(f)
            if doc_id == "payload_reference":
                self.save_payload_reference(data)
            elif doc_id == "models_list":
                self.save_models_list(data)
            else:
                return False
            return True
        except Exception as e:
            ic(f"⚠️ Failed to seed {doc_id}: {e}")
            return False

    # ── Blobs ─────────────────────────────────────────────────
    def put_blob(self, data: bytes,
                 content_type: str = "application/octet-stream",
                 compression: str = "gzip") -> str:
        """Store bytes; return blob_ref string ('blob:<sha256>'). Dedup'd by sha."""
        if isinstance(data, str):
            data = data.encode("utf-8")
        original_size = len(data)
        if compression == "gzip":
            body = gzip.compress(data, mtime=0)
        else:
            body = data
        sha = hashlib.sha256(body).hexdigest()
        blob_id = f"blob:{sha}"

        existing = _coll_get_doc(self.db, COLL_BLOBS, blob_id)
        if existing:
            return blob_id

        _coll_save_dict(self.db, COLL_BLOBS, blob_id, {
            "type": "blob",
            "sha256": sha,
            "compression": compression,
            "content_type": content_type,
            "original_size": original_size,
            "stored_size": len(body),
            "created_at": int(time.time()),
            "data_b64": base64.b64encode(body).decode("ascii"),
        })
        return blob_id

    def get_blob(self, blob_ref: str) -> Optional[bytes]:
        d = _coll_get_doc(self.db, COLL_BLOBS, blob_ref)
        if not d:
            return None
        try:
            raw = base64.b64decode(d.get("data_b64", ""))
            if d.get("compression") == "gzip":
                raw = gzip.decompress(raw)
            return raw
        except Exception as e:
            ic(f"⚠️ Failed to decompress {blob_ref}: {e}")
            return None

    def delete_blob(self, blob_ref: str) -> bool:
        return _coll_delete_doc(self.db, COLL_BLOBS, blob_ref)

    def gc_orphan_blobs(self) -> int:
        """Walk all collections that hold blob_refs; delete unreferenced blobs."""
        ref_sqls = [
            f"SELECT DISTINCT blob_ref AS ref FROM {SCOPE}.{COLL_ANALYZER} "
            f"WHERE blob_ref IS NOT NULL",
            f"SELECT DISTINCT prompt_blob_ref AS ref FROM {SCOPE}.{COLL_AI_HISTORY} "
            f"WHERE prompt_blob_ref IS NOT NULL",
            f"SELECT DISTINCT response_blob_ref AS ref FROM {SCOPE}.{COLL_AI_HISTORY} "
            f"WHERE response_blob_ref IS NOT NULL",
        ]
        ref_set = set()
        for sql in ref_sqls:
            for r in _n1ql(self.db, sql):
                ref = r.get("ref")
                if ref:
                    ref_set.add(ref)

        all_blobs = _n1ql(
            self.db,
            f"SELECT meta().id AS id FROM {SCOPE}.{COLL_BLOBS} WHERE type = 'blob'"
        )
        deleted = 0
        for b in all_blobs:
            blob_id = b.get("id")
            if blob_id and blob_id not in ref_set:
                if _coll_delete_doc(self.db, COLL_BLOBS, blob_id):
                    deleted += 1
        return deleted

    # ── Maintenance ───────────────────────────────────────────
    def _do_maintenance(self, type_code: int) -> bool:
        if not USE_CBL:
            return False
        err = ffi.new("CBLError*")
        return bool(lib.CBLDatabase_PerformMaintenance(self.db._ref, type_code, err))

    def compact(self) -> bool:
        return self._do_maintenance(0)  # kCBLMaintenanceTypeCompact

    def reindex(self) -> bool:
        return self._do_maintenance(1)  # kCBLMaintenanceTypeReindex

    def optimize(self) -> bool:
        return self._do_maintenance(4)  # kCBLMaintenanceTypeOptimize (libcblite ≥3.1)

    def integrity_check(self) -> bool:
        return self._do_maintenance(2)  # kCBLMaintenanceTypeIntegrityCheck

    def maintenance(self, operation: str) -> Dict[str, Any]:
        """Dispatch a maintenance op by name. Used by /api/storage/maintenance."""
        op = (operation or "").lower()
        ops = {
            "compact": self.compact,
            "reindex": self.reindex,
            "optimize": self.optimize,
            "integrity_check": self.integrity_check,
            "gc_blobs": self.gc_orphan_blobs,
        }
        if op not in ops:
            return {"ok": False, "error": f"unknown operation {operation}"}
        result = ops[op]()
        return {"ok": True, "operation": op, "result": result}

    # ── Backup / restore ──────────────────────────────────────
    def export(self) -> str:
        """
        Pack the entire .cblite2 directory into a tar.gz and return its path.

        Caller (Flask handler) is responsible for streaming the file and
        cleaning it up afterward.
        """
        if not USE_CBL:
            raise RuntimeError("export requires CBL bindings")
        # Flush any pending writes
        try:
            self._do_maintenance(0)  # compact before export
        except Exception:
            pass

        db_dir = Path(CBL_DB_DIR) / f"{CBL_DB_NAME}.cblite2"
        if not db_dir.exists():
            raise RuntimeError(f"database directory not found: {db_dir}")

        tmp_dir = Path(tempfile.gettempdir()) / "cb_query_analyzer_export"
        tmp_dir.mkdir(parents=True, exist_ok=True)
        out_path = tmp_dir / f"{CBL_DB_NAME}-{int(time.time())}.tar.gz"

        with tarfile.open(out_path, "w:gz") as tar:
            tar.add(db_dir, arcname=db_dir.name)
        return str(out_path)

    def import_from(self, file_obj) -> Dict[str, Any]:
        """
        Replace the live database with the contents of an uploaded tar.gz.
        Closes the current DB, extracts over the data dir, and reopens.
        """
        if not USE_CBL:
            raise RuntimeError("import requires CBL bindings")

        # Persist upload to a temp file so tarfile can stream it
        tmp_dir = Path(tempfile.gettempdir()) / "cb_query_analyzer_import"
        tmp_dir.mkdir(parents=True, exist_ok=True)
        tmp_tar = tmp_dir / f"upload-{int(time.time())}.tar.gz"

        # Support either a Werkzeug FileStorage or a file-like object
        save = getattr(file_obj, "save", None)
        if callable(save):
            save(str(tmp_tar))
        else:
            with open(tmp_tar, "wb") as f:
                shutil.copyfileobj(file_obj, f)

        # Validate it's a tar
        if not tarfile.is_tarfile(tmp_tar):
            tmp_tar.unlink(missing_ok=True)
            raise RuntimeError("uploaded file is not a valid tar archive")

        # Close DB before swap
        close_db()

        target_dir = Path(CBL_DB_DIR)
        target_dir.mkdir(parents=True, exist_ok=True)

        # Wipe existing .cblite2 directory if present
        live = target_dir / f"{CBL_DB_NAME}.cblite2"
        if live.exists():
            shutil.rmtree(live)

        with tarfile.open(tmp_tar, "r:gz") as tar:
            # Strict path-traversal check
            for member in tar.getmembers():
                member_path = (target_dir / member.name).resolve()
                if not str(member_path).startswith(str(target_dir.resolve())):
                    raise RuntimeError(f"unsafe path in archive: {member.name}")
            tar.extractall(target_dir)

        tmp_tar.unlink(missing_ok=True)

        # Reopen
        get_db()
        return {"ok": True, "restored_to": str(live)}

    # ── Diagnostics ───────────────────────────────────────────
    def explain(self, n1ql_sql: str) -> str:
        """Return EXPLAIN output for a query string."""
        if not USE_CBL:
            return ""
        try:
            q = Query(self.db, n1ql_sql, N1QLLanguage)
            slice_result = lib.CBLQuery_Explain(q._ref)
            return sliceResultToString(slice_result)
        except Exception as e:
            return f"EXPLAIN failed: {e}"

    def stats(self) -> Dict[str, Any]:
        """Return per-collection doc counts and on-disk size."""
        out: Dict[str, Any] = {"collections": {}, "db_size_bytes": 0}

        for coll in ALL_COLLECTIONS:
            sql = f"SELECT COUNT(*) AS cnt FROM {SCOPE}.{coll}"
            rows = _n1ql(self.db, sql)
            out["collections"][coll] = (rows[0].get("cnt") if rows else 0) or 0

        try:
            db_path = Path(CBL_DB_DIR) / f"{CBL_DB_NAME}.cblite2"
            if db_path.exists():
                out["db_size_bytes"] = sum(
                    f.stat().st_size for f in db_path.rglob("*") if f.is_file()
                )
        except Exception as e:
            ic(f"⚠️ stats: size walk failed: {e}")

        out["db_path"] = str(Path(CBL_DB_DIR) / f"{CBL_DB_NAME}.cblite2")
        return out
