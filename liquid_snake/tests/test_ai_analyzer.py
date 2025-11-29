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

# Add parent directory to path to import ai_analyzer
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

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
# Run Tests
# ============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
