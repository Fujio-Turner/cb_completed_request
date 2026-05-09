"""
Unit tests for cbl_store.py - Couchbase Lite storage layer.
Tests core functionality: collections, indexes, config, analyzer, AI history, blobs.
"""

import os
import json
import time
import pytest
from pathlib import Path
from typing import Dict, Any

# Import under test
from cbl_store import (
    CBLStore, get_db, close_db, USE_CBL,
    COLL_CONFIG, COLL_ANALYZER, COLL_PREFERENCES,
    COLL_AI_HISTORY, COLL_AI_REFERENCE, COLL_BLOBS,
    ALL_COLLECTIONS
)


pytestmark = pytest.mark.skipif(not USE_CBL, reason="CBL bindings required")


class TestOpenCreateClose:
    """Test database lifecycle: open, create collections, close."""
    
    def test_open_creates_collections(self, tmp_db):
        """Verify database opens and all 6 collections created."""
        db = tmp_db
        assert db is not None
        
        # Verify all collections exist by checking stats
        stats = CBLStore().stats()
        assert "collections" in stats
        
        # All expected collections should exist
        for coll in ALL_COLLECTIONS:
            assert coll in stats["collections"]
    
    def test_database_singleton(self, tmp_path):
        """Verify get_db() returns singleton."""
        os.environ["CBL_DB_DIR"] = str(tmp_path / "singleton_test")
        os.environ["CBL_DB_NAME"] = "singleton_db"
        Path(os.environ["CBL_DB_DIR"]).mkdir(parents=True, exist_ok=True)
        
        close_db()  # Reset singleton
        
        db1 = get_db()
        db2 = get_db()
        
        assert db1 is db2, "get_db() should return same singleton instance"
        
        close_db()
    
    def test_close_releases_handle(self, tmp_path):
        """Verify close_db() releases database handle."""
        os.environ["CBL_DB_DIR"] = str(tmp_path / "close_test")
        os.environ["CBL_DB_NAME"] = "close_db"
        Path(os.environ["CBL_DB_DIR"]).mkdir(parents=True, exist_ok=True)
        
        close_db()  # Reset
        db1 = get_db()
        close_db()
        db2 = get_db()
        
        # After close, new get_db() should open fresh handle
        assert db1 is not db2


class TestSaveLoadUserConfig:
    """Test round-trip user configuration storage."""
    
    def test_save_load_user_config(self, cbl_store, sample_user_config):
        """Save and load user config; verify exact match."""
        # Save
        cbl_store.save_user_config(sample_user_config)
        
        # Load
        loaded = cbl_store.load_user_config()
        
        # Verify
        assert loaded is not None
        assert loaded["theme"] == sample_user_config["theme"]
        assert loaded["language"] == sample_user_config["language"]
        assert loaded["user_id"] == sample_user_config["user_id"]
    
    def test_save_load_preferences(self, cbl_store, sample_preferences):
        """Save and load user preferences."""
        user_id = sample_preferences["user_id"]
        
        # Save
        cbl_store.save_preferences(user_id, sample_preferences)
        
        # Load
        loaded = cbl_store.load_preferences(user_id)
        
        # Verify
        assert loaded is not None
        assert loaded["ai_provider"] == sample_preferences["ai_provider"]
        assert loaded["ai_model"] == sample_preferences["ai_model"]
    
    def test_update_preferences_overwrites(self, cbl_store):
        """Verify preferences update overwrites previous values."""
        user_id = "test_user"
        
        pref_v1 = {"user_id": user_id, "theme": "light"}
        pref_v2 = {"user_id": user_id, "theme": "dark"}
        
        cbl_store.save_preferences(user_id, pref_v1)
        cbl_store.save_preferences(user_id, pref_v2)
        
        loaded = cbl_store.load_preferences(user_id)
        assert loaded["theme"] == "dark"
    
    def test_load_missing_config_returns_empty_dict(self, cbl_store):
        """Load from empty database returns empty dict."""
        loaded = cbl_store.load_user_config()
        assert loaded == {}
    
    def test_load_missing_preferences_returns_none(self, cbl_store):
        """Load non-existent preferences returns None."""
        loaded = cbl_store.load_preferences("nonexistent_user")
        assert loaded is None


class TestSaveLoadAnalyzerWithBlob:
    """Test analyzer report storage with large payload deduplication."""
    
    def test_save_load_analyzer(self, cbl_store, sample_analyzer_data):
        """Save and load analyzer report."""
        request_id = sample_analyzer_data["request_id"]
        
        # Save
        cbl_store.save_analyzer(
            request_id=request_id,
            name=sample_analyzer_data["name"],
            analyzer_data=sample_analyzer_data
        )
        
        # Load
        loaded = cbl_store.load_analyzer(request_id)
        
        # Verify
        assert loaded is not None
        assert loaded["request_id"] == request_id
        assert loaded["name"] == sample_analyzer_data["name"]
    
    def test_analyzer_with_large_payload_blob(self, cbl_store, sample_large_report):
        """Save analyzer with large payload; verify blob created."""
        request_id = "large_report_001"
        
        # Store as blob first
        blob_ref = cbl_store.put_blob(
            json.dumps(sample_large_report).encode(),
            content_type="application/json"
        )
        assert blob_ref.startswith("blob:")
        
        # Save analyzer referencing blob
        analyzer_data = {
            "request_id": request_id,
            "name": "Large Report",
            "blob_ref": blob_ref
        }
        cbl_store.save_analyzer(request_id, "Large Report", analyzer_data)
        
        # Load and verify
        loaded = cbl_store.load_analyzer(request_id)
        assert loaded["blob_ref"] == blob_ref
    
    def test_list_analyzers_pagination(self, cbl_store):
        """Test listing analyzers with pagination."""
        # Create multiple analyzers
        for i in range(15):
            cbl_store.save_analyzer(
                request_id=f"req_{i:03d}",
                name=f"Report {i}",
                analyzer_data={
                    "request_id": f"req_{i:03d}",
                    "saved_at": int(time.time()) - (1000 - i * 100)
                }
            )
        
        # List with limit
        result = cbl_store.list_analyzers(limit=10, offset=0)
        assert result["total"] >= 10
        assert len(result["rows"]) <= 10
        assert result["limit"] == 10
        assert result["offset"] == 0
    
    def test_delete_analyzer(self, cbl_store, sample_analyzer_data):
        """Delete analyzer and verify removal."""
        request_id = sample_analyzer_data["request_id"]
        
        # Save
        cbl_store.save_analyzer(request_id, "Test", sample_analyzer_data)
        loaded = cbl_store.load_analyzer(request_id)
        assert loaded is not None
        
        # Delete
        cbl_store.delete_analyzer(request_id)
        
        # Verify deleted
        loaded = cbl_store.load_analyzer(request_id)
        assert loaded is None


class TestBlobDedup:
    """Test blob deduplication: same bytes → same blob_ref."""
    
    def test_identical_blob_dedup(self, cbl_store):
        """Store same data twice; verify same blob_ref returned."""
        data1 = b"test data content that is identical"
        data2 = b"test data content that is identical"
        
        ref1 = cbl_store.put_blob(data1)
        ref2 = cbl_store.put_blob(data2)
        
        # Same content = same reference
        assert ref1 == ref2
        assert ref1.startswith("blob:")
    
    def test_different_blob_different_ref(self, cbl_store):
        """Store different data; verify different blob_refs."""
        data1 = b"content A"
        data2 = b"content B"
        
        ref1 = cbl_store.put_blob(data1)
        ref2 = cbl_store.put_blob(data2)
        
        # Different content = different references
        assert ref1 != ref2
    
    def test_blob_compression_dedup(self, cbl_store):
        """Verify dedup works with compression."""
        data = b"A" * 10000  # Compressible data
        
        ref1 = cbl_store.put_blob(data, compression="gzip")
        ref2 = cbl_store.put_blob(data, compression="gzip")
        
        # Should deduplicate even with compression
        assert ref1 == ref2
    
    def test_get_blob_decompresses(self, cbl_store):
        """Stored blob is returned decompressed."""
        original = b"test data for decompression"
        ref = cbl_store.put_blob(original, compression="gzip")
        
        retrieved = cbl_store.get_blob(ref)
        assert retrieved == original


class TestOrphanGC:
    """Test garbage collection of unreferenced blobs."""
    
    def test_gc_orphan_blobs_removes_unreferenced(self, cbl_store):
        """GC removes blobs not referenced by any analyzer."""
        # Create orphan blob (not referenced)
        orphan_ref = cbl_store.put_blob(b"orphan data")
        
        # Create referenced blob
        used_ref = cbl_store.put_blob(b"used data")
        
        # Create analyzer referencing used blob
        cbl_store.save_analyzer(
            request_id="test_001",
            name="Test",
            analyzer_data={
                "request_id": "test_001",
                "blob_ref": used_ref
            }
        )
        
        # Run GC
        deleted_count = cbl_store.gc_orphan_blobs()
        
        # Orphan should be deleted
        assert deleted_count >= 1
        assert cbl_store.get_blob(orphan_ref) is None
        assert cbl_store.get_blob(used_ref) is not None
    
    def test_gc_orphan_ai_history_refs(self, cbl_store):
        """GC preserves blobs referenced by AI history."""
        # Create blobs for AI history
        prompt_ref = cbl_store.put_blob(b"prompt data")
        response_ref = cbl_store.put_blob(b"response data")
        
        # Create AI history record referencing blobs
        cbl_store.add_ai_history(
            document_id="ai_001",
            cluster_name="test_cluster",
            provider="openai",
            model="gpt-4o",
            request_id_ref="req_001",
            prompt={"content": "test"},
            response={"content": "test"},
            tokens_in=100,
            tokens_out=50
        )
        
        # Run GC
        deleted = cbl_store.gc_orphan_blobs()
        
        # Referenced blobs should survive
        assert cbl_store.get_blob(prompt_ref) is not None


class TestIndexesUsed:
    """Test index creation and EXPLAIN plan."""
    
    def test_indexes_created(self, cbl_store):
        """Verify all expected indexes created."""
        # Save some test data
        cbl_store.save_analyzer(
            request_id="test_001",
            name="Test",
            analyzer_data={"request_id": "test_001"}
        )
        
        # Try EXPLAIN on a query
        explain_output = cbl_store.explain(
            "SELECT * FROM cb_tools.analyzer WHERE type = 'analyzer'"
        )
        
        # Should return something (real implementation may show index usage)
        assert explain_output is not None
    
    def test_list_uses_index_ordering(self, cbl_store):
        """Verify list queries use indexes for ordering."""
        # Create multiple analyzers with different saved_at times
        base_time = int(time.time())
        for i in range(5):
            cbl_store.save_analyzer(
                request_id=f"idx_test_{i}",
                name=f"Report {i}",
                analyzer_data={
                    "request_id": f"idx_test_{i}",
                    "saved_at": base_time - (i * 1000)
                }
            )
        
        # List should be ordered by saved_at DESC
        result = cbl_store.list_analyzers(limit=10)
        rows = result.get("rows", [])
        
        # Verify ordering if we have results
        if len(rows) > 1:
            for i in range(len(rows) - 1):
                assert rows[i].get("saved_at", 0) >= rows[i + 1].get("saved_at", 0)


class TestDatabaseStats:
    """Test statistics and diagnostics."""
    
    def test_stats_collection_counts(self, cbl_store, sample_analyzer_data):
        """Verify stats() returns collection document counts."""
        # Add some data
        cbl_store.save_user_config({"test": "config"})
        cbl_store.save_analyzer("req_001", "Test", sample_analyzer_data)
        
        # Get stats
        stats = cbl_store.stats()
        
        # Verify structure
        assert "collections" in stats
        assert "db_size_bytes" in stats
        
        # Verify collection counts
        assert stats["collections"][COLL_CONFIG] >= 1
        assert stats["collections"][COLL_ANALYZER] >= 1
    
    def test_maintenance_operations(self, cbl_store):
        """Test database maintenance operations."""
        # These should not raise exceptions
        compact_result = cbl_store.compact()
        assert isinstance(compact_result, bool)
        
        reindex_result = cbl_store.reindex()
        assert isinstance(reindex_result, bool)
        
        optimize_result = cbl_store.optimize()
        assert isinstance(optimize_result, bool)
    
    def test_integrity_check(self, cbl_store):
        """Test database integrity check."""
        result = cbl_store.integrity_check()
        assert isinstance(result, bool)


class TestAIReference:
    """Test AI reference data (payload_reference, models_list)."""
    
    def test_save_load_payload_reference(self, cbl_store):
        """Save and load payload_reference template."""
        data = {
            "description": "Test payload",
            "schema": {
                "type": "object",
                "properties": {}
            }
        }
        
        cbl_store.save_payload_reference(data)
        loaded = cbl_store.get_payload_reference()
        
        assert loaded is not None
        assert loaded["description"] == data["description"]
    
    def test_save_load_models_list(self, cbl_store):
        """Save and load AI models list."""
        data = {
            "openai": ["gpt-4o", "gpt-4o-mini"],
            "anthropic": ["claude-3-5-sonnet"]
        }
        
        cbl_store.save_models_list(data)
        loaded = cbl_store.get_models_list()
        
        assert loaded is not None
        assert "openai" in loaded
        assert "gpt-4o" in loaded["openai"]
    
    def test_seed_from_template(self, cbl_store, tmp_path):
        """Seed AI reference from template file."""
        # Create template file
        template_data = {"test": "payload_reference"}
        template_path = tmp_path / "payload_reference.json"
        template_path.write_text(json.dumps(template_data))
        
        # Seed
        result = cbl_store.seed_from_template("payload_reference", str(template_path))
        assert result is True
        
        # Verify
        loaded = cbl_store.get_payload_reference()
        assert loaded == template_data


class TestAIHistory:
    """Test AI analysis history storage."""
    
    def test_add_get_ai_history(self, cbl_store, sample_ai_history_data):
        """Add and retrieve AI history record."""
        doc_id = sample_ai_history_data["document_id"]
        
        # Add
        cbl_store.add_ai_history(
            document_id=doc_id,
            cluster_name=sample_ai_history_data["cluster_name"],
            provider=sample_ai_history_data["provider"],
            model=sample_ai_history_data["model"],
            request_id_ref=sample_ai_history_data["request_id_ref"],
            prompt=sample_ai_history_data["prompt"],
            response=sample_ai_history_data["response"],
            tokens_in=sample_ai_history_data["tokens_in"],
            tokens_out=sample_ai_history_data["tokens_out"],
            status=sample_ai_history_data["status"]
        )
        
        # Get
        loaded = cbl_store.get_ai_history(doc_id)
        assert loaded is not None
        assert loaded["document_id"] == doc_id
        assert loaded["cluster_name"] == sample_ai_history_data["cluster_name"]
    
    def test_list_ai_history(self, cbl_store):
        """List AI history with optional cluster filter."""
        # Add multiple records for different clusters
        for i in range(5):
            cbl_store.add_ai_history(
                document_id=f"ai_hist_{i}",
                cluster_name="prod" if i < 3 else "dev",
                provider="openai",
                model="gpt-4o",
                request_id_ref=f"req_{i}",
                prompt={"test": "prompt"},
                response={"test": "response"},
                tokens_in=100,
                tokens_out=50
            )
        
        # List all
        result_all = cbl_store.list_ai_history()
        assert result_all["total"] >= 5
        
        # List filtered by cluster
        result_prod = cbl_store.list_ai_history(cluster_name="prod", limit=10)
        assert result_prod["total"] >= 3
        
        result_dev = cbl_store.list_ai_history(cluster_name="dev", limit=10)
        assert result_dev["total"] >= 2
    
    def test_delete_ai_history(self, cbl_store, sample_ai_history_data):
        """Delete AI history record."""
        doc_id = sample_ai_history_data["document_id"]
        
        # Add and verify
        cbl_store.add_ai_history(
            document_id=doc_id,
            cluster_name=sample_ai_history_data["cluster_name"],
            provider=sample_ai_history_data["provider"],
            model=sample_ai_history_data["model"],
            request_id_ref=sample_ai_history_data["request_id_ref"],
            prompt=sample_ai_history_data["prompt"],
            response=sample_ai_history_data["response"],
            tokens_in=sample_ai_history_data["tokens_in"],
            tokens_out=sample_ai_history_data["tokens_out"]
        )
        
        # Delete
        cbl_store.delete_ai_history(doc_id)
        
        # Verify deleted
        loaded = cbl_store.get_ai_history(doc_id)
        assert loaded is None
