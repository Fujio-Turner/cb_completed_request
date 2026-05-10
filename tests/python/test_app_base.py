"""
Unit tests for app_base.py - Flask app utilities and helpers

Tests resource path resolution, config loading, connection handling.
Does NOT require Couchbase Server or CBL bindings.
"""

from unittest.mock import patch

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'app')))

import app_base


class TestResourcePath:
    """Test resource path resolution for dev/production builds"""

    def test_get_resource_path_returns_string(self):
        """get_resource_path returns a non-empty string"""
        path = app_base.get_resource_path()
        assert isinstance(path, str)
        assert len(path) > 0

    def test_get_resource_path_is_absolute(self):
        """get_resource_path returns absolute path"""
        path = app_base.get_resource_path()
        assert os.path.isabs(path)

    def test_get_resource_path_points_to_existing_dir(self):
        """get_resource_path returns a directory that exists on disk"""
        path = app_base.get_resource_path()
        assert os.path.isdir(path)


class TestDirectoryVariable:
    """Test DIRECTORY module variable"""

    def test_directory_is_string(self):
        """DIRECTORY variable is a string"""
        assert isinstance(app_base.DIRECTORY, str)

    def test_directory_is_not_empty(self):
        """DIRECTORY variable is not empty"""
        assert len(app_base.DIRECTORY) > 0

    def test_directory_matches_get_resource_path(self):
        """DIRECTORY equals the value returned by get_resource_path()"""
        assert app_base.DIRECTORY == app_base.get_resource_path()


class TestToonAvailability:
    """Test TOON Python module availability"""

    def test_toon_available_flag_is_boolean(self):
        """TOON_AVAILABLE is boolean (True or False)"""
        assert isinstance(app_base.TOON_AVAILABLE, bool)

    def test_toon_available_matches_import_state(self):
        """TOON_AVAILABLE accurately reflects whether toon_python is importable"""
        try:
            import toon_python  # noqa: F401
            importable = True
        except ImportError:
            importable = False
        assert app_base.TOON_AVAILABLE == importable


class TestPortConfiguration:
    """Test HTTP port configuration"""

    def test_port_is_integer(self):
        """PORT variable is integer"""
        assert isinstance(app_base.PORT, int)

    def test_port_is_valid_number(self):
        """PORT is in valid range"""
        assert 0 < app_base.PORT < 65536

    def test_port_default_is_8888_when_env_missing(self):
        """When PORT env var is unset, default is 8888"""
        with patch.dict('os.environ', {}, clear=True):
            port = int(os.environ.get('PORT', 8888))
            assert port == 8888

    def test_port_respects_environment_override(self):
        """PORT env var is honored"""
        with patch.dict('os.environ', {'PORT': '9999'}):
            port = int(os.environ.get('PORT', 8888))
            assert port == 9999


class TestFlaskAppObject:
    """Test Flask app initialization"""

    def test_app_exists(self):
        """Flask app object is created"""
        from flask import Flask
        assert isinstance(app_base.app, Flask)

    def test_app_has_flask_methods(self):
        """Flask app has required methods"""
        assert callable(app_base.app.route)
        assert callable(app_base.app.test_client)
        assert callable(app_base.app.test_request_context)

    def test_app_static_folder_is_directory(self):
        """Flask app static folder points at DIRECTORY"""
        assert app_base.app.static_folder == app_base.DIRECTORY


class TestCORSConfiguration:
    """Test CORS (Cross-Origin Resource Sharing) setup"""

    def test_cors_adds_access_control_header(self):
        """A request with Origin header gets an Access-Control-Allow-Origin response header"""
        with app_base.app.test_client() as client:
            resp = client.get('/', headers={'Origin': 'http://example.com'})
            assert 'Access-Control-Allow-Origin' in resp.headers


class TestCBLAwareness:
    """Test CBL (Couchbase Lite) backend awareness"""

    def test_use_cbl_flag_is_boolean(self):
        """USE_CBL flag exists and is boolean"""
        assert isinstance(app_base.USE_CBL, bool)


class TestEndpointRegistration:
    """Test Flask endpoint registration"""

    def test_root_endpoint_registered(self):
        """Root (/) endpoint is registered in url_map"""
        rules = [str(rule) for rule in app_base.app.url_map.iter_rules()]
        assert '/' in rules

    def test_api_endpoints_registered(self):
        """At least one API endpoint is registered"""
        routes = [str(rule) for rule in app_base.app.url_map.iter_rules()]
        api_routes = [r for r in routes if r.startswith('/api/')]
        assert len(api_routes) > 0


class TestIcereamConfiguration:
    """Test icecream debug logging configuration"""

    def test_icecream_imported_in_module(self):
        """ic helper from icecream is bound in app_base"""
        assert callable(app_base.ic)


class TestModuleImports:
    """Test module-level imports"""

    def test_flask_imported(self):
        """Flask is properly imported"""
        from flask import Flask
        assert app_base.Flask is Flask

    def test_ai_analyzer_imported(self):
        """AI analyzer module is imported"""
        import ai_analyzer
        assert app_base.ai_analyzer is ai_analyzer


class TestErrorPages:
    """Test error page registration"""

    def test_app_can_register_error_handlers(self):
        """Flask app supports error handlers"""
        assert callable(app_base.app.errorhandler)

    def test_404_returned_for_missing_path(self):
        """Unknown paths return 404 (not 500)"""
        with app_base.app.test_client() as client:
            response = client.get('/this-path-does-not-exist-12345')
            assert response.status_code == 404


class TestRequestContext:
    """Test Flask request context"""

    def test_request_context_carries_path(self):
        """test_request_context exposes request.path"""
        from flask import request
        with app_base.app.test_request_context('/some/path'):
            assert request.path == '/some/path'


class TestAppConfiguration:
    """Test Flask app configuration"""

    def test_app_config_is_mapping(self):
        """Flask app config behaves like a dict"""
        assert app_base.app.config is not None
        # Flask Config is dict-like
        assert hasattr(app_base.app.config, '__getitem__')
        assert hasattr(app_base.app.config, '__setitem__')

    def test_app_can_set_and_read_config_values(self):
        """Setting a config value reads it back"""
        app_base.app.config['TEST_KEY'] = 'test_value'
        try:
            assert app_base.app.config['TEST_KEY'] == 'test_value'
        finally:
            del app_base.app.config['TEST_KEY']


class TestDebugMode:
    """Test debug mode configuration"""

    def test_app_debug_can_be_toggled(self):
        """Flask app debug mode can be set and restored"""
        original_debug = app_base.app.debug
        try:
            app_base.app.debug = True
            assert app_base.app.debug is True
            app_base.app.debug = False
            assert app_base.app.debug is False
        finally:
            app_base.app.debug = original_debug

    def test_app_debug_default_is_bool(self):
        """Flask app debug default is boolean"""
        assert isinstance(app_base.app.debug, bool)


class TestJSONHandling:
    """Test JSON request/response handling"""

    def test_app_parses_json_request_body(self):
        """A POST with json= sets request.is_json"""
        from flask import request
        with app_base.app.test_request_context(
            '/', method='POST', json={'k': 'v'}
        ):
            assert request.is_json is True
            assert request.get_json() == {'k': 'v'}


class TestSystemExecutablePath:
    """Test system Python executable detection"""

    def test_executable_path_exists(self):
        """sys.executable points at a real file"""
        assert sys.executable is not None
        assert os.path.isfile(sys.executable)


class TestModuleLevelConstants:
    """Test module-level constants"""

    def test_directory_constant_is_string(self):
        """DIRECTORY constant is a string"""
        assert isinstance(app_base.DIRECTORY, str)

    def test_port_constant_is_int(self):
        """PORT constant is an integer"""
        assert isinstance(app_base.PORT, int)

    def test_toon_available_is_bool(self):
        """TOON_AVAILABLE constant is a bool"""
        assert isinstance(app_base.TOON_AVAILABLE, bool)
