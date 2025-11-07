#!/usr/bin/env python3
"""
Simple HTTP server for testing Liquid Snake with ES6 modules
Runs on http://localhost:5555

Includes Couchbase REST API endpoints for Issue #231:
- POST /api/couchbase/test - Test connection
- POST /api/couchbase/query - Execute N1QL query
- POST /api/couchbase/save-analyzer - Save analyzer data
- GET /api/couchbase/load-analyzer/<requestId> - Load analyzer data
- POST /api/couchbase/save-preferences - Save user preferences
- GET /api/couchbase/load-preferences/<userId> - Load user preferences
"""

import http.server
import socketserver
import os
import json
import urllib.parse
from couchbase.cluster import Cluster
from couchbase.options import ClusterOptions
from couchbase.auth import PasswordAuthenticator
from couchbase.exceptions import (
    DocumentExistsException,
    DocumentNotFoundException,
    TimeoutException, 
    CouchbaseException
)
from datetime import timedelta

PORT = 5555
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

# Couchbase connection cache
_cluster = None
_config = None

def get_couchbase_connection(config):
    """Get or create Couchbase cluster connection"""
    global _cluster, _config
    
    # If config changed or no connection, create new one
    if _config != config or _cluster is None:
        if _cluster:
            try:
                _cluster.close()
            except:
                pass
        
        try:
            _cluster = Cluster(
                f"couchbase://{config['url'].replace('http://', '').replace('https://', '').split(':')[0]}",
                ClusterOptions(PasswordAuthenticator(config['username'], config['password']))
            )
            _config = config
            return _cluster
        except Exception as e:
            print(f"❌ Failed to connect to Couchbase: {e}")
            return None
    
    return _cluster

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        # Ensure correct MIME types for JS modules
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()
    
    def do_OPTIONS(self):
        """Handle preflight CORS requests"""
        self.send_response(200)
        self.end_headers()
    
    def do_POST(self):
        """Handle POST requests for Couchbase API"""
        if self.path.startswith('/api/couchbase/'):
            self.handle_couchbase_api()
        else:
            super().do_POST()
    
    def do_GET(self):
        """Handle GET requests"""
        if self.path.startswith('/api/couchbase/'):
            self.handle_couchbase_api()
        else:
            super().do_GET()
    
    def handle_couchbase_api(self):
        """Route Couchbase API requests"""
        try:
            # Parse request body for POST requests
            content_length = int(self.headers.get('Content-Length', 0))
            request_data = {}
            if content_length > 0:
                body = self.rfile.read(content_length)
                request_data = json.loads(body.decode('utf-8'))
            
            # Route to appropriate handler
            if self.path == '/api/couchbase/test':
                self.test_connection(request_data)
            elif self.path == '/api/couchbase/query':
                self.execute_query(request_data)
            elif self.path == '/api/couchbase/save-analyzer':
                self.save_analyzer_data(request_data)
            elif self.path.startswith('/api/couchbase/load-analyzer/'):
                request_id = self.path.split('/')[-1]
                self.load_analyzer_data(request_id, request_data)
            elif self.path == '/api/couchbase/save-preferences':
                self.save_user_preferences(request_data)
            elif self.path.startswith('/api/couchbase/load-preferences/'):
                user_id = self.path.split('/')[-1]
                self.load_user_preferences(user_id, request_data)
            else:
                self.send_json_response({'error': 'Unknown API endpoint'}, 404)
        
        except Exception as e:
            print(f"❌ API Error: {e}")
            self.send_json_response({'error': str(e)}, 500)
    
    def send_json_response(self, data, status=200):
        """Send JSON response"""
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))
    
    def test_connection(self, data):
        """Test Couchbase connection"""
        try:
            cluster_config = data.get('config', {})
            cluster = get_couchbase_connection(cluster_config)
            
            if cluster:
                # Try to ping the cluster
                bucket_name = data.get('bucketConfig', {}).get('bucket', 'cb_tools')
                bucket = cluster.bucket(bucket_name)
                bucket.ping()
                
                self.send_json_response({
                    'success': True,
                    'message': f'Connected to Couchbase cluster at {cluster_config["url"]}'
                })
            else:
                self.send_json_response({
                    'success': False,
                    'error': 'Failed to connect'
                }, 500)
        except Exception as e:
            self.send_json_response({
                'success': False,
                'error': str(e)
            }, 500)
    
    def execute_query(self, data):
        """Execute N1QL query"""
        try:
            cluster_config = data.get('config', {})
            query = data.get('query', '')
            params = data.get('params', {})
            
            cluster = get_couchbase_connection(cluster_config)
            if not cluster:
                self.send_json_response({'success': False, 'error': 'Not connected'}, 500)
                return
            
            # Execute query
            result = cluster.query(query, **params)
            rows = [row for row in result]
            
            self.send_json_response({
                'success': True,
                'results': rows
            })
        except Exception as e:
            self.send_json_response({
                'success': False,
                'error': str(e)
            }, 500)
    
    def save_analyzer_data(self, data):
        """Save query analyzer data"""
        try:
            cluster_config = data.get('config', {})
            bucket_config = data.get('bucketConfig', {})
            request_id = data.get('requestId')
            analyzer_data = data.get('data', {})
            
            cluster = get_couchbase_connection(cluster_config)
            if not cluster:
                self.send_json_response({'success': False, 'error': 'Not connected'}, 500)
                return
            
            bucket = cluster.bucket(bucket_config['bucket'])
            collection = bucket.scope(bucket_config['analyzerScope']).collection(bucket_config['analyzerCollection'])
            
            # Upsert document
            result = collection.upsert(request_id, analyzer_data)
            
            self.send_json_response({
                'success': True,
                'cas': result.cas
            })
        except Exception as e:
            self.send_json_response({
                'success': False,
                'error': str(e)
            }, 500)
    
    def load_analyzer_data(self, request_id, data):
        """Load query analyzer data"""
        try:
            cluster_config = data.get('config', {})
            bucket_config = data.get('bucketConfig', {})
            
            cluster = get_couchbase_connection(cluster_config)
            if not cluster:
                self.send_json_response({'success': False, 'error': 'Not connected'}, 500)
                return
            
            bucket = cluster.bucket(bucket_config['bucket'])
            collection = bucket.scope(bucket_config['analyzerScope']).collection(bucket_config['analyzerCollection'])
            
            # Get document
            result = collection.get(request_id)
            
            self.send_json_response({
                'success': True,
                'data': result.content_as[dict]
            })
        except Exception as e:
            self.send_json_response({
                'success': False,
                'error': str(e)
            }, 500)
    
    def save_user_preferences(self, data):
        """Save user preferences using K/V upsert"""
        try:
            cluster_config = data.get('config', {})
            bucket_config = data.get('bucketConfig', {})
            user_id = data.get('userId')  # Should be 'user_config'
            preferences = data.get('preferences', {})
            
            cluster = get_couchbase_connection(cluster_config)
            if not cluster:
                self.send_json_response({'success': False, 'error': 'Not connected'}, 500)
                return
            
            bucket = cluster.bucket(bucket_config['bucket'])
            collection = bucket.scope(bucket_config['preferencesScope']).collection(bucket_config['preferencesCollection'])
            
            # K/V UPSERT operation (no query needed!)
            result = collection.upsert(user_id, preferences)
            
            print(f"✅ Saved preferences to {user_id} with CAS: {result.cas}")
            
            self.send_json_response({
                'success': True,
                'cas': result.cas
            })
        except Exception as e:
            print(f"❌ Error saving preferences: {e}")
            self.send_json_response({
                'success': False,
                'error': str(e)
            }, 500)
    
    def load_user_preferences(self, user_id, data):
        """Load user preferences using K/V get"""
        try:
            cluster_config = data.get('config', {})
            bucket_config = data.get('bucketConfig', {})
            
            cluster = get_couchbase_connection(cluster_config)
            if not cluster:
                self.send_json_response({'success': False, 'error': 'Not connected'}, 500)
                return
            
            bucket = cluster.bucket(bucket_config['bucket'])
            collection = bucket.scope(bucket_config['preferencesScope']).collection(bucket_config['preferencesCollection'])
            
            # K/V GET operation (no query needed!)
            result = collection.get(user_id)
            content = result.content_as[dict]
            
            print(f"✅ Loaded preferences from {user_id} with CAS: {result.cas}")
            
            self.send_json_response({
                'success': True,
                'data': content,
                'cas': result.cas
            })
        except DocumentNotFoundException:
            print(f"ℹ️  Document {user_id} not found (first time user) - returning defaults")
            self.send_json_response({
                'success': True,
                'data': {},  # Empty preferences = use defaults
                'cas': None,
                'firstTime': True
            }, 200)
        except Exception as e:
            print(f"❌ Error loading preferences: {e}")
            self.send_json_response({
                'success': False,
                'error': str(e)
            }, 500)
    
    def guess_type(self, path):
        mimetype = super().guess_type(path)
        # Ensure .js files are served with correct MIME type
        if path.endswith('.js'):
            return 'application/javascript'
        return mimetype

if __name__ == '__main__':
    Handler = MyHTTPRequestHandler
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"🚀 Liquid Snake Server")
        print(f"📡 Serving at http://localhost:{PORT}")
        print(f"📂 Directory: {DIRECTORY}")
        print(f"🌐 Open: http://localhost:{PORT}/index.html")
        print(f"🛑 Press Ctrl+C to stop\n")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n👋 Server stopped")
