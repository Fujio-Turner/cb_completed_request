"""
Shared pytest configuration for Logging 4.0.0 migration tests.

Ensures all tests run with a clean baseline:
- CBQA_LOG_FILE="off" (no disk spam during tests)
- CBQA_LOG_LEVEL="DEBUG" (let caplog decide filtering)
- configure_logging() called once per test session
"""
import logging
import pytest
import os
import sys
from pathlib import Path

# Add the app/ directory to sys.path so the shipping modules — which use
# bare imports (e.g. `from logging_config import ...`, `import app_base`)
# — can be imported by tests with the same names. Also add the repo root
# in case any test wants the `app.foo` namespace-package style.
_REPO_ROOT = Path(__file__).resolve().parent.parent.parent
_APP_DIR = _REPO_ROOT / "app"
for _p in (_APP_DIR, _REPO_ROOT):
    if str(_p) not in sys.path:
        sys.path.insert(0, str(_p))


@pytest.fixture(autouse=True)
def configure_logging_for_tests(monkeypatch):
    """
    Autouse fixture: Ensure tests run with a known logging baseline.
    
    Disables file logging (CBQA_LOG_FILE=off) to prevent disk spam,
    sets root level to DEBUG so caplog can filter freely, and ensures
    configure_logging() is called with a clean state.
    """
    # Disable file logging for tests
    monkeypatch.setenv("CBQA_LOG_FILE", "off")
    # Let caplog decide what level to capture, not the root logger
    monkeypatch.setenv("CBQA_LOG_LEVEL", "DEBUG")
    
    # Import and call configure_logging to set up the root logger
    # Import from the app module directly (not as a package)
    import importlib.util
    spec = importlib.util.spec_from_file_location(
        "logging_config",
        Path(__file__).parent.parent.parent / "app" / "logging_config.py"
    )
    logging_config = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(logging_config)
    
    # Reset any prior configuration marker so configure_logging runs fresh
    root = logging.getLogger()
    if hasattr(root, '_cbqa_configured'):
        delattr(root, '_cbqa_configured')
    
    # Reconfigure with the test baseline
    logging_config.configure_logging()
    
    yield


@pytest.fixture
def caplog_with_redaction(caplog):
    """
    Helper fixture for tests that need to inspect logs for redaction.
    
    Usage:
        def test_something(caplog_with_redaction):
            # ... code that logs ...
            assert_no_secrets(caplog_with_redaction.records)
    """
    return caplog
