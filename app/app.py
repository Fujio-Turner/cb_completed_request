#!/usr/bin/env python3
"""
Flask HTTP server for Couchbase Query Analyzer v4.0.0-Beta (Liquid)

Embedded Couchbase Lite (CE) is now the only persistence layer for the app;
the external Couchbase Server SDK has been removed. Source data is provided
by JSON upload only — the app no longer connects out to a user cluster.

Architecture:
- ``app_base.py`` provides the Flask app object plus endpoints that don't
  touch storage (preview, AI provider test, etc.). All cluster-backed
  endpoints have been deleted.
- This module ("app.py") **overrides** the cb_tools endpoints with CBL-backed
  implementations using ``CBLStore`` and adds new ``/api/storage/*`` endpoints
  for CBL-only maintenance, info, export and import.

See app/docs/work/03_APP_PY_REFACTOR.md for the endpoint mapping.
"""

# Configure logging FIRST, before any other imports (must be first non-stdlib)
from logging_config import configure_logging
configure_logging()

import logging
logger = logging.getLogger(__name__)

import os
import time
import json
from typing import Optional
from icecream import ic

from flask import jsonify, request, send_file

# ----------------------------------------------------------------------------
# Global version constant — single source of truth for the running app.
# Bump this in every release per app/guides/RELEASE.md. The startup banner
# below reads from __version__, and downstream modules / endpoints can
# `from app import __version__` if they need to surface it.
# ----------------------------------------------------------------------------
__version__ = "4.0.0-Beta.2"

# Import the base app (registers Flask app + endpoints that don't depend on
# the external Couchbase Server SDK). All app data persistence now flows
# through the embedded Couchbase Lite (CBL) store; the cluster-backed code
# paths have been deleted.
from app_base import app, DIRECTORY, PORT  # noqa: F401

import blob_storage

# Print startup banner on module import (works with gunicorn + development)
# This runs once when the app is initialized, before any requests arrive.
print(f"🚀 Starting Couchbase Query Analyzer v{__version__}")
print("📊 Backend: cbl (embedded Couchbase Lite)")
print(f"🌐 Open http://localhost:{PORT} in your browser")
print()
logger.info("startup version=%s port=%d", __version__, PORT)

# Try to import CBL store
try:
    from cbl_store import CBLStore, USE_CBL
    CBL_AVAILABLE = True
except ImportError as e:
    CBL_AVAILABLE = False
    USE_CBL = False
    logger.warning("cbl store unavailable: %s", e)


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
            logger.info("loaded server config path=%s", path)
            return data if isinstance(data, dict) else {}
        except Exception as e:
            logger.warning("failed to read config path=%s: %s", path, e)
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
            logger.warning("ignoring invalid PORT env var=%s", env)
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
        logger.info("cbl storage initialized")
    return _cbl_store


def get_blobs() -> Optional[blob_storage.BlobStorage]:
    """Return the singleton blob storage facade backed by CBLStore."""
    global _cbl_blobs
    if not CBL_AVAILABLE:
        return None
    if _cbl_blobs is None:
        _cbl_blobs = blob_storage.BlobStorage(storage())
        logger.info("blob storage initialized")
    return _cbl_blobs


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
    """Save analyzer report to embedded Couchbase Lite."""
    try:
        data = request.json or {}
        request_id = data.get('requestId')
        # Frontend may send analyzerData or data
        analyzer_data = data.get('analyzerData') or data.get('data') or {}
        name = data.get('name') or 'Untitled'

        store = storage()
        if not store:
            return jsonify({'success': False, 'error': 'CBL not available'}), 500
        store.save_analyzer(request_id, name, analyzer_data)
        return jsonify({'success': True, 'requestId': request_id, 'backend': 'cbl'})

    except Exception as e:
        logger.exception("save_analyzer failed")
        return jsonify({'success': False, 'error': str(e)}), 500


# ── 5: load-analyzer ────────────────────────────────────────────────────────
def load_analyzer(request_id):
    try:
        store = storage()
        if not store:
            return jsonify({'success': False, 'error': 'CBL not available'}), 500
        doc = store.load_analyzer(request_id)
        if not doc:
            return jsonify({'success': False, 'error': 'Not found'}), 404
        return jsonify({'success': True, 'data': doc, 'backend': 'cbl'})

    except Exception as e:
        logger.exception("load_analyzer failed")
        return jsonify({'success': False, 'error': str(e)}), 500


# ── 6: delete-analyzer ──────────────────────────────────────────────────────
def delete_analyzer():
    try:
        data = request.json or {}
        request_id = data.get('requestId')

        store = storage()
        if not store:
            return jsonify({'success': False, 'error': 'CBL not available'}), 500
        ok = store.delete_analyzer(request_id)
        if not ok:
            return jsonify({'success': False, 'error': 'Not found'}), 404
        return jsonify({'success': True, 'backend': 'cbl'})

    except Exception as e:
        logger.exception("delete_analyzer failed")
        return jsonify({'success': False, 'error': str(e)}), 500


# ── 7: save-preferences ─────────────────────────────────────────────────────
def save_preferences():
    try:
        data = request.json or {}
        user_id = data.get('userId')
        prefs = data.get('preferences', {})

        store = storage()
        if not store:
            return jsonify({'success': False, 'error': 'CBL not available'}), 500
        store.save_preferences(user_id, prefs)
        return jsonify({'success': True, 'userId': user_id, 'backend': 'cbl'})

    except Exception as e:
        logger.exception("save_preferences failed")
        return jsonify({'success': False, 'error': str(e)}), 500


# ── 8: load-preferences ─────────────────────────────────────────────────────
def load_preferences(user_id):
    try:
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

    except Exception as e:
        logger.exception("load_preferences failed")
        return jsonify({'success': False, 'error': str(e)}), 500


# ── 13: ai/status — poll AI analysis status from analyzer collection ────────
def ai_status(document_id):
    store = storage()
    if not store:
        return jsonify({'success': False, 'error': 'CBL not available'}), 500

    # AI analysis docs are written by background_ai_task via store.save_analyzer
    # into COLL_ANALYZER, not COLL_AI_HISTORY. Read from there.
    doc = store.load_analyzer(document_id)
    logger.debug("ai_status loaded doc=%s keys=%s", bool(doc), list(doc.keys()) if doc else None)
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

    except Exception as e:
        logger.exception("ai_history failed")
        return jsonify({'success': False, 'error': str(e)}), 500


# ── ai/cancel — cancel a running AI analysis (CBL-only) ────────────────────
def ai_cancel():
    try:
        from datetime import datetime
        data = request.json or {}
        doc_id = data.get('document_id')
        if not doc_id:
            return jsonify({'success': False, 'error': 'Missing document_id'}), 400

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
        logger.info("cancelled analysis doc_id=%s", doc_id)
        return jsonify({'success': True, 'status': 'cancelled', 'backend': 'cbl'})
    except Exception as e:
        logger.exception("ai_cancel failed")
        return jsonify({'success': False, 'error': str(e)}), 500


# ── 28: ai/clusters — list distinct sourceCluster from analyzer collection ──
def ai_clusters():
    try:
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
    except Exception as e:
        logger.exception("ai_clusters failed")
        return jsonify({'success': False, 'error': str(e)}), 500


# ── 14: ai/stats — aggregate over ai_history ────────────────────────────────
def ai_stats():
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
    store = storage()
    if not store:
        return jsonify({'success': False, 'error': 'CBL not available'}), 500
    template = os.path.join(DIRECTORY, 'payload_reference.json.template')
    ok = store.seed_from_template('payload_reference', template)
    return jsonify({'success': ok, 'backend': 'cbl'})


def payload_reference_save():
    data = request.json or {}
    body = data.get('data', data)
    store = storage()
    if not store:
        return jsonify({'success': False, 'error': 'CBL not available'}), 500
    store.save_payload_reference(body)
    return jsonify({'success': True, 'backend': 'cbl'})


# ── 20-23: models ────────────────────────────────────────────────────────────
def models_get():
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
    store = storage()
    if not store:
        return jsonify({'success': False, 'error': 'CBL not available'}), 500
    template = os.path.join(DIRECTORY, 'ai_models_list.json.template')
    ok = store.seed_from_template('models_list', template)
    return jsonify({'success': ok, 'backend': 'cbl'})


def models_save():
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
    store = storage()
    if not store:
        return jsonify({'success': False, 'error': 'CBL not available'}), 500
    return jsonify({'success': True, 'stats': store.stats(), 'backend': 'cbl'})


def storage_maintenance():
    store = storage()
    if not store:
        return jsonify({'success': False, 'error': 'CBL not available'}), 500
    op = (request.json or {}).get('operation', 'compact')
    return jsonify({'success': True, 'result': store.maintenance(op), 'backend': 'cbl'})


def storage_export():
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
    if 'file' not in request.files:
        return jsonify({'success': False, 'error': 'No file provided'}), 400
    store = storage()
    if not store:
        return jsonify({'success': False, 'error': 'CBL not available'}), 500
    result = store.import_from(request.files['file'])
    return jsonify({'success': True, 'result': result, 'backend': 'cbl'})


# ============================================================================
# Logging admin (log file info + download) — new endpoints
# ============================================================================

import pathlib
import datetime

def _human_bytes(size_bytes: int) -> str:
    """Convert bytes to human-readable format (B, KB, MB, GB)."""
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if size_bytes < 1024:
            num = f"{size_bytes:.1f}".rstrip('0').rstrip('.')
            return f"{num} {unit}"
        size_bytes /= 1024
    num = f"{size_bytes:.1f}".rstrip('0').rstrip('.')
    return f"{num} PB"


def _caps_from_env() -> dict:
    """Read logging configuration from environment variables."""
    return {
        'max_size_mb': int(os.environ.get('CBQA_LOG_MAX_SIZE_MB', 50)),
        'max_age_days': int(os.environ.get('CBQA_LOG_MAX_AGE_DAYS', 7)),
        'rotated_total_mb': int(os.environ.get('CBQA_LOG_ROTATED_TOTAL_MB', 500)),
    }


def logging_info():
    """Get logging configuration and rotated file inventory."""
    from logging_config import _default_log_file
    
    path = os.environ.get('CBQA_LOG_FILE', _default_log_file())
    if not path or path.lower() in ('off', 'none', '0'):
        return jsonify({
            'level': logging.getLevelName(logging.getLogger().level),
            'json_mode': os.environ.get('CBQA_LOG_JSON') == '1',
            'active_file': None,
            'rotated_files': [],
            'rotated_total_bytes': 0,
            'caps': _caps_from_env(),
        })
    
    base = pathlib.Path(path)
    
    # Find rotated files matching the pattern *.YYYYMMDD-HHMMSS.log
    try:
        rotated = sorted(
            base.parent.glob(f"{base.name}.*"),
            key=lambda p: p.stat().st_mtime,
            reverse=True
        )
    except (OSError, PermissionError) as e:
        logger.warning("failed to list rotated logs: %s", e)
        rotated = []
    
    rotated_info = []
    for p in rotated:
        try:
            rotated_info.append({
                'path': str(p),
                'size_bytes': p.stat().st_size,
                'size_human': _human_bytes(p.stat().st_size),
                'mtime': datetime.datetime.fromtimestamp(
                    p.stat().st_mtime,
                    tz=datetime.timezone.utc
                ).isoformat(),
            })
        except (OSError, PermissionError) as e:
            logger.warning("failed to stat rotated log %s: %s", p, e)
    
    # Get active file stats
    active = None
    try:
        if base.exists():
            active = {
                'path': str(base),
                'size_bytes': base.stat().st_size,
                'size_human': _human_bytes(base.stat().st_size),
            }
    except (OSError, PermissionError) as e:
        logger.warning("failed to stat active log: %s", e)
    
    return jsonify({
        'level': logging.getLevelName(logging.getLogger().level),
        'json_mode': os.environ.get('CBQA_LOG_JSON') == '1',
        'active_file': active,
        'rotated_files': rotated_info,
        'rotated_total_bytes': sum(r['size_bytes'] for r in rotated_info),
        'caps': _caps_from_env(),
    })


def logging_active_log():
    """Download the active log file."""
    from logging_config import _default_log_file
    
    path = os.environ.get('CBQA_LOG_FILE', _default_log_file())
    if not path or not pathlib.Path(path).exists():
        return jsonify({
            'success': False,
            'error': 'logging is disabled or no active file'
        }), 404
    
    return send_file(
        path,
        mimetype='text/plain',
        as_attachment=True,
        download_name='cbqa.log'
    )


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

# Server Edition (v4.0.0-Beta): the analyzer index.html lives directly at
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

# 35-36: logging admin (NEW endpoints)
app.add_url_rule(
    '/api/logging/info', endpoint='logging_info',
    view_func=logging_info, methods=['GET']
)
app.add_url_rule(
    '/api/logging/active-log', endpoint='logging_active_log',
    view_func=logging_active_log, methods=['GET']
)


# ============================================================================
# Server startup
# ============================================================================

def _startup_banner(port: int) -> None:
    """Print and log the startup banner."""
    msg_version = f"🚀 Starting Couchbase Query Analyzer v{__version__}"
    msg_backend = "📊 Backend: cbl (embedded Couchbase Lite)"
    msg_listen = f"🔌 Listening on http://localhost:{port}"

    # User-facing banner (always visible on the controlling terminal).
    print(msg_version)
    print(msg_backend)
    print(msg_listen)

    # Same events into the structured log (file/JSON shipper).
    logger.info("starting cbqa version=%s", __version__)
    logger.info("backend=%s", "cbl")
    logger.info("listening port=%d", port)


if __name__ == '__main__':
    import sys
    import threading
    import webbrowser

    PORT = get_server_port(default=8080)
    _startup_banner(PORT)

    # ------------------------------------------------------------------
    # When launched as a standalone desktop app (PyInstaller .app / .exe),
    # this `__main__` block runs. Under gunicorn/Docker the module is
    # *imported* and this block is skipped, so the desktop UX (auto-open
    # browser + tray icon) is safe.
    # ------------------------------------------------------------------

    # Auto-open browser on launch. Disable with CBQA_NO_BROWSER=1.
    if os.environ.get('CBQA_NO_BROWSER', '').lower() not in ('1', 'true', 'yes'):
        def _open_browser():
            url = f"http://localhost:{PORT}"
            print(f"🌐 Opening {url} in your default browser…")
            try:
                webbrowser.open(url)
            except Exception as e:  # pragma: no cover — best-effort UX
                logger.warning("could not auto-open browser: %s", e)

        # Give Flask ~1.2s to bind the port before the browser hits it.
        threading.Timer(1.2, _open_browser).start()

    # ------------------------------------------------------------------
    # Tray icon (menubar on macOS, system tray on Windows).
    # Enabled by default for PyInstaller-frozen builds (sys.frozen=True),
    # off by default for source runs (devs use Ctrl+C).
    # Force on/off with CBQA_TRAY=1 / CBQA_NO_TRAY=1.
    # ------------------------------------------------------------------
    _tray_env = os.environ.get('CBQA_TRAY', '').lower()
    _no_tray_env = os.environ.get('CBQA_NO_TRAY', '').lower()
    if _no_tray_env in ('1', 'true', 'yes'):
        _use_tray = False
    elif _tray_env in ('1', 'true', 'yes'):
        _use_tray = True
    else:
        _use_tray = bool(getattr(sys, 'frozen', False))  # PyInstaller bundle

    if _use_tray:
        try:
            from tray import run_tray, is_supported
        except Exception as e:  # pragma: no cover
            logger.warning("tray module unavailable: %s", e)
            run_tray = None
            is_supported = lambda: False  # noqa: E731

        if is_supported():
            print("🧭 Launching menubar/tray icon — use it to Quit cleanly.")
            # Flask runs on a daemon thread so the tray library can own the
            # main thread (NSApplication requirement on macOS).
            flask_thread = threading.Thread(
                target=lambda: app.run(
                    host='0.0.0.0',
                    port=PORT,
                    debug=False,
                    use_reloader=False,
                ),
                daemon=True,
                name='flask-server',
            )
            flask_thread.start()

            tray_ok = run_tray(PORT) if run_tray else False
            if not tray_ok:
                # Tray failed to start — fall back to blocking on Flask so
                # the process doesn't exit immediately when daemon thread
                # is the only thing running.
                logger.warning("tray failed; blocking on Flask thread")
                flask_thread.join()
            # Tray exited cleanly → process is shutting down; nothing else
            # to do. (run_tray's Quit handler already calls os._exit.)
        else:
            # Unsupported platform (e.g. Linux desktop) — just run Flask.
            app.run(
                host='0.0.0.0',
                port=PORT,
                debug=False,
                use_reloader=False,
            )
    else:
        app.run(
            host='0.0.0.0',
            port=PORT,
            debug=False,
            use_reloader=False,
        )
