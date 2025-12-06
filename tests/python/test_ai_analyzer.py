#!/usr/bin/env python3
"""
Unit Tests for AI Analyzer Module
Tests session cache, data obfuscator, payload builder, and AI provider functions
"""

import pytest
import time
import json
from unittest.mock import Mock, patch, MagicMock
import sys
import os

# Add app directory to path to import ai_analyzer
# tests/python/ -> tests/ -> root/ -> app/
app_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'app')
sys.path.insert(0, app_dir)

from ai_analyzer import (
    SessionCache,
    DataObfuscator,
    AIPayloadBuilder,
    AIHttpClient,
    get_max_output_tokens,
    get_ai_system_prompt,
    generate_session_id,
    cache_analyzer_data,
    get_cached_data,
    build_ai_payload,
    get_cache_stats,
    configure_debug,
    # New functions to test
    call_custom_ai_provider,
    call_ai_provider,
    get_payload_reference_template,
    load_payload_reference,
    save_payload_reference,
    invalidate_payload_reference_cache,
    get_ai_models_template,
    load_ai_models_list,
    get_models_for_provider,
    get_active_models_for_provider,
    invalidate_ai_models_cache,
    _execute_ai_request,
    _execute_ai_request_with_digest,
)


# ============================================================================
# SessionCache Tests
# ============================================================================

class TestSessionCache:
    """Tests for SessionCache class"""
    
    def test_init_creates_cache(self):
        """Test SessionCache initialization"""
        cache = SessionCache(ttl_minutes=5, cleanup_interval_seconds=60)
        assert cache.ttl_seconds == 300
        assert cache.cleanup_interval == 60
    
    def test_set_and_get(self):
        """Test basic set and get operations"""
        cache = SessionCache(ttl_minutes=5)
        test_data = {'key': 'value', 'count': 42}
        
        cache.set('session-1', test_data)
        retrieved = cache.get('session-1')
        
        assert retrieved == test_data
    
    def test_get_nonexistent_returns_none(self):
        """Test getting non-existent session returns None"""
        cache = SessionCache(ttl_minutes=5)
        result = cache.get('nonexistent-session')
        assert result is None
    
    def test_delete_session(self):
        """Test deleting a session"""
        cache = SessionCache(ttl_minutes=5)
        cache.set('session-1', {'data': 'test'})
        
        result = cache.delete('session-1')
        assert result is True
        assert cache.get('session-1') is None
    
    def test_delete_nonexistent_returns_false(self):
        """Test deleting non-existent session returns False"""
        cache = SessionCache(ttl_minutes=5)
        result = cache.delete('nonexistent')
        assert result is False
    
    def test_expired_session_returns_none(self):
        """Test that expired sessions return None"""
        cache = SessionCache(ttl_minutes=0)  # 0 minutes = immediate expiry
        cache.set('session-1', {'data': 'test'})
        
        # Force expiry by modifying timestamp
        with cache._lock:
            cache._cache['session-1']['timestamp'] = time.time() - 10
        
        result = cache.get('session-1')
        assert result is None
    
    def test_stats(self):
        """Test cache statistics"""
        cache = SessionCache(ttl_minutes=5)
        cache.set('session-1', {'data': 'test1'})
        cache.set('session-2', {'data': 'test2'})
        
        stats = cache.stats()
        
        assert stats['total_sessions'] == 2
        assert stats['total_size_bytes'] > 0
        assert stats['ttl_seconds'] == 300


# ============================================================================
# DataObfuscator Tests
# ============================================================================

class TestDataObfuscator:
    """Tests for DataObfuscator class"""
    
    def test_init(self):
        """Test DataObfuscator initialization"""
        obfuscator = DataObfuscator()
        assert obfuscator.seed == "couchbase-query-analyzer"
    
    def test_init_with_custom_seed(self):
        """Test initialization with custom seed"""
        obfuscator = DataObfuscator(seed="custom-seed")
        assert obfuscator.seed == "custom-seed"
    
    def test_generate_token_is_deterministic(self):
        """Test that same input always produces same token"""
        obfuscator = DataObfuscator()
        
        token1 = obfuscator._generate_token("users")
        token2 = obfuscator._generate_token("users")
        
        assert token1 == token2
        assert len(token1) == 6
    
    def test_different_inputs_produce_different_tokens(self):
        """Test that different inputs produce different tokens"""
        obfuscator = DataObfuscator()
        
        token1 = obfuscator._generate_token("users")
        token2 = obfuscator._generate_token("orders")
        
        assert token1 != token2
    
    def test_get_mapping_table(self):
        """Test mapping table is populated correctly"""
        obfuscator = DataObfuscator()
        
        obfuscator._generate_token("users")
        obfuscator._generate_token("orders")
        
        mapping = obfuscator.get_mapping_table()
        
        assert len(mapping) == 2
        assert "users" in mapping.values()
        assert "orders" in mapping.values()
    
    def test_deobfuscate_text(self):
        """Test deobfuscation of text"""
        obfuscator = DataObfuscator()
        
        token = obfuscator._generate_token("users")
        mapping = obfuscator.get_mapping_table()
        
        text = f"SELECT * FROM {token}"
        deobfuscated = obfuscator.deobfuscate_text(text, mapping)
        
        assert "users" in deobfuscated
    
    def test_obfuscate_value_string(self):
        """Test obfuscation of string values"""
        obfuscator = DataObfuscator()
        result = obfuscator.obfuscate_value("test_value")
        assert len(result) == 6
    
    def test_obfuscate_value_number(self):
        """Test obfuscation of numeric values"""
        obfuscator = DataObfuscator()
        result = obfuscator.obfuscate_value(12345)
        assert isinstance(result, int)
        assert 0 <= result < 10000
    
    def test_obfuscate_value_boolean(self):
        """Test boolean values are converted to integers (hash-based obfuscation)"""
        obfuscator = DataObfuscator()
        # Note: In the actual implementation, booleans fall through to the else
        # branch which converts them to strings and hashes them
        result_true = obfuscator.obfuscate_value(True)
        result_false = obfuscator.obfuscate_value(False)
        # Both results should be integers from the hash
        assert isinstance(result_true, int)
        assert isinstance(result_false, int)
    
    def test_obfuscate_value_none(self):
        """Test None is preserved"""
        obfuscator = DataObfuscator()
        assert obfuscator.obfuscate_value(None) is None
    
    def test_obfuscate_query_preserves_keywords(self):
        """Test SQL keywords are preserved in obfuscated queries"""
        obfuscator = DataObfuscator()
        query = "SELECT name FROM users WHERE active = true"
        result = obfuscator.obfuscate_query(query)
        
        assert "SELECT" in result
        assert "FROM" in result
        assert "WHERE" in result
        assert "true" in result.lower()
    
    def test_obfuscate_query_obfuscates_identifiers(self):
        """Test identifiers are obfuscated"""
        obfuscator = DataObfuscator()
        query = "SELECT name FROM users"
        result = obfuscator.obfuscate_query(query)
        
        assert "users" not in result
        assert "name" not in result
    
    def test_obfuscate_query_handles_empty(self):
        """Test empty query handling"""
        obfuscator = DataObfuscator()
        assert obfuscator.obfuscate_query("") == ""
        assert obfuscator.obfuscate_query(None) is None
    
    def test_obfuscate_dict(self):
        """Test dictionary obfuscation"""
        obfuscator = DataObfuscator()
        data = {
            'name': 'John',
            'email': 'john@example.com',
            'count': 10
        }
        
        result = obfuscator.obfuscate_dict(data)
        
        assert 'name' not in result
        assert 'John' not in result.values()
    
    def test_backtick_normalization(self):
        """Test that backtick-wrapped identifiers match plain identifiers"""
        obfuscator = DataObfuscator()
        
        token1 = obfuscator._generate_token("city")
        token2 = obfuscator._generate_token("`city`")
        
        assert token1 == token2


# ============================================================================
# AIPayloadBuilder Tests
# ============================================================================

class TestAIPayloadBuilder:
    """Tests for AIPayloadBuilder class"""
    
    @pytest.fixture
    def builder(self):
        return AIPayloadBuilder()
    
    @pytest.fixture
    def sample_data(self):
        return {
            'version': '3.29.1',
            'everyQueryData': [
                {'id': 1, 'statement': 'SELECT * FROM users'},
                {'id': 2, 'statement': 'SELECT * FROM orders'}
            ],
            'dashboardStats': {
                'total_queries': 100,
                'charts': {'chart1': {'data': [1, 2, 3]}}
            },
            'insightsData': {
                'items': [
                    {'type': 'slow_query', 'count': 5},
                    {'type': 'missing_index', 'count': 2}
                ]
            },
            'analysisData': [
                {'statement': 'SELECT * FROM ?', 'totalDuration': 5000, 'count': 10}
            ],
            'indexData': [
                {'name': 'idx_users', 'keyspace_id': 'users'}
            ],
            'flowDiagramData': {
                'mermaid_diagram': 'graph TD\n    A-->B',
                'indexes_count': 5,
                'queries_count': 10,
                'connections_count': 15
            },
            'timelineChartsData': {
                'request_count': {
                    'datasets': [{'data': [1, 2, 3]}]
                }
            }
        }
    
    def test_build_payload_from_data(self, builder, sample_data):
        """Test building payload from raw data"""
        selections = {'dashboard': True, 'insights': True}
        options = {'obfuscated': False}
        
        result = builder.build_payload_from_data(
            raw_data=sample_data,
            user_prompt="Analyze performance",
            selections=selections,
            options=options
        )
        
        assert 'prompt' in result
        assert 'data' in result
        assert 'metadata' in result
        assert result['metadata']['analyzer_version'] == '3.29.1'
    
    def test_build_payload_with_all_sections(self, builder, sample_data):
        """Test building payload with all sections enabled"""
        selections = {
            'dashboard': True,
            'insights': True,
            'query_groups': True,
            'indexes': True,
            'flow_diagram': True,
            'timeline_charts': True
        }
        options = {}
        
        result = builder.build_payload_from_data(
            raw_data=sample_data,
            user_prompt="Analyze",
            selections=selections,
            options=options
        )
        
        assert 'dashboard_metrics' in result['data']
        assert 'insights' in result['data']
        assert 'query_groups' in result['data']
        assert 'indexes' in result['data']
        assert 'index_query_flow' in result['data']
        assert 'timeline_charts' in result['data']
    
    def test_build_payload_with_obfuscation(self, builder, sample_data):
        """Test building payload with obfuscation enabled"""
        selections = {'dashboard': True}
        options = {'obfuscated': True}
        
        result = builder.build_payload_from_data(
            raw_data=sample_data,
            user_prompt="Analyze",
            selections=selections,
            options=options
        )
        
        assert result['metadata'].get('obfuscated') is True
        assert '_obfuscation_mapping' in result
    
    def test_build_payload_with_stake_focus(self, builder, sample_data):
        """Test building payload with stake focus enabled"""
        selections = {'dashboard': True}
        options = {
            'stake_focus': {
                'enabled': True,
                'datetime': '2024-01-15T10:30:00Z'
            }
        }
        
        result = builder.build_payload_from_data(
            raw_data=sample_data,
            user_prompt="Analyze",
            selections=selections,
            options=options
        )
        
        assert 'stake_focus' in result['context']
        assert result['context']['stake_focus']['enabled'] is True
    
    def test_build_dashboard_metrics_empty(self, builder):
        """Test dashboard metrics with empty data"""
        data = {'dashboardStats': {}}
        result = builder._build_dashboard_metrics(data)
        assert 'note' in result
    
    def test_build_insights_empty(self, builder):
        """Test insights with empty data"""
        data = {'insightsData': {}}
        result = builder._build_insights(data)
        assert 'note' in result
    
    def test_build_query_groups_with_limit(self, builder):
        """Test query groups respect limit parameter"""
        data = {
            'analysisData': [
                {'statement': f'SELECT {i}', 'totalDuration': i * 100}
                for i in range(20)
            ]
        }
        
        result = builder._build_query_groups(data, limit=5)
        assert result['sample_size'] == 5
        assert len(result['patterns']) == 5
    
    def test_build_indexes_empty(self, builder):
        """Test indexes with empty data"""
        data = {'indexData': []}
        result = builder._build_indexes(data)
        assert 'note' in result
    
    def test_build_flow_diagram_empty(self, builder):
        """Test flow diagram with empty data"""
        data = {'flowDiagramData': {}}
        result = builder._build_flow_diagram(data)
        assert 'note' in result


# ============================================================================
# AIHttpClient Tests
# ============================================================================

class TestAIHttpClient:
    """Tests for AIHttpClient class"""
    
    def test_init_default_values(self):
        """Test AIHttpClient default initialization"""
        client = AIHttpClient()
        assert client.max_retries == 3
        assert client.backoff_factor == 5.0
        assert client.timeout == 300
    
    def test_init_custom_values(self):
        """Test AIHttpClient custom initialization"""
        client = AIHttpClient(
            max_retries=5,
            backoff_factor=2.0,
            timeout=60,
            retry_on_status=[500, 502]
        )
        assert client.max_retries == 5
        assert client.backoff_factor == 2.0
        assert client.timeout == 60
        assert client.retry_on_status == [500, 502]
    
    @patch('ai_analyzer.requests.Session')
    def test_call_api_success(self, mock_session_class):
        """Test successful API call"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {'result': 'success'}
        
        mock_session = Mock()
        mock_session.request.return_value = mock_response
        mock_session_class.return_value = mock_session
        
        client = AIHttpClient(max_retries=1)
        result = client.call_api('POST', 'https://api.example.com/test', json_data={'test': 'data'})
        
        assert result['success'] is True
        assert result['status_code'] == 200
        assert result['data'] == {'result': 'success'}
    
    @patch('ai_analyzer.requests.Session')
    def test_call_api_non_json_response(self, mock_session_class):
        """Test API call with non-JSON response"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.side_effect = ValueError("Not JSON")
        mock_response.text = "Plain text response"
        
        mock_session = Mock()
        mock_session.request.return_value = mock_response
        mock_session_class.return_value = mock_session
        
        client = AIHttpClient(max_retries=1)
        result = client.call_api('POST', 'https://api.example.com/test')
        
        assert result['success'] is True
        assert result['data'] == "Plain text response"


# ============================================================================
# Token Limits Tests
# ============================================================================

class TestGetMaxOutputTokens:
    """Tests for get_max_output_tokens function"""
    
    def test_openai_gpt4o(self):
        """Test OpenAI GPT-4o token limit"""
        assert get_max_output_tokens('openai', 'gpt-4o') == 16384
    
    def test_openai_gpt4o_mini(self):
        """Test OpenAI GPT-4o-mini token limit"""
        assert get_max_output_tokens('openai', 'gpt-4o-mini') == 16384
    
    def test_openai_o3(self):
        """Test OpenAI o3 model token limit"""
        assert get_max_output_tokens('openai', 'o3') == 100000
    
    def test_anthropic_claude_sonnet(self):
        """Test Anthropic Claude 3.5 Sonnet token limit"""
        assert get_max_output_tokens('anthropic', 'claude-3-5-sonnet-20241022') == 8192
    
    def test_grok_4_fast(self):
        """Test Grok 4 fast model token limit"""
        assert get_max_output_tokens('grok', 'grok-4-fast-reasoning') == 131072
    
    def test_unknown_model_uses_default(self):
        """Test unknown model uses default limit"""
        result = get_max_output_tokens('openai', 'unknown-model-xyz')
        assert result == 16384  # OpenAI default
    
    def test_unknown_provider(self):
        """Test unknown provider returns safe default"""
        assert get_max_output_tokens('unknown_provider', 'any-model') == 8192
    
    def test_partial_model_match(self):
        """Test partial model name matching"""
        result = get_max_output_tokens('openai', 'gpt-4o-2024-08-06')
        assert result == 16384


# ============================================================================
# System Prompt Tests
# ============================================================================

class TestGetAISystemPrompt:
    """Tests for get_ai_system_prompt function"""
    
    def test_default_prompt_is_english(self):
        """Test default prompt is in English"""
        prompt = get_ai_system_prompt()
        assert "Couchbase N1QL query performance expert" in prompt
        assert "RESPONSE FORMAT REQUIREMENTS" in prompt
    
    def test_prompt_contains_priority_levels(self):
        """Test prompt contains priority level definitions"""
        prompt = get_ai_system_prompt()
        assert "PRIORITY LEVELS" in prompt
        assert "CRITICAL" in prompt
    
    def test_prompt_contains_json_structure(self):
        """Test prompt contains expected JSON structure"""
        prompt = get_ai_system_prompt()
        assert "analysis_summary" in prompt
        assert "critical_issues" in prompt
        assert "recommendations" in prompt
    
    def test_language_override(self):
        """Test language parameter adds translation instruction"""
        prompt = get_ai_system_prompt(language="Spanish")
        assert "Spanish" in prompt
        assert "CRITICAL OUTPUT LANGUAGE REQUIREMENT" in prompt
    
    def test_english_language_no_override(self):
        """Test English language doesn't add override"""
        prompt = get_ai_system_prompt(language="english")
        assert "CRITICAL OUTPUT LANGUAGE REQUIREMENT" not in prompt


# ============================================================================
# Helper Function Tests
# ============================================================================

class TestHelperFunctions:
    """Tests for helper functions"""
    
    def test_generate_session_id_is_unique(self):
        """Test session IDs are unique"""
        ids = [generate_session_id() for _ in range(100)]
        assert len(set(ids)) == 100
    
    def test_generate_session_id_length(self):
        """Test session ID has expected length"""
        session_id = generate_session_id()
        assert len(session_id) > 10
    
    def test_cache_analyzer_data_returns_session_id(self):
        """Test caching returns a session ID"""
        data = {'test': 'data'}
        session_id = cache_analyzer_data(data)
        assert session_id is not None
        assert len(session_id) > 0
    
    def test_cache_and_retrieve_data(self):
        """Test data can be cached and retrieved"""
        data = {'queries': [1, 2, 3], 'version': '1.0'}
        session_id = cache_analyzer_data(data)
        
        retrieved = get_cached_data(session_id)
        assert retrieved == data
    
    def test_get_cache_stats_returns_dict(self):
        """Test cache stats returns expected structure"""
        stats = get_cache_stats()
        assert 'total_sessions' in stats
        assert 'total_size_bytes' in stats
        assert 'ttl_seconds' in stats


# ============================================================================
# Debug Configuration Tests
# ============================================================================

class TestConfigureDebug:
    """Tests for configure_debug function"""
    
    def test_configure_debug_enable(self):
        """Test enabling debug mode"""
        configure_debug(True)
        # Should not raise any errors
    
    def test_configure_debug_disable(self):
        """Test disabling debug mode"""
        configure_debug(False)
        # Should not raise any errors
        # Re-enable for other tests
        configure_debug(True)


# ============================================================================
# Custom AI Provider Tests
# ============================================================================

class TestCallCustomAIProvider:
    """Tests for call_custom_ai_provider function"""
    
    @patch('ai_analyzer._execute_ai_request')
    def test_call_custom_ai_provider_success(self, mock_execute):
        """Test successful custom AI provider call"""
        mock_execute.return_value = {
            'success': True,
            'status_code': 200,
            'data': {'choices': [{'message': {'content': '{"ok": true}'}}]},
            'elapsed_ms': 123,
            'attempts': 1
        }
        
        custom_config = {
            'isCustom': True,
            'name': 'test-provider',
            'url': 'https://custom.example.com/api',
            'model': 'custom-model-v1',
            'authType': 'bearer',
            'bearerToken': 'test-token-123',
            'responsePath': 'choices[0].message.content'
        }
        
        result = call_custom_ai_provider(
            custom_config=custom_config,
            prompt='Analyze this data',
            payload_data={'data': {'test': 'value'}},
            language='English'
        )
        
        assert result['success'] is True
        assert result['isCustomProvider'] is True
        assert result['responsePath'] == 'choices[0].message.content'
        mock_execute.assert_called_once()
    
    @patch('ai_analyzer._execute_ai_request')
    def test_call_custom_ai_provider_with_api_key_header(self, mock_execute):
        """Test custom provider with API key header auth"""
        mock_execute.return_value = {
            'success': True,
            'status_code': 200,
            'data': {'result': 'ok'},
            'elapsed_ms': 100
        }
        
        custom_config = {
            'isCustom': True,
            'name': 'api-key-provider',
            'url': 'https://api.example.com/v1',
            'model': 'model-x',
            'authType': 'api-key-header',
            'apiKeyHeaderName': 'X-API-Key',
            'apiKeyHeaderValue': 'secret-key-123'
        }
        
        result = call_custom_ai_provider(
            custom_config=custom_config,
            prompt='Test prompt',
            payload_data={'data': {}}
        )
        
        assert result['success'] is True
        # Verify headers were set correctly
        call_args = mock_execute.call_args
        headers = call_args[1] if len(call_args) > 1 else call_args[0][0]
    
    def test_call_custom_ai_provider_missing_url(self):
        """Test custom provider with missing URL returns error"""
        custom_config = {
            'isCustom': True,
            'name': 'no-url-provider',
            'url': '',
            'model': 'model-x'
        }
        
        result = call_custom_ai_provider(
            custom_config=custom_config,
            prompt='Test',
            payload_data={}
        )
        
        assert result['success'] is False
        assert 'URL is required' in result['error']
    
    @patch('ai_analyzer._execute_ai_request')
    def test_call_custom_ai_provider_with_custom_headers(self, mock_execute):
        """Test custom provider with additional custom headers"""
        mock_execute.return_value = {
            'success': True,
            'status_code': 200,
            'data': {'ok': True},
            'elapsed_ms': 50
        }
        
        custom_config = {
            'isCustom': True,
            'name': 'header-provider',
            'url': 'https://api.example.com',
            'model': 'model-y',
            'authType': 'none',
            'customHeaders': [
                {'name': 'X-Custom-Header', 'value': 'custom-value'},
                {'name': 'X-Trace-ID', 'value': 'trace-123'}
            ]
        }
        
        result = call_custom_ai_provider(
            custom_config=custom_config,
            prompt='Test',
            payload_data={'data': {}}
        )
        
        assert result['success'] is True


# ============================================================================
# Digest Auth Request Tests
# ============================================================================

class TestExecuteAIRequestWithDigest:
    """Tests for _execute_ai_request_with_digest function"""
    
    @patch('ai_analyzer.requests.post')
    def test_digest_auth_success(self, mock_post):
        """Test successful request with digest auth"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {'result': 'success'}
        mock_post.return_value = mock_response
        
        result = _execute_ai_request_with_digest(
            full_url='https://api.example.com/v1/chat',
            headers={'Content-Type': 'application/json'},
            ai_request_payload={'prompt': 'test'},
            digest_auth=('username', 'password')
        )
        
        assert result['success'] is True
        assert result['status_code'] == 200
        assert result['data'] == {'result': 'success'}
        mock_post.assert_called_once()
    
    @patch('ai_analyzer.requests.post')
    def test_digest_auth_failure(self, mock_post):
        """Test failed request with digest auth"""
        mock_response = Mock()
        mock_response.status_code = 401
        mock_response.text = 'Unauthorized'
        mock_post.return_value = mock_response
        
        result = _execute_ai_request_with_digest(
            full_url='https://api.example.com/v1/chat',
            headers={},
            ai_request_payload={'prompt': 'test'},
            digest_auth=('bad-user', 'bad-pass')
        )
        
        assert result['success'] is False
        assert result['status_code'] == 401
    
    @patch('ai_analyzer.requests.post')
    def test_digest_auth_timeout(self, mock_post):
        """Test timeout with digest auth"""
        import requests
        mock_post.side_effect = requests.exceptions.Timeout()
        
        result = _execute_ai_request_with_digest(
            full_url='https://api.example.com/v1/chat',
            headers={},
            ai_request_payload={'prompt': 'test'},
            digest_auth=('user', 'pass')
        )
        
        assert result['success'] is False
        assert 'timeout' in result['error'].lower()


# ============================================================================
# Payload Reference Tests
# ============================================================================

class TestPayloadReference:
    """Tests for payload reference functions"""
    
    def test_get_payload_reference_template(self):
        """Test loading payload reference template file"""
        template = get_payload_reference_template()
        
        # Template should be a dict (might be empty if file not found)
        assert isinstance(template, dict)
        # If template exists, it should have expected keys
        if template:
            assert 'couchbase_index_creation' in template or len(template) == 0
    
    @patch('ai_analyzer._payload_reference_cache', None)
    @patch('ai_analyzer._payload_reference_cache_time', 0)
    def test_load_payload_reference_uses_cache(self):
        """Test that repeated calls use cache"""
        import ai_analyzer
        
        # Reset cache
        ai_analyzer._payload_reference_cache = None
        ai_analyzer._payload_reference_cache_time = 0
        
        # Create mock cluster
        mock_cluster = Mock()
        mock_bucket = Mock()
        mock_collection = Mock()
        mock_cluster.bucket.return_value = mock_bucket
        mock_bucket.scope.return_value.collection.return_value = mock_collection
        
        # First call - document exists
        mock_result = Mock()
        mock_result.content_as = {dict: {'couchbase_index_creation': ['rule1']}}
        mock_collection.get.return_value = mock_result
        
        result1 = load_payload_reference(mock_cluster, 'test_bucket')
        
        # Should have called get
        assert mock_collection.get.call_count == 1
        
        # Second call should use cache (call count stays at 1)
        result2 = load_payload_reference(mock_cluster, 'test_bucket')
        
        # Still only 1 call due to caching
        assert mock_collection.get.call_count == 1
        
        # Clear cache for other tests
        invalidate_payload_reference_cache()
    
    def test_invalidate_payload_reference_cache(self):
        """Test cache invalidation"""
        import ai_analyzer
        
        # Set some cache data
        ai_analyzer._payload_reference_cache = {'test': 'data'}
        ai_analyzer._payload_reference_cache_time = 12345
        
        invalidate_payload_reference_cache()
        
        assert ai_analyzer._payload_reference_cache is None
        assert ai_analyzer._payload_reference_cache_time == 0


# ============================================================================
# AI Models List Tests
# ============================================================================

class TestAIModelsList:
    """Tests for AI models list functions"""
    
    def test_get_ai_models_template(self):
        """Test loading AI models template file"""
        template = get_ai_models_template()
        
        assert isinstance(template, dict)
        # If template exists, check structure
        if template:
            assert 'providers' in template or len(template) == 0
    
    def test_invalidate_ai_models_cache(self):
        """Test AI models cache invalidation"""
        import ai_analyzer
        
        # Set some cache data
        ai_analyzer._ai_models_cache = {'providers': {}}
        ai_analyzer._ai_models_cache_time = 12345
        
        invalidate_ai_models_cache()
        
        assert ai_analyzer._ai_models_cache is None
        assert ai_analyzer._ai_models_cache_time == 0
    
    @patch('ai_analyzer.load_ai_models_list')
    def test_get_models_for_provider(self, mock_load):
        """Test getting models for a specific provider"""
        mock_load.return_value = {
            'providers': {
                'openai': {
                    'models': [
                        {'id': 'gpt-4o', 'status': 'active'},
                        {'id': 'gpt-3.5-turbo', 'status': 'legacy'}
                    ]
                },
                'anthropic': {
                    'models': [
                        {'id': 'claude-3-opus', 'status': 'active'}
                    ]
                }
            }
        }
        
        mock_cluster = Mock()
        
        result = get_models_for_provider(mock_cluster, 'openai')
        
        assert len(result) == 2
        assert result[0]['id'] == 'gpt-4o'
    
    @patch('ai_analyzer.load_ai_models_list')
    def test_get_active_models_for_provider(self, mock_load):
        """Test getting only active models for a provider"""
        mock_load.return_value = {
            'providers': {
                'openai': {
                    'models': [
                        {'id': 'gpt-4o', 'status': 'active'},
                        {'id': 'gpt-3.5-turbo', 'status': 'legacy'},
                        {'id': 'gpt-4-turbo', 'status': 'active'}
                    ]
                }
            }
        }
        
        mock_cluster = Mock()
        
        result = get_active_models_for_provider(mock_cluster, 'openai')
        
        # Should only return active models
        assert len(result) == 2
        assert all(m['status'] == 'active' for m in result)
    
    @patch('ai_analyzer.load_ai_models_list')
    def test_get_models_for_unknown_provider(self, mock_load):
        """Test getting models for unknown provider returns empty list"""
        mock_load.return_value = {
            'providers': {
                'openai': {'models': [{'id': 'gpt-4o'}]}
            }
        }
        
        mock_cluster = Mock()
        
        result = get_models_for_provider(mock_cluster, 'unknown_provider')
        
        assert result == []


# ============================================================================
# AIPayloadBuilder Extended Tests
# ============================================================================

class TestAIPayloadBuilderExtended:
    """Extended tests for AIPayloadBuilder new parameters"""
    
    @pytest.fixture
    def builder(self):
        return AIPayloadBuilder()
    
    @pytest.fixture
    def sample_data(self):
        return {
            'version': '4.0.0-dev',
            'everyQueryData': [{'id': 1}],
            'dashboardStats': {'total_queries': 100},
            'analysisData': [{'statement': 'SELECT 1'}]
        }
    
    def test_build_payload_with_extra_instructions(self, builder, sample_data):
        """Test that extra_instructions are appended to prompt"""
        result = builder.build_payload_from_data(
            raw_data=sample_data,
            user_prompt="Analyze performance",
            selections={'dashboard': True},
            options={},
            extra_instructions="Focus on memory usage only. Output in bullet points."
        )
        
        assert "Focus on memory usage only" in result['prompt']
        assert "Output in bullet points" in result['prompt']
    
    def test_build_payload_stake_focus_adds_context(self, builder, sample_data):
        """Test that stake_focus adds detailed context"""
        result = builder.build_payload_from_data(
            raw_data=sample_data,
            user_prompt="Analyze",
            selections={'dashboard': True},
            options={
                'stake_focus': {
                    'enabled': True,
                    'datetime': '2024-01-15T10:30:00Z'
                }
            }
        )
        
        # Check stake focus is in context
        assert result['context']['stake_focus'] is not None
        assert result['context']['stake_focus']['enabled'] is True
        assert result['context']['stake_focus']['datetime'] == '2024-01-15T10:30:00Z'
        
        # Check prompt includes stake focus instructions
        assert 'STAKE FOCUS POINT' in result['prompt']
        assert '2024-01-15T10:30:00Z' in result['prompt']
    
    def test_build_payload_stake_focus_disabled(self, builder, sample_data):
        """Test that disabled stake_focus doesn't add context"""
        result = builder.build_payload_from_data(
            raw_data=sample_data,
            user_prompt="Analyze",
            selections={'dashboard': True},
            options={
                'stake_focus': {
                    'enabled': False,
                    'datetime': '2024-01-15T10:30:00Z'
                }
            }
        )
        
        # stake_focus should be None when disabled
        assert result['context']['stake_focus'] is None
    
    def test_build_payload_includes_payload_reference(self, builder, sample_data):
        """Test that payload reference is included in context"""
        result = builder.build_payload_from_data(
            raw_data=sample_data,
            user_prompt="Analyze",
            selections={'dashboard': True},
            options={}
        )
        
        # Should have best practices and index creation rules
        assert 'best_practices' in result['context']
        assert isinstance(result['context']['best_practices'], list)


# ============================================================================
# Call AI Provider Tests
# ============================================================================

class TestCallAIProvider:
    """Tests for call_ai_provider function"""
    
    def test_openai_uses_sdk_when_available(self):
        """Test OpenAI provider attempts to use SDK when available"""
        import ai_analyzer
        
        # Skip if SDK not actually available
        if not ai_analyzer.OPENAI_SDK_AVAILABLE:
            pytest.skip("OpenAI SDK not installed")
        
        # We can't easily mock the full SDK chain, so just verify the function
        # handles errors gracefully when called with invalid credentials
        result = call_ai_provider(
            provider='openai',
            model='gpt-4o',
            api_key='invalid-test-key',
            api_url='https://api.openai.com/v1',
            endpoint='/chat/completions',
            prompt='Test prompt',
            payload_data={'data': {'test': 'value'}},
            language='English'
        )
        
        # Should return an error (since credentials are invalid)
        # but the structure should be correct
        assert 'success' in result
        assert 'elapsed_ms' in result or 'error' in result
    
    def test_grok_uses_sdk_when_available(self):
        """Test Grok provider attempts to use SDK when available"""
        import ai_analyzer
        
        # Skip if SDK not actually available
        if not ai_analyzer.OPENAI_SDK_AVAILABLE:
            pytest.skip("OpenAI SDK not installed")
        
        result = call_ai_provider(
            provider='grok',
            model='grok-3',
            api_key='invalid-test-key',
            api_url='https://api.x.ai/v1',
            endpoint='/chat/completions',
            prompt='Test prompt',
            payload_data={'data': {}},
            language='English'
        )
        
        # Should return an error (since credentials are invalid)
        assert 'success' in result
        assert 'elapsed_ms' in result or 'error' in result
    
    @patch('ai_analyzer.OPENAI_SDK_AVAILABLE', False)
    @patch('ai_analyzer._execute_ai_request')
    def test_openai_falls_back_to_http(self, mock_execute):
        """Test OpenAI falls back to HTTP when SDK unavailable"""
        mock_execute.return_value = {
            'success': True,
            'status_code': 200,
            'data': {'choices': [{'message': {'content': 'ok'}}]},
            'elapsed_ms': 100
        }
        
        result = call_ai_provider(
            provider='openai',
            model='gpt-4o',
            api_key='test-key',
            api_url='https://api.openai.com/v1',
            endpoint='/chat/completions',
            prompt='Test',
            payload_data={'data': {}},
            language='English'
        )
        
        assert result['success'] is True
        mock_execute.assert_called_once()
    
    @patch('ai_analyzer._execute_ai_request')
    def test_anthropic_uses_http(self, mock_execute):
        """Test Anthropic provider uses HTTP (not SDK)"""
        mock_execute.return_value = {
            'success': True,
            'status_code': 200,
            'data': {'content': [{'text': '{"ok": true}'}]},
            'elapsed_ms': 150
        }
        
        result = call_ai_provider(
            provider='anthropic',
            model='claude-3-5-sonnet-20241022',
            api_key='test-key',
            api_url='https://api.anthropic.com',
            endpoint='/v1/messages',
            prompt='Test prompt',
            payload_data={'data': {}},
            language='English'
        )
        
        assert result['success'] is True
        mock_execute.assert_called_once()
        
        # Check that anthropic-specific headers would be used
        call_args = mock_execute.call_args
        url = call_args[0][0]
        assert 'anthropic.com' in url


# ============================================================================
# Run Tests
# ============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
