"""
Couchbase Query Analyzer AI Module Package
"""
__version__ = "1.0.0"

# Re-export key functions for convenience
from .ai_analyzer import (
    load_payload_reference,
    load_ai_models_list,
    get_ai_system_prompt,
    cache_analyzer_data,
    build_ai_payload,
    get_cache_stats
)