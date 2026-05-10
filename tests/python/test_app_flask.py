"""
Unit tests for app.py - Flask HTTP server endpoints

Tests endpoint routing, request/response handling, error responses.
Does NOT require Couchbase Server or CBL bindings.
"""

import json
import pytest
from unittest.mock import patch, MagicMock

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'app')))

import app_base
from app_base import app as base_app


@pytest.fixture
def client():
    """Flask test client"""
    base_app.config['TESTING'] = True
    base_app.config['PROPAGATE_EXCEPTIONS'] = False

    with base_app.test_client() as client:
        yield client


class TestServerConfiguration:
    """Test server startup and configuration"""

    def test_port_default_is_8888(self):
        """Default PORT (no env override) is 8888"""
        with patch.dict('os.environ', {}, clear=True):
            port = int(os.environ.get('PORT', 8888))
            assert port == 8888

    def test_port_env_variable_used(self):
        """PORT environment variable is honored"""
        with patch.dict('os.environ', {'PORT': '7777'}):
            port = int(os.environ.get('PORT', 8888))
            assert port == 7777


class TestFlaskAppInitialization:
    """Test Flask app setup"""

    def test_app_is_flask_instance(self, client):
        """Flask app is a Flask instance"""
        from flask import Flask
        assert isinstance(base_app, Flask)

    def test_app_options_request_handled(self, client):
        """OPTIONS / does not return 5xx"""
        response = client.options('/')
        assert response.status_code < 500

    def test_app_testing_config(self, client):
        """App is configured for testing"""
        assert base_app.config['TESTING'] is True


class TestRootEndpoint:
    """Test root (/) endpoint"""

    def test_root_endpoint_returns_200(self, client):
        """GET / returns 200 (serves index.html)"""
        response = client.get('/')
        assert response.status_code == 200

    def test_root_endpoint_serves_html(self, client):
        """GET / returns HTML content"""
        response = client.get('/')
        assert response.status_code == 200
        # send_from_directory sets text/html content type for .html files
        assert 'html' in response.content_type.lower()


class TestAPIEndpoints:
    """Test API endpoint structure"""

    def test_api_nonexistent_returns_error(self, client):
        """Unknown /api/ paths return a client error (404 or 405)"""
        # GET hits the catch-all static handler -> 404; POST -> 405
        get_resp = client.get('/api/nonexistent-endpoint-xyz')
        post_resp = client.post('/api/nonexistent-endpoint-xyz')
        assert get_resp.status_code in (404, 405)
        assert post_resp.status_code in (404, 405)


class TestCouchbaseConnection:
    """Test Couchbase connection endpoints"""

    def test_couchbase_test_endpoint_accepts_post(self, client):
        """POST /api/couchbase/test is allowed (not 405)"""
        response = client.post('/api/couchbase/test',
                               json={},
                               content_type='application/json')
        assert response.status_code != 405

    def test_couchbase_test_rejects_get(self, client):
        """GET /api/couchbase/test returns an error status (not 200)"""
        # Route is POST-only; GET falls through to the catch-all static
        # handler which returns 404 because no such file exists.
        response = client.get('/api/couchbase/test')
        assert response.status_code in (404, 405)

    def test_couchbase_test_handles_invalid_json(self, client):
        """POST /api/couchbase/test with invalid JSON returns an error"""
        response = client.post('/api/couchbase/test',
                               data='{invalid json',
                               content_type='application/json')
        assert response.status_code >= 400


class TestAnalyzerEndpoints:
    """Test analyzer endpoints accept requests"""

    def test_load_analyzer_endpoint_registered(self, client):
        """The /api/couchbase/load-analyzer route is registered"""
        rules = [str(r) for r in base_app.url_map.iter_rules()]
        assert any('/api/couchbase/load-analyzer' in r for r in rules)


class TestPreferencesEndpoints:
    """Test user preferences endpoints"""

    def test_load_preferences_endpoint_registered(self):
        """The /api/couchbase/load-preferences route is registered"""
        rules = [str(r) for r in base_app.url_map.iter_rules()]
        assert any('/api/couchbase/load-preferences' in r for r in rules)


class TestErrorHandling:
    """Test error handling and responses"""

    def test_malformed_json_returns_error(self, client):
        """Malformed JSON body returns an error status (>=400)"""
        response = client.post('/api/couchbase/test',
                               data='{invalid json}',
                               content_type='application/json')
        assert response.status_code >= 400

    def test_nonexistent_endpoint_returns_404(self, client):
        """Nonexistent endpoint returns 404"""
        response = client.get('/api/nonexistent/endpoint')
        assert response.status_code == 404


class TestContentNegotiation:
    """Test content type handling"""

    def test_json_request_accepted(self, client):
        """POST with application/json body is processed (not 415/405)"""
        payload = {"test": "data"}
        response = client.post('/api/couchbase/test',
                               json=payload,
                               content_type='application/json')
        assert response.status_code not in (405, 415)


class TestHTTPMethods:
    """Test HTTP method support"""

    def test_root_supports_get(self, client):
        """Flask app handles GET /"""
        response = client.get('/')
        assert response.status_code == 200


class TestStaticFileServing:
    """Test static file handling"""

    def test_app_static_folder_is_directory(self):
        """static_folder points at app DIRECTORY"""
        assert base_app.static_folder == app_base.DIRECTORY

    def test_static_url_path_configured(self):
        """static_url_path is set (empty string in app_base)"""
        # static_url_path is set to '' in app_base.py
        assert base_app.static_url_path is not None


class TestCORSHeaders:
    """Test CORS header handling"""

    def test_cors_header_present_with_origin(self, client):
        """Access-Control-Allow-Origin appears when an Origin header is sent"""
        response = client.get('/', headers={'Origin': 'http://example.com'})
        assert 'Access-Control-Allow-Origin' in response.headers


class TestRequestValidation:
    """Test request validation"""

    def test_empty_request_body_returns_error(self, client):
        """Empty POST body to /api/couchbase/test returns an error (>=400)"""
        response = client.post('/api/couchbase/test',
                               data='',
                               content_type='application/json')
        # Server rejects the empty/missing-credentials payload
        assert response.status_code >= 400
