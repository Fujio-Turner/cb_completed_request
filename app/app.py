#!/usr/bin/env python3
"""
Flask HTTP server for Couchbase Query Analyzer v5.0.0

Embedded Couchbase Lite (CE) replaces the external Couchbase Server cb_tools
bucket for all *app* persistence. The user's external Couchbase Server is
still used for read-only N1QL on system:completed_requests.

Architecture:
- ``app_base.py`` provides the original v4.x Flask app with every endpoint
  wired to an external Couchbase Server cb_tools bucket. We import that app
  as the foundation so we don't duplicate code.
- This module ("app.py") **overrides** the endpoints that used to write/read
  cb_tools so that, when ``STORAGE_BACKEND`` resolves to ``cbl``, they go
  through ``CBLStore`` instead. Endpoints that talk to the user's PRODUCTION
  cluster (``/api/couchbase/test``, ``/api/couchbase/check-indexes``,
  ``/api/couchbase/query``) are intentionally **not** overridden — they keep
  hitting the user's external Couchbase Server cluster regardless of backend.
- New ``/api/storage/*`` endpoints expose CBL-only maintenance, info, export,
  import.

See app/docs/work/03_APP_PY_REFACTOR.md for the endpoint mapping.
"""

import os
import sys
import time
import json
from typing import Optional
from icecream import ic

from flask import jsonify, request, send_file, send_from_directory

# Import the base app (registers all the v4.x Couchbase Server endpoints).
# We then override only the ones that need CBL routing.
from app_base import app, get_couchbase_connection, DIRECTORY  # noqa: F401

import ai_analyzer
import blob_storage

# Try to import CBL store
try:
    from cbl_store import CBLStore, USE_CBL, storage_backend
    CBL_AVAILABLE = True
except ImportError as e:
    CBL_AVAILABLE = False
    USE_CBL = False
    ic(f"⚠️ CBL store not available: {e}")

    def storage_backend() -> str:  # type: ignore[no-redef]
        return "server"


# ============================================================================
# Server config (port + future server-side options)
# ============================================================================

def _load_server_config() -> dict:
    """
    Load server-side config from the first existing JSON file in:
      1. $APP_CONFIG_FILE
      2. ./config.json         (sibling of app.py)
      3. ./config.default.json (sibling of app.py)

    Only the top-level `server` key is consumed here (e.g. `server.port`).
    Everything else in config.json is consumed by the frontend.

    Errors loading the file are logged and ignored; defaults apply.
    """
    candidates = []
    env_path = os.environ.get('APP_CONFIG_FILE')
    if env_path:
        candidates.append(env_path)
    here = os.path.dirname(os.path.abspath(__file__))
    candidates.extend([
        os.path.join(here, 'config.json'),
        os.path.join(here, 'config.default.json'),
    ])
    for path in candidates:
        if not path or not os.path.isfile(path):
            continue
        try:
            with open(path, 'r') as f:
                data = json.load(f)
            ic(f"⚙️  Loaded server config from {path}")
            return data if isinstance(data, dict) else {}
        except Exception as e:
            ic(f"⚠️  Failed to read {path}: {e}")
    return {}


def get_server_port(default: int = 8080) -> int:
    """
    Resolve the HTTP listen port. Priority:
      1. $PORT env var (set by Docker / start scripts)
      2. config.json `server.port`
      3. `default` (8080)

    Note: When running in Docker the gunicorn CMD reads $PORT directly via
    shell expansion, so this helper is mainly used by the __main__ block
    and is also exposed for tests.
    """
    env = os.environ.get('PORT')
    if env:
        try:
            return int(env)
        except ValueError:
            ic(f"⚠️  Ignoring invalid PORT={env!r}; falling back to config.json")
    cfg = _load_server_config().get('server') or {}
    val = cfg.get('port')
    if isinstance(val, int) and val > 0:
        return val
    if isinstance(val, str) and val.isdigit():
        return int(val)
    return default


# ============================================================================
# Backend helpers
# ============================================================================

_cbl_store: Optional["CBLStore"] = None
_cbl_blobs: Optional[blob_storage.BlobStorage] = None


def storage() -> Optional["CBLStore"]:
    """Return the singleton CBLStore (creates it on first call)."""
    global _cbl_store
    if not CBL_AVAILABLE:
        return None
    if _cbl_store is None:
        _cbl_store = CBLStore()
        ic("✅ CBL storage initialized")
    return _cbl_store


def get_blobs() -> Optional[blob_storage.BlobStorage]:
    """Return the singleton blob storage facade backed by CBLStore."""
    global _cbl_blobs
    if not CBL_AVAILABLE:
        return None
    if _cbl_blobs is None:
        _cbl_blobs = blob_storage.BlobStorage(storage())
        ic("✅ Blob storage initialized")
    return _cbl_blobs


def backend() -> str:
    """Return the active storage backend: 'cbl' or 'server'."""
    if not CBL_AVAILABLE:
        return "server"
    return storage_backend()


# ============================================================================
# Route override helper
# ============================================================================

def _override_route(rule: str, view_func, methods=None):
    """
    Replace the view function bound to an existing Flask route.

    Rather than manipulating url_map internals (which is fragile across
    Flask/Werkzeug versions), this finds the existing rule for ``rule`` and
    swaps its endpoint's handler in ``app.view_functions``. The URL rule
    itself stays registered with its original endpoint name.
    """
    methods = methods or ['POST']
    methods_set = set(m.upper() for m in methods)

    matching = [
        r for r in app.url_map.iter_rules()
        if r.rule == rule and (methods_set & (r.methods or set()))
    ]
    if not matching:
        # No existing route — register fresh under a CBL-prefixed endpoint.
        endpoint = f"cbl_{view_func.__name__}"
        app.add_url_rule(rule, endpoint=endpoint, view_func=view_func, methods=methods)
        return

    for r in matching:
        # Replace the handler under the original endpoint name so all
        # internal references (url_for, _rules_by_endpoint, etc.) stay valid.
        app.view_functions[r.endpoint] = view_func


# ============================================================================
# CBL-routed endpoint overrides
# ============================================================================

# ── 4: save-analyzer ────────────────────────────────────────────────────────
def save_analyzer():
    """Save analyzer report. CBL when STORAGE_BACKEND=cbl, else CB Server."""
    try:
        data = request.json or {}
        request_id = data.get('requestId')
        # Frontend may send analyzerData or data
        analyzer_data = data.get('analyzerData') or data.get('data') or {}
        name = data.get('name') or 'Untitled'

        if backend() == "cbl":
            store = storage()
            if not store:
                return jsonify({'success': False, 'error': 'CBL not available'}), 500
            store.save_analyzer(request_id, name, analyzer_data)
            return jsonify({'success': True, 'requestId': request_id, 'backend': 'cbl'})

        # Fallback: external Couchbase Server (legacy v4.x path)
        cluster = get_couchbase_connection(data.get('config', {}))
        if not cluster:
            return jsonify({'success': False, 'error': 'Not connected'}), 500
        bucket_config = data.get('bucketConfig', {})
        bucket = cluster.bucket(bucket_config['bucket'])
        coll = bucket.scope(
            bucket_config.get('analyzerScope', 'query')
        ).collection(bucket_config.get('analyzerCollection', 'analyzer'))
        analyzer_data['createdAt'] = time.time()
        coll.upsert(request_id, analyzer_data)
        return jsonify({'success': True, 'requestId': request_id, 'backend': 'server'})

    except Exception as e:
        ic("❌ save_analyzer", e)
        return jsonify({'success': False, 'error': str(e)}), 500


# ── 5: load-analyzer ────────────────────────────────────────────────────────
def load_analyzer(request_id):
    try:
        if backend() == "cbl":
            store = storage()
            if not store:
                return jsonify({'success': False, 'error': 'CBL not available'}), 500
            doc = store.load_analyzer(request_id)
            if not doc:
                return jsonify({'success': False, 'error': 'Not found'}), 404
            return jsonify({'success': True, 'data': doc, 'backend': 'cbl'})

        data = request.json or {}
        cluster = get_couchbase_connection(data.get('config', {}))
        if not cluster:
            return jsonify({'success': False, 'error': 'Not connected'}), 500
        bucket_config = data.get('bucketConfig', {})
        bucket = cluster.bucket(bucket_config['bucket'])
        coll = bucket.scope(
            bucket_config.get('analyzerScope', 'query')
        ).collection(bucket_config.get('analyzerCollection', 'analyzer'))
        try:
            result = coll.get(request_id)
            return jsonify({
                'success': True,
                'data': result.content_as[dict],
                'backend': 'server',
            })
        except Exception:
            return jsonify({'success': False, 'error': 'Not found'}), 404

    except Exception as e:
        ic("❌ load_analyzer", e)
        return jsonify({'success': False, 'error': str(e)}), 500


# ── 6: delete-analyzer ──────────────────────────────────────────────────────
def delete_analyzer():
    try:
        data = request.json or {}
        request_id = data.get('requestId')

        if backend() == "cbl":
            store = storage()
            if not store:
                return jsonify({'success': False, 'error': 'CBL not available'}), 500
            ok = store.delete_analyzer(request_id)
            if not ok:
                return jsonify({'success': False, 'error': 'Not found'}), 404
            return jsonify({'success': True, 'backend': 'cbl'})

        cluster = get_couchbase_connection(data.get('config', {}))
        if not cluster:
            return jsonify({'success': False, 'error': 'Not connected'}), 500
        bucket_config = data.get('bucketConfig', {})
        bucket = cluster.bucket(bucket_config['bucket'])
        coll = bucket.scope(
            bucket_config.get('analyzerScope', 'query')
        ).collection(bucket_config.get('analyzerCollection', 'analyzer'))
        try:
            coll.remove(request_id)
            return jsonify({'success': True, 'backend': 'server'})
        except Exception:
            return jsonify({'success': False, 'error': 'Not found'}), 404

    except Exception as e:
        ic("❌ delete_analyzer", e)
        return jsonify({'success': False, 'error': str(e)}), 500


# ── 7: save-preferences ─────────────────────────────────────────────────────
def save_preferences():
    try:
        data = request.json or {}
        user_id = data.get('userId')
        prefs = data.get('preferences', {})

        if backend() == "cbl":
            store = storage()
            if not store:
                return jsonify({'success': False, 'error': 'CBL not available'}), 500
            store.save_preferences(user_id, prefs)
            return jsonify({'success': True, 'userId': user_id, 'backend': 'cbl'})

        cluster = get_couchbase_connection(data.get('config', {}))
        if not cluster:
            return jsonify({'success': False, 'error': 'Not connected'}), 500
        bucket_config = data.get('bucketConfig', {})
        bucket = cluster.bucket(bucket_config['bucket'])
        coll = bucket.scope(
            bucket_config.get('preferencesScope', '_default')
        ).collection(bucket_config.get('preferencesCollection', '_default'))
        prefs['updatedAt'] = time.time()
        result = coll.upsert(user_id, prefs)
        return jsonify({
            'success': True,
            'userId': user_id,
            'cas': getattr(result, 'cas', None),
            'backend': 'server',
        })

    except Exception as e:
        ic("❌ save_preferences", e)
        return jsonify({'success': False, 'error': str(e)}), 500


# ── 8: load-preferences ─────────────────────────────────────────────────────
def load_preferences(user_id):
    try:
        if backend() == "cbl":
            store = storage()
            if not store:
                return jsonify({'success': False, 'error': 'CBL not available'}), 500
            prefs = store.load_preferences(user_id)
            if prefs is None:
                # First-time user: empty config
                return jsonify({
                    'success': True,
                    'data': {'docType': 'config'},
                    'firstTime': True,
                    'backend': 'cbl',
                })
            return jsonify({'success': True, 'data': prefs, 'backend': 'cbl'})

        data = request.json or {}
        cluster = get_couchbase_connection(data.get('config', {}))
        if not cluster:
            return jsonify({'success': False, 'error': 'Not connected'}), 500
        bucket_config = data.get('bucketConfig', {})
        bucket = cluster.bucket(bucket_config['bucket'])
        coll = bucket.scope(
            bucket_config.get('preferencesScope', '_default')
        ).collection(bucket_config.get('preferencesCollection', '_default'))
        try:
            result = coll.get(user_id)
            return jsonify({
                'success': True,
                'data': result.content_as[dict],
                'cas': getattr(result, 'cas', None),
                'backend': 'server',
            })
        except Exception:
            return jsonify({
                'success': True,
                'data': {'docType': 'config'},
                'firstTime': True,
                'backend': 'server',
            })

    except Exception as e:
        ic("❌ load_preferences", e)
        return jsonify({'success': False, 'error': str(e)}), 500


# ── 13: ai/status — poll AI analysis status from analyzer collection ────────
def ai_status(document_id):
    if backend() != "cbl":
        # Legacy CB-Server path stays in app_base; we don't override.
        # But since we registered an override here, also delegate to it on
        # server backend for consistency: just return a not-implemented marker.
        return jsonify({
            'success': False,
            'error': 'ai_status with server backend handled by app_base',
        }), 501
    store = storage()
    if not store:
        return jsonify({'success': False, 'error': 'CBL not available'}), 500

    # AI analysis docs are written by background_ai_task via store.save_analyzer
    # into COLL_ANALYZER, not COLL_AI_HISTORY. Read from there.
    doc = store.load_analyzer(document_id)
    ic(f"🔎 [ai_status] load_analyzer({document_id}) → {bool(doc)}; "
       f"keys={list(doc.keys()) if doc else None}")
    if not doc:
        return jsonify({'success': False, 'status': 'not_found'}), 404

    status = doc.get('status', 'unknown')
    response = {
        'success': True,
        'status': status,
        'document_id': document_id,
        'backend': 'cbl',
    }
    if status == 'completed':
        response['elapsed_ms'] = (doc.get('metadata') or {}).get('elapsed_ms', 0)
    elif status == 'failed':
        response['error'] = doc.get('error') or {'message': 'Unknown error'}
    return jsonify(response)


# ── 27: ai/history — list AI runs (optionally per-cluster) ──────────────────
def ai_history():
    try:
        data = request.json or {}
        cluster_name = data.get('clusterName') or data.get('cluster')
        limit = int(data.get('limit', 50))
        offset = int(data.get('offset', 0))

        if backend() == "cbl":
            store = storage()
            if not store:
                return jsonify({'success': False, 'error': 'CBL not available'}), 500

            # AI analyses are stored in COLL_ANALYZER (via save_analyzer) with
            # docType='ai_analysis' inside the blob. Scan and project the
            # fields the frontend needs.
            listing = store.list_analyzers(limit=limit * 4 + 10, offset=offset)
            shells = listing.get('rows', []) if isinstance(listing, dict) else []
            rows = []
            for shell in shells:
                doc_id = shell.get('id')
                if not doc_id:
                    continue
                blob = store.load_analyzer(doc_id)
                if not blob or blob.get('docType') != 'ai_analysis':
                    continue
                if cluster_name and blob.get('sourceCluster') != cluster_name:
                    continue
                rows.append({
                    'documentId': doc_id,
                    'createdAt': blob.get('createdAt'),
                    'provider': blob.get('provider'),
                    'status': blob.get('status'),
                    'prompt': blob.get('prompt'),
                    'sourceCluster': blob.get('sourceCluster'),
                    'metadata': blob.get('metadata'),
                    'filters': (blob.get('parseJson') or {}).get('filters'),
                })
                if len(rows) >= limit:
                    break
            return jsonify({
                'success': True,
                'backend': 'cbl',
                'results': rows,
                'count': len(rows),
                'limit': limit,
                'offset': offset,
            })

        # Server backend: not re-implemented here; defer to legacy.
        return jsonify({
            'success': False,
            'error': 'ai_history with server backend handled by app_base',
        }), 501

    except Exception as e:
        ic("❌ ai_history", e)
        return jsonify({'success': False, 'error': str(e)}), 500


# ── ai/cancel — cancel a running AI analysis (CBL-aware) ────────────────────
def ai_cancel():
    try:
        from datetime import datetime
        data = request.json or {}
        doc_id = data.get('document_id')
        if not doc_id:
            return jsonify({'success': False, 'error': 'Missing document_id'}), 400

        if backend() == "cbl":
            store = storage()
            if not store:
                return jsonify({'success': False, 'error': 'CBL not available'}), 500
            doc = store.load_analyzer(doc_id)
            if not doc:
                return jsonify({'success': False, 'error': 'Document not found'}), 404
            current_status = doc.get('status')
            if current_status not in ('pending', 'submitted', 'processing'):
                return jsonify({
                    'success': False,
                    'error': f'Cannot cancel status: {current_status}',
                })
            doc['status'] = 'cancelled'
            doc['cancelledAt'] = datetime.utcnow().isoformat() + 'Z'
            store.save_analyzer(doc_id, doc.get('prompt') or 'AI Analysis', doc)
            ic(f"🚫 [cbl] Cancelled analysis: {doc_id}")
            return jsonify({'success': True, 'status': 'cancelled', 'backend': 'cbl'})

        # Server backend: defer to legacy app_base implementation.
        return jsonify({
            'success': False,
            'error': 'ai_cancel with server backend handled by app_base',
        }), 501
    except Exception as e:
        ic("❌ ai_cancel", e)
        return jsonify({'success': False, 'error': str(e)}), 500


# ── 28: ai/clusters — list distinct sourceCluster from analyzer collection ──
def ai_clusters():
    try:
        if backend() == "cbl":
            store = storage()
            if not store:
                return jsonify({'success': False, 'error': 'CBL not available'}), 500

            data = request.json or {}
            term = (data.get('term') or '').lower()

            listing = store.list_analyzers(limit=500, offset=0)
            shells = listing.get('rows', []) if isinstance(listing, dict) else []
            seen = []
            for shell in shells:
                doc_id = shell.get('id')
                if not doc_id:
                    continue
                blob = store.load_analyzer(doc_id)
                if not blob or blob.get('docType') != 'ai_analysis':
                    continue
                src = blob.get('sourceCluster')
                if not src:
                    continue
                if term and term not in src.lower():
                    continue
                if src not in seen:
                    seen.append(src)
                if len(seen) >= 10:
                    break
            seen.sort()
            return jsonify({
                'success': True,
                'results': seen,
                'clusters': seen,
                'backend': 'cbl',
            })
        return jsonify({
            'success': False,
            'error': 'ai_clusters with server backend handled by app_base',
        }), 501
    except Exception as e:
        ic("❌ ai_clusters", e)
        return jsonify({'success': False, 'error': str(e)}), 500


# ── 14: ai/stats — aggregate over ai_history ────────────────────────────────
def ai_stats():
    if backend() != "cbl":
        return jsonify({
            'success': False,
            'error': 'ai_stats with server backend handled by app_base',
        }), 501
    store = storage()
    if not store:
        return jsonify({'success': False, 'error': 'CBL not available'}), 500
    rows = store.query(
        "SELECT provider, COUNT(*) AS runs, "
        "SUM(tokens_in) AS tokens_in, SUM(tokens_out) AS tokens_out "
        "FROM cb_tools.ai_history "
        "WHERE type = 'ai_history' "
        "GROUP BY provider"
    )
    return jsonify({'success': True, 'rows': rows, 'backend': 'cbl'})


# ── 15-18: payload-reference ─────────────────────────────────────────────────
def payload_reference_get():
    if backend() != "cbl":
        return jsonify({
            'success': False,
            'error': 'payload_reference with server backend handled by app_base',
        }), 501
    store = storage()
    if not store:
        return jsonify({'success': False, 'error': 'CBL not available'}), 500
    data = store.get_payload_reference()
    if data is None:
        return jsonify({'success': False, 'error': 'Not found'}), 404
    return jsonify({'success': True, 'data': data, 'backend': 'cbl'})


def payload_reference_load():
    return payload_reference_get()


def payload_reference_seed():
    if backend() != "cbl":
        return jsonify({
            'success': False,
            'error': 'payload_reference seed handled by app_base for server',
        }), 501
    store = storage()
    if not store:
        return jsonify({'success': False, 'error': 'CBL not available'}), 500
    template = os.path.join(DIRECTORY, 'payload_reference.json.template')
    ok = store.seed_from_template('payload_reference', template)
    return jsonify({'success': ok, 'backend': 'cbl'})


def payload_reference_save():
    if backend() != "cbl":
        return jsonify({
            'success': False,
            'error': 'payload_reference save handled by app_base for server',
        }), 501
    data = request.json or {}
    body = data.get('data', data)
    store = storage()
    if not store:
        return jsonify({'success': False, 'error': 'CBL not available'}), 500
    store.save_payload_reference(body)
    return jsonify({'success': True, 'backend': 'cbl'})


# ── 20-23: models ────────────────────────────────────────────────────────────
def models_get():
    if backend() != "cbl":
        return jsonify({
            'success': False,
            'error': 'models with server backend handled by app_base',
        }), 501
    store = storage()
    if not store:
        return jsonify({'success': False, 'error': 'CBL not available'}), 500
    data = store.get_models_list()
    if data is None:
        return jsonify({'success': False, 'error': 'Not found'}), 404
    return jsonify({'success': True, 'data': data, 'backend': 'cbl'})


def models_load():
    return models_get()


def models_seed():
    if backend() != "cbl":
        return jsonify({
            'success': False,
            'error': 'models seed handled by app_base for server',
        }), 501
    store = storage()
    if not store:
        return jsonify({'success': False, 'error': 'CBL not available'}), 500
    template = os.path.join(DIRECTORY, 'ai_models_list.json.template')
    ok = store.seed_from_template('models_list', template)
    return jsonify({'success': ok, 'backend': 'cbl'})


def models_save():
    if backend() != "cbl":
        return jsonify({
            'success': False,
            'error': 'models save handled by app_base for server',
        }), 501
    data = request.json or {}
    body = data.get('data', data)
    store = storage()
    if not store:
        return jsonify({'success': False, 'error': 'CBL not available'}), 500
    store.save_models_list(body)
    return jsonify({'success': True, 'backend': 'cbl'})


# ============================================================================
# Storage admin (CBL-only) — new endpoints
# ============================================================================

def storage_info():
    if backend() != "cbl":
        return jsonify({
            'success': False,
            'error': 'Storage info only available for CBL backend',
        }), 400
    store = storage()
    if not store:
        return jsonify({'success': False, 'error': 'CBL not available'}), 500
    return jsonify({'success': True, 'stats': store.stats(), 'backend': 'cbl'})


def storage_maintenance():
    if backend() != "cbl":
        return jsonify({
            'success': False,
            'error': 'Maintenance only available for CBL backend',
        }), 400
    store = storage()
    if not store:
        return jsonify({'success': False, 'error': 'CBL not available'}), 500
    op = (request.json or {}).get('operation', 'compact')
    return jsonify({'success': True, 'result': store.maintenance(op), 'backend': 'cbl'})


def storage_export():
    if backend() != "cbl":
        return jsonify({
            'success': False,
            'error': 'Export only available for CBL backend',
        }), 400
    store = storage()
    if not store:
        return jsonify({'success': False, 'error': 'CBL not available'}), 500
    path = store.export()
    return send_file(
        path,
        as_attachment=True,
        download_name=os.path.basename(path),
        mimetype='application/gzip',
    )


def storage_import():
    if backend() != "cbl":
        return jsonify({
            'success': False,
            'error': 'Import only available for CBL backend',
        }), 400
    if 'file' not in request.files:
        return jsonify({'success': False, 'error': 'No file provided'}), 400
    store = storage()
    if not store:
        return jsonify({'success': False, 'error': 'CBL not available'}), 500
    result = store.import_from(request.files['file'])
    return jsonify({'success': True, 'result': result, 'backend': 'cbl'})


# ============================================================================
# Wire overrides into the imported app
# ============================================================================

# 4-8: data persistence (cb_tools bucket → CBL collections)
_override_route('/api/couchbase/save-analyzer', save_analyzer, methods=['POST'])
_override_route('/api/couchbase/load-analyzer/<request_id>', load_analyzer, methods=['POST'])
_override_route('/api/couchbase/delete-analyzer', delete_analyzer, methods=['POST'])
_override_route('/api/couchbase/save-preferences', save_preferences, methods=['POST'])
_override_route('/api/couchbase/load-preferences/<user_id>', load_preferences, methods=['POST'])

# 13, 14, 27, 28: AI history / stats / clusters
_override_route('/api/ai/status/<document_id>', ai_status, methods=['POST'])
_override_route('/api/ai/history', ai_history, methods=['POST'])
_override_route('/api/ai/clusters', ai_clusters, methods=['POST'])
_override_route('/api/ai/stats', ai_stats, methods=['GET'])
_override_route('/api/ai/cancel', ai_cancel, methods=['POST'])

# 15-18: payload-reference family
_override_route('/api/ai/payload-reference', payload_reference_get, methods=['GET'])
_override_route('/api/ai/payload-reference/load', payload_reference_load, methods=['POST'])
_override_route('/api/ai/payload-reference/seed', payload_reference_seed, methods=['POST'])
_override_route('/api/ai/payload-reference/save', payload_reference_save, methods=['POST'])

# 20-23: models family
_override_route('/api/ai/models', models_get, methods=['GET'])
_override_route('/api/ai/models/load', models_load, methods=['POST'])
_override_route('/api/ai/models/seed', models_seed, methods=['POST'])
_override_route('/api/ai/models/save', models_save, methods=['POST'])

# Server Edition v5.0.0: the analyzer index.html lives directly at
# DIRECTORY/index.html (/app/index.html in the container), so app_base's
# default `/` route already serves it. No override needed.

# 31-34: storage admin (NEW endpoints, no override needed; just add)
app.add_url_rule(
    '/api/storage/info', endpoint='cbl_storage_info',
    view_func=storage_info, methods=['GET']
)
app.add_url_rule(
    '/api/storage/maintenance', endpoint='cbl_storage_maintenance',
    view_func=storage_maintenance, methods=['POST']
)
app.add_url_rule(
    '/api/storage/export', endpoint='cbl_storage_export',
    view_func=storage_export, methods=['GET']
)
app.add_url_rule(
    '/api/storage/import', endpoint='cbl_storage_import',
    view_func=storage_import, methods=['POST']
)


# ============================================================================
# Server startup
# ============================================================================

if __name__ == '__main__':
    PORT = get_server_port(default=8080)
    ic("🚀 Starting Couchbase Query Analyzer v5.0.0")
    ic(f"📊 Backend: {backend()}")
    ic(f"🔌 Listening on http://localhost:{PORT}")
    app.run(
        host='0.0.0.0',
        port=PORT,
        debug=False,
        use_reloader=False,
    )
