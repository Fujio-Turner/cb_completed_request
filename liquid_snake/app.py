#!/usr/bin/env python3
"""
Flask HTTP server for Liquid Snake with ES6 modules
Runs on http://localhost:5555

Includes Couchbase REST API endpoints for Issue #231:
- POST /api/couchbase/test - Test connection
- POST /api/couchbase/query - Execute N1QL query
- POST /api/couchbase/save-analyzer - Save analyzer data
- GET /api/couchbase/load-analyzer/<requestId> - Load analyzer data
- POST /api/couchbase/save-preferences - Save user preferences
- GET /api/couchbase/load-preferences/<userId> - Load user preferences
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import time
from icecream import ic
from couchbase.cluster import Cluster
from couchbase.options import ClusterOptions, QueryOptions
import couchbase.subdocument as SD
from couchbase.auth import PasswordAuthenticator
from couchbase.exceptions import (
    DocumentExistsException,
    DocumentNotFoundException,
    TimeoutException, 
    CouchbaseException,
    PathNotFoundException
)

# Import AI Analyzer module
import ai_analyzer
import sys
ic(sys.executable)

# Import TOON converter
try:
    import toon_python
    TOON_AVAILABLE = True
except ImportError:
    ic("⚠️ toon-python not installed, attempting runtime install...")
    try:
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "toon-python"])
        import toon_python
        TOON_AVAILABLE = True
        ic("✅ toon-python installed successfully at runtime")
    except Exception as e:
        TOON_AVAILABLE = False
        ic(f"❌ Runtime install failed: {e}")

# Configure icecream
ic.configureOutput(includeContext=True)

PORT = 5555
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__, static_folder=DIRECTORY, static_url_path='')
CORS(app)  # Enable CORS for all routes

# Couchbase connection cache
_cluster = None
_config = None

def get_couchbase_connection(config):
    """Get or create Couchbase cluster connection"""
    global _cluster, _config
    
    # Validate credentials before attempting connection
    if not config.get('username') or not config.get('password'):
        ic("⚠️ Missing credentials - username or password is empty")
        return None
    
    # If config changed or no connection, create new one
    if _config != config or _cluster is None:
        if _cluster:
            try:
                _cluster.close()
            except:
                pass
        
        try:
            # Parse URL to extract hostname/IP (strip protocol and port since Couchbase SDK uses its own ports)
            url_cleaned = config['url'].replace('http://', '').replace('https://', '')
            hostname = url_cleaned.split(':')[0]  # Get hostname/IP only
            connection_string = f"couchbase://{hostname}"
            
            ic(f"🔌 Connecting to Couchbase: {connection_string}", config['username'])
            
            _cluster = Cluster(
                connection_string,
                ClusterOptions(PasswordAuthenticator(config['username'], config['password']))
            )
            
            # Wait for cluster to be ready (this will raise exception if auth fails)
            from datetime import timedelta
            _cluster.wait_until_ready(timedelta(seconds=10))
            
            _config = config
            ic("✅ Cluster connection established successfully")
            return _cluster
        except Exception as e:
            ic("❌ Failed to connect to Couchbase", connection_string, e)
            return None
    
    return _cluster

# Static file serving
@app.route('/')
def index():
    return send_from_directory(DIRECTORY, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(DIRECTORY, path)

# API Routes
@app.route('/api/couchbase/test', methods=['POST'])
def test_connection():
    """Test Couchbase connection"""
    try:
        data = request.json
        ic(data)  # Log input
        cluster_config = data.get('config', {})
        cluster = get_couchbase_connection(cluster_config)
        
        if cluster:
            # Try to ping the cluster
            bucket_name = data.get('bucketConfig', {}).get('bucket', 'cb_tools')
            bucket = cluster.bucket(bucket_name)
            bucket.ping()
            
            response = {
                'success': True,
                'message': f'Connected to Couchbase cluster at {cluster_config["url"]}'
            }
            ic(response)  # Log output
            return jsonify(response)
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to connect'
            }), 500
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/couchbase/query', methods=['POST'])
def execute_query():
    """Execute N1QL query"""
    try:
        data = request.json
        ic(data)  # Log input
        cluster_config = data.get('config', {})
        query = data.get('query', '')
        params = data.get('params', {})
        
        cluster = get_couchbase_connection(cluster_config)
        if not cluster:
            return jsonify({'success': False, 'error': 'Not connected'}), 500
        
        # Execute query
        result = cluster.query(query, **params)
        rows = [row for row in result]
        
        response = {
            'success': True,
            'results': rows
        }
        ic(response)  # Log output
        return jsonify(response)
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/couchbase/save-analyzer', methods=['POST'])
def save_analyzer_data():
    """Save query analyzer data"""
    try:
        data = request.json
        cluster_config = data.get('config', {})
        bucket_config = data.get('bucketConfig', {})
        request_id = data.get('requestId')
        analyzer_data = data.get('data', {})
        
        cluster = get_couchbase_connection(cluster_config)
        if not cluster:
            return jsonify({'success': False, 'error': 'Not connected'}), 500
        
        bucket = cluster.bucket(bucket_config['bucket'])
        collection = bucket.scope(bucket_config['analyzerScope']).collection(bucket_config['analyzerCollection'])
        
        # Upsert document
        result = collection.upsert(request_id, analyzer_data)
        
        return jsonify({
            'success': True,
            'cas': result.cas
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/couchbase/load-analyzer/<request_id>', methods=['POST'])
def load_analyzer_data(request_id):
    """Load query analyzer data"""
    try:
        data = request.json
        cluster_config = data.get('config', {})
        bucket_config = data.get('bucketConfig', {})
        
        cluster = get_couchbase_connection(cluster_config)
        if not cluster:
            return jsonify({'success': False, 'error': 'Not connected'}), 500
        
        bucket = cluster.bucket(bucket_config['bucket'])
        collection = bucket.scope(bucket_config['analyzerScope']).collection(bucket_config['analyzerCollection'])
        
        # Get document
        result = collection.get(request_id)
        
        return jsonify({
            'success': True,
            'data': result.content_as[dict]
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/couchbase/delete-analyzer', methods=['POST'])
def delete_analyzer_data():
    """Delete query analyzer data"""
    try:
        data = request.json
        cluster_config = data.get('config', {})
        bucket_config = data.get('bucketConfig', {})
        request_id = data.get('requestId')
        
        cluster = get_couchbase_connection(cluster_config)
        if not cluster:
            return jsonify({'success': False, 'error': 'Not connected'}), 500
        
        bucket = cluster.bucket(bucket_config['bucket'])
        collection = bucket.scope(bucket_config['analyzerScope']).collection(bucket_config['analyzerCollection'])
        
        # Delete document
        collection.remove(request_id)
        
        return jsonify({
            'success': True
        })
    except DocumentNotFoundException:
        return jsonify({
            'success': False,
            'error': 'Document not found'
        }), 404
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/couchbase/save-preferences', methods=['POST'])
def save_user_preferences():
    """Save user preferences using K/V upsert with automatic backup"""
    try:
        import hashlib
        import json
        from datetime import timedelta
        from couchbase.options import UpsertOptions
        
        data = request.json
        ic(data)  # Log input
        cluster_config = data.get('config', {})
        bucket_config = data.get('bucketConfig', {})
        user_id = data.get('userId')  # Should be 'user_config'
        preferences = data.get('preferences', {})
        
        cluster = get_couchbase_connection(cluster_config)
        if not cluster:
            return jsonify({'success': False, 'error': 'Not connected'}), 500
        
        bucket = cluster.bucket(bucket_config['bucket'])
        collection = bucket.scope(bucket_config['preferencesScope']).collection(bucket_config['preferencesCollection'])
        
        # K/V UPSERT main document
        result = collection.upsert(user_id, preferences)
        
        # Create backup with MD5 hash and 7-day TTL
        try:
            # Generate MD5 hash of JSON
            json_str = json.dumps(preferences, sort_keys=True)
            hash_md5 = hashlib.md5(json_str.encode()).hexdigest()
            backup_id = f"{user_id}::{hash_md5}"
            
            # Add backup metadata
            backup_doc = {
                **preferences,
                '_backup_metadata': {
                    'original_doc_id': user_id,
                    'backup_timestamp': preferences.get('updatedAt'),
                    'hash': hash_md5
                }
            }
            
            # Upsert backup with 7-day TTL (604800 seconds)
            collection.upsert(
                backup_id, 
                backup_doc,
                UpsertOptions(expiry=timedelta(days=7))
            )
            
            ic(f"✅ Backup saved: {backup_id} (expires in 7 days)")
        except Exception as backup_error:
            ic(f"⚠️ Backup failed (non-critical): {backup_error}")
            # Don't fail the main save if backup fails
        
        response = {
            'success': True,
            'cas': result.cas
        }
        ic(user_id, result.cas, response)  # Log output
        return jsonify(response)
    except Exception as e:
        ic("❌ Error saving preferences", e)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/couchbase/load-preferences/<user_id>', methods=['POST'])
def load_user_preferences(user_id):
    """Load user preferences using K/V get"""
    try:
        data = request.json
        ic(user_id, data)  # Log input
        cluster_config = data.get('config', {})
        bucket_config = data.get('bucketConfig', {})
        
        cluster = get_couchbase_connection(cluster_config)
        if not cluster:
            return jsonify({'success': False, 'error': 'Not connected'}), 500
        
        bucket = cluster.bucket(bucket_config['bucket'])
        collection = bucket.scope(bucket_config['preferencesScope']).collection(bucket_config['preferencesCollection'])
        
        # K/V GET operation (no query needed!)
        result = collection.get(user_id)
        content = result.content_as[dict]
        
        response = {
            'success': True,
            'data': content,
            'cas': result.cas
        }
        ic(user_id, result.cas, response)  # Log output
        return jsonify(response)
    except DocumentNotFoundException:
        response = {
            'success': True,
            'data': {
                'docType': 'config'
            },
            'cas': None,
            'firstTime': True
        }
        ic(user_id, "NOT_FOUND", response)  # Log output (first time user)
        return jsonify(response)
    except Exception as e:
        ic("❌ Error loading preferences", e)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

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
        
        # Try dynamic install if not available and requested
        if output_format == 'toon' and not TOON_AVAILABLE:
            ic("⚠️ TOON not loaded, attempting lazy install...")
            try:
                import subprocess
                import sys
                subprocess.check_call([sys.executable, "-m", "pip", "install", "toon-python"])
                import toon_python
                TOON_AVAILABLE = True
                # Inject into global scope
                globals()['toon_python'] = toon_python
                ic("✅ TOON installed and loaded lazily")
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
    """Background thread to process AI request and update Couchbase document"""
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
        
        # Get Couchbase connection
        cluster = get_couchbase_connection(cb_config['cluster'])
        if not cluster:
            ic(f"❌ Failed to connect to Couchbase for background update of {doc_id}")
            return

        bucket = cluster.bucket(cb_config['bucketConfig']['bucket'])
        collection = bucket.scope(cb_config['bucketConfig']['analyzerScope']).collection(
            cb_config['bucketConfig']['analyzerCollection']
        )
        
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
            
            # Update Couchbase doc with success results
            try:
                response_size = len(json.dumps(analysis_data).encode('utf-8'))
                
                # Get current doc to preserve fields
                current_doc = collection.get(doc_id).content_as[dict]
                
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
                
                collection.upsert(doc_id, current_doc)
                ic(f"✅ Updated doc {doc_id} with success results")
            except Exception as e:
                ic(f"⚠️ Failed to update doc with results: {str(e)}")
                
        else:
            # Update Couchbase doc with failure
            try:
                # Get current doc
                current_doc = collection.get(doc_id).content_as[dict]
                
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
                
                collection.upsert(doc_id, current_doc)
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
            # Load API credentials from user::config in Couchbase (SECURE)
            ic("🔑 Loading AI API credentials from Couchbase user::config")
            
            if not cb_config or not cb_config.get('cluster'):
                return jsonify({
                    'success': False,
                    'error': 'Couchbase configuration required'
                }), 400
            
            cluster = get_couchbase_connection(cb_config['cluster'])
            if not cluster:
                return jsonify({
                    'success': False,
                    'error': 'Failed to connect to Couchbase'
                }), 500
            
            # Load user::config document
            bucket = cluster.bucket(cb_config['bucketConfig']['bucket'])
            prefs_collection = bucket.scope(cb_config['bucketConfig']['preferencesScope']).collection(
                cb_config['bucketConfig']['preferencesCollection']
            )
            
            user_prefs = prefs_collection.get('user_config').content_as[dict]
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
        
        # Build AI payload from raw data
        ai_payload_data = ai_analyzer.payload_builder.build_payload_from_data(
            raw_data=raw_data,
            user_prompt=prompt,
            selections=selections,
            options=options,
            extra_instructions=extra_instructions
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
                
                cluster = get_couchbase_connection(cb_config['cluster'])
                if cluster:
                    bucket_name = cb_config['bucketConfig']['bucket']
                    scope_name = cb_config['bucketConfig']['analyzerScope']
                    collection_name = cb_config['bucketConfig']['analyzerCollection']
                    
                    bucket = cluster.bucket(bucket_name)
                    collection = bucket.scope(scope_name).collection(collection_name)
                    collection.upsert(doc_id, initial_doc)
                    saved_doc_id = doc_id
                    
                    ic(f"✅ Saved initial request: {doc_id} (status: pending)")
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
            
            # Wait, we still need to save this placeholder data if doc exists
            if saved_doc_id:
                try:
                    cluster = get_couchbase_connection(cb_config['cluster'])
                    if cluster:
                        bucket = cluster.bucket(cb_config['bucketConfig']['bucket'])
                        collection = bucket.scope(cb_config['bucketConfig']['analyzerScope']).collection(
                            cb_config['bucketConfig']['analyzerCollection']
                        )
                        
                        import uuid
                        from datetime import datetime
                        
                        current_doc = collection.get(saved_doc_id).content_as[dict]
                        current_doc.update({
                            'completedAt': datetime.utcnow().isoformat() + 'Z',
                            'status': 'completed',
                            'aiResponse': analysis_data
                        })
                        collection.upsert(saved_doc_id, current_doc)
                        ic(f"✅ Updated placeholder doc {saved_doc_id}")
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

@app.route('/api/ai/cancel', methods=['POST'])
def cancel_ai_analysis():
    """Cancel a running AI analysis"""
    try:
        from datetime import datetime
        
        data = request.json
        doc_id = data.get('document_id')
        cb_config = data.get('config')
        bucket_config = data.get('bucketConfig')
        
        if not doc_id or not cb_config:
            return jsonify({'success': False, 'error': 'Missing document_id or config'}), 400
            
        cluster = get_couchbase_connection(cb_config)
        if not cluster:
            return jsonify({'success': False, 'error': 'Not connected'}), 500
            
        bucket = cluster.bucket(bucket_config['bucket'])
        collection = bucket.scope(bucket_config['analyzerScope']).collection(
            bucket_config['analyzerCollection']
        )
        
        # Update status to cancelled
        try:
            current_doc = collection.get(doc_id).content_as[dict]
            # Allow cancelling pending, submitted, or even processing states
            if current_doc.get('status') in ['pending', 'submitted', 'processing']:
                current_doc['status'] = 'cancelled'
                current_doc['cancelledAt'] = datetime.utcnow().isoformat() + 'Z'
                collection.upsert(doc_id, current_doc)
                ic(f"🚫 Cancelled analysis: {doc_id}")
                return jsonify({'success': True, 'status': 'cancelled'})
            else:
                return jsonify({'success': False, 'error': f'Cannot cancel status: {current_doc.get("status")}'})
        except DocumentNotFoundException:
            return jsonify({'success': False, 'error': 'Document not found'}), 404
            
    except Exception as e:
        ic(f"❌ Error cancelling analysis: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/ai/status/<document_id>', methods=['POST'])
def check_ai_status(document_id):
    """
    Check status of AI analysis document
    Request body: {"config": {...}, "bucketConfig": {...}}
    """
    try:
        data = request.json
        cb_config = data.get('config', {})
        bucket_config = data.get('bucketConfig', {})
        
        cluster = get_couchbase_connection(cb_config)
        if not cluster:
            return jsonify({'success': False, 'error': 'Not connected'}), 500
            
        bucket = cluster.bucket(bucket_config.get('bucket'))
        collection = bucket.scope(bucket_config.get('analyzerScope')).collection(
            bucket_config.get('analyzerCollection')
        )
        
        # Use Sub-Document API to fetch only status and minimal metadata
        try:
            # Lookup status, error, and metadata.elapsed_ms
            # Path "status" -> index 0
            # Path "error" -> index 1
            # Path "metadata.elapsed_ms" -> index 2
            result = collection.lookup_in(document_id, [
                SD.get("status"),
                SD.get("error"),
                SD.get("metadata.elapsed_ms")
            ])
            
            status = result.content_as[str](0)
            
            response = {
                'success': True,
                'status': status,
                'document_id': document_id
            }
            
            if status == 'completed':
                # We don't need the full analysis for polling check
                try:
                    response['elapsed_ms'] = result.content_as[int](2)
                except:
                    response['elapsed_ms'] = 0
            elif status == 'failed':
                try:
                    response['error'] = result.content_as[dict](1)
                except:
                    response['error'] = {'message': 'Unknown error'}
                    
            return jsonify(response)
            
        except PathNotFoundException:
            # Status field might not exist yet? Should unlikely happen if doc exists
            return jsonify({'success': True, 'status': 'unknown', 'document_id': document_id})
            
    except DocumentNotFoundException:
        return jsonify({'success': False, 'status': 'not_found'}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

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

@app.route('/api/ai/history', methods=['POST'])
def get_ai_analysis_history():
    """
    Get AI analysis history from Couchbase
    
    Request body:
    {
        "config": {...},
        "bucketConfig": {...},
        "limit": 10,
        "offset": 0
    }
    
    Response:
    {
        "success": true,
        "results": [...],
        "count": 10
    }
    """
    try:
        data = request.json
        cluster_config = data.get('config', {})
        bucket_config = data.get('bucketConfig', {})
        limit = data.get('limit', 10)
        offset = data.get('offset', 0)
        
        cluster = get_couchbase_connection(cluster_config)
        if not cluster:
            return jsonify({'success': False, 'error': 'Not connected'}), 500
        
        # Build N1QL query
        bucket = bucket_config.get('bucket', 'cb_tools')
        scope = bucket_config.get('analyzerScope', 'query')
        collection = bucket_config.get('analyzerCollection', 'analyzer')
        
        query = f'''
            SELECT `createdAt`,
                   `provider`,
                   `status`,
                   `prompt`,
                   `sourceCluster`,
                   `metadata`,
                   `parseJson`.`filters`,
                   META().id as documentId
            FROM `{bucket}`.`{scope}`.`{collection}`
            WHERE docType = "ai_analysis"
            ORDER BY `createdAt` DESC
            LIMIT $limit
            OFFSET $offset
        '''
        
        ic(f"📋 Fetching AI analysis history: limit={limit}, offset={offset}")
        
        # Execute query
        result = cluster.query(query, limit=limit, offset=offset)
        rows = [row for row in result]
        
        ic(f"✅ Retrieved {len(rows)} analysis records")
        
        return jsonify({
            'success': True,
            'results': rows,
            'count': len(rows)
        })
        
    except Exception as e:
        ic(f"❌ Error fetching analysis history: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ai/clusters', methods=['POST'])
def get_ai_clusters():
    """
    Get unique source cluster names for autocomplete
    Uses index: analysis_old_table_v1
    
    Request body:
    {
        "config": {...},
        "bucketConfig": {...},
        "term": "qa" (optional)
    }
    """
    try:
        data = request.json
        cluster_config = data.get('config', {})
        bucket_config = data.get('bucketConfig', {})
        term = data.get('term', '')
        
        cluster = get_couchbase_connection(cluster_config)
        if not cluster:
            return jsonify({'success': False, 'error': 'Not connected'}), 500
        
        bucket = bucket_config.get('bucket', 'cb_tools')
        scope = bucket_config.get('analyzerScope', 'query')
        collection = bucket_config.get('analyzerCollection', 'analyzer')
        
        # Query for recent distinct source clusters using CTE + FTS SEARCH function
        search_term = f"{term.lower()}*" if term else "*"
        ic(f"🔎 Searching clusters with SEARCH term: '{search_term}'")
        
        query = f'''
            WITH allCluster AS (
                SELECT RAW sourceCluster
                FROM `{bucket}`.`{scope}`.`{collection}`
                WHERE docType = "ai_analysis"
                  AND sourceCluster IS NOT MISSING
                  AND sourceCluster != ""
                GROUP BY sourceCluster
            )
            SELECT RAW allCluster 
            FROM allCluster 
            WHERE SEARCH(allCluster, {{"query": $term}})
            ORDER BY allCluster
            LIMIT 10
        '''
        
        result = cluster.query(
            query, 
            QueryOptions(adhoc=False, named_parameters={'term': search_term})
        )
        clusters = [row for row in result]
        
        return jsonify({
            'success': True,
            'results': clusters
        })
        
    except Exception as e:
        ic(f"❌ Error fetching clusters: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

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

if __name__ == '__main__':
    ic("🚀 Liquid Snake Server (Flask)")
    ic(f"📡 Serving at http://localhost:{PORT}")
    ic(f"📂 Directory: {DIRECTORY}")
    ic(f"🌐 Open: http://localhost:{PORT}/index.html")
    ic("🛑 Press Ctrl+C to stop")
    
    app.run(host='0.0.0.0', port=PORT, debug=True)
