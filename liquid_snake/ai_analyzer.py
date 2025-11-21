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
# AI HTTP Client
# ============================================================================

class AIHttpClient:
    """
    Robust HTTP client with retry logic, timeout handling, and detailed logging
    """
    
    def __init__(self, 
                 max_retries=3, 
                 backoff_factor=0.5, 
                 timeout=30,
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
            result = result.replace(token, original)
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
                elif part.startswith('$') or part.startswith('?'):
                    obfuscated_parts.append(part)
                # Obfuscate quoted strings
                elif part.startswith('"') or part.startswith("'") or part.startswith('`'):
                    quote_char = part[0]
                    inner = part.strip('"\'`')
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
                                options: Dict[str, Any]) -> Dict[str, Any]:
        """
        Build AI payload directly from raw data (no session cache)
        
        Args:
            raw_data: Raw analyzer data from frontend
            user_prompt: User's analysis prompt
            selections: Which data sections to include
            options: Options like obfuscation
            
        Returns:
            Complete payload dict
        """
        ic(f"🔨 Building payload from raw data")
        
        # Initialize payload with context
        payload = {
            'prompt': user_prompt,
            'context': {
                'tool': 'Couchbase Query Analyzer',
                'purpose': 'This tool analyzes N1QL query performance from system:completed_requests',
                'data_source': 'Queries extracted from: SELECT *, meta().plan FROM system:completed_requests',
                'tabs_explained': {
                    'Dashboard': 'High-level metrics and charts showing query distribution, index usage, and performance patterns',
                    'Insights': 'Automated detection of performance issues, missing indexes, and inefficient query patterns',
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
                    'High resultCount with LIMIT suggests index overfetch'
                ]
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
                                   'bucketScopeCollection', 'bucket', 'scope', 'collection']:
                            if isinstance(value, str) and value and not value.startswith('_'):
                                obj[key] = obfuscator._generate_token(value)
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
                'IMPORTANT: Only SQL++ statements, index names, bucket/collection names have been obfuscated. '
                'Metrics, counts, and timings are REAL values. '
                'Obfuscated identifiers use 6-character deterministic tokens (e.g., "city" -> "x4k2m9"). '
                'The SAME name always produces the SAME token, so you CAN identify patterns. '
                'Dashboard metrics and insight counts are NOT obfuscated.'
            )
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

# Global payload builder instance
payload_builder = AIPayloadBuilder()

# ============================================================================
# AI System Prompts
# ============================================================================

def get_ai_system_prompt() -> str:
    """
    Get the system prompt that instructs AI how to analyze and format responses
    with sources, priorities, and HTML formatting
    """
    return """You are a Couchbase N1QL query performance expert. Analyze the provided query data and provide actionable recommendations. Analyze ALL provided query groups and insights. Do NOT arbitrarily limit the number of critical issues or recommendations (e.g. do not stop at 5). Return ALL valid findings derived from the insights and query groups.

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

**RESPONSE FORMAT REQUIREMENTS:**
You MUST return your analysis as a valid JSON object with this exact structure.
IMPORTANT: Do NOT limit lists to top 5. If you find 15 issues, return 15 issues.

```json
{
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
      "recommendation_html": "<Action> Index(es) FOR <Bucket.Scope.Collection> (e.g. 'Create Index FOR travel-sample.inventory.hotel')",
      "rationale_html": "<b>Current Index</b> (if exists):<br><div class='index-statement'>def</div><br><b>Suggested Index</b>:<br><div class='index-statement'>def <button class='btn-standard copy-btn' onclick='navigator.clipboard.writeText(\"def\")'>Copy</button></div><br>Reasoning: ...",
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
  ]
}
```

**IMPORTANT**: 
- Your ENTIRE response must be valid JSON (no markdown, no explanations outside JSON)
- Use the exact field names shown above
- Include ALL sections even if empty (use [] or {} for empty sections)
- Be specific and actionable in recommendations
- Focus on performance improvements and best practices"""

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
# AI Provider API Call
# ============================================================================

def call_ai_provider(provider: str, 
                     model: str, 
                     api_key: str, 
                     api_url: str, 
                     endpoint: str, 
                     prompt: str, 
                     payload_data: Dict[str, Any]) -> Dict[str, Any]:
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
        
    Returns:
        API response dict with success status, data/error, and timing
    """
    import json
    
    ic(f"🤖 Calling AI provider: {provider}, model: {model}")
    
    # Get system prompt
    system_prompt = get_ai_system_prompt()
    
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
            
            client = OpenAI(
                api_key=api_key,
                base_url=base_url,
                timeout=60.0,
                max_retries=2
            )
            
            params = {
                "model": model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"{prompt}\n\nQuery Data:\n{json.dumps(payload_data['data'], indent=2)}"}
                ],
                "temperature": 0.5,
                # "max_tokens": 4096 # Optional, let model decide
            }
            
            if provider == 'openai':
                params["response_format"] = {"type": "json_object"}
                
            response = client.chat.completions.create(**params)
            
            elapsed_ms = int((time.time() - start_time) * 1000)
            
            # Convert Pydantic model to dict
            response_data = json.loads(response.model_dump_json())
            
            ic(f"✅ OpenAI SDK Success ({elapsed_ms}ms)")
            
            return {
                'success': True,
                'status_code': 200,
                'data': response_data,
                'elapsed_ms': elapsed_ms,
                'attempts': 1
            }
            
        except Exception as e:
            elapsed_ms = int((time.time() - start_time) * 1000) if 'start_time' in locals() else 0
            ic(f"❌ OpenAI SDK Error: {str(e)}")
            # Don't fall back to HTTP if SDK fails (likely auth or logic error), return error
            return {
                'success': False,
                'error': f"OpenAI SDK Error: {str(e)}",
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
        
        # OpenAI supports json_object response format
        if provider == 'openai':
            ai_request_payload['response_format'] = {'type': 'json_object'}
        
        headers = {
            'Authorization': f'Bearer {api_key}'
        }
        
    elif provider == 'anthropic' or provider == 'claude':
        ai_request_payload = {
            'model': model,
            'max_tokens': 20000,
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
    
    ic(f"📤 API URL: {api_url}")
    ic(f"📤 Endpoint: {endpoint}")
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
