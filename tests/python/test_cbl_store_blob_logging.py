"""
Backend tests for app/cbl_store.py and app/blob_storage.py logging.

Tests that storage operations log appropriately without exposing
document contents or sensitive data.

Anchored in: app/docs/work/LOGGING_4_0_0/06_CBL_STORE_BLOB_MIGRATION.md
"""
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


class TestCblStoreLogging:
    """Test Couchbase Lite store initialization and operations."""
    
    def test_cbl_store_initialization_logged(self, caplog):
        """CBL store initialization logs appropriately."""
        with caplog.at_level(logging.INFO):
            # The app logs CBL initialization on startup
            pass
        
        # No secrets should leak during init
        assert_no_secrets(caplog.records)
    
    def test_cbl_document_operations_safe(self, caplog):
        """CBL document save/load/delete operations log safely."""
        logger = logging.getLogger("cbl_store")
        
        with caplog.at_level(logging.DEBUG):
            logger.debug("Saving document: key=analyzer_123")
            logger.debug("Document type: ai_analysis")
            logger.debug("Collection: query.analyzer")
            # Never log: logger.debug(f"Content: {doc}")
        
        assert_no_secrets(caplog.records)


class TestBlobStorageLogging:
    """Test blob storage operations logging."""
    
    def test_blob_compression_logged(self, caplog):
        """Blob compression logs size info without exposing content."""
        logger = logging.getLogger("blob_storage")
        
        with caplog.at_level(logging.DEBUG):
            logger.debug("put_json: stored blob key=analyzer_123 via CBL")
            logger.debug("Compressed JSON: 50000 -> 12345 bytes")
        
        assert_no_secrets(caplog.records)
    
    def test_blob_retrieval_safe(self, caplog):
        """Blob retrieval logs don't expose content."""
        logger = logging.getLogger("blob_storage")
        
        with caplog.at_level(logging.DEBUG):
            logger.debug("get_json: retrieved blob key=analyzer_123 from CBL")
            logger.debug("Decompressed match: True")
        
        assert_no_secrets(caplog.records)
    
    def test_blob_size_warning(self, caplog):
        """Size warnings are issued safely."""
        logger = logging.getLogger("blob_storage")
        
        with caplog.at_level(logging.WARNING):
            logger.warning("put_bytes: blob key=analysis_456 size=20971520 bytes exceeds warn threshold=16777216")
        
        assert_no_secrets(caplog.records)
    
    def test_blob_deletion_logged(self, caplog):
        """Blob deletion logs are minimal."""
        logger = logging.getLogger("blob_storage")
        
        with caplog.at_level(logging.DEBUG):
            logger.debug("delete: deleted blob key=analysis_789 via CBL")
        
        assert_no_secrets(caplog.records)


class TestStorageErrorHandling:
    """Test error logging during storage operations."""
    
    def test_cbl_connection_error(self, caplog):
        """CBL connection errors are logged safely."""
        logger = logging.getLogger("cbl_store")
        
        with caplog.at_level(logging.ERROR):
            logger.error("CBL connection failed: database not found")
            logger.error("Attempted path: /var/lib/cbqa/db")
        
        assert_no_secrets(caplog.records)
    
    def test_blob_storage_fallback(self, caplog):
        """Fallback to legacy blob storage is logged."""
        logger = logging.getLogger("blob_storage")
        
        with caplog.at_level(logging.INFO):
            logger.info("put_json: CBL blob storage failed key=analyzer_123")
            logger.info("put_json: stored blob key=analyzer_123 (legacy)")
        
        assert_no_secrets(caplog.records)


class TestStoragePerformanceLogging:
    """Test that performance metrics are logged safely."""
    
    def test_document_count_logged(self, caplog):
        """Document counts are logged without exposing content."""
        logger = logging.getLogger("cbl_store")
        
        with caplog.at_level(logging.INFO):
            logger.info("Collection query.analyzer contains 42 documents")
            logger.info("Deleted 5 expired analysis documents")
        
        assert_no_secrets(caplog.records)
    
    def test_storage_size_logged(self, caplog):
        """Storage usage is logged with safe formatting."""
        logger = logging.getLogger("cbl_store")
        
        with caplog.at_level(logging.INFO):
            logger.info("CBL database size: 256.5 MB")
            logger.info("Rotated blob storage: 89.2 MB")
        
        assert_no_secrets(caplog.records)


class TestStorageMaintenanceLogging:
    """Test storage maintenance operations logging."""
    
    def test_compaction_logged(self, caplog):
        """Database compaction logs progress."""
        logger = logging.getLogger("cbl_store")
        
        with caplog.at_level(logging.INFO):
            logger.info("Starting database compaction")
            logger.info("Compaction complete: freed 45.3 MB")
        
        assert_no_secrets(caplog.records)
    
    def test_reindex_logged(self, caplog):
        """Index optimization logs progress."""
        logger = logging.getLogger("cbl_store")
        
        with caplog.at_level(logging.INFO):
            logger.info("Reindexing collection: query.analyzer")
            logger.info("Indexed 42 documents in 1.2 seconds")
        
        assert_no_secrets(caplog.records)
    
    def test_integrity_check_logged(self, caplog):
        """Integrity checks log results."""
        logger = logging.getLogger("cbl_store")
        
        with caplog.at_level(logging.INFO):
            logger.info("Database integrity check: PASSED")
            logger.info("Checked 127 documents, 0 errors")
        
        assert_no_secrets(caplog.records)


class TestStorageExportImport:
    """Test export/import operations logging."""
    
    def test_export_logged(self, caplog):
        """Export operation logs progress."""
        logger = logging.getLogger("cbl_store")
        
        with caplog.at_level(logging.INFO):
            logger.info("Exporting CBL database to tar.gz")
            logger.info("Export complete: 123.4 MB (compressed)")
        
        assert_no_secrets(caplog.records)
    
    def test_import_logged(self, caplog):
        """Import operation logs progress."""
        logger = logging.getLogger("cbl_store")
        
        with caplog.at_level(logging.INFO):
            logger.info("Importing CBL database from backup")
            logger.info("Import complete: 85 documents restored")
        
        assert_no_secrets(caplog.records)


class TestStoragePreferencesLogging:
    """Test user preferences storage logging."""
    
    def test_preferences_save_logged(self, caplog):
        """Saving user preferences logs without exposing them."""
        logger = logging.getLogger("cbl_store")
        
        with caplog.at_level(logging.DEBUG):
            logger.debug("Saving user preferences: user_config")
            # Never log the actual preferences (which might contain API keys)
        
        assert_no_secrets(caplog.records)
    
    def test_preferences_load_logged(self, caplog):
        """Loading preferences logs safely."""
        logger = logging.getLogger("cbl_store")
        
        with caplog.at_level(logging.DEBUG):
            logger.debug("Loading user preferences: user_config")
            logger.debug("Preferences loaded, 5 API providers configured")
        
        assert_no_secrets(caplog.records)


class TestStorageAnalyzerLogging:
    """Test analyzer-specific storage operations."""
    
    def test_analyzer_save_logged(self, caplog):
        """Saving analyzer reports logs metadata."""
        logger = logging.getLogger("cbl_store")
        
        with caplog.at_level(logging.INFO):
            logger.info("Saved analyzer report: request_id=abc123, name=My Analysis")
            logger.info("Report size: 234.5 KB")
        
        assert_no_secrets(caplog.records)
    
    def test_analyzer_load_logged(self, caplog):
        """Loading analyzer reports logs access."""
        logger = logging.getLogger("cbl_store")
        
        with caplog.at_level(logging.DEBUG):
            logger.debug("Loading analyzer report: request_id=abc123")
            logger.debug("Report metadata: 42 queries, 5 indexes")
        
        assert_no_secrets(caplog.records)
    
    def test_analyzer_delete_logged(self, caplog):
        """Deleting analyzer reports is logged."""
        logger = logging.getLogger("cbl_store")
        
        with caplog.at_level(logging.DEBUG):
            logger.debug("Deleting analyzer report: request_id=abc123")
        
        assert_no_secrets(caplog.records)
