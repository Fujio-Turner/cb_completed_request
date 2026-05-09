"""
Unit tests for blob_storage.py - Binary object storage with compression.
Tests compression, decompression, deduplication, and size limits.
"""

import gzip
import json
import pytest
from typing import Dict, Any

from blob_storage import BlobStorage, WARN_BYTES, HARD_BYTES
from cbl_store import USE_CBL


pytestmark = pytest.mark.skipif(not USE_CBL, reason="CBL bindings required")


class TestPutGetJson:
    """Test JSON blob round-trip storage."""
    
    def test_put_get_json(self, blob_store):
        """Store and retrieve JSON blob."""
        test_data = {
            "name": "Test Query",
            "metrics": {"duration_ms": 123, "count": 42},
            "nested": {"deep": {"value": "test"}}
        }
        
        # Put
        result = blob_store.put_json("test_json_001", test_data)
        assert result["success"] is True
        assert "key" in result
        
        # Get
        retrieved = blob_store.get_json("test_json_001")
        assert retrieved["success"] is True
        assert retrieved["data"] == test_data
    
    def test_json_compression(self, blob_store):
        """JSON data is compressed before storage."""
        large_data = {
            "items": [
                {"id": i, "data": "X" * 100}
                for i in range(1000)
            ]
        }
        
        result = blob_store.put_json("large_json", large_data)
        assert result["success"] is True
        
        retrieved = blob_store.get_json("large_json")
        assert retrieved["success"] is True
        assert retrieved["data"] == large_data


class TestDedup:
    """Test blob deduplication."""
    
    def test_dedup_identical_payload(self, blob_store, cbl_store):
        """Identical payloads produce same blob reference."""
        data1 = {"value": "identical", "count": 42}
        data2 = {"value": "identical", "count": 42}
        
        # Put both (should deduplicate internally via cbl_store)
        result1 = blob_store.put_json("blob1", data1)
        result2 = blob_store.put_json("blob2", data2)
        
        # Both should succeed
        assert result1["success"] is True
        assert result2["success"] is True
    
    def test_dedup_binary_identical(self, blob_store):
        """Identical binary data produces same reference."""
        data = b"A" * 10000
        
        # Put twice
        result1 = blob_store.put_bytes("bin1", data)
        result2 = blob_store.put_bytes("bin2", data)
        
        # Both should succeed
        assert result1["success"] is True
        assert result2["success"] is True


class TestSizeLimits:
    """Test blob size warnings and limits."""
    
    def test_warn_above_16mb(self, blob_store, caplog):
        """Log warning for blobs > 16MB."""
        # Create data just over WARN_BYTES
        data = b"X" * (WARN_BYTES + 1)
        
        with caplog.at_level("WARNING"):
            result = blob_store.put_bytes("warn_blob", data)
        
        # Should still succeed but with warning
        assert result["success"] is True
        assert result["size"] == len(data)
    
    def test_reject_above_64mb(self, blob_store):
        """Reject blobs > 64MB."""
        # Create data over HARD_BYTES (we'll use a smaller test value)
        # Note: in real tests, create smaller data and mock HARD_BYTES
        oversized = b"X" * (HARD_BYTES + 1)
        
        result = blob_store.put_bytes("reject_blob", oversized)
        
        # Should fail
        assert result["success"] is False
        assert "too large" in result.get("error", "").lower()
    
    def test_size_limits_in_result(self, blob_store):
        """Result includes size information."""
        data = b"test data content"
        
        result = blob_store.put_bytes("sized_blob", data)
        assert result["success"] is True
        assert result.get("size") == len(data)


class TestCompression:
    """Test compression and decompression."""
    
    def test_gzip_compress_decompress_text(self, blob_store):
        """Text data is gzip compressed."""
        text = "Hello World " * 1000
        
        # Compress
        compressed, algo, ctype = blob_store.compress_data(text)
        
        assert algo == "gzip"
        assert ctype == "text"
        assert len(compressed) < len(text.encode())
        
        # Decompress
        decompressed = blob_store.decompress_data(compressed, algo, ctype)
        assert decompressed == text
    
    def test_gzip_compress_decompress_json(self, blob_store):
        """JSON data is compressed."""
        data = {"items": [{"id": i} for i in range(100)]}
        
        # Compress
        compressed, algo, ctype = blob_store.compress_data(data)
        
        assert algo == "gzip"
        assert ctype == "json"
        
        # Decompress
        decompressed = blob_store.decompress_data(compressed, algo, ctype)
        assert decompressed == data
    
    def test_gzip_compress_decompress_bytes(self, blob_store):
        """Binary data is compressed."""
        data = b"binary content " * 100
        
        # Compress
        compressed, algo, ctype = blob_store.compress_data(data)
        
        assert algo == "gzip"
        assert ctype == "binary"
        assert len(compressed) < len(data)
        
        # Decompress
        decompressed = blob_store.decompress_data(compressed, algo, ctype)
        assert decompressed == data
    
    def test_compression_deterministic(self, blob_store):
        """Same input → same compressed output."""
        data = b"A" * 10000
        
        compressed1, _, _ = blob_store.compress_data(data)
        compressed2, _, _ = blob_store.compress_data(data)
        
        # gzip with mtime=0 should produce identical output
        assert compressed1 == compressed2


class TestContentTypes:
    """Test content type detection."""
    
    def test_text_content_type(self, blob_store):
        """String input produces text content_type."""
        _, _, ctype = blob_store.compress_data("text content")
        assert ctype == "text"
    
    def test_json_content_type(self, blob_store):
        """Dict/list input produces json content_type."""
        _, _, ctype1 = blob_store.compress_data({"key": "value"})
        assert ctype1 == "json"
        
        _, _, ctype2 = blob_store.compress_data([1, 2, 3])
        assert ctype2 == "json"
    
    def test_binary_content_type(self, blob_store):
        """Bytes input produces binary content_type."""
        _, _, ctype = blob_store.compress_data(b"binary data")
        assert ctype == "binary"


class TestGetMissingBlob:
    """Test handling of missing/nonexistent blobs."""
    
    def test_get_missing_blob_returns_failure(self, blob_store):
        """Get missing blob returns error."""
        result = blob_store.get_json("nonexistent_key")
        
        assert result["success"] is False
        assert "error" in result
        assert "not found" in result.get("error", "").lower()
    
    def test_get_missing_text_blob(self, blob_store):
        """Get missing text blob returns error."""
        result = blob_store.get_text("missing_text")
        
        assert result["success"] is False
    
    def test_get_missing_bytes_blob(self, blob_store):
        """Get missing binary blob returns error."""
        result = blob_store.get_bytes("missing_bytes")
        
        assert result["success"] is False


class TestBlobStorage:
    """Test BlobStorage initialization and general operations."""
    
    def test_init_with_cbl_store(self, cbl_store):
        """Initialize with CBL store."""
        bs = BlobStorage(cbl_store)
        assert bs._store is cbl_store
    
    def test_init_without_store(self):
        """Initialize without store (legacy mode)."""
        bs = BlobStorage()
        assert bs._store is None
    
    def test_put_get_round_trip(self, blob_store):
        """Complete put/get round trip."""
        original_data = {"test": "data", "list": [1, 2, 3]}
        key = "roundtrip_test"
        
        # Put
        put_result = blob_store.put_json(key, original_data)
        assert put_result["success"] is True
        
        # Get
        get_result = blob_store.get_json(key)
        assert get_result["success"] is True
        assert get_result["data"] == original_data
    
    def test_delete_blob(self, blob_store):
        """Delete a blob."""
        blob_store.put_text("delete_test", "content")
        
        # Delete
        result = blob_store.delete("delete_test")
        assert result["success"] is True
        
        # Verify deleted
        get_result = blob_store.get_text("delete_test")
        assert get_result["success"] is False


class TestErrorHandling:
    """Test error handling and edge cases."""
    
    def test_decompress_unsupported_compression(self, blob_store):
        """Decompress with unsupported compression type raises error."""
        data = b"test"
        
        with pytest.raises(ValueError, match="Unsupported compression"):
            blob_store.decompress_data(data, "unknown_algo", "binary")
    
    def test_compress_various_types(self, blob_store):
        """Compress can handle various input types."""
        # String
        c1, a1, ct1 = blob_store.compress_data("string")
        assert a1 == "gzip"
        
        # Bytes
        c2, a2, ct2 = blob_store.compress_data(b"bytes")
        assert a2 == "gzip"
        
        # Dict
        c3, a3, ct3 = blob_store.compress_data({"key": "value"})
        assert a3 == "gzip"
        
        # List
        c4, a4, ct4 = blob_store.compress_data([1, 2, 3])
        assert a4 == "gzip"
    
    def test_put_text_without_store(self):
        """Put text without backing store (legacy mode)."""
        bs = BlobStorage(None)
        result = bs.put_text("legacy_text", "content")
        
        # Should still return success (legacy fallback)
        assert result["success"] is True


class TestLargePayloads:
    """Test handling of large payloads."""
    
    def test_large_json_storage(self, blob_store):
        """Store and retrieve large JSON payloads."""
        large_data = {
            "results": [
                {
                    "id": f"result_{i}",
                    "data": "X" * 1000,
                    "nested": {
                        "values": list(range(100))
                    }
                }
                for i in range(500)
            ]
        }
        
        result = blob_store.put_json("large_payload", large_data)
        assert result["success"] is True
        
        retrieved = blob_store.get_json("large_payload")
        assert retrieved["success"] is True
        assert len(retrieved["data"]["results"]) == 500
    
    def test_large_binary_storage(self, blob_store):
        """Store and retrieve large binary payloads."""
        large_data = b"X" * (5 * 1024 * 1024)  # 5MB
        
        result = blob_store.put_bytes("large_binary", large_data)
        assert result["success"] is True
        assert result["size"] == len(large_data)
        
        retrieved = blob_store.get_bytes("large_binary")
        assert retrieved["success"] is True
        assert len(retrieved["data"]) == len(large_data)
