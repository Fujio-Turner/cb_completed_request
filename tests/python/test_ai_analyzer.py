"""
Unit tests for ai_analyzer.py - DataObfuscator and SessionCache

Focused on the obfuscation/cache classes that don't require Couchbase.
Complements test_ai_analyzer_real.py which covers module-level helpers.
"""

import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'app')))

from ai_analyzer import DataObfuscator, SessionCache


# -----------------------------------------------------------------------------
# DataObfuscator
# -----------------------------------------------------------------------------

def test_obfuscator_token_is_six_chars():
    """_generate_token returns 6-character base36 string"""
    obf = DataObfuscator(seed="test-seed")
    token = obf._generate_token("city")
    assert isinstance(token, str)
    assert len(token) == 6
    assert all(c in '0123456789abcdefghijklmnopqrstuvwxyz' for c in token)


def test_obfuscator_is_deterministic():
    """Same input + same seed produces same token"""
    obf1 = DataObfuscator(seed="test-seed")
    obf2 = DataObfuscator(seed="test-seed")
    assert obf1._generate_token("users") == obf2._generate_token("users")


def test_obfuscator_seed_changes_token():
    """Different seeds produce different tokens"""
    obf1 = DataObfuscator(seed="seed-a")
    obf2 = DataObfuscator(seed="seed-b")
    assert obf1._generate_token("users") != obf2._generate_token("users")


def test_obfuscator_backtick_normalization():
    """`name` and name produce the same token"""
    obf = DataObfuscator(seed="test")
    assert obf._generate_token("`city`") == obf._generate_token("city")


def test_obfuscator_caches_token_lookups():
    """Repeated calls return cached token (not recomputed)"""
    obf = DataObfuscator(seed="test")
    first = obf._generate_token("foo")
    assert "foo" in obf._token_cache
    assert obf._generate_token("foo") == first


def test_obfuscator_query_preserves_keywords():
    """SQL keywords like SELECT, FROM, WHERE are NOT obfuscated"""
    obf = DataObfuscator(seed="test")
    result = obf.obfuscate_query("SELECT name FROM users WHERE active = true")
    assert "SELECT" in result
    assert "FROM" in result
    assert "WHERE" in result
    # Identifiers should NOT remain
    assert "users" not in result
    assert "name" not in result


def test_obfuscator_query_handles_empty_string():
    """Empty query returns unchanged"""
    obf = DataObfuscator(seed="test")
    assert obf.obfuscate_query("") == ""
    assert obf.obfuscate_query(None) is None


def test_obfuscator_get_mapping_table_returns_reverse():
    """get_mapping_table returns token -> original mapping"""
    obf = DataObfuscator(seed="test")
    token = obf._generate_token("customer_id")
    mapping = obf.get_mapping_table()
    assert mapping[token] == "customer_id"
    # Returned mapping is a copy (modifying it doesn't affect internal state)
    mapping["fake_token"] = "fake"
    assert "fake_token" not in obf.get_mapping_table()


def test_obfuscator_value_preserves_none():
    """obfuscate_value keeps None as-is"""
    obf = DataObfuscator(seed="test")
    assert obf.obfuscate_value(None) is None


def test_obfuscator_value_obfuscates_strings():
    """obfuscate_value returns a 6-char token for strings"""
    obf = DataObfuscator(seed="test")
    result = obf.obfuscate_value("customerId")
    assert isinstance(result, str)
    assert len(result) == 6
    assert result != "customerId"


# -----------------------------------------------------------------------------
# SessionCache
# -----------------------------------------------------------------------------

def test_session_cache_set_and_get_round_trip():
    """SessionCache stores and returns the exact same data"""
    cache = SessionCache(ttl_minutes=5, cleanup_interval_seconds=999999)
    payload = {"query": "SELECT 1", "rows": [1, 2, 3]}
    cache.set("sid-1", payload)
    assert cache.get("sid-1") == payload


def test_session_cache_get_missing_returns_none():
    """Unknown session id returns None"""
    cache = SessionCache(ttl_minutes=5, cleanup_interval_seconds=999999)
    assert cache.get("does-not-exist") is None


def test_session_cache_delete_removes_session():
    """delete() removes an entry; subsequent get() returns None"""
    cache = SessionCache(ttl_minutes=5, cleanup_interval_seconds=999999)
    cache.set("sid", {"a": 1})
    assert cache.delete("sid") is True
    assert cache.get("sid") is None
    # Deleting again returns False
    assert cache.delete("sid") is False
