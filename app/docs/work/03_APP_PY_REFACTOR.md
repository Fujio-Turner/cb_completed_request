# 03 — `app.py` Endpoint Refactor

This file maps every existing endpoint that talks to **Couchbase Server's `cb_tools` bucket** to a **`CBLStore`** call. Endpoints that talk to the user's *production* cluster (the read-only N1QL on `system:completed_requests`) **do not change**.

The `couchbase` Python SDK is **still required** — it stays the only way we hit the user's production cluster.

---

## 1. Wiring

At the top of `app.py`:

```python
from cbl_store import CBLStore, USE_CBL, STORAGE_BACKEND

def storage() -> CBLStore:
    """Return a CBLStore. Caller must have already verified backend == 'cbl'."""
    return CBLStore()

def backend() -> str:
    if STORAGE_BACKEND == "cbl":
        return "cbl"
    if STORAGE_BACKEND == "server":
        return "server"
    return "cbl" if USE_CBL else "server"
```

Then every endpoint below gets a tiny shim:

```python
if backend() == "cbl":
    return _cbl_save_analyzer(...)
return _server_save_analyzer(...)   # original code, untouched
```

This keeps the diff reviewable and lets us delete the `_server_*` paths in v5.1.0.

---

## 2. Endpoint mapping

> ✅ = changes to CBL · ⛔ = **no change** (talks to user's production cluster) · 🆕 = new endpoint

| # | Endpoint | Today writes/reads | After |
|---|---|---|---|
|1| `POST /api/couchbase/test` | Pings user's prod cluster | ⛔ unchanged |
|2| `POST /api/couchbase/check-indexes` | User's prod cluster | ⛔ unchanged |
|3| `POST /api/couchbase/query` | User's prod cluster | ⛔ unchanged |
|4| `POST /api/couchbase/save-analyzer` | `cb_tools.query.analyzer` | ✅ `store.save_analyzer()` |
|5| `POST /api/couchbase/load-analyzer/<id>` | `cb_tools.query.analyzer` | ✅ `store.load_analyzer()` |
|6| `POST /api/couchbase/delete-analyzer` | `cb_tools.query.analyzer` | ✅ `store.delete_analyzer()` |
|7| `POST /api/couchbase/save-preferences` | `cb_tools._default._default` | ✅ `store.save_preferences()` |
|8| `POST /api/couchbase/load-preferences/<userId>` | `cb_tools._default._default` | ✅ `store.load_preferences()` |
|9| `POST /api/ai/cache` | in-memory + CB Server | ✅ in-memory + `store.add_ai_history()` |
|10| `POST /api/ai/preview` | in-memory only | ⛔ unchanged |
|11| `POST /api/ai/analyze` | calls AI provider; logs to `cb_tools.<cluster>.analysis` | ✅ writes via `store.add_ai_history()` |
|12| `POST /api/ai/cancel` | in-memory | ⛔ unchanged |
|13| `POST /api/ai/status/<doc_id>` | reads `cb_tools.<cluster>.analysis` | ✅ `store.get_ai_history()` |
|14| `GET /api/ai/stats` | `cb_tools.<...>.analysis` aggregate | ✅ N1QL on CBL `ai_history` |
|15| `GET /api/ai/payload-reference` | reads `cb_tools._default._default::payload_reference` | ✅ `store.get_payload_reference()` |
|16| `POST /api/ai/payload-reference/load` | same | ✅ same |
|17| `POST /api/ai/payload-reference/seed` | seeds from `payload_reference.json.template` | ✅ `store.seed_from_template(...)` |
|18| `POST /api/ai/payload-reference/save` | writes back | ✅ `store.save_payload_reference()` |
|19| `POST /api/ai/payload-reference/invalidate-cache` | in-memory | ⛔ unchanged |
|20| `GET /api/ai/models` | reads `ai_models_list` | ✅ `store.get_models_list()` |
|21| `POST /api/ai/models/load` | same | ✅ same |
|22| `POST /api/ai/models/seed` | seeds from template | ✅ `store.seed_from_template(...)` |
|23| `POST /api/ai/models/save` | writes back | ✅ `store.save_models_list()` |
|24| `POST /api/ai/models/provider/<id>` | sub-doc update | ✅ read-modify-write |
|25| `POST /api/ai/models/invalidate-cache` | in-memory | ⛔ unchanged |
|26| `POST /api/ai/test` | calls AI provider | ⛔ unchanged |
|27| `POST /api/ai/history` | `cb_tools.<cluster>.analysis` | ✅ `store.list_ai_history(cluster)` |
|28| `POST /api/ai/clusters` | aggregate over `cb_tools` scopes | ✅ `SELECT DISTINCT cluster_name FROM ai_history` |
|29| `POST /api/ai/debug` | logs only | ⛔ unchanged |
|30| `POST /api/ai/call` | proxy to AI provider | ⛔ unchanged |
|31| `GET /api/storage/info` 🆕 | — | size on disk, doc counts per collection |
|32| `POST /api/storage/maintenance` 🆕 | — | runs `compact / reindex / optimize` |
|33| `GET /api/storage/export` 🆕 | — | streams a `.tar.gz` of `*.cblite2/` |
|34| `POST /api/storage/import` 🆕 | — | accepts a `.tar.gz`, replaces DB |

---

## 3. Detailed examples

### 3.1 `save-analyzer` (#4)

**Before:**

```python
@app.route('/api/couchbase/save-analyzer', methods=['POST'])
def save_analyzer():
    data = request.get_json()
    cluster_config = data.get('config', {})
    bucket_config  = data.get('bucketConfig', {})
    request_id     = data.get('requestId')
    analyzer_data  = data.get('analyzerData')

    cluster = get_couchbase_connection(cluster_config)
    bucket  = cluster.bucket(bucket_config['bucket'])
    coll    = bucket.scope(bucket_config['analyzerScope']).collection(
                  bucket_config['analyzerCollection'])
    coll.upsert(request_id, analyzer_data)
    return jsonify({"success": True})
```

**After:**

```python
@app.route('/api/couchbase/save-analyzer', methods=['POST'])
def save_analyzer():
    data = request.get_json()
    request_id    = data.get('requestId')
    analyzer_data = data.get('analyzerData')
    name          = data.get('name', 'Untitled')

    if backend() == "cbl":
        storage().save_analyzer(request_id, name, analyzer_data)
        return jsonify({"success": True, "backend": "cbl"})

    # ---- legacy CB-Server path (kept for one release) ----
    cluster_config = data.get('config', {})
    bucket_config  = data.get('bucketConfig', {})
    cluster = get_couchbase_connection(cluster_config)
    bucket  = cluster.bucket(bucket_config['bucket'])
    coll    = bucket.scope(bucket_config['analyzerScope']).collection(
                  bucket_config['analyzerCollection'])
    coll.upsert(request_id, analyzer_data)
    return jsonify({"success": True, "backend": "server"})
```

Note that the request body **stops requiring** `config` / `bucketConfig` when `backend()=="cbl"`; the frontend can drop those fields after v5.0.0 ships, but for compatibility we keep accepting them.

### 3.2 `ai/history` (#27)

```python
@app.route('/api/ai/history', methods=['POST'])
def ai_history():
    data = request.get_json() or {}
    cluster_name = data.get('clusterName')
    limit  = int(data.get('limit', 50))
    offset = int(data.get('offset', 0))

    if backend() == "cbl":
        return jsonify(storage().list_ai_history(
            cluster_name=cluster_name, limit=limit, offset=offset
        ))

    # legacy: aggregate from cb_tools.<cluster>.analysis
    ...
```

### 3.3 `ai/payload-reference/seed` (#17)

```python
@app.route('/api/ai/payload-reference/seed', methods=['POST'])
def seed_payload_reference():
    if backend() == "cbl":
        ok = storage().seed_from_template(
            "payload_reference",
            os.path.join(DIRECTORY, "payload_reference.json.template")
        )
        return jsonify({"success": ok, "backend": "cbl"})
    ...
```

### 3.4 New `/api/storage/info` (#31)

```python
@app.route('/api/storage/info', methods=['GET'])
def storage_info():
    if backend() != "cbl":
        return jsonify({"backend": "server"}), 200
    s = storage().stats()
    return jsonify({
        "backend": "cbl",
        "db_path": f"{CBL_DB_DIR}/{CBL_DB_NAME}.cblite2",
        "collections": s["collections"],
        "db_size_bytes": s["db_size_bytes"],
        "version": "Couchbase Lite 3.2.1 CE",
    })
```

### 3.5 New `/api/storage/maintenance` (#32)

```python
@app.route('/api/storage/maintenance', methods=['POST'])
def storage_maintenance():
    op = (request.get_json() or {}).get("op", "compact")
    s = storage()
    fn = {"compact": s.compact, "reindex": s.reindex,
          "optimize": s.optimize, "integrity": s.integrity_check}.get(op)
    if not fn:
        return jsonify({"error": f"unknown op {op}"}), 400
    return jsonify({"success": fn(), "op": op})
```

### 3.6 New `/api/storage/export` (#33)

Streams a tarball of the `.cblite2` directory. Implementation uses `tarfile.open(mode="w|gz", fileobj=...)`.

### 3.7 New `/api/storage/import` (#34)

Accepts a tarball, **stops accepting writes**, replaces the directory atomically (rename old, extract new), reopens the DB.

---

## 4. Frontend impact

The frontend **mostly does not change** because the URL/method/response shape is preserved. Two exceptions:

1. **Connection screen** — When `backend()=="cbl"`, the cluster URL/credentials form for app data is hidden (you only need the user's production cluster credentials, which still live on the same connection screen but tagged as "Source data cluster" instead of "App data cluster"). A small banner shows: `"App data: embedded (Couchbase Lite)"`.

2. **New "Storage" tab in Settings** — calls the four `/api/storage/*` endpoints. UI shows DB path, size, doc counts per collection, "Compact now", "Export backup", "Import backup".

These changes happen in `assets/js/` (separate ticket); they are not blocking for the backend cutover.

---

## 5. Dropped endpoints / behaviour

After v5.1.0 (one release after the v5.0.0 CBL cutover):

- The legacy CB-Server branches in #4–8, #11, #13–18, #20–24, #27, #28 are deleted.
- The `couchbase` SDK in `requirements.txt` stays — it's still used for the user's *production* cluster (#1, #2, #3, #26, #30).
- `setup_couchbase.sql` is no longer relevant for app data; we move it under `docs/legacy/` and rewrite the README accordingly. (Tracked as a deliverable in [`12_RELEASE_PROCESS_COMPLIANCE.md §9`](./12_RELEASE_PROCESS_COMPLIANCE.md).)
