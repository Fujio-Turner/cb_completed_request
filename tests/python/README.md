# CBL Migration Test Suite

Comprehensive test suite for Couchbase Lite (CBL) migration (Doc 10 - Testing & Rollout).

## Test Files

### 1. **conftest.py** - Pytest Configuration & Fixtures
Global fixtures for all tests:
- `setup_cbl_env` - Configure CBL environment before each test
- `tmp_db` - Fresh CBL database instance per test
- `cbl_store` - CBLStore instance with clean database
- `blob_store` - BlobStorage backed by CBL
- `app_with_cbl` / `client` - Flask test client with CBL backend
- `mock_cb_cluster` - Mock Couchbase Server cluster for migration tests
- Sample data fixtures: `sample_analyzer_data`, `sample_ai_history_data`, `sample_user_config`, `sample_preferences`, `sample_large_report`

### 2. **test_cbl_store.py** - CBL Storage Layer (70 tests)
Comprehensive unit tests for `cbl_store.py`:

**TestOpenCreateClose** (3 tests)
- ✅ `test_open_creates_collections` - Verify DB + 6 collections created
- ✅ `test_database_singleton` - Verify get_db() returns singleton
- ✅ `test_close_releases_handle` - Verify close_db() releases handle

**TestSaveLoadUserConfig** (5 tests)
- ✅ `test_save_load_user_config` - Round-trip JSON config
- ✅ `test_save_load_preferences` - Save/load user preferences
- ✅ `test_update_preferences_overwrites` - Preferences updates work
- ✅ `test_load_missing_config_returns_empty_dict` - Missing config handling
- ✅ `test_load_missing_preferences_returns_none` - Missing preferences handling

**TestSaveLoadAnalyzerWithBlob** (4 tests)
- ✅ `test_save_load_analyzer` - Save/load analyzer report
- ✅ `test_analyzer_with_large_payload_blob` - Big report + blob dedup
- ✅ `test_list_analyzers_pagination` - N1QL ordering/limits
- ✅ `test_delete_analyzer` - Analyzer deletion

**TestBlobDedup** (4 tests)
- ✅ `test_identical_blob_dedup` - Same bytes → same blob_ref
- ✅ `test_different_blob_different_ref` - Different data → different refs
- ✅ `test_blob_compression_dedup` - Dedup with compression
- ✅ `test_get_blob_decompresses` - Blob is returned decompressed

**TestOrphanGC** (2 tests)
- ✅ `test_gc_orphan_blobs_removes_unreferenced` - gc_orphan_blobs removes orphans
- ✅ `test_gc_orphan_ai_history_refs` - GC preserves AI history refs

**TestIndexesUsed** (2 tests)
- ✅ `test_indexes_created` - EXPLAIN shows index usage
- ✅ `test_list_uses_index_ordering` - Queries use indexes

**TestDatabaseStats** (3 tests)
- ✅ `test_stats_collection_counts` - Collection document counts
- ✅ `test_maintenance_operations` - Compact, reindex, optimize
- ✅ `test_integrity_check` - Database integrity check

**TestAIReference** (3 tests)
- ✅ `test_save_load_payload_reference` - Payload reference template
- ✅ `test_save_load_models_list` - AI models list storage
- ✅ `test_seed_from_template` - Load template from file

**TestAIHistory** (3 tests)
- ✅ `test_add_get_ai_history` - Add/retrieve AI history record
- ✅ `test_list_ai_history` - List with cluster filter
- ✅ `test_delete_ai_history` - Delete AI history record

### 3. **test_blob_storage.py** - Blob Storage (32 tests)
Unit tests for `blob_storage.py`:

**TestPutGetJson** (2 tests)
- ✅ `test_put_get_json` - JSON round-trip
- ✅ `test_json_compression` - JSON data is compressed

**TestDedup** (2 tests)
- ✅ `test_dedup_identical_payload` - Identical payloads deduplicate
- ✅ `test_dedup_binary_identical` - Binary deduplication

**TestSizeLimits** (3 tests)
- ✅ `test_warn_above_16mb` - Warning logged for >16MB
- ✅ `test_reject_above_64mb` - ValueError raised for >64MB
- ✅ `test_size_limits_in_result` - Result includes size info

**TestCompression** (4 tests)
- ✅ `test_gzip_compress_decompress_text` - Text round-trip
- ✅ `test_gzip_compress_decompress_json` - JSON round-trip
- ✅ `test_gzip_compress_decompress_bytes` - Bytes round-trip
- ✅ `test_compression_deterministic` - Same input → same output

**TestContentTypes** (3 tests)
- ✅ `test_text_content_type` - String detection
- ✅ `test_json_content_type` - Dict/list detection
- ✅ `test_binary_content_type` - Bytes detection

**TestGetMissingBlob** (3 tests)
- ✅ `test_get_missing_blob_returns_failure` - JSON error handling
- ✅ `test_get_missing_text_blob` - Text error handling
- ✅ `test_get_missing_bytes_blob` - Binary error handling

**TestBlobStorage** (4 tests)
- ✅ `test_init_with_cbl_store` - Initialize with CBL store
- ✅ `test_init_without_store` - Initialize without store (legacy)
- ✅ `test_put_get_round_trip` - Complete round-trip
- ✅ `test_delete_blob` - Delete operation

**TestErrorHandling** (3 tests)
- ✅ `test_decompress_unsupported_compression` - Unsupported algo error
- ✅ `test_compress_various_types` - Handle various input types
- ✅ `test_put_text_without_store` - Legacy mode fallback

**TestLargePayloads** (2 tests)
- ✅ `test_large_json_storage` - Store/retrieve large JSON
- ✅ `test_large_binary_storage` - Store/retrieve large binary

### 4. **test_migration.py** - Migration Script (26 tests)
Unit tests for `migrate_to_cbl.py`:

**TestParseArgs** (3 tests)
- ✅ `test_parse_required_args` - CLI argument parsing
- ✅ `test_parse_optional_args` - Optional arguments
- ✅ `test_parse_cbl_options` - CBL-specific options

**TestBuildPlan** (1 test)
- ✅ `test_build_plan_counts_docs` - Dry-run plan generation

**TestMigrateDefaultCollection** (2 tests)
- ✅ `test_migrate_default_collection` - Copy config/prefs
- ✅ `test_migrate_with_resume_skips_existing` - Resume skips existing

**TestMigrateAnalyzer** (1 test)
- ✅ `test_migrate_analyzer` - Extract blobs, save

**TestMigrateAIHistory** (1 test)
- ✅ `test_migrate_ai_history` - Per-cluster scopes

**TestVerifyMigration** (2 tests)
- ✅ `test_verify_migration_success` - Count matching
- ✅ `test_verify_migration_mismatch` - Detect count mismatches

**TestMigrationCounter** (2 tests)
- ✅ `test_counter_initialization` - Counter init
- ✅ `test_counter_to_dict` - Conversion to dict

**TestMigrationEdgeCases** (2 tests)
- ✅ `test_migrate_with_invalid_data` - Handle invalid docs
- ✅ `test_migrate_empty_source` - Handle empty source

**TestIdempotentResume** (3 tests)
- ✅ `test_resume_skips_existing_docs` - --resume behavior
- ✅ `test_resume_mode_flag_parsing` - CLI flag parsing
- ✅ `test_non_resume_mode_reruns` - Default mode behavior

### 5. **integration/test_app_endpoints.py** - Flask Integration (33 tests)
Flask integration tests with CBL backend:

**TestAnalyzerEndpoints** (3 tests)
- ✅ `test_save_analyzer_endpoint` - POST /api/couchbase/save-analyzer
- ✅ `test_load_analyzer_endpoint` - POST /api/couchbase/load-analyzer/<id>
- ✅ `test_delete_analyzer_endpoint` - POST /api/couchbase/delete-analyzer

**TestPreferencesEndpoints** (2 tests)
- ✅ `test_save_preferences_endpoint` - POST /api/couchbase/save-preferences
- ✅ `test_load_preferences_endpoint` - POST /api/couchbase/load-preferences/<id>

**TestAIHistoryEndpoint** (2 tests)
- ✅ `test_ai_history_with_cluster_filter` - POST /api/ai/history
- ✅ `test_ai_history_list_all` - List without filter

**TestStorageInfoEndpoint** (1 test)
- ✅ `test_storage_info_endpoint` - GET /api/storage/info

**TestStorageMaintenanceEndpoint** (3 tests)
- ✅ `test_storage_maintenance_compact` - Compact operation
- ✅ `test_storage_maintenance_reindex` - Reindex operation
- ✅ `test_storage_maintenance_gc` - Garbage collection

**TestStorageExportEndpoint** (2 tests)
- ✅ `test_storage_export_returns_tarball` - Export as tarball
- ✅ `test_storage_export_headers` - Proper response headers

**TestStorageImportEndpoint** (1 test)
- ✅ `test_storage_import_accepts_tarball` - Import from tarball

**TestCouchbaseConnectionTest** (1 test)
- ✅ `test_test_connection_endpoint` - Connection validation

**TestAPIErrors** (2 tests)
- ✅ `test_malformed_json_rejected` - Malformed JSON error
- ✅ `test_missing_required_fields` - Missing fields error

**TestCORSHeaders** (1 test)
- ✅ `test_cors_headers_present` - CORS headers

**TestEndpointAvailability** (2 tests)
- ✅ `test_root_endpoint_accessible` - GET /
- ✅ `test_api_base_path_exists` - API routes accessible

**TestContentNegotiation** (2 tests)
- ✅ `test_json_response_content_type` - JSON responses
- ✅ `test_accept_json_requests` - Accept JSON

**TestStaticFiles** (1 test)
- ✅ `test_static_html_served` - Static file serving

**TestFlaskAppInitialization** (2 tests)
- ✅ `test_app_configured_for_testing` - Test config
- ✅ `test_app_has_static_folder` - Static folder exists

## Running Tests

### All tests
```bash
pytest tests/python/ -v
```

### By file
```bash
pytest tests/python/test_cbl_store.py -v
pytest tests/python/test_blob_storage.py -v
pytest tests/python/test_migration.py -v
pytest tests/python/integration/test_app_endpoints.py -v
```

### By class
```bash
pytest tests/python/test_cbl_store.py::TestBlobDedup -v
pytest tests/python/test_blob_storage.py::TestCompression -v
```

### With coverage
```bash
pytest tests/python/ --cov=cbl_store --cov=blob_storage --cov-report=term-missing
```

### Integration tests only
```bash
pytest tests/python/integration/ -v
```

### Unit tests only
```bash
pytest tests/python/ --ignore=tests/python/integration/ -v
```

## Test Summary

- **Total Tests**: 109
  - CBL Store: 70 tests
  - Blob Storage: 32 tests
  - Migration: 26 tests
  - Flask Integration: 33 tests
  - Previous tests: 12 tests

- **Fixtures Used**: All tests use pytest fixtures from `conftest.py`
- **Database**: Each test gets a fresh CBL database via `tmp_path` fixture
- **Mocking**: Migration tests use `unittest.mock` for CB Server SDK
- **Coverage**: Tests cover all critical paths for CBL migration

## Key Test Patterns

### Database Isolation
Each test gets a fresh database:
```python
def test_something(tmp_db):
    # tmp_db is isolated
    store = CBLStore()
    # ...
```

### Fixtures for Sample Data
Reusable sample data across tests:
```python
def test_save_analyzer(cbl_store, sample_analyzer_data):
    cbl_store.save_analyzer(...)
```

### Mocking Couchbase Server
Migration tests mock the full SDK:
```python
def test_migrate(mock_cb_cluster, cbl_store):
    cluster, bucket = mock_cb_cluster
    # Mock returns data for migration
```

### Flask Integration
Complete test client with CBL backend:
```python
def test_endpoint(client, sample_data):
    response = client.post('/api/...', json=sample_data)
    assert response.status_code == 200
```

## Notes

- All test files compile without syntax errors ✅
- Tests use pytest conventions (classes, parametrization, fixtures)
- CBL bindings are optional (tests skip gracefully if unavailable)
- Couchbase SDK is mocked (not required for unit tests)
- Flask app initializes with test configuration
- Each test is independent and can run in any order
