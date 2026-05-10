#!/usr/bin/env python3
"""
Flask HTTP server base — Liquid (v5.0.0) edition.

This module hosts the Flask app object plus the endpoints that don't depend
on the (now removed) external Couchbase Server SDK. The Couchbase Server
``test``/``query``/``check-indexes`` endpoints have been deleted; the
``save-analyzer``/``load-analyzer``/``save-preferences``/``load-preferences``
endpoints are re-registered by ``app.py`` against the embedded
Couchbase Lite store.

All persistent app state now lives in the embedded CBL database
(``cbl_store.py``); source data is provided by JSON upload only.
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import time
from icecream import ic

# Import AI Analyzer module
import ai_analyzer
import sys
ic(sys.executable)

# Import TOON converter
# toon-python lives in a private GitLab repo (not on PyPI). When unavailable
# the app gracefully falls back to JSON for AI payloads. Set SKIP_TOON_INSTALL=1
# to suppress the runtime pip-install fallback (e.g. inside containers where
# the package cannot be fetched anyway).
try:
    import toon_python
    TOON_AVAILABLE = True
except ImportError:
    if os.environ.get('SKIP_TOON_INSTALL', '').lower() in ('1', 'true', 'yes'):
        TOON_AVAILABLE = False
        ic("ℹ️ toon-python not installed (SKIP_TOON_INSTALL set); using JSON fallback")
    else:
        # The original `toon_python` lives in a private GitLab repo and is not
        # publicly installable. The functional public equivalent is the
        # `python-toon` PyPI package, which exposes its API as `import toon`.
        # Install it and alias `toon` -> `toon_python` so the rest of the file
        # can keep using `toon_python` unchanged.
        ic("⚠️ toon-python not installed, attempting runtime install of python-toon...")
        try:
            import subprocess
            subprocess.check_call([sys.executable, "-m", "pip", "install", "python-toon"])
            import toon as _toon_pkg
            sys.modules['toon_python'] = _toon_pkg
            sys.modules['toon_python.encoder'] = _toon_pkg.encoder
            sys.modules['toon_python.decoder'] = _toon_pkg.decoder
            import toon_python  # noqa: F401  (now resolves via the alias above)
            TOON_AVAILABLE = True
            ic("✅ python-toon installed and aliased as toon_python at runtime")
        except Exception as e:
            TOON_AVAILABLE = False
            ic(f"❌ Runtime install failed: {e}")

# Configure icecream
ic.configureOutput(includeContext=True)

# Use port 8888 by default (port 5000 is used by macOS AirPlay Receiver)
# Playwright tests use PORT=5555
PORT = int(os.environ.get('PORT', 8888))

# Handle PyInstaller bundled resources
def get_resource_path():
    """Get the correct resource path for both development and PyInstaller builds"""
    if getattr(sys, 'frozen', False):
        # Running as PyInstaller bundle
        return sys._MEIPASS
    else:
        # Running in development
        return os.path.dirname(os.path.abspath(__file__))

DIRECTORY = get_resource_path()
ic(f"📁 Resource directory: {DIRECTORY}")

app = Flask(__name__, static_folder=DIRECTORY, static_url_path='')
CORS(app)  # Enable CORS for all routes

# ── Embedded Couchbase Lite (the only persistence layer) ────────────────
try:
    from cbl_store import CBLStore, USE_CBL  # type: ignore
except Exception as _cbl_err:  # noqa: BLE001 — CBL bindings might not be present in tests
    CBLStore = None  # type: ignore
    USE_CBL = False

_cbl_store_singleton = None


def _get_cbl_store():
    """Return the CBLStore singleton, or None if the bindings aren't available."""
    global _cbl_store_singleton
    if not USE_CBL or CBLStore is None:
        return None
    if _cbl_store_singleton is None:
        _cbl_store_singleton = CBLStore()
    return _cbl_store_singleton


# Static file serving
@app.route('/')
def index():
    return send_from_directory(DIRECTORY, 'index.html')


# Serve the OpenAPI spec from app/docs/openapi.yaml. Defined before the
# `<path:path>` catch-all so the explicit rule wins. See
# `app/guides/API_OPENAPI.md` for how to extend the spec.
@app.route('/openapi.yaml')
def openapi_spec():
    return send_from_directory(
        os.path.join(DIRECTORY, 'docs'),
        'openapi.yaml',
        mimetype='application/yaml',
    )


# Lightweight version probe — reads the single source of truth in app.py.
# Lazy-imported so importing app_base in isolation doesn't pull app.py.
@app.route('/api/version', methods=['GET'])
def get_version():
    try:
        from app import __version__ as app_version
    except Exception:
        app_version = 'unknown'
    return jsonify({'version': app_version, 'backend': 'cbl'})


# Swagger UI at /api-docs — vendored, no runtime CDN dependency.
# Renders /openapi.yaml as an interactive API explorer with "Try it out".
# See app/guides/API_OPENAPI.md §11.
try:
    from flask_swagger_ui import get_swaggerui_blueprint
    _SWAGGER_URL = '/api-docs'
    app.register_blueprint(
        get_swaggerui_blueprint(
            _SWAGGER_URL,
            '/openapi.yaml',
            config={
                'app_name': 'Couchbase Query Analyzer API',
                'docExpansion': 'list',
                'defaultModelsExpandDepth': 1,
                'displayRequestDuration': True,
            },
        ),
        url_prefix=_SWAGGER_URL,
    )
    ic(f"📘 Swagger UI mounted at {_SWAGGER_URL}")
except ImportError:
    ic("ℹ️ flask-swagger-ui not installed; /api-docs will 404")


@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(DIRECTORY, path)

# API Routes
# Note: /api/couchbase/test, /api/couchbase/check-indexes and
# /api/couchbase/query are gone — the app no longer connects to an external
# Couchbase Server cluster. Source data is JSON-uploaded by the user.
# Note: /api/couchbase/save-analyzer, /api/couchbase/load-analyzer/<id>,
# /api/couchbase/delete-analyzer, /api/couchbase/save-preferences and
# /api/couchbase/load-preferences/<id> used to be defined here against an
# external Couchbase Server cluster. They are now registered by app.py
# against the embedded Couchbase Lite store.

# ============================================================================
# AI Analyzer Endpoints
# ============================================================================

@app.route('/api/ai/cache', methods=['POST'])
def cache_analyzer_data_endpoint():
    """
    Cache analyzer data for AI analysis
    
    Request body:
    {
        "data": {
            "everyQueryData": [...],
            "analysisData": [...],
            "version": "4.0.0-dev",
            ...
        }
    }
    
    Response:
    {
        "success": true,
        "session_id": "abc123..."
    }
    """
    try:
        data = request.json
        ic("💾 Caching analyzer data")
        
        analyzer_data = data.get('data', {})
        
        if not analyzer_data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        # Cache the data and get session ID
        session_id = ai_analyzer.cache_analyzer_data(analyzer_data)
        
        ic(f"✅ Data cached with session_id: {session_id}")
        
        return jsonify({
            'success': True,
            'session_id': session_id
        })
        
    except Exception as e:
        ic("💥 Error caching data", str(e))
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ai/preview', methods=['POST'])
def preview_ai_payload():
    """
    Preview AI payload without sending to provider
    Accepts raw data, processes it, returns formatted JSON for preview
    
    Request body:
    {
        "data": {
            "everyQueryData": [...],
            "analysisData": [...],
            ...
        },
        "prompt": "Analyze slow queries",
        "selections": {
            "dashboard": true,
            "insights": true,
            "query_groups": true,
            "indexes": false,
            "flow_diagram": false,
            "timeline_charts": false
        },
        "options": {
            "obfuscated": true,
            "store_results": false
        }
    }
    
    Response:
    {
        "success": true,
        "payload": {...},
        "size_bytes": 12345,
        "size_kb": 12.05
    }
    """
    global TOON_AVAILABLE
    try:
        request_data = request.json
        ic("👁️ Preview AI payload request received")
        
        # Extract request parameters
        raw_data = request_data.get('data', {})
        prompt = request_data.get('prompt', 'Analyze query performance')
        extra_instructions = request_data.get('extra_instructions', '')
        selections = request_data.get('selections', {})
        options = request_data.get('options', {})
        output_format = request_data.get('format', 'json')
        
        if not raw_data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        ic(f"📊 Data size: {len(str(raw_data))} bytes")
        ic(f"🎯 Selections: {selections}")
        ic(f"📝 Format: {output_format}")
        ic(f"📦 TOON Available: {TOON_AVAILABLE}")
        
        # Build payload from raw data (no caching)
        payload = ai_analyzer.payload_builder.build_payload_from_data(
            raw_data=raw_data,
            user_prompt=prompt,
            selections=selections,
            options=options,
            extra_instructions=extra_instructions
        )
        
        # Get System Prompt for visibility
        system_prompt = ai_analyzer.get_ai_system_prompt(request_data.get('language', 'English'))
        
        # Extract mapping table if obfuscated (don't send to AI, but return to client)
        obfuscation_mapping = payload.pop('_obfuscation_mapping', None)
        
        # Convert to requested format
        import json
        
        # Try dynamic install if not available and requested.
        # `toon-python` does NOT exist on PyPI (it's a private GitLab pkg).
        # The functional public equivalent is `python-toon` (module name `toon`),
        # which we install and alias as `toon_python` to keep call sites unchanged.
        if output_format == 'toon' and not TOON_AVAILABLE:
            ic("⚠️ TOON not loaded, attempting lazy install of python-toon...")
            try:
                import subprocess
                import sys
                subprocess.check_call([sys.executable, "-m", "pip", "install", "python-toon"])
                import toon as _toon_pkg
                sys.modules['toon_python'] = _toon_pkg
                sys.modules['toon_python.encoder'] = _toon_pkg.encoder
                sys.modules['toon_python.decoder'] = _toon_pkg.decoder
                import toon_python
                TOON_AVAILABLE = True
                # Inject into global scope
                globals()['toon_python'] = toon_python
                globals()['TOON_AVAILABLE'] = True
                ic("✅ python-toon installed and aliased as toon_python lazily")
            except Exception as e:
                ic(f"❌ Lazy install failed: {e}")

        if output_format == 'toon' and TOON_AVAILABLE:
            try:
                # Retrieve module safely (handles both global and local import cases)
                import sys
                mod_toon = sys.modules.get('toon_python')
                if not mod_toon:
                    import toon_python as mod_toon

                # Use toon_python.encode directly
                if hasattr(mod_toon, 'encode'):
                    payload_str = mod_toon.encode(payload)
                elif hasattr(mod_toon, 'dumps'):
                    payload_str = mod_toon.dumps(payload)
                else:
                    from toon_python.encoder import encode
                    payload_str = encode(payload)
                    
                ic("✅ Converted payload to TOON")
            except Exception as e:
                ic(f"❌ TOON conversion failed: {e}")
                payload_str = json.dumps(payload, indent=2)
                output_format = 'json (fallback)'
        else:
            payload_str = json.dumps(payload, indent=2)
            
        size_bytes = len(payload_str.encode('utf-8'))
        
        ic(f"✅ Payload preview ready, size={size_bytes} bytes")
        
        response_data = {
            'success': True,
            'payload': payload,
            'payload_text': payload_str,  # Renamed from payload_json to be generic
            'system_prompt': system_prompt, # Include system prompt for visibility
            'format': output_format,
            'size_bytes': size_bytes,
            'size_kb': round(size_bytes / 1024, 2)
        }
        
        # Include mapping table if obfuscated
        if obfuscation_mapping:
            response_data['obfuscation_mapping'] = obfuscation_mapping
            response_data['mapping_count'] = len(obfuscation_mapping)
            ic(f"🔑 Obfuscation mapping: {len(obfuscation_mapping)} tokens")
        
        return jsonify(response_data)
        
    except Exception as e:
        ic("💥 Error previewing payload", str(e))
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

import threading
import re

def _extract_by_path(data: dict, path: str):
    """
    Extract value from nested dict/list using a path string.
    Supports paths like: 'choices[0].message.content', 'content[0].text', 'response'
    
    Args:
        data: The dictionary to extract from
        path: Dot-separated path with optional array indices
        
    Returns:
        The extracted value or None if not found
    """
    if not data or not path:
        return None
    
    try:
        # Split path into parts, handling array indices
        # e.g., "choices[0].message.content" -> ["choices", "[0]", "message", "content"]
        parts = re.split(r'\.|\[', path)
        current = data
        
        for part in parts:
            if not part:
                continue
            
            # Handle array index (closes with ])
            if part.endswith(']'):
                index = int(part[:-1])
                if isinstance(current, list) and len(current) > index:
                    current = current[index]
                else:
                    return None
            else:
                # Handle dict key
                if isinstance(current, dict) and part in current:
                    current = current[part]
                else:
                    return None
        
        return current
    except (KeyError, IndexError, TypeError, ValueError):
        return None


def background_ai_task(doc_id, provider, model, api_key, api_url, endpoint, prompt, ai_payload_data, cb_config, initial_doc, obfuscation_mapping, language=None, custom_config=None):
    """Background thread to process AI request and update the CBL document.

    ``cb_config`` is accepted for backwards compatibility but ignored — all
    persistence now flows through the embedded Couchbase Lite store.
    """
    try:
        import json
        from datetime import datetime

        ic(f"🧵 Starting background AI task for doc {doc_id}")

        # Check if this is a custom AI provider
        if custom_config and custom_config.get('isCustom'):
            ic(f"🔧 Using custom AI provider: {custom_config.get('name')}")
            result = ai_analyzer.call_custom_ai_provider(
                custom_config=custom_config,
                prompt=prompt,
                payload_data=ai_payload_data,
                language=language
            )
        else:
            # Call standard AI provider using ai_analyzer module
            result = ai_analyzer.call_ai_provider(
                provider=provider,
                model=model or ('gpt-4o' if provider == 'openai' else 'claude-3-5-sonnet-20241022'),
                api_key=api_key,
                api_url=api_url,
                endpoint=endpoint,
                prompt=prompt,
                payload_data=ai_payload_data,
                language=language
            )

        ic(f"📥 AI response received for {doc_id}", result.get('success'))

        # Persist via the embedded CBL store — the only supported backend.
        cbl_store_inst = _get_cbl_store()
        if cbl_store_inst is None:
            ic(f"❌ CBL store unavailable; cannot update {doc_id}")
            return

        def _load_doc(_id):
            return cbl_store_inst.load_analyzer(_id) or {}

        def _save_doc(_id, _doc):
            cbl_store_inst.save_analyzer(_id, _doc.get('prompt') or 'AI Analysis', _doc)

        if result['success']:
            analysis_data = result['data']
            
            # Parse JSON content from AI response if it's a string
            try:
                if 'choices' in analysis_data and len(analysis_data['choices']) > 0:
                    # OpenAI/Grok format
                    content = analysis_data['choices'][0].get('message', {}).get('content', '')
                    if isinstance(content, str) and content.strip().startswith('{'):
                        # Parse JSON string to object
                        parsed_content = json.loads(content)
                        analysis_data['choices'][0]['message']['content_parsed'] = parsed_content
                        ic("✅ Parsed OpenAI/Grok AI response JSON content to object")
                elif 'content' in analysis_data and isinstance(analysis_data['content'], list):
                    # Anthropic/Claude format: content[0].text
                    if len(analysis_data['content']) > 0 and 'text' in analysis_data['content'][0]:
                        content = analysis_data['content'][0].get('text', '')
                        # Extract JSON from potential markdown code blocks or preamble
                        json_start = content.find('{')
                        json_end = content.rfind('}')
                        if json_start != -1 and json_end != -1:
                            json_content = content[json_start:json_end + 1]
                            parsed_content = json.loads(json_content)
                            analysis_data['content_parsed'] = parsed_content
                            ic("✅ Parsed Anthropic/Claude AI response JSON content to object")
                elif result.get('isCustomProvider') and result.get('responsePath'):
                    # Custom AI provider - use configured response path
                    response_path = result.get('responsePath')
                    ic(f"🔧 Parsing custom AI response using path: {response_path}")
                    
                    # Parse the response path to extract content
                    content = _extract_by_path(analysis_data, response_path)
                    if content and isinstance(content, str):
                        json_start = content.find('{')
                        json_end = content.rfind('}')
                        if json_start != -1 and json_end != -1:
                            json_content = content[json_start:json_end + 1]
                            parsed_content = json.loads(json_content)
                            analysis_data['content_parsed'] = parsed_content
                            ic("✅ Parsed custom AI response JSON content to object")
            except Exception as e:
                ic(f"⚠️ Could not parse AI content as JSON: {str(e)}")
            
            # De-obfuscate AI response if we have mapping
            if obfuscation_mapping:
                ic("🔓 De-obfuscating AI response")
                obfuscator = ai_analyzer.DataObfuscator()
                
                # Convert analysis to JSON string, de-obfuscate, convert back
                analysis_json = json.dumps(analysis_data)
                deobfuscated_json = obfuscator.deobfuscate_text(analysis_json, obfuscation_mapping)
                analysis_data = json.loads(deobfuscated_json)
                
                ic(f"✅ De-obfuscation complete, restored {len(obfuscation_mapping)} tokens")
            
            # Update doc with success results (CBL or CB Server, via helpers)
            try:
                response_size = len(json.dumps(analysis_data).encode('utf-8'))

                current_doc = _load_doc(doc_id)

                # Check if cancelled
                if current_doc.get('status') == 'cancelled':
                    ic(f"🛑 Task was cancelled, aborting update for {doc_id}")
                    return

                current_doc.update({
                    'completedAt': datetime.utcnow().isoformat() + 'Z',
                    'status': 'completed',
                    'aiResponse': analysis_data,
                    'metadata': {
                        **current_doc.get('metadata', {}),
                        'elapsed_ms': result.get('elapsed_ms'),
                        'responsePayloadSize': response_size
                    }
                })

                _save_doc(doc_id, current_doc)
                ic(f"✅ Updated doc {doc_id} with success results")
            except Exception as e:
                ic(f"⚠️ Failed to update doc with results: {str(e)}")

        else:
            # Update doc with failure (CBL or CB Server, via helpers)
            try:
                current_doc = _load_doc(doc_id)

                current_doc.update({
                    'status': 'failed',
                    'failedAt': datetime.utcnow().isoformat() + 'Z',
                    'error': {
                        'message': result.get('error'),
                        'raw_response': result.get('raw_response'),
                        'status_code': result.get('status_code'),
                        'elapsed_ms': result.get('elapsed_ms'),
                        'attempts': result.get('attempts', 1)
                    }
                })

                _save_doc(doc_id, current_doc)
                ic(f"✅ Updated doc {doc_id} with failure status")
            except Exception as e:
                ic(f"⚠️ Failed to update doc with error: {str(e)}")
                
    except Exception as e:
        import traceback
        ic(f"💥 Unhandled error in background task for {doc_id}", str(e))
        ic(traceback.format_exc())

@app.route('/api/ai/analyze', methods=['POST'])
def analyze_with_ai():
    """
    Analyze query data with AI provider
    Accepts raw data, processes it, sends to AI, returns analysis
    
    Request body:
    {
        "prompt": "Analyze slow queries",
        "provider": "openai",
        "model": "gpt-4o",
        "apiKey": "sk-...",
        "apiUrl": "https://api.openai.com/v1",
        "endpoint": "/chat/completions",
        "selections": {
            "dashboard": true,
            "insights": true,
            "query_groups": true,
            "indexes": false,
            "flow_diagram": false,
            "timeline_charts": false
        },
        "options": {
            "obfuscated": true,
            "store_results": false
        }
    }
    
    Response:
    {
        "success": true,
        "analysis": {...},
        "elapsed_ms": 1234,
        "tokens_used": 5000
    }
    """
    try:
        import json
        
        request_data = request.json
        ic("=" * 80)
        ic("🤖 AI Analysis request received")
        ic("=" * 80)
        
        # Extract parameters
        raw_data = request_data.get('data', {})
        prompt = request_data.get('prompt', 'Analyze query performance')
        extra_instructions = request_data.get('extra_instructions', '')
        language = request_data.get('language', 'English')
        provider = request_data.get('provider', 'grok')
        selections = request_data.get('selections', {})
        options = request_data.get('options', {})
        cb_config = request_data.get('couchbaseConfig', {})
        custom_config = request_data.get('customConfig')  # Custom AI provider config
        
        ic("📋 Request parameters:")
        ic(f"  Provider: {provider}")
        ic(f"  Language: {language}")
        ic(f"  Prompt length: {len(prompt)} chars")
        ic(f"  Selections: {selections}")
        ic(f"  Options: {options}")
        ic(f"  Custom config: {bool(custom_config)}")
        
        # Check if this is a custom AI provider
        if custom_config and custom_config.get('isCustom'):
            ic("🔧 Using custom AI provider from request")
            api_key = None  # Custom providers use their own auth
            api_url = custom_config.get('url')
            model = custom_config.get('model')
            endpoint = ''  # Custom providers use full URL

            ic(f"✅ Custom provider: {custom_config.get('name')}")
            ic(f"  API URL: {api_url}")
            ic(f"  Model: {model}")
        else:
            # Load API credentials from user_config preferences in CBL.
            cbl_store_inst = _get_cbl_store()
            if cbl_store_inst is None:
                return jsonify({
                    'success': False,
                    'error': 'CBL store not available — cannot load AI credentials',
                }), 500
            ic("🔑 Loading AI API credentials from CBL preferences (user_config)")
            user_prefs = cbl_store_inst.load_preferences('user_config') or {}
            ai_apis = user_prefs.get('aiApis', [])

            # Find the requested provider
            api_config = next((api for api in ai_apis if api['id'] == provider), None)
            
            if not api_config:
                ic(f"❌ Provider '{provider}' not found in user::config")
                return jsonify({
                    'success': False,
                    'error': f'Provider {provider} not configured'
                }), 400
            
            api_key = api_config.get('apiKey')
            api_url = api_config.get('apiUrl')
            model = api_config.get('model')
            
            # Set endpoint based on provider
            if provider in ['anthropic', 'claude']:
                endpoint = '/v1/messages'
            else:
                endpoint = '/chat/completions'
            
            ic(f"✅ Loaded credentials for provider: {provider}")
            ic(f"  API URL: {api_url}")
            ic(f"  Model: {model}")
            ic(f"  Has API Key: {bool(api_key)}")
            
            if not api_key:
                ic(f"❌ No API key configured for provider: {provider}")
                return jsonify({
                    'success': False,
                    'error': f'No API key configured for {provider}. Please add in Settings.'
                }), 400
        
        # Validation
        if not raw_data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        # Check if this is just a save operation (no AI call)
        save_only = (api_key == 'placeholder' or not api_url)
        
        if not save_only and not api_key:
            return jsonify({
                'success': False,
                'error': 'API key is required'
            }), 400
        
        # Build AI payload from raw data. No cluster parameter — payload
        # references come from the local template file (or future CBL store).
        ai_payload_data = ai_analyzer.payload_builder.build_payload_from_data(
            raw_data=raw_data,
            user_prompt=prompt,
            selections=selections,
            options=options,
            extra_instructions=extra_instructions,
            cluster=None,
            bucket_name=None,
        )
        
        # Extract mapping table if obfuscated (for de-obfuscation later)
        obfuscation_mapping = ai_payload_data.pop('_obfuscation_mapping', None)
        
        ic(f"📊 Payload built: {len(str(ai_payload_data))} bytes")
        if obfuscation_mapping:
            ic(f"🔑 Obfuscation mapping: {len(obfuscation_mapping)} tokens")
        
        # Convert to TOON format if requested and available
        use_toon = options.get('use_toon', False)
        ai_request_payload = ai_payload_data # default to JSON object
        
        if use_toon and TOON_AVAILABLE:
            try:
                # Retrieve module safely
                import sys
                mod_toon = sys.modules.get('toon_python')
                if not mod_toon:
                    import toon_python as mod_toon

                # Use toon_python.encode directly
                if hasattr(mod_toon, 'encode'):
                    ai_request_payload = mod_toon.encode(ai_payload_data)
                elif hasattr(mod_toon, 'dumps'):
                    ai_request_payload = mod_toon.dumps(ai_payload_data)
                else:
                    from toon_python.encoder import encode
                    ai_request_payload = encode(ai_payload_data)
                    
                ic("✅ Converted payload to TOON for AI request")
                ic(f"TOON Size: {len(ai_request_payload)} bytes vs JSON: {len(json.dumps(ai_payload_data))} bytes")
            except Exception as e:
                ic(f"❌ TOON conversion failed for request: {e}")
                # Fallback to JSON object (ai_payload_data is already dict)
        
        # Save initial request to Couchbase if requested (before AI call)
        saved_doc_id = None
        if options.get('store_results', False):
            try:
                import uuid
                from datetime import datetime
                
                doc_id = f"ai_analysis_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{str(uuid.uuid4())[:8]}"
                # Calculate payload size based on format used
                payload_content = ai_request_payload if isinstance(ai_request_payload, str) else json.dumps(ai_request_payload)
                payload_size = len(payload_content.encode('utf-8'))
                
                initial_doc = {
                    'docType': 'ai_analysis',
                    'createdAt': datetime.utcnow().isoformat() + 'Z',
                    'status': 'pending',
                    'provider': provider,
                    'model': model,
                    'prompt': prompt,
                    'language': language,
                    'options': options,
                    'sourceCluster': raw_data.get('clusterName', 'Unknown Cluster'),
                    'payload': ai_payload_data, # Always store JSON structure for readability/compatibility
                    'parseJson': request_data.get('parseContext', {}),
                    'sentToApiAs': 'toon' if use_toon and TOON_AVAILABLE else 'json',
                    'metadata': {
                        'obfuscated': obfuscation_mapping is not None,
                        'selections': selections,
                        'total_queries': len(raw_data.get('everyQueryData', [])),
                        'requestPayloadSize': payload_size
                    }
                }
                
                cbl_store_inst = _get_cbl_store()
                if cbl_store_inst is not None:
                    cbl_store_inst.save_analyzer(doc_id, prompt or 'AI Analysis', initial_doc)
                    saved_doc_id = doc_id
                    ic(f"✅ Saved initial request to CBL: {doc_id} (status: pending)")
                else:
                    ic("⚠️ CBL store unavailable; cannot persist initial request")
            except Exception as e:
                ic(f"⚠️ Failed to save initial request: {str(e)}")
        
        # If save_only mode (no real AI call), create placeholder response and save
        if save_only:
            ic("💾 Save-only mode: Skipping AI call, saving payload with placeholder response")
            
            analysis_data = {
                'summary': {
                    'note': 'Placeholder - AI call not executed',
                    'total_queries_analyzed': len(raw_data.get('everyQueryData', [])),
                    'saved_without_ai_call': True
                }
            }
            
            # Persist the placeholder result via CBL when we have a doc id.
            if saved_doc_id:
                try:
                    from datetime import datetime
                    cbl_store_inst = _get_cbl_store()
                    if cbl_store_inst is not None:
                        current_doc = cbl_store_inst.load_analyzer(saved_doc_id) or {}
                        current_doc.update({
                            'completedAt': datetime.utcnow().isoformat() + 'Z',
                            'status': 'completed',
                            'aiResponse': analysis_data
                        })
                        cbl_store_inst.save_analyzer(
                            saved_doc_id,
                            current_doc.get('prompt') or 'AI Analysis',
                            current_doc,
                        )
                        ic(f"✅ Updated placeholder doc {saved_doc_id} in CBL")
                    else:
                        ic("⚠️ CBL store unavailable; cannot update placeholder doc")
                except Exception as e:
                    ic(f"⚠️ Failed to update placeholder doc: {str(e)}")

            return jsonify({
                'success': True,
                'data': analysis_data,
                'elapsed_ms': 0,
                'document_id': saved_doc_id,
                'status': 'completed'
            })
        else:
            # Launch background task for real AI call
            if saved_doc_id:
                ic(f"🚀 Launching background AI task for {saved_doc_id}")
                thread = threading.Thread(target=background_ai_task, args=(
                    saved_doc_id, provider, model, api_key, api_url, endpoint, prompt, 
                    ai_payload_data, cb_config, initial_doc, obfuscation_mapping, language, custom_config
                ))
                thread.start()
                
                return jsonify({
                    'success': True,
                    'status': 'submitted',
                    'document_id': saved_doc_id,
                    'message': 'Analysis job submitted for background processing'
                })
            else:
                # Fallback for no storage (synchronous, discouraged)
                ic("⚠️ Storage disabled, running synchronously (may timeout)")
                
                if custom_config and custom_config.get('isCustom'):
                    result = ai_analyzer.call_custom_ai_provider(
                        custom_config=custom_config,
                        prompt=prompt,
                        payload_data=ai_payload_data,
                        language=language
                    )
                else:
                    result = ai_analyzer.call_ai_provider(
                        provider=provider,
                        model=model or ('gpt-4o' if provider == 'openai' else 'claude-3-5-sonnet-20241022'),
                        api_key=api_key,
                        api_url=api_url,
                        endpoint=endpoint,
                        prompt=prompt,
                        payload_data=ai_payload_data,
                        language=language
                    )
                
                return jsonify({
                    'success': result.get('success'),
                    'analysis': result.get('data'),
                    'elapsed_ms': result.get('elapsed_ms'),
                    'error': result.get('error')
                })

    except Exception as e:
        import traceback
        ic("💥 Error in AI analysis", str(e))
        ic(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500

# Note: /api/ai/cancel and /api/ai/status/<document_id> used to be defined
# here against an external Couchbase Server cluster. They are now
# registered by app.py against the embedded Couchbase Lite store.

@app.route('/api/ai/stats', methods=['GET'])
def get_ai_cache_stats():
    """
    Get AI cache statistics
    
    Response:
    {
        "success": true,
        "stats": {
            "total_sessions": 5,
            "total_size_bytes": 123456,
            "total_size_kb": 120.56,
            "ttl_seconds": 1800
        }
    }
    """
    try:
        stats = ai_analyzer.get_cache_stats()
        return jsonify({
            'success': True,
            'stats': stats
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ============================================================================
# Payload Reference Management Endpoints
# ============================================================================

@app.route('/api/ai/payload-reference', methods=['GET'])
def get_payload_reference():
    """
    Get the current payload_reference template (from file, not Couchbase)
    Used for viewing/editing the template before seeding
    
    Response:
    {
        "success": true,
        "payload_reference": {...},
        "source": "template"
    }
    """
    try:
        template = ai_analyzer.get_payload_reference_template()
        return jsonify({
            'success': True,
            'payload_reference': template,
            'source': 'template'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Note: /api/ai/payload-reference/load|seed|save used to talk to an external
# Couchbase Server cluster. They are now registered by app.py against the
# embedded Couchbase Lite store.

@app.route('/api/ai/payload-reference/invalidate-cache', methods=['POST'])
def invalidate_payload_reference_cache_endpoint():
    """
    Invalidate the in-memory payload_reference cache
    Forces reload from Couchbase on next AI analysis
    
    Response:
    {
        "success": true,
        "message": "Cache invalidated"
    }
    """
    try:
        ai_analyzer.invalidate_payload_reference_cache()
        return jsonify({
            'success': True,
            'message': 'Payload reference cache invalidated'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ============================================================================
# AI Models List Management Endpoints
# ============================================================================

@app.route('/api/ai/models', methods=['GET'])
def get_ai_models_template_endpoint():
    """
    Get the current ai_models_list template (from file, not Couchbase)
    
    Response:
    {
        "success": true,
        "models": {...},
        "source": "template"
    }
    """
    try:
        template = ai_analyzer.get_ai_models_template()
        return jsonify({
            'success': True,
            'models': template,
            'source': 'template'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Note: /api/ai/models/load|seed|save and /api/ai/models/provider/<id> used
# to talk to an external Couchbase Server cluster. The load|seed|save
# endpoints are now registered by app.py against the embedded Couchbase Lite
# store; the provider endpoint has been removed (the frontend reads the
# template/CBL data directly via /api/ai/models).

@app.route('/api/ai/models/invalidate-cache', methods=['POST'])
def invalidate_ai_models_cache_endpoint():
    """
    Invalidate the in-memory ai_models_list cache
    
    Response:
    {
        "success": true,
        "message": "Cache invalidated"
    }
    """
    try:
        ai_analyzer.invalidate_ai_models_cache()
        return jsonify({
            'success': True,
            'message': 'AI models cache invalidated'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ============================================================================
# AI API Test Endpoint
# ============================================================================

@app.route('/api/ai/test', methods=['POST'])
def test_ai_api():
    """
    Test AI API configuration with a simple prompt.
    Makes a real API call to verify credentials and configuration work.
    
    Request body:
    {
        "provider": "openai" | "claude" | "grok" | "custom",
        "model": "gpt-4o",
        "apiKey": "sk-...",
        "apiUrl": "https://api.openai.com/v1",
        "customConfig": {...}  // For custom providers only
    }
    
    Response:
    {
        "success": true,
        "message": "API test successful",
        "elapsed_ms": 1234,
        "model_response": "Hello! I'm working correctly."
    }
    """
    try:
        
        data = request.json
        provider = data.get('provider', '')
        model = data.get('model', '')
        api_key = data.get('apiKey', '')
        api_url = data.get('apiUrl', '')
        custom_config = data.get('customConfig')
        
        ic("🧪 Testing AI API configuration")
        ic(f"  Provider: {provider}")
        ic(f"  Model: {model}")
        ic(f"  API URL: {api_url}")
        ic(f"  Custom: {bool(custom_config)}")
        
        # Simple test prompt
        test_prompt = "Respond with exactly this JSON: {\"status\": \"ok\", \"message\": \"API connection successful\"}"
        test_payload = {"data": {"test": True}}
        
        if custom_config and custom_config.get('isCustom'):
            # Test custom AI provider
            ic("🔧 Testing custom AI provider")
            result = ai_analyzer.call_custom_ai_provider(
                custom_config=custom_config,
                prompt=test_prompt,
                payload_data=test_payload,
                language='English'
            )
        else:
            # Test built-in provider
            if not api_key:
                return jsonify({
                    'success': False,
                    'error': 'API key is required'
                }), 400
            
            # Set default URLs if not provided
            if not api_url:
                if provider == 'openai':
                    api_url = 'https://api.openai.com/v1'
                elif provider == 'claude':
                    api_url = 'https://api.anthropic.com'
                elif provider == 'grok':
                    api_url = 'https://api.x.ai/v1'
            
            # Set default models if not provided
            if not model:
                if provider == 'openai':
                    model = 'gpt-4o-mini'
                elif provider == 'claude':
                    model = 'claude-3-5-haiku-20241022'
                elif provider == 'grok':
                    model = 'grok-3-mini'
            
            # Determine endpoint
            endpoint = '/chat/completions'
            if provider == 'claude':
                endpoint = '/v1/messages'
            
            result = ai_analyzer.call_ai_provider(
                provider=provider,
                model=model,
                api_key=api_key,
                api_url=api_url,
                endpoint=endpoint,
                prompt=test_prompt,
                payload_data=test_payload,
                language='English'
            )
        
        if result.get('success'):
            # Extract the AI response text
            response_text = ""
            response_data = result.get('data', {})
            
            if 'choices' in response_data and len(response_data['choices']) > 0:
                # OpenAI/Grok format
                response_text = response_data['choices'][0].get('message', {}).get('content', '')
            elif 'content' in response_data and isinstance(response_data['content'], list):
                # Anthropic format
                if len(response_data['content']) > 0:
                    response_text = response_data['content'][0].get('text', '')
            
            ic(f"✅ API test successful! Response: {response_text[:100]}...")
            
            return jsonify({
                'success': True,
                'message': 'API test successful',
                'elapsed_ms': result.get('elapsed_ms', 0),
                'model_response': response_text[:500],  # Truncate for safety
                'provider': provider,
                'model': model
            })
        else:
            ic(f"❌ API test failed: {result.get('error')}")
            return jsonify({
                'success': False,
                'error': result.get('error', 'Unknown error'),
                'elapsed_ms': result.get('elapsed_ms', 0),
                'status_code': result.get('status_code'),
                'raw_response': result.get('raw_response', '')[:500]  # Truncate
            }), 400
            
    except Exception as e:
        ic(f"💥 API test error: {str(e)}")
        import traceback
        ic(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Note: /api/ai/history and /api/ai/clusters used to talk to an external
# Couchbase Server cluster. They are now registered by app.py against the
# embedded Couchbase Lite store.

@app.route('/api/ai/debug', methods=['POST'])
def set_ai_debug():
    """
    Enable or disable AI analyzer debug logging
    
    Request body:
    {
        "enabled": true
    }
    
    Response:
    {
        "success": true,
        "debug_enabled": true
    }
    """
    try:
        data = request.json
        enabled = data.get('enabled', True)
        
        ai_analyzer.configure_debug(enabled)
        
        return jsonify({
            'success': True,
            'debug_enabled': enabled
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ============================================================================
# Legacy AI API Call Endpoint
# ============================================================================

@app.route('/api/ai/call', methods=['POST'])
def ai_api_call():
    """
    Proxy endpoint for AI API calls
    Accepts configuration and forwards request to AI provider
    
    Request body:
    {
        "provider": "openai",
        "model": "gpt-4o",
        "apiKey": "sk-...",
        "apiUrl": "https://api.openai.com/v1",
        "endpoint": "/chat/completions",  // optional, appended to apiUrl
        "method": "POST",  // optional, defaults to POST
        "headers": {},  // optional custom headers
        "payload": {},  // request payload
        "timeout": 30,  // optional timeout in seconds
        "maxRetries": 3  // optional max retry attempts
    }
    """
    try:
        data = request.json
        ic("🎯 AI API Call Request", data.get('provider'), data.get('model'))
        
        # Extract parameters
        provider = data.get('provider', 'unknown')
        model = data.get('model')
        api_key = data.get('apiKey')
        api_url = data.get('apiUrl', '')
        endpoint = data.get('endpoint', '')
        method = data.get('method', 'POST')
        custom_headers = data.get('headers', {})
        payload = data.get('payload', {})
        timeout = data.get('timeout', 30)
        max_retries = data.get('maxRetries', 3)
        
        # Validation
        if not api_key:
            return jsonify({
                'success': False,
                'error': 'API key is required'
            }), 400
        
        if not api_url:
            return jsonify({
                'success': False,
                'error': 'API URL is required'
            }), 400
        
        # Build full URL
        full_url = api_url.rstrip('/') + '/' + endpoint.lstrip('/')
        ic("🌐 Full URL", full_url)
        
        # Prepare headers
        headers = {
            'Authorization': f'Bearer {api_key}',
            **custom_headers
        }
        
        # Some providers use different auth header formats
        if provider == 'anthropic':
            headers['x-api-key'] = api_key
            headers['anthropic-version'] = '2023-06-01'
            del headers['Authorization']  # Claude doesn't use Bearer
        elif provider == 'cohere':
            headers['Authorization'] = f'Bearer {api_key}'  # Cohere uses Bearer
        
        # Add model to payload if not already present
        if model and 'model' not in payload:
            payload['model'] = model
        
        ic("📋 Final Headers", {k: v[:20] + '...' if len(str(v)) > 20 else v for k, v in headers.items()})
        ic("📋 Final Payload", payload)
        
        # Create custom HTTP client with request-specific settings
        custom_client = ai_analyzer.AIHttpClient(
            max_retries=max_retries,
            backoff_factor=0.5,
            timeout=timeout
        )
        
        # Make the API call
        result = custom_client.call_api(
            method=method,
            url=full_url,
            headers=headers,
            json_data=payload
        )
        
        ic("📨 API Call Result", result.get('success'), result.get('elapsed_ms'))
        
        return jsonify(result)
        
    except Exception as e:
        ic("💥 Error in AI API call endpoint", str(e))
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def open_browser_at_port(port):
    """Open the browser after a short delay to ensure server is ready"""
    import webbrowser
    time.sleep(1.5)
    webbrowser.open(f"http://localhost:{port}/index.html")

def open_browser():
    """Open browser at default PORT"""
    open_browser_at_port(PORT)

# ============================================================================
# Debug Logging to File
# ============================================================================

_log_file = None
_log_enabled = False
_log_dir = os.path.expanduser("~/Downloads/cb_query_analyzer_logs")

def setup_file_logging(log_dir=None):
    """Setup icecream to log to file"""
    global _log_file, _log_enabled, _log_dir
    from datetime import datetime
    
    if log_dir:
        _log_dir = log_dir
    
    os.makedirs(_log_dir, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_path = os.path.join(_log_dir, f"cb_query_analyzer_{timestamp}.log")
    
    _log_file = open(log_path, 'a', buffering=1)  # Line buffered
    _log_enabled = True
    
    def log_to_file(s):
        if _log_file and _log_enabled:
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            _log_file.write(f"[{timestamp}] {s}\n")
        print(s)  # Also print to console
    
    ic.configureOutput(outputFunction=log_to_file)
    ic(f"📝 Logging to: {log_path}")
    return log_path

def stop_file_logging():
    """Stop logging to file"""
    global _log_file, _log_enabled
    _log_enabled = False
    if _log_file:
        ic("📝 Stopping file logging")
        _log_file.close()
        _log_file = None
    ic.configureOutput(outputFunction=lambda s: print(s))

def run_with_menubar():
    """Run Flask server with macOS menu bar icon for easy quit"""
    import rumps
    
    class QueryAnalyzerApp(rumps.App):
        def __init__(self, initial_port):
            super(QueryAnalyzerApp, self).__init__(
                "CB Query Analyzer",
                title="🔧",  # Menu bar icon (wrench emoji)
                quit_button=None  # We'll add custom quit
            )
            self.current_port = initial_port
            self.flask_thread = None
            self.flask_running = False
            self.debug_enabled = False
            self.log_path = None
            
            # Build menu
            self.menu = [
                rumps.MenuItem("Open in Browser", callback=self.open_browser),
                None,  # Separator
                rumps.MenuItem(f"Port: {self.current_port}", callback=None),
                rumps.MenuItem("Change Port...", callback=self.change_port),
                None,  # Separator
                rumps.MenuItem("🔍 Debug Logging", callback=None),
                rumps.MenuItem("   Enable Logging", callback=self.toggle_logging),
                rumps.MenuItem("   Open Log Folder", callback=self.open_log_folder),
                rumps.MenuItem("   Set Log Folder...", callback=self.set_log_folder),
                None,  # Separator
                rumps.MenuItem("Restart Server", callback=self.restart_server),
                rumps.MenuItem("Quit", callback=self.quit_app),
            ]
            
        def open_browser(self, _):
            import webbrowser
            webbrowser.open(f"http://localhost:{self.current_port}/index.html")
        
        def change_port(self, _):
            response = rumps.Window(
                message="Enter new port number:",
                title="Change Port",
                default_text=str(self.current_port),
                ok="Change & Restart",
                cancel="Cancel",
                dimensions=(200, 24)
            ).run()
            
            if response.clicked:
                try:
                    new_port = int(response.text.strip())
                    if 1024 <= new_port <= 65535:
                        old_port = self.current_port
                        self.current_port = new_port
                        self.menu["Port: " + str(old_port)].title = f"Port: {new_port}"
                        ic(f"🔄 Port changed: {old_port} → {new_port}")
                        self.restart_server(None)
                    else:
                        rumps.alert("Invalid Port", "Port must be between 1024 and 65535")
                except ValueError:
                    rumps.alert("Invalid Port", "Please enter a valid number")
        
        def toggle_logging(self, sender):
            global _log_enabled
            if _log_enabled:
                stop_file_logging()
                sender.title = "   Enable Logging"
                self.title = "🔧"
                rumps.notification(
                    "CB Query Analyzer",
                    "Debug Logging Disabled",
                    "Logging stopped"
                )
            else:
                self.log_path = setup_file_logging()
                sender.title = "   ✓ Logging Enabled"
                self.title = "🔧📝"  # Show logging indicator
                rumps.notification(
                    "CB Query Analyzer",
                    "Debug Logging Enabled",
                    f"Logs: {self.log_path}"
                )
        
        def open_log_folder(self, _):
            import subprocess
            os.makedirs(_log_dir, exist_ok=True)
            subprocess.run(["open", _log_dir])
        
        def set_log_folder(self, _):
            global _log_dir
            response = rumps.Window(
                message="Enter log folder path:",
                title="Set Log Folder",
                default_text=_log_dir,
                ok="Set",
                cancel="Cancel",
                dimensions=(400, 24)
            ).run()
            
            if response.clicked:
                new_dir = os.path.expanduser(response.text.strip())
                if new_dir:
                    _log_dir = new_dir
                    ic(f"📁 Log folder set to: {_log_dir}")
                    rumps.notification(
                        "CB Query Analyzer",
                        "Log Folder Updated",
                        _log_dir
                    )
        
        def restart_server(self, _):
            ic(f"🔄 Restarting server on port {self.current_port}...")
            rumps.notification(
                "CB Query Analyzer",
                "Restarting...",
                f"Server restarting on port {self.current_port}"
            )
            # Note: Full restart requires app relaunch
            # For now, just notify - actual restart would need subprocess
            os._exit(0)  # Exit and let user relaunch
            
        def quit_app(self, _):
            ic("👋 Shutting down via menu bar...")
            stop_file_logging()
            rumps.quit_application()
            os._exit(0)
    
    # Start Flask in background thread
    def run_flask():
        app.run(host='0.0.0.0', port=PORT, debug=False, use_reloader=False)
    
    flask_thread = threading.Thread(target=run_flask, daemon=True)
    flask_thread.start()
    
    # Open browser after short delay
    browser_thread = threading.Thread(target=lambda: open_browser_at_port(PORT), daemon=True)
    browser_thread.start()
    
    # Run menu bar app (blocks until quit)
    menu_app = QueryAnalyzerApp(PORT)
    menu_app.run()

def run_with_systray_windows():
    """Run Flask server with Windows system tray icon"""
    try:
        import pystray
        from PIL import Image, ImageDraw
        
        current_port = PORT
        logging_enabled = False
        
        # Create a simple icon (blue circle with CB text)
        def create_icon():
            img = Image.new('RGB', (64, 64), color=(0, 122, 204))
            draw = ImageDraw.Draw(img)
            draw.text((12, 20), "CB", fill='white')
            return img
        
        def on_quit(icon, item):
            ic("👋 Shutting down via system tray...")
            stop_file_logging()
            icon.stop()
            os._exit(0)
            
        def on_open(icon, item):
            import webbrowser
            webbrowser.open(f"http://localhost:{current_port}/index.html")
        
        def on_toggle_logging(icon, item):
            nonlocal logging_enabled
            if logging_enabled:
                stop_file_logging()
                logging_enabled = False
            else:
                setup_file_logging()
                logging_enabled = True
        
        def on_open_logs(icon, item):
            import subprocess
            os.makedirs(_log_dir, exist_ok=True)
            subprocess.run(["explorer", _log_dir])
        
        def get_logging_text(item):
            return "✓ Logging Enabled" if logging_enabled else "Enable Logging"
        
        # Start Flask in background thread
        def run_flask():
            app.run(host='0.0.0.0', port=PORT, debug=False, use_reloader=False)
        
        flask_thread = threading.Thread(target=run_flask, daemon=True)
        flask_thread.start()
        
        # Open browser
        browser_thread = threading.Thread(target=open_browser, daemon=True)
        browser_thread.start()
        
        # Create system tray icon
        icon = pystray.Icon(
            "QueryAnalyzer",
            create_icon(),
            "CB Query Analyzer",
            menu=pystray.Menu(
                pystray.MenuItem("Open in Browser", on_open),
                pystray.MenuItem(f"Port: {current_port}", None, enabled=False),
                pystray.Menu.SEPARATOR,
                pystray.MenuItem(get_logging_text, on_toggle_logging),
                pystray.MenuItem("Open Log Folder", on_open_logs),
                pystray.Menu.SEPARATOR,
                pystray.MenuItem("Quit", on_quit),
            )
        )
        icon.run()
        
    except ImportError:
        ic("⚠️ pystray not available, running without system tray")
        app.run(host='0.0.0.0', port=PORT, debug=False)

if __name__ == '__main__':
    try:
        ic("🚀 Liquid Snake Server (Flask)")
        ic(f"📡 Serving at http://localhost:{PORT}")
        ic(f"📂 Directory: {DIRECTORY}")
        ic(f"🌐 Open: http://localhost:{PORT}/index.html")
        
        # Check if running as PyInstaller bundle
        is_frozen = getattr(sys, 'frozen', False)
        ic(f"🧊 Frozen (PyInstaller): {is_frozen}")
        
        if is_frozen:
            # Running as packaged app - use menu bar/system tray
            if sys.platform == 'darwin':
                try:
                    import rumps
                    ic("🍎 Starting with macOS menu bar...")
                    run_with_menubar()
                except ImportError:
                    ic("⚠️ rumps not available, running without menu bar")
                    browser_thread = threading.Thread(target=open_browser, daemon=True)
                    browser_thread.start()
                    app.run(host='0.0.0.0', port=PORT, debug=False)
            elif sys.platform == 'win32':
                ic("🪟 Starting with Windows system tray...")
                run_with_systray_windows()
            else:
                browser_thread = threading.Thread(target=open_browser, daemon=True)
                browser_thread.start()
                app.run(host='0.0.0.0', port=PORT, debug=False)
        else:
            ic("🛑 Press Ctrl+C to stop")
            # Honor FLASK_DEBUG env var (default: enabled for local dev).
            # Containers/production should set FLASK_DEBUG=0 to disable
            # the auto-reloader and debugger.
            debug_mode = os.environ.get('FLASK_DEBUG', '1').lower() in ('1', 'true', 'yes')
            app.run(host='0.0.0.0', port=PORT, debug=debug_mode)
        
    except Exception as e:
        ic(f"💥 FATAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        # Keep window open on crash so user can see error
        if getattr(sys, 'frozen', False):
            input("Press Enter to exit...")
        raise