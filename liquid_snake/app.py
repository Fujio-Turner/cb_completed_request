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
from couchbase.cluster import Cluster
from couchbase.options import ClusterOptions
from couchbase.auth import PasswordAuthenticator
from couchbase.exceptions import (
    DocumentExistsException,
    DocumentNotFoundException,
    TimeoutException, 
    CouchbaseException
)

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
        cluster_config = data.get('config', {})
        cluster = get_couchbase_connection(cluster_config)
        
        if cluster:
            # Try to ping the cluster
            bucket_name = data.get('bucketConfig', {}).get('bucket', 'cb_tools')
            bucket = cluster.bucket(bucket_name)
            bucket.ping()
            
            return jsonify({
                'success': True,
                'message': f'Connected to Couchbase cluster at {cluster_config["url"]}'
            })
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
        cluster_config = data.get('config', {})
        query = data.get('query', '')
        params = data.get('params', {})
        
        cluster = get_couchbase_connection(cluster_config)
        if not cluster:
            return jsonify({'success': False, 'error': 'Not connected'}), 500
        
        # Execute query
        result = cluster.query(query, **params)
        rows = [row for row in result]
        
        return jsonify({
            'success': True,
            'results': rows
        })
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
        
        print(f"✅ Saved preferences to {user_id} with CAS: {result.cas}")
        
        return jsonify({
            'success': True,
            'cas': result.cas
        })
    except Exception as e:
        print(f"❌ Error saving preferences: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/couchbase/load-preferences/<user_id>', methods=['POST'])
def load_user_preferences(user_id):
    """Load user preferences using K/V get"""
    try:
        data = request.json
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
        
        print(f"✅ Loaded preferences from {user_id} with CAS: {result.cas}")
        
        return jsonify({
            'success': True,
            'data': content,
            'cas': result.cas
        })
    except DocumentNotFoundException:
        print(f"ℹ️  Document {user_id} not found (first time user) - returning defaults")
        return jsonify({
            'success': True,
            'data': {
                'docType': 'config'
            },
            'cas': None,
            'firstTime': True
        })
    except Exception as e:
        print(f"❌ Error loading preferences: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    print(f"🚀 Liquid Snake Server (Flask)")
    print(f"📡 Serving at http://localhost:{PORT}")
    print(f"📂 Directory: {DIRECTORY}")
    print(f"🌐 Open: http://localhost:{PORT}/index.html")
    print(f"🛑 Press Ctrl+C to stop\n")
    
    app.run(host='0.0.0.0', port=PORT, debug=True)
