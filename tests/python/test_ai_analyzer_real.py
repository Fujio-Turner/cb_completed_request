"""
Unit tests for ai_analyzer.py - AI provider integration and session management

Tests functions that exist and don't require Couchbase Server or CBL bindings.
"""

import json
from unittest.mock import patch, MagicMock

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'app')))

import ai_analyzer


class TestPayloadReferenceTemplate:
    """Test payload_reference.json.template loading"""
    
    def test_get_payload_reference_template_returns_dict(self):
        """get_payload_reference_template returns dict or empty dict"""
        result = ai_analyzer.get_payload_reference_template()
        assert isinstance(result, dict)
    
    def test_get_payload_reference_template_missing_file(self):
        """get_payload_reference_template handles missing file gracefully"""
        with patch('ai_analyzer.get_resource_path', return_value='/nonexistent/path'):
            result = ai_analyzer.get_payload_reference_template()
            assert result == {}
    
    def test_get_payload_reference_template_invalid_json(self):
        """get_payload_reference_template handles invalid JSON gracefully"""
        with patch('builtins.open', MagicMock(side_effect=json.JSONDecodeError('test', 'doc', 0))):
            with patch('ai_analyzer.get_resource_path', return_value='/some/path'):
                result = ai_analyzer.get_payload_reference_template()
                assert result == {}


class TestSessionGeneration:
    """Test session ID generation"""
    
    def test_generate_session_id_returns_string(self):
        """generate_session_id returns valid session ID string"""
        session_id = ai_analyzer.generate_session_id()
        assert isinstance(session_id, str)
        assert len(session_id) > 0
    
    def test_session_id_is_unique(self):
        """Multiple generate_session_id calls return different IDs"""
        sid1 = ai_analyzer.generate_session_id()
        sid2 = ai_analyzer.generate_session_id()
        assert sid1 != sid2


class TestDataCaching:
    """Test analyzer data caching"""
    
    def test_cache_analyzer_data_returns_session_id(self):
        """cache_analyzer_data returns session ID"""
        data = {"query": "SELECT * FROM bucket", "duration_ms": 100}
        session_id = ai_analyzer.cache_analyzer_data(data)
        assert isinstance(session_id, str)
        assert len(session_id) > 0
    
    def test_get_cached_data_returns_data(self):
        """get_cached_data retrieves the exact data that was cached"""
        data = {"query": "SELECT * FROM bucket", "duration_ms": 100}
        session_id = ai_analyzer.cache_analyzer_data(data)

        retrieved = ai_analyzer.get_cached_data(session_id)
        assert retrieved == data

    def test_get_cached_data_invalid_session(self):
        """get_cached_data returns None for an unknown session ID"""
        result = ai_analyzer.get_cached_data("invalid_session_xyz")
        assert result is None


class TestCacheStats:
    """Test cache statistics"""
    
    def test_get_cache_stats_returns_dict(self):
        """get_cache_stats returns statistics dictionary"""
        stats = ai_analyzer.get_cache_stats()
        assert isinstance(stats, dict)


# NOTE: The legacy `configure_debug()` / `DEBUG` flag toggle was removed
# in the Logging 4.0.0 migration (see app/docs/work/LOGGING_4_0_0/).
# Verbosity is now controlled by `CBQA_LOG_LEVEL` and standard Python
# `logging`. The corresponding `TestDebugLogging` class has been deleted.


class TestResourcePath:
    """Test resource path resolution"""
    
    def test_get_resource_path_in_development(self):
        """get_resource_path returns valid path in dev mode"""
        path = ai_analyzer.get_resource_path('test.json')
        assert isinstance(path, str)
        assert len(path) > 0
    
    def test_get_resource_path_appends_filename(self):
        """get_resource_path appends filename to path"""
        path = ai_analyzer.get_resource_path('config.json')
        assert path.endswith('config.json')


class TestPayloadReferenceCache:
    """Test payload reference caching mechanism"""
    
    def test_invalidate_payload_reference_cache(self):
        """invalidate_payload_reference_cache clears cache"""
        # Should not raise error
        ai_analyzer.invalidate_payload_reference_cache()
        assert True


class TestAIModelsTemplate:
    """Test AI models template loading"""
    
    def test_get_ai_models_template_returns_dict(self):
        """get_ai_models_template returns dict"""
        result = ai_analyzer.get_ai_models_template()
        assert isinstance(result, dict)
    
    def test_get_ai_models_template_missing_file(self):
        """get_ai_models_template handles missing file"""
        with patch('ai_analyzer.get_resource_path', return_value='/nonexistent/path'):
            result = ai_analyzer.get_ai_models_template()
            assert result == {}


class TestAIModelsCache:
    """Test AI models list caching"""
    
    def test_invalidate_ai_models_cache(self):
        """invalidate_ai_models_cache clears cache"""
        # Should not raise error
        ai_analyzer.invalidate_ai_models_cache()
        assert True


class TestMaxOutputTokens:
    """Test max output tokens calculation"""
    
    def test_get_max_output_tokens_returns_int(self):
        """get_max_output_tokens returns integer"""
        tokens = ai_analyzer.get_max_output_tokens('openai', 'gpt-4o')
        assert isinstance(tokens, int)
        assert tokens > 0
    
    def test_get_max_output_tokens_unknown_provider(self):
        """get_max_output_tokens handles unknown provider"""
        tokens = ai_analyzer.get_max_output_tokens('unknown_provider', 'unknown_model')
        assert isinstance(tokens, int)
        assert tokens > 0  # Returns default


class TestSystemPrompt:
    """Test AI system prompt generation"""
    
    def test_get_ai_system_prompt_returns_string(self):
        """get_ai_system_prompt returns string"""
        prompt = ai_analyzer.get_ai_system_prompt('en')
        assert isinstance(prompt, str)
        assert len(prompt) > 0
    
    def test_get_ai_system_prompt_default_language(self):
        """get_ai_system_prompt works with default language"""
        prompt = ai_analyzer.get_ai_system_prompt()
        assert isinstance(prompt, str)


class TestPayloadReference:
    """Test payload reference loading with mock cluster"""
    
    def test_load_payload_reference_with_error_returns_dict(self):
        """load_payload_reference returns dict even on error"""
        mock_cluster = MagicMock()
        mock_cluster.bucket.side_effect = Exception("Connection error")
        
        result = ai_analyzer.load_payload_reference(mock_cluster)
        # Should return dict (from template or empty)
        assert isinstance(result, dict)
    
    def test_save_payload_reference_returns_bool(self):
        """save_payload_reference returns boolean"""
        mock_cluster = MagicMock()
        payload_ref = {"test": "data"}
        
        result = ai_analyzer.save_payload_reference(mock_cluster, payload_ref)
        assert isinstance(result, bool)


class TestAIModels:
    """Test AI models list operations"""
    
    def test_load_ai_models_list_with_error_returns_dict(self):
        """load_ai_models_list returns dict even on error"""
        mock_cluster = MagicMock()
        mock_cluster.bucket.side_effect = Exception("Connection error")
        
        result = ai_analyzer.load_ai_models_list(mock_cluster)
        assert isinstance(result, dict)
    
    def test_save_ai_models_list_returns_bool(self):
        """save_ai_models_list returns boolean"""
        mock_cluster = MagicMock()
        models_list = {"openai": []}
        
        result = ai_analyzer.save_ai_models_list(mock_cluster, models_list)
        assert isinstance(result, bool)
    
    def test_get_models_for_provider_returns_list(self):
        """get_models_for_provider returns a list (possibly empty) or None"""
        mock_cluster = MagicMock()
        result = ai_analyzer.get_models_for_provider(mock_cluster, 'openai')
        assert result is None or isinstance(result, list)


class TestPayloadBuilding:
    """Test AI payload construction"""
    
    def test_build_ai_payload_signature_exists(self):
        """build_ai_payload function exists"""
        # Verify function is callable
        assert callable(ai_analyzer.build_ai_payload)


class TestAIProviderCall:
    """Test AI provider API calls (mocked)"""
    
    def test_call_ai_provider_exists(self):
        """call_ai_provider function exists"""
        assert callable(ai_analyzer.call_ai_provider)
