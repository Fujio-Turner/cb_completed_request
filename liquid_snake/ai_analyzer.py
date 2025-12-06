#!/usr/bin/env python3
"""
AI Analyzer Module for Couchbase Query Analyzer
Handles session management, payload building, and AI provider interactions

Architecture:
- In-memory session cache with TTL expiry
- Multi-provider support (OpenAI, Anthropic, Grok)
- Data obfuscation for privacy
- Automatic garbage collection
"""

import time
import hashlib
import secrets
import threading
import requests
import json
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from icecream import ic

# Try to import OpenAI SDK
try:
    from openai import OpenAI, OpenAIError
    OPENAI_SDK_AVAILABLE = True
except ImportError:
    OPENAI_SDK_AVAILABLE = False
    ic("⚠️ OpenAI SDK not installed. Please run: pip install openai")

# ============================================================================
# Global Debug Configuration
# ============================================================================

DEBUG = True  # Set to False to disable all icecream logs

def configure_debug(enabled: bool = True):
    """
    Enable or disable debug logging globally
    
    Args:
        enabled: If True, icecream logs are shown. If False, they're disabled.
    """
    global DEBUG
    DEBUG = enabled
    
    if not DEBUG:
        ic.disable()
    else:
        ic.enable()
    
    ic(f"🐛 AI Analyzer debug logging: {'ENABLED' if DEBUG else 'DISABLED'}")

# Configure icecream output
ic.configureOutput(prefix='[ai_analyzer] ')

# Enable debug by default
configure_debug(DEBUG)

# ============================================================================
# Payload Reference Manager
# ============================================================================

# In-memory cache for payload references (loaded from Couchbase)
_payload_reference_cache: Optional[Dict[str, Any]] = None
_payload_reference_cache_time: float = 0
PAYLOAD_REFERENCE_CACHE_TTL = 300  # 5 minutes

def get_payload_reference_template() -> Dict[str, Any]:
    """
    Load payload_reference.json.template as fallback/seed data
    
    Returns:
        Template dict with reference URLs and context
    """
    import os
    template_path = os.path.join(os.path.dirname(__file__), 'payload_reference.json.template')
    
    try:
        with open(template_path, 'r') as f:
            template = json.load(f)
            ic(f"📄 Loaded payload_reference.json.template")
            return template
    except FileNotFoundError:
        ic(f"⚠️ Template file not found: {template_path}")
        return {}
    except json.JSONDecodeError as e:
        ic(f"❌ Invalid JSON in template: {e}")
        return {}

def load_payload_reference(cluster, bucket_name: str = None) -> Dict[str, Any]:
    """
    Load payload_reference document from Couchbase bucket._default._default
    Auto-seeds from template if document doesn't exist, is empty, or is malformed
    
    Args:
        cluster: Couchbase cluster connection
        bucket_name: Bucket name (uses 'cb_tools' if not specified)
        
    Returns:
        Payload reference dict with URLs and context
    """
    global _payload_reference_cache, _payload_reference_cache_time
    
    # Import Couchbase exceptions for proper handling
    try:
        from couchbase.exceptions import (
            DocumentNotFoundException,
            TimeoutException,
            CouchbaseException
        )
    except ImportError:
        # If imports fail, use generic Exception
        DocumentNotFoundException = Exception
        TimeoutException = Exception
        CouchbaseException = Exception
    
    # Check cache first
    if _payload_reference_cache and (time.time() - _payload_reference_cache_time) < PAYLOAD_REFERENCE_CACHE_TTL:
        ic("📦 Using cached payload_reference")
        return _payload_reference_cache
    
    bucket_name = bucket_name or 'cb_tools'
    doc_key = 'payload_reference'
    
    try:
        bucket = cluster.bucket(bucket_name)
        collection = bucket.scope('_default').collection('_default')
        
        result = collection.get(doc_key)
        payload_ref = result.content_as[dict]
        
        # Validate document is not empty or malformed (must have key fields)
        if not payload_ref or not payload_ref.get('couchbase_index_creation'):
            ic("⚠️ payload_reference document is empty or malformed, re-seeding from template")
            raise ValueError("Document empty or missing required fields")
        
        # Update cache
        _payload_reference_cache = payload_ref
        _payload_reference_cache_time = time.time()
        
        ic(f"✅ Loaded payload_reference from Couchbase {bucket_name}._default._default")
        return payload_ref
        
    except DocumentNotFoundException:
        # Document doesn't exist - auto-seed from template
        ic(f"📄 payload_reference not found in {bucket_name}._default._default, auto-seeding from template")
        return _auto_seed_payload_reference(cluster, bucket_name)
        
    except TimeoutException as e:
        ic(f"⏰ Timeout loading payload_reference: {e}")
        ic("📄 Falling back to template file (not seeding due to timeout)")
        return _fallback_to_template()
        
    except ValueError as e:
        # Empty or malformed document - re-seed from template
        ic(f"⚠️ Invalid payload_reference: {e}")
        return _auto_seed_payload_reference(cluster, bucket_name)
        
    except CouchbaseException as e:
        ic(f"❌ Couchbase error loading payload_reference: {e}")
        ic("📄 Falling back to template file")
        return _fallback_to_template()
        
    except Exception as e:
        ic(f"💥 Unexpected error loading payload_reference: {e}")
        ic("📄 Falling back to template file")
        return _fallback_to_template()


def _auto_seed_payload_reference(cluster, bucket_name: str) -> Dict[str, Any]:
    """
    Auto-seed payload_reference from template and return it
    Called when document is missing, empty, or malformed
    """
    global _payload_reference_cache, _payload_reference_cache_time
    
    template = get_payload_reference_template()
    
    if not template:
        ic("❌ Template file missing or invalid, using empty defaults")
        return {}
    
    try:
        bucket = cluster.bucket(bucket_name)
        collection = bucket.scope('_default').collection('_default')
        
        # Add metadata
        template['_seededAt'] = datetime.utcnow().isoformat() + 'Z'
        template['_autoSeeded'] = True
        template['_lastUpdated'] = datetime.utcnow().isoformat() + 'Z'
        
        collection.upsert('payload_reference', template)
        
        # Update cache
        _payload_reference_cache = template
        _payload_reference_cache_time = time.time()
        
        ic(f"🌱 Auto-seeded payload_reference to {bucket_name}._default._default")
        return template
        
    except Exception as e:
        ic(f"❌ Failed to auto-seed payload_reference: {e}")
        ic("📄 Using template without saving to Couchbase")
        
        # Still cache and return template even if save failed
        _payload_reference_cache = template
        _payload_reference_cache_time = time.time()
        return template


def _fallback_to_template() -> Dict[str, Any]:
    """
    Fallback to template file without attempting to seed
    Used when Couchbase has connectivity issues
    """
    global _payload_reference_cache, _payload_reference_cache_time
    
    template = get_payload_reference_template()
    _payload_reference_cache = template
    _payload_reference_cache_time = time.time()
    return template

def save_payload_reference(cluster, payload_ref: Dict[str, Any], bucket_name: str = None) -> bool:
    """
    Save/update payload_reference document to Couchbase bucket._default._default
    
    Args:
        cluster: Couchbase cluster connection
        payload_ref: Payload reference dict to save
        bucket_name: Bucket name (uses 'cb_tools' if not specified)
        
    Returns:
        True if successful, False otherwise
    """
    global _payload_reference_cache, _payload_reference_cache_time
    
    bucket_name = bucket_name or 'cb_tools'
    doc_key = 'payload_reference'
    
    # Add metadata
    payload_ref['_lastUpdated'] = datetime.utcnow().isoformat() + 'Z'
    
    try:
        bucket = cluster.bucket(bucket_name)
        collection = bucket.scope('_default').collection('_default')
        
        collection.upsert(doc_key, payload_ref)
        
        # Invalidate cache
        _payload_reference_cache = payload_ref
        _payload_reference_cache_time = time.time()
        
        ic(f"✅ Saved payload_reference to Couchbase {bucket_name}._default._default")
        return True
        
    except Exception as e:
        ic(f"❌ Failed to save payload_reference: {e}")
        return False

def seed_payload_reference(cluster, bucket_name: str = None, force: bool = False) -> Dict[str, Any]:
    """
    Seed payload_reference document from template if it doesn't exist
    
    Args:
        cluster: Couchbase cluster connection
        bucket_name: Bucket name (uses 'cb_tools' if not specified)
        force: If True, overwrite existing document with template
        
    Returns:
        The payload_reference document (existing or newly seeded)
    """
    bucket_name = bucket_name or 'cb_tools'
    doc_key = 'payload_reference'
    
    try:
        bucket = cluster.bucket(bucket_name)
        collection = bucket.scope('_default').collection('_default')
        
        if not force:
            # Check if document exists
            try:
                result = collection.get(doc_key)
                ic(f"ℹ️ payload_reference already exists in {bucket_name}._default._default")
                return result.content_as[dict]
            except Exception:
                pass  # Document doesn't exist, proceed to seed
        
        # Load template and save to Couchbase
        template = get_payload_reference_template()
        if template:
            template['_seededAt'] = datetime.utcnow().isoformat() + 'Z'
            collection.upsert(doc_key, template)
            ic(f"🌱 Seeded payload_reference to {bucket_name}._default._default")
            return template
        else:
            ic("❌ Cannot seed: template file not found or invalid")
            return {}
            
    except Exception as e:
        ic(f"❌ Failed to seed payload_reference: {e}")
        return {}

def invalidate_payload_reference_cache():
    """Clear the in-memory cache to force reload from Couchbase"""
    global _payload_reference_cache, _payload_reference_cache_time
    _payload_reference_cache = None
    _payload_reference_cache_time = 0
    ic("🗑️ Invalidated payload_reference cache")

# ============================================================================
# AI HTTP Client
# ============================================================================

class AIHttpClient:
    """
    Robust HTTP client with retry logic, timeout handling, and detailed logging
    """
    
    def __init__(self, 
                 max_retries=3, 
                 backoff_factor=5.0,  # 5 second wait before retry
                 timeout=300,  # 5 minutes - AI models need time for complex analysis
                 retry_on_status=[429, 500, 502, 503, 504]):
        """
        Initialize HTTP client with retry configuration
        
        Args:
            max_retries (int): Maximum number of retry attempts
            backoff_factor (float): Exponential backoff multiplier (delay = {backoff_factor} * (2 ** retry_count))
            timeout (int): Request timeout in seconds
            retry_on_status (list): HTTP status codes to retry on
        """
        self.max_retries = max_retries
        self.backoff_factor = backoff_factor
        self.timeout = timeout
        self.retry_on_status = retry_on_status
        
        ic("🔧 AIHttpClient initialized", max_retries, backoff_factor, timeout, retry_on_status)
    
    def _create_session(self):
        """Create requests session with retry strategy"""
        session = requests.Session()
        
        # Configure retry strategy
        retry_strategy = Retry(
            total=self.max_retries,
            backoff_factor=self.backoff_factor,
            status_forcelist=self.retry_on_status,
            allowed_methods=["POST", "PUT", "GET"],
            raise_on_status=False
        )
        
        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        
        return session
    
    def call_api(self, method, url, headers=None, json_data=None, **kwargs):
        """
        Make HTTP request with retry logic and comprehensive logging
        
        Args:
            method (str): HTTP method ('POST', 'PUT', 'GET')
            url (str): API endpoint URL
            headers (dict): Custom headers
            json_data (dict): JSON payload
            **kwargs: Additional requests parameters
            
        Returns:
            dict: Response with success status and data/error
        """
        start_time = time.time()
        attempt = 0
        
        ic("🚀 API Call Starting", method, url)
        ic("📤 Headers", headers)
        ic(f"📤 Payload size: {len(str(json_data))} bytes")
        
        session = self._create_session()
        
        # Merge custom headers with defaults
        default_headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'Couchbase-Query-Analyzer/3.29.1'
        }
        
        if headers:
            default_headers.update(headers)
        
        while attempt < self.max_retries:
            attempt += 1
            
            try:
                ic(f"🔄 Attempt {attempt}/{self.max_retries}")
                
                # Make the request
                response = session.request(
                    method=method.upper(),
                    url=url,
                    headers=default_headers,
                    json=json_data,
                    timeout=self.timeout,
                    **kwargs
                )
                
                elapsed_ms = int((time.time() - start_time) * 1000)
                
                ic("📥 Response Status", response.status_code, f"{elapsed_ms}ms")
                
                # Success case
                if 200 <= response.status_code < 300:
                    try:
                        response_data = response.json()
                        ic("✅ Success", response_data)
                        
                        return {
                            'success': True,
                            'status_code': response.status_code,
                            'data': response_data,
                            'elapsed_ms': elapsed_ms,
                            'attempts': attempt
                        }
                    except ValueError:
                        # Response is not JSON
                        ic("✅ Success (non-JSON response)", response.text[:200])
                        
                        return {
                            'success': True,
                            'status_code': response.status_code,
                            'data': response.text,
                            'elapsed_ms': elapsed_ms,
                            'attempts': attempt
                        }
                
                # Retry on specific status codes
                if response.status_code in self.retry_on_status:
                    ic(f"⚠️ Retryable error {response.status_code}, will retry...")
                    
                    # Exponential backoff
                    if attempt < self.max_retries:
                        delay = self.backoff_factor * (2 ** (attempt - 1))
                        
                        # Check for Retry-After header
                        retry_after = response.headers.get('Retry-After')
                        if retry_after:
                            try:
                                delay = max(delay, float(retry_after))
                                ic(f"🛑 Server requested wait (header): {retry_after}s")
                            except ValueError:
                                pass
                                
                        # Check for "try again in Xms" in text
                        if 'try again in' in response.text:
                            try:
                                import re
                                # Match "try again in 120ms" or "try again in 1s"
                                match = re.search(r'try again in (\d+(?:\.\d+)?)(ms|s|m)', response.text)
                                if match:
                                    val = float(match.group(1))
                                    unit = match.group(2)
                                    if unit == 'ms':
                                        wait_s = val / 1000.0
                                    elif unit == 'm':
                                        wait_s = val * 60
                                    else:
                                        wait_s = val
                                    
                                    if wait_s > delay:
                                        delay = wait_s
                                        ic(f"🛑 Error message requested wait: {delay}s")
                            except Exception as e:
                                ic(f"⚠️ Failed to parse wait time: {e}")
                        
                        ic(f"⏳ Waiting {delay}s before retry")
                        time.sleep(delay)
                        continue
                
                # Non-retryable error
                ic("❌ API Error (non-retryable)", response.status_code, response.text[:500])
                
                return {
                    'success': False,
                    'status_code': response.status_code,
                    'error': f"HTTP {response.status_code}: {response.text[:500]}",
                    'raw_response': response.text,
                    'elapsed_ms': elapsed_ms,
                    'attempts': attempt
                }
                
            except requests.exceptions.Timeout:
                ic(f"⏰ Timeout on attempt {attempt}")
                
                if attempt >= self.max_retries:
                    elapsed_ms = int((time.time() - start_time) * 1000)
                    return {
                        'success': False,
                        'error': f'Request timeout after {self.timeout}s',
                        'elapsed_ms': elapsed_ms,
                        'attempts': attempt
                    }
                
                # Wait before retry
                delay = self.backoff_factor * (2 ** (attempt - 1))
                ic(f"⏳ Waiting {delay}s before retry")
                time.sleep(delay)
                
            except requests.exceptions.ConnectionError as e:
                ic(f"🔌 Connection error on attempt {attempt}", str(e))
                
                if attempt >= self.max_retries:
                    elapsed_ms = int((time.time() - start_time) * 1000)
                    return {
                        'success': False,
                        'error': f'Connection error: {str(e)}',
                        'elapsed_ms': elapsed_ms,
                        'attempts': attempt
                    }
                
                # Wait before retry
                delay = self.backoff_factor * (2 ** (attempt - 1))
                ic(f"⏳ Waiting {delay}s before retry")
                time.sleep(delay)
                
            except Exception as e:
                ic("💥 Unexpected error", type(e).__name__, str(e))
                elapsed_ms = int((time.time() - start_time) * 1000)
                
                return {
                    'success': False,
                    'error': f'Unexpected error: {str(e)}',
                    'elapsed_ms': elapsed_ms,
                    'attempts': attempt
                }
        
        # Max retries exceeded
        elapsed_ms = int((time.time() - start_time) * 1000)
        ic("❌ Max retries exceeded", attempt)
        
        return {
            'success': False,
            'error': f'Max retries ({self.max_retries}) exceeded',
            'elapsed_ms': elapsed_ms,
            'attempts': attempt
        }

# Global HTTP client instance
http_client = AIHttpClient(
    max_retries=5,
    backoff_factor=1.0,
    timeout=60
)

# ============================================================================
# Session Cache Manager
# ============================================================================

class SessionCache:
    """
    In-memory cache for analyzer data with TTL and automatic cleanup
    """
    
    def __init__(self, ttl_minutes: int = 30, cleanup_interval_seconds: int = 300):
        """
        Initialize session cache
        
        Args:
            ttl_minutes: Time-to-live for cached sessions in minutes
            cleanup_interval_seconds: How often to run garbage collection
        """
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.Lock()
        self.ttl_seconds = ttl_minutes * 60
        self.cleanup_interval = cleanup_interval_seconds
        
        # Start background cleanup thread
        self._start_cleanup_thread()
        
        ic("🗄️ SessionCache initialized", ttl_minutes, cleanup_interval_seconds)
    
    def _start_cleanup_thread(self):
        """Start background thread for automatic cleanup"""
        def cleanup_worker():
            while True:
                time.sleep(self.cleanup_interval)
                self._cleanup_expired()
        
        thread = threading.Thread(target=cleanup_worker, daemon=True)
        thread.start()
        ic("🧹 Cleanup thread started")
    
    def _cleanup_expired(self):
        """Remove expired sessions from cache"""
        now = time.time()
        expired_keys = []
        
        with self._lock:
            for session_id, session in self._cache.items():
                if now - session['timestamp'] > self.ttl_seconds:
                    expired_keys.append(session_id)
            
            for key in expired_keys:
                del self._cache[key]
        
        if expired_keys:
            ic(f"🗑️ Cleaned up {len(expired_keys)} expired sessions", expired_keys)
    
    def set(self, session_id: str, data: Dict[str, Any]) -> None:
        """Store data in cache"""
        with self._lock:
            self._cache[session_id] = {
                'data': data,
                'timestamp': time.time()
            }
        ic(f"💾 Cached session {session_id}", f"size={len(str(data))} bytes")
    
    def get(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve data from cache"""
        with self._lock:
            session = self._cache.get(session_id)
            
            if not session:
                ic(f"❌ Session {session_id} not found")
                return None
            
            # Check if expired
            if time.time() - session['timestamp'] > self.ttl_seconds:
                del self._cache[session_id]
                ic(f"⏰ Session {session_id} expired")
                return None
            
            ic(f"✅ Retrieved session {session_id}")
            return session['data']
    
    def delete(self, session_id: str) -> bool:
        """Remove session from cache"""
        with self._lock:
            if session_id in self._cache:
                del self._cache[session_id]
                ic(f"🗑️ Deleted session {session_id}")
                return True
            return False
    
    def stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        with self._lock:
            total_sessions = len(self._cache)
            total_size = sum(len(str(s['data'])) for s in self._cache.values())
            
            return {
                'total_sessions': total_sessions,
                'total_size_bytes': total_size,
                'total_size_kb': round(total_size / 1024, 2),
                'ttl_seconds': self.ttl_seconds
            }

# Global session cache instance
session_cache = SessionCache(ttl_minutes=30, cleanup_interval_seconds=300)

# ============================================================================
# Data Obfuscator
# ============================================================================

class DataObfuscator:
    """
    Obfuscate sensitive data (bucket names, collection names, field names, values)
    Uses deterministic hashing so same input always produces same output
    Maintains bidirectional mapping for de-obfuscation
    """
    
    def __init__(self, seed: Optional[str] = None):
        """
        Initialize obfuscator
        
        Args:
            seed: Optional seed for deterministic hashing
        """
        self.seed = seed or "couchbase-query-analyzer"
        self._token_cache: Dict[str, str] = {}  # original -> token
        self._reverse_map: Dict[str, str] = {}  # token -> original
        ic("🔒 DataObfuscator initialized")
    
    def _generate_token(self, original: str) -> str:
        """
        Generate deterministic obfuscated token (6 characters)
        
        Uses SHA-256 hash with base36 encoding for compact, readable tokens
        Example: "city" -> "x4k2m9", "users" -> "j7p3q1"
        """
        # Normalize: remove backticks to ensure `city` and city map to same token
        original = original.strip('`')

        if original in self._token_cache:
            return self._token_cache[original]
        
        # Create deterministic hash
        hash_input = f"{self.seed}:{original}"
        hash_bytes = hashlib.sha256(hash_input.encode()).digest()
        
        # Convert to base36 (0-9, a-z) for compact token (6 chars)
        # Take first 4 bytes (32 bits) and convert to base36
        hash_int = int.from_bytes(hash_bytes[:4], byteorder='big')
        
        # Base36 encoding
        chars = '0123456789abcdefghijklmnopqrstuvwxyz'
        token = ''
        for _ in range(6):
            token = chars[hash_int % 36] + token
            hash_int //= 36
        
        # Store bidirectional mapping
        self._token_cache[original] = token
        self._reverse_map[token] = original
        
        return token
    
    def get_mapping_table(self) -> Dict[str, str]:
        """
        Get the obfuscation mapping table (token -> original)
        Used for de-obfuscation of AI responses
        """
        return self._reverse_map.copy()
    
    def deobfuscate_text(self, text: str, mapping: Dict[str, str]) -> str:
        """
        Replace obfuscated tokens with original values in text
        
        Args:
            text: Text containing obfuscated tokens
            mapping: Reverse mapping (token -> original)
            
        Returns:
            Text with original values restored
        """
        result = text
        for token, original in mapping.items():
            # Escape special JSON characters in original value to prevent JSON corruption
            # This is needed because we're replacing inside a JSON string
            escaped_original = original.replace('\\', '\\\\').replace('"', '\\"').replace('\n', '\\n').replace('\r', '\\r').replace('\t', '\\t')
            result = result.replace(token, escaped_original)
        return result
    
    def obfuscate_value(self, value: Any) -> Any:
        """Obfuscate a single value"""
        if isinstance(value, str):
            return self._generate_token(value)
        elif isinstance(value, (int, float)):
            # Keep numeric values but replace with similar magnitude
            return hash(str(value)) % 10000
        elif isinstance(value, bool):
            return value  # Keep booleans as-is
        elif value is None:
            return None
        else:
            return self._generate_token(str(value))
    
    def obfuscate_query(self, query: str) -> str:
        """
        Obfuscate SQL++ query statement while preserving SQL keywords and structure
        Example: CREATE INDEX idx_users ON users(name) WHERE active = true
        Becomes: CREATE INDEX x4k2m9 ON a9m2k5(j7p3q1) WHERE t8r4n3 = true
        """
        if not query:
            return query
        
        # SQL++ keywords that should NOT be obfuscated
        SQL_KEYWORDS = {
            'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'IS', 'NULL',
            'JOIN', 'INNER', 'LEFT', 'RIGHT', 'OUTER', 'ON', 'USING',
            'GROUP', 'BY', 'HAVING', 'ORDER', 'ASC', 'DESC',
            'LIMIT', 'OFFSET', 'INSERT', 'UPDATE', 'DELETE', 'UPSERT', 'MERGE',
            'CREATE', 'INDEX', 'PRIMARY', 'DROP', 'ALTER', 'BUILD',
            'SET', 'UNSET', 'AS', 'DISTINCT', 'ALL', 'ANY', 'SOME', 'EVERY',
            'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
            'UNION', 'INTERSECT', 'EXCEPT', 'NEST', 'UNNEST', 'FLATTEN',
            'WITH', 'RECURSIVE', 'LET', 'LETTING',
            'USE', 'KEYS', 'PARTITION', 'ARRAY', 'FIRST', 'OBJECT',
            'EXECUTE', 'PREPARE', 'EXPLAIN', 'ADVISE', 'INFER',
            'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'ARRAY_AGG',
            'LIKE', 'BETWEEN', 'EXISTS', 'CONTAINS', 'WITHIN',
            'TRUE', 'FALSE', 'MISSING', 'VALUED'
        }
        
        import re
        
        # Split into tokens preserving structure
        tokens = query.split()
        obfuscated_tokens = []
        
        for token in tokens:
            # Preserve SQL keywords
            if token.upper() in SQL_KEYWORDS:
                obfuscated_tokens.append(token)
                continue
            
            # Check if token contains special characters (operators, punctuation)
            # Need to handle cases like "users(name," -> "users" "(" "name" ","
            import re
            
            # Split token by special characters while keeping them
            parts = re.split(r'([(),;=<>!*+\-/])', token)
            obfuscated_parts = []
            
            for part in parts:
                if not part:
                    continue
                
                # Preserve operators/punctuation
                if part in ['(', ')', ',', ';', '=', '<', '>', '!', '*', '/', '+', '-']:
                    obfuscated_parts.append(part)
                # Preserve numbers
                elif re.match(r'^\d+\.?\d*$', part):
                    obfuscated_parts.append(part)
                # Preserve parameters
                elif part.startswith('?'):
                    obfuscated_parts.append(part)
                # Obfuscate named parameters (e.g., $userId -> $a1b2c3)
                elif part.startswith('$'):
                    # Handle $param
                    param_name = part[1:]
                    # If it's just $, keep it
                    if not param_name:
                        obfuscated_parts.append(part)
                    else:
                        # Obfuscate the parameter name
                        obfuscated_parts.append(f'${self._generate_token(param_name)}')
                # Obfuscate quoted strings and backtick identifiers
                elif part.startswith('"') or part.startswith("'") or part.startswith('`'):
                    quote_char = part[0]
                    # Find matching end quote
                    if len(part) > 1 and part.endswith(quote_char):
                        inner = part[1:-1]
                    else:
                        inner = part[1:]
                    # For backtick identifiers, generate token based on unquoted name
                    # so `name` and name get the SAME obfuscated value
                    obfuscated_parts.append(f'{quote_char}{self._generate_token(inner)}{quote_char}')
                # Obfuscate bucket.scope.collection
                elif '.' in part:
                    segments = part.split('.')
                    obfuscated_segments = [self._generate_token(s.strip('`')) for s in segments]
                    obfuscated_parts.append('.'.join(obfuscated_segments))
                # Preserve SQL keywords (case-insensitive check)
                elif part.upper() in SQL_KEYWORDS:
                    obfuscated_parts.append(part)
                # Obfuscate identifier
                else:
                    obfuscated_parts.append(self._generate_token(part.strip('`')))
            
            obfuscated_tokens.append(''.join(obfuscated_parts))
        
        return ' '.join(obfuscated_tokens)
    
    def obfuscate_dict(self, data: Dict[str, Any], 
                       obfuscate_keys: bool = True, 
                       obfuscate_values: bool = True) -> Dict[str, Any]:
        """Recursively obfuscate dictionary"""
        result = {}
        
        for key, value in data.items():
            new_key = self._generate_token(key) if obfuscate_keys else key
            
            if isinstance(value, dict):
                result[new_key] = self.obfuscate_dict(value, obfuscate_keys, obfuscate_values)
            elif isinstance(value, list):
                result[new_key] = [
                    self.obfuscate_dict(item, obfuscate_keys, obfuscate_values) 
                    if isinstance(item, dict) 
                    else (self.obfuscate_value(item) if obfuscate_values else item)
                    for item in value
                ]
            else:
                result[new_key] = self.obfuscate_value(value) if obfuscate_values else value
        
        return result

# ============================================================================
# AI Payload Builder
# ============================================================================

class AIPayloadBuilder:
    """
    Build AI analysis payload from cached query data
    """
    
    def __init__(self):
        ic("🔨 AIPayloadBuilder initialized")
    
    def build_payload_from_data(self,
                                raw_data: Dict[str, Any],
                                user_prompt: str,
                                selections: Dict[str, bool],
                                options: Dict[str, Any],
                                extra_instructions: str = "",
                                cluster=None,
                                bucket_name: str = None) -> Dict[str, Any]:
        """
        Build AI payload directly from raw data (no session cache)
        
        Args:
            raw_data: Raw analyzer data from frontend
            user_prompt: User's analysis prompt
            selections: Which data sections to include
            options: Options like obfuscation
            extra_instructions: System instructions (language, charts) to append
            cluster: Optional Couchbase cluster for loading dynamic payload references
            bucket_name: Optional bucket name for payload_reference (default: cb_tools)
            
        Returns:
            Complete payload dict
        """
        ic(f"🔨 Building payload from raw data")
        
        # Initialize payload with context
        full_prompt = user_prompt
        if extra_instructions:
            full_prompt += f"\n\n{extra_instructions}"
        
        # Add chart trends depth instructions
        chart_trends_depth = options.get('chart_trends_depth', 'low')
        if chart_trends_depth == 'high':
            full_prompt += """

**📊 CHART TRENDS DEPTH: HIGH**
You MUST provide comprehensive chart_trends analysis with 15-20 insights covering the ENTIRE timeline range.
- Analyze ALL significant events across the full date range, not just the beginning
- Distribute insights evenly across early, middle, and late portions of the timeline
- Include insights from ALL chart types: Request Count, Memory Usage, Duration, CPU Time, Index Scan, Fetch Throughput
- If a stake point is set, ensure at least 3-5 insights are specifically around that timestamp"""
        
        # Add stake focus instructions if enabled
        stake_focus = options.get('stake_focus')
        if stake_focus and stake_focus.get('enabled') and stake_focus.get('datetime'):
            stake_datetime = stake_focus.get('datetime')
            full_prompt += f"""

**🎯 STAKE FOCUS POINT - CRITICAL:**
The user has marked a specific time point on the Timeline charts for focused analysis: **{stake_datetime}**

This "stake" indicates the user observed something significant at this exact moment and wants you to:
1. **MUST include chart_trends insights around {stake_datetime}** - At least 3-5 insights within ±30 minutes of this timestamp
2. **Identify what happened at or around {stake_datetime}** - Look for anomalies, spikes, or pattern changes in the Timeline data
3. **Analyze queries executing at this time** - Check requestTime values close to this timestamp for slow queries, errors, or unusual patterns
4. **Look for correlations** - Examine if metrics like memory, CPU time, kernel time, result size, or index scans show unusual values around this time
5. **Provide specific insights** - In your response, include a dedicated section titled "**📍 Stake Point Analysis ({stake_datetime})**" that addresses what was happening at this specific moment
6. **Connect to broader patterns** - Explain if this time point is part of a larger trend or an isolated incident

CRITICAL: Do NOT skip analysis of the stake timestamp. The user specifically wants to know what happened at {stake_datetime}."""

        # Build stake_focus context if enabled
        stake_focus_context = None
        if stake_focus and stake_focus.get('enabled') and stake_focus.get('datetime'):
            stake_focus_context = {
                'enabled': True,
                'datetime': stake_focus.get('datetime'),
                'description': 'User placed a visual marker ("stake") on Timeline charts at this exact timestamp. This indicates they observed something significant and want focused analysis on what was happening at this moment.',
                'analysis_required': [
                    'Identify queries executing at or near this timestamp (check requestTime fields)',
                    'Look for anomalies, spikes, or pattern changes in Timeline metrics around this time',
                    'Check for correlations between memory, CPU time, kernel time, result size, or index scans',
                    'Include a dedicated section in your response: "📍 Stake Point Analysis" addressing this specific moment'
                ]
            }

        # Load dynamic payload reference (from Couchbase or template fallback)
        payload_ref = {}
        if cluster:
            payload_ref = load_payload_reference(cluster, bucket_name)
        else:
            # No cluster provided, use template as fallback
            payload_ref = get_payload_reference_template()
        
        # Extract dynamic references or use defaults
        couchbase_index_creation = payload_ref.get('couchbase_index_creation', [])
        index_gen_rules = payload_ref.get('index_gen_rules', {})
        context_notes = payload_ref.get('context_notes', [])
        additional_refs = payload_ref.get('additional_references', {})
        
        # Build best_practices with context_notes included
        best_practices = [
            'When suggesting a new or updated index, append "_v1" or "_v2" to the index name to indicate a versioned change (e.g. "idx_user_search_v1").',
            'EXCEPTION: Primary indexes cannot be versioned (do not append _v1 to #primary or equivalent).',
            'For replica changes, prefer ALTER INDEX syntax: ALTER INDEX index_name ON bucket WITH {"action": "replica_count", "num_replica": 1}.',
            'Always use strict JSON object syntax for WITH clauses (e.g. WITH {"num_replica": 1}).',
            'Always derive index keys from actual WHERE/ORDER BY fields in query patterns - NEVER use placeholders like "ALL predicates" or "equality fields".',
            'For covering indexes: include SELECT fields IN the index key list (e.g., (customer_id, status, total, items)) - there is NO COVERING keyword in N1QL CREATE INDEX syntax.',
            'If query uses JOIN, suggest indexes on join keys (e.g., ON KEYS field) combined with equality predicates from WHERE clause.',
            'Index should cover >=70% of avg_indexScan items from query_groups to be effective - prioritize high-impact patterns.',
            'For LIKE queries: if pattern has leading wildcard (LIKE "%value"), suggest FTS instead; if prefix-only (LIKE "value%"), GSI on that field works.',
        ]
        # Add context_notes from payload_reference
        best_practices.extend(context_notes)

        payload = {
            'prompt': full_prompt,
            'context': {
                'tool': 'Couchbase Query Analyzer',
                'purpose': 'This tool analyzes N1QL query performance from system:completed_requests',
                'reference_docs': f"For general best practices, stats definitions, and optimization strategies, refer to: {additional_refs.get('analysis_hub', 'https://cb.fuj.io/analysis_hub')}",
                'data_source': 'Queries extracted from: SELECT *, meta().plan FROM system:completed_requests',
                'chart_trends_depth': chart_trends_depth,  # 'low' (5-6 insights) or 'high' (15-20 insights)
                'stake_focus': stake_focus_context,
                'tabs_explained': {
                    'Dashboard': 'High-level metrics and charts showing query distribution, index usage, and performance patterns',
                    'Insights': 'Automated detection of performance issues, missing indexes, and inefficient query patterns',
                    'Timeline': 'Time-series charts showing request volume, latency, memory, and throughput trends over the selected time range',
                    'Query Groups': 'Normalized query patterns showing aggregated statistics for similar queries (literals replaced with ?)',
                    'Every Query': 'Individual query records with full execution details and timing breakdowns',
                    'Index/Query Flow': 'Visual execution plan showing operator tree, index scans, joins, and data flow',
                    'Indexes': 'Index catalog from system:indexes showing usage statistics, replicas, and recommendations'
                },
                'important_notes': [
                    'elapsedTime = total query execution time',
                    'executionTime = time spent executing (excludes planning/parsing)',
                    'Primary index scans (#primary) = full bucket scans (VERY SLOW in production)',
                    'USE INDEX hints force specific index usage',
                    'Missing WHERE clauses often indicate table scans',
                    'High resultCount with LIMIT suggests index overfetch',
                    'What high kernTime means: kernTime is time spent waiting to be scheduled on CPU. If it dominates ServiceTime and/or Execution Time (e.g., ~99%), the node is CPU-bound and the query spends most of its life paused, not doing useful work. Look for high request.active.count, cpu.user.percent, or gc.pause.percent. Actions: reduce concurrency, add query nodes, or separate services.'
                ],
                'best_practices': best_practices,
                'couchbase_index_creation': couchbase_index_creation,
                'index_gen_rules': index_gen_rules,
                'additional_references': additional_refs
            },
            'data': {},
            'options': options,
            'metadata': {
                'timestamp': datetime.utcnow().isoformat() + 'Z',
                'analyzer_version': raw_data.get('version', 'unknown'),
                'total_queries_in_dataset': len(raw_data.get('everyQueryData', []))
            }
        }
        
        # Build data sections based on selections
        if selections.get('dashboard', False):
            dashboard = self._build_dashboard_metrics(raw_data)
            payload['data']['dashboard_metrics'] = {
                '_description': 'Aggregated statistics from all queries showing distribution patterns and anomalies',
                **dashboard
            }
        
        if selections.get('insights', False):
            insights = self._build_insights(raw_data)
            payload['data']['insights'] = {
                '_description': 'Automated issue detection: slow queries, missing indexes, inefficient patterns, high memory usage',
                **insights
            }
        
        if selections.get('query_groups', False):
            limit = options.get('query_group_limit', 10)
            query_groups = self._build_query_groups(raw_data, limit=limit)
            payload['data']['query_groups'] = {
                '_description': 'Normalized query patterns (literals replaced with ?) showing count, avg time, and representative samples',
                '_note': 'Each pattern represents multiple similar queries with different parameter values',
                **query_groups
            }
        
        if selections.get('indexes', False):
            indexes = self._build_indexes(raw_data)
            payload['data']['indexes'] = {
                '_description': 'Index catalog from system:indexes with usage statistics, scan counts, and last scan timestamps',
                '_warnings': 'Unused indexes waste memory. Primary indexes cause full scans. Missing replicas = single point of failure.',
                **indexes
            }
        
        if selections.get('flow_diagram', False):
            flow = self._build_flow_diagram(raw_data)
            payload['data']['index_query_flow'] = {
                '_description': 'Query execution plan operators: scans, joins, filters, projections, and data flow hierarchy',
                '_note': 'Operator tree shows actual execution path. High #items at early stages indicates inefficiency.',
                **flow
            }
            
        if selections.get('timeline_charts', False):
            timeline = self._build_timeline_charts(raw_data)
            payload['data']['timeline_charts'] = {
                '_description': 'Time-series data from Timeline Charts showing traffic spikes, latency trends, memory usage, and throughput over time',
                **timeline
            }
        
        # Apply obfuscation if requested (ONLY to SQL++ and index names)
        if options.get('obfuscated', False):
            obfuscator = DataObfuscator()
            
            # Recursively obfuscate SQL++ fields in any data structure
            def obfuscate_sql_fields(obj):
                """Recursively find and obfuscate SQL++ statements and identifiers"""
                if isinstance(obj, dict):
                    for key, value in obj.items():
                        # Skip metadata fields
                        if key.startswith('_'):
                            continue
                        
                        # Obfuscate SQL++ statement fields
                        if key in ['statement', 'normalized_statement', 'queryStatement', 
                                 'indexString', 'preparedText', 'normalizedStatement']:
                            if isinstance(value, str) and value:
                                obj[key] = obfuscator.obfuscate_query(value)
                        # Obfuscate identifier fields
                        elif key in ['name', 'indexName', 'indexKey', 'bucket_id', 'scope_id', 
                                   'keyspace_id', 'bucketName', 'scopeName', 'collectionName', 
                                   'bucketScopeCollection', 'bucket', 'scope',
                                   'clientContextID', 'requestId']:
                            if isinstance(value, str) and value and not value.startswith('_'):
                                obj[key] = obfuscator._generate_token(value)
                        # Obfuscate collection filter (handles compound paths like "bucket.scope.collection")
                        elif key == 'collection' and isinstance(value, str) and value:
                            # If it contains dots, it's a bucket.scope.collection path
                            if '.' in value:
                                parts = value.split('.')
                                obfuscated_parts = [obfuscator._generate_token(part) for part in parts]
                                obj[key] = '.'.join(obfuscated_parts)
                            elif value:  # Single identifier
                                obj[key] = obfuscator._generate_token(value)
                        # Obfuscate index 'id' field (handles FTS format like fts::default:bucket:index_name)
                        elif key == 'id' and isinstance(value, str) and value:
                            # Check for FTS index ID format: fts::default:bucket:index_name
                            if value.startswith('fts::'):
                                # Parse and obfuscate the components after fts::default:
                                parts = value.split(':')
                                if len(parts) >= 4:
                                    # Format: fts::default:bucket:index_name (or more segments)
                                    # Keep 'fts', '', 'default' and obfuscate the rest
                                    obfuscated_parts = parts[:3]  # ['fts', '', 'default']
                                    for part in parts[3:]:
                                        if part:
                                            obfuscated_parts.append(obfuscator._generate_token(part))
                                        else:
                                            obfuscated_parts.append(part)
                                    obj[key] = ':'.join(obfuscated_parts)
                                else:
                                    # Fallback: obfuscate the whole thing
                                    obj[key] = obfuscator._generate_token(value)
                            else:
                                # Regular index ID (hex string) - keep as-is since it's not sensitive
                                pass
                        # Obfuscate namedArgs (keys and values)
                        elif key == 'namedArgs' and isinstance(value, dict):
                            new_args = {}
                            for arg_key, arg_val in value.items():
                                new_arg_key = obfuscator._generate_token(arg_key)
                                new_arg_val = obfuscator.obfuscate_value(arg_val)
                                new_args[new_arg_key] = new_arg_val
                            obj[key] = new_args
                        # Obfuscate user_query_counts keys (usernames)
                        elif key == 'user_query_counts':
                            if isinstance(value, dict):
                                new_counts = {}
                                for user, count in value.items():
                                    new_user = obfuscator._generate_token(user)
                                    new_counts[new_user] = count
                                obj[key] = new_counts
                            elif isinstance(value, str):
                                # Handle string format: "user1: (count), user2: (count)"
                                import re
                                parts = value.split(", ")
                                new_parts = []
                                for part in parts:
                                    # Match "username: (count)" - find last colon
                                    match = re.match(r'^(.*):\s*\((\d+)\)$', part)
                                    if match:
                                        user = match.group(1)
                                        count = match.group(2)
                                        new_user = obfuscator._generate_token(user)
                                        new_parts.append(f"{new_user}: ({count})")
                                    else:
                                        new_parts.append(part)
                                obj[key] = ", ".join(new_parts)
                        # Obfuscate users field (comma-separated usernames)
                        elif key == 'users' and isinstance(value, str):
                             parts = value.split(", ")
                             new_parts = [obfuscator._generate_token(part) for part in parts if part]
                             obj[key] = ", ".join(new_parts)
                        # Obfuscate indexes_used array (index names are sensitive)
                        elif key == 'indexes_used' and isinstance(value, list):
                            for idx_item in value:
                                if isinstance(idx_item, dict) and 'name' in idx_item:
                                    idx_item['name'] = obfuscator._generate_token(idx_item['name'])
                        # Obfuscate index_counts display string (format: "idx_name (count)\nidx_name2 (count)")
                        elif key == 'index_counts' and isinstance(value, str):
                            import re
                            lines = value.split("\n")
                            new_lines = []
                            for line in lines:
                                # Match "index_name (count)" pattern
                                match = re.match(r'^(.+)\s+\((\d+)\)$', line)
                                if match:
                                    idx_name = match.group(1)
                                    count = match.group(2)
                                    new_idx_name = obfuscator._generate_token(idx_name)
                                    new_lines.append(f"{new_idx_name} ({count})")
                                else:
                                    new_lines.append(line)
                            obj[key] = "\n".join(new_lines)
                        # Obfuscate collection_queries chart dataset keys (bucket.scope.collection names)
                        elif key == 'datasets' and isinstance(value, dict):
                            # Check if any key looks like a bucket.scope.collection pattern
                            new_datasets = {}
                            for dataset_key, dataset_values in value.items():
                                # If key contains dots (e.g., "addresses._default._default"), it's a collection path
                                if '.' in dataset_key:
                                    # Obfuscate each part of the path
                                    parts = dataset_key.split('.')
                                    obfuscated_parts = [obfuscator._generate_token(part) for part in parts]
                                    new_key = '.'.join(obfuscated_parts)
                                    new_datasets[new_key] = dataset_values
                                else:
                                    # Keep non-collection keys as-is (e.g., "SELECT", "UPDATE")
                                    new_datasets[dataset_key] = dataset_values
                            obj[key] = new_datasets
                        # Recurse into nested structures
                        elif isinstance(value, (dict, list)):
                            obfuscate_sql_fields(value)
                elif isinstance(obj, list):
                    for item in obj:
                        obfuscate_sql_fields(item)
            
            # Apply obfuscation to all data sections
            obfuscate_sql_fields(payload['data'])
            
            # Obfuscate Mermaid diagram text separately
            if 'index_query_flow' in payload['data'] and 'mermaid_diagram' in payload['data']['index_query_flow']:
                mermaid = payload['data']['index_query_flow']['mermaid_diagram']
                payload['data']['index_query_flow']['mermaid_diagram'] = obfuscator.obfuscate_query(mermaid)
            
            # Get mapping table for de-obfuscation
            mapping_table = obfuscator.get_mapping_table()
            
            payload['metadata']['obfuscated'] = True
            payload['metadata']['obfuscation_note'] = (
                'IMPORTANT: Sensitive data has been obfuscated using 6-character deterministic tokens '
                '(e.g., "city" -> "x4k2m9"). The SAME name always produces the SAME token, so you CAN identify patterns.'
            )
            payload['metadata']['obfuscated_fields'] = {
                'sql_statements': ['statement', 'normalized_statement', 'queryStatement', 'indexString', 'preparedText', 'normalizedStatement'],
                'identifiers': ['name', 'indexName', 'indexKey', 'bucket_id', 'scope_id', 'keyspace_id', 'bucketName', 'scopeName', 'collectionName', 'bucketScopeCollection', 'bucket', 'scope'],
                'collection_paths': ['collection (in filters, handles bucket.scope.collection format)'],
                'index_data': ['indexes_used[].name', 'index_counts (display string)'],
                'user_data': ['users', 'user_query_counts', 'clientContextID', 'requestId'],
                'timeline_charts': ['datasets keys (collection names in collection_queries chart)'],
                'flow_diagram': ['mermaid_diagram (index and bucket names)'],
                'named_args': ['namedArgs (both keys and values)']
            }
            payload['metadata']['not_obfuscated'] = [
                'Metrics (counts, timings, sizes)',
                'Dashboard statistics',
                'Insight counts',
                'SQL keywords (SELECT, FROM, WHERE, etc.)',
                'Operators and punctuation',
                'Numeric values'
            ]
            payload['metadata']['mapping_table_size'] = len(mapping_table)
            
            # Store mapping table separately (returned to caller, not sent to AI)
            payload['_obfuscation_mapping'] = mapping_table
        
        ic(f"✅ Payload built from raw data, size={len(str(payload))} bytes")
        return payload
    
    def build_payload(self, 
                     session_id: str,
                     user_prompt: str,
                     selections: Dict[str, bool],
                     options: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Build complete AI payload from session cache
        
        Args:
            session_id: Session identifier
            user_prompt: User's analysis prompt
            selections: Which data sections to include (dashboard, insights, etc.)
            options: Options like obfuscation, storage, etc.
            
        Returns:
            Complete payload dict or None if session not found
        """
        ic(f"🔨 Building payload for session {session_id}")
        
        # Retrieve cached data
        cached_data = session_cache.get(session_id)
        if not cached_data:
            ic("❌ Session not found in cache")
            return None
        
        # Initialize payload
        payload = {
            'prompt': user_prompt,
            'data': {},
            'options': options,
            'metadata': {
                'timestamp': datetime.utcnow().isoformat() + 'Z',
                'session_id': session_id,
                'analyzer_version': cached_data.get('version', 'unknown')
            }
        }
        
        # Build data sections based on selections
        if selections.get('dashboard', False):
            payload['data']['dashboard_metrics'] = self._build_dashboard_metrics(cached_data)
        
        if selections.get('insights', False):
            payload['data']['insights'] = self._build_insights(cached_data)
        
        if selections.get('query_groups', False):
            limit = options.get('query_group_limit', 10)
            payload['data']['query_groups'] = self._build_query_groups(cached_data, limit=limit)
        
        if selections.get('indexes', False):
            payload['data']['indexes'] = self._build_indexes(cached_data)
        
        if selections.get('flow_diagram', False):
            payload['data']['index_query_flow'] = self._build_flow_diagram(cached_data)
            
        if selections.get('timeline_charts', False):
            payload['data']['timeline_charts'] = self._build_timeline_charts(cached_data)
        
        # Apply obfuscation if requested
        if options.get('obfuscated', False):
            obfuscator = DataObfuscator()
            payload['data'] = obfuscator.obfuscate_dict(payload['data'])
            payload['metadata']['obfuscated'] = True
        
        ic(f"✅ Payload built, size={len(str(payload))} bytes")
        return payload
    
    def _build_dashboard_metrics(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract dashboard metrics - aggregated stats from charts"""
        dashboard_stats = data.get('dashboardStats', {})
        
        if not dashboard_stats or not dashboard_stats.get('charts'):
            return {
                'total_queries': data.get('dashboardStats', {}).get('total_queries', 0),
                'note': 'Dashboard charts not available - user may not have opened Dashboard tab'
            }
        
        return dashboard_stats
    
    def _build_insights(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract insights data from frontend"""
        insights = data.get('insightsData', {})
        
        if not insights or not insights.get('items'):
            return {'note': 'No insights data available - insights tab may not be loaded'}
        
        # Return all items with their counts and samples
        return {
            'total_insights': len(insights.get('items', [])),
            'insights': insights.get('items', [])
        }
    
    def _build_query_groups(self, data: Dict[str, Any], limit: int = 10) -> Dict[str, Any]:
        """Extract query groups (normalized patterns) from analysisData"""
        analysis = data.get('analysisData', [])
        
        if not analysis:
            return {'note': 'No query group data available'}
        
        # Sample top patterns based on limit
        sample_patterns = []
        
        # Sort by total time (impact) before sampling
        try:
            sorted_analysis = sorted(analysis, key=lambda x: x.get('totalDuration', 0), reverse=True)
        except:
            sorted_analysis = analysis
            
        # Take top N based on limit
        top_patterns = sorted_analysis[:limit] if len(sorted_analysis) > limit else sorted_analysis
        
        # Truncate long query strings in the patterns
        for pattern in top_patterns:
            # Create a copy to avoid modifying original data
            pattern_copy = pattern.copy()
            if 'statement' in pattern_copy and isinstance(pattern_copy['statement'], str):
                if len(pattern_copy['statement']) > 200:
                    pattern_copy['statement'] = pattern_copy['statement'][:200] + '... (truncated)'
            sample_patterns.append(pattern_copy)
        
        return {
            'total_patterns': len(analysis),
            'sample_size': len(sample_patterns),
            'patterns': sample_patterns,
            'note': f'Showing top {len(sample_patterns)} of {len(analysis)} query patterns by duration. Statements truncated to 200 chars.'
        }
    
    def _build_indexes(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract index data from system:indexes upload"""
        index_data = data.get('indexData', [])
        
        if not index_data or len(index_data) == 0:
            return {'note': 'No index data available - user did not upload system:indexes JSON'}
        
        return {
            'total_indexes': len(index_data),
            'indexes': index_data,
            'note': f'Index catalog with {len(index_data)} indexes from system:indexes query'
        }
    
    def _build_flow_diagram(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract flow diagram data with Mermaid visualization"""
        flow_data = data.get('flowDiagramData', {})
        
        if not flow_data or not flow_data.get('mermaid_diagram'):
            return {'note': 'No flow diagram data available - Index/Query Flow tab may not be populated'}
        
        mermaid_diagram = flow_data.get('mermaid_diagram', '')
        
        # Truncate diagram if too large (approx 2000 chars)
        if len(mermaid_diagram) > 2000:
            mermaid_diagram = mermaid_diagram[:2000] + '\n... (diagram truncated for size)'
            
        return {
            'mermaid_diagram': mermaid_diagram,
            'statistics': {
                'total_indexes': flow_data.get('indexes_count', 0),
                'total_queries': flow_data.get('queries_count', 0),
                'total_connections': flow_data.get('connections_count', 0)
            },
            'note': 'Mermaid graph showing which indexes are used by which queries'
        }
        
    def _build_timeline_charts(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract timeline charts data"""
        timeline_data = data.get('timelineChartsData', {})
        
        if not timeline_data:
            return {'note': 'No timeline chart data available - charts may not be loaded'}
            
        # Filter out charts with no data
        valid_charts = {}
        for chart_id, chart_info in timeline_data.items():
            # New format check: has 'datasets' directly or in 'data'
            if chart_id == 'common_timeline':
                valid_charts[chart_id] = chart_info
                continue
                
            has_data = False
            if chart_info.get('datasets') and len(chart_info['datasets']) > 0:
                has_data = True
            elif chart_info.get('data') and chart_info['data'].get('datasets') and len(chart_info['data']['datasets']) > 0:
                has_data = True
            # Fallback for older structure (array of objects)
            elif chart_info.get('data') and isinstance(chart_info['data'], list) and len(chart_info['data']) > 0:
                has_data = True
                
            if has_data:
                valid_charts[chart_id] = chart_info
        
        return {
            'total_charts': len(valid_charts),
            'charts': valid_charts,
            'note': 'Sampled time-series data from interactive charts'
        }

# Global payload builder instance
payload_builder = AIPayloadBuilder()

# ============================================================================
# AI System Prompts
# ============================================================================

def get_ai_system_prompt(language: str = None) -> str:
    """
    Get the system prompt that instructs AI how to analyze and format responses
    with sources, priorities, and HTML formatting
    """
    prompt = """You are a Couchbase N1QL query performance expert. Analyze the provided query data and provide actionable recommendations. Analyze ALL provided query groups and insights. Do NOT arbitrarily limit the number of critical issues or recommendations (e.g. do not stop at 5). Return ALL valid findings derived from the insights and query groups.

**PRIORITY LEVELS (1-10):**
- 10 (CRITICAL): Causes timeouts, data loss, or cluster instability
- 8-9 (HIGH): Major performance degradation (>5s queries, memory issues)
- 5-7 (MEDIUM): Noticeable impact (1-5s queries, inefficient patterns)
- 3-4 (LOW): Minor optimizations, best practices
- 1-2 (OPTIONAL): Nice-to-have improvements

**COLOR CODING FOR HTML (Use Sparingly - Only 1-2 highlights per issue):**
- <span class="severity-critical">text</span> - RED: ONLY for most critical metric (e.g., "2266ms", "1.5M items scanned")
- <span class="severity-high">text</span> - ORANGE (#fd7e14): Important numbers (e.g., "64 queries", "46GB")
- <span class="metric-highlight">text</span> - BLUE LIGHT: General metrics (e.g., "2.3% selectivity", "15k scans")
- <span class="code-highlight">text</span> - BLUE: Index names, table names only (e.g., "idx_users", "products")
- <span class="highlight-good">text</span> - GREEN: Positive outcomes (avoid using)

**HIGHLIGHTING RULES:**
- Maximum 2 highlights per description
- RED only for the MOST critical number
- Use plain text for most content
- Code blocks don't need highlights

**CHART ANALYSIS & REPORTING GUIDELINES:**
1. **Structure & Readability:**
   - Start `overview_html` with a **1-paragraph executive summary** highlighting top 2-3 issues with timestamps.
   - Use short sentences (active voice) and simple language. Explain jargon.
   - **Bold key terms/metrics** (e.g., **26GB memory surge**) and use emojis sparingly (e.g., 📈).
   - Quantify everything with exact values, percentages, and timestamps.

2. **Reference Charts Explicitly:**
   - Always tie insights to specific charts (e.g., "In the **Request Count** chart...").
   - Describe trends visually (e.g., "The blue line shoots up 300%...").
   - Highlight correlations: "Rise in **Result Size** at 12:00 precedes **Latency** spike at 13:00".

3. **Track Causations:**
   - Identify leading indicators (e.g., "High index scans caused latency spike").
   - Flag patterns (e.g., "Concurrent queries cause 44% conflicts").
   - Use tables for timelines of events across multiple charts.

4. **Visuals (Chart.js):**
   - If raw data points are available, generate 1-2 synthesized charts in the `charts` array.
   - Focus on correlations (e.g., overlaying Requests vs Memory).
   - Do NOT hallucinate data points.

**RESPONSE FORMAT REQUIREMENTS:**
You MUST return your analysis as a valid JSON object with this exact structure.
IMPORTANT: Do NOT limit lists to top 5. If you find 15 issues, return 15 issues.
If the user provided a specific request or question in their prompt, you MUST answer it in the 'overview_html' field under a '<h3>User Specific Request</h3>' section. If the user prompt is generic (e.g. 'Analyze query performance'), do NOT include this section.

```json
{
  "analysis_summary": {
    "overview_html": "Structured summary using HTML elements to organize findings.<br><br><b>Suggested Structure:</b><br><h3>Overall Health</h3><p>Summary of system health...</p><h3>Key Bottlenecks</h3><ul><li>Point 1</li><li>Point 2</li></ul><h3>Main Findings</h3><p>Details...</p><h3>User Specific Request</h3><p>Answer to specific user questions/requests (ONLY if applicable, otherwise omit)</p><br>Use tags like <span class='severity-critical'>highlights</span> for critical metrics."
  },
  "chart_trends": {
    "insights": [
      {
        "start": "YYYY-MM-DDTHH:MM:SS (ISO 8601 format - REQUIRED)",
        "end": "YYYY-MM-DDTHH:MM:SS (ISO 8601 format - use start + reasonable duration if point event)",
        "group": "<Request Count|Memory Usage|Duration|CPU Time|Index Scan|Fetch Throughput> (chart source category)",
        "severity": "<critical|warning|info>",
        "title": "Short title for timeline display (max 50 chars)",
        "content": "Full detailed description of the insight. Include specific metrics, correlations, and impact."
      }
    ],
    "sources": [
      {
        "location": "timeline_charts",
        "evidence": "Exact Chart Title provided in the data",
        "value": "Metric observed"
      }
    ]
  },
  "summary": {
    "total_queries_analyzed": <number>,
    "critical_issues_found": <number>,
    "performance_rating": "<excellent|good|fair|poor>",
    "estimated_improvement_potential": "<percentage>"
  },
  "critical_issues": [
    {
      "priority": <number 1-10>,
      "severity": "<critical|high|medium|low>",
      "category": "<index|query|configuration>",
      "title": "Issue Title (e.g. 'Missing Index FOR travel-sample.inventory.hotel')",
      "description_html": "<b>Current Situation</b>: <span class='code-highlight'>details</span><br><b>Suggested Fix</b>: <span class='code-highlight'>details</span><br>Reasoning...",
      "affected_queries": <number>,
      "recommendation": "Specific action to take",
      "expected_impact": "Expected performance improvement",
      "sources": [
        {
          "location": "<dashboard|insights|query_groups|indexes|flow_diagram>",
          "evidence": "Specific data point that led to this finding",
          "value": "Actual metric or pattern observed"
        }
      ]
    }
  ],
  "recommendations": [
    {
      "priority_number": <number 1-10>,
      "priority": "<high|medium|low>",
      "category": "<index|query|configuration>",
      "recommendation_html": "<Action> Index(es) FOR <Bucket.Scope.Collection> (e.g. 'Create Index FOR travel-sample.inventory.hotel'). MUST append '_v1', '_v2', etc. to new index names.",
      "rationale_html": "<b>Current Index</b> (if exists):<br><div class='index-statement'>def</div><br><b>Suggested Index</b>:<br><div class='index-statement'>CREATE INDEX idx_name_v1 ON ... <button class='btn-standard copy-btn' onclick='navigator.clipboard.writeText(\"CREATE INDEX idx_name_v1 ...\")'>Copy</button></div><br>Reasoning: ...",
      "implementation_steps": ["Step 1", "Step 2", "..."],
      "estimated_impact": "Expected benefit",
      "sources": [
        {
          "location": "<dashboard|insights|query_groups|indexes|flow_diagram>",
          "evidence": "Data supporting this recommendation"
        }
      ]
    }
  ],
  "index_analysis": {
    "missing_indexes": [
      {
        "suggested_index": "CREATE INDEX ... ON ...",
        "reason": "Why this index is needed",
        "queries_affected": <number>,
        "estimated_improvement": "<percentage or time>"
      }
    ],
    "unused_indexes": ["index1", "index2"],
    "primary_index_warnings": ["Warning about primary index usage"]
  },
  "query_patterns": {
    "slow_queries": [
      {
        "pattern": "Normalized query pattern",
        "count": <number>,
        "avg_duration": "<time>",
        "issue": "Why it's slow",
        "optimization": "How to fix it"
      }
    ],
    "inefficient_patterns": ["Pattern description 1", "Pattern description 2"]
  },
  "next_steps": [
    "Immediate action 1",
    "Immediate action 2",
    "Long-term improvement 1"
  ],
  "charts": [
    {
      "id": "A",
      "type": "bar",
      "title": "Query Count by Collection",
      "data": {
        "labels": ["orders", "customers", "products"],
        "datasets": [
          {
            "label": "Count",
            "data": [18, 9, 9],
            "backgroundColor": "#36a2eb"
          }
        ]
      },
      "description": "Visual breakdown of query volume per collection."
    }
  ]
}
```

**IMPORTANT**: 
- Your ENTIRE response must be valid JSON (no markdown, no explanations outside JSON)
- Use the exact field names shown above
- Include ALL sections even if empty (use [] or {} for empty sections)
- Be specific and actionable in recommendations
- Focus on performance improvements and best practices
- **CRITICAL**: Chart Trends insights MUST use ISO 8601 format (YYYY-MM-DDTHH:MM:SS) for start/end times. Group by chart category (Request Count, Memory Usage, Duration, CPU Time, Index Scan, Fetch Throughput). Keep titles short (max 50 chars) - full details go in content field.
- **CRITICAL**: All suggested index names MUST end with '_v1', '_v2', etc. (e.g. 'idx_users_v1').
- **CRITICAL**: EXCEPTION: Primary indexes MUST NOT be versioned.
- **CRITICAL**: Use ALTER INDEX with strict JSON syntax for replica changes: WITH {"action":"replica_count", "num_replica": 1}.
- **CRITICAL**: If the user asks for charts or if a chart would help explain a point, include the "charts" array with valid Chart.js data structures. Use simple 'bar', 'pie', or 'line' types. Do not hallucinate data; use the provided metrics.
- **CRITICAL**: When suggesting indexes, refer to the `couchbase_index_creation` array in the payload context for proper syntax. Use GSI for standard queries, GSI_array (DISTINCT ARRAY) for array fields, FTS/Search for SEARCH() queries and leading-wildcard LIKE, and Vector for embeddings. Always include the docs_url in your recommendation for user reference.
- **CRITICAL FTS vs GSI**: GSI indexes use SQL++ CREATE INDEX syntax. FTS (Full Text Search) indexes are JSON definitions created via REST API or Couchbase UI - NOT CREATE INDEX. When query uses WHERE SEARCH(...), recommend FTS index with JSON example. To hint an FTS index in a query, use the "index" parameter in SEARCH(): SEARCH(bucket, {"query":..., "index":"fts_index_name"}).
- **CRITICAL INDEX SYNTAX RULES** (from `index_gen_rules` in context):
  1. **ALWAYS use explicit field names** extracted from query patterns - NEVER use placeholders like "ALL equality predicates" or "LIKE fields"
  2. **NO COVERING KEYWORD EXISTS** in Couchbase N1QL CREATE INDEX - to make a "covering index", include all needed fields IN the index key list itself
  3. **Parse query patterns**: Extract field names from WHERE (equality: field = ?, range: field > ?), LIKE, ORDER BY, and SELECT clauses
  4. **PARTIAL INDEX RULE**: When query has `WHERE type = "constant"` (or docType/tclass), put that in INDEX WHERE clause, NOT in key list. Smaller, faster index.
  5. **Valid syntax**: `CREATE INDEX idx_v1 ON bucket(field1, field2) WHERE type = "order"` -- type in WHERE, other fields in keys
  6. **INVALID - DO NOT USE**: `COVERING(...)` keyword does not exist in N1QL
  7. **INVALID - DO NOT USE**: `INCLUDE(...)` clause is ONLY for CREATE VECTOR INDEX (Couchbase 8.x). Regular GSI does NOT support INCLUDE - add fields to index keys instead.
  8. For obfuscated data: use the obfuscated token names directly (e.g., `x4k2m9`, `j7p3q1`) - they are consistent identifiers"""

    if language and language.lower() != 'english':
        prompt += f"\n\n**CRITICAL OUTPUT LANGUAGE REQUIREMENT**:\nYou MUST provide your analysis, explanations, and recommendations in {language}. The JSON keys must remain in English, but all string values (overview_html, descriptions, titles, etc.) must be in {language}."
    
    return prompt

# ============================================================================
# Helper Functions
# ============================================================================

def generate_session_id() -> str:
    """Generate unique session ID"""
    return secrets.token_urlsafe(16)

def cache_analyzer_data(data: Dict[str, Any]) -> str:
    """
    Cache analyzer data and return session ID
    
    Args:
        data: Complete analyzer data from frontend
        
    Returns:
        session_id for retrieving cached data
    """
    session_id = generate_session_id()
    session_cache.set(session_id, data)
    return session_id

def get_cached_data(session_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve cached data by session ID"""
    return session_cache.get(session_id)

def build_ai_payload(session_id: str, 
                     prompt: str,
                     selections: Dict[str, bool],
                     options: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Build AI payload from cached session
    
    Args:
        session_id: Session identifier
        prompt: User's analysis prompt
        selections: Data sections to include
        options: Analysis options
        
    Returns:
        Complete AI payload or None
    """
    return payload_builder.build_payload(session_id, prompt, selections, options)

def get_cache_stats() -> Dict[str, Any]:
    """Get cache statistics"""
    return session_cache.stats()

# ============================================================================
# Example Usage (for testing)
# ============================================================================

if __name__ == "__main__":
    ic("🧪 Testing AI Analyzer Module")
    
    # Test session cache
    test_data = {
        'everyQueryData': [{'id': 1}, {'id': 2}],
        'version': '4.0.0-dev'
    }
    
    session_id = cache_analyzer_data(test_data)
    ic(f"Created session: {session_id}")
    
    retrieved = get_cached_data(session_id)
    ic(f"Retrieved data: {retrieved}")
    
    # Test payload building
    payload = build_ai_payload(
        session_id=session_id,
        prompt="Analyze slow queries",
        selections={'dashboard': True, 'insights': True},
        options={'obfuscated': True}
    )
    ic(f"Built payload: {payload}")
    
    # Test stats
    stats = get_cache_stats()
    ic(f"Cache stats: {stats}")
    
    # Test obfuscator
    obfuscator = DataObfuscator()
    test_query = 'SELECT fName, lName FROM bucket.scope.collection WHERE customerId = "1234"'
    obfuscated_query = obfuscator.obfuscate_query(test_query)
    ic(f"Original: {test_query}")
    ic(f"Obfuscated: {obfuscated_query}")

# ============================================================================
# Model Token Limits Configuration
# ============================================================================

def get_max_output_tokens(provider: str, model: str) -> int:
    """
    Get the maximum output tokens for a given provider and model.
    
    Args:
        provider: AI provider name ('openai', 'anthropic', 'claude', 'grok')
        model: Model ID string
        
    Returns:
        Maximum output tokens allowed for the model
    """
    # OpenAI models
    OPENAI_LIMITS = {
        # GPT-5.x series
        'gpt-5.1': 32768,
        'gpt-5': 32768,
        'gpt-5-mini': 16384,
        'gpt-5-nano': 16384,
        'gpt-5-pro': 32768,
        # GPT-4.x series
        'gpt-4.1': 32768,
        'gpt-4.1-mini': 16384,
        'gpt-4.1-nano': 16384,
        'gpt-4o': 16384,
        'gpt-4o-mini': 16384,
        'gpt-4-turbo': 4096,
        'gpt-4': 8192,
        # O-series (reasoning models - higher output)
        'o4-mini': 65536,
        'o3': 100000,
        'o3-mini': 65536,
        'o1': 32768,
        'o1-pro': 32768,
        'o1-mini': 16384,
        # Legacy
        'gpt-3.5-turbo': 4096,
    }
    
    # Anthropic Claude models
    CLAUDE_LIMITS = {
        # Claude 4.x series
        'claude-opus-4-20250514': 8192,
        'claude-sonnet-4-20250514': 8192,
        # Claude 3.5 series
        'claude-3-5-sonnet-20241022': 8192,
        'claude-3-5-haiku-20241022': 8192,
        # Claude 3 series
        'claude-3-opus-20240229': 4096,
        'claude-3-sonnet-20240229': 4096,
        'claude-3-haiku-20240307': 4096,
    }
    
    # xAI Grok models
    GROK_LIMITS = {
        # Grok 4.x series (high capacity)
        'grok-4-1-fast-reasoning': 131072,
        'grok-4-1-fast-non-reasoning': 131072,
        'grok-4-fast-reasoning': 131072,
        'grok-4-fast-non-reasoning': 131072,
        'grok-4-0709': 32768,
        # Grok 3 series
        'grok-3': 32768,
        'grok-3-mini': 16384,
        # Grok Code
        'grok-code-fast-1': 32768,
        # Legacy
        'grok-2-latest': 8192,
        'grok-2-vision-latest': 8192,
    }
    
    # Select the right limits based on provider
    if provider == 'openai':
        limits = OPENAI_LIMITS
        default = 16384
    elif provider in ('anthropic', 'claude'):
        limits = CLAUDE_LIMITS
        default = 8192
    elif provider == 'grok':
        limits = GROK_LIMITS
        default = 32768
    else:
        return 8192  # Safe default for unknown providers
    
    # Look up the model, try partial match if exact not found
    if model in limits:
        return limits[model]
    
    # Try partial matching (e.g., "gpt-4o-2024-08-06" should match "gpt-4o")
    for model_prefix, tokens in limits.items():
        if model.startswith(model_prefix):
            return tokens
    
    ic(f"⚠️ Unknown model '{model}' for {provider}, using default {default}")
    return default


# ============================================================================
# AI Provider API Call
# ============================================================================

def call_ai_provider(provider: str, 
                     model: str, 
                     api_key: str, 
                     api_url: str, 
                     endpoint: str, 
                     prompt: str, 
                     payload_data: Dict[str, Any],
                     language: str = None) -> Dict[str, Any]:
    """
    Call AI provider with formatted request
    
    Args:
        provider: AI provider name ('openai', 'anthropic', 'grok')
        model: Model name/ID
        api_key: API authentication key
        api_url: Base API URL
        endpoint: API endpoint path
        prompt: User's analysis prompt
        payload_data: Data payload to send to AI
        language: Output language
        
    Returns:
        API response dict with success status, data/error, and timing
    """
    import json
    
    ic(f"🤖 Calling AI provider: {provider}, model: {model}, language: {language}")
    
    # Get dynamic max_tokens based on model
    max_tokens = get_max_output_tokens(provider, model)
    ic(f"📊 Max output tokens for {model}: {max_tokens}")
    
    # Get system prompt
    system_prompt = get_ai_system_prompt(language)
    
    # ---------------------------------------------------------
    # Option 1: Use OpenAI SDK (Preferred for OpenAI/Grok)
    # ---------------------------------------------------------
    if (provider == 'openai' or provider == 'grok') and OPENAI_SDK_AVAILABLE:
        try:
            ic(f"🚀 Using OpenAI SDK for {provider}")
            start_time = time.time()
            
            # Clean base_url for SDK (it expects base, not chat/completions)
            # If user provided full endpoint in config, strip it
            base_url = api_url.rstrip('/')
            if base_url.endswith('/chat/completions'):
                base_url = base_url.replace('/chat/completions', '')
            elif base_url.endswith('/v1'):
                pass # Keep /v1
            
            # Use httpx.Timeout for granular control:
            # - connect: time to establish connection
            # - read: time to receive response chunks  
            # - write: time to send request
            # - pool: time to acquire connection from pool
            import httpx
            client = OpenAI(
                api_key=api_key,
                base_url=base_url,
                timeout=httpx.Timeout(300.0, connect=30.0),  # 5 min total, 30s connect
                max_retries=2
            )
            
            params = {
                "model": model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"{prompt}\n\nQuery Data:\n{json.dumps(payload_data['data'], indent=2)}"}
                ],
                "temperature": 0.5,
                "max_completion_tokens": max_tokens
            }
            
            if provider == 'openai':
                params["response_format"] = {"type": "json_object"}
                
            response = client.chat.completions.create(**params)
            
            elapsed_ms = int((time.time() - start_time) * 1000)
            
            # Convert Pydantic model to dict
            response_data = json.loads(response.model_dump_json())
            
            ic(f"✅ {provider.upper()} SDK Success ({elapsed_ms}ms)")
            
            return {
                'success': True,
                'status_code': 200,
                'data': response_data,
                'elapsed_ms': elapsed_ms,
                'attempts': 1
            }
            
        except Exception as e:
            elapsed_ms = int((time.time() - start_time) * 1000) if 'start_time' in locals() else 0
            ic(f"❌ {provider.upper()} SDK Error: {str(e)}")
            # Don't fall back to HTTP if SDK fails (likely auth or logic error), return error
            return {
                'success': False,
                'error': f"{provider.upper()} SDK Error: {str(e)}",
                'elapsed_ms': elapsed_ms,
                'attempts': 1
            }

    # ---------------------------------------------------------
    # Option 2: Manual HTTP Request (Fallback / Anthropic / Others)
    # ---------------------------------------------------------
    
    # Format request payload for specific provider
    if provider == 'openai' or provider == 'grok':
        ai_request_payload = {
            'model': model,
            'messages': [
                {
                    'role': 'system',
                    'content': system_prompt
                },
                {
                    'role': 'user',
                    'content': f"{prompt}\n\nQuery Data:\n{json.dumps(payload_data['data'], indent=2)}"
                }
            ]
        }
        
        # OpenAI uses max_completion_tokens, Grok uses max_tokens
        if provider == 'openai':
            ai_request_payload['max_completion_tokens'] = max_tokens
            ai_request_payload['response_format'] = {'type': 'json_object'}
        else:
            ai_request_payload['max_tokens'] = max_tokens
        
        headers = {
            'Authorization': f'Bearer {api_key}'
        }
        
    elif provider == 'anthropic' or provider == 'claude':
        ai_request_payload = {
            'model': model,
            'max_tokens': max_tokens,
            'temperature': 1,
            'messages': [
                {
                    'role': 'user',
                    'content': f"{system_prompt}\n\n{prompt}\n\nQuery Data:\n{json.dumps(payload_data['data'], indent=2)}"
                }
            ]
        }
        
        headers = {
            'x-api-key': api_key,
            'anthropic-version': '2023-06-01'
        }
        
    else:
        # Generic format for unknown providers
        ai_request_payload = {
            'model': model,
            'prompt': f"{system_prompt}\n\n{prompt}\n\nQuery Data:\n{json.dumps(payload_data['data'], indent=2)}"
        }
        
        headers = {
            'Authorization': f'Bearer {api_key}'
        }
    
    # Build full URL
    full_url = api_url.rstrip('/') + '/' + endpoint.lstrip('/')
    
    return _execute_ai_request(full_url, headers, ai_request_payload)


def _execute_ai_request(full_url: str, headers: dict, ai_request_payload: dict) -> dict:
    """Execute the AI API request and return result."""
    http_client = AIHttpClient()
    
    ic(f"📤 Full URL: {full_url}")
    
    # Make API call using AIHttpClient
    result = http_client.call_api(
        method='POST',
        url=full_url,
        headers=headers,
        json_data=ai_request_payload
    )
    
    ic(f"📥 Response received: success={result.get('success')}, elapsed={result.get('elapsed_ms')}ms")
    
    return result


def call_custom_ai_provider(
    custom_config: dict,
    prompt: str,
    payload_data: dict,
    system_prompt: str = None,
    language: str = 'en'
) -> dict:
    """
    Call a custom AI provider with user-defined configuration.
    
    Args:
        custom_config: Dict containing:
            - url: API endpoint URL
            - model: Model name
            - authType: 'none', 'bearer', 'api-key-header', 'basic'
            - bearerToken: Token for bearer auth
            - apiKeyHeaderName: Header name for API key auth
            - apiKeyHeaderValue: Header value for API key auth  
            - basicUsername/basicPassword: For basic auth
            - customHeaders: List of {name, value} dicts
            - requestTemplate: JSON template with {{PAYLOAD}} and {{MODEL}} placeholders
            - responsePath: JSON path to extract response text
        prompt: The analysis prompt
        payload_data: Data to send for analysis
        system_prompt: Optional system prompt
        language: Language code
        
    Returns:
        API response dict with success/data/error
    """
    ic("🔧 Calling custom AI provider")
    ic(f"📤 Custom API Name: {custom_config.get('name')}")
    ic(f"📤 Custom API URL: {custom_config.get('url')}")
    
    url = custom_config.get('url', '')
    model = custom_config.get('model', 'default')
    auth_type = custom_config.get('authType', 'none')
    request_template = custom_config.get('requestTemplate', '')
    
    if not url:
        return {
            'success': False,
            'error': 'Custom API URL is required'
        }
    
    # Build headers
    headers = {
        'Content-Type': 'application/json'
    }
    
    # Add auth headers
    if auth_type == 'bearer':
        token = custom_config.get('bearerToken', '')
        if token:
            headers['Authorization'] = f'Bearer {token}'
    elif auth_type == 'api-key-header':
        header_name = custom_config.get('apiKeyHeaderName', 'X-API-Key')
        header_value = custom_config.get('apiKeyHeaderValue', '')
        if header_value:
            headers[header_name] = header_value
    elif auth_type == 'basic':
        import base64
        username = custom_config.get('basicUsername', '')
        password = custom_config.get('basicPassword', '')
        if username and password:
            credentials = base64.b64encode(f"{username}:{password}".encode()).decode()
            headers['Authorization'] = f'Basic {credentials}'
    # Note: digest auth is handled separately below using requests.auth.HTTPDigestAuth
    
    # Store digest credentials for later use
    digest_auth = None
    if auth_type == 'digest':
        username = custom_config.get('digestUsername', '')
        password = custom_config.get('digestPassword', '')
        if username and password:
            digest_auth = (username, password)
            ic(f"🔐 Digest auth configured for user: {username}")
    
    # Add custom headers
    custom_headers = custom_config.get('customHeaders', [])
    for header in custom_headers:
        if header.get('name') and header.get('value'):
            headers[header['name']] = header['value']
    
    # Build request payload
    if request_template:
        # Use the user-defined template
        full_prompt = f"{system_prompt or ''}\n\n{prompt}\n\nQuery Data:\n{json.dumps(payload_data.get('data', {}), indent=2)}"
        
        request_body_str = request_template.replace('{{MODEL}}', model)
        request_body_str = request_body_str.replace('{{PAYLOAD}}', full_prompt)
        
        try:
            ai_request_payload = json.loads(request_body_str)
        except json.JSONDecodeError as e:
            return {
                'success': False,
                'error': f'Invalid request template JSON: {str(e)}'
            }
    else:
        # Default OpenAI-compatible format
        ai_request_payload = {
            'model': model,
            'messages': [
                {
                    'role': 'system',
                    'content': system_prompt or 'You are a helpful assistant.'
                },
                {
                    'role': 'user',
                    'content': f"{prompt}\n\nQuery Data:\n{json.dumps(payload_data.get('data', {}), indent=2)}"
                }
            ],
            'max_tokens': 4096
        }
    
    ic(f"📤 Request payload keys: {list(ai_request_payload.keys())}")
    
    # Execute the request
    if digest_auth:
        # Use digest auth - need to make request directly with requests library
        result = _execute_ai_request_with_digest(url, headers, ai_request_payload, digest_auth)
    else:
        result = _execute_ai_request(url, headers, ai_request_payload)
    
    # If successful, add the response path for frontend processing
    if result.get('success') and result.get('data'):
        result['responsePath'] = custom_config.get('responsePath', 'choices[0].message.content')
        result['isCustomProvider'] = True
    
    return result


def _execute_ai_request_with_digest(full_url: str, headers: dict, ai_request_payload: dict, digest_auth: tuple) -> dict:
    """Execute AI API request with Digest authentication."""
    import requests
    from requests.auth import HTTPDigestAuth
    
    ic(f"📤 Full URL (Digest Auth): {full_url}")
    
    start_time = time.time()
    
    try:
        response = requests.post(
            full_url,
            headers=headers,
            json=ai_request_payload,
            auth=HTTPDigestAuth(digest_auth[0], digest_auth[1]),
            timeout=300  # 5 minute timeout for AI requests
        )
        
        elapsed_ms = int((time.time() - start_time) * 1000)
        
        ic(f"📥 Response Status (Digest): {response.status_code}, {elapsed_ms}ms")
        
        if 200 <= response.status_code < 300:
            try:
                response_data = response.json()
                ic("✅ Success (Digest Auth)")
                
                return {
                    'success': True,
                    'status_code': response.status_code,
                    'data': response_data,
                    'elapsed_ms': elapsed_ms,
                    'attempts': 1
                }
            except ValueError:
                return {
                    'success': True,
                    'status_code': response.status_code,
                    'data': response.text,
                    'elapsed_ms': elapsed_ms,
                    'attempts': 1
                }
        else:
            ic(f"❌ Request failed (Digest): {response.status_code}")
            return {
                'success': False,
                'status_code': response.status_code,
                'error': f"HTTP {response.status_code}: {response.text[:200]}",
                'elapsed_ms': elapsed_ms
            }
            
    except requests.exceptions.Timeout:
        elapsed_ms = int((time.time() - start_time) * 1000)
        return {
            'success': False,
            'error': 'Request timeout (5 minutes)',
            'elapsed_ms': elapsed_ms
        }
    except Exception as e:
        elapsed_ms = int((time.time() - start_time) * 1000)
        ic(f"💥 Exception (Digest Auth): {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'elapsed_ms': elapsed_ms
        }
