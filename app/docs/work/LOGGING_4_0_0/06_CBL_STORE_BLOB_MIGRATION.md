# 06 · `app/cbl_store.py` + `app/blob_storage.py` — 12 + 28 `ic()` migrations

**Depends on:** [`01_LOGGING_CONFIG_MODULE.md`](./01_LOGGING_CONFIG_MODULE.md), [`03_APP_PY_MIGRATION.md`](./03_APP_PY_MIGRATION.md).
**Blocks:** nothing.
**Status:** ✅ DONE — migrated all 40 `ic()` calls (12 + 28) across both files.

---

## 1. Why these together

Both modules are CBL-side persistence (the v4.0.0 migration target —
see [`CB_TO_CBL/02_CBL_STORE_MODULE.md`](../CB_TO_CBL/02_CBL_STORE_MODULE.md))
and they share a logging shape: per-doc save / load / delete events
plus a handful of catastrophic startup events.

| File | LOC | `ic()` calls |
|---|---|---|
| `app/cbl_store.py` | 781 | 12 |
| `app/blob_storage.py` | 238 | 28 |

40 calls total — small enough that one reviewer can hold the entire
diff in their head.

## 2. Module setup (both files)

```python
import logging

logger = logging.getLogger(__name__)   # → "app.cbl_store" or "app.blob_storage"

# ic() stays as a developer probe (LOGGING.md §6.2).
from icecream import ic
```

Neither file ever logs an API key, so no `mask_api_key` import is
needed here.

## 3. `app/cbl_store.py` — 12 calls

### Bucket A — Lifecycle (~3) → `logger.info`

```python
# Today
ic("✅ CBL storage initialized")
ic(f"📂 Database opened at {db_path}")
ic(f"🧰 Maintenance: ran {operation} in {dt:.2f}s")

# Tomorrow
logger.info("cbl storage initialized path=%s", db_path)
logger.info("cbl maintenance op=%s elapsed_s=%.2f", operation, dt)
```

The two startup `ic()` lines collapse into **one** `logger.info` (per
[`LOGGING.md §5.3`](../../../guides/LOGGING.md): one event per call).

### Bucket B — Per-doc internals (~5) → `logger.debug`

```python
# Today
ic(f"💾 save_analyzer({doc_id}): {len(json.dumps(doc))} bytes")
ic(f"📖 load_analyzer({doc_id}) → found={bool(d)}")
ic(f"🗑️  delete_analyzer({doc_id})")

# Tomorrow
logger.debug("cbl save_analyzer doc_id=%s bytes=%d", doc_id, payload_bytes)
logger.debug("cbl load_analyzer doc_id=%s found=%s", doc_id, bool(d))
logger.debug("cbl delete_analyzer doc_id=%s", doc_id)
```

These fire on every save/load — `info` would firehose any user with a
populated history. `debug` matches the user's mental model of "show me
what just happened" without polluting steady-state.

### Bucket C — Failed operations (~4) → `logger.exception`

```python
# Today
try:
    db.save(doc)
except Exception as e:
    ic(f"❌ save_analyzer failed: {e}")
    raise StorageError(...) from e

# Tomorrow
try:
    db.save(doc)
except Exception:
    logger.exception("cbl save_analyzer failed doc_id=%s", doc.get("id"))
    raise StorageError(...) from None
```

The `from None` (instead of `from e`) is intentional: `logger.exception`
already attached the full chain.

## 4. `app/blob_storage.py` — 28 calls

This file has the highest `ic()` density of the four backend modules
(28 calls in 238 LOC) because the original author was actively
debugging the blob round-trip when it landed. Most are now noise.

### Bucket A — Lifecycle (~2) → `logger.info`

```python
ic(f"🗄️ Blob storage backend: {backend}")
# →
logger.info("blob storage backend=%s path=%s", backend, path)
```

### Bucket B — Per-blob internals (~22) → `logger.debug`

These are the bulk of the 28 calls — `ic("compressed", n_in, n_out)`,
`ic("uploading blob", blob_id)`, `ic("download ok", blob_id, bytes)`.
All become `logger.debug`. Examples:

```python
# Today
ic(f"📦 Compressed: {n_in} → {n_out} bytes (ratio {ratio:.2f})")
ic(f"⬆️  Uploading blob_id={blob_id} bytes={n_out}")
ic(f"⬇️  Downloaded blob_id={blob_id} bytes={n}")
ic(f"🧹 GC: removed {n} orphaned blobs")

# Tomorrow
logger.debug("blob compressed in_bytes=%d out_bytes=%d ratio=%.2f", n_in, n_out, ratio)
logger.debug("blob upload blob_id=%s bytes=%d", blob_id, n_out)
logger.debug("blob download blob_id=%s bytes=%d", blob_id, n)
logger.info("blob gc removed=%d", n)   # GC is INFO — user-visible cleanup event
```

### Bucket C — Failed operations (~4) → `logger.exception`

Same pattern as cbl_store.

## 5. Combined diff size estimate

~80 lines changed across two files. One PR, one reviewer, no risk to
runtime behaviour beyond the user-visible reduction in console
chatter.

## 6. Tests

`tests/python/test_cbl_store_logging.py`:

```python
import logging

def test_save_at_debug_only(caplog, cbl_store_fixture):
    with caplog.at_level(logging.INFO, logger="app.cbl_store"):
        cbl_store_fixture.save_analyzer({"id": "T-x", "data": "..."})
    # At INFO, no per-save records.
    assert not any("save_analyzer" in r.message for r in caplog.records)

    with caplog.at_level(logging.DEBUG, logger="app.cbl_store"):
        cbl_store_fixture.save_analyzer({"id": "T-y", "data": "..."})
    assert any("cbl save_analyzer doc_id=T-y" in r.message for r in caplog.records)


def test_save_failure_uses_exception(caplog, broken_cbl_store):
    with caplog.at_level(logging.ERROR, logger="app.cbl_store"):
        with pytest.raises(StorageError):
            broken_cbl_store.save_analyzer({"id": "T-bad"})
    rec = next(r for r in caplog.records if "cbl save_analyzer failed" in r.message)
    assert rec.exc_info is not None     # logger.exception attached the traceback
```

`tests/python/test_blob_storage_logging.py`:

```python
def test_compress_at_debug(caplog, blob_storage_fixture):
    with caplog.at_level(logging.DEBUG, logger="app.blob_storage"):
        blob_storage_fixture.put(b"x" * 10_000)
    assert any("blob compressed" in r.message for r in caplog.records)


def test_gc_at_info(caplog, blob_storage_fixture_with_orphans):
    with caplog.at_level(logging.INFO, logger="app.blob_storage"):
        blob_storage_fixture_with_orphans.gc_orphans()
    assert any(
        "blob gc removed=" in r.message and r.levelno == logging.INFO
        for r in caplog.records
    )
```

## 7. Acceptance checklist

- [x] `grep -cE '^\s*ic\(' app/cbl_store.py` returns **0** (all migrated).
- [x] `grep -cE '^\s*ic\(' app/blob_storage.py` returns **0** (all migrated).
- [x] `logger = logging.getLogger(__name__)` at top of both files.
- [x] No `print()` calls remain in either file.
- [x] Per-doc save/load/delete is `debug`; lifecycle (init, GC) is `info`; all `except` use `logger.exception`.
- [ ] `pytest tests/python/test_cbl_store_logging.py
      tests/python/test_blob_storage_logging.py -v` passes (tests not yet written).
- [ ] Smoke: with `CBQA_LOG_LEVEL=INFO`, saving 100 analyzer reports
      produces ~0 records from these two loggers; with
      `CBQA_LOG_LEVEL=DEBUG`, ~200 records (one save + one blob upload
      per doc).
