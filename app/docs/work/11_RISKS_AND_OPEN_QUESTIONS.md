# 11 — Risks & Open Questions

Things to decide or watch before / during the v5.0.0 cutover.

---

## 1. Risks

### 1.1 Couchbase Lite Python bindings are experimental

- The official `couchbase-lite-python` repo ([`couchbaselabs/couchbase-lite-python`](https://github.com/couchbaselabs/couchbase-lite-python)) is **labs-grade** — no PyPI release, no SLA, no LTS.
- We pin to a specific commit SHA and vendor it. Upstream breakage doesn't break our build.
- Mitigation: The CBL C ABI (`libcblite`) is stable. Worst case, we maintain our own CFFI wrapper.

### 1.2 Single-writer concurrency

- CBL only allows one process to open a database at a time (other handles get `kCBLErrorBusy`).
- Docker: enforced via `gunicorn -w 1`.
- Mac/Windows: enforced because the desktop app spawns one Flask process per launch.
- **Risk:** if a user double-launches the `.app` / `.exe`, the second one will fail to open the DB.
- Mitigation: at startup, try to bind `127.0.0.1:5000`; if already bound, just open the browser to the existing instance instead of starting a second Flask. (Standard "single-instance" pattern; the macOS/Windows tray code already half-does this.)

### 1.3 No replication / no team sharing

- v4.0.0 with CB Server lets a team share saved analyzer reports.
- v5.0.0 with embedded CBL is single-user.
- **Risk:** users who relied on shared reports lose that.
- Mitigation:
  - Document this as a deliberate trade-off.
  - Provide manual export/import (per [`03_APP_PY_REFACTOR.md §3.6/3.7`](./03_APP_PY_REFACTOR.md)).
  - **Future:** add CBL replication to a Sync Gateway as an optional EE feature in v5.2.0.

### 1.4 Database size growth

- N1QL on CBL is fast for 100 K docs, fine for 1 M, slow at 10 M.
- A heavy-use AI history might cross 100 K rows in a year.
- Mitigation:
  - TTL on `ai_history` (env var `CBL_AI_HISTORY_TTL_DAYS`).
  - Compact + reindex maintenance endpoint.
  - Surface `db_size_bytes` in the Storage tab so users notice.

### 1.5 Loss of XATTRs

- `blob_storage.py` v4.0.0 stores metadata in XATTRs (lets you decorate a doc without changing its body).
- CBL has no XATTRs. We collapse meta + body into one doc.
- **Risk:** If any third-party tool reads our docs via XATTRs (no known case, but possible), it breaks.
- Mitigation: documented in [`04_BLOB_STORAGE_REFACTOR.md`](./04_BLOB_STORAGE_REFACTOR.md). No external consumers exist.

### 1.6 Image size growth (Docker)

- `libcblite.so` adds ~50 MB; CFFI build deps add ~80 MB transient.
- Final image ~280 MB vs ~140 MB v4.0.0.
- Mitigation: multi-stage Dockerfile that drops `gcc`, `git`, header files in the final image. Estimated final ≈180 MB.

### 1.7 Code-signing cost / friction

- macOS notarization requires an Apple Developer account ($99/yr).
- Windows EV cert is $300–500/yr.
- Without these, first-run UX is poor (Gatekeeper / SmartScreen warnings).
- Mitigation: the org probably already has these. If not, ship unsigned builds with clear "right-click → Open" / "More info → Run anyway" instructions for the early releases.

### 1.8 Windows DLL not on a public CDN

- `cblite.dll` is only on the Couchbase downloads portal (cookie + license accept).
- Our CI can't `curl` it directly.
- Mitigation: mirror the zip into a private GitHub releases page; CI fetches via PAT. Document the mirror's SHA256 + license attribution in `app/vendor/windows/SOURCES.md`.

### 1.9 No CBL ARM64 Windows targeting in v5.0.0

- We're shipping x86_64 only.
- ARM64 Windows users (Surface Pro X, Snapdragon laptops) would have to use the x86_64 build under emulation.
- Acceptable for now. Tracked for v5.1.0.

### 1.10 Migration script edge cases

- Per-cluster scopes with non-DNS-safe names → CBL collection name length / charset rules. CBL allows up to 251 chars and `[A-Za-z0-9_%]`.
- Mitigation: migration normalises scope names and stores the original in `cluster_name` field.

---

## 2. Open questions

| # | Question | Owner | Decision needed by |
|---|---|---|---|
| Q1 | Do we keep the `couchbase` Python SDK at all, or split prod-cluster query path into a separate microservice in v5.1.0? | Architect | Pre-Beta |
| Q2 | Encryption-at-rest for CBL? CBL CE supports `encryption_key` on `DatabaseConfiguration` but the key needs to live somewhere. | Security | Pre-GA |
| Q3 | Auto-export schedule (daily vs hourly vs off)? Affects disk use. | UX | Pre-GA |
| Q4 | Bundle a "shared sync to Capella" option in v5.2.0? Brings back team sharing. | Product | Post-GA |
| Q5 | Should we use CBL native Blob API for >16 MB payloads even in v5.0.0, or wait? | Backend | Pre-Beta |
| Q6 | Default CBL DB location on macOS — `~/Library/Application Support` (current plan) vs `~/Documents`? | UX | Pre-Beta |
| Q7 | Does the GitLab `toon-python` runtime install still make sense if we're now shipping a fat .app? Pre-bundle it? | Backend | Pre-Beta |
| Q8 | `STORAGE_BACKEND=auto` semantics — error vs silent fallback if CBL bindings missing? | Backend | Pre-Alpha |
| Q9 | Can we drop `setup_couchbase.sql` from the shipped artifact entirely once on CBL, or move it to docs? | Docs | Pre-GA |
| Q10 | Should the migration script run **automatically** on first 5.0.0 launch if it detects v4.0.0 config, or always require explicit invocation? | UX | Pre-Beta |

---

## 3. Decisions log

| Date | Decision | Rationale |
|---|---|---|
| 2026-05-08 | Target version is **v5.0.0** (not v4.1.0) | Triggers MAJOR per [`settings/VERSION_CALCULATION_GUIDE.md`](../../../settings/VERSION_CALCULATION_GUIDE.md): architecture overhaul, changed data formats, removed feature, new tech stack. Documented in [`12_RELEASE_PROCESS_COMPLIANCE.md §1`](./12_RELEASE_PROCESS_COMPLIANCE.md). |
| 2026-05-08 | Release branch name is `release-otacon` | Otacon = MGS engineering character, fits a backend re-architecture. Per [`settings/WORKFLOW_GUIDE.md`](../../../settings/WORKFLOW_GUIDE.md). |
| 2026-05-08 | Server Edition v5.0.0 ships English-only; localization keys scaffolded | Avoids blocking GA on translation work. Per [`12_RELEASE_PROCESS_COMPLIANCE.md §7`](./12_RELEASE_PROCESS_COMPLIANCE.md). |
| _TBD_ | — | — |

---

## 4. Glossary

- **CBL** — Couchbase Lite (Community Edition unless noted)
- **CBL-C** — Couchbase Lite C library (`libcblite.so` / `.dylib` / `.dll`)
- **CFFI** — C Foreign Function Interface; Python's standard FFI library
- **`.cblite2/`** — CBL's on-disk database directory (contains a SQLite file + WAL)
- **XATTR** — Extended Attribute on a Couchbase Server document; sub-document metadata
- **Server Edition** — The Flask-based v4.x of the analyzer (this codebase)
- **Static Edition** — The single-page v3.29.x analyzer (`/en/index.html`); not affected by this plan
