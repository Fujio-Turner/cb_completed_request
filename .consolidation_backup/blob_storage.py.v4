#!/usr/bin/env python3
"""
Blob Storage Module for Couchbase
Handles storage of large binary objects (blobs) with compression and XATTR metadata.

Features:
- Automatic compression (gzip) for large data
- Stores metadata in XATTRs (extended attributes)
- Supports JSON, strings, and binary data
- Handles Couchbase 20MB limit check (warns if exceeded)
"""

import gzip
import json
import time
from datetime import datetime
from typing import Any, Dict, Tuple, Union, Optional
import couchbase.subdocument as SD
from couchbase.collection import Collection
from couchbase.options import UpsertOptions
from couchbase.transcoder import RawBinaryTranscoder
from icecream import ic

# 20MB limit in bytes (Couchbase Memcached limit)
COUCHBASE_KV_LIMIT = 20 * 1024 * 1024

class BlobStorage:
    """
    Manages binary object storage in Couchbase with XATTR metadata
    """
    
    def __init__(self):
        pass

    def compress_data(self, data: Union[str, bytes, Dict, list]) -> Tuple[bytes, str, str]:
        """
        Compress data and return bytes, compression type, and original data type
        
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
        Decompress data and convert back to original format
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

    def save_blob(self, 
                  collection: Collection, 
                  key: str, 
                  data: Any, 
                  metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Save data as a compressed blob with XATTR metadata
        
        Args:
            collection: Couchbase Collection object
            key: Document key
            data: Data to store
            metadata: Additional custom metadata dict
            
        Returns:
            Dict with operation status and stats
        """
        try:
            start_time = time.time()
            
            # 1. Prepare data
            compressed_bytes, compress_type, content_type = self.compress_data(data)
            
            original_size = len(str(data)) if isinstance(data, (str, bytes)) else len(json.dumps(data))
            compressed_size = len(compressed_bytes)
            compression_ratio = round((1 - (compressed_size / original_size)) * 100, 2) if original_size > 0 else 0
            
            ic(f"💾 Saving blob {key}: {original_size} -> {compressed_size} bytes ({compression_ratio}% saved)")
            
            # Check limit
            if compressed_size > COUCHBASE_KV_LIMIT:
                ic(f"❌ Error: Compressed data size ({compressed_size} bytes) exceeds Couchbase 20MB limit")
                raise ValueError(f"Data too large: {compressed_size} bytes (limit: {COUCHBASE_KV_LIMIT})")
            
            # 2. Store binary body
            # We use RawBinaryTranscoder to ensure bytes are stored as-is without SDK encoding
            collection.upsert(
                key, 
                compressed_bytes, 
                UpsertOptions(transcoder=RawBinaryTranscoder())
            )
            
            # 3. Store Metadata in XATTRs
            # We use a specific key 'blob_meta' to store our system metadata
            blob_meta = {
                'compression': compress_type,
                'contentType': content_type,
                'originalSize': original_size,
                'compressedSize': compressed_size,
                'updatedAt': datetime.utcnow().isoformat() + 'Z',
                'timestamp': time.time()
            }
            
            # Merge user metadata if provided
            if metadata:
                blob_meta['userMeta'] = metadata
                
            # Use mutate_in to set XATTR
            # Store under key "blob_meta" in XATTRs
            collection.mutate_in(
                key,
                [SD.upsert('blob_meta', blob_meta, xattr=True)]
            )
            
            elapsed_ms = int((time.time() - start_time) * 1000)
            
            return {
                'success': True,
                'key': key,
                'stats': {
                    'original_size': original_size,
                    'compressed_size': compressed_size,
                    'ratio_percent': compression_ratio,
                    'elapsed_ms': elapsed_ms
                }
            }
            
        except Exception as e:
            ic(f"💥 Error saving blob {key}: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }

    def load_blob(self, collection: Collection, key: str) -> Dict[str, Any]:
        """
        Load blob and metadata, automatically decompressing
        
        Args:
            collection: Couchbase Collection object
            key: Document key
            
        Returns:
            Dict with 'data' and 'metadata'
        """
        try:
            # 1. Get Metadata (XATTR)
            # We try to lookup the blob_meta XATTR
            try:
                lookup_res = collection.lookup_in(
                    key,
                    [SD.get('blob_meta', xattr=True)]
                )
                blob_meta = lookup_res.content_as[dict](0)
            except Exception as e:
                ic(f"⚠️ No blob metadata found for {key}, assuming raw uncompressed data")
                blob_meta = {}
            
            # 2. Get Binary Body
            # Use RawBinaryTranscoder to get bytes back
            get_res = collection.get(
                key, 
                transcoder=RawBinaryTranscoder()
            )
            raw_bytes = get_res.content_as[bytes]
            
            # 3. Decompress based on metadata
            compression = blob_meta.get('compression')
            content_type = blob_meta.get('contentType', 'binary')
            
            data = self.decompress_data(raw_bytes, compression, content_type)
            
            return {
                'success': True,
                'data': data,
                'metadata': blob_meta,
                'cas': get_res.cas
            }
            
        except Exception as e:
            ic(f"💥 Error loading blob {key}: {str(e)}")
            import traceback
            ic(traceback.format_exc())
            return {
                'success': False,
                'error': str(e)
            }

# Global instance
blob_storage = BlobStorage()

if __name__ == "__main__":
    # Simple local test if run directly
    ic("🧪 Testing BlobStorage locally (compression logic only)")
    
    bs = BlobStorage()
    
    # Test JSON compression
    test_data = {"name": "test", "data": "A" * 1000}
    compressed, algo, ctype = bs.compress_data(test_data)
    ic(f"Compressed JSON: {len(str(test_data))} -> {len(compressed)} bytes")
    
    decompressed = bs.decompress_data(compressed, algo, ctype)
    ic(f"Decompressed match: {decompressed == test_data}")
    
    # Test String
    test_str = "Hello World " * 100
    c_str, algo_str, ctype_str = bs.compress_data(test_str)
    d_str = bs.decompress_data(c_str, algo_str, ctype_str)
    ic(f"String match: {d_str == test_str}")
