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
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from icecream import ic
from couchbase.cluster import Cluster
from couchbase.options import ClusterOptions
from couchbase.auth import PasswordAuthenticator
from couchbase.exceptions import (
    DocumentExistsException,
    DocumentNotFoundException,
    TimeoutException, 
    CouchbaseException
)

# Import AI Analyzer module
import ai_analyzer

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

# ============================================================================
# Robust HTTP Client for AI API Calls
# ============================================================================

class AIHttpClient:
    """
    Robust HTTP client with retry logic, timeout handling, and detailed logging
    """
    
    def __init__(self, 
                 max_retries=3, 
                 backoff_factor=0.5, 
                 timeout=30,
                 retry_on_status=[429, 500, 502, 503, 504]):
        """
        Initialize HTTP client with retry configuration
        
        Args:
            max_retries (int): Maximum number of retry attempts
            backoff_factor (float): Exponential backoff multiplier (delay = {backoff_factor} * (2 ** retry_count))
            timeout (int): Request timeout in seconds
            retry_on_status (list): HTTP status codes to retry on
        """
        self.max_retries = max_retries
        self.backoff_factor = backoff_factor
        self.timeout = timeout
        self.retry_on_status = retry_on_status
        
        ic("🔧 AIHttpClient initialized", max_retries, backoff_factor, timeout, retry_on_status)
    
    def _create_session(self):
        """Create requests session with retry strategy"""
        session = requests.Session()
        
        # Configure retry strategy
        retry_strategy = Retry(
            total=self.max_retries,
            backoff_factor=self.backoff_factor,
            status_forcelist=self.retry_on_status,
            allowed_methods=["POST", "PUT", "GET"],
            raise_on_status=False
        )
        
        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        
        return session
    
    def call_api(self, method, url, headers=None, json_data=None, **kwargs):
        """
        Make HTTP request with retry logic and comprehensive logging
        
        Args:
            method (str): HTTP method ('POST', 'PUT', 'GET')
            url (str): API endpoint URL
            headers (dict): Custom headers
            json_data (dict): JSON payload
            **kwargs: Additional requests parameters
            
        Returns:
            dict: Response with success status and data/error
        """
        start_time = time.time()
        attempt = 0
        
        ic("🚀 API Call Starting", method, url)
        ic("📤 Headers", headers)
        ic("📤 Payload", json_data)
        
        session = self._create_session()
        
        # Merge custom headers with defaults
        default_headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'Couchbase-Query-Analyzer/3.28.2'
        }
        
        if headers:
            default_headers.update(headers)
        
        while attempt < self.max_retries:
            attempt += 1
            
            try:
                ic(f"🔄 Attempt {attempt}/{self.max_retries}")
                
                # Make the request
                response = session.request(
                    method=method.upper(),
                    url=url,
                    headers=default_headers,
                    json=json_data,
                    timeout=self.timeout,
                    **kwargs
                )
                
                elapsed_ms = int((time.time() - start_time) * 1000)
                
                ic("📥 Response Status", response.status_code, f"{elapsed_ms}ms")
                
                # Success case
                if 200 <= response.status_code < 300:
                    try:
                        response_data = response.json()
                        ic("✅ Success", response_data)
                        
                        return {
                            'success': True,
                            'status_code': response.status_code,
                            'data': response_data,
                            'elapsed_ms': elapsed_ms,
                            'attempts': attempt
                        }
                    except ValueError:
                        # Response is not JSON
                        ic("✅ Success (non-JSON response)", response.text[:200])
                        
                        return {
                            'success': True,
                            'status_code': response.status_code,
                            'data': response.text,
                            'elapsed_ms': elapsed_ms,
                            'attempts': attempt
                        }
                
                # Retry on specific status codes
                if response.status_code in self.retry_on_status:
                    ic(f"⚠️ Retryable error {response.status_code}, will retry...")
                    
                    # Exponential backoff
                    if attempt < self.max_retries:
                        delay = self.backoff_factor * (2 ** (attempt - 1))
                        ic(f"⏳ Waiting {delay}s before retry")
                        time.sleep(delay)
                        continue
                
                # Non-retryable error
                ic("❌ API Error (non-retryable)", response.status_code, response.text[:500])
                
                return {
                    'success': False,
                    'status_code': response.status_code,
                    'error': f"HTTP {response.status_code}: {response.text[:500]}",
                    'elapsed_ms': elapsed_ms,
                    'attempts': attempt
                }
                
            except requests.exceptions.Timeout:
                ic(f"⏰ Timeout on attempt {attempt}")
                
                if attempt >= self.max_retries:
                    elapsed_ms = int((time.time() - start_time) * 1000)
                    return {
                        'success': False,
                        'error': f'Request timeout after {self.timeout}s',
                        'elapsed_ms': elapsed_ms,
                        'attempts': attempt
                    }
                
                # Wait before retry
                delay = self.backoff_factor * (2 ** (attempt - 1))
                ic(f"⏳ Waiting {delay}s before retry")
                time.sleep(delay)
                
            except requests.exceptions.ConnectionError as e:
                ic(f"🔌 Connection error on attempt {attempt}", str(e))
                
                if attempt >= self.max_retries:
                    elapsed_ms = int((time.time() - start_time) * 1000)
                    return {
                        'success': False,
                        'error': f'Connection error: {str(e)}',
                        'elapsed_ms': elapsed_ms,
                        'attempts': attempt
                    }
                
                # Wait before retry
                delay = self.backoff_factor * (2 ** (attempt - 1))
                ic(f"⏳ Waiting {delay}s before retry")
                time.sleep(delay)
                
            except Exception as e:
                ic("💥 Unexpected error", type(e).__name__, str(e))
                elapsed_ms = int((time.time() - start_time) * 1000)
                
                return {
                    'success': False,
                    'error': f'Unexpected error: {str(e)}',
                    'elapsed_ms': elapsed_ms,
                    'attempts': attempt
                }
        
        # Max retries exceeded
        elapsed_ms = int((time.time() - start_time) * 1000)
        ic("❌ Max retries exceeded", attempt)
        
        return {
            'success': False,
            'error': f'Max retries ({self.max_retries}) exceeded',
            'elapsed_ms': elapsed_ms,
            'attempts': attempt
        }

# Global HTTP client instance
http_client = AIHttpClient(
    max_retries=3,
    backoff_factor=0.5,
    timeout=30
)

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

@app.route('/api/couchbase/save-preferences', methods=['POST'])
def save_user_preferences():
    """Save user preferences using K/V upsert"""
    try:
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
        
        # K/V UPSERT operation (no query needed!)
        result = collection.upsert(user_id, preferences)
        
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
            "flow_diagram": false
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
    try:
        request_data = request.json
        ic("👁️ Preview AI payload request received")
        
        # Extract request parameters
        raw_data = request_data.get('data', {})
        prompt = request_data.get('prompt', 'Analyze query performance')
        selections = request_data.get('selections', {})
        options = request_data.get('options', {})
        
        if not raw_data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        ic(f"📊 Data size: {len(str(raw_data))} bytes")
        ic(f"🎯 Selections: {selections}")
        
        # Build payload from raw data (no caching)
        payload = ai_analyzer.payload_builder.build_payload_from_data(
            raw_data=raw_data,
            user_prompt=prompt,
            selections=selections,
            options=options
        )
        
        # Extract mapping table if obfuscated (don't send to AI, but return to client)
        obfuscation_mapping = payload.pop('_obfuscation_mapping', None)
        
        # Calculate size
        import json
        payload_json = json.dumps(payload, indent=2)
        size_bytes = len(payload_json.encode('utf-8'))
        
        ic(f"✅ Payload preview ready, size={size_bytes} bytes")
        
        response_data = {
            'success': True,
            'payload': payload,
            'payload_json': payload_json,  # Pre-formatted for display
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
            "flow_diagram": false
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
        ic("🤖 AI Analysis request received")
        
        # Extract parameters
        raw_data = request_data.get('data', {})
        prompt = request_data.get('prompt', 'Analyze query performance')
        provider = request_data.get('provider', 'openai')
        model = request_data.get('model')
        api_key = request_data.get('apiKey')
        api_url = request_data.get('apiUrl')
        endpoint = request_data.get('endpoint', '/chat/completions')
        selections = request_data.get('selections', {})
        options = request_data.get('options', {})
        
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
            options=options
        )
        
        # Extract mapping table if obfuscated (for de-obfuscation later)
        obfuscation_mapping = ai_payload_data.pop('_obfuscation_mapping', None)
        
        ic(f"📊 Payload built: {len(str(ai_payload_data))} bytes")
        if obfuscation_mapping:
            ic(f"🔑 Obfuscation mapping: {len(obfuscation_mapping)} tokens")
        
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
            
            # Skip to save logic below
            result = {
                'success': True,
                'data': analysis_data,
                'elapsed_ms': 0
            }
        else:
            # Get AI system prompt with response format instructions
            system_prompt = ai_analyzer.get_ai_system_prompt()
            
            # Format for AI provider (convert to chat messages format)
            if provider == 'openai':
                ai_request_payload = {
                    'model': model or 'gpt-4o',
                    'messages': [
                        {
                            'role': 'system',
                            'content': system_prompt
                        },
                        {
                            'role': 'user',
                            'content': f"{prompt}\n\nQuery Data:\n{json.dumps(ai_payload_data['data'], indent=2)}"
                        }
                    ],
                    'response_format': {'type': 'json_object'}  # Request JSON response
                }
            elif provider == 'anthropic':
                ai_request_payload = {
                    'model': model or 'claude-3-5-sonnet-20241022',
                    'max_tokens': 4096,
                    'messages': [
                        {
                            'role': 'user',
                            'content': f"{system_prompt}\n\n{prompt}\n\nQuery Data:\n{json.dumps(ai_payload_data['data'], indent=2)}"
                        }
                    ]
                }
            else:
                # Generic format
                ai_request_payload = {
                    'prompt': f"{system_prompt}\n\n{prompt}\n\nQuery Data:\n{json.dumps(ai_payload_data['data'], indent=2)}"
                }
            
            ic("📤 Sending to AI provider", provider, model)
            
            # Prepare headers
            headers = {
                'Authorization': f'Bearer {api_key}',
            }
            
            if provider == 'anthropic':
                headers['x-api-key'] = api_key
                headers['anthropic-version'] = '2023-06-01'
                del headers['Authorization']
            
            # Build full URL
            full_url = api_url.rstrip('/') + '/' + endpoint.lstrip('/')
            
            # Make AI API call
            result = http_client.call_api(
                method='POST',
                url=full_url,
                headers=headers,
                json_data=ai_request_payload
            )
        
        ic("📥 AI response received", result.get('success'))
        
        if result['success']:
            analysis_data = result['data']
            
            # De-obfuscate AI response if we have mapping
            if obfuscation_mapping:
                ic("🔓 De-obfuscating AI response")
                obfuscator = ai_analyzer.DataObfuscator()
                
                # Convert analysis to JSON string, de-obfuscate, convert back
                analysis_json = json.dumps(analysis_data)
                deobfuscated_json = obfuscator.deobfuscate_text(analysis_json, obfuscation_mapping)
                analysis_data = json.loads(deobfuscated_json)
                
                ic(f"✅ De-obfuscation complete, restored {len(obfuscation_mapping)} tokens")
            
            # Save to Couchbase if requested
            saved_doc_id = None
            if options.get('store_results', False):
                try:
                    ic("💾 Attempting to save AI analysis to Couchbase")
                    
                    # Get Couchbase config from request
                    cb_config = request_data.get('couchbaseConfig', {})
                    
                    if cb_config and cb_config.get('cluster'):
                        # Build document to save
                        import uuid
                        from datetime import datetime
                        
                        doc_id = f"ai_analysis_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{str(uuid.uuid4())[:8]}"
                        
                        # Calculate payload sizes
                        payload_size = len(json.dumps(ai_payload_data).encode('utf-8'))
                        response_size = len(json.dumps(analysis_data).encode('utf-8'))
                        
                        save_doc = {
                            'docType': 'ai_analysis',
                            'createdAt': datetime.utcnow().isoformat() + 'Z',
                            'status': 'completed',  # completed | failed | pending
                            'provider': provider,
                            'model': model,
                            'prompt': prompt,
                            'payload': ai_payload_data,
                            'aiResponse': analysis_data,
                            'parseJson': request_data.get('parseContext', {}),  # Filter and data source state
                            'metadata': {
                                'obfuscated': obfuscation_mapping is not None,
                                'elapsed_ms': result.get('elapsed_ms'),
                                'selections': selections,
                                'total_queries': len(raw_data.get('everyQueryData', [])),
                                'requestPayloadSize': payload_size,
                                'responsePayloadSize': response_size
                            }
                        }
                        
                        # Save to cb_tools.query.analyzer
                        cluster = get_couchbase_connection(cb_config['cluster'])
                        if cluster:
                            bucket = cluster.bucket(cb_config['bucketConfig']['bucket'])
                            collection = bucket.scope(cb_config['bucketConfig']['analyzerScope']).collection(
                                cb_config['bucketConfig']['analyzerCollection']
                            )
                            
                            collection.upsert(doc_id, save_doc)
                            saved_doc_id = doc_id
                            ic(f"✅ Saved to Couchbase: {doc_id}")
                        else:
                            ic("⚠️ Couchbase not connected, skipping save")
                    else:
                        ic("⚠️ No Couchbase config provided, skipping save")
                        
                except Exception as e:
                    ic(f"❌ Error saving to Couchbase: {str(e)}")
                    # Don't fail the request if save fails
            
            return jsonify({
                'success': True,
                'analysis': analysis_data,
                'elapsed_ms': result.get('elapsed_ms'),
                'provider': provider,
                'model': model,
                'deobfuscated': obfuscation_mapping is not None,
                'saved_to_couchbase': saved_doc_id is not None,
                'document_id': saved_doc_id
            })
        else:
            return jsonify({
                'success': False,
                'error': result.get('error'),
                'elapsed_ms': result.get('elapsed_ms')
            }), 500
        
    except Exception as e:
        ic("💥 Error in AI analysis", str(e))
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

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
                   `metadata`,
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
        custom_client = AIHttpClient(
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
