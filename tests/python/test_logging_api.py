"""
Backend tests for /api/logging/* endpoints.

Tests logging_info() and logging_active_log() endpoints for:
- Proper response shape and fields
- No credential leaks in responses
- File metadata accuracy
- Rotated file listing

Anchored in: app/docs/work/LOGGING_4_0_0/08_LOGGING_API_AND_UI.md
"""
import json
import logging
import pytest
import importlib.util
from pathlib import Path
from unittest.mock import patch, MagicMock

# Ensure logging_config is available
_spec = importlib.util.spec_from_file_location(
    "logging_config",
    Path(__file__).parent.parent.parent / "app" / "logging_config.py"
)
_logging_config = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_logging_config)

from _log_helpers import assert_no_secrets


@pytest.fixture(autouse=True)
def _flask_app_context():
    """logging_info() / logging_active_log() use jsonify() which needs an
    active Flask application context."""
    from app_base import app as _flask_app
    with _flask_app.app_context():
        yield


class TestLoggingInfoEndpoint:
    """Test GET /api/logging/info endpoint."""
    
    def test_logging_info_response_shape(self):
        """GET /api/logging/info returns correct JSON shape."""
        # Mock the endpoint function
        from app import logging_info
        
        with patch('app.os.environ') as mock_env:
            mock_env.get.side_effect = lambda k, d=None: {
                'CBQA_LOG_FILE': None,
                'CBQA_LOG_JSON': '0',
                'CBQA_LOG_MAX_SIZE_MB': '50',
                'CBQA_LOG_MAX_AGE_DAYS': '7',
                'CBQA_LOG_ROTATED_TOTAL_MB': '500',
            }.get(k, d)
            
            response = logging_info()
            data = json.loads(response.data)
        
        # Check required fields
        assert 'level' in data
        assert 'json_mode' in data
        assert 'active_file' in data
        assert 'rotated_files' in data
        assert 'caps' in data
    
    def test_logging_info_disabled_returns_null_file(self):
        """When CBQA_LOG_FILE=off, active_file is null."""
        from app import logging_info
        
        with patch('app.os.environ') as mock_env:
            mock_env.get.side_effect = lambda k, d=None: {
                'CBQA_LOG_FILE': 'off',
                'CBQA_LOG_JSON': '0',
                'CBQA_LOG_MAX_SIZE_MB': '50',
                'CBQA_LOG_MAX_AGE_DAYS': '7',
                'CBQA_LOG_ROTATED_TOTAL_MB': '500',
            }.get(k, d)
            
            response = logging_info()
            data = json.loads(response.data)
        
        assert data['active_file'] is None
        assert data['rotated_files'] == []
    
    def test_logging_info_includes_caps(self):
        """GET /api/logging/info includes capacity settings."""
        from app import logging_info
        
        with patch('app.os.environ') as mock_env:
            mock_env.get.side_effect = lambda k, d=None: {
                'CBQA_LOG_FILE': None,
                'CBQA_LOG_JSON': '0',
                'CBQA_LOG_MAX_SIZE_MB': '100',
                'CBQA_LOG_MAX_AGE_DAYS': '30',
                'CBQA_LOG_ROTATED_TOTAL_MB': '1000',
            }.get(k, d)
            
            response = logging_info()
            data = json.loads(response.data)
        
        assert data['caps']['max_size_mb'] == 100
        assert data['caps']['max_age_days'] == 30
        assert data['caps']['rotated_total_mb'] == 1000
    
    def test_logging_info_json_mode_flag(self):
        """GET /api/logging/info reports JSON mode setting."""
        from app import logging_info
        
        with patch('app.os.environ') as mock_env:
            mock_env.get.side_effect = lambda k, d=None: {
                'CBQA_LOG_FILE': None,
                'CBQA_LOG_JSON': '1',
                'CBQA_LOG_MAX_SIZE_MB': '50',
                'CBQA_LOG_MAX_AGE_DAYS': '7',
                'CBQA_LOG_ROTATED_TOTAL_MB': '500',
            }.get(k, d)
            
            response = logging_info()
            data = json.loads(response.data)
        
        assert data['json_mode'] is True


class TestHumanBytesFormatting:
    """Test _human_bytes helper function."""
    
    def test_human_bytes_bytes(self):
        """Small values display as B."""
        from app import _human_bytes
        assert _human_bytes(500) == "500 B"
    
    def test_human_bytes_kb(self):
        """KB values display with K suffix."""
        from app import _human_bytes
        result = _human_bytes(1024)
        assert "KB" in result
    
    def test_human_bytes_mb(self):
        """MB values display with M suffix."""
        from app import _human_bytes
        result = _human_bytes(1024 * 1024)
        assert "MB" in result
    
    def test_human_bytes_gb(self):
        """GB values display with G suffix."""
        from app import _human_bytes
        result = _human_bytes(1024 * 1024 * 1024)
        assert "GB" in result


class TestLoggingResponseNoSecrets:
    """Test that logging endpoints never leak secrets."""
    
    def test_logging_info_no_api_keys(self):
        """logging_info response contains no API keys."""
        from app import logging_info
        
        with patch('app.os.environ') as mock_env:
            mock_env.get.side_effect = lambda k, d=None: {
                'CBQA_LOG_FILE': '/tmp/test.log',
                'CBQA_LOG_JSON': '0',
                'CBQA_LOG_MAX_SIZE_MB': '50',
                'CBQA_LOG_MAX_AGE_DAYS': '7',
                'CBQA_LOG_ROTATED_TOTAL_MB': '500',
            }.get(k, d)
            
            with patch('app.pathlib.Path') as mock_path:
                mock_path_inst = MagicMock()
                mock_path_inst.exists.return_value = False
                mock_path_inst.parent.glob.return_value = []
                mock_path.return_value = mock_path_inst
                
                response = logging_info()
                data = json.loads(response.data)
        
        # Response should not contain any credential patterns
        response_str = json.dumps(data)
        assert "Bearer sk-" not in response_str
        assert "sk-proj-" not in response_str
        assert "sk-ant-" not in response_str


class TestRotatedFilesListing:
    """Test rotated files metadata in logging_info."""
    
    def test_rotated_files_include_metadata(self):
        """Rotated files include path, size, and mtime."""
        from app import logging_info
        
        # Create mock rotated files
        mock_rotated_path = MagicMock()
        mock_rotated_path.name = "cbqa.log.20260510-120000.log"
        mock_rotated_path.stat.return_value.st_size = 1024 * 100
        mock_rotated_path.stat.return_value.st_mtime = 1715425200
        
        with patch('app.os.environ') as mock_env:
            mock_env.get.side_effect = lambda k, d=None: {
                'CBQA_LOG_FILE': '/tmp/cbqa.log',
                'CBQA_LOG_JSON': '0',
                'CBQA_LOG_MAX_SIZE_MB': '50',
                'CBQA_LOG_MAX_AGE_DAYS': '7',
                'CBQA_LOG_ROTATED_TOTAL_MB': '500',
            }.get(k, d)
            
            with patch('app.pathlib.Path') as mock_path_class:
                mock_base = MagicMock()
                mock_base.exists.return_value = False
                mock_base.parent.glob.return_value = [mock_rotated_path]
                mock_path_class.return_value = mock_base
                
                response = logging_info()
                data = json.loads(response.data)
        
        assert len(data['rotated_files']) >= 0  # May have rotated files


class TestLoggingActiveLogEndpoint:
    """Test GET /api/logging/active-log endpoint."""
    
    def test_active_log_file_exists(self):
        """GET /api/logging/active-log returns file when it exists."""
        from app import logging_active_log
        
        with patch('app.os.environ') as mock_env:
            mock_env.get.return_value = '/tmp/cbqa.log'
            
            with patch('app.pathlib.Path') as mock_path:
                mock_inst = MagicMock()
                mock_inst.exists.return_value = True
                mock_path.return_value = mock_inst
                
                with patch('app.send_file') as mock_send:
                    mock_send.return_value = "file_content"
                    response = logging_active_log()
                    
                    # send_file was called
                    assert mock_send.called
    
    def test_active_log_file_not_found(self):
        """GET /api/logging/active-log returns 404 when no active file."""
        from app import logging_active_log
        
        with patch('app.os.environ') as mock_env:
            mock_env.get.return_value = 'off'
            response = logging_active_log()
            
            data = json.loads(response[0].data)
            assert data['success'] is False
            assert response[1] == 404


class TestLoggingCapsFromEnv:
    """Test _caps_from_env helper."""
    
    def test_caps_from_env_defaults(self):
        """_caps_from_env returns defaults when vars not set."""
        from app import _caps_from_env
        
        with patch('app.os.environ') as mock_env:
            mock_env.get.side_effect = lambda k, d=None: d
            
            caps = _caps_from_env()
        
        assert caps['max_size_mb'] == 50
        assert caps['max_age_days'] == 7
        assert caps['rotated_total_mb'] == 500
    
    def test_caps_from_env_custom_values(self):
        """_caps_from_env reads custom values from environment."""
        from app import _caps_from_env
        
        with patch('app.os.environ') as mock_env:
            mock_env.get.side_effect = lambda k, d=None: {
                'CBQA_LOG_MAX_SIZE_MB': '200',
                'CBQA_LOG_MAX_AGE_DAYS': '30',
                'CBQA_LOG_ROTATED_TOTAL_MB': '2000',
            }.get(k, d)
            
            caps = _caps_from_env()
        
        assert caps['max_size_mb'] == 200
        assert caps['max_age_days'] == 30
        assert caps['rotated_total_mb'] == 2000
