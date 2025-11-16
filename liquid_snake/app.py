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
