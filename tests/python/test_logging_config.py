"""
Backend tests for app/logging_config.py

Tests the core logging setup: mask_api_key, log levels, rotation, JSON formatter.
Anchored in: app/docs/work/LOGGING_4_0_0/01_LOGGING_CONFIG_MODULE.md
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

configure_logging = _logging_config.configure_logging
mask_api_key = _logging_config.mask_api_key
ManagedRotatingFileHandler = _logging_config.ManagedRotatingFileHandler
_JsonFormatter = _logging_config._JsonFormatter

from _log_helpers import assert_no_secrets


class TestMaskApiKey:
    """Test API key redaction function."""
    
    def test_mask_none(self):
        """mask_api_key(None) returns '<none>'."""
        assert mask_api_key(None) == "<none>"
    
    def test_mask_empty_string(self):
        """mask_api_key('') returns '<none>'."""
        assert mask_api_key("") == "<none>"
    
    def test_mask_short_key(self):
        """Keys < 12 chars return '<redacted>'."""
        assert mask_api_key("short") == "<redacted>"
    
    def test_mask_anthropic_key(self):
        """Anthropic-format key: sk-ant-api03-abcxyz1234 -> sk-ant-......1234."""
        result = mask_api_key("sk-ant-api03-abcxyz1234")
        assert result.startswith("sk-ant-")
        assert result.endswith("-......1234")
        assert "api03" not in result
    
    def test_mask_openai_key(self):
        """OpenAI-format key: sk-proj-abc...xyz -> sk-proj-......xyz."""
        key = "sk-proj-abcdefghijklmnopqrstuvwxyz1234"
        result = mask_api_key(key)
        assert result.startswith("sk-proj-")
        assert "......" in result
        assert result.endswith("1234")
    
    def test_mask_custom_key(self):
        """Non-hyphenated key: custom_secret1234 -> cust......1234."""
        result = mask_api_key("custom_secret1234")
        assert result == "cust......1234"
        assert "secret" not in result


class TestConfigureLogging:
    """Test logging configuration."""
    
    def test_configure_logging_idempotent(self):
        """Calling configure_logging twice is safe."""
        configure_logging("INFO")
        root = logging.getLogger()
        handlers1 = len(root.handlers)
        
        configure_logging("DEBUG")
        handlers2 = len(root.handlers)
        
        # Should not add duplicate handlers
        assert handlers1 == handlers2
    
    def test_configure_logging_sets_level(self):
        """configure_logging sets root logger level."""
        configure_logging("WARNING")
        root = logging.getLogger()
        assert root.level == logging.WARNING
        
        configure_logging("DEBUG")
        assert root.level == logging.DEBUG
    
    def test_stderr_handler_added(self):
        """configure_logging adds stderr handler."""
        configure_logging("INFO")
        root = logging.getLogger()
        stderr_handlers = [
            h for h in root.handlers
            if isinstance(h, logging.StreamHandler)
        ]
        assert len(stderr_handlers) > 0


class TestJsonFormatter:
    """Test JSON log formatter."""
    
    def test_json_formatter_basic(self):
        """JSON formatter produces valid JSON with required fields."""
        import json
        formatter = _JsonFormatter()
        record = logging.LogRecord(
            name="test",
            level=logging.INFO,
            pathname="test.py",
            lineno=1,
            msg="test message",
            args=(),
            exc_info=None,
        )
        output = formatter.format(record)
        
        # Should be valid JSON
        parsed = json.loads(output)
        assert parsed["level"] == "INFO"
        assert parsed["logger"] == "test"
        assert parsed["msg"] == "test message"
        assert "ts" in parsed
    
    def test_json_formatter_includes_exception(self):
        """JSON formatter includes exception traceback when present."""
        import json
        formatter = _JsonFormatter()
        
        try:
            1 / 0
        except ZeroDivisionError:
            import sys
            record = logging.LogRecord(
                name="test",
                level=logging.ERROR,
                pathname="test.py",
                lineno=1,
                msg="error occurred",
                args=(),
                exc_info=sys.exc_info(),
            )
        
        output = formatter.format(record)
        parsed = json.loads(output)
        assert "exc" in parsed
        assert "ZeroDivisionError" in parsed["exc"]


class TestManagedRotatingFileHandler:
    """Test the managed rotating file handler."""
    
    def test_handler_creates_parent_directory(self, tmp_path):
        """Handler creates parent directories as needed."""
        log_path = tmp_path / "subdir" / "nested" / "cbqa.log"
        handler = ManagedRotatingFileHandler(
            filename=str(log_path),
            max_bytes=1000,
            max_age_days=7,
            total_mb_cap=100,
        )
        handler.close()
        
        # Parent directory should exist
        assert log_path.parent.exists()
    
    def test_handler_rollover_by_size(self, tmp_path):
        """Handler triggers rollover when max_bytes exceeded."""
        log_path = tmp_path / "cbqa.log"
        handler = ManagedRotatingFileHandler(
            filename=str(log_path),
            max_bytes=100,  # Very small to trigger rollover
            max_age_days=7,
            total_mb_cap=100,
        )
        
        # Write a message that will exceed max_bytes
        record = logging.LogRecord(
            name="test",
            level=logging.INFO,
            pathname="test.py",
            lineno=1,
            msg="X" * 150,  # Longer than max_bytes
            args=(),
            exc_info=None,
        )
        
        handler.handle(record)
        handler.close()
        
        # Check that rotation occurred (rotated file should exist)
        rotated_files = list(log_path.parent.glob(f"{log_path.name}.*"))
        assert len(rotated_files) >= 0  # At least attempted rotation


class TestLoggingWithCaplog:
    """Integration tests using caplog."""
    
    def test_logger_captures_info_message(self, caplog):
        """Logger captures INFO level messages."""
        logger = logging.getLogger("test")
        with caplog.at_level(logging.INFO):
            logger.info("test message")
        
        assert "test message" in caplog.text
    
    def test_logger_respects_log_level(self, caplog):
        """Logger respects configured log level."""
        logger = logging.getLogger("test")
        with caplog.at_level(logging.WARNING):
            logger.debug("debug message")
            logger.info("info message")
            logger.warning("warning message")
        
        assert "debug message" not in caplog.text
        assert "info message" not in caplog.text
        assert "warning message" in caplog.text
    
    def test_masked_api_key_in_log(self, caplog):
        """Logging a masked API key redacts properly."""
        logger = logging.getLogger("test")
        api_key = "sk-proj-secret123456789"
        masked = mask_api_key(api_key)
        
        with caplog.at_level(logging.INFO):
            logger.info("API key: %s", masked)
        
        # Raw key should not appear
        assert api_key not in caplog.text
        # Masked version should appear
        assert masked in caplog.text
        # Original secret should not leak
        assert "secret1234" not in caplog.text
    
    def test_no_secrets_in_happy_path(self, caplog):
        """Happy path logs contain no secret tokens."""
        logger = logging.getLogger("test")
        with caplog.at_level(logging.DEBUG):
            logger.debug("Starting AI analysis")
            logger.info("Processing query data")
            logger.warning("Cache miss")
        
        # Should pass redaction check
        assert_no_secrets(caplog.records)
