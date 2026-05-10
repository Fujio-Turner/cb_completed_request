"""
Shared logging test helpers for redaction verification.

Used by all backend test files to verify that sensitive data
does not leak into log output.
"""
import logging


# Tokens that must NEVER appear in logs unredacted
SECRET_TOKENS = (
    "secret prompt content",
    "user query body that is private",
    "Bearer sk-",
    "x-api-key: sk-",
    "LEAK0123456789",   # canary planted in test fixtures
)


def assert_no_secrets(records: list[logging.LogRecord]) -> None:
    """
    Assert that no secret tokens appear in the given log records.
    
    Args:
        records: List of LogRecord objects (typically from caplog.records)
        
    Raises:
        AssertionError: If any SECRET_TOKEN is found in any log message
    """
    body = "\n".join(r.getMessage() for r in records)
    for secret in SECRET_TOKENS:
        assert secret not in body, (
            f"secret token {secret!r} leaked into log body:\n{body}"
        )
