"""
Backend tests for API key redaction and leak scanning.

Tests mask_api_key() with real credentials, verifies redaction in logs,
and ensures headers are not logged unredacted.

Anchored in: app/docs/work/LOGGING_4_0_0/02_API_KEY_REDACTION.md
"""
import logging
import pytest
import importlib.util
from pathlib import Path

# Load logging_config module directly
_spec = importlib.util.spec_from_file_location(
    "logging_config",
    Path(__file__).parent.parent.parent / "app" / "logging_config.py"
)
_logging_config = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_logging_config)
mask_api_key = _logging_config.mask_api_key

from _log_helpers import assert_no_secrets, SECRET_TOKENS


class TestMaskApiKeyWithRealFormats:
    """Test redaction with realistic credential formats."""
    
    @pytest.mark.parametrize("key,expected_start,expected_end", [
        # Per spec (02_API_KEY_REDACTION.md), mask preserves the provider
        # prefix and the last 4 raw chars (no extra "-" between "......"
        # and the tail). mask_api_key() does NOT understand "Bearer "
        # framing — that's the caller's job (see _safe_headers).
        ("sk-ant-api03-abcdefghijklmn", "sk-ant-", "klmn"),
        ("sk-proj-abc123def456ghi789", "sk-proj-", "i789"),
    ])
    def test_various_api_key_formats(self, key, expected_start, expected_end):
        """Test common API key formats mask properly."""
        result = mask_api_key(key)
        # Result should be shorter than original
        assert len(result) < len(key)
        # Provider prefix preserved
        assert result.startswith(expected_start)
        # Last 4 raw chars preserved
        assert result.endswith(expected_end)

    def test_openai_key_format(self):
        """OpenAI keys start with sk-proj- and end with the last 4 raw chars."""
        key = "sk-proj-abcdefghijklmnopqrstuvwxyz1234"
        masked = mask_api_key(key)
        assert "abcdefghijklmnop" not in masked
        assert masked.startswith("sk-proj-")
        assert masked.endswith("1234")

    def test_anthropic_key_format(self):
        """Anthropic keys start with sk-ant- (api03 sub-prefix is stripped)."""
        key = "sk-ant-api03-1234567890abcdef"
        masked = mask_api_key(key)
        # sk-ant- matches before sk-ant-api03- so api03 is part of the
        # redacted middle.
        assert "1234567890ab" not in masked
        assert masked.startswith("sk-ant-")
        assert masked.endswith("cdef")


class TestHeaderRedaction:
    """Test that HTTP headers are logged safely."""
    
    def test_authorization_header_redacted(self, caplog):
        """Authorization header with Bearer token is redacted."""
        logger = logging.getLogger("headers")
        headers = {
            "Authorization": "Bearer sk-proj-abcdefghijklmnopqrstuvwxyz"
        }
        
        with caplog.at_level(logging.INFO):
            # Simulate logging headers via mask_api_key
            token = headers.get("Authorization", "").replace("Bearer ", "")
            logger.info("Request headers: Authorization=%s", mask_api_key(token))
        
        # Raw token should not appear
        assert "abcdefghijklmnopqrst" not in caplog.text
    
    def test_api_key_header_redacted(self, caplog):
        """x-api-key header is redacted."""
        logger = logging.getLogger("headers")
        api_key = "sk-ant-api03-1234567890abcdef"
        
        with caplog.at_level(logging.INFO):
            logger.info("API key: %s", mask_api_key(api_key))
        
        # Original should not appear
        assert "api03-1234" not in caplog.text


class TestLeakScanCanary:
    """Test that the leak scan detects planted canaries."""
    
    def test_canary_detected_by_assert_no_secrets(self, caplog):
        """Planted canary LEAK0123456789 is detected."""
        logger = logging.getLogger("canary")
        
        with caplog.at_level(logging.INFO):
            logger.info("This is a normal log")
        
        # Should pass without the canary
        assert_no_secrets(caplog.records)
        
        # Now log the canary
        with caplog.at_level(logging.INFO):
            logger.info("Found canary: LEAK0123456789")
        
        # Should fail with the canary
        with pytest.raises(AssertionError, match="LEAK0123456789"):
            assert_no_secrets(caplog.records)
    
    def test_bearer_token_detected(self, caplog):
        """Bearer token pattern is detected."""
        logger = logging.getLogger("bearer")
        
        with caplog.at_level(logging.INFO):
            logger.info("Token: Bearer sk-proj-secret123456789")
        
        with pytest.raises(AssertionError, match="Bearer sk-"):
            assert_no_secrets(caplog.records)
    
    def test_x_api_key_detected(self, caplog):
        """x-api-key pattern is detected."""
        logger = logging.getLogger("apikey")
        
        with caplog.at_level(logging.INFO):
            logger.info("Header: x-api-key: sk-secret1234567890")
        
        with pytest.raises(AssertionError, match="x-api-key"):
            assert_no_secrets(caplog.records)


class TestCredentialLoggingPatterns:
    """Test safe patterns for logging credential-related information."""
    
    def test_logging_api_key_presence_only(self, caplog):
        """It's safe to log whether an API key is present (boolean)."""
        logger = logging.getLogger("test")
        api_key = "sk-proj-secret123456789"
        
        with caplog.at_level(logging.INFO):
            logger.info("API key configured: %s", bool(api_key))
        
        # Boolean representation is safe
        assert_no_secrets(caplog.records)
    
    def test_logging_provider_name_safe(self, caplog):
        """It's safe to log the provider name."""
        logger = logging.getLogger("test")
        
        with caplog.at_level(logging.INFO):
            logger.info("Using provider: openai")
            logger.info("Model: gpt-4o")
        
        assert_no_secrets(caplog.records)
    
    def test_logging_masked_api_key_safe(self, caplog):
        """Logging a masked API key is safe."""
        logger = logging.getLogger("test")
        api_key = "sk-proj-abcdefghijklmnopqrstuvwxyz1234"
        masked = mask_api_key(api_key)
        
        with caplog.at_level(logging.INFO):
            logger.info("Using API key: %s", masked)
        
        assert_no_secrets(caplog.records)
    
    def test_logging_obfuscated_query_safe(self, caplog):
        """It's safe to log obfuscated query data."""
        logger = logging.getLogger("test")
        
        with caplog.at_level(logging.INFO):
            logger.info("Processing query with %d documents", 42)
            logger.info("Query execution time: %.2f ms", 123.45)
        
        assert_no_secrets(caplog.records)


class TestSecretTokenList:
    """Verify the SECRET_TOKENS list covers realistic patterns."""
    
    def test_secret_tokens_defined(self):
        """SECRET_TOKENS is properly defined."""
        assert len(SECRET_TOKENS) > 0
        
        # Check for common patterns
        patterns = {
            "Bearer": any("Bearer" in token for token in SECRET_TOKENS),
            "api_key": any("api-key" in token.lower() for token in SECRET_TOKENS),
        }
        
        assert patterns["Bearer"], "SECRET_TOKENS should include Bearer pattern"
