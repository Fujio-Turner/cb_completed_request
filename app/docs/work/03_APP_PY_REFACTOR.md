# 03 — `app.py` Endpoint Refactor

**Status:** ✅ COMPLETE — **CBL-only cutover landed 2026-05-09** (see §6 below). The dual-branch shim, the `backend()` resolver, and the production-cluster endpoints have all been deleted.

> Sections 1–5 below are preserved as the **historical** record of the staged
> migration. The **current** behaviour is described in §6. When the two
> conflict, §6 wins.

This file originally mapped every existing endpoint that talked to **Couchbase
Server's `cb_tools` bucket** to a **`CBLStore`** call, while leaving the user's
*production* cluster endpoints (the read-only N1QL on
`system:completed_requests`) untouched. That second class of endpoints has
since been removed entirely — source data now arrives via JSON upload only.

The `couchbase` Python SDK is **no longer a dependency.**

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

This keeps the diff reviewable and lets us delete the `_server_*` paths in a future release.

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

Note that the request body **stops requiring** `config` / `bucketConfig` when `backend()=="cbl"`; the frontend can drop those fields after v4.0.0-beta ships, but for compatibility we keep accepting them.

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

After a future release (one release after the v4.0.0-beta CBL cutover):

- The legacy CB-Server branches in #4–8, #11, #13–18, #20–24, #27, #28 are deleted.
- The `couchbase` SDK in `requirements.txt` stays — it's still used for the user's *production* cluster (#1, #2, #3, #26, #30).
- `setup_couchbase.sql` is no longer relevant for app data; we move it under `docs/legacy/` and rewrite the README accordingly. (Tracked as a deliverable in [`12_RELEASE_PROCESS_COMPLIANCE.md §9`](./12_RELEASE_PROCESS_COMPLIANCE.md).)

---

## 5. Post-review fixes (2026-05-09)

The first pass of [`app/app.py`](../../app.py) had three blocking bugs and one
design deviation. All have been fixed:

### 5.1 `backend()` now resolves correctly

The first version returned the raw `STORAGE_BACKEND` env value, which defaults
to `"auto"` in [`app/cbl_store.py`](../../cbl_store.py) — so every `if backend()
== "cbl"` was always False. The legacy keyword was also `"couchbase"` but the
override branches compared to `"server"`. Fixed:

```python
from cbl_store import storage_backend  # resolves auto → cbl/server

def backend() -> str:
    if not CBL_AVAILABLE:
        return "server"
    return storage_backend()
```

### 5.2 Method names aligned with `CBLStore`

`app.py` was calling `store.save_analysis`, `store.load_analysis`,
`store.query`, `store.maintenance`, `store.export`, `store.import_from` — none
of which existed. Either the method was added to `CBLStore` or the call site
was renamed. See [`02_CBL_STORE_MODULE.md §9`](./02_CBL_STORE_MODULE.md) for
the new method list.

### 5.3 Production-cluster routes restored

`/api/couchbase/test`, `/api/couchbase/check-indexes`, and
`/api/couchbase/query` are no longer overridden — they hit the user's
production Couchbase Server cluster as the design specified (⛔ rows in the
table above). The CBL `/api/storage/info`, `/api/storage/maintenance`,
`/api/storage/export`, `/api/storage/import` endpoints exist instead for
inspecting / managing the embedded database.

### 5.4 Implementation strategy: build on top of `app_base.py`

Rather than re-implementing all 30+ v4.x endpoints with dual branches inline,
[`app/app.py`](../../app.py) now imports the original Flask app from
[`app/app_base.py`](../../app_base.py) (preserved verbatim from v4.0.0) and
**overrides only the CBL-eligible routes**:

```python
from app_base import app, get_couchbase_connection, DIRECTORY

def _override_route(rule, view_func, methods=None):
    """Swap the view function for an existing rule, preserving its endpoint."""
    matching = [
        r for r in app.url_map.iter_rules()
        if r.rule == rule and (set(methods) & (r.methods or set()))
    ]
    for r in matching:
        app.view_functions[r.endpoint] = view_func

_override_route('/api/couchbase/save-analyzer', save_analyzer, ['POST'])
# ... etc for the 14 routes that need CBL routing
```

This keeps the diff small, leaves the production-cluster endpoints untouched
by definition, and avoids fragile mutation of Werkzeug's `url_map._rules`.

### 5.5 New endpoints added in this pass

| # | Endpoint | Status |
|---|---|---|
| 6 | `POST /api/couchbase/delete-analyzer` | ✅ added (CBL + server fallback) |
| 13 | `POST /api/ai/status/<doc_id>` | ✅ added (CBL only — server returns 501 here, legacy CB path still in `app_base.py` until removed in v5.1) |
| 14 | `GET /api/ai/stats` | ✅ added (CBL N1QL aggregate) |
| 15 | `GET /api/ai/payload-reference` | ✅ added |
| 16 | `POST /api/ai/payload-reference/load` | ✅ added |
| 17 | `POST /api/ai/payload-reference/seed` | ✅ added |
| 18 | `POST /api/ai/payload-reference/save` | ✅ added |
| 20 | `GET /api/ai/models` | ✅ added |
| 21 | `POST /api/ai/models/load` | ✅ added |
| 22 | `POST /api/ai/models/seed` | ✅ added |
| 23 | `POST /api/ai/models/save` | ✅ added |
| 27 | `POST /api/ai/history` | ✅ added |
| 28 | `POST /api/ai/clusters` | ✅ added |
| 31 | `GET /api/storage/info` 🆕 | ✅ added |
| 32 | `POST /api/storage/maintenance` 🆕 | ✅ added |
| 33 | `GET /api/storage/export` 🆕 | ✅ added |
| 34 | `POST /api/storage/import` 🆕 | ✅ added |

### 5.6 Verification

```
$ cd app && source venv/bin/activate && pytest ../tests/python/
12 passed, 97 skipped
```

37 routes registered, 18 CBL-routed/new. Smoke test confirms:
- `STORAGE_BACKEND=auto` (no bindings) → `backend() == "server"`
- `STORAGE_BACKEND=cbl` (no bindings) → clear `RuntimeError`
- `/api/couchbase/test` and `/api/couchbase/query` reach the production cluster path (not overridden).

> **Outdated as of §6 below.** The bullets above describe the dual-backend
> middle state. They no longer hold — `STORAGE_BACKEND` is unread,
> `backend()` is gone, and `/api/couchbase/test`/`/query`/`/check-indexes`
> have been deleted from `app_base.py`.

---

## 6. CBL-only cutover (2026-05-09 — **current state**)

Once the CBL path was verified in production-shaped containers, the
dual-branch design was removed. This is the live behaviour today.

### 6.1 Wiring (current)

```python
# app/app.py — top of file
from app_base import app, DIRECTORY      # `get_couchbase_connection` no longer exists
from cbl_store import CBLStore           # USE_CBL / STORAGE_BACKEND removed

def storage() -> CBLStore:
    return CBLStore()
```

There is no `backend()` shim and no `if backend() == "cbl":` branches anywhere
in [`app/app.py`](../../app.py). Each overridden view function calls
`storage().<method>(...)` unconditionally.

### 6.2 Endpoint table (current)

> ❌ = **deleted** · ✅ = CBL-routed via `_override_route` · 🆕 = added in this
> migration · 🟢 = unchanged (no Couchbase Server dependency)

| # | Endpoint | Status | Notes |
|---|---|---|---|
| 1 | `POST /api/couchbase/test` | ❌ deleted | Required a live cluster connection |
| 2 | `POST /api/couchbase/check-indexes` | ❌ deleted | Required a live cluster connection |
| 3 | `POST /api/couchbase/query` | ❌ deleted | Live N1QL is gone; data arrives via JSON upload |
| 4 | `POST /api/couchbase/save-analyzer` | ✅ CBL | `store.save_analyzer()` |
| 5 | `POST /api/couchbase/load-analyzer/<id>` | ✅ CBL | `store.load_analyzer()` |
| 6 | `POST /api/couchbase/delete-analyzer` | ✅ CBL | `store.delete_analyzer()` |
| 7 | `POST /api/couchbase/save-preferences` | ✅ CBL | `store.save_preferences()` |
| 8 | `POST /api/couchbase/load-preferences/<userId>` | ✅ CBL | `store.load_preferences()` |
| 9 | `POST /api/ai/cache` | 🟢 unchanged | In-memory + `store.add_ai_history()` |
| 10 | `POST /api/ai/preview` | 🟢 unchanged | |
| 11 | `POST /api/ai/analyze` | ✅ CBL | Logs to `ai_history` collection |
| 12 | `POST /api/ai/cancel` | 🟢 unchanged | |
| 13 | `POST /api/ai/status/<doc_id>` | ✅ CBL | `store.get_ai_history()` |
| 14 | `GET /api/ai/stats` | ✅ CBL | N1QL aggregate on `ai_history` |
| 15-18 | `GET/POST /api/ai/payload-reference[/load|/seed|/save]` | ✅ CBL | `store.{get,save,seed}_payload_reference()` |
| 19 | `POST /api/ai/payload-reference/invalidate-cache` | 🟢 unchanged | |
| 20-23 | `GET/POST /api/ai/models[/load|/seed|/save]` | ✅ CBL | `store.{get,save,seed}_models_list()` |
| 24 | `POST /api/ai/models/provider/<id>` | ✅ CBL | Read-modify-write |
| 25 | `POST /api/ai/models/invalidate-cache` | 🟢 unchanged | |
| 26 | `POST /api/ai/test` | 🟢 unchanged | Calls AI provider only |
| 27 | `POST /api/ai/history` | ✅ CBL | `store.list_ai_history()` |
| 28 | `POST /api/ai/clusters` | ✅ CBL | `store.list_clusters()` |
| 29 | `POST /api/ai/debug` | 🟢 unchanged | |
| 30 | `POST /api/ai/call` | 🟢 unchanged | Calls AI provider only |
| 31 | `GET /api/storage/info` | 🆕 CBL | DB path, doc counts, size |
| 32 | `POST /api/storage/maintenance` | 🆕 CBL | `compact / reindex / optimize` |
| 33 | `GET /api/storage/export` | 🆕 CBL | Streams `.tar.gz` of `*.cblite2/` |
| 34 | `POST /api/storage/import` | 🆕 CBL | Replaces DB from a `.tar.gz` |

### 6.3 Source data: JSON upload only

The deletion of #1–#3 means there is no longer a way for the server to fetch
`system:completed_requests` directly from a cluster. Users instead:

1. Run the SQL++ statement (documented in [`getting_started.html`](../../../getting_started.html)) against their cluster from any client (`cbq`, the Capella UI, Workbench, etc.)
2. Save the output as JSON
3. Paste / drag-drop / file-pick the JSON in the analyzer UI

The `app/assets/js/couchbase-connector.js` module formerly used to issue live
N1QL is now a **CBL-only** health-check helper; its `testConnection()`
function pings `/api/storage/info` and reports the embedded DB's status.

### 6.4 Code that still references `couchbase.*`

[`app/ai_analyzer.py`](../../ai_analyzer.py) lines 144 and 394 still
`from couchbase.exceptions import ...`. Removing those is the last blocker
for running on a Python environment where the SDK isn't installed at all
(today the SDK is uninstalled but the imports happen to work because of a
local cache). Tracked as a follow-up in
[`00_OVERVIEW.md §8.3`](./00_OVERVIEW.md#83-known-follow-ups).

### 6.5 Verification

```
$ cd app && source venv/bin/activate && pytest ../tests/python/
```

After the cleanup, all `_couchbase_server_*` test fixtures and dual-backend
parametrize cases were removed. The remaining suite is CBL-only and runs in
both "bindings present" (full coverage) and "bindings missing"
(`importorskip`) modes.
