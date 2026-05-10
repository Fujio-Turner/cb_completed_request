# 04 — `blob_storage.py` Refactor

**Status:** ✅ COMPLETE

The current `app/blob_storage.py` is built around Couchbase Server's K/V + XATTR model:

- gzip-compress data
- write the body via `Collection.upsert(..., transcoder=RawBinaryTranscoder())`
- write metadata into XATTRs via `subdocument` ops
- enforce the **20 MB Memcached limit**

CBL has **no XATTRs** and **no 20 MB K/V limit**, so the abstraction collapses into a single CBL document per blob (see [`01_DATA_MODEL.md §4.6`](./01_DATA_MODEL.md)).

---

## 1. What stays vs what goes

| Concern | Server (today) | CBL (after) |
|---|---|---|
| Compression | `gzip.compress` in Python | Same |
| Storage of bytes | `Collection.upsert(RawBinaryTranscoder)` | `data_b64` field on a CBL doc |
| Metadata | XATTR sub-document ops | Plain fields on the same doc |
| Size limit | Hard 20 MB | Soft warn at 16 MB; hard cap at 64 MB (see §3) |
| Dedup | None | Built in via `sha256` doc id |
| Reference from other docs | Same key as the parent | `blob_ref = "blob:<sha>"` field |
| GC | Manual | `gc_orphan_blobs()` walks all collections that hold `blob_ref` and deletes any unreferenced blob |

---

## 2. New module shape

```python
# app/blob_storage.py
import gzip
import json
import hashlib
import base64
from typing import Any, Dict, Tuple, Union, Optional
from icecream import ic

from cbl_store import CBLStore, USE_CBL, COLL_BLOBS

# Soft / hard caps
WARN_BYTES = 16 * 1024 * 1024
HARD_BYTES = 64 * 1024 * 1024


class BlobStorage:
    """
    CBL-backed blob storage.

    Public methods preserve the v4.0.0 signatures so the AI analyzer
    callers don't change.
    """

    def __init__(self, store: Optional[CBLStore] = None):
        self.store = store or CBLStore()

    # ---- Write ----
    def put_json(self, obj: Any) -> str:
        body = json.dumps(obj, separators=(",", ":")).encode("utf-8")
        return self.store.put_blob(body, content_type="application/json",
                                   compression="gzip")

    def put_text(self, text: str,
                 content_type: str = "text/plain") -> str:
        return self.store.put_blob(text.encode("utf-8"),
                                   content_type=content_type,
                                   compression="gzip")

    def put_bytes(self, data: bytes,
                  content_type: str = "application/octet-stream") -> str:
        if len(data) > HARD_BYTES:
            raise ValueError(f"blob exceeds hard cap ({HARD_BYTES} bytes)")
        if len(data) > WARN_BYTES:
            ic(f"⚠️ blob {len(data)} bytes exceeds soft cap "
               f"{WARN_BYTES} (perf will degrade)")
        return self.store.put_blob(data, content_type=content_type,
                                   compression="gzip")

    # ---- Read ----
    def get_json(self, blob_ref: str) -> Any:
        raw = self.store.get_blob(blob_ref)
        if raw is None:
            return None
        return json.loads(raw.decode("utf-8"))

    def get_text(self, blob_ref: str) -> Optional[str]:
        raw = self.store.get_blob(blob_ref)
        return None if raw is None else raw.decode("utf-8")

    def get_bytes(self, blob_ref: str) -> Optional[bytes]:
        return self.store.get_blob(blob_ref)

    # ---- Delete / GC ----
    def delete(self, blob_ref: str) -> None:
        self.store.delete_blob(blob_ref)
```

Old methods like `compress_data()`, `_xattr_set()`, the `RawBinaryTranscoder` import, `COUCHBASE_KV_LIMIT` — all gone.

---

## 3. Size limits

CBL itself can store very large documents, but performance degrades because:

- Base64 inflates payload by ~33 % on disk.
- Reads materialize the whole `data_b64` string in Python before decode.
- SQLite (CBL's storage layer) is happy with multi-MB rows but row-rewrite cost is O(N).

Recommendation:

| Size | Action |
|---|---|
| ≤ 16 MB | Normal path |
| 16 MB – 64 MB | Logged warning |
| > 64 MB | `ValueError` — caller must split |

If we ever hit the 64 MB cap regularly we switch to **CBL native Blobs** (separate file inside `.cblite2/`); see "Future" below.

---

## 4. Reference counting & GC

Every doc that uses a blob carries one or more `blob_ref` / `*_blob_ref` fields:

| Collection | Fields that hold blob refs |
|---|---|
| `analyzer` | `blob_ref` |
| `ai_history` | `prompt_blob_ref`, `response_blob_ref` |

`store.gc_orphan_blobs()`:

```python
def gc_orphan_blobs(self) -> int:
    """Delete blobs not referenced by any analyzer or ai_history doc."""
    ref_sql = """
        SELECT blob_ref            FROM `cb_tools`.`analyzer`   WHERE blob_ref IS NOT MISSING
        UNION
        SELECT prompt_blob_ref     FROM `cb_tools`.`ai_history` WHERE prompt_blob_ref IS NOT MISSING
        UNION
        SELECT response_blob_ref   FROM `cb_tools`.`ai_history` WHERE response_blob_ref IS NOT MISSING
    """
    referenced = {r.values().__iter__().__next__()
                  for r in _n1ql(self.db, ref_sql)}
    blobs = _n1ql(self.db,
        "SELECT META().id AS id FROM `cb_tools`.`blobs` WHERE type='blob'")
    deleted = 0
    for row in blobs:
        if row["id"] not in referenced:
            _coll_delete_doc(self.db, COLL_BLOBS, row["id"])
            deleted += 1
    return deleted
```

Triggered manually from the new **Storage tab** UI button or via `POST /api/storage/maintenance` with `{"op":"gc_blobs"}`.

---

## 5. Migration of existing blobs

For users coming from v4.0.0 with blobs in CB Server, the migration script (see [`09_DATA_MIGRATION.md`](./09_DATA_MIGRATION.md)):

1. Reads each blob doc from CB Server using `RawBinaryTranscoder`.
2. Reads its XATTR metadata.
3. Calls `BlobStorage().put_bytes(...)` on the local CBL store.
4. Rewrites the parent doc's `blob_ref` to the new SHA-keyed id.

Because `put_blob()` is content-addressed, re-running the migration is idempotent.

---

## 6. Future: CBL native Blobs

If we hit consistent > 64 MB payloads (e.g. very large `system:completed_requests` dumps), switch to CBL's native Blob API:

```python
from CouchbaseLite.Blob import Blob
b = Blob(content_type="application/json", data=body)
doc["payload"] = b   # CBL stores as separate file under .cblite2/blobs/
```

This avoids the base64 inflation and the in-memory string materialization, but requires CFFI helpers because the Python wrapper is incomplete.

This is **out of scope for v4.0.0-beta** — revisit if metrics show big-blob complaints.
