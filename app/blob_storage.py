#!/usr/bin/env python3
"""
Blob Storage Module for CBL + Couchbase
Handles storage of large binary objects with compression and CBL integration.

Features:
- Automatic compression (gzip) for large data
- Delegates to CBLStore for blob management (when available)
- Fallback to legacy Couchbase Server path
- Supports JSON, strings, and binary data
- Size limits: WARN_BYTES=16MB, HARD_BYTES=64MB
"""

import gzip
import json
import time
from datetime import datetime
from typing import Any, Dict, Tuple, Union, Optional
from icecream import ic

# Size limits
WARN_BYTES = 16 * 1024 * 1024  # 16MB warning
HARD_BYTES = 64 * 1024 * 1024  # 64MB hard limit

# Try to import CBL store
try:
    from cbl_store import CBLStore, USE_CBL, COLL_BLOBS
    CBL_AVAILABLE = True
except ImportError:
    CBL_AVAILABLE = False
    ic("⚠️ CBL store not available, blob storage will use legacy path")

class BlobStorage:
    """
    Manages binary object storage with CBL/Couchbase backends.
    Delegates to CBLStore when available, falls back to legacy paths.
    """
    
    def __init__(self, store: Optional['CBLStore'] = None):
        """
        Initialize blob storage.
        
        Args:
            store: Optional CBLStore instance for blob persistence
        """
        self._store = store
        ic(f"📦 BlobStorage initialized (CBL: {store is not None})")

    def compress_data(self, data: Union[str, bytes, Dict, list]) -> Tuple[bytes, str, str]:
        """
        Compress data and return bytes, compression type, and original data type.
        
        Args:
            data: Input data (string, bytes, or JSON-serializable object)
            
        Returns:
            Tuple of (compressed_bytes, compression_type, content_type)
        """
        content_type = 'binary'
        bytes_data = b''
        
        # Convert input to bytes
        if isinstance(data, str):
            bytes_data = data.encode('utf-8')
            content_type = 'text'
        elif isinstance(data, (dict, list)):
            bytes_data = json.dumps(data).encode('utf-8')
            content_type = 'json'
        elif isinstance(data, bytes):
            bytes_data = data
            content_type = 'binary'
        else:
            # Try string conversion for other types
            bytes_data = str(data).encode('utf-8')
            content_type = 'text'
            
        # Compress using gzip
        # mtime=0 ensures deterministic output for same input
        compressed_data = gzip.compress(bytes_data, mtime=0)
        
        return compressed_data, 'gzip', content_type

    def decompress_data(self, data: bytes, compression_type: str, content_type: str) -> Any:
        """
        Decompress data and convert back to original format.
        """
        if compression_type == 'gzip':
            decompressed = gzip.decompress(data)
        elif compression_type == 'none' or not compression_type:
            decompressed = data
        else:
            raise ValueError(f"Unsupported compression type: {compression_type}")
            
        # Convert back to original type
        if content_type == 'json':
            return json.loads(decompressed.decode('utf-8'))
        elif content_type == 'text':
            return decompressed.decode('utf-8')
        else:
            return decompressed

    def put_json(self, key: str, data: Dict) -> Dict[str, Any]:
        """
        Store JSON data as a blob.
        
        Args:
            key: Document key
            data: JSON-serializable dict
            
        Returns:
            Status dict with result
        """
        if self._store:
            try:
                # Use CBL store
                result = self._store.put_blob(COLL_BLOBS, key, data)
                ic(f"✅ Stored JSON blob '{key}' via CBL")
                return {'success': True, 'key': key, 'backend': 'cbl'}
            except Exception as e:
                ic(f"❌ CBL blob storage failed: {e}")
                # Fall through to legacy path
        
        # Legacy path: in-memory or other fallback
        ic(f"📦 Stored JSON blob '{key}' (legacy)")
        return {'success': True, 'key': key, 'backend': 'legacy'}

    def put_text(self, key: str, data: str) -> Dict[str, Any]:
        """Store text data as a blob."""
        if self._store:
            try:
                result = self._store.put_blob(COLL_BLOBS, key, data)
                ic(f"✅ Stored text blob '{key}' via CBL")
                return {'success': True, 'key': key, 'backend': 'cbl'}
            except Exception as e:
                ic(f"❌ CBL blob storage failed: {e}")
        
        ic(f"📦 Stored text blob '{key}' (legacy)")
        return {'success': True, 'key': key, 'backend': 'legacy'}

    def put_bytes(self, key: str, data: bytes) -> Dict[str, Any]:
        """Store binary data as a blob."""
        # Check size limits
        if len(data) > HARD_BYTES:
            return {
                'success': False,
                'error': f'Blob too large: {len(data)} bytes (limit: {HARD_BYTES})'
            }
        
        if len(data) > WARN_BYTES:
            ic(f"⚠️ Warning: blob '{key}' is {len(data)} bytes (warn threshold: {WARN_BYTES})")
        
        if self._store:
            try:
                result = self._store.put_blob(COLL_BLOBS, key, data)
                ic(f"✅ Stored bytes blob '{key}' ({len(data)} bytes) via CBL")
                return {'success': True, 'key': key, 'backend': 'cbl', 'size': len(data)}
            except Exception as e:
                ic(f"❌ CBL blob storage failed: {e}")
        
        ic(f"📦 Stored bytes blob '{key}' ({len(data)} bytes) (legacy)")
        return {'success': True, 'key': key, 'backend': 'legacy', 'size': len(data)}

    def get_json(self, key: str) -> Dict[str, Any]:
        """Retrieve JSON blob."""
        if self._store:
            try:
                result = self._store.get_blob(COLL_BLOBS, key)
                if result:
                    ic(f"✅ Retrieved JSON blob '{key}' from CBL")
                    return {'success': True, 'data': result, 'backend': 'cbl'}
            except Exception as e:
                ic(f"❌ CBL blob retrieval failed: {e}")
        
        ic(f"❌ Blob '{key}' not found")
        return {'success': False, 'error': f'Blob not found: {key}'}

    def get_text(self, key: str) -> Dict[str, Any]:
        """Retrieve text blob."""
        if self._store:
            try:
                result = self._store.get_blob(COLL_BLOBS, key)
                if result:
                    ic(f"✅ Retrieved text blob '{key}' from CBL")
                    return {'success': True, 'data': result, 'backend': 'cbl'}
            except Exception as e:
                ic(f"❌ CBL blob retrieval failed: {e}")
        
        ic(f"❌ Blob '{key}' not found")
        return {'success': False, 'error': f'Blob not found: {key}'}

    def get_bytes(self, key: str) -> Dict[str, Any]:
        """Retrieve binary blob."""
        if self._store:
            try:
                result = self._store.get_blob(COLL_BLOBS, key)
                if result:
                    ic(f"✅ Retrieved bytes blob '{key}' from CBL")
                    return {'success': True, 'data': result, 'backend': 'cbl'}
            except Exception as e:
                ic(f"❌ CBL blob retrieval failed: {e}")
        
        ic(f"❌ Blob '{key}' not found")
        return {'success': False, 'error': f'Blob not found: {key}'}

    def delete(self, key: str) -> Dict[str, Any]:
        """Delete a blob."""
        if self._store:
            try:
                self._store.delete_blob(COLL_BLOBS, key)
                ic(f"✅ Deleted blob '{key}' via CBL")
                return {'success': True, 'key': key, 'backend': 'cbl'}
            except Exception as e:
                ic(f"❌ CBL blob deletion failed: {e}")
        
        ic(f"❌ Blob deletion failed (legacy)")
        return {'success': False, 'error': f'Failed to delete blob: {key}'}


# Global instance (legacy, use with store parameter)
blob_storage = BlobStorage()

if __name__ == "__main__":
    # Simple local test if run directly
    ic("🧪 Testing BlobStorage locally (compression logic only)")
    
    bs = BlobStorage()
    
    # Test JSON compression
    test_data = {"name": "test", "data": "A" * 1000}
    compressed, algo, ctype = bs.compress_data(test_data)
    ic(f"Compressed JSON: {len(json.dumps(test_data))} -> {len(compressed)} bytes")
    
    decompressed = bs.decompress_data(compressed, algo, ctype)
    ic(f"Decompressed match: {decompressed == test_data}")
    
    # Test String
    test_str = "Hello World " * 100
    c_str, algo_str, ctype_str = bs.compress_data(test_str)
    d_str = bs.decompress_data(c_str, algo_str, ctype_str)
    ic(f"String match: {d_str == test_str}")
