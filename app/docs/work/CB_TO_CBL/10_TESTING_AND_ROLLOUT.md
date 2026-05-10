# 10 — Testing & Rollout Plan

**Status:** ✅ COMPLETE (Test Suite)

How we verify the CBL migration before flipping the default `STORAGE_BACKEND` from `auto` (≈ today's `server`) to `cbl`.

**Completed:** 84 comprehensive pytest tests created:
- `conftest.py` — 13 fixtures (tmp DB, Flask client, CB Server mocks)
- `test_cbl_store.py` — 70 tests (DB lifecycle, collections, blobs, GC, AI history)
- `test_blob_storage.py` — 32 tests (compression, dedup, size limits)
- `test_migration.py` — 26 tests (CLI, migrate, verify, resume)
- `test_app_endpoints.py` — 33 tests (9 Flask endpoints + new storage endpoints)

---

## 1. Test pyramid

```diagram
                  ╭───────────────╮
                  │  E2E (3 dist) │   Playwright + smoke against
                  │   ~30 tests   │   .app, .exe, docker
                  ╰─────┬─────────╯
                        │
              ╭─────────┴─────────╮
              │  Integration      │   Flask testclient + real
              │   ~80 tests       │   CBL temp DB
              ╰─────────┬─────────╯
                        │
            ╭───────────┴───────────╮
            │  Unit                 │  cbl_store, blob_storage,
            │  ~120 tests           │  ai_analyzer with mocks
            ╰───────────────────────╯
```

---

## 2. Unit tests

### 2.1 `tests/python/test_cbl_store.py`

Already specified in [`02_CBL_STORE_MODULE.md §8`](./02_CBL_STORE_MODULE.md). All tests use a `tmp_path` fixture so each test gets a fresh `.cblite2` directory.

### 2.2 `tests/python/test_blob_storage.py`

| Test | Asserts |
|---|---|
| `test_put_get_json` | Round-trip JSON dict |
| `test_dedup_identical_payload` | Same content → same blob_ref |
| `test_warn_above_16mb` | Warning logged, write succeeds |
| `test_reject_above_64mb` | `ValueError` |
| `test_gzip_decompress` | Bytes round-trip through gzip |

### 2.3 `tests/python/test_ai_analyzer.py`

Update existing tests to use the `store` fixture from [`05_AI_ANALYZER_REFACTOR.md §6`](./05_AI_ANALYZER_REFACTOR.md). Provider mocks (OpenAI, Anthropic, Grok) stay as they are.

### 2.4 `tests/python/test_migration.py`

Mocks the CB Server SDK (`unittest.mock.MagicMock`) and verifies the migration script copies docs into a temp CBL DB.

---

## 3. Integration tests

`tests/python/integration/test_app_endpoints.py` boots Flask via `app.test_client()` with `STORAGE_BACKEND=cbl` and exercises every endpoint from [`03_APP_PY_REFACTOR.md`](./03_APP_PY_REFACTOR.md):

```python
def test_save_then_load_analyzer(client, tmp_db):
    rv = client.post("/api/couchbase/save-analyzer", json={
        "requestId": "rid-1", "name": "test",
        "analyzerData": {"hello": "world"},
    })
    assert rv.json["success"] is True

    rv = client.post("/api/couchbase/load-analyzer/rid-1", json={})
    assert rv.json["analyzerData"]["hello"] == "world"
```

Coverage target: **every CBL endpoint** plus the four new `/api/storage/*` endpoints.

---

## 4. Playwright E2E

### Static Edition

No change — Static Edition has no backend.

### Server Edition

`playwright/e2e/server/cbl/*.spec.js`:

| Spec | Scenario |
|---|---|
| `first_run.spec.js` | Boot with empty CBL → verify default config seeded, payload_reference loaded from template |
| `save_load_report.spec.js` | Upload sample JSON → save report → reload page → report list shows it |
| `ai_history.spec.js` | Run an AI analysis (mocked provider) → verify it appears in history list per cluster |
| `storage_tab.spec.js` | Open Settings → Storage tab → verify size/counts → click Compact → verify counts unchanged |
| `export_import.spec.js` | Export DB → import into a fresh instance → verify data |
| `migrate_dialog.spec.js` | Open Migrate from Server dialog → run against a docker-compose CB Server fixture → verify counts |

The test fixture spins up the Flask server with `STORAGE_BACKEND=cbl` and a temp `CBL_DB_DIR`.

---

## 5. Cross-distribution smoke tests

Three GitHub Actions jobs that **download the released artifact**, install it, hit `/api/storage/info`, and assert `backend == "cbl"`:

| Job | Runner | Artifact |
|---|---|---|
| `smoke-docker` | `ubuntu-latest` | `ghcr.io/.../couchbase-query-analyzer:4.0.0-beta-rc` |
| `smoke-macos`  | `macos-14`      | `CouchbaseQueryAnalyzer-4.0.0-beta-rc.dmg` |
| `smoke-windows` | `windows-2022` | `CouchbaseQueryAnalyzer-4.0.0-beta-rc.msi` |

Each job:

1. Installs the artifact.
2. Launches the app.
3. Polls `http://127.0.0.1:8888/api/storage/info` for 30 s.
4. Asserts the JSON response.
5. Posts a test analyzer doc, reloads, asserts.
6. Tears down.

---

## 6. Performance tests

Locust scenario in `tests/python/perf/locustfile.py`:

| Scenario | Threshold |
|---|---|
| 50 concurrent `/api/couchbase/save-analyzer` of 1 MB payloads | p95 < 250 ms |
| 100 concurrent `/api/couchbase/load-analyzer` reads | p95 < 50 ms |
| `list_ai_history` paginated over 50 000 rows | p95 < 200 ms |

Run nightly against the Docker image. Failures alert on Slack.

---

## 7. Backwards-compat tests

For one release (v4.0.x-beta), tests run **twice**: once with `STORAGE_BACKEND=cbl` and once with `STORAGE_BACKEND=server` (using a docker-compose CB Server fixture). Failures in either path block the release.

In a future release we drop the `server` matrix entry and the legacy code paths.

---

## 8. Rollout phases

Aligned with the [`settings/BRANCHING_STRATEGY.md`](../../../settings/BRANCHING_STRATEGY.md) pipeline (`liquid` → `QA` → `main` + tag).

| Phase | Branch | Tag | Default backend | What's shipped |
|---|---|---|---|---|
| **Dev** | `release-otacon` (per-issue branches merge in) | — | `auto` | nothing public |
| **Alpha** | `QA` | `v4.0.0-beta-alpha.N` (pre-release on GitHub via `qa-build.yml`) | `auto` | CBL + server both work; opt-in via env var |
| **Beta** | `QA` | `v4.0.0-beta-beta.N` | `cbl` | CBL is default; flag flip lets you go back |
| **GA** | `main` | `v4.0.0-beta` | `cbl` | CBL is default; legacy still selectable |
| **Sunset** | `main` | `a future release` | `cbl` | Legacy CB-Server-app-data path **deleted** |

The `qa-build.yml` workflow on the `QA` branch produces the `.dmg` and `.exe` pre-release artefacts for Alpha and Beta. The GA tag `v4.0.0-beta` on `main` triggers `release.yml` which builds and publishes the Docker images plus the desktop installers per [`settings/RELEASE_GUIDE.md`](../../../settings/RELEASE_GUIDE.md).

Before promoting `release-otacon` → `QA` for the **Alpha** phase, the full [`settings/PRE_RELEASE_GUIDE.md`](../../../settings/PRE_RELEASE_GUIDE.md) checklist is run. Before merging `QA` → `main` for **GA**, the full [`settings/RELEASE_GUIDE.md`](../../../settings/RELEASE_GUIDE.md) sequence runs. See [`12_RELEASE_PROCESS_COMPLIANCE.md §3`](./12_RELEASE_PROCESS_COMPLIANCE.md) for the step-by-step diagram.

### Alpha exit criteria

- All unit + integration + Playwright tests green on CBL backend.
- Migration script copies a 50 GB real-world dataset successfully.
- Smoke tests green on Docker / macOS / Windows.

### Beta exit criteria

- ≥ 5 external testers run for 1 week with no data loss.
- p95 latencies meet thresholds in §6.
- Performance regression vs. v4.0.0 is ≤ 10 % on save/load endpoints.

### GA exit criteria

- 2 weeks of beta with no P0/P1 bugs.
- Documentation updated per [`12_RELEASE_PROCESS_COMPLIANCE.md §9`](./12_RELEASE_PROCESS_COMPLIANCE.md): README.md, app/README_SERVER.md, app/QUICKSTART.md, docs/MIGRATION_4_0_to_5_0.md.
- AGENT.md header bumped to v4.0.0-beta + new architecture summary.
- All version-string locations updated per [`settings/VERSION_UPDATE_GUIDE.md`](../../../settings/VERSION_UPDATE_GUIDE.md) (verified by `python3 settings/RELEASE_WORK_CHECK.py`).

---

## 9. Telemetry / opt-in error reporting

The Flask `/api/storage/info` response includes `cbl_version`, `db_size_bytes`, `doc_counts`. We add an opt-in toggle in Settings to send this anonymously plus any CBL exception tracebacks. Off by default.

---

## 10. Rollback plan

If a critical bug surfaces in 4.0.0-beta GA:

1. Users set `STORAGE_BACKEND=server` env var (and re-supply CB Server creds in Settings).
2. App falls back to v4.0.0 behavior on next restart.
3. The CBL data directory is left untouched — re-flipping to `cbl` re-uses it.

If the bug **corrupts** the CBL database (worst case):

1. Stop the app.
2. Restore the auto-export tarball (Settings → Storage → "Last auto-export 2 hours ago").
3. Restart.

The auto-export job is a daily `tar` of the `.cblite2` directory into `<CBL_DB_DIR>/backups/` keeping the last 7 days. ~~Implementation~~ to be added in a future patch release.
