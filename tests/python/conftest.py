"""
Pytest configuration and fixtures for CBL migration tests.
Provides test database, Flask client, and mock Couchbase Server cluster.
"""

import os
import sys
import json
import tempfile
from pathlib import Path
from typing import Generator, Any, Dict, Optional
from unittest.mock import MagicMock, patch

import pytest

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))


@pytest.fixture(autouse=True)
def setup_cbl_env(tmp_path: Path) -> None:
    """Configure CBL environment for tests (runs before each test)."""
    os.environ["STORAGE_BACKEND"] = "cbl"
    os.environ["CBL_DB_DIR"] = str(tmp_path / "cbl_data")
    os.environ["CBL_DB_NAME"] = "test_db"
    Path(os.environ["CBL_DB_DIR"]).mkdir(parents=True, exist_ok=True)


@pytest.fixture
def tmp_db(tmp_path: Path):
    """Provide a fresh CBL database instance per test."""
    from cbl_store import close_db, get_db, USE_CBL
    
    if not USE_CBL:
        pytest.skip("CBL bindings not available")
    
    # Configure for this test
    os.environ["CBL_DB_DIR"] = str(tmp_path / "test_db")
    os.environ["CBL_DB_NAME"] = "test_db"
    Path(os.environ["CBL_DB_DIR"]).mkdir(parents=True, exist_ok=True)
    
    # Reset singleton for fresh DB
    close_db()
    
    db = get_db()
    yield db
    
    # Cleanup
    close_db()


@pytest.fixture
def cbl_store(tmp_db):
    """Provide a CBLStore instance with fresh database."""
    from cbl_store import CBLStore, USE_CBL
    
    if not USE_CBL:
        pytest.skip("CBL bindings not available")
    
    store = CBLStore()
    yield store
    # Cleanup happens via tmp_db fixture


@pytest.fixture
def blob_store(cbl_store):
    """Provide BlobStorage instance backed by CBL."""
    from blob_storage import BlobStorage
    
    store = BlobStorage(cbl_store)
    yield store


@pytest.fixture
def app_with_cbl(tmp_path: Path):
    """Provide Flask test client with CBL backend."""
    os.environ["STORAGE_BACKEND"] = "cbl"
    os.environ["CBL_DB_DIR"] = str(tmp_path / "flask_db")
    os.environ["CBL_DB_NAME"] = "test_app_db"
    Path(os.environ["CBL_DB_DIR"]).mkdir(parents=True, exist_ok=True)
    
    # Import and configure Flask app
    import sys
    sys.path.insert(0, str(Path(__file__).parent.parent.parent))
    from app import app as flask_app
    from cbl_store import close_db
    
    flask_app.config['TESTING'] = True
    
    # Reset CBL singleton for fresh DB
    close_db()
    
    client = flask_app.test_client()
    yield client
    
    # Cleanup
    close_db()


@pytest.fixture
def client(app_with_cbl):
    """Alias for app_with_cbl for convenience."""
    return app_with_cbl


@pytest.fixture
def mock_cb_cluster():
    """Provide a mock Couchbase Server cluster for migration tests."""
    cluster = MagicMock()
    bucket = MagicMock()
    
    # Mock bucket methods
    bucket.name = "cb_tools"
    bucket.cluster = cluster
    
    # Mock scope/collection
    def mock_scope(name):
        scope = MagicMock()
        scope.collection = MagicMock(return_value=MagicMock())
        return scope
    
    bucket.scope = mock_scope
    
    # Mock N1QL queries
    def mock_query(sql: str):
        results = MagicMock()
        results.__iter__ = lambda self: iter([])
        return results
    
    cluster.query = mock_query
    cluster.wait_until_ready = MagicMock()
    
    yield cluster, bucket


@pytest.fixture
def sample_analyzer_data() -> Dict[str, Any]:
    """Provide sample analyzer report data."""
    return {
        "type": "analyzer",
        "request_id": "test_req_001",
        "name": "Test Query Analysis",
        "saved_at": 1700000000,
        "query": "SELECT * FROM bucket WHERE type = 'test'",
        "duration_ms": 123,
        "result_count": 42,
        "rawPayload": {
            "result": [{"id": "doc1"}, {"id": "doc2"}],
            "meta": {"metrics": {"executionTime": "123ms"}}
        }
    }


@pytest.fixture
def sample_ai_history_data() -> Dict[str, Any]:
    """Provide sample AI history record."""
    return {
        "type": "ai_history",
        "document_id": "ai_hist_001",
        "cluster_name": "prod_cluster",
        "provider": "openai",
        "model": "gpt-4o",
        "request_id_ref": "test_req_001",
        "created_at": 1700000000,
        "tokens_in": 500,
        "tokens_out": 200,
        "status": "completed",
        "prompt": {
            "role": "system",
            "content": "You are a query analyzer"
        },
        "response": {
            "role": "assistant",
            "content": "This query is optimized..."
        }
    }


@pytest.fixture
def sample_user_config() -> Dict[str, Any]:
    """Provide sample user configuration."""
    return {
        "type": "config",
        "user_id": "test_user",
        "theme": "dark",
        "language": "en",
        "version": "4.0.0",
        "created_at": 1700000000,
        "updated_at": 1700000000
    }


@pytest.fixture
def sample_preferences() -> Dict[str, Any]:
    """Provide sample user preferences."""
    return {
        "type": "preferences",
        "user_id": "test_user",
        "ai_provider": "openai",
        "ai_model": "gpt-4o",
        "redaction_enabled": True,
        "export_format": "json",
        "updated_at": 1700000000
    }


@pytest.fixture
def sample_large_report() -> Dict[str, Any]:
    """Provide sample large report for blob dedup testing."""
    # Create a large payload (>1MB)
    large_data = {
        "results": [
            {"id": f"doc_{i}", "data": "X" * 1000}
            for i in range(1500)
        ]
    }
    return large_data
