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
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from icecream import ic

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
            query_groups = self._build_query_groups(raw_data)
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
            payload['data']['query_groups'] = self._build_query_groups(cached_data)
        
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
    
    def _build_query_groups(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract query groups (normalized patterns) from analysisData"""
        analysis = data.get('analysisData', [])
        
        if not analysis:
            return {'note': 'No query group data available'}
        
        # Sample first 50 patterns to keep payload manageable
        sample_patterns = analysis[:50] if len(analysis) > 50 else analysis
        
        return {
            'total_patterns': len(analysis),
            'sample_size': len(sample_patterns),
            'patterns': sample_patterns,
            'note': f'Showing first {len(sample_patterns)} of {len(analysis)} normalized query patterns'
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
        
        return {
            'mermaid_diagram': flow_data.get('mermaid_diagram', ''),
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
    """
    return """You are a Couchbase N1QL query performance expert. Analyze the provided query data and provide actionable recommendations.

**RESPONSE FORMAT REQUIREMENTS:**
You MUST return your analysis as a valid JSON object with this exact structure:

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
      "severity": "<critical|high|medium|low>",
      "category": "<index|query|configuration>",
      "title": "Brief issue title",
      "description": "Detailed explanation",
      "affected_queries": <number>,
      "recommendation": "Specific action to take",
      "expected_impact": "Expected performance improvement"
    }
  ],
  "recommendations": [
    {
      "priority": "<high|medium|low>",
      "category": "<index|query|configuration>",
      "recommendation": "Specific recommendation",
      "rationale": "Why this recommendation matters",
      "implementation_steps": ["Step 1", "Step 2", "..."],
      "estimated_impact": "Expected benefit"
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
