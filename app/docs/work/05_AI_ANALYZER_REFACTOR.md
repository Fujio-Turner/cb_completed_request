# 05 — `ai_analyzer.py` Refactor

**Status:** ✅ COMPLETE

`app/ai_analyzer.py` is the AI session manager. It does three CB-Server-touching things today:

1. Persists a record of every AI run into `cb_tools.<cluster_name>.analysis::{document_id}`.
2. Loads the **payload reference** template from `cb_tools._default._default::payload_reference`.
3. Loads the **AI models registry** from `cb_tools._default._default::ai_models_list`.

All three move to CBL.

---

## 1. Constructor changes

```python
# Before
class AIAnalyzer:
    def __init__(self, cb_cluster=None, bucket_config=None, ...):
        self._cluster = cb_cluster
        self._bucket  = bucket_config
        ...

# After
from cbl_store import CBLStore
from blob_storage import BlobStorage

class AIAnalyzer:
    def __init__(self, store: Optional[CBLStore] = None,
                 blobs: Optional[BlobStorage] = None,
                 cb_cluster=None, bucket_config=None, ...):
        self._store   = store
        self._blobs   = blobs or (BlobStorage(store) if store else None)
        # cb_cluster / bucket_config kept ONLY for the legacy path
        self._cluster = cb_cluster
        self._bucket  = bucket_config
```

`cb_cluster` and `bucket_config` are now `None` whenever `backend()=="cbl"`. The methods below branch on `self._store is not None`.

---

## 2. AI history persistence

Before — every successful `run_analysis()` does roughly:

```python
coll = self._cluster.bucket(self._bucket["bucket"]) \
                    .scope(cluster_name).collection("analysis")
coll.upsert(document_id, {
    "provider": ..., "model": ..., "prompt": prompt_dict,
    "response": response_dict, "tokens": ..., ...
})
```

After:

```python
def _persist_run(self, document_id, cluster_name, provider, model,
                 request_id_ref, prompt_dict, response_dict,
                 tokens_in, tokens_out, status="completed"):

    if self._store:
        # Big payloads go into the blob store
        prompt_ref   = self._blobs.put_json(prompt_dict)
        response_ref = self._blobs.put_json(response_dict)
        self._store.add_ai_history(
            document_id=document_id,
            cluster_name=cluster_name,
            provider=provider,
            model=model,
            request_id_ref=request_id_ref,
            prompt_blob_ref=prompt_ref,
            response_blob_ref=response_ref,
            tokens_in=tokens_in,
            tokens_out=tokens_out,
            status=status,
        )
        return

    # ---- legacy CB-Server path (deleted in v5.1.0) ----
    coll = self._cluster.bucket(self._bucket["bucket"]) \
                        .scope(cluster_name).collection("analysis")
    coll.upsert(document_id, {...})
```

Two big wins:

- **No more per-cluster scope creation** (was a frequent source of permissions errors).
- **Prompt/response are blob-deduplicated** (a re-run of the same prompt only costs metadata bytes).

---

## 3. `payload_reference` and `ai_models_list`

These are loaded into the in-memory cache on first use. Today the loader is something like:

```python
def _load_payload_reference(self):
    coll = self._cluster.bucket(...).scope("_default").collection("_default")
    return coll.get("payload_reference").content_as[dict]
```

Replace:

```python
def _load_payload_reference(self):
    if self._store:
        doc = self._store.get_payload_reference()
        if doc is None:
            # First run — seed from bundled template
            self._store.seed_from_template(
                "payload_reference", PAYLOAD_REFERENCE_TEMPLATE_PATH)
            doc = self._store.get_payload_reference()
        return json.loads(doc["data"])

    # legacy ...
```

Same shape for `_load_models_list`.

`PAYLOAD_REFERENCE_TEMPLATE_PATH` already exists at `app/payload_reference.json.template`; we ship it with PyInstaller (it's already in `datas` of the spec files).

---

## 4. Status / cancel / stats endpoints

These hit `ai_history` from `app.py` (see [`03_APP_PY_REFACTOR.md`](./03_APP_PY_REFACTOR.md) #13 / #14 / #27 / #28). The methods on `AIAnalyzer` that they call become thin wrappers around `CBLStore`:

```python
def get_status(self, document_id):
    if self._store:
        h = self._store.get_ai_history(document_id)
        return None if h is None else {
            "status": h["status"], "tokens_in": h["tokens_in"],
            "tokens_out": h["tokens_out"], "model": h["model"],
        }
    # legacy ...
```

---

## 5. In-memory session cache

The TTL-keyed in-memory cache is **unchanged**. It still holds live `AISession` objects. CBL is only the **persistence** layer for completed runs and reference docs. The cache eviction logic, cancel tokens, and threading code stay as-is.

---

## 6. Tests

`tests/python/test_ai_analyzer.py` already mocks the cluster — replace the cluster mock with a temp `CBLStore` instance (using a `tmp_path` directory):

```python
@pytest.fixture
def store(tmp_path, monkeypatch):
    monkeypatch.setenv("CBL_DB_DIR", str(tmp_path))
    monkeypatch.setenv("CBL_DB_NAME", "test_cb_tools")
    from cbl_store import CBLStore, close_db
    yield CBLStore()
    close_db()

def test_run_persists_history(store):
    a = AIAnalyzer(store=store)
    a._persist_run("doc1", "prod-east", "anthropic",
                   "claude-3-5-sonnet", "req1",
                   {"q": "x"}, {"r": "y"}, 100, 50)
    h = store.get_ai_history("doc1")
    assert h["status"] == "completed"
    assert h["cluster_name"] == "prod-east"
```
